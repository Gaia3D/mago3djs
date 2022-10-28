//#version 300 es

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

uniform sampler2D depthTex;
uniform sampler2D waterTex;
uniform sampler2D particlesTex;

// Textures.********************************
uniform sampler2D waterHeightTex;
uniform sampler2D terrainmap;
uniform sampler2D contaminantHeightTex;



uniform vec2 u_screenSize;
uniform float near;
uniform float far;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;
uniform mat4 projectionMatrixInv;
uniform bool bUseLogarithmicDepth;
uniform int uWaterType; // 0= nothing, 1= flux, 2= velocity
uniform float uMinWaterHeightToRender;
varying float flogz;
varying float Fcoef_half;



varying vec4 vColorAuxTest;
varying float vWaterHeight;
varying float vContaminantHeight;
varying float vExistContaminant;
varying vec3 vNormal;
varying vec3 vViewRay;
varying vec3 vOrthoPos;
varying vec2 vTexCoord;

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z;

		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = flogzAux - 1.0;
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
}


vec3 reconstructPosition(vec2 texCoord, float depth)
{
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
    float x = texCoord.x * 2.0 - 1.0;
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;
    float y = (texCoord.y) * 2.0 - 1.0;
    float z = (1.0 - depth) * 2.0 - 1.0;
    vec4 pos_NDC = vec4(x, y, z, 1.0);
    vec4 pos_CC = projectionMatrixInv * pos_NDC;
    return pos_CC.xyz / pos_CC.w;
}

vec3 normal_from_depth(float depth, vec2 texCoord) {
    // http://theorangeduck.com/page/pure-depth-ssao
    float pixelSizeX = 1.0/u_screenSize.x;
    float pixelSizeY = 1.0/u_screenSize.y;

    vec2 offset1 = vec2(0.0,pixelSizeY);
    vec2 offset2 = vec2(pixelSizeX,0.0);

	float depthA = 0.0;
	float depthB = 0.0;
	for(float i=0.0; i<1.0; i++)
	{
		depthA += getDepth(texCoord + offset1*(1.0+i));
		depthB += getDepth(texCoord + offset2*(1.0+i));
	}

	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);

    vec3 pos0 = reconstructPosition(texCoord, depth);
    vec3 normal = cross(posA - pos0, posB - pos0);
    normal.z = -normal.z;

    return normalize(normal);
}

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}

vec2 decodeVelocity(in vec2 encodedVel)
{
	return vec2(encodedVel.xy * 2.0 - 1.0);
}

vec3 getRainbowColor_byHeight(float height, in float maxi, in float mini)
{
	float gray = (height - mini)/(maxi - mini);
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	float r, g, b;

    b= 0.0;
    r = min(gray * 2.0, 1.0);
    g = min(2.0 - gray * 2.0, 1.0);

	vec3 resultColor = vec3(r, g, b);
    return resultColor;
} 



