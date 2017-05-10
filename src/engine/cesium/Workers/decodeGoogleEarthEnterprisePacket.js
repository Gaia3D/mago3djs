/**
 * Cesium - https://github.com/AnalyticalGraphicsInc/cesium
 *
 * Copyright 2011-2017 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md for full licensing details.
 */
(function () {
/*global define*/
define('Core/defined',[],function() {
    'use strict';

    /**
     * @exports defined
     *
     * @param {Object} value The object.
     * @returns {Boolean} Returns true if the object is defined, returns false otherwise.
     *
     * @example
     * if (Cesium.defined(positions)) {
     *      doSomething();
     * } else {
     *      doSomethingElse();
     * }
     */
    function defined(value) {
        return value !== undefined && value !== null;
    }

    return defined;
});

/*global define*/
define('Core/RuntimeError',[
        './defined'
    ], function(
        defined) {
    'use strict';

    /**
     * Constructs an exception object that is thrown due to an error that can occur at runtime, e.g.,
     * out of memory, could not compile shader, etc.  If a function may throw this
     * exception, the calling code should be prepared to catch it.
     * <br /><br />
     * On the other hand, a {@link DeveloperError} indicates an exception due
     * to a developer error, e.g., invalid argument, that usually indicates a bug in the
     * calling code.
     *
     * @alias RuntimeError
     * @constructor
     * @extends Error
     *
     * @param {String} [message] The error message for this exception.
     *
     * @see DeveloperError
     */
    function RuntimeError(message) {
        /**
         * 'RuntimeError' indicating that this exception was thrown due to a runtime error.
         * @type {String}
         * @readonly
         */
        this.name = 'RuntimeError';

        /**
         * The explanation for why this exception was thrown.
         * @type {String}
         * @readonly
         */
        this.message = message;

        //Browsers such as IE don't have a stack property until you actually throw the error.
        var stack;
        try {
            throw new Error();
        } catch (e) {
            stack = e.stack;
        }

        /**
         * The stack trace of this exception, if available.
         * @type {String}
         * @readonly
         */
        this.stack = stack;
    }

    if (defined(Object.create)) {
        RuntimeError.prototype = Object.create(Error.prototype);
        RuntimeError.prototype.constructor = RuntimeError;
    }

    RuntimeError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;

        if (defined(this.stack)) {
            str += '\n' + this.stack.toString();
        }

        return str;
    };

    return RuntimeError;
});

/* pako 1.0.4 nodeca/pako */(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('ThirdParty/pako_inflate',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.pako = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    'use strict';


    var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                    (typeof Uint16Array !== 'undefined') &&
                    (typeof Int32Array !== 'undefined');


    exports.assign = function (obj /*from1, from2, from3, ...*/) {
        var sources = Array.prototype.slice.call(arguments, 1);
        while (sources.length) {
            var source = sources.shift();
            if (!source) { continue; }

            if (typeof source !== 'object') {
                throw new TypeError(source + 'must be non-object');
            }

            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    obj[p] = source[p];
                }
            }
        }

        return obj;
    };


// reduce buffer size, avoiding mem copy
    exports.shrinkBuf = function (buf, size) {
        if (buf.length === size) { return buf; }
        if (buf.subarray) { return buf.subarray(0, size); }
        buf.length = size;
        return buf;
    };


    var fnTyped = {
        arraySet: function (dest, src, src_offs, len, dest_offs) {
            if (src.subarray && dest.subarray) {
                dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
                return;
            }
            // Fallback to ordinary array
            for (var i = 0; i < len; i++) {
                dest[dest_offs + i] = src[src_offs + i];
            }
        },
        // Join array of chunks to single array.
        flattenChunks: function (chunks) {
            var i, l, len, pos, chunk, result;

            // calculate data length
            len = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
                len += chunks[i].length;
            }

            // join chunks
            result = new Uint8Array(len);
            pos = 0;
            for (i = 0, l = chunks.length; i < l; i++) {
                chunk = chunks[i];
                result.set(chunk, pos);
                pos += chunk.length;
            }

            return result;
        }
    };

    var fnUntyped = {
        arraySet: function (dest, src, src_offs, len, dest_offs) {
            for (var i = 0; i < len; i++) {
                dest[dest_offs + i] = src[src_offs + i];
            }
        },
        // Join array of chunks to single array.
        flattenChunks: function (chunks) {
            return [].concat.apply([], chunks);
        }
    };


// Enable/Disable typed arrays use, for testing
//
    exports.setTyped = function (on) {
        if (on) {
            exports.Buf8  = Uint8Array;
            exports.Buf16 = Uint16Array;
            exports.Buf32 = Int32Array;
            exports.assign(exports, fnTyped);
        } else {
            exports.Buf8  = Array;
            exports.Buf16 = Array;
            exports.Buf32 = Array;
            exports.assign(exports, fnUntyped);
        }
    };

    exports.setTyped(TYPED_OK);

},{}],2:[function(require,module,exports){
// String encode/decode helpers
    'use strict';


    var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
    var STR_APPLY_OK = true;
    var STR_APPLY_UIA_OK = true;

    try { String.fromCharCode.apply(null, [ 0 ]); } catch (__) { STR_APPLY_OK = false; }
    try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch (__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
    var _utf8len = new utils.Buf8(256);
    for (var q = 0; q < 256; q++) {
        _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
    }
    _utf8len[254] = _utf8len[254] = 1; // Invalid sequence start


// convert string to array (typed, when possible)
    exports.string2buf = function (str) {
        var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

        // count binary size
        for (m_pos = 0; m_pos < str_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 0xfc00) === 0xdc00) {
                    c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                    m_pos++;
                }
            }
            buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
        }

        // allocate buffer
        buf = new utils.Buf8(buf_len);

        // convert
        for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
            c = str.charCodeAt(m_pos);
            if ((c & 0xfc00) === 0xd800 && (m_pos + 1 < str_len)) {
                c2 = str.charCodeAt(m_pos + 1);
                if ((c2 & 0xfc00) === 0xdc00) {
                    c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
                    m_pos++;
                }
            }
            if (c < 0x80) {
                /* one byte */
                buf[i++] = c;
            } else if (c < 0x800) {
                /* two bytes */
                buf[i++] = 0xC0 | (c >>> 6);
                buf[i++] = 0x80 | (c & 0x3f);
            } else if (c < 0x10000) {
                /* three bytes */
                buf[i++] = 0xE0 | (c >>> 12);
                buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                buf[i++] = 0x80 | (c & 0x3f);
            } else {
                /* four bytes */
                buf[i++] = 0xf0 | (c >>> 18);
                buf[i++] = 0x80 | (c >>> 12 & 0x3f);
                buf[i++] = 0x80 | (c >>> 6 & 0x3f);
                buf[i++] = 0x80 | (c & 0x3f);
            }
        }

        return buf;
    };

// Helper (used in 2 places)
    function buf2binstring(buf, len) {
        // use fallback for big arrays to avoid stack overflow
        if (len < 65537) {
            if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
                return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
            }
        }

        var result = '';
        for (var i = 0; i < len; i++) {
            result += String.fromCharCode(buf[i]);
        }
        return result;
    }


// Convert byte array to binary string
    exports.buf2binstring = function (buf) {
        return buf2binstring(buf, buf.length);
    };


// Convert binary string (typed, when possible)
    exports.binstring2buf = function (str) {
        var buf = new utils.Buf8(str.length);
        for (var i = 0, len = buf.length; i < len; i++) {
            buf[i] = str.charCodeAt(i);
        }
        return buf;
    };


