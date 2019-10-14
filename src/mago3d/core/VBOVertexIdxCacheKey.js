'use strict';
/**
 * 어떤 일을 하고 있습니까?
 * @class VBOVertexIdxCacheKey
 */
var VBOVertexIdxCacheKey = function() 
{
	if (!(this instanceof VBOVertexIdxCacheKey)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.indicesCount = -1;
	this.vertexCount = -1;
	this.bigTrianglesIndicesCount = -1;
	
	this.vboBufferPos;
	this.vboBufferNor;
	this.vboBufferIdx;
	this.vboBufferCol;
	this.vboBufferTCoord;
	
	this.keepDataArrayBuffers;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.stepOverPosNorIdx = function(arrayBuffer, readWriter, vboMemManager, bytesReaded) 
{
	var startBuff, endBuff;
	
	// 1) Positions array.
	var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	var verticesFloatValuesCount = vertexCount * 3;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 4 * verticesFloatValuesCount;
	bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.
	
	// 2) Normals.
	vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	var normalByteValuesCount = vertexCount * 3;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 1 * normalByteValuesCount;
	bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.
	
	// 3) Indices.
	var shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);

	bytesReaded += 4;
	var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);
	bytesReaded +=1;
	//var sizeThresholds = [];
	for ( var k = 0; k < sizeLevels; k++ )
	{
		//sizeThresholds.push(new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)));
		bytesReaded += 4;
	}
	//var indexMarkers = [];
	for ( var k = 0; k < sizeLevels; k++ )
	{
		//indexMarkers.push(readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4));
		bytesReaded += 4;
	}
	//var bigTrianglesShortIndicesValues_count = indexMarkers[sizeLevels-1];
	//this.bigTrianglesIndicesCount = bigTrianglesShortIndicesValues_count;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 2 * shortIndicesValuesCount;
	//var idxDataArray = new Uint16Array(arrayBuffer.slice(startBuff, endBuff));
	//this.setDataArrayIdx(idxDataArray, vboMemManager);

	bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.readPositions = function(arrayBuffer, vboMemManager, bytesReaded) 
{
	// glType: (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
	// 1) read glType.
	var glType = (new Uint16Array(arrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
	
	// 2) read dimensions.
	var dimensions = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	
	// 3) read vertex count.
	var vertexCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// 4) finally read data buffer.
	var verticesFloatValuesCount = vertexCount * dimensions;
	var startBuff = bytesReaded;
	var byteSize = VboBuffer.getByteSizeByGlType(glType);
	var endBuff = bytesReaded + byteSize * verticesFloatValuesCount;
	var dataBuffer = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
	bytesReaded = bytesReaded + byteSize * verticesFloatValuesCount; // updating data.
	
	this.setDataArrayPos(dataBuffer, vboMemManager);
	
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.readNormals = function(arrayBuffer, vboMemManager, bytesReaded) 
{
	// glType: (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
	// 1) read glType.
	var glType = (new Uint16Array(arrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
	
	// 2) read dimensions.
	var dimensions = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	
	// 3) read vertex count.
	var vertexCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// 4) finally read data buffer.
	var verticesFloatValuesCount = vertexCount * dimensions;
	var startBuff = bytesReaded;
	var byteSize = VboBuffer.getByteSizeByGlType(glType);
	var endBuff = bytesReaded + byteSize * verticesFloatValuesCount;
	var dataBuffer = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
	bytesReaded = bytesReaded + byteSize * verticesFloatValuesCount; // updating data.
	
	this.setDataArrayNor(dataBuffer, vboMemManager);
	
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.readTexCoords = function(arrayBuffer, vboMemManager, bytesReaded) 
{
	// glType: (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
	// 1) read glType.
	var glType = (new Uint16Array(arrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
	
	// 2) read dimensions.
	var dimensions = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	
	// 3) read vertex count.
	var vertexCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// 4) finally read data buffer.
	var verticesFloatValuesCount = vertexCount * dimensions;
	var startBuff = bytesReaded;
	var byteSize = VboBuffer.getByteSizeByGlType(glType);
	var endBuff = bytesReaded + byteSize * verticesFloatValuesCount;
	var dataBuffer = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
	bytesReaded = bytesReaded + byteSize * verticesFloatValuesCount; // updating data.
	
	this.setDataArrayTexCoord(dataBuffer, vboMemManager);
	
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.readColors = function(arrayBuffer, vboMemManager, bytesReaded) 
{
	// glType: (5120 signed byte), (5121 unsigned byte), (5122 signed short), (5123 unsigned short), (5126 float)
	// 1) read glType.
	var glType = (new Uint16Array(arrayBuffer.slice(bytesReaded, bytesReaded+2)))[0]; bytesReaded += 2;
	
	// 2) read dimensions.
	var dimensions = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	
	// 3) read vertex count.
	var vertexCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	
	// 4) finally read data buffer.
	var verticesFloatValuesCount = vertexCount * dimensions;
	var startBuff = bytesReaded;
	var byteSize = VboBuffer.getByteSizeByGlType(glType);
	var endBuff = bytesReaded + byteSize * verticesFloatValuesCount;
	var dataBuffer = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
	bytesReaded = bytesReaded + byteSize * verticesFloatValuesCount; // updating data.
	
	this.setDataArrayCol(dataBuffer, vboMemManager);
	
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.readPosNorIdx = function(arrayBuffer, vboMemManager, bytesReaded) 
{
	// Function used by blocksList.
	var startBuff, endBuff;
	
	// 1) Positions array.
	var vertexCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.vertexCount = vertexCount;
	var verticesFloatValuesCount = vertexCount * 3;
	
	startBuff = bytesReaded;
	endBuff = bytesReaded + 4 * verticesFloatValuesCount;
	var posDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
	this.setDataArrayPos(posDataArray, vboMemManager);

	bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.
	
	// 2) Normals.
	vertexCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	var normalByteValuesCount = vertexCount * 3;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 1 * normalByteValuesCount;
	var norDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
	this.setDataArrayNor(norDataArray, vboMemManager);
	
	bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.
	
	// 3) Indices.
	var shortIndicesValuesCount = (new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;

	var sizeLevels = (new Uint8Array(arrayBuffer.slice(bytesReaded, bytesReaded+1)))[0]; bytesReaded += 1;
	var sizeThresholds = [];
	for ( var k = 0; k < sizeLevels; k++ )
	{
		sizeThresholds.push(new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)));
		bytesReaded += 4;
	}
	var indexMarkers = [];
	for ( var k = 0; k < sizeLevels; k++ )
	{
		indexMarkers.push(new Uint32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)));
		bytesReaded += 4;
	}
	var bigTrianglesShortIndicesValues_count = indexMarkers[sizeLevels-1];
	this.bigTrianglesIndicesCount = bigTrianglesShortIndicesValues_count;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 2 * shortIndicesValuesCount;
	var idxDataArray = new Uint16Array(arrayBuffer.slice(startBuff, endBuff));
	this.setDataArrayIdx(idxDataArray, vboMemManager);

	bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.bindDataPosition = function(shader, vboMemManager) 
{
	if (shader === undefined)
	{ return false; }

	return this.vboBufferPos.bindData(shader, shader.position3_loc, vboMemManager);
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.bindDataNormal = function(shader, vboMemManager) 
{
	if (shader === undefined)
	{ return false; }
	
	var vboBufferNor = this.vboBufferNor;
	if (vboBufferNor === undefined)
	{
		shader.disableVertexAttribArray(shader.normal3_loc);
		return true; // Return "true" bcos there are no "normal" data, that is different that having "normal" data and not prepared yet.
	}
	
	return vboBufferNor.bindData(shader, shader.normal3_loc, vboMemManager);
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.bindDataTexCoord = function(shader, vboMemManager) 
{
	if (shader === undefined)
	{ return false; }
	
	var vboBufferTCoord = this.vboBufferTCoord;
	if (vboBufferTCoord === undefined)
	{
		shader.disableVertexAttribArray(shader.texCoord2_loc);
		return true; // Return "true" bcos there are no "tCoord" data, that is different that having "tCoord" data and not prepared yet.
	}
	
	return vboBufferTCoord.bindData(shader, shader.texCoord2_loc, vboMemManager);
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.bindDataColor = function(shader, vboMemManager) 
{
	if (shader === undefined)
	{ return false; }
	
	var vboBufferCol = this.vboBufferCol;
	if (vboBufferCol === undefined)
	{
		shader.disableVertexAttribArray(shader.color4_loc);
		return true; // Return "true" bcos there are no "color" data, that is different that having "color" data and not prepared yet.
	}
	
	return vboBufferCol.bindData(shader, shader.color4_loc, vboMemManager);
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.bindDataIndice = function(shader, vboMemManager) 
{
	if (shader === undefined)
	{ return false; }
	
	var gl = shader.gl;
	
	var vboBufferIdx = this.vboBufferIdx;
	if (!vboBufferIdx.isReady(gl, vboMemManager))
	{ return false; }
	
	if (vboBufferIdx.key !== shader.lastVboKeyBindedMap.elemIdx)
	{
		gl.bindBuffer(vboBufferIdx.dataTarget, vboBufferIdx.key);
		shader.lastVboKeyBindedMap.elemIdx = vboBufferIdx.key;
	}
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayPos = function(posDataArray, vboMemManager) 
{
	if (posDataArray === undefined)
	{ return; }
	
	var gl = vboMemManager.gl;
	if (this.vboBufferPos === undefined)
	{ this.vboBufferPos = new VboBuffer(gl.ARRAY_BUFFER); }
	var dimensions = 3;
	var normalized = false;
	this.vboBufferPos.setDataArray(posDataArray, dimensions, normalized, vboMemManager);
	this.vertexCount = this.vboBufferPos.dataLength/3;
	
	if (this.keepDataArrayBuffers)
	{ this.keepedPosDataArray = posDataArray; }
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayNor = function(norDataArray, vboMemManager) 
{
	if (norDataArray === undefined)
	{ return; }

	var gl = vboMemManager.gl;
	if (this.vboBufferNor === undefined)
	{ this.vboBufferNor = new VboBuffer(gl.ARRAY_BUFFER); }
	
	var dimensions = 3;
	var normalized = true;
	this.vboBufferNor.setDataArray(norDataArray, dimensions, normalized, vboMemManager);
	
	if (this.keepDataArrayBuffers)
	{ this.keepedNorDataArray = norDataArray; }
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayIdx = function(idxDataArray, vboMemManager) 
{
	if (idxDataArray === undefined)
	{ return; }

	var gl = vboMemManager.gl;
	if (this.vboBufferIdx === undefined)
	{ this.vboBufferIdx = new VboBuffer(gl.ELEMENT_ARRAY_BUFFER); }
	
	var dimensions = 1;
	var normalized = false;
	this.vboBufferIdx.setDataArray(idxDataArray, dimensions, normalized, vboMemManager);
	this.indicesCount = this.vboBufferIdx.dataLength;
	
	if (this.keepDataArrayBuffers)
	{ this.keepedIdxDataArray = idxDataArray; }
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayCol = function(colDataArray, vboMemManager) 
{
	if (colDataArray === undefined)
	{ return; }

	var gl = vboMemManager.gl;
	if (this.vboBufferCol === undefined)
	{ this.vboBufferCol = new VboBuffer(gl.ARRAY_BUFFER); }
	
	var dimensions = 4;
	var normalized = true;
	this.vboBufferCol.setDataArray(colDataArray, dimensions, normalized, vboMemManager);
	
	if (this.keepDataArrayBuffers)
	{ this.keepedColDataArray = colDataArray; }
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayTexCoord = function(texCoordDataArray, vboMemManager) 
{
	if (texCoordDataArray === undefined)
	{ return; }

	var gl = vboMemManager.gl;
	
	if (this.vboBufferTCoord === undefined)
	{ this.vboBufferTCoord = new VboBuffer(gl.ARRAY_BUFFER); }
	
	var dimensions = 2;
	var normalized = false;
	this.vboBufferTCoord.setDataArray(texCoordDataArray, dimensions, normalized, vboMemManager);
	
	if (this.keepDataArrayBuffers)
	{ this.keepedTexCoordDataArray = texCoordDataArray; }
};


/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKey.prototype.deleteGlObjects = function(gl, vboMemManager) 
{
	if (this.vboBufferPos !== undefined)
	{
		this.vboBufferPos.deleteGlObjects(vboMemManager);	
		this.vboBufferPos = undefined;
	}
	if (this.vboBufferNor !== undefined)
	{
		this.vboBufferNor.deleteGlObjects(vboMemManager);	
		this.vboBufferNor = undefined;
	}
	if (this.vboBufferIdx !== undefined)
	{
		this.vboBufferIdx.deleteGlObjects(vboMemManager);	
		this.vboBufferIdx = undefined;
	}
	if (this.vboBufferCol !== undefined)
	{
		this.vboBufferCol.deleteGlObjects(vboMemManager);	
		this.vboBufferCol = undefined;
	}
	if (this.vboBufferTCoord !== undefined)
	{
		this.vboBufferTCoord.deleteGlObjects(vboMemManager);	
		this.vboBufferTCoord = undefined;
	}
	
	// If exist:
	this.keepedColDataArray = undefined;
	this.keepedIdxDataArray = undefined;
	this.keepedNorDataArray = undefined;
	this.keepedPosDataArray = undefined;
	this.keepedTexCoordDataArray = undefined;
};
