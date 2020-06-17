'use strict';
var ShaderSource = {};
ShaderSource.atmosphereFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D diffuseTex;\n\
uniform bool textureFlipYAxis;\n\
uniform bool bIsMakingDepth;\n\
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
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying vec3 vertexPos;\n\
varying float depthValue;\n\
varying vec3 v3Pos;\n\
varying vec3 camPos;\n\
varying vec4 vcolor4;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
uniform float externalAlpha;\n\
const float equatorialRadius = 6378137.0;\n\
const float polarRadius = 6356752.3142;\n\
const float PI = 3.1415926535897932384626433832795;\n\
const float PI_2 = 1.57079632679489661923; \n\
const float PI_4 = 0.785398163397448309616;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
} \n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}               \n\
\n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{  \n\
	if(bIsMakingDepth)\n\
	{\n\
		gl_FragColor = packDepth(-depthValue);\n\
	}\n\
	else{\n\
		vec4 textureColor = oneColor4;\n\
		if(colorType == 0)\n\
		{\n\
			textureColor = oneColor4;\n\
			\n\
			if(textureColor.w == 0.0)\n\
			{\n\
				discard;\n\
			}\n\
		}\n\
		else if(colorType == 2)\n\
		{\n\
			//if(textureFlipYAxis)\n\
			//{\n\
			//	textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
			//}\n\
			//else{\n\
			//	textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
			//}\n\
			\n\
			if(textureColor.w == 0.0)\n\
			{\n\
				discard;\n\
			}\n\
		}\n\
		else{\n\
			textureColor = oneColor4;\n\
		}\n\
		\n\
		gl_FragColor = vcolor4; \n\
	}\n\
}";
ShaderSource.atmosphereVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec4 color4;\n\
attribute vec2 texCoord;\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrix;\n\
uniform mat4 normalMatrix4;\n\
uniform mat4 buildingRotMatrix;  \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec4 oneColor4;\n\
uniform bool bUse1Color;\n\
uniform bool hasTexture;\n\
uniform bool bIsMakingDepth;\n\
uniform float near;\n\
uniform float far;\n\
\n\
varying vec3 vNormal;\n\
varying vec3 v3Pos;\n\
varying vec2 vTexCoord;   \n\
varying vec3 uAmbientColor;\n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
varying vec3 vertexPos;\n\
varying float depthValue;\n\
varying vec3 camPos;\n\
\n\
const float equatorialRadius = 6378137.0;\n\
const float polarRadius = 6356752.3142;\n\
const float PI = 3.1415926535897932384626433832795;\n\
const float PI_2 = 1.57079632679489661923; \n\
const float PI_4 = 0.785398163397448309616;\n\
\n\
void main()\n\
{	\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	vNormal = (normalMatrix4 * vec4(normal, 1.0)).xyz;\n\
\n\
	if(bIsMakingDepth)\n\
	{\n\
		depthValue = (modelViewMatrixRelToEye * pos4).z/far;\n\
	}\n\
	else\n\
	{\n\
		vTexCoord = texCoord;\n\
	}\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	camPos = encodedCameraPositionMCHigh.xyz + encodedCameraPositionMCLow.xyz;\n\
	v3Pos = vec3((modelViewMatrixRelToEye * pos4).xyz);\n\
\n\
	// Calculate color.\n\
	float distToCam = length(vec3(v3Pos));\n\
	vec3 camDir = normalize(vec3(v3Pos.x, v3Pos.y, v3Pos.z));\n\
	vec3 normal = vNormal;\n\
	float angRad = acos(dot(camDir, normal));\n\
	float angDeg = angRad*180.0/PI;\n\
	/*\n\
	if(angDeg > 130.0)\n\
		textureColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
	else if(angDeg > 120.0)\n\
		textureColor = vec4(0.0, 1.0, 0.0, 1.0);\n\
	else if(angDeg > 110.0)\n\
		textureColor = vec4(0.0, 0.0, 1.0, 1.0);\n\
	else if(angDeg > 100.0)\n\
		textureColor = vec4(1.0, 1.0, 0.0, 1.0);\n\
	else if(angDeg > 90.0)\n\
		textureColor = vec4(1.0, 0.0, 1.0, 1.0);\n\
		*/\n\
		\n\
	//textureColor = vec4(vNormal, 1.0);\n\
\n\
	//float maxAngDeg = 100.5;\n\
	float maxAngDeg = 101.2;\n\
	float minAngDeg = 90.0;\n\
\n\
	float A = 1.0/(maxAngDeg-minAngDeg);\n\
	float B = -A*minAngDeg;\n\
	float alphaReal = A*angDeg+B;\n\
	float alpha2 = alphaReal*alphaReal;\n\
	float alpha = alpha2*alpha2;\n\
	if(alpha < 0.0 )\n\
	alpha = 0.0;\n\
	else if(alpha > 2.0 )\n\
	alpha = 2.0;\n\
	\n\
	float alphaPlusPerDist = 4.0*(distToCam/equatorialRadius);\n\
	if(alphaPlusPerDist > 1.0)\n\
	alphaPlusPerDist = 1.0;\n\
\n\
	float extra = (1.0-alpha);\n\
	if(extra < 0.0)\n\
	extra = 0.0;\n\
\n\
	float extraPerDist = (1.0-alphaPlusPerDist); // near -> more blue.\n\
\n\
	alpha *= alphaPlusPerDist;\n\
	vcolor4 = vec4(alpha*0.75, alpha*0.88 + extra*0.4 + extraPerDist*0.1, alpha + extra*2.5 + extraPerDist*0.8, alpha);\n\
}";
ShaderSource.BlendingCubeFS = "	precision lowp float;\n\
	varying vec4 vColor;\n\
\n\
	void main()\n\
    {\n\
		gl_FragColor = vColor;\n\
	}";
ShaderSource.BlendingCubeVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
attribute vec4 color;\n\
varying vec4 vColor;\n\
\n\
void main()\n\
{\n\
    vec3 highDifference = -encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = position.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(position.xyz, 1.0);\n\
\n\
    vColor=color;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
}";
ShaderSource.BlurFS = "#ifdef GL_ES\n\
    precision highp float;\n\
    #endif\n\
uniform sampler2D colorTex;\n\
uniform vec2 texelSize;\n\
varying vec2 vTexCoord; 	 	\n\
\n\
void main()\n\
{\n\
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
}\n\
";
ShaderSource.BlurVS = "attribute vec4 position;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;  \n\
\n\
varying vec2 vTexCoord;\n\
\n\
void main()\n\
{	\n\
    vTexCoord = texCoord;\n\
    \n\
    gl_Position = projectionMatrix * modelViewMatrix * position;\n\
}\n\
";
ShaderSource.BoxSsaoFS = "#ifdef GL_ES\n\
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
uniform bool bUseNormal;\n\
\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
\n\
const int kernelSize = 16;  \n\
const float radius = 0.5;      \n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}                \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{                          \n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{ \n\
	vec4 textureColor;\n\
	textureColor = vcolor4;  \n\
	if(bUseNormal)\n\
    {\n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
		float linearDepth = getDepth(screenPos);          \n\
		vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
		vec3 normal2 = vNormal;   \n\
				\n\
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
		vec3 bitangent = cross(normal2, tangent);\n\
		mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
		\n\
		float occlusion = 0.0;\n\
		for(int i = 0; i < kernelSize; ++i)\n\
		{    	 \n\
			vec3 sample = origin + (tbn * kernel[i]) * radius;\n\
			vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
			offset.xy /= offset.w;\n\
			offset.xy = offset.xy * 0.5 + 0.5;        \n\
			float sampleDepth = -sample.z/far;\n\
			float depthBufferValue = getDepth(offset.xy);				              \n\
			float range_check = abs(linearDepth - depthBufferValue)+radius*0.998;\n\
			if (range_check < radius*1.001 && depthBufferValue <= sampleDepth)\n\
			{\n\
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
		gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
		gl_FragColor.a = 1.0; \n\
	}\n\
	else\n\
	{\n\
		gl_FragColor.rgb = vec3(textureColor.xyz); \n\
		gl_FragColor.a = 1.0; \n\
	}	\n\
}\n\
";
ShaderSource.BoxSsaoVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
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
uniform bool bUseNormal;\n\
uniform vec3 scale;\n\
uniform bool bScale;\n\
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;  \n\
varying vec3 uAmbientColor;\n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
\n\
void main()\n\
{	\n\
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
    if(bUseNormal)\n\
    {\n\
		vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
		vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
		vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
	}\n\
    if(bUse1Color)\n\
    {\n\
        vcolor4 = oneColor4;\n\
    }\n\
    else\n\
    {\n\
        vcolor4 = color4;\n\
    }\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.CloudFS = "precision lowp float;\n\
varying vec3 vColor;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = vec4(vColor, 1.);\n\
}";
ShaderSource.CloudVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 cloudPosHIGH;\n\
uniform vec3 cloudPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
attribute vec3 color;\n\
varying vec3 vColor;\n\
\n\
void main()\n\
{\n\
    vec3 objPosHigh = cloudPosHIGH;\n\
    vec3 objPosLow = cloudPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    vColor=color;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
}";
ShaderSource.ColorFS = "precision mediump float;\n\
uniform int byteColor_r;\n\
uniform int byteColor_g;\n\
uniform int byteColor_b;\n\
\n\
void main()\n\
{\n\
    float byteMaxValue = 255.0;\n\
\n\
    gl_FragColor = vec4(float(byteColor_r)/byteMaxValue, float(byteColor_g)/byteMaxValue, float(byteColor_b)/byteMaxValue, 1);\n\
}\n\
";
ShaderSource.ColorSelectionSsaoFS = "precision highp float;\n\
uniform vec4 oneColor4;\n\
\n\
void main()\n\
{          \n\
    gl_FragColor = oneColor4;\n\
}\n\
";
ShaderSource.ColorSelectionSsaoVS = "attribute vec3 position;\n\
\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 RefTransfMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
void main()\n\
{\n\
    vec4 rotatedPos;\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    gl_PointSize = 10.0;\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.ColorVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform mat4 RefTransfMatrix;\n\
\n\
void main()\n\
{\n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
}\n\
";
ShaderSource.draw_frag = "precision mediump float;\n\
\n\
uniform sampler2D u_wind;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform bool u_colorScale;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
void main() {\n\
	vec2 windMapTexCoord = v_particle_pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	\n\
	if(u_colorScale)\n\
	{\n\
		speed_t *= 1.5;\n\
		if(speed_t > 1.0)speed_t = 1.0;\n\
		float b = 1.0 - speed_t;\n\
		float g;\n\
		if(speed_t > 0.5)\n\
		{\n\
			g = 2.0-2.0*speed_t;\n\
		}\n\
		else{\n\
			g = 2.0*speed_t;\n\
		}\n\
		float r = speed_t;\n\
		gl_FragColor = vec4(r,g,b,1.0);\n\
	}\n\
	else{\n\
		float intensity = speed_t*3.0;\n\
		if(intensity > 1.0)\n\
			intensity = 1.0;\n\
		gl_FragColor = vec4(intensity,intensity,intensity,1.0);\n\
	}\n\
}\n\
";
ShaderSource.draw_frag3D = "precision highp float;\n\
\n\
uniform sampler2D u_wind;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform bool u_colorScale;\n\
uniform float u_tailAlpha;\n\
uniform float u_externAlpha;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	float minHeight_rainbow = 0.0;\n\
	float maxHeight_rainbow = 1.0;\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
void main() {\n\
	vec2 windMapTexCoord = v_particle_pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	\n\
	if(u_colorScale)\n\
	{\n\
		speed_t *= 1.5;\n\
		if(speed_t > 1.0)speed_t = 1.0;\n\
		float b = 1.0 - speed_t;\n\
		float g;\n\
		if(speed_t > 0.5)\n\
		{\n\
			g = 2.0-2.0*speed_t;\n\
		}\n\
		else{\n\
			g = 2.0*speed_t;\n\
		}\n\
		vec3 col3 = getRainbowColor_byHeight(speed_t);\n\
		float r = speed_t;\n\
		gl_FragColor = vec4(col3.x, col3.y, col3.z ,u_tailAlpha*u_externAlpha);\n\
	}\n\
	else{\n\
		float intensity = speed_t*3.0;\n\
		if(intensity > 1.0)\n\
			intensity = 1.0;\n\
		gl_FragColor = vec4(intensity,intensity,intensity,u_tailAlpha*u_externAlpha);\n\
	}\n\
}";
ShaderSource.draw_vert = "precision mediump float;\n\
\n\
attribute float a_index;\n\
\n\
uniform sampler2D u_particles;\n\
uniform float u_particles_res;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_particles, vec2(\n\
        fract(a_index / u_particles_res),\n\
        floor(a_index / u_particles_res) / u_particles_res));\n\
\n\
    // decode current particle position from the pixel's RGBA value\n\
    v_particle_pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a);\n\
\n\
    gl_PointSize = 1.0;\n\
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);\n\
}\n\
";
ShaderSource.draw_vert3D = "precision highp float;\n\
\n\
// This shader draws windParticles in 3d directly from positions on u_particles image.***\n\
attribute float a_index;\n\
\n\
uniform sampler2D u_particles;\n\
uniform float u_particles_res;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 ModelViewProjectionMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 u_camPosWC;\n\
uniform vec3 u_geoCoordRadiansMax;\n\
uniform vec3 u_geoCoordRadiansMin;\n\
uniform float pendentPointSize;\n\
uniform float u_tailAlpha;\n\
uniform float u_layerAltitude;\n\
\n\
varying vec2 v_particle_pos;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
vec2 splitValue(float value)\n\
{\n\
	float doubleHigh;\n\
	vec2 resultSplitValue;\n\
	if (value >= 0.0) \n\
	{\n\
		doubleHigh = floor(value / 65536.0) * 65536.0; //unsigned short max\n\
		resultSplitValue.x = doubleHigh;\n\
		resultSplitValue.y = value - doubleHigh;\n\
	}\n\
	else \n\
	{\n\
		doubleHigh = floor(-value / 65536.0) * 65536.0;\n\
		resultSplitValue.x = -doubleHigh;\n\
		resultSplitValue.y = value + doubleHigh;\n\
	}\n\
	\n\
	return resultSplitValue;\n\
}\n\
	\n\
vec3 geographicToWorldCoord(float lonRad, float latRad, float alt)\n\
{\n\
	// defined in the LINZ standard LINZS25000 (Standard for New Zealand Geodetic Datum 2000)\n\
	// https://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum\n\
	// a = semi-major axis.\n\
	// e2 = firstEccentricitySquared.\n\
	// v = a / sqrt(1 - e2 * sin2(lat)).\n\
	// x = (v+h)*cos(lat)*cos(lon).\n\
	// y = (v+h)*cos(lat)*sin(lon).\n\
	// z = [v*(1-e2)+h]*sin(lat).\n\
	float equatorialRadius = 6378137.0; // meters.\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float cosLon = cos(lonRad);\n\
	float cosLat = cos(latRad);\n\
	float sinLon = sin(lonRad);\n\
	float sinLat = sin(latRad);\n\
	float a = equatorialRadius;\n\
	float e2 = firstEccentricitySquared;\n\
	float v = a/sqrt(1.0 - e2 * sinLat * sinLat);\n\
	float h = alt;\n\
	\n\
	float x = (v+h)*cosLat*cosLon;\n\
	float y = (v+h)*cosLat*sinLon;\n\
	float z = (v*(1.0-e2)+h)*sinLat;\n\
	\n\
	\n\
	vec3 resultCartesian = vec3(x, y, z);\n\
	\n\
	return resultCartesian;\n\
}\n\
\n\
void main() {\n\
	\n\
    vec4 color = texture2D(u_particles, vec2(\n\
        fract(a_index / u_particles_res),\n\
        floor(a_index / u_particles_res) / u_particles_res));\n\
\n\
    // decode current particle position from the pixel's RGBA value\n\
    v_particle_pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a);\n\
\n\
	// Now, must calculate geographic coords of the pos2d.***\n\
	float altitude = u_layerAltitude;\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
	float longitudeRad = -minLonRad + v_particle_pos.x * lonRadRange;\n\
	float latitudeRad = maxLatRad - v_particle_pos.y * latRadRange;\n\
	\n\
	// Now, calculate worldPosition of the geographicCoords (lon, lat, alt).***\n\
	//vec3 posWC = geographicToWorldCoord(longitudeRad, latitudeRad, altitude);\n\
	//vec4 posCC = vec4((posWC - encodedCameraPositionMCHigh) - encodedCameraPositionMCLow, 1.0);\n\
	\n\
	// Alternative.\n\
	\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	float distortion = cos((minLatRad + v_particle_pos.y * latRadRange ));\n\
	float xOffset = (v_particle_pos.x - 0.5)*distortion * lonRadRange * radius;\n\
	float yOffset = (0.5 - v_particle_pos.y) * latRadRange * radius;\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);\n\
	\n\
	\n\
	vec4 posWC = vec4((rotatedPos.xyz+buildingPosLOW) +( buildingPosHIGH ), 1.0);\n\
	vec4 posCC = vec4((rotatedPos.xyz+buildingPosLOW- encodedCameraPositionMCLow) +( buildingPosHIGH- encodedCameraPositionMCHigh), 1.0);\n\
	\n\
	// Now calculate the position on camCoord.***\n\
	//gl_Position = ModelViewProjectionMatrix * posWC;\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * posCC;\n\
	//gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);\n\
	//gl_Position = vec4(v_particle_pos.x, v_particle_pos.y, 0, 1);\n\
	\n\
	// Now calculate the point size.\n\
	float dist = distance(vec4(u_camPosWC.xyz, 1.0), vec4(posWC.xyz, 1.0));\n\
	gl_PointSize = (1.0 + pendentPointSize/(dist))*u_tailAlpha; \n\
	\n\
	if(gl_PointSize > 10.0)\n\
	gl_PointSize = 10.0;\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.filterSilhouetteFS = "precision mediump float;\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform mat4 projectionMatrix;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform vec3 kernel[16];   \n\
\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform bool bApplySsao;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}                \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{\n\
	float occlusion = 0.0;\n\
	vec3 normal2 = vec3(0.0, 0.0, 1.0);\n\
	float radiusAux = radius * 5.0;\n\
	if(bApplySsao)\n\
	{          \n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
		float linearDepth = getDepth(screenPos); \n\
		vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
\n\
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
		vec3 bitangent = cross(normal2, tangent);\n\
		mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
		\n\
		for(int i = 0; i < kernelSize; ++i)\n\
		{    	 \n\
			//vec3 sample = origin + (tbn * kernel[i]) * radiusAux;\n\
			vec3 sample = origin + (kernel[i]) * radiusAux;\n\
			vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
			offset.xy /= offset.w;\n\
			offset.xy = offset.xy * 0.5 + 0.5;        \n\
			float sampleDepth = -sample.z/far;\n\
			if(sampleDepth > 0.49)\n\
				continue;\n\
			float depthBufferValue = getDepth(offset.xy);\n\
			float range_check = abs(linearDepth - depthBufferValue)+radiusAux*0.998;\n\
			if (range_check > radius*1.001 && depthBufferValue <= sampleDepth)\n\
			{\n\
				occlusion +=  1.0;\n\
			}\n\
		}   \n\
		\n\
		if(occlusion > float(kernelSize)*0.4)\n\
		{\n\
			occlusion = occlusion / float(kernelSize);\n\
		}\n\
		else{\n\
			occlusion = 0.0;\n\
		}\n\
		//occlusion = 1.0 - occlusion / float(kernelSize);\n\
	}\n\
	else{\n\
		occlusion = 0.0;\n\
	}\n\
\n\
    vec4 finalColor;\n\
	finalColor = vec4(1.0, 1.0, 1.0, occlusion*0.9);\n\
    gl_FragColor = finalColor; \n\
}\n\
";
ShaderSource.ImageViewerRectangleShaderFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D diffuseTex;\n\
uniform bool textureFlipYAxis;\n\
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
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
varying vec4 aColor4; // color from attributes\n\
uniform bool bApplyScpecularLighting;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying vec3 vertexPos;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
varying float applySpecLighting;\n\
uniform bool bApplySsao;\n\
uniform float externalAlpha;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}  \n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) ); // 256.0*256.0*256.0 = 16777216.0\n\
    return depth * (16777216.0) / (16777216.0 - 1.0);\n\
}              \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return UnpackDepth32(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{\n\
	vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
	float alfa = externalAlpha;\n\
	float depth = UnpackDepth32(textureColor);\n\
	\n\
    vec4 finalColor;\n\
	finalColor = vec4(depth, depth, depth, alfa);\n\
\n\
	//finalColor = vec4(vNormal, 1.0); // test to render normal color coded.***\n\
    gl_FragColor = finalColor; \n\
}";
ShaderSource.ImageViewerRectangleShaderVS = "	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform bool bApplySpecularLighting;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying float applySpecLighting;\n\
	varying vec4 aColor4; // color from attributes\n\
	\n\
	void main()\n\
    {	\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
		//vertexPos = vec3(modelViewMatrixRelToEye * pos4);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8);\n\
		vec3 uLightingDirection = vec3(0.6, 0.6, 0.6);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		vTexCoord = texCoord;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		\n\
		if(bApplySpecularLighting)\n\
			applySpecLighting = 1.0;\n\
		else\n\
			applySpecLighting = -1.0;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		\n\
		if(colorType == 1)\n\
			aColor4 = color4;\n\
	}";
