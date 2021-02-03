precision lowp float;

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D smokeTex;
uniform vec4 uStrokeColor;
varying vec4 vColor;
varying float glPointSize;
uniform int uPointAppereance; // square, circle, romboide,...
uniform int uStrokeSize;
uniform bool bUseLogarithmicDepth;
uniform int uFrustumIdx;
varying float flogz;
varying float Fcoef_half;
varying float vDepth;
varying float vDustConcent;
varying float vDustConcentRel;
varying vec2 vTexCoord;

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

// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
// https://community.khronos.org/t/random-values/75728
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

void main()
{
	vec2 pt = gl_PointCoord - vec2(0.5);
	float distSquared = pt.x*pt.x+pt.y*pt.y;
	//if(distSquared > 0.25)
	//	discard;

	vec4 textureColor = texture2D(smokeTex, gl_PointCoord);
	if(textureColor.a < 0.1)
	discard;

	vec4 finalColor = vColor;
	float alpha = textureColor.a * 2.0;
	float green = vDustConcentRel;
	//if(pt.x < 0.0 && pt.y < 0.0)
	{
		//float ptLength = length(pt);
		//green *= (1.0 - ptLength);
		//if(green < 0.0)
		//green = 0.0;
	}
	finalColor = vec4(green * 0.5, green, vTexCoord.x, alpha);
	//finalColor = textureColor;
	//float strokeDist = 0.1;
	//if(glPointSize > 10.0)
	//strokeDist = 0.15;

	//if(uStrokeSize > 0)
	//{
	//	if(distSquared >= strokeDist)
	//	{
	//		finalColor = uStrokeColor;
	//	}
	//}
	gl_FragData[0] = finalColor;

	#ifdef USE_MULTI_RENDER_TARGET
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
	#endif

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}