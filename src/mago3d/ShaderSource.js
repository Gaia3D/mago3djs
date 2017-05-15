'use strict';

/**
 * text, json file 등으로 처리 할 경우 불필요한 파일 로딩에 따른 성능 저하가 우려 되서 간단하게 class 파일로 처리함
 */
var ShaderSource = ShaderSource || {};

// 어떤 용도
ShaderSource.colorShaderVertexSource = "\n\
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

//어떤 용도
ShaderSource.colorShaderFragmentSource = "\n\
	precision mediump float;\n\
	uniform int byteColor_r;\n\
	uniform int byteColor_g;\n\
	uniform int byteColor_b;\n\
	void main(void) {\n\
	float byteMaxValue = 255.0;\n\
		gl_FragColor = vec4(float(byteColor_r)/byteMaxValue, float(byteColor_g)/byteMaxValue, float(byteColor_b)/byteMaxValue, 1);\n\
	}";

//어떤 용도
ShaderSource.textureShaderVertexSource = "\n\
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

//어떤 용도
ShaderSource.textureShaderFragmentSource = "\n\
	precision mediump float;\n\
	varying vec4 vColor;\n\
	varying vec2 vTextureCoord;\n\
	uniform sampler2D uSampler;\n\
	void main(void) {\n\
		gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
	}";

	//**************************************************************************************************************************
//어떤 용도
ShaderSource.textureA1ShaderVertexSource = "\n\
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

//어떤 용도
ShaderSource.textureA1ShaderFragmentSource = "\n\
	precision mediump float;\n\
	varying vec4 vColor;\n\
	varying vec2 vTextureCoord;\n\
	uniform sampler2D uSampler;\n\
	void main(void) {\n\
		gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
	}";

	//**************************************************************************************************************************
//어떤 용도
ShaderSource.standardShaderVertexSource = "\n\
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


//어떤 용도
ShaderSource.standardShaderFragmentSource = "\n\
	precision lowp float;\n\
	varying vec3 vColor;\n\
	void main(void) {\n\
		gl_FragColor = vec4(vColor, 1.);\n\
	}";

	//**************************************************************************************************************************
//어떤 용도
ShaderSource.cloudShaderVertexSource = "\n\
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

//어떤 용도
ShaderSource.cloudShaderFragmentSource = "\n\
	precision lowp float;\n\
	varying vec3 vColor;\n\
	void main(void) {\n\
		gl_FragColor = vec4(vColor, 1.);\n\
	}";

	//**************************************************************************************************************************
//어떤 용도
ShaderSource.blendingCubeShaderVertexSource = "\n\
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

//어떤 용도
ShaderSource.blendingCubeShaderFragmentSource = "\n\
	precision lowp float;\n\
	varying vec4 vColor;\n\
	void main(void) {\n\
		gl_FragColor = vColor;\n\
	}";

	//**************************************************************************************************************************
//어떤 용도
ShaderSource.pCloudShaderVertexSource = "\n\
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

//어떤 용도
ShaderSource.pCloundShaderFragmentSource = "\n\
	precision lowp float;\n\
	varying vec4 vColor;\n\
	void main(void) {\n\
		gl_FragColor = vColor;\n\
	}";

	//**************************************************************************************************************************
//어떤 용도
ShaderSource.texNormalShaderVertexSource = "\n\
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

//어떤 용도
ShaderSource.texNormalShaderFragmentSource = "\n\
	precision mediump float;\n\
	varying vec4 vColor;\n\
	varying vec2 vTextureCoord;\n\
	uniform sampler2D uSampler;\n\
	varying vec3 vLightWeighting;\n\
	void main(void) {\n\
		vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
		gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n\
	}";

	//****************************************************************************************************************************************
//어떤 용도
ShaderSource.blurVsSource = "\n\
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

//어떤 용도
ShaderSource.blurFsSource = "\n\
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

	//****************************************************************************************************************************************
//어떤 용도
ShaderSource.ssaoVsSource = "\n\
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

//어떤 용도
ShaderSource.ssaoFsSource = "\n\
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
		//vec3 normal2 = normalize(vNormal);   \n\
		vec3 normal2 = vNormal;   \n\
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

	//****************************************************************************************************************************************
//어떤 용도
ShaderSource.showDepthVsSource = "\n\
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

//어떤 용도
ShaderSource.showDepthFsSource = "\n\
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

	//****************************************************************************************************************************************
//어떤 용도
// idx = 4.***
ShaderSource.modelRefSsaoVsSource = "\n\
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
	varying vec3 vertexPos;\n\
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
		vertexPos = vec3(modelViewMatrixRelToEye * pos4);\n\
		//vertexPos = gl_Position.xyz;\n\
		vec3 rotatedNormal = mat3(RefTransfMatrix) * normal;\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8);\n\
		vec3 uLightingDirection = vec3(0.7, 0.7, 0.7);\n\
		vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		if(vNormal.z < 0.0)\n\
		{\n\
			//vNormal.x *= -1.0;\n\
			//vNormal.y *= -1.0;\n\
			//vNormal.z *= -1.0;\n\
		}\n\
		vTexCoord = texCoord;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
	}";

