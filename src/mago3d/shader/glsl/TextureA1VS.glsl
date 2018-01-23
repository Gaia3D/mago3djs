attribute vec3 position;
attribute vec4 aVertexColor;
attribute vec2 aTextureCoord;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
varying vec4 vColor;
varying vec2 vTextureCoord;

void main()
{
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
 
    vColor=aVertexColor;
    vTextureCoord = aTextureCoord;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos;
}