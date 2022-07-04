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
uniform float u_airEnvirontmentPressure;
uniform float u_maxFlux;
uniform float u_maxVelocity;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


vec3 encodeVelocity(in vec3 vel)
{
	return vel*0.5 + 0.5;
}

vec3 decodeVelocity(in vec3 encodedVel)
{
	return vec3(encodedVel * 2.0 - 1.0);
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    if(col == u_mosaicSize[0] - 1) // is last column.***
    {
        next_col = 0;
        next_row = row + 1;

        // now, check if the next_row is inside of the boundary.***
        if(next_row > u_mosaicSize[1] - 1) // is greater than last row.***
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

float getAirPressure(in vec2 texCoord, inout vec3 airPressure_RFU, inout vec3 airPressure_LBD, inout vec3 voxelSpaceType_RFU, inout vec3 voxelSpaceType_LBD)
{
    // **********************************************************************
    // Note : this function returns the airPressure of all 6 Neighbor too.***
    // **********************************************************************
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
        airPressure_RFU.x = u_airEnvirontmentPressure;

        // the voxelSpaceType is 0 (void).***
        voxelSpaceType_RFU.x = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_R:
        vec2 mosaicTexCoord_R = subTexCoord_to_texCoord(subTexCoord_R, col_int, row_int);
        airPressure_RFU.x = getAirPressure_inMosaicTexture(mosaicTexCoord_R);

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_R);
        voxelSpaceType_RFU.x = color4_RFU_HIGH.a;
    }

    // airPressure_F.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_F = subTexCoord + vec2(0.0, divSubY);
    if(subTexCoord_F.y > 1.0)
    {
        // is out of simulation boundary.***
        airPressure_RFU.y = u_airEnvirontmentPressure;

        // the voxelSpaceType is 0 (void).***
        voxelSpaceType_RFU.y = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_F:
        vec2 mosaicTexCoord_F = subTexCoord_to_texCoord(subTexCoord_F, col_int, row_int);
        airPressure_RFU.y = getAirPressure_inMosaicTexture(mosaicTexCoord_F);

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_F);
        voxelSpaceType_RFU.y = color4_RFU_HIGH.a;
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

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, newMosaicTexCoord);
        voxelSpaceType_RFU.z = color4_RFU_HIGH.a;
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
        airPressure_RFU.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);
        airPressure_RFU.z = u_airEnvirontmentPressure; // test delete.***

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord_auxMosaicTex);
        voxelSpaceType_RFU.z = color4_RFU_HIGH.a;
        
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------

    // airPressure_L.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_L = subTexCoord + vec2(-divSubX, 0.0);
    if(subTexCoord_L.x < 0.0)
    {
        // is out of simulation boundary.***
        airPressure_LBD.x = u_airEnvirontmentPressure;

        // the voxelSpaceType is 0 (void).***
        voxelSpaceType_LBD.x = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_L:
        vec2 mosaicTexCoord_L = subTexCoord_to_texCoord(subTexCoord_L, col_int, row_int);
        airPressure_LBD.x = getAirPressure_inMosaicTexture(mosaicTexCoord_L);

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_L);
        voxelSpaceType_LBD.x = color4_RFU_HIGH.a;
    }

    // airPressure_B.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_B = subTexCoord + vec2(0.0, -divSubY);
    if(subTexCoord_B.y < 0.0)
    {
        // is out of simulation boundary.***
        airPressure_LBD.y = u_airEnvirontmentPressure;

        // the voxelSpaceType is 0 (void).***
        voxelSpaceType_LBD.y = 0.0;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_B:
        vec2 mosaicTexCoord_B = subTexCoord_to_texCoord(subTexCoord_B, col_int, row_int);
        airPressure_LBD.y = getAirPressure_inMosaicTexture(mosaicTexCoord_B);

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, mosaicTexCoord_B);
        voxelSpaceType_LBD.y = color4_RFU_HIGH.a;
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

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, newMosaicTexCoord);
        voxelSpaceType_LBD.z = color4_RFU_HIGH.a;
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
        airPressure_LBD.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);
        airPressure_LBD.z = u_airEnvirontmentPressure; // test delete.***

        // Now, read flux_RFU_HIGH to calculate the voxelSpaceType.***
        vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord_auxMosaicTex);
        voxelSpaceType_LBD.z = color4_RFU_HIGH.a;
        
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------

    return airPressure_curr;
}
/*
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
        airPressure_RFU.x = u_airEnvirontmentPressure;
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
        airPressure_RFU.y = u_airEnvirontmentPressure;
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
        // Is out of simulation boundary.***
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
        airPressure_RFU.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);
        airPressure_RFU.z = u_airEnvirontmentPressure; // test delete.***
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------

    // airPressure_L.************************************************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_L = subTexCoord + vec2(-divSubX, 0.0);
    if(subTexCoord_L.x < 0.0)
    {
        // is out of simulation boundary.***
        airPressure_LBD.x = u_airEnvirontmentPressure;
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
        airPressure_LBD.y = u_airEnvirontmentPressure;
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
        airPressure_LBD.z = getAirPressure_inAuxMosaicTexture(texCoord_auxMosaicTex);
        airPressure_LBD.z = u_airEnvirontmentPressure; // test delete.***
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------

    return airPressure_curr;
}
*/

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

