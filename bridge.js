// bridge.js
import http from 'http';
import { exec } from 'child_process';
import url from 'url';
import fs from 'fs';
import path from 'path';

const PORT = 3001;

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/scaffold-and-open' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { files } = JSON.parse(body);
        
        // 1. Open Modern Folder Picker via PowerShell
        // This hack uses OpenFileDialog to match the modern Explorer-style look
        const psCommand = `
          Add-Type -AssemblyName System.Windows.Forms;
          $f = New-Object System.Windows.Forms.OpenFileDialog;
          $f.ValidateNames = $false;
          $f.CheckFileExists = $false;
          $f.CheckPathExists = $true;
          $f.FileName = 'Select Folder';
          $f.Title = 'Blueprint.dev - Select Project Target Folder';
          if($f.ShowDialog() -eq 'OK') { 
            [System.IO.Path]::GetDirectoryName($f.FileName) 
          }
        `.replace(/\n/g, ' ').trim();
        
        exec(`powershell -Command "${psCommand}"`, (err, stdout) => {
          const targetPath = stdout.trim();
          
          if (err || !targetPath) {
            console.error('Picker error or cancel:', err || 'No path selected');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Folder selection cancelled' }));
            return;
          }

          console.log(`Scaffolding to: ${targetPath}`);

          // 2. Recursive Write Function
          const writeFiles = (nodes, currentPath) => {
            nodes.forEach(node => {
              const fullPath = path.join(currentPath, node.name);
              if (node.type === 'folder') {
                if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
                if (node.children) writeFiles(node.children, fullPath);
              } else {
                fs.writeFileSync(fullPath, node.content || '');
              }
            });
          };

          try {
            writeFiles(files, targetPath);
            
            // 3. Open in VS Code
            exec(`code "${targetPath}"`, (codeErr) => {
              if (codeErr) {
                console.error('VS Code launch error:', codeErr);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to launch VS Code. Ensure it is in your PATH.' }));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Scaffolding complete', path: targetPath }));
              }
            });
          } catch (writeErr) {
            console.error('File write error:', writeErr);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write files. Check permissions.' }));
          }
        });
      } catch (parseErr) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid file tree data' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Bridge server running at http://localhost:${PORT}`);
});