ShaderSource.InvertedBoxFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D diffuseTex;\n\
uniform bool hasTexture;\n\
uniform bool textureFlipYAxis;\n\
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
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
uniform vec4 vColor4Aux;\n\
\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying vec3 vertexPos;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}                \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{          \n\
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
    float linearDepth = getDepth(screenPos);          \n\
    vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
\n\
    vec3 normal2 = vNormal;\n\
            \n\
    vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
    vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
    vec3 bitangent = cross(normal2, tangent);\n\
    mat3 tbn = mat3(tangent, bitangent, normal2);        \n\
    \n\
    float occlusion = 0.0;\n\
    for(int i = 0; i < kernelSize; ++i)\n\
    {    	 \n\
        vec3 sample = origin + (tbn * kernel[i]) * radius;\n\
        vec4 offset = projectionMatrix * vec4(sample, 1.0);		\n\
        offset.xy /= offset.w;\n\
        offset.xy = offset.xy * 0.5 + 0.5;        \n\
        float sampleDepth = -sample.z/far;\n\
		if(sampleDepth > 0.49)\n\
			continue;\n\
        float depthBufferValue = getDepth(offset.xy);				              \n\
        float range_check = abs(linearDepth - depthBufferValue)+radius*0.998;\n\
        if (range_check < radius*1.001 && depthBufferValue <= sampleDepth)\n\
        {\n\
            occlusion +=  1.0;\n\
        }\n\
    }   \n\
        \n\
    occlusion = 1.0 - occlusion / float(kernelSize);\n\
\n\
    vec3 lightPos = vec3(20.0, 60.0, 20.0);\n\
    vec3 L = normalize(lightPos - vertexPos);\n\
    float lambertian = max(dot(normal2, L), 0.0);\n\
    float specular = 0.0;\n\
    if(lambertian > 0.0)\n\
    {\n\
        vec3 R = reflect(-L, normal2);      // Reflected light vector\n\
        vec3 V = normalize(-vertexPos); // Vector to viewer\n\
        \n\
        // Compute the specular term\n\
        float specAngle = max(dot(R, V), 0.0);\n\
        specular = pow(specAngle, shininessValue);\n\
    }\n\
	\n\
	if(lambertian < 0.5)\n\
    {\n\
		lambertian = 0.5;\n\
	}\n\
\n\
    vec4 textureColor;\n\
    if(hasTexture)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		\n\
        if(textureColor.w == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else{\n\
        textureColor = vColor4Aux;\n\
    }\n\
	\n\
	vec3 ambientColor = vec3(textureColor.x, textureColor.y, textureColor.z);\n\
\n\
    gl_FragColor = vec4((ambientReflectionCoef * ambientColor + diffuseReflectionCoef * lambertian * textureColor.xyz + specularReflectionCoef * specular * specularColor)*vLightWeighting * occlusion, 1.0); \n\
}\n\
";
ShaderSource.InvertedBoxVS = "	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	\n\
	void main()\n\
    {	\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
		vertexPos = vec3(modelViewMatrixRelToEye * pos4);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8);\n\
		vec3 uLightingDirection = vec3(0.6, 0.6, 0.6);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		vTexCoord = texCoord;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	}\n\
";
ShaderSource.ModelRefSsaoFS = "\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D diffuseTex;\n\
uniform sampler2D shadowMapTex;\n\
uniform sampler2D shadowMapTex2;\n\
uniform bool textureFlipYAxis;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 m;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;   \n\
uniform float shadowMapWidth;    \n\
uniform float shadowMapHeight; \n\
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
\n\
uniform bool bApplyScpecularLighting;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform vec3 specularColor;\n\
uniform vec3 ambientColor;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
uniform bool bApplySsao;\n\
uniform bool bApplyShadow;\n\
uniform float externalAlpha;\n\
uniform vec4 colorMultiplier;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
//uniform int sunIdx;\n\
\n\
// clipping planes.***\n\
//uniform bool bApplyClippingPlanes;\n\
//uniform int clippingPlanesCount;\n\
//uniform vec4 clippingPlanes[6];\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
varying vec3 diffuseColor;\n\
varying vec3 vertexPos;\n\
varying float applySpecLighting;\n\
varying vec4 vPosRelToLight; \n\
varying vec3 vLightDir; \n\
varying vec3 vNormalWC;\n\
varying float currSunIdx; \n\
varying float discardFrag;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}  \n\
\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}             \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	/*\n\
	// The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	float farForDepth = 30000.0;\n\
	float hfar = 2.0 * tangentOfHalfFovy * farForDepth;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -farForDepth);  \n\
	*/	\n\
	\n\
	\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
	\n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
	return unpackDepth(texture2D(depthTex, coord.xy));\n\
}   \n\
\n\
float getDepthShadowMap(vec2 coord)\n\
{\n\
	// currSunIdx\n\
	if(currSunIdx > 0.0 && currSunIdx < 1.0)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex, coord.xy));\n\
	}\n\
    else if(currSunIdx > 1.0 && currSunIdx < 2.0)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex2, coord.xy));\n\
	}\n\
	else\n\
		return -1.0;\n\
}  \n\
\n\
bool clipVertexByPlane(in vec4 plane, in vec3 point)\n\
{\n\
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;\n\
	\n\
	if(dist < 0.0)\n\
	return true;\n\
	else return false;\n\
}\n\
\n\
void main()\n\
{\n\
	//gl_FragColor = vColor4; \n\
	//return;\n\
	// 1rst, check if there are clipping planes.\n\
	/*\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = true;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false;\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
		if(discardFrag)\n\
		discard;\n\
	}\n\
	*/\n\
\n\
	//bool testBool = false;\n\
	float occlusion = 1.0; // ambient occlusion.***\n\
	float shadow_occlusion = 1.0;\n\
	vec3 normal2 = vNormal;	\n\
		\n\
	if(bApplySsao)\n\
	{        \n\
		////float farForDepth = 30000.0;\n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
		float linearDepth = getDepth(screenPos);  \n\
		vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
		vec3 origin = ray * linearDepth;  \n\
		float tolerance = radius/far; // original.***\n\
		////float tolerance = radius/(far-near);// test.***\n\
		////float tolerance = radius/farForDepth;\n\
\n\
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
		vec3 bitangent = cross(normal2, tangent);\n\
		mat3 tbn = mat3(tangent, bitangent, normal2);   \n\
		float minDepthBuffer;\n\
		float maxDepthBuffer;\n\
		for(int i = 0; i < kernelSize; ++i)\n\
		{    	 \n\
			vec3 sample = origin + (tbn * vec3(kernel[i].x*1.0, kernel[i].y*1.0, kernel[i].z)) * radius*2.0;\n\
			vec4 offset = projectionMatrix * vec4(sample, 1.0);					\n\
			offset.xy /= offset.w;\n\
			offset.xy = offset.xy * 0.5 + 0.5;  				\n\
			float sampleDepth = -sample.z/far;// original.***\n\
			////float sampleDepth = -sample.z/(far-near);// test.***\n\
			////float sampleDepth = -sample.z/farForDepth;\n\
\n\
			float depthBufferValue = getDepth(offset.xy);\n\
\n\
			if(depthBufferValue > 0.00391 && depthBufferValue < 0.00393)\n\
			{\n\
				if (depthBufferValue < sampleDepth-tolerance*1000.0)\n\
				{\n\
					occlusion +=  0.5;\n\
				}\n\
				\n\
				continue;\n\
			}			\n\
			\n\
			if (depthBufferValue < sampleDepth-tolerance)\n\
			{\n\
				occlusion +=  1.0;\n\
			}\n\
		} \n\
\n\
		occlusion = 1.0 - occlusion / float(kernelSize);	\n\
	}\n\
	\n\
    // Do specular lighting.***\n\
	float lambertian;\n\
	float specular;\n\
	\n\
	if(applySpecLighting> 0.0)\n\
	{\n\
		vec3 L;\n\
		if(bApplyShadow)\n\
		{\n\
			L = vLightDir;// test.***\n\
			lambertian = max(dot(normal2, L), 0.0); // original.***\n\
			//lambertian = max(dot(vNormalWC, L), 0.0); // test.\n\
		}\n\
		else\n\
		{\n\
			vec3 lightPos = vec3(1.0, 1.0, 1.0);\n\
			L = normalize(lightPos - vertexPos);\n\
			lambertian = max(dot(normal2, L), 0.0);\n\
		}\n\
		\n\
		specular = 0.0;\n\
		if(lambertian > 0.0)\n\
		{\n\
			vec3 R = reflect(-L, normal2);      // Reflected light vector\n\
			vec3 V = normalize(-vertexPos); // Vector to viewer\n\
			\n\
			// Compute the specular term\n\
			float specAngle = max(dot(R, V), 0.0);\n\
			specular = pow(specAngle, shininessValue);\n\
			\n\
			if(specular > 1.0)\n\
			{\n\
				specular = 1.0;\n\
			}\n\
		}\n\
		\n\
		if(lambertian < 0.5)\n\
		{\n\
			lambertian = 0.5;\n\
		}\n\
\n\
	}\n\
	\n\
	if(bApplyShadow)\n\
	{\n\
		if(currSunIdx > 0.0)\n\
		{\n\
			float ligthAngle = dot(vLightDir, vNormalWC);\n\
			if(ligthAngle > 0.0)\n\
			{\n\
				// The angle between the light direction & face normal is less than 90 degree, so, the face is in shadow.***\n\
				shadow_occlusion = 0.5;\n\
			}\n\
			else\n\
			{\n\
				vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;\n\
				float tolerance = 0.9963;\n\
				posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range\n\
				if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)\n\
				{\n\
					if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)\n\
					{\n\
						float depthRelToLight = getDepthShadowMap(posRelToLight.xy);\n\
						if(posRelToLight.z > depthRelToLight*tolerance )\n\
						{\n\
							shadow_occlusion = 0.5;\n\
						}\n\
					}\n\
				}\n\
\n\
				// test. Calculate the zone inside the pixel.************************************\n\
				//https://docs.microsoft.com/ko-kr/windows/win32/dxtecharts/cascaded-shadow-maps\n\
			}\n\
		}\n\
	}\n\
	\n\
