# framed-stream

Read/write stream messages prefixed 8, 16, 24 or 32 bit length.

```
npm i framed-stream
```

## Usage
We have a server that handles connections like so:
```js
const FramedStream = require('framed-stream')
const net = require('net')

const server = net.createServer().listen(3000)

server.on('connection', function (socket) {
  const stream = new FramedStream(socket)

  stream.on('data', (message) => console.log('client says:', message.toString()))
  stream.on('end', () => stream.end())
  stream.on('close', (message) => console.log('server stream is closed'))
})
```

Client does the same, also for example it sends two messages:
```js
const client = net.connect(3000)
const stream = new FramedStream(client)

stream.on('data', (message) => console.log('server says:', message.toString()))
stream.on('end', () => stream.end())
stream.on('close', () => console.log('client stream is closed'))

stream.write('hello')
stream.write('world')
stream.end()
```

## API

#### `const stream = new FramedStream(rawStream, [options])`

Make a new framed stream.

Available `options`:
```js
{
  bits: 32
}
```

You can only set `bits` using the `frameBits` values documented below.

#### `stream.rawStream`

The underlying raw stream.

#### `stream.frameBits`

Indicates the frame bits (`8`, `16`, `24`, or `32`).

#### `stream.frameBytes`

Indicates the frame bytes (`1`, `2`, `3`, or `4`).

#### `stream.maxMessageLength`

Indicates the max message length (`255`, `65535`, `16777215`, or `4294967295`).

## License
MIT
