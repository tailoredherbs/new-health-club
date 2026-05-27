const fs = require('fs');
const path = require('path');

function parseMarkdown(content, filename) {
  const id = filename.replace('.md', '');
  const fm = {};
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (match) {
    // Parse frontmatter properly - handles values with colons in them
    const lines = match[1].split('\n');
    let currentKey = null;
    let currentVal = [];

    lines.forEach(line => {
      // Check if this is a new key: value line
      const keyMatch = line.match(/^([a-zA-Z_]+):\s?"?(.*?)"?\s*$/);
      if (keyMatch) {
        // Save previous key if exists
        if (currentKey) {
          fm[currentKey] = currentVal.join(' ').trim().replace(/^"|"$/g, '');
        }
        currentKey = keyMatch[1].trim();
        currentVal = [keyMatch[2].trim()];
      } else if (currentKey && line.trim()) {
        // Continuation of previous value
        currentVal.push(line.trim());
      }
    });
    // Save last key
    if (currentKey) {
      fm[currentKey] = currentVal.join(' ').trim().replace(/^"|"$/g, '');
    }
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

fs.writeFileSync('signals-data.json', JSON.stringify(signals, null, 2));
fs.writeFileSync('reports-data.json', JSON.stringify(reports, null, 2));

console.log(`Built ${signals.length} signals and ${reports.length} reports`);


