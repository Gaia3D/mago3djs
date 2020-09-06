'use strict';
/**
* This class represent the bounding box of the other feature in 2D
* @class BoundingRectangle
*/
var BoundingRectangle = function(x, y) 
{
	if (!(this instanceof BoundingRectangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.minX = Number.MAX_VALUE;
	this.maxX = Number.MIN_VALUE;
	this.minY = Number.MAX_VALUE;
	this.maxY = Number.MIN_VALUE;
};

BoundingRectangle.prototype.setInit = function(point)
{
	if (point === undefined)
	{ return; }
	
	this.minX = point.x;
	this.minY = point.y;
	this.maxX = point.x;
	this.maxY = point.y;
};
/**
 * Initiation bounding rectangle by the other bounding rectangle
 * @param {BoundingRectangle} bRect The other bounding rectangle	
 */
BoundingRectangle.prototype.setInitByRectangle = function(bRect)
{
	if (bRect === undefined)
	{ return; }
	
	this.minX = bRect.minX;
	this.minY = bRect.minY;
	this.maxX = bRect.maxX;
	this.maxY = bRect.maxY;
};

/**
 * Change the range of this bounding rectangle if a point is added
 * @param {Point2D} point 
 */
BoundingRectangle.prototype.addPoint = function(point)
{
	if (point === undefined)
	{ return; }
	
	if (point.x < this.minX)
	{ this.minX = point.x; }
	else if (point.x > this.maxX)
	{ this.maxX = point.x; }
	
	if (point.y < this.minY)
	{ this.minY = point.y; }
	else if (point.y > this.maxY)
	{ this.maxY = point.y; }
};
/**
 * Change the range of this bounding rectangle if a rectangle is added
 * @param {BoundingRectangle} bRect
 */
BoundingRectangle.prototype.addRectangle = function(bRect)
{
	if (bRect === undefined)
	{ return; }
	
	if (bRect.minX < this.minX)
	{ this.minX = bRect.minX; }
	if (bRect.maxX > this.maxX)
	{ this.maxX = bRect.maxX; }
	
	if (bRect.minY < this.minY)
	{ this.minY = bRect.minY; }
	if (bRect.maxY > this.maxY)
	{ this.maxY = bRect.maxY; }
};
/**
 * Check whether this rectangle is intersected with the given bounding rectangle
 * @param {BoundingRectangle} bRect
 * @returns {Boolean}
 */
BoundingRectangle.prototype.intersectsWithRectangle = function(bRect)
{
	if (bRect === undefined)
	{ return false; }
	
	if (bRect.minX > this.maxX)
	{ return false; }
	else if (bRect.maxX < this.minX)
	{ return false; }
	else if (bRect.minY > this.maxY)
	{ return false; }
	else if (bRect.maxY < this.minY)
	{ return false; }
	
	return true;
};

/**
 * Check whether this rectangle is intersected with the given bounding rectangle
 * @param {Point2D} point2D
 * @returns {Boolean}
 */
BoundingRectangle.prototype.intersectsWithPoint2D = function(point2D)
{
	if (point2D === undefined)
	{ return false; }
	
	if (point2D.x > this.maxX)
	{ return false; }
	else if (point2D.x < this.minX)
	{ return false; }
	else if (point2D.y > this.maxY)
	{ return false; }
	else if (point2D.y < this.minY)
	{ return false; }
	
	return true;
};

/**
 * Check whether this rectangle is intersected with the given bounding rectangle
 * @param {BoundingRectangle} bRect
 * @returns {Point2D}
 */
BoundingRectangle.prototype.getCenterPoint = function()
{
	var centerx = (this.minX + this.maxX) / 2;
	var centery = (this.minY + this.maxY) / 2;
	
	return new Point2D(centerx, centery);
};

/**
 * Bounding Rectangle Center point
 * @returns {Point2D}
 */
BoundingRectangle.prototype.getCenterPoint = function()
{
	var centerx = (this.minX + this.maxX) / 2;
	var centery = (this.minY + this.maxY) / 2;
	
	return new Point2D(centerx, centery);
};

/**
 * Bounding Rectangle x length
 * @returns {number}
 */
BoundingRectangle.prototype.getXLength = function()
{
	return this.maxX - this.minX;
};

/**
 * Bounding Rectangle y length
 * @returns {number}
 */
BoundingRectangle.prototype.getYLength = function()
{
	return this.maxY - this.minY;
};