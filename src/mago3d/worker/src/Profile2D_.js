
'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Profile2D
 */
var Profile2D_ = function() 
{
	this.outerRing; // one Ring2D. 
	this.innerRingsList; // class: Ring2DList. 
};

Profile2D_.prototype.checkNormals = function() 
{
	if (this.outerRing === undefined)
	{ return; }
	
	// 1rst, calculate the outerNormal.
	var outerRing = this.outerRing;
	if (outerRing.polygon === undefined)
	{ outerRing.makePolygon(); }
	var outerPolygon = outerRing.polygon;
	var concavePointsIndices = outerPolygon.calculateNormal(concavePointsIndices);
	var outerNormal = outerPolygon.normal;
	
	if (this.innerRingsList === undefined)
	{ return; }
	
	// if there are inners, the innerNormals must be inverse of the outerNormal.
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
			// then reverse innerPolygon.
			innerPolygon.reverseSense();
			innerPolygon.normal = -innerNormal;
		}
		
	}
};

Profile2D_.prototype.hasHoles = function() 
{
	if (this.innerRingsList === undefined || this.innerRingsList.getRingsCount() === 0)
	{ return false; }
	
	return true;
};

Profile2D_.prototype.getGeneralPolygon = function(generalPolygon) 
{
	// this returns a holesTessellatedPolygon, and inside it has convexPolygons.
	this.checkNormals(); // here makes outer & inner's polygons.
	
	if (!this.hasHoles())
	{
		// Simply, put all points of outerPolygon into generalPolygon(computingPolygon).
		if (generalPolygon === undefined)
		{ generalPolygon = new Polygon2D_(); }
		
		if (generalPolygon.point2dList === undefined)
		{ generalPolygon.point2dList = new Point2DList_(); }
		
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
		// 1rst, check normals congruences.
		generalPolygon = this.tessellateHoles(generalPolygon);
	}
	
	generalPolygon.convexPolygonsArray = [];
	var concavePointsIndices = generalPolygon.calculateNormal(concavePointsIndices);
	generalPolygon.convexPolygonsArray = generalPolygon.tessellate(concavePointsIndices, generalPolygon.convexPolygonsArray);
	
	return generalPolygon;
};

Profile2D_.prototype.getConvexFacesIndicesData = function(resultGeneralIndicesData) 
{
	if (this.outerRing === undefined)
	{ return resultVbo; }
	
	var generalPolygon = this.getGeneralPolygon(undefined);
	
	if (resultGeneralIndicesData === undefined)
	{ resultGeneralIndicesData = []; }
	
	// 1rst, set idxInList all points.
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
				ringIdxInList = -1; // Set idx of outerRing as -1.
			}
			else 
			{
				ringIdxInList = this.innerRingsList.getRingIndex(currRing);
			}
			indexData.ownerIdx = ringIdxInList;
			convexDatas.push(indexData);
		}
		resultGeneralIndicesData.push(convexDatas);
	}
	
	return resultGeneralIndicesData;
};