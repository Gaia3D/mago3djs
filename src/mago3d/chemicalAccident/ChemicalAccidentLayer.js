'use strict';

/**
 * @class PollutionTimeSlice
 */
var ChemicalAccidentTimeSlice = function(options) 
{
	 if (!(this instanceof ChemicalAccidentTimeSlice)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this._fileileLoadState = CODE.fileLoadState.READY;
	 this._filePath;
	 this._jsonFile;
	 this._isPrepared = false;
	 this._glTexture;

	 if (options !== undefined)
	 {
		if (options.filePath)
		{
			this._filePath = options.filePath;
		}
	 }
};

ChemicalAccidentTimeSlice.prototype._prepare = function ()
{
	if (this._isPrepared)
	{
		return true;
	}

	if (this._fileileLoadState === CODE.fileLoadState.READY)
	{
		this._fileileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._filePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._fileileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._jsonFile = res;
		});
	}

	if (this._fileileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	this._isPrepared = true;

	return this._isPrepared;
};

/**
 * @class ChemicalAccidentLayer
 */
var ChemicalAccidentLayer = function(options) 
{
	if (!(this instanceof ChemicalAccidentLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.chemicalAccidentManager = undefined;
	this.geographicExtent;

	this._geoJsonIndexFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonIndexFile;
	this._geoJsonIndexFilePath;
	this._geoJsonIndexFileFolderPath;
	this._allLayersArePrepared = false;

	this._animationState = CODE.processState.NO_STARTED; 
	this._animationStartTime = 0;
	this._totalAnimTime;
	this._increTime;

	this._timeSlicesArray;

	if (options)
	{
		if (options.chemicalAccidentManager)
		{
			this.chemicalAccidentManager = options.chemicalAccidentManager;
		}

		if (options.altitude !== undefined)
		{
			this.altitude = options.altitude;
		}

		if (options.timeInterval_min !== undefined)
		{
			this.timeInterval_min = options.timeInterval_min;
		}

		if (options.timeSlicesCount !== undefined)
		{
			this.timeSlicesCount = options.timeSlicesCount;
		}

		if (options.timeSliceFileNames !== undefined)
		{
			this.timeSliceFileNames = options.timeSliceFileNames;
		}

		if (options.timeSliceFileFolderPath !== undefined)
		{
			this.timeSliceFileFolderPath = options.timeSliceFileFolderPath;
		}
	}

};

ChemicalAccidentLayer.prototype.getTotalAnimationTimeMinutes = function ()
{
	var timeInterval_min = this.timeInterval_min;
	var timeSlicesCount = this._timeSlicesArray.length;
	var totalAnimTimeMinutes = timeInterval_min * timeSlicesCount;
	return totalAnimTimeMinutes;
};

ChemicalAccidentLayer.prototype._load_indexFile = function (indexFilePath)
{
	if (this._geoJsonIndexFileLoadState === CODE.fileLoadState.READY)
	{
		this._geoJsonIndexFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._geoJsonIndexFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that._geoJsonIndexFileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that._geoJsonIndexFile = res;
		});
	}
};

