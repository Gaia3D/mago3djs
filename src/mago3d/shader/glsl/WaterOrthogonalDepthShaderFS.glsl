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

uniform sampler2D currDEMTex;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

uniform vec2 u_screenSize;

varying float vDepth;
varying vec2 vTexCoord;  
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
    vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y);

    // read the currentDEM depth.
    //vec4 depthCol4 = texture2D(currDEMTex, vec2(screenPos.x, 1.0 - screenPos.y));
   // float currDepth = unpackDepth(depthCol4);

    //if(vDepth > currDepth)
    //{
        //discard;
    //}

    //gl_FragData[0] = packDepth(vDepth);
    //gl_FragData[0] = vec4(1.0, 0.0, 0.0, 1.0);
    gl_FragData[0] = vColor4;

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0); // depth
        gl_FragData[2] = vec4(1.0); // normal
        gl_FragData[3] = vec4(1.0); // albedo
        gl_FragData[4] = vec4(1.0); // selection color
    #endif
}