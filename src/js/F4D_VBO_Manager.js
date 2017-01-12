/**
 * 어떤 일을 하고 있습니까?
 */
var f4d_vbo_manager = function() {
};

/**
 * 어떤 일을 하고 있습니까?
 */
var F4D_Buffer = function() {
	this.dataArray = undefined;
	this.dataArray_byteLength = 0;
};

// VBO VertexIdxCacheKeys.*************************************************************************************************** //
/**
 * 어떤 일을 하고 있습니까?
 */
var VBO_VertexIdxCacheKey = function() {
    this.indices_count = -1;
  
    this.MESH_VERTEX_cacheKey = null;
    this.MESH_FACES_cacheKey = null;
	this.MESH_NORMAL_cacheKey = null;
	this.MESH_COLOR_cacheKey = null;
	this.MESH_TEXCOORDS_cacheKey = null;
	
	this.pos_vboDataArray = undefined; // to store data here, and when necessary bind to gl.***
	this.nor_vboDataArray = undefined; // to store data here, and when necessary bind to gl.***
	this.idx_vboDataArray = undefined; // to store data here, and when necessary bind to gl.***
	this.col_vboDataArray = undefined; // to store data here, and when necessary bind to gl.***
	this.tcoord_vboDataArray = undefined; // to store data here, and when necessary bind to gl.***
	
	this.buffer = undefined;// provisionally put this here.***
};

// VBO VertexIdxCacheKeysContainer.****************************************************************************************** //
/**
 * 어떤 일을 하고 있습니까?
 */
var VBO_VertexIdxCacheKeys_Container = function() {
    this._vbo_cacheKeysArray = [];
}; 

/**
 * 어떤 일을 하고 있습니까?
 */
VBO_VertexIdxCacheKeys_Container.prototype.new_VBO_VertexIdxCacheKey = function() {
    var vbo_VIcacheKey = new VBO_VertexIdxCacheKey();
    this._vbo_cacheKeysArray.push(vbo_VIcacheKey);
    return vbo_VIcacheKey;
};

// VBO ByteColorCacheKey.**************************************************************************************************** //
/**
 * 어떤 일을 하고 있습니까?
 */
VBO_ByteColorCacheKey = function() {
    this.MESH_COLORS_cacheKey = null;
	this.MESH_TEXCOORDS_cacheKey = null;
};

// VBO_ByteColorCacheKeys_Container ***************************************************************************************** //
/**
 * 어떤 일을 하고 있습니까?
 */
var VBO_ByteColorCacheKeys_Container = function() {
    this._vbo_byteColors_cacheKeysArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 */
VBO_ByteColorCacheKeys_Container.prototype.new_VBO_ByteColorsCacheKey = function() {
    var vbo_byteCol_cacheKey = new VBO_ByteColorCacheKey();
    this._vbo_byteColors_cacheKeysArray.push(vbo_byteCol_cacheKey);
    return vbo_byteCol_cacheKey;
};
  
//******************************************************************************************************************************

//# sourceURL=f4d_vbo_manager.js