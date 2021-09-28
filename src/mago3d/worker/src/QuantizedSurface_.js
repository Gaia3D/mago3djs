'use strict';

var QuantizedSurface_ = function(qMesh) 
{
	// QuantizedSurface's points domain is positive short size (0 to 32767)
	this.qMesh = qMesh;
	this.vertexList;
	this.trianglesList;

	// auxiliar vars.
	this.newVertexArray = [];
};

QuantizedSurface_.getError = function ()
{
	//return 1e-8;
	return 1e-3;
	//return 1; // no works correctly.
};

QuantizedSurface_.insertQPointIntoTriangle = function (qPoint, triangle, triList, vertexList, newVertexArray)
{
	// Here, insert the qPoint into triangle and create 3 new triangles, and then delete the original.
	// Create the 3 triangles:
	var tri1, tri2, tri3;
	var v0, v1, v2; // vertices of the original triangle.
	var qPoint3d = new Point3D_(qPoint.x, qPoint.y, qPoint.z);

	// 1rst, check if there are a coincident vertex between created vertices in the process.
	//var qVertex = vertexList.newVertex(qPoint3d);
	var qVertex = QuantizedSurface_._getOrNewVertex(newVertexArray, vertexList, qPoint3d);

	v0 = triangle.vertex0;
	v1 = triangle.vertex1;
	v2 = triangle.vertex2;

	tri1 = triList.newTriangle(qVertex, v0, v1);
	tri2 = triList.newTriangle(qVertex, v1, v2);
	tri3 = triList.newTriangle(qVertex, v2, v0);

	QuantizedSurface_._storeTriangleInVertices(tri1);
	QuantizedSurface_._storeTriangleInVertices(tri2);
	QuantizedSurface_._storeTriangleInVertices(tri3);

	tri1.setStatus(CODE_.status.HIGHLIGHTED);
	tri2.setStatus(CODE_.status.HIGHLIGHTED);
	tri3.setStatus(CODE_.status.HIGHLIGHTED);

	// now, delete the original triangle.
	triangle.setStatus(CODE_.status.DELETED);
};

QuantizedSurface_._isPoint2dInsideOfPolygon = function (point2d, convexPolygonsArray)
{
	var convexPolygons2dCount = convexPolygonsArray.length;
	var convexPoly;
	for (var i=0; i<convexPolygons2dCount; i++)
	{
		convexPoly = convexPolygonsArray[i];

		// 0 : no intersection 1 : pointCoincident, 2 : edgeCoincident. 3 : interior
		var relPos = convexPoly.getRelativePostionOfPoint2DConvexPolygon(point2d);

		if (relPos !== 0)
		{
			return true;
		}
	}

	return false;
};

QuantizedSurface_._swapTriangleVertex = function (triangle, originalVertex, newVertex)
{
	if (triangle.vertex0 === originalVertex)
	{
		triangle.vertex0 = newVertex;
		return 0;
	}
	else if (triangle.vertex1 === originalVertex)
	{
		triangle.vertex1 = newVertex;
		return 1;
	}
	else if (triangle.vertex2 === originalVertex)
	{
		triangle.vertex2 = newVertex;
		return 2;
	}

	return -1;
};

QuantizedSurface_.recalculateSkirtIndices = function (triList, vertexList, qMesh)
{
	// All indices right to left or down to up.***
	// south & north skirt (right to left), west & east (down to up).***
	// south skirt.***
	// 1rst, must find all south triangles.***

	// find the left_down vertex (west_south).***
	var vertexCount = vertexList.getVertexCount();
	var vertex;
	var vertexSouthWest, vertexSouthEast, vertexNorthEast, vertexNorthWest;
	for (var i=0; i<vertexCount; i++)
	{
		vertex = vertexList.getVertex(i);
		if (vertex.bSouth && vertex.bWest)
		{
			vertexSouthWest = vertex;
		}
		else if (vertex.bSouth && vertex.bEast)
		{
			vertexSouthEast = vertex;
		}
		else if (vertex.bNorth && vertex.bEast)
		{
			vertexNorthEast = vertex;
		}
		else if (vertex.bNorth && vertex.bWest)
		{
			vertexNorthWest = vertex;
		}
	}

	// with vertexSouthWest, find southVertexArray.***
	var cardinal = CODE_.cardinal.SOUTH;
	var southVertexArray = QuantizedSurface_._getSkirtVertices(cardinal, vertexSouthWest, undefined, vertexCount);

	// East vertex array.***
	cardinal = CODE_.cardinal.EAST;
	var eastVertexArray = QuantizedSurface_._getSkirtVertices(cardinal, vertexSouthEast, undefined, vertexCount);

	// North vertex array.***
	cardinal = CODE_.cardinal.NORTH;
	var northVertexArray = QuantizedSurface_._getSkirtVertices(cardinal, vertexNorthWest, undefined, vertexCount);

	// West vertex array.***
	cardinal = CODE_.cardinal.WEST;
	var westVertexArray = QuantizedSurface_._getSkirtVertices(cardinal, vertexSouthWest, undefined, vertexCount);

	vertexList.setIdxInList();

	var southSkirtIndices = [];
	var skirtVertexCount = southVertexArray.length;
	for (var i=0; i<skirtVertexCount; i++)
	{
		southSkirtIndices.push(southVertexArray[i].idxInList);
	}

	var eastSkirtIndices = [];
	skirtVertexCount = eastVertexArray.length;
	for (var i=0; i<skirtVertexCount; i++)
	{
		eastSkirtIndices.push(eastVertexArray[i].idxInList);
	}

	var northSkirtIndices = [];
	skirtVertexCount = northVertexArray.length;
	for (var i=0; i<skirtVertexCount; i++)
	{
		northSkirtIndices.push(northVertexArray[i].idxInList);
	}

	var westSkirtIndices = [];
	skirtVertexCount = westVertexArray.length;
	for (var i=0; i<skirtVertexCount; i++)
	{
		westSkirtIndices.push(westVertexArray[i].idxInList);
	}

	qMesh.southIndices = new Uint16Array(southSkirtIndices);
	qMesh.eastIndices = new Uint16Array(eastSkirtIndices);
	qMesh.northIndices = new Uint16Array(northSkirtIndices);
	qMesh.westIndices = new Uint16Array(westSkirtIndices);

};

