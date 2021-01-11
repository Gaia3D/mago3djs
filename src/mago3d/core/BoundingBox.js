'use strict';

/**
 * Bounding box
 * 영역박스
 * 
 * @alias BoundingBox
 * @class BoundingBox
 */
var BoundingBox = function() 
{
	if (!(this instanceof BoundingBox)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.minX = 1000000.0;
	this.minY = 1000000.0;
	this.minZ = 1000000.0;

	this.maxX = -1000000.0;
	this.maxY = -1000000.0;
	this.maxZ = -1000000.0;
};

/**
 * Initiate the value of the bounding box
 * @param {Point3D} point 3차원 점
 */
BoundingBox.prototype.init = function(point) 
{
	point = point || new Point3D();

	this.minX = point.x;
	this.minY = point.y;
	this.minZ = point.z;

	this.maxX = point.x;
	this.maxY = point.y;
	this.maxZ = point.z;
};

/**
 * Reads the boundingBox from an arrayBuffer.
 * @param {typedArray} arrayBuffer
 * @param {Number} bytesReaded current bytesReaded on the arrayBuffer.
 */
BoundingBox.prototype.readData = function(arrayBuffer, bytesReaded) 
{
	this.minX = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.minY = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.minZ = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.maxX = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.maxY = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	this.maxZ = (new Float32Array(arrayBuffer.slice(bytesReaded, bytesReaded+4)))[0]; bytesReaded += 4;
	return bytesReaded;
};

/**
 * Sets the values of the bounding box
 * @param {Number} minX Minimum value of the boundingBox in x axis.
 * @param {Number} minY Minimum value of the boundingBox in y axis.
 * @param {Number} minZ Minimum value of the boundingBox in z axis.
 * @param {Number} maxX Maximum value of the boundingBox in x axis.
 * @param {Number} maxY Maximum value of the boundingBox in y axis.
 * @param {Number} maxZ Maximum value of the boundingBox in z axis.
 */
BoundingBox.prototype.set = function(minX, minY, minZ, maxX, maxY, maxZ) 
{
	this.minX = minX;
	this.minY = minY;
	this.minZ = minZ;

	this.maxX = maxX;
	this.maxY = maxY;
	this.maxZ = maxZ;
};

/**
 * Delete bounding box
 * 영역박스 삭제
 * 
 */
BoundingBox.prototype.deleteObjects = function() 
{
	this.minX = undefined;
	this.minY = undefined;
	this.minZ = undefined;

	this.maxX = undefined;
	this.maxY = undefined;
	this.maxZ = undefined;
};

/**
 *
 * Copy other box
 * @param bbox box
 */
BoundingBox.prototype.copyFrom = function(bbox) 
{
	this.minX = bbox.minX;
	this.minY = bbox.minY;
	this.minZ = bbox.minZ;

	this.maxX = bbox.maxX;
	this.maxY = bbox.maxY;
	this.maxZ = bbox.maxZ;
};

/**
 * Move the center of the box to the origin
 */
BoundingBox.prototype.translateToOrigin = function() 
{
	var semiXLength = this.getXLength() /2;
	var semiYLength = this.getYLength() /2;
	var semiZLength = this.getZLength() /2;
	
	this.minX = -semiXLength;
	this.minY = -semiYLength;
	this.minZ = -semiZLength;

	this.maxX = semiXLength;
	this.maxY = semiYLength;
	this.maxZ = semiZLength;
};

/**
 * Expane the size of the box as double of the given distance
 * 영역박스 확대
 * 
 * @param {Number} distance
 */
BoundingBox.prototype.expand = function(distance) 
{
	distance = distance || 0.0;
	distance = Math.abs(distance);

	this.minX -= distance;
	this.minY -= distance;
	this.minZ -= distance;

	this.maxX += distance;
	this.maxY += distance;
	this.maxZ += distance;
};
/**
 * 중심점과 박스의 변의 길이로 bbox 만들기
 * 
 * @param {Point3D} point 3차원 점
 * @param {number} size 
 * @return {BoundingBox}
 */
BoundingBox.getBBoxByPonintAndSize = function(point, size) 
{

	if (!point || !point instanceof Point3D) 
	{
		throw new Error('point is required');
	}

	if (isNaN(size))
	{
		throw new Error('size must number.');
	}
	
	var bbox = new BoundingBox();
	var maxX = point.x + size;
	var minX = point.x - size;
	var maxY = point.y + size;
	var minY = point.y - size;
	var minZ = point.z - size;
	var maxZ = point.z + size;
	bbox.set(minX, minY, minZ, maxX, maxY, maxZ);

	return bbox;
};

/**
 * 주어진 3차원 점을 포함하는 영역으로 영역박스 크기를 변경
 * 
 * @param {Point3D} point 3차원 점
 */
BoundingBox.getBBoxByXYZDataArray = function(xyzDataArray, resultBBox) 
{
	if (xyzDataArray === undefined)
	{ return undefined; }

	var points3dCount = xyzDataArray.length/3;
	
	if (points3dCount === 0)
	{ return undefined; }

	if (resultBBox === undefined)
	{ resultBBox = new BoundingBox(); }
	
	resultBBox.init(new Point3D(xyzDataArray[0], xyzDataArray[1], xyzDataArray[2]));
	for (var i=0; i<points3dCount; i++)
	{
		resultBBox.addXYZData(xyzDataArray[i*3], xyzDataArray[i*3+1], xyzDataArray[i*3+2]);
	}
	
	return resultBBox;
};

/**
 * 주어진 3차원 점을 포함하는 영역으로 영역박스 크기를 변경
 * 
 * @param {Point3D} point 3차원 점
 */
BoundingBox.prototype.addXYZData = function(x, y, z) 
{
	if (x === undefined || y === undefined || z === undefined )	{ return; }

	if (x < this.minX) { this.minX = x; }
	else if (x > this.maxX) { this.maxX = x; }

	if (y < this.minY) { this.minY = y; }
	else if (y > this.maxY) { this.maxY = y; }

	if (z < this.minZ) { this.minZ = z; }
	else if (z > this.maxZ) { this.maxZ = z; }
};

/**
 * 주어진 3차원 점을 포함하는 영역으로 영역박스 크기를 변경
 * 
 * @param {Point3D} point 3차원 점
 */
BoundingBox.prototype.addPointsArray = function(pointsArray) 
{
	if (pointsArray === undefined || pointsArray.length === 0)
	{ return; }
	
	this.init(pointsArray[0]);
	var pointsCount = pointsArray.length;
	for (var i=0;i<pointsCount;++i)
	{
		this.addPoint(pointsArray[i]);
	}
};

/**
 * 주어진 3차원 점을 포함하는 영역으로 영역박스 크기를 변경
 * 
 * @param {Point3D} point 3차원 점
 */
BoundingBox.prototype.addPoint = function(point) 
{
	if (point === undefined)	{ return; }

	if (point.x < this.minX) { this.minX = point.x; }
	else if (point.x > this.maxX) { this.maxX = point.x; }

	if (point.y < this.minY) { this.minY = point.y; }
	else if (point.y > this.maxY) { this.maxY = point.y; }

	if (point.z < this.minZ) { this.minZ = point.z; }
	else if (point.z > this.maxZ) { this.maxZ = point.z; }
};

/**
 * Set the range of the box which contain given box
 * 주어진 영역박스를 포함하는 영역으로 영역박스 크기를 변경
 * 
 * @param {BoundingBox} box 영역박스
 */
BoundingBox.prototype.addBox = function(box) 
{
	if (box === undefined)	{ return; }

	if (box.minX < this.minX) { this.minX = box.minX; }
	if (box.maxX > this.maxX) { this.maxX = box.maxX; }

	if (box.minY < this.minY) { this.minY = box.minY; }
	if (box.maxY > this.maxY) { this.maxY = box.maxY; }

	if (box.minZ < this.minZ) { this.minZ = box.minZ; }
	if (box.maxZ > this.maxZ) { this.maxZ = box.maxZ; }
};

/**
 * Get the minimum length among x, y, z edges' lengths
 * 영역박스의 가로, 세로, 높이 중에서 최소값
 * 
 * @returns {Number} 최소값
 */
BoundingBox.prototype.getMinLength = function() 
{
	return Math.min(this.maxX - this.minX, this.maxY - this.minY, this.maxZ - this.minZ);
};

/**
 * Get the maximum length among x, y, z edges' lengths
 * @returns {Number} 최대값
 */
BoundingBox.prototype.getMaxLength = function() 
{
	return Math.max(this.maxX - this.minX, this.maxY - this.minY, this.maxZ - this.minZ);
};

/**
 * Get the length of the edge which is parallel to x axis
 * 영역박스의 X축 방향의 길이
 * 
 * @returns {Number} 길이값
 */
BoundingBox.prototype.getXLength = function() 
{
	return this.maxX - this.minX;
};

/**
 * Get the length of the edge which is parallel to y axis
 * 영역박스의 Y축 방향의 길이
 * 
 * @returns {Number} 길이값
 */
BoundingBox.prototype.getYLength = function() 
{
	return this.maxY - this.minY;
};

/**
 * Get the length of the edge which is parallel to z axis
 * 영역박스의 Z축 방향의 길이
 * 
 * @returns {Number} 길이값
 */
BoundingBox.prototype.getZLength = function() 
{
	return this.maxZ - this.minZ;
};

/**
 * Get the center point of this box
 * 영역박스의 중심점을 구한다.
 * 
 * @param {Point3D} result 영역박스의 중심점
 * 
 * @returns {Point3D} 영역박스의 중심점
 */
BoundingBox.prototype.getCenterPoint = function(result) 
{
	if ( result === undefined ) { result = new Point3D(); }
	result.set((this.maxX + this.minX)/2, (this.maxY + this.minY)/2, (this.maxZ + this.minZ)/2);
	return result;
};

/**
 * Get the center point of this box
 * 영역박스의 중심점을 구한다.
 * 
 * @param {Point3D} result 영역박스의 중심점
 * 
 * @returns {Point3D} 영역박스의 중심점
 */
BoundingBox.prototype.getMinPoint = function(result) 
{
	if ( result === undefined ) { result = new Point3D(); }
	result.set(this.minX, this.minY, this.minZ);
	return result;
};

/**
 * Get the center point of this box
 * 영역박스의 중심점을 구한다.
 * 
 * @param {Point3D} result 영역박스의 중심점
 * 
 * @returns {Point3D} 영역박스의 중심점
 */
BoundingBox.prototype.getMaxPoint = function(result) 
{
	if ( result === undefined ) { result = new Point3D(); }
	result.set(this.maxX, this.maxY, this.maxZ);
	return result;
};

/**
 * Get the center point of this box
 * 영역박스의 중심점을 구한다.
 * 
 * @param {Point3D} result 영역박스의 중심점
 * 
 * @returns {Point3D} 영역박스의 중심점
 */
BoundingBox.prototype.getBottomCenterPoint = function(result) 
{
	if ( result === undefined ) { result = new Point3D(); }

	result.set((this.maxX + this.minX)/2, (this.maxY + this.minY)/2, 0);

	return result;
};

/**
 * 
 * 영역박스의 중심점을 구한다.
 * 
 * @returns {Number} apriximately radius.
 */
BoundingBox.prototype.getRadiusAprox = function() 
{
	var maxLength = this.getMaxLength();
	return maxLength/1.5;
};

/**
 * 
 * 영역박스의 중심점을 구한다.
 * 
 * @returns {Number} apriximately radius.
 */
BoundingBox.prototype.getRadius = function() 
{
	var centerPoint = this.getCenterPoint();
	var minPoint = this.getMinPoint();
	return centerPoint.distToPoint(minPoint);
};

/**
 * 
 * 영역박스의 중심점을 구한다.
 * 
 * @returns {Number} apriximately radius.
 */
BoundingBox.prototype.getBoundingSphere = function(resultBoundingSphere) 
{
	if (resultBoundingSphere === undefined)
	{ resultBoundingSphere = new Sphere(); } 
	
	var centerPos = this.getCenterPoint();
	resultBoundingSphere.setCenterPoint(centerPos.x, centerPos.y, centerPos.z);
	resultBoundingSphere.setRadius(this.getRadiusAprox());
	
	return resultBoundingSphere;
};


/**
 * 영역박스와 점과의 교차 여부를 판단
 * 
 * @param {Point3D} point 3차원 점
 * @returns {Boolean} 교차 여부
 */
BoundingBox.prototype.intersectWithPoint = function(point) 
{
	if (point === undefined)	{ return false; }

	if (point.x < this.minX || point.x > this.maxX || 
		point.y < this.minY || point.y > this.maxY ||
		point.z < this.minZ || point.z > this.maxZ) 
	{
		return false;
	}

	//return this.isPoint3dInside(point.x, point.y, point.z);
	return true;
};

/**
 * Check whether the given point is contained or intersected with this box
 * 영역박스와 점과의 교차 여부를 판단
 * 
 * @param {Number} x x성분
 * @param {Number} y y성분
 * @param {Number} z z성분
 * @returns {Boolean} 교차 여부
 */
BoundingBox.prototype.isPoint3dInside = function(x, y, z) 
{
	if (x < this.minX || x > this.maxX) 
	{
		return false;
	}
	else if (y < this.minY || y > this.maxY) 
	{
		return false;
	}
	else if (z < this.minZ || z > this.maxZ) 
	{
		return false;
	}

	return true;
};

/**
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {BoundingBox} box 영역박스
 * @returns {Boolean} 교차 여부
 */
BoundingBox.prototype.intersectWithBox = function(box)
{
	if (box === undefined)	{ return false; }

	if (box.minX > this.maxX || box.maxX < this.minX ||
		box.minY > this.maxY || box.maxY < this.minY ||
		box.minZ > this.maxZ || box.maxZ < this.minZ)
	{
		return false;
	}

	return true;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.getPlaneTop = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane(); }
	
	var point = this.getMaxPoint();
	resultPlane.setPointAndNormal(point.x, point.y, point.z, 0, 0, 1);
	
	return resultPlane;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.getPlaneBottom = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane(); }
	
	var point = this.getMinPoint();
	resultPlane.setPointAndNormal(point.x, point.y, point.z, 0, 0, -1);
	
	return resultPlane;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.getPlaneFront = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane(); }
	
	var point = this.getMinPoint();
	resultPlane.setPointAndNormal(point.x, point.y, point.z, 0, -1, 0);
	
	return resultPlane;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.getPlaneRear = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane(); }
	
	var point = this.getMaxPoint();
	resultPlane.setPointAndNormal(point.x, point.y, point.z, 0, 1, 0);
	
	return resultPlane;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.getPlaneLeft = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane(); }
	
	var point = this.getMinPoint();
	resultPlane.setPointAndNormal(point.x, point.y, point.z, -1, 0, 0);
	
	return resultPlane;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.getPlaneRight = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane(); }
	
	var point = this.getMaxPoint();
	resultPlane.setPointAndNormal(point.x, point.y, point.z, 1, 0, 0);
	
	return resultPlane;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.isPoint3dInsideXYPrism = function(point3d) 
{
	if (point3d === undefined)
	{ return false; }
	
	if (point3d.x < this.minX || point3d.x > this.maxX || 
		point3d.y < this.minY || point3d.y > this.maxY) 
	{
		return false;
	}
	
	return true;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.isPoint3dInsideXZPrism = function(point3d) 
{
	if (point3d === undefined)
	{ return false; }
	
	if (point3d.x < this.minX || point3d.x > this.maxX || 
		point3d.z < this.minZ || point3d.z > this.maxZ) 
	{
		return false;
	}
	
	return true;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.isPoint3dInsideYZPrism = function(point3d) 
{
	if (point3d === undefined)
	{ return false; }
	
	if (point3d.y < this.minY || point3d.y > this.maxY ||
		point3d.z < this.minZ || point3d.z > this.maxZ) 
	{
		return false;
	}
	
	return true;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.intersectsWithSegment3D = function(segment3d) 
{
	if (segment3d === undefined)
	{ return false; }
	
	var line = segment3d.getLine();
	
	// 1) Top.
	var plane = this.getPlaneTop();
	var intersectionPoint = plane.intersectionLine(line, intersectionPoint);
	if (intersectionPoint !== undefined)
	{
		// check if the intersectionPoint is inside of the top rectangle.
		if (this.isPoint3dInsideXYPrism(intersectionPoint))
		{ 
			// check if intersectionPoint is inside of the segment3d.
			if (segment3d.intersectionWithPoint(intersectionPoint))
			{ return true; }
		}
	}
	
	// 2) Bottom.
	var plane = this.getPlaneBottom();
	var intersectionPoint = plane.intersectionLine(line, intersectionPoint);
	if (intersectionPoint !== undefined)
	{
		// check if the intersectionPoint is inside of the top rectangle.
		if (this.isPoint3dInsideXYPrism(intersectionPoint))
		{ 
			// check if intersectionPoint is inside of the segment3d.
			if (segment3d.intersectionWithPoint(intersectionPoint))
			{ return true; }
		}
	}
	
	// 3) Front.
	var plane = this.getPlaneFront();
	var intersectionPoint = plane.intersectionLine(line, intersectionPoint);
	if (intersectionPoint !== undefined)
	{
		// check if the intersectionPoint is inside of the top rectangle.
		if (this.isPoint3dInsideXZPrism(intersectionPoint))
		{ 
			// check if intersectionPoint is inside of the segment3d.
			if (segment3d.intersectionWithPoint(intersectionPoint))
			{ return true; }
		}
	}
	
	// 4) Rear.
	var plane = this.getPlaneRear();
	var intersectionPoint = plane.intersectionLine(line, intersectionPoint);
	if (intersectionPoint !== undefined)
	{
		// check if the intersectionPoint is inside of the top rectangle.
		if (this.isPoint3dInsideXZPrism(intersectionPoint))
		{ 
			// check if intersectionPoint is inside of the segment3d.
			if (segment3d.intersectionWithPoint(intersectionPoint))
			{ return true; }
		}
	}
	
	// 5) Left.
	var plane = this.getPlaneLeft();
	var intersectionPoint = plane.intersectionLine(line, intersectionPoint);
	if (intersectionPoint !== undefined)
	{
		// check if the intersectionPoint is inside of the top rectangle.
		if (this.isPoint3dInsideYZPrism(intersectionPoint))
		{ 
			// check if intersectionPoint is inside of the segment3d.
			if (segment3d.intersectionWithPoint(intersectionPoint))
			{ return true; }
		}
	}
	
	// 6) Right.
	var plane = this.getPlaneRight();
	var intersectionPoint = plane.intersectionLine(line, intersectionPoint);
	if (intersectionPoint !== undefined)
	{
		// check if the intersectionPoint is inside of the top rectangle.
		if (this.isPoint3dInsideYZPrism(intersectionPoint))
		{ 
			// check if intersectionPoint is inside of the segment3d.
			if (segment3d.intersectionWithPoint(intersectionPoint))
			{ return true; }
		}
	}
	
	return false;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {Triangle} triangle
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.intersectsWithTriangle = function(triangle) 
{
	if (triangle === undefined)
	{ return false; }

	var normal = triangle.getPlaneNormal();
	if (normal.isNAN())
	{ return false; }
	
	// 1) check if intersects with triangle'sBbox.
	var triBbox = triangle.getBoundingBox();
	if (!this.intersectsWithBBox(triBbox))
	{ return false; }

	// 2) check if some vertex is inside of the this bbox.
	if (this.intersectWithPoint(triangle.vertex0.getPosition()) || this.intersectWithPoint(triangle.vertex1.getPosition()) || this.intersectWithPoint(triangle.vertex2.getPosition()))
	{ return true; }

	// 3) check if the bbox is near of the triangle's plane.
	var trianglesPlane = triangle.getPlane();
	var centerPoint = this.getCenterPoint();
	var projectedPoint = trianglesPlane.getProjectedPoint(centerPoint);
	
	var dist = centerPoint.distToPoint(projectedPoint);
	var radius = this.getRadius();
	if (dist > radius)
	{
		return false;
	}
	
	// 4) check if some edge of the triangle intersects with this bbox.
	for (var i=0; i<3; i++)
	{
		var trianglesSegment3d = triangle.getSegment(i, trianglesSegment3d);
		if (this.intersectsWithSegment3D(trianglesSegment3d))
		{ return true; }
	}
	
	// 5) finally, check if the bbox is inside of the triangle.
	var bestPlane = Face.getBestFacePlaneToProject(normal);
	
	var triangle2d = GeometryUtils.projectTriangle3DInToBestPlaneToProject(triangle, bestPlane, undefined);
	var point2d = GeometryUtils.projectPoint3DInToBestPlaneToProject(centerPoint, bestPlane, undefined);
	
	if (!triangle2d.isPoint2dInside(point2d))
	{ return false; }
	
	return true;
};

/**
 * Check whether this box and the given box are intersected by each others.
 * 영역박스와 주어진 영역박스와의 교차 여부를 판단
 * 
 * @param {BoundingBox} box Bounding box 영역박스
 * @returns {Boolean} the flag whether they are intersected or not 교차 여부 
 */
BoundingBox.prototype.intersectsWithBBox = function(box) 
{
	var intersection = true;

	if (this.maxX < box.minX)
	{
		intersection = false;
	}
	else if (this.minX > box.maxX)
	{
		intersection = false;
	}
	else if (this.maxY < box.minY)
	{
		intersection = false;
	}
	else if (this.minY > box.maxY)
	{
		intersection = false;
	}
	else if (this.maxZ < box.minZ)
	{
		intersection = false;
	}
	else if (this.minZ > box.maxZ)
	{
		intersection = false;
	}

	return intersection;
};

BoundingBox.prototype.getGeographicCoordPolygon2D = function(tMat) 
{
	var lb = new Point3D(this.minX, this.minY, this.minZ);
	var rb = new Point3D(this.maxX, this.minY, this.minZ);
	var rt = new Point3D(this.maxX, this.maxY, this.minZ);
	var lt = new Point3D(this.minX, this.maxY, this.minZ);

	var lbWC = tMat.transformPoint3D(lb);
	var rbWC = tMat.transformPoint3D(rb);
	var rtWC = tMat.transformPoint3D(rt);
	var ltWC = tMat.transformPoint3D(lt);

	var gArray = [];
	gArray.push(ManagerUtils.pointToGeographicCoord(lbWC));
	gArray.push(ManagerUtils.pointToGeographicCoord(rbWC));
	gArray.push(ManagerUtils.pointToGeographicCoord(rtWC));
	gArray.push(ManagerUtils.pointToGeographicCoord(ltWC));

	return Polygon2D.makePolygonByGeographicCoordArray(gArray);
};
