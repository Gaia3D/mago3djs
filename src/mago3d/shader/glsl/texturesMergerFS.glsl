#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D texture_0;  
uniform sampler2D texture_1;
uniform sampler2D texture_2;
uniform sampler2D texture_3;
uniform sampler2D texture_4;
uniform sampler2D texture_5;
uniform sampler2D texture_6;
uniform sampler2D texture_7;

uniform float externalAlphasArray[8];
uniform int uActiveTextures[8];

varying vec2 v_tex_pos;

//vec4 mixColor(sampler2D tex)

void main()
{           
    vec2 texCoord = v_tex_pos;

    // Take the base color.
    vec4 textureColor = texture2D(texture_0, texCoord);
    vec4 currColor4;
    float externalAlpha;
    
    if(uActiveTextures[1] == 1)
    {
        currColor4 = texture2D(texture_1, texCoord);
        externalAlpha = externalAlphasArray[1];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
        }
    }
    
    if(uActiveTextures[2] == 1)
    {
        currColor4 = texture2D(texture_2, texCoord);
        externalAlpha = externalAlphasArray[2];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
        }
    }

    if(uActiveTextures[3] == 1)
    {
        currColor4 = texture2D(texture_3, texCoord);
        externalAlpha = externalAlphasArray[3];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
        }
    }

    if(uActiveTextures[4] == 1)
    {
        currColor4 = texture2D(texture_4, texCoord);
        externalAlpha = externalAlphasArray[4];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
        }
    }

    if(uActiveTextures[5] == 1)
    {
        currColor4 = texture2D(texture_5, texCoord);
        externalAlpha = externalAlphasArray[5];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
        }
    }

    if(uActiveTextures[6] == 1)
    {
        currColor4 = texture2D(texture_6, texCoord);
        externalAlpha = externalAlphasArray[6];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
        }
    }

    if(uActiveTextures[7] == 1)
    {
        currColor4 = texture2D(texture_7, texCoord);
        externalAlpha = externalAlphasArray[7];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
        }
    }
    
    gl_FragColor = textureColor;
	
}