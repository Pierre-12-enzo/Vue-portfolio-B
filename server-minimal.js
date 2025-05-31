require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory session storage
let sessions = {};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Portfolio2 Server is running',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString() 
  });
});

// Authentication routes
app.post('/api/signin', (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    const sessionId = 'session-' + Date.now();
    sessions[sessionId] = {
      userId: 'admin-user-id',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };
    
    res.cookie('sessionId', sessionId, { httpOnly: true });
    res.json({
      message: 'Logged in successfully',
      user: sessions[sessionId]
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/signout', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  if (sessionId && sessions[sessionId]) {
    delete sessions[sessionId];
  }
  res.clearCookie('sessionId');
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/check-auth', (req, res) => {
  const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
  if (sessionId && sessions[sessionId]) {
    res.json({ 
      authenticated: true,
      user: sessions[sessionId]
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
    },
    {
      _id: '4',
      name: 'Express.js',
      description: 'Fast, unopinionated, minimalist web framework for Node.js',
      category: 'Backend',
      proficiencyLevel: 'Advanced',
      color: '#000000',
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
      description: 'Modern portfolio website built with MEVN stack featuring beautiful animations and responsive design',
      shortDescription: 'Modern portfolio with beautiful animations',
      category: 'Web Development',
      status: 'Completed',
      technologies: [
        { _id: '1', name: 'Vue.js', color: '#4FC08D' },
        { _id: '2', name: 'Node.js', color: '#339933' },
        { _id: '3', name: 'MongoDB', color: '#47A248' }
      ],
      mainImage: { url: 'https://via.placeholder.com/400x250/4FC08D/ffffff?text=Portfolio+Website' },
      links: {
        live: 'https://example.com',
        github: 'https://github.com/example/portfolio'
      },
      featured: true
    },
    {
      _id: '2',
      title: 'E-commerce Platform',
      description: 'Full-stack e-commerce application with payment integration, user authentication, and admin dashboard',
      shortDescription: 'E-commerce app with modern features',
      category: 'Web Development',
      status: 'In Progress',
      technologies: [
        { _id: '1', name: 'Vue.js', color: '#4FC08D' },
        { _id: '2', name: 'Node.js', color: '#339933' },
        { _id: '3', name: 'MongoDB', color: '#47A248' }
      ],
      mainImage: { url: 'https://via.placeholder.com/400x250/339933/ffffff?text=E-commerce+App' },
      links: {
        github: 'https://github.com/example/ecommerce'
      },
      featured: true
    },
    {
      _id: '3',
      title: 'Task Management App',
      description: 'Collaborative task management application with real-time updates and team collaboration features',
      shortDescription: 'Task management with real-time features',
      category: 'Web Development',
      status: 'Completed',
      technologies: [
        { _id: '1', name: 'Vue.js', color: '#4FC08D' },
        { _id: '4', name: 'Express.js', color: '#000000' }
      ],
      mainImage: { url: 'https://via.placeholder.com/400x250/47A248/ffffff?text=Task+Manager' },
      links: {
        live: 'https://taskapp.example.com',
        github: 'https://github.com/example/taskmanager'
      },
      featured: true
    }
  ];
  
  res.json(mockWorks);
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  
  console.log('📧 Contact form submission:');
  console.log(`Name: ${name}`);
  console.log(`Email: ${email}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  
  // Simulate email sending delay
  setTimeout(() => {
    res.json({ message: 'Message sent successfully!' });
  }, 1000);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
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
  console.log(`🚀 Portfolio2 Minimal Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API test: http://localhost:${PORT}/api/test`);
  console.log(`👤 Login credentials: admin / admin123`);
});
