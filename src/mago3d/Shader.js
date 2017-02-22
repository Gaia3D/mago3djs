'use strict';

// An basic example.***********************************************************
/*
	var shader_vertex_source="\n\
		attribute vec3 position;\n\
		uniform mat4 Pmatrix;\n\
		uniform mat4 Vmatrix;\n\
		uniform mat4 Mmatrix;\n\
		attribute vec3 color; //the color of the point\n\
		varying vec3 vColor;\n\
		void main(void) { //pre-built function\n\
		gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\
		vColor=color;\n\
		}";
		
	var shader_fragment_source="\n\
		precision mediump float;\n\
		varying vec3 vColor;\n\
		void main(void) {\n\
		gl_FragColor = vec4(vColor, 1.);\n\
		}";
		*/
// End example.-----------------------------------------------------------------

// http://learningwebgl.com/blog/?p=507
		/*
		http://blogs.agi.com/insight3d/index.php/2008/09/03/precisions-precisions/ // GPU RTE HighValue-LowValue
		uniform vec3 uViewerHigh;
		uniform vec3 uViewerLow;
		 
		void main(void)
		{
			vec3 highDifference = vec3(gl_Vertex.xyz - uViewerHigh);
			vec3 lowDifference = vec3(gl_Normal.xyz - uViewerLow);
			gl_Position = gl_ModelViewProjectionMatrix *
				 vec4(highDifference + lowDifference, 1.0);
		}
		//-----------------------------------------------
		void CDoubleToTwoFloats::Convert(double doubleValue,
		float&amp; floatHigh, float&amp; floatLow)
		{
			if (doubleValue &gt;= 0.0)
			{
				double doubleHigh = floor(doubleValue / 65536.0) * 65536.0;
				floatHigh = (float)doubleHigh;
				floatLow = (float)(doubleValue - doubleHigh);
			}
			else
			{
				double doubleHigh = floor(-doubleValue / 65536.0) * 65536.0;
				floatHigh = (float)-doubleHigh;
				floatLow = (float)(doubleValue + doubleHigh);
			}
		}
		//-----------------------------------------------
		*/
		/*
		vec4 czm_translateRelativeToEye(vec3 high, vec3 low)\n\
		{\n\
			vec3 highDifference = high - czm_encodedCameraPositionMCHigh;\n\
			vec3 lowDifference = low - czm_encodedCameraPositionMCLow;\n\
		\n\
			return vec4(highDifference + lowDifference, 1.0);\n\
		}\n\
		*/
		
/**
 * 어떤 일을 하고 있습니까?
 */
