'use strict';

/**
 * @class AirPollutionTimeSlice
 */
var AirPollutionTimeSlice = function(options) 
{
	 if (!(this instanceof AirPollutionTimeSlice)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this._fileLoadState = CODE.fileLoadState.READY;
	 this._filePath;
	 this._jsonFile;
	 this._isPrepared = false;
	 this._texture = undefined;
	 this._glTexture;
	 this.owner = undefined;

	 this._texture3dCreated = false;
	 this._texture3d;
	 this._mosaicTexture; // note : the mosaicTexture is a Texture3D too.***

	 if (options !== undefined)
	 {
		if (options.filePath)
		{
			this._filePath = options.filePath;
		}

		if (options.owner)
		{
			this.owner = options.owner;
		}
	 }
};

AirPollutionTimeSlice.prototype._prepare = function ()
{
	if (this._isPrepared)
	{
		return true;
	}

	if (this._texture === undefined)
	{
		this._texture = new Texture();
		this._texture.fileLoadState = CODE.fileLoadState.READY;
	}

	if (this._texture.fileLoadState === CODE.fileLoadState.READY)
	{
		this._texture.fileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		TexturesManager.loadTexture(this._filePath, this._texture, this.owner.airPollutionManager.magoManager, false);
		//loadWithXhr(this._filePath, undefined, undefined, 'json', 'GET').done(function(res) 
		//{
		//	that._texture = CODE.fileLoadState.LOADING_FINISHED;
		//	//that._jsonFile = res;
		//});
	}

	if (this._texture.fileLoadState !== CODE.fileLoadState.BINDING_FINISHED)
	{
		return false;
	}

	this._isPrepared = true;

	return this._isPrepared;
};

AirPollutionTimeSlice.prototype._makeTextures = function (gl, minmaxPollutionValues)
{
	if (!this._texture3dCreated)
	{
		this._texture3d = new MagoTexture3D();
		this._mosaicTexture = new MagoTexture3D();

		var slicesCount = 6; // test hardcoding.***

		var texWidth = this.owner.airPollutionManager._geoJsonIndexFile.layers[0].textureWidth;
		var texHeight = this.owner.airPollutionManager._geoJsonIndexFile.layers[0].textureHeight;

		// set texture3d params.***
		this._texture3d.texture3DXSize = texWidth;
		this._texture3d.texture3DYSize = texHeight;
		this._texture3d.texture3DZSize = slicesCount; // test HARDCODING.***

		// The 3D texture into a mosaic texture matrix params.***
		var result = Voxelizer.getMosaicColumnsAndRows(this._texture3d.texture3DXSize, this._texture3d.texture3DYSize, this._texture3d.texture3DZSize);
		var mosaicXCount = result.numColumns;
		var mosaicYCount = result.numRows;
		this._mosaicTexture.mosaicXCount = mosaicXCount;
		this._mosaicTexture.mosaicYCount = mosaicYCount;
		this._mosaicTexture.texture3DXSize = texWidth;
		this._mosaicTexture.texture3DYSize = texHeight;
		this._mosaicTexture.texture3DZSize = slicesCount; // slices count = 1.***
		this._mosaicTexture.finalTextureXSize = this._mosaicTexture.mosaicXCount * this._texture3d.texture3DXSize;
		this._mosaicTexture.finalTextureYSize = this._mosaicTexture.mosaicYCount * this._texture3d.texture3DYSize;
		this._mosaicTexture.createTextures(gl);

		// Now, create the textures using the data of jsonFile.***
		// Must transform textureData(array) to Uint8Array type data.***
		//var minValue = this._jsonFile.minValue;
		//var maxValue = this._jsonFile.maxValue;
		var minValueTotal = minmaxPollutionValues[0];
		var maxValueTotal = minmaxPollutionValues[1];

		//var dataLength = this._jsonFile.values.length;
		//for (var i=0; i<dataLength; i++)
		//{
		//	var value = this._jsonFile.values[i];
		//	var realValue = value * (maxValue - minValue) + minValue;
		//
		//	var quantizedValue = (realValue - minValueTotal) / (maxValueTotal - minValueTotal);
		//	//var encodedRgba = ManagerUtils.packDepth(value);
		//
		//	this._jsonFile.values[i] = quantizedValue;
		//}

		//var textureData = ChemicalAccidentTimeSlice.getUint8ArrayRGBAFromArrayBuffer(this._jsonFile.values);

		
		// Do hard coding for test.***
		// test : use "textureData" for all slices.***
		var texSlicesCount = this._texture3d.texture3DZSize;
		for (var i=0; i<texSlicesCount; i++)
		{
			//this._texture3d.createTexture(gl, i, textureData);
			this._texture3d.texturesArray.push(this._texture.texId);
		}
		//----------------------------------------------------------

		// Now, make the mosaicTexture.***
		var magoManager = this.owner.airPollutionManager.magoManager;
		this._mosaicTexture = Voxelizer.prototype.makeMosaicTexture3DFromRealTexture3D(magoManager, this._texture3d, this._mosaicTexture);

		this._texture3dCreated = true;
	}

	return this._texture3dCreated;
};

//-----------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------

/**
 * @class AirPollutionLayer
 */
var AirPollutionLayer = function(options) 
{
	 if (!(this instanceof AirPollutionLayer)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this.airPollutionManager = undefined;
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

	this._isPrepared = false;
	//this._terrainSamplingState = CODE.processState.NO_STARTED;

	// object to render.***
	this.simulationBox = undefined;
	this.vboKeysContainer;
	this.volumeDepthFBO = undefined;
	this.screenFBO = undefined;

	if (options)
	{
		if (options.airPollutionManager)
		{
			this.airPollutionManager = options.airPollutionManager;
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

AirPollutionLayer.prototype._makeTextures = function (gl, minmaxPollutionValues)
{
	var allTimeSlicesTexturesMade = true;
	var timeSlicesCount = this._timeSlicesArray.length;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		if (!timeSlice._makeTextures(gl, minmaxPollutionValues))
		{
			allTimeSlicesTexturesMade = false;
		}
	}

	return allTimeSlicesTexturesMade;

};

AirPollutionLayer.prototype._makeSimulationBox = function ()
{
	// make the depth box.***
	// the depth box is used for volumetric rendering. The depthBox renders rearFaces & frontFaces, so
	// creates the volumetric zone.***
	//-------------------------------------------------------------------------------------------------

	// 1. Calculate the rectangle in local coord.***
	var magoManager = this.airPollutionManager.magoManager;

	var geoJsonIndexFile = this.airPollutionManager._geoJsonIndexFile;
	var centerGeoCoord = geoJsonIndexFile.centerGeographicCoord;

	// must find the 4 geoCoords of the rectangle.***
	var widthMeters = geoJsonIndexFile.width_km * 1000.0;
	var heightMeters = geoJsonIndexFile.height_km * 1000.0;
	var semiWidthMeters = widthMeters / 2.0;
	var semiHeightMeters = heightMeters / 2.0;

	// create the local rectangle.***
	var pointsLCArray = [];

	// leftDown corner.***
	var point3d = new Point2D(-semiWidthMeters, -semiHeightMeters);
	pointsLCArray.push(point3d);

	// rightDown corner.***
	point3d = new Point2D(semiWidthMeters, -semiHeightMeters);
	pointsLCArray.push(point3d);

	// rightUp corner.***
	point3d = new Point2D(semiWidthMeters, semiHeightMeters);
	pointsLCArray.push(point3d);

	// leftUp corner.***
	point3d = new Point2D(-semiWidthMeters, semiHeightMeters);
	pointsLCArray.push(point3d);

	var profile2d = Profile2D.fromPoint2DArray(pointsLCArray);

	// take the 1rst timeSlice:
	var timeSlice = this._timeSlicesArray[0];
	var extrusionDist = 100 * timeSlice._texture3d.texture3DZSize; // z slices count.***
	var extrudeSegmentsCount = 1;
	var extrusionVector = undefined;
	var bIncludeBottomCap = undefined;
	var bIncludeTopCap = undefined;
	var surfIndepMesh = Modeler.getExtrudedMesh(profile2d, extrusionDist, extrudeSegmentsCount, extrusionVector, bIncludeBottomCap, bIncludeTopCap, undefined);

	// now make the renderable object of the simulationBox.***
	if (!this.simulationBox)
	{
		this.simulationBox = new RenderableObject();
	}
	this.simulationBox.geoLocDataManager = new GeoLocationDataManager();
	var geoLocDataOfBox = this.simulationBox.geoLocDataManager.newGeoLocationData();
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();

	geoLocDataOfBox.copyFrom(geoLocData);

	this.simulationBox.objectsArray.push(surfIndepMesh);
	var hola = 0;
};

AirPollutionLayer.prototype._prepareLayer = function ()
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
				filePath : filePath,
				owner    : this
			};
			var timeSlice = new AirPollutionTimeSlice(options);
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


	// create a voxelizer.***
	if (!this.voxelizer)
	{
		// The voxelizer here is used to make the mosaicTexture from textures3D.***
		// note : the mosaicTexture is Texture3D too.***
		var options = {};
		this.voxelizer = new Voxelizer(options);
	}

	/*
	if (!this.oneVoxelSizeInMeters)
	{
		this.oneVoxelSizeInMeters = new Float32Array([1.0, 1.0, 1.0]);

		var geoJsonIndexFile = this.chemicalAccidentManager._geoJsonIndexFile;
		var widthMeters = geoJsonIndexFile.height_km * 1000.0;
		var heightMeters = geoJsonIndexFile.width_km * 1000.0;

		// take any timeSlice to get columnsCount and rowsCount.***
		var timeSlice = this._timeSlicesArray[0];
		var columnsCount = timeSlice._jsonFile.columnsCount;
		var rowsCount = timeSlice._jsonFile.rowsCount;

		this.oneVoxelSizeInMeters[0] = widthMeters / columnsCount;
		this.oneVoxelSizeInMeters[1] = heightMeters / rowsCount;
		this.oneVoxelSizeInMeters[2] = this.oneVoxelSizeInMeters[0]; // in z direction is the same.***
		
	}
	*/

	// Now make the textures3D.***
	if (!this._allTimeSlicesTextures3DReady)
	{
		var magoManager = this.airPollutionManager.magoManager;
		var gl = magoManager.sceneState.gl;
		var minmaxPollutionValues = [0.0, this.airPollutionManager._geoJsonIndexFile.pollutionMaxValue];
		this._makeTextures(gl, minmaxPollutionValues);
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

	if (this.geoLocDataManager === undefined)
	{
		// Now, calculate the geoCoord of the centerPos.***
		var geoJsonIndexFile = this.airPollutionManager._geoJsonIndexFile;
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

	// make the depth box.***
	// the depth box is used for volumetric rendering. The depthBox renders rearFaces & frontFaces, so
	// creates the volumetric zone.***
	if (!this.simulationBox)
	{
		this._makeSimulationBox();
	}




	// If all process are finished, then set isPrepared as true.***
	this._isPrepared = true;

	return this._isPrepared;
};