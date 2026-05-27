const fs = require('fs');
const path = require('path');

exports.handler = async function() {
  try {
    const data = fs.readFileSync(path.join(process.cwd(), 'reports-data.json'), 'utf8');
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
};