QuantizedSurface_._getSkirtVertices = function (cardinal, startVertex, resultVertexArray, maxIterations)
{
	if (!resultVertexArray)
	{ resultVertexArray = []; }

	resultVertexArray.push(startVertex); // put the 1rst vertex of the south skirt.***
	var currVertex = startVertex;
	var currTriangle = undefined; // initially undefined.***
	var finished = false;
	if (maxIterations === undefined)
	{
		maxIterations = 35000;
	}
	var i = 0;
	while (!finished && i<maxIterations)
	{
		var report = QuantizedSurface_._getNextSkirtVertexReport(currVertex, currTriangle, cardinal);

		if (report)
		{
			var nextVertex = report.vertex;
			resultVertexArray.push(nextVertex);
			currVertex = nextVertex;
			currTriangle = report.triangle;
		}
		else
		{
			finished = true;
		}
		i++;
	}

	return resultVertexArray;
};

QuantizedSurface_._getNextSkirtVertexReport = function (vertex, triangleMaster, cardinal)
{
	var trianglesArray = vertex.trianglesArray;
	if (!trianglesArray)
	{ return undefined; }

	var report = {};

	var triCount = trianglesArray.length;
	var tri;

	if (cardinal === CODE_.cardinal.SOUTH)
	{
		for (var i=0; i<triCount; i++)
		{
			tri = trianglesArray[i];
			if (tri !== triangleMaster && tri.getStatus() !== CODE_.status.DELETED)
			{
				// now, check if this triangle has another south-vertex.***
				if (tri.vertex0 !== vertex && tri.vertex0.bSouth)
				{
					report.vertex = tri.vertex0;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex1 !== vertex && tri.vertex1.bSouth)
				{
					report.vertex = tri.vertex1;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex2 !== vertex && tri.vertex2.bSouth)
				{
					report.vertex = tri.vertex2;
					report.triangle = tri;
					return report;
				}
			}
		}
	}
	else if (cardinal === CODE_.cardinal.EAST)
	{
		for (var i=0; i<triCount; i++)
		{
			tri = trianglesArray[i];
			if (tri !== triangleMaster && tri.getStatus() !== CODE_.status.DELETED)
			{
				// now, check if this triangle has another south-vertex.***
				if (tri.vertex0 !== vertex && tri.vertex0.bEast)
				{
					report.vertex = tri.vertex0;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex1 !== vertex && tri.vertex1.bEast)
				{
					report.vertex = tri.vertex1;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex2 !== vertex && tri.vertex2.bEast)
				{
					report.vertex = tri.vertex2;
					report.triangle = tri;
					return report;
				}
			}
		}
	}
	else if (cardinal === CODE_.cardinal.NORTH)
	{
		for (var i=0; i<triCount; i++)
		{
			tri = trianglesArray[i];
			if (tri !== triangleMaster && tri.getStatus() !== CODE_.status.DELETED)
			{
				// now, check if this triangle has another south-vertex.***
				if (tri.vertex0 !== vertex && tri.vertex0.bNorth)
				{
					report.vertex = tri.vertex0;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex1 !== vertex && tri.vertex1.bNorth)
				{
					report.vertex = tri.vertex1;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex2 !== vertex && tri.vertex2.bNorth)
				{
					report.vertex = tri.vertex2;
					report.triangle = tri;
					return report;
				}
			}
		}
	}
	else if (cardinal === CODE_.cardinal.WEST)
	{
		for (var i=0; i<triCount; i++)
		{
			tri = trianglesArray[i];
			if (tri !== triangleMaster && tri.getStatus() !== CODE_.status.DELETED)
			{
				// now, check if this triangle has another south-vertex.***
				if (tri.vertex0 !== vertex && tri.vertex0.bWest)
				{
					report.vertex = tri.vertex0;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex1 !== vertex && tri.vertex1.bWest)
				{
					report.vertex = tri.vertex1;
					report.triangle = tri;
					return report;
				}
				else if (tri.vertex2 !== vertex && tri.vertex2.bWest)
				{
					report.vertex = tri.vertex2;
					report.triangle = tri;
					return report;
				}
			}
		}
	}

	return undefined;
};

