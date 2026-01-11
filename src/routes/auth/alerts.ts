import { Hono } from "hono";
import { db } from "../../db";
import { alertHistory } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { handleError } from "../../utils/errorHandler";
import { ERROR_MESSAGES } from "../../utils/constants";

const app = new Hono();

app.get("/", async (c) => {
  const { id } = c.get("jwtPayload");

  try {
    const results = await db
      .select()
      .from(alertHistory)
      .where(and(eq(alertHistory.user_id, id)))
      .orderBy(alertHistory.timestamp);
    return c.json(results, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode);
  }
});

app.patch("/:id", async (c) => {
  const { id } = await c.get("jwtPayload");
  const paramId = c.req.param("id");
  try {
    await db
      .update(alertHistory)
      .set({ isRead: true })
      .where(
        and(eq(alertHistory.user_id, id), eq(alertHistory.id, Number(paramId)))
      );

    return c.json({ message: "Alert status updated" }, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode);
  }
});

app.patch("/", async (c) => {
  const { id } = await c.get("jwtPayload");

  try {
    await db
      .update(alertHistory)
      .set({ isRead: true })
      .where(eq(alertHistory.user_id, id));

    return c.json({ message: "Alert status updated" }, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode);
  }
});

app.post("/delete", async (c) => {
  const { id: userID } = await c.get("jwtPayload");

  const payload = (await c.req.json()) as { id: number }[];
  if (!payload || !Array.isArray(payload) || payload.length === 0) {
    return c.json({ message: "No payload provided" }, 400);
  }

  try {
    // Use Promise.all instead of forEach for proper async handling
    await Promise.all(
      payload.map((ele) =>
        db
          .delete(alertHistory)
          .where(
            and(
              eq(alertHistory.id, ele.id),
              eq(alertHistory.user_id, Number(userID))
            )
          )
      )
    );
    return c.json({ message: "Alerts deleted successfully" }, 200);
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return c.json({ message }, statusCode);
  }
});

export { app as alertRoute };
