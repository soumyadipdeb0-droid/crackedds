import { getBookmarks, toggleBookmark } from './_db.js';
import { getAuthUser, corsHeaders, json, error } from './_auth.js';

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
      const bookmarks = await getBookmarks(userId);
      const bookmarkSet = bookmarks.map(b => `${b.topic_id}-${b.question_index}`);
      return json(res, { bookmarks: bookmarkSet });
    }

    if (req.method === 'POST') {
      const { topicId, questionIndex } = req.body;

      if (!topicId || questionIndex === undefined) {
        return error(res, 'topicId and questionIndex are required');
      }

      const isBookmarked = await toggleBookmark(userId, topicId, questionIndex);
      return json(res, { bookmarked: isBookmarked });
    }

    return error(res, 'Method not allowed', 405);
  } catch (err) {
    console.error('Bookmarks error:', err);
    return error(res, 'Failed to process bookmarks', 500);
  }
}
