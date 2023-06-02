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
importScripts('./src/Material_.js');
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
	//debugger;
	var geoLocData = Utils_.calculateGeoLocationData(geoLocation.longitude, geoLocation.latitude, geoLocation.altitude, rotation.heading, rotation.pitch, rotation.roll, undefined);
	var mergedMesh;
	var objectsCount = objectsToExtrudeArrayWorker.length;

	var getTexCoordRange = function(dist) 
	{
		if (dist < 1.5) 
		{
			return [0, 0.048828];
		}
		else if (dist < 3.0) 
		{
			return [0.048828, 0.1953125];
		}
		else if (dist < 6.0) 
		{
			return [0.1953125, 0.439453];
		}
		else 
		{
			return [0.439453, 1.0];
		}
	};

	var insertVertexForEachVertex = function(profile) 
	{
		var vtxProfilesList = new VtxProfilesList_();
		var vtxProfile = vtxProfilesList.newVtxProfile();
        
		var vList = profile.outerVtxRing.vertexList;
		var vListCount = vList.getVertexCount();

		var getPoint3dClone = function(vertex) 
		{
			var point3d = vertex.point3d;
			return new Point3D_(point3d.x, point3d.y, point3d.z);
		};
		var point3dArray = [];
		for (var i=0;i<vListCount;i++) 
		{
			var vertex = vList.getVertex(i);
            
			var point3dClone = getPoint3dClone(vertex);
			var point3dClone2 = getPoint3dClone(vertex);
			if (i === 0) 
			{
				//vtxProfile.newVertex(point3dClone);
				point3dArray.push(point3dClone);
			}
			else if (i === vListCount - 1) 
			{
				point3dArray.push(point3dClone);
				point3dArray.push(point3dClone2);
				var firstVertex = vList.getVertex(0);                
				point3dArray.push(getPoint3dClone(firstVertex));
			}
			else 
			{
				point3dArray.push(point3dClone);
				point3dArray.push(point3dClone2);
			}
		}
		vtxProfile.makeByPoints3DArray(point3dArray, undefined);

		return vtxProfile;
	};
	var makeCapMesh = function(vtxProfilesList) 
	{
		var options = {};
		var resultMesh = new Mesh_();
		if (!vtxProfilesList.convexFacesIndicesData) 
		{
			var vtxProfileFirst = vtxProfilesList.getVtxProfile(0);
		    vtxProfilesList.convexFacesIndicesData = vtxProfileFirst.calculateConvexFacesIndicesData(vtxProfilesList.convexFacesIndicesData);
		}
        
		var vtxProfilesCount = vtxProfilesList.getVtxProfilesCount();
		options.name = "top";
		topVtxProfile = vtxProfilesList.getVtxProfile(vtxProfilesCount-1);
		var resultSurface = resultMesh.newSurface(options);
		resultSurface = VtxProfilesList_.getTransversalSurface(topVtxProfile, vtxProfilesCount.convexFacesIndicesData, resultSurface);
        
		return resultMesh;
	};

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

				var auxCount = topVtxProfile.outerVtxRing.vertexList.getVertexCount();
				for (var m=0;m<auxCount;m++) 
				{
					var tv = topVtxProfile.outerVtxRing.vertexList.getVertex(m);
					var bv = baseVtxProfile.outerVtxRing.vertexList.getVertex(m);

					tv.texCoord = new Point2D_(0, 0);
					bv.texCoord = new Point2D_(0, 0);
				}

				var capMesh = makeCapMesh(vtxProfilesList);
                
				var topDuplicateVtxProfile = insertVertexForEachVertex(topVtxProfile);
				var baseDuplicateVtxProfile = insertVertexForEachVertex(baseVtxProfile);

				vtxProfilesList.vtxProfilesArray[1] = topDuplicateVtxProfile;
				vtxProfilesList.vtxProfilesArray[0] = baseDuplicateVtxProfile;
				var topVList = topDuplicateVtxProfile.outerVtxRing.vertexList;
				var bottomVList = baseDuplicateVtxProfile.outerVtxRing.vertexList;
                
				var vCount = topVList.getVertexCount();
				for (var k=0;k<=vCount - 2;k=k+2) 
				{
					var topVertexA = topVList.getVertex(k);
					var topPoint3DA = topVertexA.point3d;
					var bottomVertexA = bottomVList.getVertex(k);

					var nextIndex = /* k === vCount-1 ? 0 : */ k+1;
                    
					var topVertexB = topVList.getVertex(nextIndex);
					var topPoint3DB = topVertexB.point3d;
					var bottomVertexB = bottomVList.getVertex(nextIndex);

					var dist = topPoint3DA.distToPoint(topPoint3DB);
					var texCoordRange = getTexCoordRange(dist);
                    
					topVertexA.texCoord = new Point2D_();
					bottomVertexA.texCoord = new Point2D_();

					topVertexA.texCoord.x = texCoordRange[0];
					topVertexA.texCoord.y = 1.0;
					bottomVertexA.texCoord.x = texCoordRange[0];
					bottomVertexA.texCoord.y = 0.0;

					topVertexB.texCoord = new Point2D_();
					bottomVertexB.texCoord = new Point2D_();

					topVertexB.texCoord.x = texCoordRange[1];
					topVertexB.texCoord.y = 1.0;
					bottomVertexB.texCoord.x = texCoordRange[1];
					bottomVertexB.texCoord.y = 0.0;
				}
                
				var solidMesh = vtxProfilesList.getMesh(capMesh, false, false);
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