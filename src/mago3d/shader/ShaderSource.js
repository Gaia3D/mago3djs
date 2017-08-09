'use strict';
var ShaderSource = ShaderSource || {};
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
ShaderSource.BoxDepthFS = "#ifdef GL_ES\n\
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
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = packDepth(-depth);\n\
}\n\
";
ShaderSource.BoxDepthVS = "attribute vec3 position;\n\
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
void main()\n\
{	\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    //linear depth in camera space (0..far)\n\
    depth = (modelViewMatrixRelToEye * pos4).z/far;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
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
{          \n\
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
    vec4 textureColor;\n\
    textureColor = vcolor4;\n\
\n\
    gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
    gl_FragColor.a = 1.0;   \n\
}\n\
";
ShaderSource.BoxSsaoVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
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
uniform vec4 vColor4Aux;\n\
\n\
void main()\n\
{          \n\
    gl_FragColor = vColor4Aux;\n\
}\n\
";
ShaderSource.ColorSelectionSsaoVS = "attribute vec3 position;\n\
\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 RefTransfMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
\n\
void main()\n\
{	\n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 1.0);\n\
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
ShaderSource.LegoDepthFS = "#ifdef GL_ES\n\
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
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = packDepth(-depth);\n\
}\n\
";
ShaderSource.LegoDepthVS = "attribute vec3 position;\n\
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
void main()\n\
{	\n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    depth = (modelViewMatrixRelToEye * pos4).z/far;\n\
    \n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.LegoSsaoFS = "#ifdef GL_ES\n\
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
{          \n\
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
    vec4 textureColor;\n\
    textureColor = vcolor4;\n\
\n\
    gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
    gl_FragColor.a = 1.0;   \n\
}\n\
";
ShaderSource.LegoSsaoVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec4 color4;\n\
attribute vec2 texCoord;\n\
\n\
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
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;  \n\
varying vec3 uAmbientColor;\n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
\n\
void main()\n\
{	\n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    vec3 rotatedNormal = mat3(RefTransfMatrix) * normal;\n\
    vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
    uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
    vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
    vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
    vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
\n\
    float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
    vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
    vcolor4 = color4;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.LodBuildingDepthFS = "#ifdef GL_ES\n\
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
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = packDepth(-depth);\n\
}\n\
";
ShaderSource.LodBuildingDepthVS = "attribute vec3 position;\n\
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
void main()\n\
{	\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
        \n\
    depth = (modelViewMatrixRelToEye * pos4).z/far;\n\
    \n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.LodBuildingSsaoFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
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
uniform vec3 kernel[16];   \n\
uniform vec4 vColor4Aux;\n\
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
{          \n\
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
    float linearDepth = getDepth(screenPos);          \n\
    vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
\n\
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
    vec4 textureColor;\n\
    if(hasTexture)\n\
    {\n\
        if(textureFlipYAxis)\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));\n\
        }\n\
        else\n\
        {\n\
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));\n\
        }\n\
    }\n\
    else\n\
    {\n\
        textureColor = vcolor4;\n\
    }\n\
    \n\
    gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); \n\
    gl_FragColor.a = 1.0;   \n\
}\n\
";
ShaderSource.LodBuildingSsaoVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec4 color4;\n\
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
uniform vec3 aditionalPosition;\n\
uniform vec4 oneColor4;\n\
uniform bool bUse1Color;\n\
uniform bool hasTexture;\n\
\n\
varying vec3 vNormal;\n\
varying vec2 vTexCoord;   \n\
varying vec3 uAmbientColor;\n\
varying vec3 vLightWeighting;\n\
varying vec4 vcolor4;\n\
\n\
void main()\n\
{	\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
   \n\
    vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);\n\
    vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
    uAmbientColor = vec3(0.8, 0.8, 0.8);\n\
    vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);\n\
    vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
    vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
    float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
    vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
