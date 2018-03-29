'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Polygon
 */
var Polygon = function() 
{
	if (!(this instanceof Polygon)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.point2dList;
	this.normal; // polygon sense. (normal = 1) -> CCW. (normal = -1) -> CW.***
};

Polygon.prototype.deleteObjects = function()
{
	if(this.point2dList !== undefined)
	{
		this.point2dList.deleteObjects();
		this.point2dList = undefined;
	}
	
	this.normal = undefined;
};

Polygon.prototype.getEdgeDirection = function(idx)
{
	// the direction is unitary vector.***
	var segment = this.point2dList.getSegment(idx);
	var direction = segment.getDirection(direction);
	return direction;
};

Polygon.prototype.getEdgeVector = function(idx)
{
	var segment = this.point2dList.getSegment(idx);
	var vector = segment.getVector(vector);
	return vector;
};

Polygon.prototype.calculateNormal = function(resultConcavePointsIdxArray)
{
	// this is a false 2d polygon.***
	
	// must check if the verticesCount is 3. Then is a convex polygon.***
	
	// A & B are vectors.
	// A*B is scalarProduct.
	// A*B = |A|*|B|*cos(alfa)
	var point;
	var crossProd;
	
	if(resultConcavePointsIdxArray === undefined)
		resultConcavePointsIdxArray = [];
	
	//var candidate_1 = {}; // normal candidate 1.***
	//var candidate_2 = {}; // normal candidate 2.***
	
	this.normal = 0; // unknown sense.***
	var pointsCount = this.point2dList.getPointsCount();
	for(var i=0; i<pointsCount; i++)
	{
		point = this.point2dList.getPoint(i);
		var prevIdx = this.point2dList.getPrevIdx(i);
		
		// get unitari directions of the vertex.***
		var startVec = this.getEdgeDirection(prevIdx); // Point3D.
		var endVec = this.getEdgeDirection(i); // Point3D.
		
		// calculate the cross product.***
		var crossProd = startVec.crossProduct(endVec, crossProd); // Point3D.
		var scalarProd = startVec.scalarProduct(endVec);
		
		if(crossProd < 0.0) 
		{
			resultConcavePointsIdxArray.push(i);
		}
		// calcule by cos.***
		// cosAlfa = scalarProd / (strModul * endModul); (but strVecModul = 1 & endVecModul = 1), so:
		var cosAlfa = scalarProd;
		var alfa = Math.acos(cosAlfa);
		//var angDeg = alfa * 180.0/Math.PI;

		this.normal += (crossProd * alfa);
	}
	
	if(this.normal > 0 )
		this.normal = 1;
	else
		this.normal = -1;
	
	return resultConcavePointsIdxArray;
};

Polygon.prototype.tessellate = function(resultConvexPolygons)
{
	// 1rst, must find concave vertices.***
	var concaveVerticesIndices = this.calculateNormal();
	var concaveVerticesCount = concaveVerticesIndices.length;
	
	// now, for any concave vertex, find the closest vertex to split the polygon.***
	var find = false;
	var idx_B;
	var i=0;
	
	while(!find && i<concaveVerticesCount)
	{
		var idx = concaveVerticesIndices[i];
		var point = this.point2dList.getPoint(idx);
		var resultSortedPointsIdxArray = [];
		
		// get vertices indices sorted by distance to "point".***
		this.getVerticesIdxSortedByDistToVertex(point, this.point2dList.pointsArray, resultSortedPointsIdxArray);
		
		var finished = false;
		var sortedVerticesCount = resultSortedPointsIdxArray.length;
		var j=0;
		while(!finished && j<sortedVerticesCount)
		{
			idx_B = resultSortedPointsIdxArray[j];
			
			// skip adjacent vertices.***
			if(this.point2dList.getPrevIdx(idx) === idx_B || this.point2dList.getNextIdx(idx) === idx_B)
			{
				j++;
				continue;
			}
			
			// check if is splittable by idx-idx_B.***
			var segment = new Segment2D(this.point2dList.getPoint(idx), this.point2dList.getPoint(idx_B));
			
			
			var resultSplittedPolygons = this.splitPolygon(idx, idx_B);
			
			if(resultSplittedPolygons.length < 2)
				continue;
			
			// now, compare splittedPolygon's normals with myNormal.***
			var polygon_A = resultSplittedPolygons[0];
			var polygon_B = resultSplittedPolygons[1];
			var concaveVtx_A = polygon_A.calculateNormal();
			var concaveVtx_B = polygon_B.calculateNormal();
			
			var normal_A = polygon_A.normal;
			var normal_B = polygon_A.normal;
			
			
			j++;
		}
		i++;
	}
};

Polygon.prototype.intersectionWithVtxSegment = function(vtxSeg)
{
	// "vtxSeg" cut a polygons edge.***
	// "vtxSeg" coincident with a polygons vertex.***
	// 1rst check if the vtxSeg is coincident with any polygons vertex.***
	
};

Polygon.prototype.splitPolygon = function(idx1, idx2, resultSplittedPolygonsArray)
{
	if(resultSplittedPolygonsArray === undefined)
		resultSplittedPolygonsArray = [];
	
	// polygon A. idx1 -> idx2.***
	var polygon_A = new Polygon();
	polygon_A.point2dList = new Point2DList();
	polygon_A.point2dList.pointsArray = [];
	
	// 1rst, put vertex1 & vertex2 in to the polygon_A.***
	polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(idx1));
	polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(idx2));
	
	var finished = false;
	var currIdx = idx2;
	var startIdx = idx1;
	var i=0;
	var totalPointsCount = this.point2dList.getPointsCount();
	while(!finished && i<totalPointsCount)
	{
		var nextIdx = this.point2dList.getNextIdx(currIdx);
		if(nextIdx === startIdx)
		{
			finished = true;
		}
		else{
			polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(nextIdx));
			currIdx = nextIdx;
		}
		i++;
	}
	
	resultSplittedPolygonsArray.push(polygon_A);
	
	// polygon B. idx2 -> idx1.***
	var polygon_B = new Polygon();
	polygon_B.point2dList = new Point2DList();
	polygon_B.point2dList.pointsArray = [];
	
	// 1rst, put vertex2 & vertex1 in to the polygon_B.***
	polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(idx2));
	polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(idx1));
	
	finished = false;
	currIdx = idx1;
	startIdx = idx2;
	i=0;
	while(!finished && i<totalPointsCount)
	{
		var nextIdx = this.point2dList.getNextIdx(currIdx);
		if(nextIdx === startIdx)
		{
			finished = true;
		}
		else{
			polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(nextIdx));
			currIdx = nextIdx;
		}
		i++;
	}
	
	resultSplittedPolygonsArray.push(polygon_B);
	return resultSplittedPolygonsArray;
};

