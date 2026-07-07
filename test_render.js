
// Replicating the logic from public/index.html
function cleanText(t) {
  return t.replace(/%%/g, '').replace(/<\/?[^>]+(>|$)/g, "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const tests = [
  { input: 'Hello %%world%%', expected: 'Hello world' },
  { input: '<b>Bold</b> text', expected: 'Bold text' },
  { input: '%%<span>Formatted</span>%%', expected: 'Formatted' },
  { input: 'Plain text', expected: 'Plain text' }
];

let passed = 0;
tests.forEach((t, i) => {
  const result = cleanText(t.input);
  if (result === t.expected) {
    console.log(`Test ${i + 1} passed!`);
    passed++;
  } else {
    console.error(`Test ${i + 1} failed. Input: ${t.input}, Expected: ${t.expected}, Got: ${result}`);
  }
});

console.log(`${passed}/${tests.length} tests passed.`);
