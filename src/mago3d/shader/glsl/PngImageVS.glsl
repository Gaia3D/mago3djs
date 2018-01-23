attribute vec3 a_position;
attribute vec2 a_texcoord;
uniform mat4 buildingRotMatrix;  
uniform mat4 ModelViewProjectionMatrixRelToEye;  
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
varying vec2 v_texcoord;

void main()
{
    vec4 position2 = vec4(a_position.xyz, 1.0);
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);

    v_texcoord = a_texcoord;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
