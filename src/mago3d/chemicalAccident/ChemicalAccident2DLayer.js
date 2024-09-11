'use strict';

/**
 * @class ChemicalAccident2DLayer
 */
var ChemicalAccident2DLayer = function(options) 
{
	if (!(this instanceof ChemicalAccident2DLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.chemicalAccident2DManager = undefined;
	this.geographicExtent;

	this._jsonIndexFile;
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

	this._isPrepared = false;
	this._terrainSamplingState = CODE.processState.NO_STARTED;

	this._layerData;
	this._isDoRender = true;

	this.textureFilterType = 0; // 0= nearest, 1= linear.***
	this.renderBorder = 0; // 0= no render border, 1= render border.***
	this.renderingColorType = 0; // 0= rainbow, 1= monotone, 2= legendColors.***
	this.interpolationBetweenSlices = 0; // 0= no interpolation, 1= interpolation.***
	this.textureFlipYAxis = true;

	// legend colors.***
	this._legendColors4;
	this._legendValues;
	this._legendColorsCount = 0;
	this._legendValuesScale = 1.0;

	// object to render.***
	this.simulationBox = undefined;
	this.vboKeysContainer;
	this.volumeDepthFBO = undefined;
	this.screenFBO = undefined;

	// params.***
	this.useMinMaxValuesToRender = 0;
	//this.minMaxPollutionValuesToRender = new Float32Array([0.0, 0.0194]);
	this.minMaxPollutionValuesToRender = new Float32Array([0.0, 0.0194 * 0.5]);

	// cutting planes.
	this.cuttingPlanesArray = [];
	this.currentActiveCuttingPlaneIdx = -1;

	if (options)
	{
		if (options.url)
		{
			this._jsonIndexFile = new JsonIndexFile({url: options.url});
		}

		if (options.chemicalAccident2DManager)
		{
			this.chemicalAccident2DManager = options.chemicalAccident2DManager;
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

		if (options.renderingColorType !== undefined)
		{
			this.renderingColorType = options.renderingColorType;
		}

		if (options.renderBorder !== undefined)
		{
			this.renderBorder = options.renderBorder;
		}

		if (options.textureFilterType !== undefined)
		{
			this.textureFilterType = options.textureFilterType;
		}

		if (options.interpolationBetweenSlices !== undefined)
		{
			this.interpolationBetweenSlices = options.interpolationBetweenSlices;
		}

		if (options.textureFlipYAxis !== undefined)
		{
			this.textureFlipYAxis = options.textureFlipYAxis;
		}
	}

};

ChemicalAccident2DLayer.prototype.setLegendColors = function (legendColorsArray)
{
	var legendColorsCount = legendColorsArray.length;
	if (legendColorsCount === 0)
	{
		return false;
	}

	this._legendColors4 = new Float32Array(legendColorsCount * 4);
	this._legendValues = new Float32Array(legendColorsCount);

	for (var i=0; i<legendColorsCount; i++)
	{
		var color = legendColorsArray[i];
		this._legendColors4[i*4] = color.red;
		this._legendColors4[i*4+1] = color.green;
		this._legendColors4[i*4+2] = color.blue;
		this._legendColors4[i*4+3] = color.alpha;
		this._legendValues[i] = color.value;
	}

	this._legendColorsCount = legendColorsCount;
};

ChemicalAccident2DLayer.prototype.show = function ()
{
	this._isDoRender = true;
};

ChemicalAccident2DLayer.prototype.hide = function ()
{
	this._isDoRender = false;
};

ChemicalAccident2DLayer.prototype.isShow = function ()
{
	return this._isDoRender;
};

ChemicalAccident2DLayer.prototype.setLegendValuesScale = function (legendValuesScale)
{
	this._legendValuesScale = legendValuesScale;
};

ChemicalAccident2DLayer.prototype.getLegendValuesScale = function ()
{
	return this._legendValuesScale;
};

ChemicalAccident2DLayer.prototype.copyLegendColors = function (legendColors4, legendValues, legendColorsCount, legendValuesScale)
{
	if (legendColors4 === undefined || legendValues === undefined || legendColorsCount === undefined)
	{
		return false;
	}

	this._legendColors4 = new Float32Array(legendColors4);
	this._legendValues = new Float32Array(legendValues);
	this._legendColorsCount = legendColorsCount;
	this._legendValuesScale = legendValuesScale;
};

ChemicalAccident2DLayer.prototype.getBlobArrayBuffer = function (mosaicFileName)
{
	if (this.map_pngOriginalFileName_pngsBinData === undefined)
	{
		return undefined;
	}


	var pngsBinData = this.map_pngOriginalFileName_pngsBinData[mosaicFileName];
	if (pngsBinData === undefined)
	{
		return undefined;
	}

	var pngsBinBlocksCount = this.pngsBinBlocksArray.length;
	for (var i=0; i<pngsBinBlocksCount; i++)
	{
		var pngsBinBlock = this.pngsBinBlocksArray[i];
		if (pngsBinBlock.fileName === pngsBinData.pngsBinaryBlockDataFileName)
		{
			var startIdx = pngsBinData.startByteIndex;
			var endIdx = pngsBinData.endByteIndex;
			var pngsBinBlockData = pngsBinBlock.dataArraybuffer;
			var pngsBinBlockDataCopy = pngsBinBlockData.slice(startIdx, endIdx);
			return pngsBinBlockDataCopy;
		}
	}
	
	return undefined;
	
};

ChemicalAccident2DLayer.prototype._prepareJsonIndexFile = function ()
{
	// // check if exist jsonIndexFiles.***
	if (this._jsonIndexFile === undefined)
	{
		return false;
	}

	if (!this._jsonIndexFile._prepare())
	{
		return false;
	}

	return true;
};

ChemicalAccident2DLayer.prototype._prepareLayer = function ()
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

	if (!this._prepareJsonIndexFile())
	{
		return false;
	}

	this._geoJsonIndexFile = this._jsonIndexFile._geoJsonIndexFile;
	if (this._geoJsonIndexFile === undefined)
	{
		return false;
	}

	// Check if exist png's blob arrayBuffers.***
	if (this._geoJsonIndexFile.pngsBinBlockFileNames !== undefined)
	{
		// make map originalPngFileName_
		var pngsBinBlockFileNames = this._geoJsonIndexFile.pngsBinBlockFileNames;
		var pngsBinBlockFileNamesCount = pngsBinBlockFileNames.length;

		if (this.pngsBinBlocksArray === undefined)
		{
			this.pngsBinBlocksArray = [];

			for (var i=0; i<pngsBinBlockFileNamesCount; i++)
			{
				var pngsBinBlockFileName = pngsBinBlockFileNames[i];
				var pngsBinBlock = {
					fileName        : pngsBinBlockFileName.fileName,
					dataArraybuffer : undefined,
					fileLoadState   : CODE.fileLoadState.READY
				};
				this.pngsBinBlocksArray.push(pngsBinBlock);
			}

		}

		// Now, check if all pngsBinBlocks are loaded.***
		var allPngsBinBlocksLoaded = true;
		var loadRequestsCount = 0;
		for (var i=0; i<pngsBinBlockFileNamesCount; i++)
		{
			var pngsBinBlock = this.pngsBinBlocksArray[i];
			if (pngsBinBlock.fileLoadState === CODE.fileLoadState.READY)
			{
				this._loadPngsBinaryBlockData(pngsBinBlock, this._geoJsonIndexFile._geoJsonIndexFileFolderPath);
				loadRequestsCount += 1;
			}
			else if (pngsBinBlock.fileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
			{
				loadRequestsCount += 1;
				allPngsBinBlocksLoaded = false;
			}

			if (loadRequestsCount > 0)
			{
				return false;
			}
		}	
		
		if (!allPngsBinBlocksLoaded)
		{
			return false;
		}

		// make a map key = originalPngFileName, value = pngsBinBlock.***
		if (this.map_pngOriginalFileName_pngsBinData === undefined)
		{
			this.map_pngOriginalFileName_pngsBinData = {};
			var originalPngFileNamesCount = this._geoJsonIndexFile.pngsBinDataArray.length;
			for (var i=0; i<originalPngFileNamesCount; i++)
			{
				var pngsBinData = this._geoJsonIndexFile.pngsBinDataArray[i];
				this.map_pngOriginalFileName_pngsBinData[pngsBinData.originalPngFileName] = pngsBinData;
			}

		}

	}

	if (this._timeSlicesArray.length === 0)
	{
		// start to load files.***
		var geoJsonIndexFile = this._geoJsonIndexFile;
		var year = geoJsonIndexFile.year;
		var month = geoJsonIndexFile.month - 1; // month is 0 to 11.***
		var day = geoJsonIndexFile.day;
		var hour = geoJsonIndexFile.hour;
		var minute = geoJsonIndexFile.minute;
		var second = geoJsonIndexFile.second;
		var millisecond = geoJsonIndexFile.millisecond;

		var timeIncrementMilisecond = 0;
		var timeInterval = geoJsonIndexFile.timeInterval;
		var timeIntervalUnits = geoJsonIndexFile.timeIntervalUnits;

		if (timeIntervalUnits === "minutes" || timeIntervalUnits === "minute")
		{
			timeIncrementMilisecond = timeInterval * 60 * 1000;
		}

		var date = new Date(year, month, day, hour, minute, second, millisecond);
		var startUnixTimeMiliseconds = date.getTime();

		if (this._layerData === undefined)
		{
			this._layerData = this._geoJsonIndexFile.layers[0];
		}

		//var timeSliceFileNamesCount = geoJsonIndexFile.mosaicTexMetaDataJsonArray.length;
		var timeSliceFileNamesCount = this._layerData.timeSlicesCount;
		for (var i=0; i<timeSliceFileNamesCount; i++)
		{
			var timeSliceStartUnixTimeMiliseconds = startUnixTimeMiliseconds + i * timeIncrementMilisecond;
			var timeSliceEndUnixTimeMiliseconds = timeSliceStartUnixTimeMiliseconds + timeIncrementMilisecond;
			var options = {
				owner                    : this,
				startUnixTimeMiliseconds : timeSliceStartUnixTimeMiliseconds,
				endUnixTimeMiliseconds   : timeSliceEndUnixTimeMiliseconds
			};
			var timeSlice = new ChemicalAccident2DTimeSlice(options);
			//timeSlice._jsonFile = geoJsonIndexFile.mosaicTexMetaDataJsonArray[i];
			timeSlice._jsonFile = this._layerData.timeSlices[i];
			timeSlice._fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

			this._timeSlicesArray.push(timeSlice);
		}

		return false;
	}

	// now, check if all timeSlices are ready.***
	var isPrepared = true;
	var timeSlicesCount = this._timeSlicesArray.length;
	var counterAux = 0;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (!timeSlice._prepare(this))
		{
			isPrepared = false;
			counterAux++;
		}

		if (counterAux > 2)
		{ break; }
	}

	if (!isPrepared)
	{
		return false;
	}

	// // create a voxelizer.***
	// if (!this.voxelizer)
	// {
	// 	// The voxelizer here is used to make the mosaicTexture from textures3D.***
	// 	// note : the mosaicTexture is Texture3D too.***
	// 	var options = {};
	// 	this.voxelizer = new Voxelizer(options);
	// }

	// if (!this.oneVoxelSizeInMeters)
	// {
	// 	this.oneVoxelSizeInMeters = new Float32Array([1.0, 1.0, 1.0]);

	// 	var someSlice3D = this._timeSlicesArray[0];

	// 	var geoJsonIndexFile = this.chemicalAccident2DManager._geoJsonIndexFile;
	// 	var widthMeters = geoJsonIndexFile.height_km * 1000.0;
	// 	var heightMeters = geoJsonIndexFile.width_km * 1000.0;

	// 	// take any slice2d to get columnsCount and rowsCount.***
	// 	var slice2d = someSlice3D._jsonFile.dataSlices[0];
	// 	var columnsCount = slice2d.width;
	// 	var rowsCount = slice2d.height;

	// 	this.oneVoxelSizeInMeters[0] = widthMeters / columnsCount;
	// 	this.oneVoxelSizeInMeters[1] = heightMeters / rowsCount;
	// 	this.oneVoxelSizeInMeters[2] = this.oneVoxelSizeInMeters[0]; // in z direction is the same.***
	// }

	// // Now make the textures3D.***
	// if (!this._allTimeSlicesTextures3DReady)
	// {
	// 	if (this.minMaxPollutionValues === undefined)
	// 	{
	// 		this.minMaxPollutionValues = new Float32Array(2); 
	// 	}
	// 	var someSlice3D = this._timeSlicesArray[0];
	// 	this.minMaxPollutionValues[0] = someSlice3D._jsonFile.minValue;
	// 	this.minMaxPollutionValues[1] = someSlice3D._jsonFile.maxValue;

	// 	var magoManager = this.chemicalAccident2DManager.magoManager;
	// 	var gl = magoManager.sceneState.gl;
	// 	//var minmaxPollutionValues = this.getMinMaxPollutionValues();
	// 	this._makeTextures(gl, this.minMaxPollutionValues);
	// }
	

	// // Now, make the surface mesh.***
	// if (this._timeSlicesArray.length === 0)
	// {
	// 	return false;
	// }

	// if (this._terrainSampled === undefined)
	// {
	// 	this._terrainSampled = false;
	// }

	var magoManager = this.chemicalAccident2DManager.magoManager;

	if (this.geoLocDataManager === undefined)
	{
		// Now, calculate the geoCoord of the centerPos.***
		var geoJsonIndexFile = this._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

		this.geoLocDataManager = new GeoLocationDataManager();

		var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
		if (geoLocData === undefined)
		{
			geoLocData = this.geoLocDataManager.newGeoLocationData("default");
		}

		var heading = 0.0;
		var pitch = 0.0;
		var roll = 0.0;

		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);
	}

	// create a mesh data container.***
	if (this.vboKeysContainer === undefined)
	{
		this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();

		// create a vboKey.***
		this.vboKeysContainer.newVBOVertexIdxCacheKey();
	}

	if (this._terrainSamplingState === CODE.processState.NO_STARTED)
	{
		this._terrainSamplingState = CODE.processState.STARTED;

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
		var numCols = timeSlice._jsonFile.width;
		var numRows = timeSlice._jsonFile.height;
		var geoJsonIndexFile = this._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

		// must find the 4 geoCoords of the rectangle.***
		var widthMeters = geoJsonIndexFile.height_km * 1000.0;
		var heightMeters = geoJsonIndexFile.width_km * 1000.0;
		var resultObject = Globe.getRectangleMeshOnEllisoideCenteredAtGeographicCoord(centerGeoCoord, widthMeters, heightMeters, numCols, numRows);

		vboKey.setDataArrayIdx(resultObject.indices, magoManager.vboMemoryManager);

		//////////////////////////////////////////////////////////////////////////////////////////////
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

		this._terrainSamplingState = CODE.processState.FINISHED;

		// // Finally sample terrain.***
		// var terrainLevel = 10;
		// if (terrainLevel > maxZoom)
		// {
		// 	terrainLevel = maxZoom;
		// }
		// var promise = Cesium.sampleTerrain(terrainProvider, terrainLevel, this._cartographicsArray);
		// var that = this;
		// Cesium.when(promise, function(updatedPositions) 
		// {
		// 	// positions[0].height and positions[1].height have been updated.
		// 	// updatedPositions is just a reference to positions.
		// 	//console.log('XXX - Height in meters is: ' + updatedPositions[0].height);
		// 	that._terrainSamplingState = CODE.processState.FINISHED;
		// });
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

		var positionsWC = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, undefined);

		// now, calculate the local positions to center the rectangle.***
		var geoJsonIndexFile = this._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;
		var tMatAtCenter = Globe.transformMatrixAtGeographicCoord(centerGeoCoord, undefined);
		var tMatAtCenterInv = Cesium.Matrix4.inverse(tMatAtCenter, new Cesium.Matrix4());
		var localPosFloatArray = new Float32Array(positionsWC.length);
		var posWCCount = positionsWC.length/3;
		for (var i=0; i<posWCCount; i++)
		{
			var posWC = new Cesium.Cartesian3(positionsWC[3*i], positionsWC[3*i+1], positionsWC[3*i+2]);
			var posLC = Cesium.Matrix4.multiplyByPoint(tMatAtCenterInv, posWC, new Cesium.Cartesian3());
			localPosFloatArray[3*i] = posLC.x;
			localPosFloatArray[3*i+1] = posLC.y;
			localPosFloatArray[3*i+2] = posLC.z;
		}

		// Now, set vbo position & texCoords.***
		
		var vboKey = this.vboKeysContainer.getVboKey(0);
		vboKey.setDataArrayPos(localPosFloatArray, magoManager.vboMemoryManager);

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

	// // make the depth box.***
	// // the depth box is used for volumetric rendering. The depthBox renders rearFaces & frontFaces, so
	// // creates the volumetric zone.***
	// if (!this.simulationBox)
	// {
	// 	this._makeSimulationBox();
	// }




	// If all process are finished, then set isPrepared as true.***
	this._isPrepared = true;

	return this._isPrepared;
};

ChemicalAccident2DLayer.prototype._prepareLayer_original = function ()
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
		var geoJsonIndexFile = this.chemicalAccident2DManager._geoJsonIndexFile;
		var year = geoJsonIndexFile.year;
		var month = geoJsonIndexFile.month - 1; // month is 0 to 11.***
		var day = geoJsonIndexFile.day;
		var hour = geoJsonIndexFile.hour;
		var minute = geoJsonIndexFile.minute;
		var second = geoJsonIndexFile.second;
		var millisecond = geoJsonIndexFile.millisecond;

		var timeIncrementMilisecond = 0;
		var timeInterval = geoJsonIndexFile.timeInterval;
		var timeIntervalUnits = geoJsonIndexFile.timeIntervalUnits;

		if (timeIntervalUnits === "minutes" || timeIntervalUnits === "minute")
		{
			timeIncrementMilisecond = timeInterval * 60 * 1000;
		}

		var date = new Date(year, month, day, hour, minute, second, millisecond);
		var startUnixTimeMiliseconds = date.getTime();

		//var timeSliceFileNamesCount = geoJsonIndexFile.mosaicTexMetaDataJsonArray.length;
		var timeSliceFileNamesCount = this._layerData.timeSlicesCount;
		for (var i=0; i<timeSliceFileNamesCount; i++)
		{
			var timeSliceStartUnixTimeMiliseconds = startUnixTimeMiliseconds + i * timeIncrementMilisecond;
			var timeSliceEndUnixTimeMiliseconds = timeSliceStartUnixTimeMiliseconds + timeIncrementMilisecond;
			var options = {
				owner                    : this,
				startUnixTimeMiliseconds : timeSliceStartUnixTimeMiliseconds,
				endUnixTimeMiliseconds   : timeSliceEndUnixTimeMiliseconds
			};
			var timeSlice = new ChemicalAccident2DTimeSlice(options);
			//timeSlice._jsonFile = geoJsonIndexFile.mosaicTexMetaDataJsonArray[i];
			timeSlice._jsonFile = this._layerData.timeSlices[i];
			timeSlice._fileLoadState = CODE.fileLoadState.LOADING_FINISHED;

			this._timeSlicesArray.push(timeSlice);
		}

		return false;
	}

	// now, check if all timeSlices are ready.***
	var isPrepared = true;
	var timeSlicesCount = this._timeSlicesArray.length;
	var counterAux = 0;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (!timeSlice._prepare(this))
		{
			isPrepared = false;
			counterAux++;
		}

		if (counterAux > 2)
		{ break; }
	}

	if (!isPrepared)
	{
		return false;
	}

	// // create a voxelizer.***
	// if (!this.voxelizer)
	// {
	// 	// The voxelizer here is used to make the mosaicTexture from textures3D.***
	// 	// note : the mosaicTexture is Texture3D too.***
	// 	var options = {};
	// 	this.voxelizer = new Voxelizer(options);
	// }

	// if (!this.oneVoxelSizeInMeters)
	// {
	// 	this.oneVoxelSizeInMeters = new Float32Array([1.0, 1.0, 1.0]);

	// 	var someSlice3D = this._timeSlicesArray[0];

	// 	var geoJsonIndexFile = this.chemicalAccident2DManager._geoJsonIndexFile;
	// 	var widthMeters = geoJsonIndexFile.height_km * 1000.0;
	// 	var heightMeters = geoJsonIndexFile.width_km * 1000.0;

	// 	// take any slice2d to get columnsCount and rowsCount.***
	// 	var slice2d = someSlice3D._jsonFile.dataSlices[0];
	// 	var columnsCount = slice2d.width;
	// 	var rowsCount = slice2d.height;

	// 	this.oneVoxelSizeInMeters[0] = widthMeters / columnsCount;
	// 	this.oneVoxelSizeInMeters[1] = heightMeters / rowsCount;
	// 	this.oneVoxelSizeInMeters[2] = this.oneVoxelSizeInMeters[0]; // in z direction is the same.***
	// }

	// // Now make the textures3D.***
	// if (!this._allTimeSlicesTextures3DReady)
	// {
	// 	if (this.minMaxPollutionValues === undefined)
	// 	{
	// 		this.minMaxPollutionValues = new Float32Array(2); 
	// 	}
	// 	var someSlice3D = this._timeSlicesArray[0];
	// 	this.minMaxPollutionValues[0] = someSlice3D._jsonFile.minValue;
	// 	this.minMaxPollutionValues[1] = someSlice3D._jsonFile.maxValue;

	// 	var magoManager = this.chemicalAccident2DManager.magoManager;
	// 	var gl = magoManager.sceneState.gl;
	// 	//var minmaxPollutionValues = this.getMinMaxPollutionValues();
	// 	this._makeTextures(gl, this.minMaxPollutionValues);
	// }
	

	// // Now, make the surface mesh.***
	// if (this._timeSlicesArray.length === 0)
	// {
	// 	return false;
	// }

	// if (this._terrainSampled === undefined)
	// {
	// 	this._terrainSampled = false;
	// }

	var magoManager = this.chemicalAccident2DManager.magoManager;

	if (this.geoLocDataManager === undefined)
	{
		// Now, calculate the geoCoord of the centerPos.***
		var geoJsonIndexFile = this.chemicalAccident2DManager._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

		this.geoLocDataManager = new GeoLocationDataManager();

		var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();
		if (geoLocData === undefined)
		{
			geoLocData = this.geoLocDataManager.newGeoLocationData("default");
		}

		var heading = 0.0;
		var pitch = 0.0;
		var roll = 0.0;

		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);
	}

	// create a mesh data container.***
	if (this.vboKeysContainer === undefined)
	{
		this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();

		// create a vboKey.***
		this.vboKeysContainer.newVBOVertexIdxCacheKey();
	}

	if (this._terrainSamplingState === CODE.processState.NO_STARTED)
	{
		this._terrainSamplingState = CODE.processState.STARTED;

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
		var numCols = timeSlice._jsonFile.width;
		var numRows = timeSlice._jsonFile.height;
		var geoJsonIndexFile = this.chemicalAccident2DManager._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

		// must find the 4 geoCoords of the rectangle.***
		var widthMeters = geoJsonIndexFile.height_km * 1000.0;
		var heightMeters = geoJsonIndexFile.width_km * 1000.0;
		var resultObject = Globe.getRectangleMeshOnEllisoideCenteredAtGeographicCoord(centerGeoCoord, widthMeters, heightMeters, numCols, numRows);

		vboKey.setDataArrayIdx(resultObject.indices, magoManager.vboMemoryManager);

		//////////////////////////////////////////////////////////////////////////////////////////////
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

		this._terrainSamplingState = CODE.processState.FINISHED;

		// // Finally sample terrain.***
		// var terrainLevel = 10;
		// if (terrainLevel > maxZoom)
		// {
		// 	terrainLevel = maxZoom;
		// }
		// var promise = Cesium.sampleTerrain(terrainProvider, terrainLevel, this._cartographicsArray);
		// var that = this;
		// Cesium.when(promise, function(updatedPositions) 
		// {
		// 	// positions[0].height and positions[1].height have been updated.
		// 	// updatedPositions is just a reference to positions.
		// 	//console.log('XXX - Height in meters is: ' + updatedPositions[0].height);
		// 	that._terrainSamplingState = CODE.processState.FINISHED;
		// });
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

		var positionsWC = Globe.geographicRadianArrayToFloat32ArrayWgs84(lonArray, latArray, altArray, undefined);

		// now, calculate the local positions to center the rectangle.***
		var geoJsonIndexFile = this.chemicalAccident2DManager._geoJsonIndexFile;
		var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;
		var tMatAtCenter = Globe.transformMatrixAtGeographicCoord(centerGeoCoord, undefined);
		var tMatAtCenterInv = Cesium.Matrix4.inverse(tMatAtCenter, new Cesium.Matrix4());
		var localPosFloatArray = new Float32Array(positionsWC.length);
		var posWCCount = positionsWC.length/3;
		for (var i=0; i<posWCCount; i++)
		{
			var posWC = new Cesium.Cartesian3(positionsWC[3*i], positionsWC[3*i+1], positionsWC[3*i+2]);
			var posLC = Cesium.Matrix4.multiplyByPoint(tMatAtCenterInv, posWC, new Cesium.Cartesian3());
			localPosFloatArray[3*i] = posLC.x;
			localPosFloatArray[3*i+1] = posLC.y;
			localPosFloatArray[3*i+2] = posLC.z;
		}

		// Now, set vbo position & texCoords.***
		
		var vboKey = this.vboKeysContainer.getVboKey(0);
		vboKey.setDataArrayPos(localPosFloatArray, magoManager.vboMemoryManager);

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

	// // make the depth box.***
	// // the depth box is used for volumetric rendering. The depthBox renders rearFaces & frontFaces, so
	// // creates the volumetric zone.***
	// if (!this.simulationBox)
	// {
	// 	this._makeSimulationBox();
	// }




	// If all process are finished, then set isPrepared as true.***
	this._isPrepared = true;

	return this._isPrepared;
};

