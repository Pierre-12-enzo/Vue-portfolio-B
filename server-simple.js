require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL || "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Simple session configuration (memory store)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Database connection (optional)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('⚠️  Server will continue without database connection');
    });
} else {
  console.log('⚠️  Warning: No MONGO_URI provided. Database features will not work.');
  console.log('💡 Please create a .env file with MONGO_URI to enable database features.');
}

// Simple routes for testing
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Portfolio2 Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Simple authentication routes
app.post('/api/signin', (req, res) => {
  const { username, password } = req.body;
  
  // Simple hardcoded authentication for testing
  if (username === 'admin' && password === 'admin123') {
    req.session.userId = 'admin-user-id';
    res.json({
      message: 'Logged in successfully',
      user: {
        id: 'admin-user-id',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true,
      user: {
        id: 'admin-user-id',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Mock data routes
app.get('/api/stacks', (req, res) => {
  const mockStacks = [
    {
      _id: '1',
      name: 'Vue.js',
      description: 'Progressive JavaScript framework for building user interfaces',
      category: 'Frontend',
      proficiencyLevel: 'Expert',
      color: '#4FC08D',
      yearsOfExperience: 3,
      featured: true
    },
    {
      _id: '2',
      name: 'Node.js',
      description: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine',
      category: 'Backend',
      proficiencyLevel: 'Advanced',
      color: '#339933',
      yearsOfExperience: 2,
      featured: true
    },
    {
      _id: '3',
      name: 'MongoDB',
      description: 'NoSQL document database for modern applications',
      category: 'Database',
      proficiencyLevel: 'Intermediate',
      color: '#47A248',
      yearsOfExperience: 2,
      featured: true
    }
  ];
  
  res.json(mockStacks);
});

app.get('/api/works', (req, res) => {
  const mockWorks = [
    {
      _id: '1',
      title: 'Portfolio Website',
      description: 'Modern portfolio website built with MEVN stack',
      shortDescription: 'Modern portfolio with beautiful animations',
      category: 'Web Development',
      status: 'Completed',
      technologies: [
        { _id: '1', name: 'Vue.js', color: '#4FC08D' },
        { _id: '2', name: 'Node.js', color: '#339933' }
      ],
      mainImage: { url: 'https://via.placeholder.com/400x250' },
      links: {
        live: 'https://example.com',
        github: 'https://github.com/example'
      },
      featured: true
    },
    {
      _id: '2',
      title: 'E-commerce App',
      description: 'Full-stack e-commerce application with payment integration',
      shortDescription: 'E-commerce app with modern features',
      category: 'Web Development',
      status: 'In Progress',
      technologies: [
        { _id: '1', name: 'Vue.js', color: '#4FC08D' },
        { _id: '3', name: 'MongoDB', color: '#47A248' }
      ],
      mainImage: { url: 'https://via.placeholder.com/400x250' },
      links: {
        github: 'https://github.com/example'
      },
      featured: true
    }
  ];
  
  res.json(mockWorks);
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  
  console.log('Contact form submission:', { name, email, subject, message });
  
  // Simulate email sending
  setTimeout(() => {
    res.json({ message: 'Message sent successfully!' });
  }, 1000);
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
  console.log(`🚀 Portfolio2 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API test: http://localhost:${PORT}/api/test`);
});
