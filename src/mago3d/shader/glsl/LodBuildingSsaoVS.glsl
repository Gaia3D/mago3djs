attribute vec3 position;
attribute vec3 normal;
attribute vec4 color4;
attribute vec2 texCoord;

uniform sampler2D diffuseTex;
uniform mat4 projectionMatrix;  
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
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

varying vec3 vNormal;
varying vec2 vTexCoord;   
varying vec3 uAmbientColor;
varying vec3 vLightWeighting;
varying vec4 vcolor4;
varying vec3 vertexPos;

void main()
{	
    vec4 rotatedPos = buildingRotMatrix * vec4(position.xyz + aditionalPosition.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
	vertexPos = vec3(modelViewMatrixRelToEye * pos4);
    vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);
    vLightWeighting = vec3(1.0, 1.0, 1.0);
    uAmbientColor = vec3(0.8, 0.8, 0.8);
    vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);
    vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);
    vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;
    float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);
    vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;

    if(bUse1Color)
    {
        vcolor4 = oneColor4;
    }
    else
    {
        vcolor4 = color4;
    }
    vTexCoord = texCoord;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
