'use strict';


/**
 * 어떤 일을 하고 있습니까?
 * @class UniformMatrix4fvDataPair
 * @param gl 변수
 */
var UniformMatrix4fvDataPair = function(gl, uniformName) {
	if(!(this instanceof UniformMatrix4fvDataPair)) {
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
UniformMatrix4fvDataPair.prototype.bindUniform = function() {
	this.gl.uniformMatrix4fv(this.uniformLocation, false, this.matrix4fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec2fvDataPair
 * @param gl 변수
 */
var UniformVec2fvDataPair = function(gl, uniformName) {
	if(!(this instanceof UniformVec2fvDataPair)) {
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
UniformVec2fvDataPair.prototype.bindUniform = function() {
	this.gl.uniform2fv(this.uniformLocation, false, this.vec2fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec3fvDataPair
 * @param gl 변수
 */
var UniformVec3fvDataPair = function(gl, uniformName) {
	if(!(this instanceof UniformVec3fvDataPair)) {
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
UniformVec3fvDataPair.prototype.bindUniform = function() {
	this.gl.uniform3fv(this.uniformLocation, false, this.vec3fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class UniformVec4fvDataPair
 * @param gl 변수
 */
var UniformVec4fvDataPair = function(gl, uniformName) {
	if(!(this instanceof UniformVec4fvDataPair)) {
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
UniformVec4fvDataPair.prototype.bindUniform = function() {
	this.gl.uniform4fv(this.uniformLocation, false, this.vec4fv);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Uniform1fDataPair
 * @param gl 변수
 */
var Uniform1fDataPair = function(gl, uniformName) {
	if(!(this instanceof Uniform1fDataPair)) {
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
Uniform1fDataPair.prototype.bindUniform = function() {
	this.gl.uniform1f(this.uniformLocation, false, this.floatValue);
};

/**
 * 어떤 일을 하고 있습니까?
 * @class Uniform1iDataPair
 * @param gl 변수
 */
var Uniform1iDataPair = function(gl, uniformName) {
	if(!(this instanceof Uniform1iDataPair)) {
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
Uniform1iDataPair.prototype.bindUniform = function() {
	this.gl.uniform1i(this.uniformLocation, false, this.intValue);
};

//**********************************************************************************************************************************************************

/**
 * 어떤 일을 하고 있습니까?
 * @class PostFxShader
 * @param gl 변수
 */
var PostFxShader = function(gl) {
	if(!(this instanceof PostFxShader)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl = gl;
	this.name;
	this.attribLocationCacheObj = {};
	this.uniformsArray = []; // this array has the same uniforms that "uniformsCacheObj".***
	this.uniformsCacheObj = {}; // this object has the same uniforms that "uniformsArray".***
	
	// shader program.***
	this.program;
	this.shader_vertex;
	this.shader_fragment;

	// attributes.***
	this.position3_loc;
	this.color3_loc;
	this.normal3_loc;
	this.texCoord2_loc;

	// uniforms matrix.***
	this.projectionMatrix4_loc; // usually no used.***
	this.modelViewMatrix4_loc;
	this.modelViewProjectionMatrix4_loc;
	this.modelViewMatrix4RelToEye_loc;
	this.modelViewProjectionMatrix4RelToEye_loc;
	this.normalMatrix4_loc;
	this.normalMatrix3_loc;
	this.RefTransfMatrix;

	// uniform vectors.***
	this.buildingPosHIGH_loc;
	this.buildingPosLOW_loc;
	this.cameraPosHIGH_loc;
	this.cameraPosLOW_loc;
	this.noiseScale2_loc;
	this.kernel16_loc;

	// uniform values.***
	this.near_loc;
	this.far_loc;
	this.fov_loc;
	this.aspectRatio_loc;
	this.screenWidth_loc;
	this.screenHeight_loc;

	// uniform samplers.***
	this.diffuseTex_loc;
	this.depthTex_loc;
	this.noiseTex_loc;

	// blur.***
	this.texelSize_loc;
	this.colorTex_loc;

	// Model Reference meshes.***
	this.useRefTransfMatrix_loc;
	this.useTexture_loc;
	this.invertNormals_loc;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.bindUniforms = function()
{
	var uniformsDataPairsCount = this.uniformsArray.length;
	for(var i=0; i<uniformsDataPairsCount; i++)
	{
		this.uniformsArray[i].bindUniform();
	}
};

/**
 * 어떤 일을 하고 있습니까?
 * @param shaderName 변수
 * @returns shader
 */
PostFxShader.prototype.newUniformDataPair = function(uniformType, uniformName)
{
	var uniformDataPair;//
	if(uniformType == "Matrix4fv")
	{
		uniformDataPair = new UniformMatrix4fvDataPair(this.gl, uniformName);
		this.uniformsArray.push(uniformDataPair);
		this.uniformsCacheObj[uniformName] = uniformDataPair;
	}
	else if(uniformType == "Vec4fv")
	{
		uniformDataPair = new UniformVec4fvDataPair(this.gl, uniformName);
		this.uniformsArray.push(uniformDataPair);
		this.uniformsCacheObj[uniformName] = uniformDataPair;
	}
	else if(uniformType == "Vec3fv")
	{
		uniformDataPair = new UniformVec3fvDataPair(this.gl, uniformName);
		this.uniformsArray.push(uniformDataPair);
		this.uniformsCacheObj[uniformName] = uniformDataPair;
	}
	else if(uniformType == "Vec2fv")
	{
		uniformDataPair = new UniformVec2fvDataPair(this.gl, uniformName);
		this.uniformsArray.push(uniformDataPair);
		this.uniformsCacheObj[uniformName] = uniformDataPair;
	}
	else if(uniformType == "1f")
	{
		uniformDataPair = new Uniform1fDataPair(this.gl, uniformName);
		this.uniformsArray.push(uniformDataPair);
		this.uniformsCacheObj[uniformName] = uniformDataPair;
	}
	else if(uniformType == "1i")
	{
		uniformDataPair = new Uniform1iDataPair(this.gl, uniformName);
		this.uniformsArray.push(uniformDataPair);
		this.uniformsCacheObj[uniformName] = uniformDataPair;
	}
	
	return uniformDataPair;
};

//*********************************************************************************************************************

/**
 * 어떤 일을 하고 있습니까?
 * @class PostFxShadersManager
 */
var PostFxShadersManager = function() {
	if(!(this instanceof PostFxShadersManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	this.gl;
	this.pFx_shaders_array = []; // old.***
	this.shadersCache = {};
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
	this.shadersCache[shaderName] = shader;
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
PostFxShadersManager.prototype.getShader = function(gl, source, type, typeString) {
	// Source from internet.***
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert("ERROR IN "+typeString+ " SHADER : " + gl.getShaderInfoLog(shader));
		return false;
	}
	return shader;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createDefaultShaders = function(gl) {
	this.createRenderDepthShader(gl); // 0.***
	this.createSsaoShader(gl); // 1.***
	this.createBlurShader(gl); // 2.***

	// Now, create shaders for modelReference geometries.****
	this.createRenderDepthShaderModelRef(gl); // 3.***
	this.createSsaoShaderModelRef(gl); // 4.***
	//this.createBlurShader_ModelRef(gl); // 5.***

	this.createColorSelectionShaderModelRef(gl);// 5.***
	this.createSimpleDepthShaderModelRef(gl);// 6.***

	this.createRenderDepthShaderLODBuilding(gl);// 7.***
	this.createSsaoShaderLODBuilding(gl);// 8.***

	this.createRenderDepthShaderLego(gl);// 9.***
	this.createSsaoShaderLego(gl);// 10.***

	this.createDepthShaderBox(gl); // 11.***
	this.createSsaoShaderBox(gl); // 12.***

	this.createPngImageShader(gl); // 13.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createBlurShader = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var blur_vs_source = ShaderSource.blurVsSource;
	var blur_fs_source = ShaderSource.blurFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, blur_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, blur_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["texCoord"] = gl.getAttribLocation(shader.program, "texCoord");

	shader.texelSize_loc = gl.getUniformLocation(shader.program, "texelSize");
	shader.colorTex_loc = gl.getUniformLocation(shader.program, "colorTex");
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createSsaoShader = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.ssaoVsSource;
	var ssao_fs_source = ShaderSource.ssaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
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

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["normal"] = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["texCoord"] = gl.getAttribLocation(shader.program, "texCoord");
	// ssao uniforms.**********************************************************************
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");

	// uniform values.***
	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");

	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	// uniform samplers.***
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createRenderDepthShader = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var showDepth_vs_source = ShaderSource.showDepthVsSource;
	var showDepth_fs_source = ShaderSource.showDepthFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["normal"] = gl.getAttribLocation(shader.program, "normal");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
};

// Ref Model.***********************************************************************************************************************
// Ref Model.***********************************************************************************************************************
// Ref Model.***********************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createSsaoShaderModelRef = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.modelRefSsaoVsSource;
	var ssao_fs_source = ShaderSource.modelRefSsaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh"); // sceneState.***
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow"); // sceneState.***
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye"); // sceneState.***
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye"); // sceneState.***
	shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4"); // sceneState.***
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix"); // sceneState.***
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["texCoord"] = gl.getAttribLocation(shader.program, "texCoord");
	shader.attribLocationCacheObj["normal"] = gl.getAttribLocation(shader.program, "normal");
	//*********************************************************************************
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	// ssao uniforms.**********************************************************************
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");

	// uniform values.***
	shader.near_loc = gl.getUniformLocation(shader.program, "near"); // sceneState.***
	shader.far_loc = gl.getUniformLocation(shader.program, "far"); // sceneState.***
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov"); // sceneState.***
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio"); // sceneState.***

	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth"); // sceneState.***
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight"); // sceneState.***
	
	shader.shininessValue_loc = gl.getUniformLocation(shader.program, "shininessValue");

	shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");
	shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");

	// uniform samplers.***
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex"); 

};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createRenderDepthShaderModelRef = function(gl, sceneState) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var showDepth_vs_source = ShaderSource.renderShowDepthVsSource; // 
	var showDepth_fs_source = ShaderSource.renderShowDepthFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["normal"] = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["texCoord"] = gl.getAttribLocation(shader.program, "texCoord");
	//*********************************************************************************
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");

	// ModelReference.****
	//shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	//shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	//shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");

};

// Selection shader.***********************************************************************************************************************
// Selection shader.***********************************************************************************************************************
// Selection shader.***********************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createColorSelectionShaderModelRef = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.colorSelectionSsaoVsSource;
	var ssao_fs_source = ShaderSource.colorSelectionSsaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");

	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");
};

// SimpleDepth shader.***********************************************************************************************************************
// SimpleDepth shader.***********************************************************************************************************************
// SimpleDepth shader.***********************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createSimpleDepthShaderModelRef = function(gl) {
	// no used.!!!!!!!!!!!!!!!
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.simpleDepthSsaoVsSource;
	var ssao_fs_source = ShaderSource.simpleDepthSsaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");

	//shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
};

// LOD 2 Building Shader.***********************************************************************************************************************
// LOD 2 Building Shader.***********************************************************************************************************************
// LOD 2 Building Shader.***********************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createSsaoShaderLODBuilding = function(gl) {
	// 8.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.LodBuildingSsaoVsSource;
	var ssao_fs_source = ShaderSource.LodBuildingSsaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
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
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.bUse1Color_loc = gl.getUniformLocation(shader.program, "bUse1Color");
	shader.oneColor4_loc = gl.getUniformLocation(shader.program, "oneColor4");
	shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["normal"] = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["color4"] = gl.getAttribLocation(shader.program, "color4");

	//*********************************************************************************
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	// ssao uniforms.**********************************************************************
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");

	// uniform values.***
	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");

	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	//shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");
	shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");

	// uniform samplers.***
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");

	// ModelReference.****
	shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createRenderDepthShaderLODBuilding = function(gl) {
	// 7.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var showDepth_vs_source = ShaderSource.lodBuildingDepthVsSource;
	var showDepth_fs_source = ShaderSource.lodBuildingDepthFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
};

// Lego Shader.***********************************************************************************************************************
// Lego Shader.***********************************************************************************************************************
// Lego Shader.***********************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createSsaoShaderLego = function(gl) {
	// 10.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.LegoSsaoVsSource;
	var ssao_fs_source = ShaderSource.LegoSsaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
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
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	//shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["normal"] = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["color4"] = gl.getAttribLocation(shader.program, "color4");

	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	// ssao uniforms.**********************************************************************
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");

	// uniform values.***
	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");

	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");
	shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");

	// uniform samplers.***
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");

	// ModelReference.****
	shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");
};

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createRenderDepthShaderLego = function(gl) {
	// 9.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var showDepth_vs_source = ShaderSource.LegoDepthVsSource;
	var showDepth_fs_source = ShaderSource.LegoDepthFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
};





/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createRenderDepthShaderLODBuilding = function(gl) {
	// 7.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var showDepth_vs_source = ShaderSource.lodBuildingDepthVsSource;
	var showDepth_fs_source = ShaderSource.lodBuildingDepthFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
};

// box depth Shader.***********************************************************************************************************************
// box depth Shader.***********************************************************************************************************************
// box depth Shader.***********************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createDepthShaderBox = function(gl) {
	// 7.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var showDepth_vs_source = ShaderSource.boxDepthVsSource;
	var showDepth_fs_source = ShaderSource.boxDepthFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");

	shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");
	shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
};

// box Shader.***********************************************************************************************************************
// box Shader.***********************************************************************************************************************
// box Shader.***********************************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createSsaoShaderBox = function(gl) {
	// 8.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.boxSsaoVsSource;
	var ssao_fs_source = ShaderSource.boxSsaoFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
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
	//shader.RefTransfMatrix = gl.getUniformLocation(shader.program, "RefTransfMatrix");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	shader.bUse1Color_loc = gl.getUniformLocation(shader.program, "bUse1Color");
	shader.oneColor4_loc = gl.getUniformLocation(shader.program, "oneColor4");
	shader.bScale_loc = gl.getUniformLocation(shader.program, "bScale");
	shader.scale_loc = gl.getUniformLocation(shader.program, "scale");


	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	//shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");
	shader.attribLocationCacheObj["position"] = gl.getAttribLocation(shader.program, "position");
	shader.attribLocationCacheObj["normal"] = gl.getAttribLocation(shader.program, "normal");
	shader.attribLocationCacheObj["color4"] = gl.getAttribLocation(shader.program, "color4");

	//*********************************************************************************
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	// ssao uniforms.**********************************************************************
	shader.noiseScale2_loc = gl.getUniformLocation(shader.program, "noiseScale");
	shader.kernel16_loc = gl.getUniformLocation(shader.program, "kernel");

	// uniform values.***
	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");
	shader.fov_loc = gl.getUniformLocation(shader.program, "fov");
	shader.aspectRatio_loc = gl.getUniformLocation(shader.program, "aspectRatio");

	shader.screenWidth_loc = gl.getUniformLocation(shader.program, "screenWidth");
	shader.screenHeight_loc = gl.getUniformLocation(shader.program, "screenHeight");

	shader.hasTexture_loc = gl.getUniformLocation(shader.program, "hasTexture");
	shader.color4Aux_loc = gl.getUniformLocation(shader.program, "vColor4Aux");

	// uniform samplers.***
	shader.depthTex_loc = gl.getUniformLocation(shader.program, "depthTex");
	shader.noiseTex_loc = gl.getUniformLocation(shader.program, "noiseTex");
	shader.diffuseTex_loc = gl.getUniformLocation(shader.program, "diffuseTex");

	// ModelReference.****
	shader.useRefTransfMatrix_loc = gl.getUniformLocation(shader.program, "useRefTransfMatrix");
	shader.useTexture_loc = gl.getUniformLocation(shader.program, "useTexture");
	shader.invertNormals_loc  = gl.getUniformLocation(shader.program, "invertNormals");
};

// PNG images shader.**************************************************************************************************
// PNG images shader.**************************************************************************************************
// PNG images shader.**************************************************************************************************
/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createPngImageShader = function(gl) {
	// 13.***
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);

	var ssao_vs_source = ShaderSource.pngImageVsSource;
	var ssao_fs_source = ShaderSource.pngImageFsSource;

	shader.program = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(shader.program, shader.shader_vertex);
	gl.attachShader(shader.program, shader.shader_fragment);
	gl.linkProgram(shader.program);

	shader.texture_loc = gl.getUniformLocation(shader.program, "u_texture"); 
	shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	shader.buildingRotMatrix_loc = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	
	shader.position3_loc = gl.getAttribLocation(shader.program, "a_position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "a_texcoord");
	
};


















