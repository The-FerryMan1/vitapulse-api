import { createMiddleware } from "hono/factory";
import { ERROR_MESSAGES } from "../utils/constants";

export const verifyAdmin = createMiddleware(async (c, next) => {
  const { role } = await c.get("jwtPayload");
  if (role !== "admin") {
    return c.json({ message: ERROR_MESSAGES.FORBIDDEN }, 403);
  }

  await next();
});