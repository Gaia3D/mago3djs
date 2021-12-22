#ifdef GL_ES
    precision highp float;
#endif

#define M_PI 3.1415926535897932384626433832795

uniform sampler2D depthTex; // 0
uniform sampler2D normalTex; // 1
uniform sampler2D lightFogTex; // 2
uniform sampler2D screenSpaceObjectsTex; // 3
uniform sampler2D shadedColorTex; // 4
uniform sampler2D brightColorTex; // 5

uniform float near;
uniform float far; 
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    

uniform float screenWidth;    
uniform float screenHeight;  
uniform vec2 uNearFarArray[4];
uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;
uniform float uSceneDayNightLightingFactor; // day -> 1.0; night -> 0.0

uniform vec3 uAmbientLight;

uniform bool u_activeTex[8];

#ifndef FXAA_REDUCE_MIN
    #define FXAA_REDUCE_MIN   (1.0/ 128.0)
#endif
#ifndef FXAA_REDUCE_MUL
    #define FXAA_REDUCE_MUL   (1.0 / 8.0)
#endif
#ifndef FXAA_SPAN_MAX
    #define FXAA_SPAN_MAX     8.0
#endif

// Tutorial for bloom effect : https://learnopengl.com/Advanced-Lighting/Bloom


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

vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec4 getNormal(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(normalTex, texCoord);
    return decodeNormal(encodedNormal);
}

bool isEdge(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y, inout float edgeRatio)
{
	bool bIsEdge = false;

	// 1rst, check by normals.***
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;
	vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;
	vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;

	float minDot = 0.3;
    edgeRatio = 0.0;

	if(dot(normal, normal_up) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_right) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_down) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_left) < minDot)
	{ edgeRatio += 1.0; }

	// Now, check by depth.***
    if(edgeRatio > 0.0)
    bIsEdge = true;

    edgeRatio /= 4.0;

	return bIsEdge;
}

bool isEdge_3x3(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y, inout float edgeRatio)
{
	bool bIsEdge = false;

	// 1rst, check by normals.***
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y)).xyz;
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y)).xyz;
	vec3 normal_down = getNormal(vec2(screenPos.x, screenPos.y - pixelSize_y)).xyz;
	vec3 normal_left = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y)).xyz;

    vec3 normal_upRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y)).xyz;
	vec3 normal_upLeft = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y)).xyz;
	vec3 normal_downRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y)).xyz;
	vec3 normal_downLeft = getNormal(vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y)).xyz;

	float minDot = 0.3;
    edgeRatio = 0.0;

	if(dot(normal, normal_up) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_right) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_down) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_left) < minDot)
	{ edgeRatio += 1.0; }

    if(dot(normal, normal_upRight) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_upLeft) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_downRight) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_downLeft) < minDot)
	{ edgeRatio += 1.0; }

	// Now, check by depth.***
    if(edgeRatio > 0.0)
    bIsEdge = true;

    edgeRatio /= 8.0;

	return bIsEdge;
}

bool isEdge_original(vec2 screenPos, vec3 normal, float pixelSize_x, float pixelSize_y, inout float edgeRatio)
{
	bool bIsEdge = false;

	// 1rst, check by normals.***
	vec3 normal_up = getNormal(vec2(screenPos.x, screenPos.y + pixelSize_y*1.0)).xyz;
	vec3 normal_right = getNormal(vec2(screenPos.x + pixelSize_x*1.0, screenPos.y)).xyz;
	vec3 normal_upRight = getNormal(vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y)).xyz;

	float minDot = 0.3;
    edgeRatio = 0.0;

	if(dot(normal, normal_up) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_right) < minDot)
	{ edgeRatio += 1.0; }

	if(dot(normal, normal_upRight) < minDot)
	{ edgeRatio += 1.0; }

	// Now, check by depth.***
    if(edgeRatio > 0.0)
    bIsEdge = true;

    edgeRatio /= 3.0;

	return bIsEdge;
}

vec4 getShadedAlbedo(vec2 screenPos)
{
	return texture2D(shadedColorTex, screenPos);
}

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

vec4 fxaa(vec2 fragCoord, vec2 resolution,
            vec2 v_rgbNW, vec2 v_rgbNE, 
            vec2 v_rgbSW, vec2 v_rgbSE, 
            vec2 v_rgbM) {
    vec4 color;
    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);
    vec3 rgbNW = texture2D(shadedColorTex, v_rgbNW).xyz;
    vec3 rgbNE = texture2D(shadedColorTex, v_rgbNE).xyz;
    vec3 rgbSW = texture2D(shadedColorTex, v_rgbSW).xyz;
    vec3 rgbSE = texture2D(shadedColorTex, v_rgbSE).xyz;
    vec4 texColor = texture2D(shadedColorTex, v_rgbM);
    vec3 rgbM  = texColor.xyz;
    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    
    mediump vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
    
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *
                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
    
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),
              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
              dir * rcpDirMin)) * inverseVP;
    
    vec3 rgbA = 0.5 * (
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * -0.5).xyz +
        texture2D(shadedColorTex, fragCoord * inverseVP + dir * 0.5).xyz);

    float lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax))
        color = vec4(rgbA, texColor.a);
    else
        color = vec4(rgbB, texColor.a);
    return color;
}

