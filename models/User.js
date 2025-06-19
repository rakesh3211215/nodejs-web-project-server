const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: { type: String, trim: true },
  phone: { type: String, trim: true },
  password: { type: String },
  googleId: { type: String },
  displayName: { type: String },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