// convert array to string
    exports.buf2string = function (buf, max) {
        var i, out, c, c_len;
        var len = max || buf.length;

        // Reserve max possible length (2 words per char)
        // NB: by unknown reasons, Array is significantly faster for
        //     String.fromCharCode.apply than Uint16Array.
        var utf16buf = new Array(len * 2);

        for (out = 0, i = 0; i < len;) {
            c = buf[i++];
            // quick process ascii
            if (c < 0x80) { utf16buf[out++] = c; continue; }

            c_len = _utf8len[c];
            // skip 5 & 6 byte codes
            if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len - 1; continue; }

            // apply mask on first byte
            c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
            // join the rest
            while (c_len > 1 && i < len) {
                c = (c << 6) | (buf[i++] & 0x3f);
                c_len--;
            }

            // terminated by end of string?
            if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

            if (c < 0x10000) {
                utf16buf[out++] = c;
            } else {
                c -= 0x10000;
                utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
                utf16buf[out++] = 0xdc00 | (c & 0x3ff);
            }
        }

        return buf2binstring(utf16buf, out);
    };


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
    exports.utf8border = function (buf, max) {
        var pos;

        max = max || buf.length;
        if (max > buf.length) { max = buf.length; }

        // go back from last position, until start of sequence found
        pos = max - 1;
        while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

        // Fuckup - very small and broken sequence,
        // return max, because we should return something anyway.
        if (pos < 0) { return max; }

        // If we came to start of buffer - that means vuffer is too small,
        // return max too.
        if (pos === 0) { return max; }

        return (pos + _utf8len[buf[pos]] > max) ? pos : max;
    };

},{"./common":1}],3:[function(require,module,exports){
    'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

    function adler32(adler, buf, len, pos) {
        var s1 = (adler & 0xffff) |0,
            s2 = ((adler >>> 16) & 0xffff) |0,
            n = 0;

        while (len !== 0) {
            // Set limit ~ twice less than 5552, to keep
            // s2 in 31-bits, because we force signed ints.
            // in other case %= will fail.
            n = len > 2000 ? 2000 : len;
            len -= n;

            do {
                s1 = (s1 + buf[pos++]) |0;
                s2 = (s2 + s1) |0;
            } while (--n);

            s1 %= 65521;
            s2 %= 65521;
        }

        return (s1 | (s2 << 16)) |0;
    }


    module.exports = adler32;

},{}],4:[function(require,module,exports){
    'use strict';


    module.exports = {

        /* Allowed flush values; see deflate() and inflate() below for details */
        Z_NO_FLUSH:         0,
        Z_PARTIAL_FLUSH:    1,
        Z_SYNC_FLUSH:       2,
        Z_FULL_FLUSH:       3,
        Z_FINISH:           4,
        Z_BLOCK:            5,
        Z_TREES:            6,

        /* Return codes for the compression/decompression functions. Negative values
         * are errors, positive values are used for special but normal events.
         */
        Z_OK:               0,
        Z_STREAM_END:       1,
        Z_NEED_DICT:        2,
        Z_ERRNO:           -1,
        Z_STREAM_ERROR:    -2,
        Z_DATA_ERROR:      -3,
        //Z_MEM_ERROR:     -4,
        Z_BUF_ERROR:       -5,
        //Z_VERSION_ERROR: -6,

        /* compression levels */
        Z_NO_COMPRESSION:         0,
        Z_BEST_SPEED:             1,
        Z_BEST_COMPRESSION:       9,
        Z_DEFAULT_COMPRESSION:   -1,


        Z_FILTERED:               1,
        Z_HUFFMAN_ONLY:           2,
        Z_RLE:                    3,
        Z_FIXED:                  4,
        Z_DEFAULT_STRATEGY:       0,

        /* Possible values of the data_type field (though see inflate()) */
        Z_BINARY:                 0,
        Z_TEXT:                   1,
        //Z_ASCII:                1, // = Z_TEXT (deprecated)
        Z_UNKNOWN:                2,

        /* The deflate compression method */
        Z_DEFLATED:               8
        //Z_NULL:                 null // Use -1 or null inline, depending on var type
    };

},{}],5:[function(require,module,exports){
    'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
    function makeTable() {
        var c, table = [];

        for (var n = 0; n < 256; n++) {
            c = n;
            for (var k = 0; k < 8; k++) {
                c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            table[n] = c;
        }

        return table;
    }

// Create table on load. Just 255 signed longs. Not a problem.
    var crcTable = makeTable();


    function crc32(crc, buf, len, pos) {
        var t = crcTable,
            end = pos + len;

        crc ^= -1;

        for (var i = pos; i < end; i++) {
            crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
        }

        return (crc ^ (-1)); // >>> 0;
    }


    module.exports = crc32;

},{}],6:[function(require,module,exports){
    'use strict';


    function GZheader() {
        /* true if compressed data believed to be text */
        this.text       = 0;
        /* modification time */
        this.time       = 0;
        /* extra flags (not used when writing a gzip file) */
        this.xflags     = 0;
        /* operating system */
        this.os         = 0;
        /* pointer to extra field or Z_NULL if none */
        this.extra      = null;
        /* extra field length (valid if extra != Z_NULL) */
        this.extra_len  = 0; // Actually, we don't need it in JS,
                             // but leave for few code modifications

        //
        // Setup limits is not necessary because in js we should not preallocate memory
        // for inflate use constant limit in 65536 bytes
        //

        /* space at extra (only when reading header) */
        // this.extra_max  = 0;
        /* pointer to zero-terminated file name or Z_NULL */
        this.name       = '';
        /* space at name (only when reading header) */
        // this.name_max   = 0;
        /* pointer to zero-terminated comment or Z_NULL */
        this.comment    = '';
        /* space at comment (only when reading header) */
        // this.comm_max   = 0;
        /* true if there was or will be a header crc */
        this.hcrc       = 0;
        /* true when done reading gzip header (not used when writing a gzip file) */
        this.done       = false;
    }

    module.exports = GZheader;

},{}],7:[function(require,module,exports){
    'use strict';

// See state defs from inflate.js
    var BAD = 30;       /* got a data error -- remain here until reset */
    var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

    /*
     Decode literal, length, and distance codes and write out the resulting
     literal and match bytes until either not enough input or output is
     available, an end-of-block is encountered, or a data error is encountered.
     When large enough input and output buffers are supplied to inflate(), for
     example, a 16K input buffer and a 64K output buffer, more than 95% of the
     inflate execution time is spent in this routine.

     Entry assumptions:

     state.mode === LEN
     strm.avail_in >= 6
     strm.avail_out >= 258
     start >= strm.avail_out
     state.bits < 8

     On return, state.mode is one of:

     LEN -- ran out of enough output space or enough available input
     TYPE -- reached end of block code, inflate() to interpret next block
     BAD -- error in block data

     Notes:

     - The maximum input bits used by a length/distance pair is 15 bits for the
     length code, 5 bits for the length extra, 15 bits for the distance code,
     and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
     Therefore if strm.avail_in >= 6, then there is enough input to avoid
     checking for available input while decoding.

     - The maximum bytes that a single length/distance pair can output is 258
     bytes, which is the maximum length that can be coded.  inflate_fast()
     requires strm.avail_out >= 258 for each loop to avoid checking for
     output space.
     */
    module.exports = function inflate_fast(strm, start) {
        var state;
        var _in;                    /* local strm.input */
        var last;                   /* have enough input while in < last */
        var _out;                   /* local strm.output */
        var beg;                    /* inflate()'s initial strm.output */
        var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
        var dmax;                   /* maximum distance from zlib header */
//#endif
        var wsize;                  /* window size or zero if not using window */
        var whave;                  /* valid bytes in the window */
        var wnext;                  /* window write index */
        // Use `s_window` instead `window`, avoid conflict with instrumentation tools
        var s_window;               /* allocated sliding window, if wsize != 0 */
        var hold;                   /* local strm.hold */
        var bits;                   /* local strm.bits */
        var lcode;                  /* local strm.lencode */
        var dcode;                  /* local strm.distcode */
        var lmask;                  /* mask for first level of length codes */
        var dmask;                  /* mask for first level of distance codes */
        var here;                   /* retrieved table entry */
        var op;                     /* code bits, operation, extra bits, or */
        /*  window position, window bytes to copy */
        var len;                    /* match length, unused bytes */
        var dist;                   /* match distance */
        var from;                   /* where to copy match from */
        var from_source;


        var input, output; // JS specific, because we have no pointers

        /* copy state to local variables */
        state = strm.state;
        //here = state.here;
        _in = strm.next_in;
        input = strm.input;
        last = _in + (strm.avail_in - 5);
        _out = strm.next_out;
        output = strm.output;
        beg = _out - (start - strm.avail_out);
        end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
        dmax = state.dmax;
//#endif
        wsize = state.wsize;
        whave = state.whave;
        wnext = state.wnext;
        s_window = state.window;
        hold = state.hold;
        bits = state.bits;
        lcode = state.lencode;
        dcode = state.distcode;
        lmask = (1 << state.lenbits) - 1;
        dmask = (1 << state.distbits) - 1;


        /* decode literals and length/distances until end-of-block or not enough
         input data or output space */

        top:
            do {
                if (bits < 15) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    hold += input[_in++] << bits;
                    bits += 8;
                }

                here = lcode[hold & lmask];

                dolen:
                    for (;;) { // Goto emulation
                        op = here >>> 24/*here.bits*/;
                        hold >>>= op;
                        bits -= op;
                        op = (here >>> 16) & 0xff/*here.op*/;
                        if (op === 0) {                          /* literal */
                            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                            //        "inflate:         literal '%c'\n" :
                            //        "inflate:         literal 0x%02x\n", here.val));
                            output[_out++] = here & 0xffff/*here.val*/;
                        }
                        else if (op & 16) {                     /* length base */
                            len = here & 0xffff/*here.val*/;
                            op &= 15;                           /* number of extra bits */
                            if (op) {
                                if (bits < op) {
                                    hold += input[_in++] << bits;
                                    bits += 8;
                                }
                                len += hold & ((1 << op) - 1);
                                hold >>>= op;
                                bits -= op;
                            }
                            //Tracevv((stderr, "inflate:         length %u\n", len));
                            if (bits < 15) {
                                hold += input[_in++] << bits;
                                bits += 8;
                                hold += input[_in++] << bits;
                                bits += 8;
                            }
                            here = dcode[hold & dmask];

                            dodist:
                                for (;;) { // goto emulation
                                    op = here >>> 24/*here.bits*/;
                                    hold >>>= op;
                                    bits -= op;
                                    op = (here >>> 16) & 0xff/*here.op*/;

                                    if (op & 16) {                      /* distance base */
                                        dist = here & 0xffff/*here.val*/;
                                        op &= 15;                       /* number of extra bits */
                                        if (bits < op) {
                                            hold += input[_in++] << bits;
                                            bits += 8;
                                            if (bits < op) {
                                                hold += input[_in++] << bits;
                                                bits += 8;
                                            }
                                        }
                                        dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
                                        if (dist > dmax) {
                                            strm.msg = 'invalid distance too far back';
                                            state.mode = BAD;
                                            break top;
                                        }
//#endif
                                        hold >>>= op;
                                        bits -= op;
                                        //Tracevv((stderr, "inflate:         distance %u\n", dist));
                                        op = _out - beg;                /* max distance in output */
                                        if (dist > op) {                /* see if copy from window */
                                            op = dist - op;               /* distance back in window */
                                            if (op > whave) {
                                                if (state.sane) {
                                                    strm.msg = 'invalid distance too far back';
                                                    state.mode = BAD;
                                                    break top;
                                                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
                                            }
                                            from = 0; // window index
                                            from_source = s_window;
                                            if (wnext === 0) {           /* very common case */
                                                from += wsize - op;
                                                if (op < len) {         /* some from window */
                                                    len -= op;
                                                    do {
                                                        output[_out++] = s_window[from++];
                                                    } while (--op);
                                                    from = _out - dist;  /* rest from output */
                                                    from_source = output;
                                                }
                                            }
                                            else if (wnext < op) {      /* wrap around window */
                                                from += wsize + wnext - op;
                                                op -= wnext;
                                                if (op < len) {         /* some from end of window */
                                                    len -= op;
                                                    do {
                                                        output[_out++] = s_window[from++];
                                                    } while (--op);
                                                    from = 0;
                                                    if (wnext < len) {  /* some from start of window */
                                                        op = wnext;
                                                        len -= op;
                                                        do {
                                                            output[_out++] = s_window[from++];
                                                        } while (--op);
                                                        from = _out - dist;      /* rest from output */
                                                        from_source = output;
                                                    }
                                                }
                                            }
                                            else {                      /* contiguous in window */
                                                from += wnext - op;
                                                if (op < len) {         /* some from window */
                                                    len -= op;
                                                    do {
                                                        output[_out++] = s_window[from++];
                                                    } while (--op);
                                                    from = _out - dist;  /* rest from output */
                                                    from_source = output;
                                                }
                                            }
                                            while (len > 2) {
                                                output[_out++] = from_source[from++];
                                                output[_out++] = from_source[from++];
                                                output[_out++] = from_source[from++];
                                                len -= 3;
                                            }
                                            if (len) {
                                                output[_out++] = from_source[from++];
                                                if (len > 1) {
                                                    output[_out++] = from_source[from++];
                                                }
                                            }
                                        }
                                        else {
                                            from = _out - dist;          /* copy direct from output */
                                            do {                        /* minimum length is three */
                                                output[_out++] = output[from++];
                                                output[_out++] = output[from++];
                                                output[_out++] = output[from++];
                                                len -= 3;
                                            } while (len > 2);
                                            if (len) {
                                                output[_out++] = output[from++];
                                                if (len > 1) {
                                                    output[_out++] = output[from++];
                                                }
                                            }
                                        }
                                    }
                                    else if ((op & 64) === 0) {          /* 2nd level distance code */
                                        here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                                        continue dodist;
                                    }
                                    else {
                                        strm.msg = 'invalid distance code';
                                        state.mode = BAD;
                                        break top;
                                    }

                                    break; // need to emulate goto via "continue"
                                }
                        }
                        else if ((op & 64) === 0) {              /* 2nd level length code */
                            here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
                            continue dolen;
                        }
                        else if (op & 32) {                     /* end-of-block */
                            //Tracevv((stderr, "inflate:         end of block\n"));
                            state.mode = TYPE;
                            break top;
                        }
                        else {
                            strm.msg = 'invalid literal/length code';
                            state.mode = BAD;
                            break top;
                        }

                        break; // need to emulate goto via "continue"
                    }
            } while (_in < last && _out < end);

        /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
        len = bits >> 3;
        _in -= len;
        bits -= len << 3;
        hold &= (1 << bits) - 1;

        /* update state and return */
        strm.next_in = _in;
        strm.next_out = _out;
        strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
        strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
        state.hold = hold;
        state.bits = bits;
        return;
    };

},{}],8:[function(require,module,exports){
    'use strict';


    var utils         = require('../utils/common');
    var adler32       = require('./adler32');
    var crc32         = require('./crc32');
    var inflate_fast  = require('./inffast');
    var inflate_table = require('./inftrees');

    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;

    /* Public constants ==========================================================*/
    /* ===========================================================================*/


    /* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
    var Z_FINISH        = 4;
    var Z_BLOCK         = 5;
    var Z_TREES         = 6;


    /* Return codes for the compression/decompression functions. Negative values
     * are errors, positive values are used for special but normal events.
     */
    var Z_OK            = 0;
    var Z_STREAM_END    = 1;
    var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
    var Z_STREAM_ERROR  = -2;
    var Z_DATA_ERROR    = -3;
    var Z_MEM_ERROR     = -4;
    var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

    /* The deflate compression method */
    var Z_DEFLATED  = 8;


    /* STATES ====================================================================*/
    /* ===========================================================================*/


    var    HEAD = 1;       /* i: waiting for magic header */
    var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
    var    TIME = 3;       /* i: waiting for modification time (gzip) */
    var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
    var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
    var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
    var    NAME = 7;       /* i: waiting for end of file name (gzip) */
    var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
    var    HCRC = 9;       /* i: waiting for header crc (gzip) */
    var    DICTID = 10;    /* i: waiting for dictionary check value */
    var    DICT = 11;      /* waiting for inflateSetDictionary() call */
    var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
    var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
    var        STORED = 14;    /* i: waiting for stored size (length and complement) */
    var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
    var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
    var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
    var        LENLENS = 18;   /* i: waiting for code length code lengths */
    var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
    var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
    var            LEN = 21;       /* i: waiting for length/lit/eob code */
    var            LENEXT = 22;    /* i: waiting for length extra bits */
    var            DIST = 23;      /* i: waiting for distance code */
    var            DISTEXT = 24;   /* i: waiting for distance extra bits */
    var            MATCH = 25;     /* o: waiting for output space to copy string */
    var            LIT = 26;       /* o: waiting for output space to write literal */
    var    CHECK = 27;     /* i: waiting for 32-bit check value */
    var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
    var    DONE = 29;      /* finished check, done -- remain here until reset */
    var    BAD = 30;       /* got a data error -- remain here until reset */
    var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
    var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

    /* ===========================================================================*/



    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

    var MAX_WBITS = 15;
    /* 32K LZ77 window */
    var DEF_WBITS = MAX_WBITS;


    function zswap32(q) {
        return  (((q >>> 24) & 0xff) +
                 ((q >>> 8) & 0xff00) +
                 ((q & 0xff00) << 8) +
                 ((q & 0xff) << 24));
    }


    function InflateState() {
        this.mode = 0;             /* current inflate mode */
        this.last = false;          /* true if processing last block */
        this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
        this.havedict = false;      /* true if dictionary provided */
        this.flags = 0;             /* gzip header method and flags (0 if zlib) */
        this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
        this.check = 0;             /* protected copy of check value */
        this.total = 0;             /* protected copy of output count */
        // TODO: may be {}
        this.head = null;           /* where to save gzip header information */

        /* sliding window */
        this.wbits = 0;             /* log base 2 of requested window size */
        this.wsize = 0;             /* window size or zero if not using window */
        this.whave = 0;             /* valid bytes in the window */
        this.wnext = 0;             /* window write index */
        this.window = null;         /* allocated sliding window, if needed */

        /* bit accumulator */
        this.hold = 0;              /* input bit accumulator */
        this.bits = 0;              /* number of bits in "in" */

        /* for string and stored block copying */
        this.length = 0;            /* literal or length of data to copy */
        this.offset = 0;            /* distance back to copy string from */

        /* for table and code decoding */
        this.extra = 0;             /* extra bits needed */

        /* fixed and dynamic code tables */
        this.lencode = null;          /* starting table for length/literal codes */
        this.distcode = null;         /* starting table for distance codes */
        this.lenbits = 0;           /* index bits for lencode */
        this.distbits = 0;          /* index bits for distcode */

        /* dynamic table building */
        this.ncode = 0;             /* number of code length code lengths */
        this.nlen = 0;              /* number of length code lengths */
        this.ndist = 0;             /* number of distance code lengths */
        this.have = 0;              /* number of code lengths in lens[] */
        this.next = null;              /* next available space in codes[] */

        this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
        this.work = new utils.Buf16(288); /* work area for code table building */

        /*
         because we don't have pointers in js, we use lencode and distcode directly
         as buffers so we don't need codes
         */
        //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
        this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
        this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
        this.sane = 0;                   /* if false, allow invalid distance too far */
        this.back = 0;                   /* bits back of last unprocessed length/lit */
        this.was = 0;                    /* initial length of match */
    }

    function inflateResetKeep(strm) {
        var state;

        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;
        strm.total_in = strm.total_out = state.total = 0;
        strm.msg = ''; /*Z_NULL*/
        if (state.wrap) {       /* to support ill-conceived Java test suite */
            strm.adler = state.wrap & 1;
        }
        state.mode = HEAD;
        state.last = 0;
        state.havedict = 0;
        state.dmax = 32768;
        state.head = null/*Z_NULL*/;
        state.hold = 0;
        state.bits = 0;
        //state.lencode = state.distcode = state.next = state.codes;
        state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
        state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

        state.sane = 1;
        state.back = -1;
        //Tracev((stderr, "inflate: reset\n"));
        return Z_OK;
    }

    function inflateReset(strm) {
        var state;

        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;
        state.wsize = 0;
        state.whave = 0;
        state.wnext = 0;
        return inflateResetKeep(strm);

    }

    function inflateReset2(strm, windowBits) {
        var wrap;
        var state;

        /* get the state */
        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;

        /* extract wrap request from windowBits parameter */
        if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
        }
        else {
            wrap = (windowBits >> 4) + 1;
            if (windowBits < 48) {
                windowBits &= 15;
            }
        }

        /* set number of window bits, free window if different */
        if (windowBits && (windowBits < 8 || windowBits > 15)) {
            return Z_STREAM_ERROR;
        }
        if (state.window !== null && state.wbits !== windowBits) {
            state.window = null;
        }

        /* update state and reset the rest of it */
        state.wrap = wrap;
        state.wbits = windowBits;
        return inflateReset(strm);
    }

    function inflateInit2(strm, windowBits) {
        var ret;
        var state;

        if (!strm) { return Z_STREAM_ERROR; }
        //strm.msg = Z_NULL;                 /* in case we return an error */

        state = new InflateState();

        //if (state === Z_NULL) return Z_MEM_ERROR;
        //Tracev((stderr, "inflate: allocated\n"));
        strm.state = state;
        state.window = null/*Z_NULL*/;
        ret = inflateReset2(strm, windowBits);
        if (ret !== Z_OK) {
            strm.state = null/*Z_NULL*/;
        }
        return ret;
    }

    function inflateInit(strm) {
        return inflateInit2(strm, DEF_WBITS);
    }


    /*
     Return state with length and distance decoding tables and index sizes set to
     fixed code decoding.  Normally this returns fixed tables from inffixed.h.
     If BUILDFIXED is defined, then instead this routine builds the tables the
     first time it's called, and returns those tables the first time and
     thereafter.  This reduces the size of the code by about 2K bytes, in
     exchange for a little execution time.  However, BUILDFIXED should not be
     used for threaded applications, since the rewriting of the tables and virgin
     may not be thread-safe.
     */
    var virgin = true;

    var lenfix, distfix; // We have no pointers in JS, so keep tables separate

    function fixedtables(state) {
        /* build fixed huffman tables if first call (may not be thread safe) */
        if (virgin) {
            var sym;

            lenfix = new utils.Buf32(512);
            distfix = new utils.Buf32(32);

            /* literal/length table */
            sym = 0;
            while (sym < 144) { state.lens[sym++] = 8; }
            while (sym < 256) { state.lens[sym++] = 9; }
            while (sym < 280) { state.lens[sym++] = 7; }
            while (sym < 288) { state.lens[sym++] = 8; }

            inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, { bits: 9 });

            /* distance table */
            sym = 0;
            while (sym < 32) { state.lens[sym++] = 5; }

            inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, { bits: 5 });

            /* do this just once */
            virgin = false;
        }

        state.lencode = lenfix;
        state.lenbits = 9;
        state.distcode = distfix;
        state.distbits = 5;
    }


    /*
     Update the window with the last wsize (normally 32K) bytes written before
     returning.  If window does not exist yet, create it.  This is only called
     when a window is already in use, or when output has been written during this
     inflate call, but the end of the deflate stream has not been reached yet.
     It is also called to create a window for dictionary data when a dictionary
     is loaded.

     Providing output buffers larger than 32K to inflate() should provide a speed
     advantage, since only the last 32K of output is copied to the sliding window
     upon return from inflate(), and since all distances after the first 32K of
     output will fall in the output data, making match copies simpler and faster.
     The advantage may be dependent on the size of the processor's data caches.
     */
    function updatewindow(strm, src, end, copy) {
        var dist;
        var state = strm.state;

        /* if it hasn't been done already, allocate space for the window */
        if (state.window === null) {
            state.wsize = 1 << state.wbits;
            state.wnext = 0;
            state.whave = 0;

            state.window = new utils.Buf8(state.wsize);
        }

        /* copy state->wsize or less output bytes into the circular window */
        if (copy >= state.wsize) {
            utils.arraySet(state.window, src, end - state.wsize, state.wsize, 0);
            state.wnext = 0;
            state.whave = state.wsize;
        }
        else {
            dist = state.wsize - state.wnext;
            if (dist > copy) {
                dist = copy;
            }
            //zmemcpy(state->window + state->wnext, end - copy, dist);
            utils.arraySet(state.window, src, end - copy, dist, state.wnext);
            copy -= dist;
            if (copy) {
                //zmemcpy(state->window, end - copy, copy);
                utils.arraySet(state.window, src, end - copy, copy, 0);
                state.wnext = copy;
                state.whave = state.wsize;
            }
            else {
                state.wnext += dist;
                if (state.wnext === state.wsize) { state.wnext = 0; }
                if (state.whave < state.wsize) { state.whave += dist; }
            }
        }
        return 0;
    }

    function inflate(strm, flush) {
        var state;
        var input, output;          // input/output buffers
        var next;                   /* next input INDEX */
        var put;                    /* next output INDEX */
        var have, left;             /* available input and output */
        var hold;                   /* bit buffer */
        var bits;                   /* bits in bit buffer */
        var _in, _out;              /* save starting available input and output */
        var copy;                   /* number of stored or match bytes to copy */
        var from;                   /* where to copy match bytes from */
        var from_source;
        var here = 0;               /* current decoding table entry */
        var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
        //var last;                   /* parent table entry */
        var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
        var len;                    /* length to copy for repeats, bits to drop */
        var ret;                    /* return code */
        var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
        var opts;

        var n; // temporary var for NEED_BITS

        var order = /* permutation of code lengths */
            [ 16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15 ];


        if (!strm || !strm.state || !strm.output ||
            (!strm.input && strm.avail_in !== 0)) {
            return Z_STREAM_ERROR;
        }

        state = strm.state;
        if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        _in = have;
        _out = left;
        ret = Z_OK;

        inf_leave: // goto emulation
            for (;;) {
                switch (state.mode) {
                    case HEAD:
                        if (state.wrap === 0) {
                            state.mode = TYPEDO;
                            break;
                        }
                        //=== NEEDBITS(16);
                        while (bits < 16) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
                            state.check = 0/*crc32(0L, Z_NULL, 0)*/;
                            //=== CRC2(state.check, hold);
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            state.check = crc32(state.check, hbuf, 2, 0);
                            //===//

                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            state.mode = FLAGS;
                            break;
                        }
                        state.flags = 0;           /* expect zlib header */
                        if (state.head) {
                            state.head.done = false;
                        }
                        if (!(state.wrap & 1) ||   /* check if zlib header allowed */
                            (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
                            strm.msg = 'incorrect header check';
                            state.mode = BAD;
                            break;
                        }
                        if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
                            strm.msg = 'unknown compression method';
                            state.mode = BAD;
                            break;
                        }
                        //--- DROPBITS(4) ---//
                        hold >>>= 4;
                        bits -= 4;
                        //---//
                        len = (hold & 0x0f)/*BITS(4)*/ + 8;
                        if (state.wbits === 0) {
                            state.wbits = len;
                        }
                        else if (len > state.wbits) {
                            strm.msg = 'invalid window size';
                            state.mode = BAD;
                            break;
                        }
                        state.dmax = 1 << len;
                        //Tracev((stderr, "inflate:   zlib header ok\n"));
                        strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
                        state.mode = hold & 0x200 ? DICTID : TYPE;
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        break;
                    case FLAGS:
                        //=== NEEDBITS(16); */
                        while (bits < 16) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        state.flags = hold;
                        if ((state.flags & 0xff) !== Z_DEFLATED) {
                            strm.msg = 'unknown compression method';
                            state.mode = BAD;
                            break;
                        }
                        if (state.flags & 0xe000) {
                            strm.msg = 'unknown header flags set';
                            state.mode = BAD;
                            break;
                        }
                        if (state.head) {
                            state.head.text = ((hold >> 8) & 1);
                        }
                        if (state.flags & 0x0200) {
                            //=== CRC2(state.check, hold);
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            state.check = crc32(state.check, hbuf, 2, 0);
                            //===//
                        }
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = TIME;
                    /* falls through */
                    case TIME:
                        //=== NEEDBITS(32); */
                        while (bits < 32) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if (state.head) {
                            state.head.time = hold;
                        }
                        if (state.flags & 0x0200) {
                            //=== CRC4(state.check, hold)
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            hbuf[2] = (hold >>> 16) & 0xff;
                            hbuf[3] = (hold >>> 24) & 0xff;
                            state.check = crc32(state.check, hbuf, 4, 0);
                            //===
                        }
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = OS;
                    /* falls through */
                    case OS:
                        //=== NEEDBITS(16); */
                        while (bits < 16) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if (state.head) {
                            state.head.xflags = (hold & 0xff);
                            state.head.os = (hold >> 8);
                        }
                        if (state.flags & 0x0200) {
                            //=== CRC2(state.check, hold);
                            hbuf[0] = hold & 0xff;
                            hbuf[1] = (hold >>> 8) & 0xff;
                            state.check = crc32(state.check, hbuf, 2, 0);
                            //===//
                        }
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = EXLEN;
                    /* falls through */
                    case EXLEN:
                        if (state.flags & 0x0400) {
                            //=== NEEDBITS(16); */
                            while (bits < 16) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.length = hold;
                            if (state.head) {
                                state.head.extra_len = hold;
                            }
                            if (state.flags & 0x0200) {
                                //=== CRC2(state.check, hold);
                                hbuf[0] = hold & 0xff;
                                hbuf[1] = (hold >>> 8) & 0xff;
                                state.check = crc32(state.check, hbuf, 2, 0);
                                //===//
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                        }
                        else if (state.head) {
                            state.head.extra = null/*Z_NULL*/;
                        }
                        state.mode = EXTRA;
                    /* falls through */
                    case EXTRA:
                        if (state.flags & 0x0400) {
                            copy = state.length;
                            if (copy > have) { copy = have; }
                            if (copy) {
                                if (state.head) {
                                    len = state.head.extra_len - state.length;
                                    if (!state.head.extra) {
                                        // Use untyped array for more conveniend processing later
                                        state.head.extra = new Array(state.head.extra_len);
                                    }
                                    utils.arraySet(
                                        state.head.extra,
                                        input,
                                        next,
                                        // extra field is limited to 65536 bytes
                                        // - no need for additional size check
                                        copy,
                                        /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                                        len
                                    );
                                    //zmemcpy(state.head.extra + len, next,
                                    //        len + copy > state.head.extra_max ?
                                    //        state.head.extra_max - len : copy);
                                }
                                if (state.flags & 0x0200) {
                                    state.check = crc32(state.check, input, copy, next);
                                }
                                have -= copy;
                                next += copy;
                                state.length -= copy;
                            }
                            if (state.length) { break inf_leave; }
                        }
                        state.length = 0;
                        state.mode = NAME;
                    /* falls through */
                    case NAME:
                        if (state.flags & 0x0800) {
                            if (have === 0) { break inf_leave; }
                            copy = 0;
                            do {
                                // TODO: 2 or 1 bytes?
                                len = input[next + copy++];
                                /* use constant limit because in js we should not preallocate memory */
                                if (state.head && len &&
                                    (state.length < 65536 /*state.head.name_max*/)) {
                                    state.head.name += String.fromCharCode(len);
                                }
                            } while (len && copy < have);

                            if (state.flags & 0x0200) {
                                state.check = crc32(state.check, input, copy, next);
                            }
                            have -= copy;
                            next += copy;
                            if (len) { break inf_leave; }
                        }
                        else if (state.head) {
                            state.head.name = null;
                        }
                        state.length = 0;
                        state.mode = COMMENT;
                    /* falls through */
                    case COMMENT:
                        if (state.flags & 0x1000) {
                            if (have === 0) { break inf_leave; }
                            copy = 0;
                            do {
                                len = input[next + copy++];
                                /* use constant limit because in js we should not preallocate memory */
                                if (state.head && len &&
                                    (state.length < 65536 /*state.head.comm_max*/)) {
                                    state.head.comment += String.fromCharCode(len);
                                }
                            } while (len && copy < have);
                            if (state.flags & 0x0200) {
                                state.check = crc32(state.check, input, copy, next);
                            }
                            have -= copy;
                            next += copy;
                            if (len) { break inf_leave; }
                        }
                        else if (state.head) {
                            state.head.comment = null;
                        }
                        state.mode = HCRC;
                    /* falls through */
                    case HCRC:
                        if (state.flags & 0x0200) {
                            //=== NEEDBITS(16); */
                            while (bits < 16) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if (hold !== (state.check & 0xffff)) {
                                strm.msg = 'header crc mismatch';
                                state.mode = BAD;
                                break;
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                        }
                        if (state.head) {
                            state.head.hcrc = ((state.flags >> 9) & 1);
                            state.head.done = true;
                        }
                        strm.adler = state.check = 0;
                        state.mode = TYPE;
                        break;
                    case DICTID:
                        //=== NEEDBITS(32); */
                        while (bits < 32) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        strm.adler = state.check = zswap32(hold);
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = DICT;
                    /* falls through */
                    case DICT:
                        if (state.havedict === 0) {
                            //--- RESTORE() ---
                            strm.next_out = put;
                            strm.avail_out = left;
                            strm.next_in = next;
                            strm.avail_in = have;
                            state.hold = hold;
                            state.bits = bits;
                            //---
                            return Z_NEED_DICT;
                        }
                        strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
                        state.mode = TYPE;
                    /* falls through */
                    case TYPE:
                        if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
                    /* falls through */
                    case TYPEDO:
                        if (state.last) {
                            //--- BYTEBITS() ---//
                            hold >>>= bits & 7;
                            bits -= bits & 7;
                            //---//
                            state.mode = CHECK;
                            break;
                        }
                        //=== NEEDBITS(3); */
                        while (bits < 3) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        state.last = (hold & 0x01)/*BITS(1)*/;
                        //--- DROPBITS(1) ---//
                        hold >>>= 1;
                        bits -= 1;
                        //---//

                        switch ((hold & 0x03)/*BITS(2)*/) {
                            case 0:                             /* stored block */
                                //Tracev((stderr, "inflate:     stored block%s\n",
                                //        state.last ? " (last)" : ""));
                                state.mode = STORED;
                                break;
                            case 1:                             /* fixed block */
                                fixedtables(state);
                                //Tracev((stderr, "inflate:     fixed codes block%s\n",
                                //        state.last ? " (last)" : ""));
                                state.mode = LEN_;             /* decode codes */
                                if (flush === Z_TREES) {
                                    //--- DROPBITS(2) ---//
                                    hold >>>= 2;
                                    bits -= 2;
                                    //---//
                                    break inf_leave;
                                }
                                break;
                            case 2:                             /* dynamic block */
                                //Tracev((stderr, "inflate:     dynamic codes block%s\n",
                                //        state.last ? " (last)" : ""));
                                state.mode = TABLE;
                                break;
                            case 3:
                                strm.msg = 'invalid block type';
                                state.mode = BAD;
                        }
                        //--- DROPBITS(2) ---//
                        hold >>>= 2;
                        bits -= 2;
                        //---//
                        break;
                    case STORED:
                        //--- BYTEBITS() ---// /* go to byte boundary */
                        hold >>>= bits & 7;
                        bits -= bits & 7;
                        //---//
                        //=== NEEDBITS(32); */
                        while (bits < 32) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
                            strm.msg = 'invalid stored block lengths';
                            state.mode = BAD;
                            break;
                        }
                        state.length = hold & 0xffff;
                        //Tracev((stderr, "inflate:       stored length %u\n",
                        //        state.length));
                        //=== INITBITS();
                        hold = 0;
                        bits = 0;
                        //===//
                        state.mode = COPY_;
                        if (flush === Z_TREES) { break inf_leave; }
                    /* falls through */
                    case COPY_:
                        state.mode = COPY;
                    /* falls through */
                    case COPY:
                        copy = state.length;
                        if (copy) {
                            if (copy > have) { copy = have; }
                            if (copy > left) { copy = left; }
                            if (copy === 0) { break inf_leave; }
                            //--- zmemcpy(put, next, copy); ---
                            utils.arraySet(output, input, next, copy, put);
                            //---//
                            have -= copy;
                            next += copy;
                            left -= copy;
                            put += copy;
                            state.length -= copy;
                            break;
                        }
                        //Tracev((stderr, "inflate:       stored end\n"));
                        state.mode = TYPE;
                        break;
                    case TABLE:
                        //=== NEEDBITS(14); */
                        while (bits < 14) {
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        //===//
                        state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
                        //--- DROPBITS(5) ---//
                        hold >>>= 5;
                        bits -= 5;
                        //---//
                        state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
                        //--- DROPBITS(5) ---//
                        hold >>>= 5;
                        bits -= 5;
                        //---//
                        state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
                        //--- DROPBITS(4) ---//
                        hold >>>= 4;
                        bits -= 4;
                        //---//
//#ifndef PKZIP_BUG_WORKAROUND
                        if (state.nlen > 286 || state.ndist > 30) {
                            strm.msg = 'too many length or distance symbols';
                            state.mode = BAD;
                            break;
                        }
//#endif
                        //Tracev((stderr, "inflate:       table sizes ok\n"));
                        state.have = 0;
                        state.mode = LENLENS;
                    /* falls through */
                    case LENLENS:
                        while (state.have < state.ncode) {
                            //=== NEEDBITS(3);
                            while (bits < 3) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
                            //--- DROPBITS(3) ---//
                            hold >>>= 3;
                            bits -= 3;
                            //---//
                        }
                        while (state.have < 19) {
                            state.lens[order[state.have++]] = 0;
                        }
                        // We have separate tables & no pointers. 2 commented lines below not needed.
                        //state.next = state.codes;
                        //state.lencode = state.next;
                        // Switch to use dynamic table
                        state.lencode = state.lendyn;
                        state.lenbits = 7;

                        opts = { bits: state.lenbits };
                        ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                        state.lenbits = opts.bits;

                        if (ret) {
                            strm.msg = 'invalid code lengths set';
                            state.mode = BAD;
                            break;
                        }
                        //Tracev((stderr, "inflate:       code lengths ok\n"));
                        state.have = 0;
                        state.mode = CODELENS;
                    /* falls through */
                    case CODELENS:
                        while (state.have < state.nlen + state.ndist) {
                            for (;;) {
                                here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if ((here_bits) <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            if (here_val < 16) {
                                //--- DROPBITS(here.bits) ---//
                                hold >>>= here_bits;
                                bits -= here_bits;
                                //---//
                                state.lens[state.have++] = here_val;
                            }
                            else {
                                if (here_val === 16) {
                                    //=== NEEDBITS(here.bits + 2);
                                    n = here_bits + 2;
                                    while (bits < n) {
                                        if (have === 0) { break inf_leave; }
                                        have--;
                                        hold += input[next++] << bits;
                                        bits += 8;
                                    }
                                    //===//
                                    //--- DROPBITS(here.bits) ---//
                                    hold >>>= here_bits;
                                    bits -= here_bits;
                                    //---//
                                    if (state.have === 0) {
                                        strm.msg = 'invalid bit length repeat';
                                        state.mode = BAD;
                                        break;
                                    }
                                    len = state.lens[state.have - 1];
                                    copy = 3 + (hold & 0x03);//BITS(2);
                                    //--- DROPBITS(2) ---//
                                    hold >>>= 2;
                                    bits -= 2;
                                    //---//
                                }
                                else if (here_val === 17) {
                                    //=== NEEDBITS(here.bits + 3);
                                    n = here_bits + 3;
                                    while (bits < n) {
                                        if (have === 0) { break inf_leave; }
                                        have--;
                                        hold += input[next++] << bits;
                                        bits += 8;
                                    }
                                    //===//
                                    //--- DROPBITS(here.bits) ---//
                                    hold >>>= here_bits;
                                    bits -= here_bits;
                                    //---//
                                    len = 0;
                                    copy = 3 + (hold & 0x07);//BITS(3);
                                    //--- DROPBITS(3) ---//
                                    hold >>>= 3;
                                    bits -= 3;
                                    //---//
                                }
                                else {
                                    //=== NEEDBITS(here.bits + 7);
                                    n = here_bits + 7;
                                    while (bits < n) {
                                        if (have === 0) { break inf_leave; }
                                        have--;
                                        hold += input[next++] << bits;
                                        bits += 8;
                                    }
                                    //===//
                                    //--- DROPBITS(here.bits) ---//
                                    hold >>>= here_bits;
                                    bits -= here_bits;
                                    //---//
                                    len = 0;
                                    copy = 11 + (hold & 0x7f);//BITS(7);
                                    //--- DROPBITS(7) ---//
                                    hold >>>= 7;
                                    bits -= 7;
                                    //---//
                                }
                                if (state.have + copy > state.nlen + state.ndist) {
                                    strm.msg = 'invalid bit length repeat';
                                    state.mode = BAD;
                                    break;
                                }
                                while (copy--) {
                                    state.lens[state.have++] = len;
                                }
                            }
                        }

                        /* handle error breaks in while */
                        if (state.mode === BAD) { break; }

                        /* check for end-of-block code (better have one) */
                        if (state.lens[256] === 0) {
                            strm.msg = 'invalid code -- missing end-of-block';
                            state.mode = BAD;
                            break;
                        }

                        /* build code tables -- note: do not change the lenbits or distbits
                         values here (9 and 6) without reading the comments in inftrees.h
                         concerning the ENOUGH constants, which depend on those values */
                        state.lenbits = 9;

                        opts = { bits: state.lenbits };
                        ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                        // We have separate tables & no pointers. 2 commented lines below not needed.
                        // state.next_index = opts.table_index;
                        state.lenbits = opts.bits;
                        // state.lencode = state.next;

                        if (ret) {
                            strm.msg = 'invalid literal/lengths set';
                            state.mode = BAD;
                            break;
                        }

                        state.distbits = 6;
                        //state.distcode.copy(state.codes);
                        // Switch to use dynamic table
                        state.distcode = state.distdyn;
                        opts = { bits: state.distbits };
                        ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                        // We have separate tables & no pointers. 2 commented lines below not needed.
                        // state.next_index = opts.table_index;
                        state.distbits = opts.bits;
                        // state.distcode = state.next;

                        if (ret) {
                            strm.msg = 'invalid distances set';
                            state.mode = BAD;
                            break;
                        }
                        //Tracev((stderr, 'inflate:       codes ok\n'));
                        state.mode = LEN_;
                        if (flush === Z_TREES) { break inf_leave; }
                    /* falls through */
                    case LEN_:
                        state.mode = LEN;
                    /* falls through */
                    case LEN:
                        if (have >= 6 && left >= 258) {
                            //--- RESTORE() ---
                            strm.next_out = put;
                            strm.avail_out = left;
                            strm.next_in = next;
                            strm.avail_in = have;
                            state.hold = hold;
                            state.bits = bits;
                            //---
                            inflate_fast(strm, _out);
                            //--- LOAD() ---
                            put = strm.next_out;
                            output = strm.output;
                            left = strm.avail_out;
                            next = strm.next_in;
                            input = strm.input;
                            have = strm.avail_in;
                            hold = state.hold;
                            bits = state.bits;
                            //---

                            if (state.mode === TYPE) {
                                state.back = -1;
                            }
                            break;
                        }
                        state.back = 0;
                        for (;;) {
                            here = state.lencode[hold & ((1 << state.lenbits) - 1)];  /*BITS(state.lenbits)*/
                            here_bits = here >>> 24;
                            here_op = (here >>> 16) & 0xff;
                            here_val = here & 0xffff;

                            if (here_bits <= bits) { break; }
                            //--- PULLBYTE() ---//
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                            //---//
                        }
                        if (here_op && (here_op & 0xf0) === 0) {
                            last_bits = here_bits;
                            last_op = here_op;
                            last_val = here_val;
                            for (;;) {
                                here = state.lencode[last_val +
                                                     ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if ((last_bits + here_bits) <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            //--- DROPBITS(last.bits) ---//
                            hold >>>= last_bits;
                            bits -= last_bits;
                            //---//
                            state.back += last_bits;
                        }
                        //--- DROPBITS(here.bits) ---//
                        hold >>>= here_bits;
                        bits -= here_bits;
                        //---//
                        state.back += here_bits;
                        state.length = here_val;
                        if (here_op === 0) {
                            //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
                            //        "inflate:         literal '%c'\n" :
                            //        "inflate:         literal 0x%02x\n", here.val));
                            state.mode = LIT;
                            break;
                        }
                        if (here_op & 32) {
                            //Tracevv((stderr, "inflate:         end of block\n"));
                            state.back = -1;
                            state.mode = TYPE;
                            break;
                        }
                        if (here_op & 64) {
                            strm.msg = 'invalid literal/length code';
                            state.mode = BAD;
                            break;
                        }
                        state.extra = here_op & 15;
                        state.mode = LENEXT;
                    /* falls through */
                    case LENEXT:
                        if (state.extra) {
                            //=== NEEDBITS(state.extra);
                            n = state.extra;
                            while (bits < n) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.length += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
                            //--- DROPBITS(state.extra) ---//
                            hold >>>= state.extra;
                            bits -= state.extra;
                            //---//
                            state.back += state.extra;
                        }
                        //Tracevv((stderr, "inflate:         length %u\n", state.length));
                        state.was = state.length;
                        state.mode = DIST;
                    /* falls through */
                    case DIST:
                        for (;;) {
                            here = state.distcode[hold & ((1 << state.distbits) - 1)];/*BITS(state.distbits)*/
                            here_bits = here >>> 24;
                            here_op = (here >>> 16) & 0xff;
                            here_val = here & 0xffff;

                            if ((here_bits) <= bits) { break; }
                            //--- PULLBYTE() ---//
                            if (have === 0) { break inf_leave; }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                            //---//
                        }
                        if ((here_op & 0xf0) === 0) {
                            last_bits = here_bits;
                            last_op = here_op;
                            last_val = here_val;
                            for (;;) {
                                here = state.distcode[last_val +
                                                      ((hold & ((1 << (last_bits + last_op)) - 1))/*BITS(last.bits + last.op)*/ >> last_bits)];
                                here_bits = here >>> 24;
                                here_op = (here >>> 16) & 0xff;
                                here_val = here & 0xffff;

                                if ((last_bits + here_bits) <= bits) { break; }
                                //--- PULLBYTE() ---//
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                                //---//
                            }
                            //--- DROPBITS(last.bits) ---//
                            hold >>>= last_bits;
                            bits -= last_bits;
                            //---//
                            state.back += last_bits;
                        }
                        //--- DROPBITS(here.bits) ---//
                        hold >>>= here_bits;
                        bits -= here_bits;
                        //---//
                        state.back += here_bits;
                        if (here_op & 64) {
                            strm.msg = 'invalid distance code';
                            state.mode = BAD;
                            break;
                        }
                        state.offset = here_val;
                        state.extra = (here_op) & 15;
                        state.mode = DISTEXT;
                    /* falls through */
                    case DISTEXT:
                        if (state.extra) {
                            //=== NEEDBITS(state.extra);
                            n = state.extra;
                            while (bits < n) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            state.offset += hold & ((1 << state.extra) - 1)/*BITS(state.extra)*/;
                            //--- DROPBITS(state.extra) ---//
                            hold >>>= state.extra;
                            bits -= state.extra;
                            //---//
                            state.back += state.extra;
                        }
//#ifdef INFLATE_STRICT
                        if (state.offset > state.dmax) {
                            strm.msg = 'invalid distance too far back';
                            state.mode = BAD;
                            break;
                        }
//#endif
                        //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
                        state.mode = MATCH;
                    /* falls through */
                    case MATCH:
                        if (left === 0) { break inf_leave; }
                        copy = _out - left;
                        if (state.offset > copy) {         /* copy from window */
                            copy = state.offset - copy;
                            if (copy > state.whave) {
                                if (state.sane) {
                                    strm.msg = 'invalid distance too far back';
                                    state.mode = BAD;
                                    break;
                                }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
                            }
                            if (copy > state.wnext) {
                                copy -= state.wnext;
                                from = state.wsize - copy;
                            }
                            else {
                                from = state.wnext - copy;
                            }
                            if (copy > state.length) { copy = state.length; }
                            from_source = state.window;
                        }
                        else {                              /* copy from output */
                            from_source = output;
                            from = put - state.offset;
                            copy = state.length;
                        }
                        if (copy > left) { copy = left; }
                        left -= copy;
                        state.length -= copy;
                        do {
                            output[put++] = from_source[from++];
                        } while (--copy);
                        if (state.length === 0) { state.mode = LEN; }
                        break;
                    case LIT:
                        if (left === 0) { break inf_leave; }
                        output[put++] = state.length;
                        left--;
                        state.mode = LEN;
                        break;
                    case CHECK:
                        if (state.wrap) {
                            //=== NEEDBITS(32);
                            while (bits < 32) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                // Use '|' insdead of '+' to make sure that result is signed
                                hold |= input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            _out -= left;
                            strm.total_out += _out;
                            state.total += _out;
                            if (_out) {
                                strm.adler = state.check =
                                    /*UPDATE(state.check, put - _out, _out);*/
                                    (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

                            }
                            _out = left;
                            // NB: crc32 stored as signed 32-bit int, zswap32 returns signed too
                            if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                                strm.msg = 'incorrect data check';
                                state.mode = BAD;
                                break;
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            //Tracev((stderr, "inflate:   check matches trailer\n"));
                        }
                        state.mode = LENGTH;
                    /* falls through */
                    case LENGTH:
                        if (state.wrap && state.flags) {
                            //=== NEEDBITS(32);
                            while (bits < 32) {
                                if (have === 0) { break inf_leave; }
                                have--;
                                hold += input[next++] << bits;
                                bits += 8;
                            }
                            //===//
                            if (hold !== (state.total & 0xffffffff)) {
                                strm.msg = 'incorrect length check';
                                state.mode = BAD;
                                break;
                            }
                            //=== INITBITS();
                            hold = 0;
                            bits = 0;
                            //===//
                            //Tracev((stderr, "inflate:   length matches trailer\n"));
                        }
                        state.mode = DONE;
                    /* falls through */
                    case DONE:
                        ret = Z_STREAM_END;
                        break inf_leave;
                    case BAD:
                        ret = Z_DATA_ERROR;
                        break inf_leave;
                    case MEM:
                        return Z_MEM_ERROR;
                    case SYNC:
                    /* falls through */
                    default:
                        return Z_STREAM_ERROR;
                }
            }

        // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

        /*
         Return from inflate(), updating the total counts and the check value.
         If there was no progress during the inflate() call, return a buffer
         error.  Call updatewindow() to create and/or update the window state.
         Note: a memory error from inflate() is non-recoverable.
         */

        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---

        if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                            (state.mode < CHECK || flush !== Z_FINISH))) {
            if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
                state.mode = MEM;
                return Z_MEM_ERROR;
            }
        }
        _in -= strm.avail_in;
        _out -= strm.avail_out;
        strm.total_in += _in;
        strm.total_out += _out;
        state.total += _out;
        if (state.wrap && _out) {
            strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
                (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
        }
        strm.data_type = state.bits + (state.last ? 64 : 0) +
                         (state.mode === TYPE ? 128 : 0) +
                         (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
        if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
            ret = Z_BUF_ERROR;
        }
        return ret;
    }

    function inflateEnd(strm) {

        if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
            return Z_STREAM_ERROR;
        }

        var state = strm.state;
        if (state.window) {
            state.window = null;
        }
        strm.state = null;
        return Z_OK;
    }

    function inflateGetHeader(strm, head) {
        var state;

        /* check state */
        if (!strm || !strm.state) { return Z_STREAM_ERROR; }
        state = strm.state;
        if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

        /* save header structure */
        state.head = head;
        head.done = false;
        return Z_OK;
    }

    function inflateSetDictionary(strm, dictionary) {
        var dictLength = dictionary.length;

        var state;
        var dictid;
        var ret;

        /* check state */
        if (!strm /* == Z_NULL */ || !strm.state /* == Z_NULL */) { return Z_STREAM_ERROR; }
        state = strm.state;

        if (state.wrap !== 0 && state.mode !== DICT) {
            return Z_STREAM_ERROR;
        }

        /* check for correct dictionary identifier */
        if (state.mode === DICT) {
            dictid = 1; /* adler32(0, null, 0)*/
            /* dictid = adler32(dictid, dictionary, dictLength); */
            dictid = adler32(dictid, dictionary, dictLength, 0);
            if (dictid !== state.check) {
                return Z_DATA_ERROR;
            }
        }
        /* copy dictionary to window using updatewindow(), which will amend the
         existing dictionary if appropriate */
        ret = updatewindow(strm, dictionary, dictLength, dictLength);
        if (ret) {
            state.mode = MEM;
            return Z_MEM_ERROR;
        }
        state.havedict = 1;
        // Tracev((stderr, "inflate:   dictionary set\n"));
        return Z_OK;
    }

    exports.inflateReset = inflateReset;
    exports.inflateReset2 = inflateReset2;
    exports.inflateResetKeep = inflateResetKeep;
    exports.inflateInit = inflateInit;
    exports.inflateInit2 = inflateInit2;
    exports.inflate = inflate;
    exports.inflateEnd = inflateEnd;
    exports.inflateGetHeader = inflateGetHeader;
    exports.inflateSetDictionary = inflateSetDictionary;
    exports.inflateInfo = 'pako inflate (from Nodeca project)';

    /* Not implemented
     exports.inflateCopy = inflateCopy;
     exports.inflateGetDictionary = inflateGetDictionary;
     exports.inflateMark = inflateMark;
     exports.inflatePrime = inflatePrime;
     exports.inflateSync = inflateSync;
     exports.inflateSyncPoint = inflateSyncPoint;
     exports.inflateUndermine = inflateUndermine;
     */

},{"../utils/common":1,"./adler32":3,"./crc32":5,"./inffast":7,"./inftrees":9}],9:[function(require,module,exports){
    'use strict';


    var utils = require('../utils/common');

    var MAXBITS = 15;
    var ENOUGH_LENS = 852;
    var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

    var CODES = 0;
    var LENS = 1;
    var DISTS = 2;

    var lbase = [ /* Length codes 257..285 base */
        3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
        35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
    ];

    var lext = [ /* Length codes 257..285 extra */
        16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
        19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
    ];

    var dbase = [ /* Distance codes 0..29 base */
        1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
        257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
        8193, 12289, 16385, 24577, 0, 0
    ];

    var dext = [ /* Distance codes 0..29 extra */
        16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
        23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
        28, 28, 29, 29, 64, 64
    ];

    module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
    {
        var bits = opts.bits;
        //here = opts.here; /* table entry for duplication */

        var len = 0;               /* a code's length in bits */
        var sym = 0;               /* index of code symbols */
        var min = 0, max = 0;          /* minimum and maximum code lengths */
        var root = 0;              /* number of index bits for root table */
        var curr = 0;              /* number of index bits for current table */
        var drop = 0;              /* code bits to drop for sub-table */
        var left = 0;                   /* number of prefix codes available */
        var used = 0;              /* code entries in table used */
        var huff = 0;              /* Huffman code */
        var incr;              /* for incrementing code, index */
        var fill;              /* index for replicating entries */
        var low;               /* low bits for current root entry */
        var mask;              /* mask for low root bits */
        var next;             /* next available space in table */
        var base = null;     /* base value table to use */
        var base_index = 0;
//  var shoextra;    /* extra bits table to use */
        var end;                    /* use base and extra for symbol > end */
        var count = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];    /* number of codes of each length */
        var offs = new utils.Buf16(MAXBITS + 1); //[MAXBITS+1];     /* offsets in table for each length */
        var extra = null;
        var extra_index = 0;

        var here_bits, here_op, here_val;

        /*
         Process a set of code lengths to create a canonical Huffman code.  The
         code lengths are lens[0..codes-1].  Each length corresponds to the
         symbols 0..codes-1.  The Huffman code is generated by first sorting the
         symbols by length from short to long, and retaining the symbol order
         for codes with equal lengths.  Then the code starts with all zero bits
         for the first code of the shortest length, and the codes are integer
         increments for the same length, and zeros are appended as the length
         increases.  For the deflate format, these bits are stored backwards
         from their more natural integer increment ordering, and so when the
         decoding tables are built in the large loop below, the integer codes
         are incremented backwards.

         This routine assumes, but does not check, that all of the entries in
         lens[] are in the range 0..MAXBITS.  The caller must assure this.
         1..MAXBITS is interpreted as that code length.  zero means that that
         symbol does not occur in this code.

         The codes are sorted by computing a count of codes for each length,
         creating from that a table of starting indices for each length in the
         sorted table, and then entering the symbols in order in the sorted
         table.  The sorted table is work[], with that space being provided by
         the caller.

         The length counts are used for other purposes as well, i.e. finding
         the minimum and maximum length codes, determining if there are any
         codes at all, checking for a valid set of lengths, and looking ahead
         at length counts to determine sub-table sizes when building the
         decoding tables.
         */

        /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
        for (len = 0; len <= MAXBITS; len++) {
            count[len] = 0;
        }
        for (sym = 0; sym < codes; sym++) {
            count[lens[lens_index + sym]]++;
        }

        /* bound code lengths, force root to be within code lengths */
        root = bits;
        for (max = MAXBITS; max >= 1; max--) {
            if (count[max] !== 0) { break; }
        }
        if (root > max) {
            root = max;
        }
        if (max === 0) {                     /* no symbols to code at all */
            //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
            //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
            //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
            table[table_index++] = (1 << 24) | (64 << 16) | 0;


            //table.op[opts.table_index] = 64;
            //table.bits[opts.table_index] = 1;
            //table.val[opts.table_index++] = 0;
            table[table_index++] = (1 << 24) | (64 << 16) | 0;

            opts.bits = 1;
            return 0;     /* no symbols, but wait for decoding to report error */
        }
        for (min = 1; min < max; min++) {
            if (count[min] !== 0) { break; }
        }
        if (root < min) {
            root = min;
        }

        /* check for an over-subscribed or incomplete set of lengths */
        left = 1;
        for (len = 1; len <= MAXBITS; len++) {
            left <<= 1;
            left -= count[len];
            if (left < 0) {
                return -1;
            }        /* over-subscribed */
        }
        if (left > 0 && (type === CODES || max !== 1)) {
            return -1;                      /* incomplete set */
        }

        /* generate offsets into symbol table for each length for sorting */
        offs[1] = 0;
        for (len = 1; len < MAXBITS; len++) {
            offs[len + 1] = offs[len] + count[len];
        }

        /* sort symbols by length, by symbol order within each length */
        for (sym = 0; sym < codes; sym++) {
            if (lens[lens_index + sym] !== 0) {
                work[offs[lens[lens_index + sym]]++] = sym;
            }
        }

        /*
         Create and fill in decoding tables.  In this loop, the table being
         filled is at next and has curr index bits.  The code being used is huff
         with length len.  That code is converted to an index by dropping drop
         bits off of the bottom.  For codes where len is less than drop + curr,
         those top drop + curr - len bits are incremented through all values to
         fill the table with replicated entries.

         root is the number of index bits for the root table.  When len exceeds
         root, sub-tables are created pointed to by the root entry with an index
         of the low root bits of huff.  This is saved in low to check for when a
         new sub-table should be started.  drop is zero when the root table is
         being filled, and drop is root when sub-tables are being filled.

         When a new sub-table is needed, it is necessary to look ahead in the
         code lengths to determine what size sub-table is needed.  The length
         counts are used for this, and so count[] is decremented as codes are
         entered in the tables.

         used keeps track of how many table entries have been allocated from the
         provided *table space.  It is checked for LENS and DIST tables against
         the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
         the initial root table size constants.  See the comments in inftrees.h
         for more information.

         sym increments through all symbols, and the loop terminates when
         all codes of length max, i.e. all codes, have been processed.  This
         routine permits incomplete codes, so another loop after this one fills
         in the rest of the decoding tables with invalid code markers.
         */

        /* set up for code type */
        // poor man optimization - use if-else instead of switch,
        // to avoid deopts in old v8
        if (type === CODES) {
            base = extra = work;    /* dummy value--not used */
            end = 19;

        } else if (type === LENS) {
            base = lbase;
            base_index -= 257;
            extra = lext;
            extra_index -= 257;
            end = 256;

        } else {                    /* DISTS */
            base = dbase;
            extra = dext;
            end = -1;
        }

        /* initialize opts for loop */
        huff = 0;                   /* starting code */
        sym = 0;                    /* starting code symbol */
        len = min;                  /* starting code length */
        next = table_index;              /* current table to fill in */
        curr = root;                /* current table index bits */
        drop = 0;                   /* current bits to drop from code for index */
        low = -1;                   /* trigger new sub-table when len > root */
        used = 1 << root;          /* use root table entries */
        mask = used - 1;            /* mask for comparing low */

        /* check available table space */
        if ((type === LENS && used > ENOUGH_LENS) ||
            (type === DISTS && used > ENOUGH_DISTS)) {
            return 1;
        }

        /* process all codes and make table entries */
        for (;;) {
            /* create table entry */
            here_bits = len - drop;
            if (work[sym] < end) {
                here_op = 0;
                here_val = work[sym];
            }
            else if (work[sym] > end) {
                here_op = extra[extra_index + work[sym]];
                here_val = base[base_index + work[sym]];
            }
            else {
                here_op = 32 + 64;         /* end of block */
                here_val = 0;
            }

            /* replicate for those indices with low len bits equal to huff */
            incr = 1 << (len - drop);
            fill = 1 << curr;
            min = fill;                 /* save offset to next table */
            do {
                fill -= incr;
                table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
            } while (fill !== 0);

            /* backwards increment the len-bit code huff */
            incr = 1 << (len - 1);
            while (huff & incr) {
                incr >>= 1;
            }
            if (incr !== 0) {
                huff &= incr - 1;
                huff += incr;
            } else {
                huff = 0;
            }

            /* go to next symbol, update count, len */
            sym++;
            if (--count[len] === 0) {
                if (len === max) { break; }
                len = lens[lens_index + work[sym]];
            }

            /* create new sub-table if needed */
            if (len > root && (huff & mask) !== low) {
                /* if first time, transition to sub-tables */
                if (drop === 0) {
                    drop = root;
                }

                /* increment past last table */
                next += min;            /* here min is 1 << curr */

                /* determine length of next table */
                curr = len - drop;
                left = 1 << curr;
                while (curr + drop < max) {
                    left -= count[curr + drop];
                    if (left <= 0) { break; }
                    curr++;
                    left <<= 1;
                }

                /* check for enough space */
                used += 1 << curr;
                if ((type === LENS && used > ENOUGH_LENS) ||
                    (type === DISTS && used > ENOUGH_DISTS)) {
                    return 1;
                }

                /* point entry in root table to sub-table */
                low = huff & mask;
                /*table.op[low] = curr;
                 table.bits[low] = root;
                 table.val[low] = next - opts.table_index;*/
                table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
            }
        }

        /* fill in remaining table entry if code is incomplete (guaranteed to have
         at most one remaining entry, since if the code is incomplete, the
         maximum code length that was allowed to get this far is one bit) */
        if (huff !== 0) {
            //table.op[next + huff] = 64;            /* invalid code marker */
            //table.bits[next + huff] = len - drop;
            //table.val[next + huff] = 0;
            table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
        }

        /* set return parameters */
        //opts.table_index += used;
        opts.bits = root;
        return 0;
    };

},{"../utils/common":1}],10:[function(require,module,exports){
    'use strict';

    module.exports = {
        2:      'need dictionary',     /* Z_NEED_DICT       2  */
        1:      'stream end',          /* Z_STREAM_END      1  */
        0:      '',                    /* Z_OK              0  */
        '-1':   'file error',          /* Z_ERRNO         (-1) */
        '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
        '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
        '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
        '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
        '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
    };

},{}],11:[function(require,module,exports){
    'use strict';


    function ZStream() {
        /* next input byte */
        this.input = null; // JS specific, because we have no pointers
        this.next_in = 0;
        /* number of bytes available at input */
        this.avail_in = 0;
        /* total number of input bytes read so far */
        this.total_in = 0;
        /* next output byte should be put there */
        this.output = null; // JS specific, because we have no pointers
        this.next_out = 0;
        /* remaining free space at output */
        this.avail_out = 0;
        /* total number of bytes output so far */
        this.total_out = 0;
        /* last error message, NULL if no error */
        this.msg = ''/*Z_NULL*/;
        /* not visible by applications */
        this.state = null;
        /* best guess about the data type: binary or text */
        this.data_type = 2/*Z_UNKNOWN*/;
        /* adler32 value of the uncompressed data */
        this.adler = 0;
    }

    module.exports = ZStream;

},{}],"/lib/inflate.js":[function(require,module,exports){
    'use strict';


    var zlib_inflate = require('./zlib/inflate');
    var utils        = require('./utils/common');
    var strings      = require('./utils/strings');
    var c            = require('./zlib/constants');
    var msg          = require('./zlib/messages');
    var ZStream      = require('./zlib/zstream');
    var GZheader     = require('./zlib/gzheader');

    var toString = Object.prototype.toString;

    /**
     * class Inflate
     *
     * Generic JS-style wrapper for zlib calls. If you don't need
     * streaming behaviour - use more simple functions: [[inflate]]
     * and [[inflateRaw]].
     **/

    /* internal
     * inflate.chunks -> Array
     *
     * Chunks of output data, if [[Inflate#onData]] not overriden.
     **/

    /**
     * Inflate.result -> Uint8Array|Array|String
     *
     * Uncompressed result, generated by default [[Inflate#onData]]
     * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
     * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
     * push a chunk with explicit flush (call [[Inflate#push]] with
     * `Z_SYNC_FLUSH` param).
     **/

    /**
     * Inflate.err -> Number
     *
     * Error code after inflate finished. 0 (Z_OK) on success.
     * Should be checked if broken data possible.
     **/

    /**
     * Inflate.msg -> String
     *
     * Error message, if [[Inflate.err]] != 0
     **/


    /**
     * new Inflate(options)
     * - options (Object): zlib inflate options.
     *
     * Creates new inflator instance with specified params. Throws exception
     * on bad params. Supported options:
     *
     * - `windowBits`
     * - `dictionary`
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information on these.
     *
     * Additional options, for internal needs:
     *
     * - `chunkSize` - size of generated data chunks (16K by default)
     * - `raw` (Boolean) - do raw inflate
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     * By default, when no options set, autodetect deflate/gzip data format via
     * wrapper header.
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
     *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
     *
     * var inflate = new pako.Inflate({ level: 3});
     *
     * inflate.push(chunk1, false);
     * inflate.push(chunk2, true);  // true -> last chunk
     *
     * if (inflate.err) { throw new Error(inflate.err); }
     *
     * console.log(inflate.result);
     * ```
     **/
    function Inflate(options) {
        if (!(this instanceof Inflate)) return new Inflate(options);

        this.options = utils.assign({
            chunkSize: 16384,
            windowBits: 0,
            to: ''
        }, options || {});

        var opt = this.options;

        // Force window size for `raw` data, if not set directly,
        // because we have no header for autodetect.
        if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
            opt.windowBits = -opt.windowBits;
            if (opt.windowBits === 0) { opt.windowBits = -15; }
        }

        // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
        if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
            !(options && options.windowBits)) {
            opt.windowBits += 32;
        }

        // Gzip header has no info about windows size, we can do autodetect only
        // for deflate. So, if window size not set, force it to max when gzip possible
        if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
            // bit 3 (16) -> gzipped data
            // bit 4 (32) -> autodetect gzip/deflate
            if ((opt.windowBits & 15) === 0) {
                opt.windowBits |= 15;
            }
        }

        this.err    = 0;      // error code, if happens (0 = Z_OK)
        this.msg    = '';     // error message
        this.ended  = false;  // used to avoid multiple onEnd() calls
        this.chunks = [];     // chunks of compressed data

        this.strm   = new ZStream();
        this.strm.avail_out = 0;

        var status  = zlib_inflate.inflateInit2(
            this.strm,
            opt.windowBits
        );

        if (status !== c.Z_OK) {
            throw new Error(msg[status]);
        }

        this.header = new GZheader();

        zlib_inflate.inflateGetHeader(this.strm, this.header);
    }

    /**
     * Inflate#push(data[, mode]) -> Boolean
     * - data (Uint8Array|Array|ArrayBuffer|String): input data
     * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
     *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
     *
     * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
     * new output chunks. Returns `true` on success. The last data block must have
     * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
     * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
     * can use mode Z_SYNC_FLUSH, keeping the decompression context.
     *
     * On fail call [[Inflate#onEnd]] with error code and return false.
     *
     * We strongly recommend to use `Uint8Array` on input for best speed (output
     * format is detected automatically). Also, don't skip last param and always
     * use the same type in your code (boolean or number). That will improve JS speed.
     *
     * For regular `Array`-s make sure all elements are [0..255].
     *
     * ##### Example
     *
     * ```javascript
     * push(chunk, false); // push one of data chunks
     * ...
     * push(chunk, true);  // push last chunk
     * ```
     **/
    Inflate.prototype.push = function (data, mode) {
        var strm = this.strm;
        var chunkSize = this.options.chunkSize;
        var dictionary = this.options.dictionary;
        var status, _mode;
        var next_out_utf8, tail, utf8str;
        var dict;

        // Flag to properly process Z_BUF_ERROR on testing inflate call
        // when we check that all output data was flushed.
        var allowBufError = false;

        if (this.ended) { return false; }
        _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

        // Convert data if needed
        if (typeof data === 'string') {
            // Only binary strings can be decompressed on practice
            strm.input = strings.binstring2buf(data);
        } else if (toString.call(data) === '[object ArrayBuffer]') {
            strm.input = new Uint8Array(data);
        } else {
            strm.input = data;
        }

        strm.next_in = 0;
        strm.avail_in = strm.input.length;

        do {
            if (strm.avail_out === 0) {
                strm.output = new utils.Buf8(chunkSize);
                strm.next_out = 0;
                strm.avail_out = chunkSize;
            }

            status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

            if (status === c.Z_NEED_DICT && dictionary) {
                // Convert data if needed
                if (typeof dictionary === 'string') {
                    dict = strings.string2buf(dictionary);
                } else if (toString.call(dictionary) === '[object ArrayBuffer]') {
                    dict = new Uint8Array(dictionary);
                } else {
                    dict = dictionary;
                }

                status = zlib_inflate.inflateSetDictionary(this.strm, dict);

            }

            if (status === c.Z_BUF_ERROR && allowBufError === true) {
                status = c.Z_OK;
                allowBufError = false;
            }

            if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
                this.onEnd(status);
                this.ended = true;
                return false;
            }

            if (strm.next_out) {
                if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {

                    if (this.options.to === 'string') {

                        next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

                        tail = strm.next_out - next_out_utf8;
                        utf8str = strings.buf2string(strm.output, next_out_utf8);

                        // move tail
                        strm.next_out = tail;
                        strm.avail_out = chunkSize - tail;
                        if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

                        this.onData(utf8str);

                    } else {
                        this.onData(utils.shrinkBuf(strm.output, strm.next_out));
                    }
                }
            }

            // When no more input data, we should check that internal inflate buffers
            // are flushed. The only way to do it when avail_out = 0 - run one more
            // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
            // Here we set flag to process this error properly.
            //
            // NOTE. Deflate does not return error in this case and does not needs such
            // logic.
            if (strm.avail_in === 0 && strm.avail_out === 0) {
                allowBufError = true;
            }

        } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);

        if (status === c.Z_STREAM_END) {
            _mode = c.Z_FINISH;
        }

        // Finalize on the last chunk.
        if (_mode === c.Z_FINISH) {
            status = zlib_inflate.inflateEnd(this.strm);
            this.onEnd(status);
            this.ended = true;
            return status === c.Z_OK;
        }

        // callback interim results if Z_SYNC_FLUSH.
        if (_mode === c.Z_SYNC_FLUSH) {
            this.onEnd(c.Z_OK);
            strm.avail_out = 0;
            return true;
        }

        return true;
    };


    /**
     * Inflate#onData(chunk) -> Void
     * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
     *   on js engine support. When string output requested, each chunk
     *   will be string.
     *
     * By default, stores data blocks in `chunks[]` property and glue
     * those in `onEnd`. Override this handler, if you need another behaviour.
     **/
    Inflate.prototype.onData = function (chunk) {
        this.chunks.push(chunk);
    };


    /**
     * Inflate#onEnd(status) -> Void
     * - status (Number): inflate status. 0 (Z_OK) on success,
     *   other if not.
     *
     * Called either after you tell inflate that the input stream is
     * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
     * or if an error happened. By default - join collected chunks,
     * free memory and fill `results` / `err` properties.
     **/
    Inflate.prototype.onEnd = function (status) {
        // On success - join
        if (status === c.Z_OK) {
            if (this.options.to === 'string') {
                // Glue & convert here, until we teach pako to send
                // utf8 alligned strings to onData
                this.result = this.chunks.join('');
            } else {
                this.result = utils.flattenChunks(this.chunks);
            }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
    };


    /**
     * inflate(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Decompress `data` with inflate/ungzip and `options`. Autodetect
     * format via wrapper header by default. That's why we don't provide
     * separate `ungzip` method.
     *
     * Supported options are:
     *
     * - windowBits
     *
     * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
     * for more information.
     *
     * Sugar (options):
     *
     * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
     *   negative windowBits implicitly.
     * - `to` (String) - if equal to 'string', then result will be converted
     *   from utf8 to utf16 (javascript) string. When string output requested,
     *   chunk length can differ from `chunkSize`, depending on content.
     *
     *
     * ##### Example:
     *
     * ```javascript
     * var pako = require('pako')
     *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
     *   , output;
     *
     * try {
 *   output = pako.inflate(input);
 * } catch (err)
     *   console.log(err);
     * }
     * ```
     **/
    function inflate(input, options) {
        var inflator = new Inflate(options);

        inflator.push(input, true);

        // That will never happens, if you don't cheat with options :)
        if (inflator.err) { throw inflator.msg || msg[inflator.err]; }

        return inflator.result;
    }


    /**
     * inflateRaw(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * The same as [[inflate]], but creates raw data, without wrapper
     * (header and adler32 crc).
     **/
    function inflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return inflate(input, options);
    }


    /**
     * ungzip(data[, options]) -> Uint8Array|Array|String
     * - data (Uint8Array|Array|String): input data to decompress.
     * - options (Object): zlib inflate options.
     *
     * Just shortcut to [[inflate]], because it autodetects format
     * by header.content. Done for convenience.
     **/


    exports.Inflate = Inflate;
    exports.inflate = inflate;
    exports.inflateRaw = inflateRaw;
    exports.ungzip  = inflate;

},{"./utils/common":1,"./utils/strings":2,"./zlib/constants":4,"./zlib/gzheader":6,"./zlib/inflate":8,"./zlib/messages":10,"./zlib/zstream":11}]},{},[])("/lib/inflate.js")
});

