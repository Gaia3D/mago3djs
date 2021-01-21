
	attribute vec3 position;
	attribute vec3 normal;
	attribute vec2 texCoord; // delete this. lights has no texCoords.
	attribute vec4 color4;
	
	uniform mat4 projectionMatrix;
	uniform mat4 buildingRotMatrix; 
	uniform mat4 modelViewMatrixRelToEye; 
	uniform mat4 ModelViewProjectionMatrixRelToEye;
	uniform mat4 RefTransfMatrix;
	uniform mat4 normalMatrix4;

	// Light position & direction.
	uniform vec3 buildingPosHIGH; // this is the lightPosition high.
	uniform vec3 buildingPosLOW; // this is the lightPosition low.
	uniform vec3 lightDirWC; // this is the lightDirection (in case of the spotLight type).

	uniform vec3 scaleLC;

	uniform vec3 encodedCameraPositionMCHigh;
	uniform vec3 encodedCameraPositionMCLow;
	uniform vec3 aditionalPosition;
	uniform vec3 refTranslationVec;
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform
	uniform bool bApplySpecularLighting;
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.
	
	uniform bool bUseLogarithmicDepth;
	uniform float uFCoef_logDepth;
	
	
	varying vec3 vNormal;
	varying vec2 vTexCoord;  
	varying vec3 vertexPosLC;
	varying vec4 vertexPosCC;
	varying float applySpecLighting;
	varying vec4 vColor4; // color from attributes

	varying vec3 vLightDirCC; 
	varying vec3 vLightPosCC; 
	varying float vDotProdLight;
	varying vec3 vCrossProdLight;

  
	varying float flogz;
	varying float Fcoef_half;

	
	void main()
    {	
		vertexPosLC = vec3(position.x, position.y, position.z);
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
		vec3 rotatedNormal = currentTMat * normal;

		// calculate the light position CC.*****************************************
		vec3 lightPosHighDiff = buildingPosHIGH - encodedCameraPositionMCHigh;
		vec3 lightPosLowDiff = buildingPosLOW - encodedCameraPositionMCLow;
		vec4 lightPosWC = vec4(lightPosHighDiff + lightPosLowDiff, 1.0);
		vec4 lightPosCC_aux = modelViewMatrixRelToEye * lightPosWC;
		vLightPosCC = lightPosCC_aux.xyz;
		//--------------------------------------------------------------------------

		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***
		vTexCoord = texCoord;

		// calculate lightDirection in cameraCoord.
		vLightDirCC = normalize((normalMatrix4 * vec4(lightDirWC, 1.0)).xyz); // original.***

		
		if(bApplySpecularLighting)
			applySpecLighting = 1.0;
		else
			applySpecLighting = -1.0;

		vec4 posPP = ModelViewProjectionMatrixRelToEye * pos4;
        gl_Position = posPP; // posProjected.
		vertexPosCC = modelViewMatrixRelToEye * pos4;
		
		// Calculate the lightFog intensity (case spotLight).*****************************************
		/*
		vec3 vectorToVertexCC = vertexPosCC.xyz - vLightPosCC;
		vec3 dirToVertexCCProjected = normalize(vectorToVertexCC);
		dirToVertexCCProjected.z = 0.0;
		vec3 lightDirCCProjected = vec3(vLightDirCC.x, vLightDirCC.y, 0.0);
		vDotProdLight = dot(dirToVertexCCProjected, lightDirCCProjected);
		// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of "vertexPosLC" to "vLightDirCC".
		vCrossProdLight = cross( dirToVertexCCProjected, lightDirCCProjected );
		*/

		// End calculate the lightFog intensity (case spotLight).-------------------------------------

		if(bUseLogarithmicDepth)
		{
			// logarithmic zBuffer:
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
			// float Fcoef = 2.0 / log2(far + 1.0);
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;
			// flogz = 1.0 + gl_Position.w;
			//---------------------------------------------------------------------------------
			//flogz = 1.0 + gl_Position.w;
			vec4 orthoPos = modelViewMatrixRelToEye * pos4;
			flogz = 1.0 - orthoPos.z;
			Fcoef_half = 0.5 * uFCoef_logDepth;
		}
		
		if(colorType == 1)
			vColor4 = color4;
	}