'use strict';
/**
 * 어떤 일을 하고 있습니까?
 * @class
 */
var ShadersManager = function() 
{
	if (!(this instanceof ShadersManager)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this.shaders_array = [];
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx = 변수
 * returns shader
 */
ShadersManager.prototype.getMagoShader = function(idx) 
{
	var shader;

	if (idx >= 0 && idx < this.shaders_array.length) 
	{
		shader = this.shaders_array[idx];
	}

	return shader;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.getShader = function(gl, source, type, typeString) 
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
 */
ShadersManager.prototype.createDefaultShader = function(gl) 
{
	this.createStandardShader(gl);                // 0.
	this.createTextureSimpleObjectShader(gl);     // 1.
	this.createColorSelectionShader(gl);          // 2.
	this.createTextureSimpleObjectA1Shader(gl);   // 3.
	this.createCloudShader(gl);                   // 4.
	this.createBlendingCubeShader(gl);            // 5.
	this.createPCloudShader(gl);                  // 6.
	this.createSimpleObjectTexNormalShader(gl); // 7.
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createColorSelectionShader = function(gl) 
{
	var shader = new Shader();
	this.shaders_array.push(shader);

	shader.shader_vertex_source = ShaderSource.ColorVS;
	//http://www.lighthouse3d.com/tutorials/opengl-selection-tutorial/

	shader.shader_fragment_source = ShaderSource.ColorFS;

	// https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf
	shader.SHADER_PROGRAM = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	gl.linkProgram(shader.SHADER_PROGRAM);

	shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader._encodedCamPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");
	shader._RefTransfMatrix = gl.getUniformLocation(shader.SHADER_PROGRAM, "RefTransfMatrix");

	shader._position = gl.getAttribLocation(shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createTextureSimpleObjectShader = function(gl) 
{
	var shader = new Shader();
	this.shaders_array.push(shader);

	shader.shader_vertex_source = ShaderSource.TextureVS;
	shader.shader_fragment_source = ShaderSource.TextureFS;

	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	shader.SHADER_PROGRAM = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	gl.linkProgram(shader.SHADER_PROGRAM);

	shader._encodedCamPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");
	shader._Mmatrix = gl.getUniformLocation(shader.SHADER_PROGRAM, "Mmatrix");
	shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader.SHADER_PROGRAM.samplerUniform = gl.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");

	shader._position = gl.getAttribLocation(shader.SHADER_PROGRAM, "position");
	shader._texcoord = gl.getAttribLocation(shader.SHADER_PROGRAM, "aTextureCoord");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createTextureSimpleObjectA1Shader = function(gl) 
{
	var shader = new Shader();
	this.shaders_array.push(shader);

	shader.shader_vertex_source = ShaderSource.TextureA1VS;
	shader.shader_fragment_source = ShaderSource.TextureA1FS;

	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	shader.SHADER_PROGRAM = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	gl.linkProgram(shader.SHADER_PROGRAM);

	shader._encodedCamPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");
	shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader.SHADER_PROGRAM.samplerUniform = gl.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");

	shader._position = gl.getAttribLocation(shader.SHADER_PROGRAM, "position");
	shader._texcoord = gl.getAttribLocation(shader.SHADER_PROGRAM, "aTextureCoord");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createStandardShader = function(gl) 
{
	// This shader renders the normal f4d geometry.
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);

	standard_shader.shader_vertex_source = ShaderSource.StandardVS;
	standard_shader.shader_fragment_source = ShaderSource.StandardFS;

	// Default ShaderProgram.
	standard_shader.SHADER_PROGRAM = gl.createProgram();
	standard_shader.shader_vertex = this.getShader(gl, standard_shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(gl, standard_shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	gl.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._RefTransfMatrix = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "RefTransfMatrix");
	standard_shader._encodedCamPosHIGH = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	standard_shader._BuildingPosHIGH = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosHIGH");
	standard_shader._BuildingPosLOW = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosLOW");

	standard_shader._color = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createCloudShader = function(gl) 
{
	// This shader renders the f4d clouds.
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);

	standard_shader.shader_vertex_source = ShaderSource.CloudVS;
	standard_shader.shader_fragment_source = ShaderSource.CloudFS;

	// Default ShaderProgram.
	standard_shader.SHADER_PROGRAM = gl.createProgram();
	standard_shader.shader_vertex = this.getShader(gl, standard_shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(gl, standard_shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	gl.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._encodedCamPosHIGH = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	standard_shader._cloudPosHIGH = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "cloudPosHIGH");
	standard_shader._cloudPosLOW = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "cloudPosLOW");

	standard_shader._color = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createBlendingCubeShader = function(gl) 
{
	// This shader renders the f4d clouds.
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);

	standard_shader.shader_vertex_source = ShaderSource.BlendingCubeVS;
	standard_shader.shader_fragment_source = ShaderSource.BlendingCubeFS;

	// Default ShaderProgram.
	standard_shader.SHADER_PROGRAM = gl.createProgram();
	standard_shader.shader_vertex = this.getShader(gl, standard_shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(gl, standard_shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	gl.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._encodedCamPosHIGH = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");

	standard_shader._color = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createPCloudShader = function(gl) 
{
	// This shader renders the f4d clouds.
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);

	standard_shader.shader_vertex_source = ShaderSource.PointCloudVS;
	standard_shader.shader_fragment_source = ShaderSource.PointCloudFS;

	// Default ShaderProgram.
	standard_shader.SHADER_PROGRAM = gl.createProgram();
	standard_shader.shader_vertex = this.getShader(gl, standard_shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(gl, standard_shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");

	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	gl.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	gl.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._encodedCamPosHIGH = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	standard_shader._BuildingPosHIGH = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosHIGH");
	standard_shader._BuildingPosLOW = gl.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosLOW");

	standard_shader._color = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = gl.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createSimpleObjectTexNormalShader = function(gl) 
{
	var shader = new Shader();
	this.shaders_array.push(shader);
	shader.shader_vertex_source = ShaderSource.TextureNormalVS;
	shader.shader_fragment_source = ShaderSource.TextureNormalFS;

	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	//https://dannywoodz.wordpress.com/2014/12/14/webgl-from-scratch-directional-lighting-part-1/
	//http://learningwebgl.com/blog/?p=684 // good.
	shader.SHADER_PROGRAM = gl.createProgram();
	shader.shader_vertex = this.getShader(gl, shader.shader_vertex_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(gl, shader.shader_fragment_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	gl.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	gl.linkProgram(shader.SHADER_PROGRAM);

	shader._encodedCamPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = gl.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");

	shader._ModelViewProjectionMatrixRelToEye = gl.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader._NormalMatrix = gl.getUniformLocation(shader.SHADER_PROGRAM, "uNMatrix");

	//shader.SHADER_PROGRAM.samplerUniform = gl.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");
	shader.samplerUniform = gl.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");
	shader._lightDirection = gl.getUniformLocation(shader.SHADER_PROGRAM, "uLightingDirection");

	shader._position = gl.getAttribLocation(shader.SHADER_PROGRAM, "position");
	shader._texcoord = gl.getAttribLocation(shader.SHADER_PROGRAM, "aTextureCoord");
	shader._normal = gl.getAttribLocation(shader.SHADER_PROGRAM, "aVertexNormal");
};
