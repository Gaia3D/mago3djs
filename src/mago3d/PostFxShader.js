'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
var PostFxShader = function(gl) {
	if(!(this instanceof PostFxShader)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
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
 */
var PostFxShadersManager = function() {
	if(!(this instanceof PostFxShadersManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.pFx_shaders_array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 * @param source 변수
 * @param type 변수
 * @param typeString 변수
 * @returns shader
 */
PostFxShadersManager.prototype.getShader = function(GL, source, type, typeString) {
	// Source from internet.***
	var shader = GL.createShader(type);
	GL.shaderSource(shader, source);
	GL.compileShader(shader);
	if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
	  alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
	  return false;
	}
	return shader;
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 */
PostFxShadersManager.prototype.createDefaultShaders = function(GL) {
	this.createRenderDepthShader(GL); // 0.***
	this.createSsaoShader(GL); // 1.***
	this.createBlurShader(GL); // 2.***
	
	// Now, create shaders for modelReference geometries.****
	this.createRenderDepthShaderModelRef(GL); // 3.***
	this.createSsaoShaderModelRef(GL); // 4.***
	//this.createBlurShader_ModelRef(GL); // 5.***
	
	this.createColorSelectionShaderModelRef(GL);// 5.***
	this.createSimpleDepthShaderModelRef(GL);// 6.***
	
	this.createRenderDepthShaderLODBuilding(GL);// 7.***
	this.createSsaoShaderLODBuilding(GL);// 8.***
	
	
	//this.create_renderDepthShader_TEST_ModelRef(GL); // 5
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
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

	//shader.cameraPosHIGH_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCHigh");
	//shader.cameraPosLOW_loc = gl.getUniformLocation(shader.program, "encodedCameraPositionMCLow");
	//shader.buildingPosHIGH_loc = gl.getUniformLocation(shader.program, "buildingPosHIGH");
	//shader.buildingPosLOW_loc = gl.getUniformLocation(shader.program, "buildingPosLOW");
	
	//shader.modelViewMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "modelViewMatrixRelToEye");
	//shader.modelViewProjectionMatrix4RelToEye_loc = gl.getUniformLocation(shader.program, "ModelViewProjectionMatrixRelToEye");
	//shader.normalMatrix4_loc = gl.getUniformLocation(shader.program, "normalMatrix4");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");
	
	shader.projectionMatrix4_loc = gl.getUniformLocation(shader.program, "projectionMatrix");
	shader.modelViewMatrix4_loc = gl.getUniformLocation(shader.program, "modelViewMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	//shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	
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
 * @param GL 변수
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
	/*
	http://www.mathematik.uni-marburg.de/~thormae/lectures/graphics1/code/WebGLShaderLightMat/ShaderLightMat.html
	// per vertex.***
	attribute vec3 inputPosition;
	attribute vec2 inputTexCoord;
	attribute vec3 inputNormal;

	uniform mat4 projection, modelview, normalMat;
	uniform int mode;

	varying vec4 forFragColor;

	const vec3 lightPos = vec3(1.0, 1.0, 1.0);
	const vec3 diffuseColor = vec3(0.5, 0.0, 0.0);
	const vec3 specColor = vec3(1.0, 1.0, 1.0);

	void main(){
	  gl_Position = projection * modelview * vec4(inputPosition, 1.0);

	  // all following gemetric computations are performed in the
	  // camera coordinate system (aka eye coordinates)
	  vec3 normal = vec3(normalMat * vec4(inputNormal, 0.0));
	  vec4 vertPos4 = modelview * vec4(inputPosition, 1.0);
	  vec3 vertPos = vec3(vertPos4) / vertPos4.w;
	  vec3 lightDir = normalize(lightPos - vertPos);
	  vec3 reflectDir = reflect(-lightDir, normal);
	  vec3 viewDir = normalize(-vertPos);

	  float lambertian = max(dot(lightDir,normal), 0.0);
	  float specular = 0.0;

	  if(lambertian > 0.0) {
		float specAngle = max(dot(reflectDir, viewDir), 0.0);
		specular = pow(specAngle, 4.0);

		// the exponent controls the shininess (try mode 2)
		if(mode == 2)  specular = pow(specAngle, 16.0);
		   
		// according to the rendering equation we would need to multiply
		// with the the "lambertian", but this has little visual effect
		if(mode == 3) specular *= lambertian;
		// switch to mode 4 to turn off the specular component
		if(mode == 4) specular *= 0.0;
	  }
	  forFragColor = vec4(lambertian*diffuseColor + specular*specColor, 1.0);
	}
	
	// per fragment.**********
	// vertex shader.***
	attribute vec3 inputPosition;
	attribute vec2 inputTexCoord;
	attribute vec3 inputNormal;

	uniform mat4 projection, modelview, normalMat;

	varying vec3 normalInterp;
	varying vec3 vertPos;

	void main(){
		gl_Position = projection * modelview * vec4(inputPosition, 1.0);
		vec4 vertPos4 = modelview * vec4(inputPosition, 1.0);
		vertPos = vec3(vertPos4) / vertPos4.w;
		normalInterp = vec3(normalMat * vec4(inputNormal, 0.0));
	}
	
	// fragment shader.***
	precision mediump float; 
	varying vec3 normalInterp;
	varying vec3 vertPos;
	uniform int mode;
	const vec3 lightPos = vec3(1.0,1.0,1.0);
	const vec3 diffuseColor = vec3(0.5, 0.0, 0.0);
	const vec3 specColor = vec3(1.0, 1.0, 1.0);

	void main() {
	  vec3 normal = normalize(normalInterp); 
	  vec3 lightDir = normalize(lightPos - vertPos);

	  float lambertian = max(dot(lightDir,normal), 0.0);
	  float specular = 0.0;

	  if(lambertian > 0.0) {

		vec3 reflectDir = reflect(-lightDir, normal);
		vec3 viewDir = normalize(-vertPos);

		float specAngle = max(dot(reflectDir, viewDir), 0.0);
		specular = pow(specAngle, 4.0);

		// the exponent controls the shininess (try mode 2)
		if(mode == 2)  specular = pow(specAngle, 16.0);

		// according to the rendering equation we would need to multiply
		// with the the "lambertian", but this has little visual effect
		if(mode == 3) specular *= lambertian;

		// switch to mode 4 to turn off the specular component
		if(mode == 4) specular *= 0.0;
	  }
	  gl_FragColor = vec4( lambertian*diffuseColor +
							specular*specColor, 1.0);
	}
	*/
		
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
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
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

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
PostFxShadersManager.prototype.createRenderDepthShaderModelRef = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var showDepth_vs_source = ShaderSource.renderShowDepthVsSource;
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
	//*********************************************************************************
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
	shader.buildingRotMatrix = gl.getUniformLocation(shader.program, "buildingRotMatrix");
	
	//shader.program.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader.samplerUniform = gl.getUniformLocation(shader.program, "uSampler");
	//shader._lightDirection = gl.getUniformLocation(shader.program, "uLightingDirection");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	//shader.texCoord2_loc = gl.getAttribLocation(shader.program, "texCoord");
	shader.normal3_loc = gl.getAttribLocation(shader.program, "normal");
	shader.color4_loc = gl.getAttribLocation(shader.program, "color4");

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
	shader.buildingRotMatrix = gl.getUniformLocation(shader.program, "buildingRotMatrix");

	shader.position3_loc = gl.getAttribLocation(shader.program, "position");
	//*********************************************************************************
	shader.aditionalMov_loc = gl.getUniformLocation(shader.program, "aditionalPosition");

	shader.near_loc = gl.getUniformLocation(shader.program, "near");
	shader.far_loc = gl.getUniformLocation(shader.program, "far");	
	

		
};