void main()
{
    bool isParticle = false;
    float alpha = vColorAuxTest.a;
    vec4 finalCol4 = vec4(vColorAuxTest);

    if(uWaterType == 3)
    {
        // particles case: now, decode velocity:
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));
        finalCol4 = mix(vColorAuxTest, velocity4, velocity4.a);
        if(alpha < velocity4.a)
        {
            alpha = velocity4.a;
            isParticle = true;
        }
    }

    if(!isParticle && vWaterHeight + vContaminantHeight < uMinWaterHeightToRender)// original = 0.0001
    {
        discard;
    }

    float totalH = vWaterHeight + vContaminantHeight;
    
    float whiteWaterMaxHeight = uMinWaterHeightToRender * 1.5;
    float whiteFactor = 0.0;
    if(totalH < whiteWaterMaxHeight)
    {
        alpha = min(totalH/0.1, alpha); // original.***
        //alpha = min(totalH, alpha); // test.***

        // do water more white.***
        
        whiteFactor = (totalH - uMinWaterHeightToRender) / (whiteWaterMaxHeight - uMinWaterHeightToRender);
        vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
        finalCol4 = mix(white, finalCol4, whiteFactor);

        alpha = finalCol4.a;
    }
    

    // calculate contaminationConcentration;
    float contaminConcentration = vContaminantHeight / (totalH);

    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y);

    
    float dotProd = dot(vViewRay, vNormal);
    //finalCol4 = vec4(finalCol4.xyz * dotProd, alpha);
    

    if(uWaterType == 1)
    {
        alpha = 1.0;

        // flux case:
        vec4 flux = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));
        float fluxLength = length(flux)/sqrt(4.0);
        float value = fluxLength;
        finalCol4 = vec4(value, value, value, alpha);
        
    }
    else if(uWaterType == 2)
    {
        alpha = 1.0;

        // velocity case: now, decode velocity:
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));
        vec2 decodedVelocity = decodeVelocity(velocity4.xy);
        float velocity = length(decodedVelocity.xy)/sqrt(2.0);
        float value = velocity;
        finalCol4 = vec4(value, value, value, alpha);

    }
    else if(uWaterType == 3)
    {
        // particles case: now, decode velocity:
        vec4 velocity4 = texture2D(waterTex, vec2(vTexCoord.x, vTexCoord.y));
        finalCol4 = mix(finalCol4, velocity4, velocity4.a);
        if(alpha < velocity4.a)
        {
            alpha = velocity4.a;
            isParticle = true;
        }
    }

    if(vExistContaminant > 0.0 && vContaminantHeight > 0.001)
    {
        float factor = min(contaminConcentration + 0.6, 1.0);
        
        vec4 contaminCol4 = finalCol4;

        if(!isParticle)
        {
            float maxConc = 0.001;
            float minConc = 0.0;
            contaminCol4 = vec4(getRainbowColor_byHeight(contaminConcentration, maxConc, minConc), 1.0);
            factor = (contaminConcentration - minConc)/(maxConc - minConc);
        }
        finalCol4 = mix(finalCol4, contaminCol4, factor);
    }

    finalCol4 = vec4(finalCol4.xyz * dotProd, alpha);

    //*************************************************************************************************************
    // Do specular lighting.***
	float lambertian = 1.0;
	float specular = 0.0;
    float shininessValue = 200.0;
	//if(applySpecLighting> 0.0)
	//{
		vec3 L;
        vec3 lightPos = vec3(0.0, 1.0, -1.0)*length(vOrthoPos);
        L = normalize(lightPos - vOrthoPos);
        lambertian = max(dot(vNormal, L), 0.0);
		
		specular = 0.0;
		//if(lambertian > 0.0)
		{
			vec3 R = reflect(-L, vNormal);      // Reflected light vector
			vec3 V = normalize(-vOrthoPos); // Vector to viewer
			
			// Compute the specular term
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, shininessValue);
			
			if(specular > 1.0)
			{
				//specular = 1.0;
			}
		}
		
		if(lambertian < 0.9)
		{
			lambertian = 0.9;
		}

	//}
    //vec3 specCol = finalCol4.xyz * 3.0;
    vec3 specCol = vec3(0.5, 1.0, 1.0);

    //finalCol4 = vec4((finalCol4.xyz * lambertian + specCol * specular), alpha);
    //*************************************************************************************************************
    vec3 lightdir = normalize(lightPos - vOrthoPos);
    vec3 halfway = normalize(lightdir + vViewRay);
    float spec = pow(max(dot(vNormal, halfway), 0.0), 333.0);
    finalCol4 = vec4((finalCol4.xyz * lambertian + specCol * spec), alpha);

    if(!isParticle)
    {
        finalCol4 = vec4(finalCol4.xyz* (1.0 + whiteFactor), alpha);
    }
    

    //-------------------------------------------------------------------------------------------------------------
    gl_FragData[0] = finalCol4;  // anything.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0); // depth
        gl_FragData[2] = vec4(1.0); // normal
        gl_FragData[3] = finalCol4; // albedo
        gl_FragData[4] = vec4(1.0); // selection color
    #endif
    /*
    vec2 uv = vec2(gl_FragCoord.xy/u_Dimensions);
    float terrainDepth = texture(sceneDepth,uv).x;
    float sediment = texture(sedimap,fs_Uv).x;
    float waterDepth = gl_FragCoord.z;

    terrainDepth = linearDepth(terrainDepth);
    waterDepth = linearDepth(waterDepth);

    float dpVal = 180.0 * max(0.0,terrainDepth - waterDepth);
    dpVal = clamp(dpVal, 0.0,4.0);
    //dpVal = pow(dpVal, 0.1);


    float fbias = 0.2;
    float fscale = 0.2;
    float fpow = 22.0;
    vec3 sundir = unif_LightPos;

    sundir = normalize(sundir);

    vec3 nor = -calnor(fs_Uv);
    vec3 viewdir = normalize(u_Eye - fs_Pos);
    vec3 lightdir = normalize(sundir);
    vec3 halfway = normalize(lightdir + viewdir);
    vec3 reflectedSky = sky(halfway);
    float spec = pow(max(dot(nor, halfway), 0.0), 333.0);


    float R = max(0.0, min(1.0, fbias + fscale * pow(1.0 + dot(viewdir, -nor), fpow)));

    //lamb =1.f;

    float yval = texture(waterHeightTex,fs_Uv).x * 4.0;
    float wval = texture(waterHeightTex,fs_Uv).y;
    wval /= 1.0;

    vec3 watercolor = mix(vec3(0.8,0.0,0.0), vec3(0.0,0.0,0.8), sediment * 2.0);
    vec3 watercolorspec = vec3(1.0);
    watercolorspec *= spec;

    out_Col = vec4(vec3(0.0,0.2,0.5) + R * reflectedSky + watercolorspec  , (.5 + spec) * u_WaterTransparency * dpVal);
    col_reflect = vec4(1.0);
    */
}