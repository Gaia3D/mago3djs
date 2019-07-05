'use strict';

/**
 * 선
 * @class Line2D
 */
var Line2D = function() 
{
	if (!(this instanceof Line2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// (x,y) = (x0,y0) + lambda * (u, v);
	this.point = new Point2D();
	this.direction = new Point2D();
};

/**
 * set the needed value of this line with a point and a direction value
 * @param px the value of x coordi of this line
 * @param py the value of y coordi of this line
 * @param dx the value of x direction of this line
 * @param dy the value of y direction of this line
 */
Line2D.prototype.setPointAndDir = function(px, py, dx, dy) 
{
	this.point.set(px, py);
	this.direction.set(dx, dy);
	this.direction.unitary();
};

/** 
 * Get the perpendicular direction of the line in right-handed coordinate system
 * @param {Point2D} point target point
 * @returns {Line2D} perpendicular the perpendicular direction 
 */
Line2D.prototype.getPerpendicularRight = function(point) 
{
	var perpendicular = new Line2D();
	
	if (point)
	{ perpendicular.point.set(point.x, point.y); }
	else
	{ perpendicular.point.set(this.point.x, this.point.y); }
	
	perpendicular.direction.set(this.direction.y, -this.direction.x);
	return perpendicular;
};

/**
 * Get the perpendicular direction of the line in left-handed coordinate system
 * @param {Point2D} pointt target point
 * @returns {Line2D} perpendicular the perpendicular direction 
 */
Line2D.prototype.getPerpendicularLeft = function(point) 
{
	var perpendicular = new Line2D();
	
	if (point)
	{ perpendicular.point.set(point.x, point.y); }
	else
	{ perpendicular.point.set(this.point.x, this.point.y); }
	
	perpendicular.direction.set(-this.direction.y, this.direction.x);
	return perpendicular;
};

/**
 * Return the point which is projected as perpendicular way to the line
 * @param {Point2D} point the given point
 * @param {Point2D} projectedPoint the result of the projection to the line
 * @returns {Point2D} projectedPoint
 * 
 */
Line2D.prototype.getProjectedPoint = function(point, projectedPoint) 
{
	if (point === undefined)
	{ return undefined; }
	
	if (projectedPoint === undefined)
	{ projectedPoint = new Point2D(); }
	
	var perpendicular = this.getPerpendicularLeft(point);
	projectedPoint = this.intersectionWithLine(perpendicular, projectedPoint);
	
	return projectedPoint;
};

/**
 * Check whether the given point is on this line or not
 * @param {Point2D} point the given point
 * @param {Number} error the error rate which can be handdled
 * @returns {Boolean} 
 */
Line2D.prototype.isCoincidentPoint = function(point, error) 
{
	if (point === undefined)
	{ return false; }
	
	if (error === undefined)
	{ error = 10E-8; }
	
	var projectedPoint = this.getProjectedPoint(point, projectedPoint);
	var squaredDist = point.squareDistToPoint(projectedPoint);
	
	if (squaredDist < error*error)
	{ return true; }

	return false;
};

/**
 * Check whether the given line is parallel to this line or not
 * @param {Line2D} line
 * @returns {Boolean}
 */
Line2D.prototype.isParallelToLine = function(line) 
{
	if (line === undefined)
	{ return false; }
	
	var zero = 10E-10;
	var angRad = this.direction.angleRadToVector(line.direction);
	
	// if angle is zero or 180 degree, then this is parallel to "line".
	if (angRad < zero || Math.abs(angRad - Math.PI) < zero)
	{ return true; }
	
	return false;
};

/**
 * Get the intersection point with given line
 * @param {Line2D} line
 * @param {Point2D} resultIntersectPoint
 * @returns {Point2D} resultIntersectPoint
 */
Line2D.prototype.intersectionWithLine = function(line, resultIntersectPoint) 
{
	if (line === undefined)
	{ return undefined; }
	
	// 1rst, check that this is not parallel to "line".
	if (this.isParallelToLine(line))
	{ return undefined; }
	
	// now, check if this or "line" are vertical or horizontal.
	var intersectX;
	var intersectY;
	
	var zero = 10E-10;
	if (Math.abs(this.direction.x) < zero)
	{
		// this is a vertical line.
		var slope = line.direction.y / line.direction.x;
		var b = line.point.y - slope * line.point.x;
		
		intersectX = this.point.x;
		intersectY = slope * this.point.x + b;
	}
	else if (Math.abs(this.direction.y) < zero)
	{
		// this is a horizontal line.
		// must check if the "line" is vertical.
		if (Math.abs(line.direction.x) < zero)
		{
			// "line" is vertical.
			intersectX = line.point.x;
			intersectY = this.point.y;
		}
		else 
		{
			var slope = line.direction.y / line.direction.x;
			var b = line.point.y - slope * line.point.x;
			
			intersectX = (this.point.y - b)/slope;
			intersectY = this.point.y;
		}	
	}
	else 
	{
		// this is oblique.
		if (Math.abs(line.direction.x) < zero)
		{
			// "line" is vertical.
			var mySlope = this.direction.y / this.direction.x;
			var myB = this.point.y - mySlope * this.point.x;
			intersectX = line.point.x;
			intersectY = intersectX * mySlope + myB;
		}
		else 
		{
			var mySlope = this.direction.y / this.direction.x;
			var myB = this.point.y - mySlope * this.point.x;
			
			var slope = line.direction.y / line.direction.x;
			var b = line.point.y - slope * line.point.x;
			
			intersectX = (myB - b)/ (slope - mySlope);
			intersectY = slope * intersectX + b;
		}
	}
	
	if (resultIntersectPoint === undefined)
	{ resultIntersectPoint = new Point2D(); }
	
	resultIntersectPoint.set(intersectX, intersectY);
	return resultIntersectPoint;
};














































