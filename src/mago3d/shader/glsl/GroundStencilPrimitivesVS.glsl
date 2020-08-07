attribute vec3 position;

uniform mat4 buildingRotMatrix; 
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 RefTransfMatrix;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 scaleLC;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform float near;
uniform float far;
uniform vec3 aditionalPosition;
uniform vec3 refTranslationVec;
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform
uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;

varying float flogz;
varying float Fcoef_half;

varying float depth;
varying vec3 vertexPos;
  
void main()
{	
	vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);
	vec4 rotatedPos;

	if(refMatrixType == 0)
	{
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}
	else if(refMatrixType == 1)
	{
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}
	else if(refMatrixType == 2)
	{
		rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}

    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    
    //linear depth in camera space (0..far)
	vec4 orthoPos = modelViewMatrixRelToEye * pos4;
    depth = orthoPos.z/far; // original.***


    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;

	if(bUseLogarithmicDepth)
	{
		// logarithmic zBuffer:
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
		// float Fcoef = 2.0 / log2(far + 1.0);
		// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;
		// flogz = 1.0 + gl_Position.w;
		//-----------------------------------------------------------------------------------
		//float C = 0.0001;
		flogz = 1.0 + gl_Position.w; // use "z" instead "w" for fast decoding.***
		Fcoef_half = 0.5 * uFCoef_logDepth;
	}

	vertexPos = orthoPos.xyz;
}