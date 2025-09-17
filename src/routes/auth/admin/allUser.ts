import { Hono } from "hono";
import { db } from "../../../db";
import { alertHistory, loginStat, users } from "../../../db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getTheAge } from "../../../utils/getAge";


const app = new Hono();

app.get('/', async(c)=>{
    try {
        const allUsers = await db.select({id: users.id, status:users.status, name:users.name, birthday:users.birthday, sex:users.sex, email:users.email, contact:users.contact, role: users.role, isVerified:users.isVerified}).from(users).where(eq(users.role, 'general'));
        if (!allUsers || allUsers.length < 0) return c.json(allUsers, 404);

        return c.json(allUsers, 200);
    } catch (error) {       
        console.log(error);
        return c.json({message: 'Unexpected error occured'}, 500)
    }
})
app.get('/admin-list', async(c)=>{
    try {
        const allUsers = await db.select({id: users.id, status:users.status, name:users.name, birthday:users.birthday, sex:users.sex, email:users.email, contact:users.contact, role: users.role, isVerified:users.isVerified}).from(users).where(eq(users.role, 'admin'));
        if (!allUsers || allUsers.length < 0) return c.json(allUsers, 404);
        return c.json(allUsers, 200);
    } catch (error) {       
        console.log(error);
        return c.json({message: 'Unexpected error occured'}, 500)
    }
})

app.get('/users-alerts', async(c)=>{
            // const filter = c.req.query('filter') || 'daily'; // default to daily
            // const fromQuery =  c.req.query('from');
            // const toQuery = c.req.query('to');
            // const now = new Date();
            // console.log(filter)
        
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
                    // .where(
                    //     // and(
                    //     //     gte(alertHistory.timestamp, startTime.toISOString()),
                    //     //     lte(alertHistory.timestamp, endTime.toISOString())
                    //     // )
                    // )
                    .orderBy(alertHistory.timestamp)
                    ;
                    console.log(results)
                return c.json(results, 200);
        } catch (error) {
            console.log(error)
            return c.json({
                message: 'Internal error'
            })
        }
})

app.get('/usersCount', async(c)=>{
    try {
        const userCount = await db.select({
            userCount: db.$count(users),
            statusCount: db.$count(users, eq(users.status, true)),
        }).from(users)
        const alertCount = await db.$count(alertHistory);
        return c.json({
            ...userCount[0],
            alertCount
        }, 200)
    } catch (error) {
        console.log(error);
        return c.json({ message: 'Unexpected error occured' }, 500)
    }
})

app.get('/loginPerDay', async(c)=>{
    try {
        const logins = await db.select().from(loginStat).orderBy(desc(loginStat.date)).limit(7);
        if(logins.length < 0 ) return c.json(logins, 404);
        return c.json(logins, 200)
    } catch (error) {
        console.log(error);
        return c.json({ message: 'Unexpected error occured' }, 500)
    }
});

app.get('/age-distri', async (c) => {
    const ageGroups = [
        { label: '0–17', min: 0, max: 17 },
        { label: '18–30', min: 18, max: 30 },
        { label: '31–45', min: 31, max: 45 },
        { label: '46–60', min: 46, max: 60 },
        { label: '61+', min: 61, max: Infinity },
    ];
    try {
        const user = await db.select().from(users);

        const counts: Record<string, number> = {};

        ageGroups.forEach((group) => {
            counts[group.label] = 0
        });

        user.forEach((user) => {
            const age = getTheAge(user.birthday);
            const group = ageGroups.find(g => age >= g.min && age <= g.max);
            if (group) counts[group.label]++;
        })

        return c.json(counts, 200);
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'Internal error'
        }, 500)
    }
})

export {app as AdminRoute};