QuantizedSurface_.createLateralTrianglesOfExcavation = function (triList, vertexList, quantizedAltitude)
{
	// Now, reset the triangles stored in each vertex.
	QuantizedSurface_._recalculateTrianglesStoredInVertices(triList, vertexList);

	// 1rst, unweld triangles NORMALs & HIGHLIGHTEDs.***
	var vertexCount = vertexList.getVertexCount();
	for (var i=0; i<vertexCount; i++)
	{
		var vertex = vertexList.getVertex(i);
		var vtxTrianglesArray = vertex.trianglesArray;
		if (!vtxTrianglesArray)
		{ continue; }

		// 1rst, separated triangles by status.***
		var highlightedTrianglesArray = [];
		var normalTrianglesArray = [];
		var vertexTriCount = vtxTrianglesArray.length;
		for (var j=0; j<vertexTriCount; j++)
		{
			var vertexTri = vtxTrianglesArray[j];
			var vtxTriStatus = vertexTri.getStatus();
			if (vtxTriStatus === CODE_.status.NORMAL)
			{
				normalTrianglesArray.push(vertexTri);
			}
			else if (vtxTriStatus === CODE_.status.HIGHLIGHTED)
			{
				highlightedTrianglesArray.push(vertexTri);
			}
		}

		// Now, create a new vertex for NORMAL triangles if exists.***
		var normalTriCount = normalTrianglesArray.length;
		var highlightedTriCount = highlightedTrianglesArray.length;

		if (normalTriCount > 0 && highlightedTriCount > 0)
		{
			// create a new vertex for NORMAL triangles.***
			var pos = vertex.getPosition();
			var newVertex = vertexList.newVertex(new Point3D_(pos.x, pos.y, pos.z));

			// store in newVertex the originalVertex as twinVertex.
			newVertex.twinVertex = vertex;

			// copy the cardinal of vertex.
			if (vertex.bSouth)
			{ newVertex.bSouth = true; }
			if (vertex.bEast)
			{ newVertex.bEast = true; }
			if (vertex.bNorth)
			{ newVertex.bNorth = true; }
			if (vertex.bWest)
			{ newVertex.bWest = true; }

			for (var j=0; j<normalTriCount; j++)
			{
				var normalTri = normalTrianglesArray[j];
				QuantizedSurface_._swapTriangleVertex(normalTri, vertex, newVertex);

			}
		}
	}

	QuantizedSurface_._recalculateTrianglesStoredInVertices(triList, vertexList);

	// Create lateral triangles.***
	var triCount = triList.getTrianglesCount();
	var tri;
	var status;
	var pos;

	for (var i=0; i<triCount; i++)
	{
		tri = triList.getTriangle(i);
		if (!tri.bCutted) 
		{
			continue;
		}

		status = tri.getStatus();

		if (status === CODE_.status.NORMAL)
		{
			QuantizedSurface_._createLateralTrianglesOfTriangle(tri, triList);
		}
	}

	// set all highlighted triangles as zero altitude.***
	var triCount = triList.getTrianglesCount();
	var tri;
	var status;
	var pos;
	for (var i=0; i<triCount; i++)
	{
		tri = triList.getTriangle(i);
		status = tri.getStatus();
		if (status === CODE_.status.HIGHLIGHTED)
		{
			// set excavation altitude.***
			pos = tri.vertex0.getPosition();
			pos.z = quantizedAltitude;
			pos = tri.vertex1.getPosition();
			pos.z = quantizedAltitude;
			pos = tri.vertex2.getPosition();
			pos.z = quantizedAltitude;
		}
	}
};

QuantizedSurface_._verticesBelongsToSameTriangle = function (vertexA, vertexB)
{
	// check trianglesArray of each vertex.
	var triArrayA = vertexA.trianglesArray;
	var triArrayB = vertexB.trianglesArray;

	if (triArrayA && triArrayB)
	{
		var triACount = triArrayA.length;
		for (var i=0; i<triACount; i++)
		{
			var triA = triArrayA[i];

			// now check if the vertexB belongs to triA.***
			if (triA.hasVertex(vertexB))
			{
				return true;
			}
		}
	}

	return false;
};

QuantizedSurface_._createLateralTrianglesOfEdge = function (vertexA, vertexB, twinVertexA, twinVertexB, triList)
{
	if (QuantizedSurface_._verticesBelongsToSameTriangle(twinVertexA, twinVertexB))
	{
		// create 2 triangles.***
		var tri1, tri2;
		tri1 = triList.newTriangle(twinVertexA, twinVertexB, vertexB);
		tri2 = triList.newTriangle(twinVertexA, vertexB, vertexA);
		QuantizedSurface_._storeTriangleInVertices(tri1);
		QuantizedSurface_._storeTriangleInVertices(tri2);
		return true;
	}
};

QuantizedSurface_._createLateralTrianglesOfTriangle = function (tri, triList)
{
	// The triangle must be NORMAL type.
	var vertexA, vertexB;
	var twinVertexA = undefined; // int.***
	var twinVertexB = undefined; // int.***
	var twinVertexC = undefined; // int.***

	twinVertexA = tri.vertex0.twinVertex;
	twinVertexB = tri.vertex1.twinVertex;
	twinVertexC = tri.vertex2.twinVertex;


	if (twinVertexA && twinVertexB)
	{
		QuantizedSurface_._createLateralTrianglesOfEdge(tri.vertex0, tri.vertex1, twinVertexA, twinVertexB, triList);
	}

	if (twinVertexB && twinVertexC)
	{
		QuantizedSurface_._createLateralTrianglesOfEdge(tri.vertex1, tri.vertex2, twinVertexB, twinVertexC, triList);
	}

	if (twinVertexC && twinVertexA)
	{
		QuantizedSurface_._createLateralTrianglesOfEdge(tri.vertex2, tri.vertex0, twinVertexC, twinVertexA, triList);
	}

    

	return false;
};

QuantizedSurface_._recalculateTrianglesStoredInVertices = function (triList, vertexList)
{
	// Now, reset the triangles stored in each vertex.
	var vertexCount = vertexList.getVertexCount();
	for (var i=0; i<vertexCount; i++)
	{
		var vertex = vertexList.getVertex(i);

		if (vertex.trianglesArray)
		{
			vertex.trianglesArray.length = 0;
		}
	}

	var triCount = triList.getTrianglesCount();
	for (var i=0; i<triCount; i++)
	{
		var triangle = triList.getTriangle(i);
		QuantizedSurface_._storeTriangleInVertices(triangle);
	}
};

