#ifdef GL_ES
    precision highp float;
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

#define M_PI 3.1415926535897932384626433832795

uniform sampler2D depthTex; // 0
uniform sampler2D normalTex; // 1
uniform sampler2D albedoTex; // 2
uniform sampler2D shadowMapTex; // 3
uniform sampler2D shadowMapTex2; // 4
uniform sampler2D ssaoTex; // 5
uniform sampler2D diffuseLightTex; // 6
uniform sampler2D specularLightTex; // 7

uniform mat4 modelViewMatrixRelToEyeInv;
uniform mat4 projectionMatrixInv;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

uniform float near;
uniform float far; 
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    

uniform bool bApplyShadow; // sun shadows on cesium terrain.
uniform bool bApplyMagoShadow;
uniform bool bSilhouette;
uniform bool bFxaa;
uniform bool bApplySsao;

uniform mat4 sunMatrix[2]; 
uniform vec3 sunPosHIGH[2];
uniform vec3 sunPosLOW[2];
uniform vec3 sunDirCC;
uniform vec3 sunDirWC;
uniform float screenWidth;    
uniform float screenHeight;  
uniform vec2 ussaoTexSize;
uniform vec2 uNearFarArray[4];
uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;
uniform float uSceneDayNightLightingFactor; // day -> 1.0; night -> 0.0
uniform vec3 uBrightnessContrastSaturation;
uniform int uBrightnessContrastType; // 0= only f4d, 1= f4d & terrain.

uniform vec3 uAmbientLight;

const float Epsilon = 1e-10;

// https://ndotl.wordpress.com/2018/08/29/baking-artifact-free-lightmaps/
// voxel ilum : https://publications.lib.chalmers.se/records/fulltext/256137/256137.pdf

float unpackDepth(vec4 packedDepth)
{
	// See Aras Pranckevičius' post Encoding Floats to RGBA
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
	//vec4 packDepth( float v ) // function to packDepth.***
	//{
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
	//	enc = fract(enc);
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);
	//	return enc;
	//}
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec4 getNormal(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(normalTex, texCoord);
    return decodeNormal(encodedNormal);
}

vec3 getViewRay(vec2 tc)
{
	float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
	
    return ray;                      
} 

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}

bool isInShadow(vec4 pointCC, int currSunIdx, inout bool isUnderSun)
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

	
	vec3 highDifferenceSun = -currSunPosHIGH.xyz + encodedCameraPositionMCHigh;
	vec3 lowDifferenceSun = pointCC.xyz -currSunPosLOW.xyz + encodedCameraPositionMCLow;
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);
	vec4 vPosRelToLight = currSunMatrix * pos4Sun;

	vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;
	float tolerance = 0.9963;
	tolerance = 0.9967; // test.
	posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range
	if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)
	{
		if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)
		{
			float depthRelToLight;
			if(currSunIdx == 0)
			{
				depthRelToLight = unpackDepth(texture2D(shadowMapTex, posRelToLight.xy));
			}
			else if(currSunIdx == 1)
			{
				depthRelToLight = unpackDepth(texture2D(shadowMapTex2, posRelToLight.xy));
			}

			//if(depthRelToLight < 0.1)
			//return false;

			if(posRelToLight.z > depthRelToLight*tolerance )
			{
				inShadow = true;
			}

			isUnderSun = true;
		}
	}
	
	return inShadow;
}

/*
void make_kernel(inout vec4 n[9], vec2 coord)
{
	// We cannot use depthTex bcos there are multiple frustums.***
	//------------------------------------------------------------
	float w = 1.0 / screenWidth;
	float h = 1.0 / screenHeight;

	n[0] = texture2D(depthTex, coord + vec2( -w, -h));
	n[1] = texture2D(depthTex, coord + vec2(0.0, -h));
	n[2] = texture2D(depthTex, coord + vec2(  w, -h));
	n[3] = texture2D(depthTex, coord + vec2( -w, 0.0));
	n[4] = texture2D(depthTex, coord);
	n[5] = texture2D(depthTex, coord + vec2(  w, 0.0));
	n[6] = texture2D(depthTex, coord + vec2( -w, h));
	n[7] = texture2D(depthTex, coord + vec2(0.0, h));
	n[8] = texture2D(depthTex, coord + vec2(  w, h));
}
*/

