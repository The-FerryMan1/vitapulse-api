import { Hono } from "hono";
import { db } from "../../db";
import { alertHistory, bpPulseRecords } from "../../db/schema";
import { getBpAndPulseByAge } from "../../utils/bpByAge";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { calculateZScores } from "../../utils/zScore";
import { sendAlertEmail } from "../../utils/emailConf";
import { calculateDateRange, type DateFilter } from "../../utils/dateFilter";
import {
  ABNORMAL_BP_STATUSES,
  ABNORMAL_PULSE_STATUSES,
  ERROR_MESSAGES,
} from "../../utils/constants";
import { handleError } from "../../utils/errorHandler";
import { ContentfulStatusCode } from "hono/utils/http-status";
const app = new Hono();

app.post("/", async (c) => {
  // Get id from authenticated user
  const { id, age, email } = await c.get("jwtPayload");
  
  // Destructure data from json
  const { systolic, diastolic, pulse, timestamp } = await c.req.json();
  const getStatus = getBpAndPulseByAge(systolic, diastolic, pulse, age);

  if (!getStatus) {
    return c.json({ message: ERROR_MESSAGES.UNEXPECTED_ERROR }, 500);
  }
  const { bpStatus, pulseStatus, clinicalBpLabel } = getStatus;

  try {
    // Check for duplicate timestamp
    const isBpThesame = await db
      .select({ timestamp: bpPulseRecords.timestamp })
      .from(bpPulseRecords)
      .where(eq(bpPulseRecords.timestamp, timestamp));
    if (isBpThesame[0]) {
      return c.json({ message: "Same data" }, 200);
    }

    const isAbnormal =
      ABNORMAL_BP_STATUSES.includes(bpStatus) ||
      ABNORMAL_PULSE_STATUSES.includes(pulseStatus);

    if (isAbnormal) {
      const isAlertSent = await sendAlertEmail(
        email,
        `Blood Pressure: ${clinicalBpLabel}. Consider going to the nearest clinic.`
      );

      if (isAlertSent) {
        await db.insert(alertHistory).values({
          user_id: id,
          message: `Bp: ${clinicalBpLabel} Pulse: ${pulseStatus}`,
          timestamp: new Date(Date.now()).toISOString(),
        });
      }
    }

    await db.insert(bpPulseRecords).values({
      user_id: id,
      diastolic,
      systolic,
      bpStatus,
      clinicalBpLabel,
      pulseStatus,
      pulse,
      timestamp: String(timestamp),
    });

    // Check for z-score anomalies after insertion
    const recentReadings = await db
      .select({
        id: bpPulseRecords.id,
        systolic: bpPulseRecords.systolic,
        diastolic: bpPulseRecords.diastolic,
        pulse: bpPulseRecords.pulse,
        timestamp: bpPulseRecords.timestamp,
      })
      .from(bpPulseRecords)
      .where(eq(bpPulseRecords.user_id, id))
      .orderBy(desc(bpPulseRecords.timestamp))
      .limit(50); // Last 50 readings for z-score calculation

    if (recentReadings.length >= 10) { // Need minimum data for meaningful z-score
      const zScoredData = calculateZScores(recentReadings);
      const latestZScore = zScoredData[0]; // Most recent

      const isZScoreAnomaly =
        Math.abs(latestZScore.systolicZ) > 3 ||
        Math.abs(latestZScore.diastolicZ) > 3 ||
        Math.abs(latestZScore.pulseZ) > 3;

      if (isZScoreAnomaly) {
        const isAlertSent = await sendAlertEmail(
          email,
          `Anomaly detected in your vitals. Z-score indicates significant deviation from your normal range. Please monitor closely.`
        );
        if (isAlertSent) {
          await db.insert(alertHistory).values({
            user_id: id,
            message: `Anomaly detected: High z-score in vitals (Systolic: ${latestZScore.systolicZ}, Diastolic: ${latestZScore.diastolicZ}, Pulse: ${latestZScore.pulseZ})`,
            timestamp: new Date(Date.now()).toISOString(),
          });
        }
      }
    }

    return c.json({ message: "Blood pressure saved" }, 201);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode as ContentfulStatusCode);
  }
});

