'use strict';

/**
 * @class MgMesh
 * @constructor 
 */
var MgMesh = function (options) 
{
	if (!(this instanceof MgMesh)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.mgOwner;
	this.primitives = [];
	this.name = undefined;

	if (options)
	{
		if (options.mgOwner)
		{
			this.mgOwner = options.mgOwner;
		}
	}
};