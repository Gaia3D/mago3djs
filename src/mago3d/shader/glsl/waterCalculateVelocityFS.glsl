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
uniform sampler2D currWaterFluxTex_HIGH;
uniform sampler2D currWaterFluxTex_LOW;
uniform sampler2D contaminantHeightTex;

varying vec2 v_tex_pos; // texCoords.
#define PI 3.1415926

uniform float u_timestep;

uniform vec2 u_tileSize; // tile size in meters.
uniform vec2 u_heightMap_MinMax; // terrain min max heights. no used.
uniform float u_waterMaxHeigh;
uniform float u_waterMaxFlux;
uniform float u_waterMaxVelocity;
uniform float u_contaminantMaxHeigh;

uniform vec2 u_simulationTextureSize; // for example 512 x 512.
uniform vec2 u_terrainTextureSize;

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
    //float decoded = decodeRG(color4.rg); // old.
    float decoded = unpackDepth(color4);
    float waterHeight = decoded * u_waterMaxHeigh;
    return waterHeight;
}

float getContaminantHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);
    //float decoded = decodeRG(color4.rg); // 16bit.
    float decoded = unpackDepth(color4); // 32bit.
    float waterHeight = decoded * u_contaminantMaxHeigh;

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

    float divX = 1.0/u_simulationTextureSize.x;
    float divY = 1.0/u_simulationTextureSize.y;

    float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;
    float cellArea = cellSize_x * cellSize_y;
    float timeStep_divCellArea = u_timestep / cellArea;;

    vec4 topflux = getWaterFlux(curuv + vec2(0.0, divY));
    vec4 rightflux = getWaterFlux(curuv + vec2(divX, 0.0));
    vec4 bottomflux = getWaterFlux(curuv + vec2(0.0, -divY));
    vec4 leftflux = getWaterFlux(curuv + vec2(-divX, 0.0));
    vec4 curflux = getWaterFlux(curuv);

    //out flow flux
    float ftopout = curflux.x;
    float frightout = curflux.y;
    float fbottomout = curflux.z;
    float fleftout = curflux.w;

    vec4 outputflux = curflux;
    vec4 inputflux = vec4(topflux.z, rightflux.w, bottomflux.x, leftflux.y);

    // Now, calculate the contamination trasference.**************************************************
    // read water heights.
    float topWH = getWaterHeight(curuv + vec2(0.0, divY));
    float rightWH = getWaterHeight(curuv + vec2(divX, 0.0));
    float bottomWH = getWaterHeight(curuv + vec2(0.0, -divY));
    float leftWH = getWaterHeight(curuv + vec2(-divX, 0.0));
    float curWH = getWaterHeight(curuv);

    float topCH = 0.0;
    float rightCH = 0.0;
    float bottomCH = 0.0;
    float leftCH = 0.0;
    float curCH = 0.0;

    // Check if exist contaminant.
    if(u_contaminantMaxHeigh > 0.0)
    {
        // exist contaminant.
        topCH = getContaminantHeight(curuv + vec2(0.0, divY));
        rightCH = getContaminantHeight(curuv + vec2(divX, 0.0));
        bottomCH = getContaminantHeight(curuv + vec2(0.0, -divY));
        leftCH = getContaminantHeight(curuv + vec2(-divX, 0.0));
        curCH = getContaminantHeight(curuv);
    }

    // calculate contaminat ratio.
    float topContaminPerUnit = topCH / (topCH + topWH);
    float rightContaminPerUnit = rightCH / (rightCH + rightWH);
    float bottomContaminPerUnit = bottomCH / (bottomCH + bottomWH);
    float leftContaminPerUnit = leftCH / (leftCH + leftWH);

    // calculate input waterHeight & contaminHeight.
    float inputTopTotalH = inputflux.x * timeStep_divCellArea;
    float inputRightTotalH = inputflux.y * timeStep_divCellArea;
    float inputBottomTotalH = inputflux.z * timeStep_divCellArea;
    float inputLeftTotalH = inputflux.w * timeStep_divCellArea;

    float inputTopCH = inputTopTotalH * topContaminPerUnit;
    float inputRightCH = inputRightTotalH * rightContaminPerUnit;
    float inputBottomCH = inputBottomTotalH * bottomContaminPerUnit;
    float inputLeftCH = inputLeftTotalH * leftContaminPerUnit;

    float inputTopWH = inputTopTotalH - inputTopCH;
    float inputRightWH = inputRightTotalH - inputRightCH;
    float inputBottomWH = inputBottomTotalH - inputBottomCH;
    float inputLeftWH = inputLeftTotalH - inputLeftCH;

    // Now, calculate outputs.
    float currContaminPerUnit = curCH / (curCH + curWH);
    float outputTotalH = (ftopout + frightout + fbottomout + fleftout) * timeStep_divCellArea;
    float outputCH = outputTotalH * currContaminPerUnit;
    float outputWH = outputTotalH - outputCH;

    // Now, calculate delt-water-H & delta-contaminant-H.
    float deltaWH = inputTopWH + inputRightWH + inputBottomWH + inputLeftWH - outputWH;
    float deltaCH = inputTopCH + inputRightCH + inputBottomCH + inputLeftCH - outputCH;
    float deltaH = deltaWH + deltaCH;
    //------------------------------------------------------------------------------------------------

    //vec4 curT = texture2D(terrainHeightTex, vec2(v_tex_pos.x, v_tex_pos.y));
    //curT = u_heightMap_MinMax.x + curT * u_heightMap_MinMax.y;

    float fout = ftopout + frightout + fbottomout + fleftout;
    float fin = inputflux.x + inputflux.y + inputflux.z + inputflux.w;

    //float deltaH = u_timestep * (fin - fout) / cellArea; 
    //---------------------------------------------------------------------------------

    

    //float d1 = cur.y + curs.x; // original. (waterH + sedimentH).
    float d1 = curWH + curCH;
    float d2 = d1 + deltaH;
    float da = (d1 + d2)/2.0;

    vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;

    vec4 shaderLogColor4 = vec4(0.0);

    if(da <= 1e-8) 
    {
        veloci = vec2(0.0);
    }
    else
    {
        //veloci = veloci/(da * u_PipeLen);
        veloci = veloci/(da * vec2(cellSize_y, cellSize_x));
    }

    if(curuv.x <= divX) 
    { 
        deltaWH = 0.0; 
        deltaCH = 0.0; 
        veloci = vec2(0.0); 
    }
    if(curuv.x >= 1.0 - 2.0 * divX) 
    { 
        deltaWH = 0.0; 
        deltaCH = 0.0; 
        veloci = vec2(0.0); 
    }
    if(curuv.y <= divY) 
    { 
        deltaWH = 0.0; 
        deltaCH = 0.0; 
        veloci = vec2(0.0); 
    }
    if(curuv.y >= 1.0 - 2.0 * divY) 
    { 
        deltaWH = 0.0; 
        deltaCH = 0.0; 
        veloci = vec2(0.0); 
    }

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

    

    vec2 encodedVelocity = encodeVelocity(veloci/u_waterMaxVelocity);
    vec4 writeVel = vec4(encodedVelocity, 0.0, 1.0);
    //vec4 writeWaterHeight = vec4(cur.x,max(cur.y+deltavol, 0.0),cur.z,cur.w); // original.***

    // test debug:
    //if(abs(veloci.x) > 40.0 || abs(veloci.y) > 40.0)
    {
        shaderLogColor4 = vec4(encodedVelocity, 0.0, 1.0);
    }

    float waterHeight = max(curWH + deltaWH, 0.0); // original.***
    vec4 encodedWH = packDepth(waterHeight / u_waterMaxHeigh);
    gl_FragData[0] = encodedWH;  // water height.

    vec4 encodedCH = vec4(0.0);
    if(u_contaminantMaxHeigh > 0.0)
    {
        float contaminantHeight = max(curCH + deltaCH, 0.0);
        encodedCH = packDepth(contaminantHeight / u_contaminantMaxHeigh);
    }


    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = writeVel; // velocity
        gl_FragData[2] = encodedCH; // contaminatHeight if exist.
        gl_FragData[3] = vec4(0.0); // 
        gl_FragData[4] = vec4(0.0); // 
    #endif

}