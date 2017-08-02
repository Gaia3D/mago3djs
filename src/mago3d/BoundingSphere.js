'use strict';

/**
 * 영역 박스
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