const fs = require('fs');
const path = require('path');

function parseMarkdown(content, filename) {
  const id = filename.replace('.md', '');
  const fm = {};
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    match[1].split('\n').forEach(line => {
      const colonIndex = line.indexOf(': ');
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        const val = line.substring(colonIndex + 2).trim().replace(/^"|"$/g, '');
        fm[key] = val;
      }
    });
    fm.body = match[2].trim();
  }
  return { id, ...fm };
}

// Build signals
const signalsDir = path.join(__dirname, '_signals');
let signals = [];
if (fs.existsSync(signalsDir)) {
  signals = fs.readdirSync(signalsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => parseMarkdown(fs.readFileSync(path.join(signalsDir, f), 'utf8'), f))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Build reports
const reportsDir = path.join(__dirname, '_reports');
let reports = [];
if (fs.existsSync(reportsDir)) {
  reports = fs.readdirSync(reportsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => parseMarkdown(fs.readFileSync(path.join(reportsDir, f), 'utf8'), f))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Write JSON files
fs.writeFileSync('signals-data.json', JSON.stringify(signals, null, 2));
fs.writeFileSync('reports-data.json', JSON.stringify(reports, null, 2));

console.log(`Built ${signals.length} signals and ${reports.length} reports`);
