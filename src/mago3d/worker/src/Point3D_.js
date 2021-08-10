'use strict';

var Point3D_ = function(x, y, z) 
{
	if (x !== undefined)
	{ this.x = x; }
	else
	{ this.x = 0.0; }
	
	if (y !== undefined)
	{ this.y = y; }
	else
	{ this.y = 0.0; }
	
	if (z !== undefined)
	{ this.z = z; }
	else
	{ this.z = 0.0; }
	
	this.pointType; // 1 = important point.
};

Point3D_.prototype.set = function(x, y, z) 
{
	this.x = x; this.y = y; this.z = z;
};

Point3D_.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y + this.z*this.z;
};

Point3D_.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

Point3D_.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	// this returns a vector that points to "targetPoint" from "this".
	// the "resultVector" has the direction from "this" to "targetPoint", but is NOT normalized.
	if (targetPoint === undefined)
	{ return undefined; }
	
	if (resultVector === undefined)
	{ resultVector = new Point3D_(); }
	
	resultVector.set(targetPoint.x - this.x, targetPoint.y - this.y, targetPoint.z - this.z);
	
	return resultVector;
};

Point3D_.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
};

Point3D_.prototype.crossProduct = function(point, resultPoint) 
{
	if (resultPoint === undefined) { resultPoint = new Point3D_(); }

	resultPoint.x = this.y * point.z - point.y * this.z;
	resultPoint.y = point.x * this.z - this.x * point.z;
	resultPoint.z = this.x * point.y - point.x * this.y;

	return resultPoint;
};

Point3D_.prototype.squareDistTo = function(x, y, z) 
{
	var dx = this.x - x;
	var dy = this.y - y;
	var dz = this.z - z;

	return dx*dx + dy*dy + dz*dz;
};

Point3D_.prototype.squareDistToPoint = function(point) 
{
	var dx = this.x - point.x;
	var dy = this.y - point.y;
	var dz = this.z - point.z;

	return dx*dx + dy*dy + dz*dz;
};

Point3D_.prototype.distTo = function(x, y, z) 
{
	return Math.sqrt(this.squareDistTo(x, y, z));
};

Point3D_.prototype.distToPoint = function(point) 
{
	return Math.sqrt(this.squareDistToPoint(point));
};

Point3D_.prototype.isCoincidentToPoint = function(point, errorDist) 
{
	var dist = this.distToPoint(point);
	var coincident = false;
	if (dist < errorDist)
	{
		coincident = true;
	}

	return coincident;
};