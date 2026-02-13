const fs = require('fs');
const path = require('path');

// Mapeamento de cores: roxo/rosa -> azul
const colorReplacements = [
  // Classes Tailwind
  { from: /purple-400/g, to: 'blue-400' },
  { from: /purple-300/g, to: 'blue-300' },
  { from: /purple-500/g, to: 'blue-500' },
  { from: /purple-600/g, to: 'blue-500' },
  { from: /purple-700/g, to: 'blue-600' },
  { from: /purple-900/g, to: 'blue-900' },
  { from: /pink-400/g, to: 'cyan-400' },
  { from: /pink-600/g, to: 'cyan-500' },
  { from: /pink-700/g, to: 'cyan-600' },
  { from: /pink-900/g, to: 'cyan-900' },
  // Gradientes
  { from: /from-purple-400/g, to: 'from-blue-400' },
  { from: /to-pink-400/g, to: 'to-cyan-400' },
  { from: /from-purple-600/g, to: 'from-blue-500' },
  { from: /to-pink-600/g, to: 'to-cyan-500' },
  { from: /from-purple-700/g, to: 'from-blue-600' },
  { from: /to-pink-700/g, to: 'to-cyan-600' },
  // RGBA values
  { from: /rgba\(139,92,246/g, to: 'rgba(59,130,246' },
  { from: /rgba\(236,72,153/g, to: 'rgba(34,211,238' },
];

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    colorReplacements.forEach(({ from, to }) => {
      if (content.match(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main
const rootDir = path.join(__dirname, '..');
const files = walkDir(rootDir);

console.log(`Found ${files.length} files to process...`);
let updated = 0;

files.forEach(file => {
  if (replaceInFile(file)) {
    updated++;
  }
});

console.log(`\nDone! Updated ${updated} files.`);