void make_kernel(inout vec4 n[9], vec2 coord)
{
	float w = 1.0 / screenWidth;
	float h = 1.0 / screenHeight;

	n[0] = texture2D(normalTex, coord + vec2( -w, -h));
	n[1] = texture2D(normalTex, coord + vec2(0.0, -h));
	n[2] = texture2D(normalTex, coord + vec2(  w, -h));
	n[3] = texture2D(normalTex, coord + vec2( -w, 0.0));
	n[4] = texture2D(normalTex, coord);
	n[5] = texture2D(normalTex, coord + vec2(  w, 0.0));
	n[6] = texture2D(normalTex, coord + vec2( -w, h));
	n[7] = texture2D(normalTex, coord + vec2(0.0, h));
	n[8] = texture2D(normalTex, coord + vec2(  w, h));
}


int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)
{
    // Check the type of the data.******************
    // frustumIdx 0 .. 3 -> general geometry data.
    // frustumIdx 10 .. 13 -> tinTerrain data.
    // frustumIdx 20 .. 23 -> points cloud data.
    //----------------------------------------------
    int realFrustumIdx = -1;
    
     if(estimatedFrustumIdx >= 10)
    {
        estimatedFrustumIdx -= 10;
        if(estimatedFrustumIdx >= 10)
        {
            // points cloud data.
            estimatedFrustumIdx -= 10;
            dataType = 2;
        }
        else
        {
            // tinTerrain data.
            dataType = 1;
        }
    }
    else
    {
        // general geomtry.
        dataType = 0;
    }

    realFrustumIdx = estimatedFrustumIdx;
    return realFrustumIdx;
}

vec2 getNearFar_byFrustumIdx(in int frustumIdx)
{
    vec2 nearFar;
    if(frustumIdx == 0)
    {
        nearFar = uNearFarArray[0];
    }
    else if(frustumIdx == 1)
    {
        nearFar = uNearFarArray[1];
    }
    else if(frustumIdx == 2)
    {
        nearFar = uNearFarArray[2];
    }
    else if(frustumIdx == 3)
    {
        nearFar = uNearFarArray[3];
    }

    return nearFar;
}

float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z*0.0001;
        float Fcoef_half = uFCoef_logDepth/2.0;
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = (flogzAux - 1.0);
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
}

float getRealDepth(in vec2 coord, in vec2 nearFar)
{
	return getDepth(coord) * (nearFar.y);
}

float getZDist(in vec2 coord)
{
	// This function is equivalent to "getRealDepth", but this is used when unknown the "far".***
	vec4 normal4 = getNormal(coord);
	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);
	vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
	//float currFar = nearFar.y;
	return getRealDepth(coord, nearFar);
}

bool isEdge(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y)
{
	bool bIsEdge = false;

	// 1rst, check by normals.***
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y*1.0)).xyz;
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x*1.0, screenPos.y)).xyz;
	vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;
	vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;

	float minDot = 0.3;

	if(dot(normal, normal_up) < minDot)
	{ return true; }

	if(dot(normal, normal_right) < minDot)
	{ return true; }

	if(dot(normal, normal_down) < minDot)
	{ return true; }

	if(dot(normal, normal_left) < minDot)
	{ return true; }

	// Now, check by depth.***


	return bIsEdge;
}

bool isEdge_byNormals(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y)
{
	bool bIsEdge = false;

	float minDot = 0.3;

	// 1rst, check by normals.***
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y*1.0)).xyz;
	if(dot(normal, normal_up) < minDot)
	{ return true; }

	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x*1.0, screenPos.y)).xyz;
	if(dot(normal, normal_right) < minDot)
	{ return true; }

	vec3 normal_upRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y)).xyz;
	if(dot(normal, normal_upRight) < minDot)
	{ return true; }

	return bIsEdge;
}

