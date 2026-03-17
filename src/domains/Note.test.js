import * as Note from './Note.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
  } else {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, `${message} (expected ${expected}, got ${actual})`);
}

// --- Factory Tests ---
console.log('\n=== Factory Tests ===');

const projectId = 'project_abc';

const note1 = Note.createNote(projectId, 'First note', '');
const note2 = Note.createNote(projectId, 'Second note', 'https://example.com');

assert(note1.id !== note2.id, 'createNote generates unique IDs');
assert(note1.id.startsWith('note_'), 'createNote id has note_ prefix');
assertEqual(note1.projectId, projectId, 'Note has correct projectId');
assertEqual(note1.content, 'First note', 'Note has correct content');
assertEqual(note1.link, '', 'Note link defaults to empty string when not provided');
assertEqual(note2.link, 'https://example.com', 'Note stores link when provided');
assert(typeof note1.createdAt === 'string', 'Note has createdAt string');
assert(typeof note1.updatedAt === 'string', 'Note has updatedAt string');

// Whitespace trimming
const trimmedNote = Note.createNote(projectId, '  trimmed content  ', '  https://trim.com  ');
assertEqual(trimmedNote.content, 'trimmed content', 'createNote trims content whitespace');
assertEqual(trimmedNote.link, 'https://trim.com', 'createNote trims link whitespace');

// Validation: missing projectId
try {
  Note.createNote(null, 'content', '');
  assert(false, 'createNote throws when projectId is null');
} catch (e) {
  assert(e.message === 'Note must belong to a project', 'createNote throws correct message for missing projectId');
}

try {
  Note.createNote('', 'content', '');
  assert(false, 'createNote throws when projectId is empty string');
} catch (e) {
  assert(e.message === 'Note must belong to a project', 'createNote throws for empty string projectId');
}

// Validation: empty content
try {
  Note.createNote(projectId, '', '');
  assert(false, 'createNote throws when content is empty');
} catch (e) {
  assert(e.message === 'Note content cannot be empty', 'createNote throws correct message for empty content');
}

try {
  Note.createNote(projectId, '   ', '');
  assert(false, 'createNote throws when content is whitespace-only');
} catch (e) {
  assert(e.message === 'Note content cannot be empty', 'createNote throws for whitespace-only content');
}

// --- Cache Tests ---
console.log('\n=== Cache Tests ===');

const cachedNote = Note.getNote(note1.id);
assert(cachedNote !== undefined, 'getNote returns note for known id');
assertEqual(cachedNote.id, note1.id, 'getNote returns correct note');

const missNote = Note.getNote('note_unknown_123');
assertEqual(missNote, undefined, 'getNote returns undefined for unknown id');

// --- Project Index Tests ---
console.log('\n=== Project Index Tests ===');

const projectNotes = Note.getNotesByProjectId(projectId);
assert(Array.isArray(projectNotes), 'getNotesByProjectId returns an array');
assert(projectNotes.length >= 3, 'getNotesByProjectId returns all notes for project');

const otherProjectNotes = Note.getNotesByProjectId('project_other');
assertEqual(otherProjectNotes.length, 0, 'getNotesByProjectId returns empty array for unknown project');

// Isolation: notes from other project not in results
const otherNote = Note.createNote('project_other', 'Other project note', '');
const filteredNotes = Note.getNotesByProjectId(projectId);
assert(!filteredNotes.find(n => n.id === otherNote.id), 'getNotesByProjectId does not include notes from other projects');

// --- Sort Order Tests ---
console.log('\n=== Sort Order Tests ===');

Note._resetCacheForTesting();

const sortProjectId = 'project_sort';
const oldNote = Note.createNote(sortProjectId, 'Older note', '');
// Small delay simulation via string comparison (createdAt is ISO string)
const newNote = Note.createNote(sortProjectId, 'Newer note', '');

const sorted = Note.getNotesByProjectId(sortProjectId);
assertEqual(sorted.length, 2, 'Sort: correct number of notes returned');
assertEqual(sorted[0].id, oldNote.id, 'Sort: older note appears first');
assertEqual(sorted[1].id, newNote.id, 'Sort: newer note appears second');

// --- Update Tests ---
console.log('\n=== Update Tests ===');

Note._resetCacheForTesting();

const updateProjectId = 'project_update';
const noteToUpdate = Note.createNote(updateProjectId, 'Original content', 'https://original.com');
const originalUpdatedAt = noteToUpdate.updatedAt;

// Wait a tick to ensure updatedAt changes
const updatedNote = Note.updateNote(noteToUpdate.id, { content: 'Updated content' });
assertEqual(updatedNote.content, 'Updated content', 'updateNote updates content');
assertEqual(updatedNote.link, 'https://original.com', 'updateNote preserves link when not in updates');

const updatedWithLink = Note.updateNote(noteToUpdate.id, { link: 'https://new.com' });
assertEqual(updatedWithLink.link, 'https://new.com', 'updateNote updates link independently');
assertEqual(updatedWithLink.content, 'Updated content', 'updateNote preserves content when updating link');

const clearedLink = Note.updateNote(noteToUpdate.id, { link: '' });
assertEqual(clearedLink.link, '', 'updateNote can clear link to empty string');

// updateNote trims content
const trimUpdate = Note.updateNote(noteToUpdate.id, { content: '  trimmed update  ' });
assertEqual(trimUpdate.content, 'trimmed update', 'updateNote trims content whitespace');

// updateNote throws on empty content
try {
  Note.updateNote(noteToUpdate.id, { content: '' });
  assert(false, 'updateNote throws when content becomes empty');
} catch (e) {
  assert(e.message === 'Note content cannot be empty', 'updateNote throws correct message for empty content');
}

