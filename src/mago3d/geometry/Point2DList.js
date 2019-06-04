'use strict';
/**
* Contain the list of the features of Point2D
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

/**
 * Clear this.pointsArray of this feature
 */
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

/**
 * Add a feature of Point2D at the last of this.pointsArray
 * @param {Point2D} point2d the point that will be pushed at this.pointsArray
 */
Point2DList.prototype.addPoint = function(point2d)
{
	if (point2d === undefined)
	{ return; }
	
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	this.pointsArray.push(point2d);
};

/**
 * Create a new feature of Point2D
 * @param {Number} x the x coordi of the point
 * @param {Number} y the y coordi of the point
 * @return {Point2D} return the created point
 */
Point2DList.prototype.newPoint = function(x, y)
{
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }
	
	var point = new Point2D(x, y);
	this.pointsArray.push(point);
	return point;
};

/**
 * Search and return the specific feature of Point2D with the index that has at this.pointArray
 * @param {Number} idx the index of the target point at this.pointArray
 * 
 */
Point2DList.prototype.getPoint = function(idx)
{
	return this.pointsArray[idx];
};

/**
 * Return the length of this.pointArray
 * @return {Number}
 */
Point2DList.prototype.getPointsCount = function()
{
	if (this.pointsArray === undefined)
	{ return 0; }
	
	return this.pointsArray.length;
};

/**
 * This function is used when this feature is a point2DRing.
 * Return the previous index of the given index.
 * @param {Number} idx the target index
 * @param {Number} prevIdx
 */
Point2DList.prototype.getPrevIdx = function(idx)
{
	var pointsCount = this.pointsArray.length;
	var prevIdx;
	
	if (idx === 0)
	{ prevIdx = pointsCount - 1; }
	else
	{ prevIdx = idx - 1; }

	return prevIdx;
};

/**
 * This function is used when this feature is a point2DRing.
 * Return the next index of the given index
 * @param {Number} idx the target index
 * @param {Number} nexIndx
 */
Point2DList.prototype.getNextIdx = function(idx)
{
	var pointsCount = this.pointsArray.length;
	var nextIdx;
	
	if (idx === pointsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	return nextIdx;
};

/**
 * Get the index of the given point
 * @param {Point2D} point
 * @return {Number} idx the index of the target point at this.pointArray
 */
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

/**
 * get the segement with the index of the segment
 * @param {Number} idx the index of start point of segment
 * @param {Segment2D} resultSegment the segement which will store the result segment
 * @return {Segment2D} resultSegment 
 * 
 */
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

/**
 * 
 */
Point2DList.prototype.setIdxInList = function()
{
	var pointsCount = this.pointsArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		this.pointsArray[i].idxInList = i;
	}
};

/**
 * Copy the target Point2dList from this.arrayList
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
 * Calculate the bounding box of this point2DList
 * @param {BoundingRectangle} resultBoundingRectangle the BoundingRectangle which will be calculated
 * @returns {BoundingRectanble} resultPoint
 */
Point2DList.prototype.getBoundingRectangle = function(resultBoundingRectangle) 
{
	var pointsCount = this.getPointsCount();
	if (pointsCount === 0)
	{ return resultBoundingRectangle; }
	
	if (resultBoundingRectangle === undefined)
	{ resultBoundingRectangle = new BoundingRectangle(); }
	
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

/**
 * Calculate and return the point in this.pointArray which is the nearest point of the target point
 * @param point the target point
 * @param resultPoint the nearest point from the target point
 * @returns {Point2D} resultPoint
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
 * Reverse the order of this.pointArray
 */
Point2DList.prototype.reverse = function() 
{
	if (this.pointsArray !== undefined)
	{ this.pointsArray.reverse(); }
};

/**
 * Sort the points in this.pointArray as the distance from thePoint
 * @param {Point2D} thePoint the target point
 * @param resultSortedPointsIndxArray the target pointArray
 * @TODO : need to change the name of this function. So confused.
 * @result resultSortedPointsIdexArray sorted array
 */
Point2DList.prototype.getPointsIdxSortedByDistToPoint = function(thePoint, resultSortedPointsIdxArray)
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

/**
 * this do a dicotomic search of idx in a ordered table.
 * @param objectsArray 
 * @param {Point2D} object the target point
 * @param {Number} startIdx the start index of objectsArray
 * @param {Number} endIdx the end index of objectsArray
 * @returns {Number} result_idx the index of object in objectsArray
 * 
 */
Point2DList.prototype.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
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















































