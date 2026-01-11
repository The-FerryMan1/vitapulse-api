import { Hono } from "hono";
import { db } from "../../../db";
import { bpPulseRecords } from "../../../db/schema";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { calculateZScores } from "../../../utils/zScore";
import { calculateDateRange, type DateFilter } from "../../../utils/dateFilter";
import { handleError } from "../../../utils/errorHandler";
import { ERROR_MESSAGES } from "../../../utils/constants";

const app = new Hono();

app.get("/", async (c) => {
  try {
    const allReadings = await db.select().from(bpPulseRecords);
    if (allReadings.length === 0) {
      return c.json({ message: ERROR_MESSAGES.NOT_FOUND }, 404);
    }

    return c.json(allReadings, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode);
  }
});

app.get("/:id", async (c) => {
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

    return c.json(results, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ errorMessage: message }, statusCode);
  }
});

app.get("/z-scores/:id", async (c) => {
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
    return c.json({ errorMessage: message }, statusCode);
  }
});

app.get('/abnormalities/count', async (c) => {
    try {
        const res = await db.select({ bpStatus: bpPulseRecords.bpStatus, timestamp: bpPulseRecords.timestamp }).from(bpPulseRecords).where(
            and(
                or(
                    eq(bpPulseRecords.bpStatus, 'Low BP (Hypotension)'),
                    eq(bpPulseRecords.bpStatus, 'Hypertensive Crisis'),
                    eq(bpPulseRecords.bpStatus, 'Hypertension Stage 2'),
                    eq(bpPulseRecords.bpStatus, 'Hypertension Stage 1'),
                    eq(bpPulseRecords.bpStatus, 'Elevated'),
                )
            )
        );

    return c.json(res, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ errorMessage: message }, statusCode);
  }
});



export { app as readingsRoute };