ChemicalAccident2DLayer.prototype._loadPngsBinaryBlockData = function (pngsBinBlock, folderPath)
{
	// var pngsBinBlock = {
	// 	fileName : pngsBinBlockFileName,
	// 	dataArraybuffer : undefined,
	// 	fileLoadState : CODE.fileLoadState.READY
	// };
	if (pngsBinBlock.fileLoadState === CODE.fileLoadState.READY)
	{
		pngsBinBlock.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = pngsBinBlock;
		var filePath = folderPath + "\\" + pngsBinBlock.fileName;
		loadWithXhr(filePath).done(function(res) 
		{
			that.fileLoadState = CODE.fileLoadState.LOADING_FINISHED;
			that.dataArraybuffer = res;
		});
	}
};

ChemicalAccident2DLayer.prototype._getScreenFBO = function(magoManager)
{
	// This is a screen size FBO.***
	if (!this.screenFBO)
	{
		var gl = magoManager.getGl();
		var sceneState = magoManager.sceneState;
		var bufferWidth = sceneState.drawingBufferWidth[0]; 
		var bufferHeight = sceneState.drawingBufferHeight[0];
		var bUseMultiRenderTarget = magoManager.postFxShadersManager.bUseMultiRenderTarget;
		this.screenFBO = new FBO(gl, bufferWidth, bufferHeight, {matchCanvasSize: true, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 4}); 
	}

	return this.screenFBO;
};

