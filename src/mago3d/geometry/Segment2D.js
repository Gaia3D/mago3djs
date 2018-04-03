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

Segment2D.prototype.getBoundaryRectangle = function(resultBRect)
{
	if(resultBRect === undefined)
		resultBRect = new BoundaryRectangle();
	
	resultBRect.setInit(this.startPoint2d);
	resultBRect.addPoint(this.endPoint2d);
	
	return resultBRect;
};

Segment2D.prototype.getLine = function(resultLine)
{
	if(resultLine === undefined)
		resultLine = new Line2D();
	
	var dir = this.getDirection(); // unitary direction.***
	var strPoint = this.startPoint2d;
	resultLine.setPointAndDir(strPoint.x, strPoint.y, dir.x, dir.y);
	return resultLine;
};

Segment2D.prototype.getSquaredLength = function()
{
	return this.startPoint2d.squareDistToPoint(this.endPoint2d);
};

Segment2D.prototype.getLength = function()
{
	return Math.sqrt(this.getSquaredLength());
};

Segment2D.prototype.intersectionWithPointByDistances = function(point, error)
{
	if(point === undefined)
		return undefined;
	
	if(error === undefined)
		error = 10E-8;
	
	// here no check line-point coincidance.***
	
	// now, check if is inside of the segment or if is coincident with any vertex of segment.***
	var distA = this.startPoint2d.distToPoint(point);
	var distB = this.endPoint2d.distToPoint(point);
	var distTotal = this.getLength();
	
	if(distA < error)
		return Constant.INTERSECTION_POINT_A;
	
	if(distB < error)
		return Constant.INTERSECTION_POINT_B;
	
	if(distA> distTotal || distB> distTotal)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	if(Math.abs(distA + distB - distTotal) < error)
		return Constant.INTERSECTION_INSIDE;
};

Segment2D.prototype.intersectionWithPoint = function(point, error)
{
	if(point === undefined)
		return undefined;
	
	if(error === undefined)
		error = 10E-8;
	
	var line = this.getLine();
	if(!line.isCoincidentPoint(point, error))
		return Constant.INTERSECTION_OUTSIDE; // no intersection.***
	
	return this.intersectionWithPointByDistances(point, error);
};

Segment2D.prototype.intersectionWithSegment = function(segment_B, error)
{
	if(segment_B === undefined)
		return undefined;
	
	if(error === undefined)
		error = 10E-8;
	
	var myLine = this.getLine();
	var line = segment_B.getLine();
	var intersectionPoint = myLine.intersectionWithLine(line);
	
	if(intersectionPoint === undefined)
		return undefined; // are parallels.***
	
	// now use "intersectionWithPointByDistances" instead "intersectionWithPoint" bcos line-point intersection check is no necesary.***
	var intersectionType_A = this.intersectionWithPointByDistances(intersectionPoint);
	
	if(intersectionType_A === Constant.INTERSECTION_OUTSIDE)
		return Constant.INTERSECTION_OUTSIDE;
	
	var intersectionType_B = segment_B.intersectionWithPointByDistances(intersectionPoint);
	
	if(intersectionType_B === Constant.INTERSECTION_OUTSIDE)
		return Constant.INTERSECTION_OUTSIDE;
	
	return Constant.INTERSECTION_INTERSECT;
};

Segment2D.prototype.hasPoint = function(point)
{
	// returns if this segment has "point" as startPoint or endPoint.***
	if(point === undefined)
		return false;
	
	if(point === this.startPoint2d || point === this.endPoint2d)
		return true;
	
	return false;
};

Segment2D.prototype.sharesPointsWithSegment = function(segment)
{
	if(segment === undefined)
		return false;
	
	if(this.hasPoint(segment.startPoint2d) || this.hasPoint(segment.endPoint2d))
		return true;
	
	return false;
};
















































