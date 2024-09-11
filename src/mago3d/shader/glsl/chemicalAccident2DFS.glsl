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


uniform sampler2D texture_0; 
uniform sampler2D texture_1;

uniform bool textureFlipYAxis;

uniform float near;
uniform float far;            
uniform float fov;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    
//uniform float screenWidth;    
//uniform float screenHeight;     
uniform vec4 oneColor4;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

uniform float externalAlpha; // used by effects.
uniform bool bUseLogarithmicDepth;

uniform int uFrustumIdx;
// Code color for selection:
uniform vec4 uSelColor4;

uniform float uInterpolationFactor;
uniform vec2 uMinMaxQuantizedValues_tex0;
uniform vec2 uMinMaxQuantizedValues_tex1;
uniform vec2 uMinMaxValues;
uniform vec2 uMinMaxValuesToRender;
uniform int uTextureSize[2];

// Legend colors.***
uniform vec4 uLegendColors[16];
uniform float uLegendValues[16];
uniform int uLegendColorsCount;
uniform float uLegendValuesScale;

uniform int uRenderBorder;
uniform int uRenderingColorType; // 0= rainbow, 1= monotone, 2= legendColors.
uniform int uTextureFilterType; // 0= nearest, 1= linear interpolation.

varying vec3 vNormal;
varying vec4 vColor4; // color from attributes
varying vec2 vTexCoord;   

varying float vDepth;

varying float flogz;
varying float Fcoef_half;

vec4 packDepth( float v ) {
	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
	enc = fract(enc);
	enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
	return enc;
}

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***
    float depthAux = dot(rgba_depth, bit_shift);
    return depthAux;
}  

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
}

/*
// unpack depth used for shadow on screen.***
float unpackDepth_A(vec4 packedDepth)
{
	// See Aras Pranckevičius' post Encoding Floats to RGBA
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
*/

float UnpackDepth32( in vec4 pack )
{
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);
}   

float unQuantize(float quantizedValue, float minVal, float maxVal)
{
    if(quantizedValue > 1.0){ quantizedValue = 1.0; }
    else if(quantizedValue < 0.0){ quantizedValue = 0.0; }
	float unquantizedValue = quantizedValue * (maxVal - minVal) + minVal;
	return unquantizedValue;
}

vec3 getViewRay(vec2 tc)
{
	float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
}         

float getRealValueNearest(vec2 texCoord, int texIdx)
{
    vec4 textureColor;
    float minVal, maxVal;
    if(texIdx == 0)
    {
        textureColor = texture2D(texture_0, texCoord);
        minVal = uMinMaxQuantizedValues_tex0.x;
        maxVal = uMinMaxQuantizedValues_tex0.y;
    }
    else if(texIdx == 1)
    {
        textureColor = texture2D(texture_1, texCoord);
        minVal = uMinMaxQuantizedValues_tex1.x;
        maxVal = uMinMaxQuantizedValues_tex1.y;
    }

    float quantized = UnpackDepth32(textureColor);
    float realPollutionVal = unQuantize(quantized,minVal, maxVal);
    return realPollutionVal;
}         


float getRealValueLinearInterpolation(vec2 texCoord)
{
    float resultInterpolatedValue = 0.0;

    if(uTextureSize[0] != 150 || uTextureSize[1] != 150)
    {
        return 0.0;
    }

        
    vec2 imageSize = vec2(float(uTextureSize[0]), float(uTextureSize[1]));
    vec2 pix = 1.0/imageSize;
    vec2 vc = (floor(texCoord * imageSize)) * pix;

    if(uTextureFilterType == 0)  // 0= nearest, 1= linear interpolation.
    {
        float vt_0 = getRealValueNearest(vc, 0);
        float vt_1 = getRealValueNearest(vc, 1);
        return mix(vt_0, vt_1, uInterpolationFactor);
    }
    else{
        vec2 f = fract(texCoord * imageSize);
        vec2 tl = vec2(vc);
        vec2 tr = (vc + vec2(pix.x, 0.0));
        vec2 bl = (vc + vec2(0.0, pix.y));
        vec2 br = (vc + pix);
        
        float value_tl_0 = getRealValueNearest(tl, 0);
        float value_tr_0 = getRealValueNearest(tr, 0);
        float value_bl_0 = getRealValueNearest(bl, 0);
        float value_br_0 = getRealValueNearest(br, 0);

        float value_tl_1 = getRealValueNearest(tl, 1);
        float value_tr_1 = getRealValueNearest(tr, 1);
        float value_bl_1 = getRealValueNearest(bl, 1);
        float value_br_1 = getRealValueNearest(br, 1);

        float value_tl = mix(value_tl_0, value_tl_1, uInterpolationFactor);
        float value_tr = mix(value_tr_0, value_tr_1, uInterpolationFactor);
        float value_bl = mix(value_bl_0, value_bl_1, uInterpolationFactor);
        float value_br = mix(value_br_0, value_br_1, uInterpolationFactor);

        float value_t = mix(value_tl, value_tr, f.x);
        float value_b = mix(value_bl, value_br, f.x);

        resultInterpolatedValue = mix(value_t, value_b, f.y);
    }
    return resultInterpolatedValue;
}



vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)
{
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
	if (gray > 1.0){ gray = 0.9999; }
	else if (gray<0.0){ gray = 0.0; }

    float value = gray * 3.99;
    float h = floor(value);
    float f = fract(value);

    vec4 resultColor = vec4(0.0, 0.0, 0.0, gray);

    if(hotToCold)
    {
        // HOT to COLD.***
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init
        if(h >= 0.0 && h < 1.0)
        {
            // mix red & yellow.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(red, yellow, f);
        }
        else if(h >= 1.0 && h < 2.0)
        {
            // mix yellow & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, green, f);
        }
        else if(h >= 2.0 && h < 3.0)
        {
            // mix green & cyan.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(green, cyan, f);
        }
        else if(h >= 3.0)
        {
            // mix cyan & blue.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, blue, f);
        }
    }
    else
    {
        // COLD to HOT.***
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init
        if(h >= 0.0 && h < 1.0)
        {
            // mix blue & cyan.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(blue, cyan, f);
        }
        else if(h >= 1.0 && h < 2.0)
        {
            // mix cyan & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, green, f);  
        }
        else if(h >= 2.0 && h < 3.0)
        {
            // mix green & yellow.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(green, yellow, f);
        }
        else if(h >= 3.0)
        {
            // mix yellow & red.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, red, f);
        }
    }

    return resultColor;
}

vec4 getColorByLegendColors(float realPollutionValue)
{
    vec4 colorAux = vec4(0.3, 0.3, 0.3, 0.1);
    vec4 colorZero = vec4(0.3, 0.3, 0.3, 0.1);

    // The legendValues are scaled, so must scale the realPollutionValue.***
    float scaledValue = realPollutionValue * uLegendValuesScale;

    // find legendIdx.***
    for(int i=0; i<16; i++)
    {
        if( i >= uLegendColorsCount)
        {
            break;
        }

        if(i == 0)
        {
            if(scaledValue < uLegendValues[i])
            {
                float value0 = 0.0;
                float value1 = uLegendValues[i];
                float factor = (scaledValue - value0) / (value1 - value0);
                colorAux = mix(colorZero, uLegendColors[i], factor);
                colorAux = vec4(1.0, 1.0, 0.0, 1.0);
                break;
            }
        }
        
        if(i < uLegendColorsCount - 1)
        {
            if(scaledValue >= uLegendValues[i] && scaledValue < uLegendValues[i + 1])
            {
                if(uTextureFilterType == 0)
                {
                    colorAux = uLegendColors[i];
                }
                else
                {
                    float value0 = uLegendValues[i];
                    float value1 = uLegendValues[i + 1];
                    float factor = (scaledValue - value0) / (value1 - value0);
                    colorAux = mix(uLegendColors[i], uLegendColors[i + 1], factor);
                }
                break;
            }
        }
        else if(i == uLegendColorsCount - 1)
        {
            if(scaledValue >= uLegendValues[i])
            {
                colorAux = uLegendColors[i];
                break;
            }
            else
            {
                float value0 = uLegendValues[i];
                float value1 = uLegendValues[i];
                float factor = (scaledValue - value0) / (value1 - value0);
                colorAux = mix(uLegendColors[i], uLegendColors[i], factor);
                
            }
        }

    }

    return colorAux;
}