Polygon.prototype.getVerticesIdxSortedByDistToVertex = function(thePoint, pointsArray, resultSortedPointsIdxArray)
{
	// Static function.***
	// Sorting minDist to maxDist.***
	if(resultSortedPointsIdxArray === undefined)
		resultSortedPointsIdxArray = [];
	
	var objectAux;
	var objectsAuxArray = [];
	var point;
	var squaredDist;
	var startIdx, endIdx, insertIdx;
	var pointsCount = pointsArray.length;
	for(var i=0; i<pointsCount; i++)
	{
		point = pointsArray[i];
		if(point === thePoint)
			continue;
		
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
	for(var i=0; i<objectsCount; i++)
	{
		resultSortedPointsIdxArray.push(objectsAuxArray[i].pointIdx);
	}
	
	return resultSortedPointsIdxArray;
};

/**
 * 어떤 일을 하고 있습니까?
 * @returns result_idx
 */
Polygon.prototype.getIndexToInsertBySquaredDist = function(objectsArray, object, startIdx, endIdx) 
{
	// this do a dicotomic search of idx in a ordered table.
	// 1rst, check the range.
	
	var range = endIdx - startIdx;
	
	if(range <= 0)
		return 0;
	
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

Polygon.prototype.isPolygonSplittableByVtxSegment = function(vertexSegment)
{
	
};

Polygon.prototype.getTrianglesConvexPolygon = function(resultTrianglesList)
{
	// in this case, consider the polygon is convex.***
	if(resultTrianglesList === undefined)
		resultTrianglesList = new TrianglesList();

	var pointsCount = this.point2dList.getPointsCount();
	if(pointsCount <3)
		return resultTrianglesList;
	
	var triangle;
	for(var i=1; i<pointsCount-1; i++)
	{
		triangle = resultTrianglesList.newTriangle();
		triangle.vtxIdx0 = 0;
		triangle.vtxIdx1 = i;
		triangle.vtxIdx2 = i+1;
	}
	
	return resultTrianglesList;
};

Polygon.prototype.getVbo = function(resultVbo)
{
	// return positions, normals and indices.***
	if(resultVbo === undefined)
		resultVbo = new VBOVertexIdxCacheKey();
	
	// 1rst, obtain pos, nor.***
	var posArray = [];
	var norArray = [];
	var point;
	var normal;
	if(this.normal > 0)
		normal = 1;
	else
		normal = -1;
		
	var pointsCount = this.point2dList.getPointsCount();
	for(var i=0; i<pointsCount; i++)
	{
		point = this.point2dList.getPoint(i);
		
		posArray.push(point.x);
		posArray.push(point.y);
		posArray.push(0.0);
		
		norArray.push(0);
		norArray.push(0);
		norArray.push(normal*255);
	}
	
	resultVbo.posVboDataArray = Float32Array.from(posArray);
	resultVbo.norVboDataArray = Int8Array.from(norArray);
	
	// now calculate triangles indices.***
	var trianglesList = new TrianglesList();
	trianglesList = this.getTrianglesConvexPolygon(trianglesList);
	
	trianglesList.getFaceDataArray(resultVbo);

	return resultVbo;
};
























