'use strict';

var Polygon2D_ = function(options) 
{
	// This is a 2D polygon.
	this.point2dList; // the border of this feature
	this.normal; // Polygon2D sense. (normal = 1) -> CCW. (normal = -1) -> CW.
	this.convexPolygonsArray; // tessellation result.
	this.bRect; // boundary rectangle.

	if (options)
	{
		if (options.point2dList)
		{
			this.point2dList = options.point2dList;
		}
	}
};



Polygon2D_.prototype.getEdgeDirection = function(idx)
{
	// the direction is unitary vector.
	var segment = this.point2dList.getSegment(idx);
	var direction = segment.getDirection(undefined);
	return direction;
};


Polygon2D_.prototype.getBoundingRectangle = function(resultBRect)
{
	if (this.point2dList === undefined)
	{ return resultBRect; }
	
	if (!this.bRect) 
	{
		this.bRect = this.point2dList.getBoundingRectangle(resultBRect);
	}
	return this.bRect;
};

Polygon2D_.prototype.calculateNormal = function(resultConcavePointsIdxArray)
{
	// must check if the verticesCount is 3. Then is a convex polygon.
	
	// A & B are vectors.
	// A*B is scalarProduct.
	// A*B = |A|*|B|*cos(alfa)
	var point;
	var crossProd;
	
	if (resultConcavePointsIdxArray === undefined)
	{ resultConcavePointsIdxArray = []; }
	
	this.normal = 0; // unknown sense.
	var pointsCount = this.point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		point = this.point2dList.getPoint(i);
		var prevIdx = getPrevIdx(i, pointsCount);
		
		// get unitari directions of the vertex.
		var startVec = this.getEdgeDirection(prevIdx); // Point2D.
		var endVec = this.getEdgeDirection(i); // Point2D.
		
		// calculate the cross product.
		var crossProd = startVec.crossProduct(endVec, crossProd); // Point2D.
		var scalarProd = startVec.scalarProduct(endVec);
		
		if (crossProd < 0.0) 
		{
			crossProd = -1;
			resultConcavePointsIdxArray.push(i);
		}
		else if (crossProd > 0.0) 
		{
			crossProd = 1;
		}
		else
		{ continue; }
		// calcule by cos.
		// cosAlfa = scalarProd / (strModul * endModul); (but strVecModul = 1 & endVecModul = 1), so:
		var cosAlfa = scalarProd;
		var alfa = Math.acos(cosAlfa);
		this.normal += (crossProd * alfa);
        
	}
	
	if (this.normal > 0 )
	{ this.normal = 1; }
	else
	{ this.normal = -1; }
	
	return resultConcavePointsIdxArray;
};

Polygon2D_.prototype.splitPolygon = function(idx1, idx2, resultSplittedPolygonsArray)
{
	if (resultSplittedPolygonsArray === undefined)
	{ resultSplittedPolygonsArray = []; }
	
	// polygon A. idx1 -> idx2.
	var polygon_A = new Polygon2D_();
	polygon_A.point2dList = new Point2DList_();
	
	// 1rst, put vertex1 & vertex2 in to the polygon_A.
	polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(idx1));
	polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(idx2));
	
	var finished = false;
	var currIdx = idx2;
	var startIdx = idx1;
	var i = 0;
	var totalPointsCount = this.point2dList.getPointsCount();
	while (!finished && i<totalPointsCount)
	{
		var nextIdx = getNextIdx(currIdx, totalPointsCount);
		if (nextIdx === startIdx)
		{
			finished = true;
		}
		else 
		{
			polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(nextIdx));
			currIdx = nextIdx;
		}
		i++;
	}
	
	resultSplittedPolygonsArray.push(polygon_A);
	
	// polygon B. idx2 -> idx1.
	var polygon_B = new Polygon2D_();
	polygon_B.point2dList = new Point2DList_();
	
	// 1rst, put vertex2 & vertex1 in to the polygon_B.
	polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(idx2));
	polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(idx1));
	
	finished = false;
	currIdx = idx1;
	startIdx = idx2;
	i=0;
	while (!finished && i<totalPointsCount)
	{
		var nextIdx = getNextIdx(currIdx, totalPointsCount);
		if (nextIdx === startIdx)
		{
			finished = true;
		}
		else 
		{
			polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(nextIdx));
			currIdx = nextIdx;
		}
		i++;
	}
	
	resultSplittedPolygonsArray.push(polygon_B);
	return resultSplittedPolygonsArray;
};

Polygon2D_.prototype.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
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

Polygon2D_.prototype.getPointsIdxSortedByDistToPoint = function(thePoint, resultSortedPointsIdxArray)
{

	if (resultSortedPointsIdxArray === undefined)
	{ resultSortedPointsIdxArray = []; }
	
	resultSortedPointsIdxArray = this.point2dList.getPointsIdxSortedByDistToPoint(thePoint, resultSortedPointsIdxArray);
	
	return resultSortedPointsIdxArray;
};

