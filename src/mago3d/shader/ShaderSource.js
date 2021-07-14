'use strict';
var ShaderSource = {};
ShaderSource.atmosphereFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
varying vec4 vcolor4;\n\
\n\
void main()\n\
{  \n\
	gl_FragData[0] = vcolor4; \n\
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
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
  \n\
varying vec4 vcolor4;   \n\
  \n\
\n\
void main()\n\
{ \n\
	vec4 textureColor;\n\
	textureColor = vcolor4;  \n\
	/*\n\
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
	*/\n\
	gl_FragData[0] = vec4(textureColor.xyz, 1.0);\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	gl_FragData[3] = vec4(textureColor.xyz, 1.0);\n\
	#endif\n\
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
ShaderSource.depthTexturesMergerFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTexture_0;  \n\
uniform sampler2D normalTexture_0;\n\
uniform sampler2D depthTexture_1;  \n\
uniform sampler2D normalTexture_1;\n\
uniform sampler2D depthTexture_2;  \n\
uniform sampler2D normalTexture_2;\n\
uniform sampler2D depthTexture_3;  \n\
uniform sampler2D normalTexture_3;\n\
\n\
uniform int uNumFrustums;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
float getMinValue(float a, float b, float c)\n\
{\n\
    float x = min(a, b);\n\
    return min(x, c);\n\
}\n\
\n\
float getMaxValue(float a, float b, float c)\n\
{\n\
    float x = max(a, b);\n\
    return max(x, c);\n\
}\n\
\n\
bool isNan(float val)\n\
{\n\
  return (val <= 0.0 || 0.0 <= val) ? false : true;\n\
}\n\
\n\
vec4 getDepth(in int frustumIdx, in vec2 texCoord)\n\
{\n\
    vec4 color4;\n\
\n\
    if(frustumIdx == 0)\n\
    {\n\
        color4 = texture2D(depthTexture_0, texCoord);\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        color4 = texture2D(depthTexture_1, texCoord);\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        color4 = texture2D(depthTexture_2, texCoord);\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        color4 = texture2D(depthTexture_3, texCoord);\n\
    }\n\
\n\
    return color4;\n\
}\n\
\n\
vec4 getNormal(in int frustumIdx, in vec2 texCoord)\n\
{\n\
    vec4 color4;\n\
\n\
    if(frustumIdx == 0)\n\
    {\n\
        color4 = texture2D(normalTexture_0, texCoord);\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        color4 = texture2D(normalTexture_1, texCoord);\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        color4 = texture2D(normalTexture_2, texCoord);\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        color4 = texture2D(normalTexture_3, texCoord);\n\
    }\n\
\n\
    return color4;\n\
}\n\
\n\
void main()\n\
{           \n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
    vec4 normalColor = vec4(0.0, 0.0, 0.0, 1.0);\n\
    bool isValid = false;\n\
\n\
    for(int i=0; i<4; i++)\n\
    {\n\
        if(i < uNumFrustums)\n\
        {\n\
            vec4 normal4 = getNormal(i, texCoord);\n\
            \n\
            // check the depth value.***\n\
            if((abs(normal4.x) + abs(normal4.y) + abs(normal4.z)) > 0.1)\n\
            {\n\
                // is valid depth value.***\n\
                vec4 depthColor4 = getDepth(i, texCoord);\n\
\n\
                textureColor = depthColor4;\n\
                normalColor = normal4;\n\
                isValid = true;\n\
                break;\n\
            }\n\
        }\n\
    }\n\
\n\
    if(!isValid)\n\
    {\n\
        #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(0.0, 0.0, 0.0, 1.0);\n\
        #endif\n\
        return;\n\
    }\n\
    //discard;\n\
\n\
    \n\
    gl_FragData[0] = textureColor;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
    gl_FragData[1] = normalColor;\n\
    #endif\n\
	\n\
}";
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
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D u_wind;\n\
uniform sampler2D u_depthTex;\n\
uniform vec2 u_wind_min;\n\
uniform vec2 u_wind_max;\n\
uniform bool u_flipTexCoordY_windMap;\n\
uniform bool u_colorScale;\n\
uniform float u_tailAlpha;\n\
uniform float u_externAlpha;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
uniform int uFrustumIdx;\n\
varying float vDepth;\n\
\n\
varying vec2 v_particle_pos;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
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
vec3 getWhiteToBlueColor_byHeight(float height, float minHeight, float maxHeight)\n\
{\n\
    // White to Blue in 32 steps.\n\
    float gray = (height - minHeight)/(maxHeight - minHeight);\n\
    gray = 1.0 - gray; // invert gray value (white to blue).\n\
    // calculate r, g, b values by gray.\n\
\n\
    float r, g, b;\n\
\n\
    // Red.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        float minGray = 0.0;\n\
        float maxGray = 0.15625;\n\
        //float maxR = 0.859375; // 220/256.\n\
        float maxR = 1.0;\n\
        float minR = 0.3515625; // 90/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.40625) // [6, 13] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.40625;\n\
        float maxR = 0.3515625; // 90/256.\n\
        float minR = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else  // [14, 32] from 32 divisions.\n\
    {\n\
        r = 0.0;\n\
    }\n\
\n\
    // Green.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        g = 1.0; // 256.\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.5625) // [6, 18] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.5625;\n\
        float maxG = 1.0; // 256/256.\n\
        float minG = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        g = maxG - relativeGray*(maxG - minG);\n\
    }\n\
    else  // [18, 32] from 32 divisions.\n\
    {\n\
        g = 0.0;\n\
    }\n\
\n\
    // Blue.\n\
    if(gray < 0.5625)\n\
    {\n\
        b = 1.0;\n\
    }\n\
    else // gray >= 0.5625 && gray <= 1.0\n\
    {\n\
        float minGray = 0.5625;\n\
        float maxGray = 1.0;\n\
        float maxB = 1.0; // 256/256.\n\
        float minB = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        b = maxB - relativeGray*(maxB - minB);\n\
    }\n\
\n\
    return vec3(r, g, b);\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
void main() {\n\
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	float r = pt.x*pt.x+pt.y*pt.y;\n\
	if(r > 0.25)\n\
		discard;\n\
\n\
	\n\
\n\
	vec2 windMapTexCoord = v_particle_pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
	vec4 albedo4;\n\
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
		//vec3 col3 = getWhiteToBlueColor_byHeight(speed_t, 0.0, 1.0);\n\
		float r = speed_t;\n\
		albedo4 = vec4(col3.x, col3.y, col3.z ,u_tailAlpha*u_externAlpha);\n\
	}\n\
	else{\n\
		float intensity = speed_t*3.0;\n\
		if(intensity > 1.0)\n\
			intensity = 1.0;\n\
		albedo4 = vec4(intensity,intensity,intensity,u_tailAlpha*u_externAlpha);\n\
	}\n\
\n\
	gl_FragData[0] = albedo4;\n\
	\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		// save depth, normal, albedo.\n\
		gl_FragData[1] = packDepth(vDepth); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vec3(0.0, 0.0, 1.0);\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
	#endif\n\
	\n\
\n\
	//if(r > 0.16)\n\
	//gl_FragData[0] = vec4(1.0, 1.0, 1.0, u_tailAlpha*u_externAlpha);\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
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
uniform sampler2D u_particles; // channel-1.***\n\
uniform sampler2D u_particles_next; // channel-2.***\n\
uniform float u_particles_res;\n\
uniform mat4 modelViewMatrixRelToEye;\n\
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
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float far;\n\
\n\
varying vec2 v_particle_pos;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
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
	// NO USED.\n\
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
	vec3 resultCartesian = vec3(x, y, z);\n\
	\n\
	return resultCartesian;\n\
}\n\
\n\
vec2 getOffset(vec2 particlePos, float radius)\n\
{\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
	float distortion = cos((minLatRad + particlePos.y * latRadRange ));\n\
	float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;\n\
	float yOffset = (0.5 - particlePos.y) * latRadRange * radius;\n\
\n\
	return vec2(xOffset, yOffset);\n\
}\n\
\n\
void main() {\n\
	vec2 texCoord = vec2(fract(a_index / u_particles_res), floor(a_index / u_particles_res) / u_particles_res);\n\
\n\
	vec4 color_curr = texture2D(u_particles, texCoord);\n\
    //vec2 particle_pos_curr = vec2(color_curr.r / 255.0 + color_curr.b, color_curr.g / 255.0 + color_curr.a);\n\
\n\
	//vec4 color_next = texture2D(u_particles_next, texCoord);\n\
    //vec2 particle_pos_next = vec2(color_next.r / 255.0 + color_next.b, color_next.g / 255.0 + color_next.a);\n\
	//v_particle_pos = mix(particle_pos_curr, particle_pos_next, 0.0);\n\
\n\
    //vec4 color = texture2D(u_particles, texCoord);\n\
    // decode current particle position from the pixel's RGBA value\n\
    v_particle_pos = vec2(color_curr.r / 255.0 + color_curr.b,color_curr.g / 255.0 + color_curr.a); // original.***\n\
\n\
	// calculate the offset at the earth radius.***\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	vec2 offset = getOffset(v_particle_pos, radius);\n\
\n\
	float xOffset = offset.x;\n\
	float yOffset = offset.y;\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);\n\
	\n\
	//vec4 posWC = vec4((rotatedPos.xyz + buildingPosLOW) + ( buildingPosHIGH ), 1.0);\n\
	vec4 posCC = vec4((rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow) + ( buildingPosHIGH - encodedCameraPositionMCHigh), 1.0);\n\
	\n\
	// Now calculate the position on camCoord.***\n\
	//gl_Position = ModelViewProjectionMatrix * posWC;\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * posCC;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * posCC;\n\
	vDepth = (-orthoPos.z)/(far); // the correct value.\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
	\n\
	// Now calculate the point size.\n\
	//float dist = distance(vec4(u_camPosWC.xyz, 1.0), vec4(posWC.xyz, 1.0));\n\
	float dist = length(posCC.xyz);\n\
	gl_PointSize = (1.0 + pendentPointSize/(dist))*u_tailAlpha; \n\
	//gl_PointSize = 3.0*u_tailAlpha; \n\
	float maxPointSize = 4.0;\n\
\n\
	if(gl_PointSize > maxPointSize)\n\
	gl_PointSize = maxPointSize;\n\
	else if(gl_PointSize < 2.0)\n\
	gl_PointSize = 2.0;\n\
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
ShaderSource.dustParticleFS = "precision lowp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D smokeTex;\n\
uniform vec4 uStrokeColor;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
uniform int uPointAppereance; // square, circle, romboide,...\n\
uniform int uStrokeSize;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform int uFrustumIdx;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vDustConcent;\n\
varying float vDustConcentRel;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
// pseudo-random generator\n\
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
// https://community.khronos.org/t/random-values/75728\n\
float rand(const vec2 co) {\n\
    float t = dot(rand_constants.xy, co);\n\
    return fract(sin(t) * (rand_constants.z + t));\n\
}\n\
\n\
void main()\n\
{\n\
	vec4 textureColor = texture2D(smokeTex, gl_PointCoord);\n\
	if(textureColor.a < 0.1)\n\
	discard;\n\
\n\
	vec4 finalColor = vColor;\n\
	float alpha = textureColor.a * 2.0;\n\
	float green = 1.0;\n\
\n\
	finalColor = vec4(green * 0.5, green, 0.1, alpha);\n\
	//finalColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
\n\
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalColor; \n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.dustParticleVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform float uDustConcentration;\n\
uniform vec2 uDustConcentMinMax;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float vDepth;\n\
\n\
uniform float uFCoef_logDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDustConcent;\n\
varying float vDustConcentRel;\n\
\n\
void main()\n\
{\n\
	vec4 rotatedPos;\n\
	rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor = oneColor4;\n\
	}\n\
	else\n\
		vColor = color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	vDepth = -(modelViewMatrixRelToEye * pos).z/far; // original.***\n\
\n\
	float minPointSize = 2.0;\n\
	float maxPointSize = 60.0;\n\
	float pendentPointSize = 2000.0 * uDustConcentration;\n\
	float z_b = gl_Position.z/gl_Position.w;\n\
	float z_n = 2.0 * z_b - 1.0;\n\
	float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
	gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
	//if(gl_PointSize > maxPointSize)\n\
	//	gl_PointSize = maxPointSize;\n\
	//if(gl_PointSize < 2.0)\n\
	//	gl_PointSize = 2.0;\n\
\n\
	vDustConcentRel = uDustConcentration/uDustConcentMinMax[1];\n\
	vDustConcent = uDustConcentration;\n\
	//gl_PointSize *= uDustConcentration;\n\
	glPointSize = gl_PointSize;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}";
ShaderSource.dustTextureModeFS = "precision lowp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texUp;\n\
uniform sampler2D texDown;\n\
uniform vec2 u_tex_res;\n\
\n\
varying vec4 vColor;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform int uFrustumIdx;\n\
uniform vec2 uDustConcentMinMax_up;\n\
uniform vec2 uDustConcentMinMax_down;\n\
uniform float uZFactor;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying vec2 vTexCoord;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
// pseudo-random generator\n\
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);\n\
// https://community.khronos.org/t/random-values/75728\n\
float rand(const vec2 co) {\n\
    float t = dot(rand_constants.xy, co);\n\
    return fract(sin(t) * (rand_constants.z + t));\n\
}\n\
\n\
vec3 getRainbowColor_byHeight(float height)\n\
{\n\
	//float gray = (height - uDustConcentMinMax[0])/(uDustConcentMinMax[1] - uDustConcentMinMax[0]);\n\
	float gray = height;\n\
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
float round(in float value)\n\
{\n\
	return floor(value + 0.5);\n\
}\n\
\n\
float calculateIndex(in float rawConcentration)\n\
{\n\
	//Index index1 = new Index(0, 50, 1);    // 좋음\n\
	//Index index2 = new Index(51, 100, 2);  // 보통\n\
	//Index index3 = new Index(101, 250, 3); // 나쁨\n\
	//Index index4 = new Index(251, 500, 4); // 매우나쁨\n\
\n\
	//pm25.addIndexStep(new IndexStep(index1,  0.0,  15.0));\n\
	//pm25.addIndexStep(new IndexStep(index2, 16.0,  35.0));\n\
	//pm25.addIndexStep(new IndexStep(index3, 36.0,  75.0));\n\
	//pm25.addIndexStep(new IndexStep(index4, 76.0, 500.0));\n\
\n\
	// 1rst, calculate index:\n\
	int indexStep;\n\
	float valueAux = rawConcentration;\n\
	if(valueAux >= 0.0 && valueAux <= 15.0)\n\
	{\n\
		indexStep = 1;\n\
	}\n\
	else if(valueAux > 15.0 && valueAux <= 35.0)\n\
	{\n\
		indexStep = 2;\n\
	}\n\
	else if(valueAux > 35.0 && valueAux <= 75.0)\n\
	{\n\
		indexStep = 3;\n\
	}\n\
	else if(valueAux > 75.0 && valueAux <= 500.0)\n\
	{\n\
		indexStep = 4;\n\
	}\n\
	else\n\
	{\n\
		indexStep = -1;\n\
	}\n\
\n\
	float iLow, iHigh;\n\
	float cLow, cHigh;\n\
\n\
	int idx = indexStep;\n\
\n\
	if(idx == 1)\n\
	{\n\
		iLow = 0.0;\n\
		iHigh = 50.0;\n\
		cLow = 0.0;\n\
		cHigh = 15.0;\n\
	}\n\
	else if(idx == 2)\n\
	{\n\
		iLow = 51.0;\n\
		iHigh = 100.0;\n\
		cLow = 16.0;\n\
		cHigh = 35.0;\n\
	}\n\
	else if(idx == 3)\n\
	{\n\
		iLow = 101.0;\n\
		iHigh = 250.0;\n\
		cLow = 36.0;\n\
		cHigh = 75.0;\n\
	}\n\
	else if(idx == 4)\n\
	{\n\
		iLow = 251.0;\n\
		iHigh = 500.0;\n\
		cLow = 76.0;\n\
		cHigh = 500.0;\n\
	}\n\
\n\
	float rawIndex = (iHigh - iLow) / (cHigh - cLow) * (rawConcentration - cLow) + iLow;\n\
	//return int(round(rawIndex));\n\
	return rawIndex;\n\
}\n\
\n\
vec3 getBBCAndYeonHwa_colorCoded(float index)\n\
{\n\
	// 0 = rgb(0.16796875, 0.51171875, 0.7265625)\n\
	// 50 = rgb(0.66796875, 0.86328125, 0.640625)\n\
	// 100 = rgb(0.99609375, 0.99609375, 0.74609375)\n\
	// 250 = rgb(0.98828125, 0.6796875, 0.37890625)\n\
	// 500 = rgb(0.83984375, 0.09765625, 0.109375)\n\
\n\
	vec3 result;\n\
\n\
	if(index < 0.0)\n\
	{\n\
		return vec3(0.0, 0.0, 0.0);\n\
	}\n\
\n\
	if(index >= 0.0 && index < 50.0)\n\
	{\n\
		vec3 colorTop = vec3(0.16796875, 0.51171875, 0.7265625);\n\
		vec3 colorDown = vec3(0.66796875, 0.86328125, 0.640625);\n\
		float indexFactor = (index - 0.0)/(50.0 - 0.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 0.0, 0.0);\n\
	}\n\
	else if(index >= 50.0 && index < 100.0)\n\
	{\n\
		vec3 colorTop = vec3(0.66796875, 0.86328125, 0.640625);\n\
		vec3 colorDown = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		float indexFactor = (index - 50.0)/(100.0 - 50.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 1.0, 0.0);\n\
	}\n\
	else if(index >= 100.0 && index < 250.0)\n\
	{\n\
		vec3 colorTop = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		vec3 colorDown = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		float indexFactor = (index - 100.0)/(250.0 - 100.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 0.0, 1.0);\n\
	}\n\
	else if(index >= 250.0 && index < 500.0)\n\
	{\n\
		vec3 colorTop = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		vec3 colorDown = vec3(0.83984375, 0.09765625, 0.109375);\n\
		float indexFactor = (index - 250.0)/(500.0 - 250.0);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 1.0, 0.0);\n\
	}\n\
	else\n\
	{\n\
		return vec3(1.0, 0.0, 1.0);\n\
	}\n\
\n\
	return result;\n\
}\n\
\n\
vec3 getBBCAndYeonHwa_colorCoded_tight(float rawConcent)\n\
{\n\
	// 0 = rgb(0.16796875, 0.51171875, 0.7265625)\n\
	// 50 = rgb(0.66796875, 0.86328125, 0.640625)\n\
	// 100 = rgb(0.99609375, 0.99609375, 0.74609375)\n\
	// 250 = rgb(0.98828125, 0.6796875, 0.37890625)\n\
	// 500 = rgb(0.83984375, 0.09765625, 0.109375)\n\
\n\
	// Try to exagere index.***\n\
	//uDustConcentMinMax[1] - uDustConcentMinMax[0]\n\
	float maxConcent = uDustConcentMinMax_down[1];\n\
	float minConcent = uDustConcentMinMax_down[0];\n\
	float increConcent = maxConcent/4.0;\n\
\n\
	vec3 result;\n\
\n\
	if(rawConcent < 0.0)\n\
	{\n\
		return vec3(0.0, 0.0, 0.0);\n\
	}\n\
\n\
	if(rawConcent >= minConcent && rawConcent < minConcent + increConcent * 1.0)\n\
	{\n\
		vec3 colorTop = vec3(0.16796875, 0.51171875, 0.7265625);\n\
		vec3 colorDown = vec3(0.66796875, 0.86328125, 0.640625);\n\
		float minValue = minConcent;\n\
		float maxValue = minConcent + increConcent * 1.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 0.0, 0.0);\n\
	}\n\
	else if(rawConcent >= minConcent + increConcent * 1.0 && rawConcent < minConcent + increConcent * 2.0)\n\
	{\n\
		vec3 colorTop = vec3(0.66796875, 0.86328125, 0.640625);\n\
		vec3 colorDown = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		float minValue = minConcent + increConcent * 1.0;\n\
		float maxValue = minConcent + increConcent * 2.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 1.0, 0.0);\n\
	}\n\
	else if(rawConcent >= minConcent + increConcent * 2.0 && rawConcent < minConcent + increConcent * 3.0)\n\
	{\n\
		vec3 colorTop = vec3(0.99609375, 0.99609375, 0.74609375);\n\
		vec3 colorDown = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		float minValue = minConcent + increConcent * 2.0;\n\
		float maxValue = minConcent + increConcent * 3.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(0.0, 0.0, 1.0);\n\
	}\n\
	else if(rawConcent >= minConcent + increConcent * 3.0 && rawConcent < minConcent + increConcent * 4.0)\n\
	{\n\
		vec3 colorTop = vec3(0.98828125, 0.6796875, 0.37890625);\n\
		vec3 colorDown = vec3(0.83984375, 0.09765625, 0.109375);\n\
		float minValue = minConcent + increConcent * 3.0;\n\
		float maxValue = minConcent + increConcent * 4.0;\n\
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);\n\
		indexFactor = indexFactor - floor(indexFactor); \n\
		//result = mix(colorDown, colorTop, indexFactor);\n\
		result = mix(colorTop, colorDown, indexFactor);\n\
		//return vec3(1.0, 1.0, 0.0);\n\
	}\n\
	else\n\
	{\n\
		return vec3(1.0, 0.0, 1.0);\n\
	}\n\
\n\
	return result;\n\
}\n\
\n\
void main()\n\
{\n\
	vec4 colorUp = texture2D(texUp, vTexCoord);\n\
	vec4 colorDown = texture2D(texDown, vTexCoord);\n\
\n\
	// now, calculate realConcent_up & realConcent_down.***\n\
	float realConcent_up = colorUp.r * (uDustConcentMinMax_up[1] - uDustConcentMinMax_up[0]) + uDustConcentMinMax_up[0];\n\
	float realConcent_down = colorDown.r * (uDustConcentMinMax_down[1] - uDustConcentMinMax_down[0]) + uDustConcentMinMax_down[0];\n\
	float realConcent = mix(realConcent_down, realConcent_up, uZFactor);\n\
	float concentMin = mix(uDustConcentMinMax_down[0], uDustConcentMinMax_up[0], uZFactor);\n\
	float concentMax = mix(uDustConcentMinMax_down[1], uDustConcentMinMax_up[1], uZFactor);\n\
	vec4 textureColor = mix(colorDown, colorUp, uZFactor);\n\
	//vec4 textureColor = texture2D(texDown, vTexCoord);\n\
\n\
	vec4 finalColor = vColor;\n\
	float alpha = textureColor.a;\n\
	float concent = textureColor.g;\n\
	vec3 rainbowCol = getRainbowColor_byHeight(concent);\n\
\n\
	// BBC & YeonHwa color system.********************************************************************************\n\
	// BBC & YeonHwa color system.********************************************************************************\n\
	//float realConcent = concent * (uDustConcentMinMax_down[1] - uDustConcentMinMax_down[0]) + uDustConcentMinMax_down[0];\n\
	float indexMin = calculateIndex(concentMin);\n\
	float indexMax = calculateIndex(concentMax);\n\
	float index = calculateIndex(realConcent);\n\
\n\
	float scaledIndex = (index - indexMin)/(indexMax - indexMin);\n\
	scaledIndex *= 500.0;\n\
	//vec3 colorAux = getBBCAndYeonHwa_colorCoded(scaledIndex);\n\
	vec3 colorAux = getBBCAndYeonHwa_colorCoded_tight(realConcent);\n\
	//-------------------------------------------------------------------------------------------------------------\n\
	//-------------------------------------------------------------------------------------------------------------\n\
\n\
	//finalColor = vec4(rainbowCol, alpha);\n\
	\n\
	if(concent < 0.00001)\n\
	{\n\
		finalColor = vec4(colorAux, 0.0);\n\
	}\n\
	else{\n\
		finalColor = vec4(colorAux, 0.7);\n\
	}\n\
	\n\
\n\
\n\
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalColor; \n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.dustTextureModeVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
uniform mat4 modelViewMatrixRelToEye;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform float near;\n\
uniform float far;\n\
uniform float uDustConcentration;\n\
uniform bool bUse1Color;\n\
uniform vec4 oneColor4;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
varying float vDepth;\n\
\n\
uniform float uFCoef_logDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying vec2 vTexCoord;\n\
\n\
void main()\n\
{\n\
	vec4 rotatedPos;\n\
	rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
    if(bUse1Color)\n\
	{\n\
		vColor = oneColor4;\n\
	}\n\
	else\n\
		vColor = color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	vDepth = -(modelViewMatrixRelToEye * pos).z/far; // original.***\n\
	vTexCoord = texCoord;\n\
/*\n\
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
	*/\n\
	/*\n\
	float minPointSize = 2.0;\n\
	float maxPointSize = 60.0;\n\
	float pendentPointSize = 2000.0 * uDustConcentration;\n\
	float z_b = gl_Position.z/gl_Position.w;\n\
	float z_n = 2.0 * z_b - 1.0;\n\
	float z_e = 2.0 * near * far / (far + near - z_n * (far - near));\n\
	gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***\n\
	//if(gl_PointSize > maxPointSize)\n\
	//	gl_PointSize = maxPointSize;\n\
	//if(gl_PointSize < 2.0)\n\
	//	gl_PointSize = 2.0;\n\
\n\
	//vDustConcentRel = uDustConcentration/uDustConcentMinMax[1];\n\
	//glPointSize = gl_PointSize;\n\
	*/\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}";
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
ShaderSource.GBufferFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
 \n\
uniform sampler2D diffuseTex;\n\
uniform bool textureFlipYAxis;  \n\
uniform vec4 oneColor4;\n\
\n\
//uniform bool bApplyScpecularLighting;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform float externalAlpha;\n\
uniform vec4 colorMultiplier;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
\n\
// clipping planes.***\n\
uniform mat4 clippingPlanesRotMatrix; \n\
uniform vec3 clippingPlanesPosHIGH;\n\
uniform vec3 clippingPlanesPosLOW;\n\
uniform bool bApplyClippingPlanes; // old. deprecated.***\n\
uniform int clippingType; // 0= no clipping. 1= clipping by planes. 2= clipping by localCoord polyline. 3= clip by heights, 4= clip by (2, 3)\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform vec2 clippingPolygon2dPoints[64];\n\
uniform int clippingConvexPolygon2dPointsIndices[64];\n\
uniform vec4 limitationInfringedColor4;\n\
uniform vec2 limitationHeights;\n\
\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
\n\
varying vec3 vertexPos; // this is the orthoPos.***\n\
varying vec3 vertexPosLC;\n\
\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float depth;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}            \n\
\n\
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
vec2 getDirection2d(in vec2 startPoint, in vec2 endPoint)\n\
{\n\
	//vec2 vector = endPoint - startPoint;\n\
	//float length = length( vector);\n\
	//vec2 dir = vec2(vector.x/length, vector.y/length);\n\
	vec2 dir = normalize(endPoint - startPoint);\n\
	return dir;\n\
}\n\
\n\
bool intersectionLineToLine(in vec2 line_1_pos, in vec2 line_1_dir,in vec2 line_2_pos, in vec2 line_2_dir, out vec2 intersectionPoint2d)\n\
{\n\
	bool bIntersection = false;\n\
\n\
	float zero = 10E-8;\n\
	float intersectX;\n\
	float intersectY;\n\
\n\
	// check if 2 lines are parallel.***\n\
	float dotProd = abs(dot(line_1_dir, line_2_dir));\n\
	if(abs(dotProd-1.0) < zero)\n\
	return false;\n\
\n\
	if (abs(line_1_dir.x) < zero)\n\
	{\n\
		// this is a vertical line.\n\
		float slope = line_2_dir.y / line_2_dir.x;\n\
		float b = line_2_pos.y - slope * line_2_pos.x;\n\
		\n\
		intersectX = line_1_pos.x;\n\
		intersectY = slope * line_1_pos.x + b;\n\
		bIntersection = true;\n\
	}\n\
	else if (abs(line_1_dir.y) < zero)\n\
	{\n\
		// this is a horizontal line.\n\
		// must check if the \"line\" is vertical.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			intersectX = line_2_pos.x;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (line_1_pos.y - b)/slope;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}	\n\
	}\n\
	else \n\
	{\n\
		// this is oblique.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			intersectX = line_2_pos.x;\n\
			intersectY = intersectX * mySlope + myB;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (myB - b)/ (slope - mySlope);\n\
			intersectY = slope * intersectX + b;\n\
			bIntersection = true;\n\
		}\n\
	}\n\
\n\
	intersectionPoint2d.x = intersectX;\n\
	intersectionPoint2d.y = intersectY;\n\
\n\
	return bIntersection;\n\
}\n\
\n\
vec2 getProjectedPoint2dToLine(in vec2 line_point, in vec2 line_dir, in vec2 point)\n\
{\n\
	bool intersection = false;\n\
\n\
	// create a perpendicular left line.***\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
	vec2 lineLeft_point = vec2(point.x, point.y);\n\
	vec2 projectedPoint = vec2(0);\n\
	intersection = intersectionLineToLine(line_point, line_dir, lineLeft_point, lineLeft_dir, projectedPoint);\n\
\n\
	return projectedPoint;\n\
}\n\
\n\
int getRelativePositionOfPointToLine(in vec2 line_pos, in vec2 line_dir, vec2 point)\n\
{\n\
	// 0 = coincident. 1= left side. 2= right side.***\n\
	int relPos = -1;\n\
\n\
	vec2 projectedPoint = getProjectedPoint2dToLine(line_pos, line_dir, point );\n\
	float dist = length(point - projectedPoint);\n\
\n\
	if(dist < 1E-8)\n\
	{\n\
		relPos = 0; // the point is coincident to line.***\n\
		return relPos;\n\
	}\n\
\n\
	vec2 myVector = normalize(point - projectedPoint);\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
\n\
	float dotProd = dot(lineLeft_dir, myVector);\n\
\n\
	if(dotProd > 0.0)\n\
	{\n\
		relPos = 1; // is in left side of the line.***\n\
	}\n\
	else\n\
	{\n\
		relPos = 2; // is in right side of the line.***\n\
	}\n\
\n\
	return relPos;\n\
}\n\
\n\
bool isPointInsideLimitationConvexPolygon(in vec2 point2d)\n\
{\n\
	bool isInside = true;\n\
\n\
	// Check polygons.***\n\
	int startIdx = -1;\n\
	int endIdx = -1;\n\
	for(int i=0; i<32; i++)\n\
	{\n\
		startIdx = clippingConvexPolygon2dPointsIndices[2*i];  // 0\n\
		endIdx = clippingConvexPolygon2dPointsIndices[2*i+1];	 // 3\n\
\n\
		if(startIdx < 0 || endIdx < 0)\n\
		break;\n\
\n\
		isInside  = true;\n\
		\n\
		isInside = true;\n\
		vec2 pointStart = clippingPolygon2dPoints[0];\n\
		for(int j=0; j<32; j++)\n\
		{\n\
			if(j > endIdx)\n\
			break;\n\
\n\
			if(j == startIdx)\n\
				pointStart = clippingPolygon2dPoints[j];\n\
\n\
			if(j >= startIdx && j<endIdx)\n\
			{\n\
				vec2 point0;\n\
				vec2 point1;\n\
				\n\
				if(j == endIdx)\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = pointStart;\n\
				}\n\
				else\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = clippingPolygon2dPoints[j+1];\n\
				}\n\
\n\
				// create the line of the segment.***\n\
				vec2 dir = getDirection2d(point0, point1);\n\
\n\
				// now, check the relative position of the point with the edge line.***\n\
				int relPos = getRelativePositionOfPointToLine(point0, dir, point2d);\n\
				if(relPos == 2)\n\
				{\n\
					// the point is in the right side of the edge line, so is out of the polygon.***\n\
					isInside = false;\n\
					break;\n\
				}\n\
			}\n\
\n\
		}\n\
		\n\
\n\
		if(isInside)\n\
		return true;\n\
\n\
	}\n\
\n\
	return isInside;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	if(clippingType == 2)\n\
	{\n\
		// clip by limitationPolygon.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 3)\n\
	{\n\
		// check limitation heights.***\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 4)\n\
	{\n\
		// clip by limitationPolygon & heights.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
\n\
	// Check if clipping.********************************************\n\
	\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = false;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			\n\
			// calculate any point of the plane.\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false; // false.\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
	}\n\
	\n\
	//----------------------------------------------------------------\n\
\n\
	vec4 textureColor;\n\
    if(colorType == 2)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
			 \n\
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
	float depthAux = depth;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		depthAux = gl_FragDepthEXT; \n\
	}\n\
	#endif\n\
\n\
	vec4 albedo4 = vec4(textureColor.xyz, 1.0);\n\
	gl_FragData[0] = albedo4; // anything.\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		// save depth, normal, albedo.\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
\n\
	\n\
}";
ShaderSource.GBufferVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vColor4; // color from attributes \n\
	varying float discardFrag;\n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float depth;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
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
\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		depth = (-orthoPos.z)/(far); // the correct value.\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			//flogz = 1.0 + gl_Position.w;\n\
			flogz = 1.0 - orthoPos.z;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
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
ShaderSource.GroundStencilPrimitivesFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform vec4 oneColor4;\n\
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
	//if(!bUseLogarithmicDepth)\n\
    //	gl_FragData[0] = packDepth(-depth);\n\
\n\
gl_FragColor = oneColor4; \n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		//gl_FragData[0] = packDepth(gl_FragDepthEXT);\n\
	}\n\
	#endif\n\
\n\
    \n\
}";
ShaderSource.GroundStencilPrimitivesVS = "attribute vec3 position;\n\
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
uniform float uFCoef_logDepth;\n\
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
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//-----------------------------------------------------------------------------------\n\
		//float C = 0.0001;\n\
		flogz = 1.0 + gl_Position.w; // use \"z\" instead \"w\" for fast decoding.***\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
