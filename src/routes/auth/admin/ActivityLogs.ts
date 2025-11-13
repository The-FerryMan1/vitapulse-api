import { Hono } from "hono";
import { db } from "../../../db";
import { logs, users } from "../../../db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();


app.get('/', async(c)=>{
    try {
        const logss = await db.select({ id:logs.id, name: users.name, activity:logs.activity, timestamp:logs.timestamp }).from(logs).leftJoin(users, eq(logs.user_id, users.id));
        return c.json(logss, 200)
    } catch (error) {
        console.log(error);
        return c.json({
            message: 'Internal error'
        }, 500);
    }
})

app.post('/delete', async(c)=>{
        const payload = await c.req.json() as {id: number}[];
        console.log(payload)
            if(!payload) return c.json({message: 'No payload provided'}, 404)
            try {
                payload.forEach(async(ele)=>{
                    console.log(ele)
                   await db.delete(logs).where(eq(logs.id, ele.id));
                })
                return c.json({message: "deleted successfully"}, 200)
            } catch (error) {
                console.error(error)
                return c.json({message: "unexpected error occured", error});
            }
})
export {app as ActivityLogsRoutes}