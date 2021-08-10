'use strict';

var Plane_ = function() 
{
	// ax+by+cz+d = 0 plane.
	// a*x + b*y + c*z + d = 0
	// where (a,b,c) is the normal, and d is negative distance to origin.
	this.a = 0.0;
	this.b = 0.0;
	this.c = 0.0;
	this.d = 0.0;
};

Plane_.prototype.setPointAndNormal = function(px, py, pz, nx, ny, nz) 
{
	this.a = nx;
	this.b = ny;
	this.c = nz;
	this.d = -this.a*px -this.b*py - this.c*pz;
};

Plane_.prototype.set3Points = function(x1, y1, z1,   x2, y2, z2,   x3, y3, z3) 
{
	var point1 = new Point3D_(x1, y1, z1);
	var point2 = new Point3D_(x2, y2, z2);
	var point3 = new Point3D_(x3, y3, z3);

	// now, calculate normal.
	var normal = Triangle_.calculateNormal(point1, point2, point3, undefined);

	this.setPointAndNormal(x1, y1, z1, normal.x, normal.y, normal.z);
};

Plane_.prototype.intersectionLine = function(line, intersectionPoint) 
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
		
		if (intersectionPoint === undefined) { intersectionPoint = new Point3D_(); }
		
		intersectionPoint.set(r + alfa * u, s + alfa * v, t + alfa * w);
		return intersectionPoint;
	}
	else { return undefined; }
};

Plane_.prototype.intersectionSphere = function(sphere) 
{
	if (sphere === undefined || sphere.centerPoint === undefined)
	{ return Constant_.INTERSECTION_OUTSIDE; }
	
	var sphereCenter = sphere.centerPoint;
	
	// calculate the distance by dotProduct.
	// sphere centerPoint = (x1, y1, z1), distance = |ax1 + by1 + cz1 + d|/sqrt(a*a +b*b + c*c*).
	// note: the module sqrt(a*a +b*b + c*c*) = 1, so no necessary divide distance by module.
	var distance = sphereCenter.x * this.a + sphereCenter.y * this.b + sphereCenter.z * this.c + this.d;

	if (distance < -sphere.r)
	{
		// The sphere is rear of the plane.
		return Constant_.INTERSECTION_OUTSIDE;
	}
	else if (distance < sphere.r)
	{
		// The sphere intersects the plane.
		return Constant_.INTERSECTION_INTERSECT;
	}

	// The sphere if in front of the plane.
	return Constant_.INTERSECTION_INSIDE;
};

Plane_.prototype.getRelativePositionOfThePoint = function(point, error) 
{
	if(error === undefined)
	{
		error = 1e-8;
	}

	var distance = point.x * this.a + point.y * this.b + point.z * this.c + this.d;

	if (distance < -error)
	{
		// The point is rear of the plane.
		return Constant_.INTERSECTION_OUTSIDE;
	}
	else if (distance > error)
	{
		// The point if in front of the plane.
		return Constant_.INTERSECTION_INSIDE;
	}

	// The point intersects the plane.
	return Constant_.INTERSECTION_INTERSECT;
};

Plane_.prototype.getRelativePositionOfTheSegment = function(segment, error) 
{
	// a segment can be:
	// 1) in front of the plane.
	// 2) rear of the plane.
	// 3) intersection with the plane (one point is in front of the plane and the other point is rear of the plane).
	// 4) one point is coincident with the plane.
	// 5) two points is coincident with the plane (segement is in plane).
	//-----------------------------------------------------------------------
	if(error === undefined)
	{
		error = 1e-8;
	}

	/*
	CODE_.relativePositionSegment3DWithPlane2D = {
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
	var resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.UNKNOWN;

	if(relPosStartPoint === Constant_.INTERSECTION_INSIDE)
	{
		// startPoint is in front of the plane.
		if(relPosEndPoint === Constant_.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.NO_INTERSECTION;
		}
		else if(relPosEndPoint === Constant_.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.INTERSECTION;
		}
		else if(relPosEndPoint === Constant_.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.END_POINT_COINCIDENT;
		}
	}
	else if(relPosStartPoint === Constant_.INTERSECTION_OUTSIDE)
	{
		// startPoint is rear of the plane.
		if(relPosEndPoint === Constant_.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.INTERSECTION;
		}
		else if(relPosEndPoint === Constant_.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.NO_INTERSECTION;
		}
		else if(relPosEndPoint === Constant_.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.END_POINT_COINCIDENT;
		}
	}
	else if(relPosStartPoint === Constant_.INTERSECTION_INTERSECT)
	{
		// startPoint is coincident with the plane.
		if(relPosEndPoint === Constant_.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT;
		}
		else if(relPosEndPoint === Constant_.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT;
		}
		else if(relPosEndPoint === Constant_.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE_.relativePositionSegment3DWithPlane2D.TWO_POINTS_COINCIDENT;
		}
	}

	return resultRelPos;
};