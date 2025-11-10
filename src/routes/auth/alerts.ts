import { Hono } from "hono";
import { db } from "../../db";
import { alertHistory } from "../../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";


const app = new Hono();

app.get('/', async(c)=>{
    const {id} = c.get('jwtPayload');
    
        try {   
            const results = await db
                .select()
                .from(alertHistory)
                .where(
                    
                    and(
                        eq(alertHistory.user_id, id)
    
                    )
                )
                .orderBy(alertHistory.timestamp)
                ;

            return c.json(results, 200);
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'Internal error'
        })
    }
});


app.patch('/:id', async(c)=>{
    const {id} = await c.get('jwtPayload');
    const paramId = c.req.param('id')
    try {
        await db.update(alertHistory).set({isRead: true}).where(and(eq(alertHistory.user_id, id), eq(alertHistory.id, Number(paramId))));

        return c.json({
            message: 'alert status updated'
        }, 200)
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'Internal error'
        })
    }
})

app.patch('/', async(c)=>{
    const { id } = await c.get('jwtPayload');

    try {
        await db.update(alertHistory).set({ isRead: true }).where(eq(alertHistory.user_id, id));

        return c.json({
            message: 'alert status updated'
        }, 200)
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'Internal error'
        })
    }
})

app.post('/delete', async(c)=>{
    const {id:userID} = await c.get('jwtPayload');
  
    const payload = await c.req.json() as {id: number}[];
      console.log(payload)
        if(!payload) return c.json({message: 'No payload provided'}, 404)
        try {
            payload.forEach(async(ele)=>{
                console.log(ele, "123123")
               const res = await db.delete(alertHistory).where(and(eq(alertHistory.id, ele.id), eq(alertHistory.user_id, Number(userID))));
            })
            return c.json({message: payload}, 200)
        } catch (error) {
            console.error(error)
            return c.json({message: "unexpected error occured", error});
        }
    
})



export {app as alertRoute};