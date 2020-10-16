precision mediump float;
uniform int byteColor_r;
uniform int byteColor_g;
uniform int byteColor_b;

void main()
{
    float byteMaxValue = 255.0;

    gl_FragColor = vec4(float(byteColor_r)/byteMaxValue, float(byteColor_g)/byteMaxValue, float(byteColor_b)/byteMaxValue, 1);
}
