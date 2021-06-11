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

uniform sampler2D terrainHeightTex;
uniform sampler2D terrainMaxSlippageTex;

varying vec2 v_tex_pos;
uniform float u_timestep;

uniform vec2 u_tileSize; // tile size in meters.
uniform float u_terrainMaxFlux;
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.
uniform float u_contaminantMaxHeigh; // if "u_contaminantMaxHeigh" < 0.0 -> no exist contaminant.

uniform vec2 u_simulationTextureSize;
uniform vec2 u_terrainTextureSize;

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



float getTerrainHeight(in vec2 texCoord)
{
    float terainHeight = texture2D(terrainHeightTex, texCoord).r;
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);
    return terainHeight;
}

float getMaxSlippage(in vec2 texCoord)
{
    // Note : for maxSlippage use "u_heightMap_MinMax.y" as quantizer.
    vec4 encoded = texture2D(terrainMaxSlippageTex, texCoord);
    float decoded = unpackDepth(encoded);
    decoded = decoded * u_heightMap_MinMax.y;
    return decoded;
}

void encodeFlux(vec4 flux, inout vec4 flux_high, inout vec4 flux_low)
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
    vec2 curuv = v_tex_pos;
    float divX = 1.0/u_simulationTextureSize.x;
    float divY = 1.0/u_simulationTextureSize.y;

    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;

    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.

    // Terrain heights.**************************************************************************************************
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));
    float curTH = getTerrainHeight(curuv);
    // End terrain heights.-----------------------------------------------------------------------------------------------

    // MaxSlippges.******************************************************************************************************
    float topSlip = getMaxSlippage(curuv + vec2(0.0, divY));
    float rightSlip = getMaxSlippage(curuv + vec2(divX, 0.0));
    float bottomSlip = getMaxSlippage(curuv + vec2(0.0, -divY));
    float leftSlip = getMaxSlippage(curuv + vec2(-divX, 0.0));
    float curSlip = getMaxSlippage(curuv);
    // End max slippages.-------------------------------------------------------------------------------------------------


    vec4 diff;
    diff.x = curTH - topTH - (curSlip + topSlip) * 0.5;
    diff.y = curTH - rightTH - (curSlip + rightSlip) * 0.5;
    diff.z = curTH - bottomTH - (curSlip + bottomSlip) * 0.5;
    diff.w = curTH - leftTH - (curSlip + leftSlip) * 0.5;

    diff = max(vec4(0.0), diff);

    //vec4 newFlow = diff * 0.2;
    vec4 newFlow = diff;

    float outfactor = (newFlow.x + newFlow.y + newFlow.z + newFlow.w)*u_timestep;

    if(outfactor > 1e-5){
        outfactor = curTH / outfactor;
        if(outfactor > 1.0) outfactor = 1.0;
        newFlow = newFlow * outfactor;
    
        shaderLogFluxColor4 = vec4(1.0, 0.5, 0.25, 1.0);
    }

    /*
    if(outfactor > curTH){
        float factor = (curTH / outfactor);
        newFlow *= factor;
        shaderLogFluxColor4 = vec4(1.0, 0.5, 0.25, 1.0);
    }
    */
    

    /*
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

    vec4 outFlux = newFlow / u_terrainMaxFlux;
    vec4 flux_high;
    vec4 flux_low;
    encodeFlux(outFlux, flux_high, flux_low);

    shaderLogFluxColor4 = outFlux;

    gl_FragData[0] = flux_high;  // water flux high.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = flux_low; // water flux low.
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.
        gl_FragData[3] = shaderLogFluxColor4; // albedo
        gl_FragData[4] = shaderLogFluxColor4; // selection color
    #endif

}