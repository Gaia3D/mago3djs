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
 * @param {Point2D} point2d the point to insert into list.
 * @param {Number} idx the idx in the array to insert.
 */
Point2DList.prototype.insertPoint = function(point2d, idx)
{
	if (this.pointsArray === undefined)
	{ this.pointsArray = []; }

	if(idx > this.pointsArray.length-1)
	{
		this.pointsArray.push(point2d);
	}
	else{
		this.pointsArray.splice(idx, 0, point2d);
	}
};

/**
 * Create a new feature of Point2D
 * @param {Number} x the x coordi of the point
 * @param {Number} y the y coordi of the point
 * @returns {Point2D} return the created point
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
 * delete Point2D by condition
 * @param {function} condition must return boolean type
 */
Point2DList.prototype.deletePointByCondition = function(condition)
{	
	this.pointsArray = this.findPointArray(condition);;
};

/**
 * find Point2D by condition
 * @param {function} condition must return boolean type
 * @return {Point2DList} return the find point
 */
Point2DList.prototype.findPointArray = function(condition)
{
	var that = this;
	var arr = that.pointsArray.filter(function(point)
	{
		return condition.call(that, point);
	});

	return arr;
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
 * @returns {Number}
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
 * @returns {Number} idx the index of the target point at this.pointArray
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
 * @returns {Segment2D} resultSegment 
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

/**
 * This function expands a point2dString or point2dRing.
 * @param {Array} originalPoints2dArray The points2d array that want to expand.
 * @param {Array} resultPoints2dArray The result points2d array.
 * @param {Number} leftExpandDist The expansion distance in the left side.
 * @param {Number} rightExpandDist The expansion distance in the right side.
 * @param {Boolean} bLoop If true, the points2dArray is a ring, else is a string.
 * 
 */
Point2DList.getExpandedPoints = function(originalPoints2dArray, resultPoints2dArray, leftExpandDist, rightExpandDist, bLoop) 
{
	// Function used by basicFactory to make roof profile, for example.
	
	//                                                                        
	//                                                                        
	//                                                           4            
	//                                                         /    \                        
	//                                                       /        \                      
	//                                                     /            \               
	//                                                   /                \            
	//                  1               ==>            /         1          \                       
	//                /   \                          /         /   \          \             
	//              /       \                      /         /       \          \           
	//            /           \                  5         /           \          3
	//          /               \                \       /               \      /
	//        /                   \                \   /                   \  /
	//      2                       0                0                       2
	//
	
	if (originalPoints2dArray === undefined)
	{ return; }

	if (resultPoints2dArray === undefined)
	{ resultPoints2dArray = []; }
	
	var leftSidePointsArray = [];
	var rightSidePointsArray = [];
	
	var pointsCount = originalPoints2dArray.length;
	var prevSegment = new Segment2D(undefined, undefined);
	var currSegment = new Segment2D(undefined, undefined);

	var currIdx;
	var nextIdx;
	var prevIdx;
	
	var currPoint;
	var nextPoint;
	var prevPoint;
	
	var currLine;
	var prevLine;
	
	var currLeftLine;
	var prevLeftLine;
	
	var currRightLine;
	var prevRightLine;
	
	var perpendicularLeftLine;
	
	if (bLoop === undefined)
	{ bLoop = false; }
	
	if (bLoop)
	{
		for (var i=0; i<pointsCount; i++)
		{
			// TODO:
		}
	}
	else 
	{
		for (var i=0; i<pointsCount; i++)
		{
			currPoint = originalPoints2dArray[i];
			currIdx = i;
			
			if (currIdx === 0)
			{
				// In this case, translate perpendicularly the original point to left & right side.***
				nextIdx = GeometryUtils.getNextIdx(currIdx, pointsCount);
				nextPoint = originalPoints2dArray[nextIdx];

				currSegment.setPoints(currPoint, nextPoint);
				currLine = currSegment.getLine(currLine);
				perpendicularLeftLine = currLine.getPerpendicularLeft(); // Must be perpendicular.***
				
				// Left side point.***
				var leftPoint = new Point2D(currPoint.x + perpendicularLeftLine.direction.x*leftExpandDist, currPoint.y + perpendicularLeftLine.direction.y*leftExpandDist);
				leftSidePointsArray.push(leftPoint);
				
				// Right side point.***
				var rightPoint = new Point2D(currPoint.x - perpendicularLeftLine.direction.x*rightExpandDist, currPoint.y - perpendicularLeftLine.direction.y*rightExpandDist);
				rightSidePointsArray.push(rightPoint);
			}
			else if (currIdx === pointsCount-1)
			{
				// In this case, translate perpendicularly the original point to left & right side.***
				prevIdx = GeometryUtils.getPrevIdx(currIdx, pointsCount);
				prevPoint = originalPoints2dArray[prevIdx];
				
				currSegment.setPoints(prevPoint, currPoint);
				currLine = currSegment.getLine(currLine);
				perpendicularLeftLine = currLine.getPerpendicularLeft(); // Must be perpendicular.***
				
				// Left side point.***
				var leftPoint = new Point2D(currPoint.x + perpendicularLeftLine.direction.x*leftExpandDist, currPoint.y + perpendicularLeftLine.direction.y*leftExpandDist);
				leftSidePointsArray.push(leftPoint);
				
				// Right side point.***
				var rightPoint = new Point2D(currPoint.x - perpendicularLeftLine.direction.x*rightExpandDist, currPoint.y - perpendicularLeftLine.direction.y*rightExpandDist);
				rightSidePointsArray.push(rightPoint);
			}
			else 
			{
				nextIdx = GeometryUtils.getNextIdx(currIdx, pointsCount);
				prevIdx = GeometryUtils.getPrevIdx(currIdx, pointsCount);
				
				nextPoint = originalPoints2dArray[nextIdx];
				prevPoint = originalPoints2dArray[prevIdx];
				
				prevSegment.setPoints(prevPoint, currPoint);
				currSegment.setPoints(currPoint, nextPoint);
				
				prevLine = prevSegment.getLine(prevLine);
				currLine = currSegment.getLine(currLine);
				
				// Left side point.***
				prevLeftLine = prevLine.getParallelLeft(leftExpandDist);
				currLeftLine = currLine.getParallelLeft(leftExpandDist);
				
				var leftPoint = prevLeftLine.intersectionWithLine(currLeftLine, undefined);
				leftSidePointsArray.push(leftPoint);
				
				// Right side point.***
				prevRightLine = prevLine.getParallelRight(rightExpandDist);
				currRightLine = currLine.getParallelRight(rightExpandDist);
				
				var rightPoint = prevRightLine.intersectionWithLine(currRightLine, undefined);
				rightSidePointsArray.push(rightPoint);
			}
			
		}
		
		// Now, reverse leftSidePointsArray.***
		leftSidePointsArray.reverse();
		resultPoints2dArray = leftSidePointsArray.concat(rightSidePointsArray);
	}
	
	return resultPoints2dArray;
};















































