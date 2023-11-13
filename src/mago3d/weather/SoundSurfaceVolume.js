'use strict';

/**
 * @class SoundSurfaceVolume
 */
var SoundSurfaceVolume = function(options) 
{
	if (!(this instanceof SoundSurfaceVolume)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._soundSurfLayersArray;
	this.weatherStation;
	
	// Box.
	//this.dustDisplayBox;
	

	// data.
	this._geoJsonIndexFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonIndexFile;
	this._geoJsonIndexFilePath;
	this._geoJsonIndexFileFolderPath;
	this._allLayersArePrepared = false;
	this._geoJsonIndexFilePathsArray; // no used yet.***

	// Animation state controls.
	this._animationState = 0; // 0= paused. 1= play.
	this._animationStartTime = 0;
	this._totalAnimTime;
	this._increTime;

	// color type.// 0= oneColor, 1= attribColor, 2= texture, 3= colorByHeight, 4= grayByHeight, 5= color-legend.***
	this._colorType = 5;

	// color legend.***
	this._legendColors4;
	this._legendValues;
	this._TEST_setLegendsColors(); // test.***

	// Options.***
	if (options)
	{
		if (options.geoJsonIndexFilePath)
		{
			this._geoJsonIndexFilePath = options.geoJsonIndexFilePath;
		}

		if (options.geoJsonIndexFilePathsArray)// no used yet.***
		{
			this._geoJsonIndexFilePathsArray = options.geoJsonIndexFilePathsArray;// no used yet.***
		}

		if (options.geoJsonIndexFileFolderPath)
		{
			this._geoJsonIndexFileFolderPath = options.geoJsonIndexFileFolderPath;
		}

		if (options.animationSpeed !== undefined)
		{
			// AnimationSpeed by default is 1. If want to render faster, try to set animationSpeed = 2 or animationSpeed = 3.***
			this._animationSpeed = options.animationSpeed;
		}
	}
};

SoundSurfaceVolume.prototype._TEST_setLegendsColors = function ()
{
	this._legendColors4 = new Float32Array([0/255, 0/255, 143/255, 128/255,    // 0
		0/255, 15/255, 255/255, 128/255,   // 1
		0/255, 95/255, 255/255, 128/255,   // 2
		0/255, 175/255, 255/255, 128/255,  // 3
		0/255, 255/255, 255/255, 128/255,  // 4
		79/255, 255/255, 175/255, 128/255, // 5
		159/255, 255/255, 95/255, 128/255, // 6
		239/255, 255/255, 15/255, 128/255, // 7
		255/255, 191/255, 0/255, 128/255,  // 8
		255/255, 111/255, 0/255, 128/255,  // 9
		255/255, 31/255, 0/255, 128/255,   // 10
		207/255, 0/255, 0/255, 128/255,    // 11
		127/255, 0/255, 0/255, 128/255,
		127/255, 0/255, 0/255, 128/255,   // 13
		0, 0, 0, 0,   // 14
		0, 0, 0, 0, ]);  // 15

	var min = 45.71200180053711;
	var max = 89.40699768066406;
	var range = max - min;
	var legendColorsCount = this._legendColors4.length / 4;
	var incre = range / (legendColorsCount - 1);
	var valuesArray = [];
	for (var i=0; i<legendColorsCount; i++)
	{
		valuesArray.push(incre * i + min);
	}
	this._legendValues = new Float32Array(valuesArray);
};

SoundSurfaceVolume.prototype.getSoundLayer = function (idx)
{
	if (this._soundSurfLayersArray === undefined || this._soundSurfLayersArray.length === 0)
	{
		return undefined;
	}

	if (idx === undefined)
	{
		return undefined;
	}

	if (idx < 0)
	{
		idx = 0;
	}
	else if (idx > this._soundSurfLayersArray.length - 1)
	{
		idx = this._soundSurfLayersArray.length - 1;
	}

	return this._soundSurfLayersArray[idx];
};

SoundSurfaceVolume.prototype.setLegendColors4 = function (color4Array)
{
	// Note : The "color4Array" can be Float32Array or Uint8Array type.***
	//-----------------------------------------------------------------------
	if (color4Array === undefined)
	{
		return false;
	}

	// 1rst, check if the type of the array.***
	if (color4Array.constructor === Float32Array)
	{
		// In this case, set array directly.***
		this._legendColors4 = color4Array;
	}
	else if (color4Array.constructor === Uint8Array)
	{
		this._legendColors4 = new Float32Array(16);
		var maxArrayLength = 4 * 16; // RGBA * 16 colors as max.***
		var arrayLength = color4Array.length;
		if (arrayLength > maxArrayLength)
		{
			arrayLength = maxArrayLength;
		}

		for (var i=0; i<arrayLength; i++)
		{
			this._legendColors4[i] = new Float32Array(color4Array[i] / 255.0)[0];
		}
	}
	
};

SoundSurfaceVolume.prototype.setLegendValues = function (valuesArray)
{
	if (valuesArray === undefined)
	{
		return false;
	}

	this._legendValues = new Float32Array(valuesArray);
};

SoundSurfaceVolume.prototype._loadGeoJsonIndexFile = function ()
{
	// This is the geoJson version. 2021.
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

SoundSurfaceVolume.prototype._prepareSoundSurfaceGeoJsonIndexFile = function ()
{
	if (this._geoJsonIndexFileLoadState === CODE.fileLoadState.READY)
	{
		this._loadGeoJsonIndexFile();
		return false;
	}
	else if (this._geoJsonIndexFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	return true;
};

SoundSurfaceVolume.prototype.getSoundSurfacesLayersCount = function()
{
	if (this._soundSurfLayersArray === undefined)
	{
		return 0;
	}

	return this._soundSurfLayersArray.length;
};

SoundSurfaceVolume.prototype.newSoundSurfaceLayer = function (options)
{
	if (this._soundSurfLayersArray === undefined)
	{
		this._soundSurfLayersArray = [];
	}
	
	var layer = new SoundSurfaceLayer(options);
	this._soundSurfLayersArray.push(layer);
	return layer;
};

SoundSurfaceVolume.prototype._prepareSoundSurfacesLayers = function (magoManager)
{
	if (this._allLayersArePrepared === true)
	{
		return true;
	}

	// Check if layers exist.***
	var soundLayersCount = this.getSoundSurfacesLayersCount();
	if (soundLayersCount === 0)
	{
		// use "GeoJsonIndexFile" to create soundLayers.***
		var layersCount = this._geoJsonIndexFile.layersCount;
		var timeSliceFileFolderPath = this._geoJsonIndexFileFolderPath;

		for (var i=0; i<layersCount; i++)
		{
			var layer = this._geoJsonIndexFile.layers[i];
			var options = {
				soundSurfaceVolumeOwner : this, 
				timeInterval_min        : layer.timeInterval_min,
				timeSlicesCount         : layer.timeSlicesCount,
				timeSliceFileNames      : layer.timeSliceFileNames,
				timeSliceFileFolderPath : timeSliceFileFolderPath
			};
			var soundSurfaceLayer = this.newSoundSurfaceLayer(options);
		}
	}

	// Now, check if all soundLayers are prepared.***
	var allLayersArePrepared = true;
	var soundLayersCount = this.getSoundSurfacesLayersCount();
	for (var i=0; i<soundLayersCount; i++)
	{
		var soundLayer = this._soundSurfLayersArray[i];
		if (!soundLayer._prepareLayer())
		{
			allLayersArePrepared = false;
		}
	}

	this._allLayersArePrepared = allLayersArePrepared;

	return false;
};

SoundSurfaceVolume.prototype.addJsonsArray = function (jsonsArray)
{
	if ( jsonsArray === undefined || jsonsArray.length === 0)
	{
		return false;
	}

	//***************************************************************************************************
	// In this mode, no use the "JsonIndexFile", so set "geoJsonIndexFileLoadState" as LOADING_FINISHED.***
	//---------------------------------------------------------------------------------------------------
	this._geoJsonIndexFileLoadState = CODE.fileLoadState.LOADING_FINISHED;

	// Check if 1 layers exist.***
	var soundLayersCount = this.getSoundSurfacesLayersCount();
	if (soundLayersCount === 0)
	{
		// create an empty soundSurfaceLayer.***
		var options = {soundSurfaceVolumeOwner: this};
		var soundSurfaceLayer = this.newSoundSurfaceLayer(options);
	}

	var soundSurfaceLayer = this.getSoundLayer(0); // take the 1rst layer.***
	if (soundSurfaceLayer._timeSlicesArray === undefined)
	{
		soundSurfaceLayer._timeSlicesArray = [];
	}

	var jsonFilesCount = jsonsArray.length;
	for (var i=0; i<jsonFilesCount; i++)
	{
		// now, create the timeSlices into the soundSurfaceLayer.***
		var options = {soundSurfaceLayerOwner: soundSurfaceLayer};
		var timeSlice = new SoundSurfaceTimeSlice(options);
		timeSlice._jsonFile = jsonsArray[i];

		// set "timeSlice._fileileLoadState" as LOADING_FINISHED.***
		timeSlice._fileileLoadState = CODE.fileLoadState.LOADING_FINISHED;

		soundSurfaceLayer._timeSlicesArray.push(timeSlice);
	}

	return true;
};

SoundSurfaceVolume.prototype.prepareVolume = function (magoManager)
{
	// We need:
	// 1- GeoJsonIndexFile.
	// 2- pollution-layers (if GeoJsonIndexFile is loaded).
	//-------------------------------------------
	// 1rst, check if the geoJson is loaded.***
	if (!this._prepareSoundSurfaceGeoJsonIndexFile())
	{
		return false;
	}

	// Now, check if pollutionLayers are prepared.***
	if (!this._prepareSoundSurfacesLayers())
	{
		return false;
	}

	return true;
};

SoundSurfaceVolume.prototype.getCurrentLayerIdx = function ()
{
	return this.currLayerIdx;
};

SoundSurfaceVolume.prototype.setCurrentLayerIdx = function (idx)
{
	if (idx === undefined)
	{
		return false;
	}

	if (idx < 0)
	{
		idx = 0;
	}
	else if (idx >= this.getSoundSurfacesLayersCount())
	{
		idx = this.getSoundSurfacesLayersCount() - 1;
	}

	this.currLayerIdx = idx;
};

SoundSurfaceVolume.prototype.render = function (magoManager)
{
	if (!this.prepareVolume(magoManager))
	{ return false; }

	var soundLayersCount = this.getSoundSurfacesLayersCount();
	if (soundLayersCount === 0)
	{
		return false;
	}

	// Render layers.***
	if (this.currLayerIdx === undefined)
	{
		this.currLayerIdx = 0;
	}
	
	//for (var i=0; i<soundLayersCount; i++)
	{
		var soundLayer = this._soundSurfLayersArray[this.currLayerIdx];
		soundLayer.render(magoManager);
	}
    

	return true;
};