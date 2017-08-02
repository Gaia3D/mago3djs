'use strict';

/**
 * 영역 박스
 * @class AuxiliarSegment
 */
var AuxiliarSegment = function() 
{
	if (!(this instanceof AuxiliarSegment)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.point1; //auxSegment.point1 = new WorldWind.Vec3();
	this.point2; //auxSegment.point2 = new WorldWind.Vec3();
};

AuxiliarSegment.prototype.setPoints = function(point1X, point1Y, point1Z,   point2X, point2Y, point2Z)
{
	this.point1[0] = point1X;
	this.point1[1] = point1Y;
	this.point1[2] = point1Z;
	
	this.point2[0] = point2X;
	this.point2[1] = point2Y;
	this.point2[2] = point2Z;
};