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

uniform sampler2D diffuseTex; // used only if texture is PNG, that has pixels with alpha = 0.0.***
uniform bool bHasTexture; // indicates if texture is PNG, that has pixels with alpha = 0.0.***
varying vec2 vTexCoord; // used only if texture is PNG, that has pixels with alpha = 0.0.***
uniform bool textureFlipYAxis;

uniform float near;
uniform float far;

// clipping planes.***
uniform bool bApplyClippingPlanes;
uniform int clippingPlanesCount;
uniform vec4 clippingPlanes[6];
uniform bool bUseLogarithmicDepth;
uniform int uFrustumIdx;

varying float depth;  
varying vec3 vertexPos;
varying vec3 vNormal;
varying float flogz;
varying float Fcoef_half;
varying float vFrustumIdx;
/*
vec4 packDepth(const in float depth)
{
	// mago packDepth.***
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0); // original.***
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625);  // original.*** 
	
    //vec4 res = fract(depth * bit_shift); // Is not precise.
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.
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


vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
}

vec3 decodeNormal(in vec3 normal)
{
	return normal * 2.0 - 1.0;
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

	// check if is a pixel with alpha zero.***
	if(bHasTexture)
	{
		vec4 textureColor;
		if(textureFlipYAxis)
        {
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));
        }
        else{
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));
        }
		if(textureColor.a < 0.4)
		discard;
	}
	

	if(!bUseLogarithmicDepth)
	{
    	gl_FragData[0] = packDepth(-depth);
	}

	float frustumIdx = 1.0;
	if(uFrustumIdx == 0)
	frustumIdx = 0.005;
	else if(uFrustumIdx == 1)
	frustumIdx = 0.015;
	else if(uFrustumIdx == 2)
	frustumIdx = 0.025;
	else if(uFrustumIdx == 3)
	frustumIdx = 0.035;

	#ifdef USE_MULTI_RENDER_TARGET
	vec3 encodedNormal = encodeNormal(vNormal);
	gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***
	#endif
	

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
		gl_FragData[0] = packDepth(gl_FragDepthEXT);
	}
	#endif
}