ChemicalAccident2DLayer.prototype.setTextureFilterType = function (textureFilterType)
{
	// textureFilterType = 0 : nearest, 1 : linear.***
	if (this.textureFilterType !== textureFilterType)
	{
		this.textureFilterType = textureFilterType;
	}
};

ChemicalAccident2DLayer.prototype.setRenderBorder = function (renderBorder)
{
	this.renderBorder = renderBorder;
};

ChemicalAccident2DLayer.prototype.getRenderBorder = function ()
{
	return this.renderBorder;
};

ChemicalAccident2DLayer.prototype.getTextureFilterType = function ()
{
	// textureFilterType = 0 : nearest, 1 : linear.***
	return this.textureFilterType;
};

ChemicalAccident2DLayer.prototype.getTextureFlipYAxis = function ()
{
	return this.textureFlipYAxis;
};

ChemicalAccident2DLayer.prototype.setTextureFlipYAxis = function (textureFlipYAxis)
{
	this.textureFlipYAxis = textureFlipYAxis;
};

ChemicalAccident2DLayer.prototype.setRenderingColorType = function (renderingColorType)
{
	this.renderingColorType = renderingColorType;
};

ChemicalAccident2DLayer.prototype.getRenderingColorType = function ()
{
	return this.renderingColorType;
};

