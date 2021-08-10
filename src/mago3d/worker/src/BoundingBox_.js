'use strict';

var BoundingBox_ = function() 
{
	this.minX = 1000000.0;
	this.minY = 1000000.0;
	this.minZ = 1000000.0;

	this.maxX = -1000000.0;
	this.maxY = -1000000.0;
	this.maxZ = -1000000.0;
};

BoundingBox_.prototype.init = function(point) 
{
	point = point || new Point3D_();

	this.minX = point.x;
	this.minY = point.y;
	this.minZ = point.z;

	this.maxX = point.x;
	this.maxY = point.y;
	this.maxZ = point.z;
};

BoundingBox_.prototype.addPoint = function(point) 
{
	if (point === undefined)	{ return; }

	if (point.x < this.minX) { this.minX = point.x; }
	else if (point.x > this.maxX) { this.maxX = point.x; }

	if (point.y < this.minY) { this.minY = point.y; }
	else if (point.y > this.maxY) { this.maxY = point.y; }

	if (point.z < this.minZ) { this.minZ = point.z; }
	else if (point.z > this.maxZ) { this.maxZ = point.z; }
};

BoundingBox_.prototype.getCenterPoint = function(result) 
{
	if ( result === undefined ) { result = new Point3D_(); }
	result.set((this.maxX + this.minX)/2, (this.maxY + this.minY)/2, (this.maxZ + this.minZ)/2);
	return result;
};

BoundingBox_.prototype.getMaxLength = function() 
{
	return Math.max(this.maxX - this.minX, this.maxY - this.minY, this.maxZ - this.minZ);
};

BoundingBox_.prototype.getRadiusAprox = function() 
{
	var maxLength = this.getMaxLength();
	return maxLength/1.5;
};

BoundingBox_.prototype.getBoundingSphere = function(resultBoundingSphere) 
{
	if (resultBoundingSphere === undefined)
	{ resultBoundingSphere = new BoundingSphere_(); } 
	
	var centerPos = this.getCenterPoint();
	resultBoundingSphere.setCenterPoint(centerPos.x, centerPos.y, centerPos.z);
	resultBoundingSphere.setRadius(this.getRadiusAprox());
	
	return resultBoundingSphere;
};