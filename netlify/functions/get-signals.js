const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    const signalsDir = path.join(process.cwd(), '_signals');

    if (!fs.existsSync(signalsDir)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([])
      };
    }

    const files = fs.readdirSync(signalsDir).filter(f => f.endsWith('.md'));

    const signals = files.map(filename => {
      const content = fs.readFileSync(path.join(signalsDir, filename), 'utf8');
      const id = filename.replace('.md', '');
      const fm = {};
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        match[1].split('\n').forEach(line => {
          const colonIndex = line.indexOf(': ');
          if (colonIndex > -1) {
            const key = line.substring(0, colonIndex).trim();
            const val = line.substring(colonIndex + 2).trim().replace(/^"|"$/g, '');
            fm[key] = val;
          }
        });
      }
      return {
        id,
        title: fm.title || '',
        category: fm.category || '',
        location: fm.location || '',
        date: fm.date || '',
        tag: fm.tag || '',
        description: fm.description || '',
        image: fm.image || ''
      };
    });

    signals.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(signals)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
