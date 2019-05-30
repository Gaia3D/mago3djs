'use strict';


/**
 * This class is the container which holds the VBO Cache Keys
 * @class VBOVertexIdxCacheKeysContainer
 */
var VBOVertexIdxCacheKeysContainer = function() 
{
	if (!(this instanceof VBOVertexIdxCacheKeysContainer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.vboCacheKeysArray = []; //the container of vbo keys
};

/**
 * Create the default VBO instance
 * @returns {VBOVertexIdxCacheKey} vboVertexIdxCacheKey
 */
VBOVertexIdxCacheKeysContainer.prototype.newVBOVertexIdxCacheKey = function() 
{
	if (this.vboCacheKeysArray === undefined)
	{ this.vboCacheKeysArray = []; }
	
	var vboVertexIdxCacheKey = new VBOVertexIdxCacheKey();
	this.vboCacheKeysArray.push(vboVertexIdxCacheKey);
	return vboVertexIdxCacheKey;
};

/**
 * Clear the data of this instance
 * @param gl
 * @param {VBOMemoryManager} vboMemManager
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
 * 
 * @returns {Number} the number of the key that this instance holds
 */
VBOVertexIdxCacheKeysContainer.prototype.getVbosCount = function() 
{
	if (this.vboCacheKeysArray === undefined) { return 0; }
	
	return this.vboCacheKeysArray.length;
};

/**
 * Get the VBO key by the index
 * @param {Number} idx
 * @return {VBOVertexIdxCacheKey}
 *  */
VBOVertexIdxCacheKeysContainer.prototype.getVboKey = function(idx) 
{
	if (this.vboCacheKeysArray === undefined)
	{ return undefined; }
	
	var vbo = this.vboCacheKeysArray[idx];
	return vbo;
};
