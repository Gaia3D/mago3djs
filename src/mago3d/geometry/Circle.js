'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Circle
 */
var Circle = function() 
{
	if (!(this instanceof Circle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// sweeping in CounterClockWise is positive.***
	// zero startAngle is in "X" axis positive.***
	this.centerPoint; // Point3D.***
	this.radius;
	this.numPointsFor360Deg; // interpolation param.***
};

/**
 * Set the center position of Circle.
 * @class Circle
 */
Circle.prototype.setCenterPosition = function(cx, cy)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point2D(); }
	
	this.centerPoint.set(cx, cy);
};

/**
 * Set the center position of Circle.
 * @class Circle
 */
Circle.prototype.setRadius = function(radius)
{
	this.radius = radius;
};

/**
 * Returns the points of the arc.
 * @class Arc
 */
Circle.prototype.getPoints = function(resultPointsArray, pointsCountFor360Deg)
{
	if (pointsCountFor360Deg)
	{ this.numPointsFor360Deg = pointsCountFor360Deg; }

	if (this.numPointsFor360Deg === undefined)
	{ this.numPointsFor360Deg = 36; }
	
	// use an arc to make points.***
	if (this.centerPoint === undefined || this.radius === undefined)
	{ return resultPointsArray; }
	
	var arc = new Arc();
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















































