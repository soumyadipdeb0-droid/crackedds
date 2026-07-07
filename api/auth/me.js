import { getUserById } from '../_db.js';
import { getAuthUser, corsHeaders, json, error } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method !== 'GET') {
    return error(res, 'Method not allowed', 405);
  }

  try {
    const userId = getAuthUser(req);
    if (!userId) {
      return error(res, 'Unauthorized', 401);
    }

    const user = await getUserById(userId);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    return json(res, { user });
  } catch (err) {
    console.error('Get user error:', err);
    return error(res, 'Failed to get user', 500);
  }
}
