'use strict';

/**
 * @class MgNode
 * @constructor 
 */
var MgNode = function () 
{
	if (!(this instanceof MgNode)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.children = [];
	this.geoLocDataManager; // position, rotation, scale, etc.
	this.name = undefined;
	//this.mesh = undefined;
	this.mgMeshArray = [];
};