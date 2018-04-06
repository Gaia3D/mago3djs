'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Rectangle
*/
var Rectangle = function() 
{
	if (!(this instanceof Rectangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.centerPoint;
	this.width;
	this.height;
};

Rectangle.prototype.setCenterPosition = function(cx, cy)
{
	if(this.centerPoint === undefined)
		this.centerPoint = new Point2D();
	
	this.centerPoint.set(cx, cy);
};

Rectangle.prototype.setDimensions = function(width, height)
{
	this.width = width;
	this.height = height;
};

/**
 * Returns the points of the Rectangle.
 * @class Rectangle
 */
Rectangle.prototype.getPoints = function(resultPointsArray)
{
	if(this.centerPoint === undefined || this.width === undefined || this.height === undefined)
		return resultPointsArray;
	
	if(resultPointsArray === undefined)
		resultPointsArray = [];
	
	var point;
	var halfWidth = this.width / 2;
	var halfHeight = this.height / 2;
	
	// starting in left-down corner, go in CCW.***
	point = new Point2D(this.centerPoint.x - halfWidth, this.centerPoint.y - halfHeight);
	point.pointType = 1; // mark as "important point".***
	resultPointsArray.push(point);
	
	point = new Point2D(this.centerPoint.x + halfWidth, this.centerPoint.y - halfHeight);
	point.pointType = 1; // mark as "important point".***
	resultPointsArray.push(point);
	
	point = new Point2D(this.centerPoint.x + halfWidth, this.centerPoint.y + halfHeight);
	point.pointType = 1; // mark as "important point".***
	resultPointsArray.push(point);
	
	point = new Point2D(this.centerPoint.x - halfWidth, this.centerPoint.y + halfHeight);
	point.pointType = 1; // mark as "important point".***
	resultPointsArray.push(point);
	
	return resultPointsArray;
};


















































