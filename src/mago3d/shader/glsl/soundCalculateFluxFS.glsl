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

    //*********************************************************
    // R= right, F= front, U= up, L= left, B= back, D= down.
    // RFU = x, y, z.
    // LBD = -x, -y, -z.
    //*********************************************************

uniform sampler2D airPressureMosaicTex;
uniform sampler2D flux_RFU_MosaicTex_HIGH; // Inside here, there are the voxelization of the scene (in alpha channel).***
uniform sampler2D flux_RFU_MosaicTex_LOW;
uniform sampler2D flux_LBD_MosaicTex_HIGH;
uniform sampler2D flux_LBD_MosaicTex_LOW;
uniform sampler2D auxMosaicTex; // here, contains :
	// tex_0 = prev airPressureTex
	// tex_1 = next airPressureTex
	// tex_2 = prev flux_RFU_HIGH
	// tex_3 = next flux_RFU_HIGH
	// tex_4 = prev flux_RFU_LOW
	// tex_5 = next flux_RFU_LOW
	// tex_6 = prev flux_LBD_HIGH
	// tex_7 = next flux_LBD_HIGH
	// tex_8 = prev flux_LBD_LOW
	// tex_9 = next flux_LBD_LOW

	//  
	//      +-----------+-----------+-----------+-----------+
	//      |           |           |           |           |     
	//      |   tex_8   |   tex_9   |  nothing  |  nothing  |
	//      |           |           |           |           | 
	//      +-----------+-----------+-----------+-----------+
	//      |           |           |           |           | 
	//      |   tex_4   |   tex_5   |   tex_6   |   tex_7   |
	//      |           |           |           |           |
	//      +-----------+-----------+-----------+-----------+
	//      |           |           |           |           |    
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   | 
	//      |           |           |           |           |
	//      +-----------+-----------+-----------+-----------+

uniform int u_texSize[3]; // The original texture3D size.***
uniform int u_mosaicTexSize[3]; // The mosaic texture size.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform int u_lowestMosaicSliceIndex;

varying vec2 v_tex_pos;

uniform float u_timestep;

//uniform vec2 u_tileSize; // tile size in meters.
uniform vec3 u_voxelSizeMeters;
uniform float u_airMaxPressure;
uniform float u_maxFlux;
//uniform vec2 u_heightMap_MinMax;

//uniform vec2 u_simulationTextureSize;
//uniform vec2 u_terrainTextureSize;
//uniform int u_terrainHeightEncodingBytes;

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

vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row)
{
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    float sRange = 1.0 / float(u_mosaicSize[0]);
    float tRange = 1.0 / float(u_mosaicSize[1]);

    float s = float(col) * sRange + subTexCoord.x * sRange;
    float t = float(row) * tRange + subTexCoord.y * tRange;

    vec2 resultTexCoord = vec2(s, t);
    return resultTexCoord;
}

vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)
{
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    float sRange = 1.0 / float(u_mosaicSize[0]);
    float tRange = 1.0 / float(u_mosaicSize[1]);

    // Determine the [col, row] of the mosaic.***
    vec2 resultColRow = vec2(floor(texCoord.x / sRange), floor(texCoord.y / tRange));

    // determine the subTexCoord.***
    float col_mod = texCoord.x - resultColRow.x * sRange;
    float row_mod = texCoord.y - resultColRow.y * tRange;
    float s = col_mod / sRange;
    float t = row_mod / tRange;
    subTexCoord = vec2(s, t);

    return resultColRow;
}

float getAirPressure_inMosaicTexture(in vec2 texCoord)
{
    vec4 color4 = texture2D(airPressureMosaicTex, texCoord);
    float decoded = unpackDepth(color4); // 32bit.
    float airPressure = decoded * u_airMaxPressure;

    return airPressure;
}

float getAirPressure_inAuxMosaicTexture(in vec2 texCoord)
{
    vec4 color4 = texture2D(auxMosaicTex, texCoord);
    float decoded = unpackDepth(color4); // 32bit.
    float airPressure = decoded * u_airMaxPressure;

    return airPressure;
}

bool getPrevSubTextureColRow(in int col, in int row, inout int prev_col, inout int prev_row)
{
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    prev_row = row;
    if(col == 0)
    {
        prev_col = u_mosaicSize[0] - 1;
        prev_row = row - 1;

        // now, check if the prev_row is inside of the boundary.***
        if(prev_row < 0)
        {
            // we are outside of the tex3d boundary.***
            return false;
        }
    }
    else
    {
        prev_col = col - 1;
    }
    return true;
}

