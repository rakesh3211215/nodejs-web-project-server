const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  // userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    let existingUser = await User.findOne({ googleId: profile.id });

    if (existingUser) {
      return done(null, existingUser);
    }

    // 🔐 Generate a dummy password (hash of profile.id + secret)
    const randomPassword = profile.id + process.env.GOOGLE_CLIENT_SECRET;
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const newUser = await User.create({
      googleId: profile.id,
      firstName: profile.name.givenName || '',
      lastName: profile.name.familyName || '',
      email: email || '',
      displayName: profile.displayName || '',
      photo: profile.photos?.[0]?.value || '',
      password: hashedPassword, // add dummy password
      role: 'User',
      status: 'active',
    });

    return done(null, newUser);
  } catch (err) {
    console.error('Google Strategy Error:', err);
    done(err, null);
  }
}));