void getFlux_ofAll6Neighbor(in vec2 texCoord, inout vec3 flux_neighbor_R_RFU, inout vec3 flux_neighbor_R_LBD, 
                                                inout vec3 flux_neighbor_F_RFU, inout vec3 flux_neighbor_F_LBD, 
                                                inout vec3 flux_neighbor_U_RFU, inout vec3 flux_neighbor_U_LBD,

                                                inout vec3 flux_neighbor_L_RFU, inout vec3 flux_neighbor_L_LBD, 
                                                inout vec3 flux_neighbor_B_RFU, inout vec3 flux_neighbor_B_LBD, 
                                                inout vec3 flux_neighbor_D_RFU, inout vec3 flux_neighbor_D_LBD)
{
    // this function returns the flux of all 6 neighbor pixels.****
    vec2 subTexCoord;
    vec2 colRow = getColRow_and_subTexCoord(texCoord, subTexCoord);

    float col = colRow.x;
    float row = colRow.y;
    int col_int = int(col);
    int row_int = int(row);

    float divSubX = 1.0 / float(u_texSize[0]); // divX for subTexture.***
    float divSubY = 1.0 / float(u_texSize[1]); // divX for subTexture.***
    //----------------------------------------------------------------------------------

    vec3 colorZero = vec3(0.0); // original.***

    // flux_R. This is the flux of the right pixel.***********************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_R = subTexCoord + vec2(divSubX, 0.0);
    if(subTexCoord_R.x > 1.0)
    {
        // is out of simulation boundary.***
        flux_neighbor_R_RFU = colorZero;
        flux_neighbor_R_LBD = colorZero;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_R:
        vec2 mosaicTexCoord_R = subTexCoord_to_texCoord(subTexCoord_R, col_int, row_int);
        getFlux(mosaicTexCoord_R, flux_neighbor_R_RFU, flux_neighbor_R_LBD);
    }

    // flux_F. This is the flux of the front pixel.************************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_F = subTexCoord + vec2(0.0, divSubY);
    if(subTexCoord_F.y > 1.0)
    {
        // is out of simulation boundary.***
        flux_neighbor_F_RFU = colorZero;
        flux_neighbor_F_LBD = colorZero;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_F:
        vec2 mosaicTexCoord_F = subTexCoord_to_texCoord(subTexCoord_F, col_int, row_int);
        getFlux(mosaicTexCoord_F, flux_neighbor_F_RFU, flux_neighbor_F_LBD);
    }

    // flux_U. This is the flux of the up pixel.****************************************
    // To calculate the flux_U, must know the UP_subTexrure (NEXT subTexure).***
    // But, if the current subTexture is in right_up_corner, then must use the "auxMosaicTex".***
    // use the next subTexture.***
    int next_col;
    int next_row;
    if(getNextSubTextureColRow(col_int, row_int, next_col, next_row))
    {
        // must recalcuate the mosaicTexCoord.***
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, next_col, next_row);
        getFlux(newMosaicTexCoord, flux_neighbor_U_RFU, flux_neighbor_U_LBD);
    }
    else
    {
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

        // Is out of simulation boundary.***
        // Must use the "auxMosaicTex". This is a [4, 3] mosaic texture.***
        // tex_3 = next flux_RFU_HIGH. this in [col 3, row 0] into "auxMosaicTex".***
        // tex_5 = next flux_RFU_LOW. this in [col 1, row 1] into "auxMosaicTex".***
        // tex_7 = next flux_LBD_HIGH. this in [col 3, row 1] into "auxMosaicTex".***
        // tex_9 = next flux_LBD_LOW. this in [col 1, row 2] into "auxMosaicTex".***
        // Must calculate the texCoords of auxMosaicTex.***

        float sRange_aux = 1.0 / 4.0;
        float tRange_aux = 1.0 / 3.0;

        // tex_3 = next flux_RFU_HIGH.***
        float col_aux = 3.0;
        float row_aux = 0.0;

        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        vec2 texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_RFU_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);

        // tex_5 = next flux_RFU_LOW.***
        col_aux = 1.0;
        row_aux = 1.0;

        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_RFU_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);
        
        // tex_7 = next flux_LBD_HIGH.***
        col_aux = 3.0;
        row_aux = 1.0;

        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_LBD_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);

        // tex_9 = next flux_LBD_LOW.***
        col_aux = 1.0;
        row_aux = 2.0;

        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_LBD_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);

        // Now, with the 4 color4, decode the flux.***
        flux_neighbor_U_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.
        flux_neighbor_U_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.
        flux_neighbor_U_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.

        flux_neighbor_U_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.
        flux_neighbor_U_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.
        flux_neighbor_U_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------

    // flux_L. This is the flux of the left pixel**********************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_L = subTexCoord + vec2(-divSubX, 0.0);
    if(subTexCoord_L.x < 0.0)
    {
        // is out of simulation boundary.***
        flux_neighbor_L_RFU = colorZero;
        flux_neighbor_L_LBD = colorZero;
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_L:
        vec2 mosaicTexCoord_L = subTexCoord_to_texCoord(subTexCoord_L, col_int, row_int);
        getFlux(mosaicTexCoord_L, flux_neighbor_L_RFU, flux_neighbor_L_LBD);
    }

    // flux_B. This is the flux of the back pixel.********************************
    // calculate the subTexCoord to check boundary conditions.***
    vec2 subTexCoord_B = subTexCoord + vec2(0.0, -divSubY);
    if(subTexCoord_B.y < 0.0)
    {
        // is out of simulation boundary.***
        flux_neighbor_B_RFU = colorZero;
        flux_neighbor_B_LBD = colorZero;
        
    }
    else
    {
        // calculate the mosaicTexCoord of the subTexCoord_B:
        vec2 mosaicTexCoord_B = subTexCoord_to_texCoord(subTexCoord_B, col_int, row_int);
        getFlux(mosaicTexCoord_B, flux_neighbor_B_RFU, flux_neighbor_B_LBD);
    }

    // flux_D. This is the flux of the down pixel.*************************************
    // To calculate the flux_D, must know the UP_subTexrure (PREV subTexure).***
    // But, if the current subTexture is in left_down_corner, then must use the "auxMosaicTex".***
    // use the next subTexture.***
    int prev_col;
    int prev_row;
    if(getPrevSubTextureColRow(col_int, row_int, prev_col, prev_row))
    {
        // must recalcuate the mosaicTexCoord.***
        vec2 newMosaicTexCoord = subTexCoord_to_texCoord(subTexCoord, prev_col, prev_row);
        getFlux(newMosaicTexCoord, flux_neighbor_D_RFU, flux_neighbor_D_LBD);
    }
    else
    {
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

        // Is out of simulation boundary.***
        // Must use the "auxMosaicTex". This is a [4, 3] mosaic texture.***
        // tex_2 = prev flux_RFU_HIGH. this in [col 2, row 0] into "auxMosaicTex".***
        // tex_4 = prev flux_RFU_LOW. this in [col 0, row 1] into "auxMosaicTex".***
        // tex_6 = prev flux_LBD_HIGH. this in [col 2, row 1] into "auxMosaicTex".***
        // tex_8 = prev flux_LBD_LOW. this in [col 0, row 2] into "auxMosaicTex".***
        // Must calculate the texCoords of auxMosaicTex.***

        float sRange_aux = 1.0 / 4.0;
        float tRange_aux = 1.0 / 3.0;

        // tex_2 = prev flux_RFU_HIGH.***
        float col_aux = 2.0;
        float row_aux = 0.0;

        float s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        float t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        vec2 texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_RFU_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);

        // tex_4 = prev flux_RFU_LOW.***
        col_aux = 0.0;
        row_aux = 1.0;

        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_RFU_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);
        
        // tex_6 = prev flux_LBD_HIGH.***
        col_aux = 2.0;
        row_aux = 1.0;

        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_LBD_HIGH = texture2D(auxMosaicTex, texCoord_auxMosaicTex);

        // tex_8 = prev flux_LBD_LOW.***
        col_aux = 0.0;
        row_aux = 2.0;

        s = col_aux * sRange_aux + subTexCoord.x * sRange_aux;
        t = row_aux * tRange_aux + subTexCoord.y * tRange_aux;

        texCoord_auxMosaicTex = vec2(s, t);
        vec4 color4_LBD_LOW = texture2D(auxMosaicTex, texCoord_auxMosaicTex);

        // Now, with the 4 color4, decode the flux.***
        flux_neighbor_D_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.
        flux_neighbor_D_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.
        flux_neighbor_D_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.

        flux_neighbor_D_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.
        flux_neighbor_D_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.
        flux_neighbor_D_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.
    }
    //--------------------------------------------------------------------------------------------------------------
    //--------------------------------------------------------------------------------------------------------------
}

