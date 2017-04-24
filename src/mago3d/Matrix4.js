'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Matrix4
 */
var Matrix4 = function() {
	if(!(this instanceof Matrix4)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._floatArrays = [ 	1, 0, 0, 0,
							0, 1, 0, 0,
							0, 0, 1, 0,
							0, 0, 0, 1
						];
};

/**
 * 어떤 일을 하고 있습니까?
 */
Matrix4.prototype.Identity = function() {
	this._floatArrays = [ 	1, 0, 0, 0,
							0, 1, 0, 0,
							0, 0, 1, 0,
							0, 0, 0, 1
						];
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns rowMajor_matrix
 */
Matrix4.prototype.getRowMajorMatrix = function() {
	var rowMajor_matrix = new Float32Array(16);

	rowMajor_matrix[0] = this.get(0,0);
	rowMajor_matrix[1] = this.get(1,0);
	rowMajor_matrix[2] = this.get(2,0);
	rowMajor_matrix[3] = this.get(3,0);

	rowMajor_matrix[4] = this.get(0,1);
	rowMajor_matrix[5] = this.get(1,1);
	rowMajor_matrix[6] = this.get(2,1);
	rowMajor_matrix[7] = this.get(3,1);

	rowMajor_matrix[8] = this.get(0,2);
	rowMajor_matrix[9] = this.get(1,2);
	rowMajor_matrix[10] = this.get(2,2);
	rowMajor_matrix[11] = this.get(3,2);

	rowMajor_matrix[12] = this.get(0,3);
	rowMajor_matrix[13] = this.get(1,3);
	rowMajor_matrix[14] = this.get(2,3);
	rowMajor_matrix[15] = this.get(3,3);

	return rowMajor_matrix;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param angDeg 변수
 * @param axis_x 변수
 * @param axis_y 변수
 * @param axis_z 변수
 */
Matrix4.prototype.rotationAxisAngDeg = function(angDeg, axis_x, axis_y, axis_z) {
	var quaternion = new Quaternion();
	quaternion.rotationAngDeg(angDeg, axis_x, axis_y, axis_z);
	this.rotationByQuaternion(quaternion);
	quaternion = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param angRad 변수
 * @param axis_x 변수
 * @param axis_y 변수
 * @param axis_z 변수
 */
Matrix4.prototype.rotationAxisAngRad = function(angRad, axis_x, axis_y, axis_z) {
	var quaternion = new Quaternion();
	quaternion.rotationAngRad(angRad, axis_x, axis_y, axis_z);
	this.rotationByQuaternion(quaternion);
	quaternion = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param quaternion 변수
 */
Matrix4.prototype.rotationByQuaternion = function(quaternion) {
	var w = quaternion.w;
	var x = quaternion.x;
	var y = quaternion.y;
	var z = quaternion.z;

	this._floatArrays[this.getIndexOfArray(0,0)] = 1 - 2*y*y - 2*z*z;
	this._floatArrays[this.getIndexOfArray(0,1)] = 2*x*y + 2*z*w;
	this._floatArrays[this.getIndexOfArray(0,2)] = 2*x*z - 2*y*w;
	this._floatArrays[this.getIndexOfArray(0,3)] = 0.0;

	this._floatArrays[this.getIndexOfArray(1,0)] = 2*x*y - 2*z*w;
	this._floatArrays[this.getIndexOfArray(1,1)] = 1 - 2*x*x - 2*z*z;
	this._floatArrays[this.getIndexOfArray(1,2)] = 2*y*z + 2*x*w;
	this._floatArrays[this.getIndexOfArray(1,3)] = 0.0;

	this._floatArrays[this.getIndexOfArray(2,0)] = 2*x*z + 2*y*w;
	this._floatArrays[this.getIndexOfArray(2,1)] = 2*y*z - 2*x*w;
	this._floatArrays[this.getIndexOfArray(2,2)] = 1 - 2*x*x - 2*y*y;
	this._floatArrays[this.getIndexOfArray(2,3)] = 0.0;

	this._floatArrays[this.getIndexOfArray(3,0)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3,1)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3,2)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3,3)] = 1.0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param float32array 변수
 */
Matrix4.prototype.setByFloat32Array = function(float32array) {
	for(var i=0; i<16; i++) {
		this._floatArrays[i] = float32array[i];
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param col 변수
 * @param row 변수
 */
Matrix4.prototype.getIndexOfArray = function(col, row) {
	return 4 * col + row;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param col 변수
 * @param row 변수
 */
Matrix4.prototype.get = function(col, row) {
	return this._floatArrays[this.getIndexOfArray(col, row)];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point3d 변수
 * @param result_point3d 변수
 * @returns result_point3d
 */
Matrix4.prototype.transformPoint3D = function(point3d, result_point3d) {
	if(result_point3d == undefined) result_point3d = new Point3D();

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result_point3d.x = x*this.get(0,0) + y*this.get(1,0) + z*this.get(2,0) + this.get(3,0);
	result_point3d.y = x*this.get(0,1) + y*this.get(1,1) + z*this.get(2,1) + this.get(3,1);
	result_point3d.z = x*this.get(0,2) + y*this.get(1,2) + z*this.get(2,2) + this.get(3,2);

	return result_point3d;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point3d 변수
 * @param result_point3d 변수
 * @returns result_point3d
 */
Matrix4.prototype.rotatePoint3D = function(point3d, result_point3d) {
	if(result_point3d == undefined) result_point3d = new Point3D();

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result_point3d.x = x*this.get(0,0) + y*this.get(1,0) + z*this.get(2,0);
	result_point3d.y = x*this.get(0,1) + y*this.get(1,1) + z*this.get(2,1);
	result_point3d.z = x*this.get(0,2) + y*this.get(1,2) + z*this.get(2,2);

	return result_point3d;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 * @param resultMat 변수
 * @returns resultMat
 */
Matrix4.prototype.getMultipliedByMatrix = function(matrix, resultMat) {

	if(resultMat == undefined) resultMat = new Matrix4();

	for(var i=0; i<4; i++) {
		for(var j=0; j<4; j++) {
			var idx = this.getIndexOfArray(i, j);
			resultMat._floatArrays[idx] = 0.0;
			for(var k=0; k<4; k++) {
				resultMat._floatArrays[idx] += matrix.get(k, j) * this.get(i, k);
			}
		}
	}
	return resultMat;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 * @param resultMat 변수
 * @returns resultMat
 */
Matrix4.prototype.copyFromMatrix4 = function(matrix) {
	for(var i=0; i<16; i++)
	{
		this._floatArrays[i] = matrix._floatArrays[i];
	}
};
