//#version 300 es

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

varying vec2 v_tex_pos;

uniform float u_SimRes;
uniform float u_PipeLen;
uniform float u_timestep;
uniform float u_PipeArea;

uniform vec2 u_heightMap_MinMax;

void main()
{
    //vec2 curuv = vec2(v_tex_pos.x, 1.0 - v_tex_pos.y);
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);
    float div = 1.0/u_SimRes;
    float g = 0.80;
    float pipelen = u_PipeLen;

    // read terrain heights.
    vec4 topT = texture2D(terrainHeightTex, curuv+vec2(0.0,div));
    vec4 rightT = texture2D(terrainHeightTex, curuv+vec2(div,0.0));
    vec4 bottomT = texture2D(terrainHeightTex, curuv+vec2(0.0,-div));
    vec4 leftT = texture2D(terrainHeightTex, curuv+vec2(-div,0.0));
    vec4 curT = texture2D(terrainHeightTex, curuv);

    float heightScale = 30.0; 
    topT *= heightScale;
    rightT *= heightScale;
    bottomT *= heightScale;
    leftT *= heightScale;
    curT *= heightScale;

    //topT = u_heightMap_MinMax.x + topT * u_heightMap_MinMax.y;
    //rightT = u_heightMap_MinMax.x + rightT * u_heightMap_MinMax.y;
    //bottomT = u_heightMap_MinMax.x + bottomT * u_heightMap_MinMax.y;
    //leftT = u_heightMap_MinMax.x + leftT * u_heightMap_MinMax.y;
    //curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;

    // read water heights.
    float waterScale = 5.0;
    vec4 topW = texture2D(waterHeightTex, curuv + vec2(0.0, div)) * waterScale;
    vec4 rightW = texture2D(waterHeightTex, curuv + vec2(div, 0.0)) * waterScale;
    vec4 bottomW = texture2D(waterHeightTex, curuv + vec2(0.0, -div)) * waterScale;
    vec4 leftW = texture2D(waterHeightTex, curuv + vec2(-div, 0.0)) * waterScale;
    vec4 curW = texture2D(waterHeightTex, curuv) * waterScale;

    // read flux.
    vec4 curFlux = texture2D(currWaterFluxTex, curuv);

    // calculate outputs.
    float curTotalH = curT.r + curW.r;

    float HTopOut = curTotalH - (topT.r + topW.r);
    float HRightOut = curTotalH - (rightT.r + rightW.r);
    float HBottomOut = curTotalH - (bottomT.r + bottomW.r);
    float HLeftOut = curTotalH - (leftT.r + leftW.r);

    // outFlux.
    float ftopout = max(0.0, curFlux.x + (u_timestep * g * u_PipeArea * HTopOut) / pipelen);
    float frightout = max(0.0, curFlux.y + (u_timestep * g * u_PipeArea * HRightOut) / pipelen);
    float fbottomout = max(0.0, curFlux.z + (u_timestep * g * u_PipeArea * HBottomOut) / pipelen);
    float fleftout = max(0.0, curFlux.w + (u_timestep * g * u_PipeArea * HLeftOut) / pipelen);


    float damping = 0.9999;
    //damping = 1.0;
    float k = min(1.0,((curW.r ) * u_PipeLen * u_PipeLen) / (u_timestep * (ftopout + frightout + fbottomout + fleftout))) * damping;
    //k = 1.0;
    //rescale outflow readFlux so that outflow don't exceed current water volume
    ftopout *= k;
    frightout *= k;
    fbottomout *= k;
    fleftout *= k;

    //boundary conditions
    if(curuv.x <= div) fleftout = 0.0;
    if(curuv.x >= 1.0 - 2.0 * div) frightout = 0.0;
    if(curuv.y <= div) ftopout = 0.0;
    if(curuv.y >= 1.0 - 2.0 * div) fbottomout = 0.0;


    if(curuv.x <= div || (curuv.x >= 1.0 - 2.0 * div) || (curuv.y <= div) || (curuv.y >= 1.0 - 2.0 * div) ){
        ftopout = 0.0;
        frightout = 0.0;
        fbottomout = 0.0;
        fleftout = 0.0;
    }
    


    vec4 writeFlux = vec4(ftopout, frightout, fbottomout, fleftout);

    gl_FragData[0] = writeFlux;  // water flux.
    //gl_FragData[0] = vec4(HTopOut, HRightOut, HBottomOut, HLeftOut); // test debug:
   //gl_FragData[0] = vec4(testA*50.0, testB*50.0, testC*50.0, testD*50.0); // test debug:

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(0.0); // depth
        gl_FragData[2] = vec4(0.0); // normal
        gl_FragData[3] = vec4(0.0); // albedo
        gl_FragData[4] = vec4(0.0); // selection color
    #endif

}