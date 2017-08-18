'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOMemoryManager
 */
var VBOMemoryManager = function() 
{
	if (!(this instanceof VBOMemoryManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.memoryPool = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOMemoryManager.prototype.getBufferCacheKey = function(gl, buffer) 
{
	
};