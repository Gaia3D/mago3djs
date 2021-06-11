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

//******************************************
// u_processType = 0 -> overWriteDEM.
// u_processType = 1 -> excavation.
uniform int u_processType;
//------------------------------------------


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

float getTerrainHeight(in vec2 texCoord)
{
    float terainHeight = texture2D(currDEMTex, texCoord).r;
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);
    return terainHeight;
}

void main()
{     
    vec2 screenPos = vec2(gl_FragCoord.x / u_simulationTextureSize.x, gl_FragCoord.y / u_simulationTextureSize.y);

    // read the currentDEM depth.
    float curTerrainHeght = texture2D(currDEMTex, screenPos).r;
    float newTerrainHeght = ((vAltitude - u_heightMap_MinMax.x)/(u_heightMap_MinMax.y - u_heightMap_MinMax.x));

    //******************************************
    // u_processType = 0 -> overWriteDEM.
    // u_processType = 1 -> excavation.
    //------------------------------------------

    if(u_processType == 0)
    {
        // if u_processType = 0 -> overWriteDEM.
        if(newTerrainHeght < curTerrainHeght)
        {
            discard;
        }
    }
    else if(u_processType == 1)
    {
        // if u_processType = 1 -> excavation.
        // in this process, the meshses must be rendered in frontFace = CW.***
        if(newTerrainHeght > curTerrainHeght)
        {
            discard;
        }
    }
    
    vec4 depthColor4 = vec4(newTerrainHeght, newTerrainHeght, newTerrainHeght, 1.0);
    gl_FragData[0] = depthColor4;

    vec4 shaderLogColor4 = vec4(0.0);
    if(vAltitude < u_heightMap_MinMax.x)
    {
        shaderLogColor4 = vec4(0.0, 1.0, 0.0, 1.0);
    }

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = shaderLogColor4; // depth
        gl_FragData[2] = shaderLogColor4; // normal
        gl_FragData[3] = vec4(1.0); // albedo
        gl_FragData[4] = vec4(1.0); // selection color
    #endif
}