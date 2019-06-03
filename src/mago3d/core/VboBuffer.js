'use strict';

/**
 * VBO.
 * 
 * @class VboBuffer
 * @constructor 
 */
var VboBuffer = function(dataTarget) 
{
	if (!(this instanceof VboBuffer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * VBO data array.
	 * @type {TypedArray}
	 * @default undefined
	 */
	this.dataArray;
	
	/**
	 * VBO data array length.
	 * @type {Number}
	 * @default undefined
	 */
	this.dataLength; 
	
	/**
	 * VBO data array type. (5120 : signed byte), (5121 : unsigned byte), (5122 : signed short), (5123 : unsigned short), (5126 : float).
	 * @type {Number}
	 * @default undefined
	 */
	this.dataGlType; 
	
	/**
	 * Webgl vbo identifier.
	 * @type {WebGLBuffer}
	 * @default undefined
	 */
	this.key; 
	
	/**
	 * Webgl data target. It can be gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER. In WebGl2 added(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, gl.TRANSFORM_FEEDBACK_BUFFER, gl.UNIFORM_BUFFER, gl.PIXEL_PACK_BUFFER, gl.PIXEL_UNPACK_BUFFER).
	 * @type {Number}
	 * @default 34962 gl.ARRAY_BUFFER
	 */
	this.dataTarget; 

	if (dataTarget !== undefined)
	{ this.dataTarget = dataTarget; }
	else 
	{ this.dataTarget = 34962; } // 34962 = gl.ARRAY_BUFFER. Default value.***
};

/**
 * Deletes all objects.
 * @param {VboMemoryManager} vboMemManager.
 */
VboBuffer.prototype.deleteGlObjects = function(vboMemManager) 
{
	if (this.key !== undefined)
	{
		var gl = vboMemManager.gl;
		
		if (this.dataTarget === gl.ARRAY_BUFFER)
		{ vboMemManager.storeClassifiedBufferKey(gl, this.key, this.dataLength); }
		else if (this.dataTarget === gl.ELEMENT_ARRAY_BUFFER)
		{ vboMemManager.storeClassifiedElementKey(gl, this.key, this.dataLength); }
	}
	
	this.dataArray = undefined;
	this.dataLength = undefined; 
	this.dataGlType = undefined; 
	this.key = undefined;
	this.dataTarget = undefined;
};

/**
 * Sets the data array.
 * @param {TypedArray} dataArray The heading value in degrees.
 * @param {VboMemoryManager} vboMemManager.
 */
VboBuffer.prototype.setDataArray = function(dataArray, vboMemManager) 
{
	if (dataArray === undefined)
	{ return; }
	
	this.dataGlType = VboBuffer.getGlTypeOfArray(dataArray);
	
	var arrayElemsCount = dataArray.length;
	var classifiedPosByteSize = arrayElemsCount; // Init value.***
	if (vboMemManager.enableMemoryManagement)
	{
		classifiedPosByteSize = vboMemManager.getClassifiedBufferSize(arrayElemsCount);
		this.dataArray = VboBuffer.newTypedArray(classifiedPosByteSize, this.dataGlType);
		this.dataArray.set(dataArray);
	}
	else 
	{
		this.dataArray = dataArray;
	}
	this.dataLength = arrayElemsCount;
};


/**
 * 어떤 일을 하고 있습니까?
 */
 
VboBuffer.prototype.isReady = function(gl, vboMemManager) 
{
	if (this.key === undefined) 
	{
		if (this.dataArray === undefined) { return false; }
		if (this.dataLength === undefined)
		{
			this.dataLength = this.dataArray.length;
		}
		this.key = vboMemManager.getClassifiedBufferKey(gl, this.dataLength);
		if (this.key === undefined)
		{ return false; }
		gl.bindBuffer(this.dataTarget, this.key);
		gl.bufferData(this.dataTarget, this.dataArray, gl.STATIC_DRAW);
		this.dataArray = undefined;
		return true;
	}
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VboBuffer.getGlTypeOfArray = function(dataArray) 
{
	var glType = -1;
	if (dataArray.constructor === Float32Array)
	{ glType = 5126; } // gl.FLOAT.***
	else if (dataArray.constructor === Int16Array)
	{ glType = 5122; } // gl.SHORT.***
	else if (dataArray.constructor === Uint16Array)
	{ glType = 5123; } // gl.UNSIGNED_SHORT.***
	else if (dataArray.constructor === Int8Array)
	{ glType = 5120; } // gl.BYTE.***
	else if (dataArray.constructor === Uint8Array)
	{ glType = 5121; } // gl.UNSIGNED_BYTE.***
	
	return glType;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VboBuffer.newTypedArray = function(arrayLength, glType) 
{
	var typedArray;
	if (glType === 5126)// gl.FLOAT.***
	{ typedArray = new Float32Array(arrayLength); }
	else if (glType === 5122)// gl.SHORT.***
	{ typedArray = new Int16Array(arrayLength); }
	else if (glType === 5123)// gl.UNSIGNED_SHORT.***
	{ typedArray = new Uint16Array(arrayLength); }
	else if (glType === 5120)// gl.BYTE.***
	{ typedArray = new Int8Array(arrayLength); }
	else if (glType === 5121)// gl.UNSIGNED_BYTE.***
	{ typedArray = new Uint8Array(arrayLength); }
		
	return typedArray;
};