attribute vec3 position;
attribute vec3 normal;
attribute vec4 color4;
attribute vec2 texCoord;

uniform sampler2D diffuseTex;
uniform mat4 projectionMatrix;  
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 ModelViewProjectionMatrix;
uniform mat4 normalMatrix4;
uniform mat4 buildingRotMatrix;  
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec3 aditionalPosition;
uniform vec4 oneColor4;
uniform bool bUse1Color;
uniform bool hasTexture;
uniform bool bIsMakingDepth;
uniform float near;
uniform float far;

varying vec3 vNormal;
varying vec3 v3Pos;
varying vec2 vTexCoord;   
varying vec3 uAmbientColor;
varying vec3 vLightWeighting;
varying vec4 vcolor4;
varying vec3 vertexPos;
varying float depthValue;
varying vec3 camPos;

const float equatorialRadius = 6378137.0;
const float polarRadius = 6356752.3142;
const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923; 
const float PI_4 = 0.785398163397448309616;

void main()
{	
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
	vNormal = (normalMatrix4 * vec4(normal, 1.0)).xyz;

	if(bIsMakingDepth)
	{
		depthValue = (modelViewMatrixRelToEye * pos4).z/far;
	}
	else
	{
		vTexCoord = texCoord;
	}
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
	camPos = encodedCameraPositionMCHigh.xyz + encodedCameraPositionMCLow.xyz;
	v3Pos = vec3((modelViewMatrixRelToEye * pos4).xyz);

	// Calculate color.
	float distToCam = length(vec3(v3Pos));
	vec3 camDir = normalize(vec3(v3Pos.x, v3Pos.y, v3Pos.z));
	vec3 normal = vNormal;
	float angRad = acos(dot(camDir, normal));
	float angDeg = angRad*180.0/PI;
	/*
	if(angDeg > 130.0)
		textureColor = vec4(1.0, 0.0, 0.0, 1.0);
	else if(angDeg > 120.0)
		textureColor = vec4(0.0, 1.0, 0.0, 1.0);
	else if(angDeg > 110.0)
		textureColor = vec4(0.0, 0.0, 1.0, 1.0);
	else if(angDeg > 100.0)
		textureColor = vec4(1.0, 1.0, 0.0, 1.0);
	else if(angDeg > 90.0)
		textureColor = vec4(1.0, 0.0, 1.0, 1.0);
		*/
		
	//textureColor = vec4(vNormal, 1.0);

	//float maxAngDeg = 100.5;
	float maxAngDeg = 101.5;
	float minAngDeg = 90.0;

	float A = 1.0/(maxAngDeg-minAngDeg);
	float B = -A*minAngDeg;
	float alpha = A*angDeg+B;

	alpha *= alpha*alpha*alpha;
	if(alpha < 0.0 )
	alpha = 0.0;
	else if(alpha > 3.0 )
	alpha = 3.0;
	
	float alphaPlusPerDist = 4.0*(distToCam/equatorialRadius);
	if(alphaPlusPerDist > 1.0)
	alphaPlusPerDist = 1.0;
	//alphaPlusPerDist = 1.0;

	vcolor4 = vec4(alpha*0.75*alphaPlusPerDist, alpha*0.88*alphaPlusPerDist, alpha*alphaPlusPerDist, 1.0);
}