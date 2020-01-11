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

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
BoundingSphere.prototype.getCenterPoint = function() 
{
	return this.centerPoint;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
BoundingSphere.prototype.setCenterPoint = function(x, y, z) 
{
	this.centerPoint.set(x, y, z);
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
BoundingSphere.prototype.getRadius = function() 
{
	return this.r;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
BoundingSphere.prototype.setRadius = function(radius) 
{
	this.r = radius;
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

BoundingSphere.prototype.copyFrom = function(bSphere) 
{
	this.centerPoint.copyFrom(bSphere.centerPoint);
	this.r = bSphere.r;
};

BoundingSphere.prototype.addBSphere = function(bSphere) 
{
	// must know if any sphere is inside of the other sphere.
	var intersectionType = this.intersectsWithBSphere(bSphere);
	
	if (intersectionType === Constant.INTERSECTION_INSIDE)
	{
		if (this.r < bSphere.r)
		{
			// copy from the bSphere.
			this.copyFrom(bSphere);
		}
	}
	else
	{
		// Calculate the extreme segment from this center to bSphere's center.
		var dir = this.centerPoint.getVectorToPoint(bSphere.centerPoint, undefined);
		dir.unitary();
		
		// find my extreme point.
		var extremePoint1 = new Point3D(this.centerPoint.x - dir.x * this.r, this.centerPoint.y - dir.y * this.r, this.centerPoint.z - dir.z * this.r);
		
		// find the extreme point of bSphere.
		var extremePoint2 = new Point3D(bSphere.centerPoint.x + dir.x * bSphere.r, bSphere.centerPoint.y + dir.y * bSphere.r, bSphere.centerPoint.z + dir.z * bSphere.r);
		
		// the new center of this is in the center of the extreme points.
		var x = (extremePoint1.x + extremePoint2.x)/2.0;
		var y = (extremePoint1.y + extremePoint2.y)/2.0;
		var z = (extremePoint1.z + extremePoint2.z)/2.0;
		this.centerPoint.set(x, y, z);
		
		// the new radius is the extremePoints half distance.
		this.r = 0.5 * extremePoint1.distToPoint(extremePoint2);
	}
};










































