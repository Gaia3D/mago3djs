'use strict';


/**
 * 열우선 배열 방식의 4차원 행렬
 *
 */
var Matrix4 = function() 
{
	if (!(this instanceof Matrix4)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	/**
	 * @type {Float32Array}
	 */
	this._floatArrays = new Float32Array([ 1, 0, 0, 0,
										   0, 1, 0, 0,
										   0, 0, 1, 0,
										   0, 0, 0, 1]);
};

/**
 * 단위행렬로 설정한다.
 */
Matrix4.prototype.Identity = function() 
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


/**
 * 행렬 정보 삭제
 */
Matrix4.prototype.deleteObjects = function() 
{
	this._floatArrays = undefined;
};


/**
 * 행우선 배열 방식의 4차원 행렬을 제공한다.
 *
 * @returns {Float32Array} 행우선 4차원 행렬
 * 
 * @see Matrix4#get
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
 * XYZ축에 대한 회전양에 따라 회전된 4차원 행렬을 구한다.
 *
 * @param {Number} zRotDeg z축에 대한 회전양(Degree)
 * @param {Number} xRotDeg x축에 대한 회전양(Degree)
 * @param {Number} yRotDeg y축에 대한 회전양(Degree)
 * @param {Matrix4} result 회전된 4차원 행렬
 * @returns {Matrix4} 회전된 4차원 행렬
 * 
 * @see Matrix4#rotationAxisAngDeg
 * @see Matrix4#getMultipliedByMatrix
 */
Matrix4.getRotationDegZXYMatrix = function(zRotDeg, xRotDeg, yRotDeg, result) 
{
	// created as identity matrix.
	if (result === undefined)
	{
		result = new Matrix4();
	}

	var xRotMatrix = new Matrix4();  // created as identity matrix.
	var yRotMatrix = new Matrix4();  // created as identity matrix.
	var zRotMatrix = new Matrix4();  // created as identity matrix.
	
	
	if (xRotDeg !== undefined && xRotDeg !== 0)
	{ xRotMatrix.rotationAxisAngDeg(xRotDeg, 1.0, 0.0, 0.0); }
	
	if (yRotDeg !== undefined && yRotDeg !== 0)
	{ yRotMatrix.rotationAxisAngDeg(yRotDeg, 0.0, 1.0, 0.0); }
	
	if (zRotDeg !== undefined && zRotDeg !== 0)
	{ zRotMatrix.rotationAxisAngDeg(zRotDeg, 0.0, 0.0, 1.0); }

	var zRotatedTMatrix;
	var zxRotatedTMatrix;
	var zxyRotatedTMatrix;

	zRotatedTMatrix = zRotMatrix;
	zxRotatedTMatrix = xRotMatrix.getMultipliedByMatrix(zRotatedTMatrix, zxRotatedTMatrix);
	zxyRotatedTMatrix = yRotMatrix.getMultipliedByMatrix(zxRotatedTMatrix, zxyRotatedTMatrix);
	
	result = zxyRotatedTMatrix;

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
Matrix4.prototype.rotationAxisAngDeg = function(angDeg, axis_x, axis_y, axis_z) 
{
	var quaternion = new Quaternion();
	quaternion.rotationAngDeg(angDeg, axis_x, axis_y, axis_z);
	this.rotationByQuaternion(quaternion);
	quaternion = undefined;
};

/**
 * 좌표값과 회전양을 통해 회전된 4차원 행렬을 구한다.
 *
 * @param {Number} angRad 회전양(Radian)
 * @param {Number} axis_x X축 좌표
 * @param {Number} axis_y Y축 좌표
 * @param {Number} axis_z Z축 좌표
 * 
 * @see Quaternion
 * @see Quaternion#rotationAngRad
 * @see Matrix4#rotationByQuaternion
 */
Matrix4.prototype.rotationAxisAngRad = function(angRad, axis_x, axis_y, axis_z) 
{
	var quaternion = new Quaternion();
	quaternion.rotationAngRad(angRad, axis_x, axis_y, axis_z);
	this.rotationByQuaternion(quaternion);
	quaternion = undefined;
};

/**
 * 쿼터니언(사원수)을 통한 회전된 4차원 행렬을 구한다.
 *
 * @param {Quaternion} quaternion 사원수
 */
Matrix4.prototype.rotationByQuaternion = function(quaternion) 
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

/**
 * Float32 형식의 4차원 행렬로 행렬값을 설정한다.
 *
 * @param {Float32Array} float32array
 */
Matrix4.prototype.setByFloat32Array = function(float32array) 
{
	for (var i=0; i<16; i++) 
	{
		this._floatArrays[i] = float32array[i];
	}
};

/**
 * 열우선 방식으로 행렬의 인덱스값을 계산한다.
 * 
 * @param {Number} col 열의 위치
 * @param {Number} row 행의 위치
 * @returns {Number} 행렬의 인덱스
 */
Matrix4.prototype.getIndexOfArray = function(col, row) 
{
	var _col = col || 0;
	var _row = row || 0;

	return 4 * _col + _row;
};

/**
 * 지정된 행/열의 위치에 있는 값을 구한다.
 *
 * @param {Number} col 열의 위치
 * @param {Number} row 행의 위치
 * @returns {Number} 행렬값
 */
Matrix4.prototype.get = function(col, row) 
{
	return this._floatArrays[this.getIndexOfArray(col, row)];
};

/**
 * XYZ축으로 이동한다.
 *
 * @param {Number} x X축 이동량
 * @param {Number} y Y축 이동량
 * @param {Number} z Z축 이동량
 */
Matrix4.prototype.setTranslation = function(x, y, z) 
{
	this.set(3, 0, x);
	this.set(3, 1, y);
	this.set(3, 2, z);
};


/**
 * 4차원 행렬의 특정 위치의 값을 설정한다.
 *
 * @param {Number} col 열의 위치
 * @param {Number} row 행의 위치
 * @param {Number} value 설정값
 */
Matrix4.prototype.set = function(col, row, value) 
{
	this._floatArrays[this.getIndexOfArray(col, row)] = value;
};

/**
 * 행렬연산을 통해 주어진 포인트를 이동한다.
 *
 * @param {Point3D} point3d 입력 포인트
 * @param {Point3D} result 출력 포인트
 * @returns {Point3D} 출력 포인트
 */
Matrix4.prototype.transformPoint3D = function(point3d, result) 
{
	if (result === undefined) { result = new Point3D(); }

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result.x = x*this.get(0, 0) + y*this.get(1, 0) + z*this.get(2, 0) + this.get(3, 0);
	result.y = x*this.get(0, 1) + y*this.get(1, 1) + z*this.get(2, 1) + this.get(3, 1);
	result.z = x*this.get(0, 2) + y*this.get(1, 2) + z*this.get(2, 2) + this.get(3, 2);

	return result;
};

/**
 * 행렬연산을 통해 주어진 포인트를 회전한다.
 *
 * @param {Point3D} point3d 입력 포인트
 * @param {Point3D} result 출력 포인트
 * @returns {Point3D} 출력 포인트
 */
Matrix4.prototype.rotateXYZDataArray = function(xyzDataArray, resultXYZDataArray) 
{
	if (xyzDataArray === undefined)
	{ return resultXYZDataArray; }
	
	if (resultXYZDataArray === undefined) { resultXYZDataArray = []; }
	var x, y, z;	
	var points3dCount = xyzDataArray.length/3;
	
	for (var i=0; i<points3dCount; i++)
	{
		x = xyzDataArray[i*3];
		y = xyzDataArray[i*3+1];
		z = xyzDataArray[i*3+2];

		resultXYZDataArray[i*3] = x*this.get(0, 0) + y*this.get(1, 0) + z*this.get(2, 0);
		resultXYZDataArray[i*3+1] = x*this.get(0, 1) + y*this.get(1, 1) + z*this.get(2, 1);
		resultXYZDataArray[i*3+2] = x*this.get(0, 2) + y*this.get(1, 2) + z*this.get(2, 2);
	}

	return resultXYZDataArray;
};

/**
 * 행렬연산을 통해 주어진 포인트를 회전한다.
 *
 * @param {Point3D} point3d 입력 포인트
 * @param {Point3D} result 출력 포인트
 * @returns {Point3D} 출력 포인트
 */
Matrix4.prototype.rotatePoint3D = function(point3d, result) 
{
	if (result === undefined) { result = new Point3D(); }

	var x = point3d.x;
	var y = point3d.y;
	var z = point3d.z;

	result.x = x*this.get(0, 0) + y*this.get(1, 0) + z*this.get(2, 0);
	result.y = x*this.get(0, 1) + y*this.get(1, 1) + z*this.get(2, 1);
	result.z = x*this.get(0, 2) + y*this.get(1, 2) + z*this.get(2, 2);

	return result;
};

/**
 * From gl-matrix.js
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
		return glMatrix.mat4.identity(out);
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
	out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
	out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
	out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
	out[15] = 1;

	return out;
};

/**
 * 4차원 행렬의 곱셈을 계산한다.(Rm = AmBm)
 * Rm(j,i) = (AmBm)(j,i) = Sum( Am(j,k)*Bm(k,i) )(k=1,4)
 * 
 * @param {Matrix4} matrix 입력 행렬(Am)
 * @param {Matrix4} result 결과 행렬(Rm)
 * @returns {Matrix4} 결과 행렬(Rm)
 */
Matrix4.prototype.getMultipliedByMatrix = function(matrix, result) 
{

	if (result === undefined) { result = new Matrix4(); }

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

/**
 * 원근 투영 행렬을 생성한다.
 * normalized device coordinates (NDC) uses the left-handed coordinate system
 * Always use right-handed coordinate system
 * 
 * @param {*} fovyrad Radian 단위의 시야각(Field of view)
 * @param {*} aspect 화면비율(Aspect Ratio:가로값/세로값)
 * @param {*} near 근거리
 * @param {*} far 원거리
 * 
 * @see http://ogldev.atspace.co.uk/www/tutorial12/tutorial12.html
 * @see https://www.gamedev.net/articles/programming/graphics/perspective-projections-in-lh-and-rh-systems-r3598/
 * @see http://www.songho.ca/opengl/gl_projectionmatrix.html
 */
Matrix4.prototype.setToPerspectiveProjection = function (fovyrad, aspect, near, far) 
{
	var yScale = 1.0 / Math.tan(fovyrad / 2);
	var xScale = yScale / aspect;
	var zRange = near - far;

	this.setByFloat32Array([xScale, 0, 0, 0,
		0, yScale, 0, 0,
		0, 0, (far + near) / zRange, -1,
		0, 0, 2*far*near / zRange, 0 ]);
};

/**
 * 입력된 4차원 행렬로부터 행렬값을 복사한다.
 *
 * @param {Matrix4} matrix 4차원 행렬
 */
Matrix4.prototype.copyFromMatrix4 = function(matrix) 
{
	for (var i=0; i<16; i++)
	{
		this._floatArrays[i] = matrix._floatArrays[i];
	}
};


/**
 * 입력된 배열로부터 4차원 행렬값을 복사한다.
 *
 * @param {Object[]} floatArrays 배열
 */
Matrix4.prototype.copyFromFloatArray = function(floatArrays) 
{
	for (var i=0; i<16; i++)
	{
		this._floatArrays[i] = floatArrays[i];
	}
};

/**
 * 행렬의 타입을 알려준다.
 *
 * @returns {Number} 행렬의 타입
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
 * 오차범위내에 두 값의 동일 여부를 확인한다.
 * Returns if the value is aproximately equal to the valueToCompare with error.
 *
 * @param {Number} value 비교값
 * @param {Number} valueToCompare 비교값
 * @param {Number} error 오차율
 * @returns {Boolean} 비교값의 일치여부
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
 */
Matrix4.perspective = function(fieldOfViewInRadians, aspect, near, far) 
{
	var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
	var rangeInv = 1.0 / (near - far);
	
	return [
		f / aspect, 0, 0, 0,
		0, f, 0, 0,
		0, 0, (near + far) * rangeInv, -1,
		0, 0, near * far * rangeInv * 2, 0
	];
};

/**
 * 두 배열의 일치여부를 확인한다.
 * Returns if the arrayA equal to the arrayB.
 *
 * @param {Object[]} arrayA
 * @param {Object[]} arrayB
 * @returns {Boolean} 두 배열의 일치여부
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
 * 회전/이동을 위한 단위행렬 여부를 확인한다.
 *
 * @param {Number} error
 * @returns {Boolean}
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
