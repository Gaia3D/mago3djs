'use strict';

/**
 * Triangle2D(삼각형)를 생성하기 위한 클래스
 * 
 * @class Triangle2D
 *  
 * @param {Point2D} point2d0
 * @param {Point2D} point2d1
 * @param {Point2D} point2d2
 */
var Triangle2D = function(point2d0, point2d1, point2d2) 
{
	if (!(this instanceof Triangle2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.point2d0;
	this.point2d1;
	this.point2d2;
	
	if (point2d0 !== undefined)
	{ this.point2d0 = point2d0; }
	
	if (point2d1 !== undefined)
	{ this.point2d1 = point2d1; }
	
	if (point2d2 !== undefined)
	{ this.point2d2 = point2d2; }
};

/**
 * Triangle의 각각의 Vertex 설정
 * 
 * @param {Point2D} point2d0
 * @param {Point2D} point2d1
 * @param {Point2D} point2d2
 */
Triangle2D.prototype.setPoints = function(point2d0, point2d1, point2d2) 
{
	this.point2d0 = point2d0;
	this.point2d1 = point2d1;
	this.point2d2 = point2d2;
};

/**
 * Triangle의 각각의 Vertex 설정
 * 
 * @param {Point2D} p1
 * @param {Point2D} p2
 * @param {Point2D} p3
 */
Triangle2D.sign = function(p1, p2, p3) 
{
	return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

/**
 * Triangle의 각각의 Vertex 설정
 * 
 * @param {Point2D} point2d0
 * @param {Point2D} point2d1
 * @param {Point2D} point2d2
 */
Triangle2D.prototype.isPoint2dInside = function(point2d) 
{
	var sign1 = Triangle2D.sign(point2d, this.point2d0, this.point2d1) < 0;
	var sign2 = Triangle2D.sign(point2d, this.point2d1, this.point2d2) < 0;
	var sign3 = Triangle2D.sign(point2d, this.point2d2, this.point2d0) < 0;
	
	var isInside = ((sign1 === sign2) && (sign2 === sign3));
	return isInside;
};





















