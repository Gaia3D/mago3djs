
	attribute vec3 position;
	attribute vec3 normal;
	attribute vec2 texCoord;
	attribute vec4 color4;
	
	uniform mat4 buildingRotMatrix; 
	uniform mat4 projectionMatrix;  
	uniform mat4 modelViewMatrix;
	uniform mat4 modelViewMatrixRelToEye; 
	uniform mat4 ModelViewProjectionMatrixRelToEye;
	uniform mat4 RefTransfMatrix;
	uniform mat4 normalMatrix4;
	uniform mat4 sunMatrix[2]; 
	uniform vec3 buildingPosHIGH;
	uniform vec3 buildingPosLOW;
	uniform float near;
	uniform float far;
	uniform vec3 scaleLC;
	uniform vec3 sunPosHIGH[2];
	uniform vec3 sunPosLOW[2];
	uniform int sunIdx;
	uniform vec3 sunDirWC;
	uniform vec3 encodedCameraPositionMCHigh;
	uniform vec3 encodedCameraPositionMCLow;
	uniform vec3 aditionalPosition;
	uniform vec3 refTranslationVec;
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform
	uniform bool bApplySpecularLighting;
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.
	
	uniform bool bApplyShadow;
	uniform bool bUseLogarithmicDepth;
	uniform float uFCoef_logDepth;
	
	

	varying vec3 vNormal;
	varying vec2 vTexCoord;  
	varying vec3 uAmbientColor;
	varying vec3 vLightWeighting;
	varying vec3 vertexPos;
	varying vec3 vertexPosLC;
	varying float applySpecLighting;
	varying vec4 vColor4; // color from attributes
	varying vec4 vPosRelToLight; // sun lighting.
	varying vec3 vLightDir; 
	varying vec3 vNormalWC; 
	varying float currSunIdx;  
	varying float discardFrag;
	varying float flogz;
	varying float Fcoef_half;
	varying float depth;

	
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
		
		
		
		vec3 uLightingDirection = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496); 
		uAmbientColor = vec3(1.0);
		vNormalWC = rotatedNormal;
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***
		vTexCoord = texCoord;
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);
		float directionalLightWeighting = 1.0;
		
		currSunIdx = -1.0; // initially no apply shadow.
		if(bApplyShadow)
		{
			//vLightDir = normalize(vec3(normalMatrix4 * vec4(sunDirWC.xyz, 1.0)).xyz); // test.***
			vLightDir = sunDirWC;
			vNormalWC = rotatedNormal;
						
			// the sun lights count are 2.
			
			vec3 currSunPosLOW;
			vec3 currSunPosHIGH;
			mat4 currSunMatrix;
			if(sunIdx == 0)
			{
				currSunPosLOW = sunPosLOW[0];
				currSunPosHIGH = sunPosHIGH[0];
				currSunMatrix = sunMatrix[0];
				currSunIdx = 0.5;
			}
			else if(sunIdx == 1)
			{
				currSunPosLOW = sunPosLOW[1];
				currSunPosHIGH = sunPosHIGH[1];
				currSunMatrix = sunMatrix[1];
				currSunIdx = 1.5;
			}
			
			// Calculate the vertex relative to light.***
			vec3 highDifferenceSun = objPosHigh.xyz - currSunPosHIGH.xyz;
			vec3 lowDifferenceSun = objPosLow.xyz - currSunPosLOW.xyz;
			vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);
			vPosRelToLight = currSunMatrix * pos4Sun;
			
			uLightingDirection = sunDirWC; 
			//directionalLightColor = vec3(0.9, 0.9, 0.9);
			directionalLightWeighting = max(dot(rotatedNormal, -sunDirWC), 0.0);
		}
		else
		{
			uAmbientColor = vec3(0.8);
			uLightingDirection = normalize(vec3(0.6, 0.6, 0.6));
			//uLightingDirection = normalize(vec3(0.2, 0.6, 1.0));
			directionalLightWeighting = max(dot(vNormal, uLightingDirection), 0.0);
		}

		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***
		
		if(bApplySpecularLighting)
			applySpecLighting = 1.0;
		else
			applySpecLighting = -1.0;

        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;
		vertexPos = orthoPos.xyz;
		depth = (-orthoPos.z)/(far); // the correct value.

		if(bUseLogarithmicDepth)
		{
			// logarithmic zBuffer:
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
			// float Fcoef = 2.0 / log2(far + 1.0);
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;
			// flogz = 1.0 + gl_Position.w;
			//---------------------------------------------------------------------------------
			//flogz = 1.0 + gl_Position.w;
			flogz = 1.0 - orthoPos.z;
			Fcoef_half = 0.5 * uFCoef_logDepth;
		}
		
		if(colorType == 1)
			vColor4 = color4;

		//if(orthoPos.z < 0.0)
		//aColor4 = vec4(1.0, 0.0, 0.0, 1.0);
		//else
		//aColor4 = vec4(0.0, 1.0, 0.0, 1.0);
		gl_PointSize = 5.0;
	}