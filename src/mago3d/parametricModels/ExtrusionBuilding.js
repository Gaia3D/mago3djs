'use strict';

/**
 * ExtrusionBuilding
 * @class ExtrusionBuilding
 * @param {GeographicCoordList} geographicCoordList
 * @param {number} height
 * @param {object} options
 */
var ExtrusionBuilding = function (geographicCoordList, height, options) 
{
	if (!(this instanceof ExtrusionBuilding)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
    
	if (!geographicCoordList) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('geographicCoordList'));
	}

	this.geographicCoordListsArray = [];
	
	if (geographicCoordList instanceof GeographicCoordsList) 
	{
		this.geographicCoordListsArray.push(geographicCoordList);
	}
	else if (geographicCoordList instanceof Array)
	{
		this.geographicCoordListsArray = geographicCoordList;
	}

	if (height === undefined || height === null) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('height'));
	}

	if (height === 0) 
	{
		throw new Error('height must higher than 0');
	}

	MagoRenderable.call(this, options);
	options = options? options : {};

	var geoCoordsList = this.geographicCoordListsArray[0]; // take the 1rst geoCoordsList.***
	this.setGeographicPosition(geoCoordsList.getMiddleGeographicCoords());

	this.localCoordListArray = makeLocalCooldList(this.geographicCoordListsArray, this.geoLocDataManager.getCurrentGeoLocationData());

	this.height = height;
	this.color4 = defaultValue(options.color, new Color(1, 1, 1, 1));

	this.attributes.isMovable = defaultValue(options.isMovable, true);
	this.attributes.isSelectable = defaultValue(options.isSelectable, true);
	this.attributes.selectedColor4 = defaultValue(options.selectedColor, new Color(1, 1, 0, 1));
	this.attributes.heightReference = defaultValue(options.heightReference, HeightReference.NONE);
	this.divideLevel = defaultValue(options.divideLevel, false);

	if (!this.options)
	{ this.options = {}; }

	this.options.renderWireframe = defaultValue(options.renderWireframe, true);
	this.options.renderShaded = defaultValue(options.renderShaded, true);
	this.options.depthMask = defaultValue(options.depthMask, true);
	this.options.limitationGeographicCoords = defaultValue(options.limitationGeographicCoords, undefined);
	this.limitationConvexPolygon2dArray;

	
	function makeLocalCooldList ( gcLists, geoLocData) 
	{
		var tMatInv = geoLocData.getTMatrixInv();
		var error = 1E-7;
		var lcListArray = [];
		for (var j=0, gcLen=gcLists.length; j < gcLen; j++) 
		{
			var gcList = gcLists[j];
			GeographicCoordsList.solveDegeneratedPoints(gcList.geographicCoordsArray, error);
			var lcList = [];
			for (var i=0, len=gcList.geographicCoordsArray.length;i<len;i++)
			{
				var gc = gcList.geographicCoordsArray[i];
				var wc = ManagerUtils.geographicCoordToWorldPoint(gc.longitude, gc.latitude, gc.altitude);
				var lc = tMatInv.transformPoint3D(wc);
				lcList.push(lc);
			}
			lcListArray.push(lcList);
		}
		
		return lcListArray;
	}
};
ExtrusionBuilding.prototype = Object.create(MagoRenderable.prototype);
ExtrusionBuilding.prototype.constructor = ExtrusionBuilding;

