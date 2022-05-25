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

uniform sampler2D texToCopy_0;
uniform sampler2D texToCopy_1;
uniform sampler2D texToCopy_2;
uniform sampler2D texToCopy_3;
uniform sampler2D texToCopy_4;
uniform sampler2D texToCopy_5;
uniform sampler2D texToCopy_6;
uniform sampler2D texToCopy_7;

uniform bool u_textureFlipYAxis;
varying vec2 vTexCoord;

void main()
{
    vec4 finalCol4;
    vec2 finalTexCoord = vTexCoord;
    if(u_textureFlipYAxis)
    {
        finalTexCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
    }

    finalCol4 = texture2D(texToCopy_0, finalTexCoord);
    gl_FragData[0] = finalCol4;  

    #ifdef USE_MULTI_RENDER_TARGET
        finalCol4 = texture2D(texToCopy_1, finalTexCoord);
        gl_FragData[1] = finalCol4; 

        finalCol4 = texture2D(texToCopy_2, finalTexCoord);
        gl_FragData[2] = finalCol4; 

        finalCol4 = texture2D(texToCopy_3, finalTexCoord);
        gl_FragData[3] = finalCol4; 

        finalCol4 = texture2D(texToCopy_4, finalTexCoord);
        gl_FragData[4] = finalCol4; 

        finalCol4 = texture2D(texToCopy_5, finalTexCoord);
        gl_FragData[5] = finalCol4; 

        finalCol4 = texture2D(texToCopy_6, finalTexCoord);
        gl_FragData[6] = finalCol4; 

        finalCol4 = texture2D(texToCopy_7, finalTexCoord);
        gl_FragData[7] = finalCol4; 

    #endif

}