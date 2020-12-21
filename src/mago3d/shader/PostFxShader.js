'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @class PostFxShader
 * @param gl 변수
 */
var PostFxShader = function(gl) 
{
	if (!(this instanceof PostFxShader)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name;
	this.attribLocationCacheObj = {}; // old.
	this.uniformsArrayGeneral = []; // this array has the same uniforms that "uniformsCacheObj".
	this.uniformsMapGeneral = {}; // this object has the same uniforms that "uniformsArray".
	
	this.uniformsArrayLocal = []; // this array has the same uniforms that "uniformsCacheObj".
	this.uniformsMapLocal = {}; // this object has the same uniforms that "uniformsArray".
	
	// No general objects.
	this.camera;
	
	// shader program.
	this.program;
	this.shader_vertex;
	this.shader_fragment;
	
	// current buffers binded.
	this.last_tex_id;
	this.last_isAditionalMovedZero = false;
	
	this.lastVboKeyBindedMap = {};
	
	
	// attribLocations state management.
	this.attribLocationStateArray = [];
	
	this.shaderManager; 
};

PostFxShader.prototype.getName = function() 
{
	return this.name;
};

PostFxShader.createShader = function(gl, type, source) 
{
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);

	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) 
	{
		throw new Error(gl.getShaderInfoLog(shader));
	}

	return shader;
};

