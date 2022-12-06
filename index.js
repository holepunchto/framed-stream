const { Duplex } = require('streamx')
const b4a = require('b4a')

module.exports = class FramedStream extends Duplex {
  constructor (rawStream, { bits = 32, __name = '' } = {}) {
    super({ mapWritable })

    this.rawStream = rawStream
    this.frameBits = bits
    this.frameBytes = this.frameBits / 8
    this.__name = __name

    this._factor = 0
    this._missingBytes = 0
    this._message = null
    this._writeCallback = null

    rawStream.on('data', this._ondata.bind(this))
    rawStream.on('end', this._onend.bind(this))
    rawStream.on('drain', this._ondrain.bind(this))
    rawStream.on('error', this._onerror.bind(this))
  }

  _predestroy () {
    // console.log(this.__name, '_predestroy')
    this.rawStream.destroy(new Error('Destroyed'))

    this._maybeContinue(new Error('Destroyed'))
  }

  _read (cb) {
    this.rawStream.resume() // restart state machine
    cb(null)
  }

  _write (data, cb) {
    // console.log(this.__name, '_write', data.length)
    const wrap = this._frame(data.byteLength)
    wrap.set(data, this.frameBytes)

    if (this.rawStream.write(wrap) === true) return cb(null)
    // console.log(this.__name, '_write backpressure?')
    this._writeCallback = cb
  }

  _maybeContinue (err) {
    const cb = this._writeCallback
    this._writeCallback = null
    // console.log(this.__name, '_maybeContinue', !!cb)
    if (cb !== null) cb(err)
  }

  _frame (len) {
    const wrap = b4a.allocUnsafe(len + this.frameBytes)

    for (let i = 0; i < this.frameBytes; i++) {
      wrap[i] = len
      len >>>= 8
    }

    return wrap
  }

  _ondrain () {
    this._maybeContinue(null)
  }

  _onerror (err) {
    // console.log(this.__name, 'rawStream error', err.message)
    this.destroy(err)
  }

  _ondata (data) {
    // console.log(this.__name, '_ondata', data)
    let read = 0

    while (read < data.byteLength && !this.destroying) {
      if (this._factor < this.frameBits) {
        const byte = data[read++]
        this._missingBytes += (1 << this._factor) * byte
        this._factor += 8

        if (this._factor === this.frameBits) {
          if (data.byteLength - read >= this._missingBytes) { // quick check if we can avoid a copy
            this._push(data.subarray(read, read += this._missingBytes))
          } else { // otherwise make a buffer to read into
            this._message = b4a.allocUnsafe(this._missingBytes)
          }
        }

        continue
      }

      const chunk = data.subarray(read, read += this._missingBytes)
      this._message.set(chunk, this._message.byteLength - this._missingBytes)

      if (read > data.byteLength) {
        this._missingBytes -= chunk.length
        return
      }

      this._push(this._message)
    }
  }

  _push (message) {
    // console.log(this.__name, '_push', message)

    this._factor = 0
    this._missingBytes = 0
    this._message = null

    // pause state machine if our buffer is full
    if (this.push(message) === false) this.rawStream.pause()
  }

  _onend () {
    // console.log(this.__name, '_onend')

    if (this._factor) return this.destroy(new Error('Stream interrupted'))

    this.push(null)
  }

  _final (cb) {
    // console.log(this.__name, '_final')
    this.rawStream.end()
    cb(null)
  }
}

function mapWritable (s) {
  return typeof s === 'string' ? b4a.from(s) : s
}
