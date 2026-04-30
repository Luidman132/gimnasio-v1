const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Replace template literals: `http://localhost:8888/tramusagym-api/...`
  content = content.replace(/`http:\/\/localhost:8888\/tramusagym-api\/(.*?)`/g, '`${import.meta.env.VITE_API_URL}/$1`');
  
  // Replace single quotes: 'http://localhost:8888/tramusagym-api/...'
  content = content.replace(/'http:\/\/localhost:8888\/tramusagym-api\/(.*?)'/g, '`${import.meta.env.VITE_API_URL}/$1`');

  // Replace double quotes: "http://localhost:8888/tramusagym-api/..."
  content = content.replace(/"http:\/\/localhost:8888\/tramusagym-api\/(.*?)"/g, '`${import.meta.env.VITE_API_URL}/$1`');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src');
