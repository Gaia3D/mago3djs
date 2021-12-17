'use strict';

/**
 * 여러개의 MagoRenderable을 성능 개선을 위해 합쳐서 표출 시 사용
 * @class MergedObject
 * @param {MagoManager} magoManager
*/
var MergedObject = function(magoManager) 
{
	if (!(this instanceof MergedObject)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	if (!magoManager) 
	{
		throw new Error(Messages.REQUIRED_EMPTY_ERROR('MagoManager'));
	}

	MagoRenderable.call(this);
	this._guid = createGuid();
	this.geoLocDataManager;
	this.magoManager = magoManager;

	this.attributes = {
		isVisible: true
	};

	this.magoRenderables = [];
	this.hash = {};
	this.dirty = true;
	this.masterId;
};
MergedObject.prototype = Object.create(MagoRenderable.prototype);
MergedObject.prototype.constructor = MergedObject;

/**
 * @param {Array<MagoRenderable>} magoRenderables
 * @return {Promise}
 */
MergedObject.prototype.initialize = function (magoRenderables) 
{
	var terrainProvider = this.magoManager.scene.globe.terrainProvider;
	var tilingScheme = terrainProvider.tilingScheme;
	var maxZoom = MagoManager.getMaximumLevelOfTerrainProvider(terrainProvider);

	var cache = {};

	var magoRenderablesCount = magoRenderables.length;
	var models = [];
	var availableRequestTileModels = [];
	var centerGeographicCoordsArray = [];
	var centroid = {longitude: 0, latitude: 0, altitude: 0};
	for (var i=0;i<magoRenderablesCount;i++) 
	{
		var mrender = magoRenderables[i];
		var carto = Cesium.Cartographic.fromDegrees(mrender.centerGeographicCoords.longitude, mrender.centerGeographicCoords.latitude);
		var xy = tilingScheme.positionToTileXY(carto, maxZoom);
		var strXy = xy.toString();

		if (!cache.hasOwnProperty(strXy)) 
		{
			cache[strXy] = terrainProvider.getTileDataAvailable(xy.x, xy.y, maxZoom);
		}

		if (cache[strXy]) 
		{
			availableRequestTileModels.push(mrender);
			centerGeographicCoordsArray.push(carto);
		}
		else 
		{
			models.push(mrender);
			centroid.longitude = centroid.longitude + mrender.centerGeographicCoords.longitude;
			centroid.latitude = centroid.latitude + mrender.centerGeographicCoords.latitude;
		}
	}

	var self = this;
	var _init = function(positions) 
	{
		var count = positions.length;
        
		for (var j=0;j<count;j++) 
		{
			var position = positions[j];
			var height = position.height === undefined ? 0 : position.height;

			var magoRenderable = availableRequestTileModels[j];
			var magoRenderableGeographicCoordListsArrayCnt = magoRenderable.geographicCoordListsArray.length;
			for (var k=0;k<magoRenderableGeographicCoordListsArrayCnt;k++) 
			{
				var magoRenderableGeographicCoordsList = magoRenderable.geographicCoordListsArray[k];
				magoRenderableGeographicCoordsList.setAltitude(height);
			}

			centroid.longitude = centroid.longitude + position.longitude * 180 / Math.PI;
			centroid.latitude = centroid.latitude + position.latitude * 180 / Math.PI;
			centroid.altitude = centroid.altitude + height;

			models.push(magoRenderable);
		}

		self.setGeographicPosition(new GeographicCoord(centroid.longitude/magoRenderablesCount, centroid.latitude/magoRenderablesCount, centroid.altitude/magoRenderablesCount));
		self.addMagoRenderables(models);

		return self;
	};

	return Cesium.sampleTerrain(terrainProvider, maxZoom, centerGeographicCoordsArray).then(_init);
};

MergedObject.prototype.makeMesh = function () 
{
	var workersManager = this.magoManager.workersManager;
	var extrudeWorkerManager = workersManager.getExtrudeWorkerManager();

	if (extrudeWorkerManager.isBusy())
	{
		return;
	}

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
    
	this.objectsArray = [];
	var mergedMesh;
	var renderableCount = this.magoRenderables.length;

	var objectsToExtrudeArray = new Array(renderableCount);

	for (var j=0;j<renderableCount;j++) 
	{
		var magoRenderable = this.magoRenderables[j];
		var objectToExtrude = {
			height: magoRenderable.height
		};

		var geoCoordsListsArray = [];
		var geoCoordsListsCount = magoRenderable.geographicCoordListsArray.length;
		for (var i=0; i<geoCoordsListsCount; i++) 
		{
			var geographicCoordList = magoRenderable.geographicCoordListsArray[i];
			geoCoordsListsArray.push(geographicCoordList); // ***
		}

		objectToExtrude.geographicCoordsListsArray = geoCoordsListsArray; // ***
		objectsToExtrudeArray[j] = objectToExtrude; // ***
	}
	var guid = this._guid;
	var data = {
		guid                  : guid,
		objectsToExtrudeArray : objectsToExtrudeArray,
		color                 : this.color4,
		geoLocation           : {longitude : geoLocData.geographicCoord.longitude,
			latitude  : geoLocData.geographicCoord.latitude,
			altitude  : geoLocData.geographicCoord.altitude},
		rotation: {heading : geoLocData.heading,
			pitch   : geoLocData.pitch,
			roll    : geoLocData.roll}
	};
	extrudeWorkerManager.doExtrude(data); // ***

	mergedMesh = new Mesh();
	this.objectsArray.push(mergedMesh);

	// Now, delete data.***
	var vboMemManager = this.magoManager.vboMemoryManager;
    
	var magoRenderablesCount = this.magoRenderables.length;
	for (var i=0; i<magoRenderablesCount; i++) 
	{
		// delete koreaBuildings.
		if (magoRenderable.geographicCoordListsArray) 
		{
			var geoCoordsListsCount = magoRenderable.geographicCoordListsArray.length;
			for (var i=0; i<geoCoordsListsCount; i++) 
			{
				var geographicCoordList = magoRenderable.geographicCoordListsArray[i];
				geographicCoordList.deleteObjects(vboMemManager); // ***
				delete magoRenderable.geographicCoordListsArray[i];
			}
			delete magoRenderable.geographicCoordListsArray;
		}

		// delete magoRenderable.
		this.magoRenderables[i].deleteObjects();
		delete this.magoRenderables[i];
	}
	delete this.magoRenderables;

	this.setDirty(false);

	if (this.attributes.heightReference !== HeightReference.NONE) 
	{
		if (this.terrainHeight) { this.setTerrainHeight(this.terrainHeight); }
	}
};

MergedObject.prototype.makeMesh_original = function() 
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
	
	this.objectsArray = [];
	var mergedMesh;
	var renderableCount = this.magoRenderables.length;
	for (var j=0;j<renderableCount;j++) 
	{
		var magoRenderable = this.magoRenderables[j];
		var geoCoordsListsCount = magoRenderable.geographicCoordListsArray.length;
		for (var i=0; i<geoCoordsListsCount; i++) 
		{
			var geographicCoordList = magoRenderable.geographicCoordListsArray[i];
			// Make the topGeoCoordsList.
			var topGeoCoordsList = geographicCoordList.getCopy();
			// Reassign the altitude on the geoCoordsListCopy.
			//geographicCoordList.setAltitude(0);
			topGeoCoordsList.addAltitude(magoRenderable.height);
            
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
            
			if (i===0 && j===0) 
			{
				mergedMesh = surfIndepMesh;
				continue;
			}
			mergedMesh.mergeMesh(surfIndepMesh);
		}
	}
	this.objectsArray.push(mergedMesh);
    
	delete this.magoRenderables;

	this.setDirty(false);

	if (this.attributes.heightReference !== HeightReference.NONE) 
	{
		if (this.terrainHeight) { this.setTerrainHeight(this.terrainHeight); }
	}
};

