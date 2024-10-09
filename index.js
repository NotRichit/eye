const express = require('express');
const fs = require('fs');
const session = require('express-session');
const path = require('path'); // Import path module
const app = express();
const port = 3000;

// Admin credentials (can be stored in a secure way or in a database)
const adminCredentials = {
  username: 'admin',
  password: 'password123' // You should hash passwords for better security
};

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// Middleware for session management
app.use(session({
  secret: 'y0ush@lln0tpA$$', // Replace with a strong key in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // For local development; set to `true` in production with HTTPS
}));

// File to store feedback
const feedbackFile = 'feedback.json';

// Route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // Serve index.html
});

// Route to serve contact.html
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html')); // Serve contact.html
});

// Route to serve admin login page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html')); // Serve admin.html
});

// Route to serve admin panel page (accessed after login)
app.get('/adminpanel', isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html')); // Serve admin-panel.html
});

// Endpoint to submit feedback (available for everyone)
app.post('/submit-feedback', (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).send('All fields are required');
  }

  const newFeedback = { name, email, phone, message };

  // Read the current feedback from the file
  fs.readFile(feedbackFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading feedback file:', err);
      return res.status(500).send('Server error');
    }

    let feedbacks = [];

    if (data) {
      feedbacks = JSON.parse(data); // Parse existing feedbacks
    }

    feedbacks.push(newFeedback); // Add new feedback

    // Write the updated feedbacks back to the file
    fs.writeFile(feedbackFile, JSON.stringify(feedbacks, null, 2), (err) => {
      if (err) {
        console.error('Error writing feedback file:', err);
        return res.status(500).send('Server error');
      }

      res.status(200).send('Feedback submitted successfully');
    });
  });
});

// Admin login endpoint
app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;

  // Check if username and password match admin credentials
  if (username === adminCredentials.username && password === adminCredentials.password) {
    // Set a session variable to track login state
    req.session.isAdmin = true;
    return res.status(200).send('Admin login successful');
  }

  return res.status(401).send('Invalid username or password');
});

// Admin logout endpoint
app.post('/admin-logout', (req, res) => {
  req.session.destroy(); // Destroy the admin session
  res.status(200).send('Admin logged out');
});

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  return res.status(403).send('Access denied');
}

// Admin panel feedback retrieval (only accessible to admin)
app.get('/get-feedback', isAdmin, (req, res) => {
  fs.readFile(feedbackFile, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading feedback file:', err);
      return res.status(500).send('Server error');
    }

    const feedbacks = data ? JSON.parse(data) : [];
    res.status(200).json(feedbacks); // Send feedbacks as JSON
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});