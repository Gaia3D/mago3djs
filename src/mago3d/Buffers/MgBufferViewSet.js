'use strict';

/**
 * @class MgBufferViewSet
 * @constructor 
 */
var MgBufferViewSet = function (options) 
{
	if (!(this instanceof MgBufferViewSet)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.mgOwner;
	this.bufferViewsMap = {};
	this.materialId;

	if (options)
	{
		if (options.mgOwner)
		{
			this.mgOwner = options.mgOwner;
		}
	}
    
};

MgBufferViewSet.prototype.getMgBufferView = function (attributeName)
{
	return this.bufferViewsMap[attributeName];
};

MgBufferViewSet.prototype.getOrNewMgBufferView = function(attributeName)
{
	if (!this.bufferViewsMap[attributeName])
	{
		this.bufferViewsMap[attributeName] = new MgBufferView({mgOwner: this});
	}

	return this.bufferViewsMap[attributeName];
};

