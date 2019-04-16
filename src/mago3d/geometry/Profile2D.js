
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Profile2D
 */
var Profile2D = function() 
{
	if (!(this instanceof Profile2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.outerRing; // one Ring2D. 
	this.innerRingsList; // class: Rings2DList. 
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.newOuterRing = function() 
{
	if (this.outerRing === undefined)
	{ this.outerRing = new Ring2D(); }
	else 
	{
		this.outerRing.deleteObjects();
	}
	
	return this.outerRing;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.newInnerRing = function() 
{
	if (this.innerRingsList === undefined)
	{ this.innerRingsList = new Rings2DList(); }
	
	var innerRing = this.innerRingsList.newRing();
	
	return innerRing;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.getInnerRingsList = function() 
{
	if (this.innerRingsList === undefined)
	{ this.innerRingsList = new Rings2DList(); }

	return this.innerRingsList;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.deleteObjects = function() 
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

Profile2D.prototype.hasHoles = function() 
{
	if (this.innerRingsList === undefined || this.innerRingsList.getRingsCount() === 0)
	{ return false; }
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
 
Profile2D.prototype.getVBO = function(resultVbo) 
{
	if (this.outerRing === undefined)
	{ return resultVbo; }
	
	var generalPolygon = this.getGeneralPolygon(undefined);
	generalPolygon.getVbo(resultVbo);
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
 
Profile2D.prototype.getConvexFacesIndicesData = function(resultGeneralIndicesData) 
{
	if (this.outerRing === undefined)
	{ return resultVbo; }
	
	var generalPolygon = this.getGeneralPolygon(undefined);
	
	if (resultGeneralIndicesData === undefined)
	{ resultGeneralIndicesData = []; }
	
	// 1rst, set idxInList all points.***
	this.outerRing.polygon.point2dList.setIdxInList();
	
	if (this.innerRingsList !== undefined)
	{
		var innerRingsCount = this.innerRingsList.getRingsCount();
		for (var i=0; i<innerRingsCount; i++)
		{
			var innerRing = this.innerRingsList.getRing(i);
			innerRing.polygon.point2dList.setIdxInList();
		}
	}
	
	var convexDatas;
	var convexPolygon;
	var indexData;
	var currRing;
	var ringIdxInList;
	var point;
	var convexPolygonsCount = generalPolygon.convexPolygonsArray.length;
	for (var i=0; i<convexPolygonsCount; i++)
	{
		convexPolygon = generalPolygon.convexPolygonsArray[i];
		convexDatas = [];
		var pointsCount = convexPolygon.point2dList.getPointsCount();
		for (var j=0; j<pointsCount; j++)
		{
			point = convexPolygon.point2dList.getPoint(j);
			indexData = point.indexData;
			currRing = indexData.owner;
			indexData.idxInList = point.idxInList;
			if (currRing === this.outerRing)
			{
				ringIdxInList = -1;
			}
			else 
			{
				ringIdxInList = this.innerRingsList.getRingIdx(currRing);
			}
			indexData.ownerIdx = ringIdxInList;
			convexDatas.push(indexData);
		}
		resultGeneralIndicesData.push(convexDatas);
	}
	
	return resultGeneralIndicesData;
};


/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
 
Profile2D.prototype.getGeneralPolygon = function(generalPolygon) 
{
	// this returns a holesTessellatedPolygon, and inside it has convexPolygons.***
	this.checkNormals(); // here makes outer & inner's polygons.***
	
	if (!this.hasHoles())
	{
		// Simply, put all points of outerPolygon into generalPolygon(computingPolygon).***
		if (generalPolygon === undefined)
		{ generalPolygon = new Polygon2D(); }
		
		if (generalPolygon.point2dList === undefined)
		{ generalPolygon.point2dList = new Point2DList(); }
		
		var outerPolygon = this.outerRing.polygon;
		var point;
		var outerPointsCount = outerPolygon.point2dList.getPointsCount();
		for (var i=0; i<outerPointsCount; i++)
		{
			point = outerPolygon.point2dList.getPoint(i);
			generalPolygon.point2dList.addPoint(outerPolygon.point2dList.getPoint(i));
		}
	}
	else 
	{
		// 1rst, check normals congruences.***
		generalPolygon = this.tessellateHoles(generalPolygon);
	}
	
	generalPolygon.convexPolygonsArray = [];
	var concavePointsIndices = generalPolygon.calculateNormal(concavePointsIndices);
	generalPolygon.convexPolygonsArray = generalPolygon.tessellate(concavePointsIndices, generalPolygon.convexPolygonsArray);
	
	return generalPolygon;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.eliminateHolePolygonBySplitPoints = function(outerPolygon, innerPolygon, outerPointIdx, innerPointIdx, resultPolygon) 
{
	if (resultPolygon === undefined)
	{ resultPolygon = new Polygon2D(); }
	
	if (resultPolygon.point2dList === undefined)
	{ resultPolygon.point2dList = new Point2DList(); }
	
	// 1rst, copy in newPolygon the outerPolygon.***
	var outerPointsCount = outerPolygon.point2dList.getPointsCount();
	var finished = false;
	var i=0;
	var newPoint;
	var outerPoint;
	var currIdx = outerPointIdx;
	
	while (!finished && i<outerPointsCount)
	{
		outerPoint = outerPolygon.point2dList.getPoint(currIdx);
		resultPolygon.point2dList.addPoint(outerPoint);
		
		currIdx = outerPolygon.point2dList.getNextIdx(currIdx);
		if (currIdx === outerPointIdx)
		{
			finished = true;
			
			// must add the firstPoint point.***
			outerPoint = outerPolygon.point2dList.getPoint(currIdx);
			resultPolygon.point2dList.addPoint(outerPoint);
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
	while (!finished && i<innerPointsCount)
	{
		innerPoint = innerPolygon.point2dList.getPoint(currIdx);
		resultPolygon.point2dList.addPoint(innerPoint);
		
		currIdx = innerPolygon.point2dList.getNextIdx(currIdx);
		if (currIdx === innerPointIdx)
		{
			finished = true;
			// must add the firstPoint point.***
			innerPoint = innerPolygon.point2dList.getPoint(currIdx);
			resultPolygon.point2dList.addPoint(innerPoint);
		}
		
		i++;
	}
	
	return resultPolygon;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.eliminateHolePolygon = function(computingPolygon, innerRing, innerPointIdx, resultPolygon) 
{
	// 1rst, make a sorted by dist of points of outer to "innerPoint".***
	var resultSortedPointsIdxArray = [];
	var innerPolygon = innerRing.polygon;
	var innerPoint = innerPolygon.point2dList.getPoint(innerPointIdx);
	resultSortedPointsIdxArray = computingPolygon.getPointsIdxSortedByDistToPoint(innerPoint, resultSortedPointsIdxArray);
	
	var outerSortedPointsCount = resultSortedPointsIdxArray.length;
	var splitSegment = new Segment2D();;
	var finished = false;
	var i=0;
	var outPointIdx;
	var outPoint;
	while (!finished && i<outerSortedPointsCount)
	{
		outPointIdx = resultSortedPointsIdxArray[i];
		outPoint = computingPolygon.point2dList.getPoint(outPointIdx);
		splitSegment.setPoints(outPoint, innerPoint);
		
		// check if splitSegment intersects the computingPolygon or any innerPolygons.***
		if (computingPolygon.intersectionWithSegment(splitSegment) || innerPolygon.intersectionWithSegment(splitSegment))
		{
			i++;
			continue;
		}
		
		resultPolygon = this.eliminateHolePolygonBySplitPoints(computingPolygon, innerPolygon, outPointIdx, innerPointIdx, resultPolygon);
		finished = true;
		
		i++;
	}
	
	if (!finished)
	{ return false; }
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.tessellateHoles = function(resultHolesEliminatedPolygon) 
{
	if (this.outerRing === undefined)
	{ return resultHolesEliminatedPolygon; }
	
	if (!this.hasHoles())
	{ return resultHolesEliminatedPolygon; }
	
	if (resultHolesEliminatedPolygon === undefined)
	{ resultHolesEliminatedPolygon = new Polygon2D(); }
	
	var hole;
	var holeIdx;
	var holePolygon;
	var objectAux;
	var innerPointIdx;
	var innersBRect;
	
	// prepare outerRing if necessary.***
	var outerRing = this.outerRing;
	if (outerRing.polygon === undefined)
	{ outerRing.makePolygon(); }
	var outerPolygon = outerRing.polygon;
	var concavePointsIndices = outerPolygon.calculateNormal(concavePointsIndices);
	
	// make a innerRingsArray copy.***
	var innerRingsArray = [];
	var innerRingsCount = this.innerRingsList.getRingsCount();
	for (var i=0; i<innerRingsCount; i++)
	{
		innerRingsArray.push(this.innerRingsList.getRing(i));
	}
	
	var resultPolygon = new Polygon2D();
	var computingPolygon = new Polygon2D();
	computingPolygon.point2dList = new Point2DList();
	
	// put all points of outerPolygon into computingPolygon.***
	var indexData;
	var point;
	var outerPointsCount = outerPolygon.point2dList.getPointsCount();
	for (var i=0; i<outerPointsCount; i++)
	{
		point = outerPolygon.point2dList.getPoint(i);
		computingPolygon.point2dList.addPoint(outerPolygon.point2dList.getPoint(i));
	}
	
	var innersBRectLeftDownPoint = new Point2D();
	var objectsArray = [];
	
	// now, for each innerRing, try to merge to outerRing by splitSegment.***
	var innerRingsCount = innerRingsArray.length;
	var i=0;
	var finished = false;
	while (!finished && i<innerRingsCount)
	{
		// calculate the most left-down innerRing.***
		innersBRect = Rings2DList.getBoundingRectangle(innerRingsArray, innersBRect);
		innersBRectLeftDownPoint.set(innersBRect.minX, innersBRect.minY);
		
		objectsArray.length = 0; // init.***
		objectsArray = Rings2DList.getSortedRingsByDistToPoint(innersBRectLeftDownPoint, innerRingsArray, objectsArray);
	
		objectAux = objectsArray[0];
		hole = objectAux.ring;
		holeIdx = objectAux.ringIdx;
		holePolygon = hole.polygon;
		innerPointIdx = objectAux.pointIdx;
		holePolygon.calculateNormal();
		
		if (this.eliminateHolePolygon(computingPolygon, hole, innerPointIdx, resultPolygon))
		{
			computingPolygon = resultPolygon;
			
			if (innerRingsArray.length === 1)
			{
				finished = true;
				break;
			}
			// erase the hole from innerRingsArray.***
			innerRingsArray.splice(holeIdx, 1);
			resultPolygon = new Polygon2D();
		}
		i++;
	}
	resultHolesEliminatedPolygon = computingPolygon;
	return resultHolesEliminatedPolygon;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.checkNormals = function() 
{
	if (this.outerRing === undefined)
	{ return; }
	
	// 1rst, calculate the outerNormal.***
	var outerRing = this.outerRing;
	if (outerRing.polygon === undefined)
	{ outerRing.makePolygon(); }
	var outerPolygon = outerRing.polygon;
	var concavePointsIndices = outerPolygon.calculateNormal(concavePointsIndices);
	var outerNormal = outerPolygon.normal;
	
	if (this.innerRingsList === undefined)
	{ return; }
	
	// if there are inners, the innerNormals must be inverse of the outerNormal.***
	var innerRing;
	var innerPolygon;
	var innerNormal;
	var innersCount = this.innerRingsList.getRingsCount();
	for (var i=0; i<innersCount; i++)
	{
		innerRing = this.innerRingsList.getRing(i);
		if (innerRing.polygon === undefined)
		{ innerRing.makePolygon(); }
		var innerPolygon = innerRing.polygon;
		innerPolygon.calculateNormal();
		var innerNormal = innerPolygon.normal;
		
		if (innerNormal === outerNormal)
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
Profile2D.prototype.TEST__setFigure_1 = function() 
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
	point3d = polyLine.newPoint2d(7, 7); // 0
	point3d = polyLine.newPoint2d(0, 7); // 1
	point3d = polyLine.newPoint2d(0, 0); // 2
	point3d = polyLine.newPoint2d(7, 0); // 3
	
	arc = outerRing.newElement("ARC");
	arc.setCenterPosition(7, 3.5);
	arc.setRadius(3.5);
	arc.setStartAngleDegree(-90.0);
	arc.setSweepAngleDegree(180.0);
	arc.numPointsFor360Deg = 24;
	
	// hole.***
	var innerRing = this.newInnerRing();
	rect = innerRing.newElement("RECTANGLE");
	rect.setCenterPosition(3, 3);
	rect.setDimensions(2, 2);
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns vertexList
 */
Profile2D.prototype.TEST__setFigureHole_2 = function() 
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

















