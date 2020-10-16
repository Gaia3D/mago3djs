attribute vec3 position;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
attribute vec4 color;
varying vec4 vColor;

void main()
{
    vec3 highDifference = -encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = position.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos = vec4(position.xyz, 1.0);

    vColor=color;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos;
}