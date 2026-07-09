// assert-based lightweight test suite for CrackedDS backend/local operations
const assert = require('assert');

// Simple mock S state object
const S = {
  streak: 5
};

// Mock localStorage
const localStoreData = {};
global.localStorage = {
  getItem: (key) => localStoreData[key] || null,
  setItem: (key, val) => { localStoreData[key] = String(val); },
  removeItem: (key) => { delete localStoreData[key]; },
  clear: () => { Object.keys(localStoreData).forEach(k => delete localStoreData[k]); }
};

// Mock DOM elements
global.document = {
  getElementById: () => ({ value: '', focus: () => {}, click: () => {} })
};

// 1. Mock Database Forum data mock helper
function getForumData() {
  const saved = localStorage.getItem('ck_forum_posts');
  return saved ? JSON.parse(saved) : [];
}

function saveForumData(posts) {
  localStorage.setItem('ck_forum_posts', JSON.stringify(posts));
}

// 2. getUserKarma implementation under test
function getUserKarma(email) {
  const posts = getForumData();
  let karma = 0;
  posts.forEach(p => {
    if (p.authorEmail === email) {
      karma += Math.max(0, p.upvotes - 1) * 10;
    }
    p.comments.forEach(c => {
      if (c.authorEmail === email) {
        karma += (c.upvotes || 0) * 5;
      }
    });
  });
  return karma;
}

// --- RUN TESTS ---
console.log('Running test suite...');

try {
  // Test 1: User starts with 0 karma
  localStorage.clear();
  assert.strictEqual(getUserKarma('test@example.com'), 0, 'Initial karma should be 0');
  console.log('✓ Test 1 Passed: Initial Karma is 0');

  // Test 2: User receives points for upvotes on their posts
  const mockPosts = [
    {
      id: 1,
      title: 'Google Interview',
      content: 'Shared questions...',
      authorEmail: 'test@example.com',
      upvotes: 3, // 2 upvotes from others
      comments: []
    }
  ];
  saveForumData(mockPosts);
  assert.strictEqual(getUserKarma('test@example.com'), 20, 'Karma from 2 external upvotes should be 20');
  console.log('✓ Test 2 Passed: Post upvotes correctly award karma');

  // Test 3: User receives points for upvotes on comments
  mockPosts[0].comments.push({
    id: 1,
    content: 'Very helpful post!',
    authorEmail: 'test@example.com',
    upvotes: 2 // 2 upvotes from others
  });
  saveForumData(mockPosts);
  assert.strictEqual(getUserKarma('test@example.com'), 30, 'Karma should be 30 (20 from post + 10 from comment)');
  console.log('✓ Test 3 Passed: Comment upvotes correctly award karma');

  console.log('\nAll tests completed successfully!');
} catch (e) {
  console.error('\nTest Suite Failed:', e.message);
  process.exit(1);
}