//어떤 용도
// test.***
ShaderSource.modelRefSsaoFsSource = "\n\
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
	varying vec3 ambientColor;\n\
	varying vec3 diffuseColor;\n\
	varying vec3 specularColor;\n\
	varying vec3 vertexPos;\n\
	\n\
	const int kernelSize = 16;  \n\
	//const float radius = 0.01;      \n\
	const float radius = 0.15;      \n\
	\n\
	const float ambientReflectionCoef = 0.5;  \n\
	const float diffuseReflectionCoef = 1.0;  \n\
	const float specularReflectionCoef = 1.0; \n\
	const float shininessVal = 5.0; \n\
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
		//vec3 normal2 = normalize(vNormal);   \n\
		vec3 normal2 = vNormal;\n\
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
		vec3 lightPos = vec3(0.0, 0.0, 20.0);\n\
		vec3 L = normalize(lightPos - vertexPos);\n\
		//vec3 L = normalize(lightPos);\n\
		float lambertian = max(dot(normal2, L), 0.0);\n\
		float specular = 0.0;\n\
		if(lambertian > 0.0) {\n\
			vec3 R = reflect(-L, normal2);      // Reflected light vector\n\
			vec3 V = normalize(-vertexPos); // Vector to viewer\n\
			\n\
			// Compute the specular term\n\
			float specAngle = max(dot(R, V), 0.0);\n\
			specular = pow(specAngle, shininessVal);\n\
		}\n\
		//float DiffuseFactor = dot(normal2, L);\n\
		//float NdotL = abs(DiffuseFactor);\n\
		//vec3 diffuse = vec3(NdotL);\n\
		//vec3 ambient = vec3(1.0);\n\
			//if(!gl_FrontFacing)\n\
			//{\n\
			//	discard;\n\
			//}\n\
		vec4 textureColor;\n\
		if(hasTexture)\n\
		{\n\
			textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
		}\n\
		else{\n\
			textureColor = vColor4Aux;\n\
		}\n\
		vec3 specularColor = vec3(0.7);\n\
		vec3 ambientColor = vec3(textureColor.x * 0.4, textureColor.y * 0.4, textureColor.z * 0.4);\n\
		gl_FragColor = vec4((ambientReflectionCoef * ambientColor + diffuseReflectionCoef * lambertian * textureColor.xyz + specularReflectionCoef * specular * specularColor)*vLightWeighting * occlusion, 1.0);\n\
		//gl_FragColor.rgb = vec3((textureColor.xyz*0.2 + textureColor.xyz*0.8)*vLightWeighting * occlusion); \n\
		//gl_FragColor.a = 1.0;   \n\
	}";
	/*
	// original.***
ShaderSource.modelRefSsaoFsSource = "\n\
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
	varying vec3 ambientColor;\n\
	varying vec3 diffuseColor;\n\
	varying vec3 specularColor;\n\
	\n\
	const int kernelSize = 16;  \n\
	//const float radius = 0.01;      \n\
	const float radius = 0.15;      \n\
	\n\
	const float ambientReflectionCoef = 1.0;  \n\
	const float diffuseReflectionCoef = 1.0;  \n\
	const float specularReflectionCoef = 1.0; \n\
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
		//vec3 normal2 = normalize(vNormal);   \n\
		vec3 normal2 = vNormal;   \n\
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
		vec3 specular = vec3(1.0);\n\
		vec4 textureColor;\n\
		if(hasTexture)\n\
		{\n\
			textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
		}\n\
		else{\n\
			textureColor = vColor4Aux;\n\
		}\n\
		gl_FragColor.rgb = vec3((textureColor.xyz*0.2 + textureColor.xyz*0.8)*vLightWeighting * occlusion); \n\
		gl_FragColor.a = 1.0;   \n\
	}";
*/
	//****************************************************************************************************************************************

//어떤 용도
ShaderSource.renderShowDepthVsSource = "\n\
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

//어떤 용도
ShaderSource.renderShowDepthFsSource = "\n\
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

	//*************************************************************************************************************************
//어떤 용도
ShaderSource.colorSelectionSsaoVsSource = "\n\
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

ShaderSource.colorSelectionSsaoFsSource = "\n\
		precision highp float;\n\
	uniform vec4 vColor4Aux;\n\
	\n\
	void main() {          \n\
		gl_FragColor = vColor4Aux;\n\
	}";

	//*************************************************************************************************************************
//어떤 용도
ShaderSource.simpleDepthSsaoVsSource = "\n\
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

//어떤 용도
ShaderSource.simpleDepthSsaoFsSource = "\n\
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

// LOD Building Shaders.****************************************************************
// LOD Building Shaders.****************************************************************
// LOD Building Shaders.****************************************************************

	//어떤 용도
ShaderSource.LodBuildingSsaoVsSource = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;// No used. *** \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 normalMatrix4;\n\
	uniform mat4 buildingRotMatrix;  \n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec4 oneColor4;\n\
	uniform bool bUse1Color;\n\
	\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec4 vcolor4;\n\
	\n\
	void main() {	\n\
		vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		\n\
		vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
		vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
		vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		if(bUse1Color)\n\
		{\n\
			vcolor4 = oneColor4;\n\
		}\n\
		else\n\
		{\n\
			vcolor4 = color4;\n\
		}\n\
	}";


	//어떤 용도
