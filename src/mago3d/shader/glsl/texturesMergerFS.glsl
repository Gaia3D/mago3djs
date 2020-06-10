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
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);

    // Take the base color.
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 currColor4 = vec4(0.0, 0.0, 0.0, 0.0);
    float externalAlpha;
    bool victory = false;
    if(uActiveTextures[0] == 1)
    {
        currColor4 = texture2D(texture_0, texCoord);
        externalAlpha = externalAlphasArray[0];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            
            victory = true;
        }
    }
    
    if(uActiveTextures[1] == 1)
    {
        currColor4 = texture2D(texture_1, texCoord);
        externalAlpha = externalAlphasArray[1];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
             if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            victory = true;
        }
    }
    
    if(uActiveTextures[2] == 1)
    {
        currColor4 = texture2D(texture_2, texCoord);
        externalAlpha = externalAlphasArray[2];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
             if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            victory = true;
        }
    }

    if(uActiveTextures[3] == 1)
    {
        currColor4 = texture2D(texture_3, texCoord);
        externalAlpha = externalAlphasArray[3];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
             if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            victory = true;
        }
    }

    if(uActiveTextures[4] == 1)
    {
        currColor4 = texture2D(texture_4, texCoord);
        externalAlpha = externalAlphasArray[4];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
             if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            victory = true;
        }
    }

    if(uActiveTextures[5] == 1)
    {
        currColor4 = texture2D(texture_5, texCoord);
        externalAlpha = externalAlphasArray[5];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
             if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            victory = true;
        }
    }

    if(uActiveTextures[6] == 1)
    {
        currColor4 = texture2D(texture_6, texCoord);
        externalAlpha = externalAlphasArray[6];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
             if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            victory = true;
        }
    }

    if(uActiveTextures[7] == 1)
    {
        currColor4 = texture2D(texture_7, texCoord);
        externalAlpha = externalAlphasArray[7];
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
             if(victory)
            {
                textureColor = mix(textureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                textureColor = currColor4;
            }
            victory = true;
        }
    }
    if(!victory)
    discard;
    
    gl_FragColor = textureColor;
	
}