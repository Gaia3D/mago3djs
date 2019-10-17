'use strict';

/**
 * This class is needed to be implemented at the future. not yet implemented fully.
 * @class BoundingSphere
 */
var BoundingSphere = function(x, y, z, radius) 
{
	if (!(this instanceof BoundingSphere)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.centerPoint = new Point3D();
	if (x !== undefined && y !== undefined && z !== undefined)
	{ this.centerPoint.set(x, y, z); }
	this.r = 0.0;
	if (radius !== undefined)
	{ this.r = radius; }
};

BoundingSphere.prototype.intersectsWithBSphere = function(bSphere) 
{
	if (bSphere === undefined)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	var dist = this.centerPoint.distToPoint(bSphere.centerPoint);
	if (dist < this.r)
	{
		return Constant.INTERSECTION_INSIDE;
	}
	else if (dist < bSphere.r)
	{
		return Constant.INTERSECTION_INSIDE;
	}
	else if (dist < (this.r + bSphere.r))
	{
		return Constant.INTERSECTION_INTERSECT;
	}
	
	return Constant.INTERSECTION_OUTSIDE;
};