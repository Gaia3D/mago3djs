'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Sphere
 */
var Sphere = function() 
{
	if (!(this instanceof Sphere)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.r = 0.0;
	this.centerPoint = new Point3D();
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.setCenterPoint = function(x, y, z) 
{
	this.centerPoint.set(x, y, z);
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.setRadius = function(radius) 
{
	this.r = radius;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Sphere.prototype.deleteObjects = function() 
{
	this.r = undefined;
	this.centerPoint.deleteObjects();
	this.centerPoint = undefined;
};