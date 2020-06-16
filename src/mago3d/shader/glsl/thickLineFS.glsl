precision highp float;

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

uniform bool bUseLogarithmicDepth;
varying vec4 vColor;
varying float flogz;
varying float Fcoef_half;

void main() {
	gl_FragColor = vColor;
	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}