void getInputFlux(in vec2 texCoord, inout vec3 input_flux_RFU, inout vec3 input_flux_LBD)
{
    // 1rst, must find all 6 neighbor fluxes.***
    vec3 flux_neighbor_R_RFU, flux_neighbor_R_LBD;
    vec3 flux_neighbor_F_RFU, flux_neighbor_F_LBD; 
    vec3 flux_neighbor_U_RFU, flux_neighbor_U_LBD;

    vec3 flux_neighbor_L_RFU, flux_neighbor_L_LBD; 
    vec3 flux_neighbor_B_RFU, flux_neighbor_B_LBD; 
    vec3 flux_neighbor_D_RFU, flux_neighbor_D_LBD;

    getFlux_ofAll6Neighbor(texCoord, flux_neighbor_R_RFU, flux_neighbor_R_LBD, 
                                    flux_neighbor_F_RFU, flux_neighbor_F_LBD, 
                                    flux_neighbor_U_RFU, flux_neighbor_U_LBD,

                                    flux_neighbor_L_RFU, flux_neighbor_L_LBD, 
                                    flux_neighbor_B_RFU, flux_neighbor_B_LBD, 
                                    flux_neighbor_D_RFU, flux_neighbor_D_LBD);

    // Now, for each flux, take only the flux that incomes to me.***
    input_flux_LBD.x = flux_neighbor_L_RFU.x;
    input_flux_LBD.y = flux_neighbor_B_RFU.y;
    input_flux_LBD.z = flux_neighbor_D_RFU.z;

    input_flux_RFU.x = flux_neighbor_R_LBD.x;
    input_flux_RFU.y = flux_neighbor_F_LBD.y;
    input_flux_RFU.z = flux_neighbor_U_LBD.z;

}

