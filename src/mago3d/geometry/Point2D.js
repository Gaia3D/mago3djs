'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Point2D
*/
var Point2D = function(x, y) 
{
	if (!(this instanceof Point2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	if(x)this.x = x;
	else this.x = 0.0;
	if(y)this.y = y;
	else this.y = 0.0;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Point2D.prototype.deleteObjects = function() 
{
	this.x = undefined;
	this.y = undefined;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Point2D.prototype.copyFrom = function(point2d) 
{
	this.x = point2d.x;
	this.y = point2d.y;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Point2D.prototype.set = function(x, y) 
{
	this.x = x;
	this.y = y;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns this.x*this.x + this.y*this.y + this.z*this.z;
 */
Point2D.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
 */
Point2D.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

/**
 * 
 * 어떤 일을 하고 있습니까?
 */
Point2D.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point2D.prototype.squareDistToPoint = function(point) 
{
	var dx = this.x - point.x;
	var dy = this.y - point.y;

	return dx*dx + dy*dy;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point2D.prototype.distToPoint = function(point) 
{
	return Math.sqrt(this.squareDistToPoint(point));
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point2D.prototype.isCoincidentToPoint = function(point, errorDist) 
{
	var squareDist = this.distToPoint(point);
	var coincident = false;
	if(squareDist < errorDist*errorDist)
	{
		coincident = true;
	}

	return coincident;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 */
Point2D.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	// this returns a vector that points to "targetPoint" from "this".***
	// the "resultVector" has the direction from "this" to "targetPoint", but is NOT normalized.***
	if(targetPoint === undefined)
		return undefined;
	
	if(resultVector === undefined)
		resultVector = new Point2D();
	
	resultVector.set(targetPoint.x - this.x, targetPoint.y - this.y);
	
	return resultVector;
};

/**
 * nomal 계산
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint
 */
Point2D.prototype.crossProduct = function(point) 
{
	return this.x * point.y - point.x * this.y;
};

/**
 * nomal 계산
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint
 */
Point2D.prototype.scalarProduct = function(point) 
{
	var scalarProd = this.x*point.x + this.y*point.y;
	return scalarProd;
};














































