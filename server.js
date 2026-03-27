const http = require('http');
const fs = require('fs');
const path = require('path');

// .env.local からAPIキーを読み込む
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...val] = line.trim().split('=');
    if (key && val.length) process.env[key] = val.join('=');
  });
}

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // HTMLファイルを返す
  if (req.method === 'GET' && (req.url === '/' || req.url.endsWith('.html'))) {
    const filename = req.url === '/' ? 'index.html' : req.url.slice(1);
    const filepath = path.join(__dirname, filename);
    if (fs.existsSync(filepath)) {
      const html = fs.readFileSync(filepath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
  }

  // APIエンドポイント
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { system, messages } = JSON.parse(body);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            system,
            messages
          })
        });
        const data = await response.json();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`✅ ふわりん起動中 → http://localhost:${PORT}`);
  console.log('終了するときは Ctrl+C を押してください');
});
