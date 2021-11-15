'use strict';

importScripts('./src/BoundingBox_.js');
importScripts('./src/BoundingRectangle_.js');
importScripts('./src/BoundingSphere_.js');
importScripts('./src/Constant_.js');
importScripts('./src/GeographicCoord_.js');
importScripts('./src/GeographicExtent_.js');
importScripts('./src/Line2D_.js');
importScripts('./src/Line_.js');
importScripts('./src/Plane_.js');
importScripts('./src/Point2D_.js');
importScripts('./src/Point3D_.js');
importScripts('./src/Point2DList_.js');
importScripts('./src/Polygon2D_.js');
importScripts('./src/QuantizedSurface_.js');
importScripts('./src/Segment2D_.js');
importScripts('./src/Segment3D_.js');
importScripts('./src/Triangle_.js');
importScripts('./src/Triangle2D_.js');
importScripts('./src/TrianglesList_.js');
importScripts('./src/CODE_.js');
importScripts('./src/Utils_.js');
importScripts('./src/Vertex_.js');
importScripts('./src/VertexList_.js');
importScripts('./src/createWorker.js');
importScripts('./src/register-worker.js');
importScripts('./src/promise-worker_.js');

registerPromiseWorker(function (e) 
{
	var qMesh = e;
	var excavationPositions = {
		positions: qMesh.excavationGeoCoords
	};

	var tessellated = polygon2DTessellate(excavationPositions);
	var excavatedQuantizedMesh = continueProcess(tessellated, qMesh);
	return Promise.resolve().then(function () 
	{
		return excavatedQuantizedMesh;
	});
});

function polygon2DTessellate(excavation) 
{
	var cartesiansArray = excavation.positions;
	var point2dList = new Point2DList_();
	//var point2dArray = [];
	var pointsCount = cartesiansArray.length / 2.0;
	var point2d;
	var x, y;
	for (var i=0; i<pointsCount; i++)
	{
		x = cartesiansArray[i * 2];
		y = cartesiansArray[i * 2 + 1];
		point2d = new Point2D_(x, y);
		point2dList.addPoint(point2d);
	}

	var polygon2d = new Polygon2D_({point2dList: point2dList});
	var concaveVerticesIndices = polygon2d.calculateNormal(undefined);
    
	// Now tessellate.***
	var convexPolygonsArray = [];
	convexPolygonsArray = polygon2d.tessellate(concaveVerticesIndices, convexPolygonsArray);

	// now, make convexPolygonsIndicesArray.***
	var convexPolygonIndicesArray = [];
    
	polygon2d.setIdxInList();
	var convexPolygonsCount = convexPolygonsArray.length;
	for (var i=0; i<convexPolygonsCount; i++)
	{
		var convexPolygonIndices = [];
		var convexPolygon = convexPolygonsArray[i];
		var pointsCount = convexPolygon.point2dList.getPointsCount();
		for (var j=0; j<pointsCount; j++)
		{
			var point2d = convexPolygon.point2dList.getPoint(j);
			convexPolygonIndices.push(point2d.idxInList);
		}

		// finally put the indices into result "convexPolygonIndicesArray".***
		convexPolygonIndicesArray.push(convexPolygonIndices);
	}

	return {
		convexPolygonIndicesArray : convexPolygonIndicesArray,
		concaveVerticesIndices    : concaveVerticesIndices
	};
}

