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
uniform float u_waterMaxHeigh;
uniform float u_contaminantMaxHeigh;

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

    float decodedCurrWaterHeight = unpackDepth(currWaterHeight);
    float decodedSourceWaterHeight = unpackDepth(waterSource);

    if(decodedSourceWaterHeight < decodedCurrWaterHeight)
    {
        waterSource = currWaterHeight;
    }

    // add rain.
    if(u_existRain)
    {
        vec4 rain = texture2D(rainTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));
        waterSource += rain;
    }

    vec4 waterAdition = texture2D(waterAditionTex, vec2(v_tex_pos.x, v_tex_pos.y));
    waterSource += waterAdition;

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

    // provisionally assign the waterSource as waterHeight...
    gl_FragData[0] = waterSource;  // waterHeight.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = contaminSourceHeight; // contamination
        gl_FragData[2] = vec4(1.0, 0.0, 0.5, 1.0); // normal
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color
    #endif
}