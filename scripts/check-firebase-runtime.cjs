const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { createServer } = require('node:http');
const { generateKeyPairSync, sign, verify } = require('node:crypto');

// Exercise Firebase's real dependency chain without Node's require(ESM) support.
require('firebase-admin/auth');
const firebaseRequire = createRequire(require.resolve('firebase-admin'));
const jwksClient = firebaseRequire('jwks-rsa');

async function main() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'runtime-test', alg: 'RS256', use: 'sig' };
  const server = createServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ keys: [jwk] }));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const client = jwksClient({ jwksUri: `http://127.0.0.1:${server.address().port}/jwks`, timeout: 5000 });
    const key = await client.getSigningKey('runtime-test');
    const message = Buffer.from('Firebase runtime compatibility check');
    const signature = sign('RSA-SHA256', message, privateKey);
    assert.equal(verify('RSA-SHA256', message, key.getPublicKey(), signature), true);
    assert.equal(verify('RSA-SHA256', Buffer.from('tampered'), key.getPublicKey(), signature), false);
    console.log('Firebase auth loads without require(ESM); JWKS resolution and signature checks pass.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
