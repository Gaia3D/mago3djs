
//#version 300 es

	attribute vec3 position;
	attribute vec3 normal;
	attribute vec2 texCoord;
	attribute vec4 color4;
	
	uniform mat4 buildingRotMatrix; 
	uniform mat4 modelViewMatrixRelToEye; 
	uniform mat4 ModelViewProjectionMatrixRelToEye;
	uniform mat4 normalMatrix4;
	uniform vec3 buildingPosHIGH;
	uniform vec3 buildingPosLOW;
	uniform float near;
	uniform float far;
	uniform vec3 scaleLC;
	uniform vec3 encodedCameraPositionMCHigh;
	uniform vec3 encodedCameraPositionMCLow;
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.
	
	uniform bool bUseLogarithmicDepth;
	uniform float uFCoef_logDepth;
    
uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane

uniform sampler2D hightmap;
uniform sampler2D terrainmap;
uniform float u_SimRes;

uniform vec2 u_heightMap_MinMax;

varying float flogz;
varying float Fcoef_half;

varying vec4 vColorAuxTest;
varying vec2 vTexCoord;

void main()
{
	// read the altitude from hightmap.
	//vec4 heightVec4 = texture2D(hightmap, vec2(texCoord.x, 1.0 - texCoord.y));
	vec4 terrainHeight4 = texture2D(terrainmap, vec2(texCoord.x, 1.0 - texCoord.y));
	vTexCoord = texCoord;
	//float r = heightVec4.r;
	//float g = heightVec4.g;

	//float decodedHeight = r;
	float terrainH = terrainHeight4.r;

	//float waterHeight = decodedHeight * 50.0;
	float terrainHeight = u_heightMap_MinMax.x + terrainH * u_heightMap_MinMax.y;
	float height = terrainHeight;

	vColorAuxTest = terrainHeight4;

	vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
	// calculate the up direction:
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);
	vec3 upDir = normalize(posWC.xyz);

	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);

	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;

	if(bUseLogarithmicDepth)
	{
		// logarithmic zBuffer:
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
		// float Fcoef = 2.0 / log2(far + 1.0);
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;
		// flogz = 1.0 + gl_Position.w;
		//---------------------------------------------------------------------------------
		flogz = 1.0 + gl_Position.w;
		Fcoef_half = 0.5 * uFCoef_logDepth;
	}
}
