precision highp float;
const vec4 bitEnc = vec4(1.0,255.0,65025.0,16581375.0);
const vec4 bitDec = 1.0/bitEnc;
varying float zDepth;

vec4 EncodeFloatRGBA (float v)
{
    vec4 enc = bitEnc * v;
    enc = fract(enc);
    enc -= enc.yzww * vec2(1.0/255.0, 0.0).xxxy;
    return enc;
}

void main()
{          
    vec4 encodedZ = EncodeFloatRGBA(zDepth);
    gl_FragData[0] = encodedZ;
}
