// Read-only HTTP smoke check. Run against a separately started server.
const base = new URL(process.argv[2] || process.env.RUNTIME_BASE_URL || "http://127.0.0.1:3140");
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Use an HTTP(S) base URL without credentials');
const indexing = process.env.EXPECT_INDEXING === 'true';
let failures = 0;
function check(ok, message) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${message}`);
  if (!ok) failures++;
}
for (const [path, expected] of [['/', 302], ['/en', 200], ['/tr', 200], ['/blog', 200], ['/__runtime_missing_page__', 404], ['/api/admin', 401], ['/api/health', 200], ['/robots.txt', 200]]) {
  try {
    const response = await fetch(new URL(path, base), { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const body = await response.text();
    check(response.status === expected, `${path} HTTP ${response.status} (expected ${expected})`);
    check(response.headers.get('x-content-type-options') === 'nosniff', `${path} nosniff`);
    check(response.headers.get('x-frame-options') === 'DENY', `${path} frame protection`);
    if (path === '/') check(response.headers.get('location') === '/en', 'root redirects to English home');
    if (path === '/en') check(/<html\b[^>]*lang="en"/.test(body), 'English HTML language');
    if (path === '/tr') check(/<html\b[^>]*lang="tr"/.test(body), 'Turkish HTML language');
    if (path === '/en' || path === '/tr' || path === '/blog') {
      check(/<title>[^<]+<\/title>/.test(body), `${path} title`);
      check(/<meta\b[^>]*name="description"[^>]*content="[^"]+"/.test(body), `${path} description`);
      if (!indexing) check(/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(body), `${path} default noindex`);
    }
    if (path === '/api/health') {
      check(body === '{"status":"ok"}', 'minimal healthy response');
      check(response.headers.get('cache-control')?.includes('no-store'), 'health no-store');
    }
    if (path === '/robots.txt') {
      check(indexing ? /Allow:\s*\//.test(body) : /Disallow:\s*\/\s*(?:\n|$)/.test(body), 'robots indexing policy');
    }
  } catch (error) {
    check(false, `${path} ${error.name}: request failed`);
  }
}
process.exitCode = failures ? 1 : 0;
