#ifdef GL_ES
    precision highp float;
#endif

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif


uniform sampler2D depthTex;
uniform sampler2D normalTex;
uniform samplerCube light_depthCubeMap;

uniform mat4 projectionMatrixInv;
uniform mat4 modelViewMatrixRelToEyeInv;
uniform mat4 buildingRotMatrixInv;

// Light parameters.
uniform float uLightParameters[4]; // 0= lightDist, 1= lightFalloffDist, 2= maxSpotDot, 3= falloffSpotDot.

uniform float near;
uniform float far;            
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight;     

uniform vec3 uLightColorAndBrightness;
uniform float uLightIntensity;

uniform bool bUseLogarithmicDepth;
uniform bool bUseMultiRenderTarget;
uniform bool bApplyShadows;
uniform vec2 uNearFarArray[4];
uniform int u_processType; // 1= light pass. 2= lightFog pass.

varying vec3 vNormal;
varying vec3 vLightDirCC;
varying vec3 vLightPosCC; 
varying vec3 vertexPosLC;
varying vec4 vertexPosCC;
varying float vDotProdLight;
varying vec3 vCrossProdLight;

varying float flogz;
varying float Fcoef_half;


vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}  

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
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
        
float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z;

		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = flogzAux - 1.0;
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
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

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
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

vec3 reconstructPosition(vec2 texCoord, float depth)
{
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
    float x = texCoord.x * 2.0 - 1.0;
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;
    float y = (texCoord.y) * 2.0 - 1.0;
    float z = (1.0 - depth) * 2.0 - 1.0;
    vec4 pos_NDC = vec4(x, y, z, 1.0);
    vec4 pos_CC = projectionMatrixInv * pos_NDC;
    return pos_CC.xyz / pos_CC.w;
}

vec3 getPosCC(in vec2 screenPosition, inout int dataType, inout vec4 normal4)
{
	normal4 = getNormal(screenPosition);
	int estimatedFrustumIdx = int(floor(100.0*normal4.w));
	dataType = 0; // 0= general geometry. 1= tinTerrain. 2= PointsCloud.

	// Check the type of the data.******************
	// dataType = 0 -> general geometry data.
	// dataType = 1 -> tinTerrain data.
	// dataType = 2 -> points cloud data.
	//----------------------------------------------
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);

	vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear = nearFar.x;
	float currFar = nearFar.y;
	float linearDepth = getDepth(screenPosition);

	// calculate the real pos of origin.
	float origin_zDist = linearDepth * currFar; // original.
	vec3 origin_real = getViewRay(screenPosition, origin_zDist);

	return origin_real;
}

int getFaceIdx(in vec3 normalRelToLight, inout vec2 faceTexCoord, inout vec3 faceDir)
{
	int faceIdx = -1;

	// Note: the "faceTexCoord" is 1- to 1 range.

	float x = normalRelToLight.x;
	float y = normalRelToLight.y;
	float z = normalRelToLight.z;

	float absX = abs(x);
	float absY = abs(y);
	float absZ = abs(normalRelToLight.z);

	bool isXPositive = true;
	bool isYPositive = true;
	bool isZPositive = true;

	if(x < 0.0)
	isXPositive = false;

	if(y < 0.0)
	isYPositive = false;

	if(z < 0.0)
	isZPositive = false;

	// xPositive.
	if(isXPositive && absX >= absY && absX >= absZ)
	{
		faceIdx = 0;
		faceTexCoord = vec2(y, z);
		faceDir = vec3(1.0, 0.0, 0.0);
	}

	// xNegative.
	else if(!isXPositive && absX >= absY && absX >= absZ)
	{
		faceIdx = 1;
		faceTexCoord = vec2(y, z);
		faceDir = vec3(-1.0, 0.0, 0.0);
	}

	// yPositive.
	else if(isYPositive && absY >= absX && absY >= absZ)
	{
		faceIdx = 2;
		faceTexCoord = vec2(x, z);
		faceDir = vec3(0.0, 1.0, 0.0);
	}

	// yNegative.
	else if(!isYPositive && absY >= absX && absY >= absZ)
	{
		faceIdx = 3;
		faceTexCoord = vec2(x, z);
		faceDir = vec3(0.0, -1.0, 0.0);
	}

	// zPositive.
	else if(isZPositive && absZ >= absX && absZ >= absY)
	{
		faceIdx = 4;
		faceTexCoord = vec2(x, y);
		faceDir = vec3(0.0, 0.0, 1.0);
	}

	// zNegative.
	else if(!isZPositive && absZ >= absX && absZ >= absY)
	{
		faceIdx = 5;
		faceTexCoord = vec2(x, y);
		faceDir = vec3(0.0, 0.0, -1.0);
	}

	return faceIdx;
}

