const test = require('brittle')
const FramedStream = require('./index.js')
const duplexThrough = require('duplex-through')
const b4a = require('b4a')

test('basic', function (t) {
  t.plan(8)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([5,0,0,0]), b4a.from('hello')]), 'a first raw data')
    
    a.rawStream.once('data', function (raw) {
      t.alike(raw, b4a.concat([b4a.from([6,0,0,0]), b4a.from('world!')]), 'a second raw data')

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

      // a.end()
    })
  })

  a.on('end', function () {
    t.pass('a end')
    a.end()
  })

  a.on('close', function () {
    t.pass('a closed')
  })

  b.once('data', function () {
    t.fail('b should not receive data')
  })

  b.on('end', function () {
    t.pass('b end')
    // b.end()
  })

  b.on('close', function () {
    t.pass('b closed')
  })

  b.write(b4a.from('hello'))
  b.write(b4a.from('world!'))
  b.end()
})

test('write message length, but delay partial message content', function (t) {
  t.plan(7)

  const [a, b] = create()

  a.rawStream.once('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([11,0,0,0]), b4a.from('he')]), 'a first raw data')

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
    t.fail('b should not receive data')
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

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
