import { Hono } from "hono";
import { validator } from "hono/validator";
import { loginSchema } from "../zod-schema/loginShema";
import { db } from "../db";
import { loginStat, logs, users } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyHashPassword } from "../utils/hashVerify";
import {sign} from "hono/jwt";
import {setSignedCookie} from "hono/cookie";
import "dotenv/config";
import { getTheAge } from "../utils/getAge";

const app = new Hono();

app.post('/', validator('json', (value, c)=>{

    const parsed = loginSchema.safeParse(value);
    if(!parsed.success){
        return c.json({
            message: 'Invalid input',
            errors: parsed?.error?.format()
        }, 400)
    }
    return parsed?.data;
}), async(c)=>{

    //destructing email and password from validated json data;
    const {email, password} = c.req.valid('json');


    try {
        // check if the user's email is valid;
        const doesUserExist = await db.select().from(users).where(eq(users.email, email));
        if(!doesUserExist[0]) return c.json({message: 'Account does not exist'}, 401);

        //if user exist, destruct the data;
        const {deviceId, birthday, status, id, password:hash_pass, role, isVerified, email:users_email} = doesUserExist[0]
        const age = getTheAge(birthday);

        //check if the password match
        const isPasswordMatch = await verifyHashPassword(password, hash_pass);
        if(!isPasswordMatch) return c.json({message: 'Credential do not match our records'}, 401);

        //creating access token
        const access_token = {
            id: id,
            age,
            email: users_email,
            isVerified,
            status,
            deviceId,
            role: role,
            exp: Math.floor(Date.now() / 1000) + 60 * 5 //5 mins
        }

        //creating refresh token
        const refresh_token = {
            id: id,
            age,
            email: users_email,
            isVerified,
            status,
            deviceId,
            role: role,
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 //7 mins
        }

        //sign the access and refresh token
        const access = await sign(access_token, process.env.ACCESS_SECRET_TOKEN!);
        const refresh = await sign(refresh_token, process.env.REFRESH_SECRET_TOKEN!);

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
                sameSite: 'None',
                secure: process.env.PRODUCTION! === 'production'
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
                sameSite: 'None',
                secure: process.env.PRODUCTION! === 'production'
            }
        )

        await db.update(users).set({status: true}).where(eq(users.id, id));
        await db.insert(logs).values({ user_id: id, activity: 'Login', timestamp: new Date(Date.now()).toISOString() });
        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        await db
            .insert(loginStat)
            .values({ date: today, logins: 1 })
            .onConflictDoUpdate({
                target: [loginStat.date],
                set: {
                    logins: sql`${loginStat.logins} + 1`
                }
            });
        return c.json({ message: 'Login successfuly' }, 200)

    } catch (error) {
        console.log(error)
        return c.json({
            message: "Unexpected error occured, please try again later"
        }, 500)
    }
});
export {app as loginRoute};