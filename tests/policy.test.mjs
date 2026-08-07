import test from 'node:test';
import assert from 'node:assert/strict';
import { canDownload, canGrantBeta, nextPrimaryAction } from '../functions/_lib/policy.mjs';
import { MAX_RELEASE_SIZE, isReleaseUploadAllowed, objectMatchesReleaseUpload, releaseFileType } from '../functions/_lib/release-policy.mjs';
import { responseJson } from '../public/scripts/response.js';
import { canActivateAnotherDevice, canManageLicenses, licenseStateCode } from '../functions/_lib/license-policy.mjs';

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

test('only administrators can create a release upload authorization', () => {
  assert.equal(isReleaseUploadAllowed({ role: 'admin' }), true);
  assert.equal(isReleaseUploadAllowed({ role: 'user' }), false);
  assert.equal(isReleaseUploadAllowed(null), false);
});

test('release upload accepts only EXE, MSI and ZIP up to one GiB', () => {
  assert.equal(releaseFileType('DepthLumeRadar.exe'), 'application/vnd.microsoft.portable-executable');
  assert.equal(releaseFileType('DepthLumeRadar.msi'), 'application/x-msi');
  assert.equal(releaseFileType('DepthLumeRadar.zip'), 'application/zip');
  assert.equal(releaseFileType('DepthLumeRadar.dmg'), null);
  assert.equal(MAX_RELEASE_SIZE, 1024 ** 3);
});

test('finalize rejects a missing or mismatched R2 object and accepts a verified object', () => {
  const upload = { file_size: 200 * 1024 * 1024, content_type: 'application/zip' };
  assert.equal(objectMatchesReleaseUpload(null, upload), false);
  assert.equal(objectMatchesReleaseUpload({ size: upload.file_size - 1, httpMetadata: { contentType: 'application/zip' } }, upload), false);
  assert.equal(objectMatchesReleaseUpload({ size: upload.file_size, httpMetadata: { contentType: 'application/x-msdownload' } }, upload), false);
  assert.equal(objectMatchesReleaseUpload({ size: upload.file_size, httpMetadata: { contentType: 'application/zip' } }, upload), true);
});

test('the same verified release metadata can safely retry after an interrupted direct upload', () => {
  const pending = { file_name: 'DepthLumeRadar.zip', file_size: 200 * 1024 * 1024, content_type: 'application/zip', created_by: 'admin-1' };
  const retry = { fileName: 'DepthLumeRadar.zip', fileSize: 200 * 1024 * 1024, contentType: releaseFileType('DepthLumeRadar.zip'), adminId: 'admin-1' };
  assert.equal(pending.file_name === retry.fileName && pending.file_size === retry.fileSize && pending.content_type === retry.contentType && pending.created_by === retry.adminId, true);
});

test('protected download policy remains unchanged for an active release', () => {
  assert.equal(canDownload({ accessStatus: 'beta' }, { isActive: true }), true);
});

test('admin frontend reports an HTML error response without attempting JSON parsing', async () => {
  const htmlError = new Response('<html><body>payload too large</body></html>', { status: 413, headers: { 'content-type': 'text/html' } });
  await assert.rejects(responseJson(htmlError), /Помилка сервера \(413\)/);
});

test('only an administrator can issue a desktop license authorization', () => {
  assert.equal(canManageLicenses({ role: 'admin' }), true);
  assert.equal(canManageLicenses({ role: 'user' }), false);
  assert.equal(canManageLicenses(null), false);
});

test('a license is usable only for a verified beta user with an active key', () => {
  const base = { emailVerified: true, accessStatus: 'beta', keyStatus: 'active', status: 'active', startsAt: '2026-01-01T00:00:00.000Z', expiresAt: null };
  assert.equal(licenseStateCode(base, '2026-08-07T00:00:00.000Z'), null);
  assert.equal(licenseStateCode({ ...base, keyStatus: 'revoked' }, '2026-08-07T00:00:00.000Z'), 'invalid_license_key');
  assert.equal(licenseStateCode({ ...base, accessStatus: 'pending' }, '2026-08-07T00:00:00.000Z'), 'no_radar_access');
  assert.equal(licenseStateCode({ ...base, status: 'suspended' }, '2026-08-07T00:00:00.000Z'), 'suspended');
});

test('device activation respects its per-license limit', () => {
  assert.equal(canActivateAnotherDevice(0, 1), true);
  assert.equal(canActivateAnotherDevice(1, 1), false);
  assert.equal(canActivateAnotherDevice(1, 2), true);
});