function continueProcess(tessellated, qMesh)
{
	var convexPolygon2dObject = tessellated;//qMeshExcavationWorker.polygon2DTessellated;

	// Now, do excavation.***
	// Make trianglesArray.***
	var vertexList = QuantizedSurface_.getVertexList(qMesh, undefined);
	qMesh.vertexList = vertexList; // store vertexList into qMesh.***

	var trianglesList = QuantizedSurface_.getTrianglesList(qMesh, undefined);
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
	for (var i=0; i<geoCoordsCount; i++)
	{
		excavationGeoCoords.push(new GeographicCoord_(excavationGeoCoordsFloats[i*2], excavationGeoCoordsFloats[i*2+1], 0.0));
	}

	var excavationQPoints = geoExtent.getQuantizedPoints(excavationGeoCoords, undefined);

	// Now, insert qPoints into trianglesList.***************************************************************************************
	var newVertexArray = [];
	QuantizedSurface_.insertQPointsArrayIntoTrianglesList(excavationQPoints, trianglesList, vertexList, newVertexArray);

	// Now, make segments2d of the cutting polygon.************************************************************************************
	var geoCoordsCount = excavationQPoints.length;
	var nextIdx;
	var segment2d = new Segment2D_();
	var qPoint1, qPoint2, qPointHight; // Point3D class.
	qPointHight = new Point3D_();
	var plane = new Plane_();
	for (var i=0; i<geoCoordsCount; i++)
	{
		nextIdx = getNextIdx(i, geoCoordsCount);
		qPoint1 = excavationQPoints[i];
		qPoint2 = excavationQPoints[nextIdx];

		qPointHight.set(qPoint1.x, qPoint1.y, qPoint1.z + 10000.0);
		segment2d.setPoints(new Point2D_(qPoint1.x, qPoint1.y), new Point2D_(qPoint2.x, qPoint2.y));

		// Now, make a vertical plane with qPoint1, qPoint2 and qPointHight.
		plane.set3Points(qPoint1.x, qPoint1.y, qPoint1.z,   qPoint2.x, qPoint2.y, qPoint2.z,   qPointHight.x, qPointHight.y, qPointHight.z);

		QuantizedSurface_._cutTrianglesWithPlane(trianglesList, plane, segment2d, vertexList, undefined, newVertexArray);
	} 

	// Now, must classify the triangles that are inside of the excavationGeoCoords.***
	// Extract convex polygons2d.
	var convexPolygons2dArray = [];
	var convexPolygon2dIndicesArray = convexPolygon2dObject.convexPolygonIndicesArray;
	var tessellatedPolygons2dCount = convexPolygon2dIndicesArray.length; // convexPolygon2dIndicesArray.***
	for (var i=0; i<tessellatedPolygons2dCount; i++)
	{
		var point2dList = new Point2DList_();
		var convexPolygonIndices = convexPolygon2dIndicesArray[i];
		var indicesCount = convexPolygonIndices.length;
		for (var j=0; j<indicesCount; j++)
		{
			var idx = convexPolygonIndices[j];
			var excavQPoint = excavationQPoints[idx];
			var point2d = new Point2D_(excavQPoint.x, excavQPoint.y);
			point2dList.addPoint(point2d);
		}
		var polygon2d = new Polygon2D_({point2dList: point2dList});
		convexPolygons2dArray.push(polygon2d);
	}
    
	// Now, for each triangle, check if it is inside of the polygon2d.
	QuantizedSurface_._classifyTrianglesAsInteriorOrExteriorOfPolygon(trianglesList, convexPolygons2dArray);

	// Now, for interior triangles set z -= excavationHeight, and create excavation lateral triabgles.***
	var excavationAltitude = qMesh.excavationAltitude;
	// Note : if excavationAltitude is lower than qMesh._minimumHeight or higher than qMesh._maximumHeight, the must recalculate quantized altitudes.
	var minHeight = qMesh.minHeight;
	var maxHeight = qMesh.maxHeight;
	if (excavationAltitude < minHeight)
	{
		var newMinHeight = excavationAltitude;
		var newMaxHeight = qMesh.maxHeight;
		QuantizedSurface_.recalculateQuantizedAltitudes(newMinHeight, newMaxHeight, minHeight, maxHeight, vertexList);

		qMesh.minHeight = newMinHeight;
		qMesh.maxHeight = newMaxHeight;
	}
	else if (excavationAltitude > maxHeight)
	{
		var newMinHeight = qMesh.minHeight;
		var newMaxHeight = excavationAltitude;
		QuantizedSurface_.recalculateQuantizedAltitudes(newMinHeight, newMaxHeight, minHeight, maxHeight, vertexList);

		qMesh.minHeight = newMinHeight;
		qMesh.maxHeight = newMaxHeight;
	}
	var quantizedAltitude = (excavationAltitude - qMesh.minHeight) / (qMesh.maxHeight - qMesh.minHeight) * 32767;
	QuantizedSurface_.createLateralTrianglesOfExcavation(trianglesList, vertexList, quantizedAltitude);

	// Now, must recalculate the skirt indices.***
	QuantizedSurface_.recalculateSkirtIndices(trianglesList, vertexList, qMesh);

	// Now, remake the quantized mesh.***
	QuantizedSurface_._makeQuantizedMeshFromTrianglesList(trianglesList, vertexList, qMesh);

	// Make uvhValuesArray.***
	var vertexCount = qMesh.uValues.length;
	var uvhValuesArray = new Uint16Array(vertexCount * 3);
	uvhValuesArray.set(qMesh.uValues);
	uvhValuesArray.set(qMesh.vValues, vertexCount);
	uvhValuesArray.set(qMesh.hValues, vertexCount * 2);

	return {
		result: 
        {
        	uvhValues        : uvhValuesArray,
        	uValues          : qMesh.uValues, 
        	vValues          : qMesh.vValues,
        	hValues          : qMesh.hValues,
        	indices          : qMesh.indices,
        	minHeight        : qMesh.minHeight,
        	maxHeight        : qMesh.maxHeight,
        	southIndices     : qMesh.southIndices,
        	eastIndices      : qMesh.eastIndices,
        	northIndices     : qMesh.northIndices,
        	westIndices      : qMesh.westIndices,
        	southSkirtHeight : qMesh.southSkirtHeight*0.0, // Zero.***
        	eastSkirtHeight  : qMesh.eastSkirtHeight*0.0, // Zero.***
        	northSkirtHeight : qMesh.northSkirtHeight*0.0, // Zero.***
        	westSkirtHeight  : qMesh.westSkirtHeight*0.0, // Zero.***
        	boundingSphere   : {
        		center : qMesh.boundingSphere.center, // Same value that the original quantized mesh.***
        		radius : qMesh.boundingSphere.radius// Same value that the original quantized mesh.***
        	},
        	horizonOcclusionPoint: qMesh.horizonOcclusionPoint // Same value that the original quantized mesh.***
        },
	    info: qMesh.info
	};
};