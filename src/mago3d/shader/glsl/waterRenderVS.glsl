
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

//in vec4 vs_Pos;
//in vec4 vs_Nor;
//in vec4 vs_Col;
//in vec2 vs_Uv;

//out vec3 fs_Pos;
//out vec4 fs_Nor;
//out vec4 fs_Col;

//out vec2 fs_Uv;

varying vec4 vColorAuxTest;

void main()
{
	// read the altitude from hightmap.
	vec4 heightVec4 = texture2D(hightmap, vec2(texCoord.x, 1.0 - texCoord.y));
	float r = heightVec4.r;
	float g = heightVec4.g;

	float decodedHeight = r;

	float height = u_heightMap_MinMax.x + decodedHeight * u_heightMap_MinMax.y;
	//height = g;

	vColorAuxTest = heightVec4;

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


	/*
	fs_Uv = vs_Uv;
	float sval = 1.f*texture(terrainmap,vs_Uv).x;
	float yval = 1.f*texture(hightmap,vs_Uv).x;
	float wval = 1.f*texture(hightmap,vs_Uv).y;
	vec4 modelposition = vec4(vs_Pos.x, (yval + sval + wval)/u_SimRes, vs_Pos.z, 1.0);
	fs_Pos = modelposition.xyz;


	modelposition = u_Model * modelposition;
	gl_Position = u_ViewProj * modelposition;
	*/
}
