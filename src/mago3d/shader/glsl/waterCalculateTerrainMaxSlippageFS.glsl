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

varying vec2 v_tex_pos;
uniform float u_timestep;

uniform vec2 u_tileSize; // tile size in meters.
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.

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

void main()
{
    vec2 curuv = v_tex_pos;
    float divX = 1.0/u_simulationTextureSize.x;
    float divY = 1.0/u_simulationTextureSize.y;

    //float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;
    //float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;

    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.

    // Terrain heights.**************************************************************************************************
    float topTH = getTerrainHeight(curuv + vec2(0.0, divY));
    float rightTH = getTerrainHeight(curuv + vec2(divX, 0.0));
    float bottomTH = getTerrainHeight(curuv + vec2(0.0, -divY));
    float leftTH = getTerrainHeight(curuv + vec2(-divX, 0.0));
    float curTH = getTerrainHeight(curuv);
    // End terrain heights.-----------------------------------------------------------------------------------------------

    // Calculate maxSlippge.***
    float _maxHeightDiff = 3.0;
    //float maxLocalDiff = _maxHeightDiff * 0.01; // original.**
    float maxLocalDiff = _maxHeightDiff * 0.01;
    float avgDiff = (topTH + rightTH + bottomTH + leftTH) * 0.25 - curTH;
    //avgDiff = 10.0 * max(abs(avgDiff) - maxLocalDiff, 0.0); // original.
    avgDiff = 1.0 * max(abs(avgDiff) - maxLocalDiff, 0.0);

    float maxSlippage = max(_maxHeightDiff - avgDiff, 0.0);

    // now, encode the maxSlippage value.
    // Note : for maxSlippage use "u_heightMap_MinMax.y" as quantizer.
    maxSlippage = maxSlippage / u_heightMap_MinMax.y;
    //maxSlippage *= 100.0; // test.
    //maxSlippage *= 10.0; // test.
    shaderLogFluxColor4 = vec4(maxSlippage, 0.0, 0.0, 1.0);


    vec4 maxslippage4 = packDepth(maxSlippage);
    //vec4 maxslippage4 = vec4(maxSlippage, 0.0, 0.0, 1.0); // test.***

    gl_FragData[0] = maxslippage4;  // water flux high.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = shaderLogFluxColor4; // water flux low.
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.
        gl_FragData[3] = shaderLogFluxColor4; // albedo
        gl_FragData[4] = shaderLogFluxColor4; // selection color
    #endif

}