Polygon2D_.prototype.intersectionWithSegment = function(segment, error)
{
	if (this.bRect !== undefined)
	{
		// if exist boundary rectangle, check bRect intersection.
		var segmentsBRect = segment.getBoundingRectangle(segmentsBRect);
		if (!this.bRect.intersectsWithRectangle(segmentsBRect))
		{ return false; }
	}
	
	// 1rst check if the segment is coincident with any polygons vertex.
	var mySegment;
	var intersectionType;

	if (error === undefined)
	{ error = 10E-8; }
	var pointsCount = this.point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		mySegment = this.point2dList.getSegment(i, mySegment);
		
		// if segment shares points, then must not cross.
		if (segment.sharesPointsWithSegment(mySegment))
		{
			continue;
		}
		
		var intersectionType = segment.intersectionWithSegment(mySegment, error);
		
		if (intersectionType === Constant_.INTERSECTION_INTERSECT)
		{
			return true;
		}
	}
	
	return false; 
};

Polygon2D_.prototype.setIdxInList = function()
{
	this.point2dList.setIdxInList();
};

Polygon2D_.prototype.tessellate = function(concaveVerticesIndices, convexPolygonsArray)
{
	var concaveVerticesCount = concaveVerticesIndices.length;
	
	if (!convexPolygonsArray) { convexPolygonsArray = []; }

	if (concaveVerticesCount === 0)
	{
		convexPolygonsArray.push(this);
		return convexPolygonsArray;
	}
	
	// now, for any concave vertex, find the closest vertex to split the polygon.
	var find = false;
	var idx_B;
	var i=0;
	var pointsCount = this.point2dList.getPointsCount();
	
	while (!find && i<concaveVerticesCount)
	{
		var idx = concaveVerticesIndices[i];
		var point = this.point2dList.getPoint(idx);
		var resultSortedPointsIdxArray = [];
		
		// get vertices indices sorted by distance to "point".
		this.getPointsIdxSortedByDistToPoint(point, resultSortedPointsIdxArray);
		
		var sortedVerticesCount = resultSortedPointsIdxArray.length;
		var j=0;
		while (!find && j<sortedVerticesCount)
		{
			idx_B = resultSortedPointsIdxArray[j];
			
			// skip adjacent vertices.
			var prevIdx = getPrevIdx(idx, pointsCount);
			var nextIdx = getNextIdx(idx, pointsCount);
			if (prevIdx === idx_B || nextIdx === idx_B)
			{
				j++;
				continue;
			}
			
			// check if is splittable by idx-idx_B.
			var segment = new Segment2D_(this.point2dList.getPoint(idx), this.point2dList.getPoint(idx_B));
			if (this.intersectionWithSegment(segment))
			{
				j++;
				continue;
			}
			
			var resultSplittedPolygons = this.splitPolygon(idx, idx_B);
			
			if (resultSplittedPolygons.length < 2)
			{
				j++;
				continue;
			}
			
			// now, compare splittedPolygon's normals with myNormal.
			var polygon_A = resultSplittedPolygons[0];
			var polygon_B = resultSplittedPolygons[1];
			var concavePoints_A = polygon_A.calculateNormal();
			var concavePoints_B = polygon_B.calculateNormal();
			
			var normal_A = polygon_A.normal;
			var normal_B = polygon_B.normal;
			if (normal_A === this.normal && normal_B === this.normal)
			{
				find = true;
				// polygon_A.
				if (concavePoints_A.length > 0)
				{
					convexPolygonsArray = polygon_A.tessellate(concavePoints_A, convexPolygonsArray);
				}
				else 
				{
					if (convexPolygonsArray === undefined)
					{ convexPolygonsArray = []; }
					
					convexPolygonsArray.push(polygon_A);
				}
				
				// polygon_B.
				if (concavePoints_B.length > 0)
				{
					//TODO : If the tessellation is used later, then please push the result to convexPolygonsArray, not initialized by the result.
					convexPolygonsArray = polygon_B.tessellate(concavePoints_B, convexPolygonsArray);
				}
				else 
				{
					if (convexPolygonsArray === undefined)
					{ convexPolygonsArray = []; }
					
					convexPolygonsArray.push(polygon_B);
				}
			}
			
			j++;
		}
		i++;
	}
	
	return convexPolygonsArray;
};

Polygon2D_.prototype.getRelativePostionOfPoint2DConvexPolygon = function(point2D) 
{ 
	// 0 : no intersection 1 : pointCoincident, 2 : edgeCoincident. 3 : interior
	var thisBRectangle = this.getBoundingRectangle();
	if (!thisBRectangle.intersectsWithPoint2D(point2D)) 
	{
		return 0;
	}
	var errorDist = 10E-16;
	for (var i=0, len=this.point2dList.getPointsCount();i<len;i++) 
	{
		var polygonVertex = this.point2dList.getPoint(i); 
		
		if (polygonVertex.isCoincidentToPoint(point2D, errorDist)) 
		{
			return 1;
		}
	}
	
	for (var i=0, len=this.point2dList.getPointsCount();i<len;i++) 
	{
		var segment = this.point2dList.getSegment(i); 
		
		if (segment.intersectionWithPoint(point2D, errorDist)) 
		{
			return 2;
		}
	}

	var oldSide;
	for (var i=0, len=this.point2dList.getPointsCount();i<len;i++) 
	{
		var segment = this.point2dList.getSegment(i); 
		var line2D = segment.getLine();

		var side = line2D.getRelativeSideOfPoint(point2D, errorDist);
		if (!oldSide) 
		{
			oldSide = side;
		}
		
		if (oldSide !== side) 
		{
			return 0;
		}
	}
	
	// 0 : no intersection 1 : pointCoincident, 2 : edgeCoincident. 3 : interior
	return 3;
};