void main()
{
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
    float pixelSize_x = 1.0/screenWidth;
	float pixelSize_y = 1.0/screenHeight;

    // check for "screenSpaceObjectsTex".
    vec4 screenSpaceColor4;
    if(u_activeTex[1])
    {
        screenSpaceColor4 = texture2D(screenSpaceObjectsTex, screenPos);
        gl_FragColor = screenSpaceColor4;

        //if(screenSpaceColor4.a > 0.0)
        //return;
    }

	vec4 shadedColor = texture2D(shadedColorTex, screenPos);

    // Calculate if isEdge by sobel.***
	bool bIsEdge = false;

	vec4 n[9];
    make_kernel(n, screenPos);
    vec4 sobel_edge_h = n[2] + (2.0*n[5]) + n[8] - (n[0] + (2.0*n[3]) + n[6]);
	vec4 sobel_edge_v = n[0] + (2.0*n[1]) + n[2] - (n[6] + (2.0*n[7]) + n[8]);
	vec4 sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));
	float sobelModul = length(sobel.rgb);
	
	if(sobelModul > 0.001)
	{
		bIsEdge = true;
	}

	if(bIsEdge)
	{
		// fxaa.*********************************************************************************************************
		// https://www.programmersought.com/article/75321121466/
		vec2 uv_nw = vec2(screenPos.x - pixelSize_x, screenPos.y + pixelSize_y);
		vec2 uv_ne = vec2(screenPos.x + pixelSize_x, screenPos.y + pixelSize_y);
		vec2 uv_sw = vec2(screenPos.x - pixelSize_x, screenPos.y - pixelSize_y);
		vec2 uv_se = vec2(screenPos.x + pixelSize_x, screenPos.y - pixelSize_y);
		vec4 colorFxaa = fxaa(gl_FragCoord.xy, vec2(screenWidth, screenHeight), uv_nw, uv_ne, uv_sw, uv_se, screenPos);
		shadedColor = colorFxaa;
		//---------------------------------------------------------------------------------------------------------------
	}

    // Do bloom effect if exist.************************************
    // https://www.nutty.ca/?page_id=352&link=glow
    int BlendMode = 1;
    vec4 brightColor = texture2D(brightColorTex, screenPos);
    vec4 src = vec4(brightColor.rgba);
    vec4 dst = vec4(shadedColor.rgba);
    if ( BlendMode == 0 )
	{
		// Additive blending (strong result, high overexposure)
		shadedColor = min(src + dst, 1.0);
	}
	else if ( BlendMode == 1 )
	{
		// Screen blending (mild result, medium overexposure)
		shadedColor = clamp((src + dst) - (src * dst), 0.0, 1.0);
		shadedColor.w = 1.0;
	}
	else if ( BlendMode == 2 )
	{
		// Softlight blending (light result, no overexposure)
		// Due to the nature of soft lighting, we need to bump the black region of the glowmap
		// to 0.5, otherwise the blended result will be dark (black soft lighting will darken
		// the image).
		src = (src * 0.5) + 0.5;
		
		shadedColor.xyz = vec3((src.x <= 0.5) ? (dst.x - (1.0 - 2.0 * src.x) * dst.x * (1.0 - dst.x)) : (((src.x > 0.5) && (dst.x <= 0.25)) ? (dst.x + (2.0 * src.x - 1.0) * (4.0 * dst.x * (4.0 * dst.x + 1.0) * (dst.x - 1.0) + 7.0 * dst.x)) : (dst.x + (2.0 * src.x - 1.0) * (sqrt(dst.x) - dst.x))),
					(src.y <= 0.5) ? (dst.y - (1.0 - 2.0 * src.y) * dst.y * (1.0 - dst.y)) : (((src.y > 0.5) && (dst.y <= 0.25)) ? (dst.y + (2.0 * src.y - 1.0) * (4.0 * dst.y * (4.0 * dst.y + 1.0) * (dst.y - 1.0) + 7.0 * dst.y)) : (dst.y + (2.0 * src.y - 1.0) * (sqrt(dst.y) - dst.y))),
					(src.z <= 0.5) ? (dst.z - (1.0 - 2.0 * src.z) * dst.z * (1.0 - dst.z)) : (((src.z > 0.5) && (dst.z <= 0.25)) ? (dst.z + (2.0 * src.z - 1.0) * (4.0 * dst.z * (4.0 * dst.z + 1.0) * (dst.z - 1.0) + 7.0 * dst.z)) : (dst.z + (2.0 * src.z - 1.0) * (sqrt(dst.z) - dst.z))));
		shadedColor.w = 1.0;
	}
	else
	{
		// Show just the glow map
		shadedColor = src;
	}
    // End bloom effect.--------------------------------------------

    vec4 finalColor = shadedColor;

    // Check for light fog.
    if(u_activeTex[0])
    {
        vec4 lightFog4 = texture2D(lightFogTex, screenPos);
        float alpha = lightFog4.w;
        if(alpha > 0.6)
        alpha = 0.6;
        finalColor = mix(shadedColor, lightFog4, alpha);
    }
    
    gl_FragColor = finalColor; // original.***
}