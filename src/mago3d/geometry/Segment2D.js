'use strict';
/**
 * 선분 생성을 위한 클래스
 * @class Segment2D
 * @constructor
 * @param {Point2D} strPoint2D 시작 포인트
 * @param {Point2D} endPoint2D 종료 포인트
 */
var Segment2D = function(strPoint2D, endPoint2D) 
{
	if (!(this instanceof Segment2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.startPoint2d;
	this.endPoint2d;
	
	if (strPoint2D)
	{
		this.startPoint2d = strPoint2D;
	}
	
	if (endPoint2D)
	{
		this.endPoint2d = endPoint2D;
	}
};


/**
 * 선분에 포인트를 설정한다.
 *
 * @param {Point2D} strPoint2D 시작 포인트
 * @param {Point2D} endPoint2D 종료 포인트
 */
Segment2D.prototype.setPoints = function(strPoint2D, endPoint2D)
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

/**
 * 시작 포인트에서 종료 포인트까지의 벡터를 구한다.
 *
 * @param {Point2D} result 벡터 결과값
 * @returns {Point2D} 벡터 결과값
 */
Segment2D.prototype.getVector = function(result)
{
	if (this.startPoint2d === undefined || this.endPoint2d === undefined)
	{
		return undefined;
	}
	
	if (result === undefined)
	{
		result = new Point2D();
	}
	
	result = this.startPoint2d.getVectorToPoint(this.endPoint2d, result);
	return result;
};


/**
 * 선분의 방향값을 계산한다.
 *
 * @param {Point2D} result 선분이 나타내는 방향값
 * @returns {Point2D} 선분이 나타내는 방향값
 */
Segment2D.prototype.getDirection = function(result)
{
	if (result === undefined)
	{
		result = new Point2D();
	}
	
	result = this.getVector(result);
	result.unitary();
	
	return result;
};


/**
 * 선분의 경계 사각형을 구한다.
 *
 * @param {BoundingRectangle} result 선분을 포함하는 경계 사각형
 * @returns {BoundingRectangle} 선분을 포함하는 경계 사각형
 */
Segment2D.prototype.getBoundingRectangle = function(result)
{
	if (result === undefined)
	{
		result = new BoundingRectangle();
	}
	
	result.setInit(this.startPoint2d);
	result.addPoint(this.endPoint2d);
	
	return result;
};


/**
 * 선분을 지나는 직선을 구한다.
 *
 * @param {Line2D} result 주어진 선분을 지나는 직선
 * @returns {Line2D} 주어진 선분을 지나는 직선
 */
Segment2D.prototype.getLine = function(result)
{
	if (result === undefined)
	{
		result = new Line2D();
	}
	// unitary direction.
	var dir = this.getDirection();
	var strPoint = this.startPoint2d;
	result.setPointAndDir(strPoint.x, strPoint.y, dir.x, dir.y);
	return result;
};


/**
 * 선분의 제곱된 길이를 구한다.
 *
 * @returns {Number} 선분의 제곱된 길이
 */
Segment2D.prototype.getSquaredLength = function()
{
	return this.startPoint2d.squareDistToPoint(this.endPoint2d);
};


/**
 * 선분의 길이를 구한다.
 *
 * @returns {Number} 선분의 길이
 */
Segment2D.prototype.getLength = function()
{
	return Math.sqrt(this.getSquaredLength());
};

Segment2D.prototype.getRelativePositionOfPoint2DReport = function(point2d, resultReport)
{
	// a point2d can be:
	// 1) outside.
	// 2) inside.
	// 3) coincident with startPoint.
	// 4) coincident with endPoint.
	//----------------------------------------

	/*
	CODE.relativePositionPoint2DWithSegment2D = {
		"UNKNOWN" : 0,
		"OUTSIDE" : 1,
		"INSIDE" : 2,
		"COINCIDENT_WITH_START_POINT" : 3,
		"COINCIDENT_WITH_END_POINT" : 4
	}
	*/
	if(resultReport === undefined)
	{
		resultReport = {};
	}
	resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.UNKNOWN;

	var error = 1e-8;

	// check if point2d is coincident with startPoint.
	if(point2d.isCoincidentToPoint(this.startPoint2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_START_POINT;
		return resultReport;
	}

	if(point2d.isCoincidentToPoint(this.endPoint2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_END_POINT;
		return resultReport;
	}

	// Check if the point2d is coincident with the segment's line.
	var line = this.getLine();
	if (!line.isCoincidentPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.OUTSIDE;
		return resultReport;
	}
	else
	{
		// The point2d is coincident with the line.
		if(this.intersectionWithPointByDistances(this.startPoint2d, error))
		{
			resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.INSIDE;
			return resultReport;
		}
	}

	return resultReport;

};


Segment2D.prototype.getRelativePositionOfSegment2DReport = function(seg2d, resultReport)
{
	var lineA = this.getLine();
	var lineB = seg2d.getLine();

	var segA_sp = this.startPoint2d;
	var segA_ep = this.endPoint2d;

	var segB_sp = seg2d.startPoint2d;
	var segB_ep = seg2d.endPoint2d;

	var intersectedPoint = lineA.intersectionWithLine(lineB);

	if(!intersectedPoint)
	{
		// Lines are parallel.***
		// Now, must know if there are colineal.

	}
};

/**
 * 오차율에 따라 주어진 포인트와 선분의 교차를 판단한다.
 *
 * @param {Point2D} point 포인트
 * @param {Number} error 오차율
 * @returns 교차 판단 결과값
 */
Segment2D.prototype.intersectionWithPointByDistances = function(point, error)
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
		return Constant.INTERSECTION_POINT_A;
	}
	
	if (distB < error)
	{
		return Constant.INTERSECTION_POINT_B;
	}
	
	if (distA> distTotal || distB> distTotal)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	if (Math.abs(distA + distB - distTotal) < error)
	{
		return Constant.INTERSECTION_INSIDE;
	}
};


/**
 * 오차율에 따라 주어진 포인트와 선분의 교차를 판단한다.
 *
 * @param {Point2D} point 포인트
 * @param {Number} error 오차율
 * @returns 교차 판단 결과값
 */
Segment2D.prototype.intersectionWithPoint = function(point, error)
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
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	return this.intersectionWithPointByDistances(point, error);
};

/**
 * 오차율에 따라 주어진 선분과 선분의 교차를 판단한다.
 *
 * @param {Segment2D} segment 선분
 * @param {Number} error 오차율
 * @param {Point2D} resultIntersectedPoint2d The intersected point if INTERSECTION_INTERSECT.
 * @returns 교차 판단 결과값
 */
Segment2D.prototype.intersectionWithSegment = function(segment, error, resultIntersectedPoint2d)
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
	if (intersectionTypeA === Constant.INTERSECTION_OUTSIDE)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	if (intersectionTypeB === Constant.INTERSECTION_OUTSIDE)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	if(resultIntersectedPoint2d)
	resultIntersectedPoint2d.set(intersectionPoint.x, intersectionPoint.y);

	return Constant.INTERSECTION_INTERSECT;
};


/**
 * 주어진 포인트가 시작 포인트 또는 종료 포인트를 갖는지 판단한다.
 * returns if this segment has "point" as startPoint or endPoint.
 *
 * @param {Point2D} point 포인트
 * @returns {Boolean} 시작/종료 포인트 존재 여부
 */
Segment2D.prototype.hasPoint = function(point)
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


/**
 * 주어진 선분이 해당 선분과 공유 포인트를 갖는지 판단한다.
 *
 * @param {Segment2D} segment 선분
 * @returns {Boolean} 공유 포인트 존재 여부
 */
Segment2D.prototype.sharesPointsWithSegment = function(segment)
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