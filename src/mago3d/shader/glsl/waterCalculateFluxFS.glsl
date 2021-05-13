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
uniform sampler2D currWaterFluxTex_HIGH;
uniform sampler2D currWaterFluxTex_LOW;

varying vec2 v_tex_pos;

uniform float u_SimRes;
uniform float u_PipeLen; // pipeLen = cellSizeX = cellSizeY.
uniform float u_timestep;
uniform float u_PipeArea;

uniform vec2 u_tileSize; // tile size in meters.
uniform float u_waterMaxHeigh;
uniform float u_waterMaxFlux;
uniform vec2 u_heightMap_MinMax;

float decodeRG(in vec2 waterColorRG)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));
}

vec2 encodeRG(in float wh)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    float encodedBit = 1.0/255.0;
    vec2 enc = vec2(1.0, 255.0) * wh;
    enc = fract(enc);
    enc.x -= enc.y * encodedBit;
    return enc; // R = HIGH, G = LOW.***
}

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float getWaterHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(waterHeightTex, texCoord);
    //float decoded = decodeRG(color4.rg); // 16bit.
    float decoded = unpackDepth(color4); // 32bit.
    float waterHeight = decoded * u_waterMaxHeigh;

    return waterHeight;
}

vec4 getWaterFlux(in vec2 texCoord)
{
    vec4 color4_HIGH = texture2D(currWaterFluxTex_HIGH, texCoord);
    vec4 color4_LOW = texture2D(currWaterFluxTex_LOW, texCoord);

    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));

    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_waterMaxFlux;
    return flux; 
}

void encodeWaterFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)
{
    vec2 encoded_top_flux = encodeRG(flux.r);
    vec2 encoded_right_flux = encodeRG(flux.g);
    vec2 encoded_bottom_flux = encodeRG(flux.b);
    vec2 encoded_left_flux = encodeRG(flux.a);

    flux_high = vec4(encoded_top_flux.r, encoded_right_flux.r, encoded_bottom_flux.r, encoded_left_flux.r);
    flux_low = vec4(encoded_top_flux.g, encoded_right_flux.g, encoded_bottom_flux.g, encoded_left_flux.g);
}





void main()
{
    vec2 curuv = vec2(v_tex_pos.x, v_tex_pos.y);
    vec2 curuvTerrain = vec2(v_tex_pos.x, v_tex_pos.y);
    float div = 1.0/u_SimRes;
    //float g = 0.80;

    float cellSize_x = u_tileSize.x / u_SimRes;
    float cellSize_y = u_tileSize.y / u_SimRes;

    // Terrain & water heights.**************************************************************************************************
    // read terrain heights.
    vec4 topT = texture2D(terrainHeightTex, curuvTerrain + vec2(0.0, div));
    vec4 rightT = texture2D(terrainHeightTex, curuvTerrain + vec2(div, 0.0));
    vec4 bottomT = texture2D(terrainHeightTex, curuvTerrain + vec2(0.0, -div));
    vec4 leftT = texture2D(terrainHeightTex, curuvTerrain + vec2(-div, 0.0));
    vec4 curT = texture2D(terrainHeightTex, curuvTerrain);

    topT = u_heightMap_MinMax.x + topT * u_heightMap_MinMax.y;
    rightT = u_heightMap_MinMax.x + rightT * u_heightMap_MinMax.y;
    bottomT = u_heightMap_MinMax.x + bottomT * u_heightMap_MinMax.y;
    leftT = u_heightMap_MinMax.x + leftT * u_heightMap_MinMax.y;
    curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;

    // read water heights.
    float topWH = getWaterHeight(curuv + vec2(0.0, div));
    float rightWH = getWaterHeight(curuv + vec2(div, 0.0));
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -div));
    float leftWH = getWaterHeight(curuv + vec2(-div, 0.0));

    float curWH = getWaterHeight(curuv);
    // End terrain & water heights.-----------------------------------------------------------------------------------------------

    // Calculate deltaPresure: deltaP_ij(x,y) = ro*g* deltaH_ij(x,y).*************************************************************
    // calculate deltaH.***
    float curTotalH = curT.r + curWH;
    float HTopOut = curTotalH - (topT.r + topWH);
    float HRightOut = curTotalH - (rightT.r + rightWH);
    float HBottomOut = curTotalH - (bottomT.r + bottomWH);
    float HLeftOut = curTotalH - (leftT.r + leftWH);
    float gravity = 9.8;
    float waterDensity = 997.0; // 997kg/m3.
    vec4 deltaP = vec4(waterDensity * gravity * HTopOut, 
                        waterDensity * gravity * HRightOut, 
                        waterDensity * gravity * HBottomOut, 
                        waterDensity * gravity * HLeftOut ); // deltaP = kg/(m*s2) = Pa.

    // calculate water acceleration.*********************************************************************************************
    vec4 waterAccel = vec4(deltaP.x/(waterDensity * cellSize_x),
                            deltaP.y/(waterDensity * cellSize_y),
                            deltaP.z/(waterDensity * cellSize_x),
                            deltaP.w/(waterDensity * cellSize_y));

    // read flux.
    vec4 curFlux = getWaterFlux(curuv);

    // calculate the new flux.
    float pipeArea = cellSize_x * cellSize_y;
    vec4 newFlux = u_timestep * pipeArea * waterAccel;

    // total outFlux.
    float cushionFactor = 0.9999; // esmorteiment.
    float ftopout = max(0.0, curFlux.x + newFlux.x) * cushionFactor;
    float frightout = max(0.0, curFlux.y + newFlux.y) * cushionFactor;
    float fbottomout = max(0.0, curFlux.z + newFlux.z) * cushionFactor;
    float fleftout = max(0.0, curFlux.w + newFlux.w) * cushionFactor;

    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.

    // calculate vOut & currVolum.
    float vOut = u_timestep * (ftopout + frightout + fbottomout + fleftout); 

    float currWaterVol = curWH * pipeArea;

    if(vOut > currWaterVol)
    {
        //rescale outflow readFlux so that outflow don't exceed current water volume
        float factor = (currWaterVol / vOut);
        ftopout *= factor;
        frightout *= factor;
        fbottomout *= factor;
        fleftout *= factor;
    }

    
    /*
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
    */

    vec4 outFlux = vec4(ftopout, frightout, fbottomout, fleftout) / u_waterMaxFlux;
    vec4 flux_high;
    vec4 flux_low;
    encodeWaterFlux(outFlux, flux_high, flux_low);

    gl_FragData[0] = flux_high;  // water flux high.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = flux_low; // water flux low.
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.
        gl_FragData[3] = vec4(0.0); // albedo
        gl_FragData[4] = vec4(0.0); // selection color
    #endif

}