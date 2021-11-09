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
uniform int u_terrainHeightEncodingBytes;

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

float decodeRG(in vec2 waterColorRG)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));
}

vec2 encodeRG(in float wh)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    float encodedBit = 1.0/255.0;
    vec2 enc = vec2(1.0, 255.0) * wh;
    enc = fract(enc);
    enc.x -= enc.y * encodedBit;
    return enc; // R = HIGH, G = LOW.***
}

void main()
{
    vec4 finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); // original.***
    if(u_terrainHeightEncodingBytes == 1)
    {
        finalCol4 = vec4(vPos.z, vPos.z, vPos.z, 1.0); 
    }
    else if(u_terrainHeightEncodingBytes == 2)
    {
        finalCol4 = vec4(encodeRG(vPos.z), 0.0, 1.0); // 2byte height.
    }
    else if(u_terrainHeightEncodingBytes == 4)
    {
        finalCol4 = packDepth(vPos.z); 
    }

    if(colorType == 1)
    {
        //finalCol4 = vColor4;
        finalCol4 = u_oneColor4;
    }

    //-------------------------------------------------------------------------------------------------------------
    gl_FragData[0] = finalCol4;  // anything.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(1.0); // depth
        gl_FragData[2] = vec4(1.0); // normal
        gl_FragData[3] = finalCol4; // albedo
        gl_FragData[4] = vec4(1.0); // selection color
    #endif

}