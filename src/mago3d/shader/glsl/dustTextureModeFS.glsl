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
uniform vec2 uDustConcentMinMax_up;
uniform vec2 uDustConcentMinMax_down;
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

float round(in float value)
{
	return floor(value + 0.5);
}

float calculateIndex(in float rawConcentration)
{
	//Index index1 = new Index(0, 50, 1);    // 좋음
	//Index index2 = new Index(51, 100, 2);  // 보통
	//Index index3 = new Index(101, 250, 3); // 나쁨
	//Index index4 = new Index(251, 500, 4); // 매우나쁨

	//pm25.addIndexStep(new IndexStep(index1,  0.0,  15.0));
	//pm25.addIndexStep(new IndexStep(index2, 16.0,  35.0));
	//pm25.addIndexStep(new IndexStep(index3, 36.0,  75.0));
	//pm25.addIndexStep(new IndexStep(index4, 76.0, 500.0));

	// 1rst, calculate index:
	int indexStep;
	float valueAux = rawConcentration;
	if(valueAux >= 0.0 && valueAux <= 15.0)
	{
		indexStep = 1;
	}
	else if(valueAux > 15.0 && valueAux <= 35.0)
	{
		indexStep = 2;
	}
	else if(valueAux > 35.0 && valueAux <= 75.0)
	{
		indexStep = 3;
	}
	else if(valueAux > 75.0 && valueAux <= 500.0)
	{
		indexStep = 4;
	}
	else
	{
		indexStep = -1;
	}

	float iLow, iHigh;
	float cLow, cHigh;

	int idx = indexStep;

	if(idx == 1)
	{
		iLow = 0.0;
		iHigh = 50.0;
		cLow = 0.0;
		cHigh = 15.0;
	}
	else if(idx == 2)
	{
		iLow = 51.0;
		iHigh = 100.0;
		cLow = 16.0;
		cHigh = 35.0;
	}
	else if(idx == 3)
	{
		iLow = 101.0;
		iHigh = 250.0;
		cLow = 36.0;
		cHigh = 75.0;
	}
	else if(idx == 4)
	{
		iLow = 251.0;
		iHigh = 500.0;
		cLow = 76.0;
		cHigh = 500.0;
	}

	float rawIndex = (iHigh - iLow) / (cHigh - cLow) * (rawConcentration - cLow) + iLow;
	//return int(round(rawIndex));
	return rawIndex;
}

vec3 getBBCAndYeonHwa_colorCoded(float index)
{
	// 0 = rgb(0.16796875, 0.51171875, 0.7265625)
	// 50 = rgb(0.66796875, 0.86328125, 0.640625)
	// 100 = rgb(0.99609375, 0.99609375, 0.74609375)
	// 250 = rgb(0.98828125, 0.6796875, 0.37890625)
	// 500 = rgb(0.83984375, 0.09765625, 0.109375)

	vec3 result;

	if(index < 0.0)
	{
		return vec3(0.0, 0.0, 0.0);
	}

	if(index >= 0.0 && index < 50.0)
	{
		vec3 colorTop = vec3(0.16796875, 0.51171875, 0.7265625);
		vec3 colorDown = vec3(0.66796875, 0.86328125, 0.640625);
		float indexFactor = (index - 0.0)/(50.0 - 0.0);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(1.0, 0.0, 0.0);
	}
	else if(index >= 50.0 && index < 100.0)
	{
		vec3 colorTop = vec3(0.66796875, 0.86328125, 0.640625);
		vec3 colorDown = vec3(0.99609375, 0.99609375, 0.74609375);
		float indexFactor = (index - 50.0)/(100.0 - 50.0);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(0.0, 1.0, 0.0);
	}
	else if(index >= 100.0 && index < 250.0)
	{
		vec3 colorTop = vec3(0.99609375, 0.99609375, 0.74609375);
		vec3 colorDown = vec3(0.98828125, 0.6796875, 0.37890625);
		float indexFactor = (index - 100.0)/(250.0 - 100.0);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(0.0, 0.0, 1.0);
	}
	else if(index >= 250.0 && index < 500.0)
	{
		vec3 colorTop = vec3(0.98828125, 0.6796875, 0.37890625);
		vec3 colorDown = vec3(0.83984375, 0.09765625, 0.109375);
		float indexFactor = (index - 250.0)/(500.0 - 250.0);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(1.0, 1.0, 0.0);
	}
	else
	{
		return vec3(1.0, 0.0, 1.0);
	}

	return result;
}