ChemicalAccidentLayer.prototype._prepareLayer = function ()
{
	if (this._isPrepared)
	{
		return true;
	}

	// check if all timeSliceFiles are loaded.***
	if (this._timeSlicesArray === undefined)
	{
		this._timeSlicesArray = [];
	}

	if (this._timeSlicesArray.length === 0)
	{
		// start to load files.***
		var timeSliceFileNamesCount = this.timeSliceFileNames.length;
		for (var i=0; i<timeSliceFileNamesCount; i++)
		{
			var filePath = this.timeSliceFileFolderPath + "\\" + this.timeSliceFileNames[i];
			var options = {
				filePath: filePath
			};
			var timeSlice = new ChemicalAccidentTimeSlice(options);
			this._timeSlicesArray.push(timeSlice);
		}
	}

	// now, check if all timeSlices are ready.***
	var isPrepared = true;
	var timeSlicesCount = this._timeSlicesArray.length;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (!timeSlice._prepare())
		{
			isPrepared = false;
		}
	}

	if (!isPrepared)
	{
		return false;
	}

	// Now, make the surface mesh.***
	if (this._timeSlicesArray.length === 0)
	{
		return false;
	}

	if (this._terrainSampled === undefined)
	{
		this._terrainSampled = false;
	}

	if (this._terrainSamplingState === CODE.processState.NO_STARTED)
	{
		this._terrainSamplingState = CODE.processState.STARTED;

		var magoManager = this._pollutionVolumeOwner.weatherStation.magoManager;

		// create a mesh data container.***
		if (this.vboKeysContainer === undefined)
		{
			this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();

			// create a vboKey.***
			this.vboKeysContainer.newVBOVertexIdxCacheKey();
		}
		var vboKey = this.vboKeysContainer.getVboKey(0);

		// Take the numCols & numRoes from the 1rst timeSlice.***
		var timeSlice = this._timeSlicesArray[0];
		var numCols = timeSlice._jsonFile.columnsCount;
		var numRows = timeSlice._jsonFile.rowsCount;
		var geoJsonIndexFile = this._pollutionVolumeOwner._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

		// must find the 4 geoCoords of the rectangle.***
		var widthMeters = geoJsonIndexFile.height_km * 1000.0;
		var heightMeters = geoJsonIndexFile.width_km * 1000.0;
		var resultObject = Globe.getRectangleMeshOnEllisoideCenteredAtGeographicCoord(centerGeoCoord, widthMeters, heightMeters, numCols, numRows);

		vboKey.setDataArrayIdx(resultObject.indices, magoManager.vboMemoryManager);

		//////////////////////////////////////////////////////////////////////////////////////////////
		var magoManager = this._pollutionVolumeOwner.weatherStation.magoManager;
		var terrainProvider = magoManager.scene.globe.terrainProvider;
		var maxZoom = MagoManager.getMaximumLevelOfTerrainProvider(terrainProvider);
		//////////////////////////////////////////////////////////////////////////////////////////////

		// Now, must transform points to geoCoords.***
		var bStoreAbsolutePosition = false;
		var pointsArray = resultObject.pointsArray; // Point3D array.***
		this._texCoordsArray = resultObject.texCoordsArray;
		var result = Globe.Point3DToGeographicWgs84Array(pointsArray, bStoreAbsolutePosition);
		var geoCoordsArray = result.geoCoordsArray;

		// Now, transform geoCoords to Cesium.Cartographic {lonRad, latRad, height}.***
		var geoCoordsCount = geoCoordsArray.length;
		this._cartographicsArray = new Array(geoCoordsCount); // {lonRad, latRad, height} array.***
		for (var i=0; i<geoCoordsCount; i++)
		{
			var geoCoord = geoCoordsArray[i];
			this._cartographicsArray[i] = Cesium.Cartographic.fromDegrees(geoCoord.longitude, geoCoord.latitude);
		}

		// Finally sample terrain.***
		var terrainLevel = 10;
		if (terrainLevel > maxZoom)
		{
			terrainLevel = maxZoom;
		}
		var promise = Cesium.sampleTerrain(terrainProvider, terrainLevel, this._cartographicsArray);
		var that = this;
		Cesium.when(promise, function(updatedPositions) 
		{
			// positions[0].height and positions[1].height have been updated.
			// updatedPositions is just a reference to positions.
			//console.log('XXX - Height in meters is: ' + updatedPositions[0].height);
			that._terrainSamplingState = CODE.processState.FINISHED;
		});
	}

	if (this._terrainSamplingState !== CODE.processState.FINISHED)
	{
		return false;
	}

	if (this._makingRectangleMeshProcess === undefined)
	{
		this._makingRectangleMeshProcess = CODE.processState.NO_STARTED;
	}

	if (this._makingRectangleMeshProcess === CODE.processState.NO_STARTED)
	{
		// Now, make the rectangle's vbo.***
		// 1rst, for all points, add 10m to altitude.***
		var altitude = 10.0;
		var cartographicsCount = this._cartographicsArray.length;
		var lonArray = new Array(cartographicsCount);
		var latArray = new Array(cartographicsCount);
		var altArray = new Array(cartographicsCount);
		for (var i=0; i<cartographicsCount; i++)
		{
			var cartographic = this._cartographicsArray[i]; // Cartographic {longitude, latitude, height}
			lonArray[i] = cartographic.longitude;
			latArray[i] = cartographic.latitude;
			altArray[i] = cartographic.height + altitude;
		}

		var positions = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, undefined);

		// Now, create a geolocationData.***
		// Find the centerPosition, and recalculate all position to the centerPosition.***
		var localPositions = GeometryUtils.getCenterPositionAndLocalPositions3DFloat32(positions);
		var centerPos = localPositions.centerPos;

		// Now, calculate the geoCoord of the centerPos.***
		var centerGeoCoord = Globe.CartesianToGeographicWgs84(centerPos.x, centerPos.y, centerPos.z, undefined, false);

		if (this.geoLocDataManager === undefined)
		{ this.geoLocDataManager = new GeoLocationDataManager(); }

		var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
		if (geoLocData === undefined)
		{
			geoLocData = this.geoLocDataManager.newGeoLocationData("default");
		}

		var heading = 0.0;
		var pitch = 0.0;
		var roll = 0.0;

		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);

		// Note : the rectangle has buildingRotMatrix = Identity !
		geoLocData.rotMatrix.Identity();
		//---------------------------------------------------------

		// Now, set vbo position & texCoords.***
		var magoManager = this._pollutionVolumeOwner.weatherStation.magoManager;
		var vboKey = this.vboKeysContainer.getVboKey(0);
		vboKey.setDataArrayPos(localPositions.localPosFloatArray, magoManager.vboMemoryManager);

		// this._texCoordsArray
		var texCoordsCount = this._texCoordsArray.length;
		var texCoordsFloatArray = new Float32Array(texCoordsCount*2);
		for (var i=0; i<texCoordsCount; i++)
		{
			var texCoord = this._texCoordsArray[i];
			texCoordsFloatArray[2*i] = texCoord.x;
			texCoordsFloatArray[2*i+1] = texCoord.y;
		}
		vboKey.setDataArrayTexCoord(texCoordsFloatArray, magoManager.vboMemoryManager);

		// The process finished.***
		this._makingRectangleMeshProcess = CODE.processState.FINISHED;
		return false;
	}

	// If all process are finished, then set isPrepared as true.***
	this._isPrepared = true;

	return this._isPrepared;
};