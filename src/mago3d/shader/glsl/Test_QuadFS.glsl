#ifdef GL_ES
    precision highp float;
#endif
 
uniform sampler2D diffuseTex;  
varying vec2 vTexCoord; 
void main()
{          
    vec4 textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));
    gl_FragColor = textureColor; 
}
