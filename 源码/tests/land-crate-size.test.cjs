const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = name => require('../.test-build/assets/scripts/' + name + '.js');
const { LevelController } = load('level/LevelController');
const { objectPresentation } = load('render/ObjectPresentation');

test('all first-chapter timber crates share one visible and solid size through damage, release and reset', () => {
  const level = new LevelController();
  const reference = objectPresentation(level.objects.objects.find(o => o.id === 'entry-crate'));
  const size = visual => ({ width: visual.width, height: visual.height });
  for (let attempt = 0; attempt < 2; attempt++) {
    const crates = level.objects.objects.filter(o => o.kind === 'wood' || o.kind === 'hanging');
    assert.ok(crates.some(o => o.kind === 'hanging'));
    assert.ok(crates.some(o => o.data.drop === 'rocket'));
    assert.ok(crates.some(o => o.y > level.data.spawn.y && o.kind === 'wood'));
    for (const crate of crates) {
      const center = crate.x + crate.w / 2, foot = crate.y;
      assert.deepEqual(size(objectPresentation(crate)), size(reference), crate.id);
      assert.equal(crate.bounds.w, reference.width, crate.id);
      assert.equal(crate.bounds.h, reference.height, crate.id);
      assert.equal(crate.bounds.x + crate.bounds.w / 2, center, crate.id);
      assert.equal(crate.bounds.y, foot, crate.id);
      crate.takeDamage(1, 1);
      assert.deepEqual(size(objectPresentation(crate)), size(reference), crate.id);
      if (crate.kind === 'hanging') {
        crate.takeDamage(crate.maxHealth, 1);
        assert.ok(crate.triggered && crate.solid && crate.falling, crate.id);
        assert.deepEqual(size(objectPresentation(crate)), size(reference), crate.id);
      }
    }
    level.reset();
  }
});