\n\
	vertexPos = orthoPos.xyz;\n\
}";
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
ShaderSource.LBufferFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D normalTex;\n\
uniform samplerCube light_depthCubeMap;\n\
\n\
uniform mat4 projectionMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform mat4 buildingRotMatrixInv;\n\
\n\
// Light parameters.\n\
uniform float uLightParameters[4]; // 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.\n\
\n\
uniform float near;\n\
uniform float far;            \n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;     \n\
\n\
uniform vec3 uLightColorAndBrightness;\n\
uniform float uLightIntensity;\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform bool bApplyShadows;\n\
uniform vec2 uNearFarArray[4];\n\
uniform int u_processType; // 1= light pass. 2= lightFog pass.\n\
\n\
varying vec3 vNormal;\n\
varying vec3 vLightDirCC;\n\
varying vec3 vLightPosCC; \n\
varying vec3 vertexPosLC;\n\
varying vec4 vertexPosCC;\n\
varying float vDotProdLight;\n\
varying vec3 vCrossProdLight;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}                   \n\
        \n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
		/*\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z*0.0001;\n\
        float Fcoef_half = uFCoef_logDepth/2.0;\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = (flogzAux - 1.0);\n\
		linearDepth = z/(far);\n\
		*/\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
} \n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 getPosCC(in vec2 screenPosition, inout int dataType, inout vec4 normal4)\n\
{\n\
	normal4 = getNormal(screenPosition);\n\
	int estimatedFrustumIdx = int(floor(100.0*normal4.w));\n\
	dataType = 0; // 0= general geometry. 1= tinTerrain. 2= PointsCloud.\n\
\n\
	// Check the type of the data.******************\n\
	// dataType = 0 -> general geometry data.\n\
	// dataType = 1 -> tinTerrain data.\n\
	// dataType = 2 -> points cloud data.\n\
	//----------------------------------------------\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
	vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear = nearFar.x;\n\
	float currFar = nearFar.y;\n\
	float linearDepth = getDepth(screenPosition);\n\
\n\
	// calculate the real pos of origin.\n\
	float origin_zDist = linearDepth * currFar; // original.\n\
	vec3 origin_real = getViewRay(screenPosition, origin_zDist);\n\
\n\
	return origin_real;\n\
}\n\
\n\
int getFaceIdx(in vec3 normalRelToLight, inout vec2 faceTexCoord, inout vec3 faceDir)\n\
{\n\
	int faceIdx = -1;\n\
\n\
	// Note: the \"faceTexCoord\" is 1- to 1 range.\n\
\n\
	float x = normalRelToLight.x;\n\
	float y = normalRelToLight.y;\n\
	float z = normalRelToLight.z;\n\
\n\
	float absX = abs(x);\n\
	float absY = abs(y);\n\
	float absZ = abs(normalRelToLight.z);\n\
\n\
	bool isXPositive = true;\n\
	bool isYPositive = true;\n\
	bool isZPositive = true;\n\
\n\
	if(x < 0.0)\n\
	isXPositive = false;\n\
\n\
	if(y < 0.0)\n\
	isYPositive = false;\n\
\n\
	if(z < 0.0)\n\
	isZPositive = false;\n\
\n\
	// xPositive.\n\
	if(isXPositive && absX >= absY && absX >= absZ)\n\
	{\n\
		faceIdx = 0;\n\
		faceTexCoord = vec2(y, z);\n\
		faceDir = vec3(1.0, 0.0, 0.0);\n\
	}\n\
\n\
	// xNegative.\n\
	else if(!isXPositive && absX >= absY && absX >= absZ)\n\
	{\n\
		faceIdx = 1;\n\
		faceTexCoord = vec2(y, z);\n\
		faceDir = vec3(-1.0, 0.0, 0.0);\n\
	}\n\
\n\
	// yPositive.\n\
	else if(isYPositive && absY >= absX && absY >= absZ)\n\
	{\n\
		faceIdx = 2;\n\
		faceTexCoord = vec2(x, z);\n\
		faceDir = vec3(0.0, 1.0, 0.0);\n\
	}\n\
\n\
	// yNegative.\n\
	else if(!isYPositive && absY >= absX && absY >= absZ)\n\
	{\n\
		faceIdx = 3;\n\
		faceTexCoord = vec2(x, z);\n\
		faceDir = vec3(0.0, -1.0, 0.0);\n\
	}\n\
\n\
	// zPositive.\n\
	else if(isZPositive && absZ >= absX && absZ >= absY)\n\
	{\n\
		faceIdx = 4;\n\
		faceTexCoord = vec2(x, y);\n\
		faceDir = vec3(0.0, 0.0, 1.0);\n\
	}\n\
\n\
	// zNegative.\n\
	else if(!isZPositive && absZ >= absX && absZ >= absY)\n\
	{\n\
		faceIdx = 5;\n\
		faceTexCoord = vec2(x, y);\n\
		faceDir = vec3(0.0, 0.0, -1.0);\n\
	}\n\
\n\
	return faceIdx;\n\
}\n\
\n\
float getDepthFromLight(in vec3 lightDirCC, inout float spotDotAux)\n\
{\n\
	// Note : input must be a direction in cameraCoords.\n\
	// 1rst, transform \"lightDirToPointCC\" to \"lightDirToPointWC\".\n\
	// 2nd, transform \"lightDirToPointWC\" to \"lightDirToPointLC\" ( lightCoord );\n\
	vec4 lightDirToPointWC = modelViewMatrixRelToEyeInv * vec4(lightDirCC, 1.0);\n\
	vec3 lightDirToPointWCNormalized = normalize(lightDirToPointWC.xyz);\n\
	vec4 lightDirToPointLC = buildingRotMatrixInv * vec4(lightDirToPointWCNormalized, 1.0);\n\
	vec3 lightDirToPointLC_norm = normalize(lightDirToPointLC.xyz);\n\
	vec4 depthCube = textureCube(light_depthCubeMap, lightDirToPointLC_norm); // original\n\
\n\
	// Now, try to calculate the zone of the our pixel.\n\
	vec2 faceTexCoord;\n\
	vec3 faceDir;\n\
	getFaceIdx(lightDirToPointLC_norm, faceTexCoord, faceDir);\n\
	spotDotAux = dot(lightDirToPointLC_norm, faceDir);\n\
	float depthFromLight = unpackDepth(depthCube);\n\
\n\
	return depthFromLight;\n\
}\n\
\n\
void main()\n\
{\n\
	//#ifdef USE_LOGARITHMIC_DEPTH\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	//}\n\
	//#endif\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		if(u_processType == 1) // light pass.\n\
		{\n\
			// Diffuse lighting.\n\
			int dataType = 0;\n\
			vec4 normal4;\n\
			vec3 posCC = getPosCC(screenPos, dataType, normal4);\n\
\n\
			// vector light-point.\n\
			vec3 vecLightToPointCC = posCC - vLightPosCC;\n\
			vec3 lightDirToPointCC = normalize(posCC - vLightPosCC);\n\
			float distToLight = length(vecLightToPointCC);\n\
\n\
			float lightHotDistance = uLightParameters[0];\n\
			float lightFalloffLightDist = uLightParameters[1];\n\
			float factorByDist = 1.0;\n\
\n\
			// Calculate the lightFog intensity (case spotLight).***************************************************************************************************************************\n\
			float lightFogIntensity = 0.0;\n\
			\n\
			// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of \"vertexPosLC\" to \"vLightDirCC\".\n\
			vec3 vectorToVertexCC = vertexPosCC.xyz - vLightPosCC;\n\
			float dist_vertexCC_toLight = length(vectorToVertexCC);\n\
\n\
			vec3 dir_camToLight = normalize(vLightPosCC);\n\
			float dot_dirCamToLight_lightDir = dot(dir_camToLight, vLightDirCC);\n\
\n\
\n\
			float factorByDist2 = 1.0 - dist_vertexCC_toLight/(lightFalloffLightDist);\n\
			lightFogIntensity = factorByDist2 * factorByDist2 * abs(dot_dirCamToLight_lightDir * dot_dirCamToLight_lightDir);\n\
			lightFogIntensity *= 0.8;\n\
\n\
			// DepthTest.\n\
			if(-vertexPosCC.z > -posCC.z)\n\
			{\n\
				if(posCC.z < 0.0) // in sky, posCC.z > 0.0\n\
				lightFogIntensity = 0.0;\n\
			}\n\
\n\
			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
			// End fog calculating.------------------------------------------------------------------------------------------------------------------------------------------------------------\n\
			\n\
			if(distToLight > lightFalloffLightDist)\n\
			{\n\
				// Apply only lightFog.***\n\
				// in final screenQuadPass, use posLC to determine the light-fog.\n\
				return;\n\
			}\n\
			else if(distToLight > lightHotDistance)\n\
			{\n\
				factorByDist = 1.0 - (distToLight - lightHotDistance)/(lightFalloffLightDist - lightHotDistance);\n\
			}\n\
\n\
			vec3 normal3 = normal4.xyz;\n\
			float diffuseDot = dot(-lightDirToPointCC, vec3(normal3));\n\
\n\
			if(diffuseDot < 0.0)\n\
			{\n\
				return;\n\
			}\n\
\n\
			// Check SPOT ANGLES.*****************************************************************************************************************************************\n\
			float hotSpotDot = uLightParameters[2];\n\
			float falloffSpotDot = uLightParameters[3];\n\
\n\
			float spotDot = dot(vLightDirCC, lightDirToPointCC);\n\
			float factorBySpot = 1.0;\n\
			if(spotDot < falloffSpotDot) \n\
			{\n\
				return;\n\
			}\n\
			else if(spotDot < hotSpotDot)\n\
			{\n\
				factorBySpot = 1.0 - (hotSpotDot - spotDot)/(hotSpotDot - falloffSpotDot);\n\
			}\n\
\n\
			if(bApplyShadows)\n\
			{\n\
\n\
				// Now, try to calculate the zone of the our pixel.\n\
				float spotDotAux;\n\
				float depthFromLight = getDepthFromLight(lightDirToPointCC, spotDotAux);\n\
				depthFromLight *= lightFalloffLightDist/spotDotAux;\n\
\n\
				float depthTolerance = 0.06;\n\
				if(distToLight > depthFromLight + depthTolerance)\n\
				{\n\
					// we are in shadow, so do not lighting.\n\
					gl_FragData[2] = vec4(0.0); // save fog.***\n\
					return;\n\
				}\n\
			}\n\
			\n\
\n\
			//float fogIntensity = length(vertexPosLC)/lightHotDistance;\n\
			float atenuation = 0.4; // intern variable to adjust light intensity.\n\
			diffuseDot *= factorByDist;\n\
			spotDot *= factorBySpot;\n\
			float finalFactor = uLightIntensity * diffuseDot * spotDot * atenuation;\n\
			gl_FragData[0] = vec4(uLightColorAndBrightness.x * finalFactor, \n\
								uLightColorAndBrightness.y * finalFactor, \n\
								uLightColorAndBrightness.z * finalFactor, 1.0); \n\
\n\
			// Specular lighting.\n\
			gl_FragData[1] = vec4(0.0, 0.0, 0.0, 1.0); // save specular.***\n\
\n\
			//// Light fog.\n\
			////gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
\n\
		}\n\
		else if(u_processType == 2) // lightFog pass.\n\
		{\n\
			// Diffuse lighting.\n\
			int dataType = 0;\n\
			vec4 normal4;\n\
			vec3 posCC = getPosCC(screenPos, dataType, normal4);\n\
\n\
			float lightHotDistance = uLightParameters[0];\n\
			float lightFalloffLightDist = uLightParameters[1];\n\
\n\
			// Calculate the lightFog intensity (case spotLight).***************************************************************************************************************************\n\
			float lightFogIntensity = 0.0;\n\
			vec3 dir_camToVertex = normalize(vertexPosCC.xyz);\n\
			vec3 dir_camToLight = normalize(vLightPosCC);\n\
			float dist_camToLight = length(vLightPosCC);\n\
			vec3 vertexPP = dir_camToVertex * dist_camToLight;\n\
			float dist_vertexPP_toLight = length(vertexPP - vLightPosCC);\n\
\n\
			// calculate light-to-vertexPP direction.\n\
			vec3 dir_light_toVertexPP = normalize(vertexPP - vLightPosCC);\n\
\n\
			// calculate dotProd of lightDir & dir_light_toVertexPP. If dot is negative, means that the vertex is rear of light.\n\
			float dot_lightDir_lightToVertexPPDir = dot(vLightDirCC, dir_light_toVertexPP);\n\
			float dot_dirCamToLight_lightDir = dot(dir_camToLight, vLightDirCC);\n\
\n\
			// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of \"vertexPosLC\" to \"vLightDirCC\".\n\
			vec3 vectorLightToVertexCC = vertexPosCC.xyz - vLightPosCC;\n\
			vec3 dirLightToVertexCC = normalize(vectorLightToVertexCC);\n\
			float dist_vertexCC_toLight = length(vectorLightToVertexCC);\n\
			vec3 crossProd = cross( dirLightToVertexCC, vLightDirCC );\n\
			vec3 camToVertexCC = normalize(vertexPosCC.xyz);\n\
			float dotLightDir = dot(normalize(crossProd), camToVertexCC); // indicates how centered is the point to lightDir.\n\
\n\
			// Calculate fog by dist to light & try to eliminate the rear-light fog.\n\
			float factorByDistFog = 1.0 - dist_vertexPP_toLight / (lightFalloffLightDist * 1.1);\n\
			factorByDistFog *= abs(dot_lightDir_lightToVertexPPDir);\n\
\n\
			if(dot_lightDir_lightToVertexPPDir < 0.1)\n\
			{\n\
				// we are rear of the light.\n\
				float factorByRearLight = 1.0 + dot_lightDir_lightToVertexPPDir; \n\
				factorByDistFog *= (factorByRearLight * factorByRearLight);\n\
			}\n\
\n\
			float intensityFactor = 1.0 - abs(dotLightDir);\n\
			lightFogIntensity = intensityFactor * factorByDistFog * 0.5;\n\
\n\
			float camDir_lightDir_factor = dot_dirCamToLight_lightDir * (1.0 - dist_vertexPP_toLight/(lightFalloffLightDist));\n\
			lightFogIntensity += camDir_lightDir_factor * camDir_lightDir_factor * 0.5; // when look with the same direction that lightDir, add aureola.\n\
			// End calculate the lightFog intensity (case spotLight).-----------------------------------------------------------------------------------------------------------------------\n\
\n\
			// DepthTest.\n\
			if(-vertexPosCC.z > -posCC.z)\n\
			{\n\
				if(posCC.z < 0.0) // in sky, posCC.z > 0.0\n\
				lightFogIntensity = 0.0;\n\
				gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
				return;\n\
			}\n\
\n\
			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
\n\
			if(bApplyShadows)\n\
			{\n\
				// Now, try to calculate the zone of the our pixel.\n\
				float spotDotAux;\n\
				float depthTolerance = 1.5; // high tolerance.\n\
				float depthFromLight2 = getDepthFromLight(dirLightToVertexCC, spotDotAux);\n\
				depthFromLight2 *= lightFalloffLightDist/spotDotAux;\n\
\n\
				if(dist_vertexCC_toLight > depthFromLight2 + depthTolerance)\n\
				{\n\
					// we are in shadow, so do not lighting.\n\
					gl_FragData[2] = vec4(0.0);\n\
					return;\n\
				}\n\
			}\n\
			\n\
			// Light fog.\n\
			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***\n\
		}\n\
\n\
	}\n\
	#endif\n\
\n\
\n\
	\n\
}";
ShaderSource.LBufferVS = "\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord; // delete this. lights has no texCoords.\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 projectionMatrix;\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
\n\
	// Light position & direction.\n\
	uniform vec3 buildingPosHIGH; // this is the lightPosition high.\n\
	uniform vec3 buildingPosLOW; // this is the lightPosition low.\n\
	uniform vec3 lightDirWC; // this is the lightDirection (in case of the spotLight type).\n\
\n\
	uniform vec3 scaleLC;\n\
\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform bool bApplySpecularLighting;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 vertexPosLC;\n\
	varying vec4 vertexPosCC;\n\
	varying float applySpecLighting;\n\
	varying vec4 vColor4; // color from attributes\n\
\n\
	varying vec3 vLightDirCC; \n\
	varying vec3 vLightPosCC; \n\
	varying float vDotProdLight;\n\
	varying vec3 vCrossProdLight;\n\
\n\
  \n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
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
		// calculate the light position CC.*****************************************\n\
		vec3 lightPosHighDiff = buildingPosHIGH - encodedCameraPositionMCHigh;\n\
		vec3 lightPosLowDiff = buildingPosLOW - encodedCameraPositionMCLow;\n\
		vec4 lightPosWC = vec4(lightPosHighDiff + lightPosLowDiff, 1.0);\n\
		vec4 lightPosCC_aux = modelViewMatrixRelToEye * lightPosWC;\n\
		vLightPosCC = lightPosCC_aux.xyz;\n\
		//--------------------------------------------------------------------------\n\
\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
		vTexCoord = texCoord;\n\
\n\
		// calculate lightDirection in cameraCoord.\n\
		vLightDirCC = normalize((normalMatrix4 * vec4(lightDirWC, 1.0)).xyz); // original.***\n\
\n\
		\n\
		if(bApplySpecularLighting)\n\
			applySpecLighting = 1.0;\n\
		else\n\
			applySpecLighting = -1.0;\n\
\n\
		vec4 posPP = ModelViewProjectionMatrixRelToEye * pos4;\n\
        gl_Position = posPP; // posProjected.\n\
		vertexPosCC = modelViewMatrixRelToEye * pos4;\n\
		\n\
		// Calculate the lightFog intensity (case spotLight).*****************************************\n\
		/*\n\
		vec3 vectorToVertexCC = vertexPosCC.xyz - vLightPosCC;\n\
		vec3 dirToVertexCCProjected = normalize(vectorToVertexCC);\n\
		dirToVertexCCProjected.z = 0.0;\n\
		vec3 lightDirCCProjected = vec3(vLightDirCC.x, vLightDirCC.y, 0.0);\n\
		vDotProdLight = dot(dirToVertexCCProjected, lightDirCCProjected);\n\
		// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of \"vertexPosLC\" to \"vLightDirCC\".\n\
		vCrossProdLight = cross( dirToVertexCCProjected, lightDirCCProjected );\n\
		*/\n\
\n\
		// End calculate the lightFog intensity (case spotLight).-------------------------------------\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			//flogz = 1.0 + gl_Position.w;\n\
			vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
			flogz = 1.0 - orthoPos.z;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
		}\n\
		\n\
		if(colorType == 1)\n\
			vColor4 = color4;\n\
	}";
ShaderSource.ModelRefSsaoFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D diffuseTex;\n\
uniform sampler2D shadowMapTex;\n\
uniform sampler2D shadowMapTex2;\n\
uniform sampler2D ssaoFromDepthTex;\n\
uniform bool textureFlipYAxis;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 projectionMatrixInv;\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
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
uniform float externalAlpha; // used by effects.\n\
uniform float uModelOpacity; // this is model's alpha.\n\
uniform vec4 colorMultiplier;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
// clipping planes.***\n\
uniform mat4 clippingPlanesRotMatrix; \n\
uniform vec3 clippingPlanesPosHIGH;\n\
uniform vec3 clippingPlanesPosLOW;\n\
uniform bool bApplyClippingPlanes; // old. deprecated.***\n\
uniform int clippingType; // 0= no clipping. 1= clipping by planes. 2= clipping by localCoord polyline. 3= clip by heights, 4= clip by (2, 3)\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform vec2 clippingPolygon2dPoints[64];\n\
uniform int clippingConvexPolygon2dPointsIndices[64];\n\
uniform vec4 limitationInfringedColor4;\n\
uniform vec2 limitationHeights;\n\
\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
varying vec3 vNormal;\n\
varying vec4 vColor4; // color from attributes\n\
varying vec2 vTexCoord;   \n\
varying vec3 vLightWeighting;\n\
varying vec3 diffuseColor;\n\
varying vec3 vertexPos; // this is the orthoPos.***\n\
varying vec3 vertexPosLC;\n\
varying float applySpecLighting;\n\
varying vec4 vPosRelToLight; \n\
varying vec3 vLightDir; \n\
varying vec3 vNormalWC;\n\
varying float currSunIdx; \n\
varying float vDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depthAux = dot(rgba_depth, bit_shift);\n\
    return depthAux;\n\
}  \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
/*\n\
// unpack depth used for shadow on screen.***\n\
float unpackDepth_A(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
*/\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );\n\
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);\n\
}             \n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
    return ray;                      \n\
}         \n\
            \n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
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
vec2 getDirection2d(in vec2 startPoint, in vec2 endPoint)\n\
{\n\
	//vec2 vector = endPoint - startPoint;\n\
	//float length = length( vector);\n\
	//vec2 dir = vec2(vector.x/length, vector.y/length);\n\
	vec2 dir = normalize(endPoint - startPoint);\n\
	return dir;\n\
}\n\
\n\
bool intersectionLineToLine(in vec2 line_1_pos, in vec2 line_1_dir,in vec2 line_2_pos, in vec2 line_2_dir, out vec2 intersectionPoint2d)\n\
{\n\
	bool bIntersection = false;\n\
\n\
	float zero = 10E-8;\n\
	float intersectX;\n\
	float intersectY;\n\
\n\
	// check if 2 lines are parallel.***\n\
	float dotProd = abs(dot(line_1_dir, line_2_dir));\n\
	if(abs(dotProd-1.0) < zero)\n\
	return false;\n\
\n\
	if (abs(line_1_dir.x) < zero)\n\
	{\n\
		// this is a vertical line.\n\
		float slope = line_2_dir.y / line_2_dir.x;\n\
		float b = line_2_pos.y - slope * line_2_pos.x;\n\
		\n\
		intersectX = line_1_pos.x;\n\
		intersectY = slope * line_1_pos.x + b;\n\
		bIntersection = true;\n\
	}\n\
	else if (abs(line_1_dir.y) < zero)\n\
	{\n\
		// this is a horizontal line.\n\
		// must check if the \"line\" is vertical.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			intersectX = line_2_pos.x;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (line_1_pos.y - b)/slope;\n\
			intersectY = line_1_pos.y;\n\
			bIntersection = true;\n\
		}	\n\
	}\n\
	else \n\
	{\n\
		// this is oblique.\n\
		if (abs(line_2_dir.x) < zero)\n\
		{\n\
			// \"line\" is vertical.\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			intersectX = line_2_pos.x;\n\
			intersectY = intersectX * mySlope + myB;\n\
			bIntersection = true;\n\
		}\n\
		else \n\
		{\n\
			float mySlope = line_1_dir.y / line_1_dir.x;\n\
			float myB = line_1_pos.y - mySlope * line_1_pos.x;\n\
			\n\
			float slope = line_2_dir.y / line_2_dir.x;\n\
			float b = line_2_pos.y - slope * line_2_pos.x;\n\
			\n\
			intersectX = (myB - b)/ (slope - mySlope);\n\
			intersectY = slope * intersectX + b;\n\
			bIntersection = true;\n\
		}\n\
	}\n\
\n\
	intersectionPoint2d.x = intersectX;\n\
	intersectionPoint2d.y = intersectY;\n\
\n\
	return bIntersection;\n\
}\n\
\n\
vec2 getProjectedPoint2dToLine(in vec2 line_point, in vec2 line_dir, in vec2 point)\n\
{\n\
	bool intersection = false;\n\
\n\
	// create a perpendicular left line.***\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
	vec2 lineLeft_point = vec2(point.x, point.y);\n\
	vec2 projectedPoint = vec2(0);\n\
	intersection = intersectionLineToLine(line_point, line_dir, lineLeft_point, lineLeft_dir, projectedPoint);\n\
\n\
	return projectedPoint;\n\
}\n\
\n\
int getRelativePositionOfPointToLine(in vec2 line_pos, in vec2 line_dir, vec2 point)\n\
{\n\
	// 0 = coincident. 1= left side. 2= right side.***\n\
	int relPos = -1;\n\
\n\
	vec2 projectedPoint = getProjectedPoint2dToLine(line_pos, line_dir, point );\n\
	float dist = length(point - projectedPoint);\n\
\n\
	if(dist < 1E-8)\n\
	{\n\
		relPos = 0; // the point is coincident to line.***\n\
		return relPos;\n\
	}\n\
\n\
	vec2 myVector = normalize(point - projectedPoint);\n\
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);\n\
\n\
	float dotProd = dot(lineLeft_dir, myVector);\n\
\n\
	if(dotProd > 0.0)\n\
	{\n\
		relPos = 1; // is in left side of the line.***\n\
	}\n\
	else\n\
	{\n\
		relPos = 2; // is in right side of the line.***\n\
	}\n\
\n\
	return relPos;\n\
}\n\
\n\
bool isPointInsideLimitationConvexPolygon(in vec2 point2d)\n\
{\n\
	bool isInside = true;\n\
\n\
	// Check polygons.***\n\
	int startIdx = -1;\n\
	int endIdx = -1;\n\
	for(int i=0; i<32; i++)\n\
	{\n\
		startIdx = clippingConvexPolygon2dPointsIndices[2*i];  // 0\n\
		endIdx = clippingConvexPolygon2dPointsIndices[2*i+1];	 // 3\n\
\n\
		if(startIdx < 0 || endIdx < 0)\n\
		break;\n\
\n\
		isInside  = true;\n\
		\n\
		isInside = true;\n\
		vec2 pointStart = clippingPolygon2dPoints[0];\n\
		for(int j=0; j<32; j++)\n\
		{\n\
			if(j > endIdx)\n\
			break;\n\
\n\
			if(j == startIdx)\n\
				pointStart = clippingPolygon2dPoints[j];\n\
\n\
			if(j >= startIdx && j<endIdx)\n\
			{\n\
				vec2 point0;\n\
				vec2 point1;\n\
				\n\
				if(j == endIdx)\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = pointStart;\n\
				}\n\
				else\n\
				{\n\
					point0 = clippingPolygon2dPoints[j];\n\
					point1 = clippingPolygon2dPoints[j+1];\n\
				}\n\
\n\
				// create the line of the segment.***\n\
				vec2 dir = getDirection2d(point0, point1);\n\
\n\
				// now, check the relative position of the point with the edge line.***\n\
				int relPos = getRelativePositionOfPointToLine(point0, dir, point2d);\n\
				if(relPos == 2)\n\
				{\n\
					// the point is in the right side of the edge line, so is out of the polygon.***\n\
					isInside = false;\n\
					break;\n\
				}\n\
			}\n\
\n\
		}\n\
		\n\
\n\
		if(isInside)\n\
		return true;\n\
\n\
	}\n\
\n\
	return isInside;\n\
}\n\
\n\
\n\
\n\
/*\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
mat3 sx = mat3( \n\
    1.0, 2.0, 1.0, \n\
    0.0, 0.0, 0.0, \n\
    -1.0, -2.0, -1.0 \n\
);\n\
mat3 sy = mat3( \n\
    1.0, 0.0, -1.0, \n\
    2.0, 0.0, -2.0, \n\
    1.0, 0.0, -1.0 \n\
);\n\
\n\
bool isEdge()\n\
{\n\
	vec3 I[3];\n\
	vec2 screenPos = vec2((gl_FragCoord.x) / screenWidth, (gl_FragCoord.y) / screenHeight);\n\
	float linearDepth = getDepth(screenPos);\n\
	vec3 normal = normal_from_depth(linearDepth, screenPos);\n\
\n\
    for (int i=0; i<3; i++) {\n\
        //vec3 norm1 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,-1), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm2 =  texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,0), 0 ).rgb * 2.0f - 1.0f;\n\
        //vec3 norm3 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,1), 0 ).rgb * 2.0f - 1.0f;\n\
		vec2 screenPos1 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-1.0) / screenHeight);\n\
		float linearDepth1 = getDepth(screenPos1);  \n\
\n\
		vec2 screenPos2 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-0.0) / screenHeight);\n\
		float linearDepth2 = getDepth(screenPos2);  \n\
\n\
		vec2 screenPos3 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y+1.0) / screenHeight);\n\
		float linearDepth3 = getDepth(screenPos1);  \n\
\n\
		vec3 norm1 = normal_from_depth(linearDepth1, screenPos1);\n\
        vec3 norm2 =  normal_from_depth(linearDepth2, screenPos2);\n\
        vec3 norm3 = normal_from_depth(linearDepth3, screenPos3);\n\
        float sampleValLeft  = dot(normal, norm1);\n\
        float sampleValMiddle  = dot(normal, norm2);\n\
        float sampleValRight  = dot(normal, norm3);\n\
        I[i] = vec3(sampleValLeft, sampleValMiddle, sampleValRight);\n\
    }\n\
\n\
    float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); \n\
    float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);\n\
\n\
    if((gx < 0.0 && gy < 0.0) || (gy < 0.0 && gx < 0.0) ) \n\
        return false;\n\
	float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));\n\
\n\
    if(g > 0.2) {\n\
        return true;\n\
    } \n\
	return false;\n\
}\n\
*/\n\
\n\
\n\
void main()\n\
{\n\
	//gl_FragData = vColor4; \n\
	//return;\n\
\n\
	if(clippingType == 2)\n\
	{\n\
		// clip by limitationPolygon.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 3)\n\
	{\n\
		// check limitation heights.***\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
	else if(clippingType == 4)\n\
	{\n\
		// clip by limitationPolygon & heights.***\n\
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);\n\
		if(!isPointInsideLimitationConvexPolygon(pointLC))\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)\n\
		{\n\
			gl_FragData[0] = limitationInfringedColor4; \n\
			return;\n\
		}\n\
	}\n\
\n\
	// Check if clipping.********************************************\n\
	\n\
	if(bApplyClippingPlanes)\n\
	{\n\
		bool discardFrag = false;\n\
		for(int i=0; i<6; i++)\n\
		{\n\
			vec4 plane = clippingPlanes[i];\n\
			\n\
			// calculate any point of the plane.\n\
			if(!clipVertexByPlane(plane, vertexPos))\n\
			{\n\
				discardFrag = false; // false.\n\
				break;\n\
			}\n\
			if(i >= clippingPlanesCount)\n\
			break;\n\
		}\n\
		\n\
	}\n\
	\n\
	//----------------------------------------------------------------\n\
\n\
	//bool testBool = false;\n\
	float occlusion = 1.0; // ambient occlusion.***\n\
	float shadow_occlusion = 1.0;\n\
	vec3 normal2 = vNormal;	\n\
	float scalarProd = 1.0;\n\
	\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	//float linearDepth = getDepth(screenPos);   \n\
	vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	scalarProd = abs(dot(normal2, normalize(-ray)));\n\
	//scalarProd *= scalarProd;\n\
	scalarProd *= 0.6;\n\
	scalarProd += 0.4;\n\
\n\
	occlusion = 1.0;\n\
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
    // Do specular lighting.***\n\
	float lambertian = 1.0;\n\
	float specular = 0.0;\n\
\n\
	//if((textureColor.r < 0.5 && textureColor.b > 0.5) || textureColor.a < 1.0)\n\
\n\
	lambertian = 1.0;\n\
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
	// New lighting.***********************************************************************************************\n\
	vec3 ambientColor = vec3(0.6);\n\
	vec3 directionalLightColor = vec3(0.9, 0.9, 0.9);\n\
	vec3 lightingDirection = normalize(vec3(0.6, 0.6, 0.6));\n\
	float directionalLightWeighting = max(dot(vNormal, lightingDirection), 0.0);\n\
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
	// End lighting.-------------------------------------------------------------------------------------------------\n\
	\n\
	\n\
	float alfa = textureColor.w * externalAlpha * uModelOpacity;\n\
    vec4 finalColor;\n\
	finalColor = vec4(textureColor.r, textureColor.g, textureColor.b, alfa);\n\
	finalColor *= vec4(lightWeighting, 1.0) ;\n\
	finalColor *= colorMultiplier;\n\
\n\
	vec4 albedo4 = finalColor;\n\
    gl_FragData[0] = finalColor; \n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	//if(bUseMultiRenderTarget)\n\
	{\n\
		// save depth, normal, albedo.\n\
		float depthAux = vDepth;\n\
		gl_FragData[1] = packDepth(depthAux); \n\
\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
\n\
		vec3 normal = vNormal;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
\n\
		// albedo.\n\
		gl_FragData[3] = albedo4; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
\n\
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
	uniform float uFCoef_logDepth;\n\
	\n\
	\n\
\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	varying vec3 vertexPosLC;\n\
	varying float applySpecLighting;\n\
	varying vec4 vColor4; // color from attributes\n\
	varying vec4 vPosRelToLight; // sun lighting.\n\
	varying vec3 vLightDir; \n\
	varying vec3 vNormalWC; \n\
	varying float currSunIdx;  \n\
	varying float discardFrag;\n\
	varying float flogz;\n\
	varying float Fcoef_half;\n\
	varying float vDepth;\n\
\n\
	\n\
	void main()\n\
    {	\n\
		vertexPosLC = vec3(position.x, position.y, position.z);\n\
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
		\n\
		\n\
		vec3 uLightingDirection = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496); \n\
		uAmbientColor = vec3(1.0);\n\
		vNormalWC = rotatedNormal;\n\
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
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
			//uLightingDirection = normalize(vec3(0.2, 0.6, 1.0));\n\
			directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		}\n\
\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
		\n\
		if(bApplySpecularLighting)\n\
			applySpecLighting = 1.0;\n\
		else\n\
			applySpecLighting = -1.0;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
		vertexPos = orthoPos.xyz;\n\
		vDepth = -orthoPos.z/far;\n\
\n\
		if(bUseLogarithmicDepth)\n\
		{\n\
			// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
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
\n\
uniform sampler2D diffuseTex;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform bool textureFlipYAxis;  \n\
\n\
varying float depth;\n\
varying vec2 vTexCoord;  \n\
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
    if(colorType == 2)\n\
    {\n\
        vec4 textureColor;\n\
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
    gl_FragData[0] = PackDepth32(depth);\n\
	//gl_FragData[0] = packDepth(-depth);\n\
}";
ShaderSource.OrthogonalDepthShaderVS = "attribute vec3 position;\n\
attribute vec2 texCoord;\n\
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
varying vec2 vTexCoord;\n\
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
	vTexCoord = texCoord;\n\
}\n\
";
ShaderSource.PngImageFS = "precision highp float;\n\
\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
varying vec2 v_texcoord;\n\
uniform bool textureFlipYAxis;\n\
uniform sampler2D u_texture;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 oneColor4;\n\
\n\
\n\
varying vec2 imageSizeInPixels;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
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
	\n\
	if(textureColor.w < 0.5)\n\
	{\n\
		discard;\n\
	}\n\
\n\
\n\
	if(colorType == 2)\n\
	{\n\
		// do nothing.\n\
	}\n\
	else if( colorType == 0)\n\
	{\n\
		textureColor = oneColor4;\n\
	}\n\
\n\
    //gl_FragColor = textureColor;\n\
	gl_FragData[0] = textureColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		//gl_FragData[1] = packDepth(vDepth);\n\
		gl_FragData[1] = packDepth(0.0);\n\
		\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		//if(uFrustumIdx == 0)\n\
		//frustumIdx = 0.005; // frustumIdx = 20.***\n\
		//else if(uFrustumIdx == 1)\n\
		//frustumIdx = 0.015; // frustumIdx = 21.***\n\
		//else if(uFrustumIdx == 2)\n\
		//frustumIdx = 0.025; // frustumIdx = 22.***\n\
		//else if(uFrustumIdx == 3)\n\
		//frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = textureColor; \n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	//if(bUseLogarithmicDepth)\n\
	//{\n\
	//	gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	//}\n\
	#endif\n\
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
	float pixelWidthRatio = 2. / ((screenWidth));// * projectionMatrix[0][0]);\n\
	// alternative : float pixelWidthRatio = 2. / (screenHeight * projectionMatrix[1][1]);\n\
	float pixelWidth = projected.w * pixelWidthRatio;\n\
\n\
	//float pixelHeightRatio = pixelWidthRatio * (screenHeight/screenWidth); // no works correctly.\n\
	float pixelHeightRatio = 2. / ((screenHeight));\n\
	float pixelHeight = projected.w * pixelHeightRatio;\n\
	\n\
	if(projected.w < 5.0)\n\
		pixelWidth = 5.0 * pixelWidthRatio;\n\
\n\
	//pixelHeight = pixelWidth;\n\
	\n\
	vec4 offset;\n\
	float offsetX;\n\
	float offsetY;\n\
	if(bUseOriginalImageSize)\n\
	{\n\
		offsetX = pixelWidth*imageSize.x/2.0;\n\
		offsetY = pixelHeight*imageSize.y/2.0;\n\
	}\n\
	else{\n\
		offsetX = pixelWidth*size2d.x/2.0;\n\
		offsetY = pixelHeight*size2d.y/2.0;\n\
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
		offset = vec4(-offsetX*scale2d.x, offsetY*2.0*scale2d.y, 0.0, 1.0);\n\
	}\n\
	else if(orderInt == -2)\n\
	{\n\
		offset = vec4(offsetX*scale2d.x, offsetY*2.0*scale2d.y, 0.0, 1.0);\n\
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
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform float near;\n\
uniform float far;\n\
uniform int uFrustumIdx;\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes;\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
\n\
varying float depth;  \n\
/*\n\
vec4 packDepth(const in float depth)\n\
{\n\
    // mago packDepth.***\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
*/\n\
\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
\n\
vec4 PackDepth32( in float depth )\n\
{\n\
    depth *= (16777216.0 - 1.0) / (16777216.0);\n\
    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;\n\
}\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
void main()\n\
{     \n\
    vec2 pt = gl_PointCoord - vec2(0.5);\n\
	float distSquared = pt.x*pt.x+pt.y*pt.y;\n\
	if(distSquared > 0.25)\n\
		discard;\n\
        \n\
    if(!bUseLogarithmicDepth)\n\
	{\n\
    	gl_FragData[0] = packDepth(-depth);\n\
	}\n\
\n\
	// Note: points cloud data has frustumIdx 20 .. 23.********\n\
    float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
	if(uFrustumIdx == 0)\n\
	frustumIdx = 0.205; // frustumIdx = 20.***\n\
	else if(uFrustumIdx == 1)\n\
	frustumIdx = 0.215; // frustumIdx = 21.***\n\
	else if(uFrustumIdx == 2)\n\
	frustumIdx = 0.225; // frustumIdx = 22.***\n\
	else if(uFrustumIdx == 3)\n\
	frustumIdx = 0.235; // frustumIdx = 23.***\n\
\n\
    // use frustumIdx from 10 to 13, instead from 0 to 3.***\n\
\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
	vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
	gl_FragData[1] = vec4(normal, frustumIdx); // save normal.***\n\
	#endif\n\
\n\
    #ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
        gl_FragData[0] = packDepth(gl_FragDepthEXT);\n\
	}\n\
	#endif\n\
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
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
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
	vec4 orthoPos = modelViewMatrixRelToEye * pos;\n\
	depth = orthoPos.z/far; // original.***\n\
	//depth = (orthoPos.z-near)/(far-near); // correct.***\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//-----------------------------------------------------------------------------------\n\
		//float C = 0.0001;\n\
		flogz = 1.0 + gl_Position.z; // use \"z\" instead \"w\" for fast decoding.***\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}\n\
";
ShaderSource.PointCloudFS = "precision lowp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
uniform vec4 uStrokeColor;\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
uniform int uPointAppereance; // square, circle, romboide,...\n\
uniform int uStrokeSize;\n\
uniform bool bUseLogarithmicDepth;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
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
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.PointCloudSsaoFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D normalTex;\n\
uniform mat4 projectionMatrix;\n\
uniform float tangentOfHalfFovy;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;    \n\
uniform vec3 kernel[16];   \n\
uniform vec4 oneColor4;\n\
varying vec4 aColor4; // color from attributes\n\
\n\
varying vec4 vColor;\n\
varying float glPointSize;\n\
\n\
const int kernelSize = 16;  \n\
uniform float radius;      \n\
\n\
uniform bool bApplySsao;\n\
uniform float externalAlpha;\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform vec2 uNearFarArray[4];\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
// Code color for selection:\n\
uniform vec4 uSelColor4;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float depth;\n\
\n\
/*\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
} \n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
*/\n\
            \n\
//linear view space depth\n\
/*\n\
float getDepth(vec2 coord)\n\
{\n\
    return unpackDepth(texture2D(depthTex, coord.xy));\n\
} \n\
*/   \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main()\n\
{\n\
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	if(pt.x*pt.x+pt.y*pt.y > 0.25)\n\
	{\n\
		discard;\n\
	}\n\
		\n\
	\n\
	float occlusion = 1.0;\n\
	float lighting = 0.0;\n\
	bool testBool = false;\n\
	vec4 colorAux = vec4(1.0, 1.0, 1.0, 1.0);\n\
	/*\n\
	bool auxBool = false;\n\
	//if(bApplySsao)\n\
	if(auxBool)\n\
	{          \n\
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
		//float linearDepth = getDepth(screenPos);\n\
		float linearDepth = -depth;\n\
		//vec3 origin = getViewRay(screenPos) * linearDepth;\n\
\n\
\n\
		vec4 normalRGBA = getNormal(screenPos);\n\
		int currFrustumIdx = int(floor(100.0*normalRGBA.w));\n\
\n\
		if(currFrustumIdx >= 10)\n\
		currFrustumIdx -= 20;\n\
\n\
		vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
		float currNear = nearFar.x;\n\
		float currFar = nearFar.y;\n\
\n\
\n\
		colorAux = vec4(linearDepth, linearDepth, linearDepth, 1.0);\n\
		float myZDist = currNear + linearDepth * currFar;\n\
\n\
		float radiusAux = glPointSize/1.9; // radius in pixels.\n\
		float radiusFog = glPointSize*3.0; // radius in pixels.\n\
		vec2 screenPosAdjacent;\n\
\n\
		\n\
		////vec3 sample = origin + rotatedKernel * radius;\n\
		////vec4 offset = projectionMatrix * vec4(sample, 1.0);	\n\
		////vec3 offsetCoord = vec3(offset.xyz);				\n\
		////offsetCoord.xyz /= offset.w;\n\
		////offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5; \n\
		\n\
\n\
		// calculate the pixelSize in the screenPos.***\n\
		float h = 2.0 * tangentOfHalfFovy * currFar * linearDepth; // height in meters of the screen in the current pixelDepth\n\
    	float w = h * aspectRatio;     							   // width in meters of the screen in the current pixelDepth\n\
		// vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);   \n\
\n\
		float pixelSize_x = w/screenWidth; // the pixelSize in meters in the x axis.\n\
		float pixelSize_y = h/screenHeight;  // the pixelSize in meters in the y axis.\n\
		\n\
		float radiusInMeters = 0.20;\n\
		radiusAux = radiusInMeters / pixelSize_x;\n\
		float radiusFogInMeters = 1.0;\n\
		radiusFog = radiusFogInMeters / pixelSize_x;\n\
\n\
		//radiusAux = 6.0;\n\
		float farFactor = 0.1*sqrt(myZDist);\n\
		\n\
		for(int j = 0; j < 1; ++j)\n\
		{\n\
			//radiusAux = 1.5 *(float(j)+1.0);\n\
			for(int i = 0; i < 8; ++i)\n\
			{  \n\
				// Find occlussion.***  	 \n\
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
\n\
				vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);\n\
				int adjacentFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));\n\
\n\
				if(adjacentFrustumIdx >= 10)\n\
				adjacentFrustumIdx -= 20;\n\
\n\
				vec2 nearFar_adjacent = getNearFar_byFrustumIdx(adjacentFrustumIdx);\n\
				float currNear_adjacent = nearFar_adjacent.x;\n\
				float currFar_adjacent = nearFar_adjacent.y;\n\
\n\
				float depthBufferValue = getDepth(screenPosAdjacent);\n\
				float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent;\n\
				float zDistDiff = abs(myZDist - zDist);\n\
\n\
				if(myZDist > zDist)\n\
				{\n\
					// My pixel is rear\n\
					if(zDistDiff > farFactor  &&  zDistDiff < 100.0)\n\
					occlusion +=  1.0;\n\
				}\n\
			}   \n\
		}   \n\
			\n\
		if(occlusion > 4.0)\n\
		{\n\
			occlusion -= 4.0;\n\
			occlusion = 1.0 - occlusion / 4.0;\n\
		}\n\
		else\n\
		{\n\
			occlusion = 1.0;\n\
		}\n\
		\n\
\n\
		if(occlusion < 0.0)\n\
		occlusion = 0.0;\n\
\n\
		if(lighting > 6.0)\n\
			lighting = 8.0;\n\
		lighting = lighting / 8.0;\n\
	}\n\
	*/\n\
\n\
	if(lighting < 0.5)\n\
	lighting = 0.0;\n\
\n\
	//vec3 fogColor = vec3(1.0, 1.0, 1.0);\n\
	vec3 fogColor = vec3(0.0, 0.0, 0.0);\n\
	vec3 finalFogColor = mix(vColor.xyz, fogColor, 0.0);\n\
\n\
    vec4 finalColor;\n\
	//finalColor = vec4((vColor.xyz) * occlusion, externalAlpha); // original.***\n\
	finalColor = vec4(finalFogColor * occlusion, externalAlpha);\n\
\n\
    gl_FragData[0] = finalColor; // original.***\n\
	//gl_FragData[0] = colorAux;\n\
	//gl_FragData[0] = vec4(occlusion, occlusion, occlusion, 1.0);\n\
\n\
	//if(testBool)\n\
	//{\n\
	//	gl_FragData[0] = vec4(1.0, 0.0, 0.0, 1.0); \n\
	//}\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		//if(!bUseLogarithmicDepth)\n\
		//{\n\
			gl_FragData[1] = packDepth(depth);\n\
		//}\n\
\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.205; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.215; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.225; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.235; // frustumIdx = 23.***\n\
		/*\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035;\n\
		*/\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = vColor; \n\
\n\
		// selColor4 (if necessary).\n\
		gl_FragData[4] = uSelColor4; \n\
	}\n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
\n\
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
uniform mat4 modelViewMatrixRelToEye;\n\
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
varying float depth;\n\
\n\
uniform float uFCoef_logDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
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
		vColor = oneColor4;\n\
	}\n\
	else\n\
		vColor = color4;\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
	depth = -(modelViewMatrixRelToEye * pos).z/far; // original.***\n\
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
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
			// float Fcoef = 2.0 / log2(far + 1.0);\n\
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
			// flogz = 1.0 + gl_Position.w;\n\
			//---------------------------------------------------------------------------------\n\
			flogz = 1.0 + gl_Position.w;\n\
			Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
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
ShaderSource.rectangleScreenFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D texture_0;  \n\
uniform samplerCube texture_cube;\n\
\n\
uniform int uTextureType;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 v_normal; // use for cubeMap.\n\
\n\
int faceIndex(in vec2 texCoord)\n\
{\n\
    int faceIndex = -1;\n\
\n\
    float tx = texCoord.x;\n\
    float ty = texCoord.y;\n\
\n\
    if(tx >= 0.0 && tx < 0.25)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 1;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
    }\n\
    else if(tx >= 0.25 && tx < 0.5)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            faceIndex = 3;\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 4;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            faceIndex = 2;\n\
        }\n\
    }\n\
    else if(tx >= 0.5 && tx < 0.75)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 0;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
    }\n\
    else if(tx >= 0.75)\n\
    {\n\
        if(ty >= 0.0 && ty < 1.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)\n\
        {\n\
            faceIndex = 5;\n\
        }\n\
        else if(ty >= 2.0/3.0)\n\
        {\n\
            // is no cubeMap zone.\n\
        }\n\
    }\n\