QuantizedSurface_.recalculateQuantizedAltitudes = function (newMinHeight, newMaxHeight, currMinHeight, currMaxHeight, vertexList)
{
	var newHeightRange = newMaxHeight - newMinHeight;
	var currHeightRange = currMaxHeight - currMinHeight;

	var vertexCount = vertexList.getVertexCount();
	for (var i=0; i<vertexCount; i++)
	{
		var vertex = vertexList.getVertex(i);
		var pos = vertex.getPosition();
		var realHeight = currMinHeight + (pos.z / 32767) * currHeightRange;
		var newHeight = (realHeight - newMinHeight) / newHeightRange;

		pos.z = newHeight * 32767;
	}
};

QuantizedSurface_._classifyTrianglesAsInteriorOrExteriorOfPolygon = function(triList, convexPolygonsArray)
{
	// for each triangle, mark the triangle that is interior of the polygon2d.***
	var triCount = triList.getTrianglesCount();
	var tri;
	var centerPoint;
	var centerPoint2d = new Point2D_();
	//var report;
	var error = QuantizedSurface_.getError();
	for (var i=0; i<triCount; i++)
	{
		tri = triList.getTriangle(i);

		if (tri.getStatus() === CODE_.status.DELETED)
		{
			continue;
		}

		// take the baricenter of the triangle.***
		centerPoint = tri.getCenterPoint(centerPoint);
		centerPoint2d.set(centerPoint.x, centerPoint.y);

		// chack if the centerPoint is inside of the polygon2d.***
		if (QuantizedSurface_._isPoint2dInsideOfPolygon(centerPoint2d, convexPolygonsArray))
		{
			tri.setStatus(CODE_.status.HIGHLIGHTED);
		}
		else
		{
			tri.setStatus(CODE_.status.NORMAL);
		}
	}
};

QuantizedSurface_._cutTrianglesWithPlane = function (triList, plane, segment2d, vertexList, resultTrianglesArray, newVertexArray) 
{
	// This is a special function in the "QuantizedSurface".
	//*********************************************************************************************************************************************
	// The qMesh was prepared inserting vertices & refining the mesh, so all segments points are coincidents with triangles vertices.***
	//*********************************************************************************************************************************************
	var triCount = triList.getTrianglesCount();
	var tri;
	var report;
	var error = QuantizedSurface_.getError();
	for (var i=0; i<triCount; i++)
	{
		tri = triList.getTriangle(i);
		if (tri.getStatus() === CODE_.status.DELETED)
		{
			continue;
		}

		report = tri.getIntersectionByPlaneReport(plane, undefined, error);

		// Note : if the report.length === 1, then the triangle is tangent to plane by one vertex.***

		if (report && report.length > 1)
		{
			// Now, split the triangle if the intersected points is inside of the range of the segment2d.***
			// The triangle can be splitted in 2 or 3 triangles.
			// If the plane intersects any triangle's vertex, then the triangle is splitted in 2 triangles.
			// If the plane intersects the triangle in the triangles edges, then the triangle is splitted in 3 triangles.
			var intersect_1 = report[0];
			var intersect_2 = report[1];

			// 1rst, check if the intersected points are inside of the range.
			var intersectPoint_1 = intersect_1.intesectPoint;
			var intersectPoint_2 = intersect_2.intesectPoint;

			// check if intersectPoint_1 && intersectPoint_2 intersects in 2d with segment2d.
			// There are 2 cases:
			// 1) the 2 points intersects the segment2d.
			// 2) Only 1 point intersects the segment2d.
			// If only 1 point intersects and the intersection is in a edge, then, split the triangle by triangles-edge to triangles-oppositeVertex.
			var intersectPoint2d_1 = new Point2D_(intersectPoint_1.x, intersectPoint_1.y);
			var intersectPoint2d_2 = new Point2D_(intersectPoint_2.x, intersectPoint_2.y);

			/*
            CODE_.relativePositionPoint2DWithSegment2D = {
                "UNKNOWN" : 0,
                "OUTSIDE" : 1,
                "INSIDE" : 2,
                "COINCIDENT_WITH_START_POINT" : 3,
                "COINCIDENT_WITH_END_POINT" : 4
            }
            */
			var relPosPoint2d_1 = segment2d.getRelativePositionOfPoint2DReport(intersectPoint2d_1, undefined, error);
			var relPosPoint2d_2 = segment2d.getRelativePositionOfPoint2DReport(intersectPoint2d_2, undefined, error);

			// Here must check if one of the points2d is inside & the another point is outside.***
			if (relPosPoint2d_1.relPos === CODE_.relativePositionPoint2DWithSegment2D.OUTSIDE || relPosPoint2d_2.relPos === CODE_.relativePositionPoint2DWithSegment2D.OUTSIDE)
			{
				continue;
			}

			var resultNewTriangles = [];

			if (intersect_1.intersectionType === "segmentIntersection")
			{
				if (intersect_2.intersectionType === "segmentIntersection")
				{
					// The triangle must be splitted in 3 triangles.
					var qPoint_A = intersect_1.intesectPoint;
					var qPoint_B = intersect_2.intesectPoint;
					var edgeIdx_A = intersect_1.idx;
					var edgeIdx_B = intersect_2.idx;
                    
					QuantizedSurface_.insert2QPointIntoTriangleEdges(qPoint_A, qPoint_B, tri, triList, vertexList, edgeIdx_A, edgeIdx_B, newVertexArray, resultNewTriangles);
				}
				else if (intersect_2.intersectionType === "startPointIntersection")
				{
					// The triangle must be splitted in 2 triangles.
					var qPoint = intersect_1.intesectPoint;
					var edgeIdx = intersect_1.idx;
					QuantizedSurface_.insertQPointIntoTriangleEdge(qPoint, tri, triList, vertexList, edgeIdx, newVertexArray, resultNewTriangles);
				}
			}
			else if (intersect_1.intersectionType === "startPointIntersection")
			{
				if (intersect_2.intersectionType === "segmentIntersection")
				{
					// The triangle must be splitted in 2 triangles.
					var qPoint = intersect_2.intesectPoint;
					var edgeIdx = intersect_2.idx;
					QuantizedSurface_.insertQPointIntoTriangleEdge(qPoint, tri, triList, vertexList, edgeIdx, newVertexArray, resultNewTriangles);
				}
				else if (intersect_2.intersectionType === "startPointIntersection")
				{
					// This is a tangent case. Do not splitt the triangle.
				}
			}

			// Test debug : Now, for new triangles created in cutting process, set as cutted type, for the future use.
			if (resultNewTriangles.length > 0)
			{
				for (var i=0; i<resultNewTriangles.length; i++)
				{
					resultNewTriangles[i].bCutted = true; // test debug.***
				}
			}
		}
	}
    
};

