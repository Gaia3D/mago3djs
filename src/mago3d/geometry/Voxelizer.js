'use strict';
/**
 * Voxelizer. Voxelizes a region of the scene.
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Voxelizer
 * @constructor
 * 
 */
var Voxelizer = function(mageManager, options) 
{
	if (!(this instanceof Voxelizer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.magoManager = mageManager;
    
};