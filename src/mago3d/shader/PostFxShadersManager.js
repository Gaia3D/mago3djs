'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class PostFxShadersManager
 */
var PostFxShadersManager = function(magoManager, options) 
{
	if (!(this instanceof PostFxShadersManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.magoManager = magoManager;
	this.gl;
	this.pFx_shaders_array = []; // old.
	this.shadersMap = {};
	
	// preCreated shaders.
	this.modelRefShader;
	this.modelRefSilhouetteShader;
	this.lodBuildingShader;
	
	this.currentShaderUsing = undefined; // current active shader.

	this.bUseLogarithmicDepth = false;
	this.bUseMultiRenderTarget = false;

	if (options)
	{
		if (options.useLogarithmicDepth)
		{ this.bUseLogarithmicDepth = options.useLogarithmicDepth; }
	}
};

PostFxShadersManager.prototype.getUseLogarithmicDepth = function()
{
	return this.bUseLogarithmicDepth;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShadersManager.prototype.newShader = function(shaderName)
{
	var shader = new PostFxShader(this.gl);
	shader.name = shaderName;
	shader.shaderManager = this;
	this.shadersMap[shaderName] = shader;
	return shader;
};

/**
 * Returns true if the shader is the this.currentShaderUsing.
 * @returns shader
 */
PostFxShadersManager.prototype.getCurrentShader = function() 
{
	return this.currentShaderUsing;
};


/**
 * Returns the current active shader.
 * @param {PostFxShader} shader
 * @returns {BOOL}}
 */
PostFxShadersManager.prototype.isCurrentShader = function(shader) 
{
	return (this.currentShaderUsing === shader);
};

/**
 * Returns the current active shader.
 * @param {PostFxShader} shader
 * @returns {BOOL}}
 */
PostFxShadersManager.prototype.useProgram = function(shader) 
{
	if (shader === undefined || shader === null)
	{
		this.gl.useProgram(null);
		this.currentShaderUsing = null;
	}
	else if (!this.isCurrentShader(shader))
	{
		shader.useProgram();
		this.currentShaderUsing = shader;
	}
};

PostFxShadersManager.prototype._get_useMultiRenderTarget_string = function() 
{
	if (this.bUseMultiRenderTarget)
	{
		return "USE_MULTI_RENDER_TARGET";
	}
	return "NO_USE_MULTI_RENDER_TARGET";
};

PostFxShadersManager.prototype._get_useLinearOrLogarithmicDepth_string = function() 
{
	if (this.bUseLogarithmicDepth)
	{
		return "USE_LOGARITHMIC_DEPTH";
	}
	return "USE_LINEAR_DEPTH";
};

PostFxShadersManager.prototype._createShader_gBuffer = function () 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	// Hard code.***
	var shaderName = "gBuffer";
	var ssao_vs_source = ShaderSource.GBufferVS;
	var ssao_fs_source = ShaderSource.GBufferFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");

	// create an attributes locations map.***
	// Attributtes.*************************************************************************************************
	//shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	//shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	//shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	//shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	// End attributes.----------------------------------------------------------------------------------------------
	shader._attribLocMap = {
		POSITION3 : gl.getAttribLocation(shader.program, "position"),
		NORMAL3   : gl.getAttribLocation(shader.program, "normal"),
		COLOR4    : gl.getAttribLocation(shader.program, "color4"),
		TEXCOORD2 : gl.getAttribLocation(shader.program, "texCoord")
	};


	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_gBufferORT = function () 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	// Note : here, there is no multi render target.***
	var gl = this.gl;

	// Hard code.***
	var shaderName = "gBufferORT";
	var ssao_vs_source = ShaderSource.GBufferVS;
	var ssao_fs_source = ShaderSource.GBufferORTFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");
	shader.u_outputTarget_loc = gl.getUniformLocation(shader.program, "u_outputTarget");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_lBuffer = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "lBuffer";
	var ssao_vs_source = ShaderSource.LBufferVS;
	var ssao_fs_source = ShaderSource.LBufferFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.bApplyShadows_loc = gl.getUniformLocation(shader.program, "bApplyShadows");
	shader.lightDirWC_loc = gl.getUniformLocation(shader.program, "lightDirWC");
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.uLightColorAndBrightness_loc = gl.getUniformLocation(shader.program, "uLightColorAndBrightness");
	shader.ModelViewProjectionMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.buildingRotMatrixInv_loc = gl.getUniformLocation(shader.program, "buildingRotMatrixInv");
	shader.u_processType_loc = gl.getUniformLocation(shader.program, "u_processType");

	shader.uLightParameters_loc = gl.getUniformLocation(shader.program, "uLightParameters");// 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.
	shader.uLightIntensity_loc = gl.getUniformLocation(shader.program, "uLightIntensity");

	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	shader.light_depthCubeMap_loc = gl.getUniformLocation(shader.program, "light_depthCubeMap");
	this.useProgram(shader);
	gl.uniform1i(shader.normalTex_loc, 1);
	gl.uniform1i(shader.light_depthCubeMap_loc, 2);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_screenQuad = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "screenQuad";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenQuadFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.ssaoTex_loc = gl.getUniformLocation(shader.program, "ssaoTex");
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	shader.albedoTex_loc = gl.getUniformLocation(shader.program, "albedoTex");
	shader.silhouetteDepthTex_loc = gl.getUniformLocation(shader.program, "silhouetteDepthTex");
	shader.diffuseLightTex_loc = gl.getUniformLocation(shader.program, "diffuseLightTex");
	shader.specularLightTex_loc = gl.getUniformLocation(shader.program, "specularLightTex");
	shader.uBrightnessContrastSaturation_loc = gl.getUniformLocation(shader.program, "uBrightnessContrastSaturation");
	shader.uBrightnessContrastType_loc = gl.getUniformLocation(shader.program, "uBrightnessContrastType");
	shader.ussaoTexSize_loc = gl.getUniformLocation(shader.program, "ussaoTexSize");

	this.useProgram(shader);
	gl.uniform1i(shader.ssaoTex_loc, 5);
	gl.uniform1i(shader.normalTex_loc, 1);
	gl.uniform1i(shader.albedoTex_loc, 2);
	gl.uniform1i(shader.diffuseLightTex_loc, 6);
	gl.uniform1i(shader.specularLightTex_loc, 7);
	gl.uniform1i(shader.silhouetteDepthTex_loc, 8);
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uSceneDayNightLightingFactor_loc = gl.getUniformLocation(shader.program, "uSceneDayNightLightingFactor");
	shader.uAmbientLight_loc = gl.getUniformLocation(shader.program, "uAmbientLight");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_screenCopyQuad = function () 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "screenCopyQuad";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenCopyQuadFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_GL_EXT_FRAGDEPTH%/g, "USE_GL_EXT_FRAGDEPTH"); // only in this shader use extension GL_EXT_frag_depth.
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.albedoTex_loc = gl.getUniformLocation(shader.program, "albedoTex");//
	shader.u_textureTypeToCopy_loc = gl.getUniformLocation(shader.program, "u_textureTypeToCopy");

	this.useProgram(shader);
	gl.uniform1i(shader.normalTex_loc, 1);
	gl.uniform1i(shader.albedoTex_loc, 2);

	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_screenQuad2 = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "screenQuad2";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenQuad2FS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	shader.lightFogTex_loc = gl.getUniformLocation(shader.program, "lightFogTex");//
	shader.shadedColorTex_loc = gl.getUniformLocation(shader.program, "shadedColorTex");//
	shader.brightColorTex_loc = gl.getUniformLocation(shader.program, "brightColorTex");//
	shader.screenSpaceObjectsTex_loc = gl.getUniformLocation(shader.program, "screenSpaceObjectsTex");
	shader.uAmbientLight_loc = gl.getUniformLocation(shader.program, "uAmbientLight");
	this.useProgram(shader);
	gl.uniform1i(shader.depthTex_loc, 0);
	gl.uniform1i(shader.normalTex_loc, 1);
	gl.uniform1i(shader.lightFogTex_loc, 2);
	gl.uniform1i(shader.screenSpaceObjectsTex_loc, 3);
	gl.uniform1i(shader.shadedColorTex_loc, 4);
	gl.uniform1i(shader.brightColorTex_loc, 5);

	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uSceneDayNightLightingFactor_loc = gl.getUniformLocation(shader.program, "uSceneDayNightLightingFactor");
	shader.u_activeTex_loc = gl.getUniformLocation(shader.program, "u_activeTex");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_gaussianBlur = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "gaussianBlur";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenQuadGaussianBlurFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.u_bHorizontal_loc = gl.getUniformLocation(shader.program, "u_bHorizontal");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");
	shader.uImageSize_loc = gl.getUniformLocation(shader.program, "uImageSize");
	shader.imageTex_loc = gl.getUniformLocation(shader.program, "image");
	this.useProgram(shader);
	gl.uniform1i(shader.imageTex_loc, 0);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_screenQuadBlur = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "screenQuadBlur";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ScreenQuadBlurFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.u_bHorizontal_loc = gl.getUniformLocation(shader.program, "u_bHorizontal");
	//shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	//shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");
	shader.uImageSize_loc = gl.getUniformLocation(shader.program, "uImageSize");
	shader.imageTex_loc = gl.getUniformLocation(shader.program, "image");
	this.useProgram(shader);
	gl.uniform1i(shader.imageTex_loc, 0);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_modelRefSsao = function() 
{
	// This shader is used to render transparent objects, 
	//bcos gBuffer-shader cannot render transparents.***
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "modelRefSsao";
	var ssao_vs_source = ShaderSource.ModelRefSsaoVS;
	var ssao_fs_source = ShaderSource.ModelRefSsaoFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.uModelOpacity_loc = gl.getUniformLocation(shader.program, "uModelOpacity");
	shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_modelRefDepth = function() 
{
	// This shader is used to render depth of selected objects to render silhouette.***
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "modelRefDepth";
	var showDepth_vs_source = ShaderSource.RenderShowDepthVS;
	var showDepth_fs_source = ShaderSource.RenderShowDepthFS;
	showDepth_fs_source = showDepth_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	showDepth_fs_source = showDepth_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, showDepth_vs_source, showDepth_fs_source, shaderName, this.magoManager);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");

	shader.mvpRelToEyeMatrix_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.mvRelToEyeMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.normalMatrix_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.encodedCameraPositionMCHigh_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.encodedCameraPositionMCLow_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_tinTerrain = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "tinTerrain";
	var ssao_vs_source = ShaderSource.TinTerrainVS;
	var ssao_fs_source = ShaderSource.TinTerrainFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);

	shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	shader.bExistAltitudes_loc = gl.getUniformLocation(shader.program, "bExistAltitudes");
	shader.uMinMaxAltitudes_loc = gl.getUniformLocation(shader.program, "uMinMaxAltitudes");
	shader.uTileDepth_loc = gl.getUniformLocation(shader.program, "uTileDepth");
	shader.altitude_loc = gl.getAttribLocation(shader.program, "altitude");
	shader.uSeaOrTerrainType_loc = gl.getUniformLocation(shader.program, "uSeaOrTerrainType");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.bApplyCaustics_loc = gl.getUniformLocation(shader.program, "bApplyCaustics");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");

	shader.uTileGeoExtent_loc = gl.getUniformLocation(shader.program, "uTileGeoExtent");
	shader.uGeoRectangles_loc = gl.getUniformLocation(shader.program, "uGeoRectangles");
	shader.uGeoRectanglesCount_loc = gl.getUniformLocation(shader.program, "uGeoRectanglesCount");

	shader.uTileGeoExtent_loc = gl.getUniformLocation(shader.program, "uTileGeoExtent");
	shader.uTileDepthOfBindedTextures_loc = gl.getUniformLocation(shader.program, "uTileDepthOfBindedTextures");
	shader.uTileGeoExtentOfBindedTextures_loc = gl.getUniformLocation(shader.program, "uTileGeoExtentOfBindedTextures");

	shader.uDebug_texCorrectionFactor_loc = gl.getUniformLocation(shader.program, "uDebug_texCorrectionFactor");
	
	shader.uActiveTextures_loc = gl.getUniformLocation(shader.program, "uActiveTextures");
	shader.externalAlphasArray_loc = gl.getUniformLocation(shader.program, "externalAlphasArray");

	var uniformLocation;
	var uniformDataPair;
	
	// reassign samplers2d locations.
	//uniformDataPair = shader.getUniformDataPair("shadowMapTex");
	//uniformDataPair.intValue = 0; // reassign.***
	
	//uniformDataPair = shader.getUniformDataPair("shadowMapTex2");
	//uniformDataPair.intValue = 1; // reassign.***
	
	uniformDataPair = shader.getUniformDataPair("diffuseTex");
	uniformDataPair.intValue = 2; // reassign.***
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_1");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_1");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 3;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_2");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_2");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 4;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_3");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_3");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 5;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_4");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_4");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 6;
	}
	
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex_5");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex_5");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 7;
	}

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_tinTerrainAltitudes = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	shaderName = "tinTerrainAltitudes";
	ssao_vs_source = ShaderSource.TinTerrainAltitudesVS;
	ssao_fs_source = ShaderSource.TinTerrainAltitudesFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);

	//shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	//shader.bExistAltitudes_loc = gl.getUniformLocation(shader.program, "bExistAltitudes");
	//shader.altitude_loc = gl.getAttribLocation(shader.program, "altitude");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_qMeshRenderTEST = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "qMeshRenderTEST";
	var vs_source = ShaderSource.waterQuantizedMeshVS_3D_TEST;
	var fs_source = ShaderSource.waterQuantizedMeshFS_3D_TEST;
	fs_source = fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	fs_source = fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, vs_source, fs_source, shaderName, this.magoManager);
	shader.u_screen_loc = gl.getUniformLocation(shader.program, "u_screen"); // smple2d.
	shader.u_opacity_loc = gl.getUniformLocation(shader.program, "u_opacity");
	shader.colorType_loc = gl.getUniformLocation(shader.program, "colorType");//
	shader.u_oneColor4_loc = gl.getUniformLocation(shader.program, "u_oneColor4");
	this.useProgram(shader);
	gl.uniform1i(shader.u_screen_loc, 0);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_pointsCloud = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "pointsCloud";
	var ssao_vs_source = ShaderSource.PointCloudVS;
	var ssao_fs_source = ShaderSource.PointCloudFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	shader.uStrokeColor_loc = gl.getUniformLocation(shader.program, "uStrokeColor");
	shader.uStrokeSize_loc = gl.getUniformLocation(shader.program, "uStrokeSize");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_testQuad = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "testQuad"; // used by temperatura layer.***
	var ssao_vs_source = ShaderSource.Test_QuadVS;
	var ssao_fs_source = ShaderSource.Test_QuadFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_pointsCloudSsao = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "pointsCloudSsao";
	var ssao_vs_source = ShaderSource.PointCloudVS;
	var ssao_fs_source = ShaderSource.PointCloudSsaoFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	this.useProgram(shader);
	gl.uniform1i(shader.normalTex_loc, 6);
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");

	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.uSelColor4_loc = gl.getUniformLocation(shader.program, "uSelColor4");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_pointsCloudSsao_rainbow = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "pointsCloudSsao_rainbow";
	var ssao_vs_source = ShaderSource.PointCloudVS_rainbow;
	var ssao_fs_source = ShaderSource.PointCloudSsaoFS_rainbow;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	// pointsCloud shader locals.***
	shader.bPositionCompressed_loc = gl.getUniformLocation(shader.program, "bPositionCompressed");
	shader.minPosition_loc = gl.getUniformLocation(shader.program, "minPosition");
	shader.bboxSize_loc = gl.getUniformLocation(shader.program, "bboxSize");
	shader.bUseColorCodingByHeight_loc = gl.getUniformLocation(shader.program, "bUseColorCodingByHeight");
	shader.minHeight_rainbow_loc = gl.getUniformLocation(shader.program, "minHeight_rainbow");
	shader.maxHeight_rainbow_loc = gl.getUniformLocation(shader.program, "maxHeight_rainbow");
	shader.maxPointSize_loc = gl.getUniformLocation(shader.program, "maxPointSize");
	shader.minPointSize_loc = gl.getUniformLocation(shader.program, "minPointSize");
	shader.pendentPointSize_loc = gl.getUniformLocation(shader.program, "pendentPointSize");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_atmosphere = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "atmosphere";
	var ssao_vs_source = ShaderSource.atmosphereVS;
	var ssao_fs_source = ShaderSource.atmosphereFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);

	shader.bIsMakingDepth_loc = gl.getUniformLocation(shader.program, "bIsMakingDepth");
	shader.equatorialRadius_loc = gl.getUniformLocation(shader.program, "equatorialRadius");
	// Note: for the atmosphere, change the modelViewProjectionRelToEyeMatrix.
	var uniformDataPair = shader.getUniformDataPair("mvpMat4RelToEye");
	uniformDataPair.matrix4fv = this.sceneState.modelViewProjRelToEyeMatrixSky._floatArrays;

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_imageViewerRectangle = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "imageViewerRectangle";
	var ssao_vs_source = ShaderSource.ImageViewerRectangleShaderVS;
	var ssao_fs_source = ShaderSource.ImageViewerRectangleShaderFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_orthogonalDepth = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "orthogonalDepth";
	var ssao_vs_source = ShaderSource.OrthogonalDepthShaderVS;
	var ssao_fs_source = ShaderSource.OrthogonalDepthShaderFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	// OrthogonalShader locations.***
	shader.modelViewProjectionMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.encodedCameraPositionMCHigh_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.encodedCameraPositionMCLow_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_thickLine = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "thickLine";
	var ssao_vs_source = ShaderSource.thickLineVS;
	var ssao_fs_source = ShaderSource.thickLineFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_windStreamThickLine = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "windStreamThickLine";
	var ssao_vs_source = ShaderSource.windStreamThickLineVS;
	var ssao_fs_source = ShaderSource.windStreamThickLineFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.uElemIndex_loc = gl.getUniformLocation(shader.program, "uElemIndex");
	shader.uTotalPointsCount_loc = gl.getUniformLocation(shader.program, "uTotalPointsCount");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	gl.bindAttribLocation(shader.program, 4, "index");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;
	shader.index_loc = 4;

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_thickLineExtruded = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "thickLineExtruded";
	var ssao_vs_source = ShaderSource.thickLineExtrudedVS;
	var ssao_fs_source = ShaderSource.thickLineFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.bUseMultiRenderTarget_loc = gl.getUniformLocation(shader.program, "bUseMultiRenderTarget");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_pin = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "pin";
	var ssao_vs_source = ShaderSource.PngImageVS;
	var ssao_fs_source = ShaderSource.PngImageFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.position4_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.scale2d_loc = gl.getUniformLocation(shader.program, "scale2d");
	shader.size2d_loc = gl.getUniformLocation(shader.program, "size2d");
	shader.imageSize_loc = gl.getUniformLocation(shader.program, "imageSize");
	shader.bUseOriginalImageSize_loc = gl.getUniformLocation(shader.program, "bUseOriginalImageSize");
	shader.aditionalOffset_loc = gl.getUniformLocation(shader.program, "aditionalOffset");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_texturesMerger = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "texturesMerger";
	var ssao_vs_source = ShaderSource.texturesMergerVS;
	var ssao_fs_source = ShaderSource.texturesMergerFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.position2_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.uActiveTextures_loc = gl.getUniformLocation(shader.program, "uActiveTextures");
	shader.externalAlphasArray_loc = gl.getUniformLocation(shader.program, "externalAlphasArray");
	shader.uExternalTexCoordsArray_loc = gl.getUniformLocation(shader.program, "uExternalTexCoordsArray");
	shader.uMinMaxAltitudes_loc = gl.getUniformLocation(shader.program, "uMinMaxAltitudes");
	shader.uMinMaxAltitudesBathymetryToGradient_loc = gl.getUniformLocation(shader.program, "uMinMaxAltitudesBathymetryToGradient");
	shader.uGradientSteps_loc = gl.getUniformLocation(shader.program, "uGradientSteps");
	shader.uGradientStepsCount_loc = gl.getUniformLocation(shader.program, "uGradientStepsCount");
	shader.tex_0_loc = gl.getUniformLocation(shader.program, "texture_0");
	shader.tex_1_loc = gl.getUniformLocation(shader.program, "texture_1");
	shader.tex_2_loc = gl.getUniformLocation(shader.program, "texture_2");
	shader.tex_3_loc = gl.getUniformLocation(shader.program, "texture_3");
	shader.tex_4_loc = gl.getUniformLocation(shader.program, "texture_4");
	shader.tex_5_loc = gl.getUniformLocation(shader.program, "texture_5");
	shader.tex_6_loc = gl.getUniformLocation(shader.program, "texture_6");
	shader.tex_7_loc = gl.getUniformLocation(shader.program, "texture_7");
	this.useProgram(shader);
	gl.uniform1i(shader.tex_0_loc, 0);
	gl.uniform1i(shader.tex_1_loc, 1);
	gl.uniform1i(shader.tex_2_loc, 2);
	gl.uniform1i(shader.tex_3_loc, 3);
	gl.uniform1i(shader.tex_4_loc, 4);
	gl.uniform1i(shader.tex_5_loc, 5);
	gl.uniform1i(shader.tex_6_loc, 6);
	gl.uniform1i(shader.tex_7_loc, 7);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_copyTexture = function() 
{
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "textureCopy";
	var ssao_vs_source = ShaderSource.textureCopyVS;
	var ssao_fs_source = ShaderSource.textureCopyFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.position2_loc = gl.getAttribLocation(shader.program, "position");
	shader.texToCopy_loc = gl.getUniformLocation(shader.program, "texToCopy");
	shader.u_textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipYAxis");
	shader.u_textureFlipXAxis_loc = gl.getUniformLocation(shader.program, "u_textureFlipXAxis");

	this.useProgram(shader);
	gl.uniform1i(shader.texToCopy_loc, 0);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_rectangleScreen = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "rectangleScreen";
	var ssao_vs_source = ShaderSource.rectangleScreenVS;
	var ssao_fs_source = ShaderSource.rectangleScreenFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.position2_loc = gl.getAttribLocation(shader.program, "a_pos");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "a_nor");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "a_tex");
	shader.tex_0_loc = gl.getUniformLocation(shader.program, "texture_0");
	shader.texture_cube_loc = gl.getUniformLocation(shader.program, "texture_cube");
	shader.uTextureType_loc = gl.getUniformLocation(shader.program, "uTextureType");
	this.useProgram(shader);
	gl.uniform1i(shader.tex_0_loc, 0);
	gl.uniform1i(shader.texture_cube_loc, 1);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_ssaoFromDepth = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "ssaoFromDepth";
	var ssao_vs_source = ShaderSource.ScreenQuadVS;
	var ssao_fs_source = ShaderSource.ssaoFromDepthFS;
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uNumFrustums_loc = gl.getUniformLocation(shader.program, "uNumFrustums");
	shader.uNearFarArray_loc = gl.getUniformLocation(shader.program, "uNearFarArray");
	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.normalTex_loc = gl.getUniformLocation(shader.program, "normalTex");
	this.useProgram(shader);
	gl.uniform1i(shader.depthTex_loc, 0);
	gl.uniform1i(shader.noiseTex_loc, 1);
	gl.uniform1i(shader.normalTex_loc, 3);

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_thickLineClampToTerrain = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "thickLineClampToTerrain";
	var ssao_vs_source = ShaderSource.vectorMeshClampToTerrainVS;
	var ssao_fs_source = ShaderSource.vectorMeshClampToTerrainFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	var shader = this.createShaderProgram(gl, ssao_vs_source, ssao_fs_source, shaderName, this.magoManager);
	// ThickLine shader locations.***
	shader.projectionMatrix_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.viewport_loc = gl.getUniformLocation(shader.program, "viewport");
	shader.thickness_loc = gl.getUniformLocation(shader.program, "thickness");
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	gl.bindAttribLocation(shader.program, 0, "prev");
	gl.bindAttribLocation(shader.program, 1, "current");
	gl.bindAttribLocation(shader.program, 2, "next");
	gl.bindAttribLocation(shader.program, 3, "color4");
	shader.prev_loc = 0;
	shader.current_loc = 1;
	shader.next_loc = 2;
	shader.color4_loc = 3;

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShader_groundStencilPrimitives = function() 
{
	var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();
	var gl = this.gl;

	var shaderName = "groundStencilPrimitives";
	var showDepth_vs_source = ShaderSource.GroundStencilPrimitivesVS;
	var showDepth_fs_source = ShaderSource.GroundStencilPrimitivesFS;
	showDepth_fs_source = showDepth_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	var shader = this.createShaderProgram(gl, showDepth_vs_source, showDepth_fs_source, shaderName, this.magoManager);
	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");

	this.shadersMap[shaderName] = shader;
	return shader;
};

