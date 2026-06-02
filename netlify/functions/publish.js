const https = require('https');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-deploy-secret',
  'Content-Type': 'application/json'
};

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const token = process.env.GITHUB_TOKEN;
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ hasToken: !!token, tokenLength: token ? token.length : 0, tokenStart: token ? token.substring(0, 6) : 'none' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method not allowed' };
  }

  // Check deploy secret
  const secret = process.env.DEPLOY_SECRET;
  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const provided = event.headers['x-deploy-secret'] || body.secret;
  if (secret && provided !== secret) {
    return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'No token configured' }) };
  }

  const { path, content, message } = body;
  if (!path || !content || !message) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing path, content or message' }) };
  }

  const encoded = Buffer.from(content).toString('base64');
  const repo = 'tailoredherbs/new-health-club';

  let sha;
  try {
    const checkRes = await makeRequest({
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${path}`,
      method: 'GET',
      headers: { 'Authorization': `token ${token}`, 'User-Agent': 'NewHealthClub', 'Accept': 'application/vnd.github.v3+json' }
    });
    if (checkRes.status === 200) sha = JSON.parse(checkRes.body).sha;
  } catch(e) {}

  const payload = JSON.stringify({ message, content: encoded, ...(sha ? { sha } : {}) });

  const res = await makeRequest({
    hostname: 'api.github.com',
    path: `/repos/${repo}/contents/${path}`,
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'NewHealthClub',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, payload);

  if (res.status === 200 || res.status === 201) {
    try {
      await makeRequest({
        hostname: 'api.netlify.com',
        path: '/build_hooks/6a16e59e82643e1cfcdebf08',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': '2' }
      }, '{}');
    } catch(e) {}
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, path }) };
  } else {
    return { statusCode: res.status, headers: CORS_HEADERS, body: JSON.stringify({ error: res.body }) };
  }
};
