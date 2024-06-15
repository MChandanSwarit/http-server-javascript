const net = require('net');
const fs = require('fs');
const zlib = require('zlib');

const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const request = data.toString();

    const [method, path] = request.split('\r\n')[0].split(' ');

    if (method === 'GET') {
      // method is GET
      if (path === '/') {
        // path is '/'
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
      } else if (path.startsWith('/echo/')) {
        // path starts with '/echo/'
        const content = path.slice(6);
        const content_gzipped = zlib.gzipSync(content);
        const content_encoding = request
          .split('\r\n')[2]
          .slice(17)
          .split(',')
          .map((s) => s.trim());
        if (content_encoding.includes('gzip')) {
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Type: text/plain\r\nContent-Length: ${content_gzipped.length}\r\n\r\n`
          );
          socket.write(content_gzipped);
        } else {
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
          );
        }
      } else if (path.startsWith('/user-agent')) {
        // path starts with '/user-agent'
        const content = request.split('\r\n')[2].slice(12);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else if (path.startsWith('/files/')) {
        // path starts with '/files/'
        const directory = process.argv[3];
        const filename = path.slice(7);

        if (fs.existsSync(`${directory}/${filename}`)) {
          const content = fs
            .readFileSync(`${directory}/${filename}`)
            .toString();
          socket.write(
            `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n${content}`
          );
        } else {
          socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        }
      } else if (path.startsWith('/')) {
        // path starts with '/'
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      } else {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    } else if (method === 'POST') {
      // method is POST
      if (path.startsWith('/files/')) {
        // method is '/files/'
        const directory = process.argv[3];
        const filename = path.slice(7);
        const requestBody = request.split('\r\n\r\n')[1];
        fs.writeFileSync(`${directory}/${filename}`, requestBody);
        socket.write('HTTP/1.1 201 Created\r\n\r\n');
      }
    } else {
      socket.write('HTTP/1.1 405 Method Not Allowed\r\n\r\n');
    }
  });

  socket.on('close', () => {
    socket.end();
  });
});

server.listen(4221, 'localhost');
