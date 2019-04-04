'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Buffer
 */
var VboBuffer = function(dataTarget) 
{
	if (!(this instanceof VboBuffer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.dataArray;
	this.dataLength; 
	this.dataGlType; // (5120 : signed byte), (5121 : unsigned byte), (5122 : signed short), (5123 : unsigned short), (5126 : float).***
	this.key;
	this.dataTarget; // gl.ARRAY_BUFFER, gl.ELEMENT_ARRAY_BUFFER. In WebGl2 added(gl.COPY_READ_BUFFER, gl.COPY_WRITE_BUFFER, gl.TRANSFORM_FEEDBACK_BUFFER, gl.UNIFORM_BUFFER, gl.PIXEL_PACK_BUFFER, gl.PIXEL_UNPACK_BUFFER).***

	if (dataTarget !== undefined)
	{ this.dataTarget = dataTarget; }
	else 
	{ this.dataTarget = 34962; } // 34962 = gl.ARRAY_BUFFER. Default value.***
};

/**
 * 어떤 일을 하고 있습니까?
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
 * 어떤 일을 하고 있습니까?
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
/*
VboBuffer.prototype.bindData = function(shader, vboMemManager) 
{
	if(shader === undefined)
		return false;
	
	var gl = shader.gl;
	if(!this.isReady(gl, vboMemManager))
		return false;
	
	if (shader.position3_loc !== undefined && shader.position3_loc !== -1) 
	{
		if (this.meshVertexCacheKey !== shader.last_vboPos_binded)
		{
			shader.enableVertexAttribArray(shader.position3_loc);
			gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVertexCacheKey);
			gl.vertexAttribPointer(shader.position3_loc, 3, this.posGlType, false, 0, 0);
			shader.last_vboPos_binded = this.meshVertexCacheKey;
		}
		return true;
	}
	else shader.disableVertexAttribArray(shader.position3_loc);
	
	return false;
};
*/

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

};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.stepOverPosNorIdx = function(arrayBuffer, readWriter, vboMemManager, bytesReaded) 
{
	var startBuff, endBuff;
	
	// 1) Positions array.***
	var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	//this.vertexCount = vertexCount;
	bytesReaded += 4;
	var verticesFloatValuesCount = vertexCount * 3;
	
	startBuff = bytesReaded;
	endBuff = bytesReaded + 4 * verticesFloatValuesCount;
	//var posDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
	//this.setDataArrayPos(posDataArray, vboMemManager);

	bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***
	
	// 2) Normals.***
	vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	var normalByteValuesCount = vertexCount * 3;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 1 * normalByteValuesCount;
	//var norDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
	//this.setDataArrayNor(norDataArray, vboMemManager);
	
	bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.***
	
	// 3) Indices.***
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

	bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.***
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.readPosNorIdx = function(arrayBuffer, readWriter, vboMemManager, bytesReaded) 
{
	var startBuff, endBuff;
	
	// 1) Positions array.***
	var vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	this.vertexCount = vertexCount;
	bytesReaded += 4;
	var verticesFloatValuesCount = vertexCount * 3;
	
	startBuff = bytesReaded;
	endBuff = bytesReaded + 4 * verticesFloatValuesCount;
	var posDataArray = new Float32Array(arrayBuffer.slice(startBuff, endBuff));
	this.setDataArrayPos(posDataArray, vboMemManager);

	bytesReaded = bytesReaded + 4 * verticesFloatValuesCount; // updating data.***
	
	// 2) Normals.***
	vertexCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);
	bytesReaded += 4;
	var normalByteValuesCount = vertexCount * 3;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 1 * normalByteValuesCount;
	var norDataArray = new Int8Array(arrayBuffer.slice(startBuff, endBuff));
	this.setDataArrayNor(norDataArray, vboMemManager);
	
	bytesReaded = bytesReaded + 1 * normalByteValuesCount; // updating data.***
	
	// 3) Indices.***
	var shortIndicesValuesCount = readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4);

	bytesReaded += 4;
	var sizeLevels = readWriter.readUInt8(arrayBuffer, bytesReaded, bytesReaded+1);
	bytesReaded +=1;
	var sizeThresholds = [];
	for ( var k = 0; k < sizeLevels; k++ )
	{
		sizeThresholds.push(new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)));
		bytesReaded += 4;
	}
	var indexMarkers = [];
	for ( var k = 0; k < sizeLevels; k++ )
	{
		indexMarkers.push(readWriter.readUInt32(arrayBuffer, bytesReaded, bytesReaded+4));
		bytesReaded += 4;
	}
	var bigTrianglesShortIndicesValues_count = indexMarkers[sizeLevels-1];
	this.bigTrianglesIndicesCount = bigTrianglesShortIndicesValues_count;
	startBuff = bytesReaded;
	endBuff = bytesReaded + 2 * shortIndicesValuesCount;
	var idxDataArray = new Uint16Array(arrayBuffer.slice(startBuff, endBuff));
	this.setDataArrayIdx(idxDataArray, vboMemManager);

	bytesReaded = bytesReaded + 2 * shortIndicesValuesCount; // updating data.***
	return bytesReaded;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.bindDataPosition = function(shader, vboMemManager) 
{
	if (shader === undefined)
	{ return false; }
	
	var gl = shader.gl;
	var vboBufferPos = this.vboBufferPos;
	if (!vboBufferPos.isReady(gl, vboMemManager))
	{ return false; }
	
	if (shader.position3_loc !== undefined && shader.position3_loc !== -1) 
	{
		shader.enableVertexAttribArray(shader.position3_loc);
		if (vboBufferPos.key !== shader.last_vboPos_binded)
		{
			gl.bindBuffer(vboBufferPos.dataTarget, vboBufferPos.key);
			gl.vertexAttribPointer(shader.position3_loc, 3, vboBufferPos.dataGlType, false, 0, 0);
			shader.last_vboPos_binded = vboBufferPos.key;
		}
		return true;
	}
	else { shader.disableVertexAttribArray(shader.position3_loc); }
	return false;
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
		return true; // Return "true" bcos there are no "normal" data, that is different that having "normal" data and not prepared yet.***
	}
	
	var gl = shader.gl;
	if (!vboBufferNor.isReady(gl, vboMemManager))
	{ return false; }
	
	if (shader.normal3_loc !== undefined && shader.normal3_loc !== -1) 
	{
		shader.enableVertexAttribArray(shader.normal3_loc);
		if (vboBufferNor.key !== shader.last_vboNor_binded)
		{
			gl.bindBuffer(vboBufferNor.dataTarget, vboBufferNor.key);
			gl.vertexAttribPointer(shader.normal3_loc, 3, vboBufferNor.dataGlType, true, 0, 0);
			shader.last_vboNor_binded = vboBufferNor.key;
		}
		return true;
	}
	else { shader.disableVertexAttribArray(shader.normal3_loc); }
	return false;
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
		return true; // Return "true" bcos there are no "tCoord" data, that is different that having "tCoord" data and not prepared yet.***
	}
	
	var gl = shader.gl;
	if (!vboBufferTCoord.isReady(gl, vboMemManager))
	{ return false; }
	if (shader.texCoord2_loc !== undefined && shader.texCoord2_loc !== -1) 
	{
		shader.enableVertexAttribArray(shader.texCoord2_loc);
		if (vboBufferTCoord.key !== shader.last_vboTexCoord_binded)
		{
			gl.bindBuffer(vboBufferTCoord.dataTarget, vboBufferTCoord.key);
			gl.vertexAttribPointer(shader.texCoord2_loc, 2, vboBufferTCoord.dataGlType, false, 0, 0);
			shader.last_vboTexCoord_binded = vboBufferTCoord.key;
		}
		return true;
	}
	else { shader.disableVertexAttribArray(shader.texCoord2_loc); }
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
		return true; // Return "true" bcos there are no "color" data, that is different that having "color" data and not prepared yet.***
	}
	
	var gl = shader.gl;
	if (!vboBufferCol.isReady(gl, vboMemManager))
	{ return false; }

	if (shader.color4_loc !== undefined && shader.color4_loc !== -1) 
	{
		shader.enableVertexAttribArray(shader.color4_loc);
		if (vboBufferCol.key !== shader.last_vboCol_binded)
		{
			gl.bindBuffer(vboBufferCol.dataTarget, vboBufferCol.key);
			gl.vertexAttribPointer(shader.color4_loc, 4, vboBufferCol.dataGlType, true, 0, 0);
			shader.last_vboCol_binded = vboBufferCol.key;
		}
		return true;
	}
	else { shader.disableVertexAttribArray(shader.color4_loc); }
	return false;
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
	
	if (vboBufferIdx.key !== shader.last_vboIdx_binded)
	{
		gl.bindBuffer(vboBufferIdx.dataTarget, vboBufferIdx.key);
		shader.last_vboIdx_binded = vboBufferIdx.key;
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
	
	this.vboBufferPos.setDataArray(posDataArray, vboMemManager);
	this.vertexCount = this.vboBufferPos.dataLength/3;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayNor = function(norDataArray, vboMemManager) 
{
	var gl = vboMemManager.gl;
	if (this.vboBufferNor === undefined)
	{ this.vboBufferNor = new VboBuffer(gl.ARRAY_BUFFER); }
	
	this.vboBufferNor.setDataArray(norDataArray, vboMemManager);
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayIdx = function(idxDataArray, vboMemManager) 
{
	var gl = vboMemManager.gl;
	if (this.vboBufferIdx === undefined)
	{ this.vboBufferIdx = new VboBuffer(gl.ELEMENT_ARRAY_BUFFER); }
	
	this.vboBufferIdx.setDataArray(idxDataArray, vboMemManager);
	this.indicesCount = this.vboBufferIdx.dataLength;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayCol = function(colDataArray, vboMemManager) 
{
	
	var gl = vboMemManager.gl;
	if (this.vboBufferCol === undefined)
	{ this.vboBufferCol = new VboBuffer(gl.ARRAY_BUFFER); }
	
	this.vboBufferCol.setDataArray(colDataArray, vboMemManager);
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayTexCoord = function(texCoordDataArray, vboMemManager) 
{
	var gl = vboMemManager.gl;
	
	if (this.vboBufferTCoord === undefined)
	{ this.vboBufferTCoord = new VboBuffer(gl.ARRAY_BUFFER); }
	
	this.vboBufferTCoord.setDataArray(texCoordDataArray, vboMemManager);
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
};

// VBOVertexIdxCacheKeysContainer.*****************************************************************************************************
// VBOVertexIdxCacheKeysContainer.*****************************************************************************************************
// VBOVertexIdxCacheKeysContainer.*****************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @class VBOVertexIdxCacheKeysContainer
 */
var VBOVertexIdxCacheKeysContainer = function() 
{
	if (!(this instanceof VBOVertexIdxCacheKeysContainer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vboCacheKeysArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.newVBOVertexIdxCacheKey = function() 
{
	var vboViCacheKey = new VBOVertexIdxCacheKey();
	this.vboCacheKeysArray.push(vboViCacheKey);
	return vboViCacheKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.deleteGlObjects = function(gl, vboMemManager) 
{
	if (this.vboCacheKeysArray === undefined)
	{ return; }
	
	var vboDatasCount = this.vboCacheKeysArray.length;
	for (var j = 0; j < vboDatasCount; j++) 
	{
		this.vboCacheKeysArray[j].deleteGlObjects(gl, vboMemManager);
		this.vboCacheKeysArray[j] = undefined;
	}
	this.vboCacheKeysArray.length = 0;
	this.vboCacheKeysArray = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.getVbosCount = function() 
{
	if (this.vboCacheKeysArray === undefined) { return 0; }
	
	return this.vboCacheKeysArray.length;
};












