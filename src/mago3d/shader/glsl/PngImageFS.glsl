precision mediump float;
varying vec2 v_texcoord;
uniform bool textureFlipYAxis;
uniform sampler2D u_texture;

void main()
{
    vec4 textureColor;
    if(textureFlipYAxis)
    {
        textureColor = texture2D(u_texture, vec2(v_texcoord.s, 1.0 - v_texcoord.t));
    }
    else
    {
        textureColor = texture2D(u_texture, v_texcoord);
    }
    if(textureColor.w < 0.1)
    {
        discard;
    }

    gl_FragColor = textureColor;
}