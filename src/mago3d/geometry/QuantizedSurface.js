'use strict';

/**
 * quantized surface
 * @class QuantizedSurface
 * 
 */
var QuantizedSurface = function(qMesh) 
{
    if (!(this instanceof QuantizedSurface)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    // QuantizedSurface's points domain is positive short size (0 to 32767)

    this.qMesh = qMesh;
    this.vertexList;
    this.trianglesList;
};

QuantizedSurface.prototype._makeTrianglesListFromQuantizedMesh = function (resultTrianglesList)
{
    // In this function make a operable triangle-based mesh.
    var qMesh = this.qMesh;
    var minHeight = qMesh._minimumHeight;
	var maxHeight = qMesh._maximumHeight;
	var uValues = qMesh._uValues;
	var vValues = qMesh._vValues;
	var hValues = qMesh._heightValues;
	this.indices = qMesh._indices;

	// 1rst, make points.***
    if(!this.vertexList)
    {
        this.vertexList = new VertexList();
    }

	var pointsCount = uValues.length;
	
	var x, y, z;
    var point3d;
    var vtx;
	for(var i=0; i<pointsCount; i++)
	{
		x = uValues[i];
		y = vValues[i];
		z = hValues[i];

		point3d = new Point3D(x, y, z);
        vtx = this.vertexList.newVertex(point3d);
	}

    // Now, make triangles.***
    if(!resultTrianglesList)
    {
        resultTrianglesList = new TrianglesList();
    }

    var trianglesCount = this.indices.length/3;
    var idxPoint_1, idxPoint_2, idxPoint_3;
    var vtx_1, vtx_2, vtx_3;
    var triangle;

    for(var i=0; i<trianglesCount; i++)
    {
        idxPoint_1 = this.indices[i * 3];
        idxPoint_2 = this.indices[i * 3 + 1];
        idxPoint_3 = this.indices[i * 3 + 2];

        vtx_1 = this.vertexList.getVertex(idxPoint_1);
        vtx_2 = this.vertexList.getVertex(idxPoint_2);
        vtx_3 = this.vertexList.getVertex(idxPoint_3);

        triangle = resultTrianglesList.newTriangle(vtx_1, vtx_2, vtx_3);

        // Now, for each vertex, make triangles-array that uses these vertices.
        QuantizedSurface._storeTriangleInVertices(triangle);
    }

    return resultTrianglesList;
};

QuantizedSurface.prototype.getTrianglesList = function ()
{
    if(!this.trianglesList)
    {
        this.trianglesList = this._makeTrianglesListFromQuantizedMesh(undefined);
    }

    return this.trianglesList;
};

QuantizedSurface._segment2DIntersectsTriangle2D = function(triangle2d, seg2d, resultTrianglesArray) 
{
    // This function calculates if the segment2d intersects with the triangle2d.
    // Remember : In quatizedMesh process, a segment always cuts a triangle by a triangle's vertex.
    //-----------------------------------------------------------------------------------------------------
    // Check if the segment cuts any edge of the triangle.
    var triangleSegment = triangle2d.getSegment2D(0);

    
};

QuantizedSurface.cutTriangleWithVerticalPlaneByVtxSegment = function(triangle, seg2d, resultTrianglesArray) 
{
    //***********************************************
	// This function works in 2D in the plane XY.
    //-----------------------------------------------

    //*********************************************************************************************************************************************
    // The qMesh was prepared inserting vertices & refining the mesh, so all segments points are coincidents with triangles vertices.***
    //*********************************************************************************************************************************************

    // segment can be:
    // 1) Only touch the triangle for a vertex (do nothing)
    // 2) Cut the triangle by one of the triangle vertex (cut the triangle in 2 triangles)
    // 3) Tangent to triangle. (do nothing)
    //-----------------------------------------------------------------------------------------



	// 1rst, check if the segment intersects the triangle.
    //var point1 = vtxSeg.startVertex.getPosition();
    //var point2 = vtxSeg.endVertex.getPosition();
	//var seg2d = new Segment2D(point1, point2);
    var segBRect = seg2d.getBoundingRectangle();

    //var triPoint1 = triangle.vertex0.getPosition();
    //var triPoint2 = triangle.vertex1.getPosition();
    //var triPoint3 = triangle.vertex2.getPosition();
    var tri2d = QuantizedSurface.getProjectedTriangle2D_planeXY(triangle, undefined);
    var triBRect = tri2d.getBoundingRectangle();

    if(!segBRect.intersectsWithRectangle(triBRect))
    {
        return false;
    }

    // Now, must know the relative position between the segment and the triangle.
    var relPos_point1;
    var relPos_point2;

    // Now, check if some point of the segment is inside of the triangle2d.***
    var error = 1e-8;
    var report1 = tri2d.getRelativePositionOfPoint2DReport(point1, undefined, error);

    var hola = 0;
};

QuantizedSurface.getQuantizedPointsArrayFromGeoCoords = function (geoCoordsArray, geoExtent, resultqPointsArray)
{
    if(!geoCoordsArray || geoCoordsArray.length === 0)
    {
        return resultqPointsArray;
    }

    if(!resultqPointsArray)
    {
        resultqPointsArray = [];
    }

    var geoCoordsCount = geoCoordsArray.length;
    var qPoint;
    for(var i=0; i<geoCoordsCount; i++)
    {
        qPoint = geoExtent.getQuantizedPoint(geoCoordsArray[i], undefined);
        resultqPointsArray.push(qPoint);
    }

    return resultqPointsArray;
};

QuantizedSurface.getTriangleBoundingRect = function (triangle, resultBRect)
{
    // calculate the bRect of a 3d triangle using x,y only.
    if(!resultBRect)
    {
        resultBRect = new BoundingRectangle();
    }

    var point3d = triangle.vertex0.getPosition();
    resultBRect.setInitXY(point3d.x, point3d.y);

    point3d = triangle.vertex1.getPosition();
    resultBRect.addPointXY(point3d.x, point3d.y);

    point3d = triangle.vertex2.getPosition();
    resultBRect.addPointXY(point3d.x, point3d.y);

    return resultBRect;
};

QuantizedSurface.getProjectedTriangle2D_planeXY = function (triangle, resultTriangle2d)
{
    if(!resultTriangle2d)
    {
        resultTriangle2d = new Triangle2D();
    }

    var p0 = triangle.vertex0.getPosition();
    var p1 = triangle.vertex1.getPosition();
    var p2 = triangle.vertex2.getPosition();

    var p2d_0 = new Point2D(p0.x, p0.y);
    var p2d_1 = new Point2D(p1.x, p1.y);
    var p2d_2 = new Point2D(p2.x, p2.y);

    resultTriangle2d.setPoints(p2d_0, p2d_1, p2d_2);

    return resultTriangle2d;
};

QuantizedSurface._storeTriangleInVertices = function (triangle)
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

QuantizedSurface.insertQPointIntoTriangle = function (qPoint, triangle, triangleIdx, triList, vertexList)
{
    // Here, insert the qPoint into triangle and create 3 new triangles, and then delete the original.
    // Create the 3 triangles:
    var tri1, tri2, tri3;
    var v0, v1, v2; // vertices of the original triangle.
    var qPoint3d = new Point3D(qPoint.x, qPoint.y, qPoint.z);
    var qVertex = vertexList.newVertex(qPoint3d);

    v0 = triangle.vertex0;
    v1 = triangle.vertex1;
    v2 = triangle.vertex2;

    tri1 = triList.newTriangle(qVertex, v0, v1);
    tri2 = triList.newTriangle(qVertex, v1, v2);
    tri3 = triList.newTriangle(qVertex, v2, v0);

    QuantizedSurface._storeTriangleInVertices(tri1);
    QuantizedSurface._storeTriangleInVertices(tri2);
    QuantizedSurface._storeTriangleInVertices(tri3);

    // now, delete the original triangle.
    triList.deleteTriangleByIdx(triangleIdx);

};

QuantizedSurface.splitTrianglesByQPointInSegment = function (qPoint, segment, triList, vertexList)
{
    // TODO:
};

QuantizedSurface.insertQPointIntoTrianglesList = function (qPoint, triList, vertexList)
{
    var triCount = triList.getTrianglesCount();
    var tri, tri2d;
    var point;
    var plane;
    var error = 1e-8;
    var line = new Line();
    line.set2Points(qPoint.x, qPoint.y, 0.0, qPoint.x, qPoint.y, 30000.0);

    for(var i=0; i<triCount; i++)
    {
        tri = triList.getTriangle(i);

        if(!tri.bRectXY)
        {
            tri.bRectXY = QuantizedSurface.getTriangleBoundingRect(tri, undefined);
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
                var intersectionPoint2d = new Point2D(intersectionPoint.x, intersectionPoint.y);
                // Finally, must check if the intersected point is inside of the triangle.
                tri2d = QuantizedSurface.getProjectedTriangle2D_planeXY(tri, tri2d);
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
                    var hola = 0;
                }

                if(report.relPos === CODE.relativePositionPoint2DWithTriangle2D.INSIDE)
                {
                    // Insert the "intersectionPoint" into the triangle -> create 3 triangles & delete the original.
                    QuantizedSurface.insertQPointIntoTriangle(intersectionPoint, tri, i, triList, vertexList);
                    break;
                }
                else if(report.relPos === CODE.relativePositionPoint2DWithTriangle2D.COINCIDENT_WITH_TRIANGLE_EDGE)
                {
                    // In this case split the triangle.
                    // Must find the 2 triangles of the intersected edge.
                    var segmentIdx = report.segmentIdx;


                    break;
                }
            }
        }
    }
};

