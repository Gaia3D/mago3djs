'use strict';

var worker = self;

worker.onmessage = function (e) 
{
    // workerPolygon2DTessellate.***
    var cartesiansArray = e.data.positions;

    // now, create point2dArray.***
    var point2dArray = [];
    var pointsCount = cartesiansArray.length / 2.0;
    var point2d;
    var x, y;
    for(var i=0; i<pointsCount; i++)
    {
        x = cartesiansArray[i * 2];
        y = cartesiansArray[i *2 + 1];
        point2d = new Point2D_(x, y);
        point2dArray.push(point2d);
    }

    var polygon2d = new Polygon2D_({point2dArray : point2dArray});
    var concaveVerticesIndices = polygon2d.calculateNormal(undefined);
    
    // Now tessellate.***
    var convexPolygonsArray = [];
    convexPolygonsArray = polygon2d.tessellate(concaveVerticesIndices, convexPolygonsArray);

    // now, make convexPolygonsIndicesArray.***
    var convexPolygonIndicesArray = [];
    
    polygon2d.setIdxInList();
    var convexPolygonsCount = convexPolygonsArray.length;
    for(var i=0; i<convexPolygonsCount; i++)
    {
        var convexPolygonIndices = [];
        var convexPolygon = convexPolygonsArray[i];
        var pointsCount = convexPolygon.getPointsCount();
        for(var j=0; j<pointsCount; j++)
        {
            var point2d = convexPolygon.getPoint(j);
            convexPolygonIndices.push(point2d.idxInList);
        }

        // finally put the indices into result "convexPolygonIndicesArray".***
        convexPolygonIndicesArray.push(convexPolygonIndices);
    }

    worker.postMessage({result : 
        {
            convexPolygonIndicesArray : convexPolygonIndicesArray,
            concaveVerticesIndices : concaveVerticesIndices
        }
    });
}

var Constant = {};
Constant.INTERSECTION_OUTSIDE = 0;
Constant.INTERSECTION_INTERSECT= 1;
Constant.INTERSECTION_INSIDE = 2;
Constant.INTERSECTION_POINT_A = 3;
Constant.INTERSECTION_POINT_B = 4;

//*****************************************************************************************************************************
// Point2D_ ***  Point2D_ ***  Point2D_ ***  Point2D_ ***  Point2D_ ***  Point2D_ ***  Point2D_ ***  Point2D_ ***  Point2D_ *** 
var Point2D_ = function(x, y) 
{
	if (x !== undefined) { this.x = x; }
	else { this.x = 0.0; }
	if (y !== undefined) { this.y = y; }
	else { this.y = 0.0; }

	this.ownerVertex3d; // Aux var. This will be used for this : this Point2D is the projected ownerVertex3d into 2D
	
	/**associated this property will be used to save topologic information */
	this.associated;
};

Point2D_.prototype.set = function(x, y) 
{
	this.x = x;
	this.y = y;
};

Point2D_.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	if (targetPoint === undefined)
	{ return undefined; }
	
	if (!resultVector)
	{ resultVector = new Point2D_(); }
	
	resultVector.set(targetPoint.x - this.x, targetPoint.y - this.y);
	
	return resultVector;
};

Point2D_.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y;
};

Point2D_.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

Point2D_.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
};

Point2D_.prototype.crossProduct = function(point) 
{
	return this.x * point.y - point.x * this.y;
};

Point2D_.prototype.scalarProduct = function(point) 
{
	var scalarProd = this.x*point.x + this.y*point.y;
	return scalarProd;
};

Point2D_.prototype.squareDistToPoint = function(point) 
{
	if(!point) return;
	var dx = this.x - point.x;
	var dy = this.y - point.y;

	return dx*dx + dy*dy;
};

Point2D_.prototype.distToPoint = function(point) 
{
	return Math.sqrt(this.squareDistToPoint(point));
};

Point2D_.prototype.angleRadToVector = function(vector) 
{
	if (vector === undefined)
	{ return undefined; }
	
	//
	//var scalarProd = this.scalarProduct(vector);
	var myModul = this.getModul();
	var vecModul = vector.getModul();
	
	// calcule by cos.
	//var cosAlfa = scalarProd / (myModul * vecModul); 
	//var angRad = Math.acos(cosAlfa);
	//var angDeg = alfa * 180.0/Math.PI;
	//------------------------------------------------------
	var error = 10E-10;
	if (myModul < error || vecModul < error)
	{ return undefined; }
	
	return Math.acos(this.scalarProduct(vector) / (myModul * vecModul));
};

