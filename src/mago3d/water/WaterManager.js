'use strict';

/**
 * @class WaterManager
 */
var WaterManager = function(magoManager) 
{
	if (!(this instanceof WaterManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

    // https://github.com/LanLou123/Webgl-Erosion

    this.waterLayersArray = [];
    this.magoManager = magoManager;

    this.createDefaultShaders();
};

/**
 * render
 */
WaterManager.prototype.newWater = function (options)
{
var water = new Water(this, options);
this.waterLayersArray.push(water);
return water;
};

 /**
 * render
 */
WaterManager.prototype.createDefaultShaders = function ()
{
    // the water render shader.
    var magomanager = this.magoManager;
    var gl = magomanager.getGl();

    var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	var glVersion = gl.getParameter(gl.VERSION);
	
	if (!magomanager.isCesiumGlobe())
	{
		var supportEXT = gl.getSupportedExtensions().indexOf("EXT_frag_depth");
		if (supportEXT > -1)
		{
			gl.getExtension("EXT_frag_depth");
		}
		magomanager.EXTENSIONS_init = true;
		use_linearOrLogarithmicDepth = "USE_LOGARITHMIC_DEPTH";

		magomanager.postFxShadersManager.bUseLogarithmicDepth = true;
	}

	magomanager.postFxShadersManager.bUseMultiRenderTarget = false;
	var supportEXT = gl.getSupportedExtensions().indexOf("WEBGL_draw_buffers");
	if (supportEXT > -1)
	{
		var extbuffers = gl.getExtension("WEBGL_draw_buffers");
		magomanager.postFxShadersManager.bUseMultiRenderTarget = true;
		use_multi_render_target = "USE_MULTI_RENDER_TARGET";
	}

	var userAgent = window.navigator.userAgent;
	var isIE = userAgent.indexOf('Trident') > -1;
	if (isIE) 
	{
		use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";
		magomanager.postFxShadersManager.bUseLogarithmicDepth = false;	
	}

	// here creates the necessary shaders for waterManager.***
	// 1) waterRender Shader.********************************************************************************************
	var shaderName = "waterRender";
	var ssao_vs_source = ShaderSource.waterRenderVS;
	var ssao_fs_source = ShaderSource.waterRenderFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = magomanager.postFxShadersManager.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.hightmap_loc = gl.getUniformLocation(shader.program, "hightmap");
	shader.terrainmap_loc = gl.getUniformLocation(shader.program, "terrainmap");
	shader.u_heightMap_MinMax_loc = gl.getUniformLocation(shader.program, "u_heightMap_MinMax");
	//shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	//shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	//shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	//shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	//shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");

	magomanager.postFxShadersManager.useProgram(shader);
	gl.uniform1i(shader.hightmap_loc, 0);
	gl.uniform1i(shader.terrainmap_loc, 1);
	
};

/**
 * render
 */
WaterManager.prototype.render = function ()
{
	// Load dem texture:
	this._test_loadDEMTexturesForWater();

	if(!this.dem_texture.texId)
	{ return; }

	var magoManager = this.magoManager;
	var gl = magoManager.getGl();
	var shader = magoManager.postFxShadersManager.getShader("waterRender");
	magoManager.postFxShadersManager.useProgram(shader);
	//gl.uniform1i(shader.bUseLogarithmicDepth_loc, magoManager.postFxShadersManager.bUseLogarithmicDepth);
	//gl.uniform1f(shader.uFCoef_logDepth_loc, sceneState.fCoef_logDepth[0]);
	//gl.uniform1i(shader.clippingType_loc, 0);
	//gl.uniform1i(shader.uFrustumIdx_loc, magoManager.currentFrustumIdx);
	//gl.uniform1i(shader.bUseMultiRenderTarget_loc, magoManager.postFxShadersManager.bUseMultiRenderTarget);

	shader.bindUniformGenerals();

	// Bind the textures:
	var flipYTexCoord = false;
	gl.uniform1i(shader.textureFlipYAxis_loc, flipYTexCoord);
	shader.enableVertexAttribArray(shader.position3_loc);
	shader.enableVertexAttribArray(shader.texCoord2_loc);
	gl.uniform1i(shader.colorType_loc, 2); // 0= oneColor, 1= attribColor, 2= texture.
	if (shader.last_tex_id !== this.dem_texture.texId)
	{
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.dem_texture.texId);
		shader.last_tex_id = this.dem_texture.texId;
	}
	gl.enable(gl.DEPTH_TEST);

	var waterLayersCount = this.waterLayersArray.length;
	var waterLayer;
	for(var i=0; i<waterLayersCount; i++)
	{
		waterLayer = this.waterLayersArray[i];
		waterLayer.render(shader, magoManager);
	}
};

 /**
 */
WaterManager.prototype._test_water = function()
{
    // 127.1966787369999992,35.5972825200000003 : 127.2283140579999952,35.6277023940000035
    var minLon = 127.1966787369999992;
    var minLat = 35.5972825200000003;
    var minAlt = 0;
    var maxLon = 127.2283140579999952;
    var maxLat = 35.6277023940000035;
    var maxAlt = 0;
    var geographicExtent = new GeographicExtent(minLon, minLat, minAlt, maxLon, maxLat, maxAlt);
    var options = {
        geographicExtent : geographicExtent
    };
    var water = this.newWater(options);

	//----------------------------------------------
    this.testStarted = true;
};

 /**
 */
WaterManager.prototype._test_loadDEMTexturesForWater = function ()
{
	// Load textures:
	// 1- DEM texture.
	if(!this.dem_texture)
	{
		var gl = this.magoManager.getGl();

		// load test texture dem.
		this.dem_texture = new Texture();
		this.dem_texture.texId = gl.createTexture();
	}
	else if (this.dem_texture.fileLoadState === CODE.fileLoadState.READY)
	{
		var gl = this.magoManager.getGl();
		var readerWriter = this.magoManager.readerWriter;
		var dem_texturePath = '/images/en/demSampleTest.png';

		ReaderWriter.loadImage(gl, dem_texturePath, this.dem_texture);
		return false;
	}
	else if (this.dem_texture.fileLoadState === CODE.fileLoadState.BINDING_FINISHED)
	{
		var hola = 0;
	}
	
};