QuantizedSurface_._makeQuantizedMeshFromTrianglesList = function (trianglesList, vertexList, resultQMesh)
{
	// this is the reverse function of "_makeTrianglesListFromQuantizedMesh".***
	var vertexCount = vertexList.getVertexCount();
	var uValues = new Uint16Array(vertexCount);
	var vValues = new Uint16Array(vertexCount);
	var hValues = new Uint16Array(vertexCount);
	
	var vertex;
	var pos;
	for (var i=0; i<vertexCount; i++)
	{
		vertex = vertexList.getVertex(i);
		pos = vertex.getPosition();
		uValues[i] = Math.round(pos.x);
		vValues[i] = Math.round(pos.y);
		hValues[i] = Math.round(pos.z);

		// set idx in list of the vertex.
		vertex.idxInList = i;
	}

	// Now, collect all triangles that status is NO DELETED.
	var trianglesArray = [];
	var triCount = trianglesList.getTrianglesCount();
	var triangle;
	for (var i=0; i<triCount; i++)
	{
		triangle = trianglesList.getTriangle(i);
		if (triangle.getStatus() !== CODE_.status.DELETED)// && triangle.getStatus() !== CODE_.status.HIGHLIGHTED)
		{
			trianglesArray.push(triangle);
		}
	}

	// Now, make indices array.***
	triCount = trianglesArray.length;
	var indices = new Uint16Array(triCount * 3);
	var vtx_1, vtx_2, vtx_3;
	var status;
	for (var i=0; i<triCount; i++)
	{
		triangle = trianglesArray[i];
		vtx_1 = triangle.vertex0;
		vtx_2 = triangle.vertex1;
		vtx_3 = triangle.vertex2;

		indices[i * 3] = vtx_1.idxInList;
		indices[i * 3 + 1] = vtx_2.idxInList;
		indices[i * 3 + 2] = vtx_3.idxInList;
	}

	if (!resultQMesh)
	{
		resultQMesh = {}; // create as an object.***
	}

	resultQMesh.uValues = uValues;
	resultQMesh.vValues = vValues;
	resultQMesh.hValues = hValues;
	resultQMesh.indices = indices;

	return resultQMesh;
};

QuantizedSurface_._getCoincidentVertexFromVertexArray = function (vertexArray, point3d, error)
{
	// this function is only for inter use.
	if (!error)
	{ error = QuantizedSurface_.getError(); }
	var vertexCount = vertexArray.length;
	var vertex, vertexCandidate;
	var position;
	for (var i=0; i<vertexCount; i++)
	{
		vertexCandidate = vertexArray[i];
		position = vertexCandidate.getPosition();
		if (position.isCoincidentToPoint(point3d, error))
		{
			vertex = vertexCandidate;
			break;
		}
	}

	return vertex;
};

QuantizedSurface_._getOrNewVertex = function(vertexArray, vertexList, point3d)
{
	var error = QuantizedSurface_.getError();
	var resultVertex = QuantizedSurface_._getCoincidentVertexFromVertexArray(vertexArray, point3d, error);
	if (!resultVertex)
	{
		resultVertex = vertexList.newVertex(point3d);
		vertexArray.push(resultVertex);
	}

	return resultVertex;
};

QuantizedSurface_._getCardinalOfEdge = function (vertex_A, vertex_B)
{
	// this function returns the cardinal direction of vertices if the 2 vertices are the same cardinal direction.
	/*
    CODE_.cardinal = {
	"UNKNOWN" : 0,
	"SOUTH" : 1,
	"EAST" : 2,
	"NORTH" : 3,
	"WEST" : 4
    }
    */
	if (vertex_A.bSouth)
	{
		if (vertex_B.bSouth)
		{
			return CODE_.cardinal.SOUTH;
		}
	}
	else if (vertex_A.bEast)
	{
		if (vertex_B.bEast)
		{
			return CODE_.cardinal.EAST;
		}
	}
	else if (vertex_A.bNorth)
	{
		if (vertex_B.bNorth)
		{
			return CODE_.cardinal.NORTH;
		}
	}
	else if (vertex_A.bWest)
	{
		if (vertex_B.bWest)
		{
			return CODE_.cardinal.WEST;
		}
	}

	return CODE_.cardinal.UNKNOWN;
};

QuantizedSurface_._setCardinalToVertex = function (vertex, cardinal)
{
	if (cardinal !== CODE_.cardinal.UNKNOWN)
	{
		if (cardinal === CODE_.cardinal.SOUTH)
		{
			vertex.bSouth = true;
		}
		else if (cardinal === CODE_.cardinal.EAST)
		{
			vertex.bEast = true;
		}
		else if (cardinal === CODE_.cardinal.NORTH)
		{
			vertex.bNorth = true;
		}
		else if (cardinal === CODE_.cardinal.WEST)
		{
			vertex.bWest = true;
		}
	}
};

