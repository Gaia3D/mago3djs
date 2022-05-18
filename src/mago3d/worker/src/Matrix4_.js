'use strict';


/**
 * 열우선 배열 방식의 4차원 행렬
 * @class Matrix4
 * @constructor
 */
var Matrix4_ = function() 
{
	/**
	 * @type {Float32Array}
	 */
	this._floatArrays = new Float32Array([ 1, 0, 0, 0,
										   0, 1, 0, 0,
										   0, 0, 1, 0,
										   0, 0, 0, 1]);
	/**
	 * recalculate flag
	 * @type {boolean}
	 */
	this.dirty = true;
};

Matrix4_.prototype.getIndexOfArray = function(col, row) 
{
	var _col = col || 0;
	var _row = row || 0;

	return 4 * _col + _row;
};

Matrix4_.prototype.Identity = function() 
{
	this._floatArrays[0] = 1.0;		// I(1,1)
	this._floatArrays[1] = 0.0;		// I(2,1)
	this._floatArrays[2] = 0.0;		// I(3,1)
	this._floatArrays[3] = 0.0;		// I(4,1)
	
	this._floatArrays[4] = 0.0;		// I(1,2)
	this._floatArrays[5] = 1.0;		// I(2,2)
	this._floatArrays[6] = 0.0;		// I(3,2)
	this._floatArrays[7] = 0.0;		// I(4,2)
	
	this._floatArrays[8] = 0.0;		// I(1,3)
	this._floatArrays[9] = 0.0;		// I(2,3)
	this._floatArrays[10] = 1.0;	// I(3,3)
	this._floatArrays[11] = 0.0;	// I(4,3)
	
	this._floatArrays[12] = 0.0;	// I(1,4)
	this._floatArrays[13] = 0.0;	// I(2,4)
	this._floatArrays[14] = 0.0;	// I(3,4)
	this._floatArrays[15] = 1.0;	// I(4,4)
};

Matrix4_.prototype.get = function(col, row) 
{
	return this._floatArrays[this.getIndexOfArray(col, row)];
};

Matrix4_.prototype.setByFloat32Array = function(float32array) 
{
	for (var i=0; i<16; i++) 
	{
		this._floatArrays[i] = float32array[i];
	}
};

Matrix4_.prototype.transformPoint3D = function(point3d, result) 
{
	if (!point3d) 
	{
		return result;
	}
	if (result === undefined) { result = new Point3D_(); }

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result.x = x*this.get(0, 0) + y*this.get(1, 0) + z*this.get(2, 0) + this.get(3, 0);
	result.y = x*this.get(0, 1) + y*this.get(1, 1) + z*this.get(2, 1) + this.get(3, 1);
	result.z = x*this.get(0, 2) + y*this.get(1, 2) + z*this.get(2, 2) + this.get(3, 2);

	return result;
};

Matrix4_.prototype.copyFromMatrix4 = function(matrix) 
{
	for (var i=0; i<16; i++)
	{
		this._floatArrays[i] = matrix._floatArrays[i];
	}
};

Matrix4_.prototype.getMultipliedByMatrix = function(matrix, result) 
{
	if (result === undefined) 
	{ 
		result = new Matrix4_(); 
	}

	for (var i=0; i<4; i++) 
	{
		for (var j=0; j<4; j++) 
		{
			var idx = this.getIndexOfArray(i, j);
			result._floatArrays[idx] = 0.0;
			for (var k=0; k<4; k++) 
			{
				result._floatArrays[idx] += matrix.get(k, j) * this.get(i, k);
			}
		}
	}
	return result;
};

Matrix4_.prototype.rotatePoint3D = function(point3d, result) 
{
	if (result === undefined) { result = new Point3D_(); }

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result.x = x*this.get(0, 0) + y*this.get(1, 0) + z*this.get(2, 0);
	result.y = x*this.get(0, 1) + y*this.get(1, 1) + z*this.get(2, 1);
	result.z = x*this.get(0, 2) + y*this.get(1, 2) + z*this.get(2, 2);

	return result;
};

/**
 * 좌표값과 회전양을 통해 회전된 4차원 행렬을 구한다.
 *
 * @param {Number} angDeg 회전양(Degree)
 * @param {Number} axis_x X축 좌표
 * @param {Number} axis_y Y축 좌표
 * @param {Number} axis_z Z축 좌표
 * 
 * @see Quaternion
 * @see Quaternion#rotationAngDeg
 * @see Matrix4#rotationByQuaternion
 */
 Matrix4_.prototype.rotationAxisAngDeg = function(angDeg, axis_x, axis_y, axis_z) 
 {
	 var quaternion = new Quaternion_();
	 quaternion.rotationAngDeg(angDeg, axis_x, axis_y, axis_z);
	 this.rotationByQuaternion(quaternion);
	 quaternion = undefined;
 };

 /**
 * 쿼터니언(사원수)을 통한 회전된 4차원 행렬을 구한다.
 *
 * @param {Quaternion} quaternion 사원수
 */
Matrix4_.prototype.rotationByQuaternion = function(quaternion) 
{
	var x = quaternion.x;
	var y = quaternion.y;
	var z = quaternion.z;
	var w = quaternion.w;

	this._floatArrays[this.getIndexOfArray(0, 0)] = 1 - 2*y*y - 2*z*z;
	this._floatArrays[this.getIndexOfArray(0, 1)] = 2*x*y + 2*z*w;
	this._floatArrays[this.getIndexOfArray(0, 2)] = 2*x*z - 2*y*w;
	this._floatArrays[this.getIndexOfArray(0, 3)] = 0.0;

	this._floatArrays[this.getIndexOfArray(1, 0)] = 2*x*y - 2*z*w;
	this._floatArrays[this.getIndexOfArray(1, 1)] = 1 - 2*x*x - 2*z*z;
	this._floatArrays[this.getIndexOfArray(1, 2)] = 2*y*z + 2*x*w;
	this._floatArrays[this.getIndexOfArray(1, 3)] = 0.0;

	this._floatArrays[this.getIndexOfArray(2, 0)] = 2*x*z + 2*y*w;
	this._floatArrays[this.getIndexOfArray(2, 1)] = 2*y*z - 2*x*w;
	this._floatArrays[this.getIndexOfArray(2, 2)] = 1 - 2*x*x - 2*y*y;
	this._floatArrays[this.getIndexOfArray(2, 3)] = 0.0;

	this._floatArrays[this.getIndexOfArray(3, 0)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3, 1)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3, 2)] = 0.0;
	this._floatArrays[this.getIndexOfArray(3, 3)] = 1.0;
};