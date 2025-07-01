const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

// ✅ Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const displayName = `${firstName} ${lastName}`;

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      displayName,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ✅ Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.googleId) {
      return res.status(401).json({ message: 'Use Google login for this account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const { password: _, ...safeUser } = user.toObject();

    res.status(200).json({
      message: 'Login successful',
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ✅ Get All Users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// ✅ Get Single User
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// ✅ Update User
router.put('/:id', async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// ✅ Delete User
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ✅ Profile Route (Authenticated)
router.get('/profile', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = req.session.user;

    res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



module.exports = router;
