import test from 'node:test';
import assert from 'node:assert/strict';
import { canDownload, canGrantBeta, nextPrimaryAction } from '../functions/_lib/policy.mjs';

test('beta limit never grants the eleventh active seat', () => {
  assert.equal(canGrantBeta(9, 10), true);
  assert.equal(canGrantBeta(10, 10), false);
  assert.equal(canGrantBeta(11, 10), false);
});

test('download requires beta access and active release', () => {
  assert.equal(canDownload({ accessStatus: 'beta' }, { isActive: true }), true);
  assert.equal(canDownload({ accessStatus: 'pending' }, { isActive: true }), false);
  assert.equal(canDownload({ accessStatus: 'beta' }, { isActive: false }), false);
  assert.equal(canDownload(null, { isActive: true }), false);
});

test('primary action follows access state', () => {
  assert.equal(nextPrimaryAction({ authenticated:false, accessStatus:'none', betaCount:0, betaLimit:10 }), 'login');
  assert.equal(nextPrimaryAction({ authenticated:true, accessStatus:'pending', betaCount:0, betaLimit:10 }), 'pending');
  assert.equal(nextPrimaryAction({ authenticated:true, accessStatus:'beta', betaCount:10, betaLimit:10 }), 'download');
  assert.equal(nextPrimaryAction({ authenticated:true, accessStatus:'none', betaCount:10, betaLimit:10 }), 'waitlist');
});
