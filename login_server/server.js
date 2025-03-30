// mongodb
require('./config/db');

// CORS Configure
const cors = require('cors');

const app = require('express')();
const port = process.env.PORT;

const UserRouter = require('./api/User');

// Enable CORS for all routes
app.use(cors());

// For accepting Post form data
const bodyParser = require('express').json;
app.use(bodyParser());

app.use('/user', UserRouter)

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})