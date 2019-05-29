'use strict';

/**
 * This class is needed to be implemented at the future. not yet implemented fully.
 * @class BoundingSphere
 */
var BoundingSphere = function() 
{
	if (!(this instanceof BoundingSphere)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.center = new Point3D();
	this.radius = 0.0;
};