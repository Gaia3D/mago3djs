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

	// aux vars.***
	this.counterAux = 0;

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
		//var layersCount = this._geoJsonIndexFile.layersCount; // usually layersCount = 1.***
		var layersCount = 1;
		var timeSliceFileFolderPath = this._geoJsonIndexFileFolderPath;

		for (var i=0; i<layersCount; i++) 
		{
			//var layer = this._geoJsonIndexFile.layers[i];
			var options = {
				pollutionVolumeOwner       : this, 
				mosaicTexMetaDataFileNames : this._geoJsonIndexFile.mosaicTexMetaDataFileNames,
				metadataFolderPath       		: timeSliceFileFolderPath,
			};
			var chemAccidentLayer = this.newChemAccidentLayer(options);

			// Now, check if the geoJsonIndexFile has timeSlices data embeded.***
			/*
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
			*/
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
	if (this.volumePrepared)
	{
		return true;
	}

	// 1rst, check if the geoJson is loaded.***
	if (!this._preparePollutionGeoJsonIndexFile())
	{
		return false;
	}

	// create default shaders.***
	if (!this._createdShaders)
	{
		this.createDefaultShaders();
		this._createdShaders = true;
		return false;
	}

	// Now, check if pollutionLayers are prepared.***
	if (!this._preparePollutionLayers())
	{
		return false;
	}

	this.volumePrepared = true;

	return false;
};

ChemicalAccidentManager.prototype.render = function ()
{
	if (!this._geoJsonIndexFilePath)
	{
		return false;
	}

	var magoManager = this.magoManager;
	
	if (!this.prepareVolume(magoManager))
	{ return false; }
	
	if (this._animationState === CODE.processState.FINISHED || this._animationState === CODE.processState.NO_STARTED)
	{
		return true;
	}
	
	if (this._totalAnimTime === undefined) 
	{
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
		//this._animationState = CODE.processState.FINISHED;
		//return true;
		// Modify the animationStartTime.***
		var num = Math.floor(currTime / totalAnimTime);
		this._animationStartTime = num * totalAnimTime;
		this._increTime = (currTime - this._animationStartTime)* this._timeScale;
	}
	
	// Render layers.***************************************************************************************************************

	var pollutionLayersCount = this.chemAccidentLayersArray.length;
	for (var i=0; i<pollutionLayersCount; i++)
	{
		var pollLayer = this.chemAccidentLayersArray[i];
		pollLayer.render(magoManager);
	}


	// ************.MAIN-FRAMEBUFFER.************************************.MAIN-FRAMEBUFFER.************************
	// Once finished simulation, bind the current framebuffer. 
	
	var gl = magoManager.getGl();
	var sceneState = magoManager.sceneState;
	magoManager.bindMainFramebuffer();
	gl.viewport(0, 0, sceneState.drawingBufferWidth[0], sceneState.drawingBufferHeight[0]);
	
	var hola = 0;
};

ChemicalAccidentManager.prototype._newTexture = function (gl, texWidth, texHeight)
{
	var imageData = new Uint8Array(texWidth * texHeight * 4);
	var filter = gl.NEAREST;
	var tex = Texture.createTexture(gl, filter, imageData, texWidth, texHeight);

	var magoTexture = new Texture();
	magoTexture.texId = tex;
	magoTexture.fileLoadState = CODE.fileLoadState.BINDING_FINISHED;
	magoTexture.imageWidth = texWidth;
	magoTexture.imageHeight = texHeight;

	return magoTexture;
};

