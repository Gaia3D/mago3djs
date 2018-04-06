'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Star
 */
var Star = function() 
{
	if (!(this instanceof Star)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	// this is a closed element.***
	this.centerPoint; // Point3D.***
	this.interiorRadius;
	this.exteriorRadius;
	this.radiusCount;

};

/**
 * Set the center position of Star.
 * @class Star
 */
Star.prototype.setCenterPosition = function(cx, cy)
{
	if (this.centerPoint === undefined)
	{ this.centerPoint = new Point2D(); }
	
	this.centerPoint.set(cx, cy);
};

/**
 * @class Star
 */
Star.prototype.setInteriorRadius = function(radius)
{
	this.interiorRadius = radius;
};

/**
 * @class Star
 */
Star.prototype.setExteriorRadius = function(radius)
{
	this.exteriorRadius = radius;
};

/**
 * @class Star
 */
Star.prototype.setRadiusCount = function(rediusCount)
{
	this.radiusCount = rediusCount;
};

/**
 * Returns the points of the Star.
 * @class Star
 */
Star.prototype.getPoints = function(resultPointsArray)
{
	// star has an arrow to up.***
	var increAngDeg = 360 / this.radiusCount;
	var increAngRad = increAngDeg * Math.PI/180;
	var halfIncreAngRad = increAngRad / 2;
	var startAngRad = 90 * Math.PI/180;
	var currAngRad = startAngRad;
	var point;
	var x, y;
	
	if(resultPointsArray === undefined)
		resultPointsArray = [];
	
	for(var i=0; i<this.radiusCount; i++)
	{
		// exterior.***
		x = this.centerPoint.x + this.exteriorRadius * Math.cos(currAngRad);
		y = this.centerPoint.y + this.exteriorRadius * Math.sin(currAngRad);
		point = new Point2D(x, y);
		point.pointType = 1; // mark as "important point".***
		resultPointsArray.push(point);
		
		// interior.***
		x = this.centerPoint.x + this.interiorRadius * Math.cos(currAngRad + halfIncreAngRad);
		y = this.centerPoint.y + this.interiorRadius * Math.sin(currAngRad + halfIncreAngRad);
		point = new Point2D(x, y);
		point.pointType = 1; // mark as "important point".***
		resultPointsArray.push(point);
		
		currAngRad += increAngRad;
	}
	
	return resultPointsArray;
};

















