QuantizedSurface_._storeTriangleInVertices = function (triangle)
{
	var v0 = triangle.vertex0;
	var v1 = triangle.vertex1;
	var v2 = triangle.vertex2;

	if (!v0.trianglesArray)
	{ v0.trianglesArray = []; }

	if (!v1.trianglesArray)
	{ v1.trianglesArray = []; }

	if (!v2.trianglesArray)
	{ v2.trianglesArray = []; }

	v0.trianglesArray.push(triangle);
	v1.trianglesArray.push(triangle);
	v2.trianglesArray.push(triangle);
};

QuantizedSurface_.insert2QPointIntoTriangleEdges = function (qPoint_A, qPoint_B, triangle, triList, vertexList, edgeIdx_A, edgeIdx_B, newVertexArray, resultNewTriangles)
{
	// Here, insert the qPoint_A & qPoint_B into triangle's edges.
	// Note : qPoint_A & qPoint_B are in different triangle's edges.***
	var tri1, tri2, tri3;
	var v0, v1, v2; // vertices of the original triangle.
	var qPoint3d_A = new Point3D_(qPoint_A.x, qPoint_A.y, qPoint_A.z);
	//var qVertex_A = vertexList.newVertex(qPoint3d_A);
	var qVertex_A = QuantizedSurface_._getOrNewVertex(newVertexArray, vertexList, qPoint3d_A);

	var qPoint3d_B = new Point3D_(qPoint_B.x, qPoint_B.y, qPoint_B.z);
	//var qVertex_B = vertexList.newVertex(qPoint3d_B);
	var qVertex_B = QuantizedSurface_._getOrNewVertex(newVertexArray, vertexList, qPoint3d_B);

	v0 = triangle.vertex0;
	v1 = triangle.vertex1;
	v2 = triangle.vertex2;

	var cardinal_A, cardinal_B;

	if (edgeIdx_A === 0)
	{
		if (edgeIdx_B === 1)
		{
			//                v2
			//               /  \
			//             /      \
			//           /         * p_B
			//         /             \
			//       /                 \
			//     v0-------*-----------v1
			//             p_A
			tri1 = triList.newTriangle(v0, qVertex_A, v2);
			tri2 = triList.newTriangle(qVertex_A, qVertex_B, v2);
			tri3 = triList.newTriangle(qVertex_A, v1, qVertex_B);

			cardinal_A = QuantizedSurface_._getCardinalOfEdge(v0, v1);
			cardinal_B = QuantizedSurface_._getCardinalOfEdge(v1, v2);
		}
		else if (edgeIdx_B === 2)
		{
			//                v2
			//               /  \
			//             /      \
			//       p_B *          \
			//         /              \
			//       /                  \
			//     v0-------*------------v1
			//             p_A
			tri1 = triList.newTriangle(v0, qVertex_A, qVertex_B);
			tri2 = triList.newTriangle(qVertex_A, v2, qVertex_B);
			tri3 = triList.newTriangle(qVertex_A, v1, v2);

			cardinal_A = QuantizedSurface_._getCardinalOfEdge(v0, v1);
			cardinal_B = QuantizedSurface_._getCardinalOfEdge(v2, v0);
		}
	}
	else if (edgeIdx_A === 1)
	{
		if (edgeIdx_B === 0)
		{
			//                v2
			//               /  \
			//             /      \
			//           /         * p_A
			//         /             \
			//       /                 \
			//     v0-------*-----------v1
			//             p_B
			tri1 = triList.newTriangle(v0, qVertex_B, v2);
			tri2 = triList.newTriangle(qVertex_B, qVertex_A, v2);
			tri3 = triList.newTriangle(qVertex_B, v1, qVertex_A);

			cardinal_A = QuantizedSurface_._getCardinalOfEdge(v1, v2);
			cardinal_B = QuantizedSurface_._getCardinalOfEdge(v0, v1);
		}
		else if (edgeIdx_B === 2)
		{
			//                v2
			//               /  \
			//             /      \
			//       p_B *         * p_A
			//         /             \
			//       /                 \
			//     v0-------------------v1
			//             
			tri1 = triList.newTriangle(v0, v1, qVertex_A);
			tri2 = triList.newTriangle(v0, qVertex_A, qVertex_B);
			tri3 = triList.newTriangle(qVertex_B, qVertex_A, v2);

			cardinal_A = QuantizedSurface_._getCardinalOfEdge(v1, v2);
			cardinal_B = QuantizedSurface_._getCardinalOfEdge(v2, v0);
		}
	}
	else if (edgeIdx_A === 2)
	{
		if (edgeIdx_B === 0)
		{
			//                v2
			//               /  \
			//             /      \
			//       p_A *          \
			//         /              \
			//       /                  \
			//     v0-------*------------v1
			//             p_B
			tri1 = triList.newTriangle(v0, qVertex_B, qVertex_A);
			tri2 = triList.newTriangle(qVertex_B, v2, qVertex_A);
			tri3 = triList.newTriangle(qVertex_B, v1, v2);

			cardinal_A = QuantizedSurface_._getCardinalOfEdge(v2, v0);
			cardinal_B = QuantizedSurface_._getCardinalOfEdge(v0, v1);
		}
		else if (edgeIdx_B === 1)
		{
			//                v2
			//               /  \
			//             /      \
			//       p_A *          * p_B
			//         /              \
			//       /                  \
			//     v0--------------------v1
			//             
			tri1 = triList.newTriangle(v0, v1, qVertex_B);
			tri2 = triList.newTriangle(v0, qVertex_B, qVertex_A);
			tri3 = triList.newTriangle(qVertex_A, qVertex_B, v2);

			cardinal_A = QuantizedSurface_._getCardinalOfEdge(v2, v0);
			cardinal_B = QuantizedSurface_._getCardinalOfEdge(v1, v2);
		}
	}

	QuantizedSurface_._setCardinalToVertex(qVertex_A, cardinal_A);
	QuantizedSurface_._setCardinalToVertex(qVertex_B, cardinal_B);

	QuantizedSurface_._storeTriangleInVertices(tri1);
	QuantizedSurface_._storeTriangleInVertices(tri2);
	QuantizedSurface_._storeTriangleInVertices(tri3);

	if (resultNewTriangles)
	{
		resultNewTriangles.push(tri1, tri2, tri3);
	}


	// finally mark twinTriangle as "deleted".
	triangle.setStatus(CODE_.status.DELETED);
    
};

