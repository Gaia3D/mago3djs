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
uniform int uFrustumIdx;
uniform int uElemIndex;
uniform int uTotalPointsCount; // total points to draw.
uniform vec2 viewport;
uniform float thickness;
varying vec4 vColor;
varying float flogz;
varying float Fcoef_half;
varying float vDepth;
varying float vCurrentIndex;

varying float vSense;

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
	// calculate the transparency.
	float alpha = 1.0 - (vCurrentIndex - float(uElemIndex))/float(uTotalPointsCount);

	// use vSense to calculate aditional transparency in the borders of the thick line.***
	float beta = sin(acos(vSense));
	alpha *= beta;

	vec4 finalColor =  vec4(vColor.rgb, alpha);

	gl_FragData[0] = finalColor; // original.***

	#ifdef USE_MULTI_RENDER_TARGET
	if(bUseMultiRenderTarget)
	{
		gl_FragData[1] = packDepth(vDepth);
		

		// Note: points cloud data has frustumIdx 20 .. 23.********
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. 
		
		if(uFrustumIdx == 0)
		frustumIdx = 0.005; // frustumIdx = 20.***
		else if(uFrustumIdx == 1)
		frustumIdx = 0.015; // frustumIdx = 21.***
		else if(uFrustumIdx == 2)
		frustumIdx = 0.025; // frustumIdx = 22.***
		else if(uFrustumIdx == 3)
		frustumIdx = 0.035; // frustumIdx = 23.***

		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***

		// now, albedo.
		gl_FragData[3] = finalColor;
		
	}
	#endif

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}