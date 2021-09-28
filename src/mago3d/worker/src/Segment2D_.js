'use strict';

var Segment2D_ = function(strPoint2D, endPoint2D) 
{
	this.startPoint2d;
	this.endPoint2d;

	this.setPoints(strPoint2D, endPoint2D);
};

Segment2D_.prototype.setPoints = function(strPoint2D, endPoint2D)
{
	if (strPoint2D !== undefined)
	{
		this.startPoint2d = strPoint2D; 
	}
	if (endPoint2D !== undefined)
	{ 
		this.endPoint2d = endPoint2D;
	}
};

Segment2D_.prototype.getDirection = function(result)
{
	if (result === undefined)
	{
		result = new Point2D_();
	}
	
	result = this.getVector(result);
	result.unitary();
	
	return result;
};

Segment2D_.prototype.getVector = function(result)
{
	if (this.startPoint2d === undefined || this.endPoint2d === undefined)
	{
		return undefined;
	}
	
	if (result === undefined)
	{
		result = new Point2D_();
	}
	
	result = this.startPoint2d.getVectorToPoint(this.endPoint2d, result);
	return result;
};

Segment2D_.prototype.getLine = function(result)
{
	if (result === undefined)
	{
		result = new Line2D_();
	}
	// unitary direction.
	var dir = this.getDirection();
	var strPoint = this.startPoint2d;
	result.setPointAndDir(strPoint.x, strPoint.y, dir.x, dir.y);
	return result;
};

Segment2D_.prototype.getSquaredLength = function()
{
	return this.startPoint2d.squareDistToPoint(this.endPoint2d);
};

Segment2D_.prototype.getLength = function()
{
	return Math.sqrt(this.getSquaredLength());
};

Segment2D_.prototype.intersectionWithPoint = function(point, error)
{
	if (point === undefined)
	{
		return undefined;
	}
	
	if (error === undefined)
	{
		error = 10E-8;
	}
	
	var line = this.getLine();
	if (!line.isCoincidentPoint(point, error))
	{
		// no intersection
		return Constant_.INTERSECTION_OUTSIDE;
	}
	
	return this.intersectionWithPointByDistances(point, error);
};

Segment2D_.prototype.intersectionWithPointByDistances = function(point, error)
{
	if (point === undefined)
	{
		return undefined;
	}
	
	if (error === undefined)
	{
		error = 10E-8;
	}
	
	// here no check line-point coincidance.
	// now, check if is inside of the segment or if is coincident with any vertex of segment.
	var distA = this.startPoint2d.distToPoint(point);
	var distB = this.endPoint2d.distToPoint(point);
	var distTotal = this.getLength();
	
	if (distA < error)
	{
		return Constant_.INTERSECTION_POINT_A;
	}
	
	if (distB < error)
	{
		return Constant_.INTERSECTION_POINT_B;
	}
	
	if (distA> distTotal || distB> distTotal)
	{
		return Constant_.INTERSECTION_OUTSIDE;
	}
	
	if (Math.abs(distA + distB - distTotal) < error)
	{
		return Constant_.INTERSECTION_INSIDE;
	}
};

Segment2D_.prototype.intersectionWithSegment = function(segment, error, resultIntersectedPoint2d)
{
	if (segment === undefined)
	{
		return undefined;
	}
	
	if (error === undefined)
	{
		error = 10E-8;
	}
	
	var lineA = this.getLine();
	var lineB = segment.getLine();
	var intersectionPoint = lineA.intersectionWithLine(lineB);
	
	// 두 선분이 평행한 경우
	if (intersectionPoint === undefined)
	{
		return undefined;
	}
	
	var intersectionTypeA = this.intersectionWithPointByDistances(intersectionPoint, error);
	var intersectionTypeB = segment.intersectionWithPointByDistances(intersectionPoint, error);
	//TODO : change the logic. The return value of intersectionWithPointByDistance has four enum type
	//But the value really used is only one or two. 
	if (intersectionTypeA === Constant_.INTERSECTION_OUTSIDE)
	{
		return Constant_.INTERSECTION_OUTSIDE;
	}
	if (intersectionTypeB === Constant_.INTERSECTION_OUTSIDE)
	{
		return Constant_.INTERSECTION_OUTSIDE;
	}
	
	if (resultIntersectedPoint2d)
	{ resultIntersectedPoint2d.set(intersectionPoint.x, intersectionPoint.y); }

	return Constant_.INTERSECTION_INTERSECT;
};

