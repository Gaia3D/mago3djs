#ifdef GL_ES
precision highp float;
#endif

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

uniform float near;
uniform float far;

// clipping planes.***
uniform bool bApplyClippingPlanes;
uniform int clippingPlanesCount;
uniform vec4 clippingPlanes[6];
uniform bool bUseLogarithmicDepth;

varying float depth;  
varying vec3 vertexPos;
varying float flogz;
varying float Fcoef_half;

vec4 packDepth(const in float depth)
{
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0); // original.***
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625);  // original.*** 
	
    //vec4 res = fract(depth * bit_shift); // Is not precise.
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.
    res -= res.xxyz * bit_mask;
    return res;  
}


//vec4 PackDepth32( in float depth )
//{
//    depth *= (16777216.0 - 1.0) / (16777216.0);
//    vec4 encode = fract( depth * vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0
//    return vec4( encode.xyz - encode.yzw / 256.0, encode.w ) + 1.0/512.0;
//}

bool clipVertexByPlane(in vec4 plane, in vec3 point)
{
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;
	
	if(dist < 0.0)
	return true;
	else return false;
}

void main()
{     
	// 1rst, check if there are clipping planes.
	if(bApplyClippingPlanes)
	{
		bool discardFrag = true;
		for(int i=0; i<6; i++)
		{
			vec4 plane = clippingPlanes[i];
			if(!clipVertexByPlane(plane, vertexPos))
			{
				discardFrag = false;
				break;
			}
			if(i >= clippingPlanesCount)
			break;
		}
		
		if(discardFrag)
		discard;
	}
	
    gl_FragData[0] = packDepth(-depth);
	//gl_FragData[0] = PackDepth32(depth);
	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}