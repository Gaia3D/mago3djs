'use strict';
/**
 * 중심점과 가로, 세로 길이를 가진 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Rectangle2D
 * @constructor
 */
var Rectangle2D_ = function() 
{

	/**
	 * center point of this rectangle
	 * @type {Point2D}
	 */
	this.centerPoint;

	/**
	 * width of rectangle
	 * @type {Number}
	 */
	this.width;

	/**
	 * height of rectangle
	 * @type {Number}
	 */
	this.height;
	
	/**
	 * minimum x position of rectangle
	 * @type {Number}
	 */
	this.minX;
	
	/**
	 * minimum y position of rectangle
	 * @type {Number}
	 */
	this.minY;
	
	/**
	 * maximum x position of rectangle
	 * @type {Number}
	 */
	this.maxX;
	
	/**
	 * maximum y position of rectangle
	 * @type {Number}
	 */
	this.maxY;
};

Rectangle2D_.prototype.getPoints = function(resultPointsArray)
{
	if (this.centerPoint === undefined || this.width === undefined || this.height === undefined)
	{ return resultPointsArray; }
	
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	var point;
	var halfWidth = this.width / 2;
	var halfHeight = this.height / 2;
	
	// starting in left-down corner, go in CCW.
	point = new Point2D_(this.centerPoint.x - halfWidth, this.centerPoint.y - halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	point = new Point2D_(this.centerPoint.x + halfWidth, this.centerPoint.y - halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	point = new Point2D_(this.centerPoint.x + halfWidth, this.centerPoint.y + halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	point = new Point2D_(this.centerPoint.x - halfWidth, this.centerPoint.y + halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	return resultPointsArray;
};