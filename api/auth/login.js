import { getUserByEmail } from '../_db.js';
import { verifyPassword, generateToken, corsHeaders, json, error } from '../_auth.js';

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
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required');
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    if (!user.password_hash) {
      return error(res, 'This account uses Google sign-in', 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user.id);

    return json(res, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        streak: user.streak
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed', 500);
  }
}
