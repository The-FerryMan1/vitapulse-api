import { Hono } from "hono";
import { db } from "../db";
import { logs, passwordResetToken, users, verificationToken } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendResetPassword, sendVerificationCode } from "../utils/emailConf";
import { hashPassword } from "../utils/hashVerify";

const app = new Hono();

app.post('/', async(c)=>{
    const {email} = await c.req.json();
    if(!email) return c.json({message: 'Email is required'}, 400);

    try {
        //get user
        const user = await db.select().from(users).where(eq(users.email, email)).get();
        //check if user exist
        if(!user) return c.json({message: 'Email does not exist'}, 404);

        //generate token
        const token = crypto.randomUUID();

        //generate token expiration
        const tokenExpires = new Date(Date.now() + 1000 * 60 * 60); //1 hour

        //store the token 
        await db.insert(passwordResetToken).values({userId: user.id, token, tokenExpires});

        //send email
        await sendResetPassword(user.email, token);

        return c.json({ message: "Verification code sent" }, 200);
    } catch (error) {
        console.log(error)
        const errorMessage = (error as Error).message;
        return c.json({ error: errorMessage }, 500);
    }

});

app.post('/resend-request', async(c)=>{
    console.log('send')
    const { email } = await c.req.json();
    if (!email) return c.json({ message: 'Email is required' }, 400);

    try {
        //get user
        const user = await db.select().from(users).where(eq(users.email, email)).get();
        //check if user exist
        if (!user) return c.json({ message: 'No user found' }, 404);

        const token = crypto.randomUUID();

        //generate token expiration
        const tokenExpires = new Date(Date.now() + 1000 * 60 * 60); //1 hour

        //store the token 
        await db.insert(verificationToken).values({ userId: user.id, token, tokenExpires });

        //send email
        await sendResetPassword(user.email, token);

    } catch (error) {
        const errorMessage = (error as Error).message;
        return c.json({ error: errorMessage }, 500);
    }
});

app.post('/:token', async(c)=>{

    //get token from paramater
    const {token} = c.req.param();
    const {password} = await  c.req.json()
    
    //check if the token exist
    if(!token) return c.json({message: 'Token is required'}, 400);

    try {
        //find the token
        const tokenRecord = await db.select().from(passwordResetToken).where(eq(passwordResetToken.token, token)).get();

        //check if the token exist in the database
        if(!tokenRecord) return c.json({message: 'No token found'}, 404);

        //check if the token is expired
        const isTokenExpired = new Date(tokenRecord.tokenExpires);
        if(isTokenExpired < new Date(Date.now())) return c.json({error: "Token expired"}, 400);

        //get the user id
        const {userId} = tokenRecord;

        const hash_pass = await hashPassword(password);

        //update the user
        await db.update(users).set({ password: hash_pass }).where(eq(users.id, Number(userId)));
        await db.insert(logs).values({ user_id: Number(userId), activity: 'Password reset', timestamp: new Date(Date.now()).toISOString() })
        //delete the token from database
        await db.delete(verificationToken).where(eq(verificationToken.userId, Number(userId)));

        return c.json({ message: "password was changed" }, 200);

    } catch (error) {
        const errorMessage = (error as Error).message;
        return c.json({ error: errorMessage }, 500);

    }
});

export {app as passwordResetRoute};