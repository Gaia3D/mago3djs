
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

uniform sampler2D waterHeightTex;
uniform sampler2D terrainmap;
uniform sampler2D contaminantHeightTex;

uniform vec2 u_heightMap_MinMax;
uniform float u_waterMaxHeigh;
uniform float u_contaminantMaxHeigh;


varying vec4 vColorAuxTest;
varying float vWaterHeight;
varying float depth;

float decodeRG(in vec2 waterColorRG)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));
}

vec2 encodeRG(in float wh)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    float encodedBit = 1.0/255.0;
    vec2 enc = vec2(1.0, 255.0) * wh;
    enc = fract(enc);
    enc.x -= enc.y * encodedBit;
    return enc; // R = HIGH, G = LOW.***
}

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float getWaterHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(waterHeightTex, texCoord);
    //float decoded = decodeRG(color4.rg); // old.
    float decoded = unpackDepth(color4);
    float waterHeight = decoded * u_waterMaxHeigh;

    return waterHeight;
}

float getContaminantHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);
    //float decoded = decodeRG(color4.rg); // 16bit.
    float decoded = unpackDepth(color4); // 32bit.
    float waterHeight = decoded * u_contaminantMaxHeigh;
    return waterHeight;
}

void main()
{
	// read the altitude from hightmap.
	vec4 terrainHeight4 = texture2D(terrainmap, vec2(texCoord.x, 1.0 - texCoord.y));
	float waterHeight = getWaterHeight(vec2(texCoord.x, texCoord.y));

	float contaminantHeight = 0.0;
	// check if exist contaminat.
	if(u_contaminantMaxHeigh > 0.0)
	{
		// exist contaminant.
		contaminantHeight = getContaminantHeight(texCoord);
	}

	float terrainH = terrainHeight4.r;
	float terrainHeight = u_heightMap_MinMax.x + terrainH * u_heightMap_MinMax.y;
	float height = terrainHeight + waterHeight + contaminantHeight;

	vWaterHeight = waterHeight;

	vColorAuxTest = vec4(0.1, 0.5, 1.0, 1.0);

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

	vec4 orthoPos = modelViewMatrixRelToEye * finalPos4;
	//vertexPos = orthoPos.xyz;
	depth = (-orthoPos.z)/(far); // the correct value.

	

}
