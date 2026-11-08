const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync("src/lib/origin.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {}, URL };
vm.runInNewContext(compiled, context);
const { isAllowedOrigin } = context.exports;

test("only matching loopback origins work without public configuration", () => {
  assert.equal(isAllowedOrigin("http://localhost:3000", "localhost:3000"), true);
  assert.equal(isAllowedOrigin("http://127.0.0.1:3000", "127.0.0.1:3000"), true);
  assert.equal(isAllowedOrigin("http://localhost:3000", "localhost:3001"), false);
  assert.equal(isAllowedOrigin("https://evil.example", "evil.example"), false);
  assert.equal(isAllowedOrigin(null, "localhost:3000"), false);
});

test("configured public origin permits only exact origin", () => {
  assert.equal(isAllowedOrigin("https://app.example.com", "internal:3000", "https://app.example.com"), true);
  assert.equal(isAllowedOrigin("https://evil.example.com", "app.example.com", "https://app.example.com"), false);
  assert.equal(isAllowedOrigin("https://app.example.com.evil.example", "app.example.com", "https://app.example.com"), false);
  assert.equal(isAllowedOrigin("https://app.example.com", "app.example.com", "https://app.example.com/path"), false);
});
