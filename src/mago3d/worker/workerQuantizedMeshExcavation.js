'use strict';

var worker = self;

worker.onmessage = function (e) 
{
    var value_A = 3.0;
    var value_B = 5.0;
    var value_C = 0.0;

    var qMesh = e.data;
    /*
    var data = {
        info : {X: X, Y: Y, L: L},
        uValues : qMesh._uValues,
        vValues : qMesh._vValues,
        hValues : qMesh._heightValues,
        indices : qMesh._indices,
        minHeight : qMesh._minimumHeight,
        maxHeight : qMesh._maximumHeight,
        southIndices : qMesh._southIndices,
        eastIndices : qMesh._eastIndices,
        northIndices : qMesh._northIndices,
        westIndices : qMesh._westIndices,
        geoExtent : {
            minLongitude : geoExtent.minGeographicCoord.longitude,
            minLatitude : geoExtent.minGeographicCoord.latitude,
            maxLongitude : geoExtent.maxGeographicCoord.longitude,
            maxLatitude : geoExtent.maxGeographicCoord.latitude
        },
        excavationGeoCoords : excavationGeoCoords,
		excavationAltitude : excavationAltitude
    };
    */

    var workerPolygon2DTessellate;

    if(!workerPolygon2DTessellate)
    {
        var qMeshExcavationWorker = this;
        qMeshExcavationWorker.polygon2DTessellated;
        workerPolygon2DTessellate = new Worker('workerPolygon2DTessellate.js');
        
        workerPolygon2DTessellate.onmessage = function(a)
		{
			var result = a.data.result;

			qMeshExcavationWorker.polygon2DTessellated = result;
            continueProcess(e, qMeshExcavationWorker, qMesh);
		};
        
    }

    var data = {
        positions : qMesh.excavationGeoCoords
    };

    workerPolygon2DTessellate.postMessage(data); // send to worker by copy.
}
var CODE = {};

CODE.status = {
	"UNKNOWN" : 0,
	"NORMAL" : 1,
	"DELETED" : 2,
	"HIGHLIGHTED" : 3
}

CODE.cardinal = {
	"UNKNOWN" : 0,
	"SOUTH" : 1,
	"EAST" : 2,
	"NORTH" : 3,
	"WEST" : 4
}

CODE.relativePositionPoint2DWithTriangle2D = {
	"UNKNOWN" : 0,
	"OUTSIDE" : 1,
	"INSIDE" : 2,
	"COINCIDENT_WITH_TRIANGLE_POINT" : 3,
	"COINCIDENT_WITH_TRIANGLE_EDGE" : 4
}

CODE.relativePositionPoint2DWithSegment2D = {
	"UNKNOWN" : 0,
	"OUTSIDE" : 1,
	"INSIDE" : 2,
	"COINCIDENT_WITH_START_POINT" : 3,
	"COINCIDENT_WITH_END_POINT" : 4
}

CODE.relativePositionSegment2DWithSegment2D = {
	"UNKNOWN" : 0,
	"NO_INTERSECTION" : 1,
	"INTERSECTION" : 2
}

CODE.relativePositionSegment3DWithPlane2D = {
	"UNKNOWN" : 0,
	"NO_INTERSECTION" : 1,
	"INTERSECTION" : 2,
	"START_POINT_COINCIDENT" : 3,
	"END_POINT_COINCIDENT" : 4,
	"TWO_POINTS_COINCIDENT" : 5
}

CODE.relativePosition2D = {
	"UNKNOWN"    : 0,
	"LEFT"       : 1,
	"RIGHT"      : 2,
	"COINCIDENT" : 3
};

var Constant = {};
Constant.INTERSECTION_OUTSIDE = 0;
Constant.INTERSECTION_INTERSECT= 1;
Constant.INTERSECTION_INSIDE = 2;
Constant.INTERSECTION_POINT_A = 3;
Constant.INTERSECTION_POINT_B = 4;

function continueProcess(e, qMeshExcavationWorker, qMesh)
{
    var convexPolygon2dObject = qMeshExcavationWorker.polygon2DTessellated;

    // Now, do excavation.***
    // Make trianglesArray.***
	var vertexList = getVertexList(qMesh, undefined);
	qMesh.vertexList = vertexList; // store vertexList into qMesh.***

	var trianglesList = getTrianglesList(qMesh, undefined);
	qMesh.trianglesList = trianglesList; // store.***

	// Now, calculate the geoExtent of qMesh.***
	var extent = qMesh.geoExtent;
	var minLon = extent.minLongitude;
	var minLat = extent.minLatitude;
	var maxLon = extent.maxLongitude;
	var maxLat = extent.maxLatitude;

	var geoExtent = new GeographicExtent_(minLon, minLat, 0.0, maxLon, maxLat, 0.0);

	// Now, calculate qPoints of excavation geoCoords.***
	var excavationGeoCoordsFloats = qMesh.excavationGeoCoords;
	var excavationGeoCoords = [];
	var geoCoordsCount = excavationGeoCoordsFloats.length/2.0;
	for(var i=0; i<geoCoordsCount; i++)
	{
		excavationGeoCoords.push(new GeographicCoord_(excavationGeoCoordsFloats[i*2], excavationGeoCoordsFloats[i*2+1], 0.0));
	}

	var excavationQPoints = geoExtent.getQuantizedPoints(excavationGeoCoords, undefined);

	// Now, insert qPoints into trianglesList.***************************************************************************************
	var newVertexArray = [];
	insertQPointsArrayIntoTrianglesList(excavationQPoints, trianglesList, vertexList, newVertexArray);

	// Now, make segments2d of the cutting polygon.************************************************************************************
    var geoCoordsCount = excavationQPoints.length;
    var nextIdx;
    var segment2d = new Segment2D_();
    var qPoint1, qPoint2, qPointHight; // Point3D class.
    qPointHight = new Point3D_();
    var plane = new Plane_();
    for(var i=0; i<geoCoordsCount; i++)
    {
        nextIdx = getNextIdx(i, geoCoordsCount);
        qPoint1 = excavationQPoints[i];
        qPoint2 = excavationQPoints[nextIdx];

        qPointHight.set(qPoint1.x, qPoint1.y, qPoint1.z + 10000.0);
        segment2d.setPoints(new Point2D_(qPoint1.x, qPoint1.y), new Point2D_(qPoint2.x, qPoint2.y));

        // Now, make a vertical plane with qPoint1, qPoint2 and qPointHight.
        plane.set3Points(qPoint1.x, qPoint1.y, qPoint1.z,   qPoint2.x, qPoint2.y, qPoint2.z,   qPointHight.x, qPointHight.y, qPointHight.z);

        _cutTrianglesWithPlane(trianglesList, plane, segment2d, vertexList, undefined, newVertexArray);
    } 

	// Now, must classify the triangles that are inside of the excavationGeoCoords.***
    // Extract convex polygons2d.
	var convexPolygons2dArray = [];
	var convexPolygon2dIndicesArray = convexPolygon2dObject.convexPolygonIndicesArray;
	var tessellatedPolygons2dCount = convexPolygon2dIndicesArray.length; // convexPolygon2dIndicesArray.***
	for(var i=0; i<tessellatedPolygons2dCount; i++)
	{
		var point2dList = new Point2DList_();
		var convexPolygonIndices = convexPolygon2dIndicesArray[i];
		var indicesCount = convexPolygonIndices.length;
		for(var j=0; j<indicesCount; j++)
		{
			var idx = convexPolygonIndices[j];
			var excavQPoint = excavationQPoints[idx];
			var point2d = new Point2D_(excavQPoint.x, excavQPoint.y);
			point2dList.addPoint(point2d);
		}
		var polygon2d = new Polygon2D_({point2dList : point2dList});
		convexPolygons2dArray.push(polygon2d);
	}
    
    
    // Now, for each triangle, check if it is inside of the polygon2d.
    _classifyTrianglesAsInteriorOrExteriorOfPolygon(trianglesList, convexPolygons2dArray);

    // Now, for interior triangles set z -= excavationHeight, and create excavation lateral triabgles.***
	var excavationAltitude = qMesh.excavationAltitude;
	// Note : if excavationAltitude is lower than qMesh._minimumHeight or higher than qMesh._maximumHeight, the must recalculate quantized altitudes.
	var minHeight = qMesh.minHeight;
	var maxHeight = qMesh.maxHeight;
	if(excavationAltitude < minHeight)
	{
		var newMinHeight = excavationAltitude;
		var newMaxHeight = qMesh.maxHeight;
		recalculateQuantizedAltitudes(newMinHeight, newMaxHeight, minHeight, maxHeight, vertexList);

		qMesh.minHeight = newMinHeight;
		qMesh.maxHeight = newMaxHeight;
	}
	else if(excavationAltitude > maxHeight)
	{
		var newMinHeight = qMesh.minHeight;
		var newMaxHeight = excavationAltitude;
		recalculateQuantizedAltitudes(newMinHeight, newMaxHeight, minHeight, maxHeight, vertexList);

		qMesh.minHeight = newMinHeight;
		qMesh.maxHeight = newMaxHeight;
	}
	var quantizedAltitude = (excavationAltitude - qMesh.minHeight) / (qMesh.maxHeight - qMesh.minHeight) * 32767;
    createLateralTrianglesOfExcavation(trianglesList, vertexList, quantizedAltitude);

    // Now, must recalculate the skirt indices.***
    recalculateSkirtIndices(trianglesList, vertexList, qMesh);

    // Now, remake the quantized mesh.***
    _makeQuantizedMeshFromTrianglesList(trianglesList, vertexList, qMesh);

	/*
    var data = {
        info : {X: X, Y: Y, L: L},
        uValues : qMesh._uValues,
        vValues : qMesh._vValues,
        hValues : qMesh._heightValues,
        indices : qMesh._indices,
        minHeight : qMesh._minimumHeight,
        maxHeight : qMesh._maximumHeight,
        southIndices : qMesh._southIndices,
        eastIndices : qMesh._eastIndices,
        northIndices : qMesh._northIndices,
        westIndices : qMesh._westIndices,
        geoExtent : {
            minLongitude : geoExtent.minGeographicCoord.longitude,
            minLatitude : geoExtent.minGeographicCoord.latitude,
            maxLongitude : geoExtent.maxGeographicCoord.longitude,
            maxLatitude : geoExtent.maxGeographicCoord.latitude
        },
        excavationGeoCoords : excavationGeoCoords,
		excavationAltitude : excavationAltitude
    };
    */

    qMeshExcavationWorker.postMessage({result : 
        {
            uValues : qMesh.uValues, 
            vValues : qMesh.vValues,
			hValues : qMesh.hValues,
			indices : qMesh.indices,
			minHeight : qMesh.minHeight,
			maxHeight : qMesh.maxHeight,
			southIndices : qMesh.southIndices,
			eastIndices : qMesh.eastIndices,
			northIndices : qMesh.northIndices,
			westIndices : qMesh.westIndices,
        },
        info: e.data.info});
};

function recalculateQuantizedAltitudes(newMinHeight, newMaxHeight, currMinHeight, currMaxHeight, vertexList)
{
	var newHeightRange = newMaxHeight - newMinHeight;
	var currHeightRange = currMaxHeight - currMinHeight;

	var vertexCount = vertexList.getVertexCount();
	for(var i=0; i<vertexCount; i++)
	{
		var vertex = vertexList.getVertex(i);
		var pos = vertex.getPosition();
		var realHeight = currMinHeight + (pos.z / 32767) * currHeightRange;
		var newHeight = (realHeight - newMinHeight) / newHeightRange;

		pos.z = newHeight * 32767;
	}
};

