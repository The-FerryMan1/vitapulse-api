import { Hono } from "hono";
import { db } from "../../../db";
import { logs, users } from "../../../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();


app.get('/', async(c)=>{
    try {
        const logss = await db.select({ id: users.id, name: users.name, activity:logs.activity, timestamp:logs.timestamp }).from(logs).leftJoin(users, eq(logs.user_id, users.id)).all();
        console.log(logss)
        return c.json(logss, 200)
    } catch (error) {
        console.log(error);
        return c.json({
            message: 'Internal error'
        }, 500);
    }
})
export {app as ActivityLogsRoutes}