


var f4d_vbo_manager = function()
{
	
};

var F4D_Buffer = function()
{
	this.dataArray = undefined;
	this.dataArray_byteLength = 0;
};

// VBO VertexIdxCacheKeys.*************************************************************************************************** //
var VBO_VertexIdxCacheKey = function()
{
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
var VBO_VertexIdxCacheKeys_Container = function()
{
    this._vbo_cacheKeysArray = [];
}; 

VBO_VertexIdxCacheKeys_Container.prototype.new_VBO_VertexIdxCacheKey = function()
{
    var vbo_VIcacheKey = new VBO_VertexIdxCacheKey();
    this._vbo_cacheKeysArray.push(vbo_VIcacheKey);
    return vbo_VIcacheKey;
  
};

// VBO ByteColorCacheKey.**************************************************************************************************** //
VBO_ByteColorCacheKey = function()
{
    this.MESH_COLORS_cacheKey = null;
	this.MESH_TEXCOORDS_cacheKey = null;
};

// VBO_ByteColorCacheKeys_Container ***************************************************************************************** //
var VBO_ByteColorCacheKeys_Container = function()
{
    this._vbo_byteColors_cacheKeysArray = [];
};

VBO_ByteColorCacheKeys_Container.prototype.new_VBO_ByteColorsCacheKey = function()
{
    var vbo_byteCol_cacheKey = new VBO_ByteColorCacheKey();
    this._vbo_byteColors_cacheKeysArray.push(vbo_byteCol_cacheKey);
    return vbo_byteCol_cacheKey;
};
  
//******************************************************************************************************************************

  
  

//# sourceURL=f4d_vbo_manager.js