'use strict';

/**
 * @class ItineraryManager
 */
var ItineraryManager = function(options) 
{
	 if (!(this instanceof ItineraryManager)) 
	 {
		 throw new Error(Messages.CONSTRUCT_ERROR);
	 }

	 this.magoManager;
	 this._itineraryLayersArray;
	 this._walkingManMosaicTex; // a generic walkingMan.***
	 this._walkingManMosaicTexPath; // if walkingMan is used.***
	 this._walkingManMosaicTexIsPrepared = false;

	 this._animatedIcon;

	 if (options !== undefined)
	 {
		// Check options.***
		if (options.magoManager !== undefined)
		{
			this.magoManager = options.magoManager;
		}

		if (options.walkingManMosaicTexPath !== undefined)
		{
			this._walkingManMosaicTexPath = options.walkingManMosaicTexPath;
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
	if (this._walkingManMosaicTex === undefined)
	{
		this._walkingManMosaicTex = new Texture();
	}

	if (this._walkingManMosaicTex.fileLoadState === CODE.fileLoadState.READY)
	{
		var flip_y_texCoord = false;
		TexturesManager.loadTexture(this._walkingManMosaicTexPath, this._walkingManMosaicTex, this.magoManager, flip_y_texCoord);

		return false;
	}

	if (this._walkingManMosaicTex.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
	{
		// the mosaic texture is prepared.***
		this._walkingManMosaicTexIsPrepared = true;
	}

	return this._walkingManMosaicTexIsPrepared;
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

	gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
	gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	//gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
	//gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
	gl.disable(gl.CULL_FACE);
	gl.enable(gl.BLEND);

	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		itiLayer.render(thickLineShader);
	}

	// return to the current shader.
	gl.useProgram(null);
	gl.enable(gl.CULL_FACE);
	gl.disable(gl.BLEND);

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
	gl.uniform1i(shader.textureFlipYAxis_loc, magoManager.sceneState.textureFlipYAxis); 
	// Tell the shader to get the texture from texture unit 0
	gl.uniform1i(shader.texture_loc, 0);
	gl.enableVertexAttribArray(shader.texCoord2_loc);
	gl.enableVertexAttribArray(shader.position4_loc);
	gl.activeTexture(gl.TEXTURE0);
	
	//gl.depthRange(0, 0.05);
	//var context = document.getElementById('canvas2').getContext("2d");
	//var canvas = document.getElementById("magoContainer");

	if (this._animatedIcon === undefined)
	{
		var options = {};
		this._animatedIcon = new AnimatedIcon(options);
	}

	var iconPosBuffer = this._animatedIcon.getPositionBuffer(gl);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, iconPosBuffer);
	gl.vertexAttribPointer(shader.position4_loc, 4, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, this._animatedIcon.texcoordBuffer);
	gl.vertexAttribPointer(shader.texCoord2_loc, 2, gl.FLOAT, false, 0, 0);
	
	gl.activeTexture(gl.TEXTURE0);
	
	gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
	gl.uniform4fv(shader.oneColor4_loc, [0.2, 0.7, 0.9, 1.0]);
	gl.uniform2fv(shader.scale2d_loc, [1.0, 1.0]);
	gl.uniform2fv(shader.size2d_loc, [25.0, 25.0]);
	gl.uniform1i(shader.bUseOriginalImageSize_loc, true);
	gl.uniform3fv(shader.aditionalOffset_loc, [0.0, 0.0, 0.0]);
		

	for (var i=0; i<itisCount; i++)
	{
		var itiLayer = this.getItineraryLayer(i);
		itiLayer.renderWalkingMan();
	}
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

	var hola = 0;
};

