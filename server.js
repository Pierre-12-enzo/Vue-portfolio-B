require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Only add MongoDB store if MONGO_URI is provided
if (process.env.MONGO_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  });
} else {
  console.log('⚠️  Warning: Using memory store for sessions (not suitable for production)');
}

app.use(session(sessionConfig));

// Database connection
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true, // modern topology engine
  tls: true                 // ensure TLS is enabled for Atlas
})
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      if (err.message.includes('authentication failed')) {
        console.log('🔑 Authentication failed. Please check your MongoDB credentials.');
        console.log('💡 Update your MONGO_URI in the .env file with correct username/password.');
      }
      console.log('⚠️  Server will continue without database connection');
      console.log('🚀 You can still test the frontend with mock data');
    });
} else {
  console.log('⚠️  Warning: No MONGO_URI provided. Database features will not work.');
  console.log('💡 Please create a .env file with MONGO_URI to enable database features.');
}

// Routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Portfolio2 Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Something went wrong!'
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Portfolio Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
