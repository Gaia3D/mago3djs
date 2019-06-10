'use strict';

/**
 * This represent the circle feature drawn in 2D.
 * @class Circle2D
 */
var Circle2D = function() 
{
	if (!(this instanceof Circle2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// sweeping in CounterClockWise is positive.
	// zero startAngle is in "X" axis positive.
	this.centerPoint; // Point2D.
	this.radius;
	this.numPointsFor360Deg; // interpolation param.
};

/**
 * Set the center position of Circle.
 * @param {Number} cx the x coordi of the center
 * @param {Number} cy the y coordi of the center
 */
Circle2D.prototype.setCenterPosition = function(cx, cy)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point2D(); }
	
	this.centerPoint.set(cx, cy);
};

/**
 * Set the radius value
 * @param {Number} radius
 */
Circle2D.prototype.setRadius = function(radius)
{
	this.radius = radius;
};

/**
 * Returns the points of the circle.
 * @param reulstPointsArray the array which saves the result of the points
 * @param pointsCountFor360Deg the value used for interpolation way
 */
Circle2D.prototype.getPoints = function(resultPointsArray, pointsCountFor360Deg)
{
	if (pointsCountFor360Deg)
	{ this.numPointsFor360Deg = pointsCountFor360Deg; }

	if (this.numPointsFor360Deg === undefined)
	{ this.numPointsFor360Deg = 36; }
	
	// use an arc to make points.
	if (this.centerPoint === undefined || this.radius === undefined)
	{ return resultPointsArray; }
	
	var arc = new Arc2D();
	arc.setCenterPosition(this.centerPoint.x, this.centerPoint.y);
	
	arc.setRadius(this.radius);
	arc.setStartAngleDegree(0);
	arc.setSweepAngleDegree(360.0);
	arc.setSense(1);
	
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	resultPointsArray = arc.getPoints(resultPointsArray, this.numPointsFor360Deg);
	return resultPointsArray;
};















































