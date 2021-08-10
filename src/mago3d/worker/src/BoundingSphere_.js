'use strict';

var BoundingSphere_ = function(x, y, z, radius) 
{
	this.centerPoint = new Point3D_();
	if (x !== undefined && y !== undefined && z !== undefined)
	{ this.centerPoint.set(x, y, z); }
	this.r = 0.0;
	if (radius !== undefined)
	{ this.r = radius; }
};

BoundingSphere_.prototype.setRadius = function(radius) 
{
	this.r = radius;
};

BoundingSphere_.prototype.setCenterPoint = function(x, y, z) 
{
	this.centerPoint.set(x, y, z);
};