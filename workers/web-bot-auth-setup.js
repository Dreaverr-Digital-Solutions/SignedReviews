#!/usr/bin/env node
/**
 * Web Bot Auth — key generation and JWKS directory setup.
 *
 * Generates an Ed25519 key pair, computes the JWK thumbprint (RFC 7638),
 * and outputs the configuration needed for the well-known endpoint.
 *
 * Usage: node workers/web-bot-auth-setup.js
 */

const crypto = require('crypto');
const fs = require('fs');

// ── Load or generate keys ──────────────────────────────────────────────────

const PUBLIC_KEY_PATH = 'workers/web-bot-auth-public.jwk';
const PRIVATE_KEY_PATH = 'workers/web-bot-auth-private.jwk';

let publicJWK, privateJWK;

if (fs.existsSync(PUBLIC_KEY_PATH) && fs.existsSync(PRIVATE_KEY_PATH)) {
  publicJWK = JSON.parse(fs.readFileSync(PUBLIC_KEY_PATH, 'utf8'));
  privateJWK = JSON.parse(fs.readFileSync(PRIVATE_KEY_PATH, 'utf8'));
  console.log('Loaded existing keys.');
} else {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  publicJWK = publicKey.export({ format: 'jwk' });
  privateJWK = privateKey.export({ format: 'jwk' });
  fs.writeFileSync(PUBLIC_KEY_PATH, JSON.stringify(publicJWK, null, 2) + '\n');
  fs.writeFileSync(PRIVATE_KEY_PATH, JSON.stringify(privateJWK, null, 2) + '\n');
  console.log('Generated new Ed25519 key pair.');
}

console.log('\nPublic JWK:');
console.log(JSON.stringify(publicJWK, null, 2));

// ── JWK Thumbprint (RFC 7638) ──────────────────────────────────────────────

const canonicalJWK = {
  crv: publicJWK.crv,
  kty: publicJWK.kty,
  x: publicJWK.x,
};
const canonical = JSON.stringify(canonicalJWK, Object.keys(canonicalJWK).sort());
const thumbprint = crypto.createHash('sha256').update(canonical).digest('base64url');
console.log('\nJWK Thumbprint:', thumbprint);

// ── Sign a test response ───────────────────────────────────────────────────

async function main() {
  const key = await crypto.subtle.importKey(
    'jwk', privateJWK, { name: 'Ed25519' }, false, ['sign']
  );

  const authority = 'signedreviews.com';
  const created = Math.floor(Date.now() / 1000);
  const expires = created + 10;
  const nonce = crypto.randomBytes(64).toString('base64url');

  // RFC 9421 signature base
  const reqComponent = `\"@authority\": ${authority}`;
  const sigParamsStr = `sig1=(\"@authority\";req);alg=\"ed25519\";keyid=\"${thumbprint}\";nonce=\"${nonce}\";tag=\"http-message-signatures-directory\";created=${created};expires=${expires}`;
  const sigParamsLine = `\"@signature-params\": ${sigParamsStr}`;
  const signatureBase = `${reqComponent}\n${sigParamsLine}`;

  const sigBytes = await crypto.subtle.sign(
    'Ed25519', key, new TextEncoder().encode(signatureBase)
  );
  const sig = Buffer.from(sigBytes).toString('base64url');

  console.log('\n=== Response headers for /.well-known/http-message-signatures-directory ===');
  console.log(`Content-Type: application/http-message-signatures-directory+json`);
  console.log(`Signature-Input: ${sigParamsStr}`);
  console.log(`Signature: sig1=:${sig}:`);

  // ── JWKS directory response body ─────────────────────────────────────────

  const directory = {
    keys: [
      {
        kty: publicJWK.kty,
        crv: publicJWK.crv,
        x: publicJWK.x,
      },
    ],
  };

  console.log('\n=== Response body ===');
  console.log(JSON.stringify(directory, null, 2));
}

main().catch(console.error);