/**
 * @param {Array<MagoRenderable>} magoRenderables
 */
MergedObject.prototype.addMagoRenderables = function(magoRenderables) 
{
	this.magoRenderables.push.apply(this.magoRenderables, magoRenderables);
	var cnt = magoRenderables.length;
	for (var i=0;i<cnt;i++) 
	{
		this.addMagoRenderable(magoRenderables[i], true);
	}
	this.dirty = true;
};

/**
 * @param {MagoRenderable} magoRenderable
 * @param {boolean} silence
 */
MergedObject.prototype.addMagoRenderable = function(magoRenderable, silence) 
{
	this.magoRenderables.push(magoRenderable);
	//this.hash[magoRenderable.guid] = magoRenderable;
	if (!silence) { this.dirty = true; }
};

MergedObject.prototype.render = function (magoManager, shader, renderType, glPrimitive, bIsSelected) 
{
	var master = magoManager.koreaBuildingMaster[this.masterId];
	if (!master) 
	{
		return;
	}

	if (master.show !== undefined && master.show === false) 
	{
		return;
	}

	this.color4 = master.color;

	if (this.dirty) 
	{ 
		this.makeMesh(magoManager); 
	}

	// Check if  vbo arrived from workers.***
	if (!this.vboFromWorker) 
	{
		var workersManager = magoManager.workersManager;
		var extrudeWorkerManager = workersManager.getExtrudeWorkerManager();

		var result = extrudeWorkerManager.getResult(this._guid);
		if (!result) 
		{
			return false;
		}

		var vboData = result.vbosArray[0];

		//resultVbo.posVboDataArray = posVboDataArray;
		//resultVbo.norVboDataArray = norVboDataArray;
		//resultVbo.colVboDataArray = colVboDataArray;
		//resultVbo.tcoordVboDataArray = tcoordVboDataArray;
		//resultVbo.indicesArray = indicesArray

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