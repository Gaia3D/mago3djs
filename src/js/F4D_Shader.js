
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
		
// f4d_Shader.******************************************************************************************************************************************
var f4d_Shader = function()
{
	this.shader_name = undefined;
    this.shader_vertex_source = undefined;
	this.shader_fragment_source = undefined;
	this.SHADER_PROGRAM = undefined;
	
	this.shader_vertex = undefined;
	this.shader_fragment = undefined;
	//---------------------------------------------------
	
	this._ModelViewProjectionMatrixRelToEye = undefined;
	this._RefTransfMatrix = undefined;
	this._NormalMatrix = undefined;
	
	this._encodedCamPosHIGH = undefined;
	this._encodedCamPosLOW = undefined;
	this._BuildingPosHIGH = undefined;
	this._BuildingPosLOW = undefined;
	this._lightDirection = undefined;

	this._color = undefined;
	this._position = undefined;
	this._texcoord = undefined;
	this._normal = undefined;
	
	// test.***
	this.samplerUniform = undefined;
};

// f4d_ShadersManager.************************************************************************************************************************************
var f4d_ShadersManager = function()
{
	this.shaders_array = [];
	
	// Create shaders to render F4D_Format.**********************
	// 1) Standard shader, that can render light mapping.***
	
	
};

f4d_ShadersManager.prototype.get_f4dShader = function(idx)
{
	var shader = undefined;
	
	if(idx >= 0 && idx < this.shaders_array.length)
	{
		shader = this.shaders_array[idx];
	}
	
	return shader;
};

