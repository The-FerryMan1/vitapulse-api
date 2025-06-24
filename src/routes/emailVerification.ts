import { Hono } from "hono";
import { db } from "../db";
import { logs, users, verificationToken } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendVerificationCode } from "../utils/emailConf";

const app = new Hono();

app.post('/', async(c)=>{
    const {email} = await c.req.json();
    if(!email) return c.json({message: 'Email is required'}, 400);

    try {
        //get user
        const user = await db.select().from(users).where(eq(users.email, email));
        //check if user exist
        if(!user[0]) return c.json({message: 'No user found'}, 404);

        //generate token
        const token = crypto.randomUUID();

        //generate token expiration
        const tokenExpires = new Date(Date.now() + 1000 * 60 * 60); //1 hour

        //store the token 
        await db.insert(verificationToken).values({ userId: user[0].id, token, tokenExpires});

        //send email
        await sendVerificationCode(user[0].email, token);

        return c.json({ message: "Verification code sent" }, 200);
    } catch (error) {
        const errorMessage = (error as Error).message;
        return c.json({ error: errorMessage }, 500);
    }

});

app.post('/resendVerification', async(c)=>{
    console.log('send')
    const { email } = await c.req.json();
    if (!email) return c.json({ message: 'Email is required' }, 400);

    try {
        //get user
        const user = await db.select().from(users).where(eq(users.email, email));
        //check if user exist
        if (!user[0]) return c.json({ message: 'No user found' }, 404);

        //check if the user is already verified
        const isVerified = user[0].isVerified;
        if(isVerified) return c.json({message: 'Email is already verified'}, 400);

        const token = crypto.randomUUID();

        //generate token expiration
        const tokenExpires = new Date(Date.now() + 1000 * 60 * 60); //1 hour

        //store the token 
        await db.insert(verificationToken).values({ userId: user[0].id, token, tokenExpires });

        //send email
        await sendVerificationCode(user[0].email, token);

    } catch (error) {
        const errorMessage = (error as Error).message;
        return c.json({ error: errorMessage }, 500);
    }
});

app.get('/:token', async(c)=>{

    //get token from paramater
    const {token} = c.req.param();
    
    //check if the token exist
    if(!token) return c.json({message: 'Token is required'}, 400);

    try {
        //find the token
        const tokenRecord = await db.select().from(verificationToken).where(eq(verificationToken.token, token));

        //check if the token exist in the database
        if(!tokenRecord[0]) return c.json({message: 'No token found'}, 404);

        //check if the token is expired
        const isTokenExpired = new Date(tokenRecord[0].tokenExpires);
        if(isTokenExpired < new Date(Date.now())) return c.json({error: "Token expired"}, 400);

        //get the user id
        const { userId } = tokenRecord[0];

        //update the user
        await db.update(users).set({isVerified: true}).where(eq(users.id, Number(userId)));
        await db.insert(logs).values({ user_id: Number(userId), activity: 'Email verification', timestamp: new Date(Date.now()).toISOString() })
        //delete the token from database
        await db.delete(verificationToken).where(eq(verificationToken.userId, Number(userId)));

        return c.json({ message: "Email verified" }, 200);

    } catch (error) {
        const errorMessage = (error as Error).message;
        return c.json({ error: errorMessage }, 500);

    }
});

export {app as emailSendRoute};