function getPrevIdx (idx, pointsCount)
{
	var prevIdx;
	
	if (idx === 0)
	{ prevIdx = pointsCount - 1; }
	else
	{ prevIdx = idx - 1; }

	return prevIdx;
};

function getNextIdx (idx, pointsCount)
{
	var nextIdx;
	
	if (idx === pointsCount - 1)
	{ nextIdx = 0; }
	else
	{ nextIdx = idx + 1; }

	return nextIdx;
};

//*****************************************************************************************************************************
// BoundingRectangle.*** BoundingRectangle.*** BoundingRectangle.*** BoundingRectangle.*** BoundingRectangle.*** BoundingRectangle.***
var BoundingRectangle_ = function(x, y) 
{
	this.minX = Number.MAX_VALUE;
	this.maxX = Number.MIN_VALUE;
	this.minY = Number.MAX_VALUE;
	this.maxY = Number.MIN_VALUE;
};

//*****************************************************************************************************************************
// Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.*** Line2D.***
var Line2D_ = function() 
{
	// (x,y) = (x0,y0) + lambda * (u, v);
	this.point = new Point2D_();
	this.direction = new Point2D_();
};

Line2D_.prototype.setPointAndDir = function(px, py, dx, dy) 
{
	this.point.set(px, py);
	this.direction.set(dx, dy);
	this.direction.unitary();
};

Line2D_.prototype.isParallelToLine = function(line) 
{
	if (line === undefined)
	{ return false; }
	
	var zero = 10E-10;
	
	// Method 1.***
	var angRad = this.direction.angleRadToVector(line.direction);
	// if angle is zero or 180 degree, then this is parallel to "line".
	if (angRad < zero || Math.abs(angRad - Math.PI) < zero)
	{ return true; }
	
/*
	// Method 2.***
	// Another way is using the dot product.***
	var dotProd = this.direction.scalarProduct(line.direction);
	if (Math.abs(dotProd) < zero || Math.abs(dotProd - 1.0) < zero)
	{ return true; }
	*/
	return false;
};

Line2D_.prototype.intersectionWithLine = function(line, resultIntersectPoint) 
{
	if (line === undefined)
	{ return undefined; }
	
	// 1rst, check that this is not parallel to "line".
	if (this.isParallelToLine(line))
	{ return undefined; }
	
	// now, check if this or "line" are vertical or horizontal.
	var intersectX;
	var intersectY;
	
	var zero = 10E-10;
	if (Math.abs(this.direction.x) < zero)
	{
		// this is a vertical line.
		var slope = line.direction.y / line.direction.x;
		var b = line.point.y - slope * line.point.x;
		
		intersectX = this.point.x;
		intersectY = slope * this.point.x + b;
	}
	else if (Math.abs(this.direction.y) < zero)
	{
		// this is a horizontal line.
		// must check if the "line" is vertical.
		if (Math.abs(line.direction.x) < zero)
		{
			// "line" is vertical.
			intersectX = line.point.x;
			intersectY = this.point.y;
		}
		else 
		{
			var slope = line.direction.y / line.direction.x;
			var b = line.point.y - slope * line.point.x;
			
			intersectX = (this.point.y - b)/slope;
			intersectY = this.point.y;
		}	
	}
	else 
	{
		// this is oblique.
		if (Math.abs(line.direction.x) < zero)
		{
			// "line" is vertical.
			var mySlope = this.direction.y / this.direction.x;
			var myB = this.point.y - mySlope * this.point.x;
			intersectX = line.point.x;
			intersectY = intersectX * mySlope + myB;
		}
		else 
		{
			var mySlope = this.direction.y / this.direction.x;
			var myB = this.point.y - mySlope * this.point.x;
			
			var slope = line.direction.y / line.direction.x;
			var b = line.point.y - slope * line.point.x;
			
			intersectX = (myB - b)/ (slope - mySlope);
			intersectY = slope * intersectX + b;
		}
	}
	
	if (resultIntersectPoint === undefined)
	{ resultIntersectPoint = new Point2D_(); }
	
	resultIntersectPoint.set(intersectX, intersectY);
	return resultIntersectPoint;
};

//*****************************************************************************************************************************
// Segment2D_ ***Segment2D_ ***Segment2D_ ***Segment2D_ ***Segment2D_ ***Segment2D_ ***Segment2D_ ***Segment2D_ ***Segment2D_ ***