PostFxShader.createProgram = function(gl, vertexSource, fragmentSource) 
{
	// static function.***
	var program = gl.createProgram();

	var vertexShader = PostFxShader.createShader(gl, gl.VERTEX_SHADER, vertexSource);
	var fragmentShader = PostFxShader.createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
	{
		throw new Error(gl.getProgramInfoLog(program));
	}

	var wrapper = {program: program};

	var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for (var i = 0; i < numAttributes; i++) 
	{
		var attribute = gl.getActiveAttrib(program, i);
		wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
	}
	var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	for (var i = 0; i < numUniforms; i++) 
	{
		var uniform = gl.getActiveUniform(program, i);
		wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
	}

	return wrapper;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.resetLastBuffersBinded = function()
{
	this.last_tex_id = undefined; // todo: must distinguish by channel.
	this.last_isAditionalMovedZero = false;
	
	this.lastVboKeyBindedMap = {};
	
	this.disableVertexAttribArrayAll();
	
	if (this.attribLocationStateArray)
	{
		var attribLocsCount = this.attribLocationStateArray.length;
		for (var i=0; i<attribLocsCount; i++)
		{
			var attribLocationState = this.attribLocationStateArray[i];
			if (attribLocationState !== undefined)
			{
				attribLocationState.attribLocationEnabled = undefined;
				this.attribLocationStateArray[i] = undefined;
			}
		}
		this.attribLocationStateArray.length = 0;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.enableVertexAttribArray = function(attribLocation)
{
	if (attribLocation === undefined || attribLocation < 0)
	{ return false; }
	
	var attribLocationState = this.attribLocationStateArray[attribLocation];
	if (attribLocationState === undefined)
	{
		attribLocationState = new AttribLocationState();
		this.attribLocationStateArray[attribLocation] = attribLocationState;
		attribLocationState.attribLocationEnabled = false;
	}

	if (!attribLocationState.attribLocationEnabled)
	{
		this.gl.enableVertexAttribArray(attribLocation);
		attribLocationState.attribLocationEnabled = true;
	}
	
	return true;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.disableTextureImagesUnitsAll = function()
{
	var gl = this.gl;
	var textureImagesUnitsCount = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	for (var i = 0; i<textureImagesUnitsCount; i++)
	{ 
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.disableVertexAttribArrayAll = function()
{
	var gl = this.gl;
	var vertexAttribsCount = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
	for (var i = 0; i<vertexAttribsCount; i++)
	{ gl.disableVertexAttribArray(i); }
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.disableVertexAttribArray = function(attribLocation)
{
	if (attribLocation === undefined || attribLocation < 0)
	{ return; }
	
	var attribLocationState = this.attribLocationStateArray[attribLocation];
	if (attribLocationState === undefined)
	{
		attribLocationState = new AttribLocationState();
		this.attribLocationStateArray[attribLocation] = attribLocationState;
		attribLocationState.attribLocationEnabled = true;
	}

	if (attribLocationState.attribLocationEnabled)
	{
		this.gl.disableVertexAttribArray(attribLocation);
		attribLocationState.attribLocationEnabled = false;
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.useProgram = function()
{
	var gl = this.gl;
	var currProgram = gl.getParameter(gl.CURRENT_PROGRAM);
	if (currProgram !== this.program)
	{
		gl.useProgram(this.program);
		this.shaderManager.currentShaderUsing = this;
	}
	this.resetLastBuffersBinded();
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.bindUniformGenerals = function()
{
	if (this.uniformsArrayGeneral === undefined)
	{ return; }
	
	var uniformsDataPairsCount = this.uniformsArrayGeneral.length;
	for (var i=0; i<uniformsDataPairsCount; i++)
	{
		this.uniformsArrayGeneral[i].bindUniform();
	}
	
	// Bind camera uniforms.
	if (this.camera)
	{ this.camera.bindUniforms(this.gl, this); }
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.getUniformDataPair = function(uniformName)
{
	return this.uniformsMapGeneral[uniformName];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.newUniformDataPair = function(uniformType, uniformName)
{
	var uniformDataPair;//
	if (uniformType === "Matrix4fv")
	{
		uniformDataPair = new UniformMatrix4fvDataPair(this.gl, uniformName);
		this.uniformsArrayGeneral.push(uniformDataPair);
		this.uniformsMapGeneral[uniformName] = uniformDataPair;
	}
	else if (uniformType === "Vec4fv")
	{
		uniformDataPair = new UniformVec4fvDataPair(this.gl, uniformName);
		this.uniformsArrayGeneral.push(uniformDataPair);
		this.uniformsMapGeneral[uniformName] = uniformDataPair;
	}
	else if (uniformType === "Vec3fv")
	{
		uniformDataPair = new UniformVec3fvDataPair(this.gl, uniformName);
		this.uniformsArrayGeneral.push(uniformDataPair);
		this.uniformsMapGeneral[uniformName] = uniformDataPair;
	}
	else if (uniformType === "Vec2fv")
	{
		uniformDataPair = new UniformVec2fvDataPair(this.gl, uniformName);
		this.uniformsArrayGeneral.push(uniformDataPair);
		this.uniformsMapGeneral[uniformName] = uniformDataPair;
	}
	else if (uniformType === "1f")
	{
		uniformDataPair = new Uniform1fDataPair(this.gl, uniformName);
		this.uniformsArrayGeneral.push(uniformDataPair);
		this.uniformsMapGeneral[uniformName] = uniformDataPair;
	}
	else if (uniformType === "1i")
	{
		uniformDataPair = new Uniform1iDataPair(this.gl, uniformName);
		this.uniformsArrayGeneral.push(uniformDataPair);
		this.uniformsMapGeneral[uniformName] = uniformDataPair;
	}
	
	return uniformDataPair;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.newUniformDataPairLocal = function(uniformType, uniformName)
{
	var uniformDataPair;//
	if (uniformType === "Matrix4fv")
	{
		uniformDataPair = new UniformMatrix4fvDataPair(this.gl, uniformName);
		this.uniformsArrayLocal.push(uniformDataPair);
		this.uniformsMapLocal[uniformName] = uniformDataPair;
	}
	else if (uniformType === "Vec4fv")
	{
		uniformDataPair = new UniformVec4fvDataPair(this.gl, uniformName);
		this.uniformsArrayLocal.push(uniformDataPair);
		this.uniformsMapLocal[uniformName] = uniformDataPair;
	}
	else if (uniformType === "Vec3fv")
	{
		uniformDataPair = new UniformVec3fvDataPair(this.gl, uniformName);
		this.uniformsArrayLocal.push(uniformDataPair);
		this.uniformsMapLocal[uniformName] = uniformDataPair;
	}
	else if (uniformType === "Vec2fv")
	{
		uniformDataPair = new UniformVec2fvDataPair(this.gl, uniformName);
		this.uniformsArrayLocal.push(uniformDataPair);
		this.uniformsMapLocal[uniformName] = uniformDataPair;
	}
	else if (uniformType === "1f")
	{
		uniformDataPair = new Uniform1fDataPair(this.gl, uniformName);
		this.uniformsArrayLocal.push(uniformDataPair);
		this.uniformsMapLocal[uniformName] = uniformDataPair;
	}
	else if (uniformType === "1i")
	{
		uniformDataPair = new Uniform1iDataPair(this.gl, uniformName);
		this.uniformsArrayLocal.push(uniformDataPair);
		this.uniformsMapLocal[uniformName] = uniformDataPair;
	}
	
	return uniformDataPair;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 */
PostFxShader.prototype.createUniformGenerals = function(gl, shader, sceneState)
{
	// Here create all generals uniforms, if exist, of the shader.
	var uniformDataPair;
	var uniformLocation;

	// 1. ModelViewProjectionMatrixRelToEye.              
	uniformLocation = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Matrix4fv", "mvpMat4RelToEye");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.matrix4fv = sceneState.modelViewProjRelToEyeMatrix._floatArrays;
	}
	
	// 1. ModelViewProjectionMatrix.
	uniformLocation = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrix");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Matrix4fv", "mvpMat4");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.matrix4fv = sceneState.modelViewProjMatrix._floatArrays;
	}
	
	// 2. modelViewMatrixRelToEye.
	uniformLocation = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Matrix4fv", "mvMat4RelToEye");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.matrix4fv = sceneState.modelViewRelToEyeMatrix._floatArrays;
	}
	
	// 3. modelViewMatrix.
	uniformLocation = gl.getUniformLocation(shader.program, "modelViewMatrix");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Matrix4fv", "modelViewMatrix");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.matrix4fv = sceneState.modelViewMatrix._floatArrays;
	}
	
	// 3.1. modelViewMatrixInv.
	uniformLocation = gl.getUniformLocation(shader.program, "modelViewMatrixInv");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Matrix4fv", "modelViewMatrixInv");
		uniformDataPair.uniformLocation = uniformLocation;
		var mvMatInv = sceneState.getModelViewMatrixInv();
		uniformDataPair.matrix4fv = mvMatInv._floatArrays;
	}
	
	// 4. projectionMatrix.
	uniformLocation = gl.getUniformLocation(shader.program, "projectionMatrix");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Matrix4fv", "pMat4");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.matrix4fv = sceneState.projectionMatrix._floatArrays;
	}
	
	// 5. normalMatrix4.
	uniformLocation = gl.getUniformLocation(shader.program, "normalMatrix4");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Matrix4fv", "normalMat4");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.matrix4fv = sceneState.normalMatrix4._floatArrays;
	}
	
	// 6. encodedCameraPositionMCHigh.
	uniformLocation = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Vec3fv", "encodedCamPosHigh");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.vec3fv = sceneState.encodedCamPosHigh;
	}
	
	// 7. encodedCameraPositionMCLow.
	uniformLocation = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Vec3fv", "encodedCamPosLow");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.vec3fv = sceneState.encodedCamPosLow;
	}
	
	// 10. fovy.
	uniformLocation = gl.getUniformLocation(shader.program, "fov");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "fovyRad");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.camera.frustum.fovyRad;
	}
	
	// 10.1 tangentOfHalfFovy.
	uniformLocation = gl.getUniformLocation(shader.program, "tangentOfHalfFovy");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "tangentOfHalfFovy");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.camera.frustum.tangentOfHalfFovy;
	}
	
	// 11. aspectRatio.
	uniformLocation = gl.getUniformLocation(shader.program, "aspectRatio");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "aspectRatio");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.camera.frustum.aspectRatio;
	}
	
	// 12. drawBuffWidht.
	uniformLocation = gl.getUniformLocation(shader.program, "screenWidth");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "drawBuffWidht");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.drawingBufferWidth;
	}
	
	// 13. drawBuffHeight.
	uniformLocation = gl.getUniformLocation(shader.program, "screenHeight");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "drawBuffHeight");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.drawingBufferHeight;
	}
	
	// 14. depthTex.
	uniformLocation = gl.getUniformLocation(shader.program, "depthTex");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "depthTex");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 0;
	}
	
	// 15. noiseTex.
	uniformLocation = gl.getUniformLocation(shader.program, "noiseTex");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "noiseTex");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 1;
	}
	
	// 16. diffuseTex.
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseTex");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "diffuseTex");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 2;
	}
	
	// 16.1 shadowMapTex.
	uniformLocation = gl.getUniformLocation(shader.program, "shadowMapTex");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "shadowMapTex");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 3;
	}
	
	// 16.2 shadowMapTex2.
	uniformLocation = gl.getUniformLocation(shader.program, "shadowMapTex2");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "shadowMapTex2");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 4;
	}

	// 16.3 ssaoFromDepthTex.
	uniformLocation = gl.getUniformLocation(shader.program, "ssaoFromDepthTex");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1i", "ssaoFromDepthTex");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.intValue = 5;
	}
	
	// 17. specularColor.
	uniformLocation = gl.getUniformLocation(shader.program, "specularColor");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Vec3fv", "specularColor");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.vec3fv = sceneState.specularColor;
	}
	
	// 17. ambientColor.
	uniformLocation = gl.getUniformLocation(shader.program, "ambientColor");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Vec3fv", "ambientColor");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.vec3fv = sceneState.ambientColor;
	}
	
	// 18. ssaoRadius.
	uniformLocation = gl.getUniformLocation(shader.program, "radius");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "radius");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.ssaoRadius;
	}
	
	// 19. ambientReflectionCoef.
	uniformLocation = gl.getUniformLocation(shader.program, "ambientReflectionCoef");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "ambientReflectionCoef");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.ambientReflectionCoef;
	}
	
	// 20. diffuseReflectionCoef.
	uniformLocation = gl.getUniformLocation(shader.program, "diffuseReflectionCoef");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "diffuseReflectionCoef");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.diffuseReflectionCoef;
	}
	
	// 21. specularReflectionCoef.
	uniformLocation = gl.getUniformLocation(shader.program, "specularReflectionCoef");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "specularReflectionCoef");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.specularReflectionCoef;
	}
	
	// 22. shininessValue.
	uniformLocation = gl.getUniformLocation(shader.program, "shininessValue");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("1f", "shininessValue");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.floatValue = sceneState.shininessValue;
	}
	
	// 23. ssaoNoiseScale2.
	uniformLocation = gl.getUniformLocation(shader.program, "noiseScale");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Vec2fv", "ssaoNoiseScale2");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.vec2fv = sceneState.ssaoNoiseScale2;
	}
	
	// 24. ssaoKernel16.
	uniformLocation = gl.getUniformLocation(shader.program, "kernel");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Vec3fv", "ssaoKernel16");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.vec3fv = sceneState.ssaoKernel16;
	}
	
	// Set the camera.
	this.camera = sceneState.camera;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 */