\n\
    if(bUse1Color)\n\
    {\n\
        vcolor4 = oneColor4;\n\
    }\n\
    else\n\
    {\n\
        vcolor4 = color4;\n\
    }\n\
    vTexCoord = texCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.ModelRefSsaoFS = "#ifdef GL_ES\n\
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
varying vec3 ambientColor;\n\
varying vec3 diffuseColor;\n\
varying vec3 specularColor;\n\
varying vec3 vertexPos;\n\
\n\
const int kernelSize = 16;  \n\
const float radius = 0.15;      \n\
\n\
const float ambientReflectionCoef = 0.5;\n\
const float diffuseReflectionCoef = 1.0;  \n\
const float specularReflectionCoef = 1.0; \n\
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
    vec3 lightPos = vec3(0.0, 0.0, 20.0);\n\
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
        if(textureColor.w == 0.0)\n\
        {\n\
            discard;\n\
        }\n\
    }\n\
    else{\n\
        textureColor = vColor4Aux;\n\
    }\n\
    vec3 specularColor = vec3(0.9);\n\
    vec3 ambientColor = vec3(textureColor.x * 0.9, textureColor.y * 0.9, textureColor.z * 0.9);\n\
\n\
    gl_FragColor = vec4((ambientReflectionCoef * ambientColor + diffuseReflectionCoef * lambertian * textureColor.xyz + specularReflectionCoef * specular * specularColor)*vLightWeighting * occlusion, 1.0); \n\
}\n\
";
ShaderSource.ModelRefSsaoVS = "	attribute vec3 position;\n\
	attribute vec3 normal;\n\
	attribute vec2 texCoord;\n\
	\n\
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
	\n\
	varying vec3 vNormal;\n\
	varying vec2 vTexCoord;  \n\
	varying vec3 uAmbientColor;\n\
	varying vec3 vLightWeighting;\n\
	varying vec3 vertexPos;\n\
	\n\
	void main()\n\
    {	\n\
		vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
		vec3 objPosHigh = buildingPosHIGH;\n\
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
		vertexPos = vec3(modelViewMatrixRelToEye * pos4);\n\
		vec3 rotatedNormal = mat3(RefTransfMatrix) * normal;\n\
		vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
		uAmbientColor = vec3(0.8);\n\
		vec3 uLightingDirection = vec3(0.7, 0.7, 0.7);\n\
		vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);\n\
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;\n\
		vTexCoord = texCoord;\n\
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);\n\
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;\n\
\n\
        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
	}\n\
";
ShaderSource.PngImageFS = "precision mediump float;\n\
varying vec2 v_texcoord;\n\
uniform bool textureFlipYAxis;\n\
uniform sampler2D u_texture;\n\
\n\
void main()\n\
{\n\
    vec4 textureColor;\n\
    if(textureFlipYAxis)\n\
    {\n\
        textureColor = texture2D(u_texture, vec2(v_texcoord.s, 1.0 - v_texcoord.t));\n\
    }\n\
    else\n\
    {\n\
        textureColor = texture2D(u_texture, v_texcoord);\n\
    }\n\
    if(textureColor.w < 0.1)\n\
    {\n\
        discard;\n\
    }\n\
\n\
    gl_FragColor = textureColor;\n\
}";
ShaderSource.PngImageVS = "attribute vec3 a_position;\n\
attribute vec2 a_texcoord;\n\
uniform mat4 buildingRotMatrix;  \n\
uniform mat4 ModelViewProjectionMatrixRelToEye;  \n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
varying vec2 v_texcoord;\n\
\n\
void main()\n\
{\n\
    vec4 position2 = vec4(a_position.xyz, 1.0);\n\
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    v_texcoord = a_texcoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.PointCloudFS = "	precision lowp float;\n\
	varying vec4 vColor;\n\
\n\
	void main()\n\
    {\n\
		gl_FragColor = vColor;\n\
	}";
ShaderSource.PointCloudVS = "attribute vec3 position;\n\
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
attribute vec4 color;\n\
varying vec4 vColor;\n\
\n\
void main()\n\
{\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    vColor=color;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;\n\
}";
ShaderSource.RenderShowDepthFS = "#ifdef GL_ES\n\
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
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
    return res;  \n\
}\n\
\n\
void main()\n\
{     \n\
    gl_FragData[0] = packDepth(-depth);\n\
}\n\
";
ShaderSource.RenderShowDepthVS = "attribute vec3 position;\n\
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
varying float depth;\n\
  \n\
