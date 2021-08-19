'use strict';

/**
 *
 * @param {Blob} value geobuf binary.
 * @returns {object}
 */
var geobufDecoder = function (value) 
{
	return geobuf.geobuf.decode(new Pbf(value));
};