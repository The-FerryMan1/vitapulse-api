import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { googelSheetGetHelper } from "../../utils/getDataFromGoogleSheet";
import { GOOGLE_SHEET_URL } from "../../utils/constants";

const app = new Hono();
const { upgradeWebSocket } = createBunWebSocket<ServerWebSocket>();
app.get(
  "/",
  upgradeWebSocket(async (c) => {
    const { id } = c.get("jwtPayload");
    let interval: Timer;
    let isTheDataNew: string | null = null;
    return {
      async onOpen(evt, ws) {
        interval = setInterval(async () => {
          const res = await googelSheetGetHelper(GOOGLE_SHEET_URL);
          if (res.message) return;
          const readings = JSON.stringify({ ...res });
          if (readings === isTheDataNew) {
            return;
          }

          isTheDataNew = readings;
          ws.send(readings);
        }, 3000);
      },

      async onMessage(evt, ws) {},

      onClose(evt, ws) {
        clearInterval(interval);
      },
    };
  })
);

export { app as websocketRoute };