PostFxShadersManager.prototype._createShaderByName = function (shaderName) 
{
	// Hard code.***
	switch (shaderName)
	{
	case "gBuffer":
		this._createShader_gBuffer();
		break;
	case  "gBufferORT":
		this._createShader_gBufferORT();
		break;
	case  "lBuffer":
		this._createShader_lBuffer();
		break;
	case  "screenQuad":
		this._createShader_screenQuad();
		break;
	case  "screenCopyQuad":
		this._createShader_screenCopyQuad();
		break;
	case  "screenQuad2":
		this._createShader_screenQuad2();
		break;
	case  "modelRefSsao":
		// This shader is used to render transparent objects, 
		//bcos gBuffer-shader cannot render transparents.***
		this._createShader_modelRefSsao();
		break;
	case  "modelRefDepth":
		// This shader is used to render depth of selected objects to render silhouette.***
		this._createShader_modelRefDepth();
		break;
	case  "tinTerrain":
		this._createShader_tinTerrain();
		break;
	case  "tinTerrainAltitudes":
		this._createShader_tinTerrainAltitudes();
		break;
	case  "pointsCloud":
		this._createShader_pointsCloud();
		break;
	case  "testQuad":
		this._createShader_testQuad();
		break;
	case  "pointsCloudSsao":
		this._createShader_pointsCloudSsao();
		break;
	case  "pointsCloudSsao_rainbow":
		this._createShader_pointsCloudSsao_rainbow();
		break;
	case  "atmosphere":
		this._createShader_atmosphere();
		break;
	case  "imageViewerRectangle":
		this._createShader_imageViewerRectangle();
		break;
	case  "orthogonalDepth":
		this._createShader_orthogonalDepth();
		break;
	case  "thickLine":
		this._createShader_thickLine();
		break;
	case  "windStreamThickLine":
		this._createShader_windStreamThickLine();
		break;
	case  "thickLineExtruded":
		this._createShader_thickLineExtruded();
		break;
	case  "pin":
		this._createShader_pin();
		break;
	case  "texturesMerger":
		this._createShader_texturesMerger();
		break;
	case  "rectangleScreen":
		this._createShader_rectangleScreen();
		break;
	case  "ssaoFromDepth":
		this._createShader_ssaoFromDepth();
		break;
	case  "thickLineClampToTerrain":
		this._createShader_thickLineClampToTerrain();
		break;
	case  "groundStencilPrimitives":
		this._createShader_groundStencilPrimitives();
		break;
	case "textureCopy":
		this._createShader_copyTexture();
		break;
	case "gaussianBlur":
		this._createShader_gaussianBlur();
		break;
	case "screenQuadBlur":
		this._createShader_screenQuadBlur();
		break;
	case "qMeshRenderTEST":
		this._createShader_qMeshRenderTEST();
		break;
		
	}
	
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param source 변수
 * @param type 변수
 * @param typeString 변수
 * @returns shader
 */
PostFxShadersManager.prototype.getShader = function(shaderName) 
{
	if (!this.shadersMap[shaderName])
	{
		// This class, only create pre defined shaders.
		this._createShaderByName(shaderName);
	}
	return this.shadersMap[shaderName];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param source 변수
 * @param type 변수
 * @param typeString 변수
 * @returns shader
 */
PostFxShadersManager.prototype.createShaderProgram = function(gl, vertexSource, fragmentSource, shaderName, magoManager) 
{
	var shader = this.newShader(shaderName);
	shader.program = gl.createProgram();
	shader.shader_vertex = this.createShader(gl, vertexSource, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.createShader(gl, fragmentSource, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	shader.bindAttribLocations(gl, shader); // Do this before linkProgram.
	gl.linkProgram(shader.program);
			
	shader.createUniformGenerals(gl, shader, magoManager.sceneState);
	shader.createUniformLocals(gl, shader, magoManager.sceneState);
	
	
	// keep shader locations. NO USED YET.***
	if (!shader.attribLocations)
	{
		shader.attribLocations = {};
	}
	var numAttributes = gl.getProgramParameter(shader.program, gl.ACTIVE_ATTRIBUTES);
	for (var i = 0; i < numAttributes; i++) 
	{
		var attribute = gl.getActiveAttrib(shader.program, i);
		shader.attribLocations[attribute.name] = gl.getAttribLocation(shader.program, attribute.name);
	}

	if (!shader.uniformsLocations)
	{
		shader.uniformsLocations = {};
	}
	var numUniforms = gl.getProgramParameter(shader.program, gl.ACTIVE_UNIFORMS);
	for (var i = 0; i < numUniforms; i++) 
	{
		var uniform = gl.getActiveUniform(shader.program, i);
		shader.uniformsLocations[uniform.name] = gl.getUniformLocation(shader.program, uniform.name);
	}

	return shader;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 * @param source 변수
 * @param type 변수
 * @param typeString 변수
 * @returns shader
 */
PostFxShadersManager.prototype.createShader = function(gl, source, type, typeString) 
{
	// Source from internet.
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
	{
		alert("ERROR IN "+typeString+ " SHADER : " + gl.getShaderInfoLog(shader));
		return false;
	}
	return shader;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createDefaultShaders = function(gl, sceneState) 
{
	this.modelRefSilhouetteShader = this.createSilhouetteShaderModelRef(gl); // 14.
	this.dustParticleShader = this.createDustParticlesShader(gl);
	this.dustTextureModeShader = this.createDustTextureModeShader(gl);
};

/**
 * 어떤 일을 하고 있습니까?
 */
PostFxShadersManager.prototype.getModelRefSilhouetteShader = function() 
{
	return this.modelRefSilhouetteShader;
};

/**
 * 어떤 일을 하고 있습니까?
 */
PostFxShadersManager.prototype.getTriPolyhedronDepthShader = function() 
{
	return this.triPolyhedronDepthShader;
};

/**
 * 어떤 일을 하고 있습니까?
 */
PostFxShadersManager.prototype.getUnitaryBBoxShader = function(magoManager) 
{
	if (!this.triPolyhedronShader)
	{
		this.triPolyhedronShader = this.createSsaoShaderBox(magoManager); 
	}
	return this.triPolyhedronShader;
};

/**
 * 어떤 일을 하고 있습니까?
 */
PostFxShadersManager.prototype.getInvertedBoxShader = function() 
{
	return this.invertedBoxShader;
};

// 14) Silhouette shader.
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createSilhouetteShaderModelRef = function(gl) 
{
	// 14.
	var shader = new PostFxShader(this.gl);
	shader.name = "SilhouetteShaderModelRef";
	this.pFx_shaders_array.push(undefined);

	var ssao_vs_source = ShaderSource.SilhouetteVS;
	var ssao_fs_source = ShaderSource.SilhouetteFS;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	shader.bindAttribLocations(gl, shader); // Do this before linkProgram.
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.refMatrix_loc = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.refMatrixType_loc = gl.getUniformLocation(shader.program, "refMatrixType");
	shader.refTranslationVec_loc = gl.getUniformLocation(shader.program, "refTranslationVec");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj.position = gl.getAttribLocation(shader.program, "position");

	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");
	shader.camSpacePixelTranslation_loc = gl.getUniformLocation(shader.program, "camSpacePixelTranslation");
	shader.screenSize_loc = gl.getUniformLocation(shader.program, "screenSize");
	shader.ProjectionMatrix_loc = gl.getUniformLocation(shader.program, "ProjectionMatrix");
	shader.ModelViewMatrixRelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewMatrixRelToEye");
	
	return shader;
};

// box Shader.
/**
 * 어떤 일을 하고 있습니까?
 * @param magoManager 변수
 */
PostFxShadersManager.prototype.createDustParticlesShader = function (gl) 
{
	//var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	//this.bUseMultiRenderTarget = true;
	//use_multi_render_target = "USE_MULTI_RENDER_TARGET";

	//var use_linearOrLogarithmicDepth = this._get_useLinearOrLogarithmicDepth_string();
	var use_multi_render_target = this._get_useMultiRenderTarget_string();

	var supportEXT = gl.getSupportedExtensions().indexOf("WEBGL_draw_buffers");
	if (supportEXT > -1)
	{
		var extbuffers = gl.getExtension("WEBGL_draw_buffers");
		this.bUseMultiRenderTarget = true;
		use_multi_render_target = "USE_MULTI_RENDER_TARGET";
	}

	var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";

	var shader = new PostFxShader(this.gl);
	shader.shaderManager = this;
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.dustParticleVS;
	var ssao_fs_source = ShaderSource.dustParticleFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);

	shader.program = gl.createProgram();
	shader.shader_vertex = this.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	shader.bindAttribLocations(gl, shader); // Do this before linkProgram.
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.uNear_loc = gl.getUniformLocation(shader.program, "near");
	shader.uFar_loc = gl.getUniformLocation(shader.program, "far");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	//shader.refMatrix_loc = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.bUse1Color_loc = gl.getUniformLocation(shader.program, "bUse1Color");
	shader.oneColor4_loc = gl.getUniformLocation(shader.program, "oneColor4");
	shader.bUseNormal_loc = gl.getUniformLocation(shader.program, "bUseNormal");
	shader.bScale_loc = gl.getUniformLocation(shader.program, "bScale");
	shader.scale_loc = gl.getUniformLocation(shader.program, "scale");
	shader.uDustConcentration_loc = gl.getUniformLocation(shader.program, "uDustConcentration");
	shader.uDustConcentMinMax_loc = gl.getUniformLocation(shader.program, "uDustConcentMinMax");

	
	gl.bindAttribLocation(shader.program, 0, "position");
	gl.bindAttribLocation(shader.program, 1, "normal");
	gl.bindAttribLocation(shader.program, 2, "texCoord");
	gl.bindAttribLocation(shader.program, 3, "color4");
	
	
	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	//shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	
	
	shader.attribLocationCacheObj.position = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj.normal = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj.color4 = gl.getAttribLocation(shader.program, "color4");

	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");

	shader.smokeTex_loc = gl.getUniformLocation(shader.program, "smokeTex");
	this.useProgram(shader);
	gl.uniform1i(shader.smokeTex_loc, 0);

	return shader;
};

// box Shader.
/**
 * 어떤 일을 하고 있습니까?
 * @param magoManager 변수
 */
PostFxShadersManager.prototype.createDustTextureModeShader = function (gl) 
{
	//var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	//this.bUseMultiRenderTarget = true;
	//use_multi_render_target = "USE_MULTI_RENDER_TARGET";

	var use_multi_render_target = this._get_useMultiRenderTarget_string();

	var supportEXT = gl.getSupportedExtensions().indexOf("WEBGL_draw_buffers");
	if (supportEXT > -1)
	{
		var extbuffers = gl.getExtension("WEBGL_draw_buffers");
		this.bUseMultiRenderTarget = true;
		use_multi_render_target = "USE_MULTI_RENDER_TARGET";
	}

	var use_linearOrLogarithmicDepth = "USE_LINEAR_DEPTH";

	var shader = new PostFxShader(this.gl);
	shader.shaderManager = this;
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.dustTextureModeVS;
	var ssao_fs_source = ShaderSource.dustTextureModeFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_LOGARITHMIC_DEPTH%/g, use_linearOrLogarithmicDepth);
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);

	shader.program = gl.createProgram();
	shader.shader_vertex = this.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	shader.bindAttribLocations(gl, shader); // Do this before linkProgram.
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.uNear_loc = gl.getUniformLocation(shader.program, "near");
	shader.uFar_loc = gl.getUniformLocation(shader.program, "far");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	//shader.refMatrix_loc = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.bUse1Color_loc = gl.getUniformLocation(shader.program, "bUse1Color");
	shader.oneColor4_loc = gl.getUniformLocation(shader.program, "oneColor4");
	shader.bUseNormal_loc = gl.getUniformLocation(shader.program, "bUseNormal");
	shader.bScale_loc = gl.getUniformLocation(shader.program, "bScale");
	shader.scale_loc = gl.getUniformLocation(shader.program, "scale");
	shader.uDustConcentration_loc = gl.getUniformLocation(shader.program, "uDustConcentration");
	shader.uDustConcentMinMax_up_loc = gl.getUniformLocation(shader.program, "uDustConcentMinMax_up");
	shader.uDustConcentMinMax_down_loc = gl.getUniformLocation(shader.program, "uDustConcentMinMax_down");

	
	gl.bindAttribLocation(shader.program, 0, "position");
	gl.bindAttribLocation(shader.program, 1, "normal");
	gl.bindAttribLocation(shader.program, 2, "texCoord");
	gl.bindAttribLocation(shader.program, 3, "color4");
	
	
	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	
	
	shader.attribLocationCacheObj.position = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj.normal = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj.color4 = gl.getAttribLocation(shader.program, "color4");

	shader.bUseLogarithmicDepth_loc = gl.getUniformLocation(shader.program, "bUseLogarithmicDepth");
	shader.uFCoef_logDepth_loc = gl.getUniformLocation(shader.program, "uFCoef_logDepth");
	shader.uFrustumIdx_loc = gl.getUniformLocation(shader.program, "uFrustumIdx");
	shader.u_tex_res_loc = gl.getUniformLocation(shader.program, "u_tex_res");
	shader.uZFactor_loc = gl.getUniformLocation(shader.program, "uZFactor");

	shader.texUp_loc = gl.getUniformLocation(shader.program, "texUp");
	shader.texDown_loc = gl.getUniformLocation(shader.program, "texDown");
	this.useProgram(shader);
	gl.uniform1i(shader.texDown_loc, 0);
	gl.uniform1i(shader.texUp_loc, 1);

	return shader;
};

// box Shader.
/**
 * 어떤 일을 하고 있습니까?
 * @param magoManager 변수
 */
PostFxShadersManager.prototype.createSsaoShaderBox = function(magoManager) 
{
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	magoManager.postFxShadersManager.bUseMultiRenderTarget = true;
	use_multi_render_target = "USE_MULTI_RENDER_TARGET";

	var gl = magoManager.getGl();
	var shader = new PostFxShader(this.gl);
	shader.shaderManager = this;
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.BoxSsaoVS;
	var ssao_fs_source = ShaderSource.BoxSsaoFS;
	ssao_fs_source = ssao_fs_source.replace(/%USE_MULTI_RENDER_TARGET%/g, use_multi_render_target);

	shader.program = gl.createProgram();
	shader.shader_vertex = this.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	shader.bindAttribLocations(gl, shader); // Do this before linkProgram.
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	//shader.refMatrix_loc = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.bUse1Color_loc = gl.getUniformLocation(shader.program, "bUse1Color");
	shader.oneColor4_loc = gl.getUniformLocation(shader.program, "oneColor4");
	shader.bUseNormal_loc = gl.getUniformLocation(shader.program, "bUseNormal");
	shader.bScale_loc = gl.getUniformLocation(shader.program, "bScale");
	shader.scale_loc = gl.getUniformLocation(shader.program, "scale");


	
	gl.bindAttribLocation(shader.program, 0, "position");
	gl.bindAttribLocation(shader.program, 1, "normal");
	gl.bindAttribLocation(shader.program, 2, "texCoord");
	gl.bindAttribLocation(shader.program, 3, "color4");
	
	
	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	//shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	
	
	shader.attribLocationCacheObj.position = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj.normal = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj.color4 = gl.getAttribLocation(shader.program, "color4");

	//
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	return shader;
};

// InvertedBox.
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createInvertedBoxShader = function(gl) 
{
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(undefined); // old.

	var ssao_vs_source = ShaderSource.InvertedBoxVS;
	var ssao_fs_source = ShaderSource.InvertedBoxFS;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.createShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.createShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	shader.bindAttribLocations(gl, shader); // Do this before linkProgram.
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh"); // sceneState.
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow"); // sceneState.
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye"); // sceneState.
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye"); // sceneState.
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4"); // sceneState.
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix"); // sceneState.
	shader.refMatrix_loc = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.refMatrixType_loc = gl.getUniformLocation(shader.program, "refMatrixType");
	shader.refTranslationVec_loc = gl.getUniformLocation(shader.program, "refTranslationVec");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	
	shader.attribLocationCacheObj.position = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj.texCoord = gl.getAttribLocation(shader.program, "texCoord");
	shader.attribLocationCacheObj.normal = gl.getAttribLocation(shader.program, "normal");
	//
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	// ssao uniforms.*
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");

	// uniform values.
	shader.near_loc = gl.getUniformLocation(shader.program, "near"); // sceneState.
	shader.far_loc = gl.getUniformLocation(shader.program, "far"); // sceneState.
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov"); // sceneState.
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio"); // sceneState.

	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth"); // sceneState.
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight"); // sceneState.
	
	shader.shininessValue_loc = gl.getUniformLocation(shader.program, "shininessValue");

	shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");
	shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");
	shader.textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "textureFlipYAxis");

	// uniform samplers.
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex"); 
	
	// lighting.
	shader.specularColor_loc = gl.getUniformLocation(shader.program, "specularColor");
	shader.ssaoRadius_loc = gl.getUniformLocation(shader.program, "radius");  

	shader.ambientReflectionCoef_loc = gl.getUniformLocation(shader.program, "ambientReflectionCoef");
	shader.diffuseReflectionCoef_loc = gl.getUniformLocation(shader.program, "diffuseReflectionCoef");
	shader.specularReflectionCoef_loc = gl.getUniformLocation(shader.program, "specularReflectionCoef");
	
	return shader;
};