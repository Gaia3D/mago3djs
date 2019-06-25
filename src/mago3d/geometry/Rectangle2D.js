'use strict';
/**
 * 중심점과 가로, 세로 길이를 가진 클래스
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Rectangle2D
 */
var Rectangle2D = function() 
{
	if (!(this instanceof Rectangle2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

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

/**
 * rectangle의 중심점 설정
 * @param {number} cx
 * @param {number} cy
 */
Rectangle2D.prototype.setCenterPosition = function(cx, cy)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point2D(); }
	
	this.centerPoint.set(cx, cy);
};

/**
 * rectangle의 가로,세로 길이 설정
 * @param {number} minX
 * @param {number} minY
 * @param {number} maxX
 * @param {number} maxY
 */
Rectangle2D.prototype.setExtension = function(minX, minY, maxX, maxY)
{
	this.minX = minX;
	this.minY = minY;
	this.maxX = maxX;
	this.maxY = maxY;
};

/**
 * rectangle의 가로,세로 길이 설정
 * @param {number} width
 * @param {number} height
 */
Rectangle2D.prototype.setDimensions = function(width, height)
{
	this.width = width;
	this.height = height;
};

/**
 * Returns the right up point.
 * @param {Point2D|undefined} resultPoint if this undefined, then create new Point2D.
 * @returns {Point2D|undefined} resultPoint
 */
Rectangle2D.prototype.getMaxPoint = function(resultPoint)
{
	if (resultPoint === undefined)
	{ resultPoint = new Point2D(); }
	
	resultPoint.set(this.maxX, this.maxY);
	return resultPoint;
};

/**
 * Returns the left down point.
 * @param {Point2D|undefined} resultPoint if this undefined, then create new Point2D.
 * @returns {Point2D|undefined} resultPoint
 */
Rectangle2D.prototype.getMinPoint = function(resultPoint)
{
	if (resultPoint === undefined)
	{ resultPoint = new Point2D(); }
	
	resultPoint.set(this.minX, this.minY);
	return resultPoint;
};

/**
 * Returns the points of the Rectangle.
 * @param {Array.<Point2D>|undefined} resultPointsArray if this undefined, set new Array. []
 * @returns {Array.<Point2D>} resultPointsArray rectangle의 꼭지점 반환, 중심점으로부터 가로,세로의 절반 만큼 떨어진 4점을 반환
 */
Rectangle2D.prototype.getPoints = function(resultPointsArray)
{
	if (this.centerPoint === undefined || this.width === undefined || this.height === undefined)
	{ return resultPointsArray; }
	
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	var point;
	var halfWidth = this.width / 2;
	var halfHeight = this.height / 2;
	
	// starting in left-down corner, go in CCW.
	point = new Point2D(this.centerPoint.x - halfWidth, this.centerPoint.y - halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	point = new Point2D(this.centerPoint.x + halfWidth, this.centerPoint.y - halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	point = new Point2D(this.centerPoint.x + halfWidth, this.centerPoint.y + halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	point = new Point2D(this.centerPoint.x - halfWidth, this.centerPoint.y + halfHeight);
	point.pointType = 1; // mark as "important point".
	resultPointsArray.push(point);
	
	return resultPointsArray;
};


















































