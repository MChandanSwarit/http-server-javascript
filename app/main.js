// Import required modules
const net = require('net'); // For creating TCP server
const fs = require('fs'); // For file system operations
const zlib = require('zlib'); // For gzip compression

// Function to handle GET requests
const handleGetRequest = (socket, path, headers) => {
  if (path === '/') {
    // Respond with 200 OK for root path
    socket.write('HTTP/1.1 200 OK\r\n\r\n');
  } else if (path.startsWith('/echo/')) {
    // Respond with the text after '/echo/' path
    const content = path.slice(6);
    const content_gzipped = zlib.gzipSync(content); // Compress content
    const acceptEncoding = headers['accept-encoding']
      ? headers['accept-encoding'].split(',').map((s) => s.trim())
      : [];

    if (acceptEncoding.includes('gzip')) {
      // Respond with gzipped content if client accepts gzip encoding
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nContent-Type: text/plain\r\nContent-Length: ${content_gzipped.length}\r\n\r\n`
      );
      socket.write(content_gzipped);
    } else {
      // Respond with plain text content if client does not accept gzip encoding
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
    }
  } else if (path.startsWith('/user-agent')) {
    // Respond with user-agent header value
    const userAgent = headers['user-agent'];
    socket.write(
      `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`
    );
  } else if (path.startsWith('/files/')) {
    // Serve static files from the specified directory
    const directory = process.argv[3];
    const filename = path.slice(7);

    if (fs.existsSync(`${directory}/${filename}`)) {
      // Respond with file content if the file exists
      const content = fs.readFileSync(`${directory}/${filename}`);
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${content.length}\r\n\r\n`
      );
      socket.write(content);
    } else {
      // Respond with 404 Not Found if the file does not exist
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    }
  } else {
    // Respond with 404 Not Found for any other paths
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
  }
};

// Function to handle POST requests
const handlePostRequest = (socket, path, body) => {
  if (path.startsWith('/files/')) {
    // Save file to the specified directory
    const directory = process.argv[3];
    const filename = path.slice(7);
    fs.writeFileSync(`${directory}/${filename}`, body); // Write file content to the specified path
    socket.write('HTTP/1.1 201 Created\r\n\r\n'); // Respond with 201 Created
  } else {
    // Respond with 400 Bad Request for any other paths
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
};

// Create TCP server
const server = net.createServer((socket) => {
  socket.on('data', (data) => {
    const request = data.toString(); // Convert data to string
    const [requestLine, ...headerLines] = request.split('\r\n'); // Split request into lines
    const [method, path] = requestLine.split(' '); // Extract method and path from request line
    const headers = headerLines.reduce((acc, line) => {
      const [key, value] = line.split(': ');
      if (key && value) {
        acc[key.toLowerCase()] = value; // Convert headers to lowercase and add to headers object
      }
      return acc;
    }, {});
    const body = request.split('\r\n\r\n')[1] || ''; // Extract body from request

    // Handle request based on method
    switch (method) {
      case 'GET':
        handleGetRequest(socket, path, headers);
        break;
      case 'POST':
        handlePostRequest(socket, path, body);
        break;
      default:
        socket.write('HTTP/1.1 405 Method Not Allowed\r\n\r\n'); // Respond with 405 Method Not Allowed for other methods
    }
  });

  socket.on('close', () => {
    socket.end(); // Close socket on 'close' event
  });
});

// Start listening on port 4221 and localhost
server.listen(4221, 'localhost');
