# framed-socket

Read/write stream messages prefixed 8, 16, 24 or 32 bit length.

```
npm i framed-socket
```

## Usage
```js
const FramedSocket = require('framed-socket')
const net = require('net')

const server = net.createServer().listen(0)
const client = net.connect(server.address().port, server.address().address)

server.on('connection', function (socket) {
  const stream = new FramedStream(socket)

  stream.on('data', (message) => console.log('client says:', message.toString()))
  stream.on('end', () => stream.end())
  stream.on('close', (message) => console.log('server stream is closed'))
  stream.on('error', console.error)
})

const stream = new FramedStream(client)
stream.on('data', (message) => console.log('server says:', message.toString()))
stream.on('end', () => stream.end())
stream.on('close', () => console.log('client stream is closed'))
stream.on('error', console.error)

stream.write('hello')
stream.write('world')
stream.end()
```

## API

#### `const stream = new FramedSocket(socket)`

## License
MIT
