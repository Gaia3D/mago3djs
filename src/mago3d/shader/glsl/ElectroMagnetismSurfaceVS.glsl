
	attribute vec3 position;
	attribute vec3 normal;
	attribute vec2 texCoord;
	attribute vec4 color4;
	attribute float value;
	
	uniform mat4 buildingRotMatrix; 

	uniform mat4 modelViewMatrixRelToEye; 
	uniform mat4 ModelViewProjectionMatrixRelToEye;

	uniform mat4 normalMatrix4;
	uniform vec3 buildingPosHIGH;
	uniform vec3 buildingPosLOW;
	uniform float near;
	uniform float far;
	uniform vec3 scaleLC;

	uniform vec3 encodedCameraPositionMCHigh;
	uniform vec3 encodedCameraPositionMCLow;
	uniform vec3 aditionalPosition;

	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.
	
	uniform bool bUseLogarithmicDepth;
	uniform float uFCoef_logDepth;
	
	

	varying vec3 vNormal;
	varying vec2 vTexCoord;  
	varying vec3 uAmbientColor;
	varying vec3 vLightWeighting;
	varying vec3 vertexPos;
	varying vec3 vertexPosLC;
	varying vec4 vColor4; // color from attributes
	varying vec3 vLightDir; 
	varying vec3 vNormalWC; 
	varying float flogz;
	varying float Fcoef_half;
	varying float vDepth;
	varying float vSoundValue;

	
	void main()
    {	
		vertexPosLC = vec3(position.x, position.y, position.z);
		vec4 scaledPos = vec4(position.x * scaleLC.x, position.y * scaleLC.y, position.z * scaleLC.z, 1.0);
		vec4 rotatedPos;
		mat3 currentTMat;
		rotatedPos = buildingRotMatrix * vec4(scaledPos.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
		currentTMat = mat3(buildingRotMatrix);

		vec3 objPosHigh = buildingPosHIGH;
		vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
		vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
		vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
		vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
		vec3 rotatedNormal = currentTMat * normal;
		
		
		uAmbientColor = vec3(1.0);
		vNormalWC = rotatedNormal;
		vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***
		vTexCoord = texCoord;
		vLightDir = vec3(-0.1320580393075943, -0.9903827905654907, 0.041261956095695496);
		vec3 directionalLightColor = vec3(0.7, 0.7, 0.7);
		float directionalLightWeighting = 1.0;


		vLightWeighting = uAmbientColor + directionalLightColor * directionalLightWeighting; // original.***
		

        gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
		vec4 orthoPos = modelViewMatrixRelToEye * pos4;
		vertexPos = orthoPos.xyz;
		vDepth = -orthoPos.z/far;

		vSoundValue = value;

		if(bUseLogarithmicDepth)
		{
			// logarithmic zBuffer:
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
			// float Fcoef = 2.0 / log2(far + 1.0);
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;
			// flogz = 1.0 + gl_Position.w;
			//---------------------------------------------------------------------------------
			flogz = 1.0 + gl_Position.w;
			Fcoef_half = 0.5 * uFCoef_logDepth;
		}
		
		if(colorType == 1)
			vColor4 = color4;

		gl_PointSize = 5.0;
	}