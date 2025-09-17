import { Hono } from "hono";
import { validator } from "hono/validator";
import { registerSchema } from "../zod-schema/registerSchema";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../utils/hashVerify";
const app = new Hono();

interface ErrorSqlite{
    code: string,
    rawCode: number,
    name: string
}


app.post('/', validator('json', (value, c) => {
    const parsed = registerSchema.safeParse(value);
    if (!parsed.success) return c.json({message:'Validation failed', errors: parsed.error.format()}, 400);
    return parsed.data

}), async (c) => {

    //destructing data from validated json
    const { deviceId, name, birthday, password, email, contact, sex, role } = c.req.valid('json');

    //hash the password
    const hash_pass = await hashPassword(password);

    //inserting data to the database
    try {
        //check if the email is already exist in the database
        const doesEmailExist = await db.$count(users, eq(users.email, email));
        if (doesEmailExist) return c.json({message: 'Email is Already taken.'}, 400);

        //check number exisitence in the database

        const doesNumberExist = await db.$count(users, eq(users.contact, contact));
        if(doesNumberExist) return c.json({message: 'Contact number is already exist, please use another contact number.'}, 400);
        
        //insert the data
        await db.insert(users).values({name, birthday, role, password: hash_pass, contact, email, sex, created_At:new Date()});

        //return success message 
        return c.json({
            message: 'Account created! '
        }, 201)
    } catch (error) {
       return c.json({
        error_message: 'Something went wrong, please try again later.'
       }, 500)
    }
});

export { app as registerRoute };
