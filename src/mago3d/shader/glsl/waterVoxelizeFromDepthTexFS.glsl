//#version 300 es

#ifdef GL_ES
    precision highp float;
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D depthTex;

uniform bool u_textureFlipYAxis;
uniform int u_texSize[3]; // The original texture3D size.***
uniform int u_mosaicTexSize[3]; // The mosaic texture size.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform int u_lowestMosaicSliceIndex;
uniform vec2 u_heightMap_MinMax; // dem of terrain (buildings included) min max heights. 
uniform vec2 u_realTex3d_minMaxAltitudes; // min max of tex3d slices altitudes.***

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

float getSliceAltitude_ofTexture3D(int col, int row, int currMosaicSliceIdx)
{
    int sliceIdx = getSliceIdx_ofTexture3D(col, row, currMosaicSliceIdx);
    //float slice_altitude = float(sliceIdx) / float(u_texSize[2]); // original.***
    float unitary_alt = float(sliceIdx) / float(u_texSize[2]);
    float slice_altitude = u_realTex3d_minMaxAltitudes.x + unitary_alt * (u_realTex3d_minMaxAltitudes.y - u_realTex3d_minMaxAltitudes.x);
    return slice_altitude;
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

void main()
{
    // By tex-coord, must know the column & row of the mosaic texture.***
    // Note : The rendering process uses a FBO with (u_mosaicTexSize[0] X u_mosaicTexSize[1]) as screen size.***
    vec2 subTexCoord;
    vec2 colRow = getColRow_and_subTexCoord(v_tex_pos, subTexCoord);

    vec4 depth;
    if(u_textureFlipYAxis)
    {
        depth = texture2D(depthTex, vec2(subTexCoord.x, 1.0 - subTexCoord.y));
    }
    else
    {
        depth = texture2D(depthTex, vec2(subTexCoord.x, subTexCoord.y));
    }

    // Now, for each slice, must determine if the "depth" value is bigger or lower than the slice altitude (the slice altitude in a range [0 to 1]).***
    float col = colRow.x;
    float row = colRow.y;
    int col_int = int(col);
    int row_int = int(row);
    // slice 0.
    // must determine the altitude of the sub-texture[col, row].
    float slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex);
    float r = col / float(u_mosaicSize[0]);
    float g = row / float(u_mosaicSize[1]);
    vec4 slice_color = vec4(0.0);

    float depthTex_altitude = u_heightMap_MinMax.x + depth.r * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);

    //if(depth.r > slice_altitude)
    if(depthTex_altitude > slice_altitude)
    {
        slice_color = vec4(0.0, 0.0, 0.0, 1.0);
    }

    gl_FragData[0] = slice_color;  

    #ifdef USE_MULTI_RENDER_TARGET
        // slice 1.
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 1);
        slice_color = vec4(0.0);
        if(depthTex_altitude > slice_altitude)
        {
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_FragData[1] = slice_color;

        // slice 2.
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 2);
        slice_color = vec4(0.0);
        if(depthTex_altitude > slice_altitude)
        {
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_FragData[2] = slice_color;

        // slice 3.
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 3);
        slice_color = vec4(0.0);
        if(depthTex_altitude > slice_altitude)
        {
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_FragData[3] = slice_color; 

        // slice 4.
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 4);
        slice_color = vec4(0.0);
        if(depthTex_altitude > slice_altitude)
        {
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_FragData[4] = slice_color;

        // slice 5.
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 5);
        slice_color = vec4(0.0);
        if(depthTex_altitude > slice_altitude)
        {
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_FragData[5] = slice_color; 

        // slice 6.
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 6);
        slice_color = vec4(0.0);
        if(depthTex_altitude > slice_altitude)
        {
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_FragData[6] = slice_color; 

        // slice 7.
        slice_altitude = getSliceAltitude_ofTexture3D(col_int, row_int, u_lowestMosaicSliceIndex + 7);
        slice_color = vec4(0.0);
        if(depthTex_altitude > slice_altitude)
        {
            slice_color = vec4(0.0, 0.0, 0.0, 1.0);
        }
        gl_FragData[7] = slice_color;
    #endif

}