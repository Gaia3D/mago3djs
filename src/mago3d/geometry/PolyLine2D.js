'use strict';

/**
 * PolyLine represented in 2D
 * This is similar with Point2DList, but this one represents real polyline geometry feature.
 * @class PolyLine2D
 */
var PolyLine2D = function() 
{
	if (!(this instanceof PolyLine2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.point2dArray;
};

/**
 * add Point2D.
 * @param {Point2D} point2d
 * @returns point2d
 */
 PolyLine2D.prototype.addPoint2d = function(point2d)
 {
	 if (this.point2dArray === undefined)
	 { this.point2dArray = []; }
	 
	 if(!point2d || !(point2d instanceof Point2D)) {
		 throw new Error(Messages.REQUIRED_EMPTY_ERROR('Point2D'))
	 }

	 this.point2dArray.push(point2d);
	 return point2d;
 };

/**
 * Creates a new Point2D.
 * @param {Number} x
 * @param {Number} y
 * @returns point2d
 */
PolyLine2D.prototype.newPoint2d = function(x, y)
{
	if (this.point2dArray === undefined)
	{ this.point2dArray = []; }
	
	var point2d = new Point2D(x, y);
	this.addPoint2d(point2d);
	return point2d;
};

/**
 * Count the number of the point2D in this list
 */
PolyLine2D.prototype.getPointsCount = function()
{
	if (this.point2dArray === undefined)
	{ return 0; }
	
	return this.point2dArray.length;
};

/**
 * Clear all the features in this.point2dArray
 */
PolyLine2D.prototype.deleteObjects = function()
{
	var pointsCount = this.point2dArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		this.point2dArray[i].deleteObjects();
		this.point2dArray[i] = undefined;
	}
	this.point2dArray = undefined;
};

/**
 * Copy the point from this.point2dArray to resultPointsArray
 * @param resultPointsArray
 * @returns resultPointsArray 
 */
PolyLine2D.prototype.getPoints = function(resultPointsArray)
{
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	var point;
	var errorDist = 10E-8;
	var resultExistentPointsCount = resultPointsArray.length;
	var pointsCount = this.point2dArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		if (i===0)
		{
			if (resultExistentPointsCount > 0)
			{
				// check if the last point of "resultPointsArray" and the 1rst point of "this" is coincident.
				var lastExistentPoint = resultPointsArray[resultExistentPointsCount-1];
				var point0 = this.point2dArray[i];
				if (!lastExistentPoint.isCoincidentToPoint(point0, errorDist))
				{
					point = new Point2D();
					point.copyFrom(this.point2dArray[i]); 
					point.pointType = 1; // mark as "important point".
					resultPointsArray.push(point);
				}
			}
			else
			{
				point = new Point2D();
				point.copyFrom(this.point2dArray[i]); 
				point.pointType = 1; // mark as "important point".
				resultPointsArray.push(point);
			}
		}
		else
		{
			point = new Point2D();
			point.copyFrom(this.point2dArray[i]); 
			point.pointType = 1; // mark as "important point".
			resultPointsArray.push(point);
		}
	}
	
	return resultPointsArray;
};