#ifdef GL_ES
    precision highp float;
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
uniform int sunIdx;
uniform float screenWidth;    
uniform float screenHeight;  
uniform vec2 uNearFarArray[4];
uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;
uniform float uSceneDayNightLightingFactor; // day -> 1.0; night -> 0.0


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

bool isInShadow(vec4 pointCC, int currSunIdx)
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
			{depthRelToLight = unpackDepth(texture2D(shadowMapTex, posRelToLight.xy));}
			else if(currSunIdx == 1)
			{depthRelToLight = unpackDepth(texture2D(shadowMapTex2, posRelToLight.xy));}

			//if(depthRelToLight < 0.1)
			//return false;

			if(posRelToLight.z > depthRelToLight*tolerance )
			{
				inShadow = true;
			}
		}
	}
	
	return inShadow;
}
/*
void make_kernel(inout vec4 n[9], vec2 coord)
{
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
						//gl_FragColor = vec4(0.2, 1.0, 0.3, 1.0);
						//return;
					//}
					
				}
			}

			if(backgroundDepthCount > 0 && objectDepthCount > 0)
			{
				// is silhouette.
				float countsDif = abs(float(objectDepthCount)/16.0);
				gl_FragColor = vec4(0.2, 1.0, 0.3, countsDif);
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
	
	if(bApplyMagoShadow)
	{
		// 1rst, check normal vs sunDirCC.
		bool sunInAntipodas = false;
		float dotAux = dot(sunDirCC, normal);
		if(dotAux > 0.0)
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
			bool pointIsinShadow = isInShadow(posWCRelToEye, 0);
			if(!pointIsinShadow)
			{
				pointIsinShadow = isInShadow(posWCRelToEye, 1);
			}

			if(pointIsinShadow)
			{
				shadow_occlusion = 0.5;
				alpha = 0.5;
			}
		}
		

		// calculate sunDirCC.
		//vec4 sunDirCC = modelViewMatrixRelToEyeInv * vec4(sunDirWC, 1.0);
		//directionalLightWeighting = max(dot(normal, -sunDirCC.xyz), 0.0);
	}
	

	ambientColor = vec3(0.6);
	vec3 lightingDirection = normalize(vec3(0.6, 0.6, 0.6));
	directionalLightWeighting = max(dot(normal, lightingDirection), 0.0);
	
	// 1rst, take the albedo.
	vec4 albedo = texture2D(albedoTex, screenPos);
	vec4 diffuseLight = texture2D(diffuseLightTex, screenPos);
	float diffuseLightModul = length(diffuseLight.xyz);
	float lightFogAprox = diffuseLight.w;


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
		albedo *= vec4(lightWeighting, 1.0);
	}
	
	if(bApplySsao)
	{
		// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.

		//ssaoFromDepthTex
		float pixelSize_x = 1.0/screenWidth;
		float pixelSize_y = 1.0/screenHeight;
		vec4 occlFromDepth = vec4(0.0);
		for(int i=0; i<4; i++)
		{
			for(int j=0; j<4; j++)
			{
				vec2 texCoord = vec2(screenPos.x + pixelSize_x*float(i-2), screenPos.y + pixelSize_y*float(j-2));
				vec4 color = texture2D(ssaoTex, texCoord);
				occlFromDepth += color;
			}
		}

		occlFromDepth /= 16.0;
		occlFromDepth *= 0.45;

		float occlusion = occlFromDepth.r + occlFromDepth.g + occlFromDepth.b + occlFromDepth.a; // original.***

		if(occlusion < 0.0)// original.***
		occlusion = 0.0;// original.***

		float occlInv = 1.0 - occlusion;

		//float lightFactorAux = min(uSceneDayNightLightingFactor + diffuseLightModul, 1.3);
		float lightFactorAux = uSceneDayNightLightingFactor + diffuseLightModul;
		//occlInv *= lightFactorAux;

		vec3 diffuseLight3 = diffuseLight.xyz + vec3(uSceneDayNightLightingFactor);

		// Light factor.***
		shadow_occlusion += diffuseLightModul * 0.3;
		if(shadow_occlusion > 1.0)
		shadow_occlusion = 1.0;

		occlInv *= (shadow_occlusion);
		vec4 finalColor = vec4(albedo.r * occlInv * diffuseLight3.x, albedo.g * occlInv * diffuseLight3.y, albedo.b * occlInv * diffuseLight3.z, albedo.a);
		gl_FragColor = finalColor;



		// fog.*****************************************************************
		//float myLinearDepth2 = getDepth(screenPos);
		//float myDepth = (myLinearDepth2 * currFar_origin)/500.0;
		//if(myDepth > 1.0)
		//myDepth = 1.0;
		//vec4 finalColor2 = mix(finalColor, vec4(1.0, 1.0, 1.0, 1.0), myDepth);
		//gl_FragColor = vec4(finalColor2);
		// End fog.---------------------------------------------------------------

		//float finalColorLightLevel = finalColor.r + finalColor.g + finalColor.b;
		//if(finalColorLightLevel < 0.9)
		//return;

		// Provisionally render Aura by depth.************************************************************
		/*
		if(dataType == 0)
		{
			// check depth by xCross pixel samples.***
			// PixelRadius = 7;
			// South 3 pixels.***
			float pixelSize_x = 1.0/screenWidth;
			float pixelSize_y = 1.0/screenHeight;
			float counter = 1.0;
			for(int i=0; i<3; i++)
			{
				vec2 screePos_south = vec2(screenPos.x, screenPos.y - counter*pixelSize_y);


				counter += 1.0;
			}

		}
		*/
		// Provisionally render edges here.****************************************************************
		// EDGES.***
		if(dataType == 0)// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
		{
			// detect edges by normals.
			vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;
			vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;
			vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;
			vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;

			float factor = 0.0;
			float increF = 0.07 * 2.0;
			increF = 0.18;
			float minDot = 0.3;

			if(dot(normal, normal_up) < minDot)
			{ factor += increF; }

			if(dot(normal, normal_right) < minDot)
			{ factor += increF; }

			if(dot(normal, normal_down) < minDot)
			{ factor += increF; }

			if(dot(normal, normal_left) < minDot)
			{ factor += increF; }

			float edgeAlpha = factor + occlusion;
			//edgeAlpha /= uSceneDayNightLightingFactor;

			if(edgeAlpha > 1.0)
			{
				edgeAlpha = 1.0;
			}
			else if(edgeAlpha < 0.2)
			{
				edgeAlpha = 0.2;
			}

			if(factor > increF*0.9*2.0)
			{
				//edgeAlpha = 0.6;
				vec4 edgeColor = finalColor * 0.6;
				gl_FragColor = vec4(edgeColor.rgb, 1.0);
			}
			else if(factor > increF*0.9)
			{
				vec4 albedo_up = texture2D(albedoTex, vec2(screenPos.x, screenPos.y + pixelSize_y));
				vec4 albedo_right = texture2D(albedoTex, vec2(screenPos.x + pixelSize_x, screenPos.y));
				vec4 albedo_down = texture2D(albedoTex, vec2(screenPos.x, screenPos.y - pixelSize_y));
				vec4 albedo_left = texture2D(albedoTex, vec2(screenPos.x - pixelSize_x, screenPos.y));

				vec4 edgeColor_A = mix(albedo_up, albedo_right, 0.5);
				vec4 edgeColor_B = mix(albedo_down, albedo_left, 0.5);
				vec4 edgeColor_C = mix(edgeColor_A, edgeColor_B, 0.5);
				vec4 edgeColor_D = mix(edgeColor_C, albedo, 0.5);

				vec4 edgeColorPrev = vec4(edgeColor_D.r * occlInv * diffuseLight3.x, edgeColor_D.g * occlInv * diffuseLight3.y, edgeColor_D.b * occlInv * diffuseLight3.z, edgeColor_D.a);
				vec4 edgeColor = edgeColorPrev * 0.8;

				//gl_FragColor = vec4(edgeColor.rgb, edgeAlpha);
				gl_FragColor = vec4(edgeColor.rgb, 1.0);

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


			float radius = 3.0;
			float occ = 0.0;
			for(int i=0; i<3; i++)
			{
				for(int j=0; j<3; j++)
				{
					vec2 texCoord = vec2(screenPos.x + pixelSize_x*float(i-1), screenPos.y + pixelSize_y*float(j-1));

					// calculate current frustum idx.
					vec4 normal4 = getNormal(texCoord);
					int estimatedFrustumIdx = int(floor(normal4.w * 100.0));
					int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
					int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);

					if(dataType == 1)
					continue;

					vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
					float currNear = nearFar.x;
					float currFar = nearFar.y;
					float linearDepth = getDepth(texCoord);
					float depth = linearDepth * currFar;
					if(depth > myDepth + radius)
					{
						occ += 1.0;
					}
				}
			}

			
			//for(int i=0; i<4; i++)
			//{
			//	for(int j=0; j<4; j++)
			//	{
			//		vec2 texCoord = vec2(screenPos.x + pixelSize_x*float(i-2), screenPos.y + pixelSize_y*float(j-2));

			//		// calculate current frustum idx.
			//		vec4 normal4 = getNormal(texCoord);
			//		int estimatedFrustumIdx = int(floor(normal4.w * 100.0));
			//		int dataType = -1;
			//		int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);

			//		if(dataType == 1)
			//		continue;

			//		vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
			//		float currNear = nearFar.x;
			//		float currFar = nearFar.y;
			//		float linearDepth = getDepth(texCoord);
			//		float depth = linearDepth * currFar;
			//		if(depth > myDepth + radius)
			//		{
			//			occ += 1.0;
			//		}
			//	}
			//}

			if(occ > 0.0)
			{
				float alpha = occ/8.0;
				float distLimit = 150.0;
				if(myDepth < distLimit)
				{
					alpha = smoothstep(1.0, 0.0, myDepth/distLimit);
				}
				else{
					alpha = 0.0;
				}

				gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
				return;
			}
		}
		
		// TEST DEBUG.***********************************
		//if(gl_FragColor.r > 0.8 && gl_FragColor.g > 0.8 && gl_FragColor.b > 0.8 )
		//{
		//	gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
		//}

		// render edges for points cloud.
		/*
		if(dataType == 2)
		{
			// this is point cloud.
			float linearDepth_origin  = unpackDepth(texture2D(depthTex, screenPos)); // z_window  is [0.0, 1.0] range depth.
			float myZDist = linearDepth_origin * currFar_origin;
			float increAngRad = (2.0*M_PI)/16.0;
			float edgeColor = 0.0;
			for(int i=0; i<16; i++)
			{
				float s = cos(float(i)*increAngRad) * pixelSize_x * 4.0;
				float t = sin(float(i)*increAngRad) * pixelSize_y * 4.0;
				vec2 screenPosAdjacent = vec2(screenPos.x+s, screenPos.y+t);
				vec4 normal4_adjacent = getNormal(screenPosAdjacent);
				int estimatedFrustumIdx_adjacent = int(floor(normal4_adjacent.w * 100.0));
				int dataType_adjacent = -1;
				int currFrustumIdx_adjacent = getRealFrustumIdx(estimatedFrustumIdx_adjacent, dataType_adjacent);
				vec2 nearFar_adjacent = getNearFar_byFrustumIdx(currFrustumIdx_adjacent);
				float currNear_adjacent = nearFar_adjacent.x;
				float currFar_adjacent = nearFar_adjacent.y;
				float linearDepth_adjacent  = unpackDepth(texture2D(depthTex, screenPosAdjacent)); // z_window  is [0.0, 1.0] range depth.
				float zDistAdjacent = linearDepth_adjacent * currFar_adjacent;

				float zDepthDiff = abs(myZDist - zDistAdjacent);
				if(linearDepth_origin < linearDepth_adjacent)
				{
					if(zDepthDiff > 2.0)
					{
						edgeColor += 1.0;
					}
				}
			}
			if(edgeColor > 4.0)
			{
				edgeColor -= 4.0;
				edgeColor /= 12.0;

				if(edgeColor > 0.01)
				edgeColor = 1.0;

				//gl_FragColor = vec4(0.0, 0.0, 0.0, edgeColor);//+occlusion);
				gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);//+occlusion);
				return;
				// Test.***
				
			}
			
		}
		*/
	}
	

	// check if is fastAntiAlias.***
	/*
	if(bFxaa)
	{
		vec4 color = texture2D(depthTex, screenPos);

		float pixelSize_x = 1.0/screenWidth;
		float pixelSize_y = 1.0/screenHeight;
		vec3 normal = getNormal(screenPos).xyz;
		vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;
		vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;

		if(dot(normal, normal_up) < 0.5 || dot(normal, normal_right) < 0.5)
		{
			gl_FragColor = vec4(0.0, 0.0, 1.0, 0.5);
			return;
		}
		//if(color.r < 0.0001 && color.g < 0.0001 && color.b < 0.0001)
		//discard;

		////vec4 n[9];
		////make_kernel( n, vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight) );

		////vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
		////vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
		////vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));

		////gl_FragColor = vec4( 1.0 - sobel.rgb, 1.0 );

	}
    */
}