void main()\n\
{	\n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    //linear depth in camera space (0..far)\n\
    depth = (modelViewMatrixRelToEye * pos4).z/far;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.ShowDepthFS = "#ifdef GL_ES\n\
    precision highp float;\n\
#endif\n\
uniform float near;\n\
uniform float far;\n\
\n\
varying float depth;  \n\
varying vec3 vN; \n\
varying vec4 vVSPos;\n\
\n\
// from http://spidergl.org/example.php?id=6\n\
vec4 packDepth(const in float depth)\n\
{\n\
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);\n\
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); \n\
    vec4 res = fract(depth * bit_shift);\n\
    res -= res.xxyz * bit_mask;\n\
\n\
    return res;  \n\
}\n\
\n\
void main()\n\
{\n\
    gl_FragData[0] = packDepth(-depth);\n\
    gl_FragData[0].r = -depth/far;\n\
}\n\
";
ShaderSource.ShowDepthVS = "attribute vec3 position;\n\
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
\n\
void main()\n\
{	\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    vN = normalize((normalMatrix4 * vec4(normal, 1.0)).xyz);\n\
    \n\
    //linear depth in camera space (0..far)\n\
    depth = (modelViewMatrixRelToEye * pos4).z/far;\n\
    vVSPos = modelViewMatrixRelToEye * pos4;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
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
uniform mat4 ModelViewProjectionMatrixRelToEye;\n\
uniform mat4 ModelViewMatrixRelToEye;\n\
uniform mat4 ProjectionMatrix;\n\
uniform mat4 RefTransfMatrix;\n\
uniform vec3 buildingPosHIGH;\n\
uniform vec3 buildingPosLOW;\n\
uniform vec3 encodedCameraPositionMCHigh;\n\
uniform vec3 encodedCameraPositionMCLow;\n\
uniform vec3 aditionalPosition;\n\
uniform vec2 camSpacePixelTranslation;\n\
uniform vec2 screenSize;    \n\
varying vec2 camSpaceTranslation;\n\
\n\
void main()\n\
{    \n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 1.0);\n\
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
ShaderSource.SimpleDepthSsaoFS = "precision highp float;\n\
const vec4 bitEnc = vec4(1.0,255.0,65025.0,16581375.0);\n\
const vec4 bitDec = 1.0/bitEnc;\n\
varying float zDepth;\n\
\n\
vec4 EncodeFloatRGBA (float v)\n\
{\n\
    vec4 enc = bitEnc * v;\n\
    enc = fract(enc);\n\
    enc -= enc.yzww * vec2(1.0/255.0, 0.0).xxxy;\n\
    return enc;\n\
}\n\
\n\
void main()\n\
{          \n\
    vec4 encodedZ = EncodeFloatRGBA(zDepth);\n\
    gl_FragData[0] = encodedZ;\n\
}\n\
";
ShaderSource.SimpleDepthSsaoVS = "attribute vec3 position;\n\
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
void main()\n\
{	\n\
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0);\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
    \n\
    zDepth = (modelViewMatrixRelToEye * pos4).z/far;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
}\n\
";
ShaderSource.SsaoFS = "#ifdef GL_ES\n\
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
const float radius = 1.0;      \n\
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
{          \n\
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 \n\
    float linearDepth = getDepth(screenPos);          \n\
    vec3 origin = getViewRay(screenPos) * linearDepth;   \n\
 \n\
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
\n\
        float range_check = abs(linearDepth - depthBufferValue)+radius*0.998;\n\
        if (range_check < radius && depthBufferValue <= sampleDepth)\n\
        {\n\
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
\n\
    gl_FragColor.rgb = vec3((textureColor.xyz*0.2 + textureColor.xyz*0.8) * occlusion); // with texture.***\n\
    gl_FragColor.a = 1.0;   \n\
}\n\
";
ShaderSource.SsaoVS = "attribute vec3 position;\n\
attribute vec3 normal;\n\
attribute vec2 texCoord;\n\
\n\
uniform mat4 projectionMatrix;  \n\
uniform mat4 modelViewMatrix;\n\
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
void main()\n\
{	\n\
    vec3 objPosHigh = buildingPosHIGH;\n\
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;\n\
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;\n\
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;\n\
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);\n\
\n\
    vNormal = (normalMatrix4 * vec4(-normal.x, -normal.y, -normal.z, 1.0)).xyz;\n\
    vTexCoord = texCoord;\n\
\n\
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;\n\
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
