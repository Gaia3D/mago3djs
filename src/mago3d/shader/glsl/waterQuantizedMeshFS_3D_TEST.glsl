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

uniform vec2 u_minMaxHeights;
uniform int colorType; // 0= oneColor, 1= attribColor, 2= texture.
uniform vec4 u_oneColor4;

varying vec3 vPos;
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



void main()
{
    vec4 finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); // original.***

    if(colorType == 1)
    {
        //finalCol4 = vColor4;
        finalCol4 = u_oneColor4;
    }

    finalCol4 = u_oneColor4; // original.***

    //-------------------------------------------------------------------------------------------------------------
    gl_FragData[0] = finalCol4;  // anything.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0); // depth
        gl_FragData[2] = vec4(1.0); // normal
        gl_FragData[3] = finalCol4; // albedo
        gl_FragData[4] = vec4(1.0); // selection color
    #endif

}