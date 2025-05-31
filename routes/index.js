const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Stack = require('../models/Stack');
const Work = require('../models/Work');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized access. Please log in.' });
};

// ============ AUTHENTICATION ROUTES ============

// Sign in
router.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Fallback to hardcoded admin for testing without database
      if (username === 'admin' && password === 'admin123') {
        req.session.userId = 'admin-user-id';
        return res.status(200).json({
          message: 'Logged in successfully',
          user: {
            id: 'admin-user-id',
            username: 'admin',
            firstName: 'Enzo',
            lastName: 'Coder',
            email: 'enzocoder87@gmail.com',
            role: 'admin'
          }
        });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user._id;

    res.status(200).json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Sign out
router.post('/signout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// Check authentication status
router.get('/check-auth', async (req, res) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user && user.isActive) {
        res.status(200).json({
          authenticated: true,
          user: {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        });
      } else {
        req.session.destroy();
        res.status(401).json({ authenticated: false });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error checking authentication' });
    }
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// ============ PUBLIC ROUTES ============

// Get all active stacks (public)
router.get('/stacks', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock data if no database connection
  
      return console.log('no connection');
    }

    const { category, featured } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    const stacks = await Stack.find(query)
      .sort({ featured: -1, order: 1, createdAt: -1 })
      .select('-createdBy');

    res.json(stacks);
  } catch (error) {
    console.error('Error fetching stacks:', error);
    res.status(500).json({ message: 'Error fetching stacks' });
  }
});

// Get all active works (public)
router.get('/works', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      // Return mock data if no database connection
      return console.log('no connection');
    }

    const { category, featured, limit } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    let worksQuery = Work.find(query)
      .populate('technologies', 'name color icon category')
      .sort({ featured: -1, order: 1, createdAt: -1 })
      .select('-createdBy');

    if (limit) worksQuery = worksQuery.limit(parseInt(limit));

    const works = await worksQuery;
    res.json(works);
  } catch (error) {
    console.error('Error fetching works:', error);
    res.status(500).json({ message: 'Error fetching works' });
  }
});

// Get single work by ID (public)
router.get('/works/:id', async (req, res) => {
  try {
    const work = await Work.findOne({ _id: req.params.id, isActive: true })
      .populate('technologies', 'name color icon category');

    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    res.json(work);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching work' });
  }
});

// Contact form
router.post('/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

// ============ DASHBOARD ROUTES (Protected) ============

// Dashboard stacks CRUD
router.get('/dashboard/stacks', isAuthenticated, async (req, res) => {
  try {
    const stacks = await Stack.find()
      .populate('createdBy', 'firstName lastName username')
      .sort({ createdAt: -1 });
    res.json(stacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stacks' });
  }
});

router.post('/dashboard/stacks', isAuthenticated, async (req, res) => {
  try {
    const stackData = {
      ...req.body,
      createdBy: req.session.userId
    };

    const stack = new Stack(stackData);
    await stack.save();

    const populatedStack = await Stack.findById(stack._id)
      .populate('createdBy', 'firstName lastName username');

    res.status(201).json(populatedStack);
  } catch (error) {
    res.status(500).json({ message: 'Error creating stack' });
  }
});

router.put('/dashboard/stacks/:id', isAuthenticated, async (req, res) => {
  try {
    const stack = await Stack.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName username');

    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }

    res.json(stack);
  } catch (error) {
    res.status(500).json({ message: 'Error updating stack' });
  }
});

router.delete('/dashboard/stacks/:id', isAuthenticated, async (req, res) => {
  try {
    const stack = await Stack.findByIdAndDelete(req.params.id);
    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }
    res.json({ message: 'Stack deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting stack' });
  }
});

// Dashboard works CRUD
router.get('/dashboard/works', isAuthenticated, async (req, res) => {
  try {
    const works = await Work.find()
      .populate('technologies', 'name color icon')
      .populate('createdBy', 'firstName lastName username')
      .sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching works' });
  }
});

router.post('/dashboard/works', isAuthenticated, async (req, res) => {
  try {
    const workData = {
      ...req.body,
      createdBy: req.session.userId
    };

    const work = new Work(workData);
    await work.save();

    const populatedWork = await Work.findById(work._id)
      .populate('technologies', 'name color icon')
      .populate('createdBy', 'firstName lastName username');

    res.status(201).json(populatedWork);
  } catch (error) {
    res.status(500).json({ message: 'Error creating work' });
  }
});

router.put('/dashboard/works/:id', isAuthenticated, async (req, res) => {
  try {
    const work = await Work.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('technologies', 'name color icon')
    .populate('createdBy', 'firstName lastName username');

    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }

    res.json(work);
  } catch (error) {
    res.status(500).json({ message: 'Error updating work' });
  }
});

router.delete('/dashboard/works/:id', isAuthenticated, async (req, res) => {
  try {
    const work = await Work.findByIdAndDelete(req.params.id);
    if (!work) {
      return res.status(404).json({ message: 'Work not found' });
    }
    res.json({ message: 'Work deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting work' });
  }
});

// User management
router.get('/dashboard/users', isAuthenticated, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.post('/dashboard/users', isAuthenticated, async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Username or email already exists' });
    } else {
      res.status(500).json({ message: 'Error creating user' });
    }
  }
});

router.put('/dashboard/users/:id', isAuthenticated, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user' });
  }
});

router.delete('/dashboard/users/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Profile management
router.get('/dashboard/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

router.put('/dashboard/profile', isAuthenticated, async (req, res) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.session.userId,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

module.exports = router;
