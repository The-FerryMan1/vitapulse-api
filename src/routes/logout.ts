import { Hono } from "hono";
import { deleteCookie, getSignedCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { logs, users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

const app = new Hono();

app.post('/', async (c) => {
    const {id} = await c.get('jwtPayload');
    try {
        // const refresh_token = await getSignedCookie(c, process.env.COOKIE_SECRET_TOKEN!, 'refresh_token')
        // if (!refresh_token) return c.json({ message: 'Please, login again' }, 401);
        // const isRefreshValid = await verify(refresh_token, process.env.REFRESH_SECRET_TOKEN!);
        // const {id} = isRefreshValid;
        
        await db.update(users).set({ status: false }).where(eq(users.id, Number(id)));
        await db.insert(logs).values({ user_id: Number(id), activity: 'Logout', timestamp:new Date(Date.now()).toISOString()});

        
        deleteCookie(c, 'access_token');
        deleteCookie(c, 'refresh_token');

        return c.json({ message: 'successfuly logout' });

    } catch (error) {
        const errorMessage = (error as Error).message;
        console.log(errorMessage);
        return c.json({ message: 'Something went wrong, please try again later!' });
    }
})

export { app as logoutRoute };