\n\
    return faceIndex;\n\
}\n\
\n\
bool cubeMapNormal(in vec2 texCoord, inout vec3 normal)\n\
{\n\
    int faceIdx = faceIndex(texCoord);\n\
\n\
    if(faceIdx == -1)\n\
    {\n\
        return false;\n\
    }\n\
\n\
    bool isCubeMapZone = true;\n\
\n\
    // convert range 0 to 1 to -1 to 1\n\
    float uc = 2.0 * texCoord.x - 1.0;\n\
    float vc = 2.0 * texCoord.y - 1.0;\n\
    float x, y, z;\n\
\n\
    if(faceIdx == 0)\n\
    { \n\
        x =  1.0; \n\
        y =   vc; \n\
        z =  -uc; // POSITIVE X\n\
    }\n\
    else if(faceIdx == 1)\n\
    {\n\
        x = -1.0; \n\
        y =   vc; \n\
        z =   uc; // NEGATIVE X\n\
    }\n\
    else if(faceIdx == 2)\n\
    {\n\
        x =   uc; \n\
        y =  1.0; \n\
        z =  -vc; // POSITIVE Y\n\
    }\n\
    else if(faceIdx == 3)\n\
    {\n\
        x =   uc; \n\
        y = -1.0; \n\
        z =   vc; // NEGATIVE Y\n\
    }\n\
    else if(faceIdx == 4)\n\
    {\n\
        x =   uc; \n\
        y =   vc; \n\
        z =  1.0; // POSITIVE Z\n\
    }\n\
    else if(faceIdx == 5)\n\
    {\n\
        x =  -uc; \n\
        y =   vc; \n\
        z = -1.0; // NEGATIVE Z\n\
    }\n\
    \n\
    normal = vec3(x, y, z);\n\
    return isCubeMapZone;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
void main()\n\
{           \n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y); // original.\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(1.0,1.0,1.0, 0.0);\n\
    if(uTextureType == 0)\n\
    {\n\
        textureColor = texture2D(texture_0, texCoord);\n\
\n\
        // Test debug:\n\
        //if(textureColor.r > 0.0 || textureColor.g > 0.0)\n\
        //{\n\
        //    textureColor = vec4(1.0, 1.0, 0.5, 1.0);\n\
        //}\n\
    }\n\
    else if(uTextureType == 1)\n\
    {\n\
         textureColor = textureCube(texture_cube, v_normal);\n\
         float linearDepth = unpackDepth(textureColor); // original.\n\
        textureColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);\n\
    }\n\
    \n\
    gl_FragColor = textureColor;\n\
	\n\
}";
ShaderSource.rectangleScreenVS = "precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
attribute vec3 a_nor;\n\
attribute vec2 a_tex;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 v_normal;\n\
\n\
void main() {\n\
    v_tex_pos = a_tex;\n\
    v_normal = a_nor;\n\
    \n\
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);\n\
}";
ShaderSource.RenderShowDepthFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D diffuseTex; // used only if texture is PNG, that has pixels with alpha = 0.0.***\n\
uniform bool bHasTexture; // indicates if texture is PNG, that has pixels with alpha = 0.0.***\n\
varying vec2 vTexCoord; // used only if texture is PNG, that has pixels with alpha = 0.0.***\n\
uniform bool textureFlipYAxis;\n\
\n\
uniform float near;\n\
uniform float far;\n\
\n\
// clipping planes.***\n\
uniform bool bApplyClippingPlanes;\n\
uniform int clippingPlanesCount;\n\
uniform vec4 clippingPlanes[6];\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
\n\
varying float depth;  \n\
varying vec3 vertexPos;\n\
varying vec3 vNormal;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vFrustumIdx;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
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
	// check if is a pixel with alpha zero.***\n\
	if(bHasTexture)\n\
	{\n\
		vec4 textureColor;\n\
		if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else{\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
		if(textureColor.a < 0.4)\n\
		discard;\n\
	}\n\
	\n\
\n\
	if(!bUseLogarithmicDepth)\n\
	{\n\
		gl_FragData[0] = packDepth(depth); \n\
	}\n\
\n\
	float frustumIdx = 1.0;\n\
	if(uFrustumIdx == 0)\n\
	frustumIdx = 0.005;\n\
	else if(uFrustumIdx == 1)\n\
	frustumIdx = 0.015;\n\
	else if(uFrustumIdx == 2)\n\
	frustumIdx = 0.025;\n\
	else if(uFrustumIdx == 3)\n\
	frustumIdx = 0.035;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		// When render with cull_face disabled, must correct the faces normal.\n\
		vec3 normal = vNormal;\n\
		if(normal.z < 0.0)\n\
		normal *= -1.0;\n\
\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
	}\n\
	#endif\n\
	\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		gl_FragData[0] = packDepth(gl_FragDepthEXT);\n\
	}\n\
	#endif\n\
}";
ShaderSource.RenderShowDepthVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
//uniform mat4 modelViewMatrix;\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
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
uniform float uFCoef_logDepth;\n\
\n\
uniform bool bHasTexture; // indicates if texture is PNG, that has pixels with alpha = 0.0.***\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying float depth;\n\
varying vec3 vertexPos;\n\
varying vec2 vTexCoord; // used only if texture is PNG, that has pixels with alpha = 0.0.***\n\
varying vec3 vNormal;\n\
  \n\
void main()\n\
{	\n\
	vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);\n\
	vec4 rotatedPos;\n\
\n\
	mat3 currentTMat;\n\
\n\
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
    \n\
    //linear depth in camera space (0..far)\n\
	vec4 orthoPos = modelViewMatrixRelToEye * pos4;\n\
	depth = (-orthoPos.z)/(far); // the correct value.\n\
	\n\
	// Calculate normalCC.***\n\
	vec3 rotatedNormal = currentTMat * normal;\n\
	vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
\n\
	// When render with cull_face disabled, must correct the faces normal.\n\
	//if(vNormal.z < 0.0) // but, do this in fragment shader.\n\
	//vNormal *= -1.0; // but, do this in fragment shader.\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//-----------------------------------------------------------------------------------\n\
		//float C = 0.0001;\n\
		flogz = 1.0 + gl_Position.z; // use \"z\" instead \"w\" for fast decoding.***\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
\n\
	vertexPos = orthoPos.xyz;\n\
\n\
	if(bHasTexture)\n\
	{\n\
		vTexCoord = texCoord;\n\
	}\n\
}";
ShaderSource.ScreenCopyQuadFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
#define %USE_GL_EXT_FRAGDEPTH%\n\
#ifdef USE_GL_EXT_FRAGDEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTex; // 0\n\
uniform sampler2D normalTex; // 1\n\
uniform sampler2D albedoTex; // 2\n\
\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform mat4 projectionMatrixInv;\n\
uniform mat4 normalMatrix4;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float near;\n\
uniform float far; \n\
\n\
uniform float screenWidth;    \n\
uniform float screenHeight;  \n\
uniform int uFrustumIdx;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
} \n\
\n\
\n\
\n\
void main()\n\
{\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
	vec4 albedo = texture2D(albedoTex, screenPos.xy);\n\
	// in this case, do not other process.\n\
	// 1rst, calculate the pixelPosWC.\n\
	vec4 depthColor4 = texture2D(depthTex, screenPos.xy);\n\
	float z_window  = unpackDepth(depthColor4); // z_window  is [-1.0, 1.0] range depth.\n\
\n\
\n\
	if(z_window >= 1.0)\n\
	{\n\
		discard;\n\
	}\n\
\n\
	if(z_window <= 0.0 && uFrustumIdx < 2)\n\
	{\n\
		// frustum =2 & 3 -> renders sky, so dont discard.\n\
		discard;\n\
	}\n\
	\n\
	float depth = 0.0;\n\
	vec4 posWC = vec4(1.0, 1.0, 1.0, 1.0);\n\
\n\
	// https://stackoverflow.com/questions/11277501/how-to-recover-view-space-position-given-view-space-depth-value-and-ndc-xy\n\
	float depthRange_near = 0.0;\n\
	float depthRange_far = 1.0;\n\
	float x_ndc = 2.0 * screenPos.x - 1.0;\n\
	float y_ndc = 2.0 * screenPos.y - 1.0;\n\
	float z_ndc = (2.0 * z_window - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);\n\
	// Note: NDC range = (-1,-1,-1) to (1,1,1).***\n\
	\n\
	vec4 viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);\n\
	vec3 posCC = viewPosH.xyz/viewPosH.w;\n\
	posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);\n\
	//------------------------------------------------------------------------------------------------------------------------------\n\
\n\
	depth = -posCC.z/far;\n\
	gl_FragData[0] = packDepth(depth); // depth.\n\
	\n\
\n\
	#ifdef USE_GL_EXT_FRAGDEPTH\n\
		//gl_FragDepthEXT = z_window;\n\
	#endif\n\
\n\
	// Now, save the albedo.\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
\n\
		float frustumIdx = 1.0;\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.105;\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.115;\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.125;\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.135;\n\
\n\
		if(z_window > 0.0)\n\
		{\n\
			vec4 normal4WC = vec4(normalize(posWC.xyz), 1.0);\n\
			vec4 normal4 = normalMatrix4 * normal4WC;\n\
			vec3 encodedNormal = encodeNormal(normal4.xyz);\n\
			gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
		}\n\
		else\n\
		{\n\
			vec3 encodedNormal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
			gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***\n\
		}\n\
\n\
		gl_FragData[2] = albedo; // copy albedo.\n\
		\n\
	#endif\n\
\n\
	return;\n\
\n\
}";
ShaderSource.ScreenQuad2FS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
uniform sampler2D lightFogTex; // 0\n\
uniform sampler2D screenSpaceObjectsTex; // 1\n\
\n\
\n\
uniform float near;\n\
uniform float far; \n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
\n\
\n\
uniform float screenWidth;    \n\
uniform float screenHeight;  \n\
uniform vec2 uNearFarArray[4];\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float uSceneDayNightLightingFactor; // day -> 1.0; night -> 0.0\n\
\n\
uniform bool u_activeTex[8];\n\
\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
	\n\
    return ray;                      \n\
} \n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
\n\
\n\
void main()\n\
{\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
    // check for \"screenSpaceObjectsTex\".\n\
    vec4 screenSpaceColor4;\n\
    if(u_activeTex[1])\n\
    {\n\
        screenSpaceColor4 = texture2D(screenSpaceObjectsTex, screenPos);\n\
        gl_FragColor = screenSpaceColor4;\n\
\n\
        if(screenSpaceColor4.a > 0.0)\n\
        return;\n\
    }\n\
\n\
    // Check for light fog.\n\
    if(u_activeTex[0])\n\
    {\n\
        vec4 lightFog4 = texture2D(lightFogTex, screenPos);\n\
        float alpha = lightFog4.w;\n\
        if(alpha > 0.6)\n\
        alpha = 0.6;\n\
\n\
        gl_FragColor = vec4(lightFog4.x, lightFog4.y, lightFog4.z, alpha);\n\
    }\n\
\n\
    \n\
}";
ShaderSource.ScreenQuadFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
uniform sampler2D depthTex; // 0\n\
uniform sampler2D normalTex; // 1\n\
uniform sampler2D albedoTex; // 2\n\
uniform sampler2D shadowMapTex; // 3\n\
uniform sampler2D shadowMapTex2; // 4\n\
uniform sampler2D ssaoTex; // 5\n\
uniform sampler2D diffuseLightTex; // 6\n\
uniform sampler2D specularLightTex; // 7\n\
\n\
uniform mat4 modelViewMatrixRelToEyeInv;\n\
uniform mat4 projectionMatrixInv;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float near;\n\
uniform float far; \n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
\n\
uniform bool bApplyShadow; // sun shadows on cesium terrain.\n\
uniform bool bApplyMagoShadow;\n\
uniform bool bSilhouette;\n\
uniform bool bFxaa;\n\
uniform bool bApplySsao;\n\
\n\
uniform mat4 sunMatrix[2]; \n\
uniform vec3 sunPosHIGH[2];\n\
uniform vec3 sunPosLOW[2];\n\
uniform vec3 sunDirCC;\n\
uniform vec3 sunDirWC;\n\
uniform float screenWidth;    \n\
uniform float screenHeight;  \n\
uniform vec2 uNearFarArray[4];\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
uniform float uSceneDayNightLightingFactor; // day -> 1.0; night -> 0.0\n\
\n\
uniform vec3 uAmbientLight;\n\
\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
vec3 getViewRay(vec2 tc)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * far;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    \n\
	\n\
    return ray;                      \n\
} \n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
bool isInShadow(vec4 pointCC, int currSunIdx, inout bool isUnderSun)\n\
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
	vec3 highDifferenceSun = -currSunPosHIGH.xyz + encodedCameraPositionMCHigh;\n\
	vec3 lowDifferenceSun = pointCC.xyz -currSunPosLOW.xyz + encodedCameraPositionMCLow;\n\
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);\n\
	vec4 vPosRelToLight = currSunMatrix * pos4Sun;\n\
\n\
	vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;\n\
	float tolerance = 0.9963;\n\
	tolerance = 0.9967; // test.\n\
	posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range\n\
	if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)\n\
	{\n\
		if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)\n\
		{\n\
			float depthRelToLight;\n\
			if(currSunIdx == 0)\n\
			{\n\
				depthRelToLight = unpackDepth(texture2D(shadowMapTex, posRelToLight.xy));\n\
			}\n\
			else if(currSunIdx == 1)\n\
			{\n\
				depthRelToLight = unpackDepth(texture2D(shadowMapTex2, posRelToLight.xy));\n\
			}\n\
\n\
			//if(depthRelToLight < 0.1)\n\
			//return false;\n\
\n\
			if(posRelToLight.z > depthRelToLight*tolerance )\n\
			{\n\
				inShadow = true;\n\
			}\n\
\n\
			isUnderSun = true;\n\
		}\n\
	}\n\
	\n\
	return inShadow;\n\
}\n\
\n\
/*\n\
void make_kernel(inout vec4 n[9], vec2 coord)\n\
{\n\
	float w = 1.0 / screenWidth;\n\
	float h = 1.0 / screenHeight;\n\
\n\
	n[0] = texture2D(depthTex, coord + vec2( -w, -h));\n\
	n[1] = texture2D(depthTex, coord + vec2(0.0, -h));\n\
	n[2] = texture2D(depthTex, coord + vec2(  w, -h));\n\
	n[3] = texture2D(depthTex, coord + vec2( -w, 0.0));\n\
	n[4] = texture2D(depthTex, coord);\n\
	n[5] = texture2D(depthTex, coord + vec2(  w, 0.0));\n\
	n[6] = texture2D(depthTex, coord + vec2( -w, h));\n\
	n[7] = texture2D(depthTex, coord + vec2(0.0, h));\n\
	n[8] = texture2D(depthTex, coord + vec2(  w, h));\n\
}\n\
*/\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z*0.0001;\n\
        float Fcoef_half = uFCoef_logDepth/2.0;\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = (flogzAux - 1.0);\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
void main()\n\
{\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
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
		float origin_z_window  = unpackDepth(texture2D(depthTex, screenPos.xy)); // z_window  is [0.0, 1.0] range depth.\n\
		if(origin_z_window > tolerance)\n\
		{\n\
		\n\
			vec2 screenPos_LD = vec2(screenPos.x - pixelSizeW*2.5, screenPos.y - pixelSizeH*2.5); // left-down corner.\n\
			\n\
			for(int w = -10; w<15; w+= 4)\n\
			{\n\
				for(int h=-10; h<15; h+= 4)\n\
				{\n\
					vec2 screenPosAux = vec2(screenPos_LD.x + pixelSizeW*float(w), screenPos_LD.y + pixelSizeH*float(h));\n\
					float z_window  = unpackDepth(texture2D(depthTex, screenPosAux.xy)); // z_window  is [0.0, 1.0] range depth.\n\
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
					//if(backgroundDepthCount > 0 && objectDepthCount > 0)\n\
					//{\n\
						// is silhouette.\n\
						//gl_FragColor = vec4(0.2, 1.0, 0.3, 1.0);\n\
						//return;\n\
					//}\n\
					\n\
				}\n\
			}\n\
\n\
			if(backgroundDepthCount > 0 && objectDepthCount > 0)\n\
			{\n\
				// is silhouette.\n\
				float countsDif = abs(float(objectDepthCount)/16.0);\n\
				gl_FragColor = vec4(0.2, 1.0, 0.3, countsDif);\n\
				return;\n\
			}\n\
		}\n\
\n\
		// New:\n\
		// Try to use a xCross pixels sampling data. TODO:\n\
		return;\n\
	}\n\
	\n\
	float shadow_occlusion = 1.0;\n\
	float alpha = 0.0;\n\
	vec4 finalColor;\n\
	finalColor = vec4(0.2, 0.2, 0.2, 0.8);\n\
\n\
	vec4 normal4 = getNormal(screenPos);\n\
	vec3 normal = normal4.xyz;\n\
	if(length(normal) < 0.1)\n\
	discard;\n\
\n\
\n\
	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
	vec2 nearFar_origin = getNearFar_byFrustumIdx(currFrustumIdx);\n\
	float currNear_origin = nearFar_origin.x;\n\
	float currFar_origin = nearFar_origin.y;\n\
	\n\
	vec3 ambientColor = vec3(0.0);\n\
	vec3 directionalLightColor = vec3(0.9, 0.9, 0.9);\n\
	float directionalLightWeighting = 1.0;\n\
	\n\
	if(bApplyMagoShadow)\n\
	{\n\
		// 1rst, check normal vs sunDirCC.\n\
		bool sunInAntipodas = false;\n\
		float dotAux = dot(sunDirCC, normal);\n\
		if(dotAux > 0.0)\n\
		{\n\
			sunInAntipodas = true;\n\
			shadow_occlusion = 0.5;\n\
		}\n\
\n\
		if(!sunInAntipodas)\n\
		{\n\
			float linearDepth = getDepth(screenPos);\n\
			// calculate the real pos of origin.\n\
			float origin_zDist = linearDepth * currFar_origin; // original.\n\
			vec3 posCC = getViewRay(screenPos, origin_zDist);\n\
			vec4 posWCRelToEye = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0);\n\
			//posWC += vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 0.0);\n\
			//------------------------------------------------------------------------------------------------------------------------------\n\
			// 2nd, calculate the vertex relative to light.***\n\
			// 1rst, try with the closest sun. sunIdx = 0.\n\
			bool isUnderSun = false;\n\
			bool pointIsinShadow = isInShadow(posWCRelToEye, 0, isUnderSun);\n\
			if(!isUnderSun)\n\
			{\n\
				pointIsinShadow = isInShadow(posWCRelToEye, 1, isUnderSun);\n\
			}\n\
\n\
			if(isUnderSun)\n\
			{\n\
				if(pointIsinShadow)\n\
				{\n\
					shadow_occlusion = 0.5;\n\
					alpha = 0.5;\n\
				}\n\
			}\n\
		}\n\
		\n\
		// calculate sunDirCC.\n\
		//vec4 sunDirCC = modelViewMatrixRelToEyeInv * vec4(sunDirWC, 1.0);\n\
		//directionalLightWeighting = max(dot(normal, -sunDirCC.xyz), 0.0);\n\
	}\n\
	\n\
	ambientColor = uAmbientLight;\n\
	// uAmbientLight\n\
	vec3 lightingDirection = normalize(vec3(0.6, 0.6, 0.6));\n\
	directionalLightWeighting = max(dot(normal, lightingDirection), 0.0);\n\
	\n\
	// 1rst, take the albedo.\n\
	vec4 albedo = texture2D(albedoTex, screenPos);\n\
	vec4 diffuseLight = texture2D(diffuseLightTex, screenPos);\n\
	float diffuseLightModul = length(diffuseLight.xyz);\n\
\n\
	//vec3 ray = getViewRay(screenPos, 1.0); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	//float scalarProd = abs(dot(normal, normalize(-ray)));\n\
\n\
	\n\
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***\n\
\n\
	//lightWeighting += diffuseLight.xyz;\n\
	if(dataType != 1)\n\
	{\n\
		albedo *= vec4(lightWeighting, 1.0) ;\n\
	}\n\
	else\n\
	{\n\
		albedo *= vec4(lightWeighting, 1.0);\n\
	}\n\
	\n\
	if(bApplySsao)\n\
	{\n\
		// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
\n\
		//ssaoFromDepthTex\n\
		float pixelSize_x = 1.0/screenWidth;\n\
		float pixelSize_y = 1.0/screenHeight;\n\
		vec4 occlFromDepth = vec4(0.0);\n\
		for(int i=0; i<4; i++)\n\
		{\n\
			for(int j=0; j<4; j++)\n\
			{\n\
				vec2 texCoord = vec2(screenPos.x + pixelSize_x*float(i-2), screenPos.y + pixelSize_y*float(j-2));\n\
				vec4 color = texture2D(ssaoTex, texCoord);\n\
				occlFromDepth += color;\n\
			}\n\
		}\n\
\n\
		occlFromDepth /= 16.0;\n\
		occlFromDepth *= 0.45;\n\
\n\
		float occlusion = occlFromDepth.r + occlFromDepth.g + occlFromDepth.b + occlFromDepth.a; // original.***\n\
\n\
		if(occlusion < 0.0)// original.***\n\
		occlusion = 0.0;// original.***\n\
\n\
		float occlInv = 1.0 - occlusion;\n\
		float lightFactorAux = uSceneDayNightLightingFactor + diffuseLightModul;\n\
		vec3 diffuseLight3 = diffuseLight.xyz + vec3(uSceneDayNightLightingFactor);\n\
\n\
		// Light factor.***\n\
		shadow_occlusion += diffuseLightModul * 0.3;\n\
		if(shadow_occlusion > 1.0)\n\
		shadow_occlusion = 1.0;\n\
\n\
		occlInv *= (shadow_occlusion);\n\
		bool isTransparentObject = false;\n\
		if(albedo.a < 1.0)\n\
		{\n\
			// This is transparent object (rendered in transparent pass), so atenuate occInv.\n\
			isTransparentObject = true;\n\
			occlInv *= 3.0;\n\
			if(occlInv > 1.0)\n\
			occlInv = 1.0;\n\
		}\n\
\n\
		vec4 finalColor = vec4(albedo.r * occlInv * diffuseLight3.x, \n\
							albedo.g * occlInv * diffuseLight3.y, \n\
							albedo.b * occlInv * diffuseLight3.z, albedo.a);\n\
\n\
		gl_FragColor = finalColor;\n\
\n\
		// fog.*****************************************************************\n\
		//float myLinearDepth2 = getDepth(screenPos);\n\
		//float myDepth = (myLinearDepth2 * currFar_origin)/500.0;\n\
		//if(myDepth > 1.0)\n\
		//myDepth = 1.0;\n\
		//vec4 finalColor2 = mix(finalColor, vec4(1.0, 1.0, 1.0, 1.0), myDepth);\n\
		//gl_FragColor = vec4(finalColor2);\n\
		// End fog.---------------------------------------------------------------\n\
\n\
		//float finalColorLightLevel = finalColor.r + finalColor.g + finalColor.b;\n\
		//if(finalColorLightLevel < 0.9)\n\
		//return;\n\
\n\
		// Provisionally render Aura by depth.************************************************************\n\
		/*\n\
		if(dataType == 0)\n\
		{\n\
			// check depth by xCross pixel samples.***\n\
			// PixelRadius = 7;\n\
			// South 3 pixels.***\n\
			float pixelSize_x = 1.0/screenWidth;\n\
			float pixelSize_y = 1.0/screenHeight;\n\
			float counter = 1.0;\n\
			for(int i=0; i<3; i++)\n\
			{\n\
				vec2 screePos_south = vec2(screenPos.x, screenPos.y - counter*pixelSize_y);\n\
\n\
\n\
				counter += 1.0;\n\
			}\n\
\n\
		}\n\
		*/\n\
		// Provisionally render edges here.****************************************************************\n\
		// EDGES.***\n\
		if(dataType == 0)// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
		{\n\
			// detect edges by normals.\n\
			vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;\n\
			vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;\n\
			vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;\n\
			vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;\n\
\n\
			float factor = 0.0;\n\
			float increF = 0.07 * 2.0;\n\
			increF = 0.18;\n\
			float minDot = 0.3;\n\
\n\
			if(dot(normal, normal_up) < minDot)\n\
			{ factor += increF; }\n\
\n\
			if(dot(normal, normal_right) < minDot)\n\
			{ factor += increF; }\n\
\n\
			if(dot(normal, normal_down) < minDot)\n\
			{ factor += increF; }\n\
\n\
			if(dot(normal, normal_left) < minDot)\n\
			{ factor += increF; }\n\
\n\
			float edgeAlpha = factor + occlusion;\n\
			//edgeAlpha /= uSceneDayNightLightingFactor;\n\
\n\
			if(edgeAlpha > 1.0)\n\
			{\n\
				edgeAlpha = 1.0;\n\
			}\n\
			else if(edgeAlpha < 0.2)\n\
			{\n\
				edgeAlpha = 0.2;\n\
			}\n\
\n\
			//vec4 edgeColor;\n\
\n\
			if(factor > increF*0.9*2.0)\n\
			{\n\
				//edgeAlpha = 0.6;\n\
				vec4 edgeColor = finalColor * 0.6;\n\
				if(isTransparentObject)\n\
				edgeColor *= 1.5;\n\
\n\
				gl_FragColor = vec4(edgeColor.rgb, 1.0);\n\
			}\n\
			else if(factor > increF*0.9)\n\
			{\n\
				vec4 albedo_up = texture2D(albedoTex, vec2(screenPos.x, screenPos.y + pixelSize_y));\n\
				vec4 albedo_right = texture2D(albedoTex, vec2(screenPos.x + pixelSize_x, screenPos.y));\n\
				vec4 albedo_down = texture2D(albedoTex, vec2(screenPos.x, screenPos.y - pixelSize_y));\n\
				vec4 albedo_left = texture2D(albedoTex, vec2(screenPos.x - pixelSize_x, screenPos.y));\n\
\n\
				vec4 edgeColor_A = mix(albedo_up, albedo_right, 0.5);\n\
				vec4 edgeColor_B = mix(albedo_down, albedo_left, 0.5);\n\
				vec4 edgeColor_C = mix(edgeColor_A, edgeColor_B, 0.5);\n\
				vec4 edgeColor_D = mix(edgeColor_C, albedo, 0.5);\n\
\n\
				vec4 edgeColorPrev = vec4(edgeColor_D.r * occlInv * diffuseLight3.x, \n\
										edgeColor_D.g * occlInv * diffuseLight3.y, \n\
										edgeColor_D.b * occlInv * diffuseLight3.z, edgeColor_D.a);\n\
				vec4 edgeColor = edgeColorPrev * 0.8;\n\
\n\
				if(isTransparentObject)\n\
				edgeColor *= 1.2;\n\
				gl_FragColor = vec4(edgeColor.rgb, 1.0);\n\
\n\
			}\n\
			\n\
		}\n\
		else if(dataType == 2)// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
		{\n\
			// this is pointCloud data.\n\
			// Check depth values around the pixel to find a silhouette.\n\
			float pixelSize_x = 1.0/screenWidth;\n\
			float pixelSize_y = 1.0/screenHeight;\n\
			float myLinearDepth = getDepth(screenPos);\n\
\n\
			float myDepth = myLinearDepth * currFar_origin;\n\
\n\
\n\
			float radius = 3.0;\n\
			float occ = 0.0;\n\
			for(int i=0; i<3; i++)\n\
			{\n\
				for(int j=0; j<3; j++)\n\
				{\n\
					vec2 texCoord = vec2(screenPos.x + pixelSize_x*float(i-1), screenPos.y + pixelSize_y*float(j-1));\n\
\n\
					// calculate current frustum idx.\n\
					vec4 normal4 = getNormal(texCoord);\n\
					int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
					int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.\n\
					int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
					if(dataType == 1)\n\
					continue;\n\
\n\
					vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
					float currNear = nearFar.x;\n\
					float currFar = nearFar.y;\n\
					float linearDepth = getDepth(texCoord);\n\
					float depth = linearDepth * currFar;\n\
					if(depth > myDepth + radius)\n\
					{\n\
						occ += 1.0;\n\
					}\n\
				}\n\
			}\n\
\n\
			\n\
			//for(int i=0; i<4; i++)\n\
			//{\n\
			//	for(int j=0; j<4; j++)\n\
			//	{\n\
			//		vec2 texCoord = vec2(screenPos.x + pixelSize_x*float(i-2), screenPos.y + pixelSize_y*float(j-2));\n\
\n\
			//		// calculate current frustum idx.\n\
			//		vec4 normal4 = getNormal(texCoord);\n\
			//		int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
			//		int dataType = -1;\n\
			//		int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
			//		if(dataType == 1)\n\
			//		continue;\n\
\n\
			//		vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
			//		float currNear = nearFar.x;\n\
			//		float currFar = nearFar.y;\n\
			//		float linearDepth = getDepth(texCoord);\n\
			//		float depth = linearDepth * currFar;\n\
			//		if(depth > myDepth + radius)\n\
			//		{\n\
			//			occ += 1.0;\n\
			//		}\n\
			//	}\n\
			//}\n\
\n\
			if(occ > 0.0)\n\
			{\n\
				float alpha = occ/8.0;\n\
				float distLimit = 150.0;\n\
				if(myDepth < distLimit)\n\
				{\n\
					alpha = smoothstep(1.0, 0.0, myDepth/distLimit);\n\
				}\n\
				else{\n\
					alpha = 0.0;\n\
				}\n\
\n\
				gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);\n\
				return;\n\
			}\n\
		}\n\
		\n\
		// TEST DEBUG.***********************************\n\
		//if(gl_FragColor.r > 0.8 && gl_FragColor.g > 0.8 && gl_FragColor.b > 0.8 )\n\
		//{\n\
		//	gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
		//}\n\
