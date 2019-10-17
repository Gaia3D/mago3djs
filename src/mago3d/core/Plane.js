'use strict';

/**
 * The plane which can be represented as linear equation
 * Plane on 3D space. Plane equation ax+by+cz+d = 0.
 * @class Plane
 */
var Plane = function() 
{
	if (!(this instanceof Plane)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	// ax+by+cz+d = 0 plane.
	this.a = 0.0;
	this.b = 0.0;
	this.c = 0.0;
	this.d = 0.0;
};

/**
 * set the point and the vector which determine this plane
 * @param px the x coordi of the point that determine this plane
 * @param py the y coordi of the point that determine this plane
 * @param pz the z coordi of the point that determine this plane
 * @param nx the x coordi of the normal vector
 * @param ny the y coordi of the normal vector
 * @param nz the z coordi of the normal vector
 */
Plane.prototype.setPointAndNormal = function(px, py, pz, nx, ny, nz) 
{
	this.a = nx;
	this.b = ny;
	this.c = nz;
	this.d = -this.a*px -this.b*py - this.c*pz;
};

/**
 * set the point which determine this plane
 * @param px the x coordi of the point that determine this plane
 * @param py the y coordi of the point that determine this plane
 * @param pz the z coordi of the point that determine this plane
 */
Plane.prototype.setPoint = function(px, py, pz) 
{
	this.d = -this.a*px -this.b*py - this.c*pz;
};

/**
 * determine this plane as normal vector and the distance from the point which determine normal vector
 * @param dist
 * @param nx the x coordi of the normal vector
 * @param ny the y coordi of the normal vector
 * @param nz the z coordi of the normal vector
 */
Plane.prototype.setNormalAndDistance = function(nx, ny, nz, dist) 
{
	this.a = nx;
	this.b = ny;
	this.c = nz;
	this.d = dist;
};

/**
 * get the point of normal vector
 */
Plane.prototype.getNormal = function(resultNormal) 
{
	if (resultNormal === undefined)
	{ resultNormal = new Point3D(); }
	
	resultNormal.set(this.a, this.b, this.c);
	
	return resultNormal;
};

/**
 * Calculate the matrix which can rotate this plane
 * @param resultMatrix the matrix which will hold the result
 */
Plane.prototype.getRotationMatrix = function(resultTMatrix) 
{
	// The initial normal is (0, 0, 1), & the planeNormal is the transformed normal, so, calculate the rotationMatrix.
	var initialNormal = new Point3D(0.0, 0.0, 1.0);
	var transformedNormal = this.getNormal(undefined);
	
	// Calculate rotation axis. CrossProduct between initialNormal and the transformedNormal.
	// Check if the "initialNormal & the transformedNormal are parallels.
	var radError = 10E-10;
	var relativeOrientation = initialNormal.getRelativeOrientationToVector(transformedNormal, radError);
	// relativeOrientation = 0 -> // there are parallels & the same sense.
	// relativeOrientation = 1 -> // there are parallels & opposite sense.
	// relativeOrientation = 2 -> // there are NO parallels.
	var matrixAux = glMatrix.mat4.create(); // creates as identityMatrix.
	if (relativeOrientation === 0)
	{
		// there are parallels & the same sense.
		// In this case, the resultMatrix is a identityMatrix, so do nothing.
	}
	else if (relativeOrientation === 1)
	{
		// there are parallels & opposite sense.
		// Rotate 180 degree in xAxis.
		var identityMat = glMatrix.mat4.create();
		matrixAux = glMatrix.mat4.rotateX(matrixAux, identityMat, Math.PI);
	}
	else if (relativeOrientation === 2)
	{
		// there are NO parallels.
		// Calculate rotation axis. CrossProduct between initialNormal and the transformedNormal.
		var rotAxis = initialNormal.crossProduct(transformedNormal, undefined);
		rotAxis.unitary();
		var angRad = initialNormal.angleRadToVector(transformedNormal);
		var axis = glMatrix.vec3.fromValues(rotAxis.x, rotAxis.y, rotAxis.z);
		var quaternion = quat.create();
		quaternion = quat.setAxisAngle(quaternion, axis, angRad);
		
		// Now, make matrix4 from quaternion.
		var identityMat = glMatrix.mat4.create();
		matrixAux = glMatrix.mat4.fromQuat(identityMat, quaternion);
	}
	
	if (resultTMatrix === undefined)
	{ resultTMatrix = new Matrix4(); }
	
	resultTMatrix._floatArrays = matrixAux;
	
	return resultTMatrix;
};

/**
 * Get the point of the intersecting point of line and this plane
 * @param line 변수
 * @param intersectionPoint 변수
 */
Plane.prototype.getProjectedPoint = function(point, resultProjectedPoint) 
{
	if (point === undefined)
	{ return; }
	
	if (resultProjectedPoint === undefined)
	{ resultProjectedPoint = new Point3D(); }
	
	var normal = this.getNormal();
	var line = new Line();
	line.setPointAndDir(point.x, point.y, point.z, normal.x, normal.y, normal.z);
	
	resultProjectedPoint = this.intersectionLine(line, resultProjectedPoint);
	
	return resultProjectedPoint;
};

/**
 * Get the point of the intersecting point of line and this plane
 * @param line 변수
 * @param intersectionPoint 변수
 */
Plane.prototype.intersectionLine = function(line, intersectionPoint) 
{
	var r = line.point.x;
	var s = line.point.y;
	var t = line.point.z;
	
	var u = line.direction.x;
	var v = line.direction.y;
	var w = line.direction.z;
	
	var den = this.a*u + this.b*v + this.c*w;
	
	if (Math.abs(den) > 10E-8) 
	{
		var alfa = -((this.a*r + this.b*s + this.c*t + this.d)/(den));
		
		if (intersectionPoint === undefined) { intersectionPoint = new Point3D(); }
		
		intersectionPoint.set(r+alfa*u, s+alfa*v, t+alfa*w);
		return intersectionPoint;
	}
	else { return undefined; }
};

/**
 * Check whether the given sphere is intersected with this plane or not
 * @param sphere sphere
 */
Plane.prototype.intersectionSphere = function(sphere) 
{
	if (sphere === undefined || sphere.centerPoint === undefined)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	var sphereCenter = sphere.centerPoint;
	
	// calculate the distance by dotProduct.
	// sphere centerPoint = (x1, y1, z1), distance = |ax1 + by1 + cz1 + d|/sqrt(a*a +b*b + c*c*).
	// note: the module sqrt(a*a +b*b + c*c*) = 1, so no necessary divide distance by module.
	var distance = sphereCenter.x * this.a + sphereCenter.y * this.b + sphereCenter.z * this.c + this.d;

	if (distance < -sphere.r)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	else if (distance < sphere.r)
	{
		return Constant.INTERSECTION_INTERSECT;
	}
	return Constant.INTERSECTION_INSIDE;
};