\n\
    vec4 textureColor;\n\
    if(colorType == 2)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		\n\
        if(textureColor.w == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else if(colorType == 0)\n\
	{\n\
        textureColor = oneColor4;\n\
    }\n\
	else if(colorType == 1)\n\
	{\n\
        textureColor = vColor4;\n\
    }\n\
	\n\
	//textureColor = vec4(0.85, 0.85, 0.85, 1.0);\n\
	\n\
	vec3 ambientColorAux = vec3(textureColor.x*ambientColor.x, textureColor.y*ambientColor.y, textureColor.z*ambientColor.z);\n\
	float alfa = textureColor.w * externalAlpha;\n\
\n\
    vec4 finalColor;\n\
	if(applySpecLighting> 0.0)\n\
	{\n\
		finalColor = vec4((ambientReflectionCoef * ambientColorAux + \n\
							diffuseReflectionCoef * lambertian * textureColor.xyz + \n\
							specularReflectionCoef * specular * specularColor)*vLightWeighting * occlusion * shadow_occlusion, alfa); \n\
	}\n\
	else{\n\
		finalColor = vec4((textureColor.xyz) * occlusion * shadow_occlusion, alfa);\n\
	}\n\
	\n\
	//if(testBool)\n\
	//finalColor *= vec4(0.99, 0.33, 0.32, 1.0);\n\
	\n\
	finalColor *= colorMultiplier;\n\
\n\
\n\
	//finalColor = vec4(linearDepth, linearDepth, linearDepth, 1.0); // test to render depth color coded.***\n\
    gl_FragColor = finalColor; \n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.ModelRefSsaoVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 projectionMatrix;  \n\
	uniform mat4 modelViewMatrix;\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform mat4 sunMatrix[2]; \n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 sunPosHIGH[2];\n\
	uniform vec3 sunPosLOW[2];\n\
	uniform int sunIdx;\n\
	uniform vec3 sunDirWC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform bool bApplySpecularLighting;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bApplyShadow;\n\
	uniform bool bUseLogarithmicDepth;\n\
	\n\
	// clipping planes.***\n\
	uniform mat4 clippingPlanesRotMatrix; \n\
	uniform vec3 clippingPlanesPosHIGH;\n\
	uniform vec3 clippingPlanesPosLOW;\n\
	uniform bool bApplyClippingPlanes;\n\
	uniform int clippingPlanesCount;\n\
	uniform vec4 clippingPlanes[6];\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying float applySpecLighting;\n\
	varying vec4 vColor4; // color from attributes\n\
	varying vec4 vPosRelToLight; \n\
	varying vec3 vLightDir; \n\
	varying vec3 vNormalWC; \n\
	varying float currSunIdx;  \n\
	varying float discardFrag;\n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	\n\
	bool clipVertexByPlane(in vec4 plane, in vec3 point)\n\
	{\n\
		float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;\n\
		\n\
		if(dist < 0.0)\n\
		return true;\n\
		else return false;\n\
	}\n\
	\n\
	void main()\n\
    {	\n\
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
		vec4 rotatedPos;\n\
		mat3 currentTMat;\n\
		if(refMatrixType == 0)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 1)\n\
		{\n\
			rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(buildingRotMatrix);\n\
		}\n\
		else if(refMatrixType == 2)\n\
		{\n\
			rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
			currentTMat = mat3(RefTransfMatrix);\n\
		}\n\
\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
		vec3 rotatedNormal = currentTMat * normal;\n\
		\n\
		// Check if clipping.********************************************\n\
		if(bApplyClippingPlanes)\n\
		{\n\
			discardFrag = 1.0; // true.\n\
			for(int i=0; i<6; i++)\n\
			{\n\
				vec4 plane = clippingPlanes[i];\n\
				\n\
				// calculate any point of the plane.\n\
				\n\
				\n\
				if(!clipVertexByPlane(plane, vertexPos))\n\
				{\n\
					discardFrag = -1.0; // false.\n\
					break;\n\
				}\n\
				if(i >= clippingPlanesCount)\n\
				break;\n\
			}\n\
			\n\
			//if(discardFrag)\n\
			//discard;\n\
		}\n\
		//----------------------------------------------------------------\n\
		\n\
		vec3 uLightingDirection = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496); \n\
		uAmbientColor = vec3(1.0);\n\
		vNormalWC = rotatedNormal;\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);\n\
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);\n\
		float directionalLightWeighting = 1.0;\n\
		\n\
		currSunIdx = -1.0; // initially no apply shadow.\n\
		if(bApplyShadow)\n\
		{\n\
			//vLightDir = normalize(vec3(normalMatrix4 * vec4(sunDirWC.xyz, 1.0)).xyz); // test.***\n\
			vLightDir = sunDirWC;\n\
			vNormalWC = rotatedNormal;\n\
						\n\
			// the sun lights count are 2.\n\
			\n\
			vec3 currSunPosLOW;\n\
			vec3 currSunPosHIGH;\n\
			mat4 currSunMatrix;\n\
			if(sunIdx == 0)\n\
			{\n\
				currSunPosLOW = sunPosLOW[0];\n\
				currSunPosHIGH = sunPosHIGH[0];\n\
				currSunMatrix = sunMatrix[0];\n\
				currSunIdx = 0.5;\n\
			}\n\
			else if(sunIdx == 1)\n\
			{\n\
				currSunPosLOW = sunPosLOW[1];\n\
				currSunPosHIGH = sunPosHIGH[1];\n\
				currSunMatrix = sunMatrix[1];\n\
				currSunIdx = 1.5;\n\
			}\n\
			\n\
			// Calculate the vertex relative to light.***\n\
			vec3 highDifferenceSun = objPosHigh.xyz - currSunPosHIGH.xyz;\n\
			vec3 lowDifferenceSun = objPosLow.xyz - currSunPosLOW.xyz;\n\
			vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
			vPosRelToLight = currSunMatrix * pos4Sun;\n\
			\n\
			uLightingDirection = sunDirWC; \n\
			//directionalLightColor = vec3(0.9, 0.9, 0.9);\n\
			directionalLightWeighting = max(dot(rotatedNormal, -sunDirWC), 0.0);\n\
		}\n\
		else\n\
		{\n\
			uAmbientColor = vec3(0.8);\n\
			uLightingDirection = normalize(vec3(0.6, 0.6, 0.6));\n\
			directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		}\n\
\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
		\n\
		if(bApplySpecularLighting)\n\
			applySpecLighting = 1.0;\n\
		else\n\
			applySpecLighting = -1.0;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			float Fcoef = 2.0 / log2(far + 1.0);\n\
			gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * Fcoef;\n\
\n\
			// https://www.gamasutra.com/blogs/BranoKemen/20090812/85207/Logarithmic_Depth_Buffer.php\n\
			// z = log(C*z + 1) / log(C*Far + 1) * w\n\
			/*\n\
			if(orthoPos.z < 0.0)\n\
			{\n\
				float z = gl_Position.z;\n\
				float C = 0.001;\n\
				float w = gl_Position.w;\n\
				//gl_Position.z = (2.0*log(C*w + 1.0) / log(C*far + 1.0) - 1.0) * w; // https://outerra.blogspot.com/2009/08/logarithmic-z-buffer.html\n\
				gl_Position.z = 2.0*log(z/near) / log(far/near)-1.0; // another way.\n\
				gl_Position.z *= w;\n\
			}\n\
			*/\n\
			//https://www.shaderific.com/blog/2014/3/13/tutorial-how-to-update-a-shader-for-opengl-es-30\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
\n\
		//if(orthoPos.z < 0.0)\n\
		//aColor4 = vec4(1.0, 0.0, 0.0, 1.0);\n\
		//else\n\
		//aColor4 = vec4(0.0, 1.0, 0.0, 1.0);\n\
		gl_PointSize = 5.0;\n\
	}";
ShaderSource.OrthogonalDepthShaderFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
uniform float near;\n\
uniform float far;\n\
\n\
varying float depth;  \n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    //vec4 res = fract(depth * bit_shift); // Is not precise.\n\
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
vec4 PackDepth32( in float depth )\n\
{\n\
    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = PackDepth32(depth);\n\
	//gl_FragData[0] = packDepth(-depth);\n\
}";
ShaderSource.OrthogonalDepthShaderVS = "attribute vec3 position;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
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
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
varying float depth;\n\
  \n\
void main()\n\
{	\n\
	vec4 rotatedPos;\n\
\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    //linear depth in camera space (0..far)\n\
    //depth = (modelViewMatrixRelToEye * pos4).z/far; // original.***\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	depth = gl_Position.z*0.5+0.5;\n\
}\n\
";
ShaderSource.PngImageFS = "precision highp float;\n\
varying vec2 v_texcoord;\n\
uniform bool textureFlipYAxis;\n\
uniform sampler2D u_texture;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 oneColor4;\n\
\n\
\n\
varying vec2 imageSizeInPixels;\n\
\n\
void main()\n\
{\n\
    vec4 textureColor;\n\
\n\
	// 1rst, check if the texture.w != 0.\n\
	if(textureFlipYAxis)\n\
	{\n\
		textureColor = texture2D(u_texture, vec2(v_texcoord.s, 1.0 - v_texcoord.t));\n\
	}\n\
	else\n\
	{\n\
		textureColor = texture2D(u_texture, v_texcoord);\n\
	}\n\
	//if(textureColor.w < 0.005)\n\
	if(textureColor.w == 0.0)\n\
	{\n\
		discard;\n\
	}\n\
	if(colorType == 2)\n\
	{\n\
		// do nothing.\n\
	}\n\
	else if( colorType == 0)\n\
	{\n\
		textureColor = oneColor4;\n\
	}\n\
\n\
    gl_FragColor = textureColor;\n\
}";
ShaderSource.PngImageVS = "attribute vec4 position;\n\
attribute vec2 texCoord;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 modelViewMatrixRelToEye;  \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;  \n\
uniform mat4 projectionMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec2 scale2d;\n\
uniform vec2 size2d;\n\
uniform vec3 aditionalOffset;\n\
uniform vec2 imageSize;\n\
uniform float screenWidth;    \n\
uniform float screenHeight;\n\
uniform bool bUseOriginalImageSize;\n\
varying vec2 v_texcoord;\n\
varying vec2 imageSizeInPixels;\n\
\n\
void main()\n\
{\n\
    vec4 position2 = vec4(position.xyz, 1.0);\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	//imageSizeInPixels = vec2(imageSize.x, imageSize.y);\n\
	\n\
	float order_w = position.w;\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
    v_texcoord = texCoord;\n\
	vec4 projected = ModelViewProjectionMatrixRelToEye * pos4;\n\
	//vec4 projected2 = modelViewMatrixRelToEye * pos4;\n\
\n\
	// Now, calculate the pixelSize in the plane of the projected point.\n\
	float pixelWidthRatio = 2. / (screenWidth * projectionMatrix[0][0]);\n\
	// alternative : float pixelWidthRatio = 2. / (screenHeight * projectionMatrix[1][1]);\n\
	float pixelWidth = projected.w * pixelWidthRatio;\n\
	\n\
	if(projected.w < 5.0)\n\
		pixelWidth = 5.0 * pixelWidthRatio;\n\
	\n\
	vec4 offset;\n\
	float offsetX;\n\
	float offsetY;\n\
	if(bUseOriginalImageSize)\n\
	{\n\
		offsetX = pixelWidth*imageSize.x/2.0;\n\
		offsetY = pixelWidth*imageSize.y/2.0;\n\
	}\n\
	else{\n\
		offsetX = pixelWidth*size2d.x/2.0;\n\
		offsetY = pixelWidth*size2d.y/2.0;\n\
	}\n\
	\n\
	// Offset our position along the normal\n\
	if(orderInt == 1)\n\
	{\n\
		offset = vec4(-offsetX*scale2d.x, 0.0, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == -1)\n\
	{\n\
		offset = vec4(offsetX*scale2d.x, 0.0, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == 2)\n\
	{\n\
		offset = vec4(-offsetX*scale2d.x, offsetY*4.0*scale2d.y, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == -2)\n\
	{\n\
		offset = vec4(offsetX*scale2d.x, offsetY*4.0*scale2d.y, 0.0, 1.0);\n\
	}\n\
\n\
	gl_Position = projected + offset + vec4(aditionalOffset.x*pixelWidth, aditionalOffset.y*pixelWidth, aditionalOffset.z*pixelWidth, 0.0); \n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.PointCloudDepthFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
uniform float near;\n\
uniform float far;\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes;\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
\n\
varying float depth;  \n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
vec4 PackDepth32( in float depth )\n\
{\n\
    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = packDepth(-depth);\n\
	//gl_FragData[0] = PackDepth32(depth);\n\
}";
ShaderSource.PointCloudDepthVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bPositionCompressed;\n\
uniform vec3 minPosition;\n\
uniform vec3 bboxSize;\n\
attribute vec4 color4;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform float fixPointSize;\n\
uniform float maxPointSize;\n\
uniform float minPointSize;\n\
uniform float pendentPointSize;\n\
uniform bool bUseFixPointSize;\n\
varying vec4 vColor;\n\
//varying float glPointSize;\n\
varying float depth;  \n\
\n\
void main()\n\
{\n\
	vec3 realPos;\n\
	vec4 rotatedPos;\n\
	if(bPositionCompressed)\n\
	{\n\
		float maxShort = 65535.0;\n\
		realPos = vec3(float(position.x)/maxShort*bboxSize.x + minPosition.x, float(position.y)/maxShort*bboxSize.y + minPosition.y, float(position.z)/maxShort*bboxSize.z + minPosition.z);\n\
	}\n\
	else\n\
	{\n\
		realPos = position;\n\
	}\n\
	rotatedPos = buildingRotMatrix * vec4(realPos.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor=oneColor4;\n\
	}\n\
	else\n\
		vColor=color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	float z_b = gl_Position.z/gl_Position.w;\n\
	float z_n = 2.0 * z_b - 1.0;\n\
    float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
	gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
    if(gl_PointSize > maxPointSize)\n\
        gl_PointSize = maxPointSize;\n\
	if(gl_PointSize < 2.0)\n\
		gl_PointSize = 2.0;\n\
		\n\
	depth = (modelViewMatrixRelToEye * pos).z/far; // original.***\n\
}\n\
";
ShaderSource.PointCloudFS = "	precision lowp float;\n\
	uniform vec4 uStrokeColor;\n\
	varying vec4 vColor;\n\
	varying float glPointSize;\n\
	uniform int uPointAppereance; // square, circle, romboide,...\n\
	uniform int uStrokeSize;\n\
\n\
	void main()\n\
    {\n\
		vec2 pt = gl_PointCoord - vec2(0.5);\n\
		float distSquared = pt.x*pt.x+pt.y*pt.y;\n\
		if(distSquared > 0.25)\n\
			discard;\n\
\n\
		vec4 finalColor = vColor;\n\
		float strokeDist = 0.1;\n\
		if(glPointSize > 10.0)\n\
		strokeDist = 0.15;\n\
\n\
		if(uStrokeSize > 0)\n\
		{\n\
			if(distSquared >= strokeDist)\n\
			{\n\
				finalColor = uStrokeColor;\n\
			}\n\
		}\n\
		gl_FragColor = finalColor;\n\
	}";
ShaderSource.PointCloudSsaoFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform mat4 projectionMatrix;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
varying vec4 aColor4; // color from attributes\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform bool bApplySsao;\n\
uniform float externalAlpha;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}                \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}    \n\
\n\
void main()\n\
{\n\
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	if(pt.x*pt.x+pt.y*pt.y > 0.25)\n\
		discard;\n\
	\n\
	float occlusion = 0.0;\n\
	if(bApplySsao)\n\
	{          \n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
		float linearDepth = getDepth(screenPos);\n\
		vec3 origin = getViewRay(screenPos) * linearDepth;\n\
		float radiusAux = glPointSize/1.9;\n\
		radiusAux = 1.5;\n\
		vec2 screenPosAdjacent;\n\
		\n\
		for(int j = 0; j < 1; ++j)\n\
		{\n\
			radiusAux = 1.5 *(float(j)+1.0);\n\
			for(int i = 0; i < 8; ++i)\n\
			{    	 \n\
				if(i == 0)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 1)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 2)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 3)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
				else if(i == 4)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 5)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 6)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 7)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
				float depthBufferValue = getDepth(screenPosAdjacent);\n\
				float range_check = abs(linearDepth - depthBufferValue)*far;\n\
				if (range_check > 1.5 && depthBufferValue > linearDepth)\n\
				{\n\
					if (range_check < 20.0)\n\
						occlusion +=  1.0;\n\
				}\n\
			}   \n\
		}   \n\
			\n\
		if(occlusion > 6.0)\n\
			occlusion = 8.0;\n\
		//else occlusion = 0.0;\n\
		occlusion = 1.0 - occlusion / 8.0;\n\
	}\n\
	else{\n\
		occlusion = 1.0;\n\
	}\n\
\n\
    vec4 finalColor;\n\
	finalColor = vec4((vColor.xyz) * occlusion, externalAlpha);\n\
	//finalColor = vec4(vec3(0.8, 0.8, 0.8) * occlusion, externalAlpha);\n\
    gl_FragColor = finalColor; \n\
}";
ShaderSource.PointCloudSsaoFS_rainbow = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform mat4 projectionMatrix;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
uniform bool bUseColorCodingByHeight;\n\
uniform float minHeight_rainbow;   \n\
uniform float maxHeight_rainbow;  \n\
varying vec4 aColor4; // color from attributes\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float realHeigh;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform bool bApplySsao;\n\
uniform float externalAlpha;\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}                \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
}  \n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
}   \n\
\n\
void main()\n\
{\n\
	float occlusion = 0.0;\n\
	if(bApplySsao)\n\
	{          \n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
		float linearDepth = getDepth(screenPos);\n\
		vec3 origin = getViewRay(screenPos) * linearDepth;\n\
		float radiusAux = glPointSize/1.9;\n\
		radiusAux = 1.5;\n\
		vec2 screenPosAdjacent;\n\
		\n\
		for(int j = 0; j < 1; ++j)\n\
		{\n\
			radiusAux = 1.5 *(float(j)+1.0);\n\
			for(int i = 0; i < 8; ++i)\n\
			{    	 \n\
				if(i == 0)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 1)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 2)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);\n\
				else if(i == 3)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
				else if(i == 4)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 5)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 6)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);\n\
				else if(i == 7)\n\
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);\n\
				float depthBufferValue = getDepth(screenPosAdjacent);\n\
				float range_check = abs(linearDepth - depthBufferValue)*far;\n\
				if (range_check > 1.5 && depthBufferValue > linearDepth)\n\
				{\n\
					if (range_check < 20.0)\n\
						occlusion +=  1.0;\n\
				}\n\
			}   \n\
		}   \n\
			\n\
		if(occlusion > 6.0)\n\
			occlusion = 8.0;\n\
		//else occlusion = 0.0;\n\
		occlusion = 1.0 - occlusion / 8.0;\n\
	}\n\
	else{\n\
		occlusion = 1.0;\n\
	}\n\