bool _isEdge_byDepth(in float curZDist, vec2 screenPos)
{
	float minDist = 1.0;
    float adjacentZDist = getZDist(screenPos);
	float diff = abs(curZDist - adjacentZDist);
	if(diff / curZDist > 0.01 && diff > minDist)
	{ return true; }
    else{
        return false;
    }
}

bool isEdge_byDepth(vec2 screenPos, float pixelSize_x, float pixelSize_y)
{
	float curZDist = getZDist(screenPos);

    if(_isEdge_byDepth(curZDist, vec2(screenPos.x, screenPos.y + pixelSize_y*1.0))) // up.
    { return true; }

    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y*1.0))) // up-right.
    { return true; }

    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y))) // right.
    { return true; }
	/*
    if(_isEdge_byDepth(curZDist, vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y*1.0)))
    { return true; }

    if(_isEdge_byDepth(curZDist, vec2(screenPos.x, screenPos.y - pixelSize_y*1.0)))
    { return true; }

    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y*1.0)))
    { return true; }

    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y)))
    { return true; }

    if(_isEdge_byDepth(curZDist, vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y*1.0)))
    { return true; }
	*/
    return false;
}

vec4 getShadedAlbedo(vec2 screenPos, vec3 lightingDirection, vec3 ambientColor, vec3 directionalLightColor)
{
	vec4 albedo = texture2D(albedoTex, screenPos);
	//vec4 diffuseLight = texture2D(diffuseLightTex, screenPos) + vec4(uSceneDayNightLightingFactor);
	vec4 normal = getNormal(screenPos);

	float directionalLightWeighting = max(dot(normal.xyz, lightingDirection), 0.0);
	
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***
	vec4 shadedAlbedo = albedo * vec4(lightWeighting, 1.0);

	return shadedAlbedo;
}

vec3 RGBtoHSV(in vec3 RGB)
{
    vec4  P   = (RGB.g < RGB.b) ? vec4(RGB.bg, -1.0, 2.0/3.0) : vec4(RGB.gb, 0.0, -1.0/3.0);
    vec4  Q   = (RGB.r < P.x) ? vec4(P.xyw, RGB.r) : vec4(RGB.r, P.yzx);
    float C   = Q.x - min(Q.w, Q.y);
    float H   = abs((Q.w - Q.y) / (6.0 * C + Epsilon) + Q.z);
    vec3  HCV = vec3(H, C, Q.x);
    float S   = HCV.y / (HCV.z + Epsilon);
    return vec3(HCV.x, S, HCV.z);
}

vec3 HSVtoRGB(in vec3 HSV)
{
    float H   = HSV.x;
    float R   = abs(H * 6.0 - 3.0) - 1.0;
    float G   = 2.0 - abs(H * 6.0 - 2.0);
    float B   = 2.0 - abs(H * 6.0 - 4.0);
    vec3  RGB = clamp( vec3(R,G,B), 0.0, 1.0 );
    return ((RGB - 1.0) * HSV.y + 1.0) * HSV.z;
}


vec4 HueSatBright_color(vec4 color4, float saturation)
{
	// https://stackoverflow.com/questions/53879537/increase-the-intensity-of-texture-in-shader-code-opengl
	vec4 color = color4;
	vec3 hsv = RGBtoHSV(color.rgb);

	// saturation range : -1.0 to 1.0
	/*
	saturation is a value in the range [0.0, 1.0]. 0.5 means that the image is kept as it is. 
	It saturation is greater 0.5 the image is saturated and if it is less than 0.5 the image is bleached
	*/
	float sat = saturation + 0.5;
	hsv.y *= (sat * 2.0);

	color.rgb = HSVtoRGB(hsv);

    // Save the result
    return color;
}

vec3 brightnessContrast(vec3 value, float brightness, float contrast)
{
	// contrast range : -1.0 to 1.0
	// brightness range : -1.0 to 1.0
	float internContrast = contrast + 1.0;
    return (value - 0.5) * internContrast + 0.5 + brightness;
}

