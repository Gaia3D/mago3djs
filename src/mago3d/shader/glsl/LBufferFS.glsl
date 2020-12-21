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
//uniform sampler2D noiseTex;  
//uniform sampler2D diffuseTex;

uniform bool textureFlipYAxis;
uniform mat4 projectionMatrix;
uniform mat4 projectionMatrixInv;
uniform mat4 modelViewMatrixRelToEyeInv;
uniform mat4 buildingRotMatrixInv;

uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform float lightDist;
uniform float uMaxSpotDot;

uniform vec2 noiseScale;
uniform float near;
uniform float far;            
uniform float fov;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight;     
uniform vec4 oneColor4;

uniform vec3 uLightColorAndBrightness;


uniform bool bApplyScpecularLighting;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

uniform vec3 specularColor;
uniform vec3 ambientColor;
  

uniform float ambientReflectionCoef;
uniform float diffuseReflectionCoef;  
uniform float specularReflectionCoef; 
uniform float externalAlpha;
uniform vec4 colorMultiplier;
uniform bool bUseLogarithmicDepth;
uniform bool bUseMultiRenderTarget;
uniform bool bApplyShadows;
uniform int uFrustumIdx;
uniform vec2 uNearFarArray[4];

varying vec3 vLightDirCC;
varying vec3 vLightPosCC; 
varying vec3 vLightPosWC;

varying vec3 vNormal;
varying vec4 vColor4; // color from attributes
varying vec2 vTexCoord;   
varying vec3 vLightWeighting;
varying vec3 diffuseColor;
varying vec3 vertexPos; // this is the orthoPos.***
varying vec3 vertexPosLC;
varying float applySpecLighting;


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


void main()
{
	//bool testBool = false;
	float occlusion = 1.0; // ambient occlusion.***
	float shadow_occlusion = 1.0;
	vec3 normal2 = vNormal;	
	float scalarProd = 1.0;
	
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);

	#ifdef USE_MULTI_RENDER_TARGET
	if(bUseMultiRenderTarget)
	{
		// Diffuse lighting.
		int dataType = 0;
		vec4 normal4;
		vec3 posCC = getPosCC(screenPos, dataType, normal4);
		//vec3 posWC = (modelViewMatrixRelToEyeInv * vec4(posCC, 1.0)).xyz + encodedCameraPositionMCHigh + encodedCameraPositionMCLow;
		
		//vec3 posLCAux = posWC - vLightPosWC;
		//vec4 posLC = buildingRotMatrixInv * vec4(posLCAux, 1.0);

		// If the data is no generalGeomtry or pointsCloud, then discard.
		if(dataType != 0 && dataType != 2)
		{
			discard;
		}

		// vector light-point.
		vec3 vecLightToPointCC = posCC - vLightPosCC;
		vec3 lightDirToPointCC = normalize(posCC - vLightPosCC);
		float distToLight = length(vecLightToPointCC);
		
		if(distToLight > lightDist)
		{
			discard;
		}

		float diffuseDot = dot(-lightDirToPointCC, vec3(normal4.xyz));

		if(diffuseDot < 0.0)
		{
			discard;
		}

		float spotDot = dot(vLightDirCC, lightDirToPointCC);
		if(spotDot < uMaxSpotDot)
		{
			discard;
		}

		if(bApplyShadows)
		{
			// now, check light's depthCubeMap.
			// 1rst, transform "lightDirToPointCC" to "lightDirToPointWC".
			// 2nd, transform "lightDirToPointWC" to "lightDirToPointLC" ( lightCoord );
			vec4 lightDirToPointWC = modelViewMatrixRelToEyeInv * vec4(lightDirToPointCC, 1.0);
			vec3 lightDirToPointWCNormalized = normalize(lightDirToPointWC.xyz);
			vec4 lightDirToPointLC = buildingRotMatrixInv * vec4(lightDirToPointWCNormalized, 1.0);
			//vec4 lightDirToPointLC = buildingRotMatrixInv * lightDirToPointWC;
			vec4 depthCube = textureCube(light_depthCubeMap, normalize(lightDirToPointLC.xyz)); // original.


			float depthFromLight = unpackDepth(depthCube)*lightDist;

			if(distToLight > depthFromLight + 0.01)
			{
				discard;
			}
		}
		
		//distToLight /= lightDist;

		gl_FragData[0] = vec4(diffuseDot * uLightColorAndBrightness.x * spotDot, 
							diffuseDot * uLightColorAndBrightness.y * spotDot, 
							diffuseDot * uLightColorAndBrightness.z * spotDot, 1.0); 

		//gl_FragData[0] = vec4(uLightColorAndBrightness.x, 
		//					uLightColorAndBrightness.y, 
		//					uLightColorAndBrightness.z, 1.0); 

		// Specular lighting.
		gl_FragData[1] = vec4(0.0, 0.0, 0.0, 1.0); // save specular.***

	}
	#endif


	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}