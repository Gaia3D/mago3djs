precision highp float;
#extension GL_EXT_frag_depth : enable

uniform bool bUseLogarithmicDepth;
varying vec4 vColor;
varying float flogz;
varying float Fcoef_half;

void main() {
	gl_FragColor = vColor;
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
}