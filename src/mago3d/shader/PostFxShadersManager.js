'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class PostFxShadersManager
 */
var PostFxShadersManager = function(options) 
{
	if (!(this instanceof PostFxShadersManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
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
	
	
	// keep shader locations.
	var numAttributes = gl.getProgramParameter(shader.program, gl.ACTIVE_ATTRIBUTES);
	for (var i = 0; i < numAttributes; i++) 
	{
		var attribute = gl.getActiveAttrib(shader.program, i);
		shader[attribute.name] = gl.getAttribLocation(shader.program, attribute.name);
	}
	var numUniforms = gl.getProgramParameter(shader.program, gl.ACTIVE_UNIFORMS);
	for (var i = 0; i < numUniforms; i++) 
	{
		var uniform = gl.getActiveUniform(shader.program, i);
		shader[uniform.name] = gl.getUniformLocation(shader.program, uniform.name);
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
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	this.bUseMultiRenderTarget = true;
	use_multi_render_target = "USE_MULTI_RENDER_TARGET";

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
	var use_multi_render_target = "NO_USE_MULTI_RENDER_TARGET";
	this.bUseMultiRenderTarget = true;
	use_multi_render_target = "USE_MULTI_RENDER_TARGET";

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