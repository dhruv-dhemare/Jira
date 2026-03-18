const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("./db");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const name = profile.displayName;
        const email = profile.emails[0].value;
        const avatar = profile.photos[0].value;

        let user = await pool.query(
          "SELECT * FROM users WHERE google_id=$1",
          [googleId]
        );

        if (user.rows.length === 0) {
          user = await pool.query(
            "INSERT INTO users (google_id, name, email, avatar) VALUES ($1, $2, $3, $4) RETURNING *",
            [googleId, name, email, avatar]
          );
        }

        return done(null, user.rows[0]);
      } catch (err) {
        console.error(err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;