float getVoxelSpaceValue(in vec2 texCoord)
{
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH, in alpha channel.***
    vec4 color4_RFU_HIGH = texture2D(flux_RFU_MosaicTex_HIGH, texCoord);
    return color4_RFU_HIGH.a;
}

float getAirMass_kg(in float P_Atm, in float V_m3, in float T_Kelvin)
{
    // Remembering.*************************************************************************************************************************
    // "ecuacion propagacion sonido" => https://openstax.org/books/f%C3%ADsica-universitaria-volumen-1/pages/17-2-velocidad-del-sonido
    // https://en.wikipedia.org/wiki/Density_of_air#:~:text=At%20101.325%20kPa%20(abs)%20and,International%20Standard%20Atmosphere%20(ISA).
    // P1 * V1 = P2 * V2.***
    // airDensity ro = ρ = 1.225 [kg/m3]
    // airMolarMass = 0.02897 [Kg/mol]
    // universalGasConstant R = 8.31446261815324 [J/(K*mol)], [m3*Pa/(K*mol)], [Kg*m2/(s2*K*mol)]
    // airPressure at sea level = 101325 Pa = 101.325 kPa = 1013.25 hPa ≈ 1 bar
    // Standard temperature at sea level is T = 288.15K
    // Number of Avogadro n = 6.022 * 10E23
    // Masa molar air = 29kg/kmol
    // -------------------------------------------------------------------------------------------------------------------------------------

    // P = pressure(Atm), V = volume (m3), T = temperature (K).***
    float atmToPa = 101325.0;// 1 atm = 101325 Pa.***
    float P_Pa = P_Atm * atmToPa; 
    float R = 8.31446261815324;
    float n = P_Pa * V_m3 / (R * T_Kelvin); // number of air mols.***
    float molarMassAir = 29.0; // kg/kmol.
    float airMass = n/1000.0 * molarMassAir; // kg.***
    return airMass;
}