/**
  @license
  when.js - https://github.com/cujojs/when

  MIT License (c) copyright B Cavalier & J Hann

 * A lightweight CommonJS Promises/A and when() implementation
 * when is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @version 1.7.1
 */

(function(define) { 'use strict';
define('ThirdParty/when',[],function () {
	var reduceArray, slice, undef;

	//
	// Public API
	//

	when.defer     = defer;     // Create a deferred
	when.resolve   = resolve;   // Create a resolved promise
	when.reject    = reject;    // Create a rejected promise

	when.join      = join;      // Join 2 or more promises

	when.all       = all;       // Resolve a list of promises
	when.map       = map;       // Array.map() for promises
	when.reduce    = reduce;    // Array.reduce() for promises

	when.any       = any;       // One-winner race
	when.some      = some;      // Multi-winner race

	when.chain     = chain;     // Make a promise trigger another resolver

	when.isPromise = isPromise; // Determine if a thing is a promise

	/**
	 * Register an observer for a promise or immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @param {function?} [onFulfilled] callback to be called when promiseOrValue is
	 *   successfully fulfilled.  If promiseOrValue is an immediate value, callback
	 *   will be invoked immediately.
	 * @param {function?} [onRejected] callback to be called when promiseOrValue is
	 *   rejected.
	 * @param {function?} [onProgress] callback to be called when progress updates
	 *   are issued for promiseOrValue.
	 * @returns {Promise} a new {@link Promise} that will complete with the return
	 *   value of callback or errback or the completion value of promiseOrValue if
	 *   callback and/or errback is not supplied.
	 */
	function when(promiseOrValue, onFulfilled, onRejected, onProgress) {
		// Get a trusted promise for the input promiseOrValue, and then
		// register promise handlers
		return resolve(promiseOrValue).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Returns promiseOrValue if promiseOrValue is a {@link Promise}, a new Promise if
	 * promiseOrValue is a foreign promise, or a new, already-fulfilled {@link Promise}
	 * whose value is promiseOrValue if promiseOrValue is an immediate value.
	 *
	 * @param {*} promiseOrValue
	 * @returns Guaranteed to return a trusted Promise.  If promiseOrValue is a when.js {@link Promise}
	 *   returns promiseOrValue, otherwise, returns a new, already-resolved, when.js {@link Promise}
	 *   whose resolution value is:
	 *   * the resolution value of promiseOrValue if it's a foreign promise, or
	 *   * promiseOrValue if it's a value
	 */
	function resolve(promiseOrValue) {
		var promise, deferred;

		if(promiseOrValue instanceof Promise) {
			// It's a when.js promise, so we trust it
			promise = promiseOrValue;

		} else {
			// It's not a when.js promise. See if it's a foreign promise or a value.
			if(isPromise(promiseOrValue)) {
				// It's a thenable, but we don't know where it came from, so don't trust
				// its implementation entirely.  Introduce a trusted middleman when.js promise
				deferred = defer();

				// IMPORTANT: This is the only place when.js should ever call .then() on an
				// untrusted promise. Don't expose the return value to the untrusted promise
				promiseOrValue.then(
					function(value)  { deferred.resolve(value); },
					function(reason) { deferred.reject(reason); },
					function(update) { deferred.progress(update); }
				);

				promise = deferred.promise;

			} else {
				// It's a value, not a promise.  Create a resolved promise for it.
				promise = fulfilled(promiseOrValue);
			}
		}

		return promise;
	}

	/**
	 * Returns a rejected promise for the supplied promiseOrValue.  The returned
	 * promise will be rejected with:
	 * - promiseOrValue, if it is a value, or
	 * - if promiseOrValue is a promise
	 *   - promiseOrValue's value after it is fulfilled
	 *   - promiseOrValue's reason after it is rejected
	 * @param {*} promiseOrValue the rejected value of the returned {@link Promise}
	 * @returns {Promise} rejected {@link Promise}
	 */
	function reject(promiseOrValue) {
		return when(promiseOrValue, rejected);
	}

	/**
	 * Trusted Promise constructor.  A Promise created from this constructor is
	 * a trusted when.js promise.  Any other duck-typed promise is considered
	 * untrusted.
	 * @constructor
	 * @name Promise
	 */
	function Promise(then) {
		this.then = then;
	}

	Promise.prototype = {
		/**
		 * Register a callback that will be called when a promise is
		 * fulfilled or rejected.  Optionally also register a progress handler.
		 * Shortcut for .then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress)
		 * @param {function?} [onFulfilledOrRejected]
		 * @param {function?} [onProgress]
		 * @returns {Promise}
		 */
		always: function(onFulfilledOrRejected, onProgress) {
			return this.then(onFulfilledOrRejected, onFulfilledOrRejected, onProgress);
		},

		/**
		 * Register a rejection handler.  Shortcut for .then(undefined, onRejected)
		 * @param {function?} onRejected
		 * @returns {Promise}
		 */
		otherwise: function(onRejected) {
			return this.then(undef, onRejected);
		},

		/**
		 * Shortcut for .then(function() { return value; })
		 * @param  {*} value
		 * @returns {Promise} a promise that:
		 *  - is fulfilled if value is not a promise, or
		 *  - if value is a promise, will fulfill with its value, or reject
		 *    with its reason.
		 */
		yield: function(value) {
			return this.then(function() {
				return value;
			});
		},

		/**
		 * Assumes that this promise will fulfill with an array, and arranges
		 * for the onFulfilled to be called with the array as its argument list
		 * i.e. onFulfilled.spread(undefined, array).
		 * @param {function} onFulfilled function to receive spread arguments
		 * @returns {Promise}
		 */
		spread: function(onFulfilled) {
			return this.then(function(array) {
				// array may contain promises, so resolve its contents.
				return all(array, function(array) {
					return onFulfilled.apply(undef, array);
				});
			});
		}
	};

	/**
	 * Create an already-resolved promise for the supplied value
	 * @private
	 *
	 * @param {*} value
	 * @returns {Promise} fulfilled promise
	 */
	function fulfilled(value) {
		var p = new Promise(function(onFulfilled) {
			// TODO: Promises/A+ check typeof onFulfilled
			try {
				return resolve(onFulfilled ? onFulfilled(value) : value);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Create an already-rejected {@link Promise} with the supplied
	 * rejection reason.
	 * @private
	 *
	 * @param {*} reason
	 * @returns {Promise} rejected promise
	 */
	function rejected(reason) {
		var p = new Promise(function(_, onRejected) {
			// TODO: Promises/A+ check typeof onRejected
			try {
				return onRejected ? resolve(onRejected(reason)) : rejected(reason);
			} catch(e) {
				return rejected(e);
			}
		});

		return p;
	}

	/**
	 * Creates a new, Deferred with fully isolated resolver and promise parts,
	 * either or both of which may be given out safely to consumers.
	 * The Deferred itself has the full API: resolve, reject, progress, and
	 * then. The resolver has resolve, reject, and progress.  The promise
	 * only has then.
	 *
	 * @returns {Deferred}
	 */
	function defer() {
		var deferred, promise, handlers, progressHandlers,
			_then, _progress, _resolve;

		/**
		 * The promise for the new deferred
		 * @type {Promise}
		 */
		promise = new Promise(then);

		/**
		 * The full Deferred object, with {@link Promise} and {@link Resolver} parts
		 * @class Deferred
		 * @name Deferred
		 */
		deferred = {
			then:     then, // DEPRECATED: use deferred.promise.then
			resolve:  promiseResolve,
			reject:   promiseReject,
			// TODO: Consider renaming progress() to notify()
			progress: promiseProgress,

			promise:  promise,

			resolver: {
				resolve:  promiseResolve,
				reject:   promiseReject,
				progress: promiseProgress
			}
		};

		handlers = [];
		progressHandlers = [];

		/**
		 * Pre-resolution then() that adds the supplied callback, errback, and progback
		 * functions to the registered listeners
		 * @private
		 *
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 */
		_then = function(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			var deferred, progressHandler;

			deferred = defer();

			progressHandler = typeof onProgress === 'function'
				? function(update) {
					try {
						// Allow progress handler to transform progress event
						deferred.progress(onProgress(update));
					} catch(e) {
						// Use caught value as progress
						deferred.progress(e);
					}
				}
				: function(update) { deferred.progress(update); };

			handlers.push(function(promise) {
				promise.then(onFulfilled, onRejected)
					.then(deferred.resolve, deferred.reject, progressHandler);
			});

			progressHandlers.push(progressHandler);

			return deferred.promise;
		};

		/**
		 * Issue a progress event, notifying all progress listeners
		 * @private
		 * @param {*} update progress event payload to pass to all listeners
		 */
		_progress = function(update) {
			processQueue(progressHandlers, update);
			return update;
		};

		/**
		 * Transition from pre-resolution state to post-resolution state, notifying
		 * all listeners of the resolution or rejection
		 * @private
		 * @param {*} value the value of this deferred
		 */
		_resolve = function(value) {
			value = resolve(value);

			// Replace _then with one that directly notifies with the result.
			_then = value.then;
			// Replace _resolve so that this Deferred can only be resolved once
			_resolve = resolve;
			// Make _progress a noop, to disallow progress for the resolved promise.
			_progress = noop;

			// Notify handlers
			processQueue(handlers, value);

			// Free progressHandlers array since we'll never issue progress events
			progressHandlers = handlers = undef;

			return value;
		};

		return deferred;

		/**
		 * Wrapper to allow _then to be replaced safely
		 * @param {function?} [onFulfilled] resolution handler
		 * @param {function?} [onRejected] rejection handler
		 * @param {function?} [onProgress] progress handler
		 * @returns {Promise} new promise
		 */
		function then(onFulfilled, onRejected, onProgress) {
			// TODO: Promises/A+ check typeof onFulfilled, onRejected, onProgress
			return _then(onFulfilled, onRejected, onProgress);
		}

		/**
		 * Wrapper to allow _resolve to be replaced
		 */
		function promiseResolve(val) {
			return _resolve(val);
		}

		/**
		 * Wrapper to allow _reject to be replaced
		 */
		function promiseReject(err) {
			return _resolve(rejected(err));
		}

		/**
		 * Wrapper to allow _progress to be replaced
		 */
		function promiseProgress(update) {
			return _progress(update);
		}
	}

	/**
	 * Determines if promiseOrValue is a promise or not.  Uses the feature
	 * test from http://wiki.commonjs.org/wiki/Promises/A to determine if
	 * promiseOrValue is a promise.
	 *
	 * @param {*} promiseOrValue anything
	 * @returns {boolean} true if promiseOrValue is a {@link Promise}
	 */
	function isPromise(promiseOrValue) {
		return promiseOrValue && typeof promiseOrValue.then === 'function';
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * howMany of the supplied promisesOrValues have resolved, or will reject when
	 * it becomes impossible for howMany to resolve, for example, when
	 * (promisesOrValues.length - howMany) + 1 input promises reject.
	 *
	 * @param {Array} promisesOrValues array of anything, may contain a mix
	 *      of promises and values
	 * @param howMany {number} number of promisesOrValues to resolve
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to an array of howMany values that
	 * resolved first, or will reject with an array of (promisesOrValues.length - howMany) + 1
	 * rejection reasons.
	 */
	function some(promisesOrValues, howMany, onFulfilled, onRejected, onProgress) {

		checkCallbacks(2, arguments);

		return when(promisesOrValues, function(promisesOrValues) {

			var toResolve, toReject, values, reasons, deferred, fulfillOne, rejectOne, progress, len, i;

			len = promisesOrValues.length >>> 0;

			toResolve = Math.max(0, Math.min(howMany, len));
			values = [];

			toReject = (len - toResolve) + 1;
			reasons = [];

			deferred = defer();

			// No items in the input, resolve immediately
			if (!toResolve) {
				deferred.resolve(values);

			} else {
				progress = deferred.progress;

				rejectOne = function(reason) {
					reasons.push(reason);
					if(!--toReject) {
						fulfillOne = rejectOne = noop;
						deferred.reject(reasons);
					}
				};

				fulfillOne = function(val) {
					// This orders the values based on promise resolution order
					// Another strategy would be to use the original position of
					// the corresponding promise.
					values.push(val);

					if (!--toResolve) {
						fulfillOne = rejectOne = noop;
						deferred.resolve(values);
					}
				};

				for(i = 0; i < len; ++i) {
					if(i in promisesOrValues) {
						when(promisesOrValues[i], fulfiller, rejecter, progress);
					}
				}
			}

			return deferred.then(onFulfilled, onRejected, onProgress);

			function rejecter(reason) {
				rejectOne(reason);
			}

			function fulfiller(val) {
				fulfillOne(val);
			}

		});
	}

	/**
	 * Initiates a competitive race, returning a promise that will resolve when
	 * any one of the supplied promisesOrValues has resolved or will reject when
	 * *all* promisesOrValues have rejected.
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise} promise that will resolve to the value that resolved first, or
	 * will reject with an array of all rejected inputs.
	 */
	function any(promisesOrValues, onFulfilled, onRejected, onProgress) {

		function unwrapSingleResult(val) {
			return onFulfilled ? onFulfilled(val[0]) : val[0];
		}

		return some(promisesOrValues, 1, unwrapSingleResult, onRejected, onProgress);
	}

	/**
	 * Return a promise that will resolve only once all the supplied promisesOrValues
	 * have resolved. The resolution value of the returned promise will be an array
	 * containing the resolution values of each of the promisesOrValues.
	 * @memberOf when
	 *
	 * @param {Array|Promise} promisesOrValues array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function?} [onFulfilled] resolution handler
	 * @param {function?} [onRejected] rejection handler
	 * @param {function?} [onProgress] progress handler
	 * @returns {Promise}
	 */
	function all(promisesOrValues, onFulfilled, onRejected, onProgress) {
		checkCallbacks(1, arguments);
		return map(promisesOrValues, identity).then(onFulfilled, onRejected, onProgress);
	}

	/**
	 * Joins multiple promises into a single returned promise.
	 * @returns {Promise} a promise that will fulfill when *all* the input promises
	 * have fulfilled, or will reject when *any one* of the input promises rejects.
	 */
	function join(/* ...promises */) {
		return map(arguments, identity);
	}

	/**
	 * Traditional map function, similar to `Array.prototype.map()`, but allows
	 * input to contain {@link Promise}s and/or values, and mapFunc may return
	 * either a value or a {@link Promise}
	 *
	 * @param {Array|Promise} promise array of anything, may contain a mix
	 *      of {@link Promise}s and values
	 * @param {function} mapFunc mapping function mapFunc(value) which may return
	 *      either a {@link Promise} or value
	 * @returns {Promise} a {@link Promise} that will resolve to an array containing
	 *      the mapped output values.
	 */
	function map(promise, mapFunc) {
		return when(promise, function(array) {
			var results, len, toResolve, resolve, i, d;

			// Since we know the resulting length, we can preallocate the results
			// array to avoid array expansions.
			toResolve = len = array.length >>> 0;
			results = [];
			d = defer();

			if(!toResolve) {
				d.resolve(results);
			} else {

				resolve = function resolveOne(item, i) {
					when(item, mapFunc).then(function(mapped) {
						results[i] = mapped;

						if(!--toResolve) {
							d.resolve(results);
						}
					}, d.reject);
				};

				// Since mapFunc may be async, get all invocations of it into flight
				for(i = 0; i < len; i++) {
					if(i in array) {
						resolve(array[i], i);
					} else {
						--toResolve;
					}
				}

			}

			return d.promise;

		});
	}

	/**
	 * Traditional reduce function, similar to `Array.prototype.reduce()`, but
	 * input may contain promises and/or values, and reduceFunc
	 * may return either a value or a promise, *and* initialValue may
	 * be a promise for the starting value.
	 *
	 * @param {Array|Promise} promise array or promise for an array of anything,
	 *      may contain a mix of promises and values.
	 * @param {function} reduceFunc reduce function reduce(currentValue, nextValue, index, total),
	 *      where total is the total number of items being reduced, and will be the same
	 *      in each call to reduceFunc.
	 * @returns {Promise} that will resolve to the final reduced value
	 */
	function reduce(promise, reduceFunc /*, initialValue */) {
		var args = slice.call(arguments, 1);

		return when(promise, function(array) {
			var total;

			total = array.length;

			// Wrap the supplied reduceFunc with one that handles promises and then
			// delegates to the supplied.
			args[0] = function (current, val, i) {
				return when(current, function (c) {
					return when(val, function (value) {
						return reduceFunc(c, value, i, total);
					});
				});
			};

			return reduceArray.apply(array, args);
		});
	}

	/**
	 * Ensure that resolution of promiseOrValue will trigger resolver with the
	 * value or reason of promiseOrValue, or instead with resolveValue if it is provided.
	 *
	 * @param promiseOrValue
	 * @param {Object} resolver
	 * @param {function} resolver.resolve
	 * @param {function} resolver.reject
	 * @param {*} [resolveValue]
	 * @returns {Promise}
	 */
	function chain(promiseOrValue, resolver, resolveValue) {
		var useResolveValue = arguments.length > 2;

		return when(promiseOrValue,
			function(val) {
				val = useResolveValue ? resolveValue : val;
				resolver.resolve(val);
				return val;
			},
			function(reason) {
				resolver.reject(reason);
				return rejected(reason);
			},
			resolver.progress
		);
	}

	//
	// Utility functions
	//

	/**
	 * Apply all functions in queue to value
	 * @param {Array} queue array of functions to execute
	 * @param {*} value argument passed to each function
	 */
	function processQueue(queue, value) {
		var handler, i = 0;

		while (handler = queue[i++]) {
			handler(value);
		}
	}

	/**
	 * Helper that checks arrayOfCallbacks to ensure that each element is either
	 * a function, or null or undefined.
	 * @private
	 * @param {number} start index at which to start checking items in arrayOfCallbacks
	 * @param {Array} arrayOfCallbacks array to check
	 * @throws {Error} if any element of arrayOfCallbacks is something other than
	 * a functions, null, or undefined.
	 */
	function checkCallbacks(start, arrayOfCallbacks) {
		// TODO: Promises/A+ update type checking and docs
		var arg, i = arrayOfCallbacks.length;

		while(i > start) {
			arg = arrayOfCallbacks[--i];

			if (arg != null && typeof arg != 'function') {
				throw new Error('arg '+i+' must be a function');
			}
		}
	}

	/**
	 * No-Op function used in method replacement
	 * @private
	 */
	function noop() {}

	slice = [].slice;

	// ES5 reduce implementation if native not available
	// See: http://es5.github.com/#x15.4.4.21 as there are many
	// specifics and edge cases.
	reduceArray = [].reduce ||
		function(reduceFunc /*, initialValue */) {
			/*jshint maxcomplexity: 7*/

			// ES5 dictates that reduce.length === 1

			// This implementation deviates from ES5 spec in the following ways:
			// 1. It does not check if reduceFunc is a Callable

			var arr, args, reduced, len, i;

			i = 0;
			// This generates a jshint warning, despite being valid
			// "Missing 'new' prefix when invoking a constructor."
			// See https://github.com/jshint/jshint/issues/392
			arr = Object(this);
			len = arr.length >>> 0;
			args = arguments;

			// If no initialValue, use first item of array (we know length !== 0 here)
			// and adjust i to start at second item
			if(args.length <= 1) {
				// Skip to the first real element in the array
				for(;;) {
					if(i in arr) {
						reduced = arr[i++];
						break;
					}

					// If we reached the end of the array without finding any real
					// elements, it's a TypeError
					if(++i >= len) {
						throw new TypeError();
					}
				}
			} else {
				// If initialValue provided, use it
				reduced = args[1];
			}

			// Do the actual reduce
			for(;i < len; ++i) {
				// Skip holes
				if(i in arr) {
					reduced = reduceFunc(reduced, arr[i], i, arr);
				}
			}

			return reduced;
		};

	function identity(x) {
		return x;
	}

	return when;
});
})(typeof define == 'function' && define.amd
	? define
	: function (factory) { typeof exports === 'object'
		? (module.exports = factory())
		: (this.when      = factory());
	}
	// Boilerplate for AMD, Node, and browser global
);

/*global define*/
define('Core/appendForwardSlash',[],function() {
    'use strict';

    /**
     * @private
     */
    function appendForwardSlash(url) {
        if (url.length === 0 || url[url.length - 1] !== '/') {
            url = url + '/';
        }
        return url;
    }

    return appendForwardSlash;
});

/*global define*/
define('Core/DeveloperError',[
        './defined'
    ], function(
        defined) {
    'use strict';

    /**
     * Constructs an exception object that is thrown due to a developer error, e.g., invalid argument,
     * argument out of range, etc.  This exception should only be thrown during development;
     * it usually indicates a bug in the calling code.  This exception should never be
     * caught; instead the calling code should strive not to generate it.
     * <br /><br />
     * On the other hand, a {@link RuntimeError} indicates an exception that may
     * be thrown at runtime, e.g., out of memory, that the calling code should be prepared
     * to catch.
     *
     * @alias DeveloperError
     * @constructor
     * @extends Error
     *
     * @param {String} [message] The error message for this exception.
     *
     * @see RuntimeError
     */
    function DeveloperError(message) {
        /**
         * 'DeveloperError' indicating that this exception was thrown due to a developer error.
         * @type {String}
         * @readonly
         */
        this.name = 'DeveloperError';

        /**
         * The explanation for why this exception was thrown.
         * @type {String}
         * @readonly
         */
        this.message = message;

        //Browsers such as IE don't have a stack property until you actually throw the error.
        var stack;
        try {
            throw new Error();
        } catch (e) {
            stack = e.stack;
        }

        /**
         * The stack trace of this exception, if available.
         * @type {String}
         * @readonly
         */
        this.stack = stack;
    }

    if (defined(Object.create)) {
        DeveloperError.prototype = Object.create(Error.prototype);
        DeveloperError.prototype.constructor = DeveloperError;
    }

    DeveloperError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;

        if (defined(this.stack)) {
            str += '\n' + this.stack.toString();
        }

        return str;
    };

    /**
     * @private
     */
    DeveloperError.throwInstantiationError = function() {
        throw new DeveloperError('This function defines an interface and should not be called directly.');
    };

    return DeveloperError;
});

/*global define*/
define('Core/Check',[
        './defined',
        './DeveloperError'
    ], function(
        defined,
        DeveloperError) {
    'use strict';

    /**
     * Contains functions for checking that supplied arguments are of a specified type
     * or meet specified conditions
     * @private
     */
    var Check = {};

    /**
     * Contains type checking functions, all using the typeof operator
     */
    Check.typeOf = {};

    function getUndefinedErrorMessage(name) {
        return name + ' is required, actual value was undefined';
    }

    function getFailedTypeErrorMessage(actual, expected, name) {
        return 'Expected ' + name + ' to be typeof ' + expected + ', actual typeof was ' + actual;
    }

    /**
     * Throws if test is not defined
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value that is to be checked
     * @exception {DeveloperError} test must be defined
     */
    Check.defined = function (name, test) {
        if (!defined(test)) {
            throw new DeveloperError(getUndefinedErrorMessage(name));
        }
    };

    /**
     * Throws if test is not typeof 'function'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'function'
     */
    Check.typeOf.func = function (name, test) {
        if (typeof test !== 'function') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'function', name));
        }
    };

    /**
     * Throws if test is not typeof 'string'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'string'
     */
    Check.typeOf.string = function (name, test) {
        if (typeof test !== 'string') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'string', name));
        }
    };

    /**
     * Throws if test is not typeof 'number'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'number'
     */
    Check.typeOf.number = function (name, test) {
        if (typeof test !== 'number') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'number', name));
        }
    };

    /**
     * Throws if test is not typeof 'number' and less than limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and less than limit
     */
    Check.typeOf.number.lessThan = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test >= limit) {
            throw new DeveloperError('Expected ' + name + ' to be less than ' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'number' and less than or equal to limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and less than or equal to limit
     */
    Check.typeOf.number.lessThanOrEquals = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test > limit) {
            throw new DeveloperError('Expected ' + name + ' to be less than or equal to ' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'number' and greater than limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and greater than limit
     */
    Check.typeOf.number.greaterThan = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test <= limit) {
            throw new DeveloperError('Expected ' + name + ' to be greater than ' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'number' and greater than or equal to limit
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @param {Number} limit The limit value to compare against
     * @exception {DeveloperError} test must be typeof 'number' and greater than or equal to limit
     */
    Check.typeOf.number.greaterThanOrEquals = function (name, test, limit) {
        Check.typeOf.number(name, test);
        if (test < limit) {
            throw new DeveloperError('Expected ' + name + ' to be greater than or equal to' + limit + ', actual value was ' + test);
        }
    };

    /**
     * Throws if test is not typeof 'object'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'object'
     */
    Check.typeOf.object = function (name, test) {
        if (typeof test !== 'object') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'object', name));
        }
    };

    /**
     * Throws if test is not typeof 'boolean'
     *
     * @param {String} name The name of the variable being tested
     * @param {*} test The value to test
     * @exception {DeveloperError} test must be typeof 'boolean'
     */
    Check.typeOf.bool = function (name, test) {
        if (typeof test !== 'boolean') {
            throw new DeveloperError(getFailedTypeErrorMessage(typeof test, 'boolean', name));
        }
    };

    return Check;
});

