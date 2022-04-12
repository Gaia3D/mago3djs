#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D image; // 0
uniform vec2 uImageSize;

void main()
{
    vec2 TexCoords = vec2(gl_FragCoord.x / uImageSize.x, gl_FragCoord.y / uImageSize.y);
    vec2 texelSize = 1.0 / uImageSize;
    vec4 result = vec4(0.0);
    for (int x = -2; x < 2; ++x) 
    {
        for (int y = -2; y < 2; ++y) 
        {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture2D(image, TexCoords + offset);
        }
    }
    gl_FragData[0] = result / (4.0 * 4.0);
}