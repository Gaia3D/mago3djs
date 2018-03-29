'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Segment2D
*/
var Segment2D = function(strPoint2D, endPoint2D) 
{
	if (!(this instanceof Segment2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.startPoint2d;
	this.endPoint2d;
	
	if(strPoint2D)
		this.startPoint2d = strPoint2D;
	
	if(endPoint2D)
		this.endPoint2d = endPoint2D;
};

Segment2D.prototype.setPoints = function(strPoint2D, endPoint2D)
{
	if(strPoint2D)
		this.startPoint2d = strPoint2D;
	
	if(endPoint2D)
		this.endPoint2d = endPoint2D;
};

Segment2D.prototype.getVector = function(resultVector)
{
	if(this.startPoint2d === undefined || this.endPoint2d === undefined)
		return undefined;
	
	if(resultVector === undefined)
		resultVector = new Point2D();
	
	resultVector = this.startPoint2d.getVectorToPoint(this.endPoint2d, resultVector);
	return resultVector;
};

Segment2D.prototype.getDirection = function(resultDir)
{
	if(resultDir === undefined)
		resultDir = new Point2D();
	
	resultDir = this.getVector(resultDir);
	resultDir.unitary();
	
	return resultDir;
};