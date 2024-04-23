const dotenv = require('dotenv')
const express = require('express')
const path = require('path')
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config()

const app = express();
const port = process.env.PORT;
const corsOptions = {
  origin: '*',
  // Add additional origins as needed
};

// Require middleware functions
const jsonMiddleware = require('./api/middlewares/jsonMiddleware')
const urlencodedMiddleware = require('./api/middlewares/urlencodedMiddleware')

// Use Middleware
app.use(cors(corsOptions));
app.use(jsonMiddleware);
app.use(urlencodedMiddleware)
app.use(bodyParser.json({ limit: '35mb' }));

app.use(
    bodyParser.urlencoded({
        extended: true,
        limit: '35mb',
        parameterLimit: 50000,
    }),
);


// app.use(cors({
//     origin: '*',
// }));

app.use('/public', express.static(path.join(__dirname, '../../public')));

// Import Route Files
const memberRoute = require('./api/routes/memberRoute')
const blogRoute = require('./api/routes/blogRoute')
const eventRoute = require('./api/routes/eventRoute')
const postRoute = require('./api/routes/socMedPostRoute')
const programRoute = require('./api/routes/programRoute')
const loginRoute = require('./api/routes/loginRoute')
const passwordRoute = require('./api/routes/passwordRoute')
const registerRoute = require('./api/routes/registerRoute')
const imageRoute = require('./api/routes/imageRoute')
const newsletterRoute = require('./api/routes/newsletterRoute')
const searchRoute = require('./api/routes/searchRoute')
// const testRoute = require('./api/routes/testingRoute')

// Use Routes
app.use('/api/members', memberRoute)
app.use('/api/blogs', blogRoute)
app.use('/api/events', eventRoute)
app.use('/api/posts', postRoute)
app.use('/api/programs', programRoute)
app.use('/api/images', imageRoute)
app.use('/api/login', loginRoute)
app.use('/api/password', passwordRoute)
app.use('/api/register', registerRoute)
app.use('/api/newsletter', newsletterRoute)
app.use('/api/search', searchRoute)
// app.use('/test', testRoute)


app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            message: "Connected!"
        }
    })
})

app.listen(port, () => {
    console.log(`======================================`)
    console.log(`BiNNO backend listening on port ${port}`)
    console.log(`======================================`)
})
