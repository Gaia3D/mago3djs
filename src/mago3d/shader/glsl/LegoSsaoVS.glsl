attribute vec3 position;
attribute vec3 normal;
attribute vec4 color4;
attribute vec2 texCoord;

uniform mat4 projectionMatrix;  
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 RefTransfMatrix;
uniform mat4 normalMatrix4;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec3 aditionalPosition;

varying vec3 vNormal;
varying vec2 vTexCoord;  
varying vec3 uAmbientColor;
varying vec3 vLightWeighting;
varying vec4 vcolor4;

void main()
{	
    vec4 rotatedPos = RefTransfMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    
    vec3 rotatedNormal = mat3(RefTransfMatrix) * normal;
    vLightWeighting = vec3(1.0, 1.0, 1.0);
    uAmbientColor = vec3(0.8, 0.8, 0.8);
    vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);
    vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);
    vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;

    float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);
    vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;
    vcolor4 = color4;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
