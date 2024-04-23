const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')

const app = express()

dotenv.config()

// Require middleware functions
const corsMiddleware = require('./api/middlewares/corsMiddleware')
const jsonMiddleware = require('./api/middlewares/jsonMiddleware')
const urlencodedMiddleware = require('./api/middlewares/urlencodedMiddleware')

const port = process.env.PORT

// Use Middleware
// app.use(corsMiddleware)
app.use(jsonMiddleware)
app.use(urlencodedMiddleware)
app.use(cors());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Requested-With'
    );
    next();
});

// Import Route Files
const getRoute = require('./api/routes/getRoute')
const loginRoute = require('./api/routes/loginRoute')
const elementRoute = require('./api/routes/elementRoute')
const scheduleRoute = require('./api/routes/scheduleRoute')
const applicationRoute = require('./api/routes/applicationRoute')
const metricRoute = require('./api/routes/metricRoute')
const membershipRoute = require('./api/routes/membershipRoute')
const reportsRoute = require('./api/routes/reportRoute')
const faqRoute = require('./api/routes/faqRoute');

// Use Routes
app.use('/api/login', loginRoute)
app.use('/api/elements', elementRoute)
app.use('/api/get', getRoute)
app.use('/api/schedule', scheduleRoute)
app.use('/api/application', applicationRoute)
app.use('/api/members', membershipRoute);
app.use('/api/metrics', metricRoute);
app.use('/api/reports', reportsRoute);
app.use('/api/faq', faqRoute);

// Server Listener
app.listen(port, () => {
    console.log('====================================')
    console.log(`System Admin Server is running in ${port}`)
    console.log('====================================')
})
