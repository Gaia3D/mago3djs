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

	var workersManager = this.magoManager.workersManager;
	var extrudeWorkerManager = workersManager.getExtrusionWorkerManager();

	if (extrudeWorkerManager.isBusy())
	{
		return;
	}

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
	var objectsToExtrudeArray = new Array(geoCoordsListsCount);
	for (var i=0; i<geoCoordsListsCount; i++)
	{
		var geographicCoordList = this.geographicCoordListsArray[i];
		var floorHeight = this.floorHeight ? this.floorHeight : 3.3;
		var height = this.height;
		var divideLevel = this.divideLevel;

		var objectToExtrude = {
			floorHeight,
			height,
			divideLevel,
			geographicCoordsListsArray: [geographicCoordList]
		};
		objectsToExtrudeArray[i] = objectToExtrude;
	}

	var guid = this._guid;
	var color = Color.toArray(this.color4);
	var data = {
		guid                  : guid,
		objectsToExtrudeArray : objectsToExtrudeArray,
		color                 : color,
		geoLocation           : {longitude : geoLocData.geographicCoord.longitude,
			latitude  : geoLocData.geographicCoord.latitude,
			altitude  : geoLocData.geographicCoord.altitude},
		rotation: {heading : geoLocData.heading,
			pitch   : geoLocData.pitch,
			roll    : geoLocData.roll}
	};
	extrudeWorkerManager.doExtrude(data); // ***
	
	this.objectsArray.push(new Mesh());
	
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

ExtrusionBuilding.prototype.render = function (magoManager, shader, renderType, glPrimitive, bIsSelected) 
{
	if (this.attributes) 
	{
		if (this.attributes.isVisible !== undefined && this.attributes.isVisible === false)
		{
			return;
		}
	}
	
	if (this.dirty) 
	{ 
		this.makeMesh(magoManager); 
	}

	// Check if  vbo arrived from workers.***
	if (!this.vboFromWorker) 
	{
		var workersManager = magoManager.workersManager;
		var extrudeWorkerManager = workersManager.getExtrusionWorkerManager();

		var result = extrudeWorkerManager.getResult(this._guid);
		if (!result) 
		{
			return false;
		}

		var vboData = result.vbosArray[0];
		var vboKeyContainer = new VBOVertexIdxCacheKeysContainer();

		var vboMemManager = magoManager.vboMemoryManager;
		
		var vboKey = vboKeyContainer.newVBOVertexIdxCacheKey();
		vboKey.setDataArrayPos((vboData.posVboDataArray), vboMemManager); // Normals.

		if (vboData.norVboDataArray) 
		{
			vboKey.setDataArrayNor((vboData.norVboDataArray), vboMemManager);
		} 

		if (vboData.tcoordVboDataArray) 
		{
			vboKey.setDataArrayTexCoord((vboData.tcoordVboDataArray), vboMemManager);
		} 

		if (vboData.colVboDataArray) 
		{
			vboKey.setDataArrayCol((vboData.colVboDataArray), vboMemManager);
		} 

		vboKey.setDataArrayIdx((vboData.indicesArray), vboMemManager);

		// now, assign the vboContainer to our mesh.
		var mesh = this.objectsArray[0];
		mesh.vboKeysContainer = vboKeyContainer;

		this.vboFromWorker = true;
	}
	
	if (!this.objectsArray || this.objectsArray.length === 0)
	{ return false; }

	var gl = magoManager.getGl();
	if (this.attributes.opacity !== undefined)
	{
		gl.uniform1f(shader.externalAlpha_loc, this.attributes.opacity);
	}

	// Set geoLocation uniforms.***
	
	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, shader); // rotMatrix, positionHIGH, positionLOW.

	//shader.clippingPolygon2dPoints_loc = gl.getUniformLocation(shader.program, "clippingPolygon2dPoints");
	//shader.clippingConvexPolygon2dPointsIndices_loc = gl.getUniformLocation(shader.program, "clippingConvexPolygon2dPointsIndices");

	if (this.attributes.doubleFace)
	{
		gl.disable(gl.CULL_FACE);
	}
	else 
	{
		gl.enable(gl.CULL_FACE);
	}

	var renderShaded = true;
	if (this.options && this.options.renderShaded === false)
	{
		renderShaded = false;
	}
	gl.uniform1i(shader.bApplySpecularLighting_loc, false);
	if (renderShaded)
	{ this.renderAsChild(magoManager, shader, renderType, glPrimitive, bIsSelected, this.options); }

	// Return the opacity to 1.
	gl.uniform1f(shader.externalAlpha_loc, 1.0);
	// delete specularLighting
	gl.uniform1i(shader.bApplySpecularLighting_loc, false);
	// return clippingType to 0 (0= no clipping).***
	gl.uniform1i(shader.clippingType_loc, 0);
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
 * 
 * @param {number} min 
 * @param {number} max 
 */
ExtrusionBuilding.prototype.setSplitHeight = function(min, max) 
{
	if (isNaN(min) || isNaN(max)) 
	{
		throw new Error('value must number');
	}
	if (min > max) 
	{
		throw new Error('min value must lower than max value');
	}

	this.options.limitationHeights = new Float32Array([min, max]);
};

/**
 * 
 * @param {Color | DynamicColor} color 
 */
ExtrusionBuilding.prototype.setLimitationColor = function(color) 
{
	if (!color || !(color instanceof Color || color instanceof DynamicColor)) { throw new Error('invalid parameter'); }

	if (!this.options) { this.options = {}; }
	this.options.limitationInfringingDynamicColor4 = color;
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
