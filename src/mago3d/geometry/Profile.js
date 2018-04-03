
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Profile
 */
var Profile = function() 
{
	if (!(this instanceof Profile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.outerRing; // one Ring. 
	this.innerRingsList; // class: RingsList. 
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.newOuterRing = function() 
{
	if (this.outerRing === undefined)
	{ this.outerRing = new Ring(); }
	else{
		this.outerRing.deleteObjects();
	}
	
	return this.outerRing;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.newInnerRing = function() 
{
	if (this.innerRingsList === undefined)
	{ this.innerRingsList = new RingsList(); }
	
	var innerRing = this.innerRingsList.newRing();
	
	return innerRing;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.deleteObjects = function() 
{
	if (this.outerRing)
	{
		this.outerRing.deleteObjects();
		this.outerRing = undefined;
	}

	if (this.innerRingsList)
	{
		this.innerRingsList.deleteObjects();
		this.innerRingsList = undefined;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */

Profile.prototype.hasHoles = function() 
{
	if(this.innerRingsList === undefined || this.innerRingsList.getRingsCount() === 0)
		return false;
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
 
Profile.prototype.getVBO = function(resultVBOCacheKeys) 
{
	if(this.outerRing === undefined)
		return resultVBOCacheKeys;
	
	if(!this.hasHoles())
	{
		var outerRing = this.outerRing;
		outerRing.makePolygon();
		outerRing.polygon.convexPolygonsArray = [];
		var concavePointsIndices = outerRing.polygon.calculateNormal(concavePointsIndices);
		outerRing.polygon.convexPolygonsArray = outerRing.polygon.tessellate(concavePointsIndices, outerRing.polygon.convexPolygonsArray);

		outerRing.polygon.getVbo(resultVBOCacheKeys);
	}
	else{
		// 1rst, check normals congruences.***
		this.checkNormals();
		var resultConvexPolygons = this.tessellate(resultConvexPolygons);
		
		if(resultConvexPolygons.length > 0)
		{
			var polygon = resultConvexPolygons[0];
			
			polygon.convexPolygonsArray = [];
			var concavePointsIndices = polygon.calculateNormal(concavePointsIndices);
			polygon.convexPolygonsArray = polygon.tessellate(concavePointsIndices, polygon.convexPolygonsArray);
			polygon.getVbo(resultVBOCacheKeys);
		}
		var hola = 0;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.eliminateHolePolygonBySplitPoints = function(outerPolygon, innerPolygon, outerPointIdx, innerPointIdx, resultPolygon) 
{
	if(resultPolygon === undefined)
		resultPolygon = new Polygon();
	
	if(resultPolygon.point2dList === undefined)
		resultPolygon.point2dList = new Point2DList();
	
	// 1rst, copy in newPolygon the outerPolygon.***
	var outerPointsCount = outerPolygon.point2dList.getPointsCount();
	var finished = false;
	var i=0;
	var newPoint;
	var outerPoint;
	var currIdx = outerPointIdx;
	while(!finished && i<outerPointsCount)
	{
		outerPoint = outerPolygon.point2dList.getPoint(currIdx);
		newPoint = resultPolygon.point2dList.newPoint(outerPoint.x, outerPoint.y);
		
		currIdx = outerPolygon.point2dList.getNextIdx(currIdx);
		if(currIdx === outerPointIdx)
		{
			finished = true;
			
			// must add the firstPoint point.***
			outerPoint = outerPolygon.point2dList.getPoint(currIdx);
			newPoint = resultPolygon.point2dList.newPoint(outerPoint.x, outerPoint.y);
		}
		
		i++;
	}
	
	// now add innerPolygon's points.***
	var innerPointsCount = innerPolygon.point2dList.getPointsCount();
	finished = false;
	i=0;
	newPoint;
	var innerPoint;
	currIdx = innerPointIdx;
	while(!finished && i<innerPointsCount)
	{
		innerPoint = innerPolygon.point2dList.getPoint(currIdx);
		newPoint = resultPolygon.point2dList.newPoint(innerPoint.x, innerPoint.y);
		
		currIdx = innerPolygon.point2dList.getNextIdx(currIdx);
		if(currIdx === innerPointIdx)
		{
			finished = true;
			// must add the firstPoint point.***
			innerPoint = innerPolygon.point2dList.getPoint(currIdx);
			newPoint = resultPolygon.point2dList.newPoint(innerPoint.x, innerPoint.y);
		}
		
		i++;
	}
	
	return resultPolygon;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.eliminateHolePolygon = function(outerPolygon, innerPolygon, innerPointIdx, resultPolygon) 
{
	// 1rst, make a sorted by dist of points of outer to "innerPoint".***
	var resultSortedPointsIdxArray = [];
	var innerPoint = innerPolygon.point2dList.getPoint(innerPointIdx);
	resultSortedPointsIdxArray = outerPolygon.getPointsIdxSortedByDistToPoint(innerPoint, resultSortedPointsIdxArray);
	
	var outerSortedPointsCount = resultSortedPointsIdxArray.length;
	var splitSegment = new Segment2D();;
	var finished = false;
	var i=0;
	var outPointIdx;
	var outPoint;
	while(!finished && i<outerSortedPointsCount)
	{
		outPointIdx = resultSortedPointsIdxArray[i];
		outPoint = outerPolygon.point2dList.getPoint(outPointIdx);
		splitSegment.setPoints(outPoint, innerPoint);
		
		// check if splitSegment intersects the outerPolygon or any innerPolygons.***
		if(outerPolygon.intersectionWithSegment(splitSegment) || innerPolygon.intersectionWithSegment(splitSegment))
		{
			i++;
			continue;
		}
		
		resultPolygon = this.eliminateHolePolygonBySplitPoints(outerPolygon, innerPolygon, outPointIdx, innerPointIdx, resultPolygon);
		finished = true;
		
		i++;
	}
	
	return resultPolygon;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.checkNormals = function() 
{
	if(this.outerRing === undefined)
		return;
	
	// 1rst, calculate the outerNormal.***
	var outerRing = this.outerRing;
	if(outerRing.polygon === undefined)
		outerRing.makePolygon();
	var outerPolygon = outerRing.polygon;
	var concavePointsIndices = outerPolygon.calculateNormal(concavePointsIndices);
	var outerNormal = outerPolygon.normal;
	
	// if there are inners, the innerNormals must be inverse of the outerNormal.***
	var innerRing;
	var innerPolygon;
	var innerNormal;
	var innersCount = this.innerRingsList.getRingsCount();
	for(var i=0; i<innersCount; i++)
	{
		innerRing = this.innerRingsList.getRing(i);
		if(innerRing.polygon === undefined)
			innerRing.makePolygon();
		var innerPolygon = innerRing.polygon;
		innerPolygon.calculateNormal();
		var innerNormal = innerPolygon.normal;
		
		if(innerNormal === outerNormal)
		{
			// then reverse innerPolygon.***
			innerPolygon.reverseSense();
			innerPolygon.normal = -innerNormal;
		}
		
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.tessellate = function(resultConvexPolygons) 
{
	if(this.outerRing === undefined)
		return undefined;
	
	if(resultConvexPolygons === undefined)
		resultConvexPolygons = [];
	
	if(this.hasHoles())
	{
		// 1rst, calculate the most left-down innerRing.***
		var innersBRect = this.innerRingsList.getBoundingRectangle(innersBRect);
		var innersBRectLeftDownPoint = new Point2D(innersBRect.minX, innersBRect.minY);
		var objectsArray = [];
		objectsArray = this.innerRingsList.getSortedRingsByDistToPoint(innersBRectLeftDownPoint, objectsArray);
		
		// now, for each hole, calculate the nearest point to outerRing.***
		var hole;
		var holePolygon;
		var objectAux;
		var innerPointIdx;
		var holeNormal;
		var splitSegment;
		var resultPolygon;
		
		// prepare outerRing.***
		var outerRing = this.outerRing;
		if(outerRing.polygon === undefined)
			outerRing.makePolygon();
		var outerPolygon = outerRing.polygon;
		var concavePointsIndices = outerPolygon.calculateNormal(concavePointsIndices);
		
		// now, for each innerRing, try to merge to outerRing by splitSegment.***
		var innerRingsCount = objectsArray.length;
		for(var i=0; i<innerRingsCount; i++)
		{
			objectAux = objectsArray[i];
			hole = objectAux.ring;
			holePolygon = hole.polygon;
			innerPointIdx = objectAux.pointIdx;
			holePolygon.calculateNormal();
			//holeNormal = holePolygon.normal;
			
			resultPolygon = this.eliminateHolePolygon(outerPolygon, holePolygon, innerPointIdx, resultPolygon);
			resultConvexPolygons.push(resultPolygon);
		}
	}
	
	return resultConvexPolygons;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureHole_1 = function() 
{
	// profile with holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	var rect;
	
	rect = outerRing.newElement("RECTANGLE");
	rect.setCenterPosition(0, 0);
	rect.setDimensions(10, 6);
	/*
	var innerRing = this.newInnerRing();
	rect = innerRing.newElement("RECTANGLE");
	rect.setCenterPosition(1, 0);
	rect.setDimensions(5, 3);
	*/
	
	var innerRing = this.newInnerRing();
	rect = innerRing.newElement("CIRCLE");
	rect.setCenterPosition(1, 0);
	rect.setRadius(2.2);
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_almostHole_2 = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(3.0, 4.0); // 0
	point3d = polyLine.newPoint2d(5.0, 6.0); // 1
	point3d = polyLine.newPoint2d(0.0, 6.0); // 2
	point3d = polyLine.newPoint2d(0.0, 0.0); // 3
	point3d = polyLine.newPoint2d(9.0, 0.0); // 4
	point3d = polyLine.newPoint2d(9.0, 6.0); // 5
	point3d = polyLine.newPoint2d(5.0, 6.0); // 6
	point3d = polyLine.newPoint2d(3.0, 4.0); // 7
	point3d = polyLine.newPoint2d(4.0, 4.0); // 8
	point3d = polyLine.newPoint2d(4.0, 3.0); // 9
	point3d = polyLine.newPoint2d(3.0, 3.0); // 10
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_almostHole = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(0.0, 0.0); // 0
	point3d = polyLine.newPoint2d(7.0, 0.0); // 1
	point3d = polyLine.newPoint2d(7.0, 5.0); // 2
	point3d = polyLine.newPoint2d(5.0, 4.0); // 3
	point3d = polyLine.newPoint2d(5.0, 2.0); // 4
	point3d = polyLine.newPoint2d(1.0, 2.0); // 5
	point3d = polyLine.newPoint2d(1.0, 4.0); // 6
	point3d = polyLine.newPoint2d(5.0, 4.0); // 7
	point3d = polyLine.newPoint2d(7.0, 5.0); // 8
	point3d = polyLine.newPoint2d(0.0, 5.0); // 9
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_duckMouth = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(3.0, 0.0); // 0
	point3d = polyLine.newPoint2d(8.0, 0.0); // 1
	point3d = polyLine.newPoint2d(8.0, 5.0); // 2
	point3d = polyLine.newPoint2d(2.0, 5.0); // 3
	point3d = polyLine.newPoint2d(0.0, 0.0); // 4
	point3d = polyLine.newPoint2d(6.0, 4.0); // 5
	point3d = polyLine.newPoint2d(6.0, 2.0); // 6
	point3d = polyLine.newPoint2d(3.0, 2.0); // 7
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_spiral = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(0.0, -3.0); // 0
	point3d = polyLine.newPoint2d(3.0, -2.0); // 1
	point3d = polyLine.newPoint2d(5.0, -2.0); // 2
	point3d = polyLine.newPoint2d(5.0, 3.0); // 3
	point3d = polyLine.newPoint2d(-2.0, 4.0); // 4
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-3, 3);
	arc.setRadius(Math.sqrt(2));
	arc.setStartAngleDegree(45.0);
	arc.setSweepAngleDegree(-180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-4.0, 2.0); // 0
	point3d = polyLine.newPoint2d(-4.0, -5.0); // 1
	point3d = polyLine.newPoint2d(-5.0, -5.0); // 2
	point3d = polyLine.newPoint2d(-5.0, -3.0); // 3
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-6, -3);
	arc.setRadius(1);
	arc.setStartAngleDegree(0.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-7.0, -3.0); // 0
	point3d = polyLine.newPoint2d(-7.0, -7.0); // 1
	point3d = polyLine.newPoint2d(8.0, -5.0); // 2
	point3d = polyLine.newPoint2d(8.0, 8.0); // 3
	point3d = polyLine.newPoint2d(3.0, 8.0); // 4
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(0, 8);
	arc.setRadius(3);
	arc.setStartAngleDegree(0.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-3.0, 8.0); // 0
	point3d = polyLine.newPoint2d(-9.0, 8.0); // 1
	point3d = polyLine.newPoint2d(-9.0, 9.0); // 2
	point3d = polyLine.newPoint2d(-5.0, 9.0); // 3
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-5, 10);
	arc.setRadius(1);
	arc.setStartAngleDegree(-90);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-5.0, 11.0); // 0
	point3d = polyLine.newPoint2d(-10.0, 9.0); // 1
	point3d = polyLine.newPoint2d(-10.0, -10.0); // 2
	point3d = polyLine.newPoint2d(-3.0, -8.0); // 3
	point3d = polyLine.newPoint2d(-8.0, -8.0); // 4
	point3d = polyLine.newPoint2d(-8.0, -1.0); // 5
	point3d = polyLine.newPoint2d(-5.0, -1.0); // 6
	point3d = polyLine.newPoint2d(-6.0, 1.0); // 7
	point3d = polyLine.newPoint2d(-6.0, 6.0); // 8
	point3d = polyLine.newPoint2d(5.0, 6.0); // 9
	point3d = polyLine.newPoint2d(7.0, -4.0); // 10
	point3d = polyLine.newPoint2d(-2.0, -4.0); // 11
	point3d = polyLine.newPoint2d(-2.0, -2.0); // 12
	point3d = polyLine.newPoint2d(3.0, 1.0); // 13
	point3d = polyLine.newPoint2d(3.0, -1.0); // 14
	point3d = polyLine.newPoint2d(0.0, -1.0); // 15
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_simpleArc = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-2.0, 0.0); // 0
	point3d = polyLine.newPoint2d(-2.0, -3.0); // 1
	point3d = polyLine.newPoint2d(0.0, -3.0); // 2
	point3d = polyLine.newPoint2d(0.0, -1.0); // 3
	point3d = polyLine.newPoint2d(1.0, -1.0); // 4
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(0, 0);
	arc.setRadius(2);
	arc.setStartAngleDegree(-45.0);
	arc.setSweepAngleDegree(225.0);
	arc.numPointsFor360Deg = 36;
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_2 = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-5.0, 2.0); // 0
	point3d = polyLine.newPoint2d(-5.0, -4.0); // 1
	point3d = polyLine.newPoint2d(4.0, -4.0); // 2
	point3d = polyLine.newPoint2d(4.0, 7.0); // 3
	point3d = polyLine.newPoint2d(1.0, 8.0); // 4
	point3d = polyLine.newPoint2d(-1.0, 6.0); // 5
	point3d = polyLine.newPoint2d(1.0, 4.0); // 6
	point3d = polyLine.newPoint2d(1.0, 6.0); // 7
	point3d = polyLine.newPoint2d(3.0, 3.0); // 8
	point3d = polyLine.newPoint2d(0.0, -3.0); // 9
	point3d = polyLine.newPoint2d(-3.0, -3.0); // 10
	point3d = polyLine.newPoint2d(-3.0, 1.0); // 11
	point3d = polyLine.newPoint2d(-2.0, 1.0); // 12
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-3, 2);
	arc.setRadius(2);
	arc.setStartAngleDegree(-45.0);
	arc.setSweepAngleDegree(225.0);
	arc.numPointsFor360Deg = 77;
	
};


/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_1 = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(9.0, 0.0); // 0
	point3d = polyLine.newPoint2d(9.0, 3.0); // 1
	point3d = polyLine.newPoint2d(8.0, 3.0); // 2
	point3d = polyLine.newPoint2d(6.0, 1.0); // 3
	point3d = polyLine.newPoint2d(6.0, 2.0); // 4
	point3d = polyLine.newPoint2d(8.0, 4.0); // 5
	point3d = polyLine.newPoint2d(8.0, 5.0); // 6
	point3d = polyLine.newPoint2d(6.0, 5.0); // 7
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(4, 5);
	arc.setRadius(2);
	arc.setStartAngleDegree(0.0);
	arc.setSweepAngleDegree(-180.0);
	arc.numPointsFor360Deg = 36;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(2.0, 5.0); // 0
	point3d = polyLine.newPoint2d(0.0, 5.0); // 1
	point3d = polyLine.newPoint2d(0.0, 0.0); // 2
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.TEST__setFigureConcave_TShirt = function() 
{
	// profile without holes.***
	var outerRing = this.newOuterRing();
	
	var polyLine;
	var arc;
	var point3d;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(2.0, 3.0); // 0
	point3d = polyLine.newPoint2d(0.0, 3.0); // 1
	point3d = polyLine.newPoint2d(0.0, 0.0); // 2
	point3d = polyLine.newPoint2d(8.0, 0.0); // 3
	point3d = polyLine.newPoint2d(8.0, 3.0); // 4
	point3d = polyLine.newPoint2d(6.0, 3.0); // 5
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(4, 3);
	arc.setRadius(2);
	arc.setStartAngleDegree(0.0);
	arc.setSweepAngleDegree(-180.0);
	arc.numPointsFor360Deg = 36;
};

















