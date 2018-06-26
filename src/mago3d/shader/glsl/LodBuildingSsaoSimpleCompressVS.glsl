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

uniform int posDataByteSize;
uniform int texCoordByteSize;
uniform vec3 compressionMaxPoint;
uniform vec3 compressionMinPoint;

varying vec3 vNormal;
varying vec2 vTexCoord;   
varying vec3 vLightWeighting;
varying vec4 vcolor4;

void main()
{	
    vec3 finalPos;
	vec2 finalTexCoord;
	if(posDataByteSize == 2)
	{
		// Decompress the position.*** 
		float rangeX = compressionMaxPoint.x - compressionMinPoint.x;
		float rangeY = compressionMaxPoint.y - compressionMinPoint.y;
		float rangeZ = compressionMaxPoint.z - compressionMinPoint.z;
		float shortMax = 65535.0;
		finalPos.x = (float(position.x) * rangeX / shortMax) + compressionMinPoint.x;
		finalPos.y = (float(position.y) * rangeY / shortMax) + compressionMinPoint.y;
		finalPos.z = (float(position.z) * rangeZ / shortMax) + compressionMinPoint.z;
	}
	else{
		finalPos = position;
	}
	vec4 rotatedPos = buildingRotMatrix * vec4(finalPos.xyz + aditionalPosition.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
    vec4 rotatedNormal = buildingRotMatrix * vec4(normal.xyz, 1.0);
    vNormal = (normalMatrix4 * vec4(rotatedNormal.x, rotatedNormal.y, rotatedNormal.z, 1.0)).xyz;

    if(bUse1Color)
    {
        vcolor4 = oneColor4;
    }
    else
    {
        vcolor4 = color4;
    }
	
    if(texCoordByteSize == 2)
	{
		// Decompress the texCoord.***
		float shortMax = 65535.0;
		finalTexCoord.x = float(texCoord.x) / shortMax;
		finalTexCoord.y = float(texCoord.y) / shortMax;
	}
	else
	{
		finalTexCoord = texCoord;
	}
    vTexCoord = finalTexCoord;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
