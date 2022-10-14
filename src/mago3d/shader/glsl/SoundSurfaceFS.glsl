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
uniform float uMinMaxValue[2];

// Legend colors.***
uniform vec4 uLegendColors[16];
uniform float uLegendValues[16];

varying vec3 vNormal;
varying vec4 vColor4; // color from attributes
varying vec2 vTexCoord;   

varying float vDepth;
varying float vSoundValue;

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

vec3 getViewRay(vec2 tc)
{
	float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
}         
            


vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)
{
    
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }

    float value = gray * 4.0;
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


void main()
{
	//bool testBool = false;
	//float occlusion = 1.0; // ambient occlusion.***
	//vec3 normal2 = vNormal;	
	//float scalarProd = 1.0;
	
	//vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
	//float linearDepth = getDepth(screenPos);   
	//vec3 ray = getViewRay(screenPos); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
	//occlusion = 1.0;
	vec4 textureColor;
	vec4 textureColor_0;
	vec4 textureColor_1;

    if(colorType == 2)
    {
        if(textureFlipYAxis)
        {
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, 1.0 - vTexCoord.t));
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, 1.0 - vTexCoord.t));
        }
        else{
            textureColor_0 = texture2D(texture_0, vec2(vTexCoord.s, vTexCoord.t));
			textureColor_1 = texture2D(texture_1, vec2(vTexCoord.s, vTexCoord.t));
        }

		textureColor = mix(textureColor_0, textureColor_1, uInterpolationFactor);
    }
    else if(colorType == 0)
	{
        textureColor = oneColor4;
    }
	else if(colorType == 1)
	{
        textureColor = vColor4;
    }
	else if(colorType == 3)
	{
		bool hotToCold = false;
		float height = vSoundValue;

        textureColor = getRainbowColor_byHeight(height, uMinMaxValue[0], uMinMaxValue[1], hotToCold);

		textureColor = vec4(textureColor.a, textureColor.a, textureColor.a, textureColor.a);
    }
	else if(colorType == 4)
	{
		float height = vSoundValue;
		float q = (height - uMinMaxValue[0]) / (uMinMaxValue[1] - uMinMaxValue[0]);

		textureColor = vec4(q,q*0.25,q*0.5,q);
    }
	else if(colorType == 5)
	{
		// use an external legend.***
		vec4 colorAux = vec4(0.0, 0.0, 0.0, 0.0);

		// find legendIdx.***
		for(int i=0; i<15; i++)
		{
			if(vSoundValue > uLegendValues[i] && vSoundValue <= uLegendValues[i + 1])
			{
				colorAux = uLegendColors[i];
				break;
			}
		}

		textureColor = colorAux;
    }
	
    vec4 finalColor;
	finalColor = textureColor;

	vec4 albedo4 = finalColor;

	
    gl_FragData[0] = finalColor; 

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