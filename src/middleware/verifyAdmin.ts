import { createMiddleware } from "hono/factory";

export const verifyAdmin = createMiddleware(async(c, next)=>{
    const {role} = await c.get('jwtPayload');
    if(role !== 'admin'){
        return c.json({message: 'forbidden route'}, 401)
    }

    await next()
})