function _makeQuantizedMeshFromTrianglesList(trianglesList, vertexList, resultQMesh)
{
    // this is the reverse function of "_makeTrianglesListFromQuantizedMesh".***
    var vertexCount = vertexList.getVertexCount();
    var uValues = new Uint16Array(vertexCount);
	var vValues = new Uint16Array(vertexCount);
	var hValues = new Uint16Array(vertexCount);
	
    var vertex;
    var pos;
    for(var i=0; i<vertexCount; i++)
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
    for(var i=0; i<triCount; i++)
    {
        triangle = trianglesList.getTriangle(i);
        if(triangle.getStatus() !== CODE.status.DELETED)// && triangle.getStatus() !== CODE.status.HIGHLIGHTED)
        {
            trianglesArray.push(triangle);
        }
    }

    // Now, make indices array.***
    triCount = trianglesArray.length;
    var indices = new Uint16Array(triCount * 3);
    var vtx_1, vtx_2, vtx_3;
    var status;
    for(var i=0; i<triCount; i++)
    {
        triangle = trianglesArray[i]
        vtx_1 = triangle.vertex0;
        vtx_2 = triangle.vertex1;
        vtx_3 = triangle.vertex2;

        indices[i * 3] = vtx_1.idxInList;
        indices[i * 3 + 1] = vtx_2.idxInList;
        indices[i * 3 + 2] = vtx_3.idxInList;
    }

    if(!resultQMesh)
    {
        resultQMesh = {}; // create as an object.***
    }

    resultQMesh.uValues = uValues;
    resultQMesh.vValues = vValues;
    resultQMesh.hValues = hValues;
    resultQMesh.indices = indices;

    return resultQMesh;
};

function recalculateSkirtIndices(triList, vertexList, qMesh)
{
    // All indices right to left or down to up.***
    // south & north skirt (right to left), west & east (down to up).***
    // south skirt.***
    // 1rst, must find all south triangles.***

    // find the left_down vertex (west_south).***
    var vertexCount = vertexList.getVertexCount();
    var vertex;
    var vertexSouthWest, vertexSouthEast, vertexNorthEast, vertexNorthWest;
    for(var i=0; i<vertexCount; i++)
    {
        vertex = vertexList.getVertex(i);
        if(vertex.bSouth && vertex.bWest)
        {
            vertexSouthWest = vertex;
        }
        else if(vertex.bSouth && vertex.bEast)
        {
            vertexSouthEast = vertex;
        }
        else if(vertex.bNorth && vertex.bEast)
        {
            vertexNorthEast = vertex;
        }
        else if(vertex.bNorth && vertex.bWest)
        {
            vertexNorthWest = vertex;
        }
    }

    // with vertexSouthWest, find southVertexArray.***
    var cardinal = CODE.cardinal.SOUTH;
    var southVertexArray = _getSkirtVertices(cardinal, vertexSouthWest, undefined, vertexCount);

    // East vertex array.***
    cardinal = CODE.cardinal.EAST;
    var eastVertexArray = _getSkirtVertices(cardinal, vertexSouthEast, undefined, vertexCount);

    // North vertex array.***
    cardinal = CODE.cardinal.NORTH;
    var northVertexArray = _getSkirtVertices(cardinal, vertexNorthWest, undefined, vertexCount);

    // West vertex array.***
    cardinal = CODE.cardinal.WEST;
    var westVertexArray = _getSkirtVertices(cardinal, vertexSouthWest, undefined, vertexCount);

    vertexList.setIdxInList();

    var southSkirtIndices = [];
    var skirtVertexCount = southVertexArray.length;
    for(var i=0; i<skirtVertexCount; i++)
    {
        southSkirtIndices.push(southVertexArray[i].idxInList);
    }

    var eastSkirtIndices = [];
    skirtVertexCount = eastVertexArray.length;
    for(var i=0; i<skirtVertexCount; i++)
    {
        eastSkirtIndices.push(eastVertexArray[i].idxInList);
    }

    var northSkirtIndices = [];
    skirtVertexCount = northVertexArray.length;
    for(var i=0; i<skirtVertexCount; i++)
    {
        northSkirtIndices.push(northVertexArray[i].idxInList);
    }

    var westSkirtIndices = [];
    skirtVertexCount = westVertexArray.length;
    for(var i=0; i<skirtVertexCount; i++)
    {
        westSkirtIndices.push(westVertexArray[i].idxInList);
    }

    qMesh.southIndices = new Uint16Array(southSkirtIndices);
    qMesh.eastIndices = new Uint16Array(eastSkirtIndices);
    qMesh.northIndices = new Uint16Array(northSkirtIndices);
    qMesh.westIndices = new Uint16Array(westSkirtIndices);

    var hola = 0;
};

