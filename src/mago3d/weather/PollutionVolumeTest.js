'use strict';

/**
 * @class PollutionVolumeTest
 */
var PollutionVolumeTest = function(options) 
{
	if (!(this instanceof PollutionVolumeTest)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._pollutionLayersArray;
	this.weatherStation;
	
	// Box.
	//this.dustDisplayBox;
	

	// data.
	this._geoJsonIndexFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonIndexFile;
	this._geoJsonIndexFilePath;
	this._geoJsonIndexFileFolderPath;
	this._allLayersArePrepared = false;

	// Animation state controls.
	this._animationState = 0; // 0= paused. 1= play.
	this._animationStartTime = 0;
	this._totalAnimTime;
	this._increTime;

	if (options)
	{
		if (options.geoJsonIndexFilePath)
		{
			this._geoJsonIndexFilePath = options.geoJsonIndexFilePath;
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

PollutionVolumeTest.prototype.render = function (magoManager)
{
	if (!this.prepareVolume(magoManager))
	{ return false; }

	if (this._animationStartTime === 0) 
	{
		this._animationStartTime = magoManager.getCurrentTime();
	}

	if (this._totalAnimTime === undefined) 
	{
		this._totalAnimTime = 20000; // 10 seconds.***
	}

	var totalAnimTime = this._totalAnimTime;
	var currTime = magoManager.getCurrentTime();
	this._increTime = currTime - this._animationStartTime;

	if (this._increTime >= totalAnimTime)
	{
		// Modify the animationStartTime.***
		var num = Math.floor(this._increTime / totalAnimTime);
		this._animationStartTime += num * totalAnimTime;
		this._increTime = currTime - this._animationStartTime;
	}

	// Render layers.***
	var pollutionLayersCount = this.getPollutionLayersCount();
	for (var i=0; i<pollutionLayersCount; i++)
	{
		var pollLayer = this._pollutionLayersArray[i];
		pollLayer.render(magoManager);
	}
};

PollutionVolumeTest.prototype._loadGeoJsonIndexFile = function ()
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

PollutionVolumeTest.prototype._preparePollutionGeoJsonIndexFile = function ()
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

PollutionVolumeTest.prototype.getPollutionLayersCount = function()
{
	if (this._pollutionLayersArray === undefined)
	{
		return 0;
	}

	return this._pollutionLayersArray.length;
};

PollutionVolumeTest.prototype.newPollutionLayer = function (options)
{
	if (this._pollutionLayersArray === undefined)
	{
		this._pollutionLayersArray = [];
	}
	
	var layer = new PollutionLayerTest(options);
	this._pollutionLayersArray.push(layer);
	return layer;
};

PollutionVolumeTest.prototype._preparePollutionLayers = function (magoManager)
{
	if (this._allLayersArePrepared === true)
	{
		return true;
	}

	// Check if layers exist.***
	var pollutionLayersCount = this.getPollutionLayersCount();
	if (pollutionLayersCount === 0)
	{
		// use "GeoJsonIndexFile" to create pollutionLayers.***
		var layersCount = this._geoJsonIndexFile.layersCount;
		var timeSliceFileFolderPath = this._geoJsonIndexFileFolderPath;

		for (var i=0; i<layersCount; i++)
		{
			var layer = this._geoJsonIndexFile.layers[i];
			var options = {
				pollutionVolumeOwner    : this, 
				altitude                : layer.altitude,
				timeInterval_min        : layer.timeInterval_min,
				timeSlicesCount         : layer.timeSlicesCount,
				timeSliceFileNames      : layer.timeSliceFileNames,
				timeSliceFileFolderPath : timeSliceFileFolderPath
			};
			var pollutionLayer = this.newPollutionLayer(options);
		}
	}

	// Now, check if all pollutionLayers are prepared.***
	var allLayersArePrepared = true;
	var pollutionLayersCount = this.getPollutionLayersCount();
	for (var i=0; i<pollutionLayersCount; i++)
	{
		var pollLayer = this._pollutionLayersArray[i];
		if (!pollLayer._prepareLayer())
		{
			allLayersArePrepared = false;
		}
	}

	this._allLayersArePrepared = allLayersArePrepared;

	return false;
};

PollutionVolumeTest.prototype.prepareVolume = function (magoManager)
{
	// We need:
	// 1- GeoJsonIndexFile.
	// 2- pollution-layers (if GeoJsonIndexFile is loaded).
	//-------------------------------------------
	// 1rst, check if the geoJson is loaded.***
	if (!this._preparePollutionGeoJsonIndexFile())
	{
		return false;
	}

	// Now, check if pollutionLayers are prepared.***
	if (!this._preparePollutionLayers())
	{
		return false;
	}

	return true;
};