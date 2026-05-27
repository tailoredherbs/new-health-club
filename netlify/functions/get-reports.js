const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    const reportsDir = path.join(__dirname, '../../_reports');
    
    if (!fs.existsSync(reportsDir)) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify([])
      };
    }

    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.md'));

    const reports = files.map(filename => {
      const content = fs.readFileSync(path.join(reportsDir, filename), 'utf8');
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
        type: fm.type || '',
        date: fm.date || '',
        readTime: fm.readTime || '',
        tag: fm.tag || '',
        description: fm.description || '',
        image: fm.image || ''
      };
    });

    reports.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(reports)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