bool getNextSubTextureColRow(in int col, in int row, inout int next_col, inout int next_row)
{
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    next_row = row;
    if(col == u_mosaicSize[0] - 1)
    {
        next_col = 0;
        next_row = row + 1;

        // now, check if the next_row is inside of the boundary.***
        if(next_row > u_mosaicSize[1] - 1)
        {
            // we are outside of the tex3d boundary.***
            return false;
        }
    }
    else
    {
        next_col = col + 1;
    }
    return true;
}

float getAirPressure(in vec2 texCoord, inout vec3 airPressure_RFU, inout vec3 airPressure_LBD)
{
    // Note : this function returns the airPressure of all 6 Neighbor too.***
    vec2 subTexCoord;
    vec2 colRow = getColRow_and_subTexCoord(texCoord, subTexCoord);

    float col = colRow.x;
    float row = colRow.y;
    int col_int = int(col);
    int row_int = int(row);

    float divSubX = 1.0 / float(u_texSize[0]); // divX for subTexture.***
    float divSubY = 1.0 / float(u_texSize[1]); // divX for subTexture.***

    // airPressure_curr.*********************************************************************
    float airPressure_curr = getAirPressure_inMosaicTexture(texCoord);

    // airPressure_R.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_R = subTexCoord + vec2(divSubX, 0.0);
    if(subTexCoord_R.x > 1.0)
    {
        // is out of simulation boundary.***
        airPressure_RFU.x = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_R:
        vec2 mosaicTexCoord_R = subTexCoord_to_texCoord(subTexCoord_R, col_int, row_int);
        airPressure_RFU.x = getAirPressure_inMosaicTexture(mosaicTexCoord_R);
    }

    // airPressure_F.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_F = subTexCoord + vec2(0.0, divSubY);
    if(subTexCoord_F.y > 1.0)
    {
        // is out of simulation boundary.***
        airPressure_RFU.y = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_F:
        vec2 mosaicTexCoord_F = subTexCoord_to_texCoord(subTexCoord_F, col_int, row_int);
        airPressure_RFU.y = getAirPressure_inMosaicTexture(mosaicTexCoord_F);
    }

    // airPressure_U.************************************************************************
    // To calculate the airPressure_U, must know the UP_subTexrure (NEXT subTexure).***
    // But, if the current subTexture is in right_up_corner, then must use the "auxMosaicTex".***
    // use the next subTexture.***
    int next_col;
    int next_row;
    if(getNextSubTextureColRow(col_int, row_int, next_col, next_row))
    {
        // must recalcuate the mosaicTexCoord.***
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, next_col, next_row);
        airPressure_RFU.z = getAirPressure_inMosaicTexture(newMosaicTexCoord); 
    }
    else
    {
        // Is out of this slice.***
        // Must use the "auxMosaicTex". This is a [4, 3] mosaic texture.***
        // tex_1 = next airPressureTex. this in [col 1, row 0] into "auxMosaicTex".***
        // Must calculate the texCoords of auxMosaicTex.***

        float sRange_aux = 1.0 / 4.0;
        float tRange_aux = 1.0 / 3.0;

        float col_aux = 1.0;
        float row_aux = 0.0;

        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        vec2 texCoord_auxMosaicTex = vec2(s, t);
        //airPressure_RFU.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);
        airPressure_RFU.z = 0.0; // test:::::::::
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------

    // airPressure_L.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_L = subTexCoord + vec2(-divSubX, 0.0);
    if(subTexCoord_L.x < 0.0)
    {
        // is out of simulation boundary.***
        airPressure_LBD.x = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_L:
        vec2 mosaicTexCoord_L = subTexCoord_to_texCoord(subTexCoord_L, col_int, row_int);
        airPressure_LBD.x = getAirPressure_inMosaicTexture(mosaicTexCoord_L);
    }

    // airPressure_B.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_B = subTexCoord + vec2(0.0, -divSubY);
    if(subTexCoord_B.y < 0.0)
    {
        // is out of simulation boundary.***
        airPressure_LBD.y = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_B:
        vec2 mosaicTexCoord_B = subTexCoord_to_texCoord(subTexCoord_B, col_int, row_int);
        airPressure_LBD.y = getAirPressure_inMosaicTexture(mosaicTexCoord_B);
    }

    // airPressure_D.************************************************************************
    // To calculate the airPressure_D, must know the UP_subTexrure (PREV subTexure).***
    // But, if the current subTexture is in left_down_corner, then must use the "auxMosaicTex".***
    // use the next subTexture.***
    int prev_col;
    int prev_row;
    if(getPrevSubTextureColRow(col_int, row_int, prev_col, prev_row))
    {
        // must recalcuate the mosaicTexCoord.***
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, prev_col, prev_row);
        airPressure_LBD.z = getAirPressure_inMosaicTexture(newMosaicTexCoord); 
    }
    else
    {
        // Is out of simulation boundary.***
        // Must use the "auxMosaicTex". This is a [4, 3] mosaic texture.***
        // tex_1 = next airPressureTex. this in [col 0, row 0] into "auxMosaicTex".***
        // Must calculate the texCoords of auxMosaicTex.***

        float sRange_aux = 1.0 / 4.0;
        float tRange_aux = 1.0 / 3.0;

        float col_aux = 0.0;
        float row_aux = 0.0;

        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        vec2 texCoord_auxMosaicTex = vec2(s, t);
        //airPressure_LBD.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);
        airPressure_LBD.z = 0.0;
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------

    return airPressure_curr;
}

