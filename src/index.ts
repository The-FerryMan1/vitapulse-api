import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";
// middleware imports
import { logger } from "hono/logger";
import { cors } from "hono/cors";

// route imports
import { registerRoute } from "./routes/register";
import { loginRoute } from "./routes/login";
import { verifyRoute } from "./routes/verify";
import { refreshRoute } from "./routes/refresh";
import { logoutRoute } from "./routes/logout";
import { verifyUser } from "./middleware/verifyUser";
import { user } from "./routes/auth/user";
import { bgRoute } from "./routes/auth/bp";
import { analyzeRoute } from "./routes/auth/anlyze";
import { verifyAdmin } from "./middleware/verifyAdmin";
import { AdminRoute } from "./routes/auth/admin/allUser";
import { websocketRoute } from "./routes/auth/websocket";
import { readingsRoute } from "./routes/auth/admin/readings";
import { emailSendRoute } from "./routes/emailVerification";
import { alertRoute } from "./routes/auth/alerts";
import { getRoute } from "./routes/get-data";
import { userManagementRoute } from "./routes/auth/admin/userManagement";
import { ActivityLogsRoutes } from "./routes/auth/admin/ActivityLogs";
import { SSERoute } from "./routes/auth/SSE";
import { passwordResetRoute } from "./routes/passwordReset";

const app = new Hono().basePath("/api");
const { websocket } = createBunWebSocket<ServerWebSocket>();
// middleware setup
app.use(logger());
app.use(
  cors({
    origin: [Bun.env.APP_DOMAIN_NAME!],
    credentials: true,
  }),
);

app.use("/auth/*", verifyUser);
app.use("/auth/admin/*", verifyAdmin);

import { googelSheetGetHelper } from "./utils/getDataFromGoogleSheet";
import { GOOGLE_SHEET_URL } from "./utils/constants";

app.get("/debug", async (c) => {
  const res = await googelSheetGetHelper(GOOGLE_SHEET_URL);
  return c.json(res);
});

app.get("/env", (c) => {
  return c.json({
    allowed_origin_check: Bun.env.APP_DOMAIN_NAME!,
  });
});

// routes setup
app.route("/register", registerRoute);
app.route("/email-verification", emailSendRoute);
app.route("/password-reset", passwordResetRoute);
app.route("/login", loginRoute);
app.route("/verify", verifyRoute);
app.route("/refresh", refreshRoute);
app.route("/auth/logout", logoutRoute);

//public route
app.route("/bp-google-sheet", getRoute);

//protected routes
app.route("/auth/user", user);
app.route("/auth/bp", bgRoute);
app.route("/auth/ws/bp", websocketRoute);
app.route("/auth/analyze", analyzeRoute);
app.route("/auth/alerts", alertRoute);
app.route("/auth/ws", SSERoute);

//admin
app.route("/auth/admin/users", AdminRoute);
app.route("/auth/admin/readings", readingsRoute);
app.route("/auth/admin/userManagement", userManagementRoute);
app.route("/auth/admin/logs", ActivityLogsRoutes);

// Server configuration logged on startup

export default {
  port: Bun.env.PORT || 8000,
  fetch: app.fetch,
  websocket,
};
