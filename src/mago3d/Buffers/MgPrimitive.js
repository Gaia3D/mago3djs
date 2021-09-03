'use strict';

/**
 * @class MgPrimitive
 * @constructor 
 */
var MgPrimitive = function (options) 
{
	if (!(this instanceof MgPrimitive)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	//this.glAttributes = [];
	this.mgOwner;
	this.mgBufferViewSet;
	this.mgBufferDataSet; // Old. delete this.!!!

	if (options)
	{
		if (options.mgOwner)
		{
			this.mgOwner = options.mgOwner;
		}
	}
};