'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOManager
 */
var VBOManager = function() {
	if(!(this instanceof VBOManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Buffer
 */
var Buffer = function() {
	if(!(this instanceof Buffer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.dataArray;
	this.dataArrayByteLength = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOVertexIdxCacheKey
 */
var VBOVertexIdxCacheKey = function() {
	if(!(this instanceof VBOVertexIdxCacheKey)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.indicesCount = -1;
	this.vertexCount = -1;
	this.bigTrianglesIndicesCount = -1;

	this.meshVertexCacheKey = null;
	this.meshFacesCacheKey = null;
	this.meshNormalCacheKey = null;
	this.meshColorCacheKey = null;
	this.meshTexcoordsCacheKey = null;

	this.posVboDataArray; // to store data here, and when necessary bind to gl.***
	this.norVboDataArray; // to store data here, and when necessary bind to gl.***
	this.idxVboDataArray; // to store data here, and when necessary bind to gl.***
	this.colVboDataArray; // to store data here, and when necessary bind to gl.***
	this.tcoordVboDataArray; // to store data here, and when necessary bind to gl.***

	this.buffer;// provisionally put this here.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKey.prototype.deleteGlObjects = function(gl) {

	if(this.meshVertexCacheKey) {
		gl.deleteBuffer(this.meshVertexCacheKey);
		this.meshVertexCacheKey = undefined;
	}
	this.posVboDataArray = undefined;

	if(this.meshNormalCacheKey) {
		gl.deleteBuffer(this.meshNormalCacheKey);
		this.meshNormalCacheKey = undefined;
	}
	this.norVboDataArray = undefined;

	if(this.meshColorCacheKey) {
		gl.deleteBuffer(this.meshColorCacheKey);
		this.meshColorCacheKey = undefined;
	}
	this.colVboDataArray = undefined;

	if(this.meshTexcoordsCacheKey) {
		gl.deleteBuffer(this.meshTexcoordsCacheKey);
		this.meshTexcoordsCacheKey = undefined;
	}
	this.tcoordVboDataArray = undefined;

	if(this.meshFacesCacheKey) {
		gl.deleteBuffer(this.meshFacesCacheKey);
		this.meshFacesCacheKey = undefined;
	}
	this.idxVboDataArray = undefined;

	this.buffer = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOVertexIdxCacheKeysContainer
 */
var VBOVertexIdxCacheKeysContainer = function() {
	if(!(this instanceof VBOVertexIdxCacheKeysContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vboCacheKeysArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.newVBOVertexIdxCacheKey = function() {
	var vboViCacheKey = new VBOVertexIdxCacheKey();
	this.vboCacheKeysArray.push(vboViCacheKey);
	return vboViCacheKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboViCacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.deleteGlObjects = function(gl) {
	var vboDatasCount = this.vboCacheKeysArray.length;
	for(var j = 0; j < vboDatasCount; j++) {

		this.vboCacheKeysArray[j].deleteGlObjects(gl);
		this.vboCacheKeysArray[j] = undefined;
	}
	this.vboCacheKeysArray.length = 0;
	this.vboCacheKeysArray = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOByteColorCacheKey
 */
var VBOByteColorCacheKey = function() {
	if(!(this instanceof VBOByteColorCacheKey)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.meshColorsCacheKey = null;
	this.meshTexcoordsCacheKey = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOByteColorCacheKeysContainer
 */
var VBOByteColorCacheKeysContainer = function() {
	if(!(this instanceof VBOByteColorCacheKeysContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vboByteColorsCacheKeysArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @return vboByteColCacheKey
 */
VBOByteColorCacheKeysContainer.prototype.newVBOByteColorsCacheKey = function() {
	var vboByteColCacheKey = new VBOByteColorCacheKey();
	this.vboByteColorsCacheKeysArray.push(vboByteColCacheKey);
	return vboByteColCacheKey;
};
