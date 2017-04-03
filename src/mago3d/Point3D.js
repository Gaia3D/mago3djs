'use strict';

/**
 * 3차원 정보
 * @class Point3D
 */
var Point3D = function() {
	if(!(this instanceof Point3D)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
};

/**
 * 어떤 일을 하고 있습니까?
 */
Point3D.prototype.destroy = function() {
    this.x = null;
    this.y = null;
    this.z = null;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
 */
Point3D.prototype.getModul = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z );
};

/**
 * 어떤 일을 하고 있습니까?
 */
Point3D.prototype.unitary = function() {
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint 
 */
Point3D.prototype.crossProduct = function(point, resultPoint) {
	if(resultPoint == undefined) resultPoint = new Point3D();
	
	var px = point.x;
	var py = point.y;
	var pz = point.z;
	
	resultPoint.x = this.y*pz - py*this.z; 
	resultPoint.y = px*this.z - this.x*pz; 
	resultPoint.z = this.x*py - px*this.y;
	
	return resultPoint;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param px 변수
 * @param py 변수
 * @param pz 변수
 * @returns dx*dx + dy*dy + dz*dz
 */
Point3D.prototype.squareDistTo = function(px, py, pz) {
    var dx = this.x - px;
    var dy = this.y - py;
    var dz = this.z - pz;
  
    return dx*dx + dy*dy + dz*dz;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param _x 변수
 * @param _y 변수
 * @param _z 변수
 */
Point3D.prototype.set = function(_x, _y, _z) {
	this.x = _x; this.y = _y; this.z = _z;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param _x 변수
 * @param _y 변수
 * @param _z 변수
 */
Point3D.prototype.add = function(_x, _y, _z) {
	this.x += _x; this.y += _y; this.z += _z;
};