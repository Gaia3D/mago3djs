'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Segment3D
*/
var Segment3D = function(strPoint3D, endPoint3D) 
{
	if (!(this instanceof Segment3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.startPoint3d;
	this.endPoint3d;
	
	if (strPoint3D)
	{ this.startPoint3d = strPoint3D; }
	
	if (endPoint3D)
	{ this.endPoint3d = endPoint3D; }
};

Segment3D.prototype.setPoints = function(strPoint3D, endPoint3D)
{
	if (strPoint3D)
	{ this.startPoint3d = strPoint3D; }
	
	if (endPoint3D)
	{ this.endPoint3d = endPoint3D; }
};

Segment3D.prototype.getVector = function(resultVector)
{
	if (this.startPoint3d === undefined || this.endPoint3d === undefined)
	{ return undefined; }
	
	if (resultVector === undefined)
	{ resultVector = new Point3D(); }
	
	resultVector = this.startPoint3d.getVectorToPoint(this.endPoint3d, resultVector);
	return resultVector;
};

Segment3D.prototype.getDirection = function(resultDir)
{
	if (resultDir === undefined)
	{ resultDir = new Point3D(); }
	
	resultDir = this.getVector(resultDir);
	resultDir.unitary();
	
	return resultDir;
};

Segment3D.prototype.invertSense = function()
{
	// interchange strPoint & endPoint.***
	var point3dAux = this.startPoint3d;
	this.startPoint3d = this.endPoint3d;
	this.endPoint3d = point3dAux;
};