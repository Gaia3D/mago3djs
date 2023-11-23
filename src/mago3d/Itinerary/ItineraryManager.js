'use strict';

/**
 * @class ItineraryManager
 */
var ItineraryManager = function (options) 
{
	 if (!(this instanceof ItineraryManager)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this.magoManager;
	 this._itineraryLayersArray;
	 this._walkingManAnimatedIcon;
	 this._walkingManMosaicTexIsPrepared = false;
	 this._renderThickLine = true;
	 this._samplePointsSize = 5.0;

	 this._samplingDataIncrementTimeMilisec = 200;

	 if (options !== undefined)
	 {
		// Check options.***
		if (options.magoManager !== undefined)
		{
			this.magoManager = options.magoManager;
		}

		if (options.walkingManMosaicTexPath !== undefined)
		{
			if (this._walkingManAnimatedIcon === undefined)
			{
				this._walkingManAnimatedIcon = new AnimatedIcon();
				this._walkingManAnimatedIcon._mosaicTexture = new Texture();
				this._walkingManAnimatedIcon._filePath = options.walkingManMosaicTexPath;
			}
		}

		if (options.walkingManMosaicColumnsCount !== undefined)
		{
			this._walkingManAnimatedIcon._mosaicSize[0] = options.walkingManMosaicColumnsCount;
		}

		if (options.walkingManMosaicRowsCount !== undefined)
		{
			this._walkingManAnimatedIcon._mosaicSize[1] = options.walkingManMosaicRowsCount;
		}

		if (options.samplingDataIncrementTimeMilisec !== undefined)
		{
			this._samplingDataIncrementTimeMilisec = options.samplingDataIncrementTimeMilisec;
		}

		if (options.renderThickLine !== undefined)
		{
			this._renderThickLine = options.renderThickLine;
		}

		if (options.samplePointsSize !== undefined)
		{
			this._samplePointsSize = options.samplePointsSize;
		}
	 }

	 if (this.magoManager !== undefined)
	 {
		this.createDefaultShaders();
	 }
};

ItineraryManager.prototype.loadItineraryJsonFile = function (jsonjFilePath)
{
	var options = {
		filePath: jsonjFilePath
	};
	var itiLayer = this.newItineraryLayer(options);
};

ItineraryManager.prototype.newItineraryLayer = function (options)
{
	if (this._itineraryLayersArray === undefined)
	{
		this._itineraryLayersArray = [];
	}

	var itiLayer = new ItineraryLayer(options);
	itiLayer._itineraryManager = this;
	this._itineraryLayersArray.push(itiLayer);

	return itiLayer;
};

ItineraryManager.prototype.getItineraryLayersCount = function ()
{
	if (this._itineraryLayersArray === undefined)
	{
		return 0;
	}

	return this._itineraryLayersArray.length;
};

ItineraryManager.prototype.getItineraryLayer = function (idx)
{
	if (this._itineraryLayersArray === undefined)
	{
		return undefined;
	}

	return this._itineraryLayersArray[idx];
};

ItineraryManager.prototype._prepareWalkingManTexture = function ()
{
	if (this._walkingManMosaicTexIsPrepared)
	{
		return true;
	}

	// 1rst, check if the texture is loaded.***
	if (this._walkingManAnimatedIcon === undefined)
	{
		this._walkingManAnimatedIcon = new AnimatedIcon();
		this._walkingManAnimatedIcon._mosaicTexture = new Texture();
	}

	if (this._walkingManAnimatedIcon._mosaicTexture.fileLoadState === CODE.fileLoadState.READY)
	{
		var flip_y_texCoord = false;
		TexturesManager.loadTexture(this._walkingManAnimatedIcon._filePath, this._walkingManAnimatedIcon._mosaicTexture, this.magoManager, flip_y_texCoord);

		return false;
	}

	if (this._walkingManAnimatedIcon._mosaicTexture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
	{
		// the mosaic texture is prepared.***
		this._walkingManMosaicTexIsPrepared = true;
	}

	return this._walkingManMosaicTexIsPrepared;
};

ItineraryManager.prototype.deleteObjects = function (vboMemManager)
{
	this.magoManager = undefined;

	if (this._itineraryLayersArray && this._itineraryLayersArray.length > 0)
	{
		var itiLayersCount = this._itineraryLayersArray.length;
		for (var i=0; i<itiLayersCount; i++)
		{
			this._itineraryLayersArray[i].deleteObjects(vboMemManager);
			this._itineraryLayersArray[i] = undefined;
		}

		this._itineraryLayersArray.length = 0;
	}
	this._itineraryLayersArray = undefined;

	if (this._walkingManAnimatedIcon)
	{
		this._walkingManAnimatedIcon.deleteObjects(vboMemManager);
	}
	
	this._walkingManMosaicTexIsPrepared = undefined;
	this._samplingDataIncrementTimeMilisec = undefined;
};

ItineraryManager.prototype.sampleWeatherPollution = function (currTime, pollutionLayer)
{
	if (this._itineraryLayersArray === undefined)
	{
		return false;
	}

	var itisCount = this.getItineraryLayersCount();
	if (itisCount === 0)
	{
		return false;
	}

	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		itiLayer.sampleWeatherPollution(currTime, pollutionLayer);
	}

	return true;
};

ItineraryManager.prototype.deleteSamplePoints = function ()
{
	var itisCount = this.getItineraryLayersCount();
	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		itiLayer.deleteSamplePoints();
	}
};

