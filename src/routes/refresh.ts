import { Hono } from 'hono';
import { getSignedCookie, setSignedCookie } from 'hono/cookie';
import 'dotenv/config';
import { sign, verify } from 'hono/jwt';

// ACCESS_SECRET_TOKEN
// REFRESH_SECRET_TOKEN
// COOKIE_SECRET_TOKEN
const app = new Hono();

app.post('/', async (c) => {

    try {
        //get the refresh cookie 
        const refresh_token = await getSignedCookie(c, process.env.COOKIE_SECRET_TOKEN!, 'refresh_token')
        if (!refresh_token) return c.json({ message: 'Please, login again' }, 401);

        const isRefreshValid = await verify(refresh_token, process.env.REFRESH_SECRET_TOKEN!);

        //destruct the token
        const { deviceId, age, status, id, role, isVerified, email, } = isRefreshValid;

        //create a new payload and sign
        const new_access_token = {
            id: id,
            deviceId,
            email,
            isVerified,
            status,
            age,
            role: role,
            exp: Math.floor(Date.now() / 1000) + 60 * 5 //5 mins
        }
        const new_refresh_token = {
            id: id,
            deviceId,
            email,
            isVerified,
            status,
            age,
            role: role,
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 //7 mins
        }

        //sign the access and refresh token
        const access = await sign(new_access_token, process.env.ACCESS_SECRET_TOKEN!);
        const refresh = await sign(new_refresh_token, process.env.REFRESH_SECRET_TOKEN!);

        //configure cookies
        await setSignedCookie(
            c,
            'access_token',
            access,
            process.env.COOKIE_SECRET_TOKEN!,
            {
                path: '/',
                httpOnly: true,
                maxAge: 15 * 60, //15mins,
                expires: new Date(Date.now() + 15 * 60 * 1000),
                sameSite: 'strict',
                secure: process.env.PRODUCTION! === 'dev'
            }
        );

        await setSignedCookie(
            c,
            'refresh_token',
            refresh,
            process.env.COOKIE_SECRET_TOKEN!,
            {
                path: '/',
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60,  //7 days
                expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                sameSite: 'strict',
                secure: process.env.PRODUCTION! === 'dev'
            }
        )
        return c.json({ message: 'Tokens refreshed successfully' }, 200);
    } catch (error) {
        const errorMessage = (error as Error).message;
        console.error('Error refreshing token:', errorMessage);

        if (errorMessage.includes('invalid')) {
            return c.json({ message: 'Invalid refresh token. Please log in again.' }, 401);
        }

        return c.json({ message: 'Something went wrong while refreshing tokens.', errorMessage }, 500);
    }
})

export { app as refreshRoute };