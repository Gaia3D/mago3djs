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
uniform mat4 projectionMatrix;
uniform float tangentOfHalfFovy;
uniform float near;
uniform float far;            
uniform float fov;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight;    
uniform vec3 kernel[16];   
uniform vec4 oneColor4;
varying vec4 aColor4; // color from attributes

varying vec4 vColor;
varying float glPointSize;

const int kernelSize = 16;  
uniform float radius;      

uniform bool bApplySsao;
uniform float externalAlpha;

uniform bool bUseLogarithmicDepth;
uniform vec2 uNearFarArray[4];
uniform bool bUseMultiRenderTarget;
uniform int uFrustumIdx;
// Code color for selection:
uniform vec4 uSelColor4;

varying float flogz;
varying float Fcoef_half;
varying float depth;

/*
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

vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec4 getNormal(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(normalTex, texCoord);
    return decodeNormal(encodedNormal);
}


vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
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
*/
            
//linear view space depth
/*
float getDepth(vec2 coord)
{
    return unpackDepth(texture2D(depthTex, coord.xy));
} 
*/   

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
}

vec3 decodeNormal(in vec3 normal)
{
	return normal * 2.0 - 1.0;
}

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

void main()
{
	vec2 pt = gl_PointCoord - vec2(0.5);
	if(pt.x*pt.x+pt.y*pt.y > 0.25)
	{
		discard;
	}
		
	
	float occlusion = 1.0;
	float lighting = 0.0;
	bool testBool = false;
	vec4 colorAux = vec4(1.0, 1.0, 1.0, 1.0);
	/*
	bool auxBool = false;
	//if(bApplySsao)
	if(auxBool)
	{          
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
		//float linearDepth = getDepth(screenPos);
		float linearDepth = -depth;
		//vec3 origin = getViewRay(screenPos) * linearDepth;


		vec4 normalRGBA = getNormal(screenPos);
		int currFrustumIdx = int(floor(100.0*normalRGBA.w));

		if(currFrustumIdx >= 10)
		currFrustumIdx -= 20;

		vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
		float currNear = nearFar.x;
		float currFar = nearFar.y;


		colorAux = vec4(linearDepth, linearDepth, linearDepth, 1.0);
		float myZDist = currNear + linearDepth * currFar;

		float radiusAux = glPointSize/1.9; // radius in pixels.
		float radiusFog = glPointSize*3.0; // radius in pixels.
		vec2 screenPosAdjacent;

		
		////vec3 sample = origin + rotatedKernel * radius;
		////vec4 offset = projectionMatrix * vec4(sample, 1.0);	
		////vec3 offsetCoord = vec3(offset.xyz);				
		////offsetCoord.xyz /= offset.w;
		////offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5; 
		

		// calculate the pixelSize in the screenPos.***
		float h = 2.0 * tangentOfHalfFovy * currFar * linearDepth; // height in meters of the screen in the current pixelDepth
    	float w = h * aspectRatio;     							   // width in meters of the screen in the current pixelDepth
		// vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);   

		float pixelSize_x = w/screenWidth; // the pixelSize in meters in the x axis.
		float pixelSize_y = h/screenHeight;  // the pixelSize in meters in the y axis.
		
		float radiusInMeters = 0.20;
		radiusAux = radiusInMeters / pixelSize_x;
		float radiusFogInMeters = 1.0;
		radiusFog = radiusFogInMeters / pixelSize_x;

		//radiusAux = 6.0;
		float farFactor = 0.1*sqrt(myZDist);
		
		for(int j = 0; j < 1; ++j)
		{
			//radiusAux = 1.5 *(float(j)+1.0);
			for(int i = 0; i < 8; ++i)
			{  
				// Find occlussion.***  	 
				if(i == 0)
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
				else if(i == 1)
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
				else if(i == 2)
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
				else if(i == 3)
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);
				else if(i == 4)
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
				else if(i == 5)
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
				else if(i == 6)
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
				else if(i == 7)
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);

				vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);
				int adjacentFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));

				if(adjacentFrustumIdx >= 10)
				adjacentFrustumIdx -= 20;

				vec2 nearFar_adjacent = getNearFar_byFrustumIdx(adjacentFrustumIdx);
				float currNear_adjacent = nearFar_adjacent.x;
				float currFar_adjacent = nearFar_adjacent.y;

				float depthBufferValue = getDepth(screenPosAdjacent);
				float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent;
				float zDistDiff = abs(myZDist - zDist);

				if(myZDist > zDist)
				{
					// My pixel is rear
					if(zDistDiff > farFactor  &&  zDistDiff < 100.0)
					occlusion +=  1.0;
				}
			}   
		}   
			
		if(occlusion > 4.0)
		{
			occlusion -= 4.0;
			occlusion = 1.0 - occlusion / 4.0;
		}
		else
		{
			occlusion = 1.0;
		}
		

		if(occlusion < 0.0)
		occlusion = 0.0;

		if(lighting > 6.0)
			lighting = 8.0;
		lighting = lighting / 8.0;
	}
	*/

	if(lighting < 0.5)
	lighting = 0.0;

	//vec3 fogColor = vec3(1.0, 1.0, 1.0);
	vec3 fogColor = vec3(0.0, 0.0, 0.0);
	vec3 finalFogColor = mix(vColor.xyz, fogColor, 0.0);

    vec4 finalColor;
	//finalColor = vec4((vColor.xyz) * occlusion, externalAlpha); // original.***
	finalColor = vec4(finalFogColor * occlusion, externalAlpha);

    gl_FragData[0] = finalColor; // original.***
	//gl_FragData[0] = colorAux;
	//gl_FragData[0] = vec4(occlusion, occlusion, occlusion, 1.0);

	//if(testBool)
	//{
	//	gl_FragData[0] = vec4(1.0, 0.0, 0.0, 1.0); 
	//}
	#ifdef USE_MULTI_RENDER_TARGET
	if(bUseMultiRenderTarget)
	{
		//if(!bUseLogarithmicDepth)
		//{
			gl_FragData[1] = packDepth(depth);
		//}

		// Note: points cloud data has frustumIdx 20 .. 23.********
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. 
		
		if(uFrustumIdx == 0)
		frustumIdx = 0.205; // frustumIdx = 20.***
		else if(uFrustumIdx == 1)
		frustumIdx = 0.215; // frustumIdx = 21.***
		else if(uFrustumIdx == 2)
		frustumIdx = 0.225; // frustumIdx = 22.***
		else if(uFrustumIdx == 3)
		frustumIdx = 0.235; // frustumIdx = 23.***
		/*
		if(uFrustumIdx == 0)
		frustumIdx = 0.005;
		else if(uFrustumIdx == 1)
		frustumIdx = 0.015;
		else if(uFrustumIdx == 2)
		frustumIdx = 0.025;
		else if(uFrustumIdx == 3)
		frustumIdx = 0.035;
		*/

		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***

		// now, albedo.
		gl_FragData[3] = vColor; 

		// selColor4 (if necessary).
		gl_FragData[4] = uSelColor4; 
	}
	#endif

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif

}