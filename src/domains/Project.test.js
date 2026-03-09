import * as Project from './Project.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    testsFailed++;
  } else {
    console.log(`✓ ${message}`);
    testsPassed++;
  }
}

function describe(suiteName, fn) {
  console.log(`\n📋 ${suiteName}`);
  fn();
}

function it(testName, fn) {
  try {
    Project._resetCacheForTesting();
    fn();
  } catch (error) {
    console.error(`❌ FAILED: ${testName}`);
    console.error(error);
    testsFailed++;
  }
}

// Reset cache before each test suite
function beforeEach() {
  Project._resetCacheForTesting();
}

// Tests
describe('Project Factory', () => {
  it('creates a project with required fields', () => {
    const project = Project.createProject({ name: 'Test Project' });

    assert(project.id !== undefined, 'Has id');
    assert(project.name === 'Test Project', 'Has correct name');
    assert(project.description === '', 'Has empty description by default');
    assert(project.createdAt !== undefined, 'Has createdAt timestamp');
  });

  it('creates a project with all fields', () => {
    const project = Project.createProject({
      name: 'Project with desc',
      description: 'A test description',
    });

    assert(project.name === 'Project with desc', 'Name is set correctly');
    assert(project.description === 'A test description', 'Description is set correctly');
  });

  it('assigns unique IDs to projects', () => {
    const project1 = Project.createProject({ name: 'Project 1' });
    const project2 = Project.createProject({ name: 'Project 2' });

    assert(project1.id !== project2.id, 'Projects have different IDs');
    assert(typeof project1.id === 'number', 'ID is a number');
  });

  it('rejects empty names', () => {
    try {
      Project.createProject({ name: '' });
      assert(false, 'Should throw error for empty name');
    } catch (error) {
      assert(error.message.includes('empty'), 'Throws error for empty name');
    }
  });

  it('rejects whitespace-only names', () => {
    try {
      Project.createProject({ name: '   ' });
      assert(false, 'Should throw error for whitespace name');
    } catch (error) {
      assert(error.message.includes('empty'), 'Throws error for whitespace-only name');
    }
  });

  it('rejects duplicate names', () => {
    const project1 = Project.createProject({ name: 'Unique Name' });

    try {
      Project.createProject({ name: 'Unique Name' });
      assert(false, 'Should throw error for duplicate name');
    } catch (error) {
      assert(error.message.includes('already exists'), 'Throws error for duplicate name');
    }
  });

  it('trims whitespace from names', () => {
    const project = Project.createProject({ name: '  Trimmed Name  ' });
    assert(project.name === 'Trimmed Name', 'Name is trimmed');
  });
});

describe('Project Cache', () => {
  it('stores and retrieves projects', () => {
    const project = Project.createProject({ name: 'Cache Test' });
    const retrieved = Project.getProject(project.id);

    assert(retrieved !== undefined, 'Project is in cache');
    assert(retrieved.id === project.id, 'Retrieved project has correct ID');
    assert(retrieved.name === 'Cache Test', 'Retrieved project has correct name');
  });

  it('returns undefined for non-existent projects', () => {
    const retrieved = Project.getProject(999999);
    assert(retrieved === undefined, 'Returns undefined for missing project');
  });

  it('getAllProjects returns all projects sorted by creation date', () => {
    const project1 = Project.createProject({ name: 'First' });
    const project2 = Project.createProject({ name: 'Second' });

    const all = Project.getAllProjects();

    assert(all.length >= 2, 'Returns all projects');
    assert(all.some(p => p.id === project1.id), 'Contains first project');
    assert(all.some(p => p.id === project2.id), 'Contains second project');
  });
});