function _getNextSkirtVertexReport(vertex, triangleMaster, cardinal)
{
    var trianglesArray = vertex.trianglesArray;
    if(!trianglesArray)
    { return undefined; }

    var report = {};

    var triCount = trianglesArray.length;
    var tri;

    if(cardinal === CODE.cardinal.SOUTH)
    {
        for(var i=0; i<triCount; i++)
        {
            tri = trianglesArray[i];
            if(tri !== triangleMaster && tri.getStatus() !== CODE.status.DELETED)
            {
                // now, check if this triangle has another south-vertex.***
                if(tri.vertex0 !== vertex && tri.vertex0.bSouth)
                {
                    report.vertex = tri.vertex0;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex1 !== vertex && tri.vertex1.bSouth)
                {
                    report.vertex = tri.vertex1;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex2 !== vertex && tri.vertex2.bSouth)
                {
                    report.vertex = tri.vertex2;
                    report.triangle = tri;
                    return report;
                }
            }
        }
    }
    else if(cardinal === CODE.cardinal.EAST)
    {
        for(var i=0; i<triCount; i++)
        {
            tri = trianglesArray[i];
            if(tri !== triangleMaster && tri.getStatus() !== CODE.status.DELETED)
            {
                // now, check if this triangle has another south-vertex.***
                if(tri.vertex0 !== vertex && tri.vertex0.bEast)
                {
                    report.vertex = tri.vertex0;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex1 !== vertex && tri.vertex1.bEast)
                {
                    report.vertex = tri.vertex1;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex2 !== vertex && tri.vertex2.bEast)
                {
                    report.vertex = tri.vertex2;
                    report.triangle = tri;
                    return report;
                }
            }
        }
    }
    else if(cardinal === CODE.cardinal.NORTH)
    {
        for(var i=0; i<triCount; i++)
        {
            tri = trianglesArray[i];
            if(tri !== triangleMaster && tri.getStatus() !== CODE.status.DELETED)
            {
                // now, check if this triangle has another south-vertex.***
                if(tri.vertex0 !== vertex && tri.vertex0.bNorth)
                {
                    report.vertex = tri.vertex0;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex1 !== vertex && tri.vertex1.bNorth)
                {
                    report.vertex = tri.vertex1;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex2 !== vertex && tri.vertex2.bNorth)
                {
                    report.vertex = tri.vertex2;
                    report.triangle = tri;
                    return report;
                }
            }
        }
    }
    else if(cardinal === CODE.cardinal.WEST)
    {
        for(var i=0; i<triCount; i++)
        {
            tri = trianglesArray[i];
            if(tri !== triangleMaster && tri.getStatus() !== CODE.status.DELETED)
            {
                // now, check if this triangle has another south-vertex.***
                if(tri.vertex0 !== vertex && tri.vertex0.bWest)
                {
                    report.vertex = tri.vertex0;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex1 !== vertex && tri.vertex1.bWest)
                {
                    report.vertex = tri.vertex1;
                    report.triangle = tri;
                    return report;
                }
                else if(tri.vertex2 !== vertex && tri.vertex2.bWest)
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

function _getSkirtVertices(cardinal, startVertex, resultVertexArray, maxIterations)
{
    if(!resultVertexArray)
    { resultVertexArray = []; }

    resultVertexArray.push(startVertex); // put the 1rst vertex of the south skirt.***
    var currVertex = startVertex;
    var currTriangle = undefined; // initially undefined.***
    var finished = false;
    if(maxIterations === undefined)
    {
        maxIterations = 35000;
    }
    var i = 0;
    while(!finished && i<maxIterations)
    {
        var report = _getNextSkirtVertexReport(currVertex, currTriangle, cardinal);

        if(report)
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

function createLateralTrianglesOfExcavation(triList, vertexList, quantizedAltitude)
{
    // Now, reset the triangles stored in each vertex.
    _recalculateTrianglesStoredInVertices(triList, vertexList);

    // 1rst, unweld triangles NORMALs & HIGHLIGHTEDs.***
    var vertexCount = vertexList.getVertexCount();
    for(var i=0; i<vertexCount; i++)
    {
        var vertex = vertexList.getVertex(i);
        var vtxTrianglesArray = vertex.trianglesArray;
        if(!vtxTrianglesArray)
        { continue; }

        // 1rst, separated triangles by status.***
        var highlightedTrianglesArray = [];
        var normalTrianglesArray = [];
        var vertexTriCount = vtxTrianglesArray.length;
        for(var j=0; j<vertexTriCount; j++)
        {
            var vertexTri = vtxTrianglesArray[j];
            var vtxTriStatus = vertexTri.getStatus();
            if(vtxTriStatus === CODE.status.NORMAL)
            {
                normalTrianglesArray.push(vertexTri);
            }
            else if(vtxTriStatus === CODE.status.HIGHLIGHTED)
            {
                highlightedTrianglesArray.push(vertexTri);
            }
        }

        // Now, create a new vertex for NORMAL triangles if exists.***
        var normalTriCount = normalTrianglesArray.length;
        var highlightedTriCount = highlightedTrianglesArray.length;

        if(normalTriCount > 0 && highlightedTriCount > 0)
        {
            // create a new vertex for NORMAL triangles.***
            var pos = vertex.getPosition();
            var newVertex = vertexList.newVertex(new Point3D_(pos.x, pos.y, pos.z));

            // store in newVertex the originalVertex as twinVertex.
            newVertex.twinVertex = vertex;

            // copy the cardinal of vertex.
            if(vertex.bSouth)
            { newVertex.bSouth = true; }
            if(vertex.bEast)
            { newVertex.bEast = true; }
            if(vertex.bNorth)
            { newVertex.bNorth = true; }
            if(vertex.bWest)
            { newVertex.bWest = true; }

            for(var j=0; j<normalTriCount; j++)
            {
                var normalTri = normalTrianglesArray[j];
                _swapTriangleVertex(normalTri, vertex, newVertex);

            }
        }
    }

    _recalculateTrianglesStoredInVertices(triList, vertexList);

    // Create lateral triangles.***
    var triCount = triList.getTrianglesCount();
    var tri;
    var status;
    var pos;
    var twinVertex1, twinVertex2;

    for(var i=0; i<triCount; i++)
    {
        tri = triList.getTriangle(i);
        status = tri.getStatus();

        if(status === CODE.status.NORMAL)
        {
            _createLateralTrianglesOfTriangle(tri, triList);
        }
    }

    // set all highlighted triangles as zero altitude.***
    var triCount = triList.getTrianglesCount();
    var tri;
    var status;
    var pos;
    for(var i=0; i<triCount; i++)
    {
        tri = triList.getTriangle(i);
        status = tri.getStatus();
        if(status === CODE.status.HIGHLIGHTED)
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

    
    var hola = 0;
};

function _recalculateTrianglesStoredInVertices(triList, vertexList)
{
    // Now, reset the triangles stored in each vertex.
    var vertexCount = vertexList.getVertexCount();
    for(var i=0; i<vertexCount; i++)
    {
        var vertex = vertexList.getVertex(i);

        if(vertex.trianglesArray)
        {
            vertex.trianglesArray.length = 0;
        }
    }

    var triCount = triList.getTrianglesCount();
    for(var i=0; i<triCount; i++)
    {
        var triangle = triList.getTriangle(i);
        _storeTriangleInVertices(triangle);
    }
};

function _isPoint2dInsideOfPolygon(point2d, convexPolygonsArray)
{
    var convexPolygons2dCount = convexPolygonsArray.length;
    var convexPoly;
    for(var i=0; i<convexPolygons2dCount; i++)
    {
        convexPoly = convexPolygonsArray[i];

        // 0 : no intersection 1 : pointCoincident, 2 : edgeCoincident. 3 : interior
        var relPos = convexPoly.getRelativePostionOfPoint2DConvexPolygon(point2d);

        if(relPos !== 0)
        {
            return true;
        }
    }

    return false;
};

function _classifyTrianglesAsInteriorOrExteriorOfPolygon(triList, convexPolygonsArray)
{
    // for each triangle, mark the triangle that is interior of the polygon2d.***
    var triCount = triList.getTrianglesCount();
    var tri;
    var centerPoint;
    var centerPoint2d = new Point2D_();
    //var report;
    var error = getError();
    for(var i=0; i<triCount; i++)
    {
        tri = triList.getTriangle(i);

        if(tri.getStatus() === CODE.status.DELETED)
        {
            continue;
        }

        // take the baricenter of the triangle.***
        centerPoint = tri.getCenterPoint(centerPoint);
        centerPoint2d.set(centerPoint.x, centerPoint.y);

        // chack if the centerPoint is inside of the polygon2d.***
        if(_isPoint2dInsideOfPolygon(centerPoint2d, convexPolygonsArray))
        {
            tri.setStatus(CODE.status.HIGHLIGHTED);
        }
        else
        {
            tri.setStatus(CODE.status.NORMAL);
        }
    }
};

function getError()
{
	return 1e-3;
}

function getProjectedTriangle2D_planeXY(triangle, resultTriangle2d)
{
    if(!resultTriangle2d)
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

function _getCoincidentVertexFromVertexArray(vertexArray, point3d, error)
{
    // this function is only for inter use.
    if(!error)
    {error = getError(); }
    var vertexCount = vertexArray.length;
    var vertex, vertexCandidate;
    var position;
    for(var i=0; i<vertexCount; i++)
    {
        vertexCandidate = vertexArray[i];
        position = vertexCandidate.getPosition();
        if(position.isCoincidentToPoint(point3d, error))
        {
            vertex = vertexCandidate;
            break;
        }
    }

    return vertex;
};

function _getOrNewVertex(vertexArray, vertexList, point3d)
{
    var error = getError();
    var resultVertex = _getCoincidentVertexFromVertexArray(vertexArray, point3d, error);
    if(!resultVertex)
    {
        resultVertex = vertexList.newVertex(point3d);
        vertexArray.push(resultVertex);
    }

    return resultVertex;
};

function _storeTriangleInVertices(triangle)
{
    var v0 = triangle.vertex0;
    var v1 = triangle.vertex1;
    var v2 = triangle.vertex2;

    if(!v0.trianglesArray)
    { v0.trianglesArray = []; }

    if(!v1.trianglesArray)
    { v1.trianglesArray = []; }

    if(!v2.trianglesArray)
    { v2.trianglesArray = []; }

    v0.trianglesArray.push(triangle);
    v1.trianglesArray.push(triangle);
    v2.trianglesArray.push(triangle);
};

function insertQPointIntoTriangle(qPoint, triangle, triList, vertexList, newVertexArray)
{
    // Here, insert the qPoint into triangle and create 3 new triangles, and then delete the original.
    // Create the 3 triangles:
    var tri1, tri2, tri3;
    var v0, v1, v2; // vertices of the original triangle.
    var qPoint3d = new Point3D_(qPoint.x, qPoint.y, qPoint.z);

    // 1rst, check if there are a coincident vertex between created vertices in the process.
    //var qVertex = vertexList.newVertex(qPoint3d);
    var qVertex = _getOrNewVertex(newVertexArray, vertexList, qPoint3d);

    v0 = triangle.vertex0;
    v1 = triangle.vertex1;
    v2 = triangle.vertex2;

    tri1 = triList.newTriangle(qVertex, v0, v1);
    tri2 = triList.newTriangle(qVertex, v1, v2);
    tri3 = triList.newTriangle(qVertex, v2, v0);

    _storeTriangleInVertices(tri1);
    _storeTriangleInVertices(tri2);
    _storeTriangleInVertices(tri3);

    tri1.setStatus(CODE.status.HIGHLIGHTED);
    tri2.setStatus(CODE.status.HIGHLIGHTED);
    tri3.setStatus(CODE.status.HIGHLIGHTED);

    // now, delete the original triangle.
    triangle.setStatus(CODE.status.DELETED);
};

function _getCardinalOfEdge(vertex_A, vertex_B)
{
    // this function returns the cardinal direction of vertices if the 2 vertices are the same cardinal direction.
    /*
    CODE.cardinal = {
	"UNKNOWN" : 0,
	"SOUTH" : 1,
	"EAST" : 2,
	"NORTH" : 3,
	"WEST" : 4
    }
    */
    if(vertex_A.bSouth)
    {
        if(vertex_B.bSouth)
        {
            return CODE.cardinal.SOUTH;
        }
    }
    else if(vertex_A.bEast)
    {
        if(vertex_B.bEast)
        {
            return CODE.cardinal.EAST;
        }
    }
    else if(vertex_A.bNorth)
    {
        if(vertex_B.bNorth)
        {
            return CODE.cardinal.NORTH;
        }
    }
    else if(vertex_A.bWest)
    {
        if(vertex_B.bWest)
        {
            return CODE.cardinal.WEST;
        }
    }

    return CODE.cardinal.UNKNOWN;
};

function _setCardinalToVertex(vertex, cardinal)
{
    if(cardinal !== CODE.cardinal.UNKNOWN)
    {
        if(cardinal === CODE.cardinal.SOUTH)
        {
            vertex.bSouth = true;
        }
        else if(cardinal === CODE.cardinal.EAST)
        {
            vertex.bEast = true;
        }
        else if(cardinal === CODE.cardinal.NORTH)
        {
            vertex.bNorth = true;
        }
        else if(cardinal === CODE.cardinal.WEST)
        {
            vertex.bWest = true;
        }
    }
};

function insertQPointIntoTriangleEdge(qPoint, triangle, triList, vertexList, edgeIdx, newVertexArray)
{
    // Here, insert the qPoint into triangle's edge.
    // 1rst, must find the 2 triangles that uses the edge. In frontier triangles, the edge can have only 1 triangle.
    // insert the qPoint into the twinTriangle's edge.***
    // Here, insert the qPoint into triangle edge and create 2 new triangles, and then delete the original.
    var tri1, tri2;
    var v0, v1, v2; // vertices of the original triangle.
    var qPoint3d = new Point3D_(qPoint.x, qPoint.y, qPoint.z);
    //var qVertex = vertexList.newVertex(qPoint3d);
    var qVertex = _getOrNewVertex(newVertexArray, vertexList, qPoint3d);

    v0 = triangle.vertex0;
    v1 = triangle.vertex1;
    v2 = triangle.vertex2;

    // Now, create 2 new triangles depending the edgeIdx.***
    //var segIdx = triangle.getSegmentIdxOfVertices(vertex_A, vertex_B);
    var cardinal = CODE.cardinal.UNKNOWN;
    if(edgeIdx === 0)
    {
        tri1 = triList.newTriangle(qVertex, v1, v2);
        tri2 = triList.newTriangle(qVertex, v2, v0);

        // check vertex_0 & vertex_1.
        cardinal = _getCardinalOfEdge(v0, v1);
        
    }
    else if(edgeIdx === 1)
    {
        tri1 = triList.newTriangle(qVertex, v2, v0);
        tri2 = triList.newTriangle(qVertex, v0, v1);

        // check vertex_1 & vertex_2.
        cardinal = _getCardinalOfEdge(v1, v2);
    }
    else if(edgeIdx === 2)
    {
        tri1 = triList.newTriangle(qVertex, v0, v1);
        tri2 = triList.newTriangle(qVertex, v1, v2);

        // check vertex_2 & vertex_0.
        cardinal = _getCardinalOfEdge(v2, v0);
    }

    _setCardinalToVertex(qVertex, cardinal);

    // store triangles into vertices, to use as vertex-triangle-map.
    _storeTriangleInVertices(tri1);
    _storeTriangleInVertices(tri2);

    // finally mark twinTriangle as "deleted".
    triangle.setStatus(CODE.status.DELETED);
    
};

function insertQPointIntoTrianglesList(qPoint, triList, vertexList, newVertexArray)
{
    var triCount = triList.getTrianglesCount();
    var tri, tri2d;
    var point;
    var plane;
    var error = getError();
    var line = new Line_();
    line.set2Points(qPoint.x, qPoint.y, 0.0, qPoint.x, qPoint.y, 30000.0);

    var qPoint_insertedIntoEdgesCount = 0;

    for(var i=0; i<triCount; i++)
    {
        tri = triList.getTriangle(i);

        if(tri.getStatus() === CODE.status.DELETED)
        {
            continue;
        }

        if(!tri.bRectXY)
        {
            tri.bRectXY = getTriangleBoundingRect(tri, undefined);
        }

        if(tri.bRectXY.intersectsWithPointXY(qPoint.x, qPoint.y))
        {
            // insert the qPoint into tri and finishes the process.
            // Need the triangle's plane.
            plane = tri.getPlane(plane);

            // Now, find the intersection point.
            var intersectionPoint = plane.intersectionLine(line);

            if(intersectionPoint)
            {
                var intersectionPoint2d = new Point2D_(intersectionPoint.x, intersectionPoint.y);
                // Finally, must check if the intersected point is inside of the triangle.
                tri2d = getProjectedTriangle2D_planeXY(tri, tri2d);
                var report = tri2d.getRelativePositionOfPoint2DReport(intersectionPoint2d, undefined, error);

                /*
                CODE.relativePositionPoint2DWithTriangle2D = {
                    "UNKNOWN" : 0,
                    "OUTSIDE" : 1,
                    "INSIDE" : 2,
                    "COINCIDENT_WITH_TRIANGLE_POINT" : 3,
                    "COINCIDENT_WITH_TRIANGLE_EDGE" : 4
                }
                */

                if(report.relPos === CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT)
                {
                    // Do nothing.***
                    var hola = 0;
                }

                if(report.relPos === CODE.relativePositionPoint2DWithTriangle2D.INSIDE)
                {
                    // Insert the "intersectionPoint" into the triangle -> create 3 triangles & delete the original.
                    insertQPointIntoTriangle(intersectionPoint, tri, triList, vertexList, newVertexArray);
                    // Break process, because there are only ONE triangle that has the qPoint inside.***
                    break;
                }
                else if(report.relPos === CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE)
                {
                    // In this case split the triangle.
                    // Must find the 2 triangles of the intersected edge.
                    var edgeIdx = report.segmentIdx;

                    // The triangle must be splitted in 2 triangles.
                    var qPointAux = intersectionPoint;
                    QuantizedSurface.insertQPointIntoTriangleEdge(qPointAux, tri, triList, vertexList, edgeIdx, newVertexArray);
                    // Here do NOT break process because there are 2 possible triangles to put qPoint into edge.***

                    qPoint_insertedIntoEdgesCount += 1;

                    if(qPoint_insertedIntoEdgesCount > 1)
                    {
                        break;
                    }
                }
            }
        }
    }
};

function insertQPointsArrayIntoTrianglesList(qPointsArray, triList, vertexList, newVertexArray)
{
    // Note: the triangles of the triList has as points quantizedPoints.
    var qPointsCount = qPointsArray.length;
    for(var i=0; i<qPointsCount; i++)
    {
        insertQPointIntoTrianglesList(qPointsArray[i], triList, vertexList, newVertexArray);
    }
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

function _cutTrianglesWithPlane(triList, plane, segment2d, vertexList, resultTrianglesArray, newVertexArray) 
{
    // This is a special function in the "QuantizedSurface".
    //*********************************************************************************************************************************************
    // The qMesh was prepared inserting vertices & refining the mesh, so all segments points are coincidents with triangles vertices.***
    //*********************************************************************************************************************************************
    var triCount = triList.getTrianglesCount();
    var tri;
    var report;
    var error = getError();
    for(var i=0; i<triCount; i++)
    {
        tri = triList.getTriangle(i);
        if(tri.getStatus() === CODE.status.DELETED)
        {
            continue;
        }

        report = tri.getIntersectionByPlaneReport(plane, undefined, error);

        // Note : if the report.length === 1, then the triangle is tangent to plane by one vertex.***

        if(report && report.length > 1)
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
            CODE.relativePositionPoint2DWithSegment2D = {
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
            if (relPosPoint2d_1.relPos === CODE.relativePositionPoint2DWithSegment2D.OUTSIDE || relPosPoint2d_2.relPos === CODE.relativePositionPoint2DWithSegment2D.OUTSIDE)
            {
                continue;
            }

            if(intersect_1.intersectionType === "segmentIntersection")
            {
                if(intersect_2.intersectionType === "segmentIntersection")
                {
                    // The triangle must be splitted in 3 triangles.
                    var qPoint_A = intersect_1.intesectPoint;
                    var qPoint_B = intersect_2.intesectPoint;
                    var edgeIdx_A = intersect_1.idx;
                    var edgeIdx_B = intersect_2.idx;
                    insert2QPointIntoTriangleEdges(qPoint_A, qPoint_B, tri, triList, vertexList, edgeIdx_A, edgeIdx_B, newVertexArray);

                }
                else if(intersect_2.intersectionType === "startPointIntersection")
                {
                    // The triangle must be splitted in 2 triangles.
                    var qPoint = intersect_1.intesectPoint;
                    var edgeIdx = intersect_1.idx;
                    insertQPointIntoTriangleEdge(qPoint, tri, triList, vertexList, edgeIdx, newVertexArray);
                }
            }
            else if(intersect_1.intersectionType === "startPointIntersection")
            {
                if(intersect_2.intersectionType === "segmentIntersection")
                {
                    // The triangle must be splitted in 2 triangles.
                    var qPoint = intersect_2.intesectPoint;
                    var edgeIdx = intersect_2.idx;
                    insertQPointIntoTriangleEdge(qPoint, tri, triList, vertexList, edgeIdx, newVertexArray);
                }
                else if(intersect_2.intersectionType === "startPointIntersection")
                {
                    // This is a tangent case. Do not splitt the triangle.
                    var hola = 0;
                }
            }
        }
        var hola = 0;
    }
    
};

function insert2QPointIntoTriangleEdges(qPoint_A, qPoint_B, triangle, triList, vertexList, edgeIdx_A, edgeIdx_B, newVertexArray)
{
    // Here, insert the qPoint_A & qPoint_B into triangle's edges.
    // Note : qPoint_A & qPoint_B are in different triangle's edges.***
    var tri1, tri2, tri3;
    var v0, v1, v2; // vertices of the original triangle.
    var qPoint3d_A = new Point3D_(qPoint_A.x, qPoint_A.y, qPoint_A.z);
    //var qVertex_A = vertexList.newVertex(qPoint3d_A);
    var qVertex_A = _getOrNewVertex(newVertexArray, vertexList, qPoint3d_A);

    var qPoint3d_B = new Point3D_(qPoint_B.x, qPoint_B.y, qPoint_B.z);
    //var qVertex_B = vertexList.newVertex(qPoint3d_B);
    var qVertex_B = _getOrNewVertex(newVertexArray, vertexList, qPoint3d_B);

    v0 = triangle.vertex0;
    v1 = triangle.vertex1;
    v2 = triangle.vertex2;

    var cardinal_A, cardinal_B;

    if(edgeIdx_A === 0)
    {
        if(edgeIdx_B === 1)
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

            cardinal_A = _getCardinalOfEdge(v0, v1);
            cardinal_B = _getCardinalOfEdge(v1, v2);
        }
        else if(edgeIdx_B === 2)
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

            cardinal_A = _getCardinalOfEdge(v0, v1);
            cardinal_B = _getCardinalOfEdge(v2, v0);
        }
    }
    else if(edgeIdx_A === 1)
    {
        if(edgeIdx_B === 0)
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

            cardinal_A = _getCardinalOfEdge(v1, v2);
            cardinal_B = _getCardinalOfEdge(v0, v1);
        }
        else if(edgeIdx_B === 2)
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

            cardinal_A = _getCardinalOfEdge(v1, v2);
            cardinal_B = _getCardinalOfEdge(v2, v0);
        }
    }
    else if(edgeIdx_A === 2)
    {
        if(edgeIdx_B === 0)
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

            cardinal_A = _getCardinalOfEdge(v2, v0);
            cardinal_B = _getCardinalOfEdge(v0, v1);
        }
        else if(edgeIdx_B === 1)
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

            cardinal_A = _getCardinalOfEdge(v2, v0);
            cardinal_B = _getCardinalOfEdge(v1, v2);
        }
    }

    _setCardinalToVertex(qVertex_A, cardinal_A);
    _setCardinalToVertex(qVertex_B, cardinal_B);

    _storeTriangleInVertices(tri1);
    _storeTriangleInVertices(tri2);
    _storeTriangleInVertices(tri3);


    // finally mark twinTriangle as "deleted".
    triangle.setStatus(CODE.status.DELETED);
    
};



function getVertexList(qMesh, resultVertexList)
{
	if(!resultVertexList)
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
	for(var i=0; i<pointsCount; i++)
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
	for(var i=0; i<indicesCount; i++)
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
	for(var i=0; i<indicesCount; i++)
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
	for(var i=0; i<indicesCount; i++)
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
	for(var i=0; i<indicesCount; i++)
	{
		idx = indicesArray[i];
        vtx = resultVertexList.getVertex(idx);
        vtx.bWest = true;
	}

	return resultVertexList;
};

function _createLateralTrianglesOfTriangle(tri, triList)
{
    // The triangle must be NORMAL type.
    var vertexA, vertexB;
    var twinVertexA = undefined; // int.***
    var twinVertexB = undefined; // int.***

    // check if has 2 vertex with twinVertex.
    if(tri.vertex0.twinVertex)
    {
        if(tri.vertex1.twinVertex)
        {
            vertexA = tri.vertex0;
            twinVertexA = tri.vertex0.twinVertex;

            vertexB = tri.vertex1;
            twinVertexB = tri.vertex1.twinVertex;
        }
        else if(tri.vertex2.twinVertex)
        {
            vertexA = tri.vertex2;
            twinVertexA = tri.vertex2.twinVertex;

            vertexB = tri.vertex0;
            twinVertexB = tri.vertex0.twinVertex;
        }
    }
    else if(tri.vertex1.twinVertex)
    {
        vertexA = tri.vertex1;
        twinVertexA = tri.vertex1.twinVertex;

        if(tri.vertex2.twinVertex)
        {
            vertexB = tri.vertex2;
            twinVertexB = tri.vertex2.twinVertex;
        }
    }

    if(twinVertexA && twinVertexB)
    {
        // create 2 triangles.***
        var tri1, tri2;
        tri1 = triList.newTriangle(twinVertexA, twinVertexB, vertexB);
        tri2 = triList.newTriangle(twinVertexA, vertexB, vertexA);
        _storeTriangleInVertices(tri1);
        _storeTriangleInVertices(tri2);
        return true;
    }
    

    return false;
};

function _swapTriangleVertex(triangle, originalVertex, newVertex)
{
    if(triangle.vertex0 === originalVertex)
    {
        triangle.vertex0 = newVertex;
        return 0;
    }
    else if(triangle.vertex1 === originalVertex)
    {
        triangle.vertex1 = newVertex;
        return 1;
    }
    else if(triangle.vertex2 === originalVertex)
    {
        triangle.vertex2 = newVertex;
        return 2;
    }

    return -1;
};

function storeTriangleInVertices(triangle)
{
    var v0 = triangle.vertex0;
    var v1 = triangle.vertex1;
    var v2 = triangle.vertex2;

    if(!v0.trianglesArray)
    { v0.trianglesArray = []; }

    if(!v1.trianglesArray)
    { v1.trianglesArray = []; }

    if(!v2.trianglesArray)
    { v2.trianglesArray = []; }

    v0.trianglesArray.push(triangle);
    v1.trianglesArray.push(triangle);
    v2.trianglesArray.push(triangle);
};

function getTriangleBoundingRect(triangle, resultBRect)
{
    // calculate the bRect of a 3d triangle using x,y only.
    if(!resultBRect)
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

function getTrianglesList(qMesh, resultTriList)
{
	if(!resultTriList)
	{
		resultTriList = new TrianglesList_();
	}

	var vertexList = qMesh.vertexList;
	var indices = qMesh.indices;

	var trianglesCount = indices.length/3;
    var idxPoint_1, idxPoint_2, idxPoint_3;
    var vtx_1, vtx_2, vtx_3;
    var triangle;

    for(var i=0; i<trianglesCount; i++)
    {
        idxPoint_1 = indices[i * 3];
        idxPoint_2 = indices[i * 3 + 1];
        idxPoint_3 = indices[i * 3 + 2];

        // check for degenerated triangles.***
        if(idxPoint_1 === idxPoint_2 || idxPoint_1 === idxPoint_3 || idxPoint_2 === idxPoint_3)
        {
            continue;
        }

        vtx_1 = vertexList.getVertex(idxPoint_1);
        vtx_2 = vertexList.getVertex(idxPoint_2);
        vtx_3 = vertexList.getVertex(idxPoint_3);

        triangle = resultTriList.newTriangle(vtx_1, vtx_2, vtx_3);

        // Now, for each vertex, make triangles-array that uses these vertices.
        storeTriangleInVertices(triangle);
    }

	return resultTriList;
};

//*************************************************************************************************************************
// Point2D.*** Point2D.*** Point2D.*** Point2D.*** Point2D.*** Point2D.*** Point2D.*** Point2D.*** Point2D.*** Point2D.***
var Point2D_ = function(x, y) 
{
	if (x) { this.x = x; }
	else { this.x = 0.0; }
	if (y) { this.y = y; }
	else { this.y = 0.0; }
	
	this.ownerVertex3d; // Aux var. This will be used for this : this Point2D is the projected ownerVertex3d into 2D
	
	/**associated this property will be used to save topologic information */
	this.associated;
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

Point2D_.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	if (targetPoint === undefined)
	{ return undefined; }
	
	if (resultVector === undefined)
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

Point2D_.prototype.set = function(x, y) 
{
	this.x = x;
	this.y = y;
};

Point2D_.prototype.isCoincidentToPoint = function(point, errorDist) 
{
	var squareDist = this.distToPoint(point);
	var coincident = false;
	if (!errorDist) 
	{
		errorDist = 10E-8;
	}

	if (squareDist < errorDist*errorDist)
	{
		coincident = true;
	}

	return coincident;
};

Point2D_.prototype.scalarProduct = function(point) 
{
	var scalarProd = this.x*point.x + this.y*point.y;
	return scalarProd;
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

//******************************************************************************************************************************
// Point2DList.*** Point2DList.*** Point2DList.*** Point2DList.*** Point2DList.*** Point2DList.*** Point2DList.*** Point2DList.***
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

//******************************************************************************************************************************
// Polygon2D.***
var Polygon2D_ = function(options) 
{
	// This is a 2D polygon.
	this.point2dList; // the border of this feature
	this.normal; // Polygon2D sense. (normal = 1) -> CCW. (normal = -1) -> CW.
	this.convexPolygonsArray; // tessellation result.
	this.bRect; // boundary rectangle.

	if(options)
	{
		if(options.point2dList)
		{
			this.point2dList = options.point2dList;
		}
	}
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

//**************************************************************************************************************************
// Point3D.*** Point3D.*** Point3D.*** Point3D.*** Point3D.*** Point3D.*** Point3D.*** Point3D.*** Point3D.*** Point3D.***
var Point3D_ = function(x, y, z) 
{
	if (x !== undefined)
	{ this.x = x; }
	else
	{ this.x = 0.0; }
	
	if (y !== undefined)
	{ this.y = y; }
	else
	{ this.y = 0.0; }
	
	if (z !== undefined)
	{ this.z = z; }
	else
	{ this.z = 0.0; }
	
	this.pointType; // 1 = important point.
};

Point3D_.prototype.set = function(x, y, z) 
{
	this.x = x; this.y = y; this.z = z;
};

Point3D_.prototype.getSquaredModul = function() 
{
	return this.x*this.x + this.y*this.y + this.z*this.z;
};

Point3D_.prototype.getModul = function() 
{
	return Math.sqrt(this.getSquaredModul());
};

Point3D_.prototype.getVectorToPoint = function(targetPoint, resultVector) 
{
	// this returns a vector that points to "targetPoint" from "this".
	// the "resultVector" has the direction from "this" to "targetPoint", but is NOT normalized.
	if (targetPoint === undefined)
	{ return undefined; }
	
	if (resultVector === undefined)
	{ resultVector = new Point3D_(); }
	
	resultVector.set(targetPoint.x - this.x, targetPoint.y - this.y, targetPoint.z - this.z);
	
	return resultVector;
};

Point3D_.prototype.unitary = function() 
{
	var modul = this.getModul();
	this.x /= modul;
	this.y /= modul;
	this.z /= modul;
};

Point3D_.prototype.crossProduct = function(point, resultPoint) 
{
	if (resultPoint === undefined) { resultPoint = new Point3D_(); }

	resultPoint.x = this.y * point.z - point.y * this.z;
	resultPoint.y = point.x * this.z - this.x * point.z;
	resultPoint.z = this.x * point.y - point.x * this.y;

	return resultPoint;
};

Point3D_.prototype.squareDistTo = function(x, y, z) 
{
	var dx = this.x - x;
	var dy = this.y - y;
	var dz = this.z - z;

	return dx*dx + dy*dy + dz*dz;
};

Point3D_.prototype.squareDistToPoint = function(point) 
{
	var dx = this.x - point.x;
	var dy = this.y - point.y;
	var dz = this.z - point.z;

	return dx*dx + dy*dy + dz*dz;
};

Point3D_.prototype.distTo = function(x, y, z) 
{
	return Math.sqrt(this.squareDistTo(x, y, z));
};

Point3D_.prototype.distToPoint = function(point) 
{
	return Math.sqrt(this.squareDistToPoint(point));
};

Point3D_.prototype.isCoincidentToPoint = function(point, errorDist) 
{
	var dist = this.distToPoint(point);
	var coincident = false;
	if (dist < errorDist)
	{
		coincident = true;
	}

	return coincident;
};

//***************************************************************************************************************************
// Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.*** Line.***
var Line_ = function(point, direction) 
{
	// (x,y,z) = (x0,y0,z0) + lambda * (u, v, w);
	if (point !== undefined)
	{ this.point = new Point3D_(point.x, point.y, point.z); }
	else
	{ this.point = new Point3D_(); }
	
	if (direction !== undefined)
	{ this.direction = direction; }
	else
	{ this.direction = new Point3D_(); }
};

Line_.prototype.setPointAndDir = function(px, py, pz, dx, dy, dz) 
{
	// Note: dx, dy, dz must be unitary.
	this.point.set(px, py, pz);
	this.direction.set(dx, dy, dz);
	this.direction.unitary();
};

Line_.prototype.set2Points = function(px, py, pz, px2, py2, pz2) 
{
	// Calculate the direction.
	var dir = new Point3D_(px2 - px, py2 - py, pz2 - pz);
	dir.unitary();

	this.setPointAndDir(px, py, pz, dir.x, dir.y, dir.z);
};

//***************************************************************************************************************************
// Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.*** Plane.***
var Plane_ = function() 
{
	// ax+by+cz+d = 0 plane.
	// a*x + b*y + c*z + d = 0
	// where (a,b,c) is the normal, and d is negative distance to origin.
	this.a = 0.0;
	this.b = 0.0;
	this.c = 0.0;
	this.d = 0.0;
};

Plane_.prototype.setPointAndNormal = function(px, py, pz, nx, ny, nz) 
{
	this.a = nx;
	this.b = ny;
	this.c = nz;
	this.d = -this.a*px -this.b*py - this.c*pz;
};

Plane_.prototype.set3Points = function(x1, y1, z1,   x2, y2, z2,   x3, y3, z3) 
{
	var point1 = new Point3D_(x1, y1, z1);
	var point2 = new Point3D_(x2, y2, z2);
	var point3 = new Point3D_(x3, y3, z3);

	// now, calculate normal.
	var normal = Triangle_.calculateNormal(point1, point2, point3, undefined);

	this.setPointAndNormal(x1, y1, z1, normal.x, normal.y, normal.z);
};

Plane_.prototype.intersectionLine = function(line, intersectionPoint) 
{
	var r = line.point.x;
	var s = line.point.y;
	var t = line.point.z;
	
	var u = line.direction.x;
	var v = line.direction.y;
	var w = line.direction.z;
	
	var den = this.a * u + this.b * v + this.c * w;
	
	if (Math.abs(den) > 10E-8) 
	{
		var alfa = -((this.a * r + this.b * s + this.c * t + this.d)/(den));
		
		if (intersectionPoint === undefined) { intersectionPoint = new Point3D_(); }
		
		intersectionPoint.set(r + alfa * u, s + alfa * v, t + alfa * w);
		return intersectionPoint;
	}
	else { return undefined; }
};

Plane_.prototype.intersectionSphere = function(sphere) 
{
	if (sphere === undefined || sphere.centerPoint === undefined)
	{ return Constant.INTERSECTION_OUTSIDE; }
	
	var sphereCenter = sphere.centerPoint;
	
	// calculate the distance by dotProduct.
	// sphere centerPoint = (x1, y1, z1), distance = |ax1 + by1 + cz1 + d|/sqrt(a*a +b*b + c*c*).
	// note: the module sqrt(a*a +b*b + c*c*) = 1, so no necessary divide distance by module.
	var distance = sphereCenter.x * this.a + sphereCenter.y * this.b + sphereCenter.z * this.c + this.d;

	if (distance < -sphere.r)
	{
		// The sphere is rear of the plane.
		return Constant.INTERSECTION_OUTSIDE;
	}
	else if (distance < sphere.r)
	{
		// The sphere intersects the plane.
		return Constant.INTERSECTION_INTERSECT;
	}

	// The sphere if in front of the plane.
	return Constant.INTERSECTION_INSIDE;
};

Plane_.prototype.getRelativePositionOfThePoint = function(point, error) 
{
	if(error === undefined)
	{
		error = 1e-8;
	}

	var distance = point.x * this.a + point.y * this.b + point.z * this.c + this.d;

	if (distance < -error)
	{
		// The point is rear of the plane.
		return Constant.INTERSECTION_OUTSIDE;
	}
	else if (distance > error)
	{
		// The point if in front of the plane.
		return Constant.INTERSECTION_INSIDE;
	}

	// The point intersects the plane.
	return Constant.INTERSECTION_INTERSECT;
};

Plane_.prototype.getRelativePositionOfTheSegment = function(segment, error) 
{
	// a segment can be:
	// 1) in front of the plane.
	// 2) rear of the plane.
	// 3) intersection with the plane (one point is in front of the plane and the other point is rear of the plane).
	// 4) one point is coincident with the plane.
	// 5) two points is coincident with the plane (segement is in plane).
	//-----------------------------------------------------------------------
	if(error === undefined)
	{
		error = 1e-8;
	}

	/*
	CODE.relativePositionSegment3DWithPlane2D = {
		"UNKNOWN" : 0,
		"NO_INTERSECTION" : 1,
		"INTERSECTION" : 2,
		"START_POINT_COINCIDENT" : 3,
		"END_POINT_COINCIDENT" : 4,
		"TWO_POINTS_COINCIDENT" : 5
	}*/

	var startPoint = segment.startPoint3d;
	var endPoint = segment.endPoint3d;

	var relPosStartPoint = this.getRelativePositionOfThePoint(startPoint, error);
	var relPosEndPoint = this.getRelativePositionOfThePoint(endPoint, error);
	var resultRelPos = CODE.relativePositionSegment3DWithPlane2D.UNKNOWN;

	if(relPosStartPoint === Constant.INTERSECTION_INSIDE)
	{
		// startPoint is in front of the plane.
		if(relPosEndPoint === Constant.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.NO_INTERSECTION;
		}
		else if(relPosEndPoint === Constant.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.INTERSECTION;
		}
		else if(relPosEndPoint === Constant.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.END_POINT_COINCIDENT;
		}
	}
	else if(relPosStartPoint === Constant.INTERSECTION_OUTSIDE)
	{
		// startPoint is rear of the plane.
		if(relPosEndPoint === Constant.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.INTERSECTION;
		}
		else if(relPosEndPoint === Constant.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.NO_INTERSECTION;
		}
		else if(relPosEndPoint === Constant.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.END_POINT_COINCIDENT;
		}
	}
	else if(relPosStartPoint === Constant.INTERSECTION_INTERSECT)
	{
		// startPoint is coincident with the plane.
		if(relPosEndPoint === Constant.INTERSECTION_INSIDE)
		{
			// endPoint is in front of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT;
		}
		else if(relPosEndPoint === Constant.INTERSECTION_OUTSIDE)
		{
			// endPoint is rear of the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT;
		}
		else if(relPosEndPoint === Constant.INTERSECTION_INTERSECT)
		{
			// endPoint is coincident with the plane.
			resultRelPos = CODE.relativePositionSegment3DWithPlane2D.TWO_POINTS_COINCIDENT;
		}
	}

	return resultRelPos;
};

//**************************************************************************************************************************
// BoundingRect.*** BoundingRect.*** BoundingRect.*** BoundingRect.*** BoundingRect.*** BoundingRect.*** BoundingRect.***
var BoundingRectangle_ = function(x, y) 
{
	this.minX = Number.MAX_VALUE;
	this.maxX = Number.MIN_VALUE;
	this.minY = Number.MAX_VALUE;
	this.maxY = Number.MIN_VALUE;
};

BoundingRectangle_.prototype.setInitXY = function(x, y)
{
	this.minX = x;
	this.minY = y;
	this.maxX = x;
	this.maxY = y;
}

BoundingRectangle_.prototype.setInit = function(point)
{
	if (point === undefined)
	{ return; }
	
	this.minX = point.x;
	this.minY = point.y;
	this.maxX = point.x;
	this.maxY = point.y;
};

BoundingRectangle_.prototype.addPointXY = function(x, y)
{
	if (x < this.minX)
	{ this.minX = x; }
	else if (x > this.maxX)
	{ this.maxX = x; }
	
	if (y < this.minY)
	{ this.minY = y; }
	else if (y > this.maxY)
	{ this.maxY = y; }
};

BoundingRectangle_.prototype.addPoint = function(point)
{
	if (point === undefined)
	{ return; }
	
	if (point.x < this.minX)
	{ this.minX = point.x; }
	else if (point.x > this.maxX)
	{ this.maxX = point.x; }
	
	if (point.y < this.minY)
	{ this.minY = point.y; }
	else if (point.y > this.maxY)
	{ this.maxY = point.y; }
};

BoundingRectangle_.prototype.intersectsWithPointXY = function(x, y)
{
	if (x > this.maxX)
	{ return false; }
	else if (x < this.minX)
	{ return false; }
	else if (y > this.maxY)
	{ return false; }
	else if (y < this.minY)
	{ return false; }
	
	return true;
};

BoundingRectangle_.prototype.intersectsWithPoint2D = function(point2D)
{
	if (point2D === undefined)
	{ return false; }
	
	if (point2D.x > this.maxX)
	{ return false; }
	else if (point2D.x < this.minX)
	{ return false; }
	else if (point2D.y > this.maxY)
	{ return false; }
	else if (point2D.y < this.minY)
	{ return false; }
	
	return true;
};

//**************************************************************************************************************************
// Vertex.*** Vertex.*** Vertex.*** Vertex.*** Vertex.*** Vertex.*** Vertex.*** Vertex.*** Vertex.*** Vertex.*** Vertex.***
var Vertex_ = function(position) 
{
	this.point3d;
	this.normal;
	this.texCoord;
	this.color4; // class: Color.
	this.outingHedge; // class: HalfEdge
	this.vertexType;
	this.idxInList;
	
	if (position)
	{ this.point3d = position; }
	else
	{
		this.point3d = new Point3D_();
	}
};

Vertex_.prototype.getPosition = function() 
{
	return this.point3d;
};

//**************************************************************************************************************************
// VertexLust.*** VertexLust.*** VertexLust.*** VertexLust.*** VertexLust.*** VertexLust.*** VertexLust.*** VertexLust.***
var VertexList_ = function() 
{
	this.vertexArray = [];
};

VertexList_.prototype.newVertex = function(point3d) 
{
	var vertex = new Vertex_(point3d);
	this.vertexArray.push(vertex);
	return vertex;
};

VertexList_.prototype.getVertex = function(idx) 
{
	return this.vertexArray[idx];
};

VertexList_.prototype.getVertexCount = function() 
{
	return this.vertexArray.length;
};

VertexList_.prototype.setIdxInList = function()
{
	VertexList_.setIdxInList(this.vertexArray);
};

VertexList_.setIdxInList = function(vertexArray)
{
	if (vertexArray === undefined)
	{ return; }
	
	for (var i = 0, vertexCount = vertexArray.length; i < vertexCount; i++) 
	{
		vertexArray[i].idxInList = i;
	}
};

//*************************************************************************************************************************
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
	{ resultIntersectPoint = new Point2D(); }
	
	resultIntersectPoint.set(intersectX, intersectY);
	return resultIntersectPoint;
};

Line2D_.prototype.getProjectedPoint = function(point, projectedPoint) 
{
	if (point === undefined)
	{ return undefined; }
	
	if (projectedPoint === undefined)
	{ projectedPoint = new Point2D_(); }
	
	var perpendicular = this.getPerpendicularLeft(point);
	projectedPoint = this.intersectionWithLine(perpendicular, projectedPoint);
	
	return projectedPoint;
};

Line2D_.prototype.getPerpendicularLeft = function(point) 
{
	var perpendicular = new Line2D_();
	
	if (point)
	{ perpendicular.point.set(point.x, point.y); }
	else
	{ perpendicular.point.set(this.point.x, this.point.y); }
	
	perpendicular.direction.set(-this.direction.y, this.direction.x);
	return perpendicular;
};

Line2D_.prototype.getRelativeSideOfPoint = function(point, error) 
{
	if (error === undefined)
	{ error = 10E-8; }

	var projectPoint = this.getProjectedPoint(point);

	var squaredDist = point.squareDistToPoint(projectPoint);
	
	if (squaredDist < error*error)
	{ return CODE.relativePosition2D.COINCIDENT; }

	var vector = new Point2D_(point.x - projectPoint.x, point.y - projectPoint.y);
	vector.unitary();

	// gET OUR LEFT LINE.***
	var myLeft = this.getPerpendicularLeft(point);
	var scalar = myLeft.direction.scalarProduct(vector);

	if (scalar < 0.0) 
	{
		return CODE.relativePosition2D.RIGHT;
	}
	else 
	{
		return CODE.relativePosition2D.LEFT;
	}

	/*if ((Math.abs(vector.x-this.direction.y) < error) && (Math.abs(vector.y+this.direction.x) < error)) 
	{
		return CODE.relativePosition2D.RIGHT;
	}
	else 
	{
		return CODE.relativePosition2D.LEFT;
	}

	return CODE.relativePosition2D.UNKNOWN;*/
};

Line2D_.prototype.isCoincidentPoint = function(point, error) 
{
	if (point === undefined)
	{ return false; }
	
	if (error === undefined)
	{ error = 10E-8; }
	
	var projectedPoint = this.getProjectedPoint(point, projectedPoint);
	
	var squaredDist = point.squareDistToPoint(projectedPoint);

	if (squaredDist < error*error)
	{ return true; }
	
	return false;
};

//************************************************************************************************************************
// Segment2D.*** Segment2D.*** Segment2D.*** Segment2D.*** Segment2D.*** Segment2D.*** Segment2D.*** Segment2D.*** Segment2D.***
var Segment2D_ = function(strPoint2D, endPoint2D) 
{
	this.startPoint2d;
	this.endPoint2d;
	
	if (strPoint2D)
	{
		this.startPoint2d = strPoint2D;
	}
	
	if (endPoint2D)
	{
		this.endPoint2d = endPoint2D;
	}
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

Segment2D_.prototype.getSquaredLength = function()
{
	return this.startPoint2d.squareDistToPoint(this.endPoint2d);
};

Segment2D_.prototype.getLength = function()
{
	return Math.sqrt(this.getSquaredLength());
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
		result = new Point2D();
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

Segment2D_.prototype.intersectionWithPoint = function(point, error)
{
	if (point === undefined)
	{
		return undefined;
	}
	
	if (error === undefined)
	{
		error = 10E-8;
	}
	
	var line = this.getLine();
	if (!line.isCoincidentPoint(point, error))
	{
		// no intersection
		return Constant.INTERSECTION_OUTSIDE;
	}
	
	return this.intersectionWithPointByDistances(point, error);
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

Segment2D_.prototype.getBoundingRectangle = function(result)
{
	if (result === undefined)
	{
		result = new BoundingRectangle_();
	}
	
	result.setInit(this.startPoint2d);
	result.addPoint(this.endPoint2d);
	
	return result;
};

Segment2D_.prototype.getRelativePositionOfPoint2DReport = function(point2d, resultReport, error)
{
	// a point2d can be:
	// 1) outside.
	// 2) inside.
	// 3) coincident with startPoint.
	// 4) coincident with endPoint.
	//----------------------------------------

	/*
	CODE.relativePositionPoint2DWithSegment2D = {
		"UNKNOWN" : 0,
		"OUTSIDE" : 1,
		"INSIDE" : 2,
		"COINCIDENT_WITH_START_POINT" : 3,
		"COINCIDENT_WITH_END_POINT" : 4
	}
	*/
	if(resultReport === undefined)
	{
		resultReport = {};
	}
	resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.UNKNOWN;

	// check by boundingRectangle.***
	var boundingRect = this.getBoundingRectangle();
	if(!boundingRect.intersectsWithPoint2D(point2d))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.OUTSIDE;
		return resultReport;
	}

	if(error === undefined)
	{ error = 1e-8; }

	// check if point2d is coincident with startPoint.
	if(point2d.isCoincidentToPoint(this.startPoint2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_START_POINT;
		return resultReport;
	}

	if(point2d.isCoincidentToPoint(this.endPoint2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_END_POINT;
		return resultReport;
	}

	// Check if the point2d is coincident with the segment's line.
	var line = this.getLine();
	if (!line.isCoincidentPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.OUTSIDE;
		return resultReport;
	}
	else
	{
		// The point2d is coincident with the line.
		/*
		return Constant.INTERSECTION_POINT_A;
		return Constant.INTERSECTION_POINT_B;
		return Constant.INTERSECTION_OUTSIDE;
		return Constant.INTERSECTION_INSIDE;
		*/
		var intersectionType = this.intersectionWithPointByDistances(point2d, error);
		if(intersectionType === Constant.INTERSECTION_POINT_A)
		{
			resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_START_POINT;
			return resultReport;
		}
		else if(intersectionType === Constant.INTERSECTION_POINT_B)
		{
			resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.COINCIDENT_WITH_END_POINT;
			return resultReport;
		}
		else if(intersectionType === Constant.INTERSECTION_OUTSIDE)
		{
			resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.OUTSIDE;
			return resultReport;
		}
		else if(intersectionType === Constant.INTERSECTION_INSIDE)
		{
			resultReport.relPos = CODE.relativePositionPoint2DWithSegment2D.INSIDE;
			return resultReport;
		}
	}

	return resultReport;

};

//*************************************************************************************************************************
// Segment3D.*** Segment3D.*** Segment3D.*** Segment3D.*** Segment3D.*** Segment3D.*** Segment3D.*** Segment3D.*** Segment3D.***
var Segment3D_ = function(strPoint3D, endPoint3D) 
{
	this.startPoint3d;
	this.endPoint3d;
	
	if (strPoint3D)
	{
		this.startPoint3d = strPoint3D;
	}
	
	if (endPoint3D)
	{
		this.endPoint3d = endPoint3D;
	}
};

Segment3D_.prototype.setPoints = function(strPoint3D, endPoint3D)
{
	if (strPoint3D)
	{
		this.startPoint3d = strPoint3D;
	}
	
	if (endPoint3D)
	{
		this.endPoint3d = endPoint3D;
	}
};

Segment3D_.prototype.getVector = function(result)
{
	if (this.startPoint3d === undefined || this.endPoint3d === undefined)
	{
		return undefined;
	}
	
	if (result === undefined)
	{
		result = new Point3D_();
	}
	
	result = this.startPoint3d.getVectorToPoint(this.endPoint3d, result);
	return result;
};

Segment3D_.prototype.getDirection = function(result)
{
	if (result === undefined)
	{
		result = new Point3D_();
	}
	
	result = this.getVector(result);
	result.unitary();
	
	return result;
};

Segment3D_.prototype.getLine = function(resultLine)
{
	if (resultLine === undefined)
	{ resultLine = new Line_(); }
	
	var direction = this.getDirection();
	resultLine.setPointAndDir(this.startPoint3d.x, this.startPoint3d.y, this.startPoint3d.z, direction.x, direction.y, direction.z);
	
	return resultLine;
};

Segment3D_.prototype.getLength = function()
{
	return this.startPoint3d.distToPoint(this.endPoint3d);
};

Segment3D_.prototype.intersectionWithPoint = function(point, error)
{
	if (point === undefined)
	{ return false; }
	
	// calculate the distance.
	if (error === undefined)
	{ error = 10E-8; }
	
	var totalLength = this.getLength();
	var distA = this.startPoint3d.distToPoint(point);
	var distB = this.endPoint3d.distToPoint(point);
	
	var diff = totalLength - distA - distB;
	if (Math.abs(diff) < error)
	{ return true; }
	
	return false;
};

//*************************************************************************************************************************
// Triangle2D.*** Triangle2D.*** Triangle2D.*** Triangle2D.*** Triangle2D.*** Triangle2D.*** Triangle2D.*** Triangle2D.***
var Triangle2D_ = function(point2d0, point2d1, point2d2) 
{
	this.point2d0;
	this.point2d1;
	this.point2d2;
	
	if (point2d0 !== undefined)
	{ this.point2d0 = point2d0; }
	
	if (point2d1 !== undefined)
	{ this.point2d1 = point2d1; }
	
	if (point2d2 !== undefined)
	{ this.point2d2 = point2d2; }
};

Triangle2D_.prototype.setPoints = function(point2d0, point2d1, point2d2) 
{
	this.point2d0 = point2d0;
	this.point2d1 = point2d1;
	this.point2d2 = point2d2;
};

Triangle2D_.prototype.getSegment2D = function(idx) 
{
	var seg2d = new Segment2D_();

	if(idx === 0)
	{
		seg2d.setPoints(this.point2d0, this.point2d1);
	}
	else if(idx === 1)
	{
		seg2d.setPoints(this.point2d1, this.point2d2);
	}
	else if(idx === 2)
	{
		seg2d.setPoints(this.point2d2, this.point2d0);
	}

	return seg2d;
};

Triangle2D_.sign = function(p1, p2, p3) 
{
	return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

Triangle2D_.prototype.isPoint2dInside = function(point2d) 
{
	var sign1 = Triangle2D_.sign(point2d, this.point2d0, this.point2d1) < 0;
	var sign2 = Triangle2D_.sign(point2d, this.point2d1, this.point2d2) < 0;
	var sign3 = Triangle2D_.sign(point2d, this.point2d2, this.point2d0) < 0;
	
	var isInside = ((sign1 === sign2) && (sign2 === sign3));
	return isInside;
};

Triangle2D_.prototype.getRelativePositionOfPoint2DReport = function(point2d, resultReport, error) 
{
	// a point can be:
	// 1) outside of the triangle.
	// 2) inside of the triangle.
	// 3) coincident with any points of the triangle.
	// 4) coincident with any segment of the triangle.
	//-------------------------------------------------------------

	// 1rst, check if the point is coincident with any point of the triangle.
	if(error === undefined)
	{ error = 1e-8; }

	/*
	CODE.relativePositionPoint2DWithTriangle2D = {
		"UNKNOWN" : 0,
		"OUTSIDE" : 1,
		"INSIDE" : 2,
		"COINCIDENT_WITH_TRIANGLE_POINT" : 3,
		"COINCIDENT_WITH_TRIANGLE_EDGE" : 4
	}
	*/

	if(resultReport === undefined)
	{
		resultReport = {};
	}
	resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.UNKNOWN;

	if(this.point2d0.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 0;
		return resultReport;
	}

	if(this.point2d1.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 1;
		return resultReport;
	}

	if(this.point2d2.isCoincidentToPoint(point2d, error))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_POINT;
		resultReport.pointIdx = 2;
		return resultReport;
	}

	// Check if is coincident with any triangle edge.
	//Constant.INTERSECTION_POINT_A;
	//Constant.INTERSECTION_POINT_B;
	//Constant.INTERSECTION_OUTSIDE;
	//Constant.INTERSECTION_INSIDE;

	var segmentIdx = 0;
	var seg2d = this.getSegment2D(segmentIdx);
	if(seg2d.intersectionWithPointByDistances(point2d, error) === Constant.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}

	segmentIdx = 1;
	seg2d = this.getSegment2D(segmentIdx);
	if(seg2d.intersectionWithPointByDistances(point2d, error) === Constant.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}

	segmentIdx = 2;
	seg2d = this.getSegment2D(segmentIdx);
	if(seg2d.intersectionWithPointByDistances(point2d, error) === Constant.INTERSECTION_INSIDE)
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE;
		resultReport.segmentIdx = segmentIdx;
		return resultReport;
	}
	
	// Now, check if the point2d is inside or outside of the triangle.
	if(this.isPoint2dInside(point2d))
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.INSIDE;
		return resultReport;
	}
	else
	{
		resultReport.relPos = CODE.relativePositionPoint2DWithTriangle2D.OUTSIDE;
		return resultReport;
	}
};

//**************************************************************************************************************************
// BoundingBox.*** BoundingBox.*** BoundingBox.*** BoundingBox.*** BoundingBox.*** BoundingBox.*** BoundingBox.*** BoundingBox.***
var BoundingBox_ = function() 
{
	this.minX = 1000000.0;
	this.minY = 1000000.0;
	this.minZ = 1000000.0;

	this.maxX = -1000000.0;
	this.maxY = -1000000.0;
	this.maxZ = -1000000.0;
};

BoundingBox_.prototype.init = function(point) 
{
	point = point || new Point3D_();

	this.minX = point.x;
	this.minY = point.y;
	this.minZ = point.z;

	this.maxX = point.x;
	this.maxY = point.y;
	this.maxZ = point.z;
};

BoundingBox_.prototype.addPoint = function(point) 
{
	if (point === undefined)	{ return; }

	if (point.x < this.minX) { this.minX = point.x; }
	else if (point.x > this.maxX) { this.maxX = point.x; }

	if (point.y < this.minY) { this.minY = point.y; }
	else if (point.y > this.maxY) { this.maxY = point.y; }

	if (point.z < this.minZ) { this.minZ = point.z; }
	else if (point.z > this.maxZ) { this.maxZ = point.z; }
};

BoundingBox_.prototype.getCenterPoint = function(result) 
{
	if ( result === undefined ) { result = new Point3D_(); }
	result.set((this.maxX + this.minX)/2, (this.maxY + this.minY)/2, (this.maxZ + this.minZ)/2);
	return result;
};

BoundingBox_.prototype.getMaxLength = function() 
{
	return Math.max(this.maxX - this.minX, this.maxY - this.minY, this.maxZ - this.minZ);
};

BoundingBox_.prototype.getRadiusAprox = function() 
{
	var maxLength = this.getMaxLength();
	return maxLength/1.5;
};

BoundingBox_.prototype.getBoundingSphere = function(resultBoundingSphere) 
{
	if (resultBoundingSphere === undefined)
	{ resultBoundingSphere = new BoundingSphere_(); } 
	
	var centerPos = this.getCenterPoint();
	resultBoundingSphere.setCenterPoint(centerPos.x, centerPos.y, centerPos.z);
	resultBoundingSphere.setRadius(this.getRadiusAprox());
	
	return resultBoundingSphere;
};

//************************************************************************************************************************
// BoundingSphere.*** BoundingSphere.*** BoundingSphere.*** BoundingSphere.*** BoundingSphere.*** BoundingSphere.*** BoundingSphere.***
var BoundingSphere_ = function(x, y, z, radius) 
{
	this.centerPoint = new Point3D_();
	if (x !== undefined && y !== undefined && z !== undefined)
	{ this.centerPoint.set(x, y, z); }
	this.r = 0.0;
	if (radius !== undefined)
	{ this.r = radius; }
};

BoundingSphere_.prototype.setRadius = function(radius) 
{
	this.r = radius;
};

BoundingSphere_.prototype.setCenterPoint = function(x, y, z) 
{
	this.centerPoint.set(x, y, z);
};

//**************************************************************************************************************************
// Triangle.*** Triangle.*** Triangle.*** Triangle.*** Triangle.*** Triangle.*** Triangle.*** Triangle.*** Triangle.***
var Triangle_ = function(vertex0, vertex1, vertex2) 
{
	this.vertex0;
	this.vertex1;
	this.vertex2;
	this.vtxIdx0;
	this.vtxIdx1;
	this.vtxIdx2;
	this.normal; 
	
	if (vertex0 !== undefined) {
	    this.vertex0 = vertex0; 
    }
	
	if (vertex1 !== undefined)
	{ this.vertex1 = vertex1; }
	
	if (vertex2 !== undefined)
	{ this.vertex2 = vertex2; }
	
	this.hEdge;

	this.status = CODE.status.NORMAL; // this var indicates the status of the triangle.
	// If no exist status, then the status is "NORMAL".***
	// Status can be "DELETED", "NORMAL", etc.***

	// auxiliar vars:
	this.bRectXY; // bounding rectangle of the triangle projected in the plane XY.
};

Triangle_.prototype.setStatus = function(status) 
{
	this.status = status;
};

Triangle_.prototype.getStatus = function() 
{
	return this.status;
};

Triangle_.prototype.getCrossProduct = function(idxVertex, resultCrossProduct) 
{
	if (resultCrossProduct === undefined)
	{ resultCrossProduct = new Point3D_(); }

	var currentPoint, prevPoint, nextPoint;

	if (idxVertex === 0)
	{
		currentPoint = this.vertex0.point3d;
		prevPoint = this.vertex2.point3d;
		nextPoint = this.vertex1.point3d;
	}
	else if (idxVertex === 1)
	{
		currentPoint = this.vertex1.point3d;
		prevPoint = this.vertex0.point3d;
		nextPoint = this.vertex2.point3d;
	}
	else if (idxVertex === 2)
	{
		currentPoint = this.vertex2.point3d;
		prevPoint = this.vertex1.point3d;
		nextPoint = this.vertex0.point3d;
	}

	var v1 = new Point3D_();
	var v2 = new Point3D_();

	v1.set(currentPoint.x - prevPoint.x,     currentPoint.y - prevPoint.y,     currentPoint.z - prevPoint.z);
	v2.set(nextPoint.x - currentPoint.x,     nextPoint.y - currentPoint.y,     nextPoint.z - currentPoint.z);

	v1.unitary();
	v2.unitary();

	resultCrossProduct = v1.crossProduct(v2, resultCrossProduct);

	return resultCrossProduct;
};

Triangle_.calculateNormal = function(point1, point2, point3, resultNormal) 
{
	// Given 3 points, this function calculates the normal.
	var currentPoint = point1;
	var prevPoint = point3;
	var nextPoint = point2;

	var v1 = new Point3D_(currentPoint.x - prevPoint.x,     currentPoint.y - prevPoint.y,     currentPoint.z - prevPoint.z);
	var v2 = new Point3D_(nextPoint.x - currentPoint.x,     nextPoint.y - currentPoint.y,     nextPoint.z - currentPoint.z);

	v1.unitary();
	v2.unitary();
	if (resultNormal === undefined)
	{ resultNormal = new Point3D_(); }
	
	resultNormal = v1.crossProduct(v2, resultNormal);
	resultNormal.unitary();
	
	return resultNormal;
};

Triangle_.prototype.calculatePlaneNormal = function() 
{
	if (this.normal === undefined)
	{ this.normal = new Point3D_(); }

	this.getCrossProduct(0, this.normal);
	this.normal.unitary();
};

Triangle_.prototype.getPlaneNormal = function() 
{
	if (this.normal === undefined)
	{ this.calculatePlaneNormal(); }
	
	return this.normal;
};

Triangle_.prototype.getCenterPoint = function(resultCenterPoint) 
{
	if(!resultCenterPoint)
	{
		resultCenterPoint = new Point3D_();
	}

	var p0 = this.vertex0.getPosition();
	var p1 = this.vertex1.getPosition();
	var p2 = this.vertex2.getPosition();

	resultCenterPoint.set((p0.x + p1.x + p2.x)/3.0, (p0.y + p1.y + p2.y)/3.0, (p0.z + p1.z + p2.z)/3.0);

	return resultCenterPoint;
};

Triangle_.prototype.getPlane = function(resultPlane) 
{
	if (resultPlane === undefined)
	{ resultPlane = new Plane_(); }
	
	// make a plane with the point3d of the vertex0 & the normal.
	var point0 = this.vertex0.getPosition();
	var normal = this.getPlaneNormal();
	resultPlane.setPointAndNormal(point0.x, point0.y, point0.z, normal.x, normal.y, normal.z); 
	
	return resultPlane;
};

Triangle_.prototype.getBoundingBox = function(resultBbox) 
{
	if (resultBbox === undefined)
	{ resultBbox = new BoundingBox_(); }
	
	resultBbox.init(this.vertex0.getPosition());
	resultBbox.addPoint(this.vertex1.getPosition());
	resultBbox.addPoint(this.vertex2.getPosition());
	
	return resultBbox;
};

Triangle_.prototype.getSegment = function(idx, resultSegment) 
{
	if (idx === undefined)
	{ return; }
	
	if (resultSegment === undefined)
	{ resultSegment = new Segment3D_(); }
	
	if (idx === 0)
	{
		resultSegment.setPoints(this.vertex0.getPosition(), this.vertex1.getPosition());
	}
	else if (idx === 1)
	{
		resultSegment.setPoints(this.vertex1.getPosition(), this.vertex2.getPosition());
	}
	else if (idx === 2)
	{
		resultSegment.setPoints(this.vertex2.getPosition(), this.vertex0.getPosition());
	}
	
	return resultSegment;
};

Triangle_.prototype.getIntersectionByPlaneReport = function(plane, resultIntersectionReportsArray, error) 
{
	// 1rst, check if boundingSphere intersects with the plane.
	var bbox = this.getBoundingBox();
	var bSphere = bbox.getBoundingSphere();

	if(plane.intersectionSphere(bSphere) !== Constant.INTERSECTION_INTERSECT)
	{
		return resultIntersectionReportsArray;
	}

	if(error === undefined)
	{ error = 1e-8; }

	// Now, for each edge, intersect with plane.
	/*
	CODE.relativePositionSegment3DWithPlane2D = {
		"UNKNOWN" : 0,
		"NO_INTERSECTION" : 1,
		"INTERSECTION" : 2,
		"START_POINT_COINCIDENT" : 3,
		"END_POINT_COINCIDENT" : 4,
		"TWO_POINTS_COINCIDENT" : 5
	}*/
	var intersectedPointsArray = [];

	// Segment 0.*********************************************************************
	var seg0 = this.getSegment(0);
	var relPosSeg0ToPlane = plane.getRelativePositionOfTheSegment(seg0, error);

	if(relPosSeg0ToPlane === CODE.relativePositionSegment3DWithPlane2D.INTERSECTION)
	{
		// calculate the intersection point.
		var line = seg0.getLine();
		var intersectPoint = plane.intersectionLine(line, undefined);
		// Now, must check if the "intersectPoint" is inside of the segment.
		if(seg0.intersectionWithPoint(intersectPoint, error))
		{
			intersectedPointsArray.push({
				intersectionType : "segmentIntersection",
				idx : 0,
				intesectPoint : intersectPoint});
		}
	}
	else if(relPosSeg0ToPlane === CODE.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT)
	{
		var startPoint = seg0.startPoint3d;
		intersectedPointsArray.push({
			intersectionType : "startPointIntersection",
			idx : 0,
			intesectPoint : startPoint});
	}

	// Segment 1.*********************************************************************
	var seg1 = this.getSegment(1);
	var relPosSeg1ToPlane = plane.getRelativePositionOfTheSegment(seg1, error);

	if(relPosSeg1ToPlane === CODE.relativePositionSegment3DWithPlane2D.INTERSECTION)
	{
		// calculate the intersection point.
		var line = seg1.getLine();
		var intersectPoint = plane.intersectionLine(line, undefined);
		if(seg1.intersectionWithPoint(intersectPoint, error))
		{
			intersectedPointsArray.push({
				intersectionType : "segmentIntersection",
				idx : 1,
				intesectPoint : intersectPoint});
		}
	}
	else if(relPosSeg1ToPlane === CODE.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT)
	{
		var startPoint = seg1.startPoint3d;
		intersectedPointsArray.push({
			intersectionType : "startPointIntersection",
			idx : 1,
			intesectPoint : startPoint});
	}

	if(intersectedPointsArray.length < 2)
	{
		// Segment 2.*********************************************************************
		var seg2 = this.getSegment(2);
		var relPosSeg2ToPlane = plane.getRelativePositionOfTheSegment(seg2, error);

		if(relPosSeg2ToPlane === CODE.relativePositionSegment3DWithPlane2D.INTERSECTION)
		{
			// calculate the intersection point.
			var line = seg2.getLine();
			var intersectPoint = plane.intersectionLine(line, undefined);
			if(seg2.intersectionWithPoint(intersectPoint, error))
			{
				intersectedPointsArray.push({
					intersectionType : "segmentIntersection",
					idx : 2,
					intesectPoint : intersectPoint});
			}
		}
		else if(relPosSeg2ToPlane === CODE.relativePositionSegment3DWithPlane2D.START_POINT_COINCIDENT)
		{
			var startPoint = seg2.startPoint3d;
			intersectedPointsArray.push({
				intersectionType : "startPointIntersection",
				idx : 2,
				intesectPoint : startPoint});
		}
	}
	
	if(!resultIntersectionReportsArray)
	{
		resultIntersectionReportsArray = [];
	}
	Array.prototype.push.apply(resultIntersectionReportsArray, intersectedPointsArray);
	return resultIntersectionReportsArray;
};

//**************************************************************************************************************************
// TrianglesList.***
var TrianglesList_ = function() 
{
	this.trianglesArray = [];
};

TrianglesList_.prototype.newTriangle = function(vertex0, vertex1, vertex2) 
{
	var triangle = new Triangle_(vertex0, vertex1, vertex2);
	this.trianglesArray.push(triangle);

	return triangle;
};

TrianglesList_.prototype.getTrianglesCount = function() 
{
	return this.trianglesArray.length;
};

TrianglesList_.prototype.getTriangle = function(index) 
{
	return this.trianglesArray[index];
};

//**************************************************************************************************************************
// GeographicCoord.*** GeographicCoord.*** GeographicCoord.*** GeographicCoord.*** GeographicCoord.*** GeographicCoord.***
var GeographicCoord_ = function(lon, lat, alt) 
{
	this.longitude;
	this.latitude;
	this.altitude;
	
	if (lon !== undefined)
	{ this.longitude = lon; }
	
	if (lat !== undefined)
	{ this.latitude = lat; }
	
	if (alt !== undefined)
	{ this.altitude = alt; }

};

GeographicCoord_.prototype.setLonLatAlt = function(longitude, latitude, altitude) 
{
	if (longitude !== undefined)
	{ this.longitude = longitude; }
	if (latitude !== undefined)
	{ this.latitude = latitude; }
	if (altitude !== undefined)
	{ this.altitude = altitude; }
};

//**************************************************************************************************************************
// GeoExtent.*** GeoExtent.*** GeoExtent.*** GeoExtent.*** GeoExtent.*** GeoExtent.*** GeoExtent.*** GeoExtent.*** GeoExtent.***
var GeographicExtent_ = function(minLon, minLat, minAlt, maxLon, maxLat, maxAlt) 
{
	this.minGeographicCoord;
	this.maxGeographicCoord;
	
	if (minLon !== undefined && minLat !== undefined && minAlt !== undefined)
	{
		if (this.minGeographicCoord === undefined)
		{ this.minGeographicCoord = new GeographicCoord_(); }
		
		this.minGeographicCoord.setLonLatAlt(minLon, minLat, minAlt);
	}
	
	if (maxLon !== undefined && maxLat !== undefined && maxAlt !== undefined)
	{
		if (this.maxGeographicCoord === undefined)
		{ this.maxGeographicCoord = new GeographicCoord_(); }
		
		this.maxGeographicCoord.setLonLatAlt(maxLon, maxLat, maxAlt);
	}
};

GeographicExtent_.prototype.getQuantizedPoints = function(geoCoordsArray, resultQPointsArray) 
{
	// This function returns the quantizedPoint3d.
	// Quantized points domain is positive short size (0 to 32767).***
	if(!resultQPointsArray)
	{
		resultQPointsArray = [];
	}

	var minGeoCoord = this.minGeographicCoord;
	var maxGeoCoord = this.maxGeographicCoord;

	var minLon = minGeoCoord.longitude;
	var maxLon = maxGeoCoord.longitude;

	var minLat = minGeoCoord.latitude;
	var maxLat = maxGeoCoord.latitude;

	var minAlt = minGeoCoord.altitude;
	var maxAlt = maxGeoCoord.altitude;

	var lonRange = maxLon - minLon;
	var latRange = maxLat - minLat;
	var altRange = maxAlt - minAlt;

	if(Math.abs(altRange) < 1e-12)
	{
		altRange = 1.0;
	}

	var unitary_u, unitary_v, unitary_h;
	var corrdsCount = geoCoordsArray.length;
	for(var i=0; i<corrdsCount; i++)
	{
		var geoCoord = geoCoordsArray[i];
		unitary_u = (geoCoord.longitude - minLon) / lonRange;
		unitary_v = (geoCoord.latitude - minLat) / latRange;
		unitary_h = (geoCoord.altitude - minAlt) / altRange;

		var shortMax = 32767;
		var qPoint = new Point3D_(unitary_u * shortMax, unitary_v * shortMax, unitary_h * shortMax);
		resultQPointsArray.push(qPoint);
	}

	return resultQPointsArray;
};