void encodeFlux(in vec3 flux, inout vec3 flux_HIGH, inout vec3 flux_LOW)
{
    vec2 encoded_a_flux = encodeRG(flux.x);
    vec2 encoded_b_flux = encodeRG(flux.y);
    vec2 encoded_c_flux = encodeRG(flux.z);

    flux_HIGH = vec3(encoded_a_flux.x, encoded_b_flux.x, encoded_c_flux.x);
    flux_LOW = vec3(encoded_a_flux.y, encoded_b_flux.y, encoded_c_flux.y);
}

void getFlux(in vec2 texCoord, inout vec3 flux_RFU, inout vec3 flux_LBD)
{
    // This function returns Outing flux.***
    vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord);
    vec4 color4_RFU_LOW = texture2D(flux_RFU_MosaicTex_LOW, texCoord);
    vec4 color4_LBD_HIGH = texture2D(flux_LBD_MosaicTex_HIGH, texCoord);
    vec4 color4_LBD_LOW = texture2D(flux_LBD_MosaicTex_LOW, texCoord);

    // now, decode all fluxes.***
    flux_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.
    flux_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.
    flux_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.

    flux_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.
    flux_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.
    flux_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.
}

float getVoxelSpaceValue(in vec2 texCoord)
{
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH, in alpha channel.***
    vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord);
    return color4_RFU_HIGH.a;
}

