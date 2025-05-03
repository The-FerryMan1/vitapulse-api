import { fetch } from "bun";
import { Hono } from "hono";

const app = new Hono();

const googleSheetURl = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjjY9ad1RWnzfHErHYoC40-z9i85wqOe8wt3JA4q7PXqtJGMXj1Zlg3b_d0n_zTC5YiElEbb31dzpKJhp-pI-nz69XyadmLIR0QbthQZaAMjmaCdVRx1glkhPOW95pw1s5LW17bYHj6dlBmMNQo6WexCsuOskzqi5ZDX06_E7U2e-_bY4Ze_yAORX9hlqm67Zuk_aDn-W9AWLdMwvhQTYlxIPBn0egtF6LFLa-fnJCucqkxhkRBV3Ne8KDJhZK6wlLlQOwfqa6Lf1qNGAr0U16sWprLa3CVBrGfsjBs4FE5Y2JAV5Q&lib=MfUMAu43yfO2fKjBdhRibWzwPPqT7M8tq'; 
app.get('/', async(c)=>{
    console.log('hello')
    try {
        const res = await fetch(googleSheetURl, {
            method: "GET"
        })
       
        if(!res.ok) return c.json({
            message: 'No data found'
        }, 404)
        const result = await res.text()

        const part  = result.split(',')
        return c.json({
            date: part[0],
            timestamp: part[1],
            systolic:Number(part[2]),
            diastolic: Number(part[3]),
            pulseRate: Number(part[4]),
        }, 200)
    } catch (error) {
        console.log(error)
        return c.json({
            message: 'Internal service error'
        }, 500)
    }
})

export {app as getRoute}