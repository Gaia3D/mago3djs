'use strict';

/**
 * 3차원 정보
 * @class Point3D
 */
var Point3D = function() 
{
	if (!(this instanceof Point3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Point3D.prototype.deleteObjects = function() 
{
	this.x = undefined;
	this.y = undefined;
	this.z = undefined;
};

/**
 * 포인트값 삭제
 * 어떤 일을 하고 있습니까?
 */
Point3D.prototype.copyFrom = function(point3d) 
{
	this.x = point3d.x;
	this.y = point3d.y;
	this.z = point3d.z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns this.x*this.x + this.y*this.y + this.z*this.z;
 */
Point3D.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y + this.z*this.z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
 */
Point3D.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

/**
 * 
 * 어떤 일을 하고 있습니까?
 */
Point3D.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
};

/**
 * nomal 계산
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint
 */
Point3D.prototype.crossProduct = function(point, resultPoint) 
{
	if (resultPoint === undefined) { resultPoint = new Point3D(); }

	resultPoint.x = this.y * point.z - point.y * this.z;
	resultPoint.y = point.x * this.z - this.x * point.z;
	resultPoint.z = this.x * point.y - point.x * this.y;

	return resultPoint;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.squareDistToPoint = function(point) 
{
	var dx = this.x - point.x;
	var dy = this.y - point.y;
	var dz = this.z - point.z;

	return dx*dx + dy*dy + dz*dz;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.squareDistTo = function(x, y, z) 
{
	var dx = this.x - x;
	var dy = this.y - y;
	var dz = this.z - z;

	return dx*dx + dy*dy + dz*dz;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.distTo = function(x, y, z) 
{
	return Math.sqrt(this.squareDistTo(x, y, z));
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.distToPoint = function(point) 
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
Point3D.prototype.distToSphere = function(sphere) 
{
	return Math.sqrt(this.squareDistToPoint(sphere.centerPoint)) - sphere.r;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.aproxDistTo = function(pointB, sqrtTable) 
{
	var difX = Math.abs(this.x - pointB.x);
	var difY = Math.abs(this.y - pointB.y);
	var difZ = Math.abs(this.z - pointB.z);
	
	// find the big value.
	var maxValue, value1, value2;
	var value1Idx, value2Idx;
	var aproxDist;
	
	if (difX > difY)
	{
		if (difX > difZ)
		{
			maxValue = difX;
			value1 = difY/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difZ/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
		else 
		{
			maxValue = difZ;
			value1 = difX/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difY/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
	}
	else 
	{
		if (difY > difZ)
		{
			maxValue = difY;
			value1 = difX/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difZ/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
		else 
		{
			maxValue = difZ;
			value1 = difX/maxValue;
			value1Idx = Math.floor(value1*10);
			var middleDist = maxValue * sqrtTable[value1Idx];
			value2 = difY/middleDist;
			value2Idx = Math.floor(value2*10);
			return (middleDist * sqrtTable[value2Idx]);
		}
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Point3D.prototype.set = function(x, y, z) 
{
	this.x = x; this.y = y; this.z = z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
Point3D.prototype.add = function(x, y, z) 
{
	this.x += x; this.y += y; this.z += z;
};
