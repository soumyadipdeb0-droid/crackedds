import { createUser, getUserByEmail, getUserByGoogleId, updateUserGoogleId } from '../_db.js';
import { verifyGoogleToken, generateToken, corsHeaders, json, error } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'POST') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    const { idToken } = req.body;

    if (!idToken) {
      return error(res, 'Google ID token is required');
    }

    const googleUser = await verifyGoogleToken(idToken);

    // Check if user exists by Google ID
    let user = await getUserByGoogleId(googleUser.googleId);

    if (!user) {
      // Check by email
      user = await getUserByEmail(googleUser.email);

      if (user) {
        // Link Google account
        await updateUserGoogleId(user.id, googleUser.googleId, googleUser.avatar);
      } else {
        // Create new user
        user = await createUser({
          email: googleUser.email,
          name: googleUser.name,
          provider: 'google',
          googleId: googleUser.googleId,
          avatar: googleUser.avatar
        });
      }
    }

    const token = generateToken(user.id);

    return json(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider || 'google',
        streak: user.streak || 0
      },
      token
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return error(res, err.message || 'Google authentication failed', 401);
  }
}
