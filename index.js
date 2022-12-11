const { Duplex, getStreamError } = require('streamx')
const b4a = require('b4a')

module.exports = class FramedStream extends Duplex {
  constructor (rawStream, { bits = 32 } = {}) {
    super({ mapWritable })

    if (bits !== 32 && bits !== 24 && bits !== 16 && bits !== 8) throw new Error('Frame bits is invalid')

    this.rawStream = rawStream
    this.frameBits = bits
    this.frameBytes = this.frameBits / 8
    this.maxMessageLength = 0xffffffff >>> (32 - this.frameBits)

    this._factor = 0
    this._missingBytes = 0
    this._message = null
    this._writeCallback = null
    this._ended = 2

    rawStream.on('data', this._ondata.bind(this))
    rawStream.on('end', this._onend.bind(this))
    rawStream.on('drain', this._ondrain.bind(this))
    rawStream.on('error', this._onerror.bind(this))
    rawStream.on('close', this._onclose.bind(this))
  }

  _predestroy () {
    this.rawStream.destroy(getStreamError(this))

    this._maybeContinue(new Error('Stream destroyed'))
  }

  _read (cb) {
    this.rawStream.resume() // restart state machine
    cb(null)
  }

  _write (data, cb) {
    const wrap = this._frame(data.byteLength)
    wrap.set(data, this.frameBytes)

    if (this.rawStream.write(wrap) === true) return cb(null)
    this._writeCallback = cb
  }

  _maybeContinue (err) {
    const cb = this._writeCallback
    this._writeCallback = null
    if (cb !== null) cb(err)
  }

  _frame (len) {
    if (len > this.maxMessageLength) throw new Error('Message length (' + len + ') is longer than max frame (' + this.maxMessageLength + ')')

    const wrap = b4a.allocUnsafe(len + this.frameBytes)

    for (let i = 0; i < this.frameBytes; i++) {
      wrap[i] = len
      len >>>= 8
    }

    return wrap
  }

  _onclose () {
    if (this._ended !== 0) this.destroy()
  }

  _ondrain () {
    this._maybeContinue(null)
  }

  _onerror (err) {
    this.destroy(err)
  }

  _ondata (data) {
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
        this._missingBytes -= chunk.byteLength
        return
      }

      this._push(this._message)
    }
  }

  _push (message) {
    this._factor = 0
    this._missingBytes = 0
    this._message = null

    // pause state machine if our buffer is full
    if (this.push(message) === false) this.rawStream.pause()
  }

  _onend () {
    if (this._factor) {
      this.destroy(new Error('Stream interrupted'))
      return
    }

    this._ended--
    this.push(null)
  }

  _final (cb) {
    this._ended--
    this.rawStream.end()
    cb(null)
  }
}

function mapWritable (s) {
  return typeof s === 'string' ? b4a.from(s) : s
}