\n\
    vec4 finalColor;\n\
	if(bUseColorCodingByHeight)\n\
	{\n\
		float rainbow = 0.5;\n\
		float texCol = 0.5;\n\
		vec3 rainbowColor3 = getRainbowColor_byHeight(realHeigh);\n\
		vec3 blendedColor3 = vec3(vColor.x * texCol + rainbowColor3.r * rainbow, vColor.y * texCol + rainbowColor3.g * rainbow, vColor.z * texCol + rainbowColor3.b * rainbow);\n\
		finalColor = vec4(blendedColor3 * occlusion, externalAlpha);\n\
	}\n\
	else\n\
		finalColor = vec4((vColor.xyz) * occlusion, externalAlpha);\n\
	//finalColor = vec4(vec3(0.8, 0.8, 0.8) * occlusion, externalAlpha);\n\
    gl_FragColor = finalColor; \n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.PointCloudVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bPositionCompressed;\n\
uniform vec3 minPosition;\n\
uniform vec3 bboxSize;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform float fixPointSize;\n\
uniform float maxPointSize;\n\
uniform float minPointSize;\n\
uniform float pendentPointSize;\n\
uniform bool bUseFixPointSize;\n\
uniform bool bUseColorCodingByHeight;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
\n\
void main()\n\
{\n\
	vec3 realPos;\n\
	vec4 rotatedPos;\n\
	if(bPositionCompressed)\n\
	{\n\
		float maxShort = 65535.0;\n\
		realPos = vec3(float(position.x)/maxShort*bboxSize.x + minPosition.x, float(position.y)/maxShort*bboxSize.y + minPosition.y, float(position.z)/maxShort*bboxSize.z + minPosition.z);\n\
	}\n\
	else\n\
	{\n\
		realPos = position;\n\
	}\n\
	rotatedPos = buildingRotMatrix * vec4(realPos.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor=oneColor4;\n\
	}\n\
	else\n\
		vColor=color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://www.gamasutra.com/blogs/BranoKemen/20090812/85207/Logarithmic_Depth_Buffer.php\n\
		// z = log(C*z + 1) / log(C*Far + 1) * w\n\
		float z = gl_Position.z;\n\
		//float C = 1.0;\n\
		float w = gl_Position.w;\n\
		////gl_Position.z = log(C*z + 1.0) / log(C*far + 1.0) * w;\n\
		gl_Position.z = log(z/near) / log(far/near)*w; // another way.\n\
	}\n\
\n\
	if(bUseFixPointSize)\n\
	{\n\
		gl_PointSize = fixPointSize;\n\
	}\n\
	else{\n\
		float z_b = gl_Position.z/gl_Position.w;\n\
		float z_n = 2.0 * z_b - 1.0;\n\
		float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
		gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
		if(gl_PointSize > maxPointSize)\n\
			gl_PointSize = maxPointSize;\n\
		if(gl_PointSize < 2.0)\n\
			gl_PointSize = 2.0;\n\
	}\n\
	glPointSize = gl_PointSize;\n\
}";
ShaderSource.PointCloudVS_rainbow = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bPositionCompressed;\n\
uniform vec3 minPosition;\n\
uniform vec3 bboxSize;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform float fixPointSize;\n\
uniform float maxPointSize;\n\
uniform float minPointSize;\n\
uniform float pendentPointSize;\n\
uniform bool bUseFixPointSize;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float realHeigh;\n\
\n\
void main()\n\
{\n\
	vec3 realPos;\n\
	vec4 rotatedPos;\n\
	if(bPositionCompressed)\n\
	{\n\
		float maxShort = 65535.0;\n\
		realPos = vec3(float(position.x)/maxShort*bboxSize.x + minPosition.x, float(position.y)/maxShort*bboxSize.y + minPosition.y, float(position.z)/maxShort*bboxSize.z + minPosition.z);\n\
	}\n\
	else\n\
	{\n\
		realPos = position;\n\
	}\n\
	realHeigh = realPos.z;\n\
	rotatedPos = buildingRotMatrix * vec4(realPos.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor=oneColor4;\n\
	}\n\
	else\n\
		vColor=color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	float z_b = gl_Position.z/gl_Position.w;\n\
	float z_n = 2.0 * z_b - 1.0;\n\
    float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
    gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
    if(gl_PointSize > maxPointSize)\n\
        gl_PointSize = maxPointSize;\n\
    if(gl_PointSize < 2.0)\n\
        gl_PointSize = 2.0;\n\
        \n\
    glPointSize = gl_PointSize;\n\
}\n\
";
ShaderSource.quad_vert = "precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    v_tex_pos = a_pos;\n\
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
}\n\
";
ShaderSource.RenderShowDepthFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform float near;\n\
uniform float far;\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes;\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying float depth;  \n\
varying vec3 vertexPos;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0); // original.***\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625);  // original.*** \n\
	\n\
    //vec4 res = fract(depth * bit_shift); // Is not precise.\n\
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
\n\
//vec4 PackDepth32( in float depth )\n\
//{\n\
//    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
//    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
//    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
//}\n\
\n\
bool clipVertexByPlane(in vec4 plane, in vec3 point)\n\
{\n\
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;\n\
	\n\
	if(dist < 0.0)\n\
	return true;\n\
	else return false;\n\
}\n\
\n\
void main()\n\
{     \n\
	// 1rst, check if there are clipping planes.\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = true;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false;\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
		if(discardFrag)\n\
		discard;\n\
	}\n\
	\n\
    gl_FragData[0] = packDepth(-depth);\n\
	//gl_FragData[0] = PackDepth32(depth);\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.RenderShowDepthVS = "attribute vec3 position;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 scaleLC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying float depth;\n\
varying vec3 vertexPos;\n\
  \n\
void main()\n\
{	\n\
	vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
	vec4 rotatedPos;\n\
\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    //linear depth in camera space (0..far)\n\
	vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
    depth = orthoPos.z/far; // original.***\n\
\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		float Fcoef = 2.0 / log2(far + 1.0);\n\
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
\n\
	vertexPos = orthoPos.xyz;\n\
}";
ShaderSource.ScreenQuadFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D shadowMapTex;\n\
uniform sampler2D shadowMapTex2;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 modelViewMatrixInv;\n\
uniform mat4 modelViewProjectionMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 projectionMatrixInv;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform bool bApplyShadow;\n\
uniform bool bSilhouette;\n\
uniform mat4 sunMatrix[2]; \n\
uniform vec3 sunPosHIGH[2];\n\
uniform vec3 sunPosLOW[2];\n\
uniform int sunIdx;\n\
uniform float screenWidth;    \n\
uniform float screenHeight;   \n\
uniform float near;\n\
uniform float far;\n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
varying vec4 vColor; \n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float unpackDepthMago(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
} \n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}  \n\
\n\
float getDepthShadowMap(vec2 coord)\n\
{\n\
	// currSunIdx\n\
	if(sunIdx == 0)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex, coord.xy));\n\
	}\n\
    else if(sunIdx ==1)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex2, coord.xy));\n\
	}\n\
	else\n\
		return -1.0;\n\
}\n\
\n\
bool isInShadow(vec4 pointWC, int currSunIdx)\n\
{\n\
	bool inShadow = false;\n\
	vec3 currSunPosLOW;\n\
	vec3 currSunPosHIGH;\n\
	mat4 currSunMatrix;\n\
	if(currSunIdx == 0)\n\
	{\n\
		currSunPosLOW = sunPosLOW[0];\n\
		currSunPosHIGH = sunPosHIGH[0];\n\
		currSunMatrix = sunMatrix[0];\n\
	}\n\
	else if(currSunIdx == 1)\n\
	{\n\
		currSunPosLOW = sunPosLOW[1];\n\
		currSunPosHIGH = sunPosHIGH[1];\n\
		currSunMatrix = sunMatrix[1];\n\
	}\n\
	else\n\
	return false;\n\
	\n\
		\n\
	vec3 highDifferenceSun = pointWC.xyz -currSunPosHIGH.xyz;\n\
	vec3 lowDifferenceSun = -currSunPosLOW.xyz;\n\
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
	vec4 vPosRelToLight = currSunMatrix * pos4Sun;\n\
\n\
	vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;\n\
	float tolerance = 0.9963;\n\
	posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range\n\
	if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)\n\
	{\n\
		if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)\n\
		{\n\
			float depthRelToLight;\n\
			if(currSunIdx == 0)\n\
			{depthRelToLight = UnpackDepth32(texture2D(shadowMapTex, posRelToLight.xy));}\n\
			else if(currSunIdx == 1)\n\
			{depthRelToLight = UnpackDepth32(texture2D(shadowMapTex2, posRelToLight.xy));}\n\
			if(posRelToLight.z > depthRelToLight*tolerance )\n\
			{\n\
				inShadow = true;\n\
			}\n\
		}\n\
	}\n\
	\n\
	return inShadow;\n\
}\n\
\n\
void main()\n\
{\n\
	// 1rst, check if this is silhouette rendering.\n\
	if(bSilhouette)\n\
	{\n\
		// Check the adjacent pixels to decide if this is silhouette.\n\
		// Analize a 5x5 rectangle of the depthTexture: if there are objectDepth & backgroundDepth => is silhouette.\n\
		float pixelSizeW = 1.0/screenWidth;\n\
		float pixelSizeH = 1.0/screenHeight;\n\
		int objectDepthCount = 0;\n\
		int backgroundDepthCount = 0;\n\
		float tolerance = 0.9963;\n\
		tolerance = 0.9963;\n\
		\n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight); // centerPos.\n\
		vec2 screenPos_LD = vec2(screenPos.x - pixelSizeW*1.5, screenPos.y - pixelSizeH*1.5); // left-down corner.\n\
		\n\
		for(int w = 0; w<3; w++)\n\
		{\n\
			for(int h=0; h<3; h++)\n\
			{\n\
				vec2 screenPosAux = vec2(screenPos_LD.x + pixelSizeW*float(w), screenPos_LD.y + pixelSizeH*float(h));\n\
				float z_window  = unpackDepthMago(texture2D(depthTex, screenPosAux.xy)); // z_window  is [0.0, 1.0] range depth.\n\
\n\
				if(z_window > tolerance)\n\
				{\n\
					// is background.\n\
					backgroundDepthCount += 1;\n\
				}\n\
				else\n\
				{\n\
					// is object.\n\
					objectDepthCount += 1;\n\
				}\n\
\n\
				if(backgroundDepthCount > 0 && objectDepthCount > 0)\n\
				{\n\
					// is silhouette.\n\
					gl_FragColor = vec4(0.2, 1.0, 0.3, 1.0);\n\
					return;\n\
				}\n\
				\n\
			}\n\
		}\n\
		\n\
		return;\n\
	}\n\
	\n\
	float shadow_occlusion = 1.0;\n\
	float alpha = 0.0;\n\
	vec4 finalColor;\n\
	finalColor = vec4(0.2, 0.2, 0.2, 0.8);\n\
	if(bApplyShadow)\n\
	{\n\
		// the sun lights count are 2.\n\
		// 1rst, calculate the pixelPosWC.\n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
		float z_window  = unpackDepth(texture2D(depthTex, screenPos.xy)); // z_window  is [0.0, 1.0] range depth.\n\
		if(z_window < 0.001)\n\
		discard;\n\
		\n\
		// https://stackoverflow.com/questions/11277501/how-to-recover-view-space-position-given-view-space-depth-value-and-ndc-xy\n\
		float depthRange_near = 0.0;\n\
		float depthRange_far = 1.0;\n\
		float x_ndc = 2.0 * screenPos.x - 1.0;\n\
		float y_ndc = 2.0 * screenPos.y - 1.0;\n\
		float z_ndc = (2.0 * z_window - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);\n\
		\n\
		vec4 viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);\n\
		vec3 posCC = viewPosH.xyz/viewPosH.w;\n\
		vec4 posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);\n\
		//----------------------------------------------------------------\n\
	\n\
		// 2nd, calculate the vertex relative to light.***\n\
		// 1rst, try with the closest sun. sunIdx = 0.\n\
		bool pointIsinShadow = isInShadow(posWC, 0);\n\
		if(!pointIsinShadow)\n\
		{\n\
			pointIsinShadow = isInShadow(posWC, 1);\n\
		}\n\
\n\
		if(pointIsinShadow)\n\
		{\n\
			shadow_occlusion = 0.5;\n\
			alpha = 0.5;\n\
		}\n\
		\n\
	}\n\
    gl_FragColor = vec4(finalColor.rgb*shadow_occlusion, alpha);\n\
}";
ShaderSource.ScreenQuadVS = "precision mediump float;\n\
\n\
attribute vec2 position;\n\
varying vec4 vColor; \n\
\n\
void main() {\n\
	vColor = vec4(0.2, 0.2, 0.2, 0.5);\n\
    gl_Position = vec4(1.0 - 2.0 * position, 0.0, 1.0);\n\
}";
ShaderSource.screen_frag = "precision mediump float;\n\
\n\
uniform sampler2D u_screen;\n\
uniform float u_opacity;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_screen, 1.0 - v_tex_pos);\n\
    // a hack to guarantee opacity fade out even with a value close to 1.0\n\
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);\n\
}\n\
";
ShaderSource.SilhouetteFS = "precision highp float;\n\
uniform vec4 vColor4Aux;\n\
\n\
void main()\n\
{          \n\
    gl_FragColor = vColor4Aux;\n\
}";
ShaderSource.SilhouetteVS = "attribute vec3 position;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 ModelViewMatrixRelToEye;\n\
uniform mat4 ProjectionMatrix;\n\
uniform mat4 RefTransfMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
uniform vec2 camSpacePixelTranslation;\n\
uniform vec2 screenSize;   \n\
varying vec2 camSpaceTranslation;\n\
\n\
void main()\n\
{    \n\
    vec4 rotatedPos;\n\
	if(refMatrixType == 0)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 1)\n\
	{\n\
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
	else if(refMatrixType == 2)\n\
	{\n\
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
	}\n\
\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    vec4 camSpacePos = ModelViewMatrixRelToEye * pos4;\n\
    vec4 translationVec = ProjectionMatrix * vec4(camSpacePixelTranslation.x*(-camSpacePos.z), camSpacePixelTranslation.y*(-camSpacePos.z), 0.0, 1.0);\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
    gl_Position += translationVec;  \n\
}";
ShaderSource.StandardFS = "precision lowp float;\n\
varying vec3 vColor;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = vec4(vColor, 1.);\n\
}";
ShaderSource.StandardVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform mat4 RefTransfMatrix;\n\
attribute vec3 color;\n\
varying vec3 vColor;\n\
\n\
void main()\n\
{\n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
 \n\
    vColor=color;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
}";
ShaderSource.Test_QuadFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
 \n\
uniform sampler2D diffuseTex;  \n\
varying vec2 vTexCoord; \n\
void main()\n\
{          \n\
    vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
    gl_FragColor = textureColor; \n\
}\n\
";
ShaderSource.Test_QuadVS = "attribute vec3 position;\n\
attribute vec2 texCoord;\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
uniform mat4 buildingRotMatrix;  \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;   \n\
\n\
void main()\n\
{	\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    vTexCoord = texCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.TextureA1FS = "precision mediump float;\n\
varying vec4 vColor;\n\
varying vec2 vTextureCoord;\n\
uniform sampler2D uSampler;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
}\n\
";
ShaderSource.TextureA1VS = "attribute vec3 position;\n\
attribute vec4 aVertexColor;\n\
attribute vec2 aTextureCoord;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
varying vec4 vColor;\n\
varying vec2 vTextureCoord;\n\
\n\
void main()\n\
{\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
 \n\
    vColor=aVertexColor;\n\
    vTextureCoord = aTextureCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
}";
ShaderSource.TextureFS = "precision mediump float;\n\
varying vec4 vColor;\n\
varying vec2 vTextureCoord;\n\
uniform sampler2D uSampler;\n\
\n\
void main()\n\
{\n\
    gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
}";
ShaderSource.TextureNormalFS = "	precision mediump float;\n\
	varying vec4 vColor;\n\
	varying vec2 vTextureCoord;\n\
	uniform sampler2D uSampler;\n\
	varying vec3 vLightWeighting;\n\
\n\
	void main()\n\
    {\n\
		vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
        \n\
		gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n\
	}\n\
