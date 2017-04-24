'use strict';

/**
* 어떤 일을 하고 있습니까?
* @class Quaternion
*/
var Quaternion = function() {
	if(!(this instanceof Quaternion)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.x = 0.0;
	this.y = 0.0;
	this.z = 0.0;
	this.w = 1.0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w )
 */
Quaternion.prototype.Modul = function() {
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z + this.w*this.w );
};

/**
 * 어떤 일을 하고 있습니까?
 */
Quaternion.prototype.Unitary = function() {
	var modul = this.Modul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
	this.w /= modul;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param angDeg 변수
 * @param axis_x 변수
 * @param axis_y 변수
 * @param axis_z 변수
 */
Quaternion.prototype.rotationAngDeg = function(angDeg, axis_x, axis_y, axis_z) {
	var angRad = angDeg*Math.PI/180.0;
	this.rotationAngRad(angRad, axis_x, axis_y, axis_z);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param angRad 변수
 * @param axis_x 변수
 * @param axis_y 변수
 * @param axis_z 변수
 */
Quaternion.prototype.rotationAngRad = function(angRad, axis_x, axis_y, axis_z) {
	var s = Math.sqrt(axis_x*axis_x + axis_y*axis_y + axis_z*axis_z);
	var error = 10E-13;
	if(!s < error) {
		var c = 1.0/s;
		var omega = -0.5 * angRad;
		s = Math.sin(omega);
		this.x = axis_x * c * s;
		this.y = axis_y * c * s;
		this.z = axis_z * c * s;
		this.w = Math.cos(omega);
		this.Unitary();
	} else {
		this.x = 0.0;
		this.y = 0.0;
		this.z = 0.0;
		this.w = 1.0;
	}
};
