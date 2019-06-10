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
	this.gl;
	
	// if "enableMemoryManagement" == false -> no management of the gpu memory.
	this.enableMemoryManagement = false;
	
	this.buffersKeyWorld = new VBOKeysWorld();
	this.elementKeyWorld = new VBOKeysWorld();
	
	this.buffersKeyWorld.bytesLimit = 800000000;
	this.elementKeyWorld.bytesLimit = 300000000;
	
	this.currentMemoryUsage = 0.0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOMemoryManager.prototype.isGpuMemFull = function() 
{
	if (this.buffersKeyWorld.totalBytesUsed > this.buffersKeyWorld.bytesLimit || this.elementKeyWorld.totalBytesUsed > this.elementKeyWorld.bytesLimit)
	{ return true; }
	else { return false; }
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOMemoryManager.prototype.getClassifiedBufferKey = function(gl, bufferSize) 
{
	if (this.enableMemoryManagement)
	{ 
		var bufferKey = this.buffersKeyWorld.getClassifiedBufferKey(gl, bufferSize);
		if (bufferKey !== undefined)
		{ this.currentMemoryUsage += bufferSize; }
		return bufferKey; 
	}
	else
	{ 
		this.currentMemoryUsage += bufferSize;
		return gl.createBuffer(); 
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOMemoryManager.prototype.storeClassifiedBufferKey = function(gl, bufferKey, bufferSize) 
{
	if (this.enableMemoryManagement)
	{ this.buffersKeyWorld.storeClassifiedBufferKey(bufferKey, bufferSize); }
	else
	{ gl.deleteBuffer(bufferKey); }

	this.currentMemoryUsage -= bufferSize;
	if (this.currentMemoryUsage < 0.0)
	{ this.currentMemoryUsage = 0.0; }
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOMemoryManager.prototype.getClassifiedElementKey = function(gl, bufferSize) 
{
	if (this.enableMemoryManagement)
	{ return this.elementKeyWorld.getClassifiedBufferKey(gl, bufferSize); }
	else
	{ return gl.createBuffer(); }
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOMemoryManager.prototype.storeClassifiedElementKey = function(gl, bufferKey, bufferSize) 
{
	if (this.enableMemoryManagement)
	{ this.elementKeyWorld.storeClassifiedBufferKey(bufferKey, bufferSize); }
	else
	{ gl.deleteBuffer(bufferKey); }
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferStandardSize
 */
VBOMemoryManager.prototype.getClassifiedBufferSize = function(currentBufferSize) 
{
	if (this.enableMemoryManagement)
	{ return this.buffersKeyWorld.getClassifiedBufferSize(currentBufferSize); } 
	else
	{ return currentBufferSize; }
};