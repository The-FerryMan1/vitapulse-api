import { Hono } from "hono";
import { db } from "../../db";
import { alertHistory } from "../../db/schema";
import { and, eq, gte, lte } from "drizzle-orm";


const app = new Hono();

app.get('/', async(c)=>{
    const {id} = c.get('jwtPayload');
    // console.log(id)
    //     const filter = c.req.query('filter') || 'daily'; // default to daily
    //     const fromQuery =  c.req.query('from');
    //     const toQuery = c.req.query('to');
    //     const now = new Date();
    //     console.log(filter)
    
        try {   
            // let startTime: Date;
            // let endTime: Date = now;
    
            // switch (filter) {
            //     case 'hourly':
            //         startTime = new Date(now);
            //         startTime.setMinutes(0, 0, 0);
            //         break;
    
            //     case 'daily':
            //         startTime = new Date(now);
            //         startTime.setHours(0, 0, 0, 0);
            //         break;
    
            //     case 'weekly':
            //         startTime = new Date(now);
            //         startTime.setDate(now.getDate() - now.getDay());
            //         startTime.setHours(0, 0, 0, 0);
            //         break;
    
            //     case 'monthly':
            //         startTime = new Date(now.getFullYear(), now.getMonth(), 1);
            //         break;
    
            //     case 'custom':
            //         if (!fromQuery || !toQuery) {
            //             return c.json({ errorMessage: 'Custom filter requires "from" and "to" query params' }, 400);
            //         }
    
            //         startTime = new Date(fromQuery);
            //         endTime = new Date(toQuery);
    
            //         if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            //             return c.json({ errorMessage: 'Invalid "from" or "to" date format' }, 400);
            //         }
    
            //         break;
    
            //     default:
            //         return c.json({ errorMessage: 'Invalid filter option' }, 400);
            // }
            const results = await db
                .select()
                .from(alertHistory)
                .where(
                    
                    and(
                        eq(alertHistory.user_id, id),
                        // gte(alertHistory.timestamp, startTime.toISOString()),
                        // lte(alertHistory.timestamp, endTime.toISOString())
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

export {app as alertRoute};