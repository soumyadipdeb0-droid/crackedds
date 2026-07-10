import { getEvents, createEvent } from './_db.js';
import { corsHeaders, json, error } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  try {
    if (req.method === 'GET') {
      const events = await getEvents();
      return json(res, { events });
    }

    if (req.method === 'POST') {
      const { title, description, type, date, organizer, link, tags } = req.body;

      if (!title || !description || !type || !date || !organizer || !link) {
        return error(res, 'Missing required event fields', 400);
      }

      const event = await createEvent({ title, description, type, date, organizer, link, tags: tags || '' });
      return json(res, { event });
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Events API Error:', err);
    return error(res, 'Failed to process events operations', 500);
  }
}
