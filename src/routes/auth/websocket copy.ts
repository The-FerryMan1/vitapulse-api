import { Hono } from "hono";
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import { getBpAndPulseByAge } from "../../utils/bpByAge";
import {sendAlertEmail} from '../../utils/emailConf'; 
import { db } from "../../db";
import { alertHistory, users } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { getTheAge } from "../../utils/getAge";
const app = new Hono();

const {upgradeWebSocket } = createBunWebSocket<ServerWebSocket>();
const clients = new Map<string, ServerWebSocket>();

// Add this somewhere globally (outside the app.get handler)
const alertLocks = new Map<string, boolean>();

app.get('/', upgradeWebSocket(async (c) => {
    let clientId: any;

    return {
        onOpen(evt, ws) {
            console.log('WebSocket connection opened:');
        },

        async onMessage(evt, ws) {
            const raw = evt.data.toString();

            try {
                const msg = JSON.parse(raw);

                // Handle registration/auth
                if (msg.type === 'auth' && msg.deviceId && ws?.raw) {
                    clientId = msg.deviceId;
                    clients.set(clientId, ws.raw);
                    console.log(`Client registered as ${clientId}`);
                }

                // Handle data routing
                if (msg.type === 'data' && msg.toDeviceId && msg.payload) {
                    const targetSocket = clients.get(msg.toDeviceId);

                    if (targetSocket && targetSocket.readyState === 1) {
                        targetSocket.send(JSON.stringify(msg.payload));

                        const { systolic, diastolic, pulseRate } = msg.payload;
                        console.log(typeof systolic, typeof diastolic, typeof pulseRate)
                        const res = await db
                            .select({ id: users.id, email: users.email, birthday: users.birthday })
                            .from(users)
                            .where(eq(users.deviceId, msg.toDeviceId))
                            ;
                            console.log(res[0])

                        if (res[0]) {
                            const age = getTheAge(res[0]?.birthday)
                            const { bpStatus, pulseStatus, clinicalBpLabel } = getBpAndPulseByAge(
                                systolic,
                                diastolic,
                                pulseRate,
                                age
                            );
                          

                            const isAbnormal =
                                ['Hypertensive Crisis', 'Hypertension Stage 2', 'Hypertension Stage 1', 'Elevated', 'Low', 'Low BP (Hypotension)'].includes(bpStatus) ||
                                ['High', 'Low'].includes(pulseStatus);

                            if (isAbnormal) {
                                // Locking to prevent duplicate alerts
                                if (alertLocks.get(String(res[0].id))) {
                                    console.log(`Skipping: Alert already being processed for user ${res[0].email}`);
                                    return;
                                }

                                alertLocks.set(String(res[0].id), true); // lock

                                try {
                                    const lastAlert = await db
                                        .select({ timestamp: alertHistory.timestamp })
                                        .from(alertHistory)
                                        .where(eq(alertHistory.user_id, res[0].id))
                                        .orderBy(desc(alertHistory.timestamp))
                                        .limit(1)
                                        ;

                                    const now = new Date();
                                    const cooldownMs = 60 * 60 * 1000; // 1 hour
                                    const canSendAlert = !lastAlert[0] || (now.getTime() - new Date(lastAlert[0].timestamp).getTime()) > cooldownMs;

                                    if (canSendAlert) {
                                        await sendAlertEmail(res[0].email, `Blood Pressure: ${clinicalBpLabel}, consider to go to nearest clinic`);

                                        await db.insert(alertHistory).values({
                                            user_id: res[0].id,
                                            message: `Bp: ${clinicalBpLabel} Pulse: ${pulseStatus}`,
                                            timestamp: now.toISOString(),
                                        });

                                        console.log('✅ Alert sent');
                                    } else {
                                        console.log(`⏳ Skipped alert (cooldown): ${res[0].email}`);
                                    }
                                } catch (err) {
                                    console.error('Alert error:', err);
                                } finally {
                                    alertLocks.delete(String(res[0].id)); // unlock
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Invalid message:', raw);
            }
        },

        onClose(evt, ws) {
            console.log('WebSocket connection closed:');
        }
    };
}));



export {app as websocketRoute};