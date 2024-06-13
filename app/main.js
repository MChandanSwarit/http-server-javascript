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

    const [requestLine] = request.split('\r\n');
    const [method, path] = requestLine.split(' ');

    let response = "HTTP/1.1 404 Not Found\r\n\r\n";

    if (method === 'GET') {
      if (path.startsWith('/echo/')) {
        const message = path.slice(6);
        response = `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${message.length}\r\n\r\n${message}`;
        socket.write(response);
      } else if (path.startsWith('/')) {
        response = `HTTP/1.1 200 OK\r\n\r\n`;
        socket.write(response);
      }
      socket.write(response);
    }
  });

  socket.on('close', () => {
    socket.end();
  });
});

server.listen(4221, 'localhost');
