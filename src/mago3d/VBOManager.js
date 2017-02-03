'use strict';

/**
 * 어떤 일을 하고 있습니까?
 */
var VBOManager = function() {
	if(!(this instanceof VBOManager)) {
		throw new Error(MESSAGES.classNewError);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 */
var Buffer = function() {
	this.dataArray;
	this.dataArray_byteLength = 0;
};

/**
 * 어떤 일을 하고 있습니까?
 */
var VBOVertexIdxCacheKey = function() {
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
 */
var VBOVertexIdxCacheKeysContainer = function() {
	this._vbo_cacheKeysArray = [];
}; 

/**
 * 어떤 일을 하고 있습니까?
 * @returns vbo_VIcacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.new_VBO_VertexIdxCacheKey = function() {
	var vbo_VIcacheKey = new VBOVertexIdxCacheKey();
	this._vbo_cacheKeysArray.push(vbo_VIcacheKey);
	return vbo_VIcacheKey;
};

/**
 * 어떤 일을 하고 있습니까?
 */
var VBOByteColorCacheKey = function() {
    this.MESH_COLORS_cacheKey = null;
	this.MESH_TEXCOORDS_cacheKey = null;
};

/**
 * 어떤 일을 하고 있습니까?
 */
var VBOByteColorCacheKeysContainer = function() {
    this._vbo_byteColors_cacheKeysArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @return vbo_byteCol_cacheKey
 */
VBOByteColorCacheKeysContainer.prototype.new_VBO_ByteColorsCacheKey = function() {
    var vbo_byteCol_cacheKey = new VBOByteColorCacheKey();
    this._vbo_byteColors_cacheKeysArray.push(vbo_byteCol_cacheKey);
    return vbo_byteCol_cacheKey;
};
