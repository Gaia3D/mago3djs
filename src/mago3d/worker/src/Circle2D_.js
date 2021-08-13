'use strict';

/**
 * This represent the circle feature drawn in 2D.
 * @class Circle2D
 */
var Circle2D_ = function() 
{
	// sweeping in CounterClockWise is positive.
	// zero startAngle is in "X" axis positive.
	this.centerPoint; // Point2D.
	this.radius;
	this.numPointsFor360Deg; // interpolation param.
};

Circle2D_.prototype.getPoints = function(resultPointsArray, pointsCountFor360Deg)
{
	if (pointsCountFor360Deg)
	{ this.numPointsFor360Deg = pointsCountFor360Deg; }

	if (this.numPointsFor360Deg === undefined)
	{ this.numPointsFor360Deg = 36; }
	
	// use an arc to make points.
	if (this.centerPoint === undefined || this.radius === undefined)
	{ return resultPointsArray; }
	
	var arc = new Arc2D_();
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