'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Arc
 */
var Arc = function() 
{
	if (!(this instanceof Arc)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// sweeping in CounterClockWise is positive.***
	// zero startAngle is in "X" axis positive.***
	this.centerPoint; // Point3D.***
	this.radius;
	this.startAngleDeg;
	this.sweepAngleDeg;
	this.numPointsFor360Deg; // interpolation param.***
};

/**
 * Set the center position of arc.
 * @class Arc
 */
Arc.prototype.deleteObjects = function()
{
	this.centerPoint.deleteObjects(); // Point3D.***
	this.centerPoint = undefined;
	this.radius = undefined;
	this.startAngleDeg = undefined;
	this.sweepAngleDeg = undefined;
	this.numPointsFor360Deg = undefined;
};

/**
 * Set the center position of arc.
 * @class Arc
 */
Arc.prototype.setCenterPosition = function(cx, cy, cz)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point3D(); }
	
	this.centerPoint.set(cx, cy, cz);
};

/**
 * Set the center position of arc.
 * @class Arc
 */
Arc.prototype.setRadius = function(radius)
{
	this.radius = radius;
};

/**
 * Set the start angle of the arc.
 * @class Arc
 */
Arc.prototype.setStartAngleDegree = function(startAngleDegree)
{
	this.startAngleDeg = startAngleDegree;
};

/**
 * Set the sweep angle of the arc.
 * @class Arc
 */
Arc.prototype.setSweepAngleDegree = function(sweepAngleDegree)
{
	this.sweepAngleDeg = sweepAngleDegree;
};

/**
 * Returns the points of the arc.
 * @class Arc
 */
Arc.prototype.getPoints = function(resultPointsArray, pointsCountFor360Deg)
{
	if (pointsCountFor360Deg === undefined)
	{ this.numPointsFor360Deg = 36; }
	else
	{ this.numPointsFor360Deg = pointsCountFor360Deg; }
	
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	var increAngRad = 2.0 * Math.PI / this.numPointsFor360Deg;
	var cx = this.centerPoint.x;
	var cy = this.centerPoint.y;
	var cz = this.centerPoint.z;
	var x, y;
	var z = 0;
	var startAngRad = Math.PI/180.0 * this.startAngleDeg;
	var sweepAngRad = Math.PI/180.0 * this.sweepAngleDeg;
	var point;
	
	if (sweepAngRad >=0)
	{
		for (var currAngRad = 0.0; currAngRad<sweepAngRad; currAngRad += increAngRad)
		{
			x = cx + this.radius * Math.cos(currAngRad + startAngRad);
			y = cy + this.radius * Math.sin(currAngRad + startAngRad);
			point = new Point3D(x, y, z);
			resultPointsArray.push(point);
		}
	}
	else 
	{
		for (var currAngRad = 0.0; currAngRad>sweepAngRad; currAngRad -= increAngRad)
		{
			x = cx + this.radius * Math.cos(currAngRad + startAngRad);
			y = cy + this.radius * Math.sin(currAngRad + startAngRad);
			point = new Point3D(x, y, z);
			resultPointsArray.push(point);
		}
	}
	
	// once finished, mark the 1rst point and the last point as"important point".***
	var pointsCount = resultPointsArray.length;
	if (pointsCount > 0)
	{
		resultPointsArray[0].pointType = 1;
		resultPointsArray[pointsCount-1].pointType = 1;
	}
	
	return resultPointsArray;
};



