ItineraryManager.prototype.sampleChemicalContamination = function (currUnixTimeMillisec, chemContaminationLayer)
{
	if (this._itineraryLayersArray === undefined)
	{
		return false;
	}

	var magoManager = this.magoManager;
	if (magoManager.animationTimeController._animationState === CODE.processState.PAUSED)
	{
		return false;
	}

	var itisCount = this.getItineraryLayersCount();
	if (itisCount === 0)
	{
		return false;
	}

	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		itiLayer.sampleChemicalContamination(currUnixTimeMillisec, chemContaminationLayer);
	}

	return true;
};

ItineraryManager.prototype.render = function ()
{
	if (this._itineraryLayersArray === undefined)
	{
		return false;
	}

	var itisCount = this.getItineraryLayersCount();
	if (itisCount === 0)
	{
		return false;
	}


	var magoManager = this.magoManager;
	var sceneState = magoManager.sceneState;
	var extbuffers = magoManager.extbuffers;
	var gl = magoManager.getGl();
	magoManager.bindMainFramebuffer();
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, magoManager.depthTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, magoManager.normalTex, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.COLOR_ATTACHMENT1_WEBGL, // gl_FragData[1] - depthTex
		extbuffers.COLOR_ATTACHMENT2_WEBGL, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	]);

	var thickLineShader = magoManager.postFxShadersManager.getShader("thickLine"); // (thickLineVS, thickLineFS)
	thickLineShader.useProgram();
	thickLineShader.bindUniformGenerals();

	gl.enableVertexAttribArray(thickLineShader.prev_loc);
	gl.enableVertexAttribArray(thickLineShader.current_loc);
	gl.enableVertexAttribArray(thickLineShader.next_loc);

	gl.uniform2fv(thickLineShader.viewport_loc, [sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]]);
	gl.uniform1i(thickLineShader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	gl.uniform1i(thickLineShader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);
	gl.uniform1i(thickLineShader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	gl.uniform1i(thickLineShader.bUseOutline_loc, false);

	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	gl.enable(gl.BLEND);

	var itineraryLayersPrepared = true;
	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		if (!itiLayer.render(thickLineShader, this._renderThickLine))
		{
			itineraryLayersPrepared = false;
		}
	}

	// return to the current shader.
	gl.useProgram(null);
	gl.disable(gl.BLEND);
	

	if (!itineraryLayersPrepared)
	{
		return false;
	}

	// render sampling data.**********************************************************************************************************
	// Deactive depth & normal framebuffer, to render without ssao.***
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT1_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT2_WEBGL, gl.TEXTURE_2D, null, 0);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, extbuffers.COLOR_ATTACHMENT3_WEBGL, gl.TEXTURE_2D, magoManager.albedoTex, 0);

	extbuffers.drawBuffersWEBGL([
		extbuffers.COLOR_ATTACHMENT0_WEBGL, // gl_FragData[0] - colorBuffer
		extbuffers.NONE, // gl_FragData[1] - depthTex
		extbuffers.NONE, // gl_FragData[2] - normalTex
		extbuffers.COLOR_ATTACHMENT3_WEBGL // gl_FragData[3] - albedoTex
	]);
	
	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		itiLayer.renderSampledPoints(); // here renders sampling points data.***
	}
	

	// WALKING MAN.**********************************************************************************************
	// Now, render the itinerary walkingMan & points.************************************************************
	// Check if the walkingManMosaicTex is prepared.***
	if (!this._prepareWalkingManTexture())
	{
		return false;
	}

	// get the "animatedIcon" shader & set uniforms.***
	var shader = magoManager.postFxShadersManager.getShader("animatedIcon"); 
	shader.resetLastBuffersBinded();
	
	var shaderProgram = shader.program;
	
	gl.useProgram(shaderProgram);
	shader.bindUniformGenerals();
	magoManager.effectsManager.setCurrentShader(shader);
	gl.uniformMatrix4fv(shader.modelViewProjectionMatrix4RelToEye_loc, false, magoManager.sceneState.modelViewProjRelToEyeMatrix._floatArrays);
	gl.uniform3fv(shader.cameraPosHIGH_loc, magoManager.sceneState.encodedCamPosHigh);
	gl.uniform3fv(shader.cameraPosLOW_loc, magoManager.sceneState.encodedCamPosLow);
	gl.uniformMatrix4fv(shader.buildingRotMatrix_loc, false, magoManager.sceneState.modelViewRelToEyeMatrixInv._floatArrays);
	gl.uniform1f(shader.screenWidth_loc, parseFloat(magoManager.sceneState.drawingBufferWidth[0]));
	gl.uniform1f(shader.screenHeight_loc, parseFloat(magoManager.sceneState.drawingBufferHeight[0]));
	gl.uniform1i(shader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	gl.uniform2fv(shader.uNearFarArray_loc, magoManager.frustumVolumeControl.nearFarArray);
	gl.uniform1i(shader.textureFlipYAxis_loc, true); 
	// Tell the shader to get the texture from texture unit 0
	gl.uniform1i(shader.texture_loc, 0);
	gl.enableVertexAttribArray(shader.texCoord2_loc);
	gl.enableVertexAttribArray(shader.position4_loc);
	gl.activeTexture(gl.TEXTURE0);
	

	var iconPosBuffer = this._walkingManAnimatedIcon.getPositionBuffer(gl);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, iconPosBuffer);
	gl.vertexAttribPointer(shader.position4_loc, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, this._walkingManAnimatedIcon.texcoordBuffer);
	gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
	
	gl.activeTexture(gl.TEXTURE0);
	
	gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
	gl.uniform4fv(shader.oneColor4_loc, [0.2, 0.7, 0.9, 1.0]);
	gl.uniform2fv(shader.scale2d_loc, [1.0, 1.0]);
	gl.uniform2fv(shader.size2d_loc, [60.0, 60.0]);
	gl.uniform1i(shader.bUseOriginalImageSize_loc, false);
	gl.uniform3fv(shader.aditionalOffset_loc, [0.0, 0.0, 0.0]);

	gl.uniform1iv(shader.uMosaicSize_loc, this._walkingManAnimatedIcon._mosaicSize); // 5 cols & 2 rows.***
		
	var selectionManager = magoManager.selectionManager;
	var lastTexId = undefined;

	if (this.subImageIdx === undefined)
	{
		this.subImageIdx = 0;
	}

	if (this.lastTimeSubImageChanged === undefined)
	{
		this.lastTimeSubImageChanged = 0;
	}

	gl.enable(gl.BLEND);
	gl.depthRange(0.0, 0.1);
	var executedEffects = false;
	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		var currentTexture = this._walkingManAnimatedIcon._mosaicTexture;

		gl.uniform2fv(shader.scale2d_loc, new Float32Array([1.0, 1.0]));
		/*
		if (selectionManager.isObjectSelected(objMarker))
		{
			gl.uniform2fv(shader.scale2d_loc, new Float32Array([1.5, 1.5]));
			if (objMarker.imageFilePathSelected)
			{
				var selectedTexture = this.pin.getTexture(objMarker.imageFilePathSelected);
				if (selectedTexture)
				{ currentTexture = selectedTexture; }
				else 
				{
					this.pin.loadImage(objMarker.imageFilePathSelected, magoManager);
					continue;
				}
			}
		}
		*/

		//gl.uniform1i(shader.bUseOriginalImageSize_loc, objMarker.bUseOriginalImageSize);
		//if (!objMarker.bUseOriginalImageSize)
		//{ gl.uniform2fv(shader.size2d_loc, objMarker.size2d); }
	
		// Check if there are effects.
		//if (renderType !== 2 && magoManager.currentProcess !== CODE.magoCurrentProcess.StencilSilhouetteRendering)
		//{ executedEffects = magoManager.effectsManager.executeEffects(objMarker.id, magoManager); }
	
		gl.uniform2fv(shader.imageSize_loc, [currentTexture.texId.imageWidth, currentTexture.texId.imageHeight]);
		gl.uniform1i(shader.uSubImageIdx_loc, this.subImageIdx);
		
		//var objMarkerGeoLocation = objMarker.geoLocationData; // original.

		var geoLocData = itiLayer.vectorMesh.geoLocDataManager.getCurrentGeoLocationData();
		geoLocData.bindGeoLocationUniforms(gl, shader);

		if (geoLocData === undefined)
		{ continue; }
		
		if (currentTexture.texId !== lastTexId)
		{
			gl.bindTexture(gl.TEXTURE_2D, currentTexture.texId);
			lastTexId = currentTexture.texId;
		}

		var currTime = magoManager.animationTimeController.getCurrentTimeMilisec();
		//var diffTimeSec = itiLayer._getDiffTimeSec(currTime);

		var currUnixTimeMillisec = magoManager.animationTimeController.getCurrentUnixTimeMilisec();

		//var posWC = itiLayer._getWalkingManPositionWC_forIncreTimeSec(diffTimeSec, undefined);
		var posWC = itiLayer._getWalkingManPositionWC_forUnixTimeMillisec(currUnixTimeMillisec, undefined);

		// now bind the posHIGH & posLOW.***
		var positionHIGH = new Float32Array([0.0, 0.0, 0.0]); 
		var positionLOW = new Float32Array([0.0, 0.0, 0.0]); 
		ManagerUtils.calculateSplited3fv([posWC.x, posWC.y, posWC.z], positionHIGH, positionLOW);
		
		gl.uniform3fv(shader.buildingPosHIGH_loc, positionHIGH);
		gl.uniform3fv(shader.buildingPosLOW_loc, positionLOW);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		if (currTime - this.lastTimeSubImageChanged > 300.0)
		{
			this.subImageIdx += 1;
			this.lastTimeSubImageChanged = currTime;
		}
		
		if (this.subImageIdx >= this._walkingManAnimatedIcon._mosaicSize[0] * this._walkingManAnimatedIcon._mosaicSize[1])
		{
			this.subImageIdx = 0;
		}
	}
	
	if (executedEffects)
	{
		// must return all uniforms changed for effects.
		gl.uniform3fv(shader.aditionalOffset_loc, [0.0, 0.0, 0.0]); // init referencesMatrix.
	}
	
	
	gl.disable(gl.BLEND);
	gl.depthRange(0, 1);
	gl.depthMask(true);
	gl.useProgram(null);

	
};

