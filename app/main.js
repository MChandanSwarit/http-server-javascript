const net = require('net');
const fs = require('fs');

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here!');

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const request = data.toString();

    const [method, path] = request.split('\r\n')[0].split(' ');

    if (method === 'GET') {
      if (path === '/') {
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
      } else if (path.startsWith('/echo/')) {
        const content = path.slice(6);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else if (path.startsWith('/user-agent')) {
        const content = request.split('\r\n')[2].slice(12);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else if (path.startsWith('/files')) {
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
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      }
    } else if (method === 'POST') {
      if (path.startsWith('/files/')) {
        const directory = process.argv[3];
        const filename = path.slice(7);
        const requestBody = request.split('\r\n\r\n')[0];
        fs.writeFileSync(
          `${directory}/${filename}`,
          requestBody.join('\r\n'),
          'utf-8'
        );
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