var Shader = function() {
	if(!(this instanceof Shader)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.shader_name;
    this.shader_vertex_source;
	this.shader_fragment_source;
	this.SHADER_PROGRAM;
	
	this.shader_vertex;
	this.shader_fragment;
	
	this._ModelViewProjectionMatrixRelToEye;
	this._RefTransfMatrix;
	this._NormalMatrix;
	
	this._encodedCamPosHIGH;
	this._encodedCamPosLOW;
	this._BuildingPosHIGH;
	this._BuildingPosLOW;
	this._lightDirection;

	this._color;
	this._position;
	this._texcoord;
	this._normal;
	
	// test.***
	this.samplerUniform;
};

/**
 * 어떤 일을 하고 있습니까?
 */
var ShadersManager = function() {
	if(!(this instanceof ShadersManager)) {
		throw new Error(Messages.CONSTRUCT_ERROR);
	}
	
	this.shaders_array = [];
	
	// Create shaders to render F4D_Format.**********************
	// 1) Standard shader, that can render light mapping.***
};

/**
 * 어떤 일을 하고 있습니까?
 * @param idx = 변수
 * returns shader
 */
ShadersManager.prototype.getMagoShader = function(idx) {
	var shader;
	
	if(idx >= 0 && idx < this.shaders_array.length) {
		shader = this.shaders_array[idx];
	}
	
	return shader;
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.getShader = function(GL, source, type, typeString) {
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
 */
ShadersManager.prototype.createDefaultShader = function(GL) {
	this.createStandardShader(GL);                // 0.***
	this.createTextureSimpleObjectShader(GL);     // 1.***
	this.createColorSelectionShader(GL);          // 2.***
	this.createTextureSimpleObjectA1Shader(GL);   // 3.***
	this.createCloudShader(GL);                   // 4.***
	this.createBlendingCubeShader(GL);            // 5.***
	this.createPCloudShader(GL);                  // 6.***
	this.createSimpleObjectTexNormalShader(GL); // 7.***
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createColorSelectionShader = function(GL) {
	var shader = new Shader();
	this.shaders_array.push(shader);
	
	shader.shader_vertex_source = ShaderSource.colorShaderVertexSource;
		//http://www.lighthouse3d.com/tutorials/opengl-selection-tutorial/
		
	shader.shader_fragment_source = ShaderSource.colorShaderFragmentSource;
		
	// https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.getShader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	GL.linkProgram(shader.SHADER_PROGRAM);
	
	shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader._encodedCamPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");
	shader._RefTransfMatrix = GL.getUniformLocation(shader.SHADER_PROGRAM, "RefTransfMatrix");

	shader._position = GL.getAttribLocation(shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createTextureSimpleObjectShader = function(GL) {
	var shader = new Shader();
	this.shaders_array.push(shader);
	
	shader.shader_vertex_source = ShaderSource.textureShaderVertexSource;
	shader.shader_fragment_source = ShaderSource.textureShaderFragmentSource;
		
	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.getShader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	GL.linkProgram(shader.SHADER_PROGRAM);

	shader._encodedCamPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");
	shader._Mmatrix = GL.getUniformLocation(shader.SHADER_PROGRAM, "Mmatrix");
	shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader.SHADER_PROGRAM.samplerUniform = GL.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");

	shader._position = GL.getAttribLocation(shader.SHADER_PROGRAM, "position");
	shader._texcoord = GL.getAttribLocation(shader.SHADER_PROGRAM, "aTextureCoord");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createTextureSimpleObjectA1Shader = function(GL) {
	var shader = new Shader();
	this.shaders_array.push(shader);
	
	shader.shader_vertex_source = ShaderSource.textureA1ShaderVertexSource;
	shader.shader_fragment_source = ShaderSource.textureA1ShaderFragmentSource;

	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.getShader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	GL.linkProgram(shader.SHADER_PROGRAM);

	shader._encodedCamPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");
	shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader.SHADER_PROGRAM.samplerUniform = GL.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");

	shader._position = GL.getAttribLocation(shader.SHADER_PROGRAM, "position");
	shader._texcoord = GL.getAttribLocation(shader.SHADER_PROGRAM, "aTextureCoord");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createStandardShader = function(GL) {
	// This shader renders the normal f4d geometry.***
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);
	
	standard_shader.shader_vertex_source = ShaderSource.standardShaderVertexSource;
	standard_shader.shader_fragment_source = ShaderSource.standardShaderFragmentSource;
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.getShader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	GL.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._RefTransfMatrix = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "RefTransfMatrix");
	standard_shader._encodedCamPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	standard_shader._BuildingPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosHIGH");
	standard_shader._BuildingPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosLOW");

	standard_shader._color = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createCloudShader = function(GL) {
	// This shader renders the f4d clouds.***
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);
	
	standard_shader.shader_vertex_source = ShaderSource.cloudShaderVertexSource;
	standard_shader.shader_fragment_source = ShaderSource.cloudShaderFragmentSource;
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.getShader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	GL.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._encodedCamPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	standard_shader._cloudPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "cloudPosHIGH");
	standard_shader._cloudPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "cloudPosLOW");

	standard_shader._color = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createBlendingCubeShader = function(GL) {
	// This shader renders the f4d clouds.***
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);

	standard_shader.shader_vertex_source = ShaderSource.blendingCubeShaderVertexSource;
	standard_shader.shader_fragment_source = ShaderSource.blendingCubeShaderFragmentSource;
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.getShader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	GL.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._encodedCamPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");

	standard_shader._color = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createPCloudShader = function(GL) {
	// This shader renders the f4d clouds.***
	var standard_shader = new Shader();
	this.shaders_array.push(standard_shader);

	standard_shader.shader_vertex_source = ShaderSource.pCloudShaderVertexSource;
	standard_shader.shader_fragment_source = ShaderSource.pCloundShaderFragmentSource;
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.getShader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.getShader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	GL.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._encodedCamPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	standard_shader._BuildingPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosHIGH");
	standard_shader._BuildingPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "buildingPosLOW");

	standard_shader._color = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
};

/**
 * 어떤 일을 하고 있습니까?
 */
ShadersManager.prototype.createSimpleObjectTexNormalShader = function(GL) {
	var shader = new Shader();
	this.shaders_array.push(shader);
	shader.shader_vertex_source = ShaderSource.texNormalShaderVertexSource;
	shader.shader_fragment_source = ShaderSource.texNormalShaderFragmentSource;
		
	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	//https://dannywoodz.wordpress.com/2014/12/14/webgl-from-scratch-directional-lighting-part-1/
	//http://learningwebgl.com/blog/?p=684 // good.***
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.getShader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.getShader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_vertex);
	GL.attachShader(shader.SHADER_PROGRAM, shader.shader_fragment);
	GL.linkProgram(shader.SHADER_PROGRAM);

	shader._encodedCamPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	shader._encodedCamPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");
	shader._BuildingPosHIGH = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosHIGH");
	shader._BuildingPosLOW = GL.getUniformLocation(shader.SHADER_PROGRAM, "buildingPosLOW");
	
	shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	shader._NormalMatrix = GL.getUniformLocation(shader.SHADER_PROGRAM, "uNMatrix");
	
	//shader.SHADER_PROGRAM.samplerUniform = GL.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");
	shader.samplerUniform = GL.getUniformLocation(shader.SHADER_PROGRAM, "uSampler");
	shader._lightDirection = GL.getUniformLocation(shader.SHADER_PROGRAM, "uLightingDirection");

	shader._position = GL.getAttribLocation(shader.SHADER_PROGRAM, "position");
	shader._texcoord = GL.getAttribLocation(shader.SHADER_PROGRAM, "aTextureCoord");
	shader._normal = GL.getAttribLocation(shader.SHADER_PROGRAM, "aVertexNormal");
};
