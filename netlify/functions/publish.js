exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { statusCode: 500, body: JSON.stringify({ error: 'No token configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { path, content, message } = body;
  if (!path || !content || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing path, content or message' }) };
  }

  // Base64 encode the content
  const encoded = Buffer.from(content).toString('base64');

  // Check if file exists (to get sha for updates)
  let sha;
  const checkRes = await fetch(
    `https://api.github.com/repos/tailoredherbs/new-health-club/contents/${path}`,
    { headers: { Authorization: `token ${token}`, 'User-Agent': 'NewHealthClub' } }
  );
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
  }

  // Create or update file
  const res = await fetch(
    `https://api.github.com/repos/tailoredherbs/new-health-club/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'NewHealthClub'
      },
      body: JSON.stringify({ message, content: encoded, ...(sha ? { sha } : {}) })
    }
  );

  const result = await res.json();
  if (res.ok) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, path })
    };
  } else {
    return {
      statusCode: res.status,
      body: JSON.stringify({ error: result.message })
    };
  }
};