ExtrusionBuilding.prototype.makeMesh = function() 
{
	if (!this.dirty) { return; }
	
	if (!this.geoLocDataManager) 
	{
		return;
	}
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
    
	if (!geoLocData) 
	{
		return;
	}
	if (this.attributes.heightReference !== HeightReference.NONE) 
	{
		geoLocData = ManagerUtils.calculateGeoLocationData(undefined, undefined, 0, undefined, undefined, undefined, geoLocData);
	}
	
	// Try to solve degeneratedPoints.***
	var error = 1E-8;

	this.objectsArray = [];
	var geoCoordsListsCount = this.geographicCoordListsArray.length;
	for (var i=0; i<geoCoordsListsCount; i++)
	{
		var geographicCoordList = this.geographicCoordListsArray[i];
		
		//GeographicCoordsList.solveDegeneratedPoints(geographicCoordList.geographicCoordsArray, error);
		
		// Make the topGeoCoordsList.
		var topGeoCoordsList = geographicCoordList.getCopy();
		// Reassign the altitude on the geoCoordsListCopy.
		geographicCoordList.setAltitude(0);
		topGeoCoordsList.setAltitude(this.height);
		
		var basePoints3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, geographicCoordList.geographicCoordsArray, undefined);
		var topPoints3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, topGeoCoordsList.geographicCoordsArray, undefined);
		
		// Now, with basePoints3dArray & topPoints3dArray make a mesh.
		// Create a VtxProfilesList.
		var vtxProfilesList = new VtxProfilesList();
		var baseVtxProfile = vtxProfilesList.newVtxProfile();
		baseVtxProfile.makeByPoints3DArray(basePoints3dArray, undefined); 
		var topVtxProfile = vtxProfilesList.newVtxProfile();
		topVtxProfile.makeByPoints3DArray(topPoints3dArray, undefined); 
		
		var bIncludeBottomCap = true;
		var bIncludeTopCap = true;
		var solidMesh = vtxProfilesList.getMesh(undefined, bIncludeBottomCap, bIncludeTopCap);
		var surfIndepMesh = solidMesh.getCopySurfaceIndependentMesh();
		surfIndepMesh.calculateVerticesNormals();

		
		if (this.divideLevel)
		{
			var c = document.createElement("canvas");
			var ctx = c.getContext("2d");

			c.width = 8;
			c.height = 32;
			ctx.beginPath();
			ctx.fillStyle = "#262626";
			ctx.rect(0, 0, 8, 1);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.fillStyle = this.color4.getRGBA();
			ctx.rect(0, 1, 8, 31);
			ctx.fill();
			ctx.closePath();

			/*ctx.beginPath();
			ctx.fillStyle = "#0000ff";
			ctx.rect(2, 8, 4, 8);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();*/

			surfIndepMesh.material = new Material('test');
			surfIndepMesh.material.setDiffuseTextureUrl(c.toDataURL());

			surfIndepMesh.calculateTexCoordsByHeight(this.floorHeight ? this.floorHeight+0.01 : 3.31);
			var topSurfaces = surfIndepMesh.getSurfaceByName('top');
			if (topSurfaces.length > 0)
			{
				for (var j=0, surLen=topSurfaces.length;j<surLen;j++) 
				{
					var ts = topSurfaces[j];
					var vertexArray = ts.localVertexList.vertexArray;
					for (var k=0, verLength=vertexArray.length;k<verLength;k++) 
					{
						var vtx = vertexArray[k];
						vtx.texCoord.x = 2 / c.width;
						vtx.texCoord.y = 2 / c.height;
					}
				}
			}
			
		}
		
		this.objectsArray.push(surfIndepMesh);
	}
	this.setDirty(false);

	// Check if exist limitation polygons.***
	if (this.options.limitationGeographicCoords)
	{
		this.makeUniformPoints2dArray();
	}
	if (this.attributes.heightReference !== HeightReference.NONE) 
	{
		if (this.terrainHeight) { this.setTerrainHeight(this.terrainHeight); }
	}
	
	//this.validTerrainHeight();
};

/**
 * Set the unique one color of the box
 * @param {Number} r
 * @param {Number} g
 * @param {Number} b 
 * @param {Number} a
 */
ExtrusionBuilding.prototype.setOneColor = function(r, g, b, a)
{
	// This function sets the unique one color of the mesh.***
	if (this.color4 === undefined)
	{ this.color4 = new Color(); }
	
	this.color4.setRGBA(r, g, b, a);
	//TODO : 좀 더 정교한 근사값 구하기로 변경
	if (a < 1) 
	{
		this.setOpaque(false);
	}

	if (this.divideLevel) 
	{
		this.setDirty(true);
	}
};

ExtrusionBuilding.prototype.makeUniformPoints2dArray = function() 
{
	if (!this.geoLocDataManager) 
	{
		return;
	}
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
    
	if (!geoLocData) 
	{
		return;
	}

	if (!this.options.limitationGeographicCoords)
	{
		return;
	}

	this.limitationConvexPolygon2dArray = [];

	// 1rst, convert all geoCoords to pointLC.***
	var limitGeoCoordsArray = this.options.limitationGeographicCoords;
	var basePoints3dArray = GeographicCoordsList.getPointsRelativeToGeoLocation(geoLocData, limitGeoCoordsArray, undefined);

	// now, make polygons2d.***
	var polygon2d = new Polygon2D();
	polygon2d.point2dList = new Point2DList();

	var points3dCount = basePoints3dArray.length;
	for (var i=0; i<points3dCount; i++)
	{
		var point3d = basePoints3dArray[i];
		var point2d = polygon2d.point2dList.newPoint(point3d.x, point3d.y);
	}

	// make the polygon by geoCoordsArray.***
	var resultConcavePointsIdxArray = polygon2d.calculateNormal(undefined);
	if (polygon2d.normal < 0)
	{
		polygon2d.reverseSense();
		resultConcavePointsIdxArray = polygon2d.calculateNormal(undefined);
	}
	var limitationConvexPolygon2dArray = polygon2d.tessellate(resultConcavePointsIdxArray, undefined);
	
	// now, make the uniforms values to send to shader.***
	var uniformPoints2dArray = new Float32Array(512);
	var uniformPolygonPointsIdx = new Int32Array(256);
	// set initially idx = -1.***
	for (var i=0; i<256; i++)
	{
		uniformPolygonPointsIdx[i] = -1;
	}
	var currentIdx = 0;
	var convexPolygon2dCount = limitationConvexPolygon2dArray.length;
	for (var i=0; i<convexPolygon2dCount; i++)
	{
		var convexPolygon2d = limitationConvexPolygon2dArray[i];
		var pointsCount = convexPolygon2d.point2dList.getPointsCount();
		uniformPolygonPointsIdx[i*2] = currentIdx;
		for (var j=0; j<pointsCount; j++)
		{
			var point2d = convexPolygon2d.point2dList.getPoint(j);
			uniformPoints2dArray[2*currentIdx] = point2d.x;
			uniformPoints2dArray[2*currentIdx+1] = point2d.y;
			currentIdx += 1;
		}

		uniformPolygonPointsIdx[i*2+1] = currentIdx-1;
	}

	this.uniformPoints2dArray = uniformPoints2dArray;
	this.uniformPolygonPointsIdx = uniformPolygonPointsIdx;
};

