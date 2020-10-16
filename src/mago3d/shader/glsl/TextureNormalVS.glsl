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
attribute vec3 aVertexNormal;
varying vec3 uAmbientColor;
varying vec3 vLightWeighting;
uniform mat3 uNMatrix;

void main()
{
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    
    vColor = aVertexColor;
    vTextureCoord = aTextureCoord;
    
    vLightWeighting = vec3(1.0, 1.0, 1.0);
    uAmbientColor = vec3(0.7, 0.7, 0.7);
    vec3 uLightingDirection = vec3(0.8, 0.2, -0.9);
    vec3 directionalLightColor = vec3(0.4, 0.4, 0.4);
    vec3 transformedNormal = uNMatrix * aVertexNormal;
    float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
    vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos;
}
