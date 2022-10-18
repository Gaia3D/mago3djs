'use strict';

/**
 * @class SoundSurfaceTimeSlice
 */
var SoundSurfaceTimeSlice = function(options) 
{
	if (!(this instanceof SoundSurfaceTimeSlice)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
 
	this._soundSurfaceLayerOwner;
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

		if (options.soundSurfaceLayerOwner)
		{
			this._soundSurfaceLayerOwner = options.soundSurfaceLayerOwner;
		}
	}
};
 
SoundSurfaceTimeSlice.prototype._prepare = function ()
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

		var magoManager = this._soundSurfaceLayerOwner._soundSurfaceVolumeOwner.weatherStation.magoManager;
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

/**
 * @class SoundSurfaceLayer
 */
var SoundSurfaceLayer = function (options) 
{
	if (!(this instanceof SoundSurfaceLayer)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
     
	this._soundSurfaceVolumeOwner;
	this.geoLocationDataManager;
	this.gl;
 
	this._timeSlicesArray;
 
	this.altitude;
	this.timeInterval_min;
	this.timeSlicesCount;
	this.timeSliceFileNames;
	this.timeSliceFileFolderPath;
 
	this._isPrepared = false;
	this._terrainSamplingState = CODE.processState.NO_STARTED;
	this.vboKeysContainer;
	this._makingMeshProcess;

	this._currTimeSliceIdx = 0;
     
 
	// Check if exist options.
	if (options !== undefined)
	{
		// check for options.***
		if (options.soundSurfaceVolumeOwner)
		{
			this._soundSurfaceVolumeOwner = options.soundSurfaceVolumeOwner;
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

SoundSurfaceLayer.prototype.getCurrentTimeSliceIdx = function ()
{
	return this._currTimeSliceIdx;
};

SoundSurfaceLayer.prototype.setCurrentTimeSliceIdx = function (idx)
{
	if (idx === undefined)
	{
		return false;
	}

	if (idx < 0)
	{
		idx = 0;
	}
	else if (idx >= this._timeSlicesArray.length)
	{
		idx = this._timeSlicesArray.length - 1;
	}

	this._currTimeSliceIdx = idx;
};

SoundSurfaceLayer.prototype.render = function (magoManager)
{
	if (this._timeSlicesArray === undefined || this._timeSlicesArray.length === 0)
	{
		return false;
	}

	if (this.vboKeysContainer === undefined || this.vboKeysContainer.getVbosCount() === 0)
	{
		return false;
	}

	// render the correspondent timeSlide.***
	var currTime = magoManager.getCurrentTime();
	var animationStartTime = this._soundSurfaceVolumeOwner._animationStartTime;
	var animationTime = currTime - animationStartTime;
	var timeSlicesCount = this._timeSlicesArray.length;
	var timeInterval_min = this.timeInterval_min;


	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;
	var extbuffers = magoManager.extbuffers;
	
	
	magoManager.bindMainFramebuffer();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0); // depthTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0); // normalTex.
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT5_WEBGL, gl.TEXTURE_2D, null, 0); // debugTex.

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.NONE, // gl_FragData[1] - depthTex
		extbuffers.NONE, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL, // gl_FragData[3] - albedoTex
		extbuffers.COLOR_ATTACHMENT4_WEBGL, // gl_FragData[4] - selColor4
		extbuffers.NONE // [5]debugTex (if exist).***
	]);
	//-------------------------------------------------------------------------------------------------------------

	// Now, bind the rectangleMesh vbo.***
	var shaderManager = magoManager.postFxShadersManager;
	
	var currentShader = shaderManager.getShader("soundSurface");
	
	magoManager.postFxShadersManager.useProgram(currentShader);
	gl.uniform1i(currentShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(currentShader.bApplySpecularLighting_loc, true);
	gl.uniform1f(currentShader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	gl.uniform1i(currentShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	gl.uniform1i(currentShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);

	
	//----------------------------------------------------------------------------------------------------------------

	gl.disableVertexAttribArray(currentShader.texCoord2_loc);
	gl.enableVertexAttribArray(currentShader.position3_loc);
	//gl.enableVertexAttribArray(currentShader.normal3_loc);
	gl.disableVertexAttribArray(currentShader.normal3_loc);
	if (currentShader.color4_loc !== -1){ gl.disableVertexAttribArray(currentShader.color4_loc); }
	
	currentShader.bindUniformGenerals();
	gl.uniform1f(currentShader.externalAlpha_loc, 1.0);
	gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
	gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.

	// ColorType.***
	// 0= oneColor, 1= attribColor, 2= texture, 3= colorByHeight, 4= grayByHeight, 5= color-legend.***
	gl.uniform1i(currentShader.colorType_loc, this._soundSurfaceVolumeOwner._colorType); 

	// set the soundLevel minmax values.***
	var timeSlice = this._timeSlicesArray[this._currTimeSliceIdx];
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
	var minVal = timeSlice._jsonFile.minSoundValue;
	var maxVal = timeSlice._jsonFile.maxSoundValue;
	gl.uniform1fv(currentShader.uMinMaxValue_loc, new Float32Array([minVal, maxVal]));

	// Color legend.***
	var legendColors = this._soundSurfaceVolumeOwner._legendColors4;
	var legendValues = this._soundSurfaceVolumeOwner._legendValues;

	gl.uniform4fv(currentShader.uLegendColors_loc, legendColors);
	gl.uniform1fv(currentShader.uLegendValues_loc, legendValues);

	gl.enable(gl.BLEND);
	//gl.disable(gl.CULL_FACE);

	// Render the rectangleMesh.*********************************************************************
	// Init uniforms.
	//gl.uniform1f(currentShader.uInterpolationFactor_loc, ffract);
	gl.uniform1f(currentShader.uModelOpacity_loc, 1.0);
	gl.uniform4fv(currentShader.oneColor4_loc, [0.99, 0.5, 0.25, 1.0]); //.***

	var buildingGeoLocation = this.geoLocDataManager.getCurrentGeoLocationData();
	buildingGeoLocation.bindGeoLocationUniforms(gl, currentShader); // rotMatrix, positionHIGH, positionLOW.

	var vboMemManager = magoManager.vboMemoryManager;
	var vboKeysCount = timeSlice.vboKeysContainer.vboCacheKeysArray.length;
	for (var i=0; i<vboKeysCount; i++)
	{
		var vboKey = timeSlice.vboKeysContainer.vboCacheKeysArray[i];
		if (!vboKey) 
		{
			return false;
		}
		
		// Positions.
		if (!vboKey.bindDataPosition(currentShader, vboMemManager))
		{ return false; }

		// Sound level values (decibels).***
		var name = "soundLevelValue";
		if (!vboKey.bindDataCustom(currentShader, vboMemManager, name, currentShader.value_loc))
		{ return false; }


		
		// Indices.
		if (!vboKey.bindDataIndice(currentShader, vboMemManager))
		{ return false; }
		
		var primitive = gl.TRIANGLES;
		//primitive = gl.LINE_LOOP;
		
		var glType = vboKey.vboBufferIdx.dataGlType;
		//gl.drawElements(primitive, vboKey.indicesCount, gl.UNSIGNED_SHORT, 0); // old.***
		gl.drawElements(primitive, vboKey.indicesCount, glType, 0);
	}
	// End render rectangleMesh.---------------------------------------------------------------------
	gl.disable(gl.BLEND);
	//gl.enable(gl.CULL_FACE);
	currentShader.disableVertexAttribArrayAll();
	magoManager.postFxShadersManager.useProgram(null);

	return true;
};

SoundSurfaceLayer.prototype._prepareLayer = function ()
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
				filePath               : filePath,
				soundSurfaceLayerOwner : this
			};
			var timeSlice = new SoundSurfaceTimeSlice(options);
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

		// Use the 1rst timeSlice-mesh to create the soundSurface.***
		var timeSlice = this._timeSlicesArray[this._currTimeSliceIdx];
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
		var centerGeoCoord = timeSlice._jsonFile.centerGeographicCoord;
		geoLocData = ManagerUtils.calculateGeoLocationData(centerGeoCoord.longitude, centerGeoCoord.latitude, centerGeoCoord.altitude, heading, pitch, roll, geoLocData);

		var positions = new Float32Array(timeSlice._jsonFile.positions);
		var values = new Float32Array(timeSlice._jsonFile.soundLevelValues);

		var magoManager = this._soundSurfaceVolumeOwner.weatherStation.magoManager;
		var vboKey = this.vboKeysContainer.getVboKey(0);

		var pointsCount = positions.length / 3;
		if (pointsCount >= 65535)
		{
			// indices must to be in Uint32Array.***
			var gl = magoManager.getGl();
			var uints_for_indices = gl.getExtension("OES_element_index_uint");
			var indices = new Uint32Array(timeSlice._jsonFile.indices);
			vboKey.setDataArrayIdx(indices, magoManager.vboMemoryManager);
		}
		else 
		{
			// indices must to be in Uint16Array.***
			var indices = new Uint16Array(timeSlice._jsonFile.indices);
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
	/*
	// Now, make the timeSlices values textures.***
	var timeSlicesCount = this._timeSlicesArray.length;
	for (var i=0; i<timeSlicesCount; i++)
	{
		var timeSlice = this._timeSlicesArray[i];
		var hola = 0;
	}

	// If all process are finished, then set isPrepared as true.***
	*/
	this._isPrepared = true;

	return this._isPrepared;
};