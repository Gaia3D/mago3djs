precision lowp float;

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D texUp;
uniform sampler2D texDown;
uniform vec2 u_tex_res;

varying vec4 vColor;
uniform bool bUseLogarithmicDepth;
uniform int uFrustumIdx;
uniform vec2 uDustConcentMinMax;
uniform float uZFactor;

varying float flogz;
varying float Fcoef_half;
varying float vDepth;
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

vec3 getRainbowColor_byHeight(float height)
{
	//float gray = (height - uDustConcentMinMax[0])/(uDustConcentMinMax[1] - uDustConcentMinMax[0]);
	float gray = height;
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	float r, g, b;
	
	if(gray < 0.16666)
	{
		b = 0.0;
		g = gray*6.0;
		r = 1.0;
	}
	else if(gray >= 0.16666 && gray < 0.33333)
	{
		b = 0.0;
		g = 1.0;
		r = 2.0 - gray*6.0;
	}
	else if(gray >= 0.33333 && gray < 0.5)
	{
		b = -2.0 + gray*6.0;
		g = 1.0;
		r = 0.0;
	}
	else if(gray >= 0.5 && gray < 0.66666)
	{
		b = 1.0;
		g = 4.0 - gray*6.0;
		r = 0.0;
	}
	else if(gray >= 0.66666 && gray < 0.83333)
	{
		b = 1.0;
		g = 0.0;
		r = -4.0 + gray*6.0;
	}
	else if(gray >= 0.83333)
	{
		b = 6.0 - gray*6.0;
		g = 0.0;
		r = 1.0;
	}
	
	float aux = r;
	r = b;
	b = aux;
	
	//b = -gray + 1.0;
	//if (gray > 0.5)
	//{
	//	g = -gray*2.0 + 2.0; 
	//}
	//else 
	//{
	//	g = gray*2.0;
	//}
	//r = gray;
	vec3 resultColor = vec3(r, g, b);
    return resultColor;
}   

void main()
{
	vec4 colorUp = texture2D(texUp, vTexCoord);
	vec4 colorDown = texture2D(texDown, vTexCoord);
	vec4 textureColor = mix(colorDown, colorUp, uZFactor);
	//vec4 textureColor = texture2D(texDown, vTexCoord);

	vec4 finalColor = vColor;
	float alpha = textureColor.a;
	float concent = textureColor.g;
	vec3 rainbowCol = getRainbowColor_byHeight(concent);

	finalColor = vec4(rainbowCol, alpha);
	float colValue = 1.0 - concent;//*concent;
	//colValue *= colValue;
	finalColor = vec4(1.0, colValue, colValue, concent);

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