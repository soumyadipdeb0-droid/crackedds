import { getProgress, addProgress, removeProgress, getUserById, updateUserStreak } from './_db.js';
import { getAuthUser, corsHeaders, json, error } from './_auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  Object.entries(corsHeaders()).forEach(([k, v]) => res.setHeader(k, v));

  const userId = getAuthUser(req);
  if (!userId) {
    return error(res, 'Unauthorized', 401);
  }

  try {
    if (req.method === 'GET') {
      const progress = await getProgress(userId);
      
      // Group by topic
      const grouped = {};
      progress.forEach(p => {
        if (!grouped[p.topic_id]) grouped[p.topic_id] = [];
        grouped[p.topic_id].push(p.question_index);
      });

      return json(res, { progress: grouped, total: progress.length });
    }

    if (req.method === 'POST') {
      const { topicId, questionIndex } = req.body;

      if (!topicId || questionIndex === undefined) {
        return error(res, 'topicId and questionIndex are required');
      }

      await addProgress(userId, topicId, questionIndex);

      // Update streak
      const user = await getUserById(userId);
      const newStreak = (user.streak || 0) + 1;
      await updateUserStreak(userId, newStreak);

      return json(res, { success: true, streak: newStreak });
    }

    if (req.method === 'DELETE') {
      const { topicId, questionIndex } = req.body;

      if (!topicId || questionIndex === undefined) {
        return error(res, 'topicId and questionIndex are required');
      }

      await removeProgress(userId, topicId, questionIndex);
      return json(res, { success: true });
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Progress error:', err);
    return error(res, 'Failed to process progress', 500);
  }
}