void main()
{
	vec2 finalTexCoord = vTexCoord;
	if(textureFlipYAxis)
	{
		finalTexCoord = vec2(vTexCoord.s, 1.0 - vTexCoord.t);
	}

    if(uRenderBorder == 1)
    {
        float minTexCoordVal = 0.005;
        if(finalTexCoord.x < minTexCoordVal || finalTexCoord.x > 1.0 - minTexCoordVal || finalTexCoord.y < minTexCoordVal || finalTexCoord.y > 1.0 - minTexCoordVal) 
        {
            gl_FragData[0] = vec4(0.0, 0.0, 0.5, 1.0);

            #ifdef USE_MULTI_RENDER_TARGET
            {
                // save depth, normal, albedo.
                float depthAux = vDepth;
                gl_FragData[1] = packDepth(depthAux); 

                // When render with cull_face disabled, must correct the faces normal.
                float frustumIdx = 1.0;
                if(uFrustumIdx == 0)
                frustumIdx = 0.005;
                else if(uFrustumIdx == 1)
                frustumIdx = 0.015;
                else if(uFrustumIdx == 2)
                frustumIdx = 0.025;
                else if(uFrustumIdx == 3)
                frustumIdx = 0.035;

                vec3 normal = vNormal;

                vec3 encodedNormal = encodeNormal(normal);
                gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***

                // albedo.
                gl_FragData[3] = vec4(0.0, 0.0, 0.5, 1.0);

                // selColor4 (if necessary).
                gl_FragData[4] = uSelColor4; 
            }
            #endif
            
            return;
        }
    }

    // if(colorType == 2)
    // {
    //      float realPollutionValue = getRealValueLinearInterpolation(finalTexCoord);
    // }
    // else if(colorType == 0)
	// {
    //     textureColor = oneColor4;
    // }
	// else if(colorType == 1)
	// {
    //     textureColor = vColor4;
    // }
	
    vec4 finalColor;
    float realPollutionValue = getRealValueLinearInterpolation(finalTexCoord);

    
    

    if(uRenderingColorType == 0)
    {
        float realPollutionQuantized = (realPollutionValue - uMinMaxValuesToRender.x) / (uMinMaxValuesToRender.y - uMinMaxValuesToRender.x);
        if(realPollutionQuantized > 1.0){ realPollutionQuantized = 0.9999; }
        else if(realPollutionQuantized < 0.0){ realPollutionQuantized = 0.0; }

        bool hotToCold = false;
	    //finalColor = getRainbowColor_byHeight(realPollutionQuantized, uMinMaxValues.x, uMinMaxValues.y, hotToCold);
        finalColor = getRainbowColor_byHeight(realPollutionQuantized, 0.0, 1.0, hotToCold);
    }
    else if(uRenderingColorType == 1)
    {
        // monotone.***
        float realPollutionQuantizedMonotone = (realPollutionValue - uMinMaxValuesToRender.x) / (uMinMaxValuesToRender.y - uMinMaxValuesToRender.x);
        float gray = realPollutionQuantizedMonotone;
        if (gray > 1.0){ gray = 0.9999; }
        else if (gray<0.0){ gray = 0.0; }

        finalColor = vec4(gray, 0.0, 0.0, gray);
    }
    else if(uRenderingColorType == 2)
    {
        // use an external legend.***************************************************************************************************************************
        vec4 colorAux = getColorByLegendColors(realPollutionValue);
        if(colorAux.a == 0.0)
        {
            discard;
            //colorAux = vec4(1.0, 0.0, 1.0, 1.0);
        }

        // if(realPollutionValue < 1e-2)
        // {
        //     colorAux = vec4(0.0, 0.0, 0.0, 1.0);
        // }
        // if(realPollutionValue < 1e-5)
        // {
        //     colorAux = vec4(0.0, 1.0, 0.0, 1.0);
        // }
        // if(realPollutionValue < 1e-20)
        // {
        //     colorAux = vec4(0.0, 0.0, 1.0, 1.0);
        // }

        if(realPollutionValue == 0.0)
        {
            colorAux = vec4(1.0, 0.0, 0.0, 0.0);
        }

        finalColor = colorAux;
        // End use an external legend.-------------------------------------------------------------------------------------------------------------------------
    }


    gl_FragData[0] = finalColor; // test.***
	vec4 albedo4 = finalColor;

	#ifdef USE_MULTI_RENDER_TARGET
	{
		// save depth, normal, albedo.
		float depthAux = vDepth;
		gl_FragData[1] = packDepth(depthAux); 

		// When render with cull_face disabled, must correct the faces normal.
		float frustumIdx = 1.0;
		if(uFrustumIdx == 0)
		frustumIdx = 0.005;
		else if(uFrustumIdx == 1)
		frustumIdx = 0.015;
		else if(uFrustumIdx == 2)
		frustumIdx = 0.025;
		else if(uFrustumIdx == 3)
		frustumIdx = 0.035;

		vec3 normal = vNormal;

		vec3 encodedNormal = encodeNormal(normal);
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***

		// albedo.
		gl_FragData[3] = albedo4; 

		// selColor4 (if necessary).
		gl_FragData[4] = uSelColor4; 
	}
	#endif


	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif
}