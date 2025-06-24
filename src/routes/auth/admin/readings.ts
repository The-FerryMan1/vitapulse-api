import { Hono } from "hono";
import { db } from "../../../db";
import { bpPulseRecords, users } from "../../../db/schema";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { calculateZScores } from "../../../utils/zScore";
const app = new Hono();

app.get('/', async (c) => {
    try {
        const allReadings = await db.select().from(bpPulseRecords);
        if (allReadings.length < 0) return c.json({ message: allReadings }, 404);

        return c.json(allReadings, 200)
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'internal service error'
        }, 500)
    }
})

app.get('/:id', async (c) => {
    const { id } = await c.req.param();
    const filter = (await c.req.query('filter')) || 'daily'; // default to daily
    const fromQuery = await c.req.query('from');
    const toQuery = await c.req.query('to');
    const now = new Date();
    console.log(filter)

    try {
        let startTime: Date;
        let endTime: Date = now;

        switch (filter) {
            case 'hourly':
                startTime = new Date(now);
                startTime.setMinutes(0, 0, 0);
                break;

            case 'daily':
                startTime = new Date(now);
                startTime.setHours(0, 0, 0, 0);
                break;

            case 'weekly':
                startTime = new Date(now);
                startTime.setDate(now.getDate() - now.getDay());
                startTime.setHours(0, 0, 0, 0);
                break;

            case 'monthly':
                startTime = new Date(now.getFullYear(), now.getMonth(), 1);
                break;

            case 'custom':
                if (!fromQuery || !toQuery) {
                    return c.json({ errorMessage: 'Custom filter requires "from" and "to" query params' }, 400);
                }

                startTime = new Date(fromQuery);
                endTime = new Date(toQuery);

                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    return c.json({ errorMessage: 'Invalid "from" or "to" date format' }, 400);
                }

                break;

            default:
                return c.json({ errorMessage: 'Invalid filter option' }, 400);
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
                    gte(bpPulseRecords.timestamp, startTime.toISOString()),
                    lte(bpPulseRecords.timestamp, endTime.toISOString())
                )
            )
            .orderBy(bpPulseRecords.timestamp)
            ;

        return c.json(results, 200);
    } catch (error) {
        console.error('[GET /] Error:', error);
        return c.json({ errorMessage: 'Internal server error' }, 500);
    }
});

app.get('/z-scores/:id', async (c) => {
    const { id } = await c.req.param();
    const filter = (await c.req.query('filter')) || 'daily'; // default to daily
    const fromQuery = await c.req.query('from');
    const toQuery = await c.req.query('to');
    const now = new Date();
    console.log(filter)

    try {
        let startTime: Date;
        let endTime: Date = now;

        switch (filter) {
            case 'hourly':
                startTime = new Date(now);
                startTime.setMinutes(0, 0, 0);
                break;

            case 'daily':
                startTime = new Date(now);
                startTime.setHours(0, 0, 0, 0);
                break;

            case 'weekly':
                startTime = new Date(now);
                startTime.setDate(now.getDate() - now.getDay());
                startTime.setHours(0, 0, 0, 0);
                break;

            case 'monthly':
                startTime = new Date(now.getFullYear(), now.getMonth(), 1);
                break;

            case 'custom':
                if (!fromQuery || !toQuery) {
                    return c.json({ errorMessage: 'Custom filter requires "from" and "to" query params' }, 400);
                }

                startTime = new Date(fromQuery);
                endTime = new Date(toQuery);

                if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                    return c.json({ errorMessage: 'Invalid "from" or "to" date format' }, 400);
                }

                break;

            default:
                return c.json({ errorMessage: 'Invalid filter option' }, 400);
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
                    gte(bpPulseRecords.timestamp, startTime.toISOString()),
                    lte(bpPulseRecords.timestamp, endTime.toISOString())
                )
            )
            .orderBy(bpPulseRecords.timestamp)
            ;

        const resultWithzScore = calculateZScores(results)


        return c.json(resultWithzScore, 200);
    } catch (error) {
        console.error('[GET /] Error:', error);
        return c.json({ errorMessage: 'Internal server error' }, 500);
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

        return c.json(res, 200)
    } catch (error) {
        console.error('[GET /] Error:', error);
        return c.json({ errorMessage: 'Internal server error' }, 500);
    }
})



export { app as readingsRoute };