vec3 getBBCAndYeonHwa_colorCoded_tight(float rawConcent)
{
	// 0 = rgb(0.16796875, 0.51171875, 0.7265625)
	// 50 = rgb(0.66796875, 0.86328125, 0.640625)
	// 100 = rgb(0.99609375, 0.99609375, 0.74609375)
	// 250 = rgb(0.98828125, 0.6796875, 0.37890625)
	// 500 = rgb(0.83984375, 0.09765625, 0.109375)

	// Try to exagere index.***
	//uDustConcentMinMax[1] - uDustConcentMinMax[0]
	float maxConcent = uDustConcentMinMax_down[1];
	float minConcent = uDustConcentMinMax_down[0];
	float increConcent = maxConcent/4.0;

	vec3 result;

	if(rawConcent < 0.0)
	{
		return vec3(0.0, 0.0, 0.0);
	}

	if(rawConcent >= minConcent && rawConcent < minConcent + increConcent * 1.0)
	{
		vec3 colorTop = vec3(0.16796875, 0.51171875, 0.7265625);
		vec3 colorDown = vec3(0.66796875, 0.86328125, 0.640625);
		float minValue = minConcent;
		float maxValue = minConcent + increConcent * 1.0;
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);
		indexFactor = indexFactor - floor(indexFactor); 
		//result = mix(colorDown, colorTop, indexFactor);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(1.0, 0.0, 0.0);
	}
	else if(rawConcent >= minConcent + increConcent * 1.0 && rawConcent < minConcent + increConcent * 2.0)
	{
		vec3 colorTop = vec3(0.66796875, 0.86328125, 0.640625);
		vec3 colorDown = vec3(0.99609375, 0.99609375, 0.74609375);
		float minValue = minConcent + increConcent * 1.0;
		float maxValue = minConcent + increConcent * 2.0;
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);
		indexFactor = indexFactor - floor(indexFactor); 
		//result = mix(colorDown, colorTop, indexFactor);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(0.0, 1.0, 0.0);
	}
	else if(rawConcent >= minConcent + increConcent * 2.0 && rawConcent < minConcent + increConcent * 3.0)
	{
		vec3 colorTop = vec3(0.99609375, 0.99609375, 0.74609375);
		vec3 colorDown = vec3(0.98828125, 0.6796875, 0.37890625);
		float minValue = minConcent + increConcent * 2.0;
		float maxValue = minConcent + increConcent * 3.0;
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);
		indexFactor = indexFactor - floor(indexFactor); 
		//result = mix(colorDown, colorTop, indexFactor);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(0.0, 0.0, 1.0);
	}
	else if(rawConcent >= minConcent + increConcent * 3.0 && rawConcent < minConcent + increConcent * 4.0)
	{
		vec3 colorTop = vec3(0.98828125, 0.6796875, 0.37890625);
		vec3 colorDown = vec3(0.83984375, 0.09765625, 0.109375);
		float minValue = minConcent + increConcent * 3.0;
		float maxValue = minConcent + increConcent * 4.0;
		float indexFactor = (rawConcent - minValue)/(maxValue - minValue);
		indexFactor = indexFactor - floor(indexFactor); 
		//result = mix(colorDown, colorTop, indexFactor);
		result = mix(colorTop, colorDown, indexFactor);
		//return vec3(1.0, 1.0, 0.0);
	}
	else
	{
		return vec3(1.0, 0.0, 1.0);
	}

	return result;
}

void main()
{
	vec4 colorUp = texture2D(texUp, vTexCoord);
	vec4 colorDown = texture2D(texDown, vTexCoord);

	// now, calculate realConcent_up & realConcent_down.***
	float realConcent_up = colorUp.r * (uDustConcentMinMax_up[1] - uDustConcentMinMax_up[0]) + uDustConcentMinMax_up[0];
	float realConcent_down = colorDown.r * (uDustConcentMinMax_down[1] - uDustConcentMinMax_down[0]) + uDustConcentMinMax_down[0];
	float realConcent = mix(realConcent_down, realConcent_up, uZFactor);
	float concentMin = mix(uDustConcentMinMax_down[0], uDustConcentMinMax_up[0], uZFactor);
	float concentMax = mix(uDustConcentMinMax_down[1], uDustConcentMinMax_up[1], uZFactor);
	vec4 textureColor = mix(colorDown, colorUp, uZFactor);
	//vec4 textureColor = texture2D(texDown, vTexCoord);

	vec4 finalColor = vColor;
	float alpha = textureColor.a;
	float concent = textureColor.g;
	vec3 rainbowCol = getRainbowColor_byHeight(concent);

	// BBC & YeonHwa color system.********************************************************************************
	// BBC & YeonHwa color system.********************************************************************************
	//float realConcent = concent * (uDustConcentMinMax_down[1] - uDustConcentMinMax_down[0]) + uDustConcentMinMax_down[0];
	float indexMin = calculateIndex(concentMin);
	float indexMax = calculateIndex(concentMax);
	float index = calculateIndex(realConcent);

	float scaledIndex = (index - indexMin)/(indexMax - indexMin);
	scaledIndex *= 500.0;
	//vec3 colorAux = getBBCAndYeonHwa_colorCoded(scaledIndex);
	vec3 colorAux = getBBCAndYeonHwa_colorCoded_tight(realConcent);
	//-------------------------------------------------------------------------------------------------------------
	//-------------------------------------------------------------------------------------------------------------

	//finalColor = vec4(rainbowCol, alpha);
	
	if(concent < 0.00001)
	{
		finalColor = vec4(colorAux, 0.0);
	}
	else{
		finalColor = vec4(colorAux, 0.7);
	}
	


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