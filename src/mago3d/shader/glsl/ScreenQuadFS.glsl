#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D shadowMapTex;
uniform sampler2D shadowMapTex2;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 modelViewMatrixInv;
uniform mat4 modelViewProjectionMatrixInv;
uniform mat4 modelViewMatrixRelToEyeInv;
uniform mat4 projectionMatrix;
uniform mat4 projectionMatrixInv;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform bool bApplyShadow;
uniform mat4 sunMatrix[2]; 
uniform vec3 sunPosHIGH[2];
uniform vec3 sunPosLOW[2];
uniform int sunIdx;
uniform float screenWidth;    
uniform float screenHeight;   
//uniform float shadowMapWidth;    
//uniform float shadowMapHeight;
uniform float near;
uniform float far;
uniform float fov;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;
varying vec4 vColor; 

vec3 getViewRay(vec2 tc)
{
    float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
}

float unpackDepth(vec4 packedDepth)
{
	// See Aras Pranckevičius' post Encoding Floats to RGBA
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float UnpackDepth32( in vec4 pack )
{
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);
}  

float getDepthShadowMap(vec2 coord)
{
	// currSunIdx
	if(sunIdx == 0)
	{
		return UnpackDepth32(texture2D(shadowMapTex, coord.xy));
	}
    else if(sunIdx ==1)
	{
		return UnpackDepth32(texture2D(shadowMapTex2, coord.xy));
	}
	else
		return -1.0;
}

bool isInShadow(vec4 pointWC, int currSunIdx)
{
	bool inShadow = false;
	vec3 currSunPosLOW;
	vec3 currSunPosHIGH;
	mat4 currSunMatrix;
	if(currSunIdx == 0)
	{
		currSunPosLOW = sunPosLOW[0];
		currSunPosHIGH = sunPosHIGH[0];
		currSunMatrix = sunMatrix[0];
	}
	else if(currSunIdx == 1)
	{
		currSunPosLOW = sunPosLOW[1];
		currSunPosHIGH = sunPosHIGH[1];
		currSunMatrix = sunMatrix[1];
	}
	else
	return false;
	
		
	vec3 highDifferenceSun = pointWC.xyz -currSunPosHIGH.xyz;
	vec3 lowDifferenceSun = -currSunPosLOW.xyz;
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);
	vec4 vPosRelToLight = currSunMatrix * pos4Sun;

	vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;
	float tolerance = 0.9963;
	posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range
	if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)
	{
		if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)
		{
			float depthRelToLight;
			if(currSunIdx == 0)
			{depthRelToLight = UnpackDepth32(texture2D(shadowMapTex, posRelToLight.xy));}
			else if(currSunIdx == 1)
			{depthRelToLight = UnpackDepth32(texture2D(shadowMapTex2, posRelToLight.xy));}
			if(posRelToLight.z > depthRelToLight*tolerance )
			{
				inShadow = true;
			}
		}
	}
	
	return inShadow;
}

void main()
{
	float shadow_occlusion = 1.0;
	float alpha = 0.0;
	vec4 finalColor;
	finalColor = vec4(0.2, 0.2, 0.2, 0.8);
	if(bApplyShadow)
	{
		// the sun lights count are 2.
		// 1rst, calculate the pixelPosWC.
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
		float z_window  = unpackDepth(texture2D(depthTex, screenPos.xy)); // z_window  is [0.0, 1.0] range depth.
		if(z_window < 0.001)
		discard;

		vec3 ray = getViewRay(screenPos);
		
		// https://stackoverflow.com/questions/11277501/how-to-recover-view-space-position-given-view-space-depth-value-and-ndc-xy
		float depthRange_near = 0.0;
		float depthRange_far = 1.0;
		float x_ndc = 2.0 * screenPos.x - 1.0;
		float y_ndc = 2.0 * screenPos.y - 1.0;
		float z_ndc = (2.0 * z_window - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);
		
		vec4 viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);
		vec3 posCC = viewPosH.xyz/viewPosH.w;
		vec4 posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);
		//----------------------------------------------------------------
	
		// 2nd, calculate the vertex relative to light.***
		// 1rst, try with the closest sun. sunIdx = 0.
		bool pointIsinShadow = isInShadow(posWC, 0);
		if(!pointIsinShadow)
		{
			pointIsinShadow = isInShadow(posWC, 1);
		}

		if(pointIsinShadow)
		{
			shadow_occlusion = 0.5;
			alpha = 0.5;
		}
		
	}
    gl_FragColor = vec4(finalColor.rgb*shadow_occlusion, alpha);
}