'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class PolyLine
 */
var PolyLine = function() 
{
	if (!(this instanceof PolyLine)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.point2dArray;
};

/**
 * Creates a new Point2D.
 * @class PolyLine
 */
PolyLine.prototype.newPoint2d = function(x, y)
{
	if (this.point2dArray === undefined)
	{ this.point2dArray = []; }
	
	var point2d = new Point2D(x, y);
	this.point2dArray.push(point2d);
	return point2d;
};

/**
 * Creates a new Point2D.
 * @class PolyLine
 */
PolyLine.prototype.deleteObjects = function()
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
 * Creates a new Point2D.
 * @class PolyLine
 */
PolyLine.prototype.getPoints = function(resultPointsArray)
{
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	var point;
	var errorDist = 10E-8;
	var resultExistentPointsCount = resultPointsArray.length;
	var pointsCount = this.point2dArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		if(i===0)
		{
			if(resultExistentPointsCount > 0)
			{
				// check if the last point of "resultPointsArray" and the 1rst point of "this" is coincident.***
				var lastExistentPoint = resultPointsArray[resultExistentPointsCount-1];
				var point0 = this.point2dArray[i];
				if(!lastExistentPoint.isCoincidentToPoint(point0, errorDist))
				{
					point = new Point2D();
					point.copyFrom(this.point2dArray[i]); 
					point.pointType = 1; // mark as "important point".***
					resultPointsArray.push(point);
				}
			}
			else
			{
				point = new Point2D();
				point.copyFrom(this.point2dArray[i]); 
				point.pointType = 1; // mark as "important point".***
				resultPointsArray.push(point);
			}
		}
		else
		{
			point = new Point2D();
			point.copyFrom(this.point2dArray[i]); 
			point.pointType = 1; // mark as "important point".***
			resultPointsArray.push(point);
		}
	}
	
	return resultPointsArray;
};











































