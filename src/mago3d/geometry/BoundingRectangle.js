'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class BoundingRectangle
*/
var BoundingRectangle = function(x, y) 
{
	if (!(this instanceof BoundingRectangle)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.minX = 100000;
	this.maxX = -100000;
	this.minY = 100000;
	this.maxY = -100000;
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

BoundingRectangle.prototype.setInitByRectangle = function(bRect)
{
	if (bRect === undefined)
	{ return; }
	
	this.minX = bRect.minX;
	this.minY = bRect.minY;
	this.maxX = bRect.maxX;
	this.maxY = bRect.maxY;
};

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















































