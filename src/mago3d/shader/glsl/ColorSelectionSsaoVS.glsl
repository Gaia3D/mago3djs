attribute vec3 position;

uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 RefTransfMatrix;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec3 aditionalPosition;
uniform vec3 refTranslationVec;
uniform int refMatrixType;

void main()
{	
    vec4 rotatedPos;
	if(refMatrixType == 0)
	{
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}
	else if(refMatrixType == 1)
	{
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}
	else if(refMatrixType == 2)
	{
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    
    gl_PointSize = 10.0;
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
}
