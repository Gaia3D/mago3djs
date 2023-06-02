'use strict';

/**
 * @class ChemicalAccidentManager
 */
var ChemicalAccidentManager = function (options) 
{
	if (!(this instanceof ChemicalAccidentManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.magoManager;
	this.chemAccidentLayersArray;

	this._geoJsonIndexFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonIndexFile;
	this._geoJsonIndexFilePath = undefined;
	this._geoJsonIndexFileFolderPath;
	this._allLayersArePrepared = false;

	this._animationState = CODE.processState.NO_STARTED; 
	this._animationStartTime = 0;
	this._totalAnimTime;
	this._increTime;

	if (options)
	{
		if (options.magoManager)
		{
			this.magoManager = options.magoManager;
		}

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

	// test vars.***
	this.test_started = false;

	this.init();
};

ChemicalAccidentManager.prototype.init = function ()
{
	this.test_started = false;
};

ChemicalAccidentManager.prototype.newChemAccidentLayer = function (options)
{
	if (!this.chemAccidentLayersArray)
	{
		this.chemAccidentLayersArray = [];
	}

	if (options === undefined)
	{
		return false;
	}

	options.chemicalAccidentManager = this;
	var chemAccLayer = new ChemicalAccidentLayer(options);
	this.chemAccidentLayersArray.push(chemAccLayer);
	return chemAccLayer;
};

ChemicalAccidentManager.prototype._loadGeoJsonIndexFile = function ()
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

ChemicalAccidentManager.prototype._preparePollutionGeoJsonIndexFile = function ()
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

ChemicalAccidentManager.prototype._preparePollutionLayers = function (magoManager)
{
	if (this._allLayersArePrepared === true)
	{
		return true;
	}

	// Check if layers exist.***
	if (this.chemAccidentLayersArray === undefined)
	{
		this.chemAccidentLayersArray = [];
	}

	var pollutionLayersCount = this.chemAccidentLayersArray.length;
	if (pollutionLayersCount === 0)
	{
		// use "GeoJsonIndexFile" to create pollutionLayers.***
		var layersCount = this._geoJsonIndexFile.layersCount; // usually layersCount = 1.***
		var timeSliceFileFolderPath = this._geoJsonIndexFileFolderPath;

		for (var i=0; i<layersCount; i++) // usually layersCount = 1.***
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
			var chemAccidentLayer = this.newChemAccidentLayer(options);

			// Now, check if the geoJsonIndexFile has timeSlices data embeded.***
			var embededTimeSlicesArray = this._geoJsonIndexFile.layers[i].timeSliceFiles; // embeded timeSlicesFiles.***
			if (embededTimeSlicesArray !== undefined)
			{
				if (chemAccidentLayer._timeSlicesArray === undefined)
				{
					chemAccidentLayer._timeSlicesArray = [];
				}

				var timeSliceFileNamesCount = embededTimeSlicesArray.length;
				for (var j=0; j<timeSliceFileNamesCount; j++)
				{
					var options = {
					};
					var timeSlice = new PollutionTimeSlice(options);
					timeSlice._jsonFile = embededTimeSlicesArray[j];
					timeSlice._fileileLoadState = CODE.fileLoadState.LOADING_FINISHED;
					timeSlice._isPrepared = true;
					pollutionLayer._timeSlicesArray.push(timeSlice);
				}
			}
		}
	}

	// Now, check if all pollutionLayers are prepared.***
	
	var allLayersArePrepared = true;
	var pollutionLayersCount = this.chemAccidentLayersArray.length;
	for (var i=0; i<pollutionLayersCount; i++)
	{
		var pollLayer = this.chemAccidentLayersArray[i];
		if (!pollLayer._prepareLayer())
		{
			allLayersArePrepared = false;
		}
	}

	this._allLayersArePrepared = allLayersArePrepared;
	
	return false;
};

ChemicalAccidentManager.prototype.prepareVolume = function (magoManager)
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

ChemicalAccidentManager.prototype.render = function ()
{
	if (!this._geoJsonIndexFilePath)
	{
		return false;
	}

	if (this._animationState === CODE.processState.FINISHED)
	{
		return true;
	}

	var magoManager = this.magoManager;
	
	if (!this.prepareVolume(magoManager))
	{ return false; }
	
	if (this._animationState === CODE.processState.NO_STARTED)
	{
		this._animationState = CODE.processState.STARTED;
	}
	/*
	if (this._totalAnimTime === undefined) 
	{
		var pollLayer = this._pollutionLayersArray[0];
		//this._totalAnimTime = pollLayer.getTotalAnimationTimeMinutes() * 60 * 1000.0; // miliseconds.***
		this._totalAnimTime = 30000; // test delete.!! 30 seconds.***
	}

	if (this._timeScale === undefined) 
	{
		this._timeScale = 1.0;
	}

	//this._timeScale = 1000.0; // test.***
	if (magoManager.animationTimeController === undefined)
	{
		var options = {
			incrementalAddingTimeMilisec: 50
		  };
		  magoManager.animationTimeController = new AnimationTimeController(options);
	}

	var totalAnimTime = this._totalAnimTime;
	var currTime = magoManager.animationTimeController.getCurrentTimeMilisec();
	this._increTime = (currTime - this._animationStartTime) * this._timeScale;

	if (this._increTime >= totalAnimTime)
	{
		this._animationState = CODE.processState.FINISHED;
		return true;
		// Modify the animationStartTime.***
		//var num = Math.floor(this._increTime / totalAnimTime);
		//this._animationStartTime += num * totalAnimTime;
		//this._increTime = currTime - this._animationStartTime;
	}

	// Render layers.***
	var pollutionLayersCount = this.getPollutionLayersCount();
	for (var i=0; i<pollutionLayersCount; i++)
	{
		var pollLayer = this._pollutionLayersArray[i];
		pollLayer.render(magoManager);
	}
	*/
	var hola = 0;
};

ChemicalAccidentManager.prototype.load_chemicalAccidentIndexFile = function (geoJsonIndexFilePath)
{
	// this is a test function. Delete this function after test.!!!!!!!
	//***************************************************************
	// Note : In the test, there are only 1 layer (always).***
	//----------------------------------------------------------------

	if (this.test_started)
	{
		return;
	}

	// set the "this._geoJsonIndexFilePath".***
	this._geoJsonIndexFilePath = geoJsonIndexFilePath;


	var hola = 0;
};