#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all HeartbeatWorker files in .next directory
const nextDir = path.join(__dirname, '..', '.next');

if (!fs.existsSync(nextDir)) {
  console.log('No .next directory found, skipping HeartbeatWorker fix');
  process.exit(0);
}

// Recursively find HeartbeatWorker files
function findHeartbeatWorkerFiles(dir) {
  const files = [];
  
  function searchDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir);
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (entry.includes('HeartbeatWorker') && entry.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  searchDir(dir);
  return files;
}

const files = findHeartbeatWorkerFiles(nextDir);
console.log(`Found ${files.length} HeartbeatWorker files to fix`);

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove the problematic export statement
    const originalContent = content;
    content = content.replace(/export\s*{\s*};\s*/g, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed export statement in: ${file}`);
    } else {
      console.log(`No export statement found in: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing file ${file}:`, error.message);
  }
});

console.log('HeartbeatWorker fix completed');