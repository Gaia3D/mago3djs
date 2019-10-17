'use strict';
/**
 * 선분 생성을 위한 클래스
 *
 * @param {Point3D} strPoint2D 시작 포인트
 * @param {Point3D} endPoint2D 종료 포인트
 */
var Segment3D = function(strPoint3D, endPoint3D) 
{
	if (!(this instanceof Segment3D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.startPoint3d;
	this.endPoint3d;
	
	if (strPoint3D)
	{
		this.startPoint3d = strPoint3D;
	}
	
	if (endPoint3D)
	{
		this.endPoint3d = endPoint3D;
	}
};

/**
 * 선분에 포인트를 설정한다.
 *
 * @param {Point3D} strPoint3D 시작 포인트
 * @param {Point3D} endPoint3D 종료 포인트
 */
Segment3D.prototype.intersectionWithPoint = function(point, error)
{
	if (point === undefined)
	{ return false; }
	
	// calculate the distance.
	if (error === undefined)
	{ error = 10E-8; }
	
	var totalLength = this.getLength();
	var distA = this.startPoint3d.distToPoint(point);
	var distB = this.endPoint3d.distToPoint(point);
	
	var diff = totalLength - distA - distB;
	if (Math.abs(diff) < error)
	{ return true; }
	
	return false;
};

/**
 * 선분에 포인트를 설정한다.
 *
 * @param {Point3D} strPoint3D 시작 포인트
 * @param {Point3D} endPoint3D 종료 포인트
 */
Segment3D.prototype.getLine = function(resultLine)
{
	if (resultLine === undefined)
	{ resultLine = new Line(); }
	
	var direction = this.getDirection();
	resultLine.setPointAndDir(this.startPoint3d.x, this.startPoint3d.y, this.startPoint3d.z, direction.x, direction.y, direction.z);
	
	return resultLine;
};

/**
 * 선분에 포인트를 설정한다.
 *
 * @param {Point3D} strPoint3D 시작 포인트
 * @param {Point3D} endPoint3D 종료 포인트
 */
Segment3D.prototype.setPoints = function(strPoint3D, endPoint3D)
{
	if (strPoint3D)
	{
		this.startPoint3d = strPoint3D;
	}
	
	if (endPoint3D)
	{
		this.endPoint3d = endPoint3D;
	}
};

/**
 * 시작 포인트에서 종료 포인트까지의 벡터를 구한다.
 *
 * @param {Point3D} result 벡터 결과값
 * @returns {Point3D} 벡터 결과값
 */
Segment3D.prototype.getVector = function(result)
{
	if (this.startPoint3d === undefined || this.endPoint3d === undefined)
	{
		return undefined;
	}
	
	if (result === undefined)
	{
		result = new Point3D();
	}
	
	result = this.startPoint3d.getVectorToPoint(this.endPoint3d, result);
	return result;
};

/**
 * 선분의 방향값을 계산한다.
 *
 * @param {Point3D} result 선분이 나타내는 방향값
 * @returns {Point3D} 선분이 나타내는 방향값
 */
Segment3D.prototype.getDirection = function(result)
{
	if (result === undefined)
	{
		result = new Point3D();
	}
	
	result = this.getVector(result);
	result.unitary();
	
	return result;
};

/**
 * 시작 포인트와 종료 포인트를 맞바꾼다.
 * interchange strPoint & endPoint.
 */
Segment3D.prototype.invertSense = function()
{
	var point3dAux = this.startPoint3d;
	this.startPoint3d = this.endPoint3d;
	this.endPoint3d = point3dAux;
};

/**
 * 시작 포인트와 종료 포인트를 맞바꾼다.
 * interchange strPoint & endPoint.
 */
Segment3D.prototype.getLength = function()
{
	return this.startPoint3d.distToPoint(this.endPoint3d);
};






















