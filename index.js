const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// 🧠 Load Passport strategy
require('./auth/google'); // Google OAuth strategy config

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// ✅ CORS for React frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session config (using express-session)
app.use(session({
  secret: process.env.GOOGLE_CLIENT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 86400000,
    secure: false // true only with HTTPS
  }
}));

// ✅ Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use('/users', require('./routes/userRoutes'));

// ✅ Google OAuth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    console.log('✅ Google Auth Success:', req.user?.displayName || 'No user');
    res.redirect('http://localhost:5173/admin'); // Change to actual frontend route
  }
);

// ✅ Logout Route
app.get('/logout', (req, res) => {
  req.logout?.(() => {
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Logout Error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.redirect('http://localhost:5173/login');
    });
  });
});

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