ChemicalAccident2DLayer.prototype.getTextureSize = function ()
{
	if (this.simulationTextureSiz === undefined)
	{
		if (this._timeSlicesArray !== undefined && this._timeSlicesArray.length > 0)
		{
			var timeSlice1rst = this._timeSlicesArray[0];
			var imageWidth = timeSlice1rst._texture2dAux.imageWidth;
			var imageHeight = timeSlice1rst._texture2dAux.imageHeight;
			this.simulationTextureSize = new Int32Array(2);
			this.simulationTextureSize[0] = imageWidth;
			this.simulationTextureSize[1] = imageHeight;
		}
	}

	return this.simulationTextureSize;
};

ChemicalAccident2DLayer.prototype.setInterpolationBetweenSlices = function (interpolationBetweenSlices)
{
	this.interpolationBetweenSlices = interpolationBetweenSlices;
};

ChemicalAccident2DLayer.prototype.getInterpolationBetweenSlices = function ()
{
	return this.interpolationBetweenSlices;
};

ChemicalAccident2DLayer.prototype.render = function ()
{
	if (!this._isDoRender)
	{
		return true;
	}

	var magoManager = this.chemicalAccident2DManager.magoManager;
	var animTimeController = magoManager.animationTimeController;
	var gl = magoManager.getGl();

	var resultObject = this.getTimeSliceIdxByCurrentUnixTimeMiliseconds(animTimeController._currentUnixTimeMilisec);
	var texIdxCurr = resultObject.timeSliceIdx;
	var factor = resultObject.factor;

	if (this.interpolationBetweenSlices === 0)
	{
		factor = 0.0;
	}

	// test.***
	//texIdxCurr = 600;

	if (texIdxCurr > this._timeSlicesArray.length - 1)
	{
		texIdxCurr = this._timeSlicesArray.length - 1;
	}
	else if (texIdxCurr < 0 )
	{
		texIdxCurr = 0;
	}

	texIdxCurr = 1399;

	
	// Now, do render.***
	//var chemicalAccidentManager = this.chemicalAccident2DManager;
	var sceneState = magoManager.sceneState;
	
	var currentShader = magoManager.postFxShadersManager.getShader("chemAccident2d"); // (chemicalAccident2DVS, chemicalAccident2DFS).***
	magoManager.postFxShadersManager.useProgram(currentShader);

	// Now, bind the rectangleMesh vbo.***
	var vboKey = this.vboKeysContainer.getVboKey(0);

	//magoManager.effectsManager.setCurrentShader(currentShader);
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);


	//----------------------------------------------------------------------------------------------------------------

	gl.enableVertexAttribArray(currentShader.texCoord2_loc);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.enableVertexAttribArray(currentShader.normal3_loc);
	gl.disableVertexAttribArray(currentShader.normal3_loc);
	if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
	
	currentShader.bindUniformGenerals();
	gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
	gl.uniform1i(currentShader.textureFlipYAxis_loc, this.getTextureFlipYAxis());
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
	gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.
	gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
	gl.uniform1i(currentShader.uRenderBorder_loc, this.renderBorder); // 0= no render border, 1= render border.***
	
	gl.uniform1i(currentShader.uTextureFilterType_loc, this.textureFilterType); // 0= nearest, 1= linear.***

	var texSize = this.getTextureSize();
	var texWidth = texSize[0];
	var texHeight = texSize[1];
	gl.uniform1iv(currentShader.uTextureSize_loc, [texSize[0], texSize[1]]);

	//var minMaxValues = this._getMinMaxQuantizedValues(); // old.***
	var minMaxValues = this._timeSlicesArray[texIdxCurr].getQuantizedMinMaxValues();
	gl.uniform2fv(currentShader.uMinMaxValues_loc, [minMaxValues[0], minMaxValues[1]]);
	gl.uniform2fv(currentShader.uMinMaxValuesToRender_loc, [minMaxValues[0], minMaxValues[1]*0.0000001]);
	

	// Color legend.***
	if (this.renderingColorType === 2)
	{
		if (this._legendColors4 !== undefined && this._legendValues !== undefined)
		{
			var legendColors = this._legendColors4;
			var legendValues = this._legendValues;
			gl.uniform4fv(currentShader.uLegendColors_loc, legendColors);
			gl.uniform1fv(currentShader.uLegendValues_loc, legendValues);
			gl.uniform1i(currentShader.uLegendColorsCount_loc, this._legendColorsCount);
			gl.uniform1f(currentShader.uLegendValuesScale_loc, this._legendValuesScale);
		}
		else
		{
			this.renderingColorType = 0;
		}
	}

	gl.uniform1i(currentShader.uRenderingColorType_loc, this.renderingColorType); // 0= rainbow, 1= monotone, 2= legendColors.***
	
	
	// Textures.*****************************************************************************************************
	var timeSlicesCount = this._timeSlicesArray.length;

	var texIdxNext = texIdxCurr + 1;
	if (texIdxNext >= timeSlicesCount)
	{
		texIdxNext = texIdxCurr;
	}

	var timeSliceCurr = this._timeSlicesArray[texIdxCurr];
	var timeSliceNext = this._timeSlicesArray[texIdxNext];

	var glTexCurr = timeSliceCurr._texture2dAux.texId;
	var glTexNext = timeSliceNext._texture2dAux.texId;

	gl.activeTexture(gl.TEXTURE0); 
	gl.bindTexture(gl.TEXTURE_2D, glTexCurr);
	
	gl.activeTexture(gl.TEXTURE1); 
	gl.bindTexture(gl.TEXTURE_2D, glTexNext);

	gl.frontFace(gl.CCW);
	gl.enable(gl.BLEND);
	gl.depthMask(false);

	var minMaxQuantizedValues_tex0 = timeSliceCurr.getQuantizedMinMaxValues();
	var minMaxQuantizedValues_tex1 = timeSliceNext.getQuantizedMinMaxValues();
	gl.uniform2fv(currentShader.uMinMaxQuantizedValues_tex0_loc, minMaxQuantizedValues_tex0);
	gl.uniform2fv(currentShader.uMinMaxQuantizedValues_tex1_loc, minMaxQuantizedValues_tex1);

	// Render the rectangleMesh.*********************************************************************
	// Init uniforms.
	gl.uniform1f(currentShader.uInterpolationFactor_loc, factor);
	gl.uniform1f(currentShader.uModelOpacity_loc, 1.0);
	gl.uniform4fv(currentShader.oneColor4_loc, [0.99, 0.5, 0.25, 1.0]); //.***

	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader); // rotMatrix, positionHIGH, positionLOW.

	var vboMemManager = magoManager.vboMemoryManager;
	var vboKeysCount = this.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = this.vboKeysContainer.vboCacheKeysArray[i];
		if (!vboKey) 
		{
			return false;
		}
		
		// Positions.
		if (!vboKey.bindDataPosition(currentShader, vboMemManager))
		{ return false; }

		// TexCoords.
		if (vboKey.vboBufferTCoord)
		{
			if (!vboKey.bindDataTexCoord(currentShader, vboMemManager))
			{ return false; }
		}
		else 
		{
			currentShader.disableVertexAttribArray(currentShader.texCoord2_loc);
		}

		/*
		// Normals.
		if (vboKey.vboBufferNor && currentShader.normal3_loc >= 0)
		{
			if (!vboKey.bindDataNormal(currentShader, vboMemManager))
			{ return false; }
		}
		else 
		{
			currentShader.disableVertexAttribArray(currentShader.normal3_loc);
		}

		// Colors.
		if (vboKey.vboBufferCol)
		{
			if (!vboKey.bindDataColor(currentShader, vboMemManager))
			{ return false; }
			gl.uniform1i(currentShader.colorType_loc, 1); // attributeColor.
		}
		else 
		{
			currentShader.disableVertexAttribArray(currentShader.color4_loc);
		}
		*/
		
		
		// Indices.
		if (!vboKey.bindDataIndice(currentShader, vboMemManager))
		{ return false; }
		
		var primitive = gl.TRIANGLES;
		//primitive = gl.LINE_LOOP;
	
		gl.drawElements(primitive, vboKey.indicesCount, gl.UNSIGNED_SHORT, 0);
	}
	// End render rectangleMesh.---------------------------------------------------------------------
	gl.disable(gl.BLEND);
	gl.depthMask(true);
	currentShader.disableVertexAttribArrayAll();
	magoManager.postFxShadersManager.useProgram(null);

};

