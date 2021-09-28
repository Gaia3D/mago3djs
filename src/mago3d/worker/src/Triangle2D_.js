'use strict';

var Triangle2D_ = function(point2d0, point2d1, point2d2) 
{
	this.point2d0;
	this.point2d1;
	this.point2d2;
	
	if (point2d0 !== undefined)
	{ this.point2d0 = point2d0; }
	
	if (point2d1 !== undefined)
	{ this.point2d1 = point2d1; }
	
	if (point2d2 !== undefined)
	{ this.point2d2 = point2d2; }
};

Triangle2D_.prototype.setPoints = function(point2d0, point2d1, point2d2) 
{
	this.point2d0 = point2d0;
	this.point2d1 = point2d1;
	this.point2d2 = point2d2;
};

Triangle2D_.prototype.getSegment2D = function(idx) 
{
	var seg2d = new Segment2D_();

	if (idx === 0)
	{
		seg2d.setPoints(this.point2d0, this.point2d1);
	}
	else if (idx === 1)
	{
		seg2d.setPoints(this.point2d1, this.point2d2);
	}
	else if (idx === 2)
	{
		seg2d.setPoints(this.point2d2, this.point2d0);
	}

	return seg2d;
};

Triangle2D_.sign = function(p1, p2, p3) 
{
	return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

Triangle2D_.prototype.isPoint2dInside = function(point2d) 
{
	var sign1 = Triangle2D_.sign(point2d, this.point2d0, this.point2d1) < 0;
	var sign2 = Triangle2D_.sign(point2d, this.point2d1, this.point2d2) < 0;
	var sign3 = Triangle2D_.sign(point2d, this.point2d2, this.point2d0) < 0;
	
	var isInside = ((sign1 === sign2) && (sign2 === sign3));
	return isInside;
};

Triangle2D_.prototype.getRelativePositionOfPoint2DReport = function(point2d, resultReport, error) 
{
	// a point can be:
	// 1) outside of the triangle.
	// 2) inside of the triangle.
	// 3) coincident with any points of the triangle.
	// 4) coincident with any segment of the triangle.
	//-------------------------------------------------------------

	// 1rst, check if the point is coincident with any point of the triangle.
	if (error === undefined)
	{ error = 1e-8; }

	/*
	CODE_.relativePositionPoint2DWithTriangle2D = {
		"UNKNOWN" : 0,
		"OUTSIDE" : 1,
		"INSIDE" : 2,
		"COINCIDENT_WITH_TRIANGLE_POINT" : 3,
		"COINCIDENT_WITH_TRIANGLE_EDGE" : 4
	}
	*/

	if (resultReport === undefined)
	{
		resultReport = {};
	}
	resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.UNKNOWN;

	if (this.point2d0.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 0;
		return resultReport;
	}

	if (this.point2d1.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 1;
		return resultReport;
	}

	if (this.point2d2.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 2;
		return resultReport;
	}

	// Check if is coincident with any triangle edge.
	//Constant_.INTERSECTION_POINT_A;
	//Constant_.INTERSECTION_POINT_B;
	//Constant_.INTERSECTION_OUTSIDE;
	//Constant_.INTERSECTION_INSIDE;

	var segmentIdx = 0;
	var seg2d = this.getSegment2D(segmentIdx);
	if (seg2d.intersectionWithPointByDistances(point2d, error) === Constant_.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}

	segmentIdx = 1;
	seg2d = this.getSegment2D(segmentIdx);
	if (seg2d.intersectionWithPointByDistances(point2d, error) === Constant_.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}

	segmentIdx = 2;
	seg2d = this.getSegment2D(segmentIdx);
	if (seg2d.intersectionWithPointByDistances(point2d, error) === Constant_.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}
	
	// Now, check if the point2d is inside or outside of the triangle.
	if (this.isPoint2dInside(point2d))
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.INSIDE;
		return resultReport;
	}
	else
	{
		resultReport.relPos = CODE_.relativePositionPoint2DWithTriangle2D.OUTSIDE;
		return resultReport;
	}
};