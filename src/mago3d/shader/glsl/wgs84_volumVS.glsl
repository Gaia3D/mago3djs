precision mediump float;

attribute vec3 position;
uniform mat4 projectionMatrix;

void main()
{	
	vec4 pos = projectionMatrix * vec4(position.xyz, 1.0);
    gl_Position = pos;
}