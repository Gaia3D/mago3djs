'use strict';

// Elementary objects.
importScripts('./src/Arc2D_.js');
importScripts('./src/Circle2D_.js');
importScripts('./src/PolyLine2D_.js');
importScripts('./src/Rectangle2D_.js');
importScripts('./src/Star2D_.js');

// General objects.
importScripts('./src/BoundingBox_.js');
importScripts('./src/BoundingSphere_.js');
importScripts('./src/CODE_.js');
importScripts('./src/Color_.js');
importScripts('./src/Constant_.js');
importScripts('./src/GeographicCoord_.js');
importScripts('./src/GeographicCoordsList_.js');
importScripts('./src/GeoLocationData_.js');
importScripts('./src/glMatrix.js');
importScripts('./src/Face_.js');
importScripts('./src/Globe_.js');
importScripts('./src/HalfEdge_.js');
importScripts('./src/HalfEdgesList_.js');
importScripts('./src/IndexData_.js');
importScripts('./src/IndexRange_.js');
importScripts('./src/Line2D_.js');
importScripts('./src/Matrix4_.js');
importScripts('./src/Mesh_.js');
importScripts('./src/Utils_.js');
importScripts('./src/Point2D_.js');
importScripts('./src/Point2DList_.js');
importScripts('./src/Point3D_.js');
importScripts('./src/Polygon2D_.js');
importScripts('./src/Profile2D_.js');
importScripts('./src/Ring2D_.js');
importScripts('./src/Segment2D_.js');
importScripts('./src/Surface_.js');
importScripts('./src/Triangle_.js');
importScripts('./src/TrianglesList_.js');
importScripts('./src/Vertex_.js');
importScripts('./src/VertexList_.js');
importScripts('./src/VtxProfile_.js');
importScripts('./src/VtxProfilesList_.js');
importScripts('./src/VtxRing_.js');


var worker = self;

worker.onmessage = function (e) 
{
	//var data = {
	//    info : {guid : guid},
	//    objectsToExtrudeArrayWorker : objectsToExtrudeArrayWorker
	//};

	var data = e.data;
	var info = data.info;
	var objectsToExtrudeArrayWorker = data.objectsToExtrudeArrayWorker;
	var geoLocation = data.geoLocation;
	var rotation = data.rotation;

	var geoLocData = Utils_.calculateGeoLocationData(geoLocation.longitude, geoLocation.latitude, geoLocation.altitude, rotation.heading, rotation.pitch, rotation.roll, undefined);
	var mergedMesh;
	var objectsCount = objectsToExtrudeArrayWorker.length;
	for (var i=0; i<objectsCount; i++) 
	{
		var object = objectsToExtrudeArrayWorker[i];
		var geoCoordsNumbersArrayArray = object.geoCoordsNumbersArrayArray;
		var color = object.color;
		var height = object.height;
		var floorHeight = object.floorHeight;

		var geoCoordsListsCount = geoCoordsNumbersArrayArray.length;
		for (var j=0; j<geoCoordsListsCount; j++)
		{
			var geoCoordsNumbersArray = geoCoordsNumbersArrayArray[j];

            
			// convert numbers array to geoCoords array.***
			var geoCoordsArray = GeographicCoordsList_.getGeoCoordsArrayFromNumbersArray(geoCoordsNumbersArray);
            
			GeographicCoordsList_.solveDegeneratedPoints(geoCoordsArray, 1E-8);
			if (GeographicCoordsList_.isClockwise(geoCoordsArray)) 
			{
				geoCoordsArray = geoCoordsArray.reverse();
			}
			// create a geoCoordsList.***
			var geographicCoordList = new GeographicCoordsList_(geoCoordsArray);
			var accum = 0;
			var index = 1;
			while (accum < height) 
			{
				var bottomGeocoordsList = geographicCoordList.getCopy();
				var topGeocoordsList = geographicCoordList.getCopy();
				bottomGeocoordsList.setAltitude(floorHeight * (index-1));
				topGeocoordsList.setAltitude(floorHeight * (index));

				var bottomPoint3dArray = GeographicCoordsList_.getPointsRelativeToGeoLocation(geoLocData, bottomGeocoordsList.geographicCoordsArray, undefined);
				var topPoint3dArray = GeographicCoordsList_.getPointsRelativeToGeoLocation(geoLocData, topGeocoordsList.geographicCoordsArray, undefined);

				var vtxProfilesList = new VtxProfilesList_();
				var baseVtxProfile = vtxProfilesList.newVtxProfile();
				baseVtxProfile.makeByPoints3DArray(bottomPoint3dArray, undefined); 
				var topVtxProfile = vtxProfilesList.newVtxProfile();
				topVtxProfile.makeByPoints3DArray(topPoint3dArray, undefined);

				var solidMesh = vtxProfilesList.getMesh(undefined, true, true);
				var surfIndepMesh = solidMesh.getCopySurfaceIndependentMesh();
				surfIndepMesh.calculateVerticesNormals();
				accum = accum + floorHeight;
				index++;

				surfIndepMesh.setColor(color[0], color[1], color[2], color[3]);
            
				if (!mergedMesh && surfIndepMesh && surfIndepMesh instanceof Mesh_) 
				{
					mergedMesh = surfIndepMesh;
					continue;
				}
				mergedMesh.mergeMesh(surfIndepMesh);
			}
		}
	}
	var vbosArray = mergedMesh.getVbo();

	// Now, calculate the boundingBox.***
	var bSphere;
	if (data.calculateBoundingSphere)
	{
		var bbox = mergedMesh.getBoundingBox(undefined);
		bSphere = bbox.getBoundingSphere(undefined);
	}

	worker.postMessage({result: 
        {
        	info      : info,
        	vbosArray : vbosArray,
        	bSphere   : bSphere
        }
	});
};