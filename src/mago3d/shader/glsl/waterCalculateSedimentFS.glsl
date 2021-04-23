#ifdef GL_ES
    precision highp float;
#endif

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D waterHeightTex;
uniform sampler2D terrainHeightTex;
uniform sampler2D currWaterFluxTex;
uniform sampler2D sedimentHeightTex;

varying vec2 v_tex_pos; // texCoords.
#define PI 3.1415926

uniform float u_SimRes;
uniform float u_PipeLen;
uniform float u_Ks;
uniform float u_Kc;
uniform float u_Kd;
uniform float u_timestep;

uniform float u_PipeArea;
uniform vec2 u_heightMap_MinMax;
uniform float u_waterMaxHeigh;

/*
vec3 calnor(vec2 uv){
  float eps = 1.f/u_SimRes;
  vec4 cur = texture(readTerrain,uv);
  vec4 r = texture(readTerrain,uv+vec2(eps,0.f));
  vec4 t = texture(readTerrain,uv+vec2(0.f,eps));
  vec4 b = texture(readTerrain,uv+vec2(0.f,-eps));
  vec4 l = texture(readTerrain,uv+vec2(-eps,0.f));

  vec3 nor = vec3(l.x - r.x, 2.0, t.x - b.x);
  nor = normalize(nor);
  return nor;
}
*/

void main()
{
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);
    curuv = v_tex_pos;



    gl_FragData[0] = vec4(0.0);  // water flux.


    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(0.0); // velocity
        gl_FragData[2] = vec4(0.0); // 
        gl_FragData[3] = vec4(0.0); // 
        gl_FragData[4] = vec4(0.0); // 
    #endif

}