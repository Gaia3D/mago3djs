'use strict';

var Segment3D_ = function(strPoint3D, endPoint3D) 
{
	this.startPoint3d;
	this.endPoint3d;
	
	if (strPoint3D)
	{
		this.startPoint3d = strPoint3D;
	}
	
	if (endPoint3D)
	{
		this.endPoint3d = endPoint3D;
	}
};

Segment3D_.prototype.setPoints = function(strPoint3D, endPoint3D)
{
	if (strPoint3D)
	{
		this.startPoint3d = strPoint3D;
	}
	
	if (endPoint3D)
	{
		this.endPoint3d = endPoint3D;
	}
};

Segment3D_.prototype.getVector = function(result)
{
	if (this.startPoint3d === undefined || this.endPoint3d === undefined)
	{
		return undefined;
	}
	
	if (result === undefined)
	{
		result = new Point3D_();
	}
	
	result = this.startPoint3d.getVectorToPoint(this.endPoint3d, result);
	return result;
};

Segment3D_.prototype.getDirection = function(result)
{
	if (result === undefined)
	{
		result = new Point3D_();
	}
	
	result = this.getVector(result);
	result.unitary();
	
	return result;
};

Segment3D_.prototype.getLine = function(resultLine)
{
	if (resultLine === undefined)
	{ resultLine = new Line_(); }
	
	var direction = this.getDirection();
	resultLine.setPointAndDir(this.startPoint3d.x, this.startPoint3d.y, this.startPoint3d.z, direction.x, direction.y, direction.z);
	
	return resultLine;
};

Segment3D_.prototype.getLength = function()
{
	return this.startPoint3d.distToPoint(this.endPoint3d);
};

Segment3D_.prototype.intersectionWithPoint = function(point, error)
{
	if (point === undefined)
	{ return false; }
	
	// calculate the distance.
	if (error === undefined)
	{ error = 10E-8; }
	
	var totalLength = this.getLength();
	var distA = this.startPoint3d.distToPoint(point);
	var distB = this.endPoint3d.distToPoint(point);
	
	var diff = totalLength - distA - distB;
	if (Math.abs(diff) < error)
	{ return true; }
	
	return false;
};