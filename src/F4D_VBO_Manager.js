


var f4d_vbo_manager = function()
{
	
};

// VBO VertexIdxCacheKeys.*************************************************************************************************** //
var VBO_VertexIdxCacheKey = function()
{
    this.indices_count = -1;
  
    this.MESH_VERTEX_cacheKey= null;
    this.MESH_FACES_cacheKey= null;
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
    this.MESH_COLORS_cacheKey= null;
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