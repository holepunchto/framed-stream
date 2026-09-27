import { Duplex, DuplexEvents } from 'streamx'

declare class FramedStream extends Duplex<FramedStream.FramedStreamEvents> {
  constructor(rawStream: FramedStream.RawDuplexStream, opts?: FramedStream.FramedStreamOptions)

  rawStream: FramedStream.RawDuplexStream
  frameBits: FramedStream.FrameBits
  frameBytes: FramedStream.FrameBytes
  maxMessageLength: FramedStream.MaxMessageLength

  write(data: Uint8Array | string): boolean
  end(data?: Uint8Array | string): this
  push(message: Uint8Array | null): boolean
}

declare namespace FramedStream {
  export type FrameBits = 8 | 16 | 24 | 32
  export type FrameBytes = 1 | 2 | 3 | 4
  export type MaxMessageLength = 255 | 65535 | 16777215 | 4294967295

  export interface FramedStreamOptions {
    bits?: FrameBits
  }

  export interface FramedStreamEvents extends DuplexEvents {
    data: [message: Uint8Array]
  }

  export type RawDuplexStream = Duplex | NodeJS.ReadWriteStream
}

export = FramedStream
