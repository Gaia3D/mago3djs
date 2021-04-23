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

varying vec2 v_tex_pos;


void main()
{
    // 1rst, take the water source.
    //vec2 texCoord = vec2(v_tex_pos.x, 1.0 - v_tex_pos.y);
    //texCoord = v_tex_pos;
    vec4 currWaterHeight = texture2D(currWaterHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));
    vec4 waterSource = texture2D(waterSourceTex, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));

    if(waterSource.r < currWaterHeight.r)
    {
        waterSource = currWaterHeight;
    }
    // provisionally assign the waterSource as waterHeight...
    gl_FragData[0] = waterSource;  // waterHeight.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0, 0.0, 0.5, 1.0); // depth
        gl_FragData[2] = vec4(1.0, 0.0, 0.5, 1.0); // normal
        gl_FragData[3] = vec4(1.0, 0.0, 0.5, 1.0); // albedo
        gl_FragData[4] = vec4(1.0, 0.0, 0.5, 1.0); // selection color
    #endif
}