QuantizedSurface.insertQPointsArrayIntoTrianglesList = function (qPointsArray, triList, vertexList)
{
    // Note: the triangles of the triList has as points quantizedPoints.
    var qPointsCount = qPointsArray.length;
    for(var i=0; i<qPointsCount; i++)
    {
        QuantizedSurface.insertQPointIntoTrianglesList(qPointsArray[i], triList, vertexList);
    }
};

QuantizedSurface.prototype.excavation = function (excavationGeoCoords, excavationDepth)
{
    // In this function, cut the qmesh with the excavationPolygon and create a negative extrude.
    var triList = this.getTrianglesList();

    // make vertexSegment in positive short range by geographicCoords.
    if(!this.qMesh.geoExtent)
    {
        // Make the geographicExtent by tile indices L, X, Y.
        var imageryType = CODE.imageryType.CRS84;
        this.qMesh.geoExtent = SmartTile.getGeographicExtentOfTileLXY(this.qMesh.L, this.qMesh.X, this.qMesh.Y, undefined, imageryType);

        // set minAltitude & maxAltitude to the geoExtent.
        var maxHeight = this.qMesh._maximumHeight;
        var minHeight = this.qMesh._minimumHeight;
        
        this.qMesh.geoExtent.setExtentAltitudes(minHeight, maxHeight);
    }

    // 1rst, remake the qMesh inserting all geoCoords inside of triangles of the qMesh, and then the qMesh is refined.
    var geoExtent = this.qMesh.geoExtent;
    var qPointsArray = QuantizedSurface.getQuantizedPointsArrayFromGeoCoords(excavationGeoCoords, geoExtent, undefined);
    QuantizedSurface.insertQPointsArrayIntoTrianglesList(qPointsArray, triList, this.vertexList);

    // Now, make segments2d of the cutting polygon.
    var geoCoordsCount = excavationGeoCoords.length;
    var startGeoCoord, endGeoCoord;
    var nextIdx;
    var vertexSegment;
    var segment2d = new Segment2D();
    var u, v, h;
    var qPoint1, qPoint2; // Point3D class.
    for(var i=0; i<geoCoordsCount; i++)
    {
        nextIdx = GeometryUtils.getNextIdx(i, geoCoordsCount);
        startGeoCoord = excavationGeoCoords[i];
        endGeoCoord = excavationGeoCoords[nextIdx];

        qPoint1 = geoExtent.getQuantizedPoint(startGeoCoord, undefined);
        qPoint2 = geoExtent.getQuantizedPoint(endGeoCoord, undefined);
        segment2d.setPoints(qPoint1, qPoint2);


        var hola = 0;
    }
    
    var hola = 0;
};