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
 * Make the vbo of this
 * @param magoManager
 */
Segment3D.getVboThickLines = function(magoManager, segment3dArray, resultVboKeysContainer)
{
	if (segment3dArray === undefined)
	{ return resultVboKeysContainer; }

	if (resultVboKeysContainer === undefined)
	{ resultVboKeysContainer = new VBOVertexIdxCacheKeysContainer(); }

	var segmentsCount = segment3dArray.length;

	// in this case make point4d (x, y, z, w). In "w" save the sign (1 or -1) for the offset in the shader to draw triangles strip.
	// check if the indexes is bigger than 65536. TODO.
	var repeats = 4;
	var pointDimension = 4;
	var pointsCount = segmentsCount * 2;
	var posVboDataArray = new Float32Array(pointsCount * pointDimension * repeats);
	var segment3d;
	var point_A, point_B;
	for (var i=0; i<segmentsCount; i++)
	{
		segment3d = segment3dArray[i];
		point_A = segment3d.startPoint3d;
		point_B = segment3d.endPoint3d;
		
		// point_A.
		posVboDataArray[i*32] = point_A.x;
		posVboDataArray[i*32+1] = point_A.y;
		posVboDataArray[i*32+2] = point_A.z;
		posVboDataArray[i*32+3] = 1; // order.
		
		posVboDataArray[i*32+4] = point_A.x;
		posVboDataArray[i*32+5] = point_A.y;
		posVboDataArray[i*32+6] = point_A.z;
		posVboDataArray[i*32+7] = -1; // order.
		
		posVboDataArray[i*32+8] = point_A.x;
		posVboDataArray[i*32+9] = point_A.y;
		posVboDataArray[i*32+10] = point_A.z;
		posVboDataArray[i*32+11] = 2; // order.
		
		posVboDataArray[i*32+12] = point_A.x;
		posVboDataArray[i*32+13] = point_A.y;
		posVboDataArray[i*32+14] = point_A.z;
		posVboDataArray[i*32+15] = -2; // order.
		
		// point_B.
		posVboDataArray[i*32+16] = point_B.x;
		posVboDataArray[i*32+17] = point_B.y;
		posVboDataArray[i*32+18] = point_B.z;
		posVboDataArray[i*32+19] = 1; // order.
		
		posVboDataArray[i*32+20] = point_B.x;
		posVboDataArray[i*32+21] = point_B.y;
		posVboDataArray[i*32+22] = point_B.z;
		posVboDataArray[i*32+23] = -1; // order.
		
		posVboDataArray[i*32+24] = point_B.x;
		posVboDataArray[i*32+25] = point_B.y;
		posVboDataArray[i*32+26] = point_B.z;
		posVboDataArray[i*32+27] = 2; // order.
		
		posVboDataArray[i*32+28] = point_B.x;
		posVboDataArray[i*32+29] = point_B.y;
		posVboDataArray[i*32+30] = point_B.z;
		posVboDataArray[i*32+31] = -2; // order.
	}
	
	var vbo = resultVboKeysContainer.newVBOVertexIdxCacheKey();
	vbo.setDataArrayPos(posVboDataArray, magoManager.vboMemoryManager, pointDimension);
	
	return resultVboKeysContainer;
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






















