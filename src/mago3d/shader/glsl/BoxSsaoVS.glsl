attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;
attribute vec4 color4;

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
uniform bool bUseNormal;
uniform vec3 scale;
uniform bool bScale;

varying vec3 vNormal;
varying vec2 vTexCoord;  
varying vec3 uAmbientColor;
varying vec3 vLightWeighting;
varying vec4 vcolor4;

void main()
{	
    vec4 position2 = vec4(position.xyz, 1.0);
    if(bScale)
    {
        position2.x *= scale.x;
        position2.y *= scale.y;
        position2.z *= scale.z;
    }
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz + aditionalPosition.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    if(bUseNormal)
    {
		vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);
		vLightWeighting = vec3(1.0, 1.0, 1.0);
		uAmbientColor = vec3(0.8, 0.8, 0.8);
		vec3 uLightingDirection = vec3(0.5, 0.5, 0.5);
		vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);
		vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;
		float directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);
		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting;
	}
    if(bUse1Color)
    {
        vcolor4 = oneColor4;
    }
    else
    {
        vcolor4 = color4;
    }

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
