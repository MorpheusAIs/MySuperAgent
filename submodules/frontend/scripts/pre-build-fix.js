#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the source HeartbeatWorker file in node_modules
const heartbeatWorkerPath = path.join(
  __dirname, 
  '..', 
  'node_modules', 
  '.pnpm', 
  '@coinbase+wallet-sdk@4.3.3', 
  'node_modules', 
  '@coinbase', 
  'wallet-sdk', 
  'dist', 
  'sign', 
  'walletlink', 
  'relay', 
  'connection', 
  'HeartbeatWorker.js'
);

console.log('Checking for HeartbeatWorker.js at:', heartbeatWorkerPath);

if (fs.existsSync(heartbeatWorkerPath)) {
  try {
    let content = fs.readFileSync(heartbeatWorkerPath, 'utf8');
    
    // Remove the problematic export statement
    const originalContent = content;
    content = content.replace(/export\s*{\s*};\s*/g, '');
    
    if (content !== originalContent) {
      fs.writeFileSync(heartbeatWorkerPath, content, 'utf8');
      console.log('Fixed export statement in HeartbeatWorker.js');
    } else {
      console.log('No export statement found in HeartbeatWorker.js');
    }
  } catch (error) {
    console.error('Error processing HeartbeatWorker.js:', error.message);
  }
} else {
  console.log('HeartbeatWorker.js not found at expected location');
  
  // Try to find it in other locations
  const searchPaths = [
    path.join(__dirname, '..', 'node_modules', '@coinbase', 'wallet-sdk'),
    path.join(__dirname, '..', 'node_modules', 'cbw-sdk')
  ];
  
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      console.log('Found Coinbase SDK at:', searchPath);
      // Recursively search for HeartbeatWorker files
      findAndFixHeartbeatWorker(searchPath);
    }
  }
}

function findAndFixHeartbeatWorker(dir) {
  function searchDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir);
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          searchDir(fullPath);
        } else if (entry === 'HeartbeatWorker.js') {
          console.log('Found HeartbeatWorker.js at:', fullPath);
          
          let content = fs.readFileSync(fullPath, 'utf8');
          const originalContent = content;
          content = content.replace(/export\s*{\s*};\s*/g, '');
          
          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('Fixed export statement in:', fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  searchDir(dir);
}

console.log('Pre-build fix completed');