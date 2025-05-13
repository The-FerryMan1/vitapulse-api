import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';
import { stream, streamText, streamSSE } from 'hono/streaming'
// middleware imports
import {logger} from 'hono/logger';
import {cors} from 'hono/cors';

// route imports
import { registerRoute } from './routes/register';
import { loginRoute } from './routes/login';
import { verifyRoute } from './routes/verify';
import { refreshRoute } from './routes/refresh';
import { logoutRoute } from './routes/logout';
import { verifyUser } from './middleware/verifyUser';
import { user } from './routes/auth/user';
import {bgRoute} from './routes/auth/bp'; 
import { analyzeRoute } from './routes/auth/anlyze';
import { verifyAdmin } from './middleware/verifyAdmin';
import { AdminRoute } from './routes/auth/admin/allUser';
import {websocketRoute} from './routes/auth/websocket';
import { readingsRoute } from './routes/auth/admin/readings';
import { emailSendRoute } from './routes/emailVerification';
import { alertRoute } from './routes/auth/alerts';
import { getRoute } from './routes/get-data';
import { userManagementRoute } from './routes/auth/admin/userManagement';
import { ActivityLogsRoutes } from './routes/auth/admin/ActivityLogs';
import { SSERoute } from './routes/auth/SSE';
import { passwordResetRoute } from './routes/passwordReset';
import { googelSheetGetHelper } from './utils/getDataFromGoogleSheet';

const app = new Hono().basePath('/api/');
const { websocket} = createBunWebSocket<ServerWebSocket>();
// middleware setup
app.use(logger());
app.use(cors({
    origin: ['http://localhost:5173', 'https://vitapulse-app.onrender.com'],
    credentials: true
}))

app.use('/auth/*', verifyUser);
app.use('/auth/admin/*', verifyAdmin);

app.get('/debug', async(c)=>{

    const res = await googelSheetGetHelper('https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjjY9ad1RWnzfHErHYoC40-z9i85wqOe8wt3JA4q7PXqtJGMXj1Zlg3b_d0n_zTC5YiElEbb31dzpKJhp-pI-nz69XyadmLIR0QbthQZaAMjmaCdVRx1glkhPOW95pw1s5LW17bYHj6dlBmMNQo6WexCsuOskzqi5ZDX06_E7U2e-_bY4Ze_yAORX9hlqm67Zuk_aDn-W9AWLdMwvhQTYlxIPBn0egtF6LFLa-fnJCucqkxhkRBV3Ne8KDJhZK6wlLlQOwfqa6Lf1qNGAr0U16sWprLa3CVBrGfsjBs4FE5Y2JAV5Q&lib=MfUMAu43yfO2fKjBdhRibWzwPPqT7M8tq')

    return c.json(res)

});


// routes setup
app.route('/register', registerRoute);
app.route('/email-verification', emailSendRoute);
app.route('/password-reset', passwordResetRoute);
app.route('/login', loginRoute);
app.route('/verify', verifyRoute);
app.route('/refresh', refreshRoute);
app.route('/auth/logout', logoutRoute);


//public route
app.route('/bp-google-sheet', getRoute)

//protected routes
app.route('/auth/user',user);
app.route('/auth/bp', bgRoute);
app.route('/auth/ws/bp', websocketRoute);
app.route('/auth/analyze', analyzeRoute);
app.route('/auth/alerts', alertRoute);
app.route('/auth/ws', SSERoute);

//admin
app.route('/auth/admin/users', AdminRoute );
app.route('/auth/admin/readings', readingsRoute );
app.route('/auth/admin/userManagement', userManagementRoute );
app.route('/auth/admin/logs', ActivityLogsRoutes);

export default {
    port: 8888, 
    fetch: app.fetch,
    websocket
} ;