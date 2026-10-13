import test from 'node:test';
import assert from 'node:assert/strict';

// Missing/incorrect unit conversion corrupts every downstream financial conclusion.
test('normalizes actual value units without treating missing disclosure as zero', async () => {
  const module = await import('../lib/finance.ts').catch(() => null);
  assert.equal(typeof module?.normalizeAmount, 'function', 'normalizeAmount must be implemented');
  const normalize = module!.normalizeAmount;
  assert.equal(normalize('1.25亿', '元'), 125000000);
  assert.equal(normalize('2,345.67万元', '元'), 23456700);
  assert.equal(normalize(null, '元'), null);
  assert.equal(normalize('--', '元'), null);
});

test('rejects business errors even when the HTTP response was successful', async () => {
  const module = await import('../lib/finance.ts').catch(() => null);
  assert.equal(typeof module?.unwrapFuyao, 'function', 'unwrapFuyao must be implemented');
  assert.throws(() => module!.unwrapFuyao({code:2003,message:'permission denied'}), /2003/);
  assert.deepEqual(module!.unwrapFuyao({code:0,data:{item:[{value:12}]}}), [{value:12}]);
});

test('does not report misleading growth when a comparison base is zero or negative', async () => {
  const module = await import('../lib/finance.ts').catch(() => null);
  assert.equal(typeof module?.growth, 'function', 'growth must be implemented');
  assert.equal(module!.growth(120,100),20);
  assert.equal(module!.growth(10,0),null);
  assert.equal(module!.growth(10,-5),null);
});
