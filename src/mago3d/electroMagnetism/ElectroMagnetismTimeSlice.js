'use strict';

/**
 * @class ElectroMagnetismTimeSlice
 */
var ElectroMagnetismTimeSlice = function(options) 
{
	if (!(this instanceof ElectroMagnetismTimeSlice)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
 
	this._EMSurfaceLayerOwner;
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

		if (options.EMSurfaceLayerOwner)
		{
			this._EMSurfaceLayerOwner = options.EMSurfaceLayerOwner;
		}
	}
};

ElectroMagnetismTimeSlice.prototype._prepare = function ()
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

	// vbos.***
	if (this._makingMeshProcess === undefined)
	{
		this._makingMeshProcess = CODE.processState.NO_STARTED;
	}

	if (this._makingMeshProcess === CODE.processState.NO_STARTED)
	{
		if (this.vboKeysContainer === undefined)
		{
			this.vboKeysContainer = new VBOVertexIdxCacheKeysContainer();

			// create a vboKey.***
			this.vboKeysContainer.newVBOVertexIdxCacheKey();
		}

		/*
		timeSlice._jsonFile = {
			centerGeographicCoord,
			indices[],
			maxSoundValue,
			minSoundValue,
			positions[],
			soundLevelValues[],
		}
		*/
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
		var centerGeoCoord = this._jsonFile.centerGeographicCoord;
		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);

		var positions = new Float32Array(this._jsonFile.positions);
		var values = new Float32Array(this._jsonFile.soundLevelValues);

		var magoManager = this._EMSurfaceLayerOwner._electroMagnetismManagerOwner.magoManager;
		var vboKey = this.vboKeysContainer.getVboKey(0);

		var pointsCount = positions.length / 3;
		if (pointsCount >= 65535)
		{
			// indices must to be in Uint32Array.***
			var gl = magoManager.getGl();
			var uints_for_indices = gl.getExtension("OES_element_index_uint");
			var indices = new Uint32Array(this._jsonFile.indices);
			vboKey.setDataArrayIdx(indices, magoManager.vboMemoryManager);
		}
		else 
		{
			// indices must to be in Uint16Array.***
			var indices = new Uint16Array(this._jsonFile.indices);
			vboKey.setDataArrayIdx(indices, magoManager.vboMemoryManager);
		}

		// Now, set vbo position & texCoords.***
		
		
		
		vboKey.setDataArrayPos(positions, magoManager.vboMemoryManager);
		
		var dimensions = 1;
		var name = "soundLevelValue";
		var attribLoc = 4;
		vboKey.setDataArrayCustom(values, magoManager.vboMemoryManager, dimensions, name, attribLoc);
		/*
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
		*/
		// The process finished.***
		this._makingMeshProcess = CODE.processState.FINISHED;
		
		return false;
	}
 
	this._isPrepared = true;
 
	return this._isPrepared;
};