\n\
		// render edges for points cloud.\n\
		/*\n\
		if(dataType == 2)\n\
		{\n\
			// this is point cloud.\n\
			float linearDepth_origin  = unpackDepth(texture2D(depthTex, screenPos)); // z_window  is [0.0, 1.0] range depth.\n\
			float myZDist = linearDepth_origin * currFar_origin;\n\
			float increAngRad = (2.0*M_PI)/16.0;\n\
			float edgeColor = 0.0;\n\
			for(int i=0; i<16; i++)\n\
			{\n\
				float s = cos(float(i)*increAngRad) * pixelSize_x * 4.0;\n\
				float t = sin(float(i)*increAngRad) * pixelSize_y * 4.0;\n\
				vec2 screenPosAdjacent = vec2(screenPos.x+s, screenPos.y+t);\n\
				vec4 normal4_adjacent = getNormal(screenPosAdjacent);\n\
				int estimatedFrustumIdx_adjacent = int(floor(normal4_adjacent.w * 100.0));\n\
				int dataType_adjacent = -1;\n\
				int currFrustumIdx_adjacent = getRealFrustumIdx(estimatedFrustumIdx_adjacent, dataType_adjacent);\n\
				vec2 nearFar_adjacent = getNearFar_byFrustumIdx(currFrustumIdx_adjacent);\n\
				float currNear_adjacent = nearFar_adjacent.x;\n\
				float currFar_adjacent = nearFar_adjacent.y;\n\
				float linearDepth_adjacent  = unpackDepth(texture2D(depthTex, screenPosAdjacent)); // z_window  is [0.0, 1.0] range depth.\n\
				float zDistAdjacent = linearDepth_adjacent * currFar_adjacent;\n\
\n\
				float zDepthDiff = abs(myZDist - zDistAdjacent);\n\
				if(linearDepth_origin < linearDepth_adjacent)\n\
				{\n\
					if(zDepthDiff > 2.0)\n\
					{\n\
						edgeColor += 1.0;\n\
					}\n\
				}\n\
			}\n\
			if(edgeColor > 4.0)\n\
			{\n\
				edgeColor -= 4.0;\n\
				edgeColor /= 12.0;\n\
\n\
				if(edgeColor > 0.01)\n\
				edgeColor = 1.0;\n\
\n\
				//gl_FragColor = vec4(0.0, 0.0, 0.0, edgeColor);//+occlusion);\n\
				gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//+occlusion);\n\
				return;\n\
				// Test.***\n\
				\n\
			}\n\
			\n\
		}\n\
		*/\n\
	}\n\
	\n\
\n\
	// check if is fastAntiAlias.***\n\
	/*\n\
	if(bFxaa)\n\
	{\n\
		vec4 color = texture2D(depthTex, screenPos);\n\
\n\
		float pixelSize_x = 1.0/screenWidth;\n\
		float pixelSize_y = 1.0/screenHeight;\n\
		vec3 normal = getNormal(screenPos).xyz;\n\
		vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;\n\
		vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;\n\
\n\
		if(dot(normal, normal_up) < 0.5 || dot(normal, normal_right) < 0.5)\n\
		{\n\
			gl_FragColor = vec4(0.0, 0.0, 1.0, 0.5);\n\
			return;\n\
		}\n\
		//if(color.r < 0.0001 && color.g < 0.0001 && color.b < 0.0001)\n\
		//discard;\n\
\n\
		////vec4 n[9];\n\
		////make_kernel( n, vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight) );\n\
\n\
		////vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);\n\
		////vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);\n\
		////vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));\n\
\n\
		////gl_FragColor = vec4( 1.0 - sobel.rgb, 1.0 );\n\
\n\
	}\n\
    */\n\
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
ShaderSource.ssaoFromDepthFS = "\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D noiseTex;  \n\
uniform sampler2D normalTex;\n\
\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 projectionMatrixInv;\n\
\n\
uniform float near;\n\
uniform float far;         \n\
uniform float fov;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight; \n\
uniform vec2 noiseScale;\n\
uniform vec2 uNearFarArray[4];\n\
\n\
\n\
uniform bool bApplySsao;\n\
uniform vec3 kernel[16]; \n\
\n\
const int kernelSize = 16; \n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
\n\
/*\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
    // mago unpackDepth.***\n\
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***\n\
    float depth = dot(rgba_depth, bit_shift);\n\
    return depth;\n\
}  \n\
*/\n\
\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(normalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
            \n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}         \n\
            \n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z*0.0001;\n\
        float Fcoef_half = uFCoef_logDepth/2.0;\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = (flogzAux - 1.0);\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord, inout bool isValid) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<2.0; i++)\n\
	{\n\
        float depthAux = getDepth(texCoord + offset1*(1.0+i));\n\
        if(depthAux > 0.996)\n\
        {\n\
            depthAux = depth;\n\
            isValid = false;\n\
        }\n\
		depthA += depthAux;\n\
\n\
        depthAux = getDepth(texCoord + offset2*(1.0+i));\n\
        if(depthAux > 0.996)\n\
        {\n\
            depthAux = depth;\n\
            isValid = false;\n\
        }\n\
		depthB += depth;\n\
	}\n\
    \n\
	//vec3 posA = reconstructPosition(texCoord + offset1*2.0, depthA/2.0);\n\
	//vec3 posB = reconstructPosition(texCoord + offset2*2.0, depthB/2.0);\n\
    //vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    \n\
    vec3 posA = getViewRay(texCoord + offset1*2.0, far)* depthA/2.0;\n\
	vec3 posB = getViewRay(texCoord + offset2*2.0, far)* depthB/2.0;\n\
    vec3 pos0 = getViewRay(texCoord, far)* depth;\n\
\n\
    posA.z *= -1.0;\n\
    posB.z *= -1.0;\n\
    pos0.z *= -1.0;\n\
    \n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
    isValid = true;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
float getOcclusion(vec3 origin, vec3 rotatedKernel, float radius)\n\
{\n\
    float result_occlusion = 0.0;\n\
    vec3 sample = origin + rotatedKernel * radius;\n\
    vec4 offset = projectionMatrix * vec4(sample, 1.0);	\n\
    vec3 offsetCoord = vec3(offset.xyz);				\n\
    offsetCoord.xyz /= offset.w;\n\
    offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5;  	\n\
\n\
    vec4 normalRGBA = getNormal(offsetCoord.xy);\n\
    int currFrustumIdx = int(floor(100.0*normalRGBA.w));\n\
    vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
    float currNear = nearFar.x;\n\
    float currFar = nearFar.y;\n\
    float depthBufferValue = getDepth(offsetCoord.xy);\n\
    //------------------------------------\n\
    \n\
    float sampleZ = -sample.z;\n\
   // float bufferZ = currNear + depthBufferValue * (currFar - currNear);\n\
    float bufferZ = depthBufferValue * currFar;\n\
    float zDiff = abs(bufferZ - sampleZ);\n\
    if(zDiff < radius)\n\
    {\n\
        //float rangeCheck = smoothstep(0.0, 1.0, radius/zDiff);\n\
        if (bufferZ < sampleZ)//-tolerance*1.0)\n\
        {\n\
            result_occlusion = 1.0;// * rangeCheck;\n\
        }\n\
    }\n\
    \n\
    /*\n\
    float depthDiff = abs(depthBufferValue - sampleDepth);\n\
    if(depthDiff < radius/currFar)\n\
    {\n\
        float rangeCheck = smoothstep(0.0, 1.0, radius / (depthDiff*currFar));\n\
        if (depthBufferValue < sampleDepth)\n\
        {\n\
            result_occlusion = 1.0 * rangeCheck;\n\
        }\n\
    }\n\
    */\n\
    return result_occlusion;\n\
}\n\
\n\
float getFactorByDist(in float radius, in float realDist)\n\
{\n\
    float factorByDist = 1.0;\n\
    if(realDist < radius*5.0)\n\
    {\n\
        factorByDist = smoothstep(0.0, 1.0, realDist/(radius*5.0));\n\
    }\n\
    return factorByDist;\n\
}\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
float getOcclusion_pointsCloud(vec2 screenPosAdjacent)\n\
{\n\
    float result_occlusion = 0.0;\n\
\n\
    vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);\n\
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));\n\
\n\
    // check the data type of the pixel.\n\
    int dataType = -1;\n\
    int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
    vec2 nearFar_adjacent = getNearFar_byFrustumIdx(currFrustumIdx);\n\
    float currNear_adjacent = nearFar_adjacent.x;\n\
    float currFar_adjacent = nearFar_adjacent.y;\n\
\n\
    float depthBufferValue = getDepth(screenPosAdjacent);\n\
    //float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent; // correct.\n\
    float zDist = depthBufferValue * currFar_adjacent;\n\
\n\
\n\
\n\
    return result_occlusion;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
    float occlusion_A = 0.0;\n\
    float occlusion_B = 0.0;\n\
    float occlusion_C = 0.0;\n\
    float occlusion_D = 0.0;\n\
\n\
    vec3 normal = vec3(0.0);\n\
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
    vec4 normalRGBA = getNormal(screenPos);\n\
    vec3 normal2 = normalRGBA.xyz; // original.***\n\
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA.w));\n\
    int dataType = 0; // 0= general geometry. 1= tinTerrain. 2= PointsCloud.\n\
\n\
    // Check the type of the data.******************\n\
    // dataType = 0 -> general geometry data.\n\
    // dataType = 1 -> tinTerrain data.\n\
    // dataType = 2 -> points cloud data.\n\
    //----------------------------------------------\n\
    int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
\n\
    // If the data is no generalGeomtry or pointsCloud, then discard.\n\
    if(dataType != 0 && dataType != 2)\n\
    discard;\n\
\n\
    //if(currFrustumIdx > 3)\n\
    //discard;\n\
\n\
    vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
    float currNear = nearFar.x;\n\
    float currFar = nearFar.y;\n\
    float linearDepth = getDepth(screenPos);\n\
\n\
    // calculate the real pos of origin.\n\
    float origin_zDist = linearDepth * currFar;\n\
    vec3 origin_real = getViewRay(screenPos, origin_zDist);\n\
\n\
    float radius_A = 0.5;\n\
    float radius_B = 5.0;\n\
    float radius_C = 12.0;\n\
    float radius_D = 20.0;\n\
\n\
    float factorByDist = 1.0;\n\
    float realDist = -origin_real.z;\n\
\n\
    float aux = 30.0;\n\
    if(realDist < aux)\n\
    {\n\
        factorByDist = smoothstep(0.0, 1.0, realDist/(aux));\n\
    }\n\
\n\
    // Now, factorByFarDist. When object are in far, no apply ssao.\n\
    float factorByFarDist = 1.0;\n\
    factorByFarDist = 1000.0/realDist;\n\
    if(factorByFarDist > 1.0)\n\
    factorByFarDist = 1.0;\n\
\n\
    factorByDist *= factorByFarDist;\n\
\n\
    if(factorByDist < 0.01)\n\
    discard;\n\
\n\
    // General data type.*************************************************************************************\n\
    //if((dataType == 0 || dataType == 2) && bApplySsao) // ssao including pointClouds.\n\
    if(dataType == 0 && bApplySsao)\n\
	{        \n\
        vec3 origin = origin_real;\n\
        //vec3 origin = reconstructPosition(screenPos, linearDepth); // used when there are no normal-texture.\n\
        bool isValid = true;\n\
        \n\
        if(length(normal2) < 0.1)\n\
        isValid = false;\n\
        if(!isValid)\n\
        {\n\
            //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
            //return;\n\
            discard;\n\
        }\n\
        normal = normal2;\n\
        \n\
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;\n\
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));\n\
		vec3 bitangent = cross(normal2, tangent);\n\
		mat3 tbn = mat3(tangent, bitangent, normal2);   \n\
\n\
		for(int i = 0; i < kernelSize; ++i)\n\
		{    	\n\
            vec3 rotatedKernel = tbn * vec3(kernel[i].x*1.0, kernel[i].y*1.0, kernel[i].z);\n\
\n\
            occlusion_A += getOcclusion(origin, rotatedKernel, radius_A) * factorByDist;\n\
            occlusion_B += getOcclusion(origin, rotatedKernel, radius_B) * factorByDist;\n\
            occlusion_C += getOcclusion(origin, rotatedKernel, radius_C) * factorByDist;\n\
            occlusion_D += getOcclusion(origin, rotatedKernel, radius_D) * factorByDist;\n\
		} \n\
\n\
        float fKernelSize = float(kernelSize);\n\
\n\
		occlusion_C = occlusion_C / fKernelSize;	\n\
        if(occlusion_C < 0.0)\n\
        occlusion_C = 0.0;\n\
        else if(occlusion_C > 1.0)\n\
        occlusion_C = 1.0;\n\
\n\
        occlusion_B = occlusion_B / fKernelSize;	\n\
        if(occlusion_B < 0.0)\n\
        occlusion_B = 0.0;\n\
        else if(occlusion_B > 1.0)\n\
        occlusion_B = 1.0;\n\
\n\
        occlusion_A = occlusion_A / fKernelSize;	\n\
        if(occlusion_A < 0.0)\n\
        occlusion_A = 0.0;\n\
        else if(occlusion_A > 1.0)\n\
        occlusion_A = 1.0;\n\
\n\
        occlusion_D = occlusion_D / fKernelSize;	\n\
        if(occlusion_D < 0.0)\n\
        occlusion_D = 0.0;\n\
        else if(occlusion_D > 1.0)\n\
        occlusion_D = 1.0;\n\
\n\
	}\n\
\n\
    // Points cloud data type.**************************************************************************************\n\
    /*\n\
    if(dataType == 2 && bApplySsao)\n\
	{        \n\
		float linearDepth = getDepth(screenPos);\n\
		//vec3 origin = getViewRay(screenPos) * linearDepth;\n\
\n\
\n\
		vec4 normalRGBA = getNormal(screenPos);\n\
		int currFrustumIdx = int(floor(100.0*normalRGBA.w));\n\
\n\
		if(currFrustumIdx >= 10)\n\
		currFrustumIdx -= 20;\n\
\n\
		vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);\n\
		float currNear = nearFar.x;\n\
		float currFar = nearFar.y;\n\
\n\
\n\
		float myZDist = currNear + linearDepth * currFar;\n\
\n\
		float radiusAux = glPointSize/1.9; // radius in pixels.\n\
		float radiusFog = glPointSize*3.0; // radius in pixels.\n\
		vec2 screenPosAdjacent;\n\
\n\
\n\
\n\
		// calculate the pixelSize in the screenPos.***\n\
		float h = 2.0 * tangentOfHalfFovy * currFar * linearDepth; // height in meters of the screen in the current pixelDepth\n\
    	float w = h * aspectRatio;     							   // width in meters of the screen in the current pixelDepth\n\
		// vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);   \n\
\n\
		float pixelSize_x = w/screenWidth; // the pixelSize in meters in the x axis.\n\
		float pixelSize_y = h/screenHeight;  // the pixelSize in meters in the y axis.\n\
		\n\
		float radiusInMeters = 0.20;\n\
		radiusAux = radiusInMeters / pixelSize_x;\n\
		float radiusFogInMeters = 1.0;\n\
		radiusFog = radiusFogInMeters / pixelSize_x;\n\
\n\
		//radiusAux = 6.0;\n\
		float farFactor = 0.1*sqrt(myZDist);\n\
		\n\
\n\
        //radiusAux = 1.5 *(float(j)+1.0);\n\
        for(int i = 0; i < 8; ++i)\n\
        {  \n\
            // Find occlussion.***  	 \n\
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
\n\
            vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);\n\
            int adjacentFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));\n\
\n\
            if(adjacentFrustumIdx >= 10)\n\
            adjacentFrustumIdx -= 20;\n\
\n\
            vec2 nearFar_adjacent = getNearFar_byFrustumIdx(adjacentFrustumIdx);\n\
            float currNear_adjacent = nearFar_adjacent.x;\n\
            float currFar_adjacent = nearFar_adjacent.y;\n\
\n\
            float depthBufferValue = getDepth(screenPosAdjacent);\n\
            float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent;\n\
            float zDistDiff = abs(myZDist - zDist);\n\
\n\
            \n\
            \n\
            if(myZDist > zDist)\n\
            {\n\
                // My pixel is rear\n\
                if(zDistDiff > farFactor  &&  zDistDiff < 100.0)\n\
                occlusion +=  1.0;\n\
            }\n\
        }\n\
\n\
        float fKernelSize = float(kernelSize);\n\
\n\
		occlusion_C = occlusion_C / fKernelSize;	\n\
        if(occlusion_C < 0.0)\n\
        occlusion_C = 0.0;\n\
        else if(occlusion_C > 1.0)\n\
        occlusion_C = 1.0;\n\
\n\
        occlusion_B = occlusion_B / fKernelSize;	\n\
        if(occlusion_B < 0.0)\n\
        occlusion_B = 0.0;\n\
        else if(occlusion_B > 1.0)\n\
        occlusion_B = 1.0;\n\
\n\
        occlusion_A = occlusion_A / fKernelSize;	\n\
        if(occlusion_A < 0.0)\n\
        occlusion_A = 0.0;\n\
        else if(occlusion_A > 1.0)\n\
        occlusion_A = 1.0;\n\
\n\
        occlusion_D = occlusion_D / fKernelSize;	\n\
        if(occlusion_D < 0.0)\n\
        occlusion_D = 0.0;\n\
        else if(occlusion_D > 1.0)\n\
        occlusion_D = 1.0;\n\
	}\n\
    */\n\
\n\
    \n\
    // Do lighting.***\n\
    //float scalarProd = max(0.01, dot(normal, normalize(-ray)));\n\
   // scalarProd /= 3.0;\n\
	//scalarProd += 0.666;\n\
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - scalarProd);\n\
\n\
	gl_FragColor = vec4(occlusion_A, occlusion_B, occlusion_C, occlusion_D);\n\
    //gl_FragColor = vec4(normal.xyz, 1.0);\n\
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
//uniform vec2 uMinMaxAltitudesBathymetryToGradient; // used for altitudes textures as bathymetry.\n\
\n\
// gradient white-blue vars.***\n\
uniform float uGradientSteps[16];\n\
uniform int uGradientStepsCount;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
float getMinValue(float a, float b, float c)\n\
{\n\
    float x = min(a, b);\n\
    return min(x, c);\n\
}\n\
\n\
float getMaxValue(float a, float b, float c)\n\
{\n\
    float x = max(a, b);\n\
    return max(x, c);\n\
}\n\
\n\
bool isNan(float val)\n\
{\n\
  return (val <= 0.0 || 0.0 <= val) ? false : true;\n\
}\n\
\n\
vec3 RGBtoHSV(vec3 color)\n\
{\n\
    // https://stackoverflow.com/questions/13806483/increase-or-decrease-color-saturation\n\
    float r,g,b,h,s,v;\n\
    r= color.r;\n\
    g= color.g;\n\
    b= color.b;\n\
    float minVal = getMinValue( r, g, b );\n\
    float maxVal = getMaxValue( r, g, b );\n\
\n\
    v = maxVal;\n\
    float delta = maxVal - minVal;\n\
    if( maxVal != 0.0 )\n\
        s = delta / maxVal;        // s\n\
    else {\n\
        // r = g = b = 0        // s = 0, v is undefined\n\
        s = 0.0;\n\
        h = -1.0;\n\
        return vec3(h, s, 0.0);\n\
    }\n\
    if( r == maxVal )\n\
        h = ( g - b ) / delta;      // between yellow & magenta\n\
    else if( g == maxVal )\n\
        h = 2.0 + ( b - r ) / delta;  // between cyan & yellow\n\
    else\n\
        h = 4.0 + ( r - g ) / delta;  // between magenta & cyan\n\
    h *= 60.0;                // degrees\n\
    if( h < 0.0 )\n\
        h += 360.0;\n\
    if ( isNan(h) )\n\
        h = 0.0;\n\
    return vec3(h,s,v);\n\
}\n\
\n\
vec3 HSVtoRGB(vec3 color)\n\
{\n\
    int i;\n\
    float h,s,v,r,g,b;\n\
    h= color.r;\n\
    s= color.g;\n\
    v= color.b;\n\
    if(s == 0.0 ) {\n\
        // achromatic (grey)\n\
        r = g = b = v;\n\
        return vec3(r,g,b);\n\
    }\n\
    h /= 60.0;            // sector 0 to 5\n\
    i = int(floor( h ));\n\
    float f = h - float(i);          // factorial part of h\n\
    float p = v * ( 1.0 - s );\n\
    float q = v * ( 1.0 - s * f );\n\
    float t = v * ( 1.0 - s * ( 1.0 - f ) );\n\
    if( i == 0 ) \n\
    {\n\
        r = v;\n\
        g = t;\n\
        b = p;\n\
    }\n\
    else if(i == 1)\n\
    {\n\
        r = q;\n\
        g = v;\n\
        b = p;\n\
    }\n\
    else if(i == 2)\n\
    {\n\
        r = p;\n\
        g = v;\n\
        b = t;\n\
    }\n\
    else if(i == 3)\n\
    {\n\
        r = p;\n\
        g = q;\n\
        b = v;\n\
    }\n\
    else if(i == 4)\n\
    {\n\
        r = t;\n\
        g = p;\n\
        b = v;\n\
    }\n\
    else\n\
    {       // case 5:\n\
        r = v;\n\
        g = p;\n\
        b = q;\n\
    }\n\
    return vec3(r,g,b);\n\
}\n\
\n\
vec3 getSaturatedColor(vec3 color, float saturation)\n\
{\n\
    vec3 hsv = RGBtoHSV(color);\n\
    hsv.y *= saturation;\n\
    return HSVtoRGB(hsv);\n\
}\n\
\n\
vec3 getRainbowColor_byHeight(float height, float minHeight, float maxHeight)\n\
{\n\
	float minHeight_rainbow = minHeight;\n\
	float maxHeight_rainbow = maxHeight;\n\
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
vec3 getWhiteToBlueColor_byHeight(float height)//, float minHeight, float maxHeight)\n\
{\n\
    // White to Blue in 32 steps.\n\
    float gray = 1.0;\n\
    //gray = 1.0 - gray; // invert gray value (white to blue).\n\
    // calculate r, g, b values by gray.\n\
\n\
    // Test to quadratic gray scale.***\n\
    float stepGray = 1.0;\n\
\n\
    for(int i=0; i<16-1; i++)\n\
    {\n\
        if(i >= uGradientStepsCount-1)\n\
        break;\n\
\n\
        float stepValue = uGradientSteps[i];\n\
        float stepValue2 = uGradientSteps[i+1];\n\
\n\
        // check if is frontier.***\n\
        if(height >= uGradientSteps[0])\n\
        {\n\
            stepGray = 0.0;\n\
            break;\n\
        }\n\
\n\
        if(height <= stepValue && height > stepValue2)\n\
        {\n\
            // calculate decimal.***\n\
            //float decimal = (height - stepValue)/(stepValue2-stepValue);\n\
            float decimal = (stepValue - height)/(stepValue-stepValue2);\n\
            float unit = float (i);\n\
            float value = unit + decimal;\n\
            stepGray = value/float(uGradientStepsCount-1);\n\
            break;\n\
        }\n\
    }\n\
    gray = stepGray;\n\
\n\
\n\
    float r, g, b;\n\
\n\
    // Red.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        float minGray = 0.0;\n\
        float maxGray = 0.15625;\n\
        float maxR = 1.0;\n\
        float minR = 0.3515625; // 90/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.40625) // [6, 13] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.40625;\n\
        float maxR = 0.3515625; // 90/256.\n\
        float minR = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        r = maxR - relativeGray*(maxR - minR);\n\
    }\n\
    else  // [14, 32] from 32 divisions.\n\
    {\n\
        r = 0.0;\n\
    }\n\
\n\
    // Green.\n\
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.\n\
    {\n\
        g = 1.0; // 256.\n\
    }\n\
    else if(gray >= 0.15625 && gray < 0.5625) // [6, 18] from 32 divisions.\n\
    {\n\
        float minGray = 0.15625;\n\
        float maxGray = 0.5625;\n\
        float maxG = 1.0; // 256/256.\n\
        float minG = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        g = maxG - relativeGray*(maxG - minG);\n\
    }\n\
    else  // [18, 32] from 32 divisions.\n\
    {\n\
        g = 0.0;\n\
    }\n\
\n\
    // Blue.\n\
    if(gray < 0.5625)\n\
    {\n\
        b = 1.0;\n\
    }\n\
    else // gray >= 0.5625 && gray <= 1.0\n\
    {\n\
        float minGray = 0.5625;\n\
        float maxGray = 1.0;\n\
        float maxB = 1.0; // 256/256.\n\
        float minB = 0.0; // 0/256.\n\
        float relativeGray = (gray- minGray)/(maxGray - minGray);\n\
        b = maxB - relativeGray*(maxB - minB);\n\
    }\n\
\n\
    return vec3(r, g, b);\n\
}\n\
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
void getTextureColor(in int activeNumber, in vec4 currColor4, in vec2 texCoord,  inout bool victory, in float externalAlpha, in vec4 externalTexCoords, inout vec4 resultTextureColor)\n\
{\n\
    if(activeNumber == 1 || activeNumber == 2)\n\
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
\n\
            // debug.\n\
            //resultTextureColor = mix(resultTextureColor, vec4(1.0, 1.0, 1.0, 1.0), 0.4);\n\
        }\n\
    }\n\
    else if(activeNumber == 10)\n\
    {\n\
        // Bathymetry texture.\n\
        float altitude = 1000000.0;\n\
        if(currColor4.w > 0.0)\n\
        {\n\
            // decode the grayScale.***\n\
\n\
            float r = currColor4.r * 256.0;\n\
            float g = currColor4.g;\n\
            float b = currColor4.b;\n\
\n\
            float height = currColor4.r;\n\
            float maxHeight;\n\
            float minHeight;\n\
            float numDivs;\n\
            float increHeight;\n\
				\n\
				if(r < 0.0001)\n\
				{\n\
					// considering r=0.\n\
					minHeight = -2796.0;\n\
					maxHeight = -1000.0;\n\
					numDivs = 2.0;\n\
                    increHeight = (maxHeight - minHeight)/(numDivs);\n\
                    height = (256.0*g + b)/(128.0);\n\
\n\
                    //resultTextureColor.r = 1.0;\n\
                    //resultTextureColor.g = 0.0;\n\
                    //resultTextureColor.b = 0.0;\n\
                    //return;\n\
				}\n\
				else if(r > 0.5 && r < 1.5)\n\
				{\n\
					// considering r=1.\n\
					minHeight = -1000.0;\n\
					maxHeight = -200.0;\n\
					numDivs = 2.0;\n\
                    increHeight = (maxHeight - minHeight)/(numDivs);\n\
                    height = (256.0*g + b)/(128.0);\n\
\n\
                    //resultTextureColor.r = 0.0;\n\
                    //resultTextureColor.g = 1.0;\n\
                    //resultTextureColor.b = 0.0;\n\
                    //return;\n\
				}\n\
				else if(r > 1.5 && r < 2.5)\n\
				{\n\
					// considering r=2.\n\
					minHeight = -200.0;\n\
					maxHeight = 1.0;\n\
					numDivs = 123.0;\n\
                    increHeight = (maxHeight - minHeight)/(numDivs);\n\
                    height = (256.0*g + b)/(128.0);\n\
				}\n\
\n\
\n\
\n\
				//height = (256.0*g + b)/(128.0);\n\
                height = (256.0*g + b)/(numDivs);\n\
               // height = (256.0*g*increHeight + b*increHeight)- minHeight;\n\
            \n\
            //altitude = uMinMaxAltitudes.x + height * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);\n\
		    altitude = minHeight + height * (maxHeight -minHeight);\n\
            //altitude = height;\n\
            if(altitude < 0.0)\n\
            {\n\
                /*\n\
                float minHeight_rainbow = uMinMaxAltitudes.x;\n\
                float maxHeight_rainbow = 0.0;\n\
                float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
                vec4 seaColor;\n\
\n\
                float red = gray + 0.1;//float red = gray + 0.2;\n\
                float green = gray + 0.5;//float green = gray + 0.6;\n\
                float blue = gray*2.0 + 2.0;\n\
                seaColor = vec4(red, green, blue, 1.0);\n\
                */\n\
\n\
                vec3 seaColorRGB = getWhiteToBlueColor_byHeight(altitude);\n\
                vec4 seaColor = vec4(seaColorRGB, 1.0);\n\
\n\
                resultTextureColor = mix(resultTextureColor, seaColor, 0.99); \n\
            }\n\
\n\
        }\n\
    }\n\
}\n\
\n\
void main()\n\
{           \n\
    // Debug.\n\
    /*\n\
    if((v_tex_pos.x < 0.006 || v_tex_pos.x > 0.994) || (v_tex_pos.y < 0.006 || v_tex_pos.y > 0.994))\n\
    {\n\
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
        return;\n\
    }\n\
    */\n\
\n\
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);\n\
\n\
    // Take the base color.\n\
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);\n\
    bool victory = false;\n\
\n\
    if(uActiveTextures[0] > 0)\n\
    {\n\
        if(uActiveTextures[0] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[0];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], uExternalTexCoordsArray[0], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], uExternalTexCoordsArray[0], textureColor);\n\
        \n\
    }\n\
    if(uActiveTextures[1] > 0)\n\
    {\n\
        if(uActiveTextures[1] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[1];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], uExternalTexCoordsArray[1], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], uExternalTexCoordsArray[1], textureColor);\n\
    }\n\
    if(uActiveTextures[2] > 0)\n\
    {\n\
        if(uActiveTextures[2] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[2];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], uExternalTexCoordsArray[2], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], uExternalTexCoordsArray[2], textureColor);\n\
    }\n\
    if(uActiveTextures[3] > 0)\n\
    {\n\
        if(uActiveTextures[3] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[3];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], uExternalTexCoordsArray[3], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], uExternalTexCoordsArray[3], textureColor);\n\
    }\n\
    if(uActiveTextures[4] > 0)\n\
    {\n\
        if(uActiveTextures[4] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[4];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], uExternalTexCoordsArray[4], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], uExternalTexCoordsArray[4], textureColor);\n\
    }\n\
    if(uActiveTextures[5] > 0)\n\
    {\n\
        if(uActiveTextures[5] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[5];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], uExternalTexCoordsArray[5], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], uExternalTexCoordsArray[5], textureColor);\n\
    }\n\
    if(uActiveTextures[6] > 0)\n\
    {\n\
        if(uActiveTextures[6] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[6];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], uExternalTexCoordsArray[6], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], uExternalTexCoordsArray[6], textureColor);\n\
    }\n\
    if(uActiveTextures[7] > 0)\n\
    {\n\
        if(uActiveTextures[7] == 2)\n\
        {\n\
            // CustomImage. Must recalculate texCoords.\n\
            vec4 externalTexCoord = uExternalTexCoordsArray[7];\n\
            \n\
            // check if intersects.\n\
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);\n\
            if(intersects(texCoordAux, externalTexCoord))\n\
            {\n\
                // convert myTexCoord to customImageTexCoord.\n\
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);\n\
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);\n\
\n\
                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);\n\
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);\n\
\n\
                texCoord.y = 1.0 - texCoord.y;\n\
                getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], uExternalTexCoordsArray[7], textureColor);\n\
            }\n\
        }\n\
        else\n\
            getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], uExternalTexCoordsArray[7], textureColor);\n\
    }\n\
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
uniform float uFCoef_logDepth;\n\
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
ShaderSource.thickLineExtrudedVS = "\n\
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
uniform float uFCoef_logDepth;\n\
uniform float uExtrudeHeight;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
\n\
const float error = 0.001;\n\
\n\
// see https://weekly-geekly.github.io/articles/331164/index.html\n\
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306\n\
\n\
//                                   Bottom                                      Top\n\
//       \n\
//                        (1)                    (2)                  (3)                    (4)\n\
//                         +-----------------------+                   +-----------------------+ \n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         *---------------------->*                   *---------------------->*\n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         +-----------------------+                   +-----------------------+\n\
//                         (-1)                    (-2)                (-3)                    (-4)\n\
\n\
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
vec4 getPointWC(in vec3 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	return vec4(objPosHigh.xyz + objPosLow.xyz, 1.0);\n\
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
void main()\n\
{\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
\n\
    float currW = current.w;\n\
    float prevW = prev.w;\n\
    float nextW = next.w;\n\
\n\
    vec4 rotatedCurr = buildingRotMatrix * vec4(current.xyz, 1.0);\n\
    vec4 rotatedPrev = buildingRotMatrix * vec4(prev.xyz, 1.0);\n\
    vec4 rotatedNext = buildingRotMatrix * vec4(next.xyz, 1.0);\n\
\n\
	float sense = 1.0;\n\
	int orderInt = int(floor(currW + 0.1));\n\
    int orderIntPrev = int(floor(prevW + 0.1));\n\
    int orderIntNext = int(floor(nextW + 0.1));\n\
\n\
    float absOrderCurr = currW > 0.0? currW : currW*-1.0;\n\
    float absOrderPrev = prevW > 0.0? prevW : prevW*-1.0;\n\
    float absOrderNext = nextW > 0.0? nextW : nextW*-1.0;\n\
\n\
    float provisionalExtrudeHeght = 500.0; // provisional for debug.\n\
\n\
\n\
\n\
    // calculate the triangle's normal. To do it, calculate prevDir & currDir.\n\
    vec3 rotatedUp = normalize(vec3(( rotatedCurr.xyz + buildingPosLOW ) + buildingPosHIGH)); \n\
    vec3 rotatedPrevDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
    vec3 rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
\n\
    // check if any dir is vertical.\n\
    //float dotPrev = abs(dot(rotatedUp, rotatedPrevDir));\n\
    //float dotCurr = abs(dot(rotatedUp, rotatedNextDir));\n\
    vec3 rotatedDir;\n\
    vec3 rotatedLeft;\n\
\n\
    \n\
    int faceType = 0; // 0= bottom, 1= rear, 2= top, 3= front, 4= left, 5= right.\n\
    int faceTypeNext = 0;\n\
\n\
    if(orderInt == 1)\n\
    {\n\
        //rotatedDir\n\
    }\n\
    else if(orderInt == -1)\n\
    {\n\
\n\
    }\n\
    else if(orderInt == 2)\n\
    {\n\
        \n\
    }\n\
    else if(orderInt == -2)\n\
    {\n\
        \n\
    }\n\
\n\
\n\
\n\
    vec4 rotatedOffSet;\n\
\n\
    \n\
    //////////////////////////////////////////////////////////////////////////////////////////////////\n\
	//float aspect = viewport.x / viewport.y;\n\
	//vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
\n\
    vec4 rotatedPos = vec4(rotatedCurr.xyz + rotatedOffSet.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	vec4 posCC =  vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    vec4 finalPosProjected = ModelViewProjectionMatrixRelToEye * posCC;\n\
	gl_Position = finalPosProjected; \n\
\n\
    vec4 orthoPos = modelViewMatrixRelToEye * posCC;\n\
	vDepth = -orthoPos.z/far;\n\
\n\
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
\n\
     // test.***\n\
    if(orderInt == 1 || orderInt == 11 || orderInt == 21 || orderInt == 31)\n\
    {\n\
        vColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == -1 || orderInt == -11 || orderInt == -21 || orderInt == -31)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == 2 || orderInt == 12 || orderInt == 22 || orderInt == 32)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 1.0, 1.0);\n\
    }\n\
    else if(orderInt == -2 || orderInt == -12 || orderInt == -22 || orderInt == -32)\n\
    {\n\
        vColor = vec4(1.0, 1.0, 0.0, 1.0);\n\
    }\n\
