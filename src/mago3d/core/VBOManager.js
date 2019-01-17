'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Buffer
 */
var VboBuffer = function() 
{
	if (!(this instanceof VboBuffer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.dataArray;
	this.dataLength; 
	this.dataType; // byteType: float, short, byte.***
	this.key;
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
		gl.bindBuffer(gl.ARRAY_BUFFER, this.key);
		gl.bufferData(gl.ARRAY_BUFFER, this.dataArray, gl.STATIC_DRAW);
		this.dataArray = undefined;
		return true;
	}
	return true;
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

	this.meshVertexCacheKey;
	this.meshFacesCacheKey;
	this.meshNormalCacheKey;
	this.meshColorCacheKey;
	this.meshTexcoordsCacheKey;

	// Now, arrays to store data, and when necessary bind to gl and delete it.***
	this.posVboDataArray; // Usually Float32Array.***
	this.norVboDataArray; // Usually Int8Array.***
	this.idxVboDataArray; // Usually UInt16Array.***
	this.colVboDataArray; // Usually Uint8Array.***
	this.tcoordVboDataArray; // Usually Float32Array.***
	
	this.posArrayByteSize;
	this.norArrayByteSize;
	this.idxArrayByteSize;
	this.colArrayByteSize;
	this.tcoordArrayByteSize;
	
	// byteType: float, short, byte.***
	this.posArrayByteType;
	this.norArrayByteType;
	this.idxArrayByteType;
	this.colArrayByteType;
	this.tcoordArrayByteType;
	
	this.existPositions;
	this.existNormals;
	this.existColors;
	this.existTexCoords;
	this.existIndices;
	

	this.buffer;// delete this. provisionally put this here.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayPos = function(posDataArray, vboMemManager) 
{
	if(posDataArray === undefined)
		return;
	
	var verticesFloatValuesCount = posDataArray.length;
	var classifiedPosByteSize = verticesFloatValuesCount; // Init value.***
	if(vboMemManager.enableMemoryManagement)
	{
		classifiedPosByteSize = vboMemManager.getClassifiedBufferSize(verticesFloatValuesCount);
		this.posVboDataArray = new Float32Array(classifiedPosByteSize);
		this.posVboDataArray.set(posDataArray);
	}
	else{
		this.posVboDataArray = posDataArray;
	}
	this.vertexCount = verticesFloatValuesCount/3;
	//this.posArrayByteSize = classifiedPosByteSize; 
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayNor = function(norDataArray, vboMemManager) 
{
	if(norDataArray === undefined)
		return;
	
	var normalByteValuesCount = norDataArray.length;
	var classifiedNorByteSize = normalByteValuesCount; // Init value.***
	if(vboMemManager.enableMemoryManagement)
	{
		classifiedNorByteSize = vboMemManager.getClassifiedBufferSize(normalByteValuesCount);
		this.norVboDataArray = new Int8Array(classifiedNorByteSize);
		this.norVboDataArray.set(norDataArray);
	}
	else{
		this.norVboDataArray = norDataArray;
	}
	//this.norArrayByteSize = classifiedNorByteSize;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayIdx = function(idxDataArray, vboMemManager) 
{
	if(idxDataArray === undefined)
		return;
	
	var shortIndicesValuesCount = idxDataArray.length;
	var classifiedIdxByteSize = shortIndicesValuesCount; // Init value.***
	if(vboMemManager.enableMemoryManagement)
	{
		classifiedIdxByteSize = vboMemManager.getClassifiedBufferSize(shortIndicesValuesCount);
		this.idxVboDataArray = new Uint16Array(classifiedIdxByteSize);
		this.idxVboDataArray.set(idxDataArray);
	}
	else{
		this.idxVboDataArray = idxDataArray;
	}
	this.indicesCount = shortIndicesValuesCount;
	//this.norArrayByteSize = classifiedIdxByteSize;
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayCol = function(colDataArray, vboMemManager) 
{
	if(colDataArray === undefined)
		return;
	
	var colorByteValuesCount = colDataArray.length;
	var classifiedColByteSize = colorByteValuesCount;
	if(vboMemManager.enableMemoryManagement)
	{
		classifiedColByteSize = vboMemManager.getClassifiedBufferSize(colorByteValuesCount);
		this.colVboDataArray = new Uint8Array(classifiedColByteSize);
		this.colVboDataArray.set(colDataArray);
	}
	else{
		this.colVboDataArray = colDataArray;
	}
	//this.colArrayByteSize = classifiedColByteSize;
	
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBOVertexIdxCacheKey.prototype.setDataArrayTexCoord = function(texCoordDataArray, vboMemManager) 
{
	if(texCoordDataArray === undefined)
		return;
	
	var texCoordsFloatValuesCount = texCoordDataArray.length;
	var classifiedTCoordByteSize = texCoordsFloatValuesCount;
	
	if(vboMemManager.enableMemoryManagement)
	{
		classifiedTCoordByteSize = vboMemManager.getClassifiedBufferSize(texCoordsFloatValuesCount);
		var coordBuffer = new Float32Array(classifiedTCoordByteSize);
		coordBuffer.set(texCoordDataArray);
		this.tcoordVboDataArray = coordBuffer; 
	}
	else{
		this.tcoordVboDataArray = texCoordDataArray;
	}
	//this.tcoordArrayByteSize = classifiedTCoordByteSize;
};


/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKey.prototype.deleteGlObjects = function(gl, vboMemManager) 
{
	if (this.meshVertexCacheKey) 
	{
		vboMemManager.storeClassifiedBufferKey(gl, this.meshVertexCacheKey, this.posArrayByteSize);
		this.meshVertexCacheKey = undefined;
	}
	this.posVboDataArray = undefined;

	if (this.meshNormalCacheKey) 
	{
		vboMemManager.storeClassifiedBufferKey(gl, this.meshNormalCacheKey, this.norArrayByteSize);
		this.meshNormalCacheKey = undefined;
	}
	this.norVboDataArray = undefined;

	if (this.meshColorCacheKey) 
	{
		vboMemManager.storeClassifiedBufferKey(gl, this.meshColorCacheKey, this.colArrayByteSize);
		this.meshColorCacheKey = undefined;
	}
	this.colVboDataArray = undefined;

	if (this.meshTexcoordsCacheKey) 
	{
		vboMemManager.storeClassifiedBufferKey(gl, this.meshTexcoordsCacheKey, this.tcoordArrayByteSize);
		this.meshTexcoordsCacheKey = undefined;
	}
	this.tcoordVboDataArray = undefined;

	if (this.meshFacesCacheKey) 
	{
		vboMemManager.storeClassifiedElementKey(gl, this.meshFacesCacheKey, this.idxArrayByteSize);
		this.meshFacesCacheKey = undefined;
	}
	this.idxVboDataArray = undefined;
	
	this.posArrayByteSize = undefined;
	this.norArrayByteSize = undefined;
	this.idxArrayByteSize = undefined;
	this.colArrayByteSize = undefined;
	this.tcoordArrayByteSize = undefined;

	this.buffer = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @return boolean
 */
VBOVertexIdxCacheKey.prototype.isReadyPositions = function(gl, vboMemManager) 
{
	if (this.meshVertexCacheKey === undefined) 
	{
		if (this.posVboDataArray === undefined) { return false; }
		if (this.posArrayByteSize === undefined)
		{
			this.posArrayByteSize = this.posVboDataArray.length;
		}
		this.meshVertexCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.posArrayByteSize);
		if (this.meshVertexCacheKey === undefined)
		{ return false; }
		gl.bindBuffer(gl.ARRAY_BUFFER, this.meshVertexCacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, this.posVboDataArray, gl.STATIC_DRAW);
		this.posVboDataArray = undefined;
		return true;
	}
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @return boolean
 */
VBOVertexIdxCacheKey.prototype.isReadyNormals = function(gl, vboMemManager) 
{
	if (this.meshNormalCacheKey === undefined) 
	{
		if (this.norVboDataArray === undefined) { return false; }
		if (this.norArrayByteSize === undefined)
		{
			this.norArrayByteSize = this.norVboDataArray.length;
		}

		this.meshNormalCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.norArrayByteSize);
		if (this.meshNormalCacheKey === undefined)
		{ return false; }
		gl.bindBuffer(gl.ARRAY_BUFFER, this.meshNormalCacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, this.norVboDataArray, gl.STATIC_DRAW);
		this.norVboDataArray = undefined;
		return true;
	}
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @return boolean
 */
VBOVertexIdxCacheKey.prototype.isReadyFaces = function(gl, vboMemManager) 
{
	if (this.meshFacesCacheKey === undefined) 
	{
		if (this.idxVboDataArray === undefined) { return false; }
		if (this.idxArrayByteSize === undefined)
		{
			this.idxArrayByteSize = this.idxVboDataArray.length;
		}

		this.meshFacesCacheKey = vboMemManager.getClassifiedElementKey(gl, this.idxArrayByteSize);
		if (this.meshFacesCacheKey === undefined)
		{ return false; }
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.meshFacesCacheKey);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.idxVboDataArray, gl.STATIC_DRAW);
		this.idxVboDataArray = undefined;
		return true;
	}
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @return boolean
 */
VBOVertexIdxCacheKey.prototype.isReadyTexCoords = function(gl, vboMemManager) 
{
	if (this.meshTexcoordsCacheKey === undefined) 
	{
		if (this.tcoordVboDataArray === undefined) { return false; }
		if (this.tcoordArrayByteSize === undefined)
		{
			this.tcoordArrayByteSize = this.tcoordVboDataArray.length;
		}

		this.meshTexcoordsCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.tcoordArrayByteSize);
		if (this.meshTexcoordsCacheKey === undefined)
		{ return false; }
		gl.bindBuffer(gl.ARRAY_BUFFER, this.meshTexcoordsCacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, this.tcoordVboDataArray, gl.STATIC_DRAW);
		this.tcoordVboDataArray = undefined;

		return true;
	}
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @return boolean
 */
VBOVertexIdxCacheKey.prototype.isReadyColors = function(gl, vboMemManager) 
{
	if (this.meshColorCacheKey === undefined) 
	{
		if (this.colVboDataArray === undefined) { return false; }
		if (this.colArrayByteSize === undefined)
		{
			this.colArrayByteSize = this.colVboDataArray.length;
		}
		
		this.meshColorCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.colArrayByteSize);
		if (this.meshColorCacheKey === undefined)
		{ return false; }
		gl.bindBuffer(gl.ARRAY_BUFFER, this.meshColorCacheKey);
		gl.bufferData(gl.ARRAY_BUFFER, this.colVboDataArray, gl.STATIC_DRAW);
		this.colVboDataArray = undefined;
		
		return true;
	}
	return true;
};

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












