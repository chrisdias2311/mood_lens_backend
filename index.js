const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const userRoutes = require('./routes/user');
// const User = require('./schemas/Userschema')
const cors = require('cors')
const ConnectionDB = require("./database");
// const passport = require("passport");
// const { initializingPassport } = require('./middlewares/passportConfig');
// const expressSession = require('express-session')
// const jwt = require("jsonwebtoken")


ConnectionDB();

// app.use(express.json());
app.use(cors())
// app.use(express.urlencoded({extended: true}))
// app.use(expressSession({ secret:"secret", resave:false, saveUninitialized:false }));
// app.use(passport.initialize());
// app.use(passport.session());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//API routes here 
app.use('/api/predict', require('./routes/predict'))
app.use('/api/predict_gemini', require('./routes/gemini'))

app.use('/api/v1/video', require('./routes/videopredictions'))
app.use('/api/v1/text', require('./routes/textpredictions'))


const PORT = 5000
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})