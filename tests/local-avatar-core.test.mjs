import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAvatarMode, isLocalAvatarMode, localMissing, normalizeAvatarState } from '../local-avatar-core.mjs';

test('new installs default to local while legacy Vivix settings stay Vivix', () => {
  assert.equal(normalizeAvatarMode(undefined, false), 'local');
  assert.equal(normalizeAvatarMode(undefined, true), 'vivix');
  assert.equal(isLocalAvatarMode({ avatarMode: 'local' }), true);
  assert.equal(isLocalAvatarMode({ avatarMode: 'vivix' }), false);
});

test('local validation never requires Vivix', () => {
  assert.deepEqual(localMissing({ aiMode:'api', llmBase:'https://api.deepseek.com', llmKey:'x', llmModel:'deepseek-chat', localCharImg:'data:image/jpeg;base64,x' }), []);
});

test('invalid visual state safely returns idle', () => {
  assert.equal(normalizeAvatarState('speaking'), 'speaking');
  assert.equal(normalizeAvatarState('wat'), 'idle');
});
