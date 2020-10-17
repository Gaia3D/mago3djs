#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D shadowMapTex;
uniform sampler2D shadowMapTex2;
uniform sampler2D ssaoTex;
uniform sampler2D normalTex;
uniform mat4 modelViewMatrixRelToEyeInv;
uniform mat4 projectionMatrixInv;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

uniform float near;
uniform float far; 
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    

uniform bool bApplyShadow;
uniform bool bSilhouette;
uniform bool bFxaa;
uniform bool bApplySsao;

uniform mat4 sunMatrix[2]; 
uniform vec3 sunPosHIGH[2];
uniform vec3 sunPosLOW[2];
uniform int sunIdx;
uniform float screenWidth;    
uniform float screenHeight;  
  


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

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);
  return enc;
}

float unpackDepthMago(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***
    float depth = dot(rgba_depth, bit_shift);
    return depth;
} 

float UnpackDepth32( in vec4 pack )
{
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);
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

vec3 getViewRay(vec2 tc)
{
	/*
	// The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
	float farForDepth = 30000.0;
	float hfar = 2.0 * tangentOfHalfFovy * farForDepth;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -farForDepth);  
	*/	
	
	
	float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
	
    return ray;                      
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
		
		vec2 screenPos_LD = vec2(screenPos.x - pixelSizeW*2.5, screenPos.y - pixelSizeH*2.5); // left-down corner.
		
		for(int w = 0; w<5; w++)
		{
			for(int h=0; h<5; h++)
			{
				vec2 screenPosAux = vec2(screenPos_LD.x + pixelSizeW*float(w), screenPos_LD.y + pixelSizeH*float(h));
				float z_window  = unpackDepthMago(texture2D(depthTex, screenPosAux.xy)); // z_window  is [0.0, 1.0] range depth.

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

				if(backgroundDepthCount > 0 && objectDepthCount > 0)
				{
					// is silhouette.
					gl_FragColor = vec4(0.2, 1.0, 0.3, 1.0);
					return;
				}
				
			}
		}
		
		return;
	}
	
	float shadow_occlusion = 1.0;
	float alpha = 0.0;
	vec4 finalColor;
	finalColor = vec4(0.2, 0.2, 0.2, 0.8);
	if(bApplyShadow)
	{
		// the sun lights count are 2.
		// 1rst, calculate the pixelPosWC.
		float z_window  = unpackDepth(texture2D(depthTex, screenPos.xy)); // z_window  is [0.0, 1.0] range depth.
		if(z_window < 0.001)
		discard;

		//vec3 ray = getViewRay(screenPos);
		//vec4 posWC = vec4(ray * z_window, 1.0);
		
		// https://stackoverflow.com/questions/11277501/how-to-recover-view-space-position-given-view-space-depth-value-and-ndc-xy
		float depthRange_near = 0.0;
		float depthRange_far = 1.0;
		float x_ndc = 2.0 * screenPos.x - 1.0;
		float y_ndc = 2.0 * screenPos.y - 1.0;
		float z_ndc = (2.0 * z_window - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);
		// Note: NDC range = (-1,-1,-1) to (1,1,1).***
		
		vec4 viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);
		vec3 posCC = viewPosH.xyz/viewPosH.w;
		vec4 posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);
		//------------------------------------------------------------------------------------------------------------------------------
		
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

		gl_FragColor = vec4(finalColor.rgb*shadow_occlusion, alpha);
		
	}

	if(bApplySsao)
	{
		vec3 normal = getNormal(screenPos).xyz;
		if(length(normal) > 0.1)
		{
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

			if(occlusion < 0.0)
			occlusion = 0.0;

			gl_FragColor = vec4(0.0, 0.0, 0.0, occlusion);
			//gl_FragColor = vec4(1.0, 0.0, 0.0, 0.2);

			// Provisionally render edges here.****************************************************************
			vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;
			vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;
			vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;
			vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;

			//vec3 normal_ur = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y)).xyz;
			//vec3 normal_rd = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y)).xyz;
			//vec3 normal_ld = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y)).xyz;
			//vec3 normal_lu = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y)).xyz;

			float factor = 0.0;
			float increF = 0.07 * 2.0;

			if(dot(normal, normal_up) < 0.3)
			{ factor += increF; }

			if(dot(normal, normal_right) < 0.3)
			{ factor += increF; }

			if(dot(normal, normal_down) < 0.3)
			{ factor += increF; }

			if(dot(normal, normal_left) < 0.3)
			{ factor += increF; }

			/*
			if(dot(normal, normal_ur) < 0.3)
			{ factor += increF; }

			if(dot(normal, normal_rd) < 0.3)
			{ factor += increF; }

			if(dot(normal, normal_ld) < 0.3)
			{ factor += increF; }

			if(dot(normal, normal_lu) < 0.3)
			{ factor += increF; }
			*/

			if(factor > increF*0.9)
			{
				gl_FragColor = vec4(0.0, 0.0, 0.0, factor+occlusion);
				return;
			}

		}
	}

	// check if is fastAntiAlias.***
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
		/*/
		vec4 n[9];
		make_kernel( n, vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight) );

		vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
		vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
		vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));

		gl_FragColor = vec4( 1.0 - sobel.rgb, 1.0 );
		//gl_FragColor = vec4(sobel.rgb, 1.0 );
		*/
		//gl_FragColor = color;
	}
    
}