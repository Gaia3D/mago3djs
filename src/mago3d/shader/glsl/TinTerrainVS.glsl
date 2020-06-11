
attribute vec3 position;
attribute vec3 normal;
attribute vec4 color4;
attribute vec2 texCoord;
attribute float altitude;

uniform mat4 projectionMatrix;  
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixInv;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 ModelViewProjectionMatrix;
uniform mat4 normalMatrix4;
uniform mat4 sunMatrix[2]; 
uniform mat4 buildingRotMatrix;  
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 sunPosHIGH[2];
uniform vec3 sunPosLOW[2];
uniform vec3 sunDirWC;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec3 aditionalPosition;
uniform vec4 oneColor4;
uniform bool bUse1Color;
uniform bool hasTexture;
uniform bool bIsMakingDepth;
uniform bool bExistAltitudes;
uniform float near;
uniform float far;
uniform bool bApplyShadow;
uniform int sunIdx;
uniform bool bApplySpecularLighting;
uniform bool bUseLogarithmicDepth;

varying float applySpecLighting;
varying vec3 vNormal;
varying vec2 vTexCoord;   
varying vec3 uAmbientColor;
varying vec3 vLightWeighting;
varying vec4 vcolor4;
varying vec3 v3Pos;
varying float depthValue;
varying float vFogAmount;

varying vec4 vPosRelToLight; 
varying vec3 vLightDir; 
varying vec3 vNormalWC;
varying float currSunIdx;
varying float vAltitude;

void main()
{	
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
	vNormal = normalize((normalMatrix4 * vec4(normal.x, normal.y, normal.z, 1.0)).xyz); // original.***
	vLightDir = vec3(normalMatrix4*vec4(sunDirWC.xyz, 1.0)).xyz;
	vAltitude = altitude;
	
	currSunIdx = -1.0; // initially no apply shadow.
	if(bApplyShadow && !bIsMakingDepth)
	{
		vec3 rotatedNormal = vec3(0.0, 0.0, 1.0); // provisional.***
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
		vec4 posRelToLightAux = currSunMatrix * pos4Sun;
		
		// now, check if "posRelToLightAux" is inside of the lightVolume (inside of the depthTexture of the light).
		vec3 posRelToLightNDC = posRelToLightAux.xyz / posRelToLightAux.w;
		vPosRelToLight = posRelToLightAux;
	}
	
	if(bApplySpecularLighting)
	{
		applySpecLighting = 1.0;
	}
	else{
		applySpecLighting = -1.0;
	}
	
	if(bIsMakingDepth)
	{
		
		depthValue = (modelViewMatrixRelToEye * pos4).z/far;
	}
	else
	{
		
		vTexCoord = texCoord;
	}
    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;

	if(bUseLogarithmicDepth)
	{
		
		// logarithmic zBuffer:
		// https://www.gamasutra.com/blogs/BranoKemen/20090812/85207/Logarithmic_Depth_Buffer.php
		// z = log(C*z + 1) / log(C*Far + 1) * w
		float z = gl_Position.z;
		float C = 0.001;
		float w = gl_Position.w;
		//gl_Position.z = log(C*z + 1.0) / log(C*far + 1.0) * w; // https://outerra.blogspot.com/2009/08/logarithmic-z-buffer.html
		//gl_Position.z = log(C*z + 1.0) / log(C*far + 1.0) * w + 1000.0/z; // son
		//if(gl_Position.z/gl_Position.w < -1.0 && gl_Position.z/gl_Position.w > -20000.0)
		//{
		//	gl_Position.z = -0.99;
		//	gl_Position.w = 1.0;
		//}
		////gl_Position.z = (2.0*log(C*w + 1.0) / log(C*far + 1.0) - 1.0) * w; // for openGL with depthRange(-1, 1);// https://outerra.blogspot.com/2009/08/logarithmic-z-buffer.html
		gl_Position.z = log(z/near) / log(far/near)*w; // another way.

		//**************************************************************
		// https://android.developreference.com/article/21119961/Logarithmic+Depth+Buffer+OpenGL
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
		//float Fcoef = 2.0 / log2(far + 1.0);
		//float Fcoef_half = 0.5 * Fcoef;
		//float flogz = 1.0 + w;
		//float fragDepth = log2(flogz) * Fcoef_half;
		//gl_Position.z = log2(max(1e-6, 1.0 + w)) * Fcoef - 1.0;
		//gl_Position.z = fragDepth;
		
		// Reverse depth buffer
		// https://outerra.blogspot.com/2012/11/maximizing-depth-buffer-range-and.html
		// https://forum.babylonjs.com/t/reverse-depth-buffer-z-buffer/6905
	}

	v3Pos = (modelViewMatrixRelToEye * pos4).xyz;

	// calculate fog amount.
	float fogParam = 1.15 * v3Pos.z/(far - 10000.0);
	float fogParam2 = fogParam*fogParam;
	vFogAmount = fogParam2*fogParam2;
}