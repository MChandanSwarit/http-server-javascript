const net = require('net');

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here!');

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  // socket.on('data', () => {
  //   const response = 'HTTP/1.1 200 OK\r\n\r\n';
  //   socket.write(response);
  // });

  socket.on('data', (data) => {
    const request = data.toString();

    const [requestLine, host, userAgent, accept] = request.split('\r\n');
    const [method, path] = requestLine.split(' ');

    if (method === 'GET') {
      if (path === '/') {
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
      } else if (path.startsWith('/echo/')) {
        const content = path.slice(6);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else if (path.startsWith('/user-agent')) {
        const content = userAgent.slice(12);
        socket.write(
          `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
        );
      } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      }
    }
  });
  socket.on('close', () => {
    socket.end();
  });
});

server.listen(4221, 'localhost');
