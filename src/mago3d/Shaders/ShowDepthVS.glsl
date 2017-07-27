attribute vec3 position;
attribute vec3 normal;

uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 normalMatrix3;
uniform mat4 normalMatrix4;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform float near;
uniform float far;

varying vec3 vN;
varying float depth;  
varying vec4 vVSPos;

void main()
{	
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);

    vN = normalize((normalMatrix4 * vec4(normal, 1.0)).xyz);
    
    //linear depth in camera space (0..far)
    depth = (modelViewMatrixRelToEye * pos4).z/far;
    vVSPos = modelViewMatrixRelToEye * pos4;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
