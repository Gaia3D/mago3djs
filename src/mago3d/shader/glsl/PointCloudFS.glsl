precision lowp float;

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

uniform vec4 uStrokeColor;
varying vec4 vColor;
varying float glPointSize;
uniform int uPointAppereance; // square, circle, romboide,...
uniform int uStrokeSize;
uniform bool bUseLogarithmicDepth;

varying float flogz;
varying float Fcoef_half;

void main()
{
	vec2 pt = gl_PointCoord - vec2(0.5);
	float distSquared = pt.x*pt.x+pt.y*pt.y;
	if(distSquared > 0.25)
		discard;

	vec4 finalColor = vColor;
	float strokeDist = 0.1;
	if(glPointSize > 10.0)
	strokeDist = 0.15;

	if(uStrokeSize > 0)
	{
		if(distSquared >= strokeDist)
		{
			finalColor = uStrokeColor;
		}
	}
	gl_FragData[0] = finalColor;

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}