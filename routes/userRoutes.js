const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');

// ✅ Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: password ? password : hashedPassword,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});
// ✅ Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('🔐 Login attempt:', email);

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Look for the user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    // Handle Google users (no local password)
    if (user.googleId) {
      console.log('⚠️ Google account detected. Use Google Sign-In.');
      return res.status(401).json({ message: 'Use Google login for this account' });
    }

    // Debug logs
    console.log('Entered password:', password);
    console.log('Stored hashed password:', user.password);

    // Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Store user info in session (optional)
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    // Send user info without password
    const { password: _, ...safeUser } = user.toObject();

    console.log('✅ Login successful for:', email);
    res.status(200).json({
      message: 'Login successful',
      user: safeUser
    });

  } catch (err) {
    console.error('⚠️ Server error during login:', err);
    res.status(500).json({ message: 'Server error' });
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
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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

module.exports = router;
