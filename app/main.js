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

    const str = 'abc';

    const [requestLine] = request.split('\r\n');
    const req = requestLine.split(' ');

    if (req[0] === 'GET' && req[1] === '/echo/abc') {
      const response =
        'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\nabc';
      socket.write(response);
    } else {
      const response = 'HTTP/1.1 404 Not Found\r\n\r\n';
      socket.write(response);
    }
  });

  socket.on('close', () => {
    socket.end();
  });
});

server.listen(4221, 'localhost');
