'use strict';

/**
 * PolyLine represented in 2D
 * This is similar with Point2DList, but this one represents real polyline geometry feature.
 * @class PolyLine2D
 */
var PolyLine2D_ = function() 
{
	this.point2dArray;
};

PolyLine2D_.prototype.getPoints = function(resultPointsArray)
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
					point = new Point2D_();
					point.copyFrom(this.point2dArray[i]); 
					point.pointType = 1; // mark as "important point".
					resultPointsArray.push(point);
				}
			}
			else
			{
				point = new Point2D_();
				point.copyFrom(this.point2dArray[i]); 
				point.pointType = 1; // mark as "important point".
				resultPointsArray.push(point);
			}
		}
		else
		{
			point = new Point2D_();
			point.copyFrom(this.point2dArray[i]); 
			point.pointType = 1; // mark as "important point".
			resultPointsArray.push(point);
		}
	}
	
	return resultPointsArray;
};