";
ShaderSource.TextureNormalVS = "attribute vec3 position;\n\
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
uniform mat3 uNMatrix;\n\
\n\
void main()\n\
{\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
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
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
}\n\
";
ShaderSource.texturesMergerFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D texture_0;  \n\
uniform sampler2D texture_1;\n\
uniform sampler2D texture_2;\n\
uniform sampler2D texture_3;\n\
uniform sampler2D texture_4;\n\
uniform sampler2D texture_5;\n\
uniform sampler2D texture_6;\n\
uniform sampler2D texture_7;\n\
\n\
uniform float externalAlphasArray[8];\n\
uniform int uActiveTextures[8];\n\
uniform vec4 uExternalTexCoordsArray[8]; // vec4 (minS, minT, maxS, maxT).\n\
uniform vec2 uMinMaxAltitudes; // used for altitudes textures as bathymetry.\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
//vec4 mixColor(sampler2D tex)\n\
bool intersects(vec2 texCoord, vec4 extension)\n\
{\n\
    bool bIntersects = true;\n\
    float minS = extension.x;\n\
    float minT = extension.y;\n\
    float maxS = extension.z;\n\
    float maxT = extension.w;\n\
\n\
    if(texCoord.x < minS || texCoord.x > maxS)\n\
    return false;\n\
    else if(texCoord.y < minT || texCoord.y > maxT)\n\
    return false;\n\
\n\
    return bIntersects;\n\
}\n\
\n\
void getTextureColor(in int activeNumber, in vec4 currColor4, in vec2 texCoord,  inout bool victory, in float externalAlpha, inout vec4 resultTextureColor)\n\
{\n\
    if(activeNumber == 1)\n\
    {\n\
        if(currColor4.w > 0.0 && externalAlpha > 0.0)\n\
        {\n\
            if(victory)\n\
            {\n\
                resultTextureColor = mix(resultTextureColor, currColor4, currColor4.w*externalAlpha);\n\
            }\n\
            else{\n\
                currColor4.w *= externalAlpha;\n\
                resultTextureColor = currColor4;\n\
            }\n\
            \n\
            victory = true;\n\
        }\n\
    }\n\
    else if(activeNumber == 2)\n\
    {\n\
        // custom image.\n\
        // Check uExternalTexCoordsArray.\n\
        \n\
    }\n\
    else if(activeNumber == 10)\n\
    {\n\
        // Bathymetry texture.\n\
        float altitude = 1000000.0;\n\
        if(currColor4.w > 0.0)\n\
        {\n\
            // decode the grayScale.***\n\
            altitude = uMinMaxAltitudes.x + currColor4.r * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);\n\
        \n\
            if(altitude < 0.0)\n\
            {\n\
                float minHeight_rainbow = -100.0;\n\
                float maxHeight_rainbow = 0.0;\n\
                float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
                //vec3 rainbowColor = getRainbowColor_byHeight(altitude);\n\
\n\
                if(gray < 0.05)\n\
                gray = 0.05;\n\
                float red = gray + 0.1;//float red = gray + 0.2;\n\
                float green = gray + 0.5;//float green = gray + 0.6;\n\
                float blue = gray*2.0 + 2.0;\n\
                vec4 fogColor = vec4(red, green, blue, 1.0);\n\
                \n\
                resultTextureColor = mix(resultTextureColor, fogColor, 0.7); \n\
            }\n\
        }\n\
    }\n\
}\n\
\n\
void main()\n\
{           \n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
    bool victory = false;\n\
\n\
    if(uActiveTextures[0] > 0)\n\
        getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], textureColor);\n\
    if(uActiveTextures[1] > 0)\n\
        getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], textureColor);\n\
    if(uActiveTextures[2] > 0)\n\
        getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], textureColor);\n\
    if(uActiveTextures[3] > 0)\n\
        getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], textureColor);\n\
    if(uActiveTextures[4] > 0)\n\
        getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], textureColor);\n\
    if(uActiveTextures[5] > 0)\n\
        getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], textureColor);\n\
    if(uActiveTextures[6] > 0)\n\
        getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], textureColor);\n\
    if(uActiveTextures[7] > 0)\n\
        getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], textureColor);\n\
    \n\
    if(!victory)\n\
    discard;\n\
    \n\
    gl_FragColor = textureColor;\n\
	\n\
}";
ShaderSource.texturesMergerVS = "precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    v_tex_pos = a_pos;\n\
    //vec2 pos = a_pos*0.5;\n\
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
}";
ShaderSource.TextureVS = "attribute vec3 position;\n\
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
\n\
void main()\n\
{\n\
    vec4 rotatedPos = Mmatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    vColor=aVertexColor;\n\
    vTextureCoord = aTextureCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
    \n\
}";
ShaderSource.thickLineDepthVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying vec4 vColor;\n\
varying float depth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
vec2 project(vec4 p){\n\
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;\n\
}\n\
\n\
bool isEqual(float value, float valueToCompare)\n\
{\n\
	if(value + error > valueToCompare && value - error < valueToCompare)\n\
	return true;\n\
	\n\
	return false;\n\
}\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main(){\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
	\n\
	float order_w = current.w;\n\
	//float order_w = float(order);\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
	float aspect = viewport.x / viewport.y;\n\
	vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
	// Get 2D screen space with W divide and aspect correction\n\
	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;\n\
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;\n\
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\
					\n\
	// This helps us handle 90 degree turns correctly\n\
	vec2 tangentNext = normalize(nextScreen - currentScreen);\n\
	vec2 tangentPrev = normalize(currentScreen - previousScreen);\n\
	vec2 normal; \n\
	if(orderInt == 1 || orderInt == -1)\n\
	{\n\
		normal = vec2(-tangentPrev.y, tangentPrev.x);\n\
	}\n\
	else{\n\
		normal = vec2(-tangentNext.y, tangentNext.x);\n\
	}\n\
	normal *= thickness/2.0;\n\
	normal.x /= aspect;\n\
	float direction = (thickness*sense*projectedDepth)/1000.0;\n\
	// Offset our position along the normal\n\
	vec4 offset = vec4(normal * direction, 0.0, 1.0);\n\
	gl_Position = currentProjected + offset; \n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			float Fcoef = 2.0 / log2(far + 1.0);\n\
			gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
\n\
    depth = (modelViewMatrixRelToEye * current).z/far; // original.***\n\
\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);\n\
	else\n\
		vColor = oneColor4;\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.thickLineFS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
void main() {\n\
	gl_FragColor = vColor;\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.thickLineVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
vec2 project(vec4 p){\n\
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;\n\
}\n\
\n\
bool isEqual(float value, float valueToCompare)\n\
{\n\
	if(value + error > valueToCompare && value - error < valueToCompare)\n\
	return true;\n\
	\n\
	return false;\n\
}\n\
\n\
vec4 getPointRelToEye(in vec4 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
}\n\
\n\
void main(){\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
	\n\
	float order_w = current.w;\n\
	//float order_w = float(order);\n\
	float sense = 1.0;\n\
	int orderInt = 0;\n\
	if(order_w > 0.0)\n\
	{\n\
		sense = -1.0;\n\
		if(order_w < 1.5)\n\
		{\n\
			orderInt = 1;\n\
		}\n\
		else{\n\
			orderInt = 2;\n\
		}\n\
	}\n\
	else\n\
	{\n\
		sense = 1.0;\n\
		if(order_w > -1.5)\n\
		{\n\
			orderInt = -1;\n\
		}\n\
		else{\n\
			orderInt = -2;\n\
		}\n\
	}\n\
	\n\
	float aspect = viewport.x / viewport.y;\n\
	vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
	// Get 2D screen space with W divide and aspect correction\n\
	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;\n\
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;\n\
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\
					\n\
	// This helps us handle 90 degree turns correctly\n\
	vec2 tangentNext = normalize(nextScreen - currentScreen);\n\
	vec2 tangentPrev = normalize(currentScreen - previousScreen);\n\
	vec2 normal; \n\
	if(orderInt == 1 || orderInt == -1)\n\
	{\n\
		normal = vec2(-tangentPrev.y, tangentPrev.x);\n\
	}\n\
	else{\n\
		normal = vec2(-tangentNext.y, tangentNext.x);\n\
	}\n\
	normal *= thickness/2.0;\n\
	normal.x /= aspect;\n\
	float direction = (thickness*sense*projectedDepth)/1000.0;\n\
	// Offset our position along the normal\n\
	vec4 offset = vec4(normal * direction, 0.0, 1.0);\n\
	gl_Position = currentProjected + offset; \n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			float Fcoef = 2.0 / log2(far + 1.0);\n\
			gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * Fcoef;\n\
	}\n\
	\n\
	if(colorType == 0)\n\
		vColor = oneColor4;\n\
	else if(colorType == 1)\n\
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);\n\
	else\n\
		vColor = oneColor4;\n\
}\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
\n\
";
ShaderSource.TinTerrainAltitudesFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
varying float vAltitude;  \n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    //vec4 res = fract(depth * bit_shift); // Is not precise.\n\
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
vec4 PackDepth32( in float depth )\n\
{\n\
    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = PackDepth32(vAltitude);\n\
	//gl_FragData[0] = packDepth(-depth);\n\
}";
ShaderSource.TinTerrainAltitudesVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrix;\n\
\n\
varying float vAltitude;\n\
  \n\
void main()\n\
{	\n\
    vec4 pos4 = vec4(position.xyz, 1.0);\n\
	gl_Position = ModelViewProjectionMatrix * pos4;\n\
	vAltitude = position.z;\n\
}\n\
";
ShaderSource.TinTerrainFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
  \n\
uniform sampler2D shadowMapTex;// 0\n\
uniform sampler2D shadowMapTex2;// 1\n\
//uniform sampler2D depthTex;//2\n\
//uniform sampler2D noiseTex;//3\n\
uniform sampler2D diffuseTex;  // 4\n\
uniform sampler2D diffuseTex_1;// 5\n\
uniform sampler2D diffuseTex_2;// 6\n\
uniform sampler2D diffuseTex_3;// 7\n\
uniform sampler2D diffuseTex_4;// 8\n\
uniform sampler2D diffuseTex_5;// 9\n\
uniform bool textureFlipYAxis;\n\
uniform bool bIsMakingDepth;\n\
uniform bool bExistAltitudes;\n\
uniform mat4 projectionMatrix;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform float shininessValue;\n\
uniform vec3 kernel[16];   \n\
uniform int uActiveTextures[8];\n\
uniform float externalAlphasArray[8];\n\
uniform vec2 uMinMaxAltitudes;\n\
uniform int uTileDepth;\n\
uniform int uSeaOrTerrainType;\n\
uniform int uRenderType;\n\
\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying float depthValue;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
uniform float uTime;  \n\
\n\
uniform float ambientReflectionCoef;\n\
uniform float diffuseReflectionCoef;  \n\
uniform float specularReflectionCoef; \n\
uniform float externalAlpha;\n\
uniform bool bApplyShadow;\n\
uniform bool bApplySsao;\n\
uniform float shadowMapWidth;    \n\
uniform float shadowMapHeight;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying vec3 v3Pos;\n\
varying float vFogAmount;\n\
\n\
varying float applySpecLighting;\n\
varying vec4 vPosRelToLight; \n\
varying vec3 vLightDir; \n\
varying vec3 vNormal;\n\
varying vec3 vNormalWC;\n\
varying float currSunIdx;\n\
varying float vAltitude;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
const float equatorialRadius = 6378137.0;\n\
const float polarRadius = 6356752.3142;\n\
\n\
// water caustics: https://catlikecoding.com/unity/tutorials/flow/texture-distortion/\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
} \n\
\n\
float unpackDepthOcean(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605);\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
} \n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return depth * (16777216.0) / (16777216.0 - 1.0);\n\
}\n\
\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    //vec4 res = fract(depth * bit_shift); // Is not precise.\n\
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}               \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
    float hfar = 2.0 * tan(fov/2.0) * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}\n\
\n\
//linear view space depth\n\
float getDepth(vec2 coord)\n\
{\n\
	// in this shader the depthTex is \"diffuseTex\"\n\
	return unpackDepth(texture2D(diffuseTex, coord.xy));\n\
}\n\
\n\
//linear view space depth\n\
//float getDepth(vec2 coord)\n\
//{\n\
//    return unpackDepth(texture2D(depthTex, coord.xy));\n\
//}  \n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	float minHeight_rainbow = -200.0;\n\
	float maxHeight_rainbow = 0.0;\n\
	\n\
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
	\n\
	if(gray < 0.16666)\n\
	{\n\
		b = 0.0;\n\
		g = gray*6.0;\n\
		r = 1.0;\n\
	}\n\
	else if(gray >= 0.16666 && gray < 0.33333)\n\
	{\n\
		b = 0.0;\n\
		g = 1.0;\n\
		r = 2.0 - gray*6.0;\n\
	}\n\
	else if(gray >= 0.33333 && gray < 0.5)\n\
	{\n\
		b = -2.0 + gray*6.0;\n\
		g = 1.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.5 && gray < 0.66666)\n\
	{\n\
		b = 1.0;\n\
		g = 4.0 - gray*6.0;\n\
		r = 0.0;\n\
	}\n\
	else if(gray >= 0.66666 && gray < 0.83333)\n\
	{\n\
		b = 1.0;\n\
		g = 0.0;\n\
		r = -4.0 + gray*6.0;\n\
	}\n\
	else if(gray >= 0.83333)\n\
	{\n\
		b = 6.0 - gray*6.0;\n\
		g = 0.0;\n\
		r = 1.0;\n\
	}\n\
	\n\
	float aux = r;\n\
	r = b;\n\
	b = aux;\n\
	\n\
	//b = -gray + 1.0;\n\
	//if (gray > 0.5)\n\
	//{\n\
	//	g = -gray*2.0 + 2.0; \n\
	//}\n\
	//else \n\
	//{\n\
	//	g = gray*2.0;\n\
	//}\n\
	//r = gray;\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
float getDepthShadowMap(vec2 coord)\n\
{\n\
	// currSunIdx\n\
	if(currSunIdx > 0.0 && currSunIdx < 1.0)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex, coord.xy));\n\
	}\n\
    else if(currSunIdx > 1.0 && currSunIdx < 2.0)\n\
	{\n\
		return UnpackDepth32(texture2D(shadowMapTex2, coord.xy));\n\
	}\n\
	else\n\
		return 1000.0;\n\
} \n\
\n\
float getGridLineWidth(int depth)\n\
{\n\
	float gridLineWidth = 0.025;\n\
	\n\
	if(depth == 17)\n\
	{\n\
		gridLineWidth = 0.025;\n\
	}\n\
	else{\n\
		int dif = 18 - depth;\n\
		if(dif < 1)\n\
		dif = 1;\n\
		gridLineWidth = (0.04/17.0) * float(depth/dif);\n\
	}\n\
	\n\
	return gridLineWidth;\n\
}\n\
\n\
//#define SHOW_TILING\n\
#define TAU 6.28318530718 // https://www.shadertoy.com/view/4sXfDj\n\
#define MAX_ITER 5 // https://www.shadertoy.com/view/4sXfDj\n\
\n\
// Water Caustics with BCC-Noise :https://www.shadertoy.com/view/wlc3zr\n\
\n\
vec3 causticColor(vec2 texCoord)\n\
{\n\
	// To avoid mosaic repetitions.******************\n\
	float uPlus = texCoord.x - 1.0;\n\
	float vPlus = texCoord.y - 1.0;\n\
	//float timePlus = max(uPlus, vPlus);\n\
	float timePlus = uPlus + vPlus;\n\
	if(timePlus < 0.0)\n\
	timePlus = 0.0;\n\
	// End avoid mosaic repetitions.-------------------------\n\
	\n\
	// Water turbulence effect by joltz0r 2013-07-04, improved 2013-07-07\n\
	float time = (uTime+timePlus) * .5+23.0;\n\
    // uv should be the 0-1 uv of texture...\n\
\n\
	\n\
\n\
	vec2 uv = texCoord;\n\
    \n\
#ifdef SHOW_TILING\n\
	vec2 p = mod(uv*TAU*2.0, TAU)-250.0;\n\
#else\n\
    vec2 p = mod(uv*TAU, TAU)-250.0;\n\
#endif\n\
	vec2 i = vec2(p);\n\
	float c = 1.0;\n\
	float inten = .005;\n\
\n\
	for (int n = 0; n < MAX_ITER; n++) \n\
	{\n\
		float t = time * (1.0 - (3.5 / float(n+1)));\n\
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));\n\
		c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));\n\
	}\n\
	c /= float(MAX_ITER);\n\
	c = 1.17-pow(c, 1.4);\n\
	vec3 colour = vec3(pow(abs(c), 8.0));\n\
    colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);\n\
\n\
	#ifdef SHOW_TILING\n\
	// Flash tile borders...\n\
	vec2 pixel = 2.0 / vec2(screenWidth, screenHeight);//iResolution.xy;\n\
	uv *= 2.0;\n\
\n\
	float f = floor(mod(time*.5, 2.0)); 	// Flash value.\n\
	vec2 first = step(pixel, uv) * f;		   	// Rule out first screen pixels and flash.\n\
	uv  = step(fract(uv), pixel);				// Add one line of pixels per tile.\n\
	colour = mix(colour, vec3(1.0, 1.0, 0.0), (uv.x + uv.y) * first.x * first.y); // Yellow line\n\
	\n\
	#endif\n\