/*global define*/
define('Core/freezeObject',[
        './defined'
    ], function(
        defined) {
    'use strict';

    /**
     * Freezes an object, using Object.freeze if available, otherwise returns
     * the object unchanged.  This function should be used in setup code to prevent
     * errors from completely halting JavaScript execution in legacy browsers.
     *
     * @private
     *
     * @exports freezeObject
     */
    var freezeObject = Object.freeze;
    if (!defined(freezeObject)) {
        freezeObject = function(o) {
            return o;
        };
    }

    return freezeObject;
});

/*global define*/
define('Core/defaultValue',[
        './freezeObject'
    ], function(
        freezeObject) {
    'use strict';

    /**
     * Returns the first parameter if not undefined, otherwise the second parameter.
     * Useful for setting a default value for a parameter.
     *
     * @exports defaultValue
     *
     * @param {*} a
     * @param {*} b
     * @returns {*} Returns the first parameter if not undefined, otherwise the second parameter.
     *
     * @example
     * param = Cesium.defaultValue(param, 'default');
     */
    function defaultValue(a, b) {
        if (a !== undefined) {
            return a;
        }
        return b;
    }

    /**
     * A frozen empty object that can be used as the default value for options passed as
     * an object literal.
     */
    defaultValue.EMPTY_OBJECT = freezeObject({});

    return defaultValue;
});

