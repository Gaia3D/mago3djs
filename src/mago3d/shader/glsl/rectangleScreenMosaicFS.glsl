#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D texture_0;  // HIGH_A
uniform sampler2D texture_1;  // LOW_A
uniform sampler2D texture_2;  // HIGH_B
uniform sampler2D texture_3;  // LOW_B

uniform int uTextureType;
uniform int uSliceIdx; // the slice idx that to be render.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform float u_maxFlux;

varying vec2 v_tex_pos;
varying vec3 v_normal; // use for cubeMap.



float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
} 

vec3 decodeVelocity(in vec3 encodedVel)
{
	return vec3(encodedVel * 2.0 - 1.0);
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

float decodeRG(in vec2 waterColorRG)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));
}

void getFlux(in vec2 texCoord, inout vec3 flux_RFU, inout vec3 flux_LBD)
{
    // This function returns Outing flux.***
    vec4 color4_RFU_HIGH = texture2D(texture_0, texCoord);
    vec4 color4_RFU_LOW = texture2D(texture_1, texCoord);
    vec4 color4_LBD_HIGH = texture2D(texture_2, texCoord);
    vec4 color4_LBD_LOW = texture2D(texture_3, texCoord);

    // now, decode all fluxes.***
    flux_RFU.r = decodeRG(vec2(color4_RFU_HIGH.r, color4_RFU_LOW.r)) * u_maxFlux; // flux_R.
    flux_RFU.g = decodeRG(vec2(color4_RFU_HIGH.g, color4_RFU_LOW.g)) * u_maxFlux; // flux_F.
    flux_RFU.b = decodeRG(vec2(color4_RFU_HIGH.b, color4_RFU_LOW.b)) * u_maxFlux; // flux_U.

    flux_LBD.r = decodeRG(vec2(color4_LBD_HIGH.r, color4_LBD_LOW.r)) * u_maxFlux; // flux_L.
    flux_LBD.g = decodeRG(vec2(color4_LBD_HIGH.g, color4_LBD_LOW.g)) * u_maxFlux; // flux_B.
    flux_LBD.b = decodeRG(vec2(color4_LBD_HIGH.b, color4_LBD_LOW.b)) * u_maxFlux; // flux_D.
}

void main()
{           
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y); // original.

    // now, find the col & row of the mosaic.***
    vec2 colRow = getColRow_ofSliceIdx(uSliceIdx, u_mosaicSize[0]);
    int col = int(colRow.x);
    int row = int(colRow.y);


    // now, calculate the texCoord of the mosaic.***
    vec2 texCoordMosaic = subTexCoord_to_texCoord(texCoord, col, row, u_mosaicSize[0], u_mosaicSize[1]);

    // reassign the texCoord.***
    texCoord = vec2(texCoordMosaic.x, texCoordMosaic.y);

    // Take the base color.
    vec4 textureColor = vec4(1.0, 1.0, 1.0, 0.0);
    if(uTextureType == 0)
    {
        textureColor = texture2D(texture_0, texCoord);
    }
    else if(uTextureType == 1)
    {
        // Encoded in 2 textures.***
        vec3 flux_RFU;
        vec3 flux_LBD;
        getFlux(texCoord, flux_RFU, flux_LBD);

        // Now, calculate the total flux for each axis.***
        //textureColor = vec4(flux_RFU.x - flux_LBD.x, flux_RFU.y - flux_LBD.y, flux_RFU.z - flux_LBD.z, 1.0);
        textureColor = vec4(flux_RFU, 1.0);
        //textureColor = vec4(flux_LBD, 1.0);

    }
    else if(uTextureType == 2)
    {
        // To see only alpha component.***
        vec4 textureColorAux = texture2D(texture_0, texCoord);
        textureColor = vec4(textureColorAux.a, 0.0, 0.0, textureColorAux.a);
    }
    else if(uTextureType == 3)
    {
        // Test debug:
        vec4 textureColorAux = texture2D(texture_0, texCoord);
        if(textureColorAux.r + textureColorAux.g + textureColorAux.b > 0.0)
        {
            textureColor = vec4(0.2, 0.5, 1.0, 1.0);
        }
        else
        {
            textureColor = textureColorAux;
        }
    }
    else if(uTextureType == 4)
    {
        // To see the value of 4byte encoded color4.***
        textureColor = texture2D(texture_0, texCoord);
        float linearDepth = unpackDepth(textureColor); // original.
        textureColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);
    }
    else if(uTextureType == 5)
    {
        // To see velocity.***
        textureColor = texture2D(texture_0, texCoord);
        vec3 vel = decodeVelocity(textureColor.rgb);
        vec3 normalizedVel = normalize(vel);
        textureColor = vec4(normalizedVel.rgb, 1.0);
    }
    else if(uTextureType == 6)
    {
        // To see normalized.***
        textureColor = texture2D(texture_0, texCoord);
        vec3 normalizedVel = normalize(textureColor.rgb);
        textureColor = vec4(normalizedVel.rgb, 1.0);
    }
    
    gl_FragColor = textureColor;
	
}