'use strict';

var Point2DList_ = function() 
{
	this.pointsArray = [];
};

Point2DList_.prototype.addPoint = function(point2d)
{
	if (point2d === undefined)
	{ return; }
	
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	this.pointsArray.push(point2d);
};

Point2DList_.prototype.getPoint = function(idx)
{
	return this.pointsArray[idx];
};

Point2DList_.prototype.getPointsCount = function()
{
	if (this.pointsArray === undefined)
	{ return 0; }
	
	return this.pointsArray.length;
};

Point2DList_.prototype.getSegment = function(idx, resultSegment)
{
	var pointsCount = this.getPointsCount();
	var currPoint = this.getPoint(idx);
	var nextIdx = getNextIdx(idx, pointsCount);
	var nextPoint = this.getPoint(nextIdx);
	
	if (resultSegment === undefined)
	{ resultSegment = new Segment2D_(currPoint, nextPoint); }
	else 
	{
		resultSegment.setPoints(currPoint, nextPoint);
	}

	return resultSegment;
};

Point2DList_.prototype.getBoundingRectangle = function(resultBoundingRectangle) 
{
	var pointsCount = this.getPointsCount();
	if (pointsCount === 0)
	{ return resultBoundingRectangle; }
	
	if (resultBoundingRectangle === undefined)
	{ resultBoundingRectangle = new BoundingRectangle_(); }
	
	var point;
	for (var i=0; i<pointsCount; i++)
	{
		if (i === 0)
		{ resultBoundingRectangle.setInit(this.getPoint(i)); }
		else
		{ resultBoundingRectangle.addPoint(this.getPoint(i)); }
	}
	
	return resultBoundingRectangle;
};

Point2DList_.prototype.getPointsIdxSortedByDistToPoint = function(thePoint, resultSortedPointsIdxArray)
{
	if (this.pointsArray === undefined)
	{ return resultSortedPointsIdxArray; }
	
	// Static function.
	// Sorting minDist to maxDist.
	if (resultSortedPointsIdxArray === undefined)
	{ resultSortedPointsIdxArray = []; }
	
	var pointsArray = this.pointsArray;
	
	var objectAux;
	var objectsAuxArray = [];
	var point;
	var squaredDist;
	var startIdx, endIdx, insertIdx;
	var pointsCount = pointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		point = pointsArray[i];
		if (point === thePoint)
		{ continue; }
		
		squaredDist = thePoint.squareDistToPoint(point);
		objectAux = {};
		objectAux.pointIdx = i;
		objectAux.squaredDist = squaredDist;
		startIdx = 0;
		endIdx = objectsAuxArray.length - 1;
		
		insertIdx = this.getIndexToInsertBySquaredDist(objectsAuxArray, objectAux, startIdx, endIdx);
		objectsAuxArray.splice(insertIdx, 0, objectAux);
	}
	
	resultSortedPointsIdxArray.length = 0;
	var objectsCount = objectsAuxArray.length;
	for (var i=0; i<objectsCount; i++)
	{
		resultSortedPointsIdxArray.push(objectsAuxArray[i].pointIdx);
	}
	
	return resultSortedPointsIdxArray;
};

Point2DList_.prototype.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
{
	// 
	// 1rst, check the range.
	
	var range = endIdx - startIdx;
	
	if (objectsArray.length === 0)
	{ return 0; }
	
	if (range < 6)
	{
		// in this case do a lineal search.
		var finished = false;
		var i = startIdx;
		var idx;
		//var objectsCount = objectsArray.length;
		while (!finished && i<=endIdx)
		{
			if (object.squaredDist < objectsArray[i].squaredDist)
			{
				idx = i;
				finished = true;
			}
			i++;
		}
		
		if (finished)
		{
			return idx;
		}
		else 
		{
			return endIdx+1;
		}
	}
	else // in this case do the dicotomic search. (Binary search)
	{		
		var middleIdx = startIdx + Math.floor(range/2);
		var newStartIdx;
		var newEndIdx;
		if (objectsArray[middleIdx].squaredDist > object.squaredDist)
		{
			newStartIdx = startIdx;
			newEndIdx = middleIdx;
		}
		else 
		{
			newStartIdx = middleIdx;
			newEndIdx = endIdx;
		}
		return this.getIndexToInsertBySquaredDist(objectsArray, object, newStartIdx, newEndIdx);
	}
};

Point2DList_.prototype.setIdxInList = function()
{
	var pointsCount = this.pointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		this.pointsArray[i].idxInList = i;
	}
};