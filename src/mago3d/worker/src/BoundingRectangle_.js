'use strict';

var BoundingRectangle_ = function(x, y) 
{
	this.minX = Number.MAX_VALUE;
	this.maxX = Number.MIN_VALUE;
	this.minY = Number.MAX_VALUE;
	this.maxY = Number.MIN_VALUE;
};

BoundingRectangle_.prototype.setInitXY = function(x, y)
{
	this.minX = x;
	this.minY = y;
	this.maxX = x;
	this.maxY = y;
}

BoundingRectangle_.prototype.setInit = function(point)
{
	if (point === undefined)
	{ return; }
	
	this.minX = point.x;
	this.minY = point.y;
	this.maxX = point.x;
	this.maxY = point.y;
};

BoundingRectangle_.prototype.addPointXY = function(x, y)
{
	if (x < this.minX)
	{ this.minX = x; }
	else if (x > this.maxX)
	{ this.maxX = x; }
	
	if (y < this.minY)
	{ this.minY = y; }
	else if (y > this.maxY)
	{ this.maxY = y; }
};

BoundingRectangle_.prototype.addPoint = function(point)
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

BoundingRectangle_.prototype.intersectsWithPointXY = function(x, y)
{
	if (x > this.maxX)
	{ return false; }
	else if (x < this.minX)
	{ return false; }
	else if (y > this.maxY)
	{ return false; }
	else if (y < this.minY)
	{ return false; }
	
	return true;
};

BoundingRectangle_.prototype.intersectsWithPoint2D = function(point2D)
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