try {
  Note.updateNote(noteToUpdate.id, { content: '   ' });
  assert(false, 'updateNote throws when content is whitespace-only');
} catch (e) {
  assert(e.message === 'Note content cannot be empty', 'updateNote throws for whitespace-only content');
}

// updateNote throws for unknown id
try {
  Note.updateNote('note_nonexistent', { content: 'x' });
  assert(false, 'updateNote throws for unknown id');
} catch (e) {
  assert(e.message === 'Note not found', 'updateNote throws correct message for unknown id');
}

// --- Delete Tests ---
console.log('\n=== Delete Tests ===');

Note._resetCacheForTesting();

const deleteProjectId = 'project_delete';
const noteA = Note.createNote(deleteProjectId, 'Note A', '');
const noteB = Note.createNote(deleteProjectId, 'Note B', '');
const noteC = Note.createNote(deleteProjectId, 'Note C', '');

const deleteResult = Note.deleteNote(noteA.id);
assert(deleteResult === true, 'deleteNote returns true on success');
assertEqual(Note.getNote(noteA.id), undefined, 'deleteNote removes note from cache');

const remaining = Note.getNotesByProjectId(deleteProjectId);
assert(!remaining.find(n => n.id === noteA.id), 'deleteNote removes note from project index');
assertEqual(remaining.length, 2, 'deleteNote does not affect sibling notes');
assert(remaining.find(n => n.id === noteB.id) !== undefined, 'Sibling note B still present after delete');
assert(remaining.find(n => n.id === noteC.id) !== undefined, 'Sibling note C still present after delete');

// deleteNote throws for unknown id
try {
  Note.deleteNote('note_nonexistent');
  assert(false, 'deleteNote throws for unknown id');
} catch (e) {
  assert(e.message === 'Note not found', 'deleteNote throws correct message for unknown id');
}

// --- Reset Tests ---
console.log('\n=== Reset Tests ===');

Note._resetCacheForTesting();
const afterReset = Note.getNotesByProjectId(deleteProjectId);
assertEqual(afterReset.length, 0, '_resetCacheForTesting clears project index');
assertEqual(Note.getNote(noteB.id), undefined, '_resetCacheForTesting clears note cache');

// --- parseLinkField Tests ---
console.log('\n=== parseLinkField Tests ===');

// Empty / null
assertEqual(Note.parseLinkField(''), null, 'parseLinkField returns null for empty string');
assertEqual(Note.parseLinkField('   '), null, 'parseLinkField returns null for whitespace-only');
assertEqual(Note.parseLinkField(null), null, 'parseLinkField returns null for null');

// Plain URL
const plainResult = Note.parseLinkField('https://example.com');
assertEqual(plainResult.url, 'https://example.com', 'parseLinkField plain URL: url correct');
assertEqual(plainResult.label, null, 'parseLinkField plain URL: label is null');

// Markdown [label](url)
const mdResult = Note.parseLinkField('[Google](https://google.com)');
assertEqual(mdResult.url, 'https://google.com', 'parseLinkField markdown: url correct');
assertEqual(mdResult.label, 'Google', 'parseLinkField markdown: label correct');

// Markdown with whitespace in label
const mdTrimResult = Note.parseLinkField('[  My Label  ](https://example.com)');
assertEqual(mdTrimResult.label, 'My Label', 'parseLinkField markdown: label trimmed');

// --- normalizeLinkField Tests (via createNote/updateNote) ---
console.log('\n=== normalizeLinkField Tests ===');

Note._resetCacheForTesting();
const normProjectId = 'project_norm';

// Plain URL without protocol gets https://
const noteNoProtocol = Note.createNote(normProjectId, 'No protocol', 'example.com');
assertEqual(noteNoProtocol.link, 'https://example.com', 'createNote normalizes plain URL without protocol');

// Plain URL with http:// preserved
const noteHttp = Note.createNote(normProjectId, 'Http', 'http://example.com');
assertEqual(noteHttp.link, 'http://example.com', 'createNote preserves http:// protocol');

// Plain URL with https:// unchanged
const noteHttps = Note.createNote(normProjectId, 'Https', 'https://example.com');
assertEqual(noteHttps.link, 'https://example.com', 'createNote preserves https:// protocol');

// Empty link stored as empty string
const noteNoLink = Note.createNote(normProjectId, 'No link', '');
assertEqual(noteNoLink.link, '', 'createNote stores empty string for no link');

// Markdown syntax: URL without protocol gets normalized inside brackets
const noteMd = Note.createNote(normProjectId, 'Markdown', '[Google](google.com)');
assertEqual(noteMd.link, '[Google](https://google.com)', 'createNote normalizes URL inside markdown syntax');

// Markdown syntax: URL with protocol unchanged
const noteMdFull = Note.createNote(normProjectId, 'Markdown full', '[Google](https://google.com)');
assertEqual(noteMdFull.link, '[Google](https://google.com)', 'createNote preserves https:// inside markdown syntax');

// updateNote also normalizes
Note.updateNote(noteNoProtocol.id, { link: 'updated.com' });
assertEqual(Note.getNote(noteNoProtocol.id).link, 'https://updated.com', 'updateNote normalizes plain URL without protocol');

Note.updateNote(noteMd.id, { link: '[Updated](updated.com)' });
assertEqual(Note.getNote(noteMd.id).link, '[Updated](https://updated.com)', 'updateNote normalizes URL inside markdown syntax');

// --- Summary ---
console.log(`\n=== Test Summary ===`);
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);

if (testsFailed > 0) {
  process.exit(1);
}
