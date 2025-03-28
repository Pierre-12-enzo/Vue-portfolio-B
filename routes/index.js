require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const nodemailer = require('nodemailer');

// Define Mongoose schemas and models
const stackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }

});
                                                                                                                                                                                                                                                                                                                                                                                                                                                     
const workSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
},
  description: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  username: { type: String, required: true, unique: true },  // Ensure username is unique
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['user', 'Admin', 'moderator'] },  // Example of an enum for role validation
  email: { type: String, required: true, unique: true }
})

const Stack = mongoose.model('stacks', stackSchema);
const Work = mongoose.model('works', workSchema);
const User = mongoose.model('users', userSchema);


// Authentication routes
router.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  console.log('Received username:', username);
  console.log('Received password:', password);
  
  // Authenticate user
  // Replace this with actual user verification logic
  try {
    const user = await User.findOne({username: username, password: password});
    if(!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    //if the user is correct
    req.session.userId = user._id; // Store user ID in session
    res.status(200).json({ message: 'Logged in' });

  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


//check Authentication
router.get('/check-auth', (req, res) => {
  if (req.session.userId) {
    res.status(200).json({ message: 'Authenticated' });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});



// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized access. Please log in.' });
}


// Route to handle sending emails
router.post('/contact', async (req, res) => {
  const { visitorEmail, message } = req.body;

  const userEmail = 'dusenge.enzo87@gmail.com';

  // Validate input
  if (!visitorEmail || !message) {
    return res.status(400).json({ message: 'Visitor email and message are required' });
  }
  console.log('visitor');
  let transporter;
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch (err) {
    console.error('Error setting up email transporter:', err);
    return res.status(500).json({ message: 'Error setting up email transporter' });
  }

  const mailOptions = {
    from: visitorEmail,
    to: userEmail, // Hardcoded recipient email
    subject: 'Message from your Portfolio',
    text: `Message from: ${visitorEmail}\n\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Error sending email', error: err.message });
  }
});









// API route to get 'stack' data
router.get('/stacks', async (req, res) => {
  try {
    const stacks = await Stack.find();
    res.json(stacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stack data', error: error.message });
  }
});

// API route to get 'work' data
router.get('/works', async (req, res) => {
  try {
    const works = await Work.find();
    res.json(works);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching work data', error: error.message });
  }
});

// Dashboard routes with authentication
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.send('Dashboard Page');
});
//Count works and stacks
//function to calculate total
const calculateTotal = async (Model) => {
  try {
    const total = await Model.countDocuments();
    if(!total) {
      console.log('Total not found')
    }
    return total;
  } catch (error) {
    console.log('Error counting error', error.message);
  }
}
//route to count
router.get('/count', isAuthenticated, async (req, res) => {
  try {


    const totalWorks = await calculateTotal(Work);
    const totalStacks = await calculateTotal(Stack);
    res.json({
      totalStacks,
      totalWorks
    })
  } catch (error) {
    console.log(error.message)
  }
})

//Route to calculate progress
//Function to calculate progress
const calculateProgress = async (Model, currentDate) => {
  try {
      // Get the most recent document
      const lastInsertedDocument = await Model.findOne().sort({ _id: -1 });

      if (!lastInsertedDocument) {
          console.error("No documents found in the collection.");
          return 0; // No documents in the collection
      }

      // Ensure the 'date' field exists in the retrieved document
      if (!lastInsertedDocument.date) {
          console.error("The document does not contain a 'date' field:", lastInsertedDocument);
          return 0; // Invalid document structure
      }

      const lastInsertedDate = new Date(lastInsertedDocument.date).getTime();
      const P_initial = 100; // Initial progress in percentage
      const lambda = 0.001; // Adjust for desired decay rate

       // Time elapsed in milliseconds
    const timeElapsed = currentDate - new Date(lastInsertedDate);

    // Convert timeElapsed to hours (or other desired units)
    const t = timeElapsed / (1000 * 60 * 60);

    // Calculate progress
    const progress = P_initial * Math.exp(-lambda * t);

    return progress.toFixed(2);
  } catch (error) {
      console.error("Error calculating progress:", error.message);
      return null;
  }
};
// Endpoint to calculate progress for both collections
router.get('/progress', async (req, res) => {
  const currentDate = new Date();

  try {
      const stackProgress = await calculateProgress(Stack, currentDate);
      const workProgress = await calculateProgress(Work, currentDate);

      res.json({
          stackProgress,
          workProgress,
      });
  } catch (error) {
      console.error('Error calculating progress:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Stack management routes
router.get('/dashboard/stacks', isAuthenticated, async (req, res) => {
  try {
    const stacks = await Stack.find();
    res.json(stacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stack data', error: error.message });
  }
});

router.post('/dashboard/stacks', isAuthenticated, async (req, res) => {
  try {
    const {name, description, link} = req.body;
    const stack = new Stack({
      name: name,
      description: description,
      link: link,
      date: new Date()
    });
    await stack.save();
    res.status(201).json(stack);
  } catch (error) {
    res.status(500).json({ message: 'Error creating stack', error: error.message });
  }
});

router.put('/dashboard/stacks/:id', isAuthenticated, async (req, res) => {
  try {
    const stack = await Stack.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(stack);
  } catch (error) {
    res.status(500).json({ message: 'Error updating stack', error: error.message });
  }
});

router.delete('/dashboard/stacks/:id', isAuthenticated, async (req, res) => {
  try {
    await Stack.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting stack', error: error.message });
  }
});

// Work management routes
router.get('/dashboard/works', isAuthenticated, async (req, res) => {
  try {
    const works = await Work.find();
    res.json(works);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching work data', error: error.message });
  }
});

router.post('/dashboard/works', isAuthenticated, async (req, res) => {
  const {name, description, link} = req.body;
  try {
   const newWork = new Work({
    name: name,
    description: description,
    link: link,
    date: new Date()
   })
   await newWork.save();
   res.status(201).json({ message: 'New Work was added successfully'});
   }catch (error) {
    res.status(500).json({ message: 'Error creating work', error: error.message });
  }
});

router.put('/dashboard/works/:id', isAuthenticated, async (req, res) => {
  try {
    const work = await Work.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(work);
  } catch (error) {
    res.status(500).json({ message: 'Error updating work', error: error.message });
  }
});

router.delete('/dashboard/works/:id', isAuthenticated, async (req, res) => {
  try {
    await Work.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting work', error: error.message });
  }
});

// Route to get session user data
router.get('/dashboard/profile', async (req, res) => {
  try {
    // Check if user is logged in by verifying the session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not logged in' });
    }
// Get user data from database
    const user = await User.findById(req.session.userId).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Updating user
router.put('/dashboard/profile', async (req, res) => {
  try {
    // Check if the user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      req.body,
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with the updated user data
    res.json(updatedUser);

    console.log('Updated user:', updatedUser.username);
  } catch (err) {
    console.error('Error updating user data:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});
//Sending message via email
router.post('/send-email', async (req, res) => {
  try{
    const { to, subject, message } = req.body;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail,  // Use user's email here
        pass: 'your-email-password', // Use an app password or environment variable
      },
    });
  } catch (err) {
    console.log(err);
  }
});
// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', error: err.message });
    }
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