/**
 * @param {Array<Cesium.Cartesian3>} cartesian3Array
 * @param {number} height
 * @param {object} options
 */
ExtrusionBuilding.makeExtrusionBuildingByCartesian3Array = function(cartesian3Array, height, options) 
{
	var geographicCoordList = GeographicCoordsList.fromCartesians(cartesian3Array);
	var eb = new ExtrusionBuilding(geographicCoordList, height, options);

	return eb;
};

/**
 * @param {number} height
 */
ExtrusionBuilding.prototype.setHeight = function(height) 
{
	if (height === undefined || height === null) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('height'));
	}
	this.height = height;
	this.setDirty(true);
};

/**
 * @param {Array<GeographicCoord>} limitationGeographicCoords
 */
ExtrusionBuilding.prototype.setLimitationGeographicCoords = function(limitationGeographicCoords) 
{
	this.options.limitationGeographicCoords = limitationGeographicCoords;
	this.setDirty(true);
};

/**
 * @param {number>} limitationHeight
 */
ExtrusionBuilding.prototype.setLimitationHeight = function(limitationHeight) 
{
	this.options.limitationHeights = limitationHeight ? new Float32Array([0, limitationHeight]) : undefined;
};

/**
 * @return {number}
 */
ExtrusionBuilding.prototype.getHeight = function() 
{
	return this.height;
};

/**
 * @return {number}
 */
ExtrusionBuilding.prototype.getRealHeight = function() 
{
	return this.height + this.terrainHeight;
};

/**
 * @return {number}
 */
ExtrusionBuilding.prototype.getLevel = function() 
{
	if (!this.floorHeight) 
	{
		return 0;
	}
	return parseInt(this.height / this.floorHeight, 10);
};

/**
 * @return {number}
 */
ExtrusionBuilding.prototype.getCenter = function() 
{
	var listLength = this.geographicCoordListsArray.length;
	var arr = [];
	for (var i=0;i<listLength;i++) 
	{
		var geographicCoordList = this.geographicCoordListsArray[i];
		var extent = geographicCoordList.getGeographicExtent();
		arr.push(new GeographicCoord(extent.getCenterLongitude(), extent.getCenterLatitude(), extent.getCenterAltitude()));
	}

	var extentGcList = new GeographicCoordsList(arr);
	var totalExtent = extentGcList.getGeographicExtent();

	return new GeographicCoord(totalExtent.getCenterLongitude(), totalExtent.getCenterLatitude(), totalExtent.getCenterAltitude());
};
/**
 * 
 * @param {Point3D} cameraPosition 
 */
ExtrusionBuilding.prototype.getDistToCamera = function(cameraPosition) 
{
	var mesh = this.objectsArray[0];
	var bb = mesh.getBoundingBox();
	var radius = bb.getRadiusAprox();

	var bsAbsoluteCenterPos = this.getBBoxCenterPositionWorldCoord();
	var auxBs = new BoundingSphere(bsAbsoluteCenterPos.x, bsAbsoluteCenterPos.y, bsAbsoluteCenterPos.z, radius);

	return cameraPosition.distToSphere(auxBs);
};

ExtrusionBuilding.prototype.getBBoxCenterPositionWorldCoord = function() 
{
	var geoLocData = this.getCurrentGeoLocationData();
	var mesh = this.objectsArray[0];
	var bs = mesh.getBoundingSphere();
	var bsLocalCenter = bs.centerPoint;
	
	return geoLocData.tMatrix.transformPoint3D(bsLocalCenter);
};
