const test = require('brittle')
const FramedStream = require('./index.js')
const duplexThrough = require('duplex-through')
const b4a = require('b4a')

test('basic', async function (t) {
  t.plan(8)

  const [a, b] = create(t)

  a.stream.once('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([5,0,0,0]), b4a.from('hello')]), 'a first raw data')
    
    a.stream.once('data', function (raw) {
      t.alike(raw, b4a.concat([b4a.from([6,0,0,0]), b4a.from('world!')]), 'a first raw data')

      a.stream.once('data', function () {
        t.fail()
      })
    })
  })

  b.stream.on('data', function () {
    t.fail('b should not receive raw data')
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello'), 'a first message')

    a.once('data', function (data) {
      t.alike(data, b4a.from('world!'), 'a second message')
    })
  })

  a.on('end', function () {
    a.end()
    t.pass('a end')
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

function create () {
  const pair = duplexThrough()

  const a = new FramedStream(pair[0], { __name: 'a' })
  const b = new FramedStream(pair[1], { __name: 'b' })

  return [a, b]
}
