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
 * @param point2d 
 */
Line2D.prototype.distToPoint = function(point2d) 
{
	var projectedPoint = this.getProjectedPoint(point2d);
	var dist = point2d.distToPoint(projectedPoint);

	return dist;
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
 * Get a parallel line, in the right side, separated a dist.
 * @param {Number} dist Distance 
 * @returns {Line2D} Parallel line.
 */
Line2D.prototype.getParallelRight = function(dist) 
{
	var perpendicularRight = this.getPerpendicularRight();
	var perpendicularDir = perpendicularRight.direction;
	
	var parallelRight = new Line2D();
	var point = parallelRight.point;
	point.set(this.point.x + perpendicularDir.x*dist, this.point.y + perpendicularDir.y*dist);
	parallelRight.direction.copyFrom(this.direction);
	return parallelRight;
};

/** 
 * Get a parallel line, in the left side, separated a dist.
 * @param {Number} dist Distance 
 * @returns {Line2D} Parallel line.
 */
Line2D.prototype.getParallelLeft = function(dist) 
{
	var perpendicularLeft = this.getPerpendicularLeft();
	var perpendicularDir = perpendicularLeft.direction;
	
	var parallelLeft = new Line2D();
	var point = parallelLeft.point;
	point.set(this.point.x + perpendicularDir.x*dist, this.point.y + perpendicularDir.y*dist);
	parallelLeft.direction.copyFrom(this.direction);
	return parallelLeft;
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
 * Get the perpendicular direction of the line in left-handed coordinate system
 * @param {Point2D} point target point
 * @param {number} error 
 * @returns {number} CODE relativePosition2D
 */
Line2D.prototype.getRelativeSideOfPoint = function(point, error) 
{
	if (error === undefined)
	{ error = 10E-8; }

	var projectPoint = this.getProjectedPoint(point);

	var squaredDist = point.squareDistToPoint(projectPoint);
	
	if (squaredDist < error*error)
	{ return CODE.relativePosition2D.COINCIDENT; }

	var vector = new Point2D(point.x - projectPoint.x, point.y - projectPoint.y);
	vector.unitary();

	// gET OUR LEFT LINE.***
	var myLeft = this.getPerpendicularLeft(point);
	var scalar = myLeft.direction.scalarProduct(vector);

	if (scalar < 0.0) 
	{
		return CODE.relativePosition2D.RIGHT;
	}
	else 
	{
		return CODE.relativePosition2D.LEFT;
	}

	/*if ((Math.abs(vector.x-this.direction.y) < error) && (Math.abs(vector.y+this.direction.x) < error)) 
	{
		return CODE.relativePosition2D.RIGHT;
	}
	else 
	{
		return CODE.relativePosition2D.LEFT;
	}

	return CODE.relativePosition2D.UNKNOWN;*/
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
	
	// Method 1.***
	var angRad = this.direction.angleRadToVector(line.direction);
	// if angle is zero or 180 degree, then this is parallel to "line".
	if (angRad < zero || Math.abs(angRad - Math.PI) < zero)
	{ return true; }
	
	/*
	// Method 2.***
	// Another way is using the dot product.***
	var dotProd = this.direction.scalarProduct(line.direction);
	if (Math.abs(dotProd) < zero || Math.abs(dotProd - 1.0) < zero)
	{ return true; }
	*/
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














