\n\
    //if(isRear )\n\
    //{\n\
    //    vColor = vec4(1.0, 0.0, 1.0, 1.0);\n\
    //}\n\
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
ShaderSource.thickLineExtrudedVS__original = "\n\
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
uniform float uFCoef_logDepth;\n\
uniform float uExtrudeHeight;\n\
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
//                                   Bottom                                      Top\n\
//       \n\
//                        (1)                    (2)                  (3)                    (4)\n\
//                         +-----------------------+                   +-----------------------+ \n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         *---------------------->*                   *---------------------->*\n\
//                         |                       |                   |                       |\n\
//                         |                       |                   |                       |\n\
//                         +-----------------------+                   +-----------------------+\n\
//                         (-1)                    (-2)                (-3)                    (-4)\n\
\n\
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
vec4 getPointWC(in vec3 point)\n\
{\n\
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;\n\
	return vec4(objPosHigh.xyz + objPosLow.xyz, 1.0);\n\
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
void main()\n\
{\n\
	// current, prev & next.***\n\
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));\n\
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));\n\
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));\n\
\n\
    float currW = current.w;\n\
    float prevW = prev.w;\n\
    float nextW = next.w;\n\
\n\
    vec4 rotatedCurr = buildingRotMatrix * vec4(current.xyz, 1.0);\n\
    vec4 rotatedPrev = buildingRotMatrix * vec4(prev.xyz, 1.0);\n\
    vec4 rotatedNext = buildingRotMatrix * vec4(next.xyz, 1.0);\n\
\n\
	float sense = 1.0;\n\
	int orderInt = int(floor(currW + 0.1));\n\
    int orderIntPrev = int(floor(prevW + 0.1));\n\
    int orderIntNext = int(floor(nextW + 0.1));\n\
\n\
    float absOrderCurr = currW > 0.0? currW : currW*-1.0;\n\
    float absOrderPrev = prevW > 0.0? prevW : prevW*-1.0;\n\
    float absOrderNext = nextW > 0.0? nextW : nextW*-1.0;\n\
\n\
    float provisionalExtrudeHeght = 500.0; // provisional for debug.\n\
\n\
\n\
\n\
    // calculate the triangle's normal. To do it, calculate prevDir & currDir.\n\
    vec3 rotatedUp = normalize(vec3(( rotatedCurr.xyz + buildingPosLOW ) + buildingPosHIGH)); \n\
    vec3 rotatedPrevDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
    vec3 rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
\n\
    // check if any dir is vertical.\n\
    //float dotPrev = abs(dot(rotatedUp, rotatedPrevDir));\n\
    //float dotCurr = abs(dot(rotatedUp, rotatedNextDir));\n\
    vec3 rotatedDir;\n\
    vec3 rotatedLeft;\n\
\n\
    \n\
    int faceType = 0; // 0= bottom, 1= rear, 2= top, 3= front, 4= left, 5= right.\n\
    int faceTypeNext = 0;\n\
\n\
    // Check current faceType.************************************************************\n\
    if(absOrderCurr > 10.0 && absOrderCurr < 20.0)\n\
    {\n\
        faceType = 1; // rear.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedCurr += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
    }\n\
    else if(absOrderCurr > 20.0 && absOrderCurr < 30.0)\n\
    {\n\
        faceType = 2; // top.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedCurr += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
    }\n\
    else if(absOrderCurr > 30.0 && absOrderCurr < 40.0)\n\
    {\n\
        faceType = 3; // front.\n\
\n\
        // so, add height to nextPoint.\n\
        //rotatedCurr += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
    }\n\
    else if(absOrderCurr > 40.0 && absOrderCurr < 50.0)\n\
    {\n\
        faceType = 4; // left.\n\
\n\
        // in this case, must check the orderType to decide add height value into upDirection.\n\
        if(orderInt == 41)\n\
        {\n\
            // is bottom point.\n\
        }\n\
        else if(orderInt == -41)\n\
        {\n\
            // is top point.\n\
\n\
        }\n\
    }\n\
\n\
    // Check next faceType.***************************************************************\n\
    if(absOrderNext > 10.0 && absOrderNext < 20.0)\n\
    {\n\
        faceTypeNext = 1;// rear.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
    else if(absOrderNext > 20.0 && absOrderNext < 30.0)\n\
    {\n\
        faceTypeNext = 2;// top.\n\
\n\
        // so, add height to nextPoint.\n\
        rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
    else if(absOrderNext > 30.0 && absOrderNext < 40.0)\n\
    {\n\
        faceTypeNext = 3;// front.\n\
\n\
        // so, add height to nextPoint.\n\
        //rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        //rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
    else if(absOrderNext > 40.0 && absOrderNext < 50.0)\n\
    {\n\
        faceTypeNext = 4;// left.\n\
\n\
        // so, add height to nextPoint.\n\
        //rotatedNext += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
        //rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
    }\n\
\n\
    vec4 rotatedOffSet;\n\
\n\
    if(faceType == 0)\n\
    {\n\
        // bottom.\n\
        if(orderInt == 1 || orderInt == -1)\n\
        {\n\
            rotatedDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
        else // currOrderInt = 2 || currOrderInt = -2\n\
        {\n\
            // check if nextPoint is vertical.\n\
            if(faceTypeNext == 1)\n\
            {\n\
                // next face is rear, so is vertical.\n\
                //rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
                rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedPrev.xyz)); // in this case use prevDir.\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
            else\n\
            {\n\
                rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        \n\
    }\n\
    else if(faceType == 1)\n\
    {\n\
        // rear.\n\
        if(orderInt == 11 || orderInt == -11)\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
        else // orderInt == 12 || -12\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
    }\n\
    else if(faceType == 2)\n\
    {\n\
        // top.\n\
        if(orderInt == 21 || orderInt == -21)\n\
        {\n\
            rotatedDir = rotatedPrevDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
        else // orderInt == 22 || -22\n\
        {\n\
            // check if nextPoint is vertical.\n\
            if(faceTypeNext == 3) // front.\n\
            {\n\
                // next face is front, so is vertical.\n\
                rotatedDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz)); // in this case use prevDir.\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
            else\n\
            {\n\
                rotatedDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));\n\
                rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            }\n\
            //rotatedDir = rotatedNextDir;\n\
            //rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
    }\n\
    else if(faceType == 3)\n\
    {\n\
        // front.\n\
        if(orderInt == 31 || orderInt == -31)\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));\n\
            //rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedNextDir));\n\
        }\n\
        else // orderInt == 32 || -32\n\
        {\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
        }\n\
\n\
        if(orderInt > 0)\n\
        {\n\
            // do left.\n\
            rotatedOffSet = vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else\n\
        {\n\
            // do right.\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
    }\n\
    else if(faceType == 4)\n\
    {\n\
        // left.\n\
        if(orderInt == 41 || orderInt == -41)\n\
        {\n\
            rotatedDir = rotatedPrevDir;\n\
            //rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedNextDir));\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
        else \n\
        {\n\
            //rotatedDir = rotatedPrevDir;\n\
            rotatedDir = rotatedNextDir;\n\
            rotatedLeft = normalize(cross(rotatedUp, rotatedDir));\n\
            rotatedOffSet = vec4(-rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
\n\
        \n\
\n\
        if(orderInt < 0)\n\
        {\n\
            // add height.\n\
            rotatedOffSet += vec4(rotatedUp * provisionalExtrudeHeght, 0.0);\n\
            //rotatedOffSet += vec4(rotatedLeft * thickness * 50.0, 1.0);\n\
        }\n\
\n\
    }\n\
\n\
    \n\
    //////////////////////////////////////////////////////////////////////////////////////////////////\n\
	//float aspect = viewport.x / viewport.y;\n\
	//vec2 aspectVec = vec2(aspect, 1.0);\n\
	\n\
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;\n\
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;\n\
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;\n\
	\n\
	float projectedDepth = currentProjected.w;                \n\
\n\
    vec4 rotatedPos = vec4(rotatedCurr.xyz + rotatedOffSet.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
	vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
	vec4 posCC =  vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    vec4 finalPosProjected = ModelViewProjectionMatrixRelToEye * posCC;\n\
	gl_Position = finalPosProjected; \n\
\n\
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
\n\
     // test.***\n\
    if(orderInt == 1 || orderInt == 11 || orderInt == 21 || orderInt == 31)\n\
    {\n\
        vColor = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == -1 || orderInt == -11 || orderInt == -21 || orderInt == -31)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
    else if(orderInt == 2 || orderInt == 12 || orderInt == 22 || orderInt == 32)\n\
    {\n\
        vColor = vec4(0.0, 1.0, 1.0, 1.0);\n\
    }\n\
    else if(orderInt == -2 || orderInt == -12 || orderInt == -22 || orderInt == -32)\n\
    {\n\
        vColor = vec4(1.0, 1.0, 0.0, 1.0);\n\
    }\n\
\n\
    //if(isRear )\n\
    //{\n\
    //    vColor = vec4(1.0, 0.0, 1.0, 1.0);\n\
    //}\n\
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
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main() {\n\
	gl_FragData[0] = vColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		//gl_FragData[1] = vec4(0.0);\n\
		//gl_FragData[2] = vec4(0.0);\n\
		//gl_FragData[3] = vec4(0.0);\n\
		\n\
\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = vColor; \n\
		\n\
	}\n\
	#endif\n\
\n\
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
uniform float uFCoef_logDepth;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
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
	vec4 orthoPos = modelViewMatrixRelToEye * vCurrent;\n\
	vDepth = -orthoPos.z/far;\n\
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
	vec4 offset = vec4(normal * direction, 0.0, 0.0);\n\
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
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
  \n\
uniform sampler2D diffuseTex;  // 2\n\
uniform sampler2D diffuseTex_1;// 3\n\
uniform sampler2D diffuseTex_2;// 4\n\
uniform sampler2D diffuseTex_3;// 5\n\
uniform sampler2D diffuseTex_4;// 6\n\
uniform sampler2D diffuseTex_5;// 7\n\
uniform bool textureFlipYAxis;\n\
uniform bool bIsMakingDepth;\n\
uniform bool bExistAltitudes;\n\
uniform bool bApplyCaustics;\n\
uniform mat4 projectionMatrix;\n\
uniform mat4 projectionMatrixInv;\n\
uniform vec2 noiseScale;\n\
uniform float near;\n\
uniform float far;            \n\
uniform float fov;\n\
uniform float aspectRatio;    \n\
uniform float screenWidth;    \n\
uniform float screenHeight;      \n\
uniform int uActiveTextures[8];\n\
uniform float externalAlphasArray[8];\n\
uniform vec2 uMinMaxAltitudes;\n\
\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
varying vec2 vTexCoord;   \n\
\n\
varying vec3 diffuseColor;\n\
uniform vec3 specularColor;\n\
varying float depthValue; // z buffer depth.\n\
    \n\
uniform float uTime;  \n\
\n\
uniform float externalAlpha;\n\
uniform bool bUseLogarithmicDepth;\n\
varying vec3 vNormal;\n\
varying float currSunIdx;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
// Texture's vars.***\n\
varying float vTileDepth;\n\
\n\
\n\
float unpackDepth(vec4 packedDepth)\n\
{\n\
	// See Aras Pranckevičius' post Encoding Floats to RGBA\n\
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/\n\
	//vec4 packDepth( float v ) // function to packDepth.***\n\
	//{\n\
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
	//	enc = fract(enc);\n\
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
	//	return enc;\n\
	//}\n\
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float UnpackDepth32( in vec4 pack )\n\
{\n\
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0\n\
    return depth * (16777216.0) / (16777216.0 - 1.0);\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);\n\
  return enc;\n\
}   \n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
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
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(diffuseTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		// in this shader the depthTex is \"diffuseTex\"\n\
		return unpackDepth(texture2D(diffuseTex, coord.xy));\n\
	}\n\
}\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/screenWidth;\n\
    float pixelSizeY = 1.0/screenHeight;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	vec2 origin = vec2(texCoord.x - pixelSizeX, texCoord.y - pixelSizeY);\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<3.0; i++)\n\
	{\n\
		depthA += getDepth(origin + offset1*(1.0+i*2.0));\n\
		depthB += getDepth(origin + offset2*(1.0+i*2.0));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*2.0, depthA/3.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*2.0, depthB/3.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
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
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
void main()\n\
{    \n\
	float depthAux = -depthValue;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half; //flogz = 1.0 + gl_Position.z;\n\
		depthAux = gl_FragDepthEXT;\n\
	}\n\
	#endif\n\
\n\
	vec2 texCoord;\n\
\n\
	vec4 textureColor = vec4(0.0);\n\
\n\
	if(colorType == 2) // texture color.\n\
	{\n\
		// Check if the texture is from a different depth tile texture.***\n\
		vec2 finalTexCoord = vTexCoord;\n\
		\n\
		if(textureFlipYAxis)\n\
		{\n\
			texCoord = vec2(finalTexCoord.s, 1.0 - finalTexCoord.t);\n\
		}\n\
		else{\n\
			texCoord = vec2(finalTexCoord.s, finalTexCoord.t);\n\
		}\n\
\n\
		bool firstColorSetted = false;\n\
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
			//textureColor = vec4(1.0, 0.0, 1.0, 1.0); // test.\n\
		}\n\
\n\
	}\n\
	else{\n\
		textureColor = oneColor4;\n\
	}\n\
\n\
	textureColor.w = externalAlpha;\n\
	vec4 fogColor = vec4(0.9, 0.9, 0.9, 1.0);\n\
	\n\
	\n\
	// Dem image.***************************************************************************************************************\n\
	float altitude = 1000000.0;\n\
	if(uActiveTextures[5] == 10)\n\
	{\n\
		// Bathymetry.***\n\
		vec4 layersTextureColor = texture2D(diffuseTex_3, texCoord);\n\
		//if(layersTextureColor.w > 0.0)\n\
		{\n\
			// decode the grayScale.***\n\
			float sumAux = layersTextureColor.r;// + layersTextureColor.g + layersTextureColor.b;// + layersTextureColor.w;\n\
\n\
			float r = layersTextureColor.r*256.0;;\n\
			float g = layersTextureColor.g;\n\
			float b = layersTextureColor.b;\n\
\n\
			float maxHeight;\n\
			float minHeight;\n\
			float numDivs;\n\
			float increHeight;\n\
			float height;\n\
			\n\
			if(r < 0.0001)\n\
			{\n\
				// considering r=0.\n\
				minHeight = -2796.0;\n\
				maxHeight = -1000.0;\n\
				numDivs = 2.0;\n\
				increHeight = (maxHeight - minHeight)/(numDivs);\n\
				height = (256.0*g + b)/(128.0);\n\
			}\n\
			else if(r > 0.5 && r < 1.5)\n\
			{\n\
				// considering r=1.\n\
				minHeight = -1000.0;\n\
				maxHeight = -200.0;\n\
				numDivs = 2.0;\n\
				increHeight = (maxHeight - minHeight)/(numDivs);\n\
				height = (256.0*g + b)/(128.0);\n\
			}\n\
			else if(r > 1.5 && r < 2.5)\n\
			{\n\
				// considering r=2.\n\
				minHeight = -200.0;\n\
				maxHeight = 1.0;\n\
				numDivs = 123.0;\n\
				increHeight = (maxHeight - minHeight)/(numDivs);\n\
				height = (256.0*g + b)/(128.0);\n\
			}\n\
\n\
			height = (256.0*g + b)/(numDivs);\n\
			altitude = minHeight + height * (maxHeight -minHeight);\n\
		}\n\
	}\n\
	else if(uActiveTextures[5] == 20)\n\
	{\n\
		// waterMarkByAlpha.***\n\
		// Check only alpha component.\n\
		vec4 layersTextureColor = texture2D(diffuseTex_3, texCoord);\n\
		float alpha = layersTextureColor.a;\n\
		if(alpha > 0.0)\n\
		{\n\
			altitude = -100.0;\n\
		}\n\
		else\n\
		{\n\
			altitude = 100.0;\n\
		}\n\
	}\n\
\n\
	// End Dem image.------------------------------------------------------------------------------------------------------------\n\
	float linearDepthAux = 1.0;\n\
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);\n\
\n\
	vec3 ray = getViewRay(screenPos); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
\n\
	float linearDepth = getDepth(screenPos);  \n\
	linearDepthAux = linearDepth;\n\
\n\
	vec3 normalFromDepth = vec3(0.0, 0.0, 1.0);\n\
	//vec3 normalFromDepth = normal_from_depth(linearDepthAux, screenPos); // normal from depthTex.***\n\
	//vec2 screenPosAux = vec2(0.5, 0.5);\n\
\n\
	//vec3 rayAux = getViewRay(screenPosAux); // The \"far\" for depthTextures if fixed in \"RenderShowDepthVS\" shader.\n\
	//float scalarProd = dot(normalFromDepth, normalize(-rayAux));\n\
	//scalarProd /= 3.0;\n\
	//scalarProd += 0.666;\n\
\n\
	////scalarProd /= 2.0;\n\
	////scalarProd += 0.5;\n\
\n\
	float scalarProd = 1.0;\n\
	\n\
	if(altitude < 0.0)\n\
	{\n\
		float minHeight_rainbow = -100.0;\n\
		float maxHeight_rainbow = 0.0;\n\
		minHeight_rainbow = uMinMaxAltitudes.x;\n\
		maxHeight_rainbow = uMinMaxAltitudes.y;\n\
		\n\
		float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
		//float gray = (vAltitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);\n\
		//vec3 rainbowColor = getRainbowColor_byHeight(altitude);\n\
\n\
		// caustics.*********************\n\
		if(bApplyCaustics)\n\
		{\n\
			int tileDepth = int(floor(vTileDepth + 0.1));\n\
			if(uTime > 0.0 && tileDepth > 6 && gray > 0.0)//&& altitude > -120.0)\n\
			{\n\
				// Active this code if want same size caustic effects for different tileDepths.***\n\
				// Take tileDepth 14 as the unitary tile depth.\n\
				//float tileDethDiff = float(16 - tileDepth);\n\
				//vec2 cauticsTexCoord = texCoord*pow(2.0, tileDethDiff);\n\
				//-----------------------------------------------------------------------\n\
				vec2 cauticsTexCoord = texCoord;\n\
				vec3 causticColor = causticColor(cauticsTexCoord)*gray*0.3;\n\
				textureColor = vec4(textureColor.r+ causticColor.x, textureColor.g+ causticColor.y, textureColor.b+ causticColor.z, 1.0);\n\
			}\n\
		}\n\
		// End caustics.--------------------------\n\
		\n\
		if(gray < 0.05)\n\
		gray = 0.05;\n\
		float red = gray + 0.2;\n\
		float green = gray + 0.6;\n\
		float blue = gray*2.0 + 2.0;\n\
		fogColor = vec4(red, green, blue, 1.0);\n\
\n\
		// Something like to HillShade .*********************************************************************************\n\
		vec3 lightDir = normalize(vec3(1.0, 1.0, 0.0));\n\
		float scalarProd_2d = dot(lightDir, normalFromDepth);\n\
		\n\
		scalarProd_2d /= 2.0;\n\
		scalarProd_2d += 0.8;\n\
\n\
		//scalarProd_2d *= scalarProd_2d;\n\
		textureColor *= vec4(textureColor.r*scalarProd_2d, textureColor.g*scalarProd_2d, textureColor.b, textureColor.a);\n\
		// End Something like to HillShade.---------------------------------------------------------------------------------\n\
		\n\
		// End test drawing grid.---\n\
		//float specularReflectionCoef = 0.6;\n\
		//vec3 specularColor = vec3(0.8, 0.8, 0.8);\n\
		//textureColor = mix(textureColor, fogColor, 0.2); \n\
		//gl_FragData[0] = vec4(finalColor.xyz + specularReflectionCoef * specular * specularColor , 1.0); // with specular.***\n\
		gl_FragData[0] = vec4(textureColor.xyz * scalarProd, 1.0); // original.***\n\
\n\
		return;\n\
	}\n\
	//else{\n\
		\n\
		//if(uSeaOrTerrainType == 1)\n\
		//discard;\n\
	//}\n\
	\n\
	//vec4 finalColor = mix(textureColor, fogColor, vFogAmount); \n\
\n\
	//gl_FragData[0] = vec4(finalColor.xyz * scalarProd, 1.0); // original.***\n\
	//gl_FragData[0] = textureColor; // test.***\n\
	//gl_FragData[0] = vec4(vNormal.xyz, 1.0); // test.***\n\
	gl_FragData[0] = packDepth(depthAux);  // anything.\n\
\n\
	\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
		gl_FragData[1] = packDepth(depthAux);  // depth.\n\
		vec3 normal = vNormal;\n\
		if(normal.z < 0.0)\n\
		normal *= -1.0;\n\
		vec3 encodedNormal = encodeNormal(normal);\n\
		gl_FragData[2] = vec4(encodedNormal, 0.005); // normal.***\n\
		//gl_FragData[2] = vec4(0.0, 0.0, 1.0, 1.0); // normal.***\n\
		gl_FragData[3] = vec4(textureColor); // albedo.***\n\
	#endif\n\
	\n\
}";
ShaderSource.TinTerrainVS = "\n\
\n\
attribute vec3 position;\n\
attribute vec3 normal;\n\
//attribute vec4 color4;\n\
attribute vec2 texCoord;\n\
attribute float altitude;\n\
\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 sunDirWC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
\n\
uniform float near;\n\
uniform float far;\n\
uniform bool bApplySpecularLighting;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
// geographic.\n\
uniform int uTileDepth;\n\
uniform vec4 uTileGeoExtent; // (minLon, minLat, maxLon, maxLat).\n\
uniform int uTileDepthOfBindedTextures; // The depth of the tileTexture binded. Normally uTileDepth = uTileDepthOfBindedTextures, but if current tile has no texturesPrepared, then bind ownerTexture and change texCoords.\n\
uniform vec4 uTileGeoExtentOfBindedTextures; // (minLon, minLat, maxLon, maxLat).\n\
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;   \n\
varying vec3 v3Pos;\n\
varying float depthValue;\n\
varying float vFogAmount;\n\
\n\
varying vec3 vLightDir; \n\
varying float vAltitude;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
// Texture's vars.***\n\
varying float vTileDepth;\n\
varying float vTexTileDepth;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
#define M_E 2.7182818284590452353602875\n\
\n\
float roundCustom(float number)\n\
{\n\
	float numberResult = sign(number)*floor(abs(number)+0.5);\n\
	return numberResult;\n\
}\n\
\n\
float LatitudeRad_fromTexCoordY(float t, float minLatitudeRad, int tileDepth)\n\
{\n\
	// No used. Is not precise.\n\
	float PI_DIV_4 = M_PI/4.0;\n\
	float tileDepthFloat = float(tileDepth);\n\
	float aConst = (1.0/(2.0*M_PI))*pow(2.0, tileDepthFloat);\n\
\n\
	float minT = roundCustom( aConst*(M_PI-log(tan(PI_DIV_4+minLatitudeRad/2.0))) );\n\
	minT = 1.0 - minT;\n\
\n\
	float tAux = t + minT;\n\
	tAux = 1.0 - tAux;\n\
	float latRad = 2.0*(atan(exp(M_PI-tAux/aConst))-PI_DIV_4);\n\
	\n\
	return latRad;\n\
}\n\
\n\
float TexCoordY_fromLatitudeRad(float latitudeRad, float minLatitudeRad, int tileDepth, float aConst)\n\
{\n\
	float PI_DIV_4 = M_PI/4.0;\n\
	float minTTex = roundCustom(aConst*(M_PI-log(tan(PI_DIV_4+minLatitudeRad/2.0))));\n\
	minTTex = 1.0 - minTTex;\n\
\n\
	float newT = aConst*(M_PI-log(tan(PI_DIV_4+latitudeRad/2.0)));\n\
	newT = 1.0 - newT;\n\
	newT -= minTTex;\n\
\n\
	return newT;\n\
}\n\
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
	vTileDepth = float(uTileDepth);\n\
	vTexTileDepth = float(uTileDepthOfBindedTextures);\n\
	/*\n\
	if(bApplySpecularLighting)\n\
	{\n\
		applySpecLighting = 1.0;\n\
	}\n\
	else{\n\
		applySpecLighting = -1.0;\n\
	}\n\
	*/\n\
	v3Pos = (modelViewMatrixRelToEye * pos4).xyz;\n\
	depthValue = v3Pos.z/far;\n\
\n\
		vTexCoord = texCoord;\n\
\n\
\n\
		// ckeck if the texture is for this tile.\n\
		if(uTileDepth != uTileDepthOfBindedTextures)\n\
		{\n\
			float thisMinLon = uTileGeoExtent.x;\n\
			float thisMinLat = uTileGeoExtent.y;\n\
			float thisMaxLon = uTileGeoExtent.z;\n\
			float thisMaxLat = uTileGeoExtent.w;\n\
			float thisLonRange = (thisMaxLon - thisMinLon);\n\
\n\
			float thisMinLatRad = thisMinLat * M_PI/180.0;\n\
			float thisMaxLatRad = thisMaxLat * M_PI/180.0;\n\
\n\
			float texMinLon = uTileGeoExtentOfBindedTextures.x;\n\
			float texMinLat = uTileGeoExtentOfBindedTextures.y;\n\
			float texMaxLon = uTileGeoExtentOfBindedTextures.z;\n\
\n\
			float texLonRange = (texMaxLon - texMinLon);\n\
			float texMinLatRad = texMinLat * M_PI/180.0;\n\
\n\
\n\
			float currLon = thisMinLon + texCoord.x * thisLonRange;\n\
			float newS = (currLon - texMinLon) / texLonRange; // [0..1] range\n\
\n\
			float aConstTex = (1.0/(2.0*M_PI))*pow(2.0, float(uTileDepthOfBindedTextures));\n\
\n\
			float minT = TexCoordY_fromLatitudeRad(thisMinLatRad, texMinLatRad, uTileDepthOfBindedTextures, aConstTex); // [0..1] range\n\
			float maxT = TexCoordY_fromLatitudeRad(thisMaxLatRad, texMinLatRad, uTileDepthOfBindedTextures, aConstTex); // [0..1] range\n\
			float scaleT = maxT - minT;\n\
			float newT = minT + texCoord.y * scaleT;\n\
\n\
			vTexCoord = vec2(newS, newT);\n\
			\n\
\n\
			/*\n\
			// CRS84.**************************************************\n\
			// need know longitude & latitude of my texCoord.\n\
			float currLon = thisMinLon + texCoord.x * thisLonRange;\n\
			float currLat = thisMinLat + texCoord.y * thisLatRange;\n\
\n\
			// calculate my minLon relative to texture.***\n\
			float s = (currLon - texMinLon) / texLonRange; // [0..1] range\n\
			float t = (currLat - texMinLat) / texLatRange; // [0..1] range\n\
\n\
			vTexCoord = vec2(s, t);\n\
			*/\n\
		}\n\
		\n\
		\n\
	\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://www.gamasutra.com/blogs/BranoKemen/20090812/85207/Logarithmic_Depth_Buffer.php\n\
		// z = log(C*z + 1) / log(C*Far + 1) * w\n\
		// https://android.developreference.com/article/21119961/Logarithmic+Depth+Buffer+OpenGL\n\
\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//---------------------------------------------------------------------------------\n\
\n\
		flogz = 1.0 - v3Pos.z;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
\n\
	// calculate fog amount.\n\
	float fogParam = 1.15 * v3Pos.z/(far - 10000.0);\n\
	float fogParam2 = fogParam*fogParam;\n\
	vFogAmount = fogParam2*fogParam2;\n\
\n\
	if(vFogAmount < 0.0)\n\
	vFogAmount = 0.0;\n\
	else if(vFogAmount > 1.0)\n\
	vFogAmount = 1.0;\n\
	//vFogAmount = ((-v3Pos.z))/(far);\n\
}";
ShaderSource.update_frag = "precision highp float;\n\
\n\
uniform sampler2D u_particles;\n\
uniform sampler2D u_wind;\n\
uniform sampler2D u_windGlobeDepthTex;\n\
uniform sampler2D u_windGlobeNormalTex;\n\
\n\
uniform mat4 modelViewMatrixInv;\n\
\n\
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
uniform float tangentOfHalfFovy;\n\
uniform float far;            \n\
uniform float aspectRatio; \n\
\n\
// new uniforms test.\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform mat4 buildingRotMatrixInv;\n\
uniform vec2 uNearFarArray[4];\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
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
\n\
vec2 getOffset(vec2 particlePos, float radius)\n\
{\n\
	// \"particlePos\" is a unitary position.\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
	float distortion = cos((minLatRad + particlePos.y * latRadRange ));\n\
	float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;\n\
	float yOffset = (0.5 - particlePos.y) * latRadRange * radius;\n\
\n\
	return vec2(xOffset, yOffset);\n\
}\n\
/*\n\
vec3 get_NDCCoord(in vec2 pos)\n\
{\n\
	// calculate the offset at the earth radius.***\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	vec2 offset = getOffset(pos, radius);\n\
\n\
	float xOffset = offset.x;\n\
	float yOffset = offset.y;\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);\n\
	\n\
	vec4 position = vec4((rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow) + ( buildingPosHIGH - encodedCameraPositionMCHigh), 1.0);\n\
	\n\
	// Now calculate the position on camCoord.***\n\
	vec4 posCC = ModelViewProjectionMatrixRelToEye * position;\n\
	vec3 ndc_coord = vec3(posCC.xyz/posCC.w);\n\
\n\
	return ndc_coord;\n\
}\n\
*/\n\
\n\
bool is_NDCCoord_InsideOfFrustum(in vec3 ndc_coord)\n\
{\n\
	bool pointIsInside = true;\n\
\n\
	float ndc_x = ndc_coord.x;\n\
	float ndc_y = ndc_coord.y;\n\
\n\
	if(ndc_x < -1.0)\n\
		return false;\n\
	else if(ndc_x > 1.0)\n\
		return false;\n\
	else if(ndc_y < -1.0)\n\
		return false;\n\
	else if(ndc_y > 1.0)\n\
		return false;\n\
	\n\
	return pointIsInside;\n\
}\n\
\n\
bool isPointInsideOfFrustum(in vec2 pos)\n\
{\n\
	bool pointIsInside = true;\n\
	\n\
	// calculate the offset at the earth radius.***\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	vec2 offset = getOffset(pos, radius);\n\
\n\
	float xOffset = offset.x;\n\
	float yOffset = offset.y;\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);\n\
	\n\
	vec4 position = vec4(( rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow ) + ( buildingPosHIGH - encodedCameraPositionMCHigh ), 1.0);\n\
	\n\
	// Now calculate the position on camCoord.***\n\
	vec4 posCC = ModelViewProjectionMatrixRelToEye * position;\n\
	vec3 ndc_pos = vec3(posCC.xyz/posCC.w);\n\
\n\
	return is_NDCCoord_InsideOfFrustum(ndc_pos);\n\
}\n\
\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
    return ray;                      \n\
} \n\
\n\
vec4 decodeNormal(in vec4 normal)\n\
{\n\
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);\n\
}\n\
\n\
vec4 getNormal(in vec2 texCoord)\n\
{\n\
    vec4 encodedNormal = texture2D(u_windGlobeNormalTex, texCoord);\n\
    return decodeNormal(encodedNormal);\n\
}\n\
\n\
int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)\n\
{\n\
    // Check the type of the data.******************\n\
    // frustumIdx 0 .. 3 -> general geometry data.\n\
    // frustumIdx 10 .. 13 -> tinTerrain data.\n\
    // frustumIdx 20 .. 23 -> points cloud data.\n\
    //----------------------------------------------\n\
    int realFrustumIdx = -1;\n\
    \n\
     if(estimatedFrustumIdx >= 10)\n\
    {\n\
        estimatedFrustumIdx -= 10;\n\
        if(estimatedFrustumIdx >= 10)\n\
        {\n\
            // points cloud data.\n\
            estimatedFrustumIdx -= 10;\n\
            dataType = 2;\n\
        }\n\
        else\n\
        {\n\
            // tinTerrain data.\n\
            dataType = 1;\n\
        }\n\
    }\n\
    else\n\
    {\n\
        // general geomtry.\n\
        dataType = 0;\n\
    }\n\
\n\
    realFrustumIdx = estimatedFrustumIdx;\n\
    return realFrustumIdx;\n\
}\n\
\n\
vec2 getNearFar_byFrustumIdx(in int frustumIdx)\n\
{\n\
    vec2 nearFar;\n\
    if(frustumIdx == 0)\n\
    {\n\
        nearFar = uNearFarArray[0];\n\
    }\n\
    else if(frustumIdx == 1)\n\
    {\n\
        nearFar = uNearFarArray[1];\n\
    }\n\
    else if(frustumIdx == 2)\n\
    {\n\
        nearFar = uNearFarArray[2];\n\
    }\n\
    else if(frustumIdx == 3)\n\
    {\n\
        nearFar = uNearFarArray[3];\n\
    }\n\
\n\
    return nearFar;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
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
	// Calculate pixelSizes.**************************************************************************************************\n\
	\n\
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	float radius = length(buildingPos);\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
	float distortion = cos((minLatRad + pos.y * latRadRange ));\n\
\n\
	float meterToLon = 1.0/(radius * distortion);\n\
	float meterToLat = 1.0 / radius;\n\
\n\
	float xSpeedFactor = meterToLon / lonRadRange;\n\
	float ySpeedFactor = meterToLat / latRadRange;\n\
\n\
	xSpeedFactor *= 3.0 * u_speed_factor;\n\
	ySpeedFactor *= 3.0 * u_speed_factor;\n\
\n\
	vec2 offset = vec2(velocity.x / distortion * xSpeedFactor, -velocity.y * ySpeedFactor);\n\
\n\
	// End ******************************************************************************************************************\n\
\n\
	\n\
\n\
    // update particle position, wrapping around the date line\n\
    pos = fract(1.0 + pos + offset);\n\
\n\
\n\
    // drop rate is a chance a particle will restart at random position, to avoid degeneration\n\
	float drop = 0.0;\n\
\n\
	//if(u_interpolation < 0.99) // 0.9\n\
	//{\n\
	//	drop = 0.0;\n\
	//}\n\
	//else\n\
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
	if(drop > 0.01)\n\
	{\n\
		// Intersection ray with globe mode:\n\
		vec2 random_screenPos = vec2( rand(pos), rand(v_tex_pos) );\n\
		vec4 normal4 = getNormal(random_screenPos);\n\
		vec3 normal = normal4.xyz;\n\
		if(length(normal) < 0.1)\n\
		{\n\
			// do nothing.\n\
		}\n\
		else\n\
		{\n\
			int estimatedFrustumIdx = int(floor(normal4.w * 100.0));\n\
			int dataType = -1;\n\
			int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);\n\
			vec2 nearFar_origin = getNearFar_byFrustumIdx(currFrustumIdx);\n\
			float currNear_origin = nearFar_origin.x;\n\
			float currFar_origin = nearFar_origin.y;\n\
\n\
			vec4 depth4 = texture2D(u_windGlobeDepthTex, random_screenPos);\n\
			float linearDepth = unpackDepth(depth4);\n\
			float relativeFar = linearDepth * currFar_origin;\n\
			vec3 posCC = getViewRay(random_screenPos, relativeFar);  \n\
			vec4 posWC = modelViewMatrixInv * vec4(posCC, 1.0);\n\
\n\
			// convert nearP(wc) to local coord.\n\
			posWC.x -= (buildingPosHIGH.x + buildingPosLOW.x);\n\
			posWC.y -= (buildingPosHIGH.y + buildingPosLOW.y);\n\
			posWC.z -= (buildingPosHIGH.z + buildingPosLOW.z);\n\
\n\
			vec4 posLC = buildingRotMatrixInv * vec4(posWC.xyz, 1.0);\n\
\n\
			// now, convert localPos to unitary-offset position.\n\
			float minLonRad = u_geoCoordRadiansMin.x;\n\
			float maxLonRad = u_geoCoordRadiansMax.x;\n\
			float minLatRad = u_geoCoordRadiansMin.y;\n\
			float maxLatRad = u_geoCoordRadiansMax.y;\n\
			float lonRadRange = maxLonRad - minLonRad;\n\
			float latRadRange = maxLatRad - minLatRad;\n\
\n\
			// Calculate the inverse of xOffset & yOffset.****************************************\n\
			// Remember : float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;\n\
			// Remember : float yOffset = (0.5 - particlePos.y) * latRadRange * radius;\n\
			//------------------------------------------------------------------------------------\n\
			\n\
			float unitaryOffset_y = 0.5 - (posLC.y / (latRadRange * radius));\n\
			float distortion = cos((minLatRad + unitaryOffset_y * latRadRange ));\n\
			float unitaryOffset_x = (posLC.x /(distortion * lonRadRange * radius)) + 0.5;\n\
\n\
			pos = vec2(unitaryOffset_x, unitaryOffset_y);\n\
		}\n\
	}\n\
	\n\
	/*\n\
	if(drop > 0.01)\n\
	{\n\
		// Methode 2:\n\
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
		\n\
		// New version:\n\
		// try to born inside of the camera's frustum.\n\
\n\
		vec2 posA = vec2(pos);\n\
		vec2 posB = vec2(v_tex_pos);\n\
		bool isInsideOfFrustum = false;\n\
		for(int i=0; i<30; i++)\n\
		{\n\
			if(isPointInsideOfFrustum(random_pos))\n\
			{\n\
				isInsideOfFrustum = true;\n\
				break;\n\
			}\n\
			else\n\
			{\n\
				posA.x = random_pos.y;\n\
				posA.y = random_pos.x;\n\
\n\
				posB.x = random_pos.x;\n\
				posB.y = random_pos.y;\n\
\n\
				random_pos = vec2( rand(posA), rand(posB) );\n\
			}\n\
		}\n\
\n\
		pos = random_pos;\n\
	}\n\
	*/\n\
