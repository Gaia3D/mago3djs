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

uniform bool u_existRain;
uniform float u_waterMaxHeigh;
uniform float u_contaminantMaxHeigh;
uniform float u_fluidMaxHeigh;
uniform float u_fluidHeigh;
uniform float u_timestep;

varying vec2 v_tex_pos;
varying vec4 vColor4;

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
    float unitaryHeight = u_fluidHeigh / u_fluidMaxHeigh;
    vec4 encodedHeight = packDepth(unitaryHeight);
    gl_FragData[0] = encodedHeight;

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0, 0.0, 0.5, 1.0); // water source
        gl_FragData[2] = vec4(1.0, 0.0, 0.5, 1.0); // normal
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color
    #endif
}