precision highp float;

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform bool bUseLogarithmicDepth;
uniform bool bUseMultiRenderTarget;
varying vec4 vColor;
varying float flogz;
varying float Fcoef_half;

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

void main() {
	gl_FragData[0] = vColor;

	#ifdef USE_MULTI_RENDER_TARGET
	if(bUseMultiRenderTarget)
	{
		gl_FragData[1] = vec4(0.0);
		gl_FragData[2] = vec4(0.0);
		gl_FragData[3] = vec4(0.0);
		/*
		// TODO:
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

		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***

		// now, albedo.
		gl_FragData[3] = vColor; 
		*/
	}
	#endif

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}