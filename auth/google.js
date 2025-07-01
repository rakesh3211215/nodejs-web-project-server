const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// 🔐 Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 🔐 Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// 🚀 Google OAuth Strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const googleId = profile.id;

      // 🧠 Check if user already exists
      let existingUser = await User.findOne({ googleId });
      if (existingUser) return done(null, existingUser);

      // 🔐 Generate dummy password
      const randomPassword = googleId + process.env.GOOGLE_CLIENT_SECRET;
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // 📛 Auto-generate username
      const username = (email?.split('@')[0]?.toLowerCase() || `user${Date.now()}`).replace(/[^a-z0-9]/gi, '');

      // 🆕 Create new user
      const newUser = await User.create({
        googleId,
        email: email || '',
        username,
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        displayName: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
        photo: profile.photos?.[0]?.value || '',
        password: hashedPassword,
        role: 'User',
        status: 'active',
      });

      return done(null, newUser);
    } catch (err) {
      console.error('❌ Google Strategy Error:', err);
      return done(err, null);
    }
  }
));
