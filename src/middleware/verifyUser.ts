import { getSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import "dotenv/config";
import { verify } from "hono/jwt";
import { ERROR_MESSAGES } from "../utils/constants";

export const verifyUser = createMiddleware(async (c, next) => {
  try {
    // Get the signed cookie
    const access_token = await getSignedCookie(
      c,
      process.env.COOKIE_SECRET_TOKEN!,
      "access_token"
    );
    if (!access_token) {
      return c.json({ message: ERROR_MESSAGES.UNAUTHORIZED }, 401);
    }

    // Verify the token
    const user = await verify(access_token, process.env.ACCESS_SECRET_TOKEN!);
    c.set("jwtPayload", user);
    await next();
  } catch (error) {
    return c.json({ message: ERROR_MESSAGES.UNAUTHORIZED }, 401);
  }
});  