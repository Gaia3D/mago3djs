precision mediump float;

attribute vec2 a_pos;
attribute vec3 a_nor;
attribute vec2 a_tex;

varying vec2 v_tex_pos;
varying vec3 v_normal;

void main() {
    v_tex_pos = a_tex;
    v_normal = a_nor;
    
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}