\n\
	return colour;\n\
}\n\
\n\
void getTextureColor(in int activeNumber, in vec4 currColor4, in vec2 texCoord,  inout bool victory, in float externalAlpha, inout vec4 resultTextureColor)\n\
{\n\
    if(activeNumber == 1)\n\
    {\n\
        if(currColor4.w > 0.0 && externalAlpha > 0.0)\n\
        {\n\
            if(victory)\n\
            {\n\
                resultTextureColor = mix(resultTextureColor, currColor4, currColor4.w*externalAlpha);\n\
            }\n\
            else{\n\
                currColor4.w *= externalAlpha;\n\
                resultTextureColor = currColor4;\n\
            }\n\
            \n\
            victory = true;\n\
        }\n\
    }\n\
    else if(activeNumber == 2)\n\
    {\n\
        // custom image.\n\
        // Check uExternalTexCoordsArray.\n\
        \n\
    }\n\
}\n\
\n\
void main()\n\
{    \n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
\n\
	if(bIsMakingDepth)\n\
	{\n\
		gl_FragColor = packDepth(-depthValue);\n\
	}\n\
	else\n\
	{\n\
		if(uRenderType == 2)\n\
		{\n\
			gl_FragColor = oneColor4; \n\
			return;\n\
		}\n\
\n\
		if(uSeaOrTerrainType == 1)\n\
		{\n\
			//gl_FragColor = vec4(oneColor4.xyz * shadow_occlusion * lambertian, 0.5); // original.***\n\
			// Render a dot matrix in the sea surface.***\n\
			\n\
\n\
			return;\n\
		}\n\
\n\
		\n\
\n\
		float shadow_occlusion = 1.0;\n\
		if(bApplyShadow)\n\
		{\n\
			if(currSunIdx > 0.0)\n\
			{\n\
				vec3 fragCoord = gl_FragCoord.xyz;\n\
				vec3 fragWC;\n\
				\n\
				//float ligthAngle = dot(vLightDir, vNormalWC);\n\
				//if(ligthAngle > 0.0)\n\
				//{\n\
				//	// The angle between the light direction & face normal is less than 90 degree, so, the face is in shadow.***\n\
				//	shadow_occlusion = 0.5;\n\
				//}\n\
				//else\n\
				{\n\
\n\
					vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;\n\
					float tolerance = 0.9963;\n\
					//tolerance = 0.9962;\n\
					//tolerance = 1.0;\n\
					posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range\n\
					if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)\n\
					{\n\
						if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)\n\
						{\n\
							float depthRelToLight = getDepthShadowMap(posRelToLight.xy);\n\
							if(posRelToLight.z > depthRelToLight*tolerance )\n\
							{\n\
								shadow_occlusion = 0.5;\n\
							}\n\
						}\n\
					}\n\
				}\n\
			}\n\
		}\n\
		\n\
		// Do specular lighting.***\n\
		vec3 normal2 = vNormal;	\n\
		float lambertian = 1.0;\n\
		float specular;\n\
		vec2 texCoord;\n\
		if(applySpecLighting> 0.0)\n\
		{\n\
			vec3 L;\n\
			if(bApplyShadow)\n\
			{\n\
				L = vLightDir;// test.***\n\
				lambertian = max(dot(normal2, L), 0.0); // original.***\n\
			}\n\
			else\n\
			{\n\
				vec3 lightPos = vec3(0.0, 0.0, 0.0);\n\
				L = normalize(lightPos - v3Pos);\n\
				lambertian = max(dot(normal2, L), 0.0);\n\
			}\n\
			/*\n\
			specular = 0.0;\n\
			if(lambertian > 0.0)\n\
			{\n\
				vec3 R = reflect(-L, normal2);      // Reflected light vector\n\
				vec3 V = normalize(-v3Pos); // Vector to viewer\n\
				\n\
				// Compute the specular term\n\
				float specAngle = max(dot(R, V), 0.0);\n\
				specular = pow(specAngle, shininessValue);\n\
				\n\
				if(specular > 1.0)\n\
				{\n\
					specular = 1.0;\n\
				}\n\
			}\n\
			*/\n\
			// test.\n\
			lambertian += 0.3;\n\
\n\
			if(lambertian < 0.8)\n\
			{\n\
				lambertian = 0.8;\n\
			}\n\
			else if(lambertian > 1.0)\n\
			{\n\
				lambertian = 1.0;\n\
			}\n\
		}\n\
		\n\
		// check if apply ssao.\n\
		float occlusion = 1.0;\n\
		//vec3 normal2 = vNormal;	\n\
		\n\
	\n\
		vec4 textureColor = vec4(0.0);\n\
		if(colorType == 0) // one color.\n\
		{\n\
			textureColor = oneColor4;\n\
			\n\
			if(textureColor.w == 0.0)\n\
			{\n\
				discard;\n\
			}\n\
		}\n\
		else if(colorType == 2) // texture color.\n\
		{\n\
			\n\
			if(textureFlipYAxis)\n\
			{\n\
				texCoord = vec2(vTexCoord.s, 1.0 - vTexCoord.t);\n\
			}\n\
			else{\n\
				texCoord = vec2(vTexCoord.s, vTexCoord.t);\n\
			}\n\
			\n\
			bool firstColorSetted = false;\n\
			float externalAlpha = 0.0;\n\
\n\
			if(uActiveTextures[2] > 0 && uActiveTextures[2] != 10)\n\
				getTextureColor(uActiveTextures[2], texture2D(diffuseTex, texCoord), texCoord,  firstColorSetted, externalAlphasArray[2], textureColor);\n\
			if(uActiveTextures[3] > 0 && uActiveTextures[3] != 10)\n\
				getTextureColor(uActiveTextures[3], texture2D(diffuseTex_1, texCoord), texCoord,  firstColorSetted, externalAlphasArray[3], textureColor);\n\
			if(uActiveTextures[4] > 0 && uActiveTextures[4] != 10)\n\
				getTextureColor(uActiveTextures[4], texture2D(diffuseTex_2, texCoord), texCoord,  firstColorSetted, externalAlphasArray[4], textureColor);\n\
			if(uActiveTextures[5] > 0 && uActiveTextures[5] != 10)\n\
				getTextureColor(uActiveTextures[5], texture2D(diffuseTex_3, texCoord), texCoord,  firstColorSetted, externalAlphasArray[5], textureColor);\n\
			if(uActiveTextures[6] > 0 && uActiveTextures[6] != 10)\n\
				getTextureColor(uActiveTextures[6], texture2D(diffuseTex_4, texCoord), texCoord,  firstColorSetted, externalAlphasArray[6], textureColor);\n\
			if(uActiveTextures[7] > 0 && uActiveTextures[7] != 10)\n\
				getTextureColor(uActiveTextures[7], texture2D(diffuseTex_5, texCoord), texCoord,  firstColorSetted, externalAlphasArray[7], textureColor);\n\
\n\
			if(textureColor.w == 0.0)\n\
			{\n\
				discard;\n\
			}\n\
		}\n\
		else{\n\
			textureColor = oneColor4;\n\
		}\n\
\n\
		textureColor.w = externalAlpha;\n\
		vec4 fogColor = vec4(0.9, 0.9, 0.9, 1.0);\n\
		\n\
		\n\
		// Test dem image.***************************************************************************************************************\n\
		float altitude = 1000000.0;\n\
		if(uActiveTextures[5] == 10)\n\
		{\n\
			vec4 layersTextureColor = texture2D(diffuseTex_3, texCoord);\n\
			if(layersTextureColor.w > 0.0)\n\
			{\n\
				// decode the grayScale.***\n\
				altitude = uMinMaxAltitudes.x + layersTextureColor.r * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);\n\
			}\n\
\n\
			//if(layersTextureColor.w > 0.0)\n\
			//{\n\
			//	// decode the grayScale.***\n\
			//	float depth = unpackDepthOcean(layersTextureColor);\n\
			//	altitude = uMinMaxAltitudes.x + depth * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);\n\
			//}\n\
		}\n\
		// End test dem image.------------------------------------------------------------------------------------------------------------\n\
		if(bApplySsao && altitude<0.0)\n\
		{\n\
			// must find depthTex & noiseTex.***\n\
			////float farForDepth = 30000.0;\n\
			vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
			float linearDepth = getDepth(screenPos);  \n\
			vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
			vec3 origin = ray * linearDepth;  \n\
			float ssaoRadius = radius*20.0;\n\
			float tolerance = ssaoRadius/far; // original.***\n\
			////float tolerance = radius/(far-near);// test.***\n\
			////float tolerance = radius/farForDepth;\n\
\n\
			// in this shader noiseTex is \"diffusse_1\".\n\
			vec3 rvec = texture2D(diffuseTex_1, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
			vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
			vec3 bitangent = cross(normal2, tangent);\n\
			mat3 tbn = mat3(tangent, bitangent, normal2);   \n\
			//float minDepthBuffer;\n\
			//float maxDepthBuffer;\n\
			for(int i = 0; i < kernelSize; ++i)\n\
			{    	 \n\
				vec3 sample = origin + (tbn * vec3(kernel[i].x*3.0, kernel[i].y*3.0, kernel[i].z)) * ssaoRadius*2.0; // original.***\n\
				vec4 offset = projectionMatrix * vec4(sample, 1.0);					\n\
				offset.xy /= offset.w;\n\
				offset.xy = offset.xy * 0.5 + 0.5;  				\n\
				float sampleDepth = -sample.z/far;// original.***\n\
\n\
				float depthBufferValue = getDepth(offset.xy);\n\
				/*\n\
				if(depthBufferValue > 0.00391 && depthBufferValue < 0.00393)\n\
				{\n\
					if (depthBufferValue < sampleDepth-tolerance*1000.0)\n\
					{\n\
						occlusion +=  0.5;\n\
					}\n\
					\n\
					continue;\n\
				}			\n\
				*/\n\
				if (depthBufferValue < sampleDepth)//-tolerance)\n\
				{\n\
					occlusion +=  1.0;\n\
				}\n\
			} \n\
\n\
			occlusion = 1.0 - occlusion / float(kernelSize);\n\
			\n\
			shadow_occlusion *= occlusion;\n\
		}\n\
		\n\
		if(altitude < 0.0)\n\
		{\n\
			//if(uSeaOrTerrainType == 1)\n\
			//{\n\
			//	gl_FragColor = vec4(oneColor4.xyz * shadow_occlusion * lambertian, 0.5); // original.***\n\
			//	return;\n\
			//}\n\
\n\
			float minHeight_rainbow = -100.0;\n\
			float maxHeight_rainbow = 0.0;\n\
			float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
			//float gray = (vAltitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
			//vec3 rainbowColor = getRainbowColor_byHeight(altitude);\n\
\n\
			// caustics.*********************\n\
			if(uTime > 0.0 && uTileDepth > 6 && gray > 0.0)//&& altitude > -120.0)\n\
			{\n\
				// Active this code if want same size caustic effects for different tileDepths.***\n\
				// Take tileDepth 14 as the unitary tile depth.\n\
				//float tileDethDiff = float(16 - uTileDepth);\n\
				//vec2 cauticsTexCoord = texCoord*pow(2.0, tileDethDiff);\n\
				//-----------------------------------------------------------------------\n\
				vec2 cauticsTexCoord = texCoord;\n\
				vec3 causticColor = causticColor(cauticsTexCoord)*gray*0.4;\n\
				//textureColor = vec4(mix(textureColor.rgb, causticColor, gray), externalAlpha);\n\
				textureColor = vec4(textureColor.r+ causticColor.x, textureColor.g+ causticColor.y, textureColor.b+ causticColor.z, 1.0);\n\
			}\n\
			// End caustics.--------------------------\n\
\n\
			\n\
			if(gray < 0.05)\n\
			gray = 0.05;\n\
			float red = gray + 0.2;\n\
			float green = gray + 0.6;\n\
			float blue = gray*2.0 + 2.0;\n\
			//fogColor = vec4(gray*1.3, gray*2.1, gray*2.7, 1.0);\n\
			fogColor = vec4(red, green, blue, 1.0);\n\
			\n\
			// Test drawing grid.***\n\
			//if(uTileDepth > 7)\n\
			//{\n\
			//	float numSegs = 5.0;\n\
			//	float fX = fract(texCoord.x * numSegs);\n\
			//\n\
			//	float gridLineWidth = getGridLineWidth(uTileDepth);\n\
			//	if( fX < gridLineWidth || fX > 1.0-gridLineWidth)\n\
			//	{\n\
			//		vec3 color = vec3(0.99, 0.5, 0.5);\n\
			//		gl_FragColor = vec4(color.rgb* shadow_occlusion * lambertian, 1.0);\n\
			//		return;\n\
			//	}\n\
			//	\n\
			//	float fY = fract(texCoord.y * numSegs);\n\
			//	if( fY < gridLineWidth|| fY > 1.0-gridLineWidth)\n\
			//	{\n\
			//		vec3 color = vec3(0.3, 0.5, 0.99);\n\
			//		gl_FragColor = vec4(color.rgb* shadow_occlusion * lambertian, 1.0);\n\
			//		return;\n\
			//	}\n\
			//}\n\
			\n\
			// End test drawing grid.---\n\
			float specularReflectionCoef = 0.6;\n\
			vec3 specularColor = vec3(0.8, 0.8, 0.8);\n\
			textureColor = mix(textureColor, fogColor, 0.2); \n\
			//gl_FragColor = vec4(finalColor.xyz * shadow_occlusion * lambertian + specularReflectionCoef * specular * specularColor * shadow_occlusion, 1.0); // with specular.***\n\
			//gl_FragColor = vec4(finalColor.xyz * shadow_occlusion * lambertian, 1.0); // original.***\n\
			gl_FragColor = vec4(textureColor.xyz * shadow_occlusion * lambertian, 1.0); // original.***\n\
\n\
			return;\n\
		}\n\
		else{\n\
			if(uSeaOrTerrainType == 1)\n\
			discard;\n\
		\n\
		}\n\
		\n\
		\n\
		vec4 finalColor = mix(textureColor, fogColor, vFogAmount); \n\
		gl_FragColor = vec4(finalColor.xyz * shadow_occlusion * lambertian, 1.0); // original.***\n\
		//gl_FragColor = textureColor; // test.***\n\
		//gl_FragColor = vec4(vNormal.xyz, 1.0); // test.***\n\
		\n\
		//if(currSunIdx > 0.0 && currSunIdx < 1.0 && shadow_occlusion<0.9)gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
		\n\
	}\n\
}";
ShaderSource.TinTerrainVS = "\n\
attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec4 color4;\n\
attribute vec2 texCoord;\n\
attribute float altitude;\n\
\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrix;\n\
uniform mat4 normalMatrix4;\n\
uniform mat4 sunMatrix[2]; \n\
uniform mat4 buildingRotMatrix;  \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 sunPosHIGH[2];\n\
uniform vec3 sunPosLOW[2];\n\
uniform vec3 sunDirWC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec4 oneColor4;\n\
uniform bool bUse1Color;\n\
uniform bool hasTexture;\n\
uniform bool bIsMakingDepth;\n\
uniform bool bExistAltitudes;\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bApplyShadow;\n\
uniform int sunIdx;\n\
uniform bool bApplySpecularLighting;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying float applySpecLighting;\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;   \n\
varying vec3 uAmbientColor;\n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
varying vec3 v3Pos;\n\
varying float depthValue;\n\
varying float vFogAmount;\n\
\n\
varying vec4 vPosRelToLight; \n\
varying vec3 vLightDir; \n\
varying vec3 vNormalWC;\n\
varying float currSunIdx;\n\
varying float vAltitude;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
void main()\n\
{	\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	vNormal = normalize((normalMatrix4 * vec4(normal.x, normal.y, normal.z, 1.0)).xyz); // original.***\n\
	vLightDir = vec3(normalMatrix4*vec4(sunDirWC.xyz, 1.0)).xyz;\n\
	vAltitude = altitude;\n\
	\n\
	currSunIdx = -1.0; // initially no apply shadow.\n\
	if(bApplyShadow && !bIsMakingDepth)\n\
	{\n\
		vec3 rotatedNormal = vec3(0.0, 0.0, 1.0); // provisional.***\n\
		vNormalWC = rotatedNormal;\n\
					\n\
		// the sun lights count are 2.\n\
		vec3 currSunPosLOW;\n\
		vec3 currSunPosHIGH;\n\
		mat4 currSunMatrix;\n\
		if(sunIdx == 0)\n\
		{\n\
			currSunPosLOW = sunPosLOW[0];\n\
			currSunPosHIGH = sunPosHIGH[0];\n\
			currSunMatrix = sunMatrix[0];\n\
			currSunIdx = 0.5;\n\
		}\n\
		else if(sunIdx == 1)\n\
		{\n\
			currSunPosLOW = sunPosLOW[1];\n\
			currSunPosHIGH = sunPosHIGH[1];\n\
			currSunMatrix = sunMatrix[1];\n\
			currSunIdx = 1.5;\n\
		}\n\
		\n\
		// Calculate the vertex relative to light.***\n\
		vec3 highDifferenceSun = objPosHigh.xyz - currSunPosHIGH.xyz;\n\
		vec3 lowDifferenceSun = objPosLow.xyz - currSunPosLOW.xyz;\n\
		vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
		vec4 posRelToLightAux = currSunMatrix * pos4Sun;\n\
		\n\
		// now, check if \"posRelToLightAux\" is inside of the lightVolume (inside of the depthTexture of the light).\n\
		vec3 posRelToLightNDC = posRelToLightAux.xyz / posRelToLightAux.w;\n\
		vPosRelToLight = posRelToLightAux;\n\
	}\n\
	\n\
	if(bApplySpecularLighting)\n\
	{\n\
		applySpecLighting = 1.0;\n\
	}\n\
	else{\n\
		applySpecLighting = -1.0;\n\
	}\n\
	\n\
	if(bIsMakingDepth)\n\
	{\n\
		\n\
		depthValue = (modelViewMatrixRelToEye * pos4).z/far;\n\
	}\n\
	else\n\
	{\n\
		\n\
		vTexCoord = texCoord;\n\
	}\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	v3Pos = (modelViewMatrixRelToEye * pos4).xyz;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://www.gamasutra.com/blogs/BranoKemen/20090812/85207/Logarithmic_Depth_Buffer.php\n\
		// z = log(C*z + 1) / log(C*Far + 1) * w\n\
		// https://android.developreference.com/article/21119961/Logarithmic+Depth+Buffer+OpenGL\n\
		//if(v3Pos.z < 0.0)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			float Fcoef = 2.0 / log2(far + 1.0);\n\
			gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * Fcoef;\n\
		}\n\
	}\n\
