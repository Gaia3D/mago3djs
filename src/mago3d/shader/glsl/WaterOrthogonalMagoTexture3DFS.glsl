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
uniform vec2 u_quantizedVolume_MinMax;
uniform int u_texSize[3]; // The original texture3D size.***
uniform int u_lowestTex3DSliceIndex;
uniform float u_airMaxPressure; // use if rendering soundSource.***
uniform float u_currAirPressure; // use if rendering soundSource.***


varying float vDepth;
varying float vAltitude;

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

void main()
{     
    //vec2 screenPos = vec2(gl_FragCoord.x / u_texSize[0], gl_FragCoord.y / u_texSize[1]);
    
    // Now, must determine in what slice must render.***
    float onePixelSize = 1.0 / float(u_texSize[2]); // here can use u_texSize[0] or u_texSize[1] too.***
    float halfPixelSize = onePixelSize / 2.0;
    halfPixelSize = onePixelSize;

    float vDepthsAbs = abs(vDepth);

    // slice 0.***
    vec4 color = vec4(0.0);
    float slice_altitude = float(u_lowestTex3DSliceIndex) / float(u_texSize[2]);
    if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
    {
        color = packDepth(u_currAirPressure/u_airMaxPressure);
    }

    gl_FragData[0] = color;

    #ifdef USE_MULTI_RENDER_TARGET
        color = vec4(0.0);
        slice_altitude = float(u_lowestTex3DSliceIndex + 1) / float(u_texSize[2]);
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
        {
            color = packDepth(u_currAirPressure/u_airMaxPressure);
        }

        gl_FragData[1] = color; 

         color = vec4(0.0);
        slice_altitude = float(u_lowestTex3DSliceIndex + 2) / float(u_texSize[2]);
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
        {
            color = packDepth(u_currAirPressure/u_airMaxPressure);
        }

        gl_FragData[2] = color; 

         color = vec4(0.0);
        slice_altitude = float(u_lowestTex3DSliceIndex + 3) / float(u_texSize[2]);
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
        {
            color = packDepth(u_currAirPressure/u_airMaxPressure);
        }

        gl_FragData[3] = color; 

         color = vec4(0.0);
        slice_altitude = float(u_lowestTex3DSliceIndex + 4) / float(u_texSize[2]);
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
        {
            color = packDepth(u_currAirPressure/u_airMaxPressure);
        }

        gl_FragData[4] = color; 

         color = vec4(0.0);
        slice_altitude = float(u_lowestTex3DSliceIndex + 5) / float(u_texSize[2]);
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
        {
            color = packDepth(u_currAirPressure/u_airMaxPressure);
        }

        gl_FragData[5] = color; 

         color = vec4(0.0);
        slice_altitude = float(u_lowestTex3DSliceIndex + 6) / float(u_texSize[2]);
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
        {
            color = packDepth(u_currAirPressure/u_airMaxPressure);
        }

        gl_FragData[6] = color; 

         color = vec4(0.0);
        slice_altitude = float(u_lowestTex3DSliceIndex + 7) / float(u_texSize[2]);
        if(abs(slice_altitude - vDepthsAbs) < halfPixelSize)
        {
            color = packDepth(u_currAirPressure/u_airMaxPressure);
        }
        gl_FragData[7] = color; 
    #endif
}