app.get("/", async (c) => {
  const { id } = await c.get("jwtPayload");
  const filter = ((await c.req.query("filter")) || "all") as DateFilter;
  const fromQuery = await c.req.query("from");
  const toQuery = await c.req.query("to");

  try {
    const dateRange = calculateDateRange(filter, fromQuery, toQuery);
    const conditions = [eq(bpPulseRecords.user_id, id)];

    if (dateRange?.startTime && dateRange?.endTime) {
      conditions.push(
        gte(bpPulseRecords.timestamp, dateRange.startTime.toISOString()),
        lte(bpPulseRecords.timestamp, dateRange.endTime.toISOString())
      );
    }

    const results = await db
      .select({
        id: bpPulseRecords.id,
        systolic: bpPulseRecords.systolic,
        diastolic: bpPulseRecords.diastolic,
        clinicalBpLabel: bpPulseRecords.clinicalBpLabel,
        bpStatus: bpPulseRecords.bpStatus,
        pulse: bpPulseRecords.pulse,
        pulseStatus: bpPulseRecords.pulseStatus,
        timestamp: bpPulseRecords.timestamp,
      })
      .from(bpPulseRecords)
      .where(and(...conditions))
      .orderBy(desc(bpPulseRecords.timestamp));

    const resultWithzScore = calculateZScores(results);

    return c.json(resultWithzScore, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ errorMessage: message }, statusCode as ContentfulStatusCode);
  }
});

app.get("/summary/:id", async (c) => {
  const { id } = await c.req.param();
  const filter = ((await c.req.query("filter")) || "daily") as DateFilter;
  const fromQuery = await c.req.query("from");
  const toQuery = await c.req.query("to");

  try {
    const dateRange = calculateDateRange(filter, fromQuery, toQuery);
    
    if (!dateRange?.startTime || !dateRange?.endTime) {
      return c.json({ errorMessage: "Invalid date range" }, 400);
    }

    const results = await db
      .select({
        id: bpPulseRecords.id,
        systolic: bpPulseRecords.systolic,
        diastolic: bpPulseRecords.diastolic,
        clinicalBpLabel: bpPulseRecords.clinicalBpLabel,
        bpStatus: bpPulseRecords.bpStatus,
        pulse: bpPulseRecords.pulse,
        pulseStatus: bpPulseRecords.pulseStatus,
        timestamp: bpPulseRecords.timestamp,
      })
      .from(bpPulseRecords)
      .where(
        and(
          eq(bpPulseRecords.user_id, Number(id)),
          gte(bpPulseRecords.timestamp, dateRange.startTime.toISOString()),
          lte(bpPulseRecords.timestamp, dateRange.endTime.toISOString())
        )
      )
      .orderBy(bpPulseRecords.timestamp);

    const resultWithzScore = calculateZScores(results);

    return c.json(resultWithzScore, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ errorMessage: message }, statusCode as ContentfulStatusCode);
  }
});

app.get("/all/:id", async (c) => {
  const { id } = await c.req.param();

  try {
    const results = await db
      .select({
        id: bpPulseRecords.id,
        systolic: bpPulseRecords.systolic,
        diastolic: bpPulseRecords.diastolic,
        clinicalBpLabel: bpPulseRecords.clinicalBpLabel,
        bpStatus: bpPulseRecords.bpStatus,
        pulse: bpPulseRecords.pulse,
        pulseStatus: bpPulseRecords.pulseStatus,
        timestamp: bpPulseRecords.timestamp,
      })
      .from(bpPulseRecords)
      .where(eq(bpPulseRecords.user_id, Number(id)))
      .orderBy(bpPulseRecords.timestamp);

    const resultWithzScore = calculateZScores(results);

    return c.json(resultWithzScore, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ errorMessage: message }, statusCode as ContentfulStatusCode);
  }
});

app.post("/delete", async (c) => {
  const { id: userID } = await c.get("jwtPayload");

  const payload = (await c.req.json()) as { id: number }[];
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    return c.json({ message: "No payload provided" }, 400);
  }

  try {
    // Use Promise.all instead of forEach for proper async handling
    await Promise.all(
      payload.map((ele) =>
        db
          .delete(bpPulseRecords)
          .where(
            and(
              eq(bpPulseRecords.id, ele.id),
              eq(bpPulseRecords.user_id, Number(userID))
            )
          )
      )
    );
    return c.json({ message: "Records deleted successfully" }, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode as ContentfulStatusCode);
  }
});

export { app as bgRoute };
