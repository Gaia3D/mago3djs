'use strict';

var Triangle_ = function(vertex0, vertex1, vertex2) 
{
	this.vertex0;
	this.vertex1;
	this.vertex2;
	this.vtxIdx0;
	this.vtxIdx1;
	this.vtxIdx2;
	this.normal; 
	
	if (vertex0 !== undefined) 
	{
	    this.vertex0 = vertex0; 
	}
	
	if (vertex1 !== undefined)
	{ this.vertex1 = vertex1; }
	
	if (vertex2 !== undefined)
	{ this.vertex2 = vertex2; }
	
	this.hEdge;

	this.status = CODE_.status.NORMAL; // this var indicates the status of the triangle.
	// If no exist status, then the status is "NORMAL".***
	// Status can be "DELETED", "NORMAL", etc.***

	// auxiliar vars:
	this.bRectXY; // bounding rectangle of the triangle projected in the plane XY.
};

Triangle_.prototype.setStatus = function(status) 
{
	this.status = status;
};

Triangle_.prototype.getStatus = function() 
{
	return this.status;
};

Triangle_.prototype.getCrossProduct = function(idxVertex, resultCrossProduct) 
{
	if (resultCrossProduct === undefined)
	{ resultCrossProduct = new Point3D_(); }

	var currentPoint, prevPoint, nextPoint;

	if (idxVertex === 0)
	{
		currentPoint = this.vertex0.point3d;
		prevPoint = this.vertex2.point3d;
		nextPoint = this.vertex1.point3d;
	}
	else if (idxVertex === 1)
	{
		currentPoint = this.vertex1.point3d;
		prevPoint = this.vertex0.point3d;
		nextPoint = this.vertex2.point3d;
	}
	else if (idxVertex === 2)
	{
		currentPoint = this.vertex2.point3d;
		prevPoint = this.vertex1.point3d;
		nextPoint = this.vertex0.point3d;
	}

	var v1 = new Point3D_();
	var v2 = new Point3D_();

	v1.set(currentPoint.x - prevPoint.x,     currentPoint.y - prevPoint.y,     currentPoint.z - prevPoint.z);
	v2.set(nextPoint.x - currentPoint.x,     nextPoint.y - currentPoint.y,     nextPoint.z - currentPoint.z);

	v1.unitary();
	v2.unitary();

	resultCrossProduct = v1.crossProduct(v2, resultCrossProduct);

	return resultCrossProduct;
};

Triangle_.prototype.assignVerticesIdx = function() 
{
	if (this.vertex0 === undefined || this.vertex1 === undefined || this.vertex2 === undefined)
	{ return; }
	
	this.vtxIdx0 = this.vertex0.getIdxInList();
	this.vtxIdx1 = this.vertex1.getIdxInList();
	this.vtxIdx2 = this.vertex2.getIdxInList();
};

Triangle_.prototype.hasVertex = function(vertex) 
{
	// this function returns true if "vertex" is the same vertex of the triangle.
	if (this.vertex0 === vertex || this.vertex1 === vertex || this.vertex2 === vertex)
	{
		return true;
	}

	return false;
};

Triangle_.calculateNormal = function(point1, point2, point3, resultNormal) 
{
	// Given 3 points, this function calculates the normal.
	var currentPoint = point1;
	var prevPoint = point3;
	var nextPoint = point2;

	var v1 = new Point3D_(currentPoint.x - prevPoint.x,     currentPoint.y - prevPoint.y,     currentPoint.z - prevPoint.z);
	var v2 = new Point3D_(nextPoint.x - currentPoint.x,     nextPoint.y - currentPoint.y,     nextPoint.z - currentPoint.z);

	v1.unitary();
	v2.unitary();
	if (resultNormal === undefined)
	{ resultNormal = new Point3D_(); }
	
	resultNormal = v1.crossProduct(v2, resultNormal);
	resultNormal.unitary();
	
	return resultNormal;
};

Triangle_.prototype.calculatePlaneNormal = function() 
{
	if (this.normal === undefined)
	{ this.normal = new Point3D_(); }

	this.getCrossProduct(0, this.normal);
	this.normal.unitary();
};

Triangle_.prototype.getPlaneNormal = function() 
{
	if (this.normal === undefined)
	{ this.calculatePlaneNormal(); }
	
	return this.normal;
};

Triangle_.prototype.getCenterPoint = function(resultCenterPoint) 
{
	if (!resultCenterPoint)
	{
		resultCenterPoint = new Point3D_();
	}

	var p0 = this.vertex0.getPosition();
	var p1 = this.vertex1.getPosition();
	var p2 = this.vertex2.getPosition();

	resultCenterPoint.set((p0.x + p1.x + p2.x)/3.0, (p0.y + p1.y + p2.y)/3.0, (p0.z + p1.z + p2.z)/3.0);

	return resultCenterPoint;
};

Triangle_.prototype.getPlane = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane_(); }
	
	// make a plane with the point3d of the vertex0 & the normal.
	var point0 = this.vertex0.getPosition();
	var normal = this.getPlaneNormal();
	resultPlane.setPointAndNormal(point0.x, point0.y, point0.z, normal.x, normal.y, normal.z); 
	
	return resultPlane;
};

