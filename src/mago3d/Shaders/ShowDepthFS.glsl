#ifdef GL_ES
    precision highp float;
#endif
uniform float near;
uniform float far;

varying float depth;  
varying vec3 vN; 
varying vec4 vVSPos;

// from http://spidergl.org/example.php?id=6
vec4 packDepth(const in float depth)
{
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); 
    vec4 res = fract(depth * bit_shift);
    res -= res.xxyz * bit_mask;

    return res;  
}

void main()
{
    gl_FragData[0] = packDepth(-depth);
    gl_FragData[0].r = -depth/far;
}
