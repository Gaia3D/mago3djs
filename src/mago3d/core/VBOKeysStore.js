'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class VBOKeysStore
 */
var VBOKeysStore = function(bufferSize) 
{
	if (!(this instanceof VBOKeysStore)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.classifiedSize = bufferSize;
	this.vboKeysArray = [];
	this.keysCreated = 0; // total keys created for this size.
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns boolean. 
 */
VBOKeysStore.prototype.getBufferKey = function(gl, keyNation, keyWorld, onlyReuse) 
{
	if (this.vboKeysArray.length > 0)
	{
		var vboKey = this.vboKeysArray.pop();
		return vboKey;
	}
	else 
	{
		if (!onlyReuse)
		{
			// there are no free key, so create one.
			var vboKey = gl.createBuffer();
			this.keysCreated += 1; // increment key created counter.
			keyNation.totalBytesUsed += this.classifiedSize;
			keyWorld.totalBytesUsed += this.classifiedSize;
			return vboKey;
		}
		return undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns boolean. 
 */
VBOKeysStore.prototype.storeBufferKey = function(bufferKey) 
{
	this.vboKeysArray.push(bufferKey);
};