Triangle_.prototype.getBoundingBox = function(resultBbox) 
{
	if (resultBbox === undefined)
	{ resultBbox = new BoundingBox_(); }
	
	resultBbox.init(this.vertex0.getPosition());
	resultBbox.addPoint(this.vertex1.getPosition());
	resultBbox.addPoint(this.vertex2.getPosition());
	
	return resultBbox;
};

Triangle_.prototype.getSegment = function(idx, resultSegment) 
{
	if (idx === undefined)
	{ return; }
	
	if (resultSegment === undefined)
	{ resultSegment = new Segment3D_(); }
	
	if (idx === 0)
	{
		resultSegment.setPoints(this.vertex0.getPosition(), this.vertex1.getPosition());
	}
	else if (idx === 1)
	{
		resultSegment.setPoints(this.vertex1.getPosition(), this.vertex2.getPosition());
	}
	else if (idx === 2)
	{
		resultSegment.setPoints(this.vertex2.getPosition(), this.vertex0.getPosition());
	}
	
	return resultSegment;
};

Triangle_.prototype.getIntersectionByPlaneReport = function(plane, resultIntersectionReportsArray, error) 
{
	// 1rst, check if boundingSphere intersects with the plane.
	var bbox = this.getBoundingBox();
	var bSphere = bbox.getBoundingSphere();

	if (plane.intersectionSphere(bSphere) !== Constant_.INTERSECTION_INTERSECT)
	{
		return resultIntersectionReportsArray;
	}

	if (error === undefined)
	{ error = 1e-8; }

	// Now, for each edge, intersect with plane.
	/*
	CODE_.relativePositionSegment3DWithPlane2D = {
		"UNKNOWN" : 0,
		"NO_INTERSECTION" : 1,
		"INTERSECTION" : 2,
		"START_POINT_COINCIDENT" : 3,
		"END_POINT_COINCIDENT" : 4,
		"TWO_POINTS_COINCIDENT" : 5
	}*/
	var intersectedPointsArray = [];

	// Segment 0.*********************************************************************
	var seg0 = this.getSegment(0);
	var relPosSeg0ToPlane = plane.getRelativePositionOfTheSegment(seg0, error);

	if (relPosSeg0ToPlane === CODE_.relativePositionSegment3DWithPlane2D.INTERSECTION)
	{
		// calculate the intersection point.
		var line = seg0.getLine();
		var intersectPoint = plane.intersectionLine(line, undefined);
		// Now, must check if the "intersectPoint" is inside of the segment.
		if (seg0.intersectionWithPoint(intersectPoint, error))
		{
			intersectedPointsArray.push({
				intersectionType : "segmentIntersection",
				idx              : 0,
				intesectPoint    : intersectPoint});
		}
	}
	else if (relPosSeg0ToPlane === CODE_.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT)
	{
		var startPoint = seg0.startPoint3d;
		intersectedPointsArray.push({
			intersectionType : "startPointIntersection",
			idx              : 0,
			intesectPoint    : startPoint});
	}

	// Segment 1.*********************************************************************
	var seg1 = this.getSegment(1);
	var relPosSeg1ToPlane = plane.getRelativePositionOfTheSegment(seg1, error);

	if (relPosSeg1ToPlane === CODE_.relativePositionSegment3DWithPlane2D.INTERSECTION)
	{
		// calculate the intersection point.
		var line = seg1.getLine();
		var intersectPoint = plane.intersectionLine(line, undefined);
		if (seg1.intersectionWithPoint(intersectPoint, error))
		{
			intersectedPointsArray.push({
				intersectionType : "segmentIntersection",
				idx              : 1,
				intesectPoint    : intersectPoint});
		}
	}
	else if (relPosSeg1ToPlane === CODE_.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT)
	{
		var startPoint = seg1.startPoint3d;
		intersectedPointsArray.push({
			intersectionType : "startPointIntersection",
			idx              : 1,
			intesectPoint    : startPoint});
	}

	if (intersectedPointsArray.length < 2)
	{
		// Segment 2.*********************************************************************
		var seg2 = this.getSegment(2);
		var relPosSeg2ToPlane = plane.getRelativePositionOfTheSegment(seg2, error);

		if (relPosSeg2ToPlane === CODE_.relativePositionSegment3DWithPlane2D.INTERSECTION)
		{
			// calculate the intersection point.
			var line = seg2.getLine();
			var intersectPoint = plane.intersectionLine(line, undefined);
			if (seg2.intersectionWithPoint(intersectPoint, error))
			{
				intersectedPointsArray.push({
					intersectionType : "segmentIntersection",
					idx              : 2,
					intesectPoint    : intersectPoint});
			}
		}
		else if (relPosSeg2ToPlane === CODE_.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT)
		{
			var startPoint = seg2.startPoint3d;
			intersectedPointsArray.push({
				intersectionType : "startPointIntersection",
				idx              : 2,
				intesectPoint    : startPoint});
		}
	}
	
	if (!resultIntersectionReportsArray)
	{
		resultIntersectionReportsArray = [];
	}
	Array.prototype.push.apply(resultIntersectionReportsArray, intersectedPointsArray);
	return resultIntersectionReportsArray;
};