/*global define*/
define('Core/defineProperties',[
        './defined'
    ], function(
        defined) {
    'use strict';

    var definePropertyWorks = (function() {
        try {
            return 'x' in Object.defineProperty({}, 'x', {});
        } catch (e) {
            return false;
        }
    })();

    /**
     * Defines properties on an object, using Object.defineProperties if available,
     * otherwise returns the object unchanged.  This function should be used in
     * setup code to prevent errors from completely halting JavaScript execution
     * in legacy browsers.
     *
     * @private
     *
     * @exports defineProperties
     */
    var defineProperties = Object.defineProperties;
    if (!definePropertyWorks || !defined(defineProperties)) {
        defineProperties = function(o) {
            return o;
        };
    }

    return defineProperties;
});

/*global define*/
define('Core/parseResponseHeaders',[], function() {
    'use strict';

    /**
     * Parses the result of XMLHttpRequest's getAllResponseHeaders() method into
     * a dictionary.
     *
     * @exports parseResponseHeaders
     *
     * @param {String} headerString The header string returned by getAllResponseHeaders().  The format is
     *                 described here: http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders()-method
     * @returns {Object} A dictionary of key/value pairs, where each key is the name of a header and the corresponding value
     *                   is that header's value.
     * 
     * @private
     */
    function parseResponseHeaders(headerString) {
        var headers = {};

        if (!headerString) {
          return headers;
        }

        var headerPairs = headerString.split('\u000d\u000a');

        for (var i = 0; i < headerPairs.length; ++i) {
          var headerPair = headerPairs[i];
          // Can't use split() here because it does the wrong thing
          // if the header value has the string ": " in it.
          var index = headerPair.indexOf('\u003a\u0020');
          if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            headers[key] = val;
          }
        }

        return headers;
    }

    return parseResponseHeaders;
});

/*global define*/
define('Core/RequestErrorEvent',[
        './defined',
        './parseResponseHeaders'
    ], function(
        defined,
        parseResponseHeaders) {
    'use strict';

    /**
     * An event that is raised when a request encounters an error.
     *
     * @constructor
     * @alias RequestErrorEvent
     *
     * @param {Number} [statusCode] The HTTP error status code, such as 404.
     * @param {Object} [response] The response included along with the error.
     * @param {String|Object} [responseHeaders] The response headers, represented either as an object literal or as a
     *                        string in the format returned by XMLHttpRequest's getAllResponseHeaders() function.
     */
    function RequestErrorEvent(statusCode, response, responseHeaders) {
        /**
         * The HTTP error status code, such as 404.  If the error does not have a particular
         * HTTP code, this property will be undefined.
         *
         * @type {Number}
         */
        this.statusCode = statusCode;

        /**
         * The response included along with the error.  If the error does not include a response,
         * this property will be undefined.
         *
         * @type {Object}
         */
        this.response = response;

        /**
         * The headers included in the response, represented as an object literal of key/value pairs.
         * If the error does not include any headers, this property will be undefined.
         *
         * @type {Object}
         */
        this.responseHeaders = responseHeaders;

        if (typeof this.responseHeaders === 'string') {
            this.responseHeaders = parseResponseHeaders(this.responseHeaders);
        }
    }

    /**
     * Creates a string representing this RequestErrorEvent.
     * @memberof RequestErrorEvent
     *
     * @returns {String} A string representing the provided RequestErrorEvent.
     */
    RequestErrorEvent.prototype.toString = function() {
        var str = 'Request has failed.';
        if (defined(this.statusCode)) {
            str += ' Status Code: ' + this.statusCode;
        }
        return str;
    };

    return RequestErrorEvent;
});

/**
 * @license
 *
 * Grauw URI utilities
 *
 * See: http://hg.grauw.nl/grauw-lib/file/tip/src/uri.js
 *
 * @author Laurens Holst (http://www.grauw.nl/)
 *
 *   Copyright 2012 Laurens Holst
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
/*global define*/
define('ThirdParty/Uri',[],function() {

	/**
	 * Constructs a URI object.
	 * @constructor
	 * @class Implementation of URI parsing and base URI resolving algorithm in RFC 3986.
	 * @param {string|URI} uri A string or URI object to create the object from.
	 */
	function URI(uri) {
		if (uri instanceof URI) {  // copy constructor
			this.scheme = uri.scheme;
			this.authority = uri.authority;
			this.path = uri.path;
			this.query = uri.query;
			this.fragment = uri.fragment;
		} else if (uri) {  // uri is URI string or cast to string
			var c = parseRegex.exec(uri);
			this.scheme = c[1];
			this.authority = c[2];
			this.path = c[3];
			this.query = c[4];
			this.fragment = c[5];
		}
	}
	// Initial values on the prototype
	URI.prototype.scheme    = null;
	URI.prototype.authority = null;
	URI.prototype.path      = '';
	URI.prototype.query     = null;
	URI.prototype.fragment  = null;

	// Regular expression from RFC 3986 appendix B
	var parseRegex = new RegExp('^(?:([^:/?#]+):)?(?://([^/?#]*))?([^?#]*)(?:\\?([^#]*))?(?:#(.*))?$');

	/**
	 * Returns the scheme part of the URI.
	 * In "http://example.com:80/a/b?x#y" this is "http".
	 */
	URI.prototype.getScheme = function() {
		return this.scheme;
	};

	/**
	 * Returns the authority part of the URI.
	 * In "http://example.com:80/a/b?x#y" this is "example.com:80".
	 */
	URI.prototype.getAuthority = function() {
		return this.authority;
	};

	/**
	 * Returns the path part of the URI.
	 * In "http://example.com:80/a/b?x#y" this is "/a/b".
	 * In "mailto:mike@example.com" this is "mike@example.com".
	 */
	URI.prototype.getPath = function() {
		return this.path;
	};

	/**
	 * Returns the query part of the URI.
	 * In "http://example.com:80/a/b?x#y" this is "x".
	 */
	URI.prototype.getQuery = function() {
		return this.query;
	};

	/**
	 * Returns the fragment part of the URI.
	 * In "http://example.com:80/a/b?x#y" this is "y".
	 */
	URI.prototype.getFragment = function() {
		return this.fragment;
	};

	/**
	 * Tests whether the URI is an absolute URI.
	 * See RFC 3986 section 4.3.
	 */
	URI.prototype.isAbsolute = function() {
		return !!this.scheme && !this.fragment;
	};

	///**
	//* Extensive validation of the URI against the ABNF in RFC 3986
	//*/
	//URI.prototype.validate

	/**
	 * Tests whether the URI is a same-document reference.
	 * See RFC 3986 section 4.4.
	 *
	 * To perform more thorough comparison, you can normalise the URI objects.
	 */
	URI.prototype.isSameDocumentAs = function(uri) {
		return uri.scheme == this.scheme &&
		    uri.authority == this.authority &&
		         uri.path == this.path &&
		        uri.query == this.query;
	};

	/**
	 * Simple String Comparison of two URIs.
	 * See RFC 3986 section 6.2.1.
	 *
	 * To perform more thorough comparison, you can normalise the URI objects.
	 */
	URI.prototype.equals = function(uri) {
		return this.isSameDocumentAs(uri) && uri.fragment == this.fragment;
	};

	/**
	 * Normalizes the URI using syntax-based normalization.
	 * This includes case normalization, percent-encoding normalization and path segment normalization.
	 * XXX: Percent-encoding normalization does not escape characters that need to be escaped.
	 *      (Although that would not be a valid URI in the first place. See validate().)
	 * See RFC 3986 section 6.2.2.
	 */
	URI.prototype.normalize = function() {
		this.removeDotSegments();
		if (this.scheme)
			this.scheme = this.scheme.toLowerCase();
		if (this.authority)
			this.authority = this.authority.replace(authorityRegex, replaceAuthority).
									replace(caseRegex, replaceCase);
		if (this.path)
			this.path = this.path.replace(caseRegex, replaceCase);
		if (this.query)
			this.query = this.query.replace(caseRegex, replaceCase);
		if (this.fragment)
			this.fragment = this.fragment.replace(caseRegex, replaceCase);
	};

	var caseRegex = /%[0-9a-z]{2}/gi;
	var percentRegex = /[a-zA-Z0-9\-\._~]/;
	var authorityRegex = /(.*@)?([^@:]*)(:.*)?/;

	function replaceCase(str) {
		var dec = unescape(str);
		return percentRegex.test(dec) ? dec : str.toUpperCase();
	}

	function replaceAuthority(str, p1, p2, p3) {
		return (p1 || '') + p2.toLowerCase() + (p3 || '');
	}

	/**
	 * Resolve a relative URI (this) against a base URI.
	 * The base URI must be an absolute URI.
	 * See RFC 3986 section 5.2
	 */
	URI.prototype.resolve = function(baseURI) {
		var uri = new URI();
		if (this.scheme) {
			uri.scheme = this.scheme;
			uri.authority = this.authority;
			uri.path = this.path;
			uri.query = this.query;
		} else {
			uri.scheme = baseURI.scheme;
			if (this.authority) {
				uri.authority = this.authority;
				uri.path = this.path;
				uri.query = this.query;
			} else {
				uri.authority = baseURI.authority;
				if (this.path == '') {
					uri.path = baseURI.path;
					uri.query = this.query || baseURI.query;
				} else {
					if (this.path.charAt(0) == '/') {
						uri.path = this.path;
						uri.removeDotSegments();
					} else {
						if (baseURI.authority && baseURI.path == '') {
							uri.path = '/' + this.path;
						} else {
							uri.path = baseURI.path.substring(0, baseURI.path.lastIndexOf('/') + 1) + this.path;
						}
						uri.removeDotSegments();
					}
					uri.query = this.query;
				}
			}
		}
		uri.fragment = this.fragment;
		return uri;
	};

	/**
	 * Remove dot segments from path.
	 * See RFC 3986 section 5.2.4
	 * @private
	 */
	URI.prototype.removeDotSegments = function() {
		var input = this.path.split('/'),
			output = [],
			segment,
			absPath = input[0] == '';
		if (absPath)
			input.shift();
		var sFirst = input[0] == '' ? input.shift() : null;
		while (input.length) {
			segment = input.shift();
			if (segment == '..') {
				output.pop();
			} else if (segment != '.') {
				output.push(segment);
			}
		}
		if (segment == '.' || segment == '..')
			output.push('');
		if (absPath)
			output.unshift('');
		this.path = output.join('/');
	};

	// We don't like this function because it builds up a cache that is never cleared.
//	/**
//	 * Resolves a relative URI against an absolute base URI.
//	 * Convenience method.
//	 * @param {String} uri the relative URI to resolve
//	 * @param {String} baseURI the base URI (must be absolute) to resolve against
//	 */
//	URI.resolve = function(sURI, sBaseURI) {
//		var uri = cache[sURI] || (cache[sURI] = new URI(sURI));
//		var baseURI = cache[sBaseURI] || (cache[sBaseURI] = new URI(sBaseURI));
//		return uri.resolve(baseURI).toString();
//	};

//	var cache = {};

	/**
	 * Serialises the URI to a string.
	 */
	URI.prototype.toString = function() {
		var result = '';
		if (this.scheme)
			result += this.scheme + ':';
		if (this.authority)
			result += '//' + this.authority;
		result += this.path;
		if (this.query)
			result += '?' + this.query;
		if (this.fragment)
			result += '#' + this.fragment;
		return result;
	};

return URI;
});

