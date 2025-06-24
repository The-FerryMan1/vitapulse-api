import { Hono } from "hono";
import { db } from "../../db";
import { alertHistory, bpPulseRecords } from "../../db/schema";
import { getBpAndPulseByAge } from "../../utils/bpByAge";
import { eq, and, gte, lte, asc, desc } from "drizzle-orm";
import { calculateZScores } from "../../utils/zScore";
import { sendAlertEmail } from "../../utils/emailConf";
const app = new Hono();

app.post('/', async (c) => {
    //get id from authenticated user
    const { id, age, email } = await c.get('jwtPayload');
    console.log(email)
    //destucting data from json
    const { systolic, diastolic, pulse, timestamp } = await c.req.json();
    const getStatus = getBpAndPulseByAge(systolic, diastolic, pulse, age);

    if (!getStatus) return c.json({ message: 'unexpected error' }, 500)
    const { bpStatus, pulseStatus, clinicalBpLabel } = getStatus;

    try {
        const isBpThesame = await db.select({ timestamp: bpPulseRecords.timestamp }).from(bpPulseRecords).where(and(eq(bpPulseRecords.user_id, id), eq(bpPulseRecords.timestamp, timestamp)));
        if (isBpThesame[0]) return c.json({ message: 'Same data' })


        const isAbnormal =
            ['Hypertensive Crisis', 'Hypertension Stage 2', 'Hypertension Stage 1', 'Elevated', 'Low', 'Low BP (Hypotension)'].includes(bpStatus) ||
            ['High', 'Low'].includes(pulseStatus);

        if (isAbnormal) {
           const isAlertSent =  await sendAlertEmail(email, `Blood Pressure: ${clinicalBpLabel}. Consider going to the nearest clinic.`);
            

            if (isAlertSent){
                await db.insert(alertHistory).values({
                    user_id: id,
                    message: `Bp: ${clinicalBpLabel} Pulse: ${pulseStatus}`,
                    timestamp: new Date(Date.now()).toISOString(),
                });
            }
           
        }

       

        await db.insert(bpPulseRecords).values({
            user_id: id, diastolic: diastolic, systolic: systolic, bpStatus: bpStatus, clinicalBpLabel, pulseStatus: pulseStatus, pulse: pulse, timestamp: String(timestamp)});

        return c.json({ message: 'Blood pressure saved' }, 201)
    } catch (error) {
        console.log(error)
        return c.json({ message: 'unexpected error 44444' }, 500)
    }
});

app.get('/', async (c) => {
    const { id } = await c.get('jwtPayload');
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
                    eq(bpPulseRecords.user_id, id),
                    gte(bpPulseRecords.timestamp, startTime.toISOString()),
                    lte(bpPulseRecords.timestamp, endTime.toISOString())
                )
            )
            .orderBy(desc(bpPulseRecords.timestamp))
            ;

        // const resultWithPpAndMap = ppMapCalculate(results);
        const resultWithzScore = calculateZScores(results)


        return c.json(resultWithzScore, 200);
    } catch (error) {
        console.error('[GET /] Error:', error);
        return c.json({ errorMessage: 'Internal server error' }, 500);
    }
});


app.get('/summary/:id', async (c) => {
    const { id } = await c.req.param()
    console.log(id)
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

        // const resultWithPpAndMap = ppMapCalculate(results);
        const resultWithzScore = calculateZScores(results)


        return c.json(resultWithzScore, 200);
    } catch (error) {
        console.error('[GET /] Error:', error);
        return c.json({ errorMessage: 'Internal server error' }, 500);
    }
})



export { app as bgRoute };