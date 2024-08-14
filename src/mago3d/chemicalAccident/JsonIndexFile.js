'use strict';

/**
 * @class JsonIndexFile
 */
var JsonIndexFile = function(options) 
{
	if (!(this instanceof JsonIndexFile)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._geoJsonIndexFileLoadState = CODE.fileLoadState.READY;
	this._geoJsonIndexFile;
	this._geoJsonIndexFilePath;
	this._geoJsonIndexFileFolderPath;

	if (options)
	{
		if (options.url)
		{
			this._geoJsonIndexFilePath = options.url;

			// calculate the folderPath from this._geoJsonIndexFilePath.***
			var lastSlashIndex = this._geoJsonIndexFilePath.lastIndexOf("/");
			this._geoJsonIndexFileFolderPath = this._geoJsonIndexFilePath.substring(0, lastSlashIndex);
		}

	}

};

JsonIndexFile.prototype._loadGeoJsonIndexFile = function ()
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
			that._geoJsonIndexFile._geoJsonIndexFileFolderPath = that._geoJsonIndexFileFolderPath;
		});
	}
};

JsonIndexFile.prototype._prepare = function ()
{
	if (this._geoJsonIndexFilePath === undefined)
	{ 
		return false;
	}

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