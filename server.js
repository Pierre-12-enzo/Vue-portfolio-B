require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT; // You can change the port

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], 
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



//Setting session
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/test' }),
}));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/test')
.then(() => console.log('Connected to mongodb'))
.catch((err) => console.log('ERROR Connecting to mongodb'));


// Use routes
const routes = require('./routes');
app.use('/api', routes);


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