\n\
	// calculate fog amount.\n\
	float fogParam = 1.15 * v3Pos.z/(far - 10000.0);\n\
	float fogParam2 = fogParam*fogParam;\n\
	vFogAmount = fogParam2*fogParam2;\n\
}";
ShaderSource.update_frag = "precision highp float;\n\
\n\
uniform sampler2D u_particles;\n\
uniform sampler2D u_wind;\n\
uniform vec2 u_wind_res;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform vec3 u_geoCoordRadiansMax;\n\
uniform vec3 u_geoCoordRadiansMin;\n\
uniform float u_rand_seed;\n\
uniform float u_speed_factor;\n\
uniform float u_interpolation;\n\
uniform float u_drop_rate;\n\
uniform float u_drop_rate_bump;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform vec4 u_visibleTilesRanges[16];\n\
uniform int u_visibleTilesRangesCount;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
// pseudo-random generator\n\
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
// https://community.khronos.org/t/random-values/75728\n\
float rand(const vec2 co) {\n\
    float t = dot(rand_constants.xy, co);\n\
    return fract(sin(t) * (rand_constants.z + t));\n\
}\n\
\n\
// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation\n\
vec2 lookup_wind(const vec2 uv) {\n\
    //return texture2D(u_wind, uv).rg; // lower-res hardware filtering\n\
	\n\
    vec2 px = 1.0 / u_wind_res;\n\
    vec2 vc = (floor(uv * u_wind_res)) * px;\n\
    vec2 f = fract(uv * u_wind_res);\n\
    vec2 tl = texture2D(u_wind, vc).rg;\n\
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;\n\
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;\n\
    vec2 br = texture2D(u_wind, vc + px).rg;\n\
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
	\n\
}\n\
\n\
bool checkFrustumCulling(vec2 pos)\n\
{\n\
	for(int i=0; i<16; i++)\n\
	{\n\
		if(i >= u_visibleTilesRangesCount)\n\
		return false;\n\
		\n\
		vec4 range = u_visibleTilesRanges[i]; // range = minX(x), minY(y), maxX(z), maxY(w)\n\
\n\
		float minX = range.x;\n\
		float minY = range.y;\n\
		float maxX = range.z;\n\
		float maxY = range.w;\n\
		\n\
		if(pos.x > minX && pos.x < maxX)\n\
		{\n\
			if(pos.y > minY && pos.y < maxY)\n\
			{\n\
				return true;\n\
			}\n\
		}\n\
	}\n\
	return false;\n\
}\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_particles, v_tex_pos);\n\
    vec2 pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a); // decode particle position from pixel RGBA\n\
	vec2 windMapTexCoord = pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(windMapTexCoord));\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
    // take EPSG:4236 distortion into account for calculating where the particle moved\n\
	float minLat = u_geoCoordRadiansMin.y;\n\
	float maxLat = u_geoCoordRadiansMax.y;\n\
	float latRange = maxLat - minLat;\n\
	float distortion = cos((minLat + pos.y * latRange ));\n\
    vec2 offset = vec2(velocity.x / distortion, -velocity.y) * 0.0001 * u_speed_factor * u_interpolation;\n\
\n\
    // update particle position, wrapping around the date line\n\
    pos = fract(1.0 + pos + offset);\n\
\n\
\n\
    // drop rate is a chance a particle will restart at random position, to avoid degeneration\n\
	float drop = 0.0;\n\
\n\
	if(u_interpolation < 0.99) // 0.9\n\
	{\n\
		drop = 0.0;\n\
	}\n\
	else\n\
	{\n\
		// a random seed to use for the particle drop\n\
		vec2 seed = (pos + v_tex_pos) * u_rand_seed;\n\
		float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;\n\
		drop = step(1.0 - drop_rate, rand(seed));\n\
	}\n\
	/*\n\
	if(drop > 0.5) // 0.01\n\
	{\n\
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
		float randomValue = (u_rand_seed);\n\
		int index = int(floor(float(u_visibleTilesRangesCount+1)*(randomValue)));\n\
		for(int i=0; i<32; i++)\n\
		{\n\
			if(i >= u_visibleTilesRangesCount)\n\
			break;\n\
		\n\
			if(i == index)\n\
			{\n\
				vec4 posAux4 = u_visibleTilesRanges[i];\n\
				float width = (posAux4.z-posAux4.x);\n\
				float height = (posAux4.w-posAux4.y);\n\
				float scaledX = posAux4.x + random_pos.x*width;\n\
				float scaledY = posAux4.y + random_pos.y*height;\n\
				random_pos = vec2(scaledX, 1.0-scaledY);\n\
				pos = random_pos;\n\
				break;\n\
			}\n\
		}\n\
	}\n\
	*/\n\
	\n\
	\n\
	if(drop > 0.01)\n\
	{\n\
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
		pos = random_pos;\n\
	}\n\
	\n\
