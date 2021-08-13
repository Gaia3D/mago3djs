'use strict';

/**
 * Triangle2D(삼각형)를 생성하기 위한 클래스
 * 
 * @class Triangle2D
 *  
 * @param {Point2D} point2d0
 * @param {Point2D} point2d1
 * @param {Point2D} point2d2
 */
var Triangle2D = function(point2d0, point2d1, point2d2) 
{
	if (!(this instanceof Triangle2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
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

/**
 * Triangle의 각각의 Vertex 설정
 * 
 * @param {Point2D} point2d0
 * @param {Point2D} point2d1
 * @param {Point2D} point2d2
 */
Triangle2D.prototype.setPoints = function(point2d0, point2d1, point2d2) 
{
	this.point2d0 = point2d0;
	this.point2d1 = point2d1;
	this.point2d2 = point2d2;
};

/**
 * Triangle의 각각의 Vertex 설정
 * 
 * @param {Point2D} p1
 * @param {Point2D} p2
 * @param {Point2D} p3
 */
Triangle2D.sign = function(p1, p2, p3) 
{
	return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

/**
 * Triangle의 각각의 Vertex 설정
 * 
 * @param {Point2D} point2d0
 * @param {Point2D} point2d1
 * @param {Point2D} point2d2
 */
Triangle2D.prototype.isPoint2dInside = function(point2d) 
{
	var sign1 = Triangle2D.sign(point2d, this.point2d0, this.point2d1) < 0;
	var sign2 = Triangle2D.sign(point2d, this.point2d1, this.point2d2) < 0;
	var sign3 = Triangle2D.sign(point2d, this.point2d2, this.point2d0) < 0;
	
	var isInside = ((sign1 === sign2) && (sign2 === sign3));
	return isInside;
};

Triangle2D.prototype.getBoundingRectangle = function(resultBoundingRect) 
{
	if (resultBoundingRect === undefined)
	{
		resultBoundingRect = new BoundingRectangle();
	}
	
	resultBoundingRect.setInit(this.point2d0);
	resultBoundingRect.addPoint(this.point2d1);
	resultBoundingRect.addPoint(this.point2d2);
	
	return resultBoundingRect;
};

Triangle2D.prototype.getSegment2D = function(idx) 
{
	var seg2d = new Segment2D();

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

Triangle2D.prototype.getIntersectedPointsByLine2D = function(line2d, resultIntersectedPointsArray) 
{
	// Tangent lines are not considered intersection.
	// A line can touch one or two points. In these cases the line is tangent.
	
};

Triangle2D.prototype.getRelativePositionOfPoint2DReport = function(point2d, resultReport, error) 
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
	CODE.relativePositionPoint2DWithTriangle2D = {
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
	resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.UNKNOWN;

	if (this.point2d0.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 0;
		return resultReport;
	}

	if (this.point2d1.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 1;
		return resultReport;
	}

	if (this.point2d2.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 2;
		return resultReport;
	}

	// Check if is coincident with any triangle edge.
	//Constant.INTERSECTION_POINT_A;
	//Constant.INTERSECTION_POINT_B;
	//Constant.INTERSECTION_OUTSIDE;
	//Constant.INTERSECTION_INSIDE;

	var segmentIdx = 0;
	var seg2d = this.getSegment2D(segmentIdx);
	if (seg2d.intersectionWithPointByDistances(point2d, error) === Constant.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}

	segmentIdx = 1;
	seg2d = this.getSegment2D(segmentIdx);
	if (seg2d.intersectionWithPointByDistances(point2d, error) === Constant.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}

	segmentIdx = 2;
	seg2d = this.getSegment2D(segmentIdx);
	if (seg2d.intersectionWithPointByDistances(point2d, error) === Constant.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}
	
	// Now, check if the point2d is inside or outside of the triangle.
	if (this.isPoint2dInside(point2d))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.INSIDE;
		return resultReport;
	}
	else
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.OUTSIDE;
		return resultReport;
	}
};





















