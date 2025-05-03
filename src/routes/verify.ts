import { Hono } from "hono";
import { getSignedCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import 'dotenv/config';
// ACCESS_SECRET_TOKEN
// REFRESH_SECRET_TOKEN
// COOKIE_SECRET_TOKEN
const app = new Hono();

app.get('/', async (c) => {

    try {
        //get the cookie
        const access_token = await getSignedCookie(c, process.env.COOKIE_SECRET_TOKEN!, 'access_token');
        if (!access_token) return c.json({ message: 'Access token missing or invalid session!' }, 401);

        //verify the token
        const user = await verify(access_token, process.env.ACCESS_SECRET_TOKEN!);
        c.set('jwtPayload', user)
        return c.json(user, 200)
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error('Token verification failed:', errorMessage);

        if (errorMessage.includes('expired')) {
            return c.json({ message: 'Session expired! Please log in again.' }, 401);
        }
        if (errorMessage.includes('invalid')) {
            return c.json({ message: 'Unauthorized. Invalid token.' }, 401);
        }
        return c.json({ message: 'Unexpected error occurred while verifying token.', errorMessage }, 500);
    }
})
export { app as verifyRoute };