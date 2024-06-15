const net = require('net');
const fs = require('fs');
const zlib = require('zlib');

const handleGetRequest = (socket, path, headers) => {
  if (path === '/') {
    socket.write('HTTP/1.1 200 OK\r\n\r\n');
  } else if (path.startsWith('/echo/')) {
    const content = path.slice(6);
    const content_gzipped = zlib.gzipSync(content);
    const acceptEncoding = headers['accept-encoding'] ? headers['accept-encoding'].split(',').map(s => s.trim()) : [];

    if (acceptEncoding.includes('gzip')) {
      socket.write(`HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Type: text/plain\r\nContent-Length: ${content_gzipped.length}\r\n\r\n`);
      socket.write(content_gzipped);
    } else {
      socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`);
    }
  } else if (path.startsWith('/user-agent')) {
    const userAgent = headers['user-agent'];
    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
  } else if (path.startsWith('/files/')) {
    const directory = process.argv[3];
    const filename = path.slice(7);

    if (fs.existsSync(`${directory}/${filename}`)) {
      const content = fs.readFileSync(`${directory}/${filename}`);
      socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n`);
      socket.write(content);
    } else {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    }
  } else {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
  }
};

const handlePostRequest = (socket, path, body) => {
  if (path.startsWith('/files/')) {
    const directory = process.argv[3];
    const filename = path.slice(7);
    fs.writeFileSync(`${directory}/${filename}`, body);
    socket.write('HTTP/1.1 201 Created\r\n\r\n');
  } else {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
};

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const request = data.toString();
    const [requestLine, ...headerLines] = request.split('\r\n');
    const [method, path] = requestLine.split(' ');
    const headers = headerLines.reduce((acc, line) => {
      const [key, value] = line.split(': ');
      if (key && value) {
        acc[key.toLowerCase()] = value;
      }
      return acc;
    }, {});
    const body = request.split('\r\n\r\n')[1] || '';

    switch (method) {
      case 'GET':
        handleGetRequest(socket, path, headers);
        break;
      case 'POST':
        handlePostRequest(socket, path, body);
        break;
      default:
        socket.write('HTTP/1.1 405 Method Not Allowed\r\n\r\n');
    }
  });

  socket.on('close', () => {
    socket.end();
  });
});

server.listen(4221, 'localhost');
