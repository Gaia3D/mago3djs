//precision mediump float;

attribute vec2 a_pos;
attribute vec2 a_texcoord;

varying vec2 vTexCoord;

void main() {
    vTexCoord = a_texcoord;
    gl_Position = vec4(-1.0 + 2.0 * a_pos, 0.0, 1.0);
}