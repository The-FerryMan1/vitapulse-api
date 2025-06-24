import { Hono } from "hono";
import { validator } from "hono/validator";
import { userInfoUpdate } from "../../../zod-schema/updateUser";
import { db } from "../../../db";
import { logs, users } from "../../../db/schema";
import { and, eq } from "drizzle-orm";
import { verifyHashPassword } from "../../../utils/hashVerify";
const app = new Hono();

app.put('/update/:id', validator('json', (value, c) => {
    const parsed = userInfoUpdate.safeParse(value);
    if (!parsed.success) return c.json({ message: parsed.error.format() }, 400);

    return parsed.data;
}), async (c) => {
    const { id:userID } = await c.get('jwtPayload');
    const { id } = await c.req.param();
    const { deviceId, birthday, contact, name, sex, role } = await c.req.valid('json');

    try {
        await db.update(users).set({ deviceId, birthday, contact, name, sex}).where(eq(users.id, Number(id)));
        await db.insert(logs).values({ user_id: userID, activity: 'Update information', timestamp: new Date(Date.now()).toISOString() })
        return c.json({
            message: 'Account information updated'
        },200);
    } catch (error) {
        console.log(error);
        return c.json({
            message: 'Internal error'
        }, 500);
    }

});
app.post('/delete/:id', async(c)=>{
    const { id: userID } = await c.get('jwtPayload');
    const { id } = await c.req.param();
    const password = await c.req.json();
    console.log(password)
    try {

        const admin = await db.select().from(users).where(and(eq(users.id, userID), eq(users.role, 'admin')));
        if(!admin[0]) return c.json({message: 'forbidden'}, 402);

        const isPassCorrect = verifyHashPassword(password, admin[0]?.password)
        if(!isPassCorrect) return c.json({message: 'Unauthorized'}, 401);

        await db.delete(users).where(eq(users.id, Number(id)));
        await db.insert(logs).values({ user_id: userID, activity: `Delete a user with an id of ${id}`, timestamp: new Date(Date.now()).toISOString() })

        return c.json({
            message: 'User deleted successfully'
        }, 200) 

    } catch (error) {
        console.log(error);
        return c.json({
            message: 'Internal error'
        }, 500);
    }
})



export {app as userManagementRoute};