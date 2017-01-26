'use strict';

/**
 * 어떤 일을 하고 있습니까?
 * @param gl 변수
 */
var PostFxShader = function(gl) {
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
PostFxShadersManager.prototype.get_shader = function(GL, source, type, typeString) {
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
PostFxShadersManager.prototype.create_defaultShaders = function(GL) {
	this.create_renderDepthShader(GL); // 0.***
	this.create_ssaoShader(GL); // 1.***
	this.create_blurShader(GL); // 2.***
	
	// Now, create shaders for modelReference geometries.****
	this.create_renderDepthShader_ModelRef(GL); // 3.***
	this.create_ssaoShader_ModelRef(GL); // 4.***
	//this.create_blurShader_ModelRef(GL); // 5.***
	
	this.create_ColorSelectionShader_ModelRef(GL);// 5.***
	this.create_SimpleDepthShader_ModelRef(GL);// 6.***
	
	//this.create_renderDepthShader_TEST_ModelRef(GL); // 5
};

/**
 * 어떤 일을 하고 있습니까?
 * @param GL 변수
 */
PostFxShadersManager.prototype.create_blurShader = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var blur_vs_source = "\n\
		attribute vec4 position;\n\
		attribute vec2 texCoord;\n\
\n\
		uniform mat4 projectionMatrix;\n\
		uniform mat4 modelViewMatrix;  \n\
\n\
		varying vec2 vTexCoord;\n\
\n\
		void main() {	\n\
			gl_Position = projectionMatrix * modelViewMatrix * position;\n\
			vTexCoord = texCoord;\n\
		}";
	
	var blur_fs_source = "\n\
		#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
		uniform sampler2D colorTex;\n\
		uniform vec2 texelSize;\n\
		varying vec2 vTexCoord; 	 	\n\
		\n\
		void main() {\n\
			vec3 result = vec3(0.0);\n\
			for (int i = 0; i < 4; ++i) {\n\
				for (int j = 0; j < 4; ++j) {\n\
					vec2 offset = vec2(texelSize.x * float(j), texelSize.y * float(i));\n\
					result += texture2D(colorTex, vTexCoord + offset).rgb;\n\
				}\n\
			}\n\
				   \n\
			gl_FragColor.rgb = vec3(result * 0.0625); \n\
			gl_FragColor.a = 1.0;\n\
		}";
		
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, blur_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, blur_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
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
PostFxShadersManager.prototype.create_ssaoShader = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
		
	var ssao_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;  \n\
		uniform mat4 modelViewMatrix;// No used. *** \n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		\n\
		varying vec3 vNormal;\n\
		varying vec2 vTexCoord;  \n\
		\n\
		void main() {	\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
			//vNormal = (normalMatrix4 * vec4(normal, 1.0)).xyz; // Original.***\n\
			vNormal = (normalMatrix4 * vec4(-normal.x, -normal.y, -normal.z, 1.0)).xyz;\n\
			vTexCoord = texCoord;\n\
		}";
		
	var ssao_fs_source = "\n\
		#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
		uniform sampler2D depthTex;\n\
		uniform sampler2D noiseTex;  \n\
		uniform sampler2D diffuseTex;\n\
		varying vec3 vNormal;\n\
		uniform mat4 projectionMatrix;\n\
		uniform mat4 m;\n\
		uniform vec2 noiseScale;\n\
		uniform float near;\n\
		uniform float far;            \n\
		uniform float fov;\n\
		uniform float aspectRatio;    \n\
		uniform float screenWidth;    \n\
		uniform float screenHeight;    \n\
		uniform vec3 kernel[16];   \n\
		\n\
		varying vec2 vTexCoord;   \n\
		\n\
		const int kernelSize = 16;  \n\
		//const float radius = 0.01;      \n\
		const float radius = 1.0;      \n\
		\n\
		float unpackDepth(const in vec4 rgba_depth) {\n\
			//const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0); // original.***\n\
			const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
			float depth = dot(rgba_depth, bit_shift);\n\
			return depth;\n\
		}                \n\
		\n\
		vec3 getViewRay(vec2 tc) {\n\
			float hfar = 2.0 * tan(fov/2.0) * far;\n\
			float wfar = hfar * aspectRatio;    \n\
			vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
			return ray;                      \n\
		}         \n\
				   \n\
		//linear view space depth\n\
		float getDepth(vec2 coord) {                          \n\
			return unpackDepth(texture2D(depthTex, coord.xy));\n\
		}    \n\
		\n\
		void main() {          \n\
			vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
			//screenPos.y = 1.0 - screenPos.y;   \n\
			\n\
			\n\
			float linearDepth = getDepth(screenPos);          \n\
			vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
					\n\
			vec3 normal2 = normalize(vNormal);   \n\
					\n\
			vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
			vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
			vec3 bitangent = cross(normal2, tangent);\n\
			mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
			\n\
			float occlusion = 0.0;\n\
			for(int i = 0; i < kernelSize; ++i) {    	 \n\
				vec3 sample = origin + (tbn * kernel[i]) * radius; // original.***\n\
				//vec3 sample = origin + (kernel[i]) * radius; // Test.***\n\
				vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
				offset.xy /= offset.w;\n\
				offset.xy = offset.xy * 0.5 + 0.5;        \n\
				float sampleDepth = -sample.z/far;\n\
				float depthBufferValue = getDepth(offset.xy);				              \n\
				//float range_check = abs(linearDepth - depthBufferValue); // original.***\n\
				float range_check = abs(linearDepth - depthBufferValue)+radius*0.998; // test.***\n\
				if (range_check < radius && depthBufferValue <= sampleDepth) {\n\
					occlusion +=  1.0;\n\
				}\n\
				\n\
			}   \n\
			   \n\
			occlusion = 1.0 - (occlusion) / float(kernelSize);\n\
									   \n\
			vec3 lightPos = vec3(10.0, 10.0, 10.0);\n\
			vec3 L = normalize(lightPos);\n\
			float NdotL = abs(dot(normal2, L));\n\
			vec3 diffuse = vec3(NdotL);\n\
			vec3 ambient = vec3(1.0);\n\
			vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
			//gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8) * occlusion); // original.***\n\
			//gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8 * occlusion)); // test.***\n\
			gl_FragColor.rgb = vec3((textureColor.xyz*0.2 + textureColor.xyz*0.8) * occlusion); // with texture.***\n\
			gl_FragColor.a = 1.0;   \n\
		}";
		
		
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
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
PostFxShadersManager.prototype.create_renderDepthShader = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var showDepth_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		\n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 normalMatrix3;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform float near;\n\
		uniform float far;\n\
		\n\
		varying vec3 vN;\n\
		varying float depth;  \n\
		varying vec4 vVSPos;\n\
		void main() {	\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4; // original.**\n\
			vN = normalize((normalMatrix4 * vec4(normal, 1.0)).xyz);\n\
			\n\
			\n\
			//linear depth in camera space (0..far)\n\
			depth = (modelViewMatrixRelToEye * pos4).z/far; // Original.***\n\
			\n\
			vVSPos = modelViewMatrixRelToEye * pos4;\n\
		}";
		
		var showDepth_fs_source = "\n\
			#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
			uniform float near;\n\
			uniform float far;\n\
			\n\
			varying float depth;  \n\
			varying vec3 vN; \n\
			varying vec4 vVSPos;\n\
			\n\
			//from http://spidergl.org/example.php?id=6\n\
			vec4 packDepth(const in float depth) {\n\
				//const vec4 bit_shift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0); // original.***\n\
				const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
				//const vec4 bit_mask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0); // original.***\n\
				const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
				vec4 res = fract(depth * bit_shift);\n\
				res -= res.xxyz * bit_mask; // original.***\n\
				return res;  \n\
			}\n\
			\n\
			void main() {     \n\
				gl_FragData[0] = packDepth(-depth); // original.***\n\
				gl_FragData[0].r = -depth/far; // original\n\
				//gl_FragData[0].g = 1.0; // test\n\
				//gl_FragData[0].b = 1.0; // test\n\
			}";
			
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
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
PostFxShadersManager.prototype.create_ssaoShader_ModelRef = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
		
	var ssao_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 projectionMatrix;  \n\
		uniform mat4 modelViewMatrix;// No used. *** \n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 RefTransfMatrix;\n\
		uniform mat4 normalMatrix4;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform vec3 aditionalPosition;\n\
		\n\
		varying vec3 vNormal;\n\
		varying vec2 vTexCoord;  \n\
		varying vec3 uAmbientColor;\n\
		varying vec3 vLightWeighting;\n\
		\n\
		void main() {	\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
			\n\
			vec3 rotatedNormal = mat3(RefTransfMatrix) * normal;\n\
			vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
			uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
			vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
			vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
			vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
			vTexCoord = texCoord;\n\
			float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
			vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		}";
		
	var ssao_fs_source = "\n\
		#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
		uniform sampler2D depthTex;\n\
		uniform sampler2D noiseTex;  \n\
		uniform sampler2D diffuseTex;\n\
		uniform bool hasTexture;\n\
		varying vec3 vNormal;\n\
		uniform mat4 projectionMatrix;\n\
		uniform mat4 m;\n\
		uniform vec2 noiseScale;\n\
		uniform float near;\n\
		uniform float far;            \n\
		uniform float fov;\n\
		uniform float aspectRatio;    \n\
		uniform float screenWidth;    \n\
		uniform float screenHeight;    \n\
		uniform vec3 kernel[16];   \n\
		uniform vec4 vColor4Aux;\n\
		\n\
		varying vec2 vTexCoord;   \n\
		varying vec3 vLightWeighting;\n\
		\n\
		const int kernelSize = 16;  \n\
		//const float radius = 0.01;      \n\
		const float radius = 0.15;      \n\
		\n\
		float unpackDepth(const in vec4 rgba_depth) {\n\
			//const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0); // original.***\n\
			const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
			float depth = dot(rgba_depth, bit_shift);\n\
			return depth;\n\
		}                \n\
		\n\
		vec3 getViewRay(vec2 tc) {\n\
			float hfar = 2.0 * tan(fov/2.0) * far;\n\
			float wfar = hfar * aspectRatio;    \n\
			vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
			return ray;                      \n\
		}         \n\
				   \n\
		//linear view space depth\n\
		float getDepth(vec2 coord) {                          \n\
			return unpackDepth(texture2D(depthTex, coord.xy));\n\
		}    \n\
		\n\
		void main() {          \n\
			vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
			//screenPos.y = 1.0 - screenPos.y;   \n\
			\n\
			\n\
			float linearDepth = getDepth(screenPos);          \n\
			vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
					\n\
			vec3 normal2 = normalize(vNormal);   \n\
					\n\
			vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
			vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
			vec3 bitangent = cross(normal2, tangent);\n\
			mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
			\n\
			float occlusion = 0.0;\n\
			for(int i = 0; i < kernelSize; ++i) {    	 \n\
				vec3 sample = origin + (tbn * kernel[i]) * radius;\n\
				vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
				offset.xy /= offset.w;\n\
				offset.xy = offset.xy * 0.5 + 0.5;        \n\
				float sampleDepth = -sample.z/far;\n\
				float depthBufferValue = getDepth(offset.xy);				              \n\
				//float range_check = abs(linearDepth - depthBufferValue); // original.***\n\
				float range_check = abs(linearDepth - depthBufferValue)+radius*0.998; // modified.***\n\
				if (range_check < radius*1.001 && depthBufferValue <= sampleDepth) {\n\
					occlusion +=  1.0;\n\
				}\n\
				\n\
			}   \n\
			   \n\
			occlusion = 1.0 - occlusion / float(kernelSize);\n\
									   \n\
			vec3 lightPos = vec3(10.0, 10.0, 10.0);\n\
			vec3 L = normalize(lightPos);\n\
			float DiffuseFactor = dot(normal2, L);\n\
			float NdotL = abs(DiffuseFactor);\n\
			vec3 diffuse = vec3(NdotL);\n\
			vec3 ambient = vec3(1.0);\n\
			vec4 textureColor;\n\
			if(hasTexture)\n\
			{\n\
				textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
			}\n\
			else{\n\
				textureColor = vColor4Aux;\n\
			}\n\
			//gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8) * occlusion); // original.***\n\
			////gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8 * occlusion)); // test.***\n\
			gl_FragColor.rgb = vec3((textureColor.xyz*0.2 + textureColor.xyz*0.8)*vLightWeighting * occlusion); \n\
			gl_FragColor.a = 1.0;   \n\
		}";
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
	shader.shader_vertex = this.get_shader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
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
PostFxShadersManager.prototype.create_renderDepthShader_ModelRef = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
	
	var showDepth_vs_source = "\n\
		attribute vec3 position;\n\
		attribute vec3 normal;\n\
		attribute vec2 texCoord;\n\
		\n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 RefTransfMatrix;\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform float near;\n\
		uniform float far;\n\
		uniform vec3 aditionalPosition;\n\
		\n\
		varying float depth;  \n\
		void main() {	\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4; // original.**\n\
			\n\
			\n\
			//linear depth in camera space (0..far)\n\
			depth = (modelViewMatrixRelToEye * pos4).z/far; // Original.***\n\
		}";
		
		var showDepth_fs_source = "\n\
			#ifdef GL_ES\n\
			precision highp float;\n\
			#endif\n\
			uniform float near;\n\
			uniform float far;\n\
			\n\
			varying float depth;  \n\
			\n\
			vec4 packDepth(const in float depth) {\n\
				//const vec4 bit_shift = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0); // original.***\n\
				const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
				//const vec4 bit_mask  = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0); // original.***\n\
				const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
				vec4 res = fract(depth * bit_shift);\n\
				res -= res.xxyz * bit_mask; // original.***\n\
				return res;  \n\
			}\n\
			\n\
			void main() {     \n\
				gl_FragData[0] = packDepth(-depth); // original.***\n\
				//gl_FragData[0].r = -depth/far; // original\n\
				//gl_FragData[0].r = -depth; // test\n\
				//gl_FragData[0].g = -depth; // test\n\
				//gl_FragData[0].b = -depth; // test\n\
			}";
			
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, showDepth_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, showDepth_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
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
PostFxShadersManager.prototype.create_ColorSelectionShader_ModelRef = function(gl) {
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
		
	var ssao_vs_source = "\n\
		attribute vec3 position;\n\
		\n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 RefTransfMatrix;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		uniform vec3 aditionalPosition;\n\
		\n\
		void main() {	\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		}";
		
	var ssao_fs_source = "\n\
			precision highp float;\n\
		uniform vec4 vColor4Aux;\n\
		\n\
		void main() {          \n\
			gl_FragColor = vColor4Aux;\n\
		}";
		
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
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
PostFxShadersManager.prototype.create_SimpleDepthShader_ModelRef = function(gl) {
	// no used.!!!!!!!!!!!!!!!
	var shader = new PostFxShader(this.gl);
	this.pFx_shaders_array.push(shader);
		
	var ssao_vs_source = "\n\
		attribute vec3 position;\n\
		\n\
		uniform mat4 modelViewMatrixRelToEye; \n\
		uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
		uniform mat4 RefTransfMatrix;\n\
		uniform vec3 buildingPosHIGH;\n\
		uniform vec3 buildingPosLOW;\n\
		uniform vec3 encodedCameraPositionMCHigh;\n\
		uniform vec3 encodedCameraPositionMCLow;\n\
		varying float zDepth;\n\
		uniform float far;\n\
		\n\
		void main() {	\n\
			vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
			vec3 objPosHigh = buildingPosHIGH;\n\
			vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
			vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
			vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
			vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
			gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
			zDepth = (modelViewMatrixRelToEye * pos4).z/far; // Original.***\n\
		}";
		
	var ssao_fs_source = "\n\
			precision highp float;\n\
			const vec4 bitEnc = vec4(1.0,255.0,65025.0,16581375.0);\n\
			const vec4 bitDec = 1.0/bitEnc;\n\
			vec4 EncodeFloatRGBA (float v) {\n\
				vec4 enc = bitEnc * v;\n\
				enc = fract(enc);\n\
				enc -= enc.yzww * vec2(1.0/255.0, 0.0).xxxy;\n\
				return enc;\n\
			}\n\
		varying float zDepth;\n\
		\n\
		void main() {          \n\
		vec4 encodedZ = EncodeFloatRGBA(zDepth);\n\
			gl_FragData[0] = encodedZ;\n\
		}";
		
		
	shader.program = gl.createProgram();
	shader.shader_vertex = this.get_shader(gl, ssao_vs_source, gl.VERTEX_SHADER, "VERTEX");
	shader.shader_fragment = this.get_shader(gl, ssao_fs_source, gl.FRAGMENT_SHADER, "FRAGMENT");
	
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
