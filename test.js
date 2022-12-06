const test = require('brittle')
const FramedStream = require('./index.js')
const duplexThrough = require('duplex-through')
const b4a = require('b4a')

test('full cycle', function (t) {
  t.plan(8)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([5, 0, 0, 0]), b4a.from('hello')]), 'a first raw data')

    a.rawStream.once('data', function (raw) {
      t.alike(raw, b4a.concat([b4a.from([6, 0, 0, 0]), b4a.from('world!')]), 'a second raw data')

      a.rawStream.once('data', function () {
        t.fail('a should not receive more raw data')
      })
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello'), 'a first message')

    a.once('data', function (data) {
      t.alike(data, b4a.from('world!'), 'a second message')

      a.once('data', function () {
        t.fail('a should not receive more messages')
      })

      a.end()
    })
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  b.write(b4a.from('hello'))
  b.write(b4a.from('world!'))
})

test('partial message length', function (t) {
  t.plan(8)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.from([11, 0]), 'a first raw data')

    a.rawStream.once('data', function (raw) {
      t.alike(raw, b4a.from([0, 0]), 'a second raw data')

      a.rawStream.once('data', function (raw) {
        t.alike(raw, b4a.from('hello world'), 'a third raw data')

        a.rawStream.once('data', function () {
          t.fail('a should not receive more raw data')
        })
      })
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello world'), 'a first message')

    a.once('data', function () {
      t.fail('a should not receive more messages')
    })

    a.end()
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  const message = frame(b, b4a.from('hello world'))
  b.rawStream.write(message.slice(0, 2))
  setTimeout(() => b.rawStream.write(message.slice(2, 4)), 100)
  setTimeout(() => b.rawStream.write(message.slice(4)), 200)
})

test('delay message content', function (t) {
  t.plan(7)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.from([11, 0, 0, 0]), 'a first raw data')

    a.rawStream.once('data', function (raw) {
      t.alike(raw, b4a.from('hello world'), 'a second raw data')

      a.rawStream.once('data', function () {
        t.fail('a should not receive more raw data')
      })
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello world'), 'a first message')

    a.once('data', function () {
      t.fail('a should not receive more messages')
    })

    a.end()
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  const message = frame(b, b4a.from('hello world'))
  b.rawStream.write(message.slice(0, 4))
  setTimeout(() => b.rawStream.write(message.slice(4)), 100)
})

test('delay partial message content', function (t) {
  t.plan(7)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([11, 0, 0, 0]), b4a.from('he')]), 'a first raw data')

    a.rawStream.once('data', function (raw) {
      t.alike(raw, b4a.from('llo world'), 'a second raw data')

      a.rawStream.once('data', function () {
        t.fail('a should not receive more raw data')
      })
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello world'), 'a first message')

    a.once('data', function () {
      t.fail('a should not receive more messages')
    })

    a.end()
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  const message = frame(b, b4a.from('hello world'))
  b.rawStream.write(message.slice(0, 6))
  setTimeout(() => b.rawStream.write(message.slice(6)), 100)
})

test('several partial message content', function (t) {
  t.plan(8)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.from([11, 0, 0, 0]), 'a first raw data')

    a.rawStream.once('data', function (raw) {
      t.alike(raw, b4a.from('he'), 'a second raw data')

      a.rawStream.once('data', function (raw) {
        t.alike(raw, b4a.from('llo world'), 'a third raw data')

        a.rawStream.once('data', function () {
          t.fail('a should not receive more raw data')
        })
      })
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello world'), 'a first message')

    a.once('data', function () {
      t.fail('a should not receive more messages')
    })

    a.end()
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  const message = frame(b, b4a.from('hello world'))
  b.rawStream.write(message.slice(0, 4))
  setTimeout(() => b.rawStream.write(message.slice(4, 6)), 100)
  setTimeout(() => b.rawStream.write(message.slice(6)), 200)
})

test('multiple messages at once', function (t) {
  t.plan(8)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(
      raw,
      b4a.concat([
        b4a.from([5, 0, 0, 0]), b4a.from('hello'),
        b4a.from([3, 0, 0, 0]), b4a.from('bye'),
        b4a.from([6, 0, 0, 0]), b4a.from('random')
      ]),
      'a first raw data'
    )

    a.rawStream.once('data', function () {
      t.fail('a should not receive more raw data')
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello'), 'a first message')

    a.once('data', function (data) {
      t.alike(data, b4a.from('bye'), 'a second message')

      a.once('data', function (data) {
        t.alike(data, b4a.from('random'), 'a third message')

        a.once('data', function () {
          t.fail('a should not receive more messages')
        })

        a.end()
      })
    })
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  const message1 = frame(b, b4a.from('hello'))
  const message2 = frame(b, b4a.from('bye'))
  const message3 = frame(b, b4a.from('random'))
  b.rawStream.write(b4a.concat([message1, message2, message3]))
})

test('big message', function (t) {
  t.plan(6)

  const [a, b] = create()

  const bigMessageLength = 2 * 1024 * 1024 // => 2097152
  const bigMessage = b4a.alloc(bigMessageLength).fill('abcd')

  a.rawStream.once('data', function (raw) {
    /* const frameLength = readUInt32LE(raw.slice(0, 4))
    t.is(frameLength, bigMessageLength, 'frame message length')
    t.is(raw.length - 4, bigMessageLength, 'first raw data message length') */

    t.alike(raw, b4a.concat([b4a.from([0, 0, 32, 0]), bigMessage]), 'a first raw data')

    a.rawStream.once('data', function () {
      t.fail('a should not receive more raw data')
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, bigMessage, 'a first message')

    a.once('data', function () {
      t.fail('a should not receive more messages')
    })

    a.end()
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  b.write(bigMessage)
})

test('write a string', function (t) {
  t.plan(6)

  const [a, b] = create()

  a.rawStream.on('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([5, 0, 0, 0]), b4a.from('hello')]), 'a first raw data')
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.on('data', function (data) {
    t.alike(data, b4a.from('hello'), 'a first message')

    a.end()
  })

  a.on('end', function () {
    t.pass('a end')
    // a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  b.write('hello')
})

test('end while the other stream is still receiving data', function (t) {
  t.plan(6)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([11, 0, 0, 0]), b4a.from('he')]), 'a first raw data')

    a.rawStream.once('data', function () {
      t.fail('a should not receive more raw data')
    })
  })

  b.rawStream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.fail('a should not receive messages')
  })

  a.on('end', function () {
    t.pass('a end')
    a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  a.on('error', function (error) {
    t.is(error.message, 'Stream interrupted', 'a: ' + error.message)
  })

  b.once('data', function () {
    t.fail('b should not receive messages')
  })

  b.on('end', function () {
    t.fail('b should not receive end')
    // b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  b.on('error', function (error) {
    t.is(error.message, 'Pair was destroyed', 'b: ' + error.message)
  })

  const message = frame(b, b4a.from('hello world'))
  b.rawStream.write(message.slice(0, 6))

  setTimeout(() => b.end(), 100)
})

test('destroy', function (t) {
  t.plan(2)

  const [a, b] = create()

  a.on('close', function () {
    t.pass('a closed')
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  a.destroy()
  b.destroy() // + should not be needed?
})

function frame (stream, data) {
  const wrap = stream._frame(data.byteLength)
  wrap.set(data, stream.frameBytes)
  return wrap
}

function create () {
  const pair = duplexThrough()

  const a = new FramedStream(pair[0], { __name: 'a' })
  const b = new FramedStream(pair[1], { __name: 'b' })

  return [a, b]
}

/* function readUInt32LE (buf) {
  return buf[0] + (buf[1] << 8) + (buf[2] << 16) + (buf[3] << 24)
}

function writeUInt32LE (buf, value) {
  buf[0] = value
  buf[1] = value >>> 8
  buf[2] = value >>> 16
  buf[3] = value >>> 24
} */
