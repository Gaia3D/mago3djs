'use strict';

/**
 * @class OceanFluxLayer
 */
var OceanFluxLayer = function (options) 
{
	if (!(this instanceof OceanFluxLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._geoJsonFilePath = options.geoJsonFilePath;
	this._geoJsonFileLoadState = CODE.fileLoadState.READY;
};

OceanFluxLayer.prototype.setGeoJson = function (windGeoJson)
{
	if (!windGeoJson)
	{
		return;
	}

	this._geoJsonFile = windGeoJson;
	this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_FINISHED;

	//if (this._geoJsonFile.style && this._geoJsonFile.style.colorRamp)
	//{
	// make a colorRamp.
	//	this.colorRamp = new ColorRamp(this._geoJsonFile.style.colorRamp);
	//}
};

OceanFluxLayer.prototype.loadGeoJson = function ()
{
	// This is the geoJson version. 2021.
	if (this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this._geoJsonFileLoadState = CODE.fileLoadState.LOADING_STARTED;
		var that = this;
		loadWithXhr(this._geoJsonFilePath, undefined, undefined, 'json', 'GET').done(function(res) 
		{
			that.setGeoJson(res);
		});
	}
};

OceanFluxLayer.prototype._prepareGeoJson = function()
{
	if (this._geoJsonFileLoadState === CODE.fileLoadState.READY)
	{
		this.loadGeoJson();
		return false;
	}
	else if (this._geoJsonFileLoadState !== CODE.fileLoadState.LOADING_FINISHED)
	{
		return false;
	}

	return true;
};

OceanFluxLayer.prototype.prepareLayer = function()
{
	// We need:
	// 1- geoJson file.
	//-------------------------------------------
	// 1rst, check if the geoJson is loaded.***
	if (!this._prepareGeoJson())
	{
		return false;
	}

	return true;
};

OceanFluxLayer.prototype.render = function()
{
	if (!this.prepareLayer())
	{
		return false;
	}

};