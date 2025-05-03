import { Hono } from "hono";
import { anlyzeForAbnormalities } from "../../utils/abnoymalDetect";
import { getTheAge } from "../../utils/getAge";

interface Readings {
    diastolic: number,
    id: number,
    status: string,
    systolic: number,
    bpStatus: string,
    pulseStatus: string,
    pulse: number,
    message: string,
    timestamp: string,
};
const app = new Hono();

app.post('/', async (c) => {
    const { id, birthday } = await c.get('jwtPayload')
    const {sampleData} = await c.req.json();
    const age = getTheAge(birthday)
    try {
      
        const res = anlyzeForAbnormalities(sampleData, age)
        return c.json({
            res
        }, 200)
    } catch (error) {
        console.log(error)
        return c.json({ message: 'Unexpected error occured, please try again later' }, 500)
    }
})

export {app as analyzeRoute};