void main()
{
    // The objective is to determine the outFlux of the current fragment.***
    // There are 6 directions outFluxing (R, F, U, L, B, D) = (x, y, z, -x, -y, -z) = (Right, Front, Up, Left, Back, Down)
    //-----------------------------------------------------------------------
    float voxelSpaceValue = getVoxelSpaceValue(v_tex_pos);
    if(voxelSpaceValue > 0.0)
    {
        // This is a solid space, so, do nothing. All values are zero.***
        // TODO : 
    }

    // Determine the airPressure of the 6 fragment that is around of current fragment.***
    vec3 airPressure_RFU;
    vec3 airPressure_LBD;
    float airPressure_curr = getAirPressure(v_tex_pos, airPressure_RFU, airPressure_LBD);

    vec3 currFlux_RFU;
    vec3 currFlux_LBD;
    getFlux(v_tex_pos, currFlux_RFU, currFlux_LBD);

    // Calculate deltaPressure.***
    // Check the pressure difference with the neighbor voxels.***
    float R_out = airPressure_curr - airPressure_RFU.x;
    float F_out = airPressure_curr - airPressure_RFU.y;
    float U_out = airPressure_curr - airPressure_RFU.z;
    float L_out = airPressure_curr - airPressure_LBD.x;
    float B_out = airPressure_curr - airPressure_LBD.y;
    float D_out = airPressure_curr - airPressure_LBD.z;

    vec3 deltaP_RFU = vec3(R_out, F_out, U_out);
    vec3 deltaP_LBD = vec3(L_out, B_out, D_out);

    // At 101.325 kPa (abs) and 15 °C, air has a density of approximately 1.225 kg/m3
    float airDensity = 1.225; // provisionally.***
    //vec3 airAccel_RFU = vec3(R_out / (airDensity * u_voxelSizeMeters.x), F_out / (airDensity * u_voxelSizeMeters.y), U_out / (airDensity * u_voxelSizeMeters.z)); // original.***
    //vec3 airAccel_LBD = vec3(L_out / (airDensity * u_voxelSizeMeters.x), B_out / (airDensity * u_voxelSizeMeters.y), D_out / (airDensity * u_voxelSizeMeters.z)); // original.***

    vec3 airAccel_RFU = deltaP_RFU;
    vec3 airAccel_LBD = deltaP_LBD;

    // calculate the new flux.
    float timeStep = u_timestep;

    //float pipeArea = 2.0 * u_voxelSizeMeters.x * u_voxelSizeMeters.y * u_voxelSizeMeters.z;
    float pipeArea = u_voxelSizeMeters.x * u_voxelSizeMeters.y;
    pipeArea = 1.0;
    vec3 newFlux_RFU = timeStep * pipeArea * airAccel_RFU;
    vec3 newFlux_LBD = timeStep * pipeArea * airAccel_LBD;

    // total outFlux.
    float cushionFactor = 0.9999; // esmorteiment.
    float output_R = max(0.0, currFlux_RFU.x + newFlux_RFU.x) * cushionFactor;
    float output_F = max(0.0, currFlux_RFU.y + newFlux_RFU.y) * cushionFactor;
    float output_U = max(0.0, currFlux_RFU.z + newFlux_RFU.z) * cushionFactor;

    float output_L = max(0.0, currFlux_LBD.x + newFlux_LBD.x) * cushionFactor;
    float output_B = max(0.0, currFlux_LBD.y + newFlux_LBD.y) * cushionFactor;
    float output_D = max(0.0, currFlux_LBD.z + newFlux_LBD.z) * cushionFactor;

    // calculate vOut & currVolum.
    float vOut = timeStep * (output_R + output_F + output_U + output_L + output_B + output_D); 
    float currAirVol = airPressure_curr * pipeArea;

    vec4 shaderLog = vec4(0.0);
    if(vOut > currAirVol)
    {
        //rescale outflow readFlux so that outflow don't exceed current water volume
        float factor = (currAirVol / vOut);
        output_R *= factor;
        output_F *= factor;
        output_U *= factor;

        output_L *= factor;
        output_B *= factor;
        output_D *= factor;
        shaderLog = vec4(1.0);
    }

    // Test debug:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    if(newFlux_RFU.x + newFlux_RFU.y + newFlux_RFU.z > 0.0)
    {
        shaderLog = vec4(0.0, 1.0, 0.0, 1.0);
    }

    if(newFlux_LBD.x + newFlux_LBD.y + newFlux_LBD.z > 0.0)
    {
        shaderLog = vec4(0.0, 0.5, 1.0, 1.0);
    }

    shaderLog = vec4(normalize(newFlux_LBD), 1.0);
    // End test debug.-------------------------------------------------------------------------------------------------------------------------------------------

    vec3 outFlux_RFU = vec3(output_R, output_F, output_U) / u_airMaxPressure;
    vec3 outFlux_LBD = vec3(output_L, output_B, output_D) / u_airMaxPressure;

    vec3 encodedOutFlux_RFU_HIGH;
    vec3 encodedOutFlux_RFU_LOW;
    vec3 encodedOutFlux_LBD_HIGH;
    vec3 encodedOutFlux_LBD_LOW;
    encodeFlux(outFlux_RFU, encodedOutFlux_RFU_HIGH, encodedOutFlux_RFU_LOW);
    encodeFlux(outFlux_LBD, encodedOutFlux_LBD_HIGH, encodedOutFlux_LBD_LOW);


    gl_FragData[0] = vec4(encodedOutFlux_RFU_HIGH, voxelSpaceValue);  // RFU flux high.

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(encodedOutFlux_RFU_LOW, voxelSpaceValue); // RFU flux low.
        gl_FragData[2] = vec4(encodedOutFlux_LBD_HIGH, voxelSpaceValue);  // LBD flux high.
        gl_FragData[3] = vec4(encodedOutFlux_LBD_LOW, voxelSpaceValue);  // LBD flux low.
        gl_FragData[4] = shaderLog;  // shader log.
    #endif

}