/*global define*/
define('Core/TrustedServers',[
        '../ThirdParty/Uri',
        './defined',
        './DeveloperError'
    ], function(
        Uri,
        defined,
        DeveloperError) {
    'use strict';
    
    /**
     * A singleton that contains all of the servers that are trusted. Credentials will be sent with
     * any requests to these servers.
     *
     * @exports TrustedServers
     *
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     */
    var TrustedServers = {};
    var _servers = {};

    /**
     * Adds a trusted server to the registry
     *
     * @param {String} host The host to be added.
     * @param {Number} port The port used to access the host.
     *
     * @example
     * // Add a trusted server
     * TrustedServers.add('my.server.com', 80);
     */
    TrustedServers.add = function(host, port) {
                if (!defined(host)) {
            throw new DeveloperError('host is required.');
        }
        if (!defined(port) || port <= 0) {
            throw new DeveloperError('port is required to be greater than 0.');
        }
        
        var authority = host.toLowerCase() + ':' + port;
        if (!defined(_servers[authority])) {
            _servers[authority] = true;
        }
    };

    /**
     * Removes a trusted server from the registry
     *
     * @param {String} host The host to be removed.
     * @param {Number} port The port used to access the host.
     *
     * @example
     * // Remove a trusted server
     * TrustedServers.remove('my.server.com', 80);
     */
    TrustedServers.remove = function(host, port) {
                if (!defined(host)) {
            throw new DeveloperError('host is required.');
        }
        if (!defined(port) || port <= 0) {
            throw new DeveloperError('port is required to be greater than 0.');
        }
        
        var authority = host.toLowerCase() + ':' + port;
        if (defined(_servers[authority])) {
            delete _servers[authority];
        }
    };

    function getAuthority(url) {
        var uri = new Uri(url);
        uri.normalize();

        // Removes username:password@ so we just have host[:port]
        var authority = uri.getAuthority();
        if (!defined(authority)) {
            return undefined; // Relative URL
        }

        if (authority.indexOf('@') !== -1) {
            var parts = authority.split('@');
            authority = parts[1];
        }

        // If the port is missing add one based on the scheme
        if (authority.indexOf(':') === -1) {
            var scheme = uri.getScheme();
            if (!defined(scheme)) {
                scheme = window.location.protocol;
                scheme = scheme.substring(0, scheme.length-1);
            }
            if (scheme === 'http') {
                authority += ':80';
            } else if (scheme === 'https') {
                authority += ':443';
            } else {
                return undefined;
            }
        }

        return authority;
    }

    /**
     * Tests whether a server is trusted or not. The server must have been added with the port if it is included in the url.
     *
     * @param {String} url The url to be tested against the trusted list
     *
     * @returns {boolean} Returns true if url is trusted, false otherwise.
     *
     * @example
     * // Add server
     * TrustedServers.add('my.server.com', 81);
     *
     * // Check if server is trusted
     * if (TrustedServers.contains('https://my.server.com:81/path/to/file.png')) {
     *     // my.server.com:81 is trusted
     * }
     * if (TrustedServers.contains('https://my.server.com/path/to/file.png')) {
     *     // my.server.com isn't trusted
     * }
     */
    TrustedServers.contains = function(url) {
                if (!defined(url)) {
            throw new DeveloperError('url is required.');
        }
                var authority = getAuthority(url);
        if (defined(authority) && defined(_servers[authority])) {
            return true;
        }

        return false;
    };

    /**
     * Clears the registry
     *
     * @example
     * // Remove a trusted server
     * TrustedServers.clear();
     */
    TrustedServers.clear = function() {
        _servers = {};
    };
    
    return TrustedServers;
});