f4d_ShadersManager.prototype.get_shader = function(GL, source, type, typeString)
{
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

f4d_ShadersManager.prototype.create_f4dDefaultShader = function(GL)
{
	this.create_f4dStandardShader(GL);                // 0.***
	this.create_f4dTextureSimpleObjectShader(GL);     // 1.***
	this.create_f4dColorSelectionShader(GL);          // 2.***
	this.create_f4dTextureSimpleObjectA1Shader(GL);   // 3.***
	this.create_f4dCloudShader(GL);                   // 4.***
	this.create_f4dBlendingCubeShader(GL);            // 5.***
	this.create_f4dPCloudShader(GL);                  // 6.***
	this.create_f4d_SimpleObjectTexNormal_Shader(GL); // 7.***
};

f4d_ShadersManager.prototype.create_f4dColorSelectionShader = function(GL)
{
	var shader = new f4d_Shader();
	this.shaders_array.push(shader);
	
	shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform mat4 RefTransfMatrix;\n\
		void main(void) { //pre-built function\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
		}";
		//http://www.lighthouse3d.com/tutorials/opengl-selection-tutorial/
		
	shader.shader_fragment_source="\n\
		precision mediump float;\n\
		uniform int byteColor_r;\n\
		uniform int byteColor_g;\n\
		uniform int byteColor_b;\n\
		void main(void) {\n\
		float byteMaxValue = 255.0;\n\
			gl_FragColor = vec4(float(byteColor_r)/byteMaxValue, float(byteColor_g)/byteMaxValue, float(byteColor_b)/byteMaxValue, 1);\n\
		}";
		
		
	// https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.get_shader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
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

f4d_ShadersManager.prototype.create_f4dTextureSimpleObjectShader = function(GL)
{
	var shader = new f4d_Shader();
	this.shaders_array.push(shader);
	
	shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		attribute vec4 aVertexColor;\n\
		attribute vec2 aTextureCoord;\n\
		uniform mat4 Mmatrix;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		varying vec4 vColor;\n\
		varying vec2 vTextureCoord;\n\
		void main(void) { //pre-built function\n\
			vec4 rotatedPos = Mmatrix * vec4(position.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
			vColor=aVertexColor;\n\
			vTextureCoord = aTextureCoord;\n\
		}";
	
	shader.shader_fragment_source="\n\
		precision mediump float;\n\
		varying vec4 vColor;\n\
		varying vec2 vTextureCoord;\n\
		uniform sampler2D uSampler;\n\
		void main(void) {\n\
			gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
		}";

		
	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.get_shader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
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

f4d_ShadersManager.prototype.create_f4dTextureSimpleObjectA1Shader = function(GL)
{
	var shader = new f4d_Shader();
	this.shaders_array.push(shader);
	shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		attribute vec4 aVertexColor;\n\
		attribute vec2 aTextureCoord;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		varying vec4 vColor;\n\
		varying vec2 vTextureCoord;\n\
		void main(void) { //pre-built function\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
			vColor=aVertexColor;\n\
			vTextureCoord = aTextureCoord;\n\
		}";

	
	shader.shader_fragment_source="\n\
		precision mediump float;\n\
		varying vec4 vColor;\n\
		varying vec2 vTextureCoord;\n\
		uniform sampler2D uSampler;\n\
		void main(void) {\n\
			gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
		}";

		
	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.get_shader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
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

f4d_ShadersManager.prototype.create_f4dStandardShader = function(GL)
{
	// This shader renders the normal f4d geometry.***
	var standard_shader = new f4d_Shader();
	this.shaders_array.push(standard_shader);
	
	standard_shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform mat4 RefTransfMatrix;\n\
		attribute vec3 color; //the color of the point\n\
		varying vec3 vColor;\n\
		void main(void) { //pre-built function\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
			vColor=color;\n\
		}";


	standard_shader.shader_fragment_source="\n\
		precision lowp float;\n\
		varying vec3 vColor;\n\
		void main(void) {\n\
			gl_FragColor = vec4(vColor, 1.);\n\
		}";
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.get_shader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.get_shader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

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

f4d_ShadersManager.prototype.create_f4dCloudShader = function(GL)
{
	// This shader renders the f4d clouds.***
	var standard_shader = new f4d_Shader();
	this.shaders_array.push(standard_shader);
	
	standard_shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 cloudPosHIGH;\n\
		uniform vec3 cloudPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		attribute vec3 color; //the color of the point\n\
		varying vec3 vColor;\n\
		void main(void) { //pre-built function\n\
			vec3 objPosHigh = cloudPosHIGH;\n\
			vec3 objPosLow = cloudPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
			vColor=color;\n\
		}";


	standard_shader.shader_fragment_source="\n\
		precision lowp float;\n\
		varying vec3 vColor;\n\
		void main(void) {\n\
			gl_FragColor = vec4(vColor, 1.);\n\
		}";
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.get_shader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.get_shader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

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

f4d_ShadersManager.prototype.create_f4dBlendingCubeShader = function(GL)
{
	// This shader renders the f4d clouds.***
	var standard_shader = new f4d_Shader();
	this.shaders_array.push(standard_shader);

		standard_shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		attribute vec4 color; //the color of the point\n\
		varying vec4 vColor;\n\
		void main(void) { //pre-built function\n\
			vec3 highDifference = -encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = position.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(position.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
			vColor=color;\n\
		}";


	standard_shader.shader_fragment_source="\n\
		precision lowp float;\n\
		varying vec4 vColor;\n\
		void main(void) {\n\
			gl_FragColor = vColor;\n\
		}";
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.get_shader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.get_shader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_vertex);
	GL.attachShader(standard_shader.SHADER_PROGRAM, standard_shader.shader_fragment);
	GL.linkProgram(standard_shader.SHADER_PROGRAM);

	standard_shader._ModelViewProjectionMatrixRelToEye = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "ModelViewProjectionMatrixRelToEye");
	standard_shader._encodedCamPosHIGH = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCHigh");
	standard_shader._encodedCamPosLOW = GL.getUniformLocation(standard_shader.SHADER_PROGRAM, "encodedCameraPositionMCLow");

	standard_shader._color = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "color");
	standard_shader._position = GL.getAttribLocation(standard_shader.SHADER_PROGRAM, "position");
	
};

f4d_ShadersManager.prototype.create_f4dPCloudShader = function(GL)
{
	// This shader renders the f4d clouds.***
	var standard_shader = new f4d_Shader();
	this.shaders_array.push(standard_shader);

		standard_shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		attribute vec4 color; //the color of the point\n\
		varying vec4 vColor;\n\
		void main(void) { //pre-built function\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
			vColor=color;\n\
		}";
		


	standard_shader.shader_fragment_source="\n\
		precision lowp float;\n\
		varying vec4 vColor;\n\
		void main(void) {\n\
			gl_FragColor = vColor;\n\
		}";
		
	// Default ShaderProgram.********************************************************************
	standard_shader.SHADER_PROGRAM = GL.createProgram();
	standard_shader.shader_vertex = this.get_shader(GL, standard_shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	standard_shader.shader_fragment = this.get_shader(GL, standard_shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

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

f4d_ShadersManager.prototype.create_f4d_SimpleObjectTexNormal_Shader = function(GL)
{
	var shader = new f4d_Shader();
	this.shaders_array.push(shader);
	shader.shader_vertex_source="\n\
		attribute vec3 position;\n\
		attribute vec4 aVertexColor;\n\
		attribute vec2 aTextureCoord;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		varying vec4 vColor;\n\
		varying vec2 vTextureCoord;\n\
		attribute vec3 aVertexNormal;\n\
		varying vec3 uAmbientColor;\n\
		varying vec3 vLightWeighting;\n\
		//uniform vec3 uLightingDirection;\n\
		uniform mat3 uNMatrix;\n\
		void main(void) { //pre-built function\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
			vColor = aVertexColor;\n\
			vTextureCoord = aTextureCoord;\n\
			\n\
			vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
			uAmbientColor = vec3(0.7, 0.7, 0.7);\n\
			vec3 uLightingDirection = vec3(0.8, 0.2, -0.9);\n\
			vec3 directionalLightColor = vec3(0.4, 0.4, 0.4);\n\
			vec3 transformedNormal = uNMatrix * aVertexNormal;\n\
			float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);\n\
			vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		}";

	
	shader.shader_fragment_source="\n\
		precision mediump float;\n\
		varying vec4 vColor;\n\
		varying vec2 vTextureCoord;\n\
		uniform sampler2D uSampler;\n\
		varying vec3 vLightWeighting;\n\
		void main(void) {\n\
			vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
			gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n\
		}";

		
	//http://learningwebgl.com/blog/?p=507
	//https://gist.github.com/elnaqah/5070979
	//https://dannywoodz.wordpress.com/2014/12/14/webgl-from-scratch-directional-lighting-part-1/
	//http://learningwebgl.com/blog/?p=684 // good.***
	shader.SHADER_PROGRAM = GL.createProgram();
	shader.shader_vertex = this.get_shader(GL, shader.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(GL, shader.shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");
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
  
  
//# sourceURL=f4d_Shader.js
  
  
  
  
  
  
  
  
  