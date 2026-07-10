import { getJobs, createJob } from './_db.js';
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
      const jobs = await getJobs();
      return json(res, { jobs });
    }

    if (req.method === 'POST') {
      const { title, company, location, roleType, salary, description, requirements, link, tags } = req.body;

      if (!title || !company || !location || !roleType || !salary || !description || !requirements || !link) {
        return error(res, 'Missing required job fields', 400);
      }

      const job = await createJob({ title, company, location, roleType, salary, description, requirements, link, tags: tags || '' });
      return json(res, { job });
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Jobs API Error:', err);
    return error(res, 'Failed to process jobs operations', 500);
  }
}
