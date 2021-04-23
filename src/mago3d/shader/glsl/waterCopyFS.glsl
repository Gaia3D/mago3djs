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

uniform sampler2D texToCopy;
uniform bool u_textureFlipYAxis;
varying vec2 v_tex_pos;

void main()
{
    vec4 finalCol4;
    if(u_textureFlipYAxis)
    {
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, 1.0 - v_tex_pos.y));
    }
    else
    {
        finalCol4 = texture2D(texToCopy, vec2(v_tex_pos.x, v_tex_pos.y));
    }
    
    gl_FragData[0] = finalCol4;  // anything.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0); // depth
        gl_FragData[2] = vec4(1.0); // normal
        gl_FragData[3] = finalCol4; // albedo
        gl_FragData[4] = vec4(1.0); // selection color
    #endif

}