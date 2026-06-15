import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'fast-text-encoding';
import { EventTarget } from 'event-target-shim';
import { ReadableStream } from 'web-streams-polyfill';
import { Buffer } from 'buffer';

declare const global: any;

// Essential Globals
global.Buffer = Buffer as any;
global.self = global as any;

// Text Encoding
const { TextEncoder, TextDecoder } = require('fast-text-encoding');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Basic Web APIs
if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}
if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

// Event & Stream
if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = EventTarget as any;
}
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream as any;
}

// Native classes needed by some core libraries
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor() {}
  } as any;
}
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor() {}
    append() {}
    get() { return null; }
  } as any;
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor() {}
  } as any;
}

// Crypto - Needed for secure random values and hashing
if (typeof global.crypto === 'undefined') {
    global.crypto = {
        getRandomValues: (arr: any) => require('react-native-get-random-values').getRandomValues(arr),
        subtle: {} as any
    } as any;
}
