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
	// a*x + b*y + c*z + d = 0
	// where (a,b,c) is the normal, and d is negative distance to origin.
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

Plane.prototype.set3Points = function(x1, y1, z1,   x2, y2, z2,   x3, y3, z3) 
{
	var point1 = new Point3D(x1, y1, z1);
	var point2 = new Point3D(x2, y2, z2);
	var point3 = new Point3D(x3, y3, z3);

	// now, calculate normal.
	var normal = Triangle.calculateNormal(point1, point2, point3, undefined);

	this.setPointAndNormal(x1, y1, z1, normal.x, normal.y, normal.z);
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
		var quaternion = glMatrix.quat.create();
		quaternion = glMatrix.quat.setAxisAngle(quaternion, axis, angRad);
		
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

Plane.prototype.isCoincidentLine = function(line, error) 
{
	if (error === undefined)
	{
		error = 1e-8;
	}

	// take 2 points of the line and check if there are coincidents with the plane.
	var linePoint = line.point;

	if (this.isCoincidentPoint(linePoint, error))
	{
		// take a 2nd point and check if is coincident with the plane.
		var dist = 1000.0;
		var lineDir = line.direction;
		var linePoint2 = new Point2D(linePoint.x + lineDir.x * dist, linePoint.y + lineDir.y * dist, linePoint.z + lineDir.z * dist);

		if (this.isCoincidentPoint(linePoint2, error))
		{
			return true;
		}
	}

	return false;
};

Plane.prototype.isCoincidentPoint = function(point, error) 
{
	// check the plane equation.
	var val = this.a * point.x + this.b * point.y + this.c * point.z + this.d;

	if (error === undefined)
	{
		error = 1e-8;
	}

	if (Math.abs(val) < error)
	{
		return true;
	}

	return false;
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
	
	var den = this.a * u + this.b * v + this.c * w;
	
	if (Math.abs(den) > 10E-8) 
	{
		var alfa = -((this.a * r + this.b * s + this.c * t + this.d)/(den));
		
		if (intersectionPoint === undefined) { intersectionPoint = new Point3D(); }
		
		intersectionPoint.set(r + alfa * u, s + alfa * v, t + alfa * w);
		return intersectionPoint;
	}
	else { return undefined; }
};

Plane.prototype.getRelativePositionOfTheSegment = function(segment, error) 
{
	// a segment can be:
	// 1) in front of the plane.
	// 2) rear of the plane.
	// 3) intersection with the plane (one point is in front of the plane and the other point is rear of the plane).
	// 4) one point is coincident with the plane.
	// 5) two points is coincident with the plane (segement is in plane).
	//-----------------------------------------------------------------------
	if (error === undefined)
	{
		error = 1e-8;
	}

	/*
	CODE.relativePositionSegment3DWithPlane2D = {
		"UNKNOWN" : 0,
		"NO_INTERSECTION" : 1,
		"INTERSECTION" : 2,
		"START_POINT_COINCIDENT" : 3,
		"END_POINT_COINCIDENT" : 4,
		"TWO_POINTS_COINCIDENT" : 5
	}*/

	var startPoint = segment.startPoint3d;
	var endPoint = segment.endPoint3d;

	var relPosStartPoint = this.getRelativePositionOfThePoint(startPoint, error);
	var relPosEndPoint = this.getRelativePositionOfThePoint(endPoint, error);
	var resultRelPos = CODE.relativePositionSegment3DWithPlane2D.UNKNOWN;

	if (relPosStartPoint === Constant.INTERSECTION_INSIDE)
	{
		// startPoint is in front of the plane.
		if (relPosEndPoint === Constant.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.NO_INTERSECTION;
		}
		else if (relPosEndPoint === Constant.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.INTERSECTION;
		}
		else if (relPosEndPoint === Constant.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.END_POINT_COINCIDENT;
		}
	}
	else if (relPosStartPoint === Constant.INTERSECTION_OUTSIDE)
	{
		// startPoint is rear of the plane.
		if (relPosEndPoint === Constant.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.INTERSECTION;
		}
		else if (relPosEndPoint === Constant.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.NO_INTERSECTION;
		}
		else if (relPosEndPoint === Constant.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.END_POINT_COINCIDENT;
		}
	}
	else if (relPosStartPoint === Constant.INTERSECTION_INTERSECT)
	{
		// startPoint is coincident with the plane.
		if (relPosEndPoint === Constant.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT;
		}
		else if (relPosEndPoint === Constant.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT;
		}
		else if (relPosEndPoint === Constant.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.TWO_POINTS_COINCIDENT;
		}
	}

	return resultRelPos;
};

Plane.prototype.getRelativePositionOfThePoint = function(point, error) 
{
	if (error === undefined)
	{
		error = 1e-8;
	}

	var distance = point.x * this.a + point.y * this.b + point.z * this.c + this.d;

	if (distance < -error)
	{
		// The point is rear of the plane.
		return Constant.INTERSECTION_OUTSIDE;
	}
	else if (distance > error)
	{
		// The point if in front of the plane.
		return Constant.INTERSECTION_INSIDE;
	}

	// The point intersects the plane.
	return Constant.INTERSECTION_INTERSECT;
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
		// The sphere is rear of the plane.
		return Constant.INTERSECTION_OUTSIDE;
	}
	else if (distance < sphere.r)
	{
		// The sphere intersects the plane.
		return Constant.INTERSECTION_INTERSECT;
	}

	// The sphere if in front of the plane.
	return Constant.INTERSECTION_INSIDE;
};





