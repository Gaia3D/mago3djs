'use strict';
/**
 * 어떤 일을 하고 있습니까?
 * @class VBOKeysWorld
 * @constructor
 */
var VBOKeysWorld = function() 
{
	if (!(this instanceof VBOKeysWorld)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.totalBytesUsed = 0;
	this.bytesLimit = 1000;
	
	this.vboKeysNationsArray = [];
	this.vboKeyNation12to128 = new VBOKeysNation(new Uint32Array([12, 16, 32, 48, 64, 76, 92, 128]), 0);
	this.vboKeysNationsArray.push(this.vboKeyNation12to128);
	this.vboKeyNation200to1000 = new VBOKeysNation(new Uint32Array([200, 300, 400, 500, 600, 700, 800, 900, 1000]), 129);
	this.vboKeysNationsArray.push(this.vboKeyNation200to1000);
	this.vboKeyNation1500to6000 = new VBOKeysNation(new Uint32Array([1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000]), 1001);
	this.vboKeysNationsArray.push(this.vboKeyNation1500to6000);
	this.vboKeyNation7000to16000 = new VBOKeysNation(new Uint32Array([7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000]), 6001);
	this.vboKeysNationsArray.push(this.vboKeyNation7000to16000);
	this.vboKeyNation20000to56000 = new VBOKeysNation(new Uint32Array([20000, 24000, 28000, 32000, 36000, 40000, 44000, 48000, 52000, 56000]), 16001);
	this.vboKeysNationsArray.push(this.vboKeyNation20000to56000);
	this.vboKeyNation60000to150000 = new VBOKeysNation(new Uint32Array([60000, 70000, 80000, 90000, 100000, 110000, 120000, 130000, 140000, 150000]), 56001);
	this.vboKeysNationsArray.push(this.vboKeyNation60000to150000);
	this.vboKeyNation200000to1100000 = new VBOKeysNation(new Uint32Array([200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1100000]), 150001);
	this.vboKeysNationsArray.push(this.vboKeyNation200000to1100000);
	this.vboKeyNation1500000to3000000 = new VBOKeysNation(new Uint32Array([1500000, 2000000, 2500000, 3000000, 6000000, 12000000, 24000000, 36000000, 60000000]), 1100001);
	this.vboKeysNationsArray.push(this.vboKeyNation1500000to3000000);
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOKeysWorld.prototype.getClassifiedBufferKey = function(gl, bufferSize) 
{
	// check gpuMemory limit.
	// If current totalBytesUsed is greater than bytesLimit, then enters in mode "onlyReuse".
	// "onlyReuse" = no allocate GPU memory, only use the existent
	var onlyReuse = false;
	if (this.totalBytesUsed > this.bytesLimit)
	{
		onlyReuse = true;
	}
	
	// 1rst, find the Nation for this bufferSize.
	var keyNation = this.getKeyNationBySize(bufferSize);
	var vboBufferKey = undefined;
	if (keyNation)
	{
		vboBufferKey = keyNation.getClassifiedBufferKey(gl, bufferSize, this, onlyReuse);
	}
	return vboBufferKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOKeysWorld.prototype.storeClassifiedBufferKey = function(bufferKey, bufferSize) 
{
	// 1rst, find the Nation for this bufferSize.
	var keyNation = this.getKeyNationBySize(bufferSize);
	if (keyNation)
	{ keyNation.storeClassifiedBufferKey(bufferKey, bufferSize); }
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferCacheKey
 */
VBOKeysWorld.prototype.getKeyNationBySize = function(bufferSize) 
{
	// 1rst, find the Nation for this bufferSize.
	var nationsCount = this.vboKeysNationsArray.length;
	var i=0;
	var vboBufferKey = -1;
	while (i<nationsCount)
	{
		if (this.vboKeysNationsArray[i].isInsideRange(bufferSize))
		{
			return this.vboKeysNationsArray[i];
		}
		i++;
	}
	return vboBufferKey;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vboBufferStandardSize
 */
VBOKeysWorld.prototype.getClassifiedBufferSize = function(currentBufferSize) 
{
	// 1rst, find the Nation for this bufferSize.
	var keyNation = this.getKeyNationBySize(currentBufferSize);
	var classifiedSize = -1;

	if (keyNation !== -1)
	{ classifiedSize = keyNation.getClosestBufferSize(currentBufferSize); }
	return classifiedSize;
};
