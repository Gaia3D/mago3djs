attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

uniform mat4 projectionMatrix;  
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 normalMatrix4;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

varying vec3 vNormal;
varying vec2 vTexCoord;  

void main()
{	
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);

    vNormal = (normalMatrix4 * vec4(-normal.x, -normal.y, -normal.z, 1.0)).xyz;
    vTexCoord = texCoord;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}