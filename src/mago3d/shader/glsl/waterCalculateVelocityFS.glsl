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

varying vec2 v_tex_pos; // texCoords.
#define PI 3.1415926

uniform float u_SimRes;
uniform float u_PipeLen;
uniform float u_timestep;
uniform float u_PipeArea;
uniform vec2 u_heightMap_MinMax;
uniform float u_waterMaxHeigh;
uniform float u_waterMaxFlux;

vec2 encodeVelocity(in vec2 vel)
{
	return vel*0.5 + 0.5;
}

vec2 decodeVelocity(in vec2 encodedVel)
{
	return vec2(encodedVel.xy * 2.0 - 1.0);
}

void main()
{
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);
    curuv = v_tex_pos;
    float div = 1.0/u_SimRes;

    vec4 topflux = texture2D(currWaterFluxTex, curuv + vec2(0.0, div)) * u_waterMaxFlux;
    vec4 rightflux = texture2D(currWaterFluxTex, curuv + vec2(div, 0.0)) * u_waterMaxFlux;
    vec4 bottomflux = texture2D(currWaterFluxTex, curuv + vec2(0.0, -div)) * u_waterMaxFlux;
    vec4 leftflux = texture2D(currWaterFluxTex, curuv + vec2(-div, 0.0)) * u_waterMaxFlux;

    vec4 curflux = texture2D(currWaterFluxTex, curuv) * u_waterMaxFlux;
    //vec4 curT = texture2D(terrainHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));
    vec4 curW = texture2D(waterHeightTex, vec2(v_tex_pos.x, v_tex_pos.y)) * u_waterMaxHeigh;

    
    //out flow flux
    float ftopout = curflux.x;
    float frightout = curflux.y;
    float fbottomout = curflux.z;
    float fleftout = curflux.w;

    vec4 outputflux = curflux;
    vec4 inputflux = vec4(topflux.z, rightflux.w, bottomflux.x, leftflux.y);

    float fout = ftopout + frightout + fbottomout + fleftout;
    float fin = topflux.z + rightflux.w + bottomflux.x + leftflux.y;
    fin = inputflux.x + inputflux.y + inputflux.z + inputflux.w;

    float deltavol = u_timestep * (fin - fout) / (u_PipeLen * u_PipeLen);
    //---------------------------------------------------------------------------------

    //float d1 = cur.y + curs.x; // original.
    float currWaterHeight = curW.r;
    float d1 = currWaterHeight;

    float d2 = d1 + deltavol;
    float da = (d1 + d2)/2.0;

    vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;

    //veloci *= 100000.0;
        if(da <= 1e-5) {
        veloci = vec2(0.0);
        }else{
        veloci = veloci/(da * u_PipeLen);
        }

    if(curuv.x <= div) { deltavol = 0.0; veloci = vec2(0.0); }
    if(curuv.x >= 1.0 - 2.0 * div) { deltavol = 0.0; veloci = vec2(0.0); }
    if(curuv.y <= div) { deltavol = 0.0; veloci = vec2(0.0); }
    if(curuv.y >= 1.0 - 2.0 * div) { deltavol = 0.0; veloci = vec2(0.0); }

    //  float absx = abs(veloci.x);
    //  float absy = abs(veloci.y);
    //  float maxxy = max(absx, absy);
    //  float minxy = min(absx, absy);
    //  float tantheta = minxy / maxxy;
    //  float scale = cos(45.0 * PI / 180.0 - atan(tantheta));
    //  float divtheta = (1.0/sqrt(2.0)) / scale;
    //  float divs = min(abs(veloci.x), abs(veloci.y))/max(abs(veloci.x), abs(veloci.y));
    //  if((divs) > 20.0){
    //    veloci /= 20.0;
    //  }

    vec2 encodedVelocity = encodeVelocity(veloci);
    vec4 writeVel = vec4(encodedVelocity, 0.0, 1.0);
    //vec4 writeWaterHeight = vec4(cur.x,max(cur.y+deltavol, 0.0),cur.z,cur.w); // original.***

    float waterHeight = max(curW.r / u_waterMaxHeigh+ deltavol, 0.0); // original.***
    //float waterHeight = max(currWaterHeight + deltavol, 0.0); // test.***
    //waterHeight /= u_waterMaxHeigh; // test.***
    vec4 writeWaterHeight = vec4(waterHeight);


    gl_FragData[0] = writeWaterHeight;  // water flux.


    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = writeVel; // velocity
        gl_FragData[2] = vec4(0.0); // 
        gl_FragData[3] = vec4(0.0); // 
        gl_FragData[4] = vec4(0.0); // 
    #endif

}