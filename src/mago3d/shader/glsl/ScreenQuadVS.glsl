precision mediump float;

attribute vec2 position;
//uniform mat4 sunMatrix[2]; 
//uniform vec3 sunPosHIGH[2];
//uniform vec3 sunPosLOW[2];
//uniform int sunIdx;
//uniform bool bApplyShadow;
varying vec4 vColor;
//varying float currSunIdx;
//varying vec4 vPosRelToLight; 

void main() {
	vColor = vec4(0.2, 0.2, 0.2, 0.5);
    gl_Position = vec4(1.0 - 2.0 * position, 0.0, 1.0);
}