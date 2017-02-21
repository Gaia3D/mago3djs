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
	this.dataArray_byteLength = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOVertexIdxCacheKey
 */
var VBOVertexIdxCacheKey = function() {
	if(!(this instanceof VBOVertexIdxCacheKey)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.indices_count = -1;
    
	this.MESH_VERTEX_cacheKey = null;
	this.MESH_FACES_cacheKey = null;
	this.MESH_NORMAL_cacheKey = null;
	this.MESH_COLOR_cacheKey = null;
	this.MESH_TEXCOORDS_cacheKey = null;
	
	this.pos_vboDataArray; // to store data here, and when necessary bind to gl.***
	this.nor_vboDataArray; // to store data here, and when necessary bind to gl.***
	this.idx_vboDataArray; // to store data here, and when necessary bind to gl.***
	this.col_vboDataArray; // to store data here, and when necessary bind to gl.***
	this.tcoord_vboDataArray; // to store data here, and when necessary bind to gl.***
	
	this.buffer;// provisionally put this here.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOVertexIdxCacheKeysContainer
 */
var VBOVertexIdxCacheKeysContainer = function() {
	if(!(this instanceof VBOVertexIdxCacheKeysContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._vbo_cacheKeysArray = [];
}; 

/**
 * 어떤 일을 하고 있습니까?
 * @memberof VBOVertexIdxCacheKeysContainer
 * @returns vbo_VIcacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.newVBOVertexIdxCacheKey = function() {
	var vbo_VIcacheKey = new VBOVertexIdxCacheKey();
	this._vbo_cacheKeysArray.push(vbo_VIcacheKey);
	return vbo_VIcacheKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOByteColorCacheKey
 */
var VBOByteColorCacheKey = function() {
	if(!(this instanceof VBOByteColorCacheKey)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
    this.MESH_COLORS_cacheKey = null;
	this.MESH_TEXCOORDS_cacheKey = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOByteColorCacheKeysContainer
 */
var VBOByteColorCacheKeysContainer = function() {
	if(!(this instanceof VBOByteColorCacheKeysContainer)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
    this._vbo_byteColors_cacheKeysArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof VBOByteColorCacheKeysContainer
 * @return vbo_byteCol_cacheKey
 */
VBOByteColorCacheKeysContainer.prototype.newVBOByteColorsCacheKey = function() {
    var vbo_byteCol_cacheKey = new VBOByteColorCacheKey();
    this._vbo_byteColors_cacheKeysArray.push(vbo_byteCol_cacheKey);
    return vbo_byteCol_cacheKey;
};
