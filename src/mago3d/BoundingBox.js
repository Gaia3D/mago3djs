'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class BoundingBox
 */
var BoundingBox = function() {
	if(!(this instanceof BoundingBox)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._minX = 1000000.0; 
	this._minY = 1000000.0;
	this._minZ = 1000000.0;
  
	this._maxX = -1000000.0; 
	this._maxY = -1000000.0;
	this._maxZ = -1000000.0;
  
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof BoundingBox
 * @param point3d 변수
 */
BoundingBox.prototype.setInit = function(point3d) {
	this._minX = point3d.x;
	this._minY = point3d.y;
	this._minZ = point3d.z;
  
	this._maxX = point3d.x; 
	this._maxY = point3d.y;
	this._maxZ = point3d.z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof BoundingBox
 * @param point3d 변수
 */
BoundingBox.prototype.expand = function(dist) {
	this._minX -= dist;
	this._minY -= dist;
	this._minZ -= dist;
  
	this._maxX += dist;
	this._maxY += dist;
	this._maxZ += dist;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof BoundingBox
 * @param point3d
 */
BoundingBox.prototype.addPoint3D = function(point3d) {
	if(point3d.x < this._minX) this._minX = point3d.x;
	else if(point3d.x > this._maxX) this._maxX = point3d.x;
  
	if(point3d.y < this._minY) this._minY = point3d.y;
	else if(point3d.y > this._maxY) this._maxY = point3d.y;
  
	if(point3d.z < this._minZ) this._minZ = point3d.z;
	else if(point3d.z > this._maxZ) this._maxZ = point3d.z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof BoundingBox
 * @param boundingBox 변수
 */  
BoundingBox.prototype.addBox = function(boundingBox) {
	if(boundingBox._minX < this._minX) this._minX = boundingBox._minX;
	if(boundingBox._maxX > this._maxX) this._maxX = boundingBox._maxX;
  
	if(boundingBox._minY < this._minY) this._minY = boundingBox._minY;
	if(boundingBox._maxY > this._maxY) this._maxY = boundingBox._maxY;
  
	if(boundingBox._minZ < this._minZ) this._minZ = boundingBox._minZ;
	if(boundingBox._maxZ > this._maxZ) this._maxZ = boundingBox._maxZ;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof BoundingBox
 * @returns result
 */
BoundingBox.prototype.getMaxLength = function() {
	var result = this._maxX - this._minX;
	var dim_y = this._maxY - this._minY;
	var dim_z = this._maxZ - this._minZ;
	if(dim_y > result) result = dim_y;
	if(dim_z > result) result = dim_z;

	return result;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof BoundingBox
 * @param resultPoint3d
 * @returns resultPoint3d
 */
BoundingBox.prototype.getCenterPoint3d = function(resultPoint3d) {
	if(resultPoint3d == undefined) resultPoint3d = new Point3D();
	
	resultPoint3d.set((this._maxX + this._minX)/2, (this._maxY + this._minY)/2, (this._maxZ + this._minZ)/2);
	return resultPoint3d;
};

/**
 * 어떤 일을 하고 있습니까?
 * @memberof BoundingBox
 * @param x 변수
 * @param y 변수
 * @param z 변수
 */
BoundingBox.prototype.isPoint3dInside = function(x, y, z) {
	if(x < this._minX || x > this._maxX) {
		return false;
	} else if(y < this._minY || y > this._maxY) {
		return false;
	} else if(z < this._minZ || z > this._maxZ) {
		return false;
	}

	return true;
};