'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class UniformMatrix4fvDataPair
 * @param gl 변수
 */
var UniformMatrix4fvDataPair = function(gl, uniformName) 
{
	if (!(this instanceof UniformMatrix4fvDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.matrix4fv; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
UniformMatrix4fvDataPair.prototype.bindUniform = function() 
{
	this.gl.uniformMatrix4fv(this.uniformLocation, false, this.matrix4fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec2fvDataPair
 * @param gl 변수
 */
var UniformVec2fvDataPair = function(gl, uniformName) 
{
	if (!(this instanceof UniformVec2fvDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.vec2fv; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
UniformVec2fvDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform2fv(this.uniformLocation, this.vec2fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec3fvDataPair
 * @param gl 변수
 */
var UniformVec3fvDataPair = function(gl, uniformName) 
{
	if (!(this instanceof UniformVec3fvDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.vec3fv; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
UniformVec3fvDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform3fv(this.uniformLocation, this.vec3fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec4fvDataPair
 * @param gl 변수
 */
var UniformVec4fvDataPair = function(gl, uniformName) 
{
	if (!(this instanceof UniformVec4fvDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.vec4fv; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
UniformVec4fvDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform4fv(this.uniformLocation, this.vec4fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Uniform1fDataPair
 * @param gl 변수
 */
var Uniform1fDataPair = function(gl, uniformName) 
{
	if (!(this instanceof Uniform1fDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.floatValue; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
Uniform1fDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform1f(this.uniformLocation, this.floatValue[0]);
};


/**
 * 어떤 일을 하고 있습니까?
 * @class Uniform1iDataPair
 * @param gl 변수
 */
var Uniform1iDataPair = function(gl, uniformName) 
{
	if (!(this instanceof Uniform1iDataPair)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name = uniformName;
	this.uniformLocation;
	this.intValue; 
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
Uniform1iDataPair.prototype.bindUniform = function() 
{
	this.gl.uniform1i(this.uniformLocation, this.intValue);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class AttribLocationState
 */
var AttribLocationState = function() 
{
	if (!(this instanceof AttribLocationState)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.attribLocationEnabled = false;
};

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
	this.last_vboPos_binded;
	this.last_vboNor_binded;
	this.last_vboCol_binded;
	this.last_vboIdx_binded;
	this.last_tex_id;
	this.last_isAditionalMovedZero = false;
	this.last_vboTexCoord_binded; 
	
	// attribLocations state management.
	this.attribLocationStateArray = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.resetLastBuffersBinded = function()
{
	this.last_vboPos_binded = undefined;
	this.last_vboNor_binded = undefined;
	this.last_vboIdx_binded = undefined;
	this.last_vboTexCoord_binded = undefined; // no used.
	this.last_tex_id = undefined; // todo: must distinguish by channel.
	this.last_isAditionalMovedZero = false;
	
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
PostFxShader.prototype.enableVertexAttribArray = function(attribLocation)
{
	if (attribLocation === undefined || attribLocation < 0)
	{ return; }
	
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
	{ this.camera.bindCameraUniforms(this.gl, this); }
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
	
	// 17. specularColor.
	uniformLocation = gl.getUniformLocation(shader.program, "specularColor");
	if (uniformLocation !== null && uniformLocation !== undefined)
	{
		uniformDataPair = shader.newUniformDataPair("Vec3fv", "specularColor");
		uniformDataPair.uniformLocation = uniformLocation;
		uniformDataPair.vec3fv = sceneState.specularColor;
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
	
	shader.refMatrixType_loc = gl.getUniformLocation(shader.program, "refMatrixType");
	shader.refMatrix_loc = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.refTranslationVec_loc = gl.getUniformLocation(shader.program, "refTranslationVec");
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");
	
	shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");
	shader.textureFlipYAxis_loc = gl.getUniformLocation(shader.program, "textureFlipYAxis");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	
	// Attributtes.*
	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	
	shader.bUse1Color_loc = gl.getUniformLocation(shader.program, "bUse1Color");
	shader.oneColor4_loc = gl.getUniformLocation(shader.program, "oneColor4");
	shader.bApplySsao_loc = gl.getUniformLocation(shader.program, "bApplySsao");
	
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
};