#ifdef GL_ES
    precision highp float;
#endif

varying vec4 vcolor4;

void main()
{  
	gl_FragData[0] = vcolor4; 
}