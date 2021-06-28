//precision mediump float;

attribute vec3 a_pos;

uniform vec3 u_totalMinGeoCoord; // (lon, lat, alt).
uniform vec3 u_totalMaxGeoCoord;
uniform vec3 u_currentMinGeoCoord;
uniform vec3 u_currentMaxGeoCoord;

varying vec2 v_tex_pos;
varying vec3 vPos;

void main() {
    // Note: the position attributte is initially (in javascript) unsignedInt16 (0 to 32,767) (quantizedMesh).
    // So, when normalize the data it transforms to (0.0 to 0.5), so must multiply by 2.0.
    vec3 pos = a_pos * 2.0; // quantizedMeshes uses the positive parts of the signed short, so must multiply by 2.
    
    // Now, use totalGeoExtent & currentGeoExtent to scale the mesh.
    // Calculate longitude & latitude.
    float lon = u_currentMinGeoCoord.x + pos.x * (u_currentMaxGeoCoord.x - u_currentMinGeoCoord.x);
    float lat = u_currentMinGeoCoord.y + pos.y * (u_currentMaxGeoCoord.y - u_currentMinGeoCoord.y);
    float alt = u_currentMinGeoCoord.z + pos.z * (u_currentMaxGeoCoord.z - u_currentMinGeoCoord.z);

    // Now, calculate the coord on total geoExtent.
    float s = (lon - u_totalMinGeoCoord.x) / (u_totalMaxGeoCoord.x - u_totalMinGeoCoord.x);
    float t = (lat - u_totalMinGeoCoord.y) / (u_totalMaxGeoCoord.y - u_totalMinGeoCoord.y);
    float u = (alt - u_totalMinGeoCoord.z) / (u_totalMaxGeoCoord.z - u_totalMinGeoCoord.z);

    //pos = vec3(pos.x, 1.0 - pos.y, pos.z); // flip y coords. // original.***
    pos = vec3(s, 1.0 - t, u); // flip y coords.
    vPos = pos;
    v_tex_pos = pos.xy;

    gl_Position = vec4(-1.0 + 2.0 * pos, 1.0);
}