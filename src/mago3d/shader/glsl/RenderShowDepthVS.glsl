attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;

uniform mat4 buildingRotMatrix; 
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 RefTransfMatrix;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 normalMatrix4;
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

uniform bool bHasTexture; // indicates if texture is PNG, that has pixels with alpha = 0.0.***

varying float flogz;
varying float Fcoef_half;

varying float depth;
varying vec3 vertexPos;
varying vec2 vTexCoord; // used only if texture is PNG, that has pixels with alpha = 0.0.***
varying vec3 vNormal;
  
void main()
{	
	vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);
	vec4 rotatedPos;

	mat3 currentTMat;

	if(refMatrixType == 0)
	{
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
		currentTMat = mat3(buildingRotMatrix);
	}
	else if(refMatrixType == 1)
	{
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
		currentTMat = mat3(buildingRotMatrix);
	}
	else if(refMatrixType == 2)
	{
		rotatedPos = RefTransfMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
		currentTMat = mat3(RefTransfMatrix);
	}

    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    
    //linear depth in camera space (0..far)
	vec4 orthoPos = modelViewMatrixRelToEye * pos4;
    depth = orthoPos.z/far; // original.***
	//depth = (orthoPos.z-near)/(far-near); // correct.***
	
	// Calculate normalCC.***
	vec3 rotatedNormal = currentTMat * normal;
	vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***

	/*
	float z_ndc = (2.0 * z_window - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);
	vec4 viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);
	vec3 posCC = viewPosH.xyz/viewPosH.w;
	vec4 posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);
	*/


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
		flogz = 1.0 + gl_Position.z; // use "z" instead "w" for fast decoding.***
		Fcoef_half = 0.5 * uFCoef_logDepth;
	}

	vertexPos = orthoPos.xyz;

	if(bHasTexture)
	{
		vTexCoord = texCoord;
	}
}