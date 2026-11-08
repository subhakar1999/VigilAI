const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const ts = require("typescript");

function loadAuth(env) {
  const source = fs.readFileSync("src/lib/auth.ts", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, process: { env }, crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, btoa, atob };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test("only configured credentials authenticate", async () => {
  const auth = loadAuth({ VIGILAI_ADMIN_USERNAME: "alice", VIGILAI_ADMIN_PASSWORD: "a-unique-password", VIGILAI_AUTH_SECRET: "a".repeat(32) });
  assert.equal(await auth.verifyCredentials("alice", "a-unique-password"), true);
  assert.equal(await auth.verifyCredentials("alice", "vigilai2026!"), false);
  assert.equal(await auth.verifyCredentials("alice", "VigilAI-Local-9mK7!pQ4"), false);
  assert.equal(await auth.verifyCredentials("bob", "a-unique-password"), false);
  const token = await auth.createSessionToken("alice");
  assert.equal(await auth.verifySessionToken(token), true);
});

test("missing configuration fails closed", async () => {
  const auth = loadAuth({});
  await assert.rejects(auth.verifyCredentials("admin", "vigilai2026!"));
  assert.equal(await auth.verifySessionToken("anything"), false);
});