ShaderSource.LodBuildingSsaoFsSource = "\n\
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
	varying vec4 vcolor4;\n\
	\n\
	const int kernelSize = 16;  \n\
	//const float radius = 0.01;      \n\
	//const float radius = 0.15;      \n\
	const float radius = 0.5;      \n\
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
		//vec3 normal2 = normalize(vNormal);   \n\
		vec3 normal2 = vNormal;   \n\
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
		textureColor = vcolor4;\n\
		////gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8) * occlusion); // original.***\n\
		gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
		//gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting); \n\
		//gl_FragColor.rgb = textureColor.xyz; \n\
		gl_FragColor.a = 1.0;   \n\
	}";

// LOD Building Depth Shader.************************************************************************************************
// LOD Building Depth Shader.************************************************************************************************
// LOD Building Depth Shader.************************************************************************************************

	//어떤 용도
ShaderSource.lodBuildingDepthVsSource = "\n\
	attribute vec3 position;\n\
	\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 buildingRotMatrix;  \n\
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
		vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
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


	//어떤 용도
ShaderSource.lodBuildingDepthFsSource = "\n\
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


// Lego Shaders.************************************************************************************************************************************************
// Lego Shaders.************************************************************************************************************************************************
// Lego Shaders.************************************************************************************************************************************************

	//어떤 용도
ShaderSource.LegoSsaoVsSource = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec4 color4;\n\
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
	varying vec4 vcolor4;\n\
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
		//vTexCoord = texCoord;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		vcolor4 = color4;\n\
	}";


	//어떤 용도
ShaderSource.LegoSsaoFsSource = "\n\
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
	varying vec4 vcolor4;\n\
	\n\
	const int kernelSize = 16;  \n\
	//const float radius = 0.01;      \n\
	//const float radius = 0.15;      \n\
	const float radius = 0.5;      \n\
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
		//vec3 normal2 = normalize(vNormal);   \n\
		vec3 normal2 = vNormal;   \n\
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
		textureColor = vcolor4;\n\
		////gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8) * occlusion); // original.***\n\
		gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
		//gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting); \n\
		//gl_FragColor.rgb = textureColor.xyz; \n\
		gl_FragColor.a = 1.0;   \n\
	}";

// Lego Depth Shader.************************************************************************************************
// Lego Depth Shader.************************************************************************************************
// Lego Depth Shader.************************************************************************************************

	//어떤 용도
ShaderSource.LegoDepthVsSource = "\n\
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


	//어떤 용도
ShaderSource.LegoDepthFsSource = "\n\
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





// box Depth Shader.************************************************************************************************
// box Depth Shader.************************************************************************************************
// box Depth Shader.************************************************************************************************

	//어떤 용도
ShaderSource.boxDepthVsSource = "\n\
	attribute vec3 position;\n\
	\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 buildingRotMatrix;  \n\
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
		vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
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


	//어떤 용도
ShaderSource.boxDepthFsSource = "\n\
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


// box Shaders.********************************************************************************************************************************
// box Shaders.********************************************************************************************************************************
// box Shaders.********************************************************************************************************************************

	//어떤 용도
ShaderSource.boxSsaoVsSource = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;// No used. *** \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 normalMatrix4;\n\
	uniform mat4 buildingRotMatrix;  \n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec4 oneColor4;\n\
	uniform bool bUse1Color;\n\
	uniform vec3 scale;\n\
	uniform bool bScale;\n\
	\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec4 vcolor4;\n\
	\n\
	void main() {	\n\
		vec4 position2 = vec4(position.xyz, 1.0);\n\
		if(bScale)\n\
		{\n\
			position2.x *= scale.x;\n\
			position2.y *= scale.y;\n\
			position2.z *= scale.z;\n\
		}\n\
		vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz + aditionalPosition.xyz, 1.0);\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		\n\
		vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
		vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
		vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		if(bUse1Color)\n\
		{\n\
			vcolor4 = oneColor4;\n\
		}\n\
		else\n\
		{\n\
			vcolor4 = color4;\n\
		}\n\
	}";


	//어떤 용도
ShaderSource.boxSsaoFsSource = "\n\
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
	varying vec4 vcolor4;\n\
	\n\
	const int kernelSize = 16;  \n\
	//const float radius = 0.01;      \n\
	//const float radius = 0.15;      \n\
	const float radius = 0.5;      \n\
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
		//vec3 normal2 = normalize(vNormal);   \n\
		vec3 normal2 = vNormal;   \n\
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
		textureColor = vcolor4;\n\
		////gl_FragColor.rgb = vec3((diffuse*0.2 + ambient*0.8) * occlusion); // original.***\n\
		gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
		//gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting); \n\
		//gl_FragColor.rgb = textureColor.xyz; \n\
		gl_FragColor.a = 1.0;   \n\
	}";
