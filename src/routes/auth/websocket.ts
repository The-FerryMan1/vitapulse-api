import { Hono } from "hono";
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import {googelSheetGetHelper} from '../../utils/getDataFromGoogleSheet';
const app = new Hono();
const {upgradeWebSocket } = createBunWebSocket<ServerWebSocket>();
// const clients = new Map<string, ServerWebSocket>();

// // Add this somewhere globally (outside the app.get handler)
// const alertLocks = new Map<string, boolean>();
const googleSheetURl = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjjY9ad1RWnzfHErHYoC40-z9i85wqOe8wt3JA4q7PXqtJGMXj1Zlg3b_d0n_zTC5YiElEbb31dzpKJhp-pI-nz69XyadmLIR0QbthQZaAMjmaCdVRx1glkhPOW95pw1s5LW17bYHj6dlBmMNQo6WexCsuOskzqi5ZDX06_E7U2e-_bY4Ze_yAORX9hlqm67Zuk_aDn-W9AWLdMwvhQTYlxIPBn0egtF6LFLa-fnJCucqkxhkRBV3Ne8KDJhZK6wlLlQOwfqa6Lf1qNGAr0U16sWprLa3CVBrGfsjBs4FE5Y2JAV5Q&lib=MfUMAu43yfO2fKjBdhRibWzwPPqT7M8tq';
app.get('/', upgradeWebSocket(async (c) => {
    const {id} = c.get('jwtPayload');
    let interval:Timer;
    let isTheDataNew: string|null = null;
    return {
        async onOpen(evt, ws) {
            console.log('WebSocket connection opened:');
            interval = setInterval(async()=>{
                const res = await googelSheetGetHelper(googleSheetURl)
                if(res.message) return
                const readings = JSON.stringify({...res})

                if (readings === isTheDataNew){
                    console.log('No data changes')
                    return
                }

                isTheDataNew = readings
                ws.send(readings)
            }, 3000)
        },

        async onMessage(evt, ws) {
        },

        onClose(evt, ws) {
            console.log('WebSocket connection closed:');
            clearInterval(interval)
        }
    };
}));



export {app as websocketRoute};