vec3 Gamma(vec3 value, float param)
{
    return vec3(pow(abs(value.r), param),pow(abs(value.g), param),pow(abs(value.b), param));
}

void getNormal_dataType_andFar(in vec2 coord, inout vec3 normal, inout int dataType, inout vec2 nearFar)
{
	vec4 normal4 = getNormal(coord);
	normal = normal4.xyz;
	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);
	nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
}


void main()
{
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);

	// 1rst, check if this is silhouette rendering.
	if(bSilhouette)
	{
		// Check the adjacent pixels to decide if this is silhouette.
		// Analize a 5x5 rectangle of the depthTexture: if there are objectDepth & backgroundDepth => is silhouette.
		float pixelSizeW = 1.0/screenWidth;
		float pixelSizeH = 1.0/screenHeight;
		int objectDepthCount = 0;
		int backgroundDepthCount = 0;
		float tolerance = 0.9963;
		tolerance = 0.9963;

		float origin_z_window  = unpackDepth(texture2D(depthTex, screenPos.xy)); // z_window  is [0.0, 1.0] range depth.
		if(origin_z_window > tolerance)
		{
		
			vec2 screenPos_LD = vec2(screenPos.x - pixelSizeW*2.5, screenPos.y - pixelSizeH*2.5); // left-down corner.
			
			for(int w = -10; w<15; w+= 4)
			{
				for(int h=-10; h<15; h+= 4)
				{
					vec2 screenPosAux = vec2(screenPos_LD.x + pixelSizeW*float(w), screenPos_LD.y + pixelSizeH*float(h));
					float z_window  = unpackDepth(texture2D(depthTex, screenPosAux.xy)); // z_window  is [0.0, 1.0] range depth.

					if(z_window > tolerance)
					{
						// is background.
						backgroundDepthCount += 1;
					}
					else
					{
						// is object.
						objectDepthCount += 1;
					}

					//if(backgroundDepthCount > 0 && objectDepthCount > 0)
					//{
						// is silhouette.
						//gl_FragData[0] = vec4(0.2, 1.0, 0.3, 1.0);
						//return;
					//}
					
				}
			}

			if(backgroundDepthCount > 0 && objectDepthCount > 0)
			{
				// is silhouette.
				float countsDif = abs(float(objectDepthCount)/16.0);
				//gl_FragData[0] = vec4(0.2, 1.0, 0.3, countsDif);
				vec3 silhouetteCol3 = vec3(51.0/255.0, 206.0/255.0, 255.0/255.0);
				gl_FragData[0] = vec4(silhouetteCol3, countsDif);
				return;
			}
		}

		// New:
		// Try to use a xCross pixels sampling data. TODO:
		return;
	}
	
	float shadow_occlusion = 1.0;
	float alpha = 0.0;
	vec4 finalColor;
	finalColor = vec4(0.2, 0.2, 0.2, 0.8);

	vec4 normal4 = getNormal(screenPos);
	vec3 normal = normal4.xyz;
	if(length(normal) < 0.1)
	discard;


	int estimatedFrustumIdx = int(floor(normal4.w * 100.0));
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);
	vec2 nearFar_origin = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear_origin = nearFar_origin.x;
	float currFar_origin = nearFar_origin.y;
	
	vec3 ambientColor = vec3(0.0);
	vec3 directionalLightColor = vec3(0.9, 0.9, 0.9);
	float directionalLightWeighting = 1.0;

	// sunShadow vars.***
	bool pointIsinShadow = false;
	bool isUnderSun = false;
	bool sunInAntipodas = false;
	if(bApplyMagoShadow)
	{
		// 1rst, check normal vs sunDirCC.
		float dotAux = dot(sunDirCC, normal);
		if(dotAux > -0.1)
		{
			sunInAntipodas = true;
			shadow_occlusion = 0.5;
		}

		if(!sunInAntipodas)
		{
			float linearDepth = getDepth(screenPos);
			// calculate the real pos of origin.
			float origin_zDist = linearDepth * currFar_origin; // original.
			vec3 posCC = getViewRay(screenPos, origin_zDist);
			vec4 posWCRelToEye = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0);
			//posWC += vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 0.0);
			//------------------------------------------------------------------------------------------------------------------------------
			// 2nd, calculate the vertex relative to light.***
			// 1rst, try with the closest sun. sunIdx = 0.
			
			pointIsinShadow = isInShadow(posWCRelToEye, 0, isUnderSun);
			if(!isUnderSun)
			{
				pointIsinShadow = isInShadow(posWCRelToEye, 1, isUnderSun);
			}

			if(isUnderSun)
			{
				if(pointIsinShadow)
				{
					shadow_occlusion = 0.5;
					alpha = 0.5;
				}
			}
		}
		
		// calculate sunDirCC.
		//vec4 sunDirCC = modelViewMatrixRelToEyeInv * vec4(sunDirWC, 1.0);
		//directionalLightWeighting = max(dot(normal, -sunDirCC.xyz), 0.0);
	}
	
	ambientColor = uAmbientLight;
	// https://learnopengl.com/Lighting/Basic-Lighting
	vec3 lightingDirection = normalize(vec3(0.6, 0.6, 0.6));
	//vec3 lightingDirection = normalize(vec3(0.0, 0.0, 1.0)); // lightDir = camDir.***
	directionalLightWeighting = max(dot(normal, lightingDirection), 0.0);
	
	// 1rst, take the albedo.
	vec4 albedo = texture2D(albedoTex, screenPos);

	// Color correction.**********************************************************************************
	if(uBrightnessContrastType == 0) // apply brightness & contrast for f4d objects.
	{
		if(dataType == 0)
		{
			float brightness = uBrightnessContrastSaturation.x; // range [0.0, 1.0].
			float contrast = uBrightnessContrastSaturation.y; // range [0.0, 1.0].
			float saturation = uBrightnessContrastSaturation.z; // range [0.0, 1.0].
			albedo.rgb = brightnessContrast(albedo.rgb, brightness, contrast);
			albedo = HueSatBright_color(albedo, saturation);

			//albedo.rgb = Gamma(albedo.rgb, 1.1);
		}
	}
	else if(uBrightnessContrastType == 1) // apply brightness & contrast for f4d objects and terrain
	{
		float brightness = uBrightnessContrastSaturation.x; // range [0.0, 1.0].
		float contrast = uBrightnessContrastSaturation.y; // range [0.0, 1.0].
		float saturation = uBrightnessContrastSaturation.z; // range [0.0, 1.0].
		albedo.rgb = brightnessContrast(albedo.rgb, brightness, contrast);
		albedo = HueSatBright_color(albedo, saturation);

		//albedo.rgb = Gamma(albedo.rgb, 1.1);
	}
	// End color correction.---------------------------------------------------------------------------

	vec4 diffuseLight = texture2D(diffuseLightTex, screenPos);
	float diffuseLightModul = length(diffuseLight.xyz);

	//vec3 ray = getViewRay(screenPos, 1.0); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
	//float scalarProd = abs(dot(normal, normalize(-ray)));

	
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***

	//lightWeighting += diffuseLight.xyz;
	if(dataType != 1)
	{
		albedo *= vec4(lightWeighting, 1.0) ;
	}
	else
	{
		// This is terrain. provisionally do nothing.
		//albedo *= vec4(lightWeighting, 1.0);
	}

	finalColor = albedo;
	
	if(bApplySsao)
	{
		// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.

		//ssaoFromDepthTex
		float pixelSize_x = 1.0/screenWidth;
		float pixelSize_y = 1.0/screenHeight;
		float pixelSizeSsaoTex_x = 1.0/ussaoTexSize.x;
		float pixelSizeSsaoTex_y = 1.0/ussaoTexSize.y;
		vec4 occlFromDepth = vec4(0.0);
		
		for(int i=0; i<4; i++)
		{
			for(int j=0; j<4; j++)
			{
				vec2 texCoord = vec2(screenPos.x + pixelSizeSsaoTex_x*float(i-2), screenPos.y + pixelSizeSsaoTex_y*float(j-2)); 
				vec4 color = texture2D(ssaoTex, texCoord);
				occlFromDepth += color;
			}
		}
		occlFromDepth /= 16.0;
		

		float attenuation = 0.45;
		//vec4 color = texture2D(ssaoTex, screenPos);
		//occlFromDepth = color;

		// Aditive methode.***************************
		//occlFromDepth *= attenuation; // attenuation.
		//float occlusionInverseAdd = (1.0 - occlFromDepth.r) + (1.0 -  occlFromDepth.g) + (1.0 - occlFromDepth.b) + (1.0 - occlFromDepth.a); // original.***

		// Multiplicative methode.********************
		attenuation = 0.6;
		occlFromDepth *= attenuation; // attenuation.
		float occlusionInverseMult = (1.0 - occlFromDepth.r) * (1.0 -  occlFromDepth.g) * (1.0 - occlFromDepth.b) * (1.0 - occlFromDepth.a); // original.***

		float occlInv = occlusionInverseMult;

		//float lightFactorAux = uSceneDayNightLightingFactor + diffuseLightModul;
		vec3 diffuseLight3 = diffuseLight.xyz + vec3(uSceneDayNightLightingFactor);

		// Light factor.***
		shadow_occlusion += diffuseLightModul * 0.3;
		if(shadow_occlusion > 1.0)
		shadow_occlusion = 1.0;

		occlInv *= (shadow_occlusion);
		bool isTransparentObject = false;
		if(albedo.a < 1.0)
		{
			// This is transparent object (rendered in transparent pass), so atenuate occInv.
			isTransparentObject = true;
			occlInv *= 3.0;
			if(occlInv > 1.0)
			occlInv = 1.0;
		}

		if(bApplyMagoShadow && !pointIsinShadow && !sunInAntipodas)
		{
			if(occlInv < 1.0)
			{
				occlInv = min(occlInv * 1.5, 1.0);
			}
			
		}

		finalColor = vec4(albedo.r * occlInv * diffuseLight3.x, 
							albedo.g * occlInv * diffuseLight3.y, 
							albedo.b * occlInv * diffuseLight3.z, albedo.a);

		gl_FragData[0] = finalColor;

		// EDGES.****************************************************************
		if(dataType == 0 || dataType == 1)// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
		{
			
			bool bIsEdge = isEdge_byNormals(screenPos, normal, pixelSize_x, pixelSize_y); // original.***

			if(!bIsEdge && dataType == 0)
			{
				// Check if is edge by depth range.***
				bIsEdge = isEdge_byDepth(screenPos, pixelSize_x, pixelSize_y);
			}
			
			if(bIsEdge)
			{				
				vec4 edgeColor = finalColor * 0.7;
				if(isTransparentObject)
					edgeColor *= 1.5;

				finalColor = vec4(edgeColor.rgb, 1.0);

				gl_FragData[0] = finalColor;
				
			}

			// shade terrain : TODO.***
			if(dataType == 1)
			{
				// TODO :
				// Calculate normal by depth texture.***
				//vec4 normal4 = getNormal(screenPos);
				//vec3 normal = normal4.xyz;
				//int estimatedFrustumIdx = int(floor(normal4.w * 100.0));
				//int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
				//int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);
				//vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
				//float currNear = nearFar.x;
				//float currFar = nearFar.y;
				//float realDepth = getRealDepth(screenPos, currFar);
				//---------------------------------------------------------
				
			}
			
		}
		else if(dataType == 2)// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
		{
			// this is pointCloud data.
			// Check depth values around the pixel to find a silhouette.
			float pixelSize_x = 1.0/screenWidth;
			float pixelSize_y = 1.0/screenHeight;
			float myLinearDepth = getDepth(screenPos);

			float myDepth = myLinearDepth * currFar_origin;
			float log2Deoth = log2(myDepth);
			// Apply Eye-Dom-Lighting (EDL).***
			
			float coordScale = 1.5;

			// top.***
			vec2 texCoord_top = vec2(screenPos.x, screenPos.y + pixelSize_y*coordScale);
			vec3 normal_top;
			int dataType_top;
			vec2 nearfar_top;
			getNormal_dataType_andFar(texCoord_top, normal_top, dataType_top, nearfar_top);
			float realDepth_top = getRealDepth(texCoord_top, nearfar_top);

			// left.***
			vec2 texCoord_left = vec2(screenPos.x - pixelSize_x * coordScale, screenPos.y);
			vec3 normal_left;
			int dataType_left;
			vec2 nearfar_left;
			getNormal_dataType_andFar(texCoord_left, normal_left, dataType_left, nearfar_left);
			float realDepth_left = getRealDepth(texCoord_left, nearfar_left);

			// bottom.***
			vec2 texCoord_bottom = vec2(screenPos.x, screenPos.y - pixelSize_y*coordScale);
			vec3 normal_bottom;
			int dataType_bottom;
			vec2 nearfar_bottom;
			getNormal_dataType_andFar(texCoord_bottom, normal_bottom, dataType_bottom, nearfar_bottom);
			float realDepth_bottom = getRealDepth(texCoord_bottom, nearfar_bottom);

			// right.***
			vec2 texCoord_right = vec2(screenPos.x + pixelSize_x * coordScale, screenPos.y);
			vec3 normal_right;
			int dataType_right;
			vec2 nearfar_right;
			getNormal_dataType_andFar(texCoord_right, normal_right, dataType_right, nearfar_right);
			float realDepth_right = getRealDepth(texCoord_right, nearfar_right);

			float response = (max(0.0, log2Deoth - log2(realDepth_top)) + max(0.0, log2Deoth - log2(realDepth_left)) + max(0.0, log2Deoth - log2(realDepth_bottom)) + max(0.0, log2Deoth - log2(realDepth_right))) / 4.0;
			float edlStrength = 2.0;
			float shade = exp(-response * 300.0 * edlStrength);

			vec4 finalColorPC = vec4(albedo.rgb * shade, albedo.a);
			//finalColorPC = vec4(1.0, 0.0, 0.0, albedo.a);

			gl_FragData[0] = finalColorPC;

		}
		
	}

	// fog.*****************************************************************
	//bool bApplyFog = true;
	//if(bApplyFog)
	//{
	//	float zDist = getZDist(screenPos);
	//	float fogFactor = min(zDist / 2000.0, 0.4);
	//	vec4 finalColor2 = mix(finalColor, vec4(1.0, 1.0, 1.0, 1.0), fogFactor);
	//	gl_FragData[0] = vec4(finalColor2);
	//}
	
	// End fog.---------------------------------------------------------------

	// Finally check for brightColor (for bloom effect, if exist).***
	float brightness = dot(finalColor.rgb, vec3(0.2126, 0.7152, 0.0722));
	vec4 brightColor;
	if(brightness > 1.0)
        brightColor = vec4(finalColor.rgb, 1.0);
    else
        brightColor = vec4(0.0, 0.0, 0.0, 1.0);
	gl_FragData[1] = brightColor;

	// debugTex.***
	//float pixelSize_x_ = 1.0/screenWidth;
	//float pixelSize_y_ = 1.0/screenHeight;
	//float zDist = getZDist(screenPos);// - nearFar_origin.x);
	//bool isEdgeTest = _isEdge_byDepth(zDist, screenPos);
	//float zDist_top = getZDist(vec2(screenPos.x, screenPos.y + pixelSize_y_));// - nearFar_origin.x);
	//if(isEdgeTest)
	//{
	//	gl_FragData[2] = vec4(1.0, 0.0, 0.0, 1.0);
	//}
	//else gl_FragData[2] = vec4(zDist/1200.0, zDist/1200.0, zDist/1200.0, 1.0);
}