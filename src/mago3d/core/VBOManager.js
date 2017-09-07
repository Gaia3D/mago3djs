'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOManager
 */
var VBOManager = function() 
{
	if (!(this instanceof VBOManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Buffer
 */
var Buffer = function() 
{
	if (!(this instanceof Buffer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.dataArray;
	this.dataArrayByteLength = 0;
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

	this.meshVertexCacheKey;
	this.meshFacesCacheKey;
	this.meshNormalCacheKey;
	this.meshColorCacheKey;
	this.meshTexcoordsCacheKey;

	this.posVboDataArray; // to store data here, and when necessary bind to gl and delete it.***
	this.norVboDataArray; // to store data here, and when necessary bind to gl and delete it.***
	this.idxVboDataArray; // to store data here, and when necessary bind to gl and delete it.***
	this.colVboDataArray; // to store data here, and when necessary bind to gl and delete it.***
	this.tcoordVboDataArray; // to store data here, and when necessary bind to gl and delete it.***
	
	this.posArrayByteSize;
	this.norArrayByteSize;
	this.idxArrayByteSize;
	this.colArrayByteSize;
	this.tcoordArrayByteSize;

	this.buffer;// delete this. provisionally put this here.***
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
		
		this.meshVertexCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.posArrayByteSize);
		if (this.meshVertexCacheKey == undefined)
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

		this.meshNormalCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.norArrayByteSize);
		if (this.meshNormalCacheKey == undefined)
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

		this.meshFacesCacheKey = vboMemManager.getClassifiedElementKey(gl, this.idxArrayByteSize);
		if (this.meshFacesCacheKey == undefined)
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

		this.meshTexcoordsCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.tcoordArrayByteSize);
		if (this.meshTexcoordsCacheKey == undefined)
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
		
		this.meshColorCacheKey = vboMemManager.getClassifiedBufferKey(gl, this.colArrayByteSize);
		if (this.meshColorCacheKey == undefined)
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
 * @class VBOByteColorCacheKey
 */
var VBOByteColorCacheKey = function() 
{
	if (!(this instanceof VBOByteColorCacheKey)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.meshColorsCacheKey = null;
	this.meshTexcoordsCacheKey = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOByteColorCacheKeysContainer
 */
var VBOByteColorCacheKeysContainer = function() 
{
	if (!(this instanceof VBOByteColorCacheKeysContainer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vboByteColorsCacheKeysArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @return vboByteColCacheKey
 */
VBOByteColorCacheKeysContainer.prototype.newVBOByteColorsCacheKey = function() 
{
	var vboByteColCacheKey = new VBOByteColorCacheKey();
	this.vboByteColorsCacheKeysArray.push(vboByteColCacheKey);
	return vboByteColCacheKey;
};