QuantizedSurface_.insertQPointIntoTriangleEdge = function (qPoint, triangle, triList, vertexList, edgeIdx, newVertexArray, resultNewTriangles)
{
	// Here, insert the qPoint into triangle's edge.
	// 1rst, must find the 2 triangles that uses the edge. In frontier triangles, the edge can have only 1 triangle.
	// insert the qPoint into the twinTriangle's edge.***
	// Here, insert the qPoint into triangle edge and create 2 new triangles, and then delete the original.
	var tri1, tri2;
	var v0, v1, v2; // vertices of the original triangle.
	var qPoint3d = new Point3D_(qPoint.x, qPoint.y, qPoint.z);
	//var qVertex = vertexList.newVertex(qPoint3d);
	var qVertex = QuantizedSurface_._getOrNewVertex(newVertexArray, vertexList, qPoint3d);

	v0 = triangle.vertex0;
	v1 = triangle.vertex1;
	v2 = triangle.vertex2;

	// Now, create 2 new triangles depending the edgeIdx.***
	//var segIdx = triangle.getSegmentIdxOfVertices(vertex_A, vertex_B);
	var cardinal = CODE_.cardinal.UNKNOWN;
	if (edgeIdx === 0)
	{
		tri1 = triList.newTriangle(qVertex, v1, v2);
		tri2 = triList.newTriangle(qVertex, v2, v0);

		// check vertex_0 & vertex_1.
		cardinal = QuantizedSurface_._getCardinalOfEdge(v0, v1);
        
	}
	else if (edgeIdx === 1)
	{
		tri1 = triList.newTriangle(qVertex, v2, v0);
		tri2 = triList.newTriangle(qVertex, v0, v1);

		// check vertex_1 & vertex_2.
		cardinal = QuantizedSurface_._getCardinalOfEdge(v1, v2);
	}
	else if (edgeIdx === 2)
	{
		tri1 = triList.newTriangle(qVertex, v0, v1);
		tri2 = triList.newTriangle(qVertex, v1, v2);

		// check vertex_2 & vertex_0.
		cardinal = QuantizedSurface_._getCardinalOfEdge(v2, v0);
	}

	QuantizedSurface_._setCardinalToVertex(qVertex, cardinal);

	// store triangles into vertices, to use as vertex-triangle-map.
	QuantizedSurface_._storeTriangleInVertices(tri1);
	QuantizedSurface_._storeTriangleInVertices(tri2);

	if (resultNewTriangles)
	{
		resultNewTriangles.push(tri1, tri2);
	}

	// finally mark twinTriangle as "deleted".
	triangle.setStatus(CODE_.status.DELETED);
    
};

QuantizedSurface_.insertQPointsArrayIntoTrianglesList = function(qPointsArray, triList, vertexList, newVertexArray)
{
	// Note: the triangles of the triList has as points quantizedPoints.
	var qPointsCount = qPointsArray.length;
	for (var i=0; i<qPointsCount; i++)
	{
		QuantizedSurface_.insertQPointIntoTrianglesList(qPointsArray[i], triList, vertexList, newVertexArray);
	}
};

QuantizedSurface_.getProjectedTriangle2D_planeXY = function (triangle, resultTriangle2d)
{
	if (!resultTriangle2d)
	{
		resultTriangle2d = new Triangle2D_();
	}

	var p0 = triangle.vertex0.getPosition();
	var p1 = triangle.vertex1.getPosition();
	var p2 = triangle.vertex2.getPosition();

	var p2d_0 = new Point2D_(p0.x, p0.y);
	var p2d_1 = new Point2D_(p1.x, p1.y);
	var p2d_2 = new Point2D_(p2.x, p2.y);

	resultTriangle2d.setPoints(p2d_0, p2d_1, p2d_2);

	return resultTriangle2d;
};

QuantizedSurface_.getTriangleBoundingRect = function (triangle, resultBRect)
{
	// calculate the bRect of a 3d triangle using x,y only.
	if (!resultBRect)
	{
		resultBRect = new BoundingRectangle_();
	}

	var point3d = triangle.vertex0.getPosition();
	resultBRect.setInitXY(point3d.x, point3d.y);

	point3d = triangle.vertex1.getPosition();
	resultBRect.addPointXY(point3d.x, point3d.y);

	point3d = triangle.vertex2.getPosition();
	resultBRect.addPointXY(point3d.x, point3d.y);

	return resultBRect;
};

