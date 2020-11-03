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


uniform float near;
uniform float far;
uniform int uFrustumIdx;

uniform bool bUseLogarithmicDepth;

varying float flogz;
varying float Fcoef_half;

// clipping planes.***
uniform bool bApplyClippingPlanes;
uniform int clippingPlanesCount;
uniform vec4 clippingPlanes[6];

varying float depth;  
/*
vec4 packDepth(const in float depth)
{
    // mago packDepth.***
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); 
    vec4 res = fract(depth * bit_shift);
    res -= res.xxyz * bit_mask;
    return res;  
}
*/


vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}


vec4 PackDepth32( in float depth )
{
    depth *= (16777216.0 - 1.0) / (16777216.0);
    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0
    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;
}

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
}

vec3 decodeNormal(in vec3 normal)
{
	return normal * 2.0 - 1.0;
}

void main()
{     
    vec2 pt = gl_PointCoord - vec2(0.5);
	float distSquared = pt.x*pt.x+pt.y*pt.y;
	if(distSquared > 0.25)
		discard;
        
    if(!bUseLogarithmicDepth)
	{
    	gl_FragData[0] = packDepth(-depth);
	}

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

    // use frustumIdx from 10 to 13, instead from 0 to 3.***


    #ifdef USE_MULTI_RENDER_TARGET
	vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));
	gl_FragData[1] = vec4(normal, frustumIdx); // save normal.***
	#endif

    #ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
        gl_FragData[0] = packDepth(gl_FragDepthEXT);
	}
	#endif
}