import http from 'node:http';

const TARGET_BASE = process.env.POSTGREST_TARGET || 'http://127.0.0.1:54321';
const PORT = Number.parseInt(process.env.SUPABASE_SHIM_PORT || '54322', 10);
const HOST = process.env.SUPABASE_SHIM_HOST || '127.0.0.1';

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
};

const buildTargetPath = (urlPath) => {
  if (urlPath === '/rest/v1' || urlPath === '/rest/v1/') return '/';
  if (urlPath.startsWith('/rest/v1/')) return urlPath.replace('/rest/v1', '');
  return null;
};

const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (parsed.pathname === '/' || parsed.pathname === '/health') {
      return json(res, 200, {
        ok: true,
        service: 'supabase-shim',
        target: TARGET_BASE,
        expectedPrefix: '/rest/v1'
      });
    }

    const targetPath = buildTargetPath(parsed.pathname);
    if (!targetPath) {
      return json(res, 404, {
        error: 'Unsupported path',
        hint: 'Use /rest/v1/* paths for PostgREST queries'
      });
    }

    const targetUrl = `${TARGET_BASE}${targetPath}${parsed.search}`;
    const bodyChunks = [];
    for await (const chunk of req) bodyChunks.push(chunk);
    const bodyBuffer = bodyChunks.length ? Buffer.concat(bodyChunks) : null;

    const headers = { ...req.headers };
    delete headers.host;

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: bodyBuffer || undefined,
      redirect: 'manual'
    });

    const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    const responseHeaders = {};

    upstreamResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'transfer-encoding') return;
      responseHeaders[key] = value;
    });

    res.writeHead(upstreamResponse.status, responseHeaders);
    res.end(responseBuffer);
  } catch (error) {
    json(res, 500, { error: error.message || 'shim proxy error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`supabase-shim listening on http://${HOST}:${PORT}`);
  console.log(`proxying /rest/v1/* -> ${TARGET_BASE}/*`);
});
