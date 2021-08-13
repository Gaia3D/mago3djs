'use strict';

/**
 * This represent Arc feature in 2D
 * @class Arc2D
 */
var Arc2D_ = function() 
{
	this.centerPoint; // Point2D.
	this.radius;
	this.startAngleDeg; // zero startAngle is in "X" axis positive.
	this.sweepAngleDeg; // sweeping in CounterClockWise is positive.
	this.numPointsFor360Deg; // interpolation param.
	
	// Alternative vars.
	this.startPoint; // if no exist radius, then startPoint define the radius.
	this.endPoint;
	this.sweepSense; // 1=CCW, -1=CW.
};

Arc2D_.prototype.deleteObjects = function()
{
	if (this.centerPoint !== undefined)
	{ this.centerPoint.deleteObjects(); } // Point3D.
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
	this.sweepSense = undefined; // 1=CCW, -1=CW.
};

/**
 * Set the center position of Arc
 * @param {Number} cx the x coordi of the center
 * @param {Number} cy the y coordi of the center
 */
Arc2D_.prototype.setCenterPosition = function(cx, cy)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point2D_(); }
	
	this.centerPoint.set(cx, cy);
};

/**
 * Set the radius value
 * @param {Number} radius
 */
Arc2D_.prototype.setRadius = function(radius)
{
	this.radius = radius;
};

/**
 * Set the start angle of the arc.
 * @param startAngleDegree 
 */
Arc2D_.prototype.setStartAngleDegree = function(startAngleDegree)
{
	this.startAngleDeg = startAngleDegree;
};

/**
 * Set the start point of the arc.
 * @param {Number} x
 * @param {NUmber} y
 */
Arc2D_.prototype.setStartPoint = function(x, y)
{
	// If no exist startAngle, then use this to calculate startAngle.
	if (this.startPoint === undefined)
	{ this.startPoint = new Point2D_(); }
	
	this.startPoint.set(x, y);
};

/**
 * Set the start angle of the arc.
 */
Arc2D_.prototype.setEndPoint = function(x, y)
{
	// If no exist sweepAngle, then use this to calculate sweepAngle.
	if (this.endPoint === undefined)
	{ this.endPoint = new Point2D_(); }
	
	this.endPoint.set(x, y);
};

/**
 * Set the sweep direction sense of the arc.
 * @param sense
 */
Arc2D_.prototype.setSense = function(sense)
{
	this.sweepSense = sense; // 1=CCW, -1=CW.
};

/**
 * Set the sweep angle of the arc.
 * @param sweepAngleDegree 
 */
Arc2D_.prototype.setSweepAngleDegree = function(sweepAngleDegree)
{
	this.sweepAngleDeg = sweepAngleDegree;
};

Arc2D_.prototype.getPoints = function(resultPointsArray, pointsCountFor360Deg)
{
	if (this.centerPoint === undefined)
	{ return resultPointsArray; }
	
	if (pointsCountFor360Deg)
	{ this.numPointsFor360Deg = pointsCountFor360Deg; }

	if (this.numPointsFor360Deg === undefined)
	{ this.numPointsFor360Deg = 16; }

	// Check if exist strAng.
	var strVector, endVector;
	var strVectorModul;
	if (this.startAngleDeg === undefined)
	{
		if (this.startPoint === undefined)
		{ return resultPointsArray; }
		
		strVector = new Point2D_();
		strVector.set(this.startPoint.x - this.centerPoint.x, this.startPoint.y - this.centerPoint.y);

		// calculate angle with xAxis.
		var xAxis = new Point3D_(1, 0);
		var angRad = strVector.angleRadToVector(xAxis);
		strVectorModul = strVector.getModul();
		
		//var angRad = Math.acos(strVector.x/strVectorModul);
		if (strVector.y < 0)
		{
			angRad *= -1;
		}
		
		this.startAngleDeg = angRad * 180.0/Math.PI;
	}
	
	// Check if exist radius.
	if (this.radius === undefined)
	{
		// calculate by startPoint.
		if (this.startPoint === undefined)
		{ return resultPointsArray; }
		
		if (strVectorModul === undefined)
		{
			if (strVector === undefined)
			{
				strVector = new Point2D_();
				strVector.set(this.startPoint.x - this.centerPoint.x, this.startPoint.y - this.centerPoint.y);
			}
			strVectorModul = strVector.getModul();
		}
		
		this.radius = strVectorModul;
	}
	
	// check if exist sweepAng.
	if (this.sweepAngleDeg === undefined)
	{
		if (this.endPoint === undefined || this.sweepSense === undefined)
		{ return resultPointsArray; }
		
		endVector = new Point2D_();
		endVector.set(this.endPoint.x - this.centerPoint.x, this.endPoint.y - this.endPoint.y);

		var xAxis = new Point3D_(1, 0);
		var angRad = endVector.angleRadToVector(xAxis);

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
	var segmentsCount = Math.ceil(sweepAngRad/increAngRad);
	var currAngRad = 0.0;
	if (sweepAngRad >=0)
	{
		//for (var currAngRad = 0.0; currAngRad<sweepAngRad; currAngRad += increAngRad)
		for (var i=0; i<=segmentsCount; i++)
		{
			if (currAngRad > sweepAngRad)
			{ currAngRad = sweepAngRad; }
			
			x = cx + this.radius * Math.cos(currAngRad + startAngRad);
			y = cy + this.radius * Math.sin(currAngRad + startAngRad);
			point = new Point2D_(x, y);
			pointsArray.push(point);
			currAngRad += increAngRad;
		}
	}
	else 
	{
		//for (var currAngRad = 0.0; currAngRad>sweepAngRad; currAngRad -= increAngRad)
		for (var i=0; i<=segmentsCount; i++)
		{
			if (currAngRad < sweepAngRad)
			{ currAngRad = sweepAngRad; }
			
			x = cx + this.radius * Math.cos(currAngRad + startAngRad);
			y = cy + this.radius * Math.sin(currAngRad + startAngRad);
			point = new Point2D_(x, y);
			pointsArray.push(point);
			currAngRad -= increAngRad;
		}
	}
	
	// once finished, mark the 1rst point and the last point as"important point".
	var pointsCount = pointsArray.length;
	if (pointsCount > 0)
	{
		pointsArray[0].pointType = 1;
		pointsArray[pointsCount-1].pointType = 1;
	}
	
	// now merge points into "resultPointsArray".
	var errorDist = 0.0001; // 0.1mm.
	var resultExistentPointsCount = resultPointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		if (i===0)
		{
			if (resultExistentPointsCount > 0)
			{
				// check if the last point of "resultPointsArray" and the 1rst point of "this" is coincident.
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
	
	// Last check: finally, in case of sweepAngle = 360 degrees, or is closed pointsArray, then pop the last insertedPoint.
	resultExistentPointsCount = resultPointsArray.length;
	if (resultExistentPointsCount > 0)
	{
		// check if the last point of "resultPointsArray" and the 1rst point of "this" is coincident.
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