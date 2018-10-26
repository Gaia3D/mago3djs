attribute vec3 aPosition;

uniform sampler2D diffuseTex;
uniform mat4 projectionMatrix;  
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

varying vec3 vNormal;
varying vec3 vPosObjectCoord;
varying vec3 vPosCameraCoord;
varying vec3 vPosWorldCoord;

// Render a fullScreen quad (2 triangles).***
void main()
{
	vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
