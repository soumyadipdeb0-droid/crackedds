import { createUser, getUserByEmail } from '../_db.js';
import { hashPassword, generateToken, corsHeaders, json, error } from '../_auth.js';

export default async function handler(req, res) {
  // CORS
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
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return error(res, 'Email, password, and name are required');
    }

    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters');
    }

    if (!email.includes('@') || !email.includes('.')) {
      return error(res, 'Invalid email format');
    }

    // Check existing
    const existing = await getUserByEmail(email);
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash, name });
    const token = generateToken(user.id);

    return json(res, { user, token }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Registration failed', 500);
  }
}
