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


uniform sampler2D waterSourceTex;
uniform sampler2D rainTex; // if exist.
uniform sampler2D currWaterHeightTex;
uniform sampler2D currContaminationHeightTex;
uniform sampler2D contaminantSourceTex;
uniform sampler2D waterAditionTex;

uniform bool u_existRain;
uniform int u_rainType; // 0= rain value (mm/h), 1= rain texture.
uniform float u_rainValue_mmHour;
uniform float u_waterMaxHeigh;
uniform float u_contaminantMaxHeigh;
uniform float u_increTimeSeconds;

varying vec2 v_tex_pos;

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
/*
float getWaterHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(currWaterHeightTex, texCoord);
    //float decoded = decodeRG(color4.rg); // old.
    float decoded = unpackDepth(color4);
    float waterHeight = decoded * u_waterMaxHeigh;
    return waterHeight;
}
*/

void main()
{
    // 1rst, take the water source.
    vec4 currWaterHeight = texture2D(currWaterHeightTex, v_tex_pos);
    vec4 waterSource = texture2D(waterSourceTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));
    //vec4 waterSource = vec4(0.0, 0.0, 0.0, 0.01);

    float decodedCurrWaterHeight = unpackDepth(currWaterHeight) * u_waterMaxHeigh;
    float decodedSourceWaterHeight = unpackDepth(waterSource) * u_waterMaxHeigh;

    float finalWaterHeight = decodedSourceWaterHeight; // init value.***
    //finalWaterHeight = 0.0;

    vec4 shaderLogColor4 = vec4(0.0, 0.0, 0.0, 1.0);

    if(finalWaterHeight < 0.0)
    {
        shaderLogColor4 = vec4(1.0, 0.0, 1.0, 1.0);
    }

    if(finalWaterHeight < decodedCurrWaterHeight)
    {
        finalWaterHeight = decodedCurrWaterHeight;
        shaderLogColor4 = vec4(1.0, 0.0, 0.0, 1.0);
    }


    // add rain.
    if(u_existRain)
    {
        // rain : mm/h.***
        vec4 rain = texture2D(rainTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));
        float rainHeight = unpackDepth(rain) * u_waterMaxHeigh;
        finalWaterHeight += rainHeight;
    }

    if(u_rainType == 0)
    {
        float rain_mm = (u_rainValue_mmHour/ 3600.0) * u_increTimeSeconds;
        finalWaterHeight += rain_mm / 1000.0;
    }

    vec4 waterAdition = texture2D(waterAditionTex, vec2(v_tex_pos.x, v_tex_pos.y));
    float waterAditionHeight = unpackDepth(waterAdition) * u_waterMaxHeigh;
    finalWaterHeight += waterAditionHeight;

    if(finalWaterHeight > u_waterMaxHeigh)
    {
        shaderLogColor4 = vec4(0.0, 1.0, 0.5, 1.0);
    }
    

    vec4 finalWaterHeight4 = packDepth(finalWaterHeight / u_waterMaxHeigh);

    // Contamination Height.********************************************************************************
    vec4 contaminSourceHeight = vec4(0.0);
    if(u_contaminantMaxHeigh > 0.0)
    {
        // check if exist contaminant.
        contaminSourceHeight = texture2D(contaminantSourceTex, v_tex_pos);
        vec4 currContaminHeight = texture2D(currContaminationHeightTex, v_tex_pos);

        float decodedSourceContaminHeight = unpackDepth(contaminSourceHeight);
        float decodedCurrContaminHeight = unpackDepth(currContaminHeight);
        if(decodedSourceContaminHeight < decodedCurrContaminHeight)
        {
            contaminSourceHeight = currContaminHeight;
        }
    }

    
    gl_FragData[0] = finalWaterHeight4;  // waterHeight.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = contaminSourceHeight; // contamination
        gl_FragData[2] = shaderLogColor4; // normal
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color
    #endif
}