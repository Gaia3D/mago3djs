'use strict';

/**
 * 영역 박스
 * @class BoundingBox
 */
var BoundingBox = function() {
	if(!(this instanceof BoundingBox)) {
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
 * 영역 박스 초기화
 * @param point3d 변수
 */
BoundingBox.prototype.setInit = function(point3d) {
	this.minX = point3d.x;
	this.minY = point3d.y;
	this.minZ = point3d.z;

	this.maxX = point3d.x;
	this.maxY = point3d.y;
	this.maxZ = point3d.z;
};

/**
 * 영역 박스 삭제
 * @param point3d 변수
 */
BoundingBox.prototype.deleteObjects = function() {
	this.minX = undefined;
	this.minY = undefined;
	this.minZ = undefined;

	this.maxX = undefined;
	this.maxY = undefined;
	this.maxZ = undefined;
};

/**
 * 영역 박스 확대
 * @param dist 변수
 */
BoundingBox.prototype.expand = function(dist) {
	this.minX -= dist;
	this.minY -= dist;
	this.minZ -= dist;

	this.maxX += dist;
	this.maxY += dist;
	this.maxZ += dist;
};

/**
 * 영역 박스에 포인트를 추가하면서 영역을 변경
 * @param point3d 변수
 */
BoundingBox.prototype.addPoint3D = function(point3d) {
	if(point3d.x < this.minX) this.minX = point3d.x;
	else if(point3d.x > this.maxX) this.maxX = point3d.x;

	if(point3d.y < this.minY) this.minY = point3d.y;
	else if(point3d.y > this.maxY) this.maxY = point3d.y;

	if(point3d.z < this.minZ) this.minZ = point3d.z;
	else if(point3d.z > this.maxZ) this.maxZ = point3d.z;
};

/**
 * 영역 박스에 새로운 박스를 포함해서 새로 그림
 * @param boundingBox 변수
 */
BoundingBox.prototype.addBox = function(boundingBox) {
	if(boundingBox.minX < this.minX) this.minX = boundingBox.minX;
	if(boundingBox.maxX > this.maxX) this.maxX = boundingBox.maxX;

	if(boundingBox.minY < this.minY) this.minY = boundingBox.minY;
	if(boundingBox.maxY > this.maxY) this.maxY = boundingBox.maxY;

	if(boundingBox.minZ < this.minZ) this.minZ = boundingBox.minZ;
	if(boundingBox.maxZ > this.maxZ) this.maxZ = boundingBox.maxZ;
};

/**
 * 영역 박스 가로, 세로, 높이 중에서 최대값
 * @returns result
 */
BoundingBox.prototype.getMaxLength = function() {
	var result = this.maxX - this.minX;
	var dimY = this.maxY - this.minY;
	var dimZ = this.maxZ - this.minZ;
	if(dimY > result) result = dimY;
	if(dimZ > result) result = dimZ;

	return result;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns result
 */
BoundingBox.prototype.getXLength = function() {
	return this.maxX - this.minX;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns result
 */
BoundingBox.prototype.getYLength = function() {
	return this.maxY - this.minY;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns result
 */
BoundingBox.prototype.getZLength = function() {
	return this.maxZ - this.minZ;
};

/**
 * 영역 박스의 중심을 획득
 * @param resultPoint3d
 * @returns resultPoint3d
 */
BoundingBox.prototype.getCenterPoint3d = function(resultPoint3d) {
	if ( resultPoint3d == undefined ) resultPoint3d = new Point3D();

	resultPoint3d.set((this.maxX + this.minX)/2, (this.maxY + this.minY)/2, (this.maxZ + this.minZ)/2);
	return resultPoint3d;
};

/**
 * 영역 박스내에 존재 유무를 판단
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
BoundingBox.prototype.isPoint3dInside = function(x, y, z) {
	if(x < this.minX || x > this.maxX) {
		return false;
	} else if(y < this.minY || y > this.maxY) {
		return false;
	} else if(z < this.minZ || z > this.maxZ) {
		return false;
	}

	return true;
};
