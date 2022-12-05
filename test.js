const test = require('brittle')
const FramedStream = require('./index.js')
const { PassThrough } = require('streamx')
const b4a = require('b4a')

test('basic', async function (t) {
  t.plan(6)

  const [a, b, pass] = create()

  pass.once('data', function (raw) {
    t.alike(raw, b4a.concat([b4a.from([5,0,0,0]), b4a.from('hello')]))

    pass.once('data', function (raw) {
      t.alike(raw, b4a.concat([b4a.from([6,0,0,0]), b4a.from('world!')]))

      pass.once('data', function () {
        t.fail()
      })
    })
  })

  a.once('data', function (data) {
    t.alike(data, b4a.from('hello'))

    a.once('data', function (data) {
      t.alike(data, b4a.from('world!'))
    })
  })

  a.on('end', function () {
    console.log('a on end')
    a.end()
    t.pass()
  })

  a.on('close', function () {
    console.log('a closed')
  })

  b.on('end', function () {
    console.log('b on end')
    b.end()
    t.pass()
  })

  b.on('close', function () {
    console.log('b closed')
  })

  b.write(b4a.from('hello'))
  b.write(b4a.from('world!'))
  b.end()
})

/* test('basic', async function (t) {
  return
  const pass = new PassThrough()

  pass.on('data', function (raw) {
    console.log('raw', raw)
  })

  const f = new FramedStream(pass, { bits: 24 })

  f.on('data', (data) => console.log(data.toString()))

  // pass.write(b4a.from([2]))
  // pass.write(b4a.from([0]))
  // pass.write(b4a.from([0]))
  // pass.write(b4a.from([0]))
  // pass.write(b4a.from('hi'))
  // pass.write(b4a.concat([b4a.from([2,0,0,0]), b4a.from('ho')]))

  const f2 = new FramedStream(pass, { bits: 24 })
  // const

  f2.write(Buffer.from('hello'))
  f2.write(Buffer.from('world'))

  t.ok(true)
}) */

function create () {
  const pass = new PassThrough()
  const a = new FramedStream(pass, { __name: 'a' })
  const b = new FramedStream(pass, { __name: 'b' })
  return [a, b, pass]
}
