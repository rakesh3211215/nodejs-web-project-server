const express = require('express');
const passport = require('passport');
const cookieSession = require('cookie-session');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
require('./auth/google');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔌 MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));

// 🔐 Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());

// ✅ Replace express-session with cookie-session
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'default_cookie_key'],
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    secure: false, // set to true if using HTTPS
    httpOnly: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 🛣 Routes
app.use('/users', require('./routes/userRoutes'));

// 🌐 Google OAuth
app.get('/auth/google',
    passport.authenticate('google', {scope: ['profile', 'email']})
);

app.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect: '/'}),
    (req, res) => {
        console.log('✅ Google Auth Success:', req.user?.displayName || 'No name');
        res.redirect('http://localhost:5173/admin');
    }
);

// 👤 Profile Route
app.get('/profile', (req, res) => {
    if (!req.user) return res.status(401).json({message: 'Unauthorized'});
    res.json(req.user);
});

// 🚪 Logout
app.get('/logout', (req, res) => {
    req.logout(() => {
        req.session = null; // ✅ Clear cookie-session
        res.redirect('http://localhost:5173/login');
    });
});

app.get('/', (req, res) => {
    res.send('✅ API is running...');
});
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