var Segment2D_ = function(strPoint2D, endPoint2D) 
{
	this.startPoint2d;
	this.endPoint2d;

    this.setPoints(strPoint2D, endPoint2D);
};

Segment2D_.prototype.setPoints = function(strPoint2D, endPoint2D)
{
	if (strPoint2D !== undefined)
	{
		this.startPoint2d = strPoint2D; 
	}
	if (endPoint2D !== undefined)
	{ 
		this.endPoint2d = endPoint2D;
	}
};

Segment2D_.prototype.getDirection = function(result)
{
	if (result === undefined)
	{
		result = new Point2D_();
	}
	
	result = this.getVector(result);
	result.unitary();
	
	return result;
};

Segment2D_.prototype.getVector = function(result)
{
	if (this.startPoint2d === undefined || this.endPoint2d === undefined)
	{
		return undefined;
	}
	
	if (result === undefined)
	{
		result = new Point2D_();
	}
	
	result = this.startPoint2d.getVectorToPoint(this.endPoint2d, result);
	return result;
};

Segment2D_.prototype.getLine = function(result)
{
	if (result === undefined)
	{
		result = new Line2D_();
	}
	// unitary direction.
	var dir = this.getDirection();
	var strPoint = this.startPoint2d;
	result.setPointAndDir(strPoint.x, strPoint.y, dir.x, dir.y);
	return result;
};

Segment2D_.prototype.getSquaredLength = function()
{
	return this.startPoint2d.squareDistToPoint(this.endPoint2d);
};

 Segment2D_.prototype.getLength = function()
{
	return Math.sqrt(this.getSquaredLength());
};

Segment2D_.prototype.intersectionWithPointByDistances = function(point, error)
{
	if (point === undefined)
	{
		return undefined;
	}
	
	if (error === undefined)
	{
		error = 10E-8;
	}
	
	// here no check line-point coincidance.
	// now, check if is inside of the segment or if is coincident with any vertex of segment.
	var distA = this.startPoint2d.distToPoint(point);
	var distB = this.endPoint2d.distToPoint(point);
	var distTotal = this.getLength();
	
	if (distA < error)
	{
		return Constant.INTERSECTION_POINT_A;
	}
	
	if (distB < error)
	{
		return Constant.INTERSECTION_POINT_B;
	}
	
	if (distA> distTotal || distB> distTotal)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	if (Math.abs(distA + distB - distTotal) < error)
	{
		return Constant.INTERSECTION_INSIDE;
	}
};

