precision mediump float;

attribute vec2 position;
varying vec4 vColor; 

void main() {
	vColor = vec4(0.2, 0.2, 0.2, 0.5);
    gl_Position = vec4(1.0 - 2.0 * position, 0.0, 1.0);
}