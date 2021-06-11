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
uniform sampler2D terrainFluxTex_HIGH;
uniform sampler2D terrainFluxTex_LOW;

varying vec2 v_tex_pos;
uniform float u_timestep;

uniform vec2 u_tileSize; // tile size in meters.
uniform vec2 u_heightMap_MinMax; // terrain min-max heights.
uniform float u_terrainMaxFlux;

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

vec4 getTerrainFlux(in vec2 texCoord)
{
    vec4 color4_HIGH = texture2D(terrainFluxTex_HIGH, texCoord);
    vec4 color4_LOW = texture2D(terrainFluxTex_LOW, texCoord);

    float flux_top = decodeRG(vec2(color4_HIGH.r, color4_LOW.r));
    float flux_right = decodeRG(vec2(color4_HIGH.g, color4_LOW.g));
    float flux_bottom = decodeRG(vec2(color4_HIGH.b, color4_LOW.b));
    float flux_left = decodeRG(vec2(color4_HIGH.a, color4_LOW.a));

    vec4 flux = vec4(flux_top, flux_right, flux_bottom, flux_left) * u_terrainMaxFlux;
    return flux; 
}

void main()
{
    vec2 curuv = v_tex_pos;
    float divX = 1.0/u_simulationTextureSize.x;
    float divY = 1.0/u_simulationTextureSize.y;

    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;

    vec4 shaderLogFluxColor4 = vec4(0.0); // test var. delete after use.

    // Terrain height.
    float curTH = getTerrainHeight(curuv);

    // Terrain fluxes.
    vec4 topFlux = getTerrainFlux(curuv + vec2(0.0, divY));
    vec4 rightFlux = getTerrainFlux(curuv + vec2(divX, 0.0));
    vec4 bottomFlux = getTerrainFlux(curuv + vec2(0.0, -divY));
    vec4 leftFlux = getTerrainFlux(curuv + vec2(-divX, 0.0));

    vec4 outFlux = getTerrainFlux(curuv);
    vec4 inputFlux = vec4(topFlux.z, rightFlux.w, bottomFlux.x, leftFlux.y);

    float vol = inputFlux.x + inputFlux.y + inputFlux.z + inputFlux.w - outFlux.x - outFlux.y - outFlux.z - outFlux.w;

    float thermalErosionScale = 2.6;
    thermalErosionScale = 1.0;
    //float tdelta = min(10.0, u_timestep * thermalErosionScale) * vol; // original.
    float tdelta = (u_timestep * thermalErosionScale) * vol;
    float newTerrainHeight = curTH + tdelta;
    newTerrainHeight = (newTerrainHeight - u_heightMap_MinMax.x) / (u_heightMap_MinMax.y - u_heightMap_MinMax.x);
    vec4 newTH4 = vec4(newTerrainHeight, newTerrainHeight, newTerrainHeight, 1.0);

    shaderLogFluxColor4 = outFlux;

    gl_FragData[0] = newTH4;  // water flux high.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = shaderLogFluxColor4; // water flux low.
        gl_FragData[2] = shaderLogFluxColor4; // shader log. delete after use.
        gl_FragData[3] = shaderLogFluxColor4; // albedo
        gl_FragData[4] = shaderLogFluxColor4; // selection color
    #endif

}