\n\
    // encode the new particle position back into RGBA\n\
    gl_FragColor = vec4(\n\
        fract(pos * 255.0),\n\
        floor(pos * 255.0) / 255.0);\n\
}";
ShaderSource.vol_fs = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
//---------------------------------------------------------\n\
// MACROS\n\
//---------------------------------------------------------\n\
\n\
#define EPS       0.0001\n\
#define PI        3.14159265\n\
#define HALFPI    1.57079633\n\
#define ROOTTHREE 1.73205081\n\
\n\
#define EQUALS(A,B) ( abs((A)-(B)) < EPS )\n\
#define EQUALSZERO(A) ( ((A)<EPS) && ((A)>-EPS) )\n\
\n\
\n\
//---------------------------------------------------------\n\
// CONSTANTS\n\
//---------------------------------------------------------\n\
\n\
// 32 48 64 96 128\n\
#define MAX_STEPS 64\n\
\n\
#define LIGHT_NUM 2\n\
//#define uTMK 20.0\n\
#define TM_MIN 0.05\n\
\n\
\n\
//---------------------------------------------------------\n\
// SHADER VARS\n\
//---------------------------------------------------------\n\
\n\
varying vec2 vUv;\n\
varying vec3 vPos0; // position in world coords\n\
varying vec3 vPos1; // position in object coords\n\
varying vec3 vPos1n; // normalized 0 to 1, for texture lookup\n\
\n\
uniform vec3 uOffset; // TESTDEBUG\n\
\n\
uniform vec3 uCamPos;\n\
\n\
uniform vec3 uLightP[LIGHT_NUM];  // point lights\n\
uniform vec3 uLightC[LIGHT_NUM];\n\
\n\
uniform vec3 uColor;      // color of volume\n\
uniform sampler2D uTex;   // 3D(2D) volume texture\n\
uniform vec3 uTexDim;     // dimensions of texture\n\
\n\
uniform float uTMK;\n\
\n\
float gStepSize;\n\
float gStepFactor;\n\
\n\
\n\
//---------------------------------------------------------\n\
// PROGRAM\n\
//---------------------------------------------------------\n\
\n\
// TODO: convert world to local volume space\n\
vec3 toLocal(vec3 p) {\n\
  return p + vec3(0.5);\n\
}\n\
\n\
float sampleVolTex(vec3 pos) {\n\
  pos = pos + uOffset; // TESTDEBUG\n\
  \n\
  // note: z is up in 3D tex coords, pos.z is tex.y, pos.y is zSlice\n\
  float zSlice = (1.0-pos.y)*(uTexDim.z-1.0);   // float value of slice number, slice 0th to 63rd\n\
  \n\
  // calc pixels from top of texture\n\
  float fromTopPixels =\n\
    floor(zSlice)*uTexDim.y +   // offset pix from top of tex, from upper slice  \n\
    pos.z*(uTexDim.y-1.0) +     // y pos in pixels, range 0th to 63rd pix\n\
    0.5;  // offset to center of cell\n\
    \n\
  // calc y tex coords of two slices\n\
  float y0 = min( (fromTopPixels)/(uTexDim.y*uTexDim.z), 1.0);\n\
  float y1 = min( (fromTopPixels+uTexDim.y)/(uTexDim.y*uTexDim.z), 1.0);\n\
    \n\
  // get (bi)linear interped texture reads at two slices\n\
  float z0 = texture2D(uTex, vec2(pos.x, y0)).g;\n\
  float z1 = texture2D(uTex, vec2(pos.x, y1)).g;\n\
  \n\
  // lerp them again (thus trilinear), using remaining fraction of zSlice\n\
  return mix(z0, z1, fract(zSlice));\n\
}\n\
\n\
// accumulate density by ray marching\n\
float getDensity(vec3 ro, vec3 rd) {\n\
  vec3 step = rd*gStepSize;\n\
  vec3 pos = ro;\n\
  \n\
  float density = 0.0;\n\
  \n\
  for (int i=0; i<MAX_STEPS; ++i) {\n\
    density += (1.0-density) * sampleVolTex(pos) * gStepFactor;\n\
    //density += sampleVolTex(pos);\n\
    \n\
    pos += step;\n\
    \n\
    if (density > 0.95 ||\n\
      pos.x > 1.0 || pos.x < 0.0 ||\n\
      pos.y > 1.0 || pos.y < 0.0 ||\n\
      pos.z > 1.0 || pos.z < 0.0)\n\
      break;\n\
  }\n\
  \n\
  return density;\n\
}\n\
\n\
// calc transmittance\n\
float getTransmittance(vec3 ro, vec3 rd) {\n\
  vec3 step = rd*gStepSize;\n\
  vec3 pos = ro;\n\
  \n\
  float tm = 1.0;\n\
  \n\
  for (int i=0; i<MAX_STEPS; ++i) {\n\
    tm *= exp( -uTMK*gStepSize*sampleVolTex(pos) );\n\
    \n\
    pos += step;\n\
    \n\
    if (tm < TM_MIN ||\n\
      pos.x > 1.0 || pos.x < 0.0 ||\n\
      pos.y > 1.0 || pos.y < 0.0 ||\n\
      pos.z > 1.0 || pos.z < 0.0)\n\
      break;\n\
  }\n\
  \n\
  return tm;\n\
}\n\
\n\
vec4 raymarchNoLight(vec3 ro, vec3 rd) {\n\
  vec3 step = rd*gStepSize;\n\
  vec3 pos = ro;\n\
  \n\
  vec3 col = vec3(0.0);\n\
  float tm = 1.0;\n\
  \n\
  for (int i=0; i<MAX_STEPS; ++i) {\n\
    float dtm = exp( -uTMK*gStepSize*sampleVolTex(pos) );\n\
    tm *= dtm;\n\
    \n\
    col += (1.0-dtm) * uColor * tm;\n\
    \n\
    pos += step;\n\
    \n\
    if (tm < TM_MIN ||\n\
      pos.x > 1.0 || pos.x < 0.0 ||\n\
      pos.y > 1.0 || pos.y < 0.0 ||\n\
      pos.z > 1.0 || pos.z < 0.0)\n\
      break;\n\
  }\n\
  \n\
  float alpha = 1.0-tm;\n\
  return vec4(col/alpha, alpha);\n\
}\n\
\n\
vec4 raymarchLight(vec3 ro, vec3 rd) {\n\
  vec3 step = rd*gStepSize;\n\
  vec3 pos = ro;\n\
  \n\
  \n\
  vec3 col = vec3(0.0);   // accumulated color\n\
  float tm = 1.0;         // accumulated transmittance\n\
  \n\
  for (int i=0; i<MAX_STEPS; ++i) {\n\
    // delta transmittance \n\
    float dtm = exp( -uTMK*gStepSize*sampleVolTex(pos) );\n\
    tm *= dtm;\n\
    \n\
    // get contribution per light\n\
    for (int k=0; k<LIGHT_NUM; ++k) {\n\
      vec3 ld = normalize( toLocal(uLightP[k])-pos );\n\
      float ltm = getTransmittance(pos,ld);\n\
      \n\
      col += (1.0-dtm) * uColor*uLightC[k] * tm * ltm;\n\
    }\n\
    \n\
    pos += step;\n\
    \n\
    if (tm < TM_MIN ||\n\
      pos.x > 1.0 || pos.x < 0.0 ||\n\
      pos.y > 1.0 || pos.y < 0.0 ||\n\
      pos.z > 1.0 || pos.z < 0.0)\n\
      break;\n\
  }\n\
  \n\
  float alpha = 1.0-tm;\n\
  return vec4(col/alpha, alpha);\n\
}\n\
\n\
void main() {\n\
  // in world coords, just for now\n\
  vec3 ro = vPos1n;\n\
  vec3 rd = normalize( ro - toLocal(uCamPos) );\n\
  //vec3 rd = normalize(ro-uCamPos);\n\
  \n\
  // step_size = root_three / max_steps ; to get through diagonal  \n\
  gStepSize = ROOTTHREE / float(MAX_STEPS);\n\
  gStepFactor = 32.0 * gStepSize;\n\
  \n\
  gl_FragColor = raymarchLight(ro, rd);\n\
  //gl_FragColor = vec4(uColor, getDensity(ro,rd));\n\
  //gl_FragColor = vec4(vec3(sampleVolTex(pos)), 1.0);\n\
  //gl_FragColor = vec4(vPos1n, 1.0);\n\
  //gl_FragColor = vec4(uLightP[0], 1.0);\n\
}";
ShaderSource.vol_vs = "attribute vec3 aPosition;\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
varying vec3 vNormal;\n\
varying vec3 vPosObjectCoord;\n\
varying vec3 vPosCameraCoord;\n\
varying vec3 vPosWorldCoord;\n\
\n\
// Render a fullScreen quad (2 triangles).***\n\
void main()\n\
{\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}";
ShaderSource.wgs84_volumFS = "precision mediump float;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
uniform sampler2D volumeTex;\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float screenWidth;    \n\
uniform float screenHeight;\n\
uniform float aspectRatio;\n\
uniform float far;\n\
uniform float fovyRad;\n\
uniform float tanHalfFovy;\n\
\n\
// volume tex definition.***\n\
uniform int texNumCols;\n\
uniform int texNumRows;\n\
uniform int texNumSlices;\n\
uniform int numSlicesPerStacks;\n\
uniform int slicesNumCols;\n\
uniform int slicesNumRows;\n\
uniform float maxLon;\n\
uniform float minLon;\n\
uniform float maxLat;\n\
uniform float minLat;\n\
uniform float maxAlt;\n\
uniform float minAlt;\n\
uniform vec4 cuttingPlanes[6];   \n\
uniform int cuttingPlanesCount;\n\
\n\
uniform float maxValue;\n\
uniform float minValue;\n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tanHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
} \n\
\n\
float squaredLength(vec3 point1, vec3 point2)\n\
{\n\
	float a = point1.x - point2.x;\n\
	float b = point1.y - point2.y;\n\
	float c = point1.z - point2.z;\n\
	\n\
	float sqDist = a*a + b*b + c*c;\n\
	return sqDist;\n\
}\n\
\n\
void intersectionLineSphere(float radius, vec3 rayPos, vec3 rayDir, out int intersectType, out vec3 nearIntersectPos, out vec3 farIntersectPos)\n\
{\n\
	// line: (x, y, z) = x1 + t(x2 - x1), y1 + t(y2 - y1), z1 + t(z2 - z1)\n\
	// sphere: (x - x3)^2 + (y - y3)^2 + (z - z3)^2 = r^2, where x3, y3, z3 is the center of the sphere.\n\
	\n\
	// line:\n\
	vec3 p1 = rayPos;\n\
	vec3 lineDir = rayDir;\n\
	float dist = 1000.0;// any value is ok.***\n\
	vec3 p2 = vec3(p1.x + lineDir.x * dist, p1.y + lineDir.y * dist, p1.z + lineDir.z * dist);\n\
	float x1 = p1.x;\n\
	float y1 = p1.y;\n\
	float z1 = p1.z;\n\
	float x2 = p2.x;\n\
	float y2 = p2.y;\n\
	float z2 = p2.z;\n\
\n\
	// sphere:\n\
	float x3 = 0.0;\n\
	float y3 = 0.0;\n\
	float z3 = 0.0;\n\
	float r = radius;\n\
	\n\
	// resolve:\n\
	float x21 = (x2-x1);\n\
	float y21 = (y2-y1);\n\
	float z21 = (z2-z1);\n\
	\n\
	float a = x21*x21 + y21*y21 + z21*z21;\n\
	\n\
	float x13 = (x1-x3);\n\
	float y13 = (y1-y3);\n\
	float z13 = (z1-z3);\n\
	\n\
	float b = 2.0*(x21 * x13 + y21 * y13 + z21 * z13);\n\
	\n\
	float c = x3*x3 + y3*y3 + z3*z3 + x1*x1 + y1*y1 + z1*z1 - 2.0*(x3*x1 + y3*y1+ z3*z1) - r*r;\n\
	\n\
	float discriminant = b*b - 4.0*a*c;\n\
	\n\
	if (discriminant < 0.0)\n\
	{\n\
		// no intersection.***\n\
		intersectType = 0;\n\
	}\n\
	else if (discriminant == 0.0)\n\
	{\n\
		// this is tangent.***\n\
		intersectType = 1;\n\
		\n\
		float t1 = (-b)/(2.0*a);\n\
		nearIntersectPos = vec3(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);\n\
	}\n\
	else\n\
	{\n\
		intersectType = 2;\n\
		\n\
		// find the nearest to p1.***\n\
		float sqrtDiscriminant = sqrt(discriminant);\n\
		float t1 = (-b + sqrtDiscriminant)/(2.0*a);\n\
		float t2 = (-b - sqrtDiscriminant)/(2.0*a);\n\
		\n\
		// solution 1.***\n\
		vec3 intersectPoint1 = vec3(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);\n\
		vec3 intersectPoint2 = vec3(x1 + (x2 - x1)*t2, y1 + (y2 - y1)*t2, z1 + (z2 - z1)*t2);\n\
		\n\
		float dist1 = squaredLength(p1,intersectPoint1);\n\
		float dist2 = squaredLength(p1,intersectPoint2);\n\
		\n\
		// nearIntersectPos, out vec3 farIntersectPos\n\
		if (dist1 < dist2)\n\
		{\n\
			nearIntersectPos = intersectPoint1;\n\
			farIntersectPos = intersectPoint2;\n\
		}\n\
		else\n\
		{\n\
			nearIntersectPos = intersectPoint2;\n\
			farIntersectPos = intersectPoint1;\n\
		}\n\
	}\n\
}\n\
\n\
float atan2(float y, float x) \n\
{\n\
	if(x > 0.0)\n\
	{\n\
		return atan(y/x);\n\
	}\n\
	else if(x < 0.0)\n\
	{\n\
		if(y >= 0.0)\n\
		{\n\
			return atan(y/x) + M_PI;\n\
		}\n\
		else{\n\
			return atan(y/x) - M_PI;\n\
		}\n\
	}\n\
	else if(x == 0.0)\n\
	{\n\
		if(y>0.0)\n\
		{\n\
			return M_PI/2.0;\n\
		}\n\
		else if(y<0.0)\n\
		{\n\
			return -M_PI/2.0;\n\
		}\n\
		else{\n\
			return 0.0; // return undefined.***\n\
		}\n\
	}\n\
}\n\
\n\
void cartesianToGeographicWgs84(vec3 point, out vec3 result) \n\
{\n\
	// From WebWorldWind.***\n\
	// According to H. Vermeille, An analytical method to transform geocentric into geodetic coordinates\n\
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf\n\
	\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float equatorialRadius = 6378137.0;\n\
\n\
	// wwwind coord type.***\n\
	// X = point.z;\n\
	// Y = point.x;\n\
	// Z = point.y;\n\
\n\
	// magoWorld coord type.***\n\
	float X = point.x;\n\
	float Y = point.y;\n\
	float Z = point.z;\n\
	float XXpYY = X * X + Y * Y;\n\
	float sqrtXXpYY = sqrt(XXpYY);\n\
	float a = equatorialRadius;\n\
	float ra2 = 1.0 / (a * a);\n\
	float e2 = firstEccentricitySquared;\n\
	float e4 = e2 * e2;\n\
	float p = XXpYY * ra2;\n\
	float q = Z * Z * (1.0 - e2) * ra2;\n\
	float r = (p + q - e4) / 6.0;\n\
	float h;\n\
	float phi;\n\
	float u;\n\
	float evoluteBorderTest = 8.0 * r * r * r + e4 * p * q;\n\
	float rad1;\n\
	float rad2;\n\
	float rad3;\n\
	float atanAux;\n\
	float v;\n\
	float w;\n\
	float k;\n\
	float D;\n\
	float sqrtDDpZZ;\n\
	float e;\n\
	float lambda;\n\
	float s2;\n\
	float cbrtFac = 1.0/3.0;\n\
\n\
	if (evoluteBorderTest > 0.0 || q != 0.0) \n\
	{\n\
		if (evoluteBorderTest > 0.0) \n\
		{\n\
			// Step 2: general case\n\
			rad1 = sqrt(evoluteBorderTest);\n\
			rad2 = sqrt(e4 * p * q);\n\
\n\
			// 10*e2 is my arbitrary decision of what Vermeille means by near... the cusps of the evolute.\n\
			if (evoluteBorderTest > 10.0 * e2) \n\
			{\n\
				rad3 = pow((rad1 + rad2) * (rad1 + rad2), cbrtFac);\n\
				u = r + 0.5 * rad3 + 2.0 * r * r / rad3;\n\
			}\n\
			else \n\
			{\n\
				u = r + 0.5 * pow((rad1 + rad2) * (rad1 + rad2), cbrtFac)\n\
					+ 0.5 * pow((rad1 - rad2) * (rad1 - rad2), cbrtFac);\n\
			}\n\
		}\n\
		else \n\
		{\n\
			// Step 3: near evolute\n\
			rad1 = sqrt(-evoluteBorderTest);\n\
			rad2 = sqrt(-8.0 * r * r * r);\n\
			rad3 = sqrt(e4 * p * q);\n\
			atanAux = 2.0 * atan2(rad3, rad1 + rad2) / 3.0;\n\
\n\
			u = -4.0 * r * sin(atanAux) * cos(M_PI / 6.0 + atanAux);\n\
		}\n\
\n\
		v = sqrt(u * u + e4 * q);\n\
		w = e2 * (u + v - q) / (2.0 * v);\n\
		k = (u + v) / (sqrt(w * w + u + v) + w);\n\
		D = k * sqrtXXpYY / (k + e2);\n\
		sqrtDDpZZ = sqrt(D * D + Z * Z);\n\
\n\
		h = (k + e2 - 1.0) * sqrtDDpZZ / k;\n\
		phi = 2.0 * atan2(Z, sqrtDDpZZ + D);\n\
	}\n\
	else \n\
	{\n\
		// Step 4: singular disk\n\
		rad1 = sqrt(1.0 - e2);\n\
		rad2 = sqrt(e2 - p);\n\
		e = sqrt(e2);\n\
\n\
		h = -a * rad1 * rad2 / e;\n\
		phi = rad2 / (e * rad2 + rad1 * sqrt(p));\n\
	}\n\
\n\
	// Compute lambda\n\
	s2 = sqrt(2.0);\n\
	if ((s2 - 1.0) * Y < sqrtXXpYY + X) \n\
	{\n\
		// case 1 - -135deg < lambda < 135deg\n\
		lambda = 2.0 * atan2(Y, sqrtXXpYY + X);\n\
	}\n\
	else if (sqrtXXpYY + Y < (s2 + 1.0) * X) \n\
	{\n\
		// case 2 - -225deg < lambda < 45deg\n\
		lambda = -M_PI * 0.5 + 2.0 * atan2(X, sqrtXXpYY - Y);\n\
	}\n\
	else \n\
	{\n\
		// if (sqrtXXpYY-Y<(s2=1)*X) {  // is the test, if needed, but it's not\n\
		// case 3: - -45deg < lambda < 225deg\n\
		lambda = M_PI * 0.5 - 2.0 * atan2(X, sqrtXXpYY + Y);\n\
	}\n\
\n\
	float factor = 180.0 / M_PI;\n\
	result = vec3(factor * lambda, factor * phi, h); // (longitude, latitude, altitude).***\n\
}\n\
\n\
bool isPointRearCamera(vec3 point, vec3 camPos, vec3 camDir)\n\
{\n\
	bool isRear = false;\n\
	float lambdaX = 10.0;\n\
	float lambdaY = 10.0;\n\
	float lambdaZ = 10.0;\n\
	if(abs(camDir.x) > 0.0000001)\n\
	{\n\
		float lambdaX = (point.x - camPos.x)/camDir.x;\n\
	}\n\
	else if(abs(camDir.y) > 0.0000001)\n\
	{\n\
		float lambdaY = (point.y - camPos.y)/camDir.y;\n\
	}\n\
	else if(abs(camDir.z) > 0.0000001)\n\
	{\n\
		float lambdaZ = (point.z - camPos.z)/camDir.z;\n\
	}\n\
	\n\
	if(lambdaZ < 0.0 || lambdaY < 0.0 || lambdaX < 0.0)\n\
			isRear = true;\n\
		else\n\
			isRear = false;\n\
	return isRear;\n\
}\n\
\n\
float distPointToPlane(vec3 point, vec4 plane)\n\
{\n\
	return (point.x*plane.x + point.y*plane.y + point.z*plane.z + plane.w);\n\
}\n\
\n\
bool getValue(vec3 geoLoc, out vec4 value)\n\
{\n\
	// geoLoc = (longitude, latitude, altitude).***\n\
	float lon = geoLoc.x;\n\
	float lat = geoLoc.y;\n\
	float alt = geoLoc.z;\n\
	\n\
	// 1rst, check if geoLoc intersects the volume.***\n\
	// Note: minLon, maxLon, minLat, maxLat, minAlt & maxAlt are uniforms.***\n\
	if(lon < minLon || lon > maxLon)\n\
		return false;\n\
	else if(lat < minLat || lat > maxLat)\n\
		return false;\n\
	else if(alt < minAlt || alt > maxAlt)\n\
		return false;\n\
		\n\
	float lonRange = maxLon - minLon;\n\
	float latRange = maxLat - minLat;\n\
	float altRange = maxAlt - minAlt;\n\
	float col = (lon - minLon)/lonRange * float(slicesNumCols); \n\
	float row = (lat - minLat)/latRange * float(slicesNumRows); \n\
	float slice = (alt - minAlt)/altRange * float(texNumSlices); // slice if texture has only one stack.***\n\
	float sliceDown = floor(slice);\n\
	float sliceUp = ceil(slice);\n\
	float sliceDownDist = slice - sliceDown;\n\
	//slice = 18.0; // test. force slice to nearest to ground.***\n\
	\n\
	float stackDown = floor(sliceDown/float(numSlicesPerStacks));\n\
	float realSliceDown = sliceDown - stackDown * float(numSlicesPerStacks);\n\
	float tx = stackDown * float(slicesNumCols) + col;\n\
	float ty = realSliceDown * float(slicesNumRows) + row;\n\
	vec2 texCoord = vec2(tx/float(texNumCols), ty/float(texNumRows));\n\
	vec4 valueDown = texture2D(volumeTex, texCoord);\n\
	\n\
	if(sliceDown < float(texNumSlices-1))\n\
	{\n\
		float stackUp = floor(sliceUp/float(numSlicesPerStacks));\n\
		float realSliceUp = sliceUp - stackUp * float(numSlicesPerStacks);\n\
		float tx2 = stackUp * float(slicesNumCols) + col;\n\
		float ty2 = realSliceUp * float(slicesNumRows) + row;\n\
		vec2 texCoord2 = vec2(tx2/float(texNumCols), ty2/float(texNumRows));\n\
		vec4 valueUp = texture2D(volumeTex, texCoord2);\n\
		value = valueDown*(1.0-sliceDownDist)+valueUp*(sliceDownDist);\n\
	}\n\
	else{\n\
		value = valueDown;\n\
	}\n\
	//if((value.r * (maxValue - minValue)) > maxValue * 0.3)\n\
	//	return true;\n\
	//else return false;\n\
	return true;\n\
}\n\
\n\
void main() {\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	float linearDepth = 1.0; // the quad is 1m of dist of the camera.***          \n\
    vec3 rayCamCoord = getViewRay(screenPos) * linearDepth;  \n\
	rayCamCoord = normalize(rayCamCoord);\n\
	\n\
	vec3 camTarget = rayCamCoord * 10000.0;\n\
	vec4 camPosWorld = vec4(encodedCameraPositionMCHigh + encodedCameraPositionMCLow, 1.0);\n\
	vec4 camTargetWorld = modelViewMatrixInv * vec4(camTarget.xyz, 1.0);\n\
	vec3 camDirWorld = camTargetWorld.xyz - camPosWorld.xyz;\n\
	camDirWorld = normalize(camDirWorld);\n\
\n\
	// now, must find sampling points.***\n\
	int intersectType = 0;\n\
	vec3 nearP;\n\
	vec3 farP;\n\
	float radius = 6378137.0 + maxAlt; // equatorial radius.***\n\
	//radius = 6250000.0 + maxAlt; // test radius.***\n\
	\n\
	intersectionLineSphere(radius, camPosWorld.xyz, camDirWorld, intersectType, nearP, farP);\n\
	\n\
	if(intersectType == 0)\n\
	{\n\
		discard;\n\
	}\n\
		\n\
	if(intersectType == 1)\n\
	{\n\
		// provisionally discard.***\n\
		discard;	\n\
	}\n\
	\n\
	// check if nearP is rear of the camera.***\n\
	if(isPointRearCamera(nearP, camPosWorld.xyz, camDirWorld.xyz))\n\
	{\n\
		nearP = vec3(camPosWorld.xyz);\n\
	}\n\
	float dist = distance(nearP, farP);\n\
	float testDist = dist;\n\
	if(dist > 1500000.0)\n\
		testDist = 1500000.0;\n\
	\n\
	// now calculate the geographicCoords of 2 points.***\n\
	// now, depending the dist(nearP, endPoint), determine numSmples.***\n\
	// provisionally take 16 samples.***\n\
	float numSamples = 512.0;\n\
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);\n\
	float alpha = 0.8/numSamples;\n\
	float tempRange = maxValue - minValue;\n\
	vec4 value;\n\
	float totalValue = 0.0;\n\
	int sampledsCount = 0;\n\
	int intAux = 0;\n\
	float increDist = testDist / numSamples;\n\
	int c = 0;\n\
	bool isPointRearPlane = true;\n\
	for(int i=0; i<512; i++)\n\
	{\n\
		vec3 currGeoLoc;\n\
		vec3 currPosWorld = vec3(nearP.x + camDirWorld.x * increDist*float(c), nearP.y + camDirWorld.y * increDist*float(c), nearP.z + camDirWorld.z * increDist*float(c));\n\
		// Check if the currPosWorld is in front or rear of planes (if exist planes).***\n\
		int planesCounter = 0;\n\
		for(int j=0; j<6; j++)\n\
		{\n\
			if(planesCounter == cuttingPlanesCount)\n\
				break;\n\
			\n\
			vec4 plane = cuttingPlanes[j];\n\
			float dist = distPointToPlane(currPosWorld, plane);\n\
			if(dist > 0.0)\n\
			{\n\
				isPointRearPlane = false;\n\
				break;\n\
			}\n\
			else{\n\
				isPointRearPlane = true;\n\
			}\n\
			planesCounter++;\n\
		}\n\
		\n\
		\n\
		if(isPointRearPlane)\n\
		{\n\
			cartesianToGeographicWgs84(currPosWorld, currGeoLoc);\n\
			if(getValue(currGeoLoc, value))\n\
			{\n\
				float realValue = value.r * tempRange + minValue*255.0;\n\
				totalValue += (value.r);\n\
				sampledsCount += 1;\n\
			}\n\
		}\n\
		if(sampledsCount >= 1)\n\
		{\n\
			break;\n\
		}\n\
		c++;\n\
	}\n\
	if(sampledsCount == 0)\n\
	{\n\
		discard;\n\
	}\n\
	float fValue = totalValue/numSamples;\n\
	fValue = totalValue;\n\
	if(fValue > 1.0)\n\
	{\n\
		gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
		return;\n\
	}\n\
	float b = 1.0 - fValue;\n\
	float g;\n\
	if(fValue > 0.5)\n\
	{\n\
		g = 2.0-2.0*fValue;\n\
	}\n\
	else{\n\
		g = 2.0*fValue;\n\
	}\n\
	float r = fValue;\n\
	color += vec4(r,g,b,0.8);\n\
	gl_FragColor = color;\n\
}";
ShaderSource.wgs84_volumVS = "precision mediump float;\n\
\n\
attribute vec3 position;\n\
uniform mat4 projectionMatrix;\n\
\n\
void main()\n\
{	\n\
	vec4 pos = projectionMatrix * vec4(position.xyz, 1.0);\n\
    gl_Position = pos;\n\
}";
