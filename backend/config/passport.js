const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure Google OAuth Strategy
const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy-client-id';
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-client-secret';

passport.use(new GoogleStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: '/api/auth/google/callback',
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;
      const name = profile.displayName;
      const profileImage = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

      // Check if user exists by Google ID
      let user = await User.findByGoogleId(googleId);
      
      if (!user) {
        // Check if user exists by email (link Google account if they signed up traditionally first)
        user = await User.findByEmail(email);
        
        if (user) {
          // Update existing user with google_id and profile_image
          const updates = { google_id: googleId };
          if (!user.profile_image) {
            updates.profile_image = profileImage;
          }
          if (!user.email_verified) {
            updates.email_verified = 1;
          }
          await User.update(user.user_id, updates);
          user = await User.findById(user.user_id);
        } else {
          // Create new user via Google
          const newUserId = await User.create({
            name,
            email,
            google_id: googleId,
            profile_image: profileImage,
            email_verified: true, // Google emails are already pre-verified by Google
            role: 'customer'
          });
          user = await User.findById(newUserId);
        }
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
