'use strict';

/**
 * @class PollutionTimeSlice
 */
var PollutionTimeSlice = function(options) 
{
	 if (!(this instanceof PollutionTimeSlice)) 
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

PollutionTimeSlice.prototype._prepare = function ()
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

PollutionTimeSlice.prototype.getQuantizedMinMaxValues = function ()
{
	if (this._jsonFile === undefined)
	{
		return undefined;
	}

	var minMaxValues = [this._jsonFile.minValue, this._jsonFile.maxValue];
	return minMaxValues;
};

PollutionTimeSlice.prototype.deleteObjects = function (vboMemManager)
{
	// Delete gl objects. In this case there are a glTexture only.***
	if (this._glTexture)
	{
		var gl = vboMemManager.gl;
		gl.deleteTexture(this._glTexture);
	}

	// now delete the variables.***
	this._fileileLoadState = undefined;
	this._filePath = undefined;

	// delete json object.***
	for (var variableKey in this._jsonFile)
	{
		if (this._jsonFile.hasOwnProperty(variableKey))
		{
			delete this._jsonFile[variableKey];
		}
	}
	this._jsonFile = undefined;

	this._isPrepared = undefined;
};

PollutionTimeSlice.prototype.getGlTexture = function (gl)
{
	if (this._glTexture === undefined || this._glTexture === null)
	{
		// create texture.***
		/*
		_jsonFile
			columnsCount
			fileName
			maxValue
			minValue
			rowsCount
			values : []
		*/
		// For each timeSlice, make a texture. Encode the value [0, 1] in RGBA 4bytes.***
		// create a Uint8Array from this._jsonFile.values[].***
		var valuesArray = this._jsonFile.values;
		var valuesCount = valuesArray.length;
		var rgbaUint8Data = new Uint8Array(valuesCount * 4);

		for (var i=0; i<valuesCount; i++)
		{
			var val = valuesArray[i];
			
			var encoded = ManagerUtils.packDepth(val);

			rgbaUint8Data[4*i + 0] = new Uint8Array([encoded[0] * 255])[0];
			rgbaUint8Data[4*i + 1] = new Uint8Array([encoded[1] * 255])[0];
			rgbaUint8Data[4*i + 2] = new Uint8Array([encoded[2] * 255])[0];
			rgbaUint8Data[4*i + 3] = new Uint8Array([encoded[3] * 255])[0];

		}

		var filter = gl.LINEAR;
		var texWrap = gl.CLAMP_TO_EDGE;
		var width = this._jsonFile.columnsCount;
		var height = this._jsonFile.rowsCount;
		this._glTexture = Texture.createTexture(gl, filter, rgbaUint8Data, width, height, texWrap);
	}

	return this._glTexture;
};

/**
 * @class PollutionLayerTest
 */
var PollutionLayerTest = function (options) 
{
	if (!(this instanceof PollutionLayerTest)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this._pollutionVolumeOwner;
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
	

	// Check if exist options.
	if (options !== undefined)
	{
		// check for options.***
		if (options.pollutionVolumeOwner)
		{
			this._pollutionVolumeOwner = options.pollutionVolumeOwner;
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

PollutionLayerTest.prototype._getMinMaxQuantizedValues = function ()
{
	if (this.minMaxValues === undefined)
	{
		if (this._timeSlicesArray === undefined || this._timeSlicesArray.length === 0)
		{
			return undefined;
		}

		var minMaxValues = [];
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
			this.minMaxValues = new Float32Array(minMaxValues);
		}
	}

	return this.minMaxValues;
};

PollutionLayerTest.prototype.getPollutionValue = function (posWC, currTime)
{
	if (!this._prepareLayer())
	{
		return false;
	}

	// given a geoCoord and a currTime, this function returns the pollution value at the geoCoord in the currTime.***
	var pollutionValue;

	// now posWC to posLC.***
	var geoLocData = this.geoLocDataManager.getCurrentGeoLocationData();

	var geoJsonIndexFile = this._pollutionVolumeOwner._geoJsonIndexFile;

	if (geoJsonIndexFile === undefined)
	{
		return undefined;
	}

	if (this._pollutionVolumeOwner === undefined || this._pollutionVolumeOwner._totalAnimTime === undefined)
	{
		return undefined;
	}

	var posLC = geoLocData.worldCoordToLocalCoord(posWC, undefined);

	// Now, with posLC must find the quantizedPos = texCoord.***
	var widthMeters = geoJsonIndexFile.height_km * 1000.0;
	var heightMeters = geoJsonIndexFile.width_km * 1000.0;

	var posLC_quantized2d = new Point2D((posLC.x + 0.5 * widthMeters) / widthMeters, (posLC.y + 0.5 * heightMeters) / heightMeters);
	
	// now, with currTime find the 2 timeSlices to interpolate.***
	// Provisionally take only one texture.***
	var totalAnimTime = this._pollutionVolumeOwner._totalAnimTime;
	var increTime = currTime - this._pollutionVolumeOwner._animationStartTime;

	if (increTime > totalAnimTime)
	{
		//return undefined;
	}

	var timeSlicesCount = this._timeSlicesArray.length;

	var timeFactor = increTime / totalAnimTime;
	var f = timeFactor * timeSlicesCount;
	var ffract = f - Math.floor(f); // this is the interpolation factor between currTex & nextTex.***
	var texIdxCurr = Math.floor(f);

	if (texIdxCurr >= timeSlicesCount)
	{
		texIdxCurr = timeSlicesCount - 1;
	}

	var texIdxNext = texIdxCurr + 1;
	if (texIdxNext >= timeSlicesCount)
	{
		texIdxNext = texIdxCurr;
	}
	
	//this._currTexIdx = 151;
	var timeSliceCurr = this._timeSlicesArray[texIdxCurr];
	var timeSliceNext = this._timeSlicesArray[texIdxNext];

	if (timeSliceCurr === undefined)
	{
		return undefined;
	}

	var width = timeSliceCurr._jsonFile.columnsCount;
	var height = timeSliceCurr._jsonFile.rowsCount;

	var glTexCurr = timeSliceCurr.getGlTexture(gl);
	var glTexNext = timeSliceNext.getGlTexture(gl);

	// Now, bind framebuffer.***
	var magoManager = this._pollutionVolumeOwner.weatherStation.magoManager;
	var gl = magoManager.getGl();

	if (!this.fboValuesTex) 
	{
		var bUseMultiRenderTarget = false;
		this.fboValuesTex = new FBO(gl, width, height, {matchCanvasSize: false, multiRenderTarget: bUseMultiRenderTarget, numColorBuffers: 1}); 
	}

	// Now, bind valuesTex in to the framebuffer and read pixel in posLC_quantized position.***
	var pixelPos_x = Math.floor(posLC_quantized2d.x * width);
	var pixelPos_y = Math.floor(posLC_quantized2d.y * height);

	var pixel = new Uint8Array(4);
	this.fboValuesTex.bind();

	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glTexCurr, 0);
	gl.readPixels(pixelPos_x, pixelPos_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
	this.fboValuesTex.unbind();

	if (pixel[0] !== 0 || pixel[1] !== 0 || pixel[2] !== 0 || pixel[3] !== 0)
	{
		var hola = 0;
	}

	var currMinValue = timeSliceCurr._jsonFile.minValue;
	var currMaxValue = timeSliceCurr._jsonFile.maxValue;

	var nextMinValue = timeSliceNext._jsonFile.minValue;
	var nextMaxValue = timeSliceNext._jsonFile.maxValue;

	var pixelFloats = [pixel[0] / 255.0, pixel[1] / 255.0, pixel[2] / 255.0, pixel[3] / 255.0];
	var decodedCurr = ManagerUtils.unpackDepth(pixelFloats);
	var pollutionValue_curr = (decodedCurr * (currMaxValue - currMinValue) + currMinValue);

	pollutionValue = pollutionValue_curr;

	return pollutionValue;
};

PollutionLayerTest.prototype.getTotalAnimationTimeMinutes = function ()
{
	var timeInterval_min = this.timeInterval_min;
	var timeSlicesCount = this._timeSlicesArray.length;
	var totalAnimTimeMinutes = timeInterval_min * timeSlicesCount;
	return totalAnimTimeMinutes;
};

PollutionLayerTest.prototype.render = function (magoManager)
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
	var animationStartTime = this._pollutionVolumeOwner._animationStartTime;
	var animationTime = currTime - animationStartTime;
	var timeSlicesCount = this._timeSlicesArray.length;
	var timeInterval_min = this.timeInterval_min;

	var timeSlice = this._timeSlicesArray[0];

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
	var vboKey = this.vboKeysContainer.getVboKey(0);
	var shaderManager = magoManager.postFxShadersManager;
	var currentShader = shaderManager.getShader("pollution"); // (PollutionVS, PollutionFS).***

	magoManager.postFxShadersManager.useProgram(currentShader);
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
	gl.uniform1i(currentShader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis);
	gl.uniform3fv(currentShader.scaleLC_loc, [1.0, 1.0, 1.0]); // init local scale.
	gl.uniform4fv(currentShader.colorMultiplier_loc, [1.0, 1.0, 1.0, 1.0]);
	gl.uniform3fv(currentShader.aditionalMov_loc, [0.0, 0.0, 0.0]); //.
	gl.uniform1i(currentShader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.

	var minMaxValues = this._getMinMaxQuantizedValues();
	gl.uniform2fv(currentShader.uMinMaxValues_loc, minMaxValues);
	
	
	// Textures.*****************************************************************************************************
	// Now, select the textures by time.***
	var timeSlicesCount = this._timeSlicesArray.length;
	var totalAnimTime = this._pollutionVolumeOwner._totalAnimTime; 
	var increTime = this._pollutionVolumeOwner._increTime;

	var timeFactor = increTime / totalAnimTime;
	var f = timeFactor * timeSlicesCount;
	var ffract = f - Math.floor(f); // this is the interpolation factor between currTex & nexTex.***
	var texIdxCurr = Math.floor(f);

	if (texIdxCurr >= timeSlicesCount)
	{
		texIdxCurr = timeSlicesCount - 1;
	}

	var texIdxNext = texIdxCurr + 1;
	if (texIdxNext >= timeSlicesCount)
	{
		texIdxNext = texIdxCurr;
	}
	
	//this._currTexIdx = 151;
	var timeSliceCurr = this._timeSlicesArray[texIdxCurr];
	var timeSliceNext = this._timeSlicesArray[texIdxNext];

	var glTexCurr = timeSliceCurr.getGlTexture(gl);
	var glTexNext = timeSliceNext.getGlTexture(gl);

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
	gl.uniform1f(currentShader.uInterpolationFactor_loc, ffract);
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

	var hola = 0;
};

PollutionLayerTest.prototype.deleteObjects = function (vboMemManager)
{
	// Delete time slices.***
	if (this._timeSlicesArray && this._timeSlicesArray.length > 0)
	{
		var timeSlicesCount = this._timeSlicesArray.length;
		for (var i=0; i<timeSlicesCount; i++)
		{
			var timeSlice = this._timeSlicesArray[i];
			timeSlice.deleteObjects(vboMemManager);
		}

		this._timeSlicesArray.length = 0;
	}

	this._timeSlicesArray = undefined;

	// delete vboBuffers.***
	if (this.vboKeysContainer)
	{
		var gl = vboMemManager.gl;
		this.vboKeysContainer.deleteGlObjects(gl, vboMemManager);
		this.vboKeysContainer = undefined;
	}

	// delete another vars.***
	this._pollutionVolumeOwner = undefined;

	if (this.geoLocationDataManager)
	{
		this.geoLocationDataManager.deleteObjects(); // no need arguments.***
		this.geoLocationDataManager = undefined;
	}
	
	this.gl = undefined;

	this.altitude = undefined;
	this.timeInterval_min = undefined;
	this.timeSlicesCount = undefined;
	this.timeSliceFileNames = undefined;
	this.timeSliceFileFolderPath = undefined;

	this._isPrepared = undefined;
	this._terrainSamplingState = undefined;
};

PollutionLayerTest.prototype._prepareLayer = function ()
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
			var timeSlice = new PollutionTimeSlice(options);
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