/*global define*/
define('Core/loadWithXhr',[
        '../ThirdParty/when',
        './defaultValue',
        './defined',
        './DeveloperError',
        './RequestErrorEvent',
        './RuntimeError',
        './TrustedServers'
    ], function(
        when,
        defaultValue,
        defined,
        DeveloperError,
        RequestErrorEvent,
        RuntimeError,
        TrustedServers) {
    'use strict';

    /**
     * Asynchronously loads the given URL.  Returns a promise that will resolve to
     * the result once loaded, or reject if the URL failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @exports loadWithXhr
     *
     * @param {Object} options Object with the following properties:
     * @param {String|Promise.<String>} options.url The URL of the data, or a promise for the URL.
     * @param {String} [options.responseType] The type of response.  This controls the type of item returned.
     * @param {String} [options.method='GET'] The HTTP method to use.
     * @param {String} [options.data] The data to send with the request, if any.
     * @param {Object} [options.headers] HTTP headers to send with the request, if any.
     * @param {String} [options.overrideMimeType] Overrides the MIME type returned by the server.
     * @returns {Promise.<Object>} a promise that will resolve to the requested data when loaded.
     *
     *
     * @example
     * // Load a single URL asynchronously. In real code, you should use loadBlob instead.
     * Cesium.loadWithXhr({
     *     url : 'some/url',
     *     responseType : 'blob'
     * }).then(function(blob) {
     *     // use the data
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     *
     * @see loadArrayBuffer
     * @see loadBlob
     * @see loadJson
     * @see loadText
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    function loadWithXhr(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

                if (!defined(options.url)) {
            throw new DeveloperError('options.url is required.');
        }
        
        var responseType = options.responseType;
        var method = defaultValue(options.method, 'GET');
        var data = options.data;
        var headers = options.headers;
        var overrideMimeType = options.overrideMimeType;

        return when(options.url, function(url) {
            var deferred = when.defer();

            loadWithXhr.load(url, responseType, method, data, headers, deferred, overrideMimeType);

            return deferred.promise;
        });
    }

    var dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;

    function decodeDataUriText(isBase64, data) {
        var result = decodeURIComponent(data);
        if (isBase64) {
            return atob(result);
        }
        return result;
    }

    function decodeDataUriArrayBuffer(isBase64, data) {
        var byteString = decodeDataUriText(isBase64, data);
        var buffer = new ArrayBuffer(byteString.length);
        var view = new Uint8Array(buffer);
        for (var i = 0; i < byteString.length; i++) {
            view[i] = byteString.charCodeAt(i);
        }
        return buffer;
    }

    function decodeDataUri(dataUriRegexResult, responseType) {
        responseType = defaultValue(responseType, '');
        var mimeType = dataUriRegexResult[1];
        var isBase64 = !!dataUriRegexResult[2];
        var data = dataUriRegexResult[3];

        switch (responseType) {
            case '':
            case 'text':
                return decodeDataUriText(isBase64, data);
            case 'arraybuffer':
                return decodeDataUriArrayBuffer(isBase64, data);
            case 'blob':
                var buffer = decodeDataUriArrayBuffer(isBase64, data);
                return new Blob([buffer], {
                    type : mimeType
                });
            case 'document':
                var parser = new DOMParser();
                return parser.parseFromString(decodeDataUriText(isBase64, data), mimeType);
            case 'json':
                return JSON.parse(decodeDataUriText(isBase64, data));
            default:
                                throw new DeveloperError('Unhandled responseType: ' + responseType);
                        }
    }

    // This is broken out into a separate function so that it can be mocked for testing purposes.
    loadWithXhr.load = function(url, responseType, method, data, headers, deferred, overrideMimeType) {
        var dataUriRegexResult = dataUriRegex.exec(url);
        if (dataUriRegexResult !== null) {
            deferred.resolve(decodeDataUri(dataUriRegexResult, responseType));
            return;
        }

        var xhr = new XMLHttpRequest();

        if (TrustedServers.contains(url)) {
            xhr.withCredentials = true;
        }

        if (defined(overrideMimeType) && defined(xhr.overrideMimeType)) {
            xhr.overrideMimeType(overrideMimeType);
        }

        xhr.open(method, url, true);

        if (defined(headers)) {
            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }
        }

        if (defined(responseType)) {
            xhr.responseType = responseType;
        }

        xhr.onload = function() {
            if (xhr.status < 200 || xhr.status >= 300) {
                deferred.reject(new RequestErrorEvent(xhr.status, xhr.response, xhr.getAllResponseHeaders()));
                return;
            }

            var response = xhr.response;
            var browserResponseType = xhr.responseType;

            //All modern browsers will go into either the first if block or last else block.
            //Other code paths support older browsers that either do not support the supplied responseType
            //or do not support the xhr.response property.
            if (defined(response) && (!defined(responseType) || (browserResponseType === responseType))) {
                deferred.resolve(response);
            } else if ((responseType === 'json') && typeof response === 'string') {
                try {
                    deferred.resolve(JSON.parse(response));
                } catch (e) {
                    deferred.reject(e);
                }
            } else if ((browserResponseType === '' || browserResponseType === 'document') && defined(xhr.responseXML) && xhr.responseXML.hasChildNodes()) {
                deferred.resolve(xhr.responseXML);
            } else if ((browserResponseType === '' || browserResponseType === 'text') && defined(xhr.responseText)) {
                deferred.resolve(xhr.responseText);
            } else {
                deferred.reject(new RuntimeError('Invalid XMLHttpRequest response type.'));
            }
        };

        xhr.onerror = function(e) {
            deferred.reject(new RequestErrorEvent());
        };

        xhr.send(data);
    };

    loadWithXhr.defaultLoad = loadWithXhr.load;

    return loadWithXhr;
});

/*global define*/
define('Core/loadArrayBuffer',[
        './loadWithXhr'
    ], function(
        loadWithXhr) {
    'use strict';

    /**
     * Asynchronously loads the given URL as raw binary data.  Returns a promise that will resolve to
     * an ArrayBuffer once loaded, or reject if the URL failed to load.  The data is loaded
     * using XMLHttpRequest, which means that in order to make requests to another origin,
     * the server must have Cross-Origin Resource Sharing (CORS) headers enabled.
     *
     * @exports loadArrayBuffer
     *
     * @param {String|Promise.<String>} url The URL of the binary data, or a promise for the URL.
     * @param {Object} [headers] HTTP headers to send with the requests.
     * @returns {Promise.<ArrayBuffer>} a promise that will resolve to the requested data when loaded.
     *
     *
     * @example
     * // load a single URL asynchronously
     * Cesium.loadArrayBuffer('some/url').then(function(arrayBuffer) {
     *     // use the data
     * }).otherwise(function(error) {
     *     // an error occurred
     * });
     * 
     * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    function loadArrayBuffer(url, headers) {
        return loadWithXhr({
            url : url,
            responseType : 'arraybuffer',
            headers : headers
        });
    }

    return loadArrayBuffer;
});

/*global define*/
define('Core/getAbsoluteUri',[
        '../ThirdParty/Uri',
        './defaultValue',
        './defined',
        './DeveloperError'
    ], function(
        Uri,
        defaultValue,
        defined,
        DeveloperError) {
    'use strict';

    /**
     * Given a relative Uri and a base Uri, returns the absolute Uri of the relative Uri.
     * @exports getAbsoluteUri
     *
     * @param {String} relative The relative Uri.
     * @param {String} [base] The base Uri.
     * @returns {String} The absolute Uri of the given relative Uri.
     *
     * @example
     * //absolute Uri will be "https://test.com/awesome.png";
     * var absoluteUri = Cesium.getAbsoluteUri('awesome.png', 'https://test.com');
     */
    function getAbsoluteUri(relative, base) {
                if (!defined(relative)) {
            throw new DeveloperError('relative uri is required.');
        }
                base = defaultValue(base, document.location.href);
        var baseUri = new Uri(base);
        var relativeUri = new Uri(relative);
        return relativeUri.resolve(baseUri).toString();
    }

    return getAbsoluteUri;
});

/*global define*/
define('Core/joinUrls',[
        '../ThirdParty/Uri',
        './defaultValue',
        './defined',
        './DeveloperError'
    ], function(
        Uri,
        defaultValue,
        defined,
        DeveloperError) {
    'use strict';

    /**
     * Function for joining URLs in a manner that is aware of query strings and fragments.
     * This is useful when the base URL has a query string that needs to be maintained
     * (e.g. a presigned base URL).
     * @param {String|Uri} first The base URL.
     * @param {String|Uri} second The URL path to join to the base URL.  If this URL is absolute, it is returned unmodified.
     * @param {Boolean} [appendSlash=true] The boolean determining whether there should be a forward slash between first and second.
     * @private
     */
    function joinUrls(first, second, appendSlash) {
                if (!defined(first)) {
            throw new DeveloperError('first is required');
        }
        if (!defined(second)) {
            throw new DeveloperError('second is required');
        }
        
        appendSlash = defaultValue(appendSlash, true);

        if (!(first instanceof Uri)) {
            first = new Uri(first);
        }

        if (!(second instanceof Uri)) {
            second = new Uri(second);
        }

        // Uri.isAbsolute returns false for a URL like '//foo.com'.  So if we have an authority but
        // not a scheme, add a scheme matching the page's scheme.
        if (defined(second.authority) && !defined(second.scheme)) {
            if (typeof document !== 'undefined' && defined(document.location) && defined(document.location.href)) {
                second.scheme = new Uri(document.location.href).scheme;
            } else {
                // Not in a browser?  Use the first URL's scheme instead.
                second.scheme = first.scheme;
            }
        }

        // If the second URL is absolute, use it for the scheme, authority, and path.
        var baseUri = first;
        if (second.isAbsolute()) {
            baseUri = second;
        }

        var url = '';
        if (defined(baseUri.scheme)) {
            url += baseUri.scheme + ':';
        }
        if (defined(baseUri.authority)) {
            url += '//' + baseUri.authority;

            if (baseUri.path !== '' && baseUri.path !== '/') {
                url = url.replace(/\/?$/, '/');
                baseUri.path = baseUri.path.replace(/^\/?/g, '');
            }
        }

        // Combine the paths (only if second is relative).
        if (baseUri === first) {
            if (appendSlash) {
                url += first.path.replace(/\/?$/, '/') + second.path.replace(/^\/?/g, '');
            } else {
                url += first.path + second.path;
            }
        } else {
            url += second.path;
        }

        // Combine the queries and fragments.
        var hasFirstQuery = defined(first.query);
        var hasSecondQuery = defined(second.query);
        if (hasFirstQuery && hasSecondQuery) {
            url += '?' + first.query + '&' + second.query;
        } else if (hasFirstQuery && !hasSecondQuery) {
            url += '?' + first.query;
        } else if (!hasFirstQuery && hasSecondQuery) {
            url += '?' + second.query;
        }

        var hasSecondFragment = defined(second.fragment);
        if (defined(first.fragment) && !hasSecondFragment) {
            url += '#' + first.fragment;
        } else if (hasSecondFragment) {
            url += '#' + second.fragment;
        }

        return url;
    }

    return joinUrls;
});

/*global define*/
define('Core/buildModuleUrl',[
        '../ThirdParty/Uri',
        './defined',
        './DeveloperError',
        './getAbsoluteUri',
        './joinUrls',
        'require'
    ], function(
        Uri,
        defined,
        DeveloperError,
        getAbsoluteUri,
        joinUrls,
        require) {
    'use strict';
    /*global CESIUM_BASE_URL*/

    var cesiumScriptRegex = /((?:.*\/)|^)cesium[\w-]*\.js(?:\W|$)/i;
    function getBaseUrlFromCesiumScript() {
        var scripts = document.getElementsByTagName('script');
        for ( var i = 0, len = scripts.length; i < len; ++i) {
            var src = scripts[i].getAttribute('src');
            var result = cesiumScriptRegex.exec(src);
            if (result !== null) {
                return result[1];
            }
        }
        return undefined;
    }

    var baseUrl;
    function getCesiumBaseUrl() {
        if (defined(baseUrl)) {
            return baseUrl;
        }

        var baseUrlString;
        if (typeof CESIUM_BASE_URL !== 'undefined') {
            baseUrlString = CESIUM_BASE_URL;
        } else {
            baseUrlString = getBaseUrlFromCesiumScript();
        }

                if (!defined(baseUrlString)) {
            throw new DeveloperError('Unable to determine Cesium base URL automatically, try defining a global variable called CESIUM_BASE_URL.');
        }
        
        baseUrl = new Uri(getAbsoluteUri(baseUrlString));

        return baseUrl;
    }

    function buildModuleUrlFromRequireToUrl(moduleID) {
        //moduleID will be non-relative, so require it relative to this module, in Core.
        return require.toUrl('../' + moduleID);
    }

    function buildModuleUrlFromBaseUrl(moduleID) {
        return joinUrls(getCesiumBaseUrl(), moduleID);
    }

    var implementation;
    var a;

    /**
     * Given a non-relative moduleID, returns an absolute URL to the file represented by that module ID,
     * using, in order of preference, require.toUrl, the value of a global CESIUM_BASE_URL, or
     * the base URL of the Cesium.js script.
     *
     * @private
     */
    function buildModuleUrl(moduleID) {
        if (!defined(implementation)) {
            //select implementation
            if (defined(require.toUrl)) {
                implementation = buildModuleUrlFromRequireToUrl;
            } else {
                implementation = buildModuleUrlFromBaseUrl;
            }
        }

        if (!defined(a)) {
            a = document.createElement('a');
        }

        var url = implementation(moduleID);

        a.href = url;
        a.href = a.href; // IE only absolutizes href on get, not set

        return a.href;
    }

    // exposed for testing
    buildModuleUrl._cesiumScriptRegex = cesiumScriptRegex;

    /**
     * Sets the base URL for resolving modules.
     * @param {String} value The new base URL.
     */
    buildModuleUrl.setBaseUrl = function(value) {
        baseUrl = new Uri(value).resolve(new Uri(document.location.href));
    };

    return buildModuleUrl;
});

/*global define*/
define('Core/destroyObject',[
        './defaultValue',
        './DeveloperError'
    ], function(
        defaultValue,
        DeveloperError) {
    'use strict';

    function returnTrue() {
        return true;
    }

    /**
     * Destroys an object.  Each of the object's functions, including functions in its prototype,
     * is replaced with a function that throws a {@link DeveloperError}, except for the object's
     * <code>isDestroyed</code> function, which is set to a function that returns <code>true</code>.
     * The object's properties are removed with <code>delete</code>.
     * <br /><br />
     * This function is used by objects that hold native resources, e.g., WebGL resources, which
     * need to be explicitly released.  Client code calls an object's <code>destroy</code> function,
     * which then releases the native resource and calls <code>destroyObject</code> to put itself
     * in a destroyed state.
     *
     * @exports destroyObject
     *
     * @param {Object} object The object to destroy.
     * @param {String} [message] The message to include in the exception that is thrown if
     *                           a destroyed object's function is called.
     *
     *
     * @example
     * // How a texture would destroy itself.
     * this.destroy = function () {
     *     _gl.deleteTexture(_texture);
     *     return Cesium.destroyObject(this);
     * };
     * 
     * @see DeveloperError
     */
    function destroyObject(object, message) {
        message = defaultValue(message, 'This object was destroyed, i.e., destroy() was called.');

        function throwOnDestroyed() {
                        throw new DeveloperError(message);
                    }

        for ( var key in object) {
            if (typeof object[key] === 'function') {
                object[key] = throwOnDestroyed;
            }
        }

        object.isDestroyed = returnTrue;

        return undefined;
    }

    return destroyObject;
});

/*global define*/
define('Core/isCrossOriginUrl',[
        './defined'
    ], function(
        defined) {
    'use strict';

    var a;

    /**
     * Given a URL, determine whether that URL is considered cross-origin to the current page.
     *
     * @private
     */
    function isCrossOriginUrl(url) {
        if (!defined(a)) {
            a = document.createElement('a');
        }

        // copy window location into the anchor to get consistent results
        // when the port is default for the protocol (e.g. 80 for HTTP)
        a.href = window.location.href;

        // host includes both hostname and port if the port is not standard
        var host = a.host;
        var protocol = a.protocol;

        a.href = url;
        a.href = a.href; // IE only absolutizes href on get, not set

        return protocol !== a.protocol || host !== a.host;
    }

    return isCrossOriginUrl;
});

/*global define*/
define('Core/TaskProcessor',[
        '../ThirdParty/when',
        './buildModuleUrl',
        './defaultValue',
        './defined',
        './destroyObject',
        './DeveloperError',
        './getAbsoluteUri',
        './isCrossOriginUrl',
        './RuntimeError',
        'require'
    ], function(
        when,
        buildModuleUrl,
        defaultValue,
        defined,
        destroyObject,
        DeveloperError,
        getAbsoluteUri,
        isCrossOriginUrl,
        RuntimeError,
        require) {
    'use strict';

    function canTransferArrayBuffer() {
        if (!defined(TaskProcessor._canTransferArrayBuffer)) {
            var worker = new Worker(getWorkerUrl('Workers/transferTypedArrayTest.js'));
            worker.postMessage = defaultValue(worker.webkitPostMessage, worker.postMessage);

            var value = 99;
            var array = new Int8Array([value]);

            try {
                // postMessage might fail with a DataCloneError
                // if transferring array buffers is not supported.
                worker.postMessage({
                    array : array
                }, [array.buffer]);
            } catch (e) {
                TaskProcessor._canTransferArrayBuffer = false;
                return TaskProcessor._canTransferArrayBuffer;
            }

            var deferred = when.defer();

            worker.onmessage = function(event) {
                var array = event.data.array;

                // some versions of Firefox silently fail to transfer typed arrays.
                // https://bugzilla.mozilla.org/show_bug.cgi?id=841904
                // Check to make sure the value round-trips successfully.
                var result = defined(array) && array[0] === value;
                deferred.resolve(result);

                worker.terminate();

                TaskProcessor._canTransferArrayBuffer = result;
            };

            TaskProcessor._canTransferArrayBuffer = deferred.promise;
        }

        return TaskProcessor._canTransferArrayBuffer;
    }

    function completeTask(processor, data) {
        --processor._activeTasks;

        var id = data.id;
        if (!defined(id)) {
            // This is not one of ours.
            return;
        }

        var deferreds = processor._deferreds;
        var deferred = deferreds[id];

        if (defined(data.error)) {
            var error = data.error;
            if (error.name === 'RuntimeError') {
                error = new RuntimeError(data.error.message);
                error.stack = data.error.stack;
            } else if (error.name === 'DeveloperError') {
                error = new DeveloperError(data.error.message);
                error.stack = data.error.stack;
            }
            deferred.reject(error);
        } else {
            deferred.resolve(data.result);
        }

        delete deferreds[id];
    }

    function getWorkerUrl(moduleID) {
        var url = buildModuleUrl(moduleID);

        if (isCrossOriginUrl(url)) {
            //to load cross-origin, create a shim worker from a blob URL
            var script = 'importScripts("' + url + '");';

            var blob;
            try {
                blob = new Blob([script], {
                    type : 'application/javascript'
                });
            } catch (e) {
                var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
                var blobBuilder = new BlobBuilder();
                blobBuilder.append(script);
                blob = blobBuilder.getBlob('application/javascript');
            }

            var URL = window.URL || window.webkitURL;
            url = URL.createObjectURL(blob);
        }

        return url;
    }

    var bootstrapperUrlResult;
    function getBootstrapperUrl() {
        if (!defined(bootstrapperUrlResult)) {
            bootstrapperUrlResult = getWorkerUrl('Workers/cesiumWorkerBootstrapper.js');
        }
        return bootstrapperUrlResult;
    }

    function createWorker(processor) {
        var worker = new Worker(getBootstrapperUrl());
        worker.postMessage = defaultValue(worker.webkitPostMessage, worker.postMessage);

        var bootstrapMessage = {
            loaderConfig : {},
            workerModule : TaskProcessor._workerModulePrefix + processor._workerName
        };

        if (defined(TaskProcessor._loaderConfig)) {
            bootstrapMessage.loaderConfig = TaskProcessor._loaderConfig;
        } else if (defined(require.toUrl)) {
            bootstrapMessage.loaderConfig.baseUrl =
                getAbsoluteUri('..', buildModuleUrl('Workers/cesiumWorkerBootstrapper.js'));
        } else {
            bootstrapMessage.loaderConfig.paths = {
                'Workers' : buildModuleUrl('Workers')
            };
        }

        worker.postMessage(bootstrapMessage);

        worker.onmessage = function(event) {
            completeTask(processor, event.data);
        };

        return worker;
    }

    /**
     * A wrapper around a web worker that allows scheduling tasks for a given worker,
     * returning results asynchronously via a promise.
     *
     * The Worker is not constructed until a task is scheduled.
     *
     * @alias TaskProcessor
     * @constructor
     *
     * @param {String} workerName The name of the worker.  This is expected to be a script
     *                            in the Workers folder.
     * @param {Number} [maximumActiveTasks=5] The maximum number of active tasks.  Once exceeded,
     *                                        scheduleTask will not queue any more tasks, allowing
     *                                        work to be rescheduled in future frames.
     */
    function TaskProcessor(workerName, maximumActiveTasks) {
        this._workerName = workerName;
        this._maximumActiveTasks = defaultValue(maximumActiveTasks, 5);
        this._activeTasks = 0;
        this._deferreds = {};
        this._nextID = 0;
    }

    var emptyTransferableObjectArray = [];

    /**
     * Schedule a task to be processed by the web worker asynchronously.  If there are currently more
     * tasks active than the maximum set by the constructor, will immediately return undefined.
     * Otherwise, returns a promise that will resolve to the result posted back by the worker when
     * finished.
     *
     * @param {*} parameters Any input data that will be posted to the worker.
     * @param {Object[]} [transferableObjects] An array of objects contained in parameters that should be
     *                                      transferred to the worker instead of copied.
     * @returns {Promise.<Object>|undefined} Either a promise that will resolve to the result when available, or undefined
     *                    if there are too many active tasks,
     *
     * @example
     * var taskProcessor = new Cesium.TaskProcessor('myWorkerName');
     * var promise = taskProcessor.scheduleTask({
     *     someParameter : true,
     *     another : 'hello'
     * });
     * if (!Cesium.defined(promise)) {
     *     // too many active tasks - try again later
     * } else {
     *     Cesium.when(promise, function(result) {
     *         // use the result of the task
     *     });
     * }
     */
    TaskProcessor.prototype.scheduleTask = function(parameters, transferableObjects) {
        if (!defined(this._worker)) {
            this._worker = createWorker(this);
        }

        if (this._activeTasks >= this._maximumActiveTasks) {
            return undefined;
        }

        ++this._activeTasks;

        var processor = this;
        return when(canTransferArrayBuffer(), function(canTransferArrayBuffer) {
            if (!defined(transferableObjects)) {
                transferableObjects = emptyTransferableObjectArray;
            } else if (!canTransferArrayBuffer) {
                transferableObjects.length = 0;
            }

            var id = processor._nextID++;
            var deferred = when.defer();
            processor._deferreds[id] = deferred;

            processor._worker.postMessage({
                id : id,
                parameters : parameters,
                canTransferArrayBuffer : canTransferArrayBuffer
            }, transferableObjects);

            return deferred.promise;
        });
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     *
     * @see TaskProcessor#destroy
     */
    TaskProcessor.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys this object.  This will immediately terminate the Worker.
     * <br /><br />
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @returns {undefined}
     */
    TaskProcessor.prototype.destroy = function() {
        if (defined(this._worker)) {
            this._worker.terminate();
        }
        return destroyObject(this);
    };

    // exposed for testing purposes
    TaskProcessor._defaultWorkerModulePrefix = 'Workers/';
    TaskProcessor._workerModulePrefix = TaskProcessor._defaultWorkerModulePrefix;
    TaskProcessor._loaderConfig = undefined;
    TaskProcessor._canTransferArrayBuffer = undefined;

    return TaskProcessor;
});

/*global define*/
define('Core/throttleRequestByServer',[
        '../ThirdParty/Uri',
        '../ThirdParty/when',
        './defaultValue'
    ], function(
        Uri,
        when,
        defaultValue) {
    'use strict';

    var activeRequests = {};

    var pageUri = typeof document !== 'undefined' ? new Uri(document.location.href) : new Uri();
    function getServer(url) {
        var uri = new Uri(url).resolve(pageUri);
        uri.normalize();
        var server = uri.authority;
        if (!/:/.test(server)) {
            server = server + ':' + (uri.scheme === 'https' ? '443' : '80');
        }
        return server;
    }

    /**
     * Because browsers throttle the number of parallel requests allowed to each server,
     * this function tracks the number of active requests in progress to each server, and
     * returns undefined immediately if the request would exceed the maximum, allowing
     * the caller to retry later, instead of queueing indefinitely under the browser's control.
     *
     * @exports throttleRequestByServer
     *
     * @param {String} url The URL to request.
     * @param {throttleRequestByServer~RequestFunction} requestFunction The actual function that
     *        makes the request.
     * @returns {Promise.<Object>|undefined} Either undefined, meaning the request would exceed the maximum number of
     *          parallel requests, or a Promise for the requested data.
     *
     *
     * @example
     * // throttle requests for an image
     * var url = 'http://madeupserver.example.com/myImage.png';
     * function requestFunction(url) {
     *   // in this simple example, loadImage could be used directly as requestFunction.
     *   return Cesium.loadImage(url);
     * };
     * var promise = Cesium.throttleRequestByServer(url, requestFunction);
     * if (!Cesium.defined(promise)) {
     *   // too many active requests in progress, try again later.
     * } else {
     *   promise.then(function(image) {
     *     // handle loaded image
     *   });
     * }
     * 
     * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
     */
    function throttleRequestByServer(url, requestFunction) {
        var server = getServer(url);

        var activeRequestsForServer = defaultValue(activeRequests[server], 0);
        if (activeRequestsForServer >= throttleRequestByServer.maximumRequestsPerServer) {
            return undefined;
        }

        activeRequests[server] = activeRequestsForServer + 1;

        return when(requestFunction(url), function(result) {
            activeRequests[server]--;
            return result;
        }).otherwise(function(error) {
            activeRequests[server]--;
            return when.reject(error);
        });
    }

    /**
     * Specifies the maximum number of requests that can be simultaneously open to a single server.  If this value is higher than
     * the number of requests per server actually allowed by the web browser, Cesium's ability to prioritize requests will be adversely
     * affected.
     * @type {Number}
     * @default 6
     */
    throttleRequestByServer.maximumRequestsPerServer = 6;

    /**
     * A function that will make a request if there are available slots to the server.
     * @callback throttleRequestByServer~RequestFunction
     *
     * @param {String} url The url to request.
     * @returns {Promise.<Object>} A promise for the requested data.
     */

    return throttleRequestByServer;
});

/*global define*/
define('Core/GoogleEarthEnterpriseMetadata',[
    '../ThirdParty/pako_inflate',
    '../ThirdParty/when',
    './appendForwardSlash',
    './Check',
    './defaultValue',
    './defined',
    './defineProperties',
    './DeveloperError',
    './loadArrayBuffer',
    './RuntimeError',
    './TaskProcessor',
    './throttleRequestByServer'
], function(
    pako,
    when,
    appendForwardSlash,
    Check,
    defaultValue,
    defined,
    defineProperties,
    DeveloperError,
    loadArrayBuffer,
    RuntimeError,
    TaskProcessor,
    throttleRequestByServer) {
    'use strict';

    // Bitmask for checking tile properties
    var childrenBitmasks = [0x01, 0x02, 0x04, 0x08];
    var anyChildBitmask = 0x0F;
    var cacheFlagBitmask = 0x10; // True if there is a child subtree
    var imageBitmask = 0x40;
    var terrainBitmask = 0x80;

    function isBitSet(bits, mask) {
        return ((bits & mask) !== 0);
    }

    /**
     * Contains information about each tile from a Google Earth Enterprise server
     *
     * @param {Number} bits Bitmask that contains the type of data and available children for each tile.
     * @param {Number} cnodeVersion Version of the request for subtree metadata.
     * @param {Number} imageryVersion Version of the request for imagery tile.
     * @param {Number} terrainVersion Version of the request for terrain tile.
     *
     * @private
     */
    function TileInformation(bits, cnodeVersion, imageryVersion, terrainVersion) {
        this._bits = bits;
        this.cnodeVersion = cnodeVersion;
        this.imageryVersion = imageryVersion;
        this.terrainVersion = terrainVersion;
        this.ancestorHasTerrain = false; // Set it later once we find its parent
        this.terrainState = undefined;
    }

    /**
     * Creates TileInformation from an object
     *
     * @param {Object} info Object to be cloned
     * @param {TileInformation} [result] The object onto which to store the result.
     * @returns {TileInformation} The modified result parameter or a new TileInformation instance if none was provided.
     */
    TileInformation.clone = function(info, result) {
        if (!defined(result)) {
            result = new TileInformation(info._bits, info.cnodeVersion, info.imageryVersion, info.terrainVersion);
        } else {
            result._bits = info._bits;
            result.cnodeVersion = info.cnodeVersion;
            result.imageryVersion = info.imageryVersion;
            result.terrainVersion = info.terrainVersion;
        }
        result.ancestorHasTerrain = info.ancestorHasTerrain;
        result.terrainState = info.terrainState;

        return result;
    };

    /**
     * Sets the parent for the tile
     *
     * @param {TileInformation} parent Parent tile
     */
    TileInformation.prototype.setParent = function(parent) {
        this.ancestorHasTerrain = parent.ancestorHasTerrain || this.hasTerrain();
    };

    /**
     * Gets whether a subtree is available
     *
     * @returns {Boolean} true if subtree is available, false otherwise.
     */
    TileInformation.prototype.hasSubtree = function() {
        return isBitSet(this._bits, cacheFlagBitmask);
    };

    /**
     * Gets whether imagery is available
     *
     * @returns {Boolean} true if imagery is available, false otherwise.
     */
    TileInformation.prototype.hasImagery = function() {
        return isBitSet(this._bits, imageBitmask);
    };

    /**
     * Gets whether terrain is available
     *
     * @returns {Boolean} true if terrain is available, false otherwise.
     */
    TileInformation.prototype.hasTerrain = function() {
        return isBitSet(this._bits, terrainBitmask);
    };

    /**
     * Gets whether any children are present
     *
     * @returns {Boolean} true if any children are available, false otherwise.
     */
    TileInformation.prototype.hasChildren = function() {
        return isBitSet(this._bits, anyChildBitmask);
    };

    /**
     * Gets whether a specified child is available
     *
     * @param {Number} index Index of child tile
     *
     * @returns {Boolean} true if child is available, false otherwise
     */
    TileInformation.prototype.hasChild = function(index) {
        return isBitSet(this._bits, childrenBitmasks[index]);
    };

    /**
     * Gets bitmask containing children
     *
     * @returns {Number} Children bitmask
     */
    TileInformation.prototype.getChildBitmask = function() {
        return this._bits & anyChildBitmask;
    };

    GoogleEarthEnterpriseMetadata.TileInformation = TileInformation;

    /**
     * Provides metadata using the Google Earth Enterprise REST API. This is used by the
     *
     * @alias GoogleEarthEnterpriseMetadata
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {String} options.url The url of the Google Earth Enterprise server hosting the imagery.
     * @param {Proxy} [options.proxy] A proxy to use for requests. This object is
     *        expected to have a getURL function which returns the proxied URL, if needed.
     *
     * @see GoogleEarthEnterpriseImageryProvider
     * @see GoogleEarthEnterpriseTerrainProvider
     *
     */
    function GoogleEarthEnterpriseMetadata(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
                Check.typeOf.string('options.url', options.url);
        
        this._url = appendForwardSlash(options.url);
        this._proxy = options.proxy;

        this._tileInfo = {};
        this._subtreePromises = {};

        var that = this;
        this._readyPromise = this.getQuadTreePacket('', 1, false)
            .then(function() {
                return true;
            })
            .otherwise(function(e) {
                var message = 'An error occurred while accessing ' + getMetadataUrl(that, '', 1) + '.';
                return when.reject(new RuntimeError(message));
            });
    }

    defineProperties(GoogleEarthEnterpriseMetadata.prototype, {
        /**
         * Gets the name of the Google Earth Enterprise server.
         * @memberof GoogleEarthEnterpriseMetadata.prototype
         * @type {String}
         * @readonly
         */
        url : {
            get : function() {
                return this._url;
            }
        },

        /**
         * Gets the proxy used for metadata requests.
         * @memberof GoogleEarthEnterpriseImageryProvider.prototype
         * @type {Proxy}
         * @readonly
         */
        proxy : {
            get : function() {
                return this._proxy;
            }
        },

        /**
         * Gets a promise that resolves to true when the metadata is ready for use.
         * @memberof GoogleEarthEnterpriseProvider.prototype
         * @type {Promise.<Boolean>}
         * @readonly
         */
        readyPromise : {
            get : function() {
                return this._readyPromise;
            }
        }
    });

    /**
     * Converts a tiles (x, y, level) position into a quadkey used to request an image
     * from a Google Earth Enterprise server.
     *
     * @param {Number} x The tile's x coordinate.
     * @param {Number} y The tile's y coordinate.
     * @param {Number} level The tile's zoom level.
     *
     * @see GoogleEarthEnterpriseMetadata#quadKeyToTileXY
     */
    GoogleEarthEnterpriseMetadata.tileXYToQuadKey = function(x, y, level) {
        var quadkey = '';
        for (var i = level; i >= 0; --i) {
            var bitmask = 1 << i;
            var digit = 0;

            // Tile Layout
            // ___ ___
            //|   |   |
            //| 3 | 2 |
            //|-------|
            //| 0 | 1 |
            //|___|___|
            //

            if (!isBitSet(y, bitmask)) { // Top Row
                digit |= 2;
                if (!isBitSet(x, bitmask)) { // Right to left
                    digit |= 1;
                }
            } else {
                if (isBitSet(x, bitmask)) { // Left to right
                    digit |= 1;
                }
            }

            quadkey += digit;
        }
        return quadkey;
    };

    /**
     * Converts a tile's quadkey used to request an image from a Google Earth Enterprise server into the
     * (x, y, level) position.
     *
     * @param {String} quadkey The tile's quad key
     *
     * @see GoogleEarthEnterpriseMetadata#tileXYToQuadKey
     */
    GoogleEarthEnterpriseMetadata.quadKeyToTileXY = function(quadkey) {
        var x = 0;
        var y = 0;
        var level = quadkey.length - 1;
        for (var i = level; i >= 0; --i) {
            var bitmask = 1 << i;
            var digit = +quadkey[level - i];

            if (isBitSet(digit, 2)) {  // Top Row
                if (!isBitSet(digit, 1)) { // // Right to left
                    x |= bitmask;
                }
            } else {
                y |= bitmask;
                if (isBitSet(digit, 1)) { // Left to right
                    x |= bitmask;
                }
            }
        }
        return {
            x : x,
            y : y,
            level : level
        };
    };

    GoogleEarthEnterpriseMetadata.prototype.isValid = function(quadKey) {
        var info = this.getTileInformationFromQuadKey(quadKey);
        if (defined(info)) {
            return info !== null;
        }

        var valid = true;
        var q = quadKey;
        var last;
        while (q.length > 1) {
            last = q.substring(q.length - 1);
            q = q.substring(0, q.length - 1);
            info = this.getTileInformationFromQuadKey(q);
            if (defined(info)) {
                if (!info.hasSubtree() &&
                    !info.hasChild(parseInt(last))) {
                    // We have no subtree or child available at some point in this node's ancestry
                    valid = false;
                }

                break;
            } else if (info === null) {
                // Some node in the ancestry was loaded and said there wasn't a subtree
                valid = false;
                break;
            }
        }

        return valid;
    };

    var compressedMagic = 0x7468dead;
    var compressedMagicSwap = 0xadde6874;

    // Decodes packet with a key that has been around since the beginning of Google Earth Enterprise
    var key = "\x45\xf4\xbd\x0b\x79\xe2\x6a\x45\x22\x05\x92\x2c\x17\xcd\x06\x71\xf8\x49\x10\x46\x67\x51\x00\x42\x25\xc6\xe8\x61\x2c\x66\x29\x08\xc6\x34\xdc\x6a\x62\x25\x79\x0a\x77\x1d\x6d\x69\xd6\xf0\x9c\x6b\x93\xa1\xbd\x4e\x75\xe0\x41\x04\x5b\xdf\x40\x56\x0c\xd9\xbb\x72\x9b\x81\x7c\x10\x33\x53\xee\x4f\x6c\xd4\x71\x05\xb0\x7b\xc0\x7f\x45\x03\x56\x5a\xad\x77\x55\x65\x0b\x33\x92\x2a\xac\x19\x6c\x35\x14\xc5\x1d\x30\x73\xf8\x33\x3e\x6d\x46\x38\x4a\xb4\xdd\xf0\x2e\xdd\x17\x75\x16\xda\x8c\x44\x74\x22\x06\xfa\x61\x22\x0c\x33\x22\x53\x6f\xaf\x39\x44\x0b\x8c\x0e\x39\xd9\x39\x13\x4c\xb9\xbf\x7f\xab\x5c\x8c\x50\x5f\x9f\x22\x75\x78\x1f\xe9\x07\x71\x91\x68\x3b\xc1\xc4\x9b\x7f\xf0\x3c\x56\x71\x48\x82\x05\x27\x55\x66\x59\x4e\x65\x1d\x98\x75\xa3\x61\x46\x7d\x61\x3f\x15\x41\x00\x9f\x14\x06\xd7\xb4\x34\x4d\xce\x13\x87\x46\xb0\x1a\xd5\x05\x1c\xb8\x8a\x27\x7b\x8b\xdc\x2b\xbb\x4d\x67\x30\xc8\xd1\xf6\x5c\x8f\x50\xfa\x5b\x2f\x46\x9b\x6e\x35\x18\x2f\x27\x43\x2e\xeb\x0a\x0c\x5e\x10\x05\x10\xa5\x73\x1b\x65\x34\xe5\x6c\x2e\x6a\x43\x27\x63\x14\x23\x55\xa9\x3f\x71\x7b\x67\x43\x7d\x3a\xaf\xcd\xe2\x54\x55\x9c\xfd\x4b\xc6\xe2\x9f\x2f\x28\xed\xcb\x5c\xc6\x2d\x66\x07\x88\xa7\x3b\x2f\x18\x2a\x22\x4e\x0e\xb0\x6b\x2e\xdd\x0d\x95\x7d\x7d\x47\xba\x43\xb2\x11\xb2\x2b\x3e\x4d\xaa\x3e\x7d\xe6\xce\x49\x89\xc6\xe6\x78\x0c\x61\x31\x05\x2d\x01\xa4\x4f\xa5\x7e\x71\x20\x88\xec\x0d\x31\xe8\x4e\x0b\x00\x6e\x50\x68\x7d\x17\x3d\x08\x0d\x17\x95\xa6\x6e\xa3\x68\x97\x24\x5b\x6b\xf3\x17\x23\xf3\xb6\x73\xb3\x0d\x0b\x40\xc0\x9f\xd8\x04\x51\x5d\xfa\x1a\x17\x22\x2e\x15\x6a\xdf\x49\x00\xb9\xa0\x77\x55\xc6\xef\x10\x6a\xbf\x7b\x47\x4c\x7f\x83\x17\x05\xee\xdc\xdc\x46\x85\xa9\xad\x53\x07\x2b\x53\x34\x06\x07\xff\x14\x94\x59\x19\x02\xe4\x38\xe8\x31\x83\x4e\xb9\x58\x46\x6b\xcb\x2d\x23\x86\x92\x70\x00\x35\x88\x22\xcf\x31\xb2\x26\x2f\xe7\xc3\x75\x2d\x36\x2c\x72\x74\xb0\x23\x47\xb7\xd3\xd1\x26\x16\x85\x37\x72\xe2\x00\x8c\x44\xcf\x10\xda\x33\x2d\x1a\xde\x60\x86\x69\x23\x69\x2a\x7c\xcd\x4b\x51\x0d\x95\x54\x39\x77\x2e\x29\xea\x1b\xa6\x50\xa2\x6a\x8f\x6f\x50\x99\x5c\x3e\x54\xfb\xef\x50\x5b\x0b\x07\x45\x17\x89\x6d\x28\x13\x77\x37\x1d\xdb\x8e\x1e\x4a\x05\x66\x4a\x6f\x99\x20\xe5\x70\xe2\xb9\x71\x7e\x0c\x6d\x49\x04\x2d\x7a\xfe\x72\xc7\xf2\x59\x30\x8f\xbb\x02\x5d\x73\xe5\xc9\x20\xea\x78\xec\x20\x90\xf0\x8a\x7f\x42\x17\x7c\x47\x19\x60\xb0\x16\xbd\x26\xb7\x71\xb6\xc7\x9f\x0e\xd1\x33\x82\x3d\xd3\xab\xee\x63\x99\xc8\x2b\x53\xa0\x44\x5c\x71\x01\xc6\xcc\x44\x1f\x32\x4f\x3c\xca\xc0\x29\x3d\x52\xd3\x61\x19\x58\xa9\x7d\x65\xb4\xdc\xcf\x0d\xf4\x3d\xf1\x08\xa9\x42\xda\x23\x09\xd8\xbf\x5e\x50\x49\xf8\x4d\xc0\xcb\x47\x4c\x1c\x4f\xf7\x7b\x2b\xd8\x16\x18\xc5\x31\x92\x3b\xb5\x6f\xdc\x6c\x0d\x92\x88\x16\xd1\x9e\xdb\x3f\xe2\xe9\xda\x5f\xd4\x84\xe2\x46\x61\x5a\xde\x1c\x55\xcf\xa4\x00\xbe\xfd\xce\x67\xf1\x4a\x69\x1c\x97\xe6\x20\x48\xd8\x5d\x7f\x7e\xae\x71\x20\x0e\x4e\xae\xc0\x56\xa9\x91\x01\x3c\x82\x1d\x0f\x72\xe7\x76\xec\x29\x49\xd6\x5d\x2d\x83\xe3\xdb\x36\x06\xa9\x3b\x66\x13\x97\x87\x6a\xd5\xb6\x3d\x50\x5e\x52\xb9\x4b\xc7\x73\x57\x78\xc9\xf4\x2e\x59\x07\x95\x93\x6f\xd0\x4b\x17\x57\x19\x3e\x27\x27\xc7\x60\xdb\x3b\xed\x9a\x0e\x53\x44\x16\x3e\x3f\x8d\x92\x6d\x77\xa2\x0a\xeb\x3f\x52\xa8\xc6\x55\x5e\x31\x49\x37\x85\xf4\xc5\x1f\x26\x2d\xa9\x1c\xbf\x8b\x27\x54\xda\xc3\x6a\x20\xe5\x2a\x78\x04\xb0\xd6\x90\x70\x72\xaa\x8b\x68\xbd\x88\xf7\x02\x5f\x48\xb1\x7e\xc0\x58\x4c\x3f\x66\x1a\xf9\x3e\xe1\x65\xc0\x70\xa7\xcf\x38\x69\xaf\xf0\x56\x6c\x64\x49\x9c\x27\xad\x78\x74\x4f\xc2\x87\xde\x56\x39\x00\xda\x77\x0b\xcb\x2d\x1b\x89\xfb\x35\x4f\x02\xf5\x08\x51\x13\x60\xc1\x0a\x5a\x47\x4d\x26\x1c\x33\x30\x78\xda\xc0\x9c\x46\x47\xe2\x5b\x79\x60\x49\x6e\x37\x67\x53\x0a\x3e\xe9\xec\x46\x39\xb2\xf1\x34\x0d\xc6\x84\x53\x75\x6e\xe1\x0c\x59\xd9\x1e\xde\x29\x85\x10\x7b\x49\x49\xa5\x77\x79\xbe\x49\x56\x2e\x36\xe7\x0b\x3a\xbb\x4f\x03\x62\x7b\xd2\x4d\x31\x95\x2f\xbd\x38\x7b\xa8\x4f\x21\xe1\xec\x46\x70\x76\x95\x7d\x29\x22\x78\x88\x0a\x90\xdd\x9d\x5c\xda\xde\x19\x51\xcf\xf0\xfc\x59\x52\x65\x7c\x33\x13\xdf\xf3\x48\xda\xbb\x2a\x75\xdb\x60\xb2\x02\x15\xd4\xfc\x19\xed\x1b\xec\x7f\x35\xa8\xff\x28\x31\x07\x2d\x12\xc8\xdc\x88\x46\x7c\x8a\x5b\x22";
    var keyBuffer;

    /**
     * Decodes data that is received from the Google Earth Enterprise server.
     *
     * @param {ArrayBuffer} data The data to be decoded.
     *
     * @private
     */
    GoogleEarthEnterpriseMetadata.decode = function(data) {
        if (!defined(data)) {
            throw new DeveloperError('data is required.');
        }

        var keylen = key.length;
        if (!defined(keyBuffer)) {
            keyBuffer = new ArrayBuffer(keylen);
            var ui8 = new Uint8Array(keyBuffer);
            for (var i = 0; i < keylen; ++i) {
                ui8[i] = key.charCodeAt(i);
            }
        }

        var dataView = new DataView(data);
        var magic = dataView.getUint32(0, true);
        if (magic === compressedMagic || magic === compressedMagicSwap) {
            // Occasionally packets don't come back encoded, so just return
            return data;
        }

        var keyView = new DataView(keyBuffer);

        var dp = 0;
        var dpend = data.byteLength;
        var dpend64 = dpend - (dpend % 8);
        var kpend = keylen;
        var kp;
        var off = 8;

        // This algorithm is intentionally asymmetric to make it more difficult to
        // guess. Security through obscurity. :-(

        // while we have a full uint64 (8 bytes) left to do
        // assumes buffer is 64bit aligned (or processor doesn't care)
        while (dp < dpend64) {
            // rotate the key each time through by using the offets 16,0,8,16,0,8,...
            off = (off + 8) % 24;
            kp = off;

            // run through one key length xor'ing one uint64 at a time
            // then drop out to rotate the key for the next bit
            while ((dp < dpend64) && (kp < kpend)) {
                dataView.setUint32(dp, dataView.getUint32(dp, true) ^ keyView.getUint32(kp, true), true);
                dataView.setUint32(dp + 4, dataView.getUint32(dp + 4, true) ^ keyView.getUint32(kp + 4, true), true);
                dp += 8;
                kp += 24;
            }
        }

        // now the remaining 1 to 7 bytes
        if (dp < dpend) {
            if (kp >= kpend) {
                // rotate the key one last time (if necessary)
                off = (off + 8) % 24;
                kp = off;
            }

            while (dp < dpend) {
                dataView.setUint8(dp, dataView.getUint8(dp) ^ keyView.getUint8(kp));
                dp++;
                kp++;
            }
        }
    };

    var taskProcessor = new TaskProcessor('decodeGoogleEarthEnterprisePacket', Number.POSITIVE_INFINITY);

    /**
     * Retrieves a Google Earth Enterprise quadtree packet.
     *
     * @param {String} [quadKey=''] The quadkey to retrieve the packet for.
     * @param {Number} [version=1] The cnode version to be used in the request.
     * @param {Boolean} [throttle=true] True if the number of simultaneous requests should be limited,
     *                  or false if the request should be initiated regardless of the number of requests
     *                  already in progress.
     *
     * @private
     */
    GoogleEarthEnterpriseMetadata.prototype.getQuadTreePacket = function(quadKey, version, throttle) {
        version = defaultValue(version, 1);
        quadKey = defaultValue(quadKey, '');
        throttle = defaultValue(throttle, true);
        var url = getMetadataUrl(this, quadKey, version);
        var proxy = this._proxy;
        if (defined(proxy)) {
            url = proxy.getURL(url);
        }

        var promise;
        if (throttle) {
            promise = throttleRequestByServer(url, loadArrayBuffer);
            if (!defined(promise)) {
                return undefined;
            }
        } else {
            promise = loadArrayBuffer(url);
        }

        var tileInfo = this._tileInfo;
        return promise
            .then(function(metadata) {
                var decodePromise = taskProcessor.scheduleTask({
                    buffer : metadata,
                    quadKey : quadKey,
                    type : 'Metadata'
                }, [metadata]);

                return decodePromise
                    .then(function(result) {
                        var root;
                        var topLevelKeyLength = -1;
                        if (quadKey !== '') {
                            // Root tile has no data except children bits, so put them into the tile info
                            topLevelKeyLength = quadKey.length + 1;
                            var top = result[quadKey];
                            root = tileInfo[quadKey];
                            root._bits |= top._bits;

                            delete result[quadKey];
                        }

                        // Copy the resulting objects into tileInfo
                        // Make sure we start with shorter quadkeys first, so we know the parents have
                        //  already been processed. Otherwise we can lose ancestorHasTerrain along the way.
                        var keys = Object.keys(result);
                        keys.sort(function(a, b) {
                            return a.length - b.length;
                        });
                        var keysLength = keys.length;
                        for (var i = 0; i < keysLength; ++i) {
                            var key = keys[i];
                            var r = result[key];
                            if (r !== null) {
                                var info = TileInformation.clone(result[key]);
                                var keyLength = key.length;
                                if (keyLength === topLevelKeyLength) {
                                    info.setParent(root);
                                } else if(keyLength > 1){
                                    var parent = tileInfo[key.substring(0, key.length - 1)];
                                    info.setParent(parent);
                                }
                                tileInfo[key] = info;
                            } else {
                                tileInfo[key] = null;
                            }
                        }
                    });
            });
    };

    /**
     * Populates the metadata subtree down to the specified tile.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @param {Boolean} [throttle=true] True if the number of simultaneous requests should be limited,
     *                  or false if the request should be initiated regardless of the number of requests
     *                  already in progress.
     *
     * @returns {Promise<GoogleEarthEnterpriseMetadata.TileInformation>} A promise that resolves to the tile info for the requested quad key
     *
     * @private
     */
    GoogleEarthEnterpriseMetadata.prototype.populateSubtree = function(x, y, level, throttle) {
        throttle = defaultValue(throttle, true);
        var quadkey = GoogleEarthEnterpriseMetadata.tileXYToQuadKey(x, y, level);
        return populateSubtree(this, quadkey, throttle);
    };

    function populateSubtree(that, quadKey, throttle) {
        var tileInfo = that._tileInfo;
        var q = quadKey;
        var t = tileInfo[q];
        // If we have tileInfo make sure sure it is not a node with a subtree that's not loaded
        if (defined(t) && (!t.hasSubtree() || t.hasChildren())) {
            return t;
        }

        while ((t === undefined) && q.length > 1) {
            q = q.substring(0, q.length - 1);
            t = tileInfo[q];
        }

        var subtreePromises = that._subtreePromises;
        var promise = subtreePromises[q];
        if (defined(promise)) {
            return promise
                .then(function() {
                    // Recursively call this incase we need multiple subtree requests
                    return populateSubtree(that, quadKey, throttle);
                });
        }

        // t is either
        //   null so one of its parents was a leaf node, so this tile doesn't exist
        //   exists but doesn't have a subtree to request
        //   undefined so no parent exists - this shouldn't ever happen once the provider is ready
        if (!defined(t) || !t.hasSubtree()) {
            return when.reject(new RuntimeError('Couldn\'t load metadata for tile ' + quadKey));
        }

        // We need to split up the promise here because when will execute syncronously if getQuadTreePacket
        //  is already resolved (like in the tests), so subtreePromises will never get cleared out.
        //  Only the initial request will also remove the promise from subtreePromises.
        promise = that.getQuadTreePacket(q, t.cnodeVersion, throttle);
        if (!defined(promise)) {
            return undefined;
        }
        subtreePromises[q] = promise;

        return promise
            .then(function() {
                // Recursively call this incase we need multiple subtree requests
                return populateSubtree(that, quadKey, throttle);
            })
            .always(function() {
                delete subtreePromises[q];
            });
    }

    /**
     * Gets information about a tile
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @returns {GoogleEarthEnterpriseMetadata.TileInformation|undefined} Information about the tile or undefined if it isn't loaded.
     *
     * @private
     */
    GoogleEarthEnterpriseMetadata.prototype.getTileInformation = function(x, y, level) {
        var quadkey = GoogleEarthEnterpriseMetadata.tileXYToQuadKey(x, y, level);
        return this._tileInfo[quadkey];
    };

    /**
     * Gets information about a tile from a quadKey
     *
     * @param {String} quadkey The quadkey for the tile
     * @returns {GoogleEarthEnterpriseMetadata.TileInformation|undefined} Information about the tile or undefined if it isn't loaded.
     *
     * @private
     */
    GoogleEarthEnterpriseMetadata.prototype.getTileInformationFromQuadKey = function(quadkey) {
        return this._tileInfo[quadkey];
    };

    function getMetadataUrl(that, quadKey, version) {
        return that._url + 'flatfile?q2-0' + quadKey + '-q.' + version.toString();
    }

    return GoogleEarthEnterpriseMetadata;
});

/*global define*/
define('Core/formatError',[
        './defined'
    ], function(
        defined) {
    'use strict';

    /**
     * Formats an error object into a String.  If available, uses name, message, and stack
     * properties, otherwise, falls back on toString().
     *
     * @exports formatError
     *
     * @param {Object} object The item to find in the array.
     * @returns {String} A string containing the formatted error.
     */
    function formatError(object) {
        var result;

        var name = object.name;
        var message = object.message;
        if (defined(name) && defined(message)) {
            result = name + ': ' + message;
        } else {
            result = object.toString();
        }

        var stack = object.stack;
        if (defined(stack)) {
            result += '\n' + stack;
        }

        return result;
    }

    return formatError;
});

/*global define*/
define('Workers/createTaskProcessorWorker',[
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/formatError'
    ], function(
        defaultValue,
        defined,
        formatError) {
    'use strict';

    /**
     * Creates an adapter function to allow a calculation function to operate as a Web Worker,
     * paired with TaskProcessor, to receive tasks and return results.
     *
     * @exports createTaskProcessorWorker
     *
     * @param {createTaskProcessorWorker~WorkerFunction} workerFunction The calculation function,
     *        which takes parameters and returns a result.
     * @returns {createTaskProcessorWorker~TaskProcessorWorkerFunction} A function that adapts the
     *          calculation function to work as a Web Worker onmessage listener with TaskProcessor.
     *
     *
     * @example
     * function doCalculation(parameters, transferableObjects) {
     *   // calculate some result using the inputs in parameters
     *   return result;
     * }
     *
     * return Cesium.createTaskProcessorWorker(doCalculation);
     * // the resulting function is compatible with TaskProcessor
     * 
     * @see TaskProcessor
     * @see {@link http://www.w3.org/TR/workers/|Web Workers}
     * @see {@link http://www.w3.org/TR/html5/common-dom-interfaces.html#transferable-objects|Transferable objects}
     */
    function createTaskProcessorWorker(workerFunction) {
        var postMessage;
        var transferableObjects = [];
        var responseMessage = {
            id : undefined,
            result : undefined,
            error : undefined
        };

        return function(event) {
            /*global self*/
            var data = event.data;

            transferableObjects.length = 0;
            responseMessage.id = data.id;
            responseMessage.error = undefined;
            responseMessage.result = undefined;

            try {
                responseMessage.result = workerFunction(data.parameters, transferableObjects);
            } catch (e) {
                if (e instanceof Error) {
                    // Errors can't be posted in a message, copy the properties
                    responseMessage.error = {
                        name : e.name,
                        message : e.message,
                        stack : e.stack
                    };
                } else {
                    responseMessage.error = e;
                }
            }

            if (!defined(postMessage)) {
                postMessage = defaultValue(self.webkitPostMessage, self.postMessage);
            }

            if (!data.canTransferArrayBuffer) {
                transferableObjects.length = 0;
            }

            try {
                postMessage(responseMessage, transferableObjects);
            } catch (e) {
                // something went wrong trying to post the message, post a simpler
                // error that we can be sure will be cloneable
                responseMessage.result = undefined;
                responseMessage.error = 'postMessage failed with error: ' + formatError(e) + '\n  with responseMessage: ' + JSON.stringify(responseMessage);
                postMessage(responseMessage);
            }
        };
    }

    /**
     * A function that performs a calculation in a Web Worker.
     * @callback createTaskProcessorWorker~WorkerFunction
     *
     * @param {Object} parameters Parameters to the calculation.
     * @param {Array} transferableObjects An array that should be filled with references to objects inside
     *        the result that should be transferred back to the main document instead of copied.
     * @returns {Object} The result of the calculation.
     *
     * @example
     * function calculate(parameters, transferableObjects) {
     *   // perform whatever calculation is necessary.
     *   var typedArray = new Float32Array(0);
     *
     *   // typed arrays are transferable
     *   transferableObjects.push(typedArray)
     *
     *   return {
     *      typedArray : typedArray
     *   };
     * }
     */

    /**
     * A Web Worker message event handler function that handles the interaction with TaskProcessor,
     * specifically, task ID management and posting a response message containing the result.
     * @callback createTaskProcessorWorker~TaskProcessorWorkerFunction
     *
     * @param {Object} event The onmessage event object.
     */

    return createTaskProcessorWorker;
});

/*global define*/
define('Workers/decodeGoogleEarthEnterprisePacket',[
    '../Core/RuntimeError',
    '../Core/GoogleEarthEnterpriseMetadata',
    './createTaskProcessorWorker',
    '../ThirdParty/pako_inflate'
], function(
    RuntimeError,
    GoogleEarthEnterpriseMetadata,
    createTaskProcessorWorker,
    pako) {
    'use strict';

    // Datatype sizes
    var sizeOfUint16 = Uint16Array.BYTES_PER_ELEMENT;
    var sizeOfInt32 = Int32Array.BYTES_PER_ELEMENT;
    var sizeOfUint32 = Uint32Array.BYTES_PER_ELEMENT;

    var Types = {
        METADATA : 0,
        TERRAIN : 1
    };

    Types.fromString = function(s) {
        if (s === 'Metadata') {
            return Types.METADATA;
        } else if (s === 'Terrain') {
            return Types.TERRAIN;
        }
    };

    function decodeGoogleEarthEnterpriseTerrainPacket(parameters, transferableObjects) {
        var type = Types.fromString(parameters.type);
        var buffer = parameters.buffer;
        GoogleEarthEnterpriseMetadata.decode(buffer);

        var uncompressedTerrain = uncompressPacket(buffer);
        buffer = uncompressedTerrain.buffer;
        var length = uncompressedTerrain.length;

        switch (type) {
            case Types.METADATA:
                return processMetadata(buffer, length, parameters.quadKey);
            case Types.TERRAIN:
                return processTerrain(buffer, length, transferableObjects);
        }

    }

    var qtMagic = 32301;

    function processMetadata(buffer, totalSize, quadKey) {
        var dv = new DataView(buffer);
        var offset = 0;
        var magic = dv.getUint32(offset, true);
        offset += sizeOfUint32;
        if (magic !== qtMagic) {
            throw new RuntimeError('Invalid magic');
        }

        var dataTypeId = dv.getUint32(offset, true);
        offset += sizeOfUint32;
        if (dataTypeId !== 1) {
            throw new RuntimeError('Invalid data type. Must be 1 for QuadTreePacket');
        }

        // Tile format version
        var quadVersion = dv.getUint32(offset, true);
        offset += sizeOfUint32;
        if (quadVersion !== 2) {
            throw new RuntimeError('Invalid QuadTreePacket version. Only version 2 is supported.');
        }

        var numInstances = dv.getInt32(offset, true);
        offset += sizeOfInt32;

        var dataInstanceSize = dv.getInt32(offset, true);
        offset += sizeOfInt32;
        if (dataInstanceSize !== 32) {
            throw new RuntimeError('Invalid instance size.');
        }

        var dataBufferOffset = dv.getInt32(offset, true);
        offset += sizeOfInt32;

        var dataBufferSize = dv.getInt32(offset, true);
        offset += sizeOfInt32;

        var metaBufferSize = dv.getInt32(offset, true);
        offset += sizeOfInt32;

        // Offset from beginning of packet (instances + current offset)
        if (dataBufferOffset !== (numInstances * dataInstanceSize + offset)) {
            throw new RuntimeError('Invalid dataBufferOffset');
        }

        // Verify the packets is all there header + instances + dataBuffer + metaBuffer
        if (dataBufferOffset + dataBufferSize + metaBufferSize !== totalSize) {
            throw new RuntimeError('Invalid packet offsets');
        }

        // Read all the instances
        var instances = [];
        for (var i = 0; i < numInstances; ++i) {
            var bitfield = dv.getUint8(offset);
            ++offset;

            ++offset; // 2 byte align

            var cnodeVersion = dv.getUint16(offset, true);
            offset += sizeOfUint16;

            var imageVersion = dv.getUint16(offset, true);
            offset += sizeOfUint16;

            var terrainVersion = dv.getUint16(offset, true);
            offset += sizeOfUint16;

            // Number of channels stored in the dataBuffer
            offset += sizeOfUint16;

            offset += sizeOfUint16; // 4 byte align

            // Channel type offset into dataBuffer
            offset += sizeOfInt32;

            // Channel version offset into dataBuffer
            offset += sizeOfInt32;

            offset += 8; // Ignore image neighbors for now

            // Data providers aren't used
            ++offset; // Image provider
            ++offset; // Terrain provider
            offset += sizeOfUint16; // 4 byte align

            instances.push(new GoogleEarthEnterpriseMetadata.TileInformation(bitfield, cnodeVersion,
                imageVersion, terrainVersion));
        }

        var tileInfo = [];
        var index = 0;

        function populateTiles(parentKey, parent, level) {
            var isLeaf = false;
            if (level === 4) {
                if (parent.hasSubtree()) {
                    return; // We have a subtree, so just return
                }

                isLeaf = true; // No subtree, so set all children to null
            }
            for (var i = 0; i < 4; ++i) {
                var childKey = parentKey + i.toString();
                if (isLeaf) {
                    // No subtree so set all children to null
                    tileInfo[childKey] = null;
                } else if (level < 4) {
                    // We are still in the middle of the subtree, so add child
                    //  only if their bits are set, otherwise set child to null.
                    if (!parent.hasChild(i)) {
                        tileInfo[childKey] = null;
                    } else {
                        if (index === numInstances) {
                            console.log('Incorrect number of instances');
                            return;
                        }

                        var instance = instances[index++];
                        tileInfo[childKey] = instance;
                        populateTiles(childKey, instance, level + 1);
                    }
                }
            }
        }

        var level = 0;
        var root = instances[index++];
        if (quadKey === '') {
            // Root tile has data at its root and one less level
            ++level;
        } else {
            tileInfo[quadKey] = root; // This will only contain the child bitmask
        }

        populateTiles(quadKey, root, level);

        return tileInfo;
    }

    function processTerrain(buffer, totalSize, transferableObjects) {
        var dv = new DataView(buffer);

        var offset = 0;
        var terrainTiles = [];
        while (offset < totalSize) {
            // Each tile is split into 4 parts
            var tileStart = offset;
            for (var quad = 0; quad < 4; ++quad) {
                var size = dv.getUint32(offset, true);
                offset += sizeOfUint32;
                offset += size;
            }
            var tile = buffer.slice(tileStart, offset);
            transferableObjects.push(tile);
            terrainTiles.push(tile);
        }

        return terrainTiles;
    }

    var compressedMagic = 0x7468dead;
    var compressedMagicSwap = 0xadde6874;

    function uncompressPacket(data) {
        // The layout of this decoded data is
        // Magic Uint32
        // Size Uint32
        // [GZipped chunk of Size bytes]

        // Pullout magic and verify we have the correct data
        var dv = new DataView(data);
        var offset = 0;
        var magic = dv.getUint32(offset, true);
        offset += sizeOfUint32;
        if (magic !== compressedMagic && magic !== compressedMagicSwap) {
            throw new RuntimeError('Invalid magic');
        }

        // Get the size of the compressed buffer - the endianness depends on which magic was used
        var size = dv.getUint32(offset, (magic === compressedMagic));
        offset += sizeOfUint32;

        var compressedPacket = new Uint8Array(data, offset);
        var uncompressedPacket = pako.inflate(compressedPacket);

        if (uncompressedPacket.length !== size) {
            throw new RuntimeError('Size of packet doesn\'t match header');
        }

        return uncompressedPacket;
    }

    return createTaskProcessorWorker(decodeGoogleEarthEnterpriseTerrainPacket);
});

}());