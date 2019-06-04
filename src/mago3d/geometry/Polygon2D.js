'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class Polygon2D
 */
var Polygon2D = function() 
{
	if (!(this instanceof Polygon2D)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	// This is a 2D polygon.
	this.point2dList; // the border of this feature
	this.normal; // Polygon2D sense. (normal = 1) -> CCW. (normal = -1) -> CW.
	this.convexPolygonsArray; // tessellation result.
	this.bRect; // boundary rectangle.
};

Polygon2D.prototype.deleteObjects = function()
{
	if (this.point2dList !== undefined)
	{
		this.point2dList.deleteObjects();
		this.point2dList = undefined;
	}
	
	this.normal = undefined;
};

Polygon2D.prototype.getBoundingRectangle = function(resultBRect)
{
	if (this.point2dList === undefined)
	{ return resultBRect; }
	
	resultBRect = this.point2dList.getBoundingRectangle(resultBRect);
	return resultBRect;
};
/**
 * get the direction of the specific line segment of the edge
 * @param {Number} idx the index of the specific line segment
 * @return direction	
 */
Polygon2D.prototype.getEdgeDirection = function(idx)
{
	// the direction is unitary vector.
	var segment = this.point2dList.getSegment(idx);
	var direction = segment.getDirection(undefined);
	return direction;
};

/**
 * get the vector of the specigic line segement of the edge
 * @param {Number} index the index of the specific line segment
 * @return vector
 */
Polygon2D.prototype.getEdgeVector = function(idx)
{
	var segment = this.point2dList.getSegment(idx);
	var vector = segment.getVector(undefined);
	return vector;
};

/**
 * reverse the direction sense of this polygon
 */
Polygon2D.prototype.reverseSense = function()
{
	if (this.point2dList !== undefined)
	{ this.point2dList.reverse(); }
};

/**
 * copy the information of the other polygon to this polygon
 * @param {Polygon2D} resultCopyPolygon
 * @return {Polygon2D} resultCopyPolygon
 */
Polygon2D.prototype.getCopy = function(resultCopyPolygon)
{
	if (this.point2dList === undefined)
	{ return resultCopyPolygon; }
	
	if (resultCopyPolygon === undefined)
	{ resultCopyPolygon = new Polygon2D(); }
	
	// copy the point2dList and the normal.
	if (resultCopyPolygon.point2dList === undefined)
	{ resultCopyPolygon.point2dList = new Point2DList(); }
	
	resultCopyPolygon.point2dList = this.point2dList.getCopy(resultCopyPolygon.point2dList);
	
	if (this.normal)
	{ resultCopyPolygon.normal = this.normal; }
	
	return resultCopyPolygon;
};

/**
 * Calculate the normal vector of this polygon
 * @param resultConcavePointsIdxArray save the index of the points which make concave at the border
 * @return resultFConcavePointsIdxArray the list of the index which make concave at the border
 */
Polygon2D.prototype.calculateNormal = function(resultConcavePointsIdxArray)
{
	// must check if the verticesCount is 3. Then is a convex polygon.
	
	// A & B are vectors.
	// A*B is scalarProduct.
	// A*B = |A|*|B|*cos(alfa)
	var point;
	var crossProd;
	
	if (resultConcavePointsIdxArray === undefined)
	{ resultConcavePointsIdxArray = []; }
	
	//var candidate_1 = {}; // normal candidate 1.
	//var candidate_2 = {}; // normal candidate 2.
	
	this.normal = 0; // unknown sense.
	var pointsCount = this.point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		point = this.point2dList.getPoint(i);
		var prevIdx = this.point2dList.getPrevIdx(i);
		
		// get unitari directions of the vertex.
		var startVec = this.getEdgeDirection(prevIdx); // Point3D.
		var endVec = this.getEdgeDirection(i); // Point3D.
		
		// calculate the cross product.
		var crossProd = startVec.crossProduct(endVec, crossProd); // Point3D.
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

/**
 * Make the tessellate of the triangles which originally make up single Polygon2D feature (like a patchwork with triangle)
 * To call this function, before must call "calculateNormal" that returns "concaveVerticesIndices"
 * In 2D, "normal" is -1=(cw) or 1=(ccw).
 * @param concaveVerticesIndices the index of the points which make concave
 * @param convexPolygonsArray the index of the points which make convex
 */
Polygon2D.prototype.tessellate = function(concaveVerticesIndices, convexPolygonsArray)
{

	var concaveVerticesCount = concaveVerticesIndices.length;
	
	if (concaveVerticesCount === 0)
	{
		convexPolygonsArray.push(this);
		return convexPolygonsArray;
	}
	
	// now, for any concave vertex, find the closest vertex to split the polygon.
	var find = false;
	var idx_B;
	var i=0;
	
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
			if (this.point2dList.getPrevIdx(idx) === idx_B || this.point2dList.getNextIdx(idx) === idx_B)
			{
				j++;
				continue;
			}
			
			// check if is splittable by idx-idx_B.
			var segment = new Segment2D(this.point2dList.getPoint(idx), this.point2dList.getPoint(idx_B));
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
/**
 * Check whether the given segment cut a polygon edges or is coincident with a polygon's vertex 
 * @param segment the target segement
 * */
Polygon2D.prototype.intersectionWithSegment = function(segment)
{
	if (this.bRect !== undefined)
	{
		// if exist boundary rectangle, check bRect intersection.
		var segmentsBRect = segment.getBoundaryRectangle(segmentsBRect);
		if (!this.bRect.intersectsWithRectangle(segmentsBRect))
		{ return false; }
	}
	
	// 1rst check if the segment is coincident with any polygons vertex.
	var mySegment;
	var intersectionType;
	var error = 10E-8;
	var pointsCount = this.point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		mySegment = this.point2dList.getSegment(i, mySegment);
		
		// if segment shares points, then must not cross.
		if (segment.sharesPointsWithSegment(mySegment))
		{
			continue;
		}
		
		if (segment.intersectionWithSegment(mySegment, error))
		{
			return true;
		}
	}
	
	return false;
};

/**
 * Split single polygon as 2 polygons regarding of points of idx1, idx2
 * @param idx1 the index of the first point
 * @param idx2 the index of the second point
 * @param resultSplittedPolygonsArray the list of the created polygons by splitting
 */
Polygon2D.prototype.splitPolygon = function(idx1, idx2, resultSplittedPolygonsArray)
{
	if (resultSplittedPolygonsArray === undefined)
	{ resultSplittedPolygonsArray = []; }
	
	// polygon A. idx1 -> idx2.
	var polygon_A = new Polygon2D();
	polygon_A.point2dList = new Point2DList();
	polygon_A.point2dList.pointsArray = [];
	
	// 1rst, put vertex1 & vertex2 in to the polygon_A.
	polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(idx1));
	polygon_A.point2dList.pointsArray.push(this.point2dList.getPoint(idx2));
	
	var finished = false;
	var currIdx = idx2;
	var startIdx = idx1;
	var i=0;
	var totalPointsCount = this.point2dList.getPointsCount();
	while (!finished && i<totalPointsCount)
	{
		var nextIdx = this.point2dList.getNextIdx(currIdx);
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
	var polygon_B = new Polygon2D();
	polygon_B.point2dList = new Point2DList();
	polygon_B.point2dList.pointsArray = [];
	
	// 1rst, put vertex2 & vertex1 in to the polygon_B.
	polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(idx2));
	polygon_B.point2dList.pointsArray.push(this.point2dList.getPoint(idx1));
	
	finished = false;
	currIdx = idx1;
	startIdx = idx2;
	i=0;
	while (!finished && i<totalPointsCount)
	{
		var nextIdx = this.point2dList.getNextIdx(currIdx);
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

Polygon2D.prototype.getPointsIdxSortedByDistToPoint = function(thePoint, resultSortedPointsIdxArray)
{
	// Static function.
	// Sorting minDist to maxDist.
	if (resultSortedPointsIdxArray === undefined)
	{ resultSortedPointsIdxArray = []; }
	
	resultSortedPointsIdxArray = this.point2dList.getPointsIdxSortedByDistToPoint(thePoint, resultSortedPointsIdxArray);
	
	return resultSortedPointsIdxArray;
};

/**
 * Make the list of triangles at the convex polygon
 * @param resultTrianglesArray the list of triangles made from the polygon
 * @return resultTrianglesArray
 */
Polygon2D.prototype.getTrianglesConvexPolygon = function(resultTrianglesArray)
{
	// PROVISIONAL.
	// in this case, consider the polygon is convex.
	if (resultTrianglesArray === undefined)
	{ resultTrianglesArray = []; }

	var pointsCount = this.point2dList.getPointsCount();
	if (pointsCount <3)
	{ return resultTrianglesArray; }
	
	var triangle;
	for (var i=1; i<pointsCount-1; i++)
	{
		triangle = new Triangle();
		
		var point0idx = this.point2dList.getPoint(0).idxInList;
		var point1idx = this.point2dList.getPoint(i).idxInList;
		var point2idx = this.point2dList.getPoint(i+1).idxInList;
		
		triangle.vtxIdx0 = point0idx;
		triangle.vtxIdx1 = point1idx;
		triangle.vtxIdx2 = point2idx;
		
		resultTrianglesArray.push(triangle);
	}
	
	return resultTrianglesArray;
};
/**
 * @TODO : need to refactoring both of this function. 
 * 
 */
Polygon2D.prototype.getVbo = function(resultVbo)
{
	// PROVISIONAL.
	// return positions, normals and indices.
	if (resultVbo === undefined)
	{ resultVbo = new VBOVertexIdxCacheKey(); }
	
	// 1rst, obtain pos, nor.
	var posArray = [];
	var norArray = [];
	var point;
	var normal;
	if (this.normal > 0)
	{ normal = 1; }
	else
	{ normal = -1; }
		
	var pointsCount = this.point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
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
	
	// now calculate triangles indices.
	this.point2dList.setIdxInList(); // use this function instead a map.
	
	var trianglesArray = [];
	var convexPolygonsCount = this.convexPolygonsArray.length;
	for (var i=0; i<convexPolygonsCount; i++)
	{
		var convexPolygon = this.convexPolygonsArray[i];
		trianglesArray = convexPolygon.getTrianglesConvexPolygon(trianglesArray); // provisional.
	}
	TrianglesList.getVboFaceDataArray(trianglesArray, resultVbo);

	return resultVbo;
};
/**
 * @TODO : need to refactoring both of this function. 
 * 
 */
Polygon2D.getVbo = function(concavePolygon, convexPolygonsArray, resultVbo)
{
	// PROVISIONAL.
	// return positions, normals and indices.
	if (resultVbo === undefined)
	{ resultVbo = new VBOVertexIdxCacheKey(); }
	
	// 1rst, obtain pos, nor.
	var posArray = [];
	var norArray = [];
	var point;
	var normal;
	if (concavePolygon.normal > 0)
	{ normal = 1; }
	else
	{ normal = -1; }
		
	var pointsCount = concavePolygon.point2dList.getPointsCount();
	for (var i=0; i<pointsCount; i++)
	{
		point = concavePolygon.point2dList.getPoint(i);
		
		posArray.push(point.x);
		posArray.push(point.y);
		posArray.push(0.0);
		
		norArray.push(0);
		norArray.push(0);
		norArray.push(normal*255);
	}
	
	resultVbo.posVboDataArray = Float32Array.from(posArray);
	resultVbo.norVboDataArray = Int8Array.from(norArray);
	
	// now calculate triangles indices.
	concavePolygon.point2dList.setIdxInList(); // use this function instead a map.
	
	var trianglesArray = [];
	var convexPolygonsCount = convexPolygonsArray.length;
	for (var i=0; i<convexPolygonsCount; i++)
	{
		var convexPolygon = convexPolygonsArray[i];
		trianglesArray = convexPolygon.getTrianglesConvexPolygon(trianglesArray); // provisional.
	}
	TrianglesList.getVboFaceDataArray(trianglesArray, resultVbo);

	return resultVbo;
};























