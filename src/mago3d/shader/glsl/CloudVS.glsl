attribute vec3 position;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 cloudPosHIGH;
uniform vec3 cloudPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
attribute vec3 color;
varying vec3 vColor;

void main()
{
    vec3 objPosHigh = cloudPosHIGH;
    vec3 objPosLow = cloudPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);

    vColor=color;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos;
}