\n\
    // encode the new particle position back into RGBA\n\
    gl_FragColor = vec4(\n\
        fract(pos * 255.0),\n\
        floor(pos * 255.0) / 255.0);\n\
}";
ShaderSource.vectorMeshClampToTerrainFS = "precision highp float;\n\
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
ShaderSource.vectorMeshClampToTerrainVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
\n\
uniform float thickness;\n\
uniform mat4 buildingRotMatrix;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec2 viewport;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec4 oneColor4;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform float far;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth; // no use.\n\
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
			//gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;\n\
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
ShaderSource.waterCalculateContaminationFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D currWaterFluxTex_HIGH;\n\
uniform sampler2D currWaterFluxTex_LOW;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
varying vec2 v_tex_pos; // texCoords.\n\
#define PI 3.1415926\n\
\n\
uniform float u_SimRes;\n\
uniform float u_PipeLen; // pipeLen = cellSizeX = cellSizeY.\n\
uniform float u_timestep;\n\
uniform float u_PipeArea;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_waterMaxFlux;\n\
uniform float u_waterMaxVelocity;\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
vec2 encodeVelocity(in vec2 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    float decoded = unpackDepth(color4);\n\
    float contaminHeight = decoded * u_contaminantMaxHeigh;\n\
    return contaminHeight;\n\
}\n\
\n\
vec4 getWaterFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(currWaterFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(currWaterFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_waterMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void encodeWaterFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);\n\
    curuv = v_tex_pos;\n\
\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
    float cellArea = cellSize_x * cellSize_y;\n\
\n\
    vec4 topflux = getWaterFlux(curuv + vec2(0.0, divY));\n\
    vec4 rightflux = getWaterFlux(curuv + vec2(divX, 0.0));\n\
    vec4 bottomflux = getWaterFlux(curuv + vec2(0.0, -divY));\n\
    vec4 leftflux = getWaterFlux(curuv + vec2(-divX, 0.0));\n\
    vec4 curflux = getWaterFlux(curuv);\n\
    //vec4 curT = texture2D(terrainHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    //curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;\n\
    float topWH = getWaterHeight(curuv + vec2(0.0, divY));\n\
    float rightWH = getWaterHeight(curuv + vec2(divX, 0.0));\n\
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -divY));\n\
    float leftWH = getWaterHeight(curuv + vec2(-divX, 0.0));\n\
    float currWH = getWaterHeight(curuv);\n\
    \n\
    float topContaminHeight = getContaminantHeight(curuv + vec2(0.0, divY));\n\
    float rightContaminHeight = getContaminantHeight(curuv + vec2(divX, 0.0));\n\
    float bottomContaminHeight = getContaminantHeight(curuv + vec2(0.0, -divY));\n\
    float leftContaminHeight = getContaminantHeight(curuv + vec2(-divX, 0.0));\n\
    float currContaminHeight = getContaminantHeight(curuv);\n\
\n\
    \n\
    \n\
    //out flow flux\n\
    float ftopout = curflux.x;\n\
    float frightout = curflux.y;\n\
    float fbottomout = curflux.z;\n\
    float fleftout = curflux.w;\n\
\n\
    vec4 outputflux = curflux;\n\
    vec4 inputflux = vec4(topflux.z, rightflux.w, bottomflux.x, leftflux.y);\n\
\n\
    float fout = ftopout + frightout + fbottomout + fleftout;\n\
    float fin = inputflux.x + inputflux.y + inputflux.z + inputflux.w;\n\
\n\
    \n\
\n\
    float deltaH = u_timestep * (fin - fout) / cellArea; \n\
    //---------------------------------------------------------------------------------\n\
    // do contaminant flux interchange.\n\
    // Top.***\n\
    float topOutContaminH = (curflux.x * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float topInContaminH = (topflux.z * u_timestep / cellArea) * (topContaminHeight / topWH);\n\
    float topContaminDelta = topInContaminH - topOutContaminH;\n\
\n\
    // Right.***\n\
    float rightOutContaminH = (curflux.y * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float rightInContaminH = (rightflux.w * u_timestep / cellArea) * (rightContaminHeight / rightWH);\n\
    float rightContaminDelta = rightInContaminH - rightOutContaminH;\n\
\n\
    // Bottom.***\n\
    float bottomOutContaminH = (curflux.z * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float bottomInContaminH = (bottomflux.x * u_timestep / cellArea) * (bottomContaminHeight / bottomWH);\n\
    float bottomContaminDelta = bottomInContaminH - bottomOutContaminH;\n\
\n\
    // Left.***\n\
    float leftOutContaminH = (curflux.w * u_timestep / cellArea) * (currContaminHeight / currWH);\n\
    float leftInContaminH = (leftflux.y * u_timestep / cellArea) * (leftContaminHeight / leftWH);\n\
    float leftContaminDelta = leftInContaminH - leftOutContaminH;\n\
\n\
    float newContaminantHeight = max(0.0, topContaminDelta + rightContaminDelta + bottomContaminDelta + leftContaminDelta);\n\
    //----------------------------------------------------------------------------------\n\
\n\
    //float d1 = cur.y + curs.x; // original. (waterH + sedimentH).\n\
    float d1 = currWH;\n\
    float d2 = d1 + deltaH;\n\
    float da = (d1 + d2)/2.0;\n\
\n\
    vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0);\n\
\n\
    if(da <= 1e-8) \n\
    {\n\
        veloci = vec2(0.0);\n\
    }\n\
    else\n\
    {\n\
        //veloci = veloci/(da * u_PipeLen);\n\
        veloci = veloci/(da * vec2(cellSize_y, cellSize_x));\n\
    }\n\
\n\
    if(curuv.x <= divX) { deltaH = 0.0; veloci = vec2(0.0); }\n\
    if(curuv.x >= 1.0 - 2.0 * divX) { deltaH = 0.0; veloci = vec2(0.0); }\n\
    if(curuv.y <= divY) { deltaH = 0.0; veloci = vec2(0.0); }\n\
    if(curuv.y >= 1.0 - 2.0 * divY) { deltaH = 0.0; veloci = vec2(0.0); }\n\
\n\
    //  float absx = abs(veloci.x);\n\
    //  float absy = abs(veloci.y);\n\
    //  float maxxy = max(absx, absy);\n\
    //  float minxy = min(absx, absy);\n\
    //  float tantheta = minxy / maxxy;\n\
    //  float scale = cos(45.0 * PI / 180.0 - atan(tantheta));\n\
    //  float divtheta = (1.0/sqrt(2.0)) / scale;\n\
    //  float divs = min(abs(veloci.x), abs(veloci.y))/max(abs(veloci.x), abs(veloci.y));\n\
    //  if((divs) > 20.0){\n\
    //    veloci /= 20.0;\n\
    //  }\n\
\n\
    \n\
\n\
    vec2 encodedVelocity = encodeVelocity(veloci/u_waterMaxVelocity);\n\
    vec4 writeVel = vec4(encodedVelocity, 0.0, 1.0);\n\
    //vec4 writeWaterHeight = vec4(cur.x,max(cur.y+deltavol, 0.0),cur.z,cur.w); // original.***\n\
\n\
    // test debug:\n\
    //if(abs(veloci.x) > 40.0 || abs(veloci.y) > 40.0)\n\
    {\n\
        shaderLogColor4 = vec4(encodedVelocity, 0.0, 1.0);\n\
    }\n\
\n\
    float waterHeight = max(currWH + deltaH, 0.0); // original.***\n\
    waterHeight /= u_waterMaxHeigh; // original.***\n\
\n\
    vec4 encodedWH = packDepth(waterHeight);\n\
    gl_FragData[0] = encodedWH;  // water height.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = writeVel; // velocity\n\
        gl_FragData[2] = shaderLogColor4; // \n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateFluxFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D contaminantHeightTex;\n\
uniform sampler2D currWaterFluxTex_HIGH;\n\
uniform sampler2D currWaterFluxTex_LOW;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_waterMaxFlux;\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_contaminantMaxHeigh; // if \"u_contaminantMaxHeigh\" < 0.0 -> no exist contaminant.\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
vec4 getWaterFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(currWaterFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(currWaterFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_waterMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void encodeWaterFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
\n\
    // Terrain & water heights.**************************************************************************************************\n\
    // read terrain heights.\n\
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));\n\
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));\n\
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));\n\
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));\n\
    float curTH = getTerrainHeight(curuv);\n\
\n\
    // read water heights.\n\
    float topWH = getWaterHeight(curuv + vec2(0.0, divY));\n\
    float rightWH = getWaterHeight(curuv + vec2(divX, 0.0));\n\
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -divY));\n\
    float leftWH = getWaterHeight(curuv + vec2(-divX, 0.0));\n\
    float curWH = getWaterHeight(curuv);\n\
\n\
    float topCH = 0.0;\n\
    float rightCH = 0.0;\n\
    float bottomCH = 0.0;\n\
    float leftCH = 0.0;\n\
    float curCH = 0.0;\n\
\n\
    // Check if exist contaminant.\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        // exist contaminant.\n\
        topCH = getContaminantHeight(curuv + vec2(0.0, divY));\n\
        rightCH = getContaminantHeight(curuv + vec2(divX, 0.0));\n\
        bottomCH = getContaminantHeight(curuv + vec2(0.0, -divY));\n\
        leftCH = getContaminantHeight(curuv + vec2(-divX, 0.0));\n\
        curCH = getContaminantHeight(curuv);\n\
    }\n\
\n\
    // End terrain & water heights.-----------------------------------------------------------------------------------------------\n\
\n\
    // Calculate deltaPresure: deltaP_ij(x,y) = ro*g* deltaH_ij(x,y).*************************************************************\n\
    // calculate deltaH.***\n\
    // Provisionally considere contaminant density equal to water density.\n\
    float curTotalH = curTH + curWH + curCH;\n\
    float HTopOut = curTotalH - (topTH + topWH + topCH);\n\
    float HRightOut = curTotalH - (rightTH + rightWH + rightCH);\n\
    float HBottomOut = curTotalH - (bottomTH + bottomWH + bottomCH);\n\
    float HLeftOut = curTotalH - (leftTH + leftWH + leftCH);\n\
    float gravity = 9.8;\n\
    float waterDensity = 997.0; // 997kg/m3.\n\
    vec4 deltaP = vec4(waterDensity * gravity * HTopOut, \n\
                        waterDensity * gravity * HRightOut, \n\
                        waterDensity * gravity * HBottomOut, \n\
                        waterDensity * gravity * HLeftOut ); // deltaP = kg/(m*s2) = Pa.\n\
\n\
    // calculate water acceleration.*********************************************************************************************\n\
    vec4 waterAccel = vec4(deltaP.x/(waterDensity * cellSize_x),\n\
                            deltaP.y/(waterDensity * cellSize_y),\n\
                            deltaP.z/(waterDensity * cellSize_x),\n\
                            deltaP.w/(waterDensity * cellSize_y));\n\
\n\
    // read flux.\n\
    vec4 curFlux = getWaterFlux(curuv);\n\
\n\
    // calculate the new flux.\n\
    float pipeArea = cellSize_x * cellSize_y;\n\
    vec4 newFlux = u_timestep * pipeArea * waterAccel;\n\
\n\
    // total outFlux.\n\
    float cushionFactor = 0.9999; // esmorteiment.\n\
    float ftopout = max(0.0, curFlux.x + newFlux.x) * cushionFactor;\n\
    float frightout = max(0.0, curFlux.y + newFlux.y) * cushionFactor;\n\
    float fbottomout = max(0.0, curFlux.z + newFlux.z) * cushionFactor;\n\
    float fleftout = max(0.0, curFlux.w + newFlux.w) * cushionFactor;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // calculate vOut & currVolum.\n\
    float vOut = u_timestep * (ftopout + frightout + fbottomout + fleftout); \n\
\n\
    float currWaterVol = (curWH + curCH) * pipeArea;\n\
\n\
    if(vOut > currWaterVol)\n\
    {\n\
        //rescale outflow readFlux so that outflow don't exceed current water volume\n\
        float factor = (currWaterVol / vOut);\n\
        ftopout *= factor;\n\
        frightout *= factor;\n\
        fbottomout *= factor;\n\
        fleftout *= factor;\n\
    }\n\
\n\
    \n\
    /*\n\
    //boundary conditions\n\
    if(curuv.x <= div) fleftout = 0.0;\n\
    if(curuv.x >= 1.0 - 2.0 * div) frightout = 0.0;\n\
    if(curuv.y <= div) ftopout = 0.0;\n\
    if(curuv.y >= 1.0 - 2.0 * div) fbottomout = 0.0;\n\
\n\
    if(curuv.x <= div || (curuv.x >= 1.0 - 2.0 * div) || (curuv.y <= div) || (curuv.y >= 1.0 - 2.0 * div) ){\n\
        ftopout = 0.0;\n\
        frightout = 0.0;\n\
        fbottomout = 0.0;\n\
        fleftout = 0.0;\n\
    }\n\
    */\n\
\n\
    vec4 outFlux = vec4(ftopout, frightout, fbottomout, fleftout) / u_waterMaxFlux;\n\
    vec4 flux_high;\n\
    vec4 flux_low;\n\
    encodeWaterFlux(outFlux, flux_high, flux_low);\n\
\n\
    gl_FragData[0] = flux_high;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = flux_low; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateHeightContaminationFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D waterSourceTex;\n\
uniform sampler2D rainTex; // if exist.\n\
uniform sampler2D currWaterHeightTex;\n\
uniform sampler2D currContaminationHeightTex;\n\
uniform sampler2D contaminantSourceTex;\n\
\n\
uniform bool u_existRain;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
uniform float u_fluidMaxHeigh;\n\
uniform float u_fluidHeigh;\n\
uniform float u_timestep;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec4 vColor4;\n\
\n\
vec4 packDepth( float v ) {\n\
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
    enc = fract(enc);\n\
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
    return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
/*\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(currWaterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
*/\n\
\n\
void main()\n\
{\n\
    float unitaryHeight = u_fluidHeigh / u_fluidMaxHeigh;\n\
    vec4 encodedHeight = packDepth(unitaryHeight);\n\
    gl_FragData[0] = encodedHeight;\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0, 0.0, 0.5, 1.0); // water source\n\
        gl_FragData[2] = vec4(1.0, 0.0, 0.5, 1.0); // normal\n\
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color\n\
    #endif\n\
}";
ShaderSource.waterCalculateHeightFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
\n\
uniform sampler2D waterSourceTex;\n\
uniform sampler2D rainTex; // if exist.\n\
uniform sampler2D currWaterHeightTex;\n\
uniform sampler2D currContaminationHeightTex;\n\
uniform sampler2D contaminantSourceTex;\n\
uniform sampler2D waterAditionTex;\n\
\n\
uniform bool u_existRain;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
vec4 packDepth( float v ) {\n\
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
    enc = fract(enc);\n\
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
    return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
/*\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(currWaterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
*/\n\
\n\
void main()\n\
{\n\
    // 1rst, take the water source.\n\
    vec4 currWaterHeight = texture2D(currWaterHeightTex, v_tex_pos);\n\
    vec4 waterSource = texture2D(waterSourceTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
    //vec4 waterSource = vec4(0.0, 0.0, 0.0, 0.01);\n\
\n\
    float decodedCurrWaterHeight = unpackDepth(currWaterHeight) * u_waterMaxHeigh;\n\
    float decodedSourceWaterHeight = unpackDepth(waterSource) * u_waterMaxHeigh;\n\
\n\
    float finalWaterHeight = decodedSourceWaterHeight; // init value.***\n\
    //finalWaterHeight = 0.0;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0, 0.0, 0.0, 1.0);\n\
\n\
    if(finalWaterHeight < 0.0)\n\
    {\n\
        shaderLogColor4 = vec4(1.0, 0.0, 1.0, 1.0);\n\
    }\n\
\n\
    if(finalWaterHeight < decodedCurrWaterHeight)\n\
    {\n\
        finalWaterHeight = decodedCurrWaterHeight;\n\
        shaderLogColor4 = vec4(1.0, 0.0, 0.0, 1.0);\n\
    }\n\
\n\
\n\
    // add rain.\n\
    \n\
    if(u_existRain)\n\
    {\n\
        vec4 rain = texture2D(rainTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
        float rainHeight = unpackDepth(rain) * u_waterMaxHeigh;\n\
        finalWaterHeight += rainHeight;\n\
    }\n\
\n\
    vec4 waterAdition = texture2D(waterAditionTex, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    float waterAditionHeight = unpackDepth(waterAdition) * u_waterMaxHeigh;\n\
    finalWaterHeight += waterAditionHeight;\n\
\n\
    if(finalWaterHeight > u_waterMaxHeigh)\n\
    {\n\
        shaderLogColor4 = vec4(0.0, 1.0, 0.5, 1.0);\n\
    }\n\
    \n\
\n\
    vec4 finalWaterHeight4 = packDepth(finalWaterHeight / u_waterMaxHeigh);\n\
\n\
    // Contamination Height.********************************************************************************\n\
    vec4 contaminSourceHeight = vec4(0.0);\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        // check if exist contaminant.\n\
        contaminSourceHeight = texture2D(contaminantSourceTex, v_tex_pos);\n\
        vec4 currContaminHeight = texture2D(currContaminationHeightTex, v_tex_pos);\n\
\n\
        float decodedSourceContaminHeight = unpackDepth(contaminSourceHeight);\n\
        float decodedCurrContaminHeight = unpackDepth(currContaminHeight);\n\
        if(decodedSourceContaminHeight < decodedCurrContaminHeight)\n\
        {\n\
            contaminSourceHeight = currContaminHeight;\n\
        }\n\
    }\n\
\n\
    \n\
    gl_FragData[0] = finalWaterHeight4;  // waterHeight.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = contaminSourceHeight; // contamination\n\
        gl_FragData[2] = shaderLogColor4; // normal\n\
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color\n\
    #endif\n\
}";
ShaderSource.waterCalculateSedimentFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D currWaterFluxTex;\n\
uniform sampler2D sedimentHeightTex;\n\
\n\
varying vec2 v_tex_pos; // texCoords.\n\
#define PI 3.1415926\n\
\n\
uniform float u_SimRes;\n\
uniform float u_PipeLen;\n\
uniform float u_Ks;\n\
uniform float u_Kc;\n\
uniform float u_Kd;\n\
uniform float u_timestep;\n\
\n\
uniform float u_PipeArea;\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_waterMaxHeigh;\n\
\n\
/*\n\
vec3 calnor(vec2 uv){\n\
  float eps = 1.f/u_SimRes;\n\
  vec4 cur = texture(readTerrain,uv);\n\
  vec4 r = texture(readTerrain,uv+vec2(eps,0.f));\n\
  vec4 t = texture(readTerrain,uv+vec2(0.f,eps));\n\
  vec4 b = texture(readTerrain,uv+vec2(0.f,-eps));\n\
  vec4 l = texture(readTerrain,uv+vec2(-eps,0.f));\n\
\n\
  vec3 nor = vec3(l.x - r.x, 2.0, t.x - b.x);\n\
  nor = normalize(nor);\n\
  return nor;\n\
}\n\
*/\n\
\n\
void main()\n\
{\n\
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);\n\
    curuv = v_tex_pos;\n\
\n\
\n\
\n\
    gl_FragData[0] = vec4(0.0);  // water flux.\n\
\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(0.0); // velocity\n\
        gl_FragData[2] = vec4(0.0); // \n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateTerrainFluxFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D terrainMaxSlippageTex;\n\
\n\
varying vec2 v_tex_pos;\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform float u_terrainMaxFlux;\n\
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.\n\
uniform float u_contaminantMaxHeigh; // if \"u_contaminantMaxHeigh\" < 0.0 -> no exist contaminant.\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
float getMaxSlippage(in vec2 texCoord)\n\
{\n\
    // Note : for maxSlippage use \"u_heightMap_MinMax.y\" as quantizer.\n\
    vec4 encoded = texture2D(terrainMaxSlippageTex, texCoord);\n\
    float decoded = unpackDepth(encoded);\n\
    decoded = decoded * u_heightMap_MinMax.y;\n\
    return decoded;\n\
}\n\
\n\
void encodeFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // Terrain heights.**************************************************************************************************\n\
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));\n\
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));\n\
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));\n\
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));\n\
    float curTH = getTerrainHeight(curuv);\n\
    // End terrain heights.-----------------------------------------------------------------------------------------------\n\
\n\
    // MaxSlippges.******************************************************************************************************\n\
    float topSlip = getMaxSlippage(curuv + vec2(0.0, divY));\n\
    float rightSlip = getMaxSlippage(curuv + vec2(divX, 0.0));\n\
    float bottomSlip = getMaxSlippage(curuv + vec2(0.0, -divY));\n\
    float leftSlip = getMaxSlippage(curuv + vec2(-divX, 0.0));\n\
    float curSlip = getMaxSlippage(curuv);\n\
    // End max slippages.-------------------------------------------------------------------------------------------------\n\
\n\
\n\
    vec4 diff;\n\
    diff.x = curTH - topTH - (curSlip + topSlip) * 0.5;\n\
    diff.y = curTH - rightTH - (curSlip + rightSlip) * 0.5;\n\
    diff.z = curTH - bottomTH - (curSlip + bottomSlip) * 0.5;\n\
    diff.w = curTH - leftTH - (curSlip + leftSlip) * 0.5;\n\
\n\
    diff = max(vec4(0.0), diff);\n\
\n\
    //vec4 newFlow = diff * 0.2;\n\
    vec4 newFlow = diff;\n\
\n\
    float outfactor = (newFlow.x + newFlow.y + newFlow.z + newFlow.w)*u_timestep;\n\
\n\
    if(outfactor > 1e-5){\n\
        outfactor = curTH / outfactor;\n\
        if(outfactor > 1.0) outfactor = 1.0;\n\
        newFlow = newFlow * outfactor;\n\
    \n\
        shaderLogFluxColor4 = vec4(1.0, 0.5, 0.25, 1.0);\n\
    }\n\
\n\
    /*\n\
    if(outfactor > curTH){\n\
        float factor = (curTH / outfactor);\n\
        newFlow *= factor;\n\
        shaderLogFluxColor4 = vec4(1.0, 0.5, 0.25, 1.0);\n\
    }\n\
    */\n\
    \n\
\n\
    /*\n\
    if(vOut > currWaterVol)\n\
    {\n\
        //rescale outflow readFlux so that outflow don't exceed current water volume\n\
        float factor = (currWaterVol / vOut);\n\
        ftopout *= factor;\n\
        frightout *= factor;\n\
        fbottomout *= factor;\n\
        fleftout *= factor;\n\
    }\n\
\n\
    \n\
    /*\n\
    //boundary conditions\n\
    if(curuv.x <= div) fleftout = 0.0;\n\
    if(curuv.x >= 1.0 - 2.0 * div) frightout = 0.0;\n\
    if(curuv.y <= div) ftopout = 0.0;\n\
    if(curuv.y >= 1.0 - 2.0 * div) fbottomout = 0.0;\n\
\n\
    if(curuv.x <= div || (curuv.x >= 1.0 - 2.0 * div) || (curuv.y <= div) || (curuv.y >= 1.0 - 2.0 * div) ){\n\
        ftopout = 0.0;\n\
        frightout = 0.0;\n\
        fbottomout = 0.0;\n\
        fleftout = 0.0;\n\
    }\n\
    */\n\
\n\
    vec4 outFlux = newFlow / u_terrainMaxFlux;\n\
    vec4 flux_high;\n\
    vec4 flux_low;\n\
    encodeFlux(outFlux, flux_high, flux_low);\n\
\n\
    shaderLogFluxColor4 = outFlux;\n\
\n\
    gl_FragData[0] = flux_high;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = flux_low; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateTerrainHeightByFluxFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D terrainFluxTex_HIGH;\n\
uniform sampler2D terrainFluxTex_LOW;\n\
\n\
varying vec2 v_tex_pos;\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.\n\
uniform float u_terrainMaxFlux;\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
vec4 getTerrainFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(terrainFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(terrainFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_terrainMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // Terrain height.\n\
    float curTH = getTerrainHeight(curuv);\n\
\n\
    // Terrain fluxes.\n\
    vec4 topFlux = getTerrainFlux(curuv + vec2(0.0, divY));\n\
    vec4 rightFlux = getTerrainFlux(curuv + vec2(divX, 0.0));\n\
    vec4 bottomFlux = getTerrainFlux(curuv + vec2(0.0, -divY));\n\
    vec4 leftFlux = getTerrainFlux(curuv + vec2(-divX, 0.0));\n\
\n\
    vec4 outFlux = getTerrainFlux(curuv);\n\
    vec4 inputFlux = vec4(topFlux.z, rightFlux.w, bottomFlux.x, leftFlux.y);\n\
\n\
    float vol = inputFlux.x + inputFlux.y + inputFlux.z + inputFlux.w - outFlux.x - outFlux.y - outFlux.z - outFlux.w;\n\
\n\
    float thermalErosionScale = 2.6;\n\
    thermalErosionScale = 1.0;\n\
    //float tdelta = min(10.0, u_timestep * thermalErosionScale) * vol; // original.\n\
    float tdelta = (u_timestep * thermalErosionScale) * vol;\n\
    float newTerrainHeight = curTH + tdelta;\n\
    newTerrainHeight = (newTerrainHeight - u_heightMap_MinMax.x) / (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    vec4 newTH4 = vec4(newTerrainHeight, newTerrainHeight, newTerrainHeight, 1.0);\n\
\n\
    shaderLogFluxColor4 = outFlux;\n\
\n\
    gl_FragData[0] = newTH4;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = shaderLogFluxColor4; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateTerrainMaxSlippageFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D terrainHeightTex;\n\
\n\
varying vec2 v_tex_pos;\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.\n\
\n\
uniform vec2 u_simulationTextureSize;\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = v_tex_pos;\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    //float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    //float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.\n\
\n\
    // Terrain heights.**************************************************************************************************\n\
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));\n\
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));\n\
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));\n\
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));\n\
    float curTH = getTerrainHeight(curuv);\n\
    // End terrain heights.-----------------------------------------------------------------------------------------------\n\
\n\
    // Calculate maxSlippge.***\n\
    float _maxHeightDiff = 3.0;\n\
    //float maxLocalDiff = _maxHeightDiff * 0.01; // original.**\n\
    float maxLocalDiff = _maxHeightDiff * 0.01;\n\
    float avgDiff = (topTH + rightTH + bottomTH + leftTH) * 0.25 - curTH;\n\
    //avgDiff = 10.0 * max(abs(avgDiff) - maxLocalDiff, 0.0); // original.\n\
    avgDiff = 1.0 * max(abs(avgDiff) - maxLocalDiff, 0.0);\n\
\n\
    float maxSlippage = max(_maxHeightDiff - avgDiff, 0.0);\n\
\n\
    // now, encode the maxSlippage value.\n\
    // Note : for maxSlippage use \"u_heightMap_MinMax.y\" as quantizer.\n\
    maxSlippage = maxSlippage / u_heightMap_MinMax.y;\n\
    //maxSlippage *= 100.0; // test.\n\
    //maxSlippage *= 10.0; // test.\n\
    shaderLogFluxColor4 = vec4(maxSlippage, 0.0, 0.0, 1.0);\n\
\n\
\n\
    vec4 maxslippage4 = packDepth(maxSlippage);\n\
    //vec4 maxslippage4 = vec4(maxSlippage, 0.0, 0.0, 1.0); // test.***\n\
\n\
    gl_FragData[0] = maxslippage4;  // water flux high.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = shaderLogFluxColor4; // water flux low.\n\
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.\n\
        gl_FragData[3] = shaderLogFluxColor4; // albedo\n\
        gl_FragData[4] = shaderLogFluxColor4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterCalculateVelocityFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainHeightTex;\n\
uniform sampler2D currWaterFluxTex_HIGH;\n\
uniform sampler2D currWaterFluxTex_LOW;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
varying vec2 v_tex_pos; // texCoords.\n\
#define PI 3.1415926\n\
\n\
uniform float u_timestep;\n\
\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_heightMap_MinMax; // terrain min max heights. no used.\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_waterMaxFlux;\n\
uniform float u_waterMaxVelocity;\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_terrainTextureSize;\n\
\n\
vec2 encodeVelocity(in vec2 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
vec4 getWaterFlux(in vec2 texCoord)\n\
{\n\
    vec4 color4_HIGH = texture2D(currWaterFluxTex_HIGH, texCoord);\n\
    vec4 color4_LOW = texture2D(currWaterFluxTex_LOW, texCoord);\n\
\n\
    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));\n\
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));\n\
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));\n\
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));\n\
\n\
    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_waterMaxFlux;\n\
    return flux; \n\
}\n\
\n\
void encodeWaterFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)\n\
{\n\
    vec2 encoded_top_flux = encodeRG(flux.r);\n\
    vec2 encoded_right_flux = encodeRG(flux.g);\n\
    vec2 encoded_bottom_flux = encodeRG(flux.b);\n\
    vec2 encoded_left_flux = encodeRG(flux.a);\n\
\n\
    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);\n\
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);\n\
}\n\
\n\
void main()\n\
{\n\
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);\n\
    curuv = v_tex_pos;\n\
\n\
    float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
\n\
    float cellArea = cellSize_x * cellSize_y;\n\
    float timeStep_divCellArea = u_timestep / cellArea;;\n\
\n\
    vec4 topflux = getWaterFlux(curuv + vec2(0.0, divY));\n\
    vec4 rightflux = getWaterFlux(curuv + vec2(divX, 0.0));\n\
    vec4 bottomflux = getWaterFlux(curuv + vec2(0.0, -divY));\n\
    vec4 leftflux = getWaterFlux(curuv + vec2(-divX, 0.0));\n\
    vec4 curflux = getWaterFlux(curuv);\n\
\n\
    //out flow flux\n\
    float ftopout = curflux.x;\n\
    float frightout = curflux.y;\n\
    float fbottomout = curflux.z;\n\
    float fleftout = curflux.w;\n\
\n\
    vec4 outputflux = curflux;\n\
    vec4 inputflux = vec4(topflux.z, rightflux.w, bottomflux.x, leftflux.y);\n\
\n\
    // Now, calculate the contamination trasference.**************************************************\n\
    // read water heights.\n\
    float topWH = getWaterHeight(curuv + vec2(0.0, divY));\n\
    float rightWH = getWaterHeight(curuv + vec2(divX, 0.0));\n\
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -divY));\n\
    float leftWH = getWaterHeight(curuv + vec2(-divX, 0.0));\n\
    float curWH = getWaterHeight(curuv);\n\
\n\
    float topCH = 0.0;\n\
    float rightCH = 0.0;\n\
    float bottomCH = 0.0;\n\
    float leftCH = 0.0;\n\
    float curCH = 0.0;\n\
\n\
    // Check if exist contaminant.\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        // exist contaminant.\n\
        topCH = getContaminantHeight(curuv + vec2(0.0, divY));\n\
        rightCH = getContaminantHeight(curuv + vec2(divX, 0.0));\n\
        bottomCH = getContaminantHeight(curuv + vec2(0.0, -divY));\n\
        leftCH = getContaminantHeight(curuv + vec2(-divX, 0.0));\n\
        curCH = getContaminantHeight(curuv);\n\
    }\n\
\n\
    // calculate contaminat ratio.\n\
    float topContaminPerUnit = topCH / (topCH + topWH);\n\
    float rightContaminPerUnit = rightCH / (rightCH + rightWH);\n\
    float bottomContaminPerUnit = bottomCH / (bottomCH + bottomWH);\n\
    float leftContaminPerUnit = leftCH / (leftCH + leftWH);\n\
\n\
    // calculate input waterHeight & contaminHeight.\n\
    float inputTopTotalH = inputflux.x * timeStep_divCellArea;\n\
    float inputRightTotalH = inputflux.y * timeStep_divCellArea;\n\
    float inputBottomTotalH = inputflux.z * timeStep_divCellArea;\n\
    float inputLeftTotalH = inputflux.w * timeStep_divCellArea;\n\
\n\
    float inputTopCH = inputTopTotalH * topContaminPerUnit;\n\
    float inputRightCH = inputRightTotalH * rightContaminPerUnit;\n\
    float inputBottomCH = inputBottomTotalH * bottomContaminPerUnit;\n\
    float inputLeftCH = inputLeftTotalH * leftContaminPerUnit;\n\
\n\
    float inputTopWH = inputTopTotalH - inputTopCH;\n\
    float inputRightWH = inputRightTotalH - inputRightCH;\n\
    float inputBottomWH = inputBottomTotalH - inputBottomCH;\n\
    float inputLeftWH = inputLeftTotalH - inputLeftCH;\n\
\n\
    // Now, calculate outputs.\n\
    float currContaminPerUnit = curCH / (curCH + curWH);\n\
    float outputTotalH = (ftopout + frightout + fbottomout + fleftout) * timeStep_divCellArea;\n\
    float outputCH = outputTotalH * currContaminPerUnit;\n\
    float outputWH = outputTotalH - outputCH;\n\
\n\
    // Now, calculate delt-water-H & delta-contaminant-H.\n\
    float deltaWH = inputTopWH + inputRightWH + inputBottomWH + inputLeftWH - outputWH;\n\
    float deltaCH = inputTopCH + inputRightCH + inputBottomCH + inputLeftCH - outputCH;\n\
    float deltaH = deltaWH + deltaCH;\n\
    //------------------------------------------------------------------------------------------------\n\
