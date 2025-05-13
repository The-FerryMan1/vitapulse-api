import { Hono } from "hono";
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import { db } from "../../db";
import { alertHistory, bpPulseRecords, loginStat, users } from "../../db/schema";
import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm";
import { calculateZScores } from "../../utils/zScore";
import { getTheAge } from "../../utils/getAge";
const { upgradeWebSocket } = createBunWebSocket<ServerWebSocket>();
const app = new Hono();

app.get("/historical", upgradeWebSocket(async (c) => {
    const { id } = await c.get('jwtPayload');
    const filter = (await c.req.query("filter")) || "weekly";
    const fromQuery = await c.req.query("from");
    const toQuery = await c.req.query("to");

    let intervalId: Timer;


    return {
        async onOpen(evt, ws) {
            let startTime: Date;
            intervalId = setInterval(async () => {
                try {

                    const now = new Date();
                    let endTime: Date = now
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
                        .all();

                    // const resultWithPpAndMap = ppMapCalculate(results);
                    const resultWithzScore = calculateZScores(results)


                    ws.send(JSON.stringify(resultWithzScore))
                } catch (error) {
                    console.error('[GET /] Error:', error);

                }


            }, 5000)
        },
        async onMessage(evt, ws) {
            console.log('Received message from client:', evt.data);
        },
        onClose(evt, ws) {
            console.log('WebSocket connection closed:');
            clearInterval(intervalId);
        }
    }
}));



app.get("/dashboard", upgradeWebSocket(async()=>{
    let intervalId: Timer;
    const ageGroups = [
        { label: '0–17', min: 0, max: 17 },
        { label: '18–30', min: 18, max: 30 },
        { label: '31–45', min: 31, max: 45 },
        { label: '46–60', min: 46, max: 60 },
        { label: '61+', min: 61, max: Infinity },
    ];

    return {
        async onOpen(evt, ws) {
            console.log('webscoket connection opened')
            try {
                intervalId = setInterval(async()=>{
                    const user = await db.select().from(users).all();

                    const counts: Record<string, number> = {};

                    ageGroups.forEach((group) => {
                        counts[group.label] = 0
                    });

                    user.forEach((user) => {
                        const age = getTheAge(user.birthday);
                        const group = ageGroups.find(g => age >= g.min && age <= g.max);
                        if (group) counts[group.label]++;
                    })

                    const userCount = await db.select({
                        userCount: db.$count(users),
                        statusCount: db.$count(users, eq(users.status, true)),
                    }).from(users).get()

                    const alertCount = await db.$count(alertHistory);

                    const logins = await db.select().from(loginStat).orderBy(desc(loginStat.date)).limit(7);
                    const abnormal = await db.select({ bpStatus: bpPulseRecords.bpStatus, timestamp: bpPulseRecords.timestamp }).from(bpPulseRecords).where(
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
                    
                    ws.send(JSON.stringify({
                        counts,
                        logins,
                        ...userCount,
                        alertCount,
                        abnormal
                    }))
                }, 3000)
                
            } catch (error) {
                console.error('[GET /] Error:', error);
            }
        },
        async onMessage(evt, ws) {
            console.log('Received message from client:', evt.data);
        },
        async onClose(evt, ws) {
            console.log('WebSocket connection closed:');
            clearInterval(intervalId);
        },
    }
}))


app.get("/notification", upgradeWebSocket(async(c)=>{
    const {id, role} = c.get('jwtPayload')
    let intervalId:Timer;
    return {
        onOpen(evt, ws) {
            console.log("Websocket Notification open");
            intervalId = setInterval(async()=>{


                if(role !== 'admin'){
                    try {
                        const alertHs = await db.select().from(alertHistory).orderBy(desc(alertHistory.timestamp)).limit(3).all();

                        ws.send(JSON.stringify(alertHs))
                    } catch (error) {
                        console.log(error)
                    }
                }else{

                    try {
                        const alertHs = await db.select().from(alertHistory).where(eq(alertHistory.user_id, id)).orderBy(desc(alertHistory.timestamp)).limit(3).all();

                        ws.send(JSON.stringify(alertHs))
                    } catch (error) {
                        console.log(error)
                    }
                    
                }
                
            }, 1000)
        },
        onMessage(evt, ws) {
            console.log(`Websocket Message: ${evt.data}`);
        },
        onClose(evt, ws) {
            console.log("Websocket Closed")
            clearTimeout(intervalId)
        },
    }
}))

export { app as SSERoute };
