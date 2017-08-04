/**
 * @file tgajs - Javascript decoder & (experimental) encoder for TGA files
 * @desc tgajs is a fork from https://github.com/vthibault/jsTGALoader
 * @author Vincent Thibault (Original author)
 * @author Lukas Schmitt
 * @version 1.0.0
 */

/* Copyright (c) 2013, Vincent Thibault. All rights reserved.

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

(function (_global) {
  'use strict';

  /**
   * @var {object} TGA type constants
   */
  Targa.Type = {
    NO_DATA: 0,
    INDEXED: 1,
    RGB: 2,
    GREY: 3,
    RLE_INDEXED: 9,
    RLE_RGB: 10,
    RLE_GREY: 11
  };

  /**
   * @var {object} TGA origin constants
   */
  Targa.Origin = {
    BOTTOM_LEFT: 0x00,
    BOTTOM_RIGHT: 0x01,
    TOP_LEFT: 0x02,
    TOP_RIGHT: 0x03,
    SHIFT: 0x04,
    MASK: 0x30,
    ALPHA: 0x08
  };

  Targa.HEADER_SIZE = 18;
  Targa.FOOTER_SIZE = 26;
  Targa.LITTLE_ENDIAN = true;
  Targa.RLE_BIT = 0x80;
  Targa.RLE_MASK = 0x7f;
  Targa.RLE_PACKET = 1;
  Targa.RAW_PACKET = 2;
  Targa.SIGNATURE = "TRUEVISION-XFILE.\0";

  /**
   * TGA Namespace
   * @constructor
   */
  function Targa() {
    if (arguments.length == 1) {
      var h = arguments[0];

      this.header = createHeader(h);
      setHeaderBooleans(this.header);
      checkHeader(this.header);
    }
  }

  /**
   * Sets header or default values
   * @param header header
   * @returns {Object}
   */
  function createHeader(header) {
    return {
      /* 0x00  BYTE */  idLength: defaultFor(header.idLength, 0),
      /* 0x01  BYTE */  colorMapType: defaultFor(header.colorMapType, 0),
      /* 0x02  BYTE */  imageType: defaultFor(header.imageType, Targa.Type.RGB),
      /* 0x03  WORD */  colorMapIndex: defaultFor(header.colorMapIndex, 0),
      /* 0x05  WORD */  colorMapLength: defaultFor(header.colorMapLength, 0),
      /* 0x07  BYTE */  colorMapDepth: defaultFor(header.colorMapDepth, 0),
      /* 0x08  WORD */  offsetX: defaultFor(header.offsetX, 0),
      /* 0x0a  WORD */  offsetY: defaultFor(header.offsetY, 0),
      /* 0x0c  WORD */  width: defaultFor(header.width, 0),
      /* 0x0e  WORD */  height: defaultFor(header.height, 0),
      /* 0x10  BYTE */  pixelDepth: defaultFor(header.pixelDepth,32),
      /* 0x11  BYTE */  flags: defaultFor(header.flags, 8)
    };
  }

  function defaultFor(arg, val) { return typeof arg !== 'undefined' ? arg : val; }

  /**
   * Write footer of TGA file to view
   * Byte 0-3 - Extension Area Offset, 0 if no Extension Area exists
   * Byte 4-7 - Developer Directory Offset, 0 if no Developer Area exists
   * Byte 8-25 - Signature
   * @param {Uint8Array} footer
   */
  function writeFooter(footer) {
    var signature = Targa.SIGNATURE;
    var offset = footer.byteLength - signature.length;
    for (var i = 0; i < signature.length; i++) {
      footer[offset + i] = signature.charCodeAt(i);
    }
  }

  /**
   * Write header of TGA file to view
   * @param header
   * @param view DataView
   */
  function writeHeader(header, view) {
    var littleEndian = Targa.LITTLE_ENDIAN;

    view.setUint8(0x00, header.idLength);
    view.setUint8(0x01, header.colorMapType);
    view.setUint8(0x02, header.imageType);
    view.setUint16(0x03, header.colorMapIndex, littleEndian);
    view.setUint16(0x05, header.colorMapLength, littleEndian);
    view.setUint8(0x07, header.colorMapDepth);
    view.setUint16(0x08, header.offsetX, littleEndian);
    view.setUint16(0x0a, header.offsetY, littleEndian);
    view.setUint16(0x0c, header.width, littleEndian);
    view.setUint16(0x0e, header.height, littleEndian);
    view.setUint8(0x10, header.pixelDepth);
    view.setUint8(0x11, header.flags);
  }

  function readHeader(view) {
    var littleEndian = Targa.LITTLE_ENDIAN;

    // Not enough data to contain header ?
    if (view.byteLength  < 0x12) {
      throw new Error('Targa::load() - Not enough data to contain header');
    }

    var header = {};
    header.idLength = view.getUint8(0x00);
    header.colorMapType = view.getUint8(0x01);
    header.imageType =  view.getUint8(0x02);
    header.colorMapIndex = view.getUint16(0x03, littleEndian);
    header.colorMapLength = view.getUint16(0x05, littleEndian);
    header.colorMapDepth = view.getUint8(0x07);
    header.offsetX = view.getUint16(0x08, littleEndian);
    header.offsetY = view.getUint16(0x0a, littleEndian);
    header.width = view.getUint16(0x0c, littleEndian);
    header.height = view.getUint16(0x0e, littleEndian);
    header.pixelDepth = view.getUint8(0x10);
    header.flags = view.getUint8(0x11);

    return header;
  }

  /**
   * Set additional header booleans
   * @param header
   */
  function setHeaderBooleans(header) {
    header.hasEncoding = (header.imageType === Targa.Type.RLE_INDEXED || header.imageType === Targa.Type.RLE_RGB || header.imageType === Targa.Type.RLE_GREY);
    header.hasColorMap = (header.imageType === Targa.Type.RLE_INDEXED || header.imageType === Targa.Type.INDEXED);
    header.isGreyColor = (header.imageType === Targa.Type.RLE_GREY || header.imageType === Targa.Type.GREY);
    header.bytePerPixel = header.pixelDepth >> 3;
    header.origin = (header.flags & Targa.Origin.MASK) >> Targa.Origin.SHIFT;
    header.alphaBits = header.flags & Targa.Origin.ALPHA;
  }

  /**
   * Check the header of TGA file to detect errors
   *
   * @param {object} header tga header structure
   * @throws Error
   */
  function checkHeader(header) {
    // What the need of a file without data ?
    if (header.imageType === Targa.Type.NO_DATA) {
      throw new Error('Targa::checkHeader() - No data');
    }

    // Indexed type
    if (header.hasColorMap) {
      if (header.colorMapLength > 256 || header.colorMapType !== 1) {
        throw new Error('Targa::checkHeader() - Unsupported colormap for indexed type');
      }
      if (header.colorMapDepth !== 16 && header.colorMapDepth !== 24  && header.colorMapDepth !== 32) {
        throw new Error('Targa::checkHeader() - Unsupported colormap depth');
      }
    }
    else {
      if (header.colorMapType) {
        throw new Error('Targa::checkHeader() - Why does the image contain a palette ?');
      }
    }

    // Check image size
    if (header.width <= 0 || header.height <= 0) {
      throw new Error('Targa::checkHeader() - Invalid image size');
    }

    // Check pixel size
    if (header.pixelDepth !== 8 &&
      header.pixelDepth !== 16 &&
      header.pixelDepth !== 24 &&
      header.pixelDepth !== 32) {
      throw new Error('Targa::checkHeader() - Invalid pixel size "' + header.pixelDepth + '"');
    }

    // Check alpha size
    if (header.alphaBits !== 0 &&
        header.alphaBits !== 1 &&
        header.alphaBits !== 8) {
      throw new Error('Targa::checkHeader() - Unsuppported alpha size');
    }
  }


  /**
   * Decode RLE compression
   *
   * @param {Uint8Array} data
   * @param {number} bytesPerPixel bytes per Pixel
   * @param {number} outputSize in byte: width * height * pixelSize
   */
  function decodeRLE(data, bytesPerPixel, outputSize) {
    var pos, c, count, i, offset;
    var pixels, output;

    output = new Uint8Array(outputSize);
    pixels = new Uint8Array(bytesPerPixel);
    offset = 0; // offset in data
    pos = 0; // offset for output

    while (pos < outputSize) {
      c = data[offset++]; // current byte to check
      count = (c & Targa.RLE_MASK) + 1; // repetition count of pixels, the lower 7 bits + 1

      // RLE packet, if highest bit is set to 1.
      if (c & Targa.RLE_BIT) {
        // Copy pixel values to be repeated to tmp array
        for (i = 0; i < bytesPerPixel; ++i) {
          pixels[i] = data[offset++];
        }

        // Copy pixel values * count to output
        for (i = 0; i < count; ++i) {
          output.set(pixels, pos);
          pos += bytesPerPixel;
        }
      }

      // Raw packet (Non-Run-Length Encoded)
      else {
        count *= bytesPerPixel;
        for (i = 0; i < count; ++i) {
          output[pos++] = data[offset++];
        }
      }
    }

    if (pos > outputSize) {
      throw new Error("Targa::decodeRLE() - Read bytes: " + pos + " Expected bytes: " + outputSize);
    }

    return output;
  }

  /**
   * Encode ImageData object with RLE compression
   *
   * @param header
   * @param imageData from canvas to compress
   */
  function encodeRLE(header, imageData) {
    var maxRepetitionCount = 128;
    var i;
    var data = imageData;
    var output = []; // output size is unknown
    var pos = 0; // pos in imageData array
    var bytesPerPixel = header.pixelDepth >> 3;
    var offset = 0;
    var packetType, packetLength, packetHeader;
    var tgaLength = header.width * header.height * bytesPerPixel;
    var isSamePixel = function isSamePixel(pos, offset) {
      for (var i = 0; i < bytesPerPixel; i++) {
        if (data[pos * bytesPerPixel + i] !== data[offset * bytesPerPixel + i]) {
          return false;
        }
      }
      return true;
    };
    var getPacketType = function(pos) {
      if (isSamePixel(pos, pos + 1)) {
        return Targa.RLE_PACKET;
      }
      return Targa.RAW_PACKET;
    };

    while (pos * bytesPerPixel < data.length && pos * bytesPerPixel < tgaLength) {
      // determine packet type
      packetType = getPacketType(pos);

      // determine packet length
      packetLength = 0;
      if (packetType === Targa.RLE_PACKET) {
        while (pos + packetLength < data.length
        && packetLength < maxRepetitionCount
        && isSamePixel(pos, pos + packetLength)) {
          packetLength++;
        }
      } else { // packetType === Targa.RAW_PACKET
        while (pos + packetLength < data.length
        && packetLength < maxRepetitionCount
        && getPacketType(pos + packetLength) === Targa.RAW_PACKET) {
          packetLength++;
        }
      }

      // write packet header
      packetHeader = packetLength - 1;
      if (packetType === Targa.RLE_PACKET) {
        packetHeader |= Targa.RLE_BIT;
      }
      output[offset++] = packetHeader;

      // write rle packet pixel OR raw pixels
      if (packetType === Targa.RLE_PACKET) {
        for (i = 0; i < bytesPerPixel; i++) {
          output[i + offset] = data[i + pos * bytesPerPixel];
        }
        offset += bytesPerPixel;
      } else {
        for (i = 0; i < bytesPerPixel * packetLength; i++) {
          output[i + offset] = data[i + pos * bytesPerPixel];
        }
        offset += bytesPerPixel * packetLength;
      }
      pos += packetLength;
    }

    return new Uint8Array(output);
  }


  /**
   * Return a ImageData object from a TGA file (8bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} indexes - index to colorMap
   * @param {Array} colorMap
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   */
  function getImageData8bits(imageData, indexes, colorMap, width, y_start, y_step, y_end, x_start, x_step, x_end) {
    var color, index, offset, i, x, y;
    var bytePerPixel = this.header.colorMapDepth >> 3;

    for (i = 0, y = y_start; y !== y_end; y += y_step) {
      for (x = x_start; x !== x_end; x += x_step, i++) {
        offset = (x + width * y) * 4;
        index = indexes[i] * bytePerPixel;
        if (bytePerPixel === 4) {
          imageData[offset    ] = colorMap[index + 2]; // red
          imageData[offset + 1] = colorMap[index + 1]; // green
          imageData[offset + 2] = colorMap[index    ]; // blue
          imageData[offset + 3] = colorMap[index + 3]; // alpha
        } else if (bytePerPixel === 3) {
          imageData[offset    ] = colorMap[index + 2]; // red
          imageData[offset + 1] = colorMap[index + 1]; // green
          imageData[offset + 2] = colorMap[index    ]; // blue
          imageData[offset + 3] = 255; // alpha
        } else if (bytePerPixel === 2) {
          color = colorMap[index] | (colorMap[index + 1] << 8);
          imageData[offset    ] = (color & 0x7C00) >> 7; // red
          imageData[offset + 1] = (color & 0x03E0) >> 2; // green
          imageData[offset + 2] = (color & 0x001F) << 3; // blue
          imageData[offset + 3] = (color & 0x8000) ? 0 : 255; // overlay 0 = opaque and 1 = transparent Discussion at: https://bugzilla.gnome.org/show_bug.cgi?id=683381
        }
      }
    }

    return imageData;
  }


  /**
   * Return a ImageData object from a TGA file (16bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   */
  function getImageData16bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end) {
    var color, offset, i, x, y;

    for (i = 0, y = y_start; y !== y_end; y += y_step) {
      for (x = x_start; x !== x_end; x += x_step, i += 2) {
        color = pixels[i] | (pixels[i + 1] << 8);
        offset = (x + width * y) * 4;
        imageData[offset    ] = (color & 0x7C00) >> 7; // red
        imageData[offset + 1] = (color & 0x03E0) >> 2; // green
        imageData[offset + 2] = (color & 0x001F) << 3; // blue
        imageData[offset + 3] = (color & 0x8000) ? 0 : 255; // overlay 0 = opaque and 1 = transparent Discussion at: https://bugzilla.gnome.org/show_bug.cgi?id=683381
      }
    }

    return imageData;
  }


  /**
   * Return a ImageData object from a TGA file (24bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   */
  function getImageData24bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end) {
    var offset, i, x, y;
    var bpp = this.header.pixelDepth >> 3;

    for (i = 0, y = y_start; y !== y_end; y += y_step) {
      for (x = x_start; x !== x_end; x += x_step, i += bpp) {
        offset = (x + width * y) * 4;
        imageData[offset + 3] = 255;  // alpha
        imageData[offset + 2] = pixels[i    ]; // blue
        imageData[offset + 1] = pixels[i + 1]; // green
        imageData[offset    ] = pixels[i + 2]; // red
      }
    }

    return imageData;
  }


  /**
   * Return a ImageData object from a TGA file (32bits)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data from TGA file
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   */
  function getImageData32bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end) {
    var i, x, y, offset;

    for (i = 0, y = y_start; y !== y_end; y += y_step) {
      for (x = x_start; x !== x_end; x += x_step, i += 4) {
        offset = (x + width * y) * 4;
        imageData[offset + 2] = pixels[i    ]; // blue
        imageData[offset + 1] = pixels[i + 1]; // green
        imageData[offset    ] = pixels[i + 2]; // red
        imageData[offset + 3] = pixels[i + 3]; // alpha
      }
    }

    return imageData;
  }

  /**
   * Return a ImageData object from a TGA file (32bits). Uses pre multiplied alpha values
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data from TGA file
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   */
  function getImageData32bitsPre(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end) {
    var i, x, y, offset, alpha;

    for (i = 0, y = y_start; y !== y_end; y += y_step) {
      for (x = x_start; x !== x_end; x += x_step, i += 4) {
        offset = (x + width * y) * 4;
        alpha = pixels[i + 3] * 255; // TODO needs testing
        imageData[offset + 2] = pixels[i    ] / alpha; // blue
        imageData[offset + 1] = pixels[i + 1] / alpha; // green
        imageData[offset    ] = pixels[i + 2] / alpha; // red
        imageData[offset + 3] = pixels[i + 3]; // alpha
      }
    }

    return imageData;
  }


  /**
   * Return a ImageData object from a TGA file (8bits grey)
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   */
  function getImageDataGrey8bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end) {
    var color, offset, i, x, y;

    for (i = 0, y = y_start; y !== y_end; y += y_step) {
      for (x = x_start; x !== x_end; x += x_step, i++) {
        color = pixels[i];
        offset = (x + width * y) * 4;
        imageData[offset    ] = color; // red
        imageData[offset + 1] = color; // green
        imageData[offset + 2] = color; // blue
        imageData[offset + 3] = 255;   // alpha
      }
    }

    return imageData;
  }


  /**
   * Return a ImageData object from a TGA file (16bits grey) 8 Bit RGB and 8 Bit Alpha
   *
   * @param {Array} imageData - ImageData to bind
   * @param {Array} pixels data
   * @param {Array} colormap - not used
   * @param {number} width
   * @param {number} y_start - start at y pixel.
   * @param {number} x_start - start at x pixel.
   * @param {number} y_step  - increment y pixel each time.
   * @param {number} y_end   - stop at pixel y.
   * @param {number} x_step  - increment x pixel each time.
   * @param {number} x_end   - stop at pixel x.
   * @returns {Array} imageData
   */
  function getImageDataGrey16bits(imageData, pixels, colormap, width, y_start, y_step, y_end, x_start, x_step, x_end) {
    var color, offset, i, x, y;

    for (i = 0, y = y_start; y !== y_end; y += y_step) {
      for (x = x_start; x !== x_end; x += x_step, i += 2) {
        color = pixels[i];
        offset = (x + width * y) * 4;
        imageData[offset] = color;
        imageData[offset + 1] = color;
        imageData[offset + 2] = color;
        imageData[offset + 3] = pixels[i + 1];
      }
    }

    return imageData;
  }


  /**
   * Open a targa file using XHR, be aware with Cross Domain files...
   *
   * @param {string} path - Path of the filename to load
   * @param {function} callback - callback to trigger when the file is loaded
   */
  Targa.prototype.open = function targaOpen(path, callback) {
    var req, tga = this;
    req = new XMLHttpRequest();
    req.open('GET', path, true);
    req.responseType = 'arraybuffer';
    req.onload = function () {
      if (this.status === 200) {
        tga.arrayBuffer = req.response;
        tga.load(tga.arrayBuffer);
        if (callback) {
          callback.call(tga);
        }
      }
    };
    req.send(null);
  };


  function readFooter(view) {
    var offset = view.byteLength - Targa.FOOTER_SIZE;
    var signature = Targa.SIGNATURE;

    var footer = {};

    var signatureArray = new Uint8Array(view.buffer, offset + 0x08, signature.length);
    var str = String.fromCharCode.apply(null, signatureArray);

    if (!isSignatureValid(str)) {
      footer.hasFooter = false;
      return footer;
    }

    footer.hasFooter = true;
    footer.extensionOffset = view.getUint32(offset, Targa.LITTLE_ENDIAN);
    footer.developerOffset = view.getUint32(offset + 0x04, Targa.LITTLE_ENDIAN);
    footer.hasExtensionArea = footer.extensionOffset !== 0;
    footer.hasDeveloperArea = footer.developerOffset !== 0;

    if (footer.extensionOffset) {
      footer.attributeType = view.getUint8(footer.extensionOffset + 494);
    }

    return footer;
  }

  function isSignatureValid(str) {
    var signature = Targa.SIGNATURE;

    for (var i = 0; i < signature.length; i++) {
      if (str.charCodeAt(i) !== signature.charCodeAt(i)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Load and parse a TGA file
   *
   * @param {ArrayBuffer} data - TGA file buffer array
   */
  Targa.prototype.load = function targaLoad(data) {
    var dataView = new DataView(data);

    this.headerData = new Uint8Array(data, 0, Targa.HEADER_SIZE);

    this.header = readHeader(dataView); // Parse Header
    setHeaderBooleans(this.header);
    checkHeader(this.header); // Check if a valid TGA file (or if we can load it)

    var offset = Targa.HEADER_SIZE;
    // Move to data
    offset += this.header.idLength;
    if (offset >= data.byteLength) {
      throw new Error('Targa::load() - No data');
    }

    // Read palette
    if (this.header.hasColorMap) {
      var colorMapSize = this.header.colorMapLength * (this.header.colorMapDepth >> 3);
      this.palette = new Uint8Array(data, offset, colorMapSize);
      offset += colorMapSize;
    }

    var bytesPerPixel = this.header.pixelDepth >> 3;
    var imageSize = this.header.width * this.header.height;
    var pixelTotal = imageSize * bytesPerPixel;

    if (this.header.hasEncoding) { // RLE encoded
      var RLELength = data.byteLength - offset - Targa.FOOTER_SIZE;
      var RLEData = new Uint8Array(data, offset, RLELength);
      this.imageData = decodeRLE(RLEData, bytesPerPixel, pixelTotal);
    } else { // RAW pixels
      this.imageData = new Uint8Array(data, offset, this.header.hasColorMap ? imageSize : pixelTotal);
    }
    
    this.footer = readFooter(dataView);

    if (this.header.alphaBits !== 0  || this.footer.hasExtensionArea && (this.footer.attributeType === 3 || this.footer.attributeType === 4)) {
      this.footer.usesAlpha = true;
    }
  };


  /**
   * Return a ImageData object from a TGA file
   *
   * @param {object} imageData - Optional ImageData to work with
   * @returns {object} imageData
   */
  Targa.prototype.getImageData = function targaGetImageData(imageData) {
    var width = this.header.width;
    var height = this.header.height;
    var origin = (this.header.flags & Targa.Origin.MASK) >> Targa.Origin.SHIFT;
    var x_start, x_step, x_end, y_start, y_step, y_end;
    var getImageData;

    // Create an imageData
    if (!imageData) {
      if (document) {
        imageData = document.createElement('canvas').getContext('2d').createImageData(width, height);
      }
      // In Thread context ?
      else {
        imageData = {
          width: width,
          height: height,
          data: new Uint8ClampedArray(width * height * 4)
        };
      }
    }

    if (origin === Targa.Origin.TOP_LEFT || origin === Targa.Origin.TOP_RIGHT) {
      y_start = 0;
      y_step = 1;
      y_end = height;
    }
    else {
      y_start = height - 1;
      y_step = -1;
      y_end = -1;
    }

    if (origin === Targa.Origin.TOP_LEFT || origin === Targa.Origin.BOTTOM_LEFT) {
      x_start = 0;
      x_step = 1;
      x_end = width;
    }
    else {
      x_start = width - 1;
      x_step = -1;
      x_end = -1;
    }

    // TODO: use this.header.offsetX and this.header.offsetY ?

    switch (this.header.pixelDepth) {
      case 8:
        getImageData = this.header.isGreyColor ? getImageDataGrey8bits : getImageData8bits;
        break;

      case 16:
        getImageData = this.header.isGreyColor ? getImageDataGrey16bits : getImageData16bits;
        break;

      case 24:
        getImageData = getImageData24bits;
        break;

      case 32:
        if (this.footer.hasExtensionArea) {
          if (this.footer.attributeType === 3) { // straight alpha
            getImageData = getImageData32bits;
          } else if (this.footer.attributeType === 4) { // pre multiplied alpha
            getImageData = getImageData32bitsPre;
          } else { // ignore alpha values if attributeType set to 0, 1, 2
            getImageData = getImageData24bits;
          }
        } else {
          if (this.header.alphaBits !== 0) {
            getImageData = getImageData32bits;
          } else { // 32 bits Depth, but alpha Bits set to 0
            getImageData = getImageData24bits;
          }
        }

        break;
    }

    getImageData.call(this, imageData.data, this.imageData, this.palette, width, y_start, y_step, y_end, x_start, x_step, x_end);
    return imageData;
  };

  /** (Experimental)
   *  Encodes imageData into TGA format
   *  Only TGA True Color 32 bit with optional RLE encoding is supported for now
   * @param imageData
   */
  Targa.prototype.setImageData = function targaSetImageData(imageData) {

    if (!imageData) {
      throw new Error('Targa::setImageData() - imageData argument missing');
    }

    var width = this.header.width;
    var height = this.header.height;
    var expectedLength = width * height * (this.header.pixelDepth  >> 3);
    var origin = (this.header.flags & Targa.Origin.MASK) >> Targa.Origin.SHIFT;
    var x_start, x_step, x_end, y_start, y_step, y_end;

    if (origin === Targa.Origin.TOP_LEFT || origin === Targa.Origin.TOP_RIGHT) {
      y_start = 0; // start bottom, step upward
      y_step = 1;
      y_end = height;
    } else {
      y_start = height - 1; // start at top, step downward
      y_step = -1;
      y_end = -1;
    }

    if (origin === Targa.Origin.TOP_LEFT || origin === Targa.Origin.BOTTOM_LEFT) {
      x_start = 0; // start left, step right
      x_step = 1;
      x_end = width;
    } else {
      x_start = width - 1; // start right, step left
      x_step = -1;
      x_end = -1;
    }

    if (!this.imageData) {
      this.imageData = new Uint8Array(expectedLength);
    }

    // start top left if origin is bottom left
    // swapping order of first two arguments does the trick for writing
    // this converts canvas data to internal tga representation
    // this.imageData contains tga data
    getImageData32bits(this.imageData, imageData.data, this.palette, width, y_start, y_step, y_end, x_start, x_step, x_end);

    var data = this.imageData;

    if (this.header.hasEncoding) {
      data = encodeRLE(this.header, data);
    }

    var bufferSize = Targa.HEADER_SIZE + data.length + Targa.FOOTER_SIZE;
    var buffer = new ArrayBuffer(bufferSize);

    this.arrayBuffer = buffer;
    // create array, useful for inspecting data while debugging
    this.headerData = new Uint8Array(buffer, 0, Targa.HEADER_SIZE);
    this.RLEData = new Uint8Array(buffer, Targa.HEADER_SIZE, data.length);
    this.footerData = new Uint8Array(buffer, Targa.HEADER_SIZE + data.length, Targa.FOOTER_SIZE);

    var headerView = new DataView(this.headerData.buffer);
    writeHeader(this.header, headerView);
    this.RLEData.set(data);
    writeFooter(this.footerData);
  };

  /**
   * Return a canvas with the TGA render on it
   *
   * @returns {object} CanvasElement
   */
  Targa.prototype.getCanvas = function targaGetCanvas() {
    var canvas, ctx, imageData;

    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    imageData = ctx.createImageData(this.header.width, this.header.height);

    canvas.width = this.header.width;
    canvas.height = this.header.height;

    ctx.putImageData(this.getImageData(imageData), 0, 0);

    return canvas;
  };


  /**
   * Return a dataURI of the TGA file
   *
   * @param {string} type - Optional image content-type to output (default: image/png)
   * @returns {string} url
   */
  Targa.prototype.getDataURL = function targaGetDatURL(type) {
    return this.getCanvas().toDataURL(type || 'image/png');
  };

  /**
   * Return a objectURL of the TGA file
   * The url can be used in the download attribute of a link
   * @returns {string} url
   */
  Targa.prototype.getBlobURL = function targetGetBlobURL() {
    if (!this.arrayBuffer) {
      throw new Error('Targa::getBlobURL() - No data available for blob');
    }
    var blob = new Blob([this.arrayBuffer], { type: "image/x-tga" });
    return URL.createObjectURL(blob);
  };


  // Find Context
  var shim = {};
  if (typeof(exports) === 'undefined') {
    if (typeof(define) === 'function' && typeof(define.amd) === 'object' && define.amd) {
      define(function () {
        return Targa;
      });
    } else {
      // Browser
      shim.exports = typeof(window) !== 'undefined' ? window : _global;
    }
  }
  else {
    // Commonjs
    shim.exports = exports;
  }


  // Export
  if (shim.exports) {
    shim.exports.TGA = Targa;
  }

})(this);