Segment2D_.prototype.intersectionWithSegment = function(segment, error, resultIntersectedPoint2d)
{
	if (segment === undefined)
	{
		return undefined;
	}
	
	if (error === undefined)
	{
		error = 10E-8;
	}
	
	var lineA = this.getLine();
	var lineB = segment.getLine();
	var intersectionPoint = lineA.intersectionWithLine(lineB);
	
	// 두 선분이 평행한 경우
	if (intersectionPoint === undefined)
	{
		return undefined;
	}
	
	var intersectionTypeA = this.intersectionWithPointByDistances(intersectionPoint, error);
	var intersectionTypeB = segment.intersectionWithPointByDistances(intersectionPoint, error);
	//TODO : change the logic. The return value of intersectionWithPointByDistance has four enum type
	//But the value really used is only one or two. 
	if (intersectionTypeA === Constant.INTERSECTION_OUTSIDE)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	if (intersectionTypeB === Constant.INTERSECTION_OUTSIDE)
	{
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	if(resultIntersectedPoint2d)
	resultIntersectedPoint2d.set(intersectionPoint.x, intersectionPoint.y);

	return Constant.INTERSECTION_INTERSECT;
};

Segment2D_.prototype.getBoundingRectangle = function(result)
{
	if (result === undefined)
	{
		result = new BoundingRectangle();
	}
	
	result.setInit(this.startPoint2d);
	result.addPoint(this.endPoint2d);
	
	return result;
};

Segment2D_.prototype.hasPoint = function(point)
{
	if (point === undefined)
	{
		return false;
	}
	
	if (point === this.startPoint2d || point === this.endPoint2d)
	{
		return true;
	}
	
	return false;
};

Segment2D_.prototype.sharesPointsWithSegment = function(segment)
{
	if (segment === undefined)
	{
		return false;
	}
	
	if (this.hasPoint(segment.startPoint2d) || this.hasPoint(segment.endPoint2d))
	{
		return true;
	}
	
	return false;
};


//*****************************************************************************************************************************
// Polygon2D_ *** Polygon2D_ *** Polygon2D_ *** Polygon2D_ *** Polygon2D_ *** Polygon2D_ *** Polygon2D_ *** Polygon2D_ *** Polygon2D_ ***
var Polygon2D_ = function(options) 
{
	// This is a 2D polygon.
	this.point2dArray; // the border of this feature
	this.normal; // Polygon2D sense. (normal = 1) -> CCW. (normal = -1) -> CW.
	this.convexPolygonsArray; // tessellation result.
	this.bRect; // boundary rectangle.

    if(options)
    {
        if(options.point2dArray)
        {
            this.point2dArray = options.point2dArray;
        }
    }
};

Polygon2D_.prototype.getSegment = function(idx, resultSegment)
{
    var pointsCount = this.point2dArray.length;
    var nextIdx = getNextIdx(idx, pointsCount);
	var currPoint = this.point2dArray[idx];
	var nextPoint = this.point2dArray[nextIdx];
	
	if (resultSegment === undefined)
	{ resultSegment = new Segment2D_(currPoint, nextPoint); }
	else 
	{
		resultSegment.setPoints(currPoint, nextPoint);
	}

	return resultSegment;
};



Polygon2D_.prototype.getEdgeDirection = function(idx)
{
	// the direction is unitary vector.
	var segment = this.getSegment(idx);
	var direction = segment.getDirection(undefined);
	return direction;
};

Polygon2D_.prototype.getPoint = function(idx)
{
    return this.point2dArray[idx];
};

Polygon2D_.prototype.getPointsCount = function()
{
    return this.point2dArray.length;
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
	var pointsCount = this.point2dArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		point = this.getPoint(i);
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
	//polygon_A.point2dList = new Point2DList();
	polygon_A.point2dArray = [];
	
	// 1rst, put vertex1 & vertex2 in to the polygon_A.
	polygon_A.point2dArray.push(this.getPoint(idx1));
	polygon_A.point2dArray.push(this.getPoint(idx2));
	
	var finished = false;
	var currIdx = idx2;
	var startIdx = idx1;
	var i = 0;
	var totalPointsCount = this.getPointsCount();
	while (!finished && i<totalPointsCount)
	{
		var nextIdx = getNextIdx(currIdx, totalPointsCount);
		if (nextIdx === startIdx)
		{
			finished = true;
		}
		else 
		{
			polygon_A.point2dArray.push(this.getPoint(nextIdx));
			currIdx = nextIdx;
		}
		i++;
	}
	
	resultSplittedPolygonsArray.push(polygon_A);
	
	// polygon B. idx2 -> idx1.
	var polygon_B = new Polygon2D_();
	//polygon_B.point2dList = new Point2DList();
	polygon_B.point2dArray = [];
	
	// 1rst, put vertex2 & vertex1 in to the polygon_B.
	polygon_B.point2dArray.push(this.getPoint(idx2));
	polygon_B.point2dArray.push(this.getPoint(idx1));
	
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
			polygon_B.point2dArray.push(this.getPoint(nextIdx));
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
	if (this.point2dArray === undefined)
	{ return resultSortedPointsIdxArray; }
	
	// Static function.
	// Sorting minDist to maxDist.
	if (resultSortedPointsIdxArray === undefined)
	{ resultSortedPointsIdxArray = []; }
	
	var point2dArray = this.point2dArray;
	
	var objectAux;
	var objectsAuxArray = [];
	var point;
	var squaredDist;
	var startIdx, endIdx, insertIdx;
	var pointsCount = point2dArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		point = point2dArray[i];
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
	var pointsCount = this.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		mySegment = this.getSegment(i, mySegment);
		
		// if segment shares points, then must not cross.
		if (segment.sharesPointsWithSegment(mySegment))
		{
			continue;
		}
		
		var intersectionType = segment.intersectionWithSegment(mySegment, error);
		
		if (intersectionType === Constant.INTERSECTION_INTERSECT)
		{
			return true;
		}
	}
	
	return false; 
};

Polygon2D_.prototype.setIdxInList = function()
{
	var pointsCount = this.point2dArray.length;
	for (var i=0; i<pointsCount; i++)
	{
		this.point2dArray[i].idxInList = i;
	}
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
    var pointsCount = this.point2dArray.length;
	
	while (!find && i<concaveVerticesCount)
	{
		var idx = concaveVerticesIndices[i];
		var point = this.getPoint(idx);
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
			var segment = new Segment2D_(this.getPoint(idx), this.getPoint(idx_B));
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