\n\
    //vec4 curT = texture2D(terrainHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    //curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;\n\
\n\
    float fout = ftopout + frightout + fbottomout + fleftout;\n\
    float fin = inputflux.x + inputflux.y + inputflux.z + inputflux.w;\n\
\n\
    //float deltaH = u_timestep * (fin - fout) / cellArea; \n\
    //---------------------------------------------------------------------------------\n\
\n\
    \n\
\n\
    //float d1 = cur.y + curs.x; // original. (waterH + sedimentH).\n\
    float d1 = curWH + curCH;\n\
    float d2 = d1 + deltaH;\n\
    float da = (d1 + d2)/2.0;\n\
\n\
    vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0);\n\
\n\
    if(da <= 1e-8) \n\
    {\n\
        veloci = vec2(0.0);\n\
    }\n\
    else\n\
    {\n\
        //veloci = veloci/(da * u_PipeLen);\n\
        veloci = veloci/(da * vec2(cellSize_y, cellSize_x));\n\
    }\n\
\n\
    if(curuv.x <= divX) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
    if(curuv.x >= 1.0 - 2.0 * divX) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
    if(curuv.y <= divY) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
    if(curuv.y >= 1.0 - 2.0 * divY) \n\
    { \n\
        deltaWH = 0.0; \n\
        deltaCH = 0.0; \n\
        veloci = vec2(0.0); \n\
    }\n\
\n\
    //  float absx = abs(veloci.x);\n\
    //  float absy = abs(veloci.y);\n\
    //  float maxxy = max(absx, absy);\n\
    //  float minxy = min(absx, absy);\n\
    //  float tantheta = minxy / maxxy;\n\
    //  float scale = cos(45.0 * PI / 180.0 - atan(tantheta));\n\
    //  float divtheta = (1.0/sqrt(2.0)) / scale;\n\
    //  float divs = min(abs(veloci.x), abs(veloci.y))/max(abs(veloci.x), abs(veloci.y));\n\
    //  if((divs) > 20.0){\n\
    //    veloci /= 20.0;\n\
    //  }\n\
\n\
    \n\
\n\
    vec2 encodedVelocity = encodeVelocity(veloci/u_waterMaxVelocity);\n\
    vec4 writeVel = vec4(encodedVelocity, 0.0, 1.0);\n\
    //vec4 writeWaterHeight = vec4(cur.x,max(cur.y+deltavol, 0.0),cur.z,cur.w); // original.***\n\
\n\
    // test debug:\n\
    //if(abs(veloci.x) > 40.0 || abs(veloci.y) > 40.0)\n\
    {\n\
        shaderLogColor4 = vec4(encodedVelocity, 0.0, 1.0);\n\
    }\n\
\n\
    float waterHeight = max(curWH + deltaWH, 0.0); // original.***\n\
    vec4 encodedWH = packDepth(waterHeight / u_waterMaxHeigh);\n\
    gl_FragData[0] = encodedWH;  // water height.\n\
\n\
    vec4 encodedCH = vec4(0.0);\n\
    if(u_contaminantMaxHeigh > 0.0)\n\
    {\n\
        float contaminantHeight = max(curCH + deltaCH, 0.0);\n\
        encodedCH = packDepth(contaminantHeight / u_contaminantMaxHeigh);\n\
    }\n\
\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = writeVel; // velocity\n\
        gl_FragData[2] = encodedCH; // contaminatHeight if exist.\n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
\n\
}";
ShaderSource.waterCopyFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texToCopy;\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 v_tex_pos;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
    }\n\
    else\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    }\n\
    \n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = finalCol4; // depth\n\
        gl_FragData[2] = finalCol4; // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = finalCol4; // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterDEMTexFromQuantizedMeshFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform vec2 u_minMaxHeights;\n\
uniform int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 u_oneColor4;\n\
\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); // original.***\n\
\n\
    if(colorType == 1)\n\
    {\n\
        //finalCol4 = vColor4;\n\
        finalCol4 = u_oneColor4;\n\
    }\n\
\n\
    //-------------------------------------------------------------------------------------------------------------\n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterDepthRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane\n\
\n\
//in vec3 fs_Pos;\n\
//in vec4 fs_Nor;\n\
//in vec4 fs_Col;\n\
\n\
uniform sampler2D hightmap;\n\
uniform sampler2D normap;\n\
uniform sampler2D sceneDepth;\n\
uniform sampler2D colorReflection;\n\
uniform sampler2D sedimap;\n\
\n\
//in float fs_Sine;\n\
//in vec2 fs_Uv;\n\
//layout (location = 0) out vec4 out_Col; // This is the final output color that you will see on your\n\
//layout (location = 1) out vec4 col_reflect;\n\
                  // screen for the pixel that is currently being processed.\n\
uniform vec3 u_Eye, u_Ref, u_Up;\n\
\n\
\n\
uniform int u_TerrainType;\n\
uniform float u_WaterTransparency;\n\
uniform float u_SimRes;\n\
uniform vec2 u_Dimensions;\n\
uniform vec3 unif_LightPos;\n\
uniform float u_far;\n\
uniform float u_near;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float depth;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
/*\n\
vec3 calnor(vec2 uv){\n\
    float eps = 1.0/u_SimRes;\n\
    vec4 cur = texture(hightmap,uv);\n\
    vec4 r = texture(hightmap,uv+vec2(eps,0.f));\n\
    vec4 t = texture(hightmap,uv+vec2(0.f,eps));\n\
\n\
    vec3 n1 = normalize(vec3(-1.0, cur.y + cur.x - r.y - r.x, 0.f));\n\
    vec3 n2 = normalize(vec3(-1.0, t.x + t.y - r.y - r.x, 1.0));\n\
\n\
    vec3 nor = -cross(n1,n2);\n\
    nor = normalize(nor);\n\
    return nor;\n\
}\n\
\n\
vec3 sky(in vec3 rd){\n\
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));\n\
}\n\
\n\
float linearDepth(float depthSample)\n\
{\n\
    depthSample = 2.0 * depthSample - 1.0;\n\
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));\n\
    return zLinear;\n\
}\n\
*/\n\
void main()\n\
{\n\
    if(vWaterHeight < 0.0001)\n\
    {\n\
        discard;\n\
    }\n\
\n\
    float depthAux = depth;\n\
\n\
    #ifdef USE_LOGARITHMIC_DEPTH\n\
	//if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		depthAux = gl_FragDepthEXT; \n\
	}\n\
	#endif\n\
\n\
    vec4 finalCol4 = vec4(vColorAuxTest);\n\
    \n\
    // save depth, normal, albedo.\n\
    vec4 encodedDepth = packDepth(depthAux); \n\
	gl_FragData[0] = encodedDepth; \n\
\n\
    //gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = encodedDepth; // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = vec4(1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
    /*\n\
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);\n\
    float terrainDepth = texture(sceneDepth,uv).x;\n\
    float sediment = texture(sedimap,fs_Uv).x;\n\
    float waterDepth = gl_FragCoord.z;\n\
\n\
    terrainDepth = linearDepth(terrainDepth);\n\
    waterDepth = linearDepth(waterDepth);\n\
\n\
    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);\n\
    dpVal = clamp(dpVal, 0.0,4.0);\n\
    //dpVal = pow(dpVal, 0.1);\n\
\n\
\n\
    float fbias = 0.2;\n\
    float fscale = 0.2;\n\
    float fpow = 22.0;\n\
    vec3 sundir = unif_LightPos;\n\
\n\
    sundir = normalize(sundir);\n\
\n\
    vec3 nor = -calnor(fs_Uv);\n\
    vec3 viewdir = normalize(u_Eye - fs_Pos);\n\
    vec3 lightdir = normalize(sundir);\n\
    vec3 halfway = normalize(lightdir + viewdir);\n\
    vec3 reflectedSky = sky(halfway);\n\
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);\n\
\n\
\n\
    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));\n\
\n\
    //lamb =1.f;\n\
\n\
    float yval = texture(hightmap,fs_Uv).x * 4.0;\n\
    float wval = texture(hightmap,fs_Uv).y;\n\
    wval /= 1.0;\n\
\n\
\n\
\n\
    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);\n\
    vec3 watercolorspec = vec3(1.0);\n\
    watercolorspec *= spec;\n\
\n\
\n\
\n\
    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);\n\
    col_reflect = vec4(1.0);\n\
    */\n\
}";
ShaderSource.waterDepthRenderVS = "\n\
//#version 300 es\n\
\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
    \n\
uniform mat4 u_Model;\n\
uniform mat4 u_ModelInvTr;\n\
uniform mat4 u_ViewProj;\n\
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane\n\
\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float depth;\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainmap, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * u_heightMap_MinMax.y;\n\
    return terainHeight;\n\
}\n\
\n\
void main()\n\
{\n\
	// read the altitude from hightmap.\n\
	float waterHeight = getWaterHeight(vec2(texCoord.x, texCoord.y));\n\
\n\
	float contaminantHeight = 0.0;\n\
	// check if exist contaminat.\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		contaminantHeight = getContaminantHeight(texCoord);\n\
	}\n\
\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	float height = terrainHeight + waterHeight + contaminantHeight;\n\
\n\
	vWaterHeight = waterHeight + contaminantHeight; // needed to discard if waterHeight is small.\n\
\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	// calculate the up direction:\n\
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);\n\
	vec3 upDir = normalize(posWC.xyz);\n\
\n\
	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * finalPos4;\n\
	depth = (-orthoPos.z)/(far); // the correct value.\n\
	\n\
}\n\
";
ShaderSource.WaterOrthogonalDepthShaderFS = "#ifdef GL_ES\n\
precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D currDEMTex;\n\
\n\
uniform vec2 u_heightMap_MinMax; // terrain min max heights. \n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_quantizedVolume_MinMax;\n\
\n\
//******************************************\n\
// u_processType = 0 -> overWriteDEM.\n\
// u_processType = 1 -> excavation.\n\
uniform int u_processType;\n\
//------------------------------------------\n\
\n\
\n\
varying float vDepth;\n\
varying float vAltitude;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(currDEMTex, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
void main()\n\
{     \n\
    vec2 screenPos = vec2(gl_FragCoord.x / u_simulationTextureSize.x, gl_FragCoord.y / u_simulationTextureSize.y);\n\
\n\
    // read the currentDEM depth.\n\
    float curTerrainHeght = texture2D(currDEMTex, screenPos).r;\n\
    float newTerrainHeght = ((vAltitude - u_heightMap_MinMax.x)/(u_heightMap_MinMax.y - u_heightMap_MinMax.x));\n\
\n\
    //******************************************\n\
    // u_processType = 0 -> overWriteDEM.\n\
    // u_processType = 1 -> excavation.\n\
    //------------------------------------------\n\
\n\
    if(u_processType == 0)\n\
    {\n\
        // if u_processType = 0 -> overWriteDEM.\n\
        if(newTerrainHeght < curTerrainHeght)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else if(u_processType == 1)\n\
    {\n\
        // if u_processType = 1 -> excavation.\n\
        // in this process, the meshses must be rendered in frontFace = CW.***\n\
        if(newTerrainHeght > curTerrainHeght)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    \n\
    vec4 depthColor4 = vec4(newTerrainHeght, newTerrainHeght, newTerrainHeght, 1.0);\n\
    gl_FragData[0] = depthColor4;\n\
\n\
    vec4 shaderLogColor4 = vec4(0.0);\n\
    if(vAltitude < u_heightMap_MinMax.x)\n\
    {\n\
        shaderLogColor4 = vec4(0.0, 1.0, 0.0, 1.0);\n\
    }\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = shaderLogColor4; // depth\n\
        gl_FragData[2] = shaderLogColor4; // normal\n\
        gl_FragData[3] = vec4(1.0); // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
}";
ShaderSource.WaterOrthogonalDepthShaderVS = "precision highp float;\n\
\n\
attribute vec3 position;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 buildingRotMatrix;  \n\
uniform mat4 RefTransfMatrix;\n\
uniform mat4 modelViewProjectionMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 aditionalPosition;\n\
uniform vec3 refTranslationVec;\n\
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
\n\
uniform vec4 u_color4;\n\
varying float vDepth;\n\
varying float vAltitude;\n\
varying vec4 vColor4;\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
\n\
float cbrt(in float val)\n\
{\n\
	if (val < 0.0) {\n\
 \n\
        return -pow(-val, 1.0 / 3.0);\n\
    }\n\
 \n\
    else {\n\
 \n\
        return pow(val, 1.0 / 3.0);\n\
    }\n\
}\n\
\n\
float atanHP_getConstant(in int j) \n\
{\n\
	float constant = 0.0;\n\
\n\
	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan\n\
	// The constants tan(j*PI/24), (j = 1, 2, • • • , 11) and PI/2 are:\n\
	// j = 1 -> tan(PI/24) =     0.13165 24975 87395 85347 2\n\
	// j = 2 -> tan(PI/12) =     0.26794 91924 31122 70647 3\n\
	// j = 3 -> tan(PI/8) =      0.41421 35623 73095 04880 2\n\
	// j = 4 -> tan(PI/6) =      0.57735 02691 89625 76450 9\n\
	// j = 5 -> tan(5*PI/24) =   0.76732 69879 78960 34292 3\n\
	// j = 6 -> tan(PI/4) =      1.00000 00000 00000 00000 0\n\
	// j = 7 -> tan(7*PI/24) =   1.30322 53728 41205 75586 8\n\
	// j = 8 -> tan(PI/3) =      1.73205 08075 68877 29352 7\n\
	// j = 9 -> tan(3*PI/8) =    2.41421 35623 73095 04880 2\n\
	// j = 10 -> tan(5*PI/12) =  3.73205 08075 68877 29352 7\n\
	// j = 11 -> tan(11*PI/24) = 7.59575 41127 25150 44052 6\n\
	// PI/2 =                    1.57079 63267 94896 61923 1\n\
\n\
	if(j == 1)\n\
	{\n\
		constant = 0.131652497587395853472;\n\
	}\n\
	else if(j == 2)\n\
	{\n\
		constant = 0.267949192431122706473;\n\
	}\n\
	else if(j == 3)\n\
	{\n\
		constant = 0.414213562373095048802;\n\
	}\n\
	else if(j == 4)\n\
	{\n\
		constant = 0.577350269189625764509;\n\
	}\n\
	else if(j == 5)\n\
	{\n\
		constant = 0.767326987978960342923;\n\
	}\n\
	else if(j == 6)\n\
	{\n\
		constant = 1.000000000000000000000;\n\
	}\n\
	else if(j == 7)\n\
	{\n\
		constant = 1.303225372841205755868;\n\
	}\n\
	else if(j == 8)\n\
	{\n\
		constant = 1.732050807568877293527;\n\
	}\n\
	else if(j == 9)\n\
	{\n\
		constant = 2.414213562373095048802;\n\
	}\n\
	else if(j == 10)\n\
	{\n\
		constant = 3.732050807568877293527;\n\
	}\n\
	else if(j == 11)\n\
	{\n\
		constant = 7.595754112725150440526;\n\
	}\n\
	else if(j == 12)\n\
	{\n\
		constant = 1.570796326794896619231;\n\
	}\n\
\n\
	return constant;\n\
}\n\
\n\
int atanHP_getInterval(in float x) \n\
{\n\
	// Subdivide the interval (0, infinite ) into seven intervals as follows:\n\
	// 0 <= u < tan(PI/24)\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(11PI/24) <= u < infinite.\n\
	//------------------------------------------------------------------------\n\
	float u = abs(x);\n\
	int interval = -1;\n\
\n\
	// check if is interval = 0.******************************************************************\n\
	// 0 <= u < tan(PI/24)\n\
	float tan_PIdiv24 = atanHP_getConstant(1);\n\
	if(u < tan_PIdiv24)\n\
	{\n\
		return 0;\n\
	}\n\
\n\
	// check if is interval = 1: (j = interval + 1), so j = 2.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(PI/24) <= u < tan(PI/8)\n\
	float min = atanHP_getConstant(1);\n\
	float max = atanHP_getConstant(3);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 1;\n\
	}\n\
	\n\
	// check if is interval = 2: (j = interval + 1), so j = 3.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(PI/8) <= u < tan(5*PI/24)\n\
	min = atanHP_getConstant(3);\n\
	max = atanHP_getConstant(5);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 2;\n\
	}\n\
\n\
	// check if is interval = 3: (j = interval + 1), so j = 4.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(5*PI/24) <= u < tan(7*PI/24)\n\
	min = atanHP_getConstant(5);\n\
	max = atanHP_getConstant(7);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 3;\n\
	}\n\
\n\
	// check if is interval = 4: (j = interval + 1), so j = 5.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(7*PI/24) <= u < tan(3*PI/8)\n\
	min = atanHP_getConstant(7);\n\
	max = atanHP_getConstant(9);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 4;\n\
	}\n\
\n\
	// check if is interval = 5: (j = interval + 1), so j = 6.***********************************\n\
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6\n\
	// tan(3*PI/8) <= u < tan(11*PI/24)\n\
	min = atanHP_getConstant(9);\n\
	max = atanHP_getConstant(11);\n\
	if(u >= min && u < max)\n\
	{\n\
		return 5;\n\
	}\n\
\n\
	// check if is interval = 6: (j = interval + 1), so j = 6.***********************************\n\
	// tan(11PI/24) <= u < infinite.\n\
	min = atanHP_getConstant(11);\n\
	if(u >= min)\n\
	{\n\
		return 6;\n\
	}\n\
\n\
\n\
	return interval;\n\
}\n\
\n\
float atanHP_polynomialApproximation(in float x) \n\
{\n\
	// P(x) = a1*x + a3*pow(x, 3) + ... + a17*pow(x, 17)\n\
	float result_atan = -1.0;\n\
\n\
	float a1 = 1.0;\n\
	float a3 = -0.333333333333333331607;\n\
	float a5 = 0.199999999999998244448;\n\
	float a7 = -0.142857142856331306529;\n\
	float a9 = 0.111111110907793967393;\n\
	float a11 = -0.0909090609633677637073;\n\
	float a13 = 0.0769204073249154081320;\n\
	float a15 = -0.0665248229413108277905;\n\
	float a17 = 0.0546721009395938806941;\n\
\n\
	result_atan = a1*x + a3*pow(x, 3.0) + a5*pow(x, 5.0) +  a7*pow(x, 7.0) +  a9*pow(x, 9.0) +  a11*pow(x, 11.0) +  a13*pow(x, 13.0) +  a15*pow(x, 15.0) +  a17*pow(x, 17.0);\n\
\n\
	return result_atan;\n\
}\n\
\n\
float atanHP(in float x) // atan High Precision.\n\
{\n\
	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan\n\
	//-----------------------------------------------------------------------------------------------\n\
\n\
	// Obtain the interval.\n\
	int interval = atanHP_getInterval(x);\n\
\n\
	if(interval == 0)\n\
	{\n\
		// use polynomial approximation.\n\
		return atanHP_polynomialApproximation(x);\n\
	}\n\
	else if(interval >= 1 && interval <6)\n\
	{\n\
		// use Arctan|x| = (j*PI/12) + Arctan(tj),\n\
		// where tj = A / B, where\n\
		// A = |x| - tan(j*PI/12)\n\
		// B = 1 + |x| * tan(j*PI/12).\n\
		float tan_jPIdiv12;\n\
		float j = float(interval);\n\
		if(interval == 1)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(2);\n\
		}\n\
		else if(interval == 2)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(4);\n\
		}\n\
		else if(interval == 3)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(6);\n\
		}\n\
		else if(interval == 4)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(8);\n\
		}\n\
		else if(interval == 5)\n\
		{\n\
			tan_jPIdiv12 = atanHP_getConstant(10);\n\
		}\n\
\n\
		float A = abs(x) - tan_jPIdiv12;\n\
		float B = 1.0 + abs(x) * tan_jPIdiv12;\n\
		float tj = A/B;\n\
		float arctan_tj = atanHP_polynomialApproximation(tj);\n\
		float arctan = (j*M_PI/12.0) + arctan_tj;\n\
		return arctan;\n\
	}\n\
	else\n\
	{\n\
		// the interval = 6 (the last interval).\n\
		// In this case,\n\
		// Arctan|x| = PI/2 - Arctan(1/|x|).\n\
		float pi_div2 = atanHP_getConstant(12);\n\
		float arctan = pi_div2 - atan(1.0/abs(x));\n\
		return arctan;\n\
	}\n\
\n\
	return -1.0;\n\
}\n\
\n\
float atan2(in float y, in float x) \n\
{\n\
	if (x > 0.0)\n\
	{\n\
		return atanHP(y/x);\n\
	}\n\
	else if (x < 0.0)\n\
	{\n\
		if (y >= 0.0)\n\
		{\n\
			return atanHP(y/x) + M_PI;\n\
		}\n\
		else \n\
		{\n\
			return atanHP(y/x) - M_PI;\n\
		}\n\
	}\n\
	else if (x == 0.0)\n\
	{\n\
		if (y>0.0)\n\
		{\n\
			return M_PI/2.0;\n\
		}\n\
		else if (y<0.0)\n\
		{\n\
			return -M_PI/2.0;\n\
		}\n\
		else \n\
		{\n\
			return 0.0; // return undefined.\n\
		}\n\
	}\n\
}\n\
\n\
vec3 CartesianToGeographicWgs84(vec3 posWC, inout float inoutAux)\n\
{\n\
	vec3 geoCoord;\n\
\n\
	// From WebWorldWind.\n\
	// According to H. Vermeille, \"An analytical method to transform geocentric into geodetic coordinates\"\n\
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf\n\
	// Journal of Geodesy, accepted 10/2010, not yet published\n\
	\n\
	\n\
	//// equatorialRadius = 6378137.0; // meters.\n\
	//// polarRadius = 6356752.3142; // meters.\n\
	//// firstEccentricitySquared = 6.69437999014E-3;\n\
	//// secondEccentricitySquared = 6.73949674228E-3;\n\
	//// degToRadFactor = Math.PI/180.0;\n\
	\n\
	float firstEccentricitySquared = 6.69437999014E-3;\n\
	float equatorialRadius = 6378137.0;\n\
\n\
	float X = posWC.x;\n\
	float Y = posWC.y;\n\
	float Z = posWC.z;\n\
\n\
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
	float atan_son;\n\
	float v;\n\
	float w;\n\
	float k;\n\
	float D;\n\
	float sqrtDDpZZ;\n\
	float e;\n\
	float lambda;\n\
	float s2;\n\
\n\
	\n\
\n\
	if (evoluteBorderTest > 0.0 || q != 0.0) \n\
	{\n\
		if (evoluteBorderTest > 0.0) \n\
		{\n\
			// Step 2: general case\n\
			rad1 = sqrt(evoluteBorderTest);\n\
			rad2 = sqrt(e4 * p * q);\n\
\n\
			// 10*e2 is my arbitrary decision of what Vermeille means by \"near... the cusps of the evolute\".\n\
			if (evoluteBorderTest > 10.0 * e2) \n\
			{\n\
				rad3 = cbrt((rad1 + rad2) * (rad1 + rad2));\n\
				u = r + 0.5 * rad3 + 2.0 * r * r / rad3;\n\
			}\n\
			else \n\
			{\n\
				u = r + 0.5 * cbrt((rad1 + rad2) * (rad1 + rad2))\n\
					+ 0.5 * cbrt((rad1 - rad2) * (rad1 - rad2));\n\
			}\n\
		}\n\
		else \n\
		{\n\
			// Step 3: near evolute\n\
			rad1 = sqrt(-evoluteBorderTest);\n\
			rad2 = sqrt(-8.0 * r * r * r);\n\
			rad3 = sqrt(e4 * p * q);\n\
			atan_son = 2.0 * atan2(rad3, rad1 + rad2) / 3.0;\n\
\n\
			u = -4.0 * r * sin(atan_son) * cos(M_PI / 6.0 + atan_son);\n\
		}\n\
\n\
		v = sqrt(u * u + e4 * q);\n\
		w = e2 * (u + v - q) / (2.0 * v);\n\
		k = (u + v) / (sqrt(w * w + u + v) + w);\n\
		D = k * sqrtXXpYY / (k + e2);\n\
		float D_scaled = D/10000.0;\n\
		float Z_scaled = Z/10000.0;\n\
		sqrtDDpZZ = sqrt(D_scaled * D_scaled + Z_scaled * Z_scaled) * 10000.0; // more precision.\n\
		//sqrtDDpZZ = sqrt(D * D + Z * Z);\n\
\n\
		h = (k + e2 - 1.0) * sqrtDDpZZ / k;\n\
		phi = 2.0 * atan2(Z, (sqrtDDpZZ + D));\n\
		\n\
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
	geoCoord = vec3(factor * lambda, factor * phi, h);\n\
\n\
	return geoCoord;\n\
}\n\
\n\
float rand(vec2 co){\n\
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n\
}\n\
\n\
bool aproxEqual(float valA, float valB, float error)\n\
{\n\
	bool areEquals = false;\n\
\n\
	if(abs(valA - valB) < error)\n\
	{\n\
		areEquals = true;\n\
	}\n\
	else{\n\
		areEquals = false;\n\
	}\n\
\n\
	return areEquals;\n\
}\n\
  \n\
void main()\n\
{	\n\
	// Function for overWrite waterSystem DEM texture.\n\
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
    vec3 highDifference = objPosHigh.xyz; // - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz; // - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0); // world position.\n\
\n\
	float inoutAux = 0.0;\n\
	vec3 geoCoord = CartesianToGeographicWgs84(pos4.xyz, inoutAux);\n\
\n\
	////gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	gl_Position = modelViewProjectionMatrix * vec4(geoCoord, 1.0);\n\
\n\
	vDepth = gl_Position.z * 0.5 + 0.5;\n\
	vAltitude = geoCoord.z;\n\
	vColor4 = u_color4; // used for \"waterCalculateHeightContaminationFS\".***\n\
\n\
}\n\
";
ShaderSource.waterParticlesRenderFS = "precision mediump float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
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
	vec2 pt = gl_PointCoord - vec2(0.5);\n\
	if(pt.x*pt.x+pt.y*pt.y > 0.25)\n\
	{\n\
		discard;\n\
	}\n\
	\n\
	vec2 windMapTexCoord = v_particle_pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, texture2D(u_wind, windMapTexCoord).rg);\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
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
	else\n\
	{\n\
		float intensity = speed_t*3.0;\n\
		if(intensity > 1.0)\n\
			intensity = 1.0;\n\
		gl_FragColor = vec4(intensity,intensity,intensity,1.0);\n\
	}\n\
}\n\
";
ShaderSource.waterParticlesRenderingFadeFS = "precision mediump float;\n\
\n\
uniform sampler2D u_screen;\n\
uniform float u_opacity;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    vec4 color = texture2D(u_screen, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    // a hack to guarantee opacity fade out even with a value close to 1.0\n\
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);\n\
}";
ShaderSource.waterParticlesRenderVS = "precision mediump float;\n\
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
    gl_PointSize = 1.5;\n\
    gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);\n\
}\n\
";
ShaderSource.waterQuadVertVS = "//precision mediump float;\n\
\n\
attribute vec2 a_pos;\n\
\n\
varying vec2 v_tex_pos;\n\
\n\
void main() {\n\
    v_tex_pos = a_pos;\n\
    gl_Position = vec4(-1.0 + 2.0 * a_pos, 0.0, 1.0);\n\
}";
ShaderSource.waterQuantizedMeshFS_3D_TEST = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform vec2 u_minMaxHeights;\n\
uniform int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
uniform vec4 u_oneColor4;\n\
\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); // original.***\n\
\n\
    if(colorType == 1)\n\
    {\n\
        //finalCol4 = vColor4;\n\
        finalCol4 = u_oneColor4;\n\
    }\n\
\n\
    finalCol4 = u_oneColor4; // original.***\n\
\n\
    //-------------------------------------------------------------------------------------------------------------\n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterQuantizedMeshVS = "//precision mediump float;\n\
\n\
attribute vec3 a_pos;\n\
attribute vec4 color4;\n\
\n\
uniform vec3 u_totalMinGeoCoord; // (lon, lat, alt).\n\
uniform vec3 u_totalMaxGeoCoord;\n\
uniform vec3 u_currentMinGeoCoord;\n\
uniform vec3 u_currentMaxGeoCoord;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
\n\
void main() {\n\
    // Note: the position attributte is initially (in javascript) unsignedInt16 (0 to 32,767) (quantizedMesh).\n\
    // So, when normalize the data it transforms to (0.0 to 0.5), so must multiply by 2.0.\n\
    vec3 pos = a_pos * 2.0; // quantizedMeshes uses the positive parts of the signed short, so must multiply by 2.\n\
    \n\
    // Now, use totalGeoExtent & currentGeoExtent to scale the mesh.\n\
    // Calculate longitude & latitude.\n\
    float lon = u_currentMinGeoCoord.x + pos.x * (u_currentMaxGeoCoord.x - u_currentMinGeoCoord.x);\n\
    float lat = u_currentMinGeoCoord.y + pos.y * (u_currentMaxGeoCoord.y - u_currentMinGeoCoord.y);\n\
    float alt = u_currentMinGeoCoord.z + pos.z * (u_currentMaxGeoCoord.z - u_currentMinGeoCoord.z);\n\
\n\
    // Now, calculate the coord on total geoExtent.\n\
    float s = (lon - u_totalMinGeoCoord.x) / (u_totalMaxGeoCoord.x - u_totalMinGeoCoord.x);\n\
    float t = (lat - u_totalMinGeoCoord.y) / (u_totalMaxGeoCoord.y - u_totalMinGeoCoord.y);\n\
    float u = (alt - u_totalMinGeoCoord.z) / (u_totalMaxGeoCoord.z - u_totalMinGeoCoord.z);\n\
\n\
    //pos = vec3(pos.x, 1.0 - pos.y, pos.z); // flip y coords. // original.***\n\
    pos = vec3(s, 1.0 - t, u); // flip y coords.\n\
    vPos = pos;\n\
    v_tex_pos = pos.xy;\n\
\n\
    gl_Position = vec4(-1.0 + 2.0 * pos, 1.0);\n\
\n\
    vColor4 = color4;\n\
}";
ShaderSource.waterQuantizedMeshVS_3D_TEST = "//precision mediump float;\n\
\n\
attribute vec3 a_pos;\n\
attribute vec4 color4;\n\
\n\
uniform mat4 buildingRotMatrix; \n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 RefTransfMatrix;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform vec3 aditionalPosition;\n\
	uniform vec3 refTranslationVec;\n\
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform vec3 u_minGeoCoord;\n\
uniform vec3 u_maxGeoCoord;\n\
\n\
uniform vec3 u_totalMinGeoCoord; // (lon, lat, alt).\n\
uniform vec3 u_totalMaxGeoCoord;\n\
uniform vec3 u_currentMinGeoCoord;\n\
uniform vec3 u_currentMaxGeoCoord;\n\
\n\
varying vec2 v_tex_pos;\n\
varying vec3 vPos;\n\
varying vec4 vColor4;\n\
\n\
/*\n\
vec3 geographicToCartesianWgs84 = function(longitude, latitude, altitude)\n\
{\n\
	// a = semi-major axis.\n\
	// e2 = firstEccentricitySquared.\n\
	// v = a / sqrt(1 - e2 * sin2(lat)).\n\
	// x = (v+h)*cos(lat)*cos(lon).\n\
	// y = (v+h)*cos(lat)*sin(lon).\n\
	// z = [v*(1-e2)+h]*sin(lat).\n\
	var degToRadFactor = Math.PI/180.0;\n\
	var equatorialRadius = 6378137.0;\n\
	var firstEccentricitySquared = 6.69437999014E-3;\n\
	var lonRad = longitude * degToRadFactor;\n\
	var latRad = latitude * degToRadFactor;\n\
	var cosLon = Math.cos(lonRad);\n\
	var cosLat = Math.cos(latRad);\n\
	var sinLon = Math.sin(lonRad);\n\
	var sinLat = Math.sin(latRad);\n\
	var a = equatorialRadius;\n\
	var e2 = firstEccentricitySquared;\n\
	var v = a/Math.sqrt(1.0 - e2 * sinLat * sinLat);\n\
	var h = altitude;\n\
	\n\
	if (resultCartesian === undefined)\n\
	{ resultCartesian = []; }\n\
	\n\
	resultCartesian[0]=(v+h)*cosLat*cosLon;\n\
	resultCartesian[1]=(v+h)*cosLat*sinLon;\n\
	resultCartesian[2]=(v*(1.0-e2)+h)*sinLat;\n\
	\n\
	return resultCartesian;\n\
};\n\
*/\n\
\n\
void main() {\n\
    // Note: the position attributte is initially (in javascript) unsignedInt16 (0 to 32,767) (quantizedMesh).\n\
    // So, when normalize the data it transforms to (0.0 to 0.5), so must multiply by 2.0.\n\
    vec3 pos = a_pos * 2.0; // quantizedMeshes uses the positive parts of the signed short, so must multiply by 2.\n\
    \n\
	pos = vec3(pos.xy * 2000.0, pos.z * 500.0 + 500.0);\n\
    //----------------------------------------------------------------------------------------------------\n\
	vec4 rotatedPos = buildingRotMatrix * vec4(pos.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    //vec3 rotatedNormal = currentTMat * normal;\n\
\n\
    //vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***\n\
    //vTexCoord = texCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
\n\
    vColor4 = color4;\n\
}";
ShaderSource.waterRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D depthTex;\n\
uniform sampler2D waterTex;\n\
uniform sampler2D particlesTex;\n\
\n\
// Textures.********************************\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
\n\
\n\
uniform vec2 u_screenSize;\n\
uniform float near;\n\
uniform float far;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
uniform mat4 projectionMatrixInv;\n\
uniform bool bUseLogarithmicDepth;\n\
uniform int uWaterType; // 0= nothing, 1= flux, 2= velocity\n\
uniform int u_RenderParticles; \n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
uniform int u_TerrainType;\n\
uniform float u_WaterTransparency;\n\
uniform float u_SimRes;\n\
uniform vec2 u_Dimensions;\n\
uniform vec3 unif_LightPos;\n\
uniform float u_far;\n\
uniform float u_near;\n\
\n\
uniform float u_contaminantMaxHeigh;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float vContaminantHeight;\n\
varying float vExistContaminant;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying vec3 vOrthoPos;\n\
varying vec2 vTexCoord;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/u_screenSize.x;\n\
    float pixelSizeY = 1.0/u_screenSize.y;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
}\n\
\n\
vec3 getRainbowColor_byHeight(float height, in float maxi, in float mini)\n\
{\n\
	float gray = (height - mini)/(maxi - mini);\n\
	if (gray > 1.0){ gray = 1.0; }\n\
	else if (gray<0.0){ gray = 0.0; }\n\
	\n\
	float r, g, b;\n\
\n\
    b= 0.0;\n\
    r = min(gray * 2.0, 1.0);\n\
    g = min(2.0 - gray * 2.0, 1.0);\n\
\n\
	vec3 resultColor = vec3(r, g, b);\n\
    return resultColor;\n\
} \n\
\n\
\n\
\n\
void main()\n\
{\n\
    float minWaterHeightToRender = 0.001; // 1mm.\n\
    minWaterHeightToRender = 0.01; // test. delete.\n\
    if(vWaterHeight + vContaminantHeight < minWaterHeightToRender)// original = 0.0001\n\
    {\n\
        discard;\n\
    }\n\
\n\
    float alpha = vColorAuxTest.a;\n\
    vec4 finalCol4 = vec4(vColorAuxTest);\n\
    if(vWaterHeight + vContaminantHeight < minWaterHeightToRender)// + 0.01)\n\
    {\n\
        alpha = 0.9;\n\
        finalCol4 = vec4(vColorAuxTest * 0.4);\n\
    }\n\
\n\
    // calculate contaminationConcentration;\n\
    float contaminConcentration = vContaminantHeight / (vWaterHeight + vContaminantHeight);\n\
\n\
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y);\n\
\n\
    \n\
    float dotProd = dot(vViewRay, vNormal);\n\
    //finalCol4 = vec4(finalCol4.xyz * dotProd, alpha);\n\
    bool isParticle = false;\n\