ChemicalAccident2DLayer.prototype._getMinMaxQuantizedValues = function ()
{
	if (this.minMaxValues === undefined)
	{
		if (this._timeSlicesArray === undefined || this._timeSlicesArray.length === 0)
		{
			return undefined;
		}

		var minMaxValues = new Float32Array(2);
		var minVal;
		var maxVal;

		var timeSlicesCount = this._timeSlicesArray.length;
		for (var i=0; i<timeSlicesCount; i++)
		{
			var timeSlice = this._timeSlicesArray[i];
			if (timeSlice._jsonFile === undefined)
			{
				return undefined;
			}
			minVal = timeSlice._jsonFile.minValue;
			maxVal = timeSlice._jsonFile.maxValue;

			if (i === 0)
			{
				minMaxValues[0] = minVal;
				minMaxValues[1] = maxVal;
			}
			else
			{
				if (minVal < minMaxValues[0])
				{
					minMaxValues[0] = minVal;
				}

				if (maxVal > minMaxValues[1])
				{
					minMaxValues[1] = maxVal;
				}
			}
		}

		if (timeSlicesCount > 0)
		{
			this.minMaxValues = minMaxValues;
		}
	}

	return this.minMaxValues;
};

ChemicalAccident2DLayer.prototype.getTimeSliceIdxByCurrentUnixTimeMiliseconds = function (currUnixTimeMiliseconds)
{
	var timeSlicesCount = this._timeSlicesArray.length;
	var timeSliceIdx = -1;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		var diffTime = timeSlice._startUnixTimeMiliseconds - currUnixTimeMiliseconds;
		if (currUnixTimeMiliseconds >= timeSlice._startUnixTimeMiliseconds)
		{
			if (currUnixTimeMiliseconds <= timeSlice._endUnixTimeMiliseconds)
			{
				timeSliceIdx = i;

				var timeSliceTotalTime = timeSlice._endUnixTimeMiliseconds - timeSlice._startUnixTimeMiliseconds;
				var timeSlicePassedTime = currUnixTimeMiliseconds - timeSlice._startUnixTimeMiliseconds;
				var factor = timeSlicePassedTime / timeSliceTotalTime;

				break;
			}
			else 
			{
				var hola = 0;
			}
		}
		else 
		{
			break;
		}
	}

	var resultObject = {timeSliceIdx: timeSliceIdx, factor: factor};

	return resultObject;
};