'use strict';

/**
 * '별(star)'모양 폴리곤 객체
 * @exception {Error} Messages.CONSTRUCT_ERROR
 * 
 * @class Star2D
 * @constructor
 */
var Star2D_ = function() 
{
	// this is a closed element.
	/**
	 * center of star
	 * @type {Point2D}
	 */
	this.centerPoint; // Point3D.

	/**
	 * interior radius
	 * @type {Number}
	 */
	this.interiorRadius;
	/**
	 * exterior radius
	 * @type {Number}
	 */
	this.exteriorRadius;

	/**
	 * 별꼭지점 갯수
	 * @type {Number}
	 */
	this.radiusCount;
};

Star2D_.prototype.setCenterPosition = function(cx, cy)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point2D_(); }
	
	this.centerPoint.set(cx, cy);
};

/**
 * star의 interior radius 설정
 * @param {number} radius
 */
Star2D_.prototype.setInteriorRadius = function(radius)
{
	this.interiorRadius = radius;
};

/**
 * star의 exterior radius 설정
 * @param {number} radius
 */
Star2D_.prototype.setExteriorRadius = function(radius)
{
	this.exteriorRadius = radius;
};

/**
 * star의 꼭지점 갯수 설정
 * @param {number} radiusCount
 */
Star2D_.prototype.setRadiusCount = function(radiusCount)
{
	this.radiusCount = radiusCount;
};

/**
 * star의 꼭지점 배열 반환
 * @param {Array.<Point2D>} resultPointsArray
 * @returns {Array.<Point2D>} 
 */
Star2D_.prototype.getPoints = function(resultPointsArray)
{
	// star has an arrow to up.
	var increAngDeg = 360 / this.radiusCount;
	var increAngRad = increAngDeg * Math.PI/180;
	var halfIncreAngRad = increAngRad / 2;
	var startAngRad = 90 * Math.PI/180;
	var currAngRad = startAngRad;
	var point;
	var x, y;
	
	if (resultPointsArray === undefined)
	{ resultPointsArray = []; }
	
	for (var i=0; i<this.radiusCount; i++)
	{
		// exterior.
		x = this.centerPoint.x + this.exteriorRadius * Math.cos(currAngRad);
		y = this.centerPoint.y + this.exteriorRadius * Math.sin(currAngRad);
		point = new Point2D_(x, y);
		point.pointType = 1; // mark as "important point".
		resultPointsArray.push(point);
		
		// interior.
		x = this.centerPoint.x + this.interiorRadius * Math.cos(currAngRad + halfIncreAngRad);
		y = this.centerPoint.y + this.interiorRadius * Math.sin(currAngRad + halfIncreAngRad);
		point = new Point2D_(x, y);
		point.pointType = 1; // mark as "important point".
		resultPointsArray.push(point);
		
		currAngRad += increAngRad;
	}
	
	return resultPointsArray;
};