const http = require('http');

const data = JSON.stringify({
  name: 'mahmud',
  description: 'hiiiiiiiiiiii',
  categoryId: 'some-id', // I will just send a mock
  price: 250,
  stock: 100,
  images: []
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
