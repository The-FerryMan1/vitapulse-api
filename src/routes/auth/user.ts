import { Hono } from 'hono';
import { db } from '../../db';
import { logs, users } from '../../db/schema';
import { asc, desc, eq } from 'drizzle-orm';
import { validator } from 'hono/validator';
import { userInfoUpdate, userPassChange } from '../../zod-schema/updateUser';
import { verifyHashPassword, hashPassword } from '../../utils/hashVerify';
import { getTheAge } from '../../utils/getAge';
const app = new Hono();

app.get('/', async (c) => {
    const user = await c.get('jwtPayload');
    const { id } = user;

    try {
        const res = await db.select({ id: users.id, deviceId: users.deviceId, name: users.name, birthday: users.birthday, sex: users.sex, email: users.email, contact: users.contact }).from(users).where(eq(users.id, id));
        if (!res[0]) return c.json({ message: 'No user found' }, 403);

        return c.json(res[0], 200);
    } catch (error) {
        return c.json({
            error: error
        }, 500)
    }
})

app.put('/', validator('json', (value, c) => {
    const parsed = userInfoUpdate.safeParse(value);
    if (!parsed.success) return c.json({ message: parsed.error.format() }, 400);

    return parsed.data;
}), async (c) => {
    const { id } = await c.get('jwtPayload');
    const { deviceId, birthday, contact, name, sex, role } = await c.req.valid('json');

    try {
        await db.update(users).set({ deviceId, birthday, contact, name, sex}).where(eq(users.id, id));
        await db.insert(logs).values({ user_id: id, activity: 'Update information', timestamp: new Date(Date.now()).toISOString() })
        return c.json({
            message: 'Account information updated'
        });
    } catch (error) {
        console.log(error);
    }

});

app.patch('/', validator('json', (value, c) => {
    const parsed = userPassChange.safeParse(value);
    if (!parsed.success) return c.json({ message: parsed.error.format() }, 400);
    return parsed.data;
}), async (c) => {
    const { id } = await c.get('jwtPayload');
    const { Currentpassword, password } = await c.req.valid('json');

    try {
        const checkPass = await db.select({ hashPass: users.password }).from(users).where(eq(users.id, id));
        if (!checkPass[0]?.hashPass) return c.json({ message: 'no user found' }, 401);

        const isPasswordMatch = await verifyHashPassword(Currentpassword, checkPass[0]?.hashPass);
        if (!isPasswordMatch) return c.json({ message: 'Incorrect password' }, 401);

        const hash_pass = await hashPassword(password);

        await db.update(users).set({ password: hash_pass }).where(eq(users.id, id));
        await db.insert(logs).values({ user_id: id, activity: 'Update password', timestamp: new Date(Date.now()).toISOString() })
        return c.json({ message: 'Password changed!' }, 200);

    } catch (error) {
        console.log(error)
        return c.json({
            message: "Unexpected error occured, please try again later"
        }, 500)
    }
});

app.post('/logs', async (c) => {
    const { activity } = await c.req.json();
    const { id } = await c.get('jwtPayload');
    try {
        await db.insert(logs).values({ user_id: id, activity: activity, timestamp: new Date(Date.now()).toISOString() });

        return c.json({
            message: 'activity log added'
        }, 201)
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'Internal error'
        }, 500)
    }
});

app.get('/logs', async (c) => {
    const { id } = await c.get('jwtPayload');
    try {
        const userLogs = await db.select().from(logs).where(eq(logs.user_id, id)).orderBy(desc(logs.timestamp));
        if (!userLogs || userLogs.length < 0) return c.json({ message: 'No user log found' }, 404);

        return c.json(userLogs, 200)
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'Internal error'
        }, 500)
    }
})

app.get('/:id', async(c)=>{
    const {id}= await c.req.param();


    try {
        const res = await db.select({ id: users.id, deviceId: users.deviceId, name: users.name, birthday: users.birthday, sex: users.sex, email: users.email, contact: users.contact }).from(users).where(eq(users.id, Number(id)));
        if (!res[0]) return c.json({ message: 'No user found' }, 403);

        return c.json(res[0], 200);
    } catch (error) {
        return c.json({
            error: error
        }, 500)
    }
})






export { app as user }