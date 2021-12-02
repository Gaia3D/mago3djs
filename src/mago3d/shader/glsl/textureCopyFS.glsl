//#version 300 es

#ifdef GL_ES
    precision highp float;
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D texToCopy;
uniform bool u_textureFlipXAxis;
uniform bool u_textureFlipYAxis;
varying vec2 v_tex_pos;

void main()
{
    vec4 finalCol4;
    float texCoordX, texCoordY;
    if(u_textureFlipYAxis)
    {
        texCoordY =  1.0 - v_tex_pos.y;
    }
    else
    {
        texCoordY =  v_tex_pos.y;
    }

    if(u_textureFlipXAxis)
    {
        texCoordX =  1.0 - v_tex_pos.x;
    }
    else
    {
        texCoordX =  v_tex_pos.x;
    }
    
    finalCol4 = texture2D(texToCopy, vec2(texCoordX, texCoordY));

    if(finalCol4.a == 0.0)
    {
        discard;
    }
    gl_FragData[0] = finalCol4;  // anything.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = finalCol4; // depth
        gl_FragData[2] = finalCol4; // normal
        gl_FragData[3] = finalCol4; // albedo
        gl_FragData[4] = finalCol4; // selection color
    #endif

}