ChemicalAccidentManager.prototype.getQuadBuffer = function ()
{
	if (!this.screenQuad)
	{
		var gl = this.magoManager.getGl();
		var posData = new Float32Array([0, 0,   1, 0,   0, 1,   0, 1,   1, 0,   1, 1]); // total screen.
		var webglposBuffer = FBO.createBuffer(gl, posData);

		this.screenQuad = {
			posBuffer: webglposBuffer
		};
	}

	return this.screenQuad;
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

ChemicalAccidentManager.prototype.createDefaultShaders = function ()
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

	// 6) simple texture copy Shader.*********************************************************************************************
	var shaderName = "copyTextureIntoMosaic";
	var vs_source = ShaderSource.quadVertTexCoordVS;
	var fs_source = ShaderSource.soundCopyFS;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.a_pos_loc = gl.getAttribLocation(shader.program, "a_pos");//
	shader.a_texcoord_loc = gl.getAttribLocation(shader.program, "a_texcoord");//
	shader.texToCopy_loc = gl.getUniformLocation(shader.program, "texToCopy");
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.texToCopy_loc, 0);

	// 1) volumetric Shader.*********************************************************************************************
	shaderName = "volumetric";
	vs_source = ShaderSource.waterQuadVertVS;
	fs_source = ShaderSource.chemicalAccidentVolumRenderFS;
	
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	shader = magoManager.postFxShadersManager.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	
	shader.simulationBoxDoubleDepthTex_loc = gl.getUniformLocation(shader.program, "simulationBoxDoubleDepthTex");
	shader.simulationBoxDoubleNormalTex_loc = gl.getUniformLocation(shader.program, "simulationBoxDoubleNormalTex");
	shader.pollutionMosaicTex_loc = gl.getUniformLocation(shader.program, "pollutionMosaicTex");
	shader.sceneDepthTex_loc = gl.getUniformLocation(shader.program, "sceneDepthTex"); // scene depth tex.***
	shader.sceneNormalTex_loc = gl.getUniformLocation(shader.program, "sceneNormalTex"); // scene normal tex.***
	//shader.airVelocityTex_loc = gl.getUniformLocation(shader.program, "airVelocityTex");
	//shader.maxPressureMosaicTex_loc = gl.getUniformLocation(shader.program, "maxPressureMosaicTex");

	shader.a_pos_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.u_screenSize_loc = gl.getUniformLocation(shader.program, "u_screenSize");
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.tangentOfHalfFovy_loc = gl.getUniformLocation(shader.program, "tangentOfHalfFovy");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");
	shader.modelViewMatrixRelToEyeInv_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEyeInv");

	shader.u_texSize_loc = gl.getUniformLocation(shader.program, "u_texSize"); // The original texture3D size.***
	shader.u_mosaicTexSize_loc = gl.getUniformLocation(shader.program, "u_mosaicTexSize"); // The mosaic texture size.***
	shader.u_mosaicSize_loc = gl.getUniformLocation(shader.program, "u_mosaicSize"); // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
	shader.u_minMaxPollutionValues_loc = gl.getUniformLocation(shader.program, "u_minMaxPollutionValues");//
	shader.u_airEnvirontmentPressure_loc = gl.getUniformLocation(shader.program, "u_airEnvirontmentPressure");
	shader.u_maxVelocity_loc = gl.getUniformLocation(shader.program, "u_maxVelocity");
	shader.u_voxelSizeMeters_loc = gl.getUniformLocation(shader.program, "u_voxelSizeMeters");

	shader.u_simulBoxTMat_loc = gl.getUniformLocation(shader.program, "u_simulBoxTMat");
	shader.u_simulBoxTMatInv_loc = gl.getUniformLocation(shader.program, "u_simulBoxTMatInv");
	shader.u_simulBoxPosHigh_loc = gl.getUniformLocation(shader.program, "u_simulBoxPosHigh");
	shader.u_simulBoxPosLow_loc = gl.getUniformLocation(shader.program, "u_simulBoxPosLow");
	shader.u_simulBoxMinPosLC_loc = gl.getUniformLocation(shader.program, "u_simulBoxMinPosLC");
	shader.u_simulBoxMaxPosLC_loc = gl.getUniformLocation(shader.program, "u_simulBoxMaxPosLC");
	shader.uMinMaxAltitudeSlices_loc = gl.getUniformLocation(shader.program, "uMinMaxAltitudeSlices");
	
	magoManager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.simulationBoxDoubleDepthTex_loc, 0);
	gl.uniform1i(shader.simulationBoxDoubleNormalTex_loc, 1);
	gl.uniform1i(shader.pollutionMosaicTex_loc, 2);
	gl.uniform1i(shader.sceneDepthTex_loc, 3);
	gl.uniform1i(shader.sceneNormalTex_loc, 4);
	//gl.uniform1i(shader.airVelocityTex_loc, 5);
	//gl.uniform1i(shader.maxPressureMosaicTex_loc, 6);

	magoManager.postFxShadersManager.useProgram(null);
};