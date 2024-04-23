require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const app = express();
const httpServer = require('http').Server(app);
const bodyParser = require('body-parser');
const db = require('./app/db/models');
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
// const admin = require('firebase-admin');
// const serviceAccount = require('./obhau-app-firebase-admin.json');

//* Get AuditLogger Config
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/app/db/audit-logger/config.json')[env];
const { createNamespace } = require('cls-hooked');
const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
// const { captureConsoleIntegration } = require('@sentry/integrations');

Sentry.init({
    dsn: 'https://96cf143e329b553d6fbcfad63487783a@o4507060395638784.ingest.us.sentry.io/4507060397801472',
    release: 'MyApp-1.0.0',
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),

        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app }),

        nodeProfilingIntegration(),
    ],
    // integrations: [expressIntegration({ app })],
    // integrations: [captureConsoleIntegration({ app })],

    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
});
Sentry.startSpan(
    {
        op: 'rootSpan',
        name: 'My root span',
    },
    () => {
        // Any code executed inside this callback
        // will now be automatically profiled.
    }
);
// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

//* Swagger Docs
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
var morgan = require('morgan');

//* App Route Versions
const V1Routes = '/api/v1';

//* Creating Context Namespace - session.
//? If you need to change the namespace name. Make sure to also update in middleware.js and models/index.js
createNamespace(config.clsNamespace);

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

//* CRON Jobs
require('./schedule');

// Time when request started
app.use((req, res, next) => {
    req.startTime = performance.now();
    next();
});

//* Response Compression
app.use(compression());

//* Helmet
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

//* Morgan
const accessLogs = fs.createWriteStream('./access.log', { flags: 'a' });
app.use(morgan(':remote-addr [:date[web]] :method :url :status - :response-time ms', { stream: accessLogs }));

//* Important to put stripe route before body-parser
//* Stripe Event Construct requires the same body as received in request without parsing.
// app.use(V1Routes, require('./app/stripe'));

//* Body Parser Options
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));

//* Checks if folders exist else create folders for static files
let folders = ['uploads'];
folders.forEach((f) => {
    if (!fs.existsSync(f)) {
        fs.mkdirSync(f);
    }
});

//* Static Files route
app.use('/uploads', express.static('uploads'));

//* Sequelize Connection and Sync
db.sequelize
    .authenticate()
    .then(() => {
        // eslint-disable-next-line no-console
        console.log('DB connected!');
        // db.sequelize
        //     .sync({ force: false, alter: true })
        //     .then(() => {
        //         console.log('DB Synced!');
        //     })
        //     .catch((err) => {
        //         console.log(err);
        //         console.log('DB Synced Failed!: ', err.message);
        //     });
    })
    .catch((err) => {
        console.log(__dirname);
        // eslint-disable-next-line no-console
        console.error('DB connection failed!', err.message);
    });

//* CORS Options
app.use(
    cors({
        origin: '*',
    })
);

app.use(V1Routes, require('./app/routes_controller'));

// app.use(express.static('dist'));

app.get('/', (req, res) => {
    return res.json({ message: 'Server running.' });
});

//* Razorpay Webhook
app.use(V1Routes, require('./app/razorpay'));

//* Swagger Routes
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerDocument));
}
httpServer.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    switch (error.code) {
        case 'EACCES':
            console.error('Port requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error('Port is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});

//* Server
httpServer.listen(process.env.PORT || 5000, function () {
    // eslint-disable-next-line no-console
    console.log('Magic happens on localhost:' + process.env.PORT);
});
