const test = require('brittle')
const FramedStream = require('./index.js')
const duplexThrough = require('duplex-through')
const b4a = require('b4a')

test('full cycle', async function (t) {
  t.plan(8)

  const [a, b] = await create()

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
  await sleepImmediate()
  b.write(b4a.from('world!'))
})

test('partial message length', async function (t) {
  t.plan(8)

  const [a, b] = await create()

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
  await sleepImmediate()
  b.rawStream.write(message.slice(2, 4))
  await sleepImmediate()
  b.rawStream.write(message.slice(4))
})

test('delay message content', async function (t) {
  t.plan(7)

  const [a, b] = await create()

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
  await sleepImmediate()
  b.rawStream.write(message.slice(4))
})

test('delay partial message content', async function (t) {
  t.plan(7)

  const [a, b] = await create()

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
  await sleepImmediate()
  b.rawStream.write(message.slice(6))
})

test('several partial message content', async function (t) {
  t.plan(8)

  const [a, b] = await create()

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
  await sleepImmediate()
  b.rawStream.write(message.slice(4, 6))
  await sleepImmediate()
  b.rawStream.write(message.slice(6))
})

test('multiple messages at once', async function (t) {
  t.plan(8)

  const [a, b] = await create()

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

test('big message', async function (t) {
  t.plan(6)

  const [a, b] = await create()

  const bigMessageLength = 2 * 1024 * 1024
  const bigMessage = b4a.alloc(bigMessageLength).fill('abcd')

  a.rawStream.once('data', function (raw) {
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

test('write a string', async function (t) {
  t.plan(6)

  const [a, b] = await create()

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

test('end while the other stream is still receiving data', async function (t) {
  t.plan(5)

  const [a, b] = await create()

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
    t.fail('a should not receive end')
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
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  b.on('error', function (error) { // Note: this is *not* emitted using net
    t.is(error.message, 'Pair was destroyed', 'b: ' + error.message)
  })

  const message = frame(b, b4a.from('hello world'))
  b.rawStream.write(message.slice(0, 6))
  await sleepImmediate()
  b.end()
})

test('the receiving stream ends while still receiving data', async function (t) {
  t.plan(5)

  const [a, b] = await create()

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
    t.fail('a should not receive end')
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
    t.pass('b end')
    b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  b.on('error', function (error) {
    t.fail('b should not error: ' + error.message)
  })

  const message = frame(b, b4a.from('hello world'))
  b.rawStream.write(message.slice(0, 6))
  await sleepImmediate() // Note: not needed using net
  a.end()
})

test('destroy', async function (t) {
  t.plan(3)

  const [a, b] = await create()

  a.on('close', function () {
    t.pass('a closed')
  })

  b.on('close', function () { // Note: this is *not* emitted using net
    t.pass('b closed')
  })

  b.on('error', function (error) { // Note: this is *not* emitted using net
    t.is(error.message, 'Pair was destroyed', 'b: ' + error.message)
  })

  a.destroy()
})

test('frame with 8 bits (message of 255 bytes)', async function (t) {
  t.plan(4)

  const [a, b] = await create({ bits: 8 })

  const message = b4a.alloc(255).fill('abcd')
  a.write(message)

  b.rawStream.on('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([255]), message]), 'a first raw data')
  })

  b.on('data', function (data) {
    t.alike(data, message)
    a.end()
  })

  b.on('end', () => b.end())
  a.on('close', () => t.pass('a closed'))
  b.on('close', () => t.pass('b closed'))
})

test('frame with 16 bits (message of 65 kb)', async function (t) {
  t.plan(4)

  const [a, b] = await create({ bits: 16 })

  const message = b4a.alloc(65535).fill('abcd')
  a.write(message)

  b.rawStream.on('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([255, 255]), message]), 'a first raw data')
  })

  b.on('data', function (data) {
    t.alike(data, message)
    a.end()
  })

  b.on('end', () => b.end())
  a.on('close', () => t.pass('a closed'))
  b.on('close', () => t.pass('b closed'))
})

test('frame with 24 bits (message of 16 mb)', async function (t) {
  t.plan(4)

  const [a, b] = await create({ bits: 24 })

  const message = b4a.alloc(16777215).fill('abcd')
  a.write(message)

  b.rawStream.on('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([255, 255, 255]), message]), 'a first raw data')
  })

  b.on('data', function (data) {
    t.alike(data, message)
    a.end()
  })

  b.on('end', () => b.end())
  a.on('close', () => t.pass('a closed'))
  b.on('close', () => t.pass('b closed'))
})

test.skip('frame with 32 bits (message of 4 gb)', async function (t) {
  t.plan(5)

  const [a, b] = await create({ bits: 32 })

  const message = b4a.alloc(4294967295 - 4).fill('abcd')
  a.write(message)

  b.rawStream.on('data', function (raw) {
    t.alike(raw.slice(0, 4), b4a.from([251, 255, 255, 255]), 'a first raw data (length)')
    t.is(raw.slice(4).compare(message), 0, 'a first raw data (message)')
  })

  b.on('data', function (data) {
    t.alike(data, message)
    a.end()
  })

  b.on('end', () => b.end())
  a.on('close', () => t.pass('a closed'))
  b.on('close', () => t.pass('b closed'))
})

test('try frame big message with 8 bits', async function (t) {
  t.plan(1)

  const [a, b] = await create({ bits: 8 })

  const bigMessage = b4a.alloc(256).fill('abcd')
  a.write(bigMessage)

  b.rawStream.on('data', () => t.fail('b should not receive raw data'))
  b.on('data', () => t.fail('b should not receive messages'))

  a.on('error', () => t.fail('a should not emit error'))
  b.on('error', () => t.fail('b should not emit error'))

  a.on('close', () => t.fail('a should not emit close'))
  b.on('close', () => t.fail('b should not emit close'))

  process.once('uncaughtException', function (error, origin) {
    t.is(error.message, 'Message length (256) is longer than max frame (255)', error.message)

    // a.destroy() // Note: this doesn't trigger 'close' event for "a"
    // b.destroy()
  })
})

function sleepImmediate () {
  return new Promise(resolve => setImmediate(resolve))
}

function frame (stream, data) {
  let len = data.byteLength
  const wrap = b4a.allocUnsafe(len + stream.frameBytes)

  for (let i = 0; i < stream.frameBytes; i++) {
    wrap[i] = len
    len >>>= 8
  }
  wrap.set(data, stream.frameBytes)

  return wrap
}

async function create (opts = {}) {
  const pair = duplexThrough()

  const a = new FramedStream(pair[0], opts)
  const b = new FramedStream(pair[1], opts)

  return [a, b]
}

/* async function create (opts = {}) {
  const net = require('net')
  const server = net.createServer().listen(0)

  const client = net.connect(server.address().port, server.address().address)
  const a = new FramedStream(client, opts)

  const onconnection = new Promise(resolve => server.once('connection', resolve))
  const b = new FramedStream(await onconnection, opts)

  a.once('close', () => server.close())

  await sleepImmediate()

  return [a, b]
} */
