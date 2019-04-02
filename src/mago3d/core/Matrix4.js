'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Matrix4
 */
var Matrix4 = function() 
{
	if (!(this instanceof Matrix4)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._floatArrays = new Float32Array([ 	1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	]);
};

/**
 * 어떤 일을 하고 있습니까?
 */
Matrix4.prototype.Identity = function() 
{
	this._floatArrays[0] = 1.0;
	this._floatArrays[1] = 0.0;
	this._floatArrays[2] = 0.0;
	this._floatArrays[3] = 0.0;
	
	this._floatArrays[4] = 0.0;
	this._floatArrays[5] = 1.0;
	this._floatArrays[6] = 0.0;
	this._floatArrays[7] = 0.0;
	
	this._floatArrays[8] = 0.0;
	this._floatArrays[9] = 0.0;
	this._floatArrays[10] = 1.0;
	this._floatArrays[11] = 0.0;
	
	this._floatArrays[12] = 0.0;
	this._floatArrays[13] = 0.0;
	this._floatArrays[14] = 0.0;
	this._floatArrays[15] = 1.0;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns rowMajor_matrix
 */
Matrix4.prototype.deleteObjects = function() 
{
	this._floatArrays = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns rowMajor_matrix
 */
Matrix4.prototype.getRowMajorMatrix = function() 
{
	var rowMajor_matrix = new Float32Array(16);

	rowMajor_matrix[0] = this.get(0, 0);
	rowMajor_matrix[1] = this.get(1, 0);
	rowMajor_matrix[2] = this.get(2, 0);
	rowMajor_matrix[3] = this.get(3, 0);

	rowMajor_matrix[4] = this.get(0, 1);
	rowMajor_matrix[5] = this.get(1, 1);
	rowMajor_matrix[6] = this.get(2, 1);
	rowMajor_matrix[7] = this.get(3, 1);

	rowMajor_matrix[8] = this.get(0, 2);
	rowMajor_matrix[9] = this.get(1, 2);
	rowMajor_matrix[10] = this.get(2, 2);
	rowMajor_matrix[11] = this.get(3, 2);

	rowMajor_matrix[12] = this.get(0, 3);
	rowMajor_matrix[13] = this.get(1, 3);
	rowMajor_matrix[14] = this.get(2, 3);
	rowMajor_matrix[15] = this.get(3, 3);

	return rowMajor_matrix;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param angRad 변수
 * @param axis_x 변수
 * @param axis_y 변수
 * @param axis_z 변수
 */
Matrix4.getRotationDegZXYMatrix = function(zRotDeg, xRotDeg, yRotDeg, resultMatrix4) 
{
	// static function.***
	var xRotMatrix = new Matrix4();  // created as identity matrix.
	var yRotMatrix = new Matrix4();  // created as identity matrix.
	var zRotMatrix = new Matrix4();  // created as identity matrix.
	
	if (zRotDeg !== undefined && zRotDeg !== 0)
	{ zRotMatrix.rotationAxisAngDeg(zRotDeg, 0.0, 0.0, 1.0); }

	if (xRotDeg !== undefined && xRotDeg !== 0)
	{ xRotMatrix.rotationAxisAngDeg(xRotDeg, 1.0, 0.0, 0.0); }

	if (yRotDeg !== undefined && yRotDeg !== 0)
	{ yRotMatrix.rotationAxisAngDeg(yRotDeg, 0.0, 1.0, 0.0); }


	if (resultMatrix4 === undefined)
	{ resultMatrix4 = new Matrix4(); }  // created as identity matrix.


	var zRotatedTMatrix;
	var zxRotatedTMatrix;
	var zxyRotatedTMatrix;

	zRotatedTMatrix = zRotMatrix;
	zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
	zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
	
	resultMatrix4 = zxyRotatedTMatrix;
	return resultMatrix4;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param angDeg 변수
 * @param axis_x 변수
 * @param axis_y 변수
 * @param axis_z 변수
 */
Matrix4.prototype.rotationAxisAngDeg = function(angDeg, axis_x, axis_y, axis_z) 
{
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
Matrix4.prototype.rotationAxisAngRad = function(angRad, axis_x, axis_y, axis_z) 
{
	var quaternion = new Quaternion();
	quaternion.rotationAngRad(angRad, axis_x, axis_y, axis_z);
	this.rotationByQuaternion(quaternion);
	quaternion = undefined;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param quaternion 변수
 */
Matrix4.prototype.rotationByQuaternion = function(quaternion) 
{
	var w = quaternion.w;
	var x = quaternion.x;
	var y = quaternion.y;
	var z = quaternion.z;

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

/**
 * 어떤 일을 하고 있습니까?
 * @param float32array 변수
 */
Matrix4.prototype.setByFloat32Array = function(float32array) 
{
	for (var i=0; i<16; i++) 
	{
		this._floatArrays[i] = float32array[i];
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param col 변수
 * @param row 변수
 */
Matrix4.prototype.getIndexOfArray = function(col, row) 
{
	var _col = col || 0;
	var _row = row || 0;

	return 4 * _col + _row;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param col 변수
 * @param row 변수
 */
Matrix4.prototype.get = function(col, row) 
{
	if (this._floatArrays === null)
	{ return null; }
	
	return this._floatArrays[this.getIndexOfArray(col, row)];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param col 변수
 * @param row 변수
 */
Matrix4.prototype.set = function(col, row, value) 
{
	this._floatArrays[this.getIndexOfArray(col, row)] = value;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point3d 변수
 * @param result_point3d 변수
 * @returns result_point3d
 */
Matrix4.prototype.transformPoint3D = function(point3d, result_point3d) 
{
	if (result_point3d === undefined) { result_point3d = new Point3D(); }

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result_point3d.x = x*this.get(0, 0) + y*this.get(1, 0) + z*this.get(2, 0) + this.get(3, 0);
	result_point3d.y = x*this.get(0, 1) + y*this.get(1, 1) + z*this.get(2, 1) + this.get(3, 1);
	result_point3d.z = x*this.get(0, 2) + y*this.get(1, 2) + z*this.get(2, 2) + this.get(3, 2);

	return result_point3d;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param point3d 변수
 * @param result_point3d 변수
 * @returns result_point3d
 */
Matrix4.prototype.rotatePoint3D = function(point3d, result_point3d) 
{
	if (result_point3d === undefined) { result_point3d = new Point3D(); }

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result_point3d.x = x*this.get(0, 0) + y*this.get(1, 0) + z*this.get(2, 0);
	result_point3d.y = x*this.get(0, 1) + y*this.get(1, 1) + z*this.get(2, 1);
	result_point3d.z = x*this.get(0, 2) + y*this.get(1, 2) + z*this.get(2, 2);

	return result_point3d;
};

/**
 * From gl-matrix.js.***************************************************************
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
Matrix4.lookAt = function(out, eye, center, up) 
{
	var x0 = void 0,
		x1 = void 0,
		x2 = void 0,
		y0 = void 0,
		y1 = void 0,
		y2 = void 0,
		z0 = void 0,
		z1 = void 0,
		z2 = void 0,
		len = void 0;
	var eyex = eye[0];
	var eyey = eye[1];
	var eyez = eye[2];
	var upx = up[0];
	var upy = up[1];
	var upz = up[2];
	var centerx = center[0];
	var centery = center[1];
	var centerz = center[2];

	if (Math.abs(eyex - centerx) < glMatrix.EPSILON && Math.abs(eyey - centery) < glMatrix.EPSILON && Math.abs(eyez - centerz) < glMatrix.EPSILON) 
	{
		return mat4.identity(out);
	}

	z0 = eyex - centerx;
	z1 = eyey - centery;
	z2 = eyez - centerz;

	len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
	z0 *= len;
	z1 *= len;
	z2 *= len;

	x0 = upy * z2 - upz * z1;
	x1 = upz * z0 - upx * z2;
	x2 = upx * z1 - upy * z0;
	len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
	if (!len) 
	{
		x0 = 0;
		x1 = 0;
		x2 = 0;
	}
	else 
	{
		len = 1 / len;
		x0 *= len;
		x1 *= len;
		x2 *= len;
	}

	y0 = z1 * x2 - z2 * x1;
	y1 = z2 * x0 - z0 * x2;
	y2 = z0 * x1 - z1 * x0;

	len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
	if (!len) 
	{
		y0 = 0;
		y1 = 0;
		y2 = 0;
	}
	else 
	{
		len = 1 / len;
		y0 *= len;
		y1 *= len;
		y2 *= len;
	}

	out[0] = x0;
	out[1] = y0;
	out[2] = z0;
	out[3] = 0;
	out[4] = x1;
	out[5] = y1;
	out[6] = z1;
	out[7] = 0;
	out[8] = x2;
	out[9] = y2;
	out[10] = z2;
	out[11] = 0;
	var auxX1 = x0 * eyex;
	var auxX2 = y0 * eyex;
	var auxX3 = z0 * eyex;
  
	var auxY1 = x1 * eyey;
	var auxY2 = y1 * eyey;
	var auxY3 = z1 * eyey;
  
	var auxZ1 = x2 * eyez;
	var auxZ2 = y2 * eyez;
	var auxZ3 = z2 * eyez;
  
	var aux1 = auxX1 + auxY1;
	var aux2 = auxX2 + auxY2;
	var aux3 = auxX3 + auxY3;
  
	var total1 = aux1 + auxZ1;
	var total2 = aux2 + auxZ2;
	var total3 = aux3 + auxZ3;
  
	//out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	//out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	//out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  
	out[12] = -total1;
	out[13] = -total2;
	out[14] = -total3;
	out[15] = 1;

	return out;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 * @param resultMat 변수
 * @returns resultMat
 */
Matrix4.prototype.getMultipliedByMatrix = function(matrix, resultMat) 
{

	if (resultMat === undefined) { resultMat = new Matrix4(); }

	for (var i=0; i<4; i++) 
	{
		for (var j=0; j<4; j++) 
		{
			var idx = this.getIndexOfArray(i, j);
			resultMat._floatArrays[idx] = 0.0;
			for (var k=0; k<4; k++) 
			{
				resultMat._floatArrays[idx] += matrix.get(k, j) * this.get(i, k);
			}
		}
	}
	return resultMat;
};

Matrix4.prototype.setToPerspectiveProjection = function (fovyrad, aspect, near, far) 
{
	var yScale = 1.0 / Math.tan(fovyrad / 2);
	var xScale = yScale / aspect;
	var nearmfar = near - far;
	this.setByFloat32Array([xScale, 0, 0, 0,
		0, yScale, 0, 0,
		0, 0, (far + near) / nearmfar, -1,
		0, 0, 2*far*near / nearmfar, 0 ]);
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 * @param resultMat 변수
 * @returns resultMat
 */
Matrix4.prototype.copyFromMatrix4 = function(matrix) 
{
	for (var i=0; i<16; i++)
	{
		this._floatArrays[i] = matrix._floatArrays[i];
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param matrix 변수
 * @param resultMat 변수
 * @returns resultMat
 */
Matrix4.prototype.copyFromFloatArray = function(floatArrays) 
{
	for (var i=0; i<16; i++)
	{
		this._floatArrays[i] = floatArrays[i];
	}
};

/**
 * Returns if the value is aproximately equal to the valueToCompare with error.
 * @returns {boolean} are equal.
 */
Matrix4.prototype.computeMatrixType = function() 
{
	// matrixType = 0 -> identity matrix.
	// matrixType = 1 -> translate matrix.
	// matrixType = 2 -> transform matrix.
	
	var error = 10E-8;
	if (this.isRotationIdentity())
	{
		// check if there are translation.
		if (this.aproxEqual(this._floatArrays[3], 0, error))
		{
			if (this.aproxEqual(this._floatArrays[7], 0, error))
			{
				if (this.aproxEqual(this._floatArrays[11], 0, error))
				{
					if (this.aproxEqual(this._floatArrays[12], 0, error))
					{
						if (this.aproxEqual(this._floatArrays[13], 0, error))
						{
							if (this.aproxEqual(this._floatArrays[14], 0, error))
							{
								if (this.aproxEqual(this._floatArrays[15], 1, error))
								{
									return 0;
								}
								else { return 1; }
							}
							else { return 1; }
						}
						else { return 1; }
					}
					else { return 1; }
				}
				else { return 1; }
			}
			else { return 1; }
		}
		else { return 1; }
	}
	else
	{
		return 2;
	}
};

/**
 * Returns if the value is aproximately equal to the valueToCompare with error.
 * @returns {boolean} are equal.
 */
Matrix4.prototype.aproxEqual = function(value, valueToCompare, error) 
{
	if (error === undefined)
	{ error = 10E-8; }
	
	if (value === valueToCompare)
	{
		return true;
	}
	else
	{
		if (value > (valueToCompare - error) && value < (valueToCompare + error))
		{ return true; }
		else
		{ return false; }
	}
};

/**
 * Returns if the arrayA equal to the arrayB.
 * @returns {boolean} are equal.
 */
Matrix4.areEqualArrays = function(arrayA, arrayB) 
{
	var areEqual = true;
	var i=0;
	while (areEqual && i<16)
	{
		if (arrayA[i] !== arrayB[i])
		{
			areEqual = false;
		}
		i++;
	}
	
	return areEqual;
};

/**
 * Returns if the matrix is identity.
 * @returns {boolean} matrixIsIdentity.
 */
Matrix4.prototype.isIdentity = function(error) 
{	
	if (this.isRotationIdentity())
	{
		if (this.aproxEqual(this._floatArrays[3], 0, error))
		{
			if (this.aproxEqual(this._floatArrays[7], 0, error))
			{
				if (this.aproxEqual(this._floatArrays[11], 0, error))
				{
					if (this.aproxEqual(this._floatArrays[12], 0, error))
					{
						if (this.aproxEqual(this._floatArrays[13], 0, error))
						{
							if (this.aproxEqual(this._floatArrays[14], 0, error))
							{
								if (this.aproxEqual(this._floatArrays[15], 1, error))
								{
									return true;
								}
								else { return false; }
							}
							else { return false; }
						}
						else { return false; }
					}
					else { return false; }
				}
				else { return false; }
			}
			else { return false; }
		}
		else { return false; }
	}
	else
	{ return false; }
};

/**
 * Returns if the matrix is identity.
 * @returns {boolean} matrixIsIdentity.
 */
Matrix4.prototype.isRotationIdentity = function(error) 
{
	if (this.aproxEqual(this._floatArrays[0], 1, error))
	{
		if (this.aproxEqual(this._floatArrays[1], 0, error))
		{
			if (this.aproxEqual(this._floatArrays[2], 0, error))
			{
				if (this.aproxEqual(this._floatArrays[4], 0, error))
				{
					if (this.aproxEqual(this._floatArrays[5], 1, error))
					{
						if (this.aproxEqual(this._floatArrays[6], 0, error))
						{
							if (this.aproxEqual(this._floatArrays[8], 0, error))
							{
								if (this.aproxEqual(this._floatArrays[9], 0, error))
								{
									if (this.aproxEqual(this._floatArrays[10], 1, error))
									{
										return true;
									}
									else { return false; }
								}
								else { return false; }
							}
							else { return false; }
						}
						else { return false; }
					}
					else { return false; }
				}
				else { return false; }
			}
			else { return false; }
		}
		else { return false; }
	}
	else { return false; }
};






















