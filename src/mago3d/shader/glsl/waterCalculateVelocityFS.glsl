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

varying vec2 v_tex_pos; // texCoords.
#define PI 3.1415926

uniform float u_SimRes;
uniform float u_PipeLen; // pipeLen = cellSizeX = cellSizeY.
uniform float u_timestep;
uniform float u_PipeArea;

uniform vec2 u_tileSize; // tile size in meters.
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

float getWaterHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(waterHeightTex, texCoord);
    float decoded = decodeRG(color4.rg);
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
    curuv = v_tex_pos;
    float div = 1.0/u_SimRes;

    //vec4 topflux = texture2D(currWaterFluxTex, curuv + vec2(0.0, div)) * u_waterMaxFlux;
    //vec4 rightflux = texture2D(currWaterFluxTex, curuv + vec2(div, 0.0)) * u_waterMaxFlux;
    //vec4 bottomflux = texture2D(currWaterFluxTex, curuv + vec2(0.0, -div)) * u_waterMaxFlux;
    //vec4 leftflux = texture2D(currWaterFluxTex, curuv + vec2(-div, 0.0)) * u_waterMaxFlux;
    //vec4 curflux = texture2D(currWaterFluxTex, curuv) * u_waterMaxFlux;

    vec4 topflux = getWaterFlux(curuv + vec2(0.0, div));
    vec4 rightflux = getWaterFlux(curuv + vec2(div, 0.0));
    vec4 bottomflux = getWaterFlux(curuv + vec2(0.0, -div));
    vec4 leftflux = getWaterFlux(curuv + vec2(-div, 0.0));
    vec4 curflux = getWaterFlux(curuv);
    //vec4 curT = texture2D(terrainHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));
    //curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;
    float currWaterHeight = getWaterHeight(vec2(v_tex_pos.x, v_tex_pos.y));
    
    //out flow flux
    float ftopout = curflux.x;
    float frightout = curflux.y;
    float fbottomout = curflux.z;
    float fleftout = curflux.w;

    vec4 outputflux = curflux;
    vec4 inputflux = vec4(topflux.z, rightflux.w, bottomflux.x, leftflux.y);

    float fout = ftopout + frightout + fbottomout + fleftout;
    float fin = inputflux.x + inputflux.y + inputflux.z + inputflux.w;


    float cellSize_x = u_tileSize.x / u_SimRes;
    float cellSize_y = u_tileSize.y / u_SimRes;

    float deltavol = u_timestep * (fin - fout) / (cellSize_x * cellSize_y); // pipeLen = cellSizeX = cellSizeY.
    //---------------------------------------------------------------------------------

    //float d1 = cur.y + curs.x; // original. (waterH + sedimentH).
    float d1 = currWaterHeight;
    float d2 = d1 + deltavol;
    float da = (d1 + d2)/2.0;

    vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;

    if(da <= 1e-8) 
    {
        veloci = vec2(0.0);
    }
    else
    {
        //veloci = veloci/(da * u_PipeLen);
        veloci = veloci/(da * cellSize_x);
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

    float waterHeight = max(currWaterHeight + deltavol, 0.0); // original.***
    waterHeight /= u_waterMaxHeigh; // original.***
    vec2 encodedWH = encodeRG(waterHeight);
    vec4 writeWaterHeight = vec4(encodedWH.rg, 1.0, 1.0);


    gl_FragData[0] = writeWaterHeight;  // water flux.


    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = writeVel; // velocity
        gl_FragData[2] = vec4(0.0); // 
        gl_FragData[3] = vec4(0.0); // 
        gl_FragData[4] = vec4(0.0); // 
    #endif

}