QuantizedSurface_.getVertexList = function (qMesh, resultVertexList)
{
	if (!resultVertexList)
	{
		resultVertexList = new VertexList_();
	}

	var minHeight = qMesh.minHeight;
	var maxHeight = qMesh.maxHeight;
	var uValues = qMesh.uValues;
	var vValues = qMesh.vValues;
	var hValues = qMesh.hValues;
	var indices = qMesh.indices;

	// 1rst, make points.***
	var pointsCount = uValues.length;
	var vtx;
	for (var i=0; i<pointsCount; i++)
	{
		vtx = resultVertexList.newVertex(new Point3D_(uValues[i], vValues[i], hValues[i]));
	}

	// For each vertex, set flag : south, east, north or west.***
	// The corner vertex must 2 flags.
	// south.***
	var indicesArray = qMesh.southIndices;
	var indicesCount = indicesArray.length;
	var idx;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	for (var i=0; i<indicesCount; i++)
	{
		idx = indicesArray[i];
		vtx = resultVertexList.getVertex(idx);
		vtx.bSouth = true;
	}

	// east.***
	var indicesArray = qMesh.eastIndices;
	var indicesCount = indicesArray.length;
	var idx;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	for (var i=0; i<indicesCount; i++)
	{
		idx = indicesArray[i];
		vtx = resultVertexList.getVertex(idx);
		vtx.bEast = true;
	}

	// north.***
	var indicesArray = qMesh.northIndices;
	var indicesCount = indicesArray.length;
	var idx;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	for (var i=0; i<indicesCount; i++)
	{
		idx = indicesArray[i];
		vtx = resultVertexList.getVertex(idx);
		vtx.bNorth = true;
	}

	// west.***
	var indicesArray = qMesh.westIndices;
	var indicesCount = indicesArray.length;
	var idx;
	// 1rst, make skirt cartesians array (use by TRIANGLES_STRIP).***
	for (var i=0; i<indicesCount; i++)
	{
		idx = indicesArray[i];
		vtx = resultVertexList.getVertex(idx);
		vtx.bWest = true;
	}

	return resultVertexList;
};

QuantizedSurface_.getTrianglesList = function (qMesh, resultTriList)
{
	if (!resultTriList)
	{
		resultTriList = new TrianglesList_();
	}

	var vertexList = qMesh.vertexList;
	var indices = qMesh.indices;

	var trianglesCount = indices.length/3;
	var idxPoint_1, idxPoint_2, idxPoint_3;
	var vtx_1, vtx_2, vtx_3;
	var triangle;

	for (var i=0; i<trianglesCount; i++)
	{
		idxPoint_1 = indices[i * 3];
		idxPoint_2 = indices[i * 3 + 1];
		idxPoint_3 = indices[i * 3 + 2];

		// check for degenerated triangles.***
		if (idxPoint_1 === idxPoint_2 || idxPoint_1 === idxPoint_3 || idxPoint_2 === idxPoint_3)
		{
			continue;
		}

		vtx_1 = vertexList.getVertex(idxPoint_1);
		vtx_2 = vertexList.getVertex(idxPoint_2);
		vtx_3 = vertexList.getVertex(idxPoint_3);

		triangle = resultTriList.newTriangle(vtx_1, vtx_2, vtx_3);

		// Now, for each vertex, make triangles-array that uses these vertices.
		QuantizedSurface_._storeTriangleInVertices(triangle);
	}

	return resultTriList;
};

QuantizedSurface_.insertQPointIntoTrianglesList = function(qPoint, triList, vertexList, newVertexArray)
{
	var triCount = triList.getTrianglesCount();
	var tri, tri2d;
	var point;
	var plane;
	var error = QuantizedSurface_.getError();
	var line = new Line_();
	line.set2Points(qPoint.x, qPoint.y, 0.0, qPoint.x, qPoint.y, 30000.0);

	var qPoint_insertedIntoEdgesCount = 0;

	for (var i=0; i<triCount; i++)
	{
		tri = triList.getTriangle(i);

		if (tri.getStatus() === CODE_.status.DELETED)
		{
			continue;
		}

		if (!tri.bRectXY)
		{
			tri.bRectXY = QuantizedSurface_.getTriangleBoundingRect(tri, undefined);
		}

		if (tri.bRectXY.intersectsWithPointXY(qPoint.x, qPoint.y))
		{
			// insert the qPoint into tri and finishes the process.
			// Need the triangle's plane.
			plane = tri.getPlane(plane);

			// Now, find the intersection point.
			var intersectionPoint = plane.intersectionLine(line);

			if (intersectionPoint)
			{
				var intersectionPoint2d = new Point2D_(intersectionPoint.x, intersectionPoint.y);
				// Finally, must check if the intersected point is inside of the triangle.
				tri2d = QuantizedSurface_.getProjectedTriangle2D_planeXY(tri, tri2d);
				var report = tri2d.getRelativePositionOfPoint2DReport(intersectionPoint2d, undefined, error);

				/*
                CODE_.relativePositionPoint2DWithTriangle2D = {
                    "UNKNOWN" : 0,
                    "OUTSIDE" : 1,
                    "INSIDE" : 2,
                    "COINCIDENT_WITH_TRIANGLE_POINT" : 3,
                    "COINCIDENT_WITH_TRIANGLE_EDGE" : 4
                }
                */

				if (report.relPos === CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT)
				{
					// Do nothing.***
					var hola = 0;
				}

				if (report.relPos === CODE_.relativePositionPoint2DWithTriangle2D.INSIDE)
				{
					// Insert the "intersectionPoint" into the triangle -> create 3 triangles & delete the original.
					QuantizedSurface_.insertQPointIntoTriangle(intersectionPoint, tri, triList, vertexList, newVertexArray);
					// Break process, because there are only ONE triangle that has the qPoint inside.***
					break;
				}
				else if (report.relPos === CODE_.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE)
				{
					// In this case split the triangle.
					// Must find the 2 triangles of the intersected edge.
					var edgeIdx = report.segmentIdx;

					// The triangle must be splitted in 2 triangles.
					var qPointAux = intersectionPoint;
					QuantizedSurface_.insertQPointIntoTriangleEdge(qPointAux, tri, triList, vertexList, edgeIdx, newVertexArray);
					// Here do NOT break process because there are 2 possible triangles to put qPoint into edge.***

					qPoint_insertedIntoEdgesCount += 1;

					if (qPoint_insertedIntoEdgesCount > 1)
					{
						break;
					}
				}
			}
		}
	}
};