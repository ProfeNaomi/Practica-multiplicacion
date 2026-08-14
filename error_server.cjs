
const http = require('http');
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.url === '/error' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      console.log('\n\n--- REACT CRASH DETECTED ---\n', JSON.parse(body), '\n----------------------------\n');
      res.end('ok');
    });
  } else {
    res.end();
  }
});
server.listen(3001, () => console.log('Error server listening on 3001'));
