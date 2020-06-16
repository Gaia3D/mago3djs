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
uniform vec4 uExternalTexCoordsArray[8]; // vec4 (minS, minT, maxS, maxT).

varying vec2 v_tex_pos;

//vec4 mixColor(sampler2D tex)
bool intersects(vec2 texCoord, vec4 extension)
{
    bool bIntersects = true;
    float minS = extension.x;
    float minT = extension.y;
    float maxS = extension.z;
    float maxT = extension.w;

    if(texCoord.x < minS || texCoord.x > maxS)
    return false;
    else if(texCoord.y < minT || texCoord.y > maxT)
    return false;

    return bIntersects;
}

void getTextureColor(in int activeNumber, in vec4 currColor4, in vec2 texCoord,  inout bool victory, in float externalAlpha, inout vec4 resultTextureColor)
{
    if(activeNumber == 1)
    {
        if(currColor4.w > 0.0 && externalAlpha > 0.0)
        {
            if(victory)
            {
                resultTextureColor = mix(resultTextureColor, currColor4, currColor4.w*externalAlpha);
            }
            else{
                currColor4.w *= externalAlpha;
                resultTextureColor = currColor4;
            }
            
            victory = true;
        }
    }
    else if(activeNumber == 2)
    {
        // custom image.
        // Check uExternalTexCoordsArray.
        
    }
}

void main()
{           
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);

    // Take the base color.
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);
    bool victory = false;

    if(uActiveTextures[0] > 0)
        getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], textureColor);
    if(uActiveTextures[1] > 0)
        getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], textureColor);
    if(uActiveTextures[2] > 0)
        getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], textureColor);
    if(uActiveTextures[3] > 0)
        getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], textureColor);
    if(uActiveTextures[4] > 0)
        getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], textureColor);
    if(uActiveTextures[5] > 0)
        getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], textureColor);
    if(uActiveTextures[6] > 0)
        getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], textureColor);
    if(uActiveTextures[7] > 0)
        getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], textureColor);
    
    if(!victory)
    discard;
    
    gl_FragColor = textureColor;
	
}