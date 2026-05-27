const fs = require('fs');
const path = require('path');

exports.handler = async function() {
  try {
    const data = fs.readFileSync(path.join(process.cwd(), 'signals-data.json'), 'utf8');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: data
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: '[]'
    };
  }
};        location: fm.location || '',
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
