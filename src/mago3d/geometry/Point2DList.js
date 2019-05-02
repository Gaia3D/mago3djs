'use strict';
/**
* 어떤 일을 하고 있습니까?
* @class Point2DList
*/
var Point2DList = function() 
{
	if (!(this instanceof Point2DList)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.pointsArray;
};

Point2DList.prototype.deleteObjects = function()
{
	if (this.pointsArray === undefined)
	{ return; }
	
	var pointsCount = this.pointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		this.pointsArray[i].deleteObjects();
		this.pointsArray[i] = undefined;
	}
	this.pointsArray = undefined;
};

Point2DList.prototype.addPoint = function(point2d)
{
	if (point2d === undefined)
	{ return; }
	
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	this.pointsArray.push(point2d);
};

Point2DList.prototype.newPoint = function(x, y)
{
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }
	
	var point = new Point2D(x, y);
	this.pointsArray.push(point);
	return point;
};

Point2DList.prototype.getPoint = function(idx)
{
	return this.pointsArray[idx];
};

Point2DList.prototype.getPointsCount = function()
{
	if (this.pointsArray === undefined)
	{ return 0; }
	
	return this.pointsArray.length;
};

Point2DList.prototype.getPrevIdx = function(idx)
{
	// Note: This function is used when this is a point2dRing.***
	var pointsCount = this.pointsArray.length;
	var prevIdx;
	
	if (idx === 0)
	{ prevIdx = pointsCount - 1; }
	else
	{ prevIdx = idx - 1; }

	return prevIdx;
};

Point2DList.prototype.getNextIdx = function(idx)
{
	// Note: This function is used when this is a point2dRing.***
	var pointsCount = this.pointsArray.length;
	var nextIdx;
	
	if (idx === pointsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	return nextIdx;
};

Point2DList.prototype.getIdxOfPoint = function(point)
{
	var pointsCount = this.pointsArray.length;
	var i=0;
	var idx = -1;
	var found = false;
	while (!found && i<pointsCount)
	{
		if (this.pointsArray[i] === point)
		{
			found = true;
			idx = i;
		}
		i++;
	}
	
	return idx;
};

Point2DList.prototype.getSegment = function(idx, resultSegment)
{
	var currPoint = this.getPoint(idx);
	var nextIdx = this.getNextIdx(idx);
	var nextPoint = this.getPoint(nextIdx);
	
	if (resultSegment === undefined)
	{ resultSegment = new Segment2D(currPoint, nextPoint); }
	else 
	{
		resultSegment.setPoints(currPoint, nextPoint);
	}

	return resultSegment;
};

Point2DList.prototype.setIdxInList = function()
{
	var pointsCount = this.pointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		this.pointsArray[i].idxInList = i;
	}
};

/**
 * nomal 계산
 */
Point2DList.prototype.getCopy = function(resultPoint2dList) 
{
	if (resultPoint2dList === undefined)
	{ resultPoint2dList = new Point2DList(); }
	else
	{ resultPoint2dList.deleteObjects(); }
	
	var myPoint, copyPoint;
	var pointsCount = this.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		myPoint = this.getPoint(i);
		copyPoint = resultPoint2dList.newPoint(myPoint.x, myPoint.y);
	}
	
	return resultPoint2dList;
};

/**
 * nomal 계산
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint
 */
Point2DList.prototype.getBoundingRectangle = function(resultBRect) 
{
	var pointsCount = this.getPointsCount();
	if (pointsCount === 0)
	{ return resultBRect; }
	
	if (resultBRect === undefined)
	{ resultBRect = new BoundingRectangle(); }
	
	var point;
	for (var i=0; i<pointsCount; i++)
	{
		if (i === 0)
		{ resultBRect.setInit(this.getPoint(i)); }
		else
		{ resultBRect.addPoint(this.getPoint(i)); }
	}
	
	return resultBRect;
};

/**
 * nomal 계산
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint
 */
Point2DList.prototype.getNearestPointIdxToPoint = function(point) 
{
	if (point === undefined)
	{ return undefined; }
	
	var currPoint, candidatePointIdx;
	var currSquaredDist, candidateSquaredDist;
	var pointsCount = this.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		currPoint = this.getPoint(i);
		currSquaredDist = currPoint.squareDistToPoint(point);
		if (candidatePointIdx === undefined)
		{
			candidatePointIdx = i;
			candidateSquaredDist = currSquaredDist;
		}
		else 
		{
			if (currSquaredDist < candidateSquaredDist)
			{
				candidatePointIdx = i;
				candidateSquaredDist = currSquaredDist;
			}
		}
	}
	
	return candidatePointIdx;
};

/**
 * nomal 계산
 * @param point 변수
 * @param resultPoint 변수
 * @returns resultPoint
 */
Point2DList.prototype.reverse = function() 
{
	if (this.pointsArray !== undefined)
	{ this.pointsArray.reverse(); }
};

Point2DList.prototype.getPointsIdxSortedByDistToPoint = function(thePoint, resultSortedPointsIdxArray)
{
	if (this.pointsArray === undefined)
	{ return resultSortedPointsIdxArray; }
	
	// Static function.***
	// Sorting minDist to maxDist.***
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

/**
 * 어떤 일을 하고 있습니까?
 * @returns result_idx
 */
Point2DList.prototype.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
{
	// this do a dicotomic search of idx in a ordered table.
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
	else 
	{
		// in this case do the dicotomic search.
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















































