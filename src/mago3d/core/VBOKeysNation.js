'use strict';
/**
 * 어떤 일을 하고 있습니까?
 * @class VBOKeysNation
 */
var VBOKeysNation = function(bufferSizes, minSize) 
{
	if (!(this instanceof VBOKeysNation)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// buffer sizes are in bytes.
	this.vboKeysStoreMap = {};
	this.bufferSizes = bufferSizes;
	this.minSize = minSize;
	this.maxSize = bufferSizes[bufferSizes.length-1];
	this.totalBytesUsed = 0;
	
	var vboKeysStore;
	var sizesCount = bufferSizes.length;
	for (var i=0; i<sizesCount; i++)
	{
		vboKeysStore = new VBOKeysStore(bufferSizes[i]);
		this.vboKeysStoreMap[bufferSizes[i]] = vboKeysStore;

		if (bufferSizes[i] > this.maxSize) { this.maxSize = bufferSizes[i]; }
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferKey. 
 */
VBOKeysNation.prototype.getClassifiedBufferKey = function(gl, bufferSize, keyWorld, onlyReuse) 
{
	// 1rst find the vboKeyStore for this bufferSize.
	var closestBufferSize = this.getClosestBufferSize(bufferSize);
	var vboKeyStore = this.vboKeysStoreMap[closestBufferSize];
	
	if (vboKeyStore)
	{
		return vboKeyStore.getBufferKey(gl, this, keyWorld, onlyReuse);
	}
	else { return -1; }
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferKey. 
 */
VBOKeysNation.prototype.storeClassifiedBufferKey = function(bufferKey, bufferSize) 
{
	// 1rst find the vboKeyStore for this bufferSize.
	var vboKeyStore = this.vboKeysStoreMap[bufferSize];
	if (vboKeyStore)
	{
		vboKeyStore.storeBufferKey(bufferKey);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns boolean. true if the currentBufferSize is in the range of this nation.
 */
VBOKeysNation.prototype.getClosestBufferSize = function(currentBufferSize) 
{
	if (!this.isInsideRange(currentBufferSize))
	{ return -1; }
	
	var sizesCount = this.bufferSizes.length;
	for (var i=0; i<sizesCount; i++)
	{
		if (currentBufferSize <= this.bufferSizes[i])
		{
			return this.bufferSizes[i];
		}
	}
	return -1;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns boolean. true if the currentBufferSize is in the range of this nation.
 */
VBOKeysNation.prototype.isInsideRange = function(bufferSize) 
{
	if (bufferSize > this.maxSize || bufferSize < this.minSize)
	{ return false; }

	return true;
};
