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


uniform sampler2D soundSourceTex_0;
uniform sampler2D soundSourceTex_1;
uniform sampler2D soundSourceTex_2;
uniform sampler2D soundSourceTex_3;
uniform sampler2D currAirPressureTex_0;
uniform sampler2D currAirPressureTex_1;
uniform sampler2D currAirPressureTex_2;
uniform sampler2D currAirPressureTex_3;

uniform float u_airMaxPressure;

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

vec4 getFinalAirPressureEncoded(vec4 encodedCurrAirPressure, vec4 encodedSoundSource)
{
    float decodedCurrAirPressure = unpackDepth(encodedCurrAirPressure) * u_airMaxPressure;
    float decodedSourceAirPressure = unpackDepth(encodedSoundSource) * u_airMaxPressure;
    float finalAirPressure = decodedSourceAirPressure; // init value.***
    if(finalAirPressure < decodedCurrAirPressure)
    {
        finalAirPressure = decodedCurrAirPressure;
    }
    vec4 finalAirPressureEncoded = packDepth(finalAirPressure / u_airMaxPressure);

    return finalAirPressureEncoded;
}

void main()
{
    // 1rst, take the water source.
    vec4 currAirPressure = texture2D(currAirPressureTex_0, v_tex_pos);
    vec4 soundSource = texture2D(soundSourceTex_0, v_tex_pos);
    gl_FragData[0] = getFinalAirPressureEncoded(currAirPressure, soundSource);

    #ifdef USE_MULTI_RENDER_TARGET
        currAirPressure = texture2D(currAirPressureTex_1, v_tex_pos);
        soundSource = texture2D(soundSourceTex_1, v_tex_pos);
        gl_FragData[1] = getFinalAirPressureEncoded(currAirPressure, soundSource);

        currAirPressure = texture2D(currAirPressureTex_2, v_tex_pos);
        soundSource = texture2D(soundSourceTex_2, v_tex_pos);
        gl_FragData[2] = getFinalAirPressureEncoded(currAirPressure, soundSource);

        currAirPressure = texture2D(currAirPressureTex_3, v_tex_pos);
        soundSource = texture2D(soundSourceTex_3, v_tex_pos);
        gl_FragData[3] = getFinalAirPressureEncoded(currAirPressure, soundSource);
    #endif
}