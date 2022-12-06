const test = require('brittle')
const path = require('path')
const fs = require('fs')
const fsp = require('fs/promises')
const FramedStream = require('./index.js')
// const net = require('net')
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
    b.end()
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

/* async function create (t) {
  const server = net.createServer({ allowHalfOpen: true })
  const onconnection = new Promise(resolve => server.once('connection', resolve))
  server.listen(0)
  await waitForServer(server)

  t.teardown(() => {
    server.close()
    return new Promise(resolve => server.once('close', resolve))
  })

  const local = net.connect(server.address().port, server.address().address, { allowHalfOpen: true })
  const remote = await onconnection

  local.setNoDelay()
  remote.setNoDelay()

  server.once('connection', function () {
    t.fail('Socket already existed (another socket connected)')
  })

  const a = new FramedStream(local, { __name: 'a' })
  const b = new FramedStream(remote, { __name: 'b' })

  return [local, remote, a, b]
}

function waitForServer (server) {
  return new Promise((resolve, reject) => {
    server.on('listening', done)
    server.on('error', done)
    if (server.listening) done()

    function done (error) {
      server.removeListener('listening', done)
      server.removeListener('error', done)
      error ? reject(error) : resolve()
    }
  })
}

function createTmpDir (t) {
  const tmpdir = path.join(os.tmpdir(), 'localdrive-test-')
  const dir = fs.mkdtempSync(tmpdir)
  t.teardown(() => fsp.rm(dir, { recursive: true }))
  return dir
} */