//float getAirPressure_Atm(in float airDensity_kgm3, in float V_m3, in float T_Kelvin)
//{

//}

void main()
{
    vec2 curuv = v_tex_pos;

    // check if this is solid voxel.***
    float voxelSpaceValue = getVoxelSpaceValue(v_tex_pos);
    if(voxelSpaceValue > 0.0)
    {
        // This is solid voxel.***
        gl_FragData[0] = vec4(0.0);  // air pressure. Original.***

        #ifdef USE_MULTI_RENDER_TARGET
            gl_FragData[1] = vec4(0.0); // velocity
            gl_FragData[2] = vec4(0.0);  // shader log.
        #endif
        return;
    }

    // Determine the airPressure of the 6 fragment that is around of current fragment.***
    vec3 voxelSpaceType_RFU;
    vec3 voxelSpaceType_LBD;
    vec3 airPressure_RFU;
    vec3 airPressure_LBD;
    float airPressure_curr = getAirPressure(v_tex_pos, airPressure_RFU, airPressure_LBD, voxelSpaceType_RFU, voxelSpaceType_LBD);

    vec3 currFlux_RFU;
    vec3 currFlux_LBD;
    getFlux(v_tex_pos, currFlux_RFU, currFlux_LBD); // this is output flux.***

    // calculate the input flux.***
    vec3 input_flux_RFU, input_flux_LBD;
    getInputFlux(v_tex_pos, input_flux_RFU, input_flux_LBD);

    if(voxelSpaceType_RFU.x > 0.0)
    {
        input_flux_RFU.x = 0.0;
        currFlux_RFU.x = 0.0;
    }

    if(voxelSpaceType_RFU.y > 0.0)
    {
        input_flux_RFU.y = 0.0;
        currFlux_RFU.y = 0.0;
    }

    if(voxelSpaceType_RFU.z > 0.0)
    {
        input_flux_RFU.z = 0.0;
        currFlux_RFU.z = 0.0;
    }

    if(voxelSpaceType_LBD.x > 0.0)
    {
        input_flux_LBD.x = 0.0;
        currFlux_LBD.x = 0.0;
    }

    if(voxelSpaceType_LBD.y > 0.0)
    {
        input_flux_LBD.y = 0.0;
        currFlux_LBD.y = 0.0;
    }

    if(voxelSpaceType_LBD.z > 0.0)
    {
        input_flux_LBD.z = 0.0;
        currFlux_LBD.z = 0.0;
    }

    // Now, calculate the input pressure.***
    float voxelFaceArea = u_voxelSizeMeters.x * u_voxelSizeMeters.y;
    float cellVolume = u_voxelSizeMeters.x * u_voxelSizeMeters.y * u_voxelSizeMeters.z ;
    float timeStep_divCellArea = u_timestep / voxelFaceArea;

    // calculate the curr density & RFULBD densities, then calculate the delta_air_kg & then can calculate the new air pressure.***
    float T = 288.15; // Kelvins.***
    float P_Atm = airPressure_curr;
    float curr_airMass_kg = getAirMass_kg(P_Atm, cellVolume, T);
    float curr_ro = curr_airMass_kg / cellVolume;

    float P_Atm_R = airPressure_RFU.x;
    float airMass_kg_R = getAirMass_kg(P_Atm_R, cellVolume, T);
    float ro_R = airMass_kg_R / cellVolume;

    float P_Atm_F = airPressure_RFU.y;
    float airMass_kg_F = getAirMass_kg(P_Atm_F, cellVolume, T);
    float ro_F = airMass_kg_F / cellVolume;

    float P_Atm_U = airPressure_RFU.z;
    float airMass_kg_U = getAirMass_kg(P_Atm_U, cellVolume, T);
    float ro_U = airMass_kg_U / cellVolume;

    float P_Atm_L = airPressure_LBD.x;
    float airMass_kg_L = getAirMass_kg(P_Atm_L, cellVolume, T);
    float ro_L = airMass_kg_L / cellVolume;

    float P_Atm_B = airPressure_LBD.y;
    float airMass_kg_B = getAirMass_kg(P_Atm_B, cellVolume, T);
    float ro_B = airMass_kg_B / cellVolume;

    float P_Atm_D = airPressure_LBD.z;
    float airMass_kg_D = getAirMass_kg(P_Atm_D, cellVolume, T);
    float ro_D = airMass_kg_D / cellVolume;



    //vec3 input_air_RFU = input_flux_RFU * timeStep_divCellArea;
    //vec3 input_air_LBD = input_flux_LBD * timeStep_divCellArea;
    //vec3 output_air_RFU = currFlux_RFU * timeStep_divCellArea;
    //vec3 output_air_LBD = currFlux_LBD * timeStep_divCellArea;


    vec3 input_air_RFU = input_flux_RFU * u_timestep; // [m3]
    vec3 input_air_LBD = input_flux_LBD * u_timestep; // [m3]
    vec3 output_air_RFU = currFlux_RFU * u_timestep; // [m3]
    vec3 output_air_LBD = currFlux_LBD * u_timestep; // [m3]

    

    // calculate inputTotal & outputTotal [m3].***
    float outputTotal_air = output_air_RFU.x *curr_ro + output_air_RFU.y  *curr_ro + output_air_RFU.z  *curr_ro + output_air_LBD.x  *curr_ro + output_air_LBD.y  *curr_ro + output_air_LBD.z *curr_ro;
    float inputTotal_air = input_air_RFU.x *ro_R + input_air_RFU.y *ro_F + input_air_RFU.z *ro_U + input_air_LBD.x *ro_L + input_air_LBD.y *ro_B + input_air_LBD.z *ro_D;

    // calculate delta_air.***
    float delta_air = inputTotal_air - outputTotal_air; // [kg]

    // Now, add delta_air to current air_mass.***
    float total_air_mass = curr_airMass_kg + delta_air;

    // Now, calculate the number of Avogadro.***
    // Masa molar air = 29kg/kmol
    float air_molar_mass = 29.0; // kg/kmol
    float n = total_air_mass / air_molar_mass; // kmol.
    float R = 8.31446261815324;
    float newPressure_Pa = n*1000.0 * R * T / cellVolume; // Pa.
    float atmToPa = 101325.0;// 1 atm = 101325 Pa.***
    float newPressure_Atm = newPressure_Pa / atmToPa;

    // calculate velocity.*****************************************************************************************************************************
    // velocity = sqrt(dp/dρ).
    
    float d1 = airPressure_curr;
    //float d2 = d1 + delta_air;
    float d2 = newPressure_Atm;
    float da = (d1 + d2)/2.0;

    vec4 shaderLog = vec4(0.0);

    float vel_x = currFlux_RFU.x - currFlux_LBD.x + input_flux_LBD.x - input_flux_RFU.x;
    float vel_y = currFlux_RFU.y - currFlux_LBD.y + input_flux_LBD.y - input_flux_RFU.y;
    float vel_z = currFlux_RFU.z - currFlux_LBD.z + input_flux_LBD.z - input_flux_RFU.z;

    //vec3 velocity = vec3(vel_x, vel_y, vel_z)/2.0;
    vec3 velocity = vec3(vel_x, vel_y, vel_z);



    //vec2 veloci = vec2(inputflux.w - outputflux.w + outputflux.y - inputflux.y, inputflux.z - outputflux.z + outputflux.x - inputflux.x) / 2.0;

    if(da <= 1e-8) //
    {
        velocity = vec3(0.0);
    }
    else
    {
        ////veloci = veloci/(da * u_PipeLen);
        ////veloci = veloci/(da * vec2(cellSize_y, cellSize_x)); // original.***
        velocity = velocity / (da * u_voxelSizeMeters);
        
    }
    // End calculating velocity.-------------------------------------------------------------------------------------------------------------------------
    //float unitaryDeltaAir  = delta_air / u_airMaxPressure * 1000.0;
    //shaderLog = vec4(unitaryDeltaAir, unitaryDeltaAir, unitaryDeltaAir, 1.0);

    vec3 encodedVelocity = encodeVelocity(velocity/u_maxVelocity);
    vec4 writeVel = vec4(encodedVelocity, 1.0);

    //float airPressure = max(airPressure_curr + delta_air, 0.0); // old.***
    float airPressure = max(newPressure_Atm, 0.0);
    vec4 encodedAirPressure = packDepth(airPressure / u_airMaxPressure);

    gl_FragData[0] = encodedAirPressure;  // air pressure. Original.***

    // shaderLog.***
    if(velocity.x > u_maxVelocity || velocity.y > u_maxVelocity || velocity.z > u_maxVelocity)
    {
        shaderLog = vec4(1.0, 0.0, 0.0, 1.0);
    }
    else{
        shaderLog = vec4(0.0, 1.0, 0.0, 1.0);
    }


    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = writeVel; // velocity
        gl_FragData[2] = shaderLog;  // shader log.
    #endif

    

}