ItineraryManager.prototype.createDefaultShaders = function ()
{
	// the water render shader.
	var magoManager = this.magoManager;
	var gl = magoManager.getGl();

	var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	var glVersion = gl.getParameter(gl.VERSION);
	
	if (!magoManager.isCesiumGlobe())
	{
		var supportEXT = gl.getSupportedExtensions().indexOf("EXT_frag_depth");
		if (supportEXT > -1)
		{
			gl.getExtension("EXT_frag_depth");
		}
		magoManager.EXTENSIONS_init = true;
		use_linearOrLogarithmicDepth = "USE_LOGARITHMIC_DEPTH";

		magoManager.postFxShadersManager.bUseLogarithmicDepth = true;
	}

	magoManager.postFxShadersManager.bUseMultiRenderTarget = false;
	var supportEXT = gl.getSupportedExtensions().indexOf("WEBGL_draw_buffers");
	if (supportEXT > -1)
	{
		var extbuffers = gl.getExtension("WEBGL_draw_buffers");
		magoManager.postFxShadersManager.bUseMultiRenderTarget = true;
		use_multi_render_target = "USE_MULTI_RENDER_TARGET";
	}

	var userAgent = window.navigator.userAgent;
	var isIE = userAgent.indexOf('Trident') > -1;
	if (isIE) 
	{
		use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
		magoManager.postFxShadersManager.bUseLogarithmicDepth = false;	
	}

	// here creates the necessary shaders for waterManager.***
	// 8) depthTexFromQuantizedMesh Shader.********************************************************************************************
	var shaderName = "animatedIcon";
	var vs_source = ShaderSource.AnimatedIconVS;
	var fs_source = ShaderSource.AnimatedIconFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager); // here, the "postFxShadersManager" stores the shader into a map by name.***
	shader.position4_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.scale2d_loc = gl.getUniformLocation(shader.program, "scale2d");
	shader.size2d_loc = gl.getUniformLocation(shader.program, "size2d");
	shader.imageSize_loc = gl.getUniformLocation(shader.program, "imageSize");
	shader.bUseOriginalImageSize_loc = gl.getUniformLocation(shader.program, "bUseOriginalImageSize");
	shader.aditionalOffset_loc = gl.getUniformLocation(shader.program, "aditionalOffset");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");
	shader.uMosaicSize_loc = gl.getUniformLocation(shader.program, "uMosaicSize");
	shader.uSubImageIdx_loc = gl.getUniformLocation(shader.program, "uSubImageIdx");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");

	var hola = 0;
};

