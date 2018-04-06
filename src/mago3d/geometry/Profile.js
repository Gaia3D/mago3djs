
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
		var resultHolesEliminatedPolygons = this.tessellate(resultHolesEliminatedPolygons);
		
		if(resultHolesEliminatedPolygons.length > 0)
		{
			// there are only one polygon in "resultHolesEliminatedPolygons".***
			var polygon = resultHolesEliminatedPolygons[0]; // there are only 1 polygon.***
			
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
	
	if(!finished)
		return false;
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile.prototype.tessellate = function(resultHolesEliminatedPolygons) 
{
	if(this.outerRing === undefined)
		return undefined;
	
	if(resultHolesEliminatedPolygons === undefined)
		resultHolesEliminatedPolygons = [];
	
	if(this.hasHoles())
	{
		var hole;
		var holeIdx;
		var holePolygon;
		var objectAux;
		var innerPointIdx;
		var innersBRect;
		
		// prepare outerRing if necessary.***
		var outerRing = this.outerRing;
		if(outerRing.polygon === undefined)
			outerRing.makePolygon();
		var outerPolygon = outerRing.polygon;
		var concavePointsIndices = outerPolygon.calculateNormal(concavePointsIndices);
		
		// make a innerRingsArray copy.***
		var innerRingsArray = [];
		var innerRingsCount = this.innerRingsList.getRingsCount();
		for(var i=0; i<innerRingsCount; i++)
		{
			innerRingsArray.push(this.innerRingsList.getRing(i));
		}
		
		var resultPolygon = new Polygon();
		var resultPolygonAux = new Polygon();
		resultPolygonAux = outerPolygon.getCopy(resultPolygonAux);
		var innersBRectLeftDownPoint = new Point2D();
		var objectsArray = [];
		
		// now, for each innerRing, try to merge to outerRing by splitSegment.***
		var innerRingsCount = innerRingsArray.length;
		var i=0;
		var finished = false;
		while(!finished && i<innerRingsCount)
		{
			// calculate the most left-down innerRing.***
			innersBRect = RingsList.getBoundingRectangle(innerRingsArray, innersBRect);
			innersBRectLeftDownPoint.set(innersBRect.minX, innersBRect.minY);
			
			objectsArray.length = 0; // init.***
			objectsArray = RingsList.getSortedRingsByDistToPoint(innersBRectLeftDownPoint, innerRingsArray, objectsArray);
		
			objectAux = objectsArray[0];
			hole = objectAux.ring;
			holeIdx = objectAux.ringIdx;
			holePolygon = hole.polygon;
			innerPointIdx = objectAux.pointIdx;
			holePolygon.calculateNormal();
			
			if(this.eliminateHolePolygon(resultPolygonAux, holePolygon, innerPointIdx, resultPolygon))
			{
				if(innerRingsArray.length == 1)
				{
					finished = true;
					break;
				}
				// erase the hole from innerRingsArray.***
				innerRingsArray.splice(holeIdx, 1);
				resultPolygonAux.deleteObjects();
				resultPolygonAux = resultPolygon;
				resultPolygon = new Polygon();
			}
			i++;
		}
		resultHolesEliminatedPolygons.push(resultPolygon);
	}
	
	return resultHolesEliminatedPolygons;
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
Profile.prototype.TEST__setFigureHole_2 = function() 
{
	// complicated polygon with multiple holes.***
	var polyLine;
	var arc;
	var circle;
	var rect;
	var point3d;
	var star;
	
	// Outer ring.**************************************
	var outerRing = this.newOuterRing();
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-13, 3); // 0
	point3d = polyLine.newPoint2d(-13, -11); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-8, -11);
	arc.setRadius(5);
	arc.setStartAngleDegree(180.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-8, -16); // 0
	point3d = polyLine.newPoint2d(-5, -16); // 1
	point3d = polyLine.newPoint2d(-3, -15); // 2
	point3d = polyLine.newPoint2d(-3, -14); // 3
	point3d = polyLine.newPoint2d(-5, -12); // 4
	point3d = polyLine.newPoint2d(-3, -11); // 5
	point3d = polyLine.newPoint2d(-2, -9); // 6
	point3d = polyLine.newPoint2d(3, -9); // 7
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(9, -9);
	arc.setRadius(6);
	arc.setStartAngleDegree(180.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(15, -9); // 0
	point3d = polyLine.newPoint2d(16, -9); // 1
	point3d = polyLine.newPoint2d(16, 4); // 2
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(11, 4);
	arc.setRadius(5);
	arc.setStartAngleDegree(0.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(11, 9); // 0
	point3d = polyLine.newPoint2d(4, 9); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(4, 11);
	arc.setRadius(2);
	arc.setStartAngleDegree(-90.0);
	arc.setSweepAngleDegree(-180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(4, 13); // 0
	point3d = polyLine.newPoint2d(9, 13); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(9, 14.5);
	arc.setRadius(1.5);
	arc.setStartAngleDegree(-90.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(9, 16); // 0
	point3d = polyLine.newPoint2d(2, 16); // 1
	point3d = polyLine.newPoint2d(0, 14); // 2
	point3d = polyLine.newPoint2d(-4, 16); // 3
	point3d = polyLine.newPoint2d(-9, 16); // 4
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-9, 14);
	arc.setRadius(2);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-9, 12); // 0
	point3d = polyLine.newPoint2d(-6, 12); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-6, 10.5);
	arc.setRadius(1.5);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(-180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = outerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-6, 9); // 0
	point3d = polyLine.newPoint2d(-7, 9); // 1
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(-7, 3);
	arc.setRadius(6);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	// Holes.**************************************************
	// Hole 1.*************************************************
	var innerRing = this.newInnerRing();
	
	polyLine = innerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(-9, 3); // 0
	point3d = polyLine.newPoint2d(-10, -4); // 1
	point3d = polyLine.newPoint2d(-10, -8); // 2
	point3d = polyLine.newPoint2d(-8, -11); // 3
	point3d = polyLine.newPoint2d(-3, -7); // 4
	point3d = polyLine.newPoint2d(4, -7); // 5
	
	arc = innerRing.newElement("ARC");
	arc.setCenterPosition(8, -7);
	arc.setRadius(4);
	arc.setStartAngleDegree(180.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	polyLine = innerRing.newElement("POLYLINE");
	point3d = polyLine.newPoint2d(12, -7); // 0
	point3d = polyLine.newPoint2d(12, -4); // 1
	point3d = polyLine.newPoint2d(8, -10); // 2
	point3d = polyLine.newPoint2d(4, -5); // 3
	point3d = polyLine.newPoint2d(-8, -5); // 4
	point3d = polyLine.newPoint2d(-7, 4); // 5
	point3d = polyLine.newPoint2d(9, 4); // 6
	point3d = polyLine.newPoint2d(9, -5); // 7
	point3d = polyLine.newPoint2d(14, 2); // 8
	point3d = polyLine.newPoint2d(13, 2); // 9
	point3d = polyLine.newPoint2d(11, 0); // 10
	point3d = polyLine.newPoint2d(11, 7); // 11
	point3d = polyLine.newPoint2d(13, 8); // 12
	point3d = polyLine.newPoint2d(5, 8); // 13
	point3d = polyLine.newPoint2d(9, 6); // 14
	point3d = polyLine.newPoint2d(-6, 6); // 15
	
	arc = innerRing.newElement("ARC");
	arc.setCenterPosition(-6, 3);
	arc.setRadius(3);
	arc.setStartAngleDegree(90.0);
	arc.setSweepAngleDegree(90.0);
	arc.numPointsFor360Deg = 24;
	
	// Hole 2.*************************************************
	innerRing = this.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(-10, -13);
	circle.setRadius(1);
	
	// Hole 3.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(-6.5, -14);
	star.setRadiusCount(5);
	star.setInteriorRadius(0.6);
	star.setExteriorRadius(2);

	// Hole 4.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(-9, 14);
	star.setRadiusCount(6);
	star.setInteriorRadius(0.5);
	star.setExteriorRadius(1.5);
	
	// Hole 5.*************************************************
	innerRing = this.newInnerRing();
	rect = innerRing.newElement("RECTANGLE");
	rect.setCenterPosition(-4.5, 1.5);
	rect.setDimensions(3, 3);
	
	// Hole 6.*************************************************
	innerRing = this.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(-4.5, -2.5);
	circle.setRadius(2);
	
	// Hole 7.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(0, 0);
	star.setRadiusCount(5);
	star.setInteriorRadius(1);
	star.setExteriorRadius(2.5);
	
	// Hole 8.*************************************************
	innerRing = this.newInnerRing();
	circle = innerRing.newElement("CIRCLE");
	circle.setCenterPosition(-6, 14);
	circle.setRadius(1.5);
	
	// Hole 9.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(-1.5, 11);
	star.setRadiusCount(12);
	star.setInteriorRadius(0.6);
	star.setExteriorRadius(2);
	
	// Hole 10.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(13.5, 5);
	star.setRadiusCount(25);
	star.setInteriorRadius(0.4);
	star.setExteriorRadius(1.5);
	
	// Hole 11.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(9, -13);
	star.setRadiusCount(10);
	star.setInteriorRadius(0.4);
	star.setExteriorRadius(1.5);
	
	// Hole 12.*************************************************
	innerRing = this.newInnerRing();
	star = innerRing.newElement("STAR");
	star.setCenterPosition(5.5, 1.5);
	star.setRadiusCount(7);
	star.setInteriorRadius(0.7);
	star.setExteriorRadius(2);
};

















