'use strict';

/**
 * @class ChemicalAccident2DManager
 */
var ChemicalAccident2DManager = function (options) 
{
	if (!(this instanceof ChemicalAccident2DManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.magoManager;
	this.chemAccident2DLayersArray;

	this._jsonIndexFilesArry = [];

	this._animationState = CODE.processState.NO_STARTED; 
	this._animationStartTime = 0;
	this._totalAnimTime;
	this._increTime;
	this._isDoRender = true;
	this.renderingColorType = 2; // 0= rainbow, 1= monotone, 2= legendColors.***
	this.renderBorder = false;
	this.textureFilterType = 0; // 0= nearest, 1= linear.***
	this.interpolationBetweenSlices = 0; // 0= nearest, 1= linear.***

	this._legendColors4;
	this._legendValues;
	this._legendColorsCount = 0;
	this._legendValuesScale = 1.0;

	this.pngsBinBlocksArray = undefined;

	this._isReadyToRender  = false;

	// aux vars.***
	this.counterAux = 0;
	
	if (options)
	{
		if (options.magoManager)
		{
			this.magoManager = options.magoManager;
		}

		if (options.url)
		{
			// check if the "url" is an array of urls.***
			if (Array.isArray(options.url))
			{
				var jsonIndexFilesCount = options.url.length;
				for (var i=0; i<jsonIndexFilesCount; i++)
				{
					var jsonIndexFile = new JsonIndexFile({url: options.url[i]});
					this._jsonIndexFilesArry.push(jsonIndexFile);
				}
			}
			else 
			{
				var jsonIndexFile = new JsonIndexFile({url: options.url});
				this._jsonIndexFilesArry.push(jsonIndexFile);
			}
		}

		if (options.animationSpeed !== undefined)
		{
			// AnimationSpeed by default is 1. If want to render faster, try to set animationSpeed = 2 or animationSpeed = 3.***
			this._animationSpeed = options.animationSpeed;
		}

		if (options.renderingColorType !== undefined)
		{
			this.renderingColorType = options.renderingColorType;
		}

		if (options.renderBorder !== undefined)
		{
			this.renderBorder = options.renderBorder;
		
		}

		if (options.textureFilterType !== undefined)
		{
			this.textureFilterType = options.textureFilterType;
		}

		if (options.interpolationBetweenSlices !== undefined)
		{
			this.interpolationBetweenSlices = options.interpolationBetweenSlices;
		}
	}

	// test vars.***
	this.test_started = false;
};

ChemicalAccident2DManager.prototype.setTextureFilterType = function (textureFilterType)
{
	// textureFilterType = 0 : nearest, 1 : linear.***
	this.textureFilterType = textureFilterType;

	var chemAccidentLayersCount = this.chemAccident2DLayersArray.length;
	for (var i=0; i<chemAccidentLayersCount; i++)
	{
		var chemAccLayer = this.chemAccident2DLayersArray[i];
		chemAccLayer.setTextureFilterType(textureFilterType);
	}
};

ChemicalAccident2DManager.prototype.setLegendColors = function (legendColorsArray)
{
	var legendColorsCount = legendColorsArray.length;
	if (legendColorsCount === 0)
	{
		return false;
	}

	this._legendColors4 = new Float32Array(legendColorsCount * 4);
	this._legendValues = new Float32Array(legendColorsCount);

	for (var i=0; i<legendColorsCount; i++)
	{
		var color = legendColorsArray[i];
		this._legendColors4[i*4] = color.red;
		this._legendColors4[i*4+1] = color.green;
		this._legendColors4[i*4+2] = color.blue;
		this._legendColors4[i*4+3] = color.alpha;
		this._legendValues[i] = color.value;
	}

	this._legendColorsCount = legendColorsCount;
};

ChemicalAccident2DManager.prototype.setLegendValuesScale = function (legendValuesScale)
{
	this._legendValuesScale = legendValuesScale;
};

ChemicalAccident2DManager.prototype.getLegendValuesScale = function ()
{
	return this._legendValuesScale;
};

ChemicalAccident2DManager.prototype.show = function ()
{
	this._isDoRender = true;
};

ChemicalAccident2DManager.prototype.hide = function ()
{
	this._isDoRender = false;
};

ChemicalAccident2DManager.prototype.isShow = function ()
{
	return this._isDoRender;
};


ChemicalAccident2DManager.prototype.getRenderingColorType = function ()
{
	return this.renderingColorType;
};

ChemicalAccident2DManager.prototype.setRenderBorder = function (renderBorder)
{
	this.renderBorder = renderBorder;

	var chemAccidentLayersCount = this.chemAccident2DLayersArray.length;
	for (var i=0; i<chemAccidentLayersCount; i++)
	{
		var chemAccLayer = this.chemAccident2DLayersArray[i];
		chemAccLayer.setRenderBorder(renderBorder);
	}
};

ChemicalAccident2DManager.prototype.setRenderingColorType = function (renderingColorType)
{
	this.renderingColorType = renderingColorType;

	var chemAccidentLayersCount = this.chemAccident2DLayersArray.length;
	for (var i=0; i<chemAccidentLayersCount; i++)
	{
		var chemAccLayer = this.chemAccident2DLayersArray[i];
		chemAccLayer.setRenderingColorType(renderingColorType);
	}
};

ChemicalAccident2DManager.prototype.setInterpolationBetweenSlices = function (interpolationBetweenSlices)
{
	this.interpolationBetweenSlices = interpolationBetweenSlices;

	var chemAccidentLayersCount = this.chemAccident2DLayersArray.length;
	for (var i=0; i<chemAccidentLayersCount; i++)
	{
		var chemAccLayer = this.chemAccident2DLayersArray[i];
		chemAccLayer.setInterpolationBetweenSlices(interpolationBetweenSlices);
	}
};

ChemicalAccident2DManager.prototype.getChemicalAccident2DLayer = function (layerIdx)
{
	if (this.chemAccident2DLayersArray === undefined)
	{
		return undefined;
	}

	var chemAccidentLayersCount = this.chemAccident2DLayersArray.length;
	if (layerIdx >= chemAccidentLayersCount)
	{
		return undefined;
	}

	return this.chemAccident2DLayersArray[layerIdx];
};

ChemicalAccident2DManager.prototype.render = function ()
{
	var magoManager = this.magoManager;
	
	if (!this.prepareVolume(magoManager))
	{ return false; }

	if (!this._isDoRender)
	{
		return true;
	}
	
	if (this._animationState === CODE.processState.FINISHED || this._animationState === CODE.processState.NO_STARTED)
	{
		return true;
	}

	
	// Render layers.***************************************************************************************************************
	var pollutionLayersCount = this.chemAccident2DLayersArray.length;
	for (var i=0; i<pollutionLayersCount; i++)
	{
		var pollLayer = this.chemAccident2DLayersArray[i];
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

ChemicalAccident2DManager.prototype.getQuadBuffer = function ()
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

ChemicalAccident2DManager.prototype.prepareVolume = function (magoManager)
{
	// We need:
	// 1- GeoJsonIndexFile.
	// 2- pollution-layers (if GeoJsonIndexFile is loaded).
	//-------------------------------------------------------------

	if (this._isReadyToRender )
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

	this._isReadyToRender  = true;

	this.pngsBinBlocksArray = undefined; // free memory.***

	return false;
};

ChemicalAccident2DManager.prototype.isReady = function ()
{
	return this._isReadyToRender;
};

ChemicalAccident2DManager.prototype._preparePollutionGeoJsonIndexFile = function ()
{
	// // check if exist jsonIndexFiles.***
	if (this._jsonIndexFilesArry === undefined || this._jsonIndexFilesArry.length === 0)
	{
		return false;
	}

	var jsonFilesCount = this._jsonIndexFilesArry.length;
	for (var i=0; i<jsonFilesCount; i++)
	{
		var jsonIndexFile = this._jsonIndexFilesArry[i];
		if (!jsonIndexFile._prepare())
		{
			return false;
		}
	}

	return true;
};

ChemicalAccident2DManager.prototype._loadGeoJsonIndexFile = function ()
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

ChemicalAccident2DManager.prototype.createDefaultShaders = function ()
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
	// NOTE : actually, the chemicalAccident2D shader is created in postEffectShaderManager.***
	
};

ChemicalAccident2DManager.prototype._preparePollutionLayers = function (magoManager)
{
	if (this._allLayersArePrepared === true)
	{
		return true;
	}

	// Check if layers exist.***
	if (this.chemAccident2DLayersArray === undefined)
	{
		this.chemAccident2DLayersArray = [];
	}

	var pollutionLayersCount = this.chemAccident2DLayersArray.length;
	if (pollutionLayersCount === 0)
	{
		// use "GeoJsonIndexFile" to create pollutionLayers.***
		var layersCount = this._jsonIndexFilesArry.length;
		for (var j=0; j<layersCount; j++)
		{
			var jsonIndexFile = this._jsonIndexFilesArry[j];
			var options = {
				pollutionVolumeOwner : this,
				jsonIndexFile        : jsonIndexFile,
				metadataFolderPath   : jsonIndexFile._geoJsonIndexFileFolderPath,
			};
			var chemAccidentLayer = this.newChemAccidentLayer2D(options);
		}
	}

	// Now, check if all pollutionLayers are prepared.***
	
	var allLayersArePrepared = true;
	var pollutionLayersCount = this.chemAccident2DLayersArray.length;
	for (var i=0; i<pollutionLayersCount; i++)
	{
		var pollLayer = this.chemAccident2DLayersArray[i];
		if (!pollLayer._prepareLayer())
		{
			allLayersArePrepared = false;
		}
	}

	this._allLayersArePrepared = allLayersArePrepared;
	
	return false;
};

ChemicalAccident2DManager.prototype.newChemAccidentLayer2D = function (options)
{
	if (!this.chemAccident2DLayersArray)
	{
		this.chemAccident2DLayersArray = [];
	}

	if (options === undefined)
	{
		return false;
	}

	options.chemicalAccident2DManager = this;
	options.renderingColorType = this.renderingColorType;
	options.renderBorder = this.renderBorder;
	options.textureFilterType = this.textureFilterType;
	options.interpolationBetweenSlices = this.interpolationBetweenSlices;

	var chemAccLayer = new ChemicalAccident2DLayer(options);

	// set the legendColors.***
	if (this._legendColors4 !== undefined && this._legendValues !== undefined)
	{
		chemAccLayer.copyLegendColors(this._legendColors4, this._legendValues, this._legendColorsCount, this._legendValuesScale);
	}

	this.chemAccident2DLayersArray.push(chemAccLayer);
	return chemAccLayer;
};

