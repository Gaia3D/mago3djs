precision mediump float;

attribute vec2 a_pos;
attribute vec3 a_nor;

varying vec2 v_tex_pos;
varying vec3 v_normal;

void main() {
    v_tex_pos = a_pos;
    v_normal = a_nor;
    
    //vec2 pos = a_pos*0.5;
    gl_Position = vec4(1.0 - 2.0 * a_pos, 0, 1);
}