//#version 300 es

#ifdef GL_ES
    precision highp float;
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D currentSceneVoxelizedMosaicTex;
uniform sampler2D partialYDirectionMosaicTex;

//uniform bool u_textureFlipYAxis;
uniform int u_texSize[3]; // The original texture3D size.***
//uniform int u_mosaicTexSize[3]; // The mosaic texture size.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform int u_lowestMosaicSliceIndex;

// vars for partialYDirectionMosaicTex:
uniform int u_lowestYDirMosaicSliceIndex;
uniform int u_yDirMosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform int u_yDirTextureSize[3]; // The real 3D texture size.***

varying vec2 v_tex_pos;

	//       Sample of a slice of the mosaic texture.***
	//
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_15  |   tex_16  |   tex_17  |   tex_18  |   tex_19  |      row 3  
	//      |           |           |           |           |           |     
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_10  |   tex_11  |   tex_12  |   tex_13  |   tex_14  |      row 2   
	//      |           |           |           |           |           |     
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_5   |   tex_6   |   tex_7   |   tex_8   |   tex_9   |      row 1    
	//      |           |           |           |           |           |     
	//      +-----------+-----------+-----------+-----------+-----------+
	//      |           |           |           |           |           |           
	//      |   tex_0   |   tex_1   |   tex_2   |   tex_3   |   tex_4   |      row 0     
	//      |           |           |           |           |           |  
	//      +-----------+-----------+-----------+-----------+-----------+   
    //
    //          col 0       col 1       col 2       col 3       col 4
int getSliceIdx_ofTexture3D(int col, int row, int currMosaicSliceIdx)
{
    int subTexCount_inAMosaicSlice = u_mosaicSize[0] * u_mosaicSize[1]; // total textures count in a mosaic slice.***
    int currentSlicesAmount = (row * u_mosaicSize[0]) + col; // the textures count under the texture[col, row] in a mosaic slice.***
    int tex3DSliceIdx = subTexCount_inAMosaicSlice * currMosaicSliceIdx + currentSlicesAmount;

    return tex3DSliceIdx;
}

vec2 getColRow_and_subTexCoord(in vec2 texCoord, inout vec2 subTexCoord)
{
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
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

vec2 getColRow_ofSliceIdx(in int sliceIdx, in int mosaicColsCount)
{
    // Given a sliceIdx, mosaicColumnsCount & mosaicRowsCount, this function returns the column & row of the sliceIdx.***
    float row = floor(float(sliceIdx)/float(mosaicColsCount));
    //float col = mod(float(sliceIdx), float(mosaicColsCount)); // mod = float(sliceIdx) - float(mosaicColsCount) * row;
    float col = float(sliceIdx) - float(mosaicColsCount) * row;
    vec2 colRow = vec2(col, row);
    return colRow;
}

 float getVoxelSpaceValue(in vec2 texCoord)
{
    // The scene voxelMatrix is into flux_RFU_MosaicTex_HIGH(here named currentSceneVoxelizedMosaicTex), in alpha channel.***
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, texCoord);
    return color4_RFU_HIGH.a;
}

vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row, in int mosaicNumCols, in int mosaicNumRows)
{
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    float sRange = 1.0 / float(mosaicNumCols);
    float tRange = 1.0 / float(mosaicNumRows);

    float s = float(col) * sRange + subTexCoord.x * sRange;
    float t = float(row) * tRange + subTexCoord.y * tRange;

    vec2 resultTexCoord = vec2(s, t);
    return resultTexCoord;
}

void main()
{
    // Note : this shader only can have one output. Is not possible MRT.***
    //-------------------------------------------------------------------------

    // 1rst, check if the current voxel is solid or not.
    // If the current voxel is solid, then write "solid" and return. No need calculate anything.***
    vec4 color4_RFU_HIGH = texture2D(currentSceneVoxelizedMosaicTex, v_tex_pos); 
    if(color4_RFU_HIGH.a > 0.0)
    {
        gl_FragData[0] = color4_RFU_HIGH;  
        return;
    }

    // By tex-coord, must know the column & row of the mosaic texture.***
    // Note : The rendering process uses a FBO with (u_mosaicTexSize[0] X u_mosaicTexSize[1]) as screen size.***
    vec2 subTexCoord;
    vec2 colRow = getColRow_and_subTexCoord(v_tex_pos, subTexCoord); // here returns the subTexCoords too.***
    float col = colRow.x;
    float row = colRow.y;
    int col_int = int(col);
    int row_int = int(row);

    // Now, with "colRow" & "u_lowestMosaicSliceIndex" determine the sliceIdx of the real3dTexture.***
    int sliceIdx = getSliceIdx_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex);

    // Now, with "subTexCoord" & "sliceIdx" calculate the textureIdx of "partialYDirectionMosaicTex" & the texCoords of it.***
    // With subTexCoord.y we can determine the partialYDirectionMosaicTex_sliceIdx.***
    int yDirSliceIdx = int(subTexCoord.y * float(u_texSize[1])); // the absolute yDirSliceIdx. There are "u_texSize[1]" yDirSlices count in total, but we only have 8 yDirSlices in a mosaic.***

    vec4 finalColor4 = vec4(color4_RFU_HIGH.r, color4_RFU_HIGH.g, color4_RFU_HIGH.b, color4_RFU_HIGH.a);

    // Now, check if "yDirSliceIdx" is inside of the 8 YDirTextures availables.***
    
    if(yDirSliceIdx < u_lowestYDirMosaicSliceIndex || yDirSliceIdx > u_lowestYDirMosaicSliceIndex + 7)
    {
        gl_FragData[0] = color4_RFU_HIGH;    
        return;
    } 

    int currYDirSliceIdx = yDirSliceIdx - u_lowestYDirMosaicSliceIndex;


    // Now determine the col & row of the yDirMosaicTexture.***
    vec2 colRow_yDirMosaic = getColRow_ofSliceIdx(currYDirSliceIdx, u_yDirMosaicSize[0]);

    // Now, calculate the subTexCoordYDir (texCoord in realTex3D).***
    // Note : u_texSize[2] must to be = u_yDirTextureSize[1];
    vec2 subTexCoordYDir = vec2(subTexCoord.x, float(sliceIdx)/float(u_yDirTextureSize[1]));

    // Now, calculate the texCoordYDirMosaic.***
    int col_yDirMosaic = int(floor(colRow_yDirMosaic.x));
    int row_yDirMosaic = int(floor(colRow_yDirMosaic.y));

    vec2 texCoordYDirMosaic = subTexCoord_to_texCoord(subTexCoordYDir, col_yDirMosaic, row_yDirMosaic, u_yDirMosaicSize[0], u_yDirMosaicSize[1]);

    // Now, read the value:
    vec4 color4_yDirTex = texture2D(partialYDirectionMosaicTex, texCoordYDirMosaic); 

    if(finalColor4.a < color4_yDirTex.a)
    {
        finalColor4.a = color4_yDirTex.a;
    }

    gl_FragData[0] = finalColor4;  

}