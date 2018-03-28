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

	this.verticesArray;
	this.normal;
};

Polygon.prototype.deleteObjects = function()
{
	if(this.verticesArray !== undefined)
	{
		var verticesCount = this.verticesArray.length;
		for(var i=0; i<verticesCount; i++)
		{
			this.verticesArray[i].deleteObjects();
			this.verticesArray[i] = undefined;
		}
		this.verticesArray = undefined;
	}
	
	if(this.normal !== undefined)
	{
		this.normal.deleteObjects();
		this.normal = undefined;
	}
};

Polygon.prototype.getPrevIdx = function(idx)
{
	var verticesCount = this.verticesArray.length;
	var prevIdx;
	
	if(idx === 0)
		prevIdx = verticesCount - 1;
	else
		prevIdx = idx - 1;

	return prevIdx;
};

Polygon.prototype.getNextIdx = function(idx)
{
	var verticesCount = this.verticesArray.length;
	var nextIdx;
	
	if(idx === verticesCount - 1)
		nextIdx = 0;
	else
		nextIdx = idx + 1;

	return nextIdx;
};

Polygon.prototype.getIdxOfVertex = function(vertex)
{
	var verticesCount = this.verticesArray.length;
	var i=0;
	var idx = -1;
	var found = false;
	while(!found && i<verticesCount)
	{
		if(this.verticesArray[i] === vertex)
		{
			found = true;
			idx = i;
		}
		i++;
	}
	
	return idx;
};

Polygon.prototype.getVtxSegment = function(idx, resultVtxSegment)
{
	var currVertex = this.verticesArray[idx];
	var nextIdx = this.getNextIdx(idx);
	var nextVertex = this.verticesArray[nextIdx];
	
	if(resultVtxSegment === undefined)
		resultVtxSegment = new VtxSegment(currVertex, nextVertex);
	else{
		resultVtxSegment.setVertices(currVertex, nextVertex);
	}

	return resultVtxSegment;
};

Polygon.prototype.getEdgeDirection = function(idx)
{
	// the direction is unitary vector.***
	var vtxSegment = this.getVtxSegment(idx);
	var direction = vtxSegment.getDirection(direction);
	return direction;
};

Polygon.prototype.getEdgeVector = function(idx)
{
	var vtxSegment = this.getVtxSegment(idx);
	var vector = vtxSegment.getVector(vector);
	return vector;
};

Polygon.prototype.getCrossProductOnVertex = function(currIdx)
{
	var crossProd; // Point3D.
	var prevIdx = this.getPrevIdx(currIdx);
	var startVec = this.getEdgeDirection(prevIdx); // Point3D.
	var endVec = this.getEdgeDirection(currIdx); // Point3D.
	
	crossProd = startVec.crossProduct(endVec, crossProd); // Point3D.
	
	return crossProd; // Point3D.
};

Polygon.prototype.calculateNormal = function(resultConcaveVertexIdxArray)
{
	// this is a false 2d polygon.***
	
	// must check if the verticesCount is 3. Then is a convex polygon.***
	
	// A & B are vectors.
	// A*B is scalarProduct.
	// A*B = |A|*|B|*cos(alfa)
	var vertex;
	var crossProd;
	if(this.normal === undefined)
		this.normal = new Point3D();
	
	if(resultConcaveVertexIdxArray === undefined)
		resultConcaveVertexIdxArray = [];
	
	//var candidate_1 = {}; // normal candidate 1.***
	//var candidate_2 = {}; // normal candidate 2.***
	
	this.normal.set(0.0, 0.0, 0.0);
	var verticesCount = this.verticesArray.length;
	for(var i=0; i<verticesCount; i++)
	{
		vertex = this.verticesArray[i];
		var prevIdx = this.getPrevIdx(i);
		
		// get unitari directions of the vertex.***
		var startVec = this.getEdgeDirection(prevIdx); // Point3D.
		var endVec = this.getEdgeDirection(i); // Point3D.
		
		// calculate the cross product.***
		var crossProd = startVec.crossProduct(endVec, crossProd); // Point3D.
		var scalarProd = startVec.scalarProduct(endVec);
		
		if(crossProd.z < 0.0) // provisionally.***
		{
			resultConcaveVertexIdxArray.push(i);
		}
		// calcule by cos.***
		// cosAlfa = scalarProd / (strModul * endModul); (but strVecModul = 1 & endVecModul = 1), so:
		var cosAlfa = scalarProd;
		var alfa = Math.acos(cosAlfa);
		//var angDeg = alfa * 180.0/Math.PI;
		
		crossProd.scale(alfa);
		this.normal.addPoint(crossProd);
	}
	
	this.normal.unitary();
	return resultConcaveVertexIdxArray;
};

Polygon.prototype.tessellate = function(resultConvexPolygons)
{
	// 1rst, must find concave vertices.***
	var concaveVerticesIndices = this.calculateNormal();
	var concaveVerticesCount = concaveVerticesIndices.length;
	
	// now, for any concave vertex, find the closest vertex to split the polygon.***
	var find = false;
	var vertexBIdx;
	var i=0;
	while(!find && i<concaveVerticesCount)
	{
		var idx = concaveVerticesIndices[i];
		var vertex = this.verticesArray[idx];
		var resultSortedVerticesIdxArray = [];
		
		// get vertices indices sorted by distance to "vertex".***
		this.getVerticesIdxSortedByDistToVertex(vertex, this.verticesArray, resultSortedVerticesIdxArray);
		
		var finished = false;
		var sortedVerticesCount = resultSortedVerticesIdxArray.length;
		var j=0;
		while(!finished && j<sortedVerticesCount)
		{
			vertexBIdx = resultSortedVerticesIdxArray[j];
			
			// skip adjacent vertices.***
			if(this.getPrevIdx(idx) === vertexBIdx || this.getNextIdx(idx) === vertexBIdx)
			{
				j++;
				continue;
			}
			
			var resultSplittedPolygons = this.splitPolygon(idx, vertexBIdx);
			
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
	
	
	
	return resultSplittedPolygonsArray;
};

Polygon.prototype.getVerticesIdxSortedByDistToVertex = function(theVertex, verticesArray, resultSortedVerticesIdxArray)
{
	// Static function.***
	// Sorting minDist to maxDist.***
	if(resultSortedVerticesIdxArray === undefined)
		resultSortedVerticesIdxArray = [];
	
	var objectAux;
	var objectsAuxArray = [];
	var vertex;
	var squaredDist;
	var startIdx, endIdx, insertIdx;
	var verticesCount = verticesArray.length;
	for(var i=0; i<verticesCount; i++)
	{
		vertex = verticesArray[i];
		if(vertex === theVertex)
			continue;
		
		squaredDist = theVertex.point3d.squareDistToPoint(vertex.point3d);
		objectAux = {};
		objectAux.vertexIdx = i;
		objectAux.squaredDist = squaredDist;
		startIdx = 0;
		endIdx = objectsAuxArray.length - 1;
		
		insertIdx = this.getIndexToInsertBySquaredDist(objectsAuxArray, objectAux, startIdx, endIdx);
		objectsAuxArray.splice(insertIdx, 0, objectAux);
	}
	
	resultSortedVerticesIdxArray.length = 0;
	var objectsCount = objectsAuxArray.length;
	for(var i=0; i<objectsCount; i++)
	{
		resultSortedVerticesIdxArray.push(objectsAuxArray[i].vertexIdx);
	}
	
	return resultSortedVerticesIdxArray;
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

Polygon.prototype.getTriangles = function(resultTriangles)
{
	
};
























