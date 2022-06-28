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

uniform sampler2D currDEMTex;

uniform vec2 u_heightMap_MinMax; // terrain min max heights. 
uniform vec2 u_simulationTextureSize; // for example 512 x 512.
uniform vec3 u_quantizedVolume_MinMax[2]; // the minimum is [0,0,0], and the maximum is [1,1,1].***
uniform int u_terrainHeightEncodingBytes;


varying float vDepth;
varying float vAltitude;
varying vec3 vNormal3;
varying vec4 glPos;

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



void main()
{     
    vec2 screenPos = vec2(gl_FragCoord.x / u_simulationTextureSize.x, gl_FragCoord.y / u_simulationTextureSize.y);

    // Check if the current fragment is inside of the u_quantizedVolume_MinMax.***
    vec3 quantizedVolumeMin = u_quantizedVolume_MinMax[0];
    vec3 quantizedVolumeMax = u_quantizedVolume_MinMax[1];
    vec3 quantizedPos = glPos.xyz * 0.5 + 0.5;
    
    if(quantizedPos.x < quantizedVolumeMin.x || quantizedPos.x > quantizedVolumeMax.x)
    {
        discard;
    }
    else if(quantizedPos.y < quantizedVolumeMin.y || quantizedPos.y > quantizedVolumeMax.y)
    {
        discard;
    }
    else if(quantizedPos.z < quantizedVolumeMin.z || quantizedPos.z > quantizedVolumeMax.z)
    {
        discard;
    }

    // Calculate the zDepth ranges for each MRT texture.***
    // Note : consider that there are 8 output textures.***
    float zDepthRangeTotal = quantizedVolumeMax.z - quantizedVolumeMin.z;
    float zDepthOneSlice = zDepthRangeTotal / 8.0;
    vec4 zeroColor4 = vec4(0.0);
    vec4 solidColor4 = vec4(1.0, 1.0, 1.0, 1.0);

    float qPosZ = quantizedPos.z;
    solidColor4 = vec4(qPosZ, qPosZ, qPosZ, 1.0);

    float factor = 0.6;

    // Now, for each output texture, calculate if intersects the quantizedPos.***
    // gl_FragData[0] - is the nearest slice.***
    gl_FragData[0] = zeroColor4;
    float slice_minZ = quantizedVolumeMin.z;
    float slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice;
    slice_minZ -= zDepthOneSlice * factor;
    slice_maxZ += zDepthOneSlice * factor;
    if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
    {
        // the current fragment intersects.***
        gl_FragData[0] = solidColor4;
    }

    #ifdef USE_MULTI_RENDER_TARGET
        // gl_FragData[1] - is the 2nd nearest slice.***
        gl_FragData[1] = zeroColor4; 
        
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice;
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice * 2.0;
        slice_minZ -= zDepthOneSlice * factor;
        slice_maxZ += zDepthOneSlice * factor;
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
        {
            // the current fragment intersects.***
            gl_FragData[1] = solidColor4;
        }

        // gl_FragData[2].***
        gl_FragData[2] = zeroColor4; 
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*2.0;
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*3.0;
        slice_minZ -= zDepthOneSlice * factor;
        slice_maxZ += zDepthOneSlice * factor;
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
        {
            // the current fragment intersects.***
            gl_FragData[2] = solidColor4;
        }

        // gl_FragData[3].***
        gl_FragData[3] = zeroColor4; 
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*3.0;
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*4.0;
        slice_minZ -= zDepthOneSlice * factor;
        slice_maxZ += zDepthOneSlice * factor;
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
        {
            // the current fragment intersects.***
            gl_FragData[3] = solidColor4;
        }

        // gl_FragData[4].***
        gl_FragData[4] = zeroColor4; 
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*4.0;
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*5.0;
        slice_minZ -= zDepthOneSlice * factor;
        slice_maxZ += zDepthOneSlice * factor;
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
        {
            // the current fragment intersects.***
            gl_FragData[4] = solidColor4;
        }

        // gl_FragData[5].***
        gl_FragData[5] = zeroColor4; 
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*5.0;
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*6.0;
        slice_minZ -= zDepthOneSlice * factor;
        slice_maxZ += zDepthOneSlice * factor;
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
        {
            // the current fragment intersects.***
            gl_FragData[5] = solidColor4;
        }

        // gl_FragData[6].***
        gl_FragData[6] = zeroColor4; 
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*6.0;
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*7.0;
        slice_minZ -= zDepthOneSlice * factor;
        slice_maxZ += zDepthOneSlice * factor;
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
        {
            // the current fragment intersects.***
            gl_FragData[6] = solidColor4;
        }

        // gl_FragData[7] - is the farest slice.***
        gl_FragData[7] = zeroColor4; 
        slice_minZ = quantizedVolumeMin.z + zDepthOneSlice*7.0;
        slice_maxZ = quantizedVolumeMin.z + zDepthOneSlice*8.0;
        slice_minZ -= zDepthOneSlice * factor;
        slice_maxZ += zDepthOneSlice * factor;
        if(qPosZ >= slice_minZ && qPosZ < slice_maxZ)
        {
            // the current fragment intersects.***
            gl_FragData[7] = solidColor4;
        }

 
    #endif
}