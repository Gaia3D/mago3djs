'use strict';

/**
 * @class VertexAttribPointerParameters
 * @constructor 
 */
var VertexAttribPointerParameters = function ({index, size, type, normalized, stride, offset}) 
{
	// void gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
	//-------------------------------------------------------------------------------

	if (!(this instanceof VertexAttribPointerParameters)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * A GLuint specifying the index of the vertex attribute that is to be modified.
	 * @type {GLuint}
	 */
	this.index = index;

	/**
	 * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
	 * @type {GLint}
	 */
	this.size = size;

	/**
	 * A GLenum specifying the data type of each component in the array. Possible values:
     * gl.BYTE: signed 8-bit integer, with values in [-128, 127]
     * gl.SHORT: signed 16-bit integer, with values in [-32768, 32767]
     * gl.UNSIGNED_BYTE: unsigned 8-bit integer, with values in [0, 255]
     * gl.UNSIGNED_SHORT: unsigned 16-bit integer, with values in [0, 65535]
     * gl.FLOAT: 32-bit IEEE floating point number
     * When using a WebGL 2 context, the following values are available additionally:
     * gl.HALF_FLOAT: 16-bit IEEE floating point number
	 * @type {GLenum}
	 */
	this.type = type;

	/**
	 * A GLboolean specifying whether integer data values should be normalized into a certain range when being cast to a float.
     * For types gl.BYTE and gl.SHORT, normalizes the values to [-1, 1] if true.
     * For types gl.UNSIGNED_BYTE and gl.UNSIGNED_SHORT, normalizes the values to [0, 1] if true.
     * For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
	 * @type {GLboolean}
	 */
	this.normalized = normalized;

	/**
	 * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. 
     * Cannot be larger than 255. If stride is 0, the attribute is assumed to be tightly packed, that is, 
     * the attributes are not interleaved but each attribute is in a separate block, 
     * and the next vertex' attribute follows immediately after the current vertex.
	 * @type {GLsizei}
	 */
	this.stride = stride;

	/**
	 * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of the byte length of type.
	 * @type {GLintptr}
	 */
	this.offset = offset;

};