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


uniform sampler2D texture_0; 
uniform sampler2D texture_1;

uniform bool textureFlipYAxis;

uniform float near;
uniform float far;            
uniform float fov;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    
//uniform float screenWidth;    
//uniform float screenHeight;     
uniform vec4 oneColor4;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

uniform float externalAlpha; // used by effects.
uniform bool bUseLogarithmicDepth;

uniform int uFrustumIdx;
// Code color for selection:
uniform vec4 uSelColor4;

uniform float uInterpolationFactor;

varying vec3 vNormal;
varying vec4 vColor4; // color from attributes
varying vec2 vTexCoord;   

varying float vDepth;

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
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***
    float depthAux = dot(rgba_depth, bit_shift);
    return depthAux;
}  

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
}

/*
// unpack depth used for shadow on screen.***
float unpackDepth_A(vec4 packedDepth)
{
	// See Aras Pranckevičius' post Encoding Floats to RGBA
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
*/

float UnpackDepth32( in vec4 pack )
{
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);
}             

vec3 getViewRay(vec2 tc)
{
	float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
}         
            


/*

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

vec3 normal_from_depth(float depth, vec2 texCoord) {
    // http://theorangeduck.com/page/pure-depth-ssao
    float pixelSizeX = 1.0/screenWidth;
    float pixelSizeY = 1.0/screenHeight;

    vec2 offset1 = vec2(0.0,pixelSizeY);
    vec2 offset2 = vec2(pixelSizeX,0.0);

	float depthA = 0.0;
	float depthB = 0.0;
	for(float i=0.0; i<1.0; i++)
	{
		depthA += getDepth(texCoord + offset1*(1.0+i));
		depthB += getDepth(texCoord + offset2*(1.0+i));
	}

	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);

    vec3 pos0 = reconstructPosition(texCoord, depth);
    vec3 normal = cross(posA - pos0, posB - pos0);
    normal.z = -normal.z;

    return normalize(normal);
}

mat3 sx = mat3( 
    1.0, 2.0, 1.0, 
    0.0, 0.0, 0.0, 
    -1.0, -2.0, -1.0 
);
mat3 sy = mat3( 
    1.0, 0.0, -1.0, 
    2.0, 0.0, -2.0, 
    1.0, 0.0, -1.0 
);

bool isEdge()
{
	vec3 I[3];
	vec2 screenPos = vec2((gl_FragCoord.x) / screenWidth, (gl_FragCoord.y) / screenHeight);
	float linearDepth = getDepth(screenPos);
	vec3 normal = normal_from_depth(linearDepth, screenPos);

    for (int i=0; i<3; i++) {
        //vec3 norm1 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,-1), 0 ).rgb * 2.0f - 1.0f;
        //vec3 norm2 =  texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,0), 0 ).rgb * 2.0f - 1.0f;
        //vec3 norm3 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,1), 0 ).rgb * 2.0f - 1.0f;
		vec2 screenPos1 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-1.0) / screenHeight);
		float linearDepth1 = getDepth(screenPos1);  

		vec2 screenPos2 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-0.0) / screenHeight);
		float linearDepth2 = getDepth(screenPos2);  

		vec2 screenPos3 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y+1.0) / screenHeight);
		float linearDepth3 = getDepth(screenPos1);  

		vec3 norm1 = normal_from_depth(linearDepth1, screenPos1);
        vec3 norm2 =  normal_from_depth(linearDepth2, screenPos2);
        vec3 norm3 = normal_from_depth(linearDepth3, screenPos3);
        float sampleValLeft  = dot(normal, norm1);
        float sampleValMiddle  = dot(normal, norm2);
        float sampleValRight  = dot(normal, norm3);
        I[i] = vec3(sampleValLeft, sampleValMiddle, sampleValRight);
    }

    float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); 
    float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);

    if((gx < 0.0 && gy < 0.0) || (gy < 0.0 && gx < 0.0) ) 
        return false;
	float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));

    if(g > 0.2) {
        return true;
    } 
	return false;
}
*/


void main()
{
	//bool testBool = false;
	//float occlusion = 1.0; // ambient occlusion.***
	//vec3 normal2 = vNormal;	
	//float scalarProd = 1.0;
	
	//vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
	//float linearDepth = getDepth(screenPos);   
	//vec3 ray = getViewRay(screenPos); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
	//occlusion = 1.0;
	vec4 textureColor;
	vec4 textureColor_0;
	vec4 textureColor_1;

    if(colorType == 2)
    {
        if(textureFlipYAxis)
        {
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, 1.0 - vTexCoord.t));
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, 1.0 - vTexCoord.t));
        }
        else{
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, vTexCoord.t));
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, vTexCoord.t));
        }

		textureColor = mix(textureColor_0, textureColor_1, uInterpolationFactor);
    }
    else if(colorType == 0)
	{
        textureColor = oneColor4;
    }
	else if(colorType == 1)
	{
        textureColor = vColor4;
    }
	
    vec4 finalColor;
	float pollutionValue = UnpackDepth32(textureColor);

	vec4 albedo4 = finalColor;

	finalColor = vec4(pollutionValue, pollutionValue, pollutionValue, pollutionValue);
    gl_FragData[0] = finalColor; 

	#ifdef USE_MULTI_RENDER_TARGET
	{
		// save depth, normal, albedo.
		float depthAux = vDepth;
		gl_FragData[1] = packDepth(depthAux); 

		// When render with cull_face disabled, must correct the faces normal.
		float frustumIdx = 1.0;
		if(uFrustumIdx == 0)
		frustumIdx = 0.005;
		else if(uFrustumIdx == 1)
		frustumIdx = 0.015;
		else if(uFrustumIdx == 2)
		frustumIdx = 0.025;
		else if(uFrustumIdx == 3)
		frustumIdx = 0.035;

		vec3 normal = vNormal;

		vec3 encodedNormal = encodeNormal(normal);
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***

		// albedo.
		gl_FragData[3] = albedo4; 

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