PostFxShader.prototype.bindAttribLocations = function(gl, shader)
{
	gl.bindAttribLocation(shader.program, 0, "position");
	gl.bindAttribLocation(shader.program, 1, "normal");
	gl.bindAttribLocation(shader.program, 2, "texCoord");
	gl.bindAttribLocation(shader.program, 3, "color4");
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 */
PostFxShader.prototype.createUniformLocals = function(gl, shader, sceneState)
{
	// Here create all local uniforms, if exist, of the shader.
	var uniformDataPair;
	var uniformLocation;
	
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	shader.sunMatrix_loc = gl.getUniformLocation(shader.program, "sunMatrix");
	
	shader.refMatrixType_loc = gl.getUniformLocation(shader.program, "refMatrixType");
	shader.refMatrix_loc = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.refTranslationVec_loc = gl.getUniformLocation(shader.program, "refTranslationVec");
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");
	
	shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");
	shader.textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "textureFlipYAxis");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");
	//shader.kernel32_loc = gl.getUniformLocation(shader.program, "kernel32");
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	
	shader.sunPosHigh_loc = gl.getUniformLocation(shader.program, "sunPosHIGH");
	shader.sunPosLow_loc = gl.getUniformLocation(shader.program, "sunPosLOW");
	
	shader.shadowMapWidth_loc = gl.getUniformLocation(shader.program, "shadowMapWidth");
	shader.shadowMapHeight_loc = gl.getUniformLocation(shader.program, "shadowMapHeight");
	
	shader.sunDirWC_loc = gl.getUniformLocation(shader.program, "sunDirWC");
	shader.sunIdx_loc = gl.getUniformLocation(shader.program, "sunIdx");
	
	// Attributtes.*
	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	
	
	shader.bUse1Color_loc = gl.getUniformLocation(shader.program, "bUse1Color");
	shader.oneColor4_loc = gl.getUniformLocation(shader.program, "oneColor4");
	shader.bApplySsao_loc = gl.getUniformLocation(shader.program, "bApplySsao");
	shader.bApplyMagoShadow_loc = gl.getUniformLocation(shader.program, "bApplyMagoShadow");
	shader.bApplyShadow_loc = gl.getUniformLocation(shader.program, "bApplyShadow");
	shader.bSilhouette_loc = gl.getUniformLocation(shader.program, "bSilhouette");
	shader.bFxaa_loc = gl.getUniformLocation(shader.program, "bFxaa");
	
	// clippingPlanes.
	shader.bApplyClippingPlanes_loc = gl.getUniformLocation(shader.program, "bApplyClippingPlanes");
	shader.clippingPlanesCount_loc = gl.getUniformLocation(shader.program, "clippingPlanesCount");
	shader.clippingPlanes_loc = gl.getUniformLocation(shader.program, "clippingPlanes");
	
	// compression data, for shaders with data compressed.
	// compressionMaxPoint & compressionMinPoint: for refObjects, this is the octree's size.
	shader.posDataByteSize_loc = gl.getUniformLocation(shader.program, "posDataByteSize");
	shader.texCoordByteSize_loc = gl.getUniformLocation(shader.program, "texCoordByteSize");
	shader.compressionMaxPoint_loc = gl.getUniformLocation(shader.program, "compressionMaxPoint");
	shader.compressionMinPoint_loc = gl.getUniformLocation(shader.program, "compressionMinPoint");
	
	shader.bApplySpecularLighting_loc = gl.getUniformLocation(shader.program, "bApplySpecularLighting");
	shader.colorType_loc = gl.getUniformLocation(shader.program, "colorType");
	shader.externalAlpha_loc = gl.getUniformLocation(shader.program, "externalAlpha");
	
	//uniform float fixPointSize;
	//uniform bool bUseFixPointSize;
	shader.fixPointSize_loc = gl.getUniformLocation(shader.program, "fixPointSize");
	shader.bUseFixPointSize_loc = gl.getUniformLocation(shader.program, "bUseFixPointSize");
	
	// Camera frustum near & far.
	// frustumNear.
	shader.frustumNear_loc = gl.getUniformLocation(shader.program, "near");

	// frustumFar.
	shader.frustumFar_loc = gl.getUniformLocation(shader.program, "far");

	// for depthRendering shader.***
	shader.bHasTexture_loc = gl.getUniformLocation(shader.program, "bHasTexture");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");
	
	shader.scaleLC_loc = gl.getUniformLocation(shader.program, "scaleLC");
	shader.colorMultiplier_loc = gl.getUniformLocation(shader.program, "colorMultiplier");
	shader.modelViewProjectionMatrixInv_loc = gl.getUniformLocation(shader.program, "modelViewProjectionMatrixInv");
	shader.projectionMatrixInv_loc = gl.getUniformLocation(shader.program, "projectionMatrixInv");
	shader.modelViewMatrixRelToEyeInv_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEyeInv");

	shader.uRenderType_loc = gl.getUniformLocation(shader.program, "uRenderType");
	shader.uTime_loc = gl.getUniformLocation(shader.program, "uTime");

	//uniform vec2 clippingPolygon2dPoints[512];
	//uniform int clippingConvexPolygon2dPointsIndices[256];
	shader.clippingPolygon2dPoints_loc = gl.getUniformLocation(shader.program, "clippingPolygon2dPoints");
	shader.clippingConvexPolygon2dPointsIndices_loc = gl.getUniformLocation(shader.program, "clippingConvexPolygon2dPointsIndices");
	shader.clippingType_loc = gl.getUniformLocation(shader.program, "clippingType");
	shader.limitationInfringedColor4_loc = gl.getUniformLocation(shader.program, "limitationInfringedColor4");
	shader.limitationHeights_loc = gl.getUniformLocation(shader.program, "limitationHeights");
};