Segment2D_.prototype.getBoundingRectangle = function(result) 
{
	if (result === undefined) 
	{
		result = new BoundingRectangle_();
	}
	
	result.setInit(this.startPoint2d);
	result.addPoint(this.endPoint2d);
	
	return result;
};

Segment2D_.prototype.hasPoint = function(point)
{
	if (point === undefined)
	{
		return false;
	}
	
	if (point === this.startPoint2d || point === this.endPoint2d)
	{
		return true;
	}
	
	return false;
};

Segment2D_.prototype.sharesPointsWithSegment = function(segment)
{
	if (segment === undefined)
	{
		return false;
	}
	
	if (this.hasPoint(segment.startPoint2d) || this.hasPoint(segment.endPoint2d))
	{
		return true;
	}
	
	return false;
};

Segment2D_.prototype.getRelativePositionOfPoint2DReport = function (point2d, resultReport, error)
{
	// a point2d can be:
	// 1) outside.
	// 2) inside.
	// 3) coincident with startPoint.
	// 4) coincident with endPoint.
	//----------------------------------------

	/*
	CODE_.relativePositionPoint2DWithSegment2D = {
		"UNKNOWN" : 0,
		"OUTSIDE" : 1,
		"INSIDE" : 2,
		"COINCIDENT_WITH_START_POINT" : 3,
		"COINCIDENT_WITH_END_POINT" : 4
	}
	*/
	if (resultReport === undefined) 
	{
		resultReport = {};
	}
	resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.UNKNOWN;

	// check by boundingRectangle.***
	var boundingRect = this.getBoundingRectangle();
	if (!boundingRect.intersectsWithPoint2D(point2d))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.OUTSIDE;
		return resultReport;
	}

	if (error === undefined) 
	{ 
		error = 1e-8; 
	}

	// check if point2d is coincident with startPoint.
	if (point2d.isCoincidentToPoint(this.startPoint2d, error))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_START_POINT;
		return resultReport;
	}

	if (point2d.isCoincidentToPoint(this.endPoint2d, error))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_END_POINT;
		return resultReport;
	}

	// Check if the point2d is coincident with the segment's line.
	var line = this.getLine();
	if (!line.isCoincidentPoint(point2d, error))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.OUTSIDE;
		return resultReport;
	}
	else
	{
		// The point2d is coincident with the line.
		/*
		return Constant_.INTERSECTION_POINT_A;
		return Constant_.INTERSECTION_POINT_B;
		return Constant_.INTERSECTION_OUTSIDE;
		return Constant_.INTERSECTION_INSIDE;
		*/
		var intersectionType = this.intersectionWithPointByDistances(point2d, error);
		if (intersectionType === Constant_.INTERSECTION_POINT_A)
		{
			resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_START_POINT;
			return resultReport;
		}
		else if (intersectionType === Constant_.INTERSECTION_POINT_B)
		{
			resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_END_POINT;
			return resultReport;
		}
		else if (intersectionType === Constant_.INTERSECTION_OUTSIDE)
		{
			resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.OUTSIDE;
			return resultReport;
		}
		else if (intersectionType === Constant_.INTERSECTION_INSIDE)
		{
			resultReport.relPos = CODE_.relativePositionPoint2DWithSegment2D.INSIDE;
			return resultReport;
		}
	}

	return resultReport;

};