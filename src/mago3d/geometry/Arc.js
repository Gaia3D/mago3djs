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
	
	// Alternative vars.***
	this.startPoint; // if no exist radius, then startPoint define the radius.***
	this.endPoint;
	this.sweepSense; // 1=CCW, -1=CW.***
};

/**
 * Set the center position of arc.
 * @class Arc
 */
Arc.prototype.deleteObjects = function()
{
	if (this.centerPoint !== undefined)
	{ this.centerPoint.deleteObjects(); } // Point3D.***
	this.centerPoint = undefined;
	this.radius = undefined;
	this.startAngleDeg = undefined;
	this.sweepAngleDeg = undefined;
	this.numPointsFor360Deg = undefined;
	
	if (this.startPoint !== undefined)
	{ this.startPoint.deleteObjects(); } 
	
	this.startPoint = undefined;
	
	if (this.endPoint !== undefined)
	{ this.endPoint.deleteObjects(); } 
	
	this.endPoint = undefined;
	this.sweepSense = undefined; // 1=CCW, -1=CW.***
};

/**
 * Set the center position of arc.
 * @class Arc
 */
Arc.prototype.setCenterPosition = function(cx, cy)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point2D(); }
	
	this.centerPoint.set(cx, cy);
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
 * Set the start angle of the arc.
 * @class Arc
 */
Arc.prototype.setStartPoint = function(x, y)
{
	// If no exist startAngle, then use this to calculate startAngle.***
	if (this.startPoint === undefined)
	{ this.startPoint = new Point2D(); }
	
	this.startPoint.set(x, y);
};

/**
 * Set the start angle of the arc.
 * @class Arc
 */
Arc.prototype.setEndPoint = function(x, y)
{
	// If no exist sweepAngle, then use this to calculate sweepAngle.***
	if (this.endPoint === undefined)
	{ this.endPoint = new Point2D(); }
	
	this.endPoint.set(x, y);
};

/**
 * Set the start angle of the arc.
 * @class Arc
 */
Arc.prototype.setSense = function(sense)
{
	this.sweepSense = sense; // 1=CCW, -1=CW.***
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
	if (this.centerPoint === undefined)
	{ return resultPointsArray; }
	
	if (pointsCountFor360Deg)
	{ this.numPointsFor360Deg = pointsCountFor360Deg; }

	if (this.numPointsFor360Deg === undefined)
	{ this.numPointsFor360Deg = 36; }

	// Check if exist strAng.*********************************************************************************
	var strVector, endVector;
	var strVectorModul;
	if (this.startAngleDeg === undefined)
	{
		if (this.startPoint === undefined)
		{ return resultPointsArray; }
		
		strVector = new Point2D();
		strVector.set(this.startPoint.x - this.centerPoint.x, this.startPoint.y - this.centerPoint.y);
		strVectorModul = strVector.getModul();
		
		var angRad = Math.acos(x/strVectorModul);
		if (this.startPoint.y < 0)
		{
			angRad *= -1;
		}
		
		this.startAngleDeg = angRad * 180.0/Math.PI;
	}
	
	// Check if exist radius.*********************************************************************************
	if (this.radius === undefined)
	{
		// calculate by startPoint.***
		if (this.startPoint === undefined)
		{ return resultPointsArray; }
		
		if (strVectorModul === undefined)
		{
			if (strVector === undefined)
			{
				strVector = new Point2D();
				strVector.set(this.startPoint.x - this.centerPoint.x, this.startPoint.y - this.centerPoint.y);
			}
			strVectorModul = strVector.getModul();
		}
		
		this.radius = strVectorModul;
	}
	
	// check if exist sweepAng.*********************************************************************************
	if (this.sweepAngleDeg === undefined)
	{
		if (this.endPoint === undefined || this.sweepSense === undefined)
		{ return resultPointsArray; }
		
		endVector = new Point2D();
		endVector.set(this.endPoint.x - this.centerPoint.x, this.endPoint.y - this.endPoint.y);
		var endVectorModul = endPoint.getModul();
		
		var angRad = Math.acos(x/strVectorModul);
		if (this.endPoint.y < 0)
		{
			angRad *= -1;
		}
		
		this.sweepAngleDeg = angRad * 180.0/Math.PI;
		
		if (this.sweepSense < 0)
		{ this.sweepAngleDeg = 360 - this.sweepAngleDeg; }
	}
	
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	var pointsArray = [];
	
	var increAngRad = 2.0 * Math.PI / this.numPointsFor360Deg;
	var cx = this.centerPoint.x;
	var cy = this.centerPoint.y;
	var x, y;
	var startAngRad = Math.PI/180.0 * this.startAngleDeg;
	var sweepAngRad = Math.PI/180.0 * this.sweepAngleDeg;
	var point;
	
	if (sweepAngRad >=0)
	{
		for (var currAngRad = 0.0; currAngRad<sweepAngRad; currAngRad += increAngRad)
		{
			x = cx + this.radius * Math.cos(currAngRad + startAngRad);
			y = cy + this.radius * Math.sin(currAngRad + startAngRad);
			point = new Point2D(x, y);
			pointsArray.push(point);
		}
	}
	else 
	{
		for (var currAngRad = 0.0; currAngRad>sweepAngRad; currAngRad -= increAngRad)
		{
			x = cx + this.radius * Math.cos(currAngRad + startAngRad);
			y = cy + this.radius * Math.sin(currAngRad + startAngRad);
			point = new Point2D(x, y);
			pointsArray.push(point);
		}
	}
	
	// once finished, mark the 1rst point and the last point as"important point".***
	var pointsCount = pointsArray.length;
	if (pointsCount > 0)
	{
		pointsArray[0].pointType = 1;
		pointsArray[pointsCount-1].pointType = 1;
	}
	
	// now merge points into "resultPointsArray".***
	var errorDist = 0.0001; // 0.1mm.***
	var resultExistentPointsCount = resultPointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		if (i===0)
		{
			if (resultExistentPointsCount > 0)
			{
				// check if the last point of "resultPointsArray" and the 1rst point of "this" is coincident.***
				var lastExistentPoint = resultPointsArray[resultExistentPointsCount-1];
				point = pointsArray[i];
				if (!lastExistentPoint.isCoincidentToPoint(point, errorDist))
				{
					resultPointsArray.push(point);
				}
			}
			else
			{
				resultPointsArray.push(pointsArray[i]);
			}
		}
		else
		{
			resultPointsArray.push(pointsArray[i]);
		}
	}
	
	// Last check: finally, in case of sweepAngle = 360 degrees, or is closed pointsArray, then pop the last insertedPoint.***
	resultExistentPointsCount = resultPointsArray.length;
	if (resultExistentPointsCount > 0)
	{
		// check if the last point of "resultPointsArray" and the 1rst point of "this" is coincident.***
		var lastPoint = resultPointsArray[resultExistentPointsCount-1];
		var firstPoint = resultPointsArray[0];
		if (lastPoint.isCoincidentToPoint(firstPoint, errorDist))
		{
			resultPointsArray.pop();
			lastPoint.deleteObjects();
		}
	}
	
	return resultPointsArray;
};



















