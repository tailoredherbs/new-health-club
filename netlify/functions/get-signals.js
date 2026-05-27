import { readFileSync } from 'fs';
import { join } from 'path';

export const handler = async function() {
  try {
    const data = readFileSync(join(process.cwd(), 'signals-data.json'), 'utf8');
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
