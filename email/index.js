const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');

dotenv.config();

const app = express();
const port = process.env.PORT;

// Middleware
const jsonParserMiddleware = express.json();

app.use(jsonParserMiddleware);
app.use(cors({ origin: '*',
credentials: true, }))

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*')
//     res.setHeader(
//         'Access-Control-Allow-Methods',
//         'GET, POST, PUT, DELETE, PATCH'
//     )
//     res.setHeader(
//         'Access-Control-Allow-Headers',
//         'Content-Type, Authorization, X-Requested-With'
//     )
//     next()
// })

// Routes
const membershipRoute = require('./routes/membershipRoute');
const othersRoute = require('./routes/othersRoute');
const newsletterRoute = require('./routes/newsletterRoute');
const adminRoute = require('./routes/adminRoute');
const subscribeRoute = require('./routes/subscribeRoute');


app.use('/membership', membershipRoute);
app.use('/others', othersRoute);
app.use('/newsletter', newsletterRoute)
app.use('/admin', adminRoute);
app.use('/subscribe', subscribeRoute)

app.get('/', (req, res) => res.status(200).json("Hello There!"));

app.listen(port, () => {
    console.log(`======================================`);
    console.log(`BiNNO Email Server listening on port ${port}`);
    console.log(`======================================`);
});