\n\
    if(uWaterType == 1)\n\
    {\n\
        alpha = 1.0;\n\
\n\
        // flux case:\n\
        vec4 flux = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));\n\
        float fluxLength = length(flux)/sqrt(4.0);\n\
        float value = fluxLength;\n\
        finalCol4 = vec4(value, value, value, alpha);\n\
        \n\
    }\n\
    else if(uWaterType == 2)\n\
    {\n\
        alpha = 1.0;\n\
\n\
        // velocity case: now, decode velocity:\n\
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));\n\
        vec2 decodedVelocity = decodeVelocity(velocity4.xy);\n\
        float velocity = length(decodedVelocity.xy)/sqrt(2.0);\n\
        float value = velocity;\n\
        finalCol4 = vec4(value, value, value, alpha);\n\
\n\
    }\n\
    else if(uWaterType == 3)\n\
    {\n\
        // particles case: now, decode velocity:\n\
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));\n\
        finalCol4 = mix(vColorAuxTest, velocity4, velocity4.a);\n\
        if(alpha < velocity4.a)\n\
        {\n\
            alpha = velocity4.a;\n\
            isParticle = true;\n\
        }\n\
    }\n\
\n\
    if(vExistContaminant > 0.0 && vContaminantHeight > 0.001)\n\
    {\n\
        float factor = min(contaminConcentration + 0.6, 1.0);\n\
        \n\
        vec4 contaminCol4 = finalCol4;\n\
\n\
        if(!isParticle)\n\
        {\n\
            float maxConc = 0.001;\n\
            float minConc = 0.0;\n\
            contaminCol4 = vec4(getRainbowColor_byHeight(contaminConcentration, maxConc, minConc), 1.0);\n\
            factor = (contaminConcentration - minConc)/(maxConc - minConc);\n\
        }\n\
        finalCol4 = mix(finalCol4, contaminCol4, factor);\n\
    }\n\
\n\
    finalCol4 = vec4(finalCol4.xyz * dotProd, alpha);\n\
\n\
    //*************************************************************************************************************\n\
    // Do specular lighting.***\n\
	float lambertian = 1.0;\n\
	float specular = 0.0;\n\
    float shininessValue = 200.0;\n\
	//if(applySpecLighting> 0.0)\n\
	//{\n\
		vec3 L;\n\
        vec3 lightPos = vec3(0.0, 1.0, -1.0)*length(vOrthoPos);\n\
        L = normalize(lightPos - vOrthoPos);\n\
        lambertian = max(dot(vNormal, L), 0.0);\n\
		\n\
		specular = 0.0;\n\
		//if(lambertian > 0.0)\n\
		{\n\
			vec3 R = reflect(-L, vNormal);      // Reflected light vector\n\
			vec3 V = normalize(-vOrthoPos); // Vector to viewer\n\
			\n\
			// Compute the specular term\n\
			float specAngle = max(dot(R, V), 0.0);\n\
			specular = pow(specAngle, shininessValue);\n\
			\n\
			if(specular > 1.0)\n\
			{\n\
				//specular = 1.0;\n\
			}\n\
		}\n\
		\n\
		if(lambertian < 0.9)\n\
		{\n\
			lambertian = 0.9;\n\
		}\n\
\n\
	//}\n\
    vec3 specCol = finalCol4.xyz * 3.0;\n\
    specCol = vec3(0.5, 1.0, 1.0);\n\
    //finalCol4 = vec4((finalCol4.xyz * lambertian + specCol * specular), alpha);\n\
    //*************************************************************************************************************\n\
    vec3 lightdir = normalize(lightPos - vOrthoPos);\n\
    vec3 halfway = normalize(lightdir + vViewRay);\n\
    float spec = pow(max(dot(vNormal, halfway), 0.0), 333.0);\n\
    finalCol4 = vec4((finalCol4.xyz * lambertian + specCol * spec), alpha);\n\
\n\
    //finalCol4 = vec4(0.0, 0.0, 0.0, 1.0); // test debug.\n\
\n\
    //-------------------------------------------------------------------------------------------------------------\n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
    /*\n\
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);\n\
    float terrainDepth = texture(sceneDepth,uv).x;\n\
    float sediment = texture(sedimap,fs_Uv).x;\n\
    float waterDepth = gl_FragCoord.z;\n\
\n\
    terrainDepth = linearDepth(terrainDepth);\n\
    waterDepth = linearDepth(waterDepth);\n\
\n\
    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);\n\
    dpVal = clamp(dpVal, 0.0,4.0);\n\
    //dpVal = pow(dpVal, 0.1);\n\
\n\
\n\
    float fbias = 0.2;\n\
    float fscale = 0.2;\n\
    float fpow = 22.0;\n\
    vec3 sundir = unif_LightPos;\n\
\n\
    sundir = normalize(sundir);\n\
\n\
    vec3 nor = -calnor(fs_Uv);\n\
    vec3 viewdir = normalize(u_Eye - fs_Pos);\n\
    vec3 lightdir = normalize(sundir);\n\
    vec3 halfway = normalize(lightdir + viewdir);\n\
    vec3 reflectedSky = sky(halfway);\n\
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);\n\
\n\
\n\
    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));\n\
\n\
    //lamb =1.f;\n\
\n\
    float yval = texture(waterHeightTex,fs_Uv).x * 4.0;\n\
    float wval = texture(waterHeightTex,fs_Uv).y;\n\
    wval /= 1.0;\n\
\n\
    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);\n\
    vec3 watercolorspec = vec3(1.0);\n\
    watercolorspec *= spec;\n\
\n\
    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);\n\
    col_reflect = vec4(1.0);\n\
    */\n\
}";
ShaderSource.waterRenderVS = "\n\
//#version 300 es\n\
\n\
	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	attribute vec4 color4;\n\
	\n\
	uniform mat4 buildingRotMatrix; // use this matrix to calculate normals from highMaps.***\n\
	uniform mat4 modelViewMatrixRelToEye; \n\
	uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
	uniform mat4 normalMatrix4;\n\
	uniform vec3 buildingPosHIGH;\n\
	uniform vec3 buildingPosLOW;\n\
	uniform float near;\n\
	uniform float far;\n\
	uniform vec3 scaleLC;\n\
	uniform vec3 encodedCameraPositionMCHigh;\n\
	uniform vec3 encodedCameraPositionMCLow;\n\
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
	\n\
	uniform bool bUseLogarithmicDepth;\n\
	uniform float uFCoef_logDepth;\n\
    \n\
uniform vec2 u_screenSize;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
uniform mat4 projectionMatrixInv;\n\
\n\
// Textures.********************************\n\
uniform sampler2D waterHeightTex;\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D contaminantHeightTex;\n\
\n\
uniform vec2 u_heightMap_MinMax; // terrain.\n\
uniform float u_waterMaxHeigh;\n\
uniform float u_contaminantMaxHeigh;\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_terrainTextureSize; // for example 512 x 512.\n\
\n\
uniform sampler2D depthTex;\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying float vWaterHeight;\n\
varying float vContaminantHeight;\n\
varying float vExistContaminant;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying vec3 vOrthoPos;\n\
varying vec2 vTexCoord;\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
}\n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
float decodeRG(in vec2 waterColorRG)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));\n\
}\n\
\n\
vec2 encodeRG(in float wh)\n\
{\n\
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0\n\
    float encodedBit = 1.0/255.0;\n\
    vec2 enc = vec2(1.0, 255.0) * wh;\n\
    enc = fract(enc);\n\
    enc.x -= enc.y * encodedBit;\n\
    return enc; // R = HIGH, G = LOW.***\n\
}\n\
\n\
float getWaterHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(waterHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // old.\n\
    float decoded = unpackDepth(color4);\n\
    float waterHeight = decoded * u_waterMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getContaminantHeight(in vec2 texCoord)\n\
{\n\
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);\n\
    //float decoded = decodeRG(color4.rg); // 16bit.\n\
    float decoded = unpackDepth(color4); // 32bit.\n\
    float waterHeight = decoded * u_contaminantMaxHeigh;\n\
    return waterHeight;\n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainmap, texCoord).r;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
/*\n\
vec3 calnor(vec2 uv){\n\
    float eps = 1.0/u_SimRes;\n\
    vec4 cur = texture(waterHeightTex,uv);\n\
    vec4 r = texture(waterHeightTex,uv+vec2(eps,0.f));\n\
    vec4 t = texture(waterHeightTex,uv+vec2(0.f,eps));\n\
\n\
    vec3 n1 = normalize(vec3(-1.0, cur.y + cur.x - r.y - r.x, 0.f));\n\
    vec3 n2 = normalize(vec3(-1.0, t.x + t.y - r.y - r.x, 1.0));\n\
\n\
    vec3 nor = -cross(n1,n2);\n\
    nor = normalize(nor);\n\
    return nor;\n\
}\n\
\n\
vec3 sky(in vec3 rd){\n\
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));\n\
}\n\
\n\
float linearDepth(float depthSample)\n\
{\n\
    depthSample = 2.0 * depthSample - 1.0;\n\
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));\n\
    return zLinear;\n\
}\n\
*/\n\
\n\
float getTotalHeight(in vec2 texCoord)\n\
{\n\
	float waterHeight = getWaterHeight(texCoord);\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	float contaminHeight = 0.0;\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		contaminHeight = getContaminantHeight(texCoord);\n\
	}\n\
\n\
	float totalHeight = waterHeight + terrainHeight + contaminHeight;\n\
	return totalHeight;\n\
}\n\
\n\
float getLiquidHeight(in vec2 texCoord)\n\
{\n\
	float waterHeight = getWaterHeight(texCoord);\n\
	float contaminHeight = 0.0;\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		contaminHeight = getContaminantHeight(texCoord);\n\
	}\n\
\n\
	float totalHeight = waterHeight + contaminHeight;\n\
	return totalHeight;\n\
}\n\
\n\
vec3 calculateNormalFromHeights(in vec2 texCoord)\n\
{\n\
	vec3 normal;\n\
	float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
	float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
	// curPos = (0, 0, curH).\n\
	// upPos = (0, dy, upH).\n\
	// rightPos = (dz, 0, rightH).\n\
\n\
	vec3 curPos = vec3(0.0, 0.0, getTotalHeight(texCoord));\n\
	vec3 upPos = vec3(0.0, cellSize_y, getTotalHeight(texCoord + vec2(0.0, divY)));\n\
	vec3 rightPos = vec3(cellSize_x, 0.0, getTotalHeight(texCoord + vec2(divX, 0.0)));\n\
\n\
	vec3 rightDir = (rightPos - curPos);\n\
	vec3 upDir = (upPos - curPos);\n\
\n\
	normal = normalize(cross(rightDir, upDir));\n\
\n\
	return normal;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
	// read the altitude from waterHeightTex.\n\
	vTexCoord = texCoord;\n\
	vWaterHeight = getWaterHeight(texCoord);\n\
\n\
	vContaminantHeight = 0.0;\n\
	vExistContaminant = -1.0;\n\
	// check if exist contaminat.\n\
	if(u_contaminantMaxHeigh > 0.0)\n\
	{\n\
		// exist contaminant.\n\
		vContaminantHeight = getContaminantHeight(texCoord);\n\
		vExistContaminant = 1.0;\n\
	}\n\
\n\
	// Test check neighbor(adjacent) waterHeights.**************************\n\
	// If some adjacent waterHeight is zero, then this waterHeight is zero.\n\
	/*\n\
	float extrudeHeight = 0.0;\n\
	float minLiquidHeight = 0.0001;\n\
	bool thisIsBorderWater = false;\n\
	if(vWaterHeight + vContaminantHeight < minLiquidHeight)\n\
	{\n\
		thisIsBorderWater = true;\n\
		extrudeHeight = 0.0;\n\
	}\n\
	*/\n\
	// End test.------------------------------------------------------------\n\
\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	//float terrainHeight = getTerrainHeight_interpolated(texCoord);\n\
	float height = terrainHeight + vWaterHeight + vContaminantHeight;\n\
\n\
	// Test debug:\n\
	height += 0.5;\n\
\n\
	//if(thisIsBorderWater)\n\
	//{\n\
	//	height = extrudeHeight;\n\
	//}\n\
\n\
	//float alpha = max(vWaterHeight/u_waterMaxHeigh*1.5, 0.4); // original.***\n\
	float alpha = max(vWaterHeight/u_waterMaxHeigh*1.5, 0.7);\n\
\n\
	\n\
	vColorAuxTest = vec4(0.1, 0.3, 1.0, alpha);\n\
\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	// calculate the up direction:\n\
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);\n\
	vec3 upDir = normalize(posWC.xyz);\n\
\n\
	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;\n\
\n\
	vOrthoPos = (modelViewMatrixRelToEye * finalPos4).xyz;\n\
	float depth = (-vOrthoPos.z)/(far); // the correct value.\n\
\n\
	// try to calculate normal here.\n\
	vec3 ndc = gl_Position.xyz / gl_Position.w; //perspective divide/normalize\n\
	vec2 screenPos = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1\n\
\n\
	// Calculate normal.\n\
	vec3 normalLC = calculateNormalFromHeights(texCoord);\n\
	vec4 normalWC = buildingRotMatrix * vec4(normalLC, 1.0);\n\
	vec4 normalCC = normalMatrix4 * normalWC;\n\
\n\
	vNormal = normalCC.xyz;\n\
	vViewRay = normalize(-getViewRay(screenPos, depth)); // original.***\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//---------------------------------------------------------------------------------\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}\n\
";
ShaderSource.waterReQuatizeFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D texToCopy;\n\
\n\
uniform vec2 u_original_MinMax;\n\
uniform vec2 u_desired_MinMax;\n\
\n\
uniform bool u_textureFlipYAxis;\n\
varying vec2 v_tex_pos;\n\
\n\
void main()\n\
{\n\
    vec4 finalCol4;\n\
    if(u_textureFlipYAxis)\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));\n\
    }\n\
    else\n\
    {\n\
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, v_tex_pos.y));\n\
    }\n\
    \n\
    gl_FragData[0] = finalCol4;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(1.0); // depth\n\
        gl_FragData[2] = vec4(1.0); // normal\n\
        gl_FragData[3] = finalCol4; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
\n\
}";
ShaderSource.waterSimTerrainRenderFS = "//#version 300 es\n\
\n\
#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D diffuseTex;\n\
uniform sampler2D depthTex; \n\
\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D terrainMapToCompare;\n\
\n\
uniform float near;\n\
uniform float far;\n\
uniform mat4 projectionMatrixInv;\n\
uniform bool bUseLogarithmicDepth;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
uniform int uFrustumIdx;\n\
uniform int u_TerrainType;\n\
uniform float u_WaterTransparency;\n\
uniform float u_SimRes;\n\
uniform vec2 u_Dimensions;\n\
uniform vec3 unif_LightPos;\n\
uniform float u_far;\n\
uniform float u_near;\n\
\n\
uniform vec2 u_screenSize;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying vec2 vTexCoord;\n\
varying float depth;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying float vTerrainSlided;\n\
\n\
vec3 calculateNormal(vec2 uv){\n\
    float eps = 1.0/u_SimRes;\n\
    vec4 cur = texture2D(terrainmap, uv)*50.0;\n\
    vec4 r = texture2D(terrainmap, uv + vec2(eps, 0.0))*50.0;\n\
    vec4 t = texture2D(terrainmap, uv + vec2(0.0, eps))*50.0;\n\
\n\
    vec3 n1 = normalize(vec3(-1.0, cur.x - r.x, 0.0));\n\
    vec3 n2 = normalize(vec3(-1.0, t.x - r.x, 1.0));\n\
\n\
    vec3 nor = -cross(n1,n2);\n\
    nor = normalize(nor);\n\
    return nor;\n\
}\n\
/*\n\
vec3 sky(in vec3 rd){\n\
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));\n\
}\n\
\n\
float linearDepth(float depthSample)\n\
{\n\
    depthSample = 2.0 * depthSample - 1.0;\n\
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));\n\
    return zLinear;\n\
}\n\
*/\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
float unpackDepth(const in vec4 rgba_depth)\n\
{\n\
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));\n\
} \n\
\n\
float getDepth(vec2 coord)\n\
{\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));\n\
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;\n\
		// flogz = 1.0 + gl_Position.z;\n\
\n\
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);\n\
		float z = flogzAux - 1.0;\n\
		linearDepth = z/(far);\n\
		return linearDepth;\n\
	}\n\
	else{\n\
		return unpackDepth(texture2D(depthTex, coord.xy));\n\
	}\n\
}\n\
\n\
/*\n\
vec3 reconstructPosition(vec2 texCoord, float depth)\n\
{\n\
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/\n\
    float x = texCoord.x * 2.0 - 1.0;\n\
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;\n\
    float y = (texCoord.y) * 2.0 - 1.0;\n\
    float z = (1.0 - depth) * 2.0 - 1.0;\n\
    vec4 pos_NDC = vec4(x, y, z, 1.0);\n\
    vec4 pos_CC = projectionMatrixInv * pos_NDC;\n\
    return pos_CC.xyz / pos_CC.w;\n\
}\n\
\n\
vec3 normal_from_depth(float depth, vec2 texCoord) {\n\
    // http://theorangeduck.com/page/pure-depth-ssao\n\
    float pixelSizeX = 1.0/u_screenSize.x;\n\
    float pixelSizeY = 1.0/u_screenSize.y;\n\
\n\
    vec2 offset1 = vec2(0.0,pixelSizeY);\n\
    vec2 offset2 = vec2(pixelSizeX,0.0);\n\
\n\
	float depthA = 0.0;\n\
	float depthB = 0.0;\n\
	for(float i=0.0; i<1.0; i++)\n\
	{\n\
		depthA += getDepth(texCoord + offset1*(1.0+i));\n\
		depthB += getDepth(texCoord + offset2*(1.0+i));\n\
	}\n\
\n\
	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);\n\
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);\n\
\n\
    vec3 pos0 = reconstructPosition(texCoord, depth);\n\
    vec3 normal = cross(posA - pos0, posB - pos0);\n\
    normal.z = -normal.z;\n\
\n\
    return normalize(normal);\n\
}\n\
*/\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
\n\
void main()\n\
{\n\
    //vec3 camDir = normalize(vec3(-gl_FragCoord.x / u_screenSize.x, -gl_FragCoord.y / u_screenSize.y, 1.0));\n\
    //vec3 camDir2 = -1.0 + 2.0 * camDir;\n\
    //vec3 normal = calculateNormal(vec2(vTexCoord.x, 1.0 - vTexCoord.y));\n\
    //float dotProd = dot(camDir2, normal);\n\
    //vec4 finalCol4 = vec4(vColorAuxTest * dotProd);\n\
    //finalCol4 = vec4(normal, 1.0);\n\
    //if(vColorAuxTest.r == vColorAuxTest.g && vColorAuxTest.r == vColorAuxTest.b )\n\
    //{\n\
    //    finalCol4 = vec4(1.0, 0.0, 0.0, 1.0);\n\
    //}\n\
\n\
    \n\
\n\
    float depthAux = depth;\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
		depthAux = gl_FragDepthEXT; \n\
	}\n\
	#endif\n\
\n\
    // read difusseTex.\n\
    vec4 difusseColor = texture2D(diffuseTex, vec2(vTexCoord.x, 1.0 - vTexCoord.y));\n\
    if(vTerrainSlided > 0.0)\n\
    {\n\
        difusseColor.r *= 0.5;\n\
        difusseColor.g *= 0.5;\n\
        difusseColor.b *= 0.5;\n\
    }\n\
    //float dotProd = dot(vViewRay, vNormal);\n\
    //difusseColor = vec4(difusseColor.xyz * dotProd, 1.0);\n\
    //gl_FragData[2] = vec4(vNormal, 1.0); // normal\n\
    float frustumIdx = 1.0;\n\
    if(uFrustumIdx == 0)\n\
    frustumIdx = 0.005;\n\
    else if(uFrustumIdx == 1)\n\
    frustumIdx = 0.015;\n\
    else if(uFrustumIdx == 2)\n\
    frustumIdx = 0.025;\n\
    else if(uFrustumIdx == 3)\n\
    frustumIdx = 0.035;\n\
\n\
    vec3 encodedNormal = encodeNormal(vNormal);\n\
\n\
\n\
    gl_FragData[0] = difusseColor;  // anything.\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = packDepth(depthAux);  // depth\n\
        gl_FragData[2] = vec4(encodedNormal, frustumIdx); // normal\n\
        gl_FragData[3] = difusseColor; // albedo\n\
        gl_FragData[4] = vec4(1.0); // selection color\n\
    #endif\n\
    /*\n\
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);\n\
    float terrainDepth = texture(sceneDepth,uv).x;\n\
    float sediment = texture(sedimap,fs_Uv).x;\n\
    float waterDepth = gl_FragCoord.z;\n\
\n\
    terrainDepth = linearDepth(terrainDepth);\n\
    waterDepth = linearDepth(waterDepth);\n\
\n\
    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);\n\
    dpVal = clamp(dpVal, 0.0,4.0);\n\
    //dpVal = pow(dpVal, 0.1);\n\
\n\
\n\
    float fbias = 0.2;\n\
    float fscale = 0.2;\n\
    float fpow = 22.0;\n\
    vec3 sundir = unif_LightPos;\n\
\n\
    sundir = normalize(sundir);\n\
\n\
    vec3 nor = -calnor(fs_Uv);\n\
    vec3 viewdir = normalize(u_Eye - fs_Pos);\n\
    vec3 lightdir = normalize(sundir);\n\
    vec3 halfway = normalize(lightdir + viewdir);\n\
    vec3 reflectedSky = sky(halfway);\n\
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);\n\
\n\
\n\
    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));\n\
\n\
    //lamb =1.f;\n\
\n\
    float yval = texture(hightmap,fs_Uv).x * 4.0;\n\
    float wval = texture(hightmap,fs_Uv).y;\n\
    wval /= 1.0;\n\
\n\
\n\
\n\
    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);\n\
    vec3 watercolorspec = vec3(1.0);\n\
    watercolorspec *= spec;\n\
\n\
\n\
\n\
    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);\n\
    col_reflect = vec4(1.0);\n\
    */\n\
}";
ShaderSource.waterSimTerrainRenderVS = "\n\
attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
attribute vec4 color4;\n\
\n\
uniform mat4 buildingRotMatrix; // use this to calculate normal from hightMap textures.\n\
uniform mat4 modelViewMatrixRelToEye; \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 normalMatrix4;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform float near;\n\
uniform float far;\n\
uniform vec3 scaleLC;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform float uFCoef_logDepth;\n\
\n\
uniform sampler2D terrainmap;\n\
uniform sampler2D terrainMapToCompare;\n\
\n\
uniform vec2 u_screenSize;\n\
uniform float tangentOfHalfFovy;\n\
uniform float aspectRatio;\n\
\n\
uniform vec2 u_heightMap_MinMax;\n\
uniform vec2 u_tileSize; // tile size in meters.\n\
uniform vec2 u_simulationTextureSize; // for example 512 x 512.\n\
uniform vec2 u_terrainTextureSize; // for example 512 x 512.\n\
\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
\n\
varying vec4 vColorAuxTest;\n\
varying vec2 vTexCoord;\n\
varying float depth;\n\
varying vec3 vNormal;\n\
varying vec3 vViewRay;\n\
varying float vTerrainSlided;\n\
\n\
vec3 getViewRay(vec2 tc, in float relFar)\n\
{\n\
	float hfar = 2.0 * tangentOfHalfFovy * relFar;\n\
    float wfar = hfar * aspectRatio;    \n\
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    \n\
	\n\
    return ray;                      \n\
}\n\
\n\
float getTerrainHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainmap, texCoord).b;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
float getTerrainToCompareHeight(in vec2 texCoord)\n\
{\n\
    float terainHeight = texture2D(terrainMapToCompare, texCoord).b;\n\
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
    return terainHeight;\n\
}\n\
\n\
float getTerrainHeight_interpolated(const vec2 uv) \n\
{\n\
    vec2 px = 1.0 / u_terrainTextureSize;\n\
    vec2 vc = (floor(uv * u_terrainTextureSize)) * px;\n\
    vec2 f = fract(uv * u_terrainTextureSize);\n\
    float tl = texture2D(terrainmap, vc).r;\n\
    float tr = texture2D(terrainmap, vc + vec2(px.x, 0)).r;\n\
    float bl = texture2D(terrainmap, vc + vec2(0, px.y)).r;\n\
    float br = texture2D(terrainmap, vc + px).r;\n\
\n\
    float h =  mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
	h = u_heightMap_MinMax.x + h * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);\n\
	return h;\n\
}\n\
\n\
vec3 calculateNormalFromHeights(in vec2 texCoord, in float curHeight)\n\
{\n\
	vec3 normal;\n\
	float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;\n\
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;\n\
\n\
	float divX = 1.0/u_simulationTextureSize.x;\n\
    float divY = 1.0/u_simulationTextureSize.y;\n\
\n\
	vec3 curPos = vec3(0.0, 0.0, curHeight);\n\
	vec3 upPos = vec3(0.0, cellSize_y, getTerrainHeight_interpolated(texCoord + vec2(0.0, divY)));\n\
	vec3 rightPos = vec3(cellSize_x, 0.0, getTerrainHeight_interpolated(texCoord + vec2(divX, 0.0)));\n\
\n\
	vec3 rightDir = (rightPos - curPos);\n\
	vec3 upDir = (upPos - curPos);\n\
\n\
	normal = normalize(cross(rightDir, upDir));\n\
	return normal;\n\
}\n\
\n\
void main()\n\
{\n\
	// read the altitude from hightmap.\n\
	vTexCoord = texCoord; // used for difusseTex.\n\
\n\
	//float terrainHeight = getTerrainHeight_interpolated(texCoord);\n\
	float terrainHeight = getTerrainHeight(texCoord);\n\
	float height = terrainHeight; \n\
	float terrainToCompareHeight = getTerrainToCompareHeight(texCoord);\n\
\n\
	vTerrainSlided = -1.0;\n\
	if(abs(terrainToCompareHeight - terrainHeight) > 0.8)\n\
	{\n\
		vTerrainSlided = 1.0;\n\
	}\n\
\n\
	vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
	\n\
	// calculate the up direction:\n\
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);\n\
	vec3 upDir = normalize(posWC.xyz);\n\
\n\
	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);\n\
\n\
	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;\n\
\n\
	vec4 orthoPos = modelViewMatrixRelToEye * finalPos4;\n\
	//vertexPos = orthoPos.xyz;\n\
	depth = (-orthoPos.z)/(far); // the correct value.\n\
\n\
	// Calculate normal.\n\
	// try to calculate normal here.\n\
	////vec3 ndc = gl_Position.xyz / gl_Position.w; //perspective divide/normalize\n\
	////vec2 screenPos = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1\n\
	////vViewRay = normalize(-getViewRay(screenPos, depth));\n\
\n\
	vec3 normalLC = calculateNormalFromHeights(texCoord, terrainHeight);\n\
	vec4 normalWC = buildingRotMatrix * vec4(normalLC, 1.0);\n\
	vec4 normalCC = normalMatrix4 * normalWC;\n\
	vNormal = normalCC.xyz;\n\
	\n\
\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		// logarithmic zBuffer:\n\
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html\n\
		// float Fcoef = 2.0 / log2(far + 1.0);\n\
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;\n\
		// flogz = 1.0 + gl_Position.w;\n\
		//---------------------------------------------------------------------------------\n\
		flogz = 1.0 + gl_Position.w;\n\
		Fcoef_half = 0.5 * uFCoef_logDepth;\n\
	}\n\
}\n\
";
ShaderSource.waterUpdateParticlesFS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform sampler2D u_particles;\n\
uniform sampler2D u_wind;\n\
uniform sampler2D u_windGlobeDepthTex;\n\
uniform sampler2D u_windGlobeNormalTex;\n\
\n\
uniform mat4 modelViewMatrixInv;\n\
\n\
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
uniform float tangentOfHalfFovy;\n\
uniform float far;            \n\
uniform float aspectRatio; \n\
\n\
// new uniforms test.\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 buildingRotMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform mat4 buildingRotMatrixInv;\n\
uniform vec2 uNearFarArray[4];\n\
\n\
#define M_PI 3.1415926535897932384626433832795\n\
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
vec2 encodeVelocity(in vec2 vel)\n\
{\n\
	return vel*0.5 + 0.5;\n\
}\n\
\n\
vec2 decodeVelocity(in vec2 encodedVel)\n\
{\n\
	return vec2(encodedVel.xy * 2.0 - 1.0);\n\
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
\n\
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);\n\
}\n\
\n\
float radiusAtLatitudeRad(in float latRad)\n\
{\n\
	// a = equatorialRadius, b = polarRadius.\n\
	// r = a*b / sqrt(a2*sin2(lat) + b2*cos2(lat)).\n\
	//------------------------------------------------------\n\
	float a = 6378137.0; // Globe.equatorialRadius();\n\
	float b = 6356752.3142; // Globe.polarRadius();\n\
	float a2 = 40680631590769.0; // Globe.equatorialRadiusSquared();\n\
	float b2 = 40408299984087.05552164; // Globe.polarRadiusSquared();\n\
	\n\
	float sin = sin(latRad);\n\
	float cos = cos(latRad);\n\
	float sin2 = sin*sin;\n\
	float cos2 = cos*cos;\n\
	\n\
	float radius = (a*b)/(sqrt(a2*sin2 + b2*cos2));\n\
	return radius;\n\
}\n\
\n\
void main() \n\
{\n\
    vec4 color = texture2D(u_particles, v_tex_pos);\n\
    vec2 pos = vec2(\n\
        color.r / 255.0 + color.b,\n\
        color.g / 255.0 + color.a); // decode particle position from pixel RGBA\n\
	vec2 windMapTexCoord = pos;\n\
	if(u_flipTexCoordY_windMap)\n\
	{\n\
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;\n\
	}\n\
\n\
    vec2 velocity = mix(u_wind_min, u_wind_max, decodeVelocity(lookup_wind(windMapTexCoord)));\n\
    float speed_t = length(velocity) / length(u_wind_max);\n\
\n\
    // Calculate pixelSizes.**************************************************************************************************\n\
	//vec3 buildingPos = buildingPosHIGH + buildingPosLOW;\n\
	//float radius = length(buildingPos);\n\
	float minLonRad = u_geoCoordRadiansMin.x;\n\
	float maxLonRad = u_geoCoordRadiansMax.x;\n\
	float minLatRad = u_geoCoordRadiansMin.y;\n\
	float maxLatRad = u_geoCoordRadiansMax.y;\n\
	float lonRadRange = maxLonRad - minLonRad;\n\
	float latRadRange = maxLatRad - minLatRad;\n\
\n\
    float midLatRad = (maxLatRad + minLatRad) / 2.0;\n\
    float radius = radiusAtLatitudeRad(midLatRad);\n\
\n\
	float distortion = cos((minLatRad + pos.y * latRadRange ));\n\
\n\
	float meterToLon = 1.0/(radius * distortion);\n\
	float meterToLat = 1.0 / radius;\n\
\n\
	float xSpeedFactor = meterToLon / lonRadRange;\n\
	float ySpeedFactor = meterToLat / latRadRange;\n\
\n\
	xSpeedFactor *= 1.0 * u_speed_factor;\n\
	ySpeedFactor *= 1.0 * u_speed_factor;\n\
\n\
	vec2 offset = vec2(velocity.x / distortion * xSpeedFactor, -velocity.y * ySpeedFactor);\n\
\n\
    // update particle position, wrapping around the date line\n\
    vec2 auxVec2 = vec2(pos.x, pos.y);\n\
    pos = fract(1.0 + pos + offset);\n\
	// End ******************************************************************************************************************\n\
\n\
    float drop = 0.0;\n\
\n\
    // a random seed to use for the particle drop\n\
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;\n\
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;\n\
    drop = step(1.0 - drop_rate, rand(seed));\n\
\n\
    vec4 vel = texture2D(u_wind, v_tex_pos);\n\
\n\
    if(drop > 0.1 || speed_t < 0.01) // 0.01\n\
	{\n\
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );\n\
		pos = random_pos;\n\
	}\n\
    \n\
    // encode the new particle position back into RGBA\n\
    gl_FragData[0] = vec4(\n\
        fract(pos * 255.0),\n\
        floor(pos * 255.0) / 255.0);\n\
\n\
    #ifdef USE_MULTI_RENDER_TARGET\n\
        gl_FragData[1] = vec4(0.0); //\n\
        gl_FragData[2] = vec4(0.0); // \n\
        gl_FragData[3] = vec4(0.0); // \n\
        gl_FragData[4] = vec4(0.0); // \n\
    #endif\n\
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
ShaderSource.windStreamThickLineFS = "precision highp float;\n\
\n\
#define %USE_LOGARITHMIC_DEPTH%\n\
#ifdef USE_LOGARITHMIC_DEPTH\n\
#extension GL_EXT_frag_depth : enable\n\
#endif\n\
\n\
#define %USE_MULTI_RENDER_TARGET%\n\
#ifdef USE_MULTI_RENDER_TARGET\n\
#extension GL_EXT_draw_buffers : require\n\
#endif\n\
\n\
uniform bool bUseLogarithmicDepth;\n\
uniform bool bUseMultiRenderTarget;\n\
uniform int uFrustumIdx;\n\
uniform int uElemIndex;\n\
uniform int uTotalPointsCount; // total points to draw.\n\
uniform vec2 viewport;\n\
uniform float thickness;\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vCurrentIndex;\n\
\n\
varying float vSense;\n\
\n\
vec3 encodeNormal(in vec3 normal)\n\
{\n\
	return normal*0.5 + 0.5;\n\
}\n\
\n\
vec3 decodeNormal(in vec3 normal)\n\
{\n\
	return normal * 2.0 - 1.0;\n\
}\n\
\n\
vec4 packDepth( float v ) {\n\
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n\
  enc = fract(enc);\n\
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);\n\
  return enc;\n\
}\n\
\n\
void main() {\n\
	// calculate the transparency.\n\
	float alpha = 1.0 - (vCurrentIndex - float(uElemIndex))/float(uTotalPointsCount);\n\
\n\
	// use vSense to calculate aditional transparency in the borders of the thick line.***\n\
	float beta = sin(acos(vSense));\n\
	alpha *= beta;\n\
\n\
	vec4 finalColor =  vec4(vColor.rgb, alpha);\n\
\n\
	gl_FragData[0] = finalColor;\n\
\n\
	#ifdef USE_MULTI_RENDER_TARGET\n\
	if(bUseMultiRenderTarget)\n\
	{\n\
		gl_FragData[1] = packDepth(vDepth);\n\
		\n\
\n\
		// Note: points cloud data has frustumIdx 20 .. 23.********\n\
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. \n\
		\n\
		if(uFrustumIdx == 0)\n\
		frustumIdx = 0.005; // frustumIdx = 20.***\n\
		else if(uFrustumIdx == 1)\n\
		frustumIdx = 0.015; // frustumIdx = 21.***\n\
		else if(uFrustumIdx == 2)\n\
		frustumIdx = 0.025; // frustumIdx = 22.***\n\
		else if(uFrustumIdx == 3)\n\
		frustumIdx = 0.035; // frustumIdx = 23.***\n\
\n\
		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));\n\
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***\n\
\n\
		// now, albedo.\n\
		gl_FragData[3] = finalColor;\n\
		\n\
	}\n\
	#endif\n\
\n\
	#ifdef USE_LOGARITHMIC_DEPTH\n\
	if(bUseLogarithmicDepth)\n\
	{\n\
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;\n\
	}\n\
	#endif\n\
}";
ShaderSource.windStreamThickLineVS = "\n\
attribute vec4 prev;\n\
attribute vec4 current;\n\
attribute vec4 next;\n\
attribute vec4 color4;\n\
attribute float index;\n\
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
uniform float uFCoef_logDepth;\n\
\n\
varying vec4 vColor;\n\
varying float flogz;\n\
varying float Fcoef_half;\n\
varying float vDepth;\n\
varying float vCurrentIndex;\n\
\n\
varying float vSense;\n\
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
	vec4 orthoPos = modelViewMatrixRelToEye * vCurrent;\n\
	vDepth = -orthoPos.z/far;\n\
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
	float realThickness = (thickness*sense*projectedDepth)/1000.0;\n\
	// Offset our position along the normal\n\
	vec4 offset = vec4(normal * realThickness, 0.0, 0.0);\n\
	gl_Position = currentProjected + offset; \n\
	vSense = sense;\n\
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
\n\
	vCurrentIndex = index;\n\
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