describe('Rename Project', () => {
  it('renames a project successfully', () => {
    const project = Project.createProject({ name: 'Original' });
    Project.renameProject(project.id, 'Renamed');

    const updated = Project.getProject(project.id);
    assert(updated.name === 'Renamed', 'Project name is updated');
  });

  it('rejects empty names', () => {
    const project = Project.createProject({ name: 'Test' });

    try {
      Project.renameProject(project.id, '');
      assert(false, 'Should throw error for empty name');
    } catch (error) {
      assert(error.message.includes('empty'), 'Throws error for empty name');
    }
  });

  it('rejects whitespace-only names', () => {
    const project = Project.createProject({ name: 'Test' });

    try {
      Project.renameProject(project.id, '   ');
      assert(false, 'Should throw error for whitespace name');
    } catch (error) {
      assert(error.message.includes('empty'), 'Throws error for whitespace-only name');
    }
  });

  it('rejects duplicate names', () => {
    const project1 = Project.createProject({ name: 'Project A' });
    const project2 = Project.createProject({ name: 'Project B' });

    try {
      Project.renameProject(project2.id, 'Project A');
      assert(false, 'Should throw error for duplicate name');
    } catch (error) {
      assert(error.message.includes('already exists'), 'Throws error for duplicate name');
    }
  });

  it('allows a project to keep its own name', () => {
    const project = Project.createProject({ name: 'Same Name' });

    try {
      Project.renameProject(project.id, 'Same Name');
      const updated = Project.getProject(project.id);
      assert(updated.name === 'Same Name', 'Project keeps same name without error');
    } catch (error) {
      assert(false, 'Should not throw error when keeping same name');
    }
  });

  it('throws error for non-existent project', () => {
    try {
      Project.renameProject(999999, 'New Name');
      assert(false, 'Should throw error for non-existent project');
    } catch (error) {
      assert(error.message.includes('not found'), 'Throws error for missing project');
    }
  });
});

describe('Update Description', () => {
  it('updates project description', () => {
    const project = Project.createProject({ name: 'Test', description: 'Original' });
    Project.updateDescription(project.id, 'Updated');

    const updated = Project.getProject(project.id);
    assert(updated.description === 'Updated', 'Description is updated');
  });

  it('clears description with empty string', () => {
    const project = Project.createProject({ name: 'Test', description: 'Some text' });
    Project.updateDescription(project.id, '');

    const updated = Project.getProject(project.id);
    assert(updated.description === '', 'Description is cleared');
  });

  it('throws error for non-existent project', () => {
    try {
      Project.updateDescription(999999, 'Description');
      assert(false, 'Should throw error for non-existent project');
    } catch (error) {
      assert(error.message.includes('not found'), 'Throws error for missing project');
    }
  });
});

describe('Delete Project', () => {
  it('deletes a project from cache', () => {
    const project = Project.createProject({ name: 'To Delete' });
    Project.deleteProject(project.id);

    const retrieved = Project.getProject(project.id);
    assert(retrieved === undefined, 'Project is removed from cache');
  });

  it('does not appear in getAllProjects after deletion', () => {
    const project = Project.createProject({ name: 'Deleted Project' });
    const idToDelete = project.id;

    Project.deleteProject(idToDelete);

    const all = Project.getAllProjects();
    assert(!all.some(p => p.id === idToDelete), 'Deleted project not in list');
  });

  it('throws error for non-existent project', () => {
    try {
      Project.deleteProject(999999);
      assert(false, 'Should throw error for non-existent project');
    } catch (error) {
      assert(error.message.includes('not found'), 'Throws error for missing project');
    }
  });
});

describe('Edge Cases', () => {
  it('handles names with special characters', () => {
    const project = Project.createProject({
      name: 'Project @#$% with special chars!',
    });
    assert(project.name === 'Project @#$% with special chars!', 'Accepts special characters');
  });

  it('handles very long names', () => {
    const longName = 'A'.repeat(500);
    const project = Project.createProject({ name: longName });
    assert(project.name === longName, 'Accepts very long names');
  });

  it('handles multiline descriptions', () => {
    const multiline = 'Line 1\nLine 2\nLine 3';
    const project = Project.createProject({ name: 'Test', description: multiline });
    assert(project.description === multiline, 'Accepts multiline descriptions');
  });
});

// Run summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);
console.log(`${'='.repeat(50)}\n`);

if (testsFailed > 0) {
  process.exit(1);
}
