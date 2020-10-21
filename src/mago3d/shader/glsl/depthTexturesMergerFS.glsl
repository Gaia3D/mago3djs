#ifdef GL_ES
    precision highp float;
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D depthTexture_0;  
uniform sampler2D normalTexture_0;
uniform sampler2D depthTexture_1;  
uniform sampler2D normalTexture_1;
uniform sampler2D depthTexture_2;  
uniform sampler2D normalTexture_2;
uniform sampler2D depthTexture_3;  
uniform sampler2D normalTexture_3;

uniform int uNumFrustums;

varying vec2 v_tex_pos;

float getMinValue(float a, float b, float c)
{
    float x = min(a, b);
    return min(x, c);
}

float getMaxValue(float a, float b, float c)
{
    float x = max(a, b);
    return max(x, c);
}

bool isNan(float val)
{
  return (val <= 0.0 || 0.0 <= val) ? false : true;
}

vec4 getDepth(in int frustumIdx, in vec2 texCoord)
{
    vec4 color4;

    if(frustumIdx == 0)
    {
        color4 = texture2D(depthTexture_0, texCoord);
    }
    else if(frustumIdx == 1)
    {
        color4 = texture2D(depthTexture_1, texCoord);
    }
    else if(frustumIdx == 2)
    {
        color4 = texture2D(depthTexture_2, texCoord);
    }
    else if(frustumIdx == 3)
    {
        color4 = texture2D(depthTexture_3, texCoord);
    }

    return color4;
}

vec4 getNormal(in int frustumIdx, in vec2 texCoord)
{
    vec4 color4;

    if(frustumIdx == 0)
    {
        color4 = texture2D(normalTexture_0, texCoord);
    }
    else if(frustumIdx == 1)
    {
        color4 = texture2D(normalTexture_1, texCoord);
    }
    else if(frustumIdx == 2)
    {
        color4 = texture2D(normalTexture_2, texCoord);
    }
    else if(frustumIdx == 3)
    {
        color4 = texture2D(normalTexture_3, texCoord);
    }

    return color4;
}

void main()
{           
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);

    // Take the base color.
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 normalColor = vec4(0.0, 0.0, 0.0, 1.0);
    bool isValid = false;

    for(int i=0; i<4; i++)
    {
        if(i < uNumFrustums)
        {
            vec4 normal4 = getNormal(i, texCoord);
            
            // check the depth value.***
            if((abs(normal4.x) + abs(normal4.y) + abs(normal4.z)) > 0.1)
            {
                // is valid depth value.***
                vec4 depthColor4 = getDepth(i, texCoord);

                textureColor = depthColor4;
                normalColor = normal4;
                isValid = true;
                break;
            }
        }
    }

    if(!isValid)
    {
        gl_FragData[1] = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    //discard;

    
    gl_FragData[0] = textureColor;

    #ifdef USE_MULTI_RENDER_TARGET
    gl_FragData[1] = normalColor;
    #endif
	
}