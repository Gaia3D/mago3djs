//precision mediump float;

attribute vec3 a_pos;

varying vec2 v_tex_pos;
varying vec3 vPos;

void main() {
    // Note: the position attributte is initially (in javascript) unsignedInt16 (0 to 32,767) (quantizedMesh).
    // So, when normalize the data it transforms to (0.0 to 0.5), so must multiply by 2.0.
    vec3 pos = a_pos * 2.0;
    vPos = pos;
    v_tex_pos = pos.xy;
    gl_Position = vec4(-1.0 + 2.0 * pos, 1.0);
}