float getDepthFromLight(in vec3 lightDirCC, inout float spotDotAux)
{
	// Note : input must be a direction in cameraCoords.
	// 1rst, transform "lightDirToPointCC" to "lightDirToPointWC".
	// 2nd, transform "lightDirToPointWC" to "lightDirToPointLC" ( lightCoord );
	vec4 lightDirToPointWC = modelViewMatrixRelToEyeInv * vec4(lightDirCC, 1.0);
	vec3 lightDirToPointWCNormalized = normalize(lightDirToPointWC.xyz);
	vec4 lightDirToPointLC = buildingRotMatrixInv * vec4(lightDirToPointWCNormalized, 1.0);
	vec3 lightDirToPointLC_norm = normalize(lightDirToPointLC.xyz);
	vec4 depthCube = textureCube(light_depthCubeMap, lightDirToPointLC_norm); // original

	// Now, try to calculate the zone of the our pixel.
	vec2 faceTexCoord;
	vec3 faceDir;
	getFaceIdx(lightDirToPointLC_norm, faceTexCoord, faceDir);
	spotDotAux = dot(lightDirToPointLC_norm, faceDir);
	float depthFromLight = unpackDepth(depthCube);

	return depthFromLight;
}

void main()
{
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);

	#ifdef USE_MULTI_RENDER_TARGET
	if(bUseMultiRenderTarget)
	{
		if(u_processType == 1) // light pass.
		{
			// Diffuse lighting.
			int dataType = 0;
			vec4 normal4;
			vec3 posCC = getPosCC(screenPos, dataType, normal4);

			// vector light-point.
			vec3 vecLightToPointCC = posCC - vLightPosCC;
			vec3 lightDirToPointCC = normalize(posCC - vLightPosCC);
			float distToLight = length(vecLightToPointCC);

			float lightHotDistance = uLightParameters[0];
			float lightFalloffLightDist = uLightParameters[1];
			float factorByDist = 1.0;

			// Calculate the lightFog intensity (case spotLight).***************************************************************************************************************************
			float lightFogIntensity = 0.0;
			
			// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of "vertexPosLC" to "vLightDirCC".
			vec3 vectorToVertexCC = vertexPosCC.xyz - vLightPosCC;
			float dist_vertexCC_toLight = length(vectorToVertexCC);

			vec3 dir_camToLight = normalize(vLightPosCC);
			float dot_dirCamToLight_lightDir = dot(dir_camToLight, vLightDirCC);


			float factorByDist2 = 1.0 - dist_vertexCC_toLight/(lightFalloffLightDist);
			lightFogIntensity = factorByDist2 * factorByDist2 * abs(dot_dirCamToLight_lightDir * dot_dirCamToLight_lightDir);
			lightFogIntensity *= 0.8;

			// DepthTest.
			if(-vertexPosCC.z > -posCC.z)
			{
				if(posCC.z < 0.0) // in sky, posCC.z > 0.0
				lightFogIntensity = 0.0;
			}


			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***
			// End fog calculating.------------------------------------------------------------------------------------------------------------------------------------------------------------
			
			if(distToLight > lightFalloffLightDist)
			{
				// Apply only lightFog.***
				// in final screenQuadPass, use posLC to determine the light-fog.
				return;
				//discard;
			}
			else if(distToLight > lightHotDistance)
			{
				factorByDist = 1.0 - (distToLight - lightHotDistance)/(lightFalloffLightDist - lightHotDistance);
			}

			vec3 normal3 = normal4.xyz;
			float diffuseDot = dot(-lightDirToPointCC, vec3(normal3));

			if(diffuseDot < 0.0)
			{
				return;
			}

			// Check SPOT ANGLES.*****************************************************************************************************************************************
			float hotSpotDot = uLightParameters[2];
			float falloffSpotDot = uLightParameters[3];

			float spotDot = dot(vLightDirCC, lightDirToPointCC);
			float factorBySpot = 1.0;
			if(spotDot < falloffSpotDot) 
			{
				return;
			}
			else if(spotDot < hotSpotDot)
			{
				factorBySpot = 1.0 - (hotSpotDot - spotDot)/(hotSpotDot - falloffSpotDot);
			}

			if(bApplyShadows)
			{

				// Now, try to calculate the zone of the our pixel.
				float spotDotAux;
				float depthFromLight = getDepthFromLight(lightDirToPointCC, spotDotAux);
				depthFromLight *= lightFalloffLightDist/spotDotAux;

				float depthTolerance = 0.06;
				if(distToLight > depthFromLight + depthTolerance)
				{
					// we are in shadow, so do not lighting.
					gl_FragData[2] = vec4(0.0); // save fog.***
					return;
				}
			}
			

			//float fogIntensity = length(vertexPosLC)/lightHotDistance;
			float atenuation = 0.4; // intern variable to adjust light intensity.
			diffuseDot *= factorByDist;
			spotDot *= factorBySpot;
			float finalFactor = uLightIntensity * diffuseDot * spotDot * atenuation;
			gl_FragData[0] = vec4(uLightColorAndBrightness.x * finalFactor, 
								uLightColorAndBrightness.y * finalFactor, 
								uLightColorAndBrightness.z * finalFactor, 1.0); 

			// Specular lighting.
			gl_FragData[1] = vec4(0.0, 0.0, 0.0, 1.0); // save specular.***

			// Light fog.
			//gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***
		}
		else if(u_processType == 2) // lightFog pass.
		{
			// Diffuse lighting.
			int dataType = 0;
			vec4 normal4;
			vec3 posCC = getPosCC(screenPos, dataType, normal4);

			float lightHotDistance = uLightParameters[0];
			float lightFalloffLightDist = uLightParameters[1];

			// Calculate the lightFog intensity (case spotLight).***************************************************************************************************************************
			float lightFogIntensity = 0.0;
			vec3 dir_camToVertex = normalize(vertexPosCC.xyz);
			vec3 dir_camToLight = normalize(vLightPosCC);
			float dist_camToLight = length(vLightPosCC);
			vec3 vertexPP = dir_camToVertex * dist_camToLight;
			float dist_vertexPP_toLight = length(vertexPP - vLightPosCC);

			// calculate light-to-vertexPP direction.
			vec3 dir_light_toVertexPP = normalize(vertexPP - vLightPosCC);

			// calculate dotProd of lightDir & dir_light_toVertexPP. If dot is negative, means that the vertex is rear of light.
			float dot_lightDir_lightToVertexPPDir = dot(vLightDirCC, dir_light_toVertexPP);
			float dot_dirCamToLight_lightDir = dot(dir_camToLight, vLightDirCC);

			// Calculate how centered is the pixel relative to lightDir, so calculate the crossProduct of "vertexPosLC" to "vLightDirCC".
			vec3 vectorLightToVertexCC = vertexPosCC.xyz - vLightPosCC;
			vec3 dirLightToVertexCC = normalize(vectorLightToVertexCC);
			float dist_vertexCC_toLight = length(vectorLightToVertexCC);
			vec3 crossProd = cross( dirLightToVertexCC, vLightDirCC );
			vec3 camToVertexCC = normalize(vertexPosCC.xyz);
			float dotLightDir = dot(normalize(crossProd), camToVertexCC); // indicates how centered is the point to lightDir.

			// Calculate fog by dist to light & try to eliminate the rear-light fog.
			float factorByDistFog = 1.0 - dist_vertexPP_toLight / (lightFalloffLightDist * 1.1);
			factorByDistFog *= abs(dot_lightDir_lightToVertexPPDir);

			if(dot_lightDir_lightToVertexPPDir < 0.1)
			{
				// we are rear of the light.
				float factorByRearLight = 1.0 + dot_lightDir_lightToVertexPPDir; 
				factorByDistFog *= (factorByRearLight * factorByRearLight);
			}

			float intensityFactor = 1.0 - abs(dotLightDir);
			lightFogIntensity = intensityFactor * factorByDistFog * 0.5;

			float camDir_lightDir_factor = dot_dirCamToLight_lightDir * (1.0 - dist_vertexPP_toLight/(lightFalloffLightDist));
			lightFogIntensity += camDir_lightDir_factor * camDir_lightDir_factor * 0.5; // when look with the same direction that lightDir, add aureola.
			// End calculate the lightFog intensity (case spotLight).-----------------------------------------------------------------------------------------------------------------------

			// DepthTest.
			if(-vertexPosCC.z > -posCC.z)
			{
				if(posCC.z < 0.0) // in sky, posCC.z > 0.0
				lightFogIntensity = 0.0;
				gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***
				return;
			}

			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***

			if(bApplyShadows)
			{
				// Now, try to calculate the zone of the our pixel.
				float spotDotAux;
				float depthTolerance = 1.5; // high tolerance.
				float depthFromLight2 = getDepthFromLight(dirLightToVertexCC, spotDotAux);
				depthFromLight2 *= lightFalloffLightDist/spotDotAux;

				if(dist_vertexCC_toLight > depthFromLight2 + depthTolerance)
				{
					// we are in shadow, so do not lighting.
					gl_FragData[2] = vec4(0.0);
					return;
				}
			}
			
			// Light fog.
			gl_FragData[2] = vec4(uLightColorAndBrightness.x, uLightColorAndBrightness.y, uLightColorAndBrightness.z, lightFogIntensity); // save fog.***
		}

	}
	#endif


	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}