import { getProgress, getBookmarks, getCaseProgress, getUserById, addProgress } from './_db.js';
import { getAuthUser, corsHeaders, json, error } from './_auth.js';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      const user = await getUserById(userId);
      const progress = await getProgress(userId);
      const bookmarks = await getBookmarks(userId);
      const cases = await getCaseProgress(userId);

      // Group progress by topic
      const progressMap = {};
      progress.forEach(p => {
        if (!progressMap[p.topic_id]) progressMap[p.topic_id] = [];
        progressMap[p.topic_id].push(p.question_index);
      });

      // Format bookmarks
      const bookmarkSet = bookmarks.map(b => `${b.topic_id}-${b.question_index}`);

      // Format case progress
      const caseMap = {};
      cases.forEach(c => {
        caseMap[c.case_id] = { completed: c.completed, score: c.score };
      });

      return json(res, {
        user,
        progress: progressMap,
        bookmarks: bookmarkSet,
        cases: caseMap
      });
    }

    if (req.method === 'POST') {
      const { progress, bookmarks } = req.body;
      let progressCount = 0;
      let bookmarkCount = 0;

      // Import progress
      if (progress) {
        for (const [topicId, indices] of Object.entries(progress)) {
          for (const idx of indices) {
            try {
              await sql`
                INSERT INTO progress (user_id, topic_id, question_index)
                VALUES (${userId}, ${topicId}, ${idx})
                ON CONFLICT DO NOTHING
              `;
              progressCount++;
            } catch (e) {}
          }
        }
      }

      // Import bookmarks
      if (bookmarks && Array.isArray(bookmarks)) {
        for (const key of bookmarks) {
          const [topicId, idx] = key.split('-');
          try {
            await sql`
              INSERT INTO bookmarks (user_id, topic_id, question_index)
              VALUES (${userId}, ${topicId}, ${parseInt(idx)})
              ON CONFLICT DO NOTHING
            `;
            bookmarkCount++;
          } catch (e) {}
        }
      }

      return json(res, { success: true, imported: { progressCount, bookmarkCount } });
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Sync error:', err);
    return error(res, 'Sync failed', 500);
  }
}
