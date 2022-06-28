#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D texture_0;  
uniform samplerCube texture_cube;

uniform int uTextureType;

varying vec2 v_tex_pos;
varying vec3 v_normal; // use for cubeMap.

int faceIndex(in vec2 texCoord)
{
    int faceIndex = -1;

    float tx = texCoord.x;
    float ty = texCoord.y;

    if(tx >= 0.0 && tx < 0.25)
    {
        if(ty >= 0.0 && ty < 1.0/3.0)
        {
            // is no cubeMap zone.
        }
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)
        {
            faceIndex = 1;
        }
        else if(ty >= 2.0/3.0)
        {
            // is no cubeMap zone.
        }
    }
    else if(tx >= 0.25 && tx < 0.5)
    {
        if(ty >= 0.0 && ty < 1.0/3.0)
        {
            faceIndex = 3;
        }
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)
        {
            faceIndex = 4;
        }
        else if(ty >= 2.0/3.0)
        {
            faceIndex = 2;
        }
    }
    else if(tx >= 0.5 && tx < 0.75)
    {
        if(ty >= 0.0 && ty < 1.0/3.0)
        {
            // is no cubeMap zone.
        }
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)
        {
            faceIndex = 0;
        }
        else if(ty >= 2.0/3.0)
        {
            // is no cubeMap zone.
        }
    }
    else if(tx >= 0.75)
    {
        if(ty >= 0.0 && ty < 1.0/3.0)
        {
            // is no cubeMap zone.
        }
        else if(ty >= 1.0/3.0 && ty < 2.0/3.0)
        {
            faceIndex = 5;
        }
        else if(ty >= 2.0/3.0)
        {
            // is no cubeMap zone.
        }
    }

    return faceIndex;
}

bool cubeMapNormal(in vec2 texCoord, inout vec3 normal)
{
    int faceIdx = faceIndex(texCoord);

    if(faceIdx == -1)
    {
        return false;
    }

    bool isCubeMapZone = true;

    // convert range 0 to 1 to -1 to 1
    float uc = 2.0 * texCoord.x - 1.0;
    float vc = 2.0 * texCoord.y - 1.0;
    float x, y, z;

    if(faceIdx == 0)
    { 
        x =  1.0; 
        y =   vc; 
        z =  -uc; // POSITIVE X
    }
    else if(faceIdx == 1)
    {
        x = -1.0; 
        y =   vc; 
        z =   uc; // NEGATIVE X
    }
    else if(faceIdx == 2)
    {
        x =   uc; 
        y =  1.0; 
        z =  -vc; // POSITIVE Y
    }
    else if(faceIdx == 3)
    {
        x =   uc; 
        y = -1.0; 
        z =   vc; // NEGATIVE Y
    }
    else if(faceIdx == 4)
    {
        x =   uc; 
        y =   vc; 
        z =  1.0; // POSITIVE Z
    }
    else if(faceIdx == 5)
    {
        x =  -uc; 
        y =   vc; 
        z = -1.0; // NEGATIVE Z
    }
    
    normal = vec3(x, y, z);
    return isCubeMapZone;
}

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
} 

vec3 decodeVelocity(in vec3 encodedVel)
{
	return vec3(encodedVel * 2.0 - 1.0);
}

void main()
{           
    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y); // original.

    // Take the base color.
    vec4 textureColor = vec4(1.0,1.0,1.0, 0.0);
    if(uTextureType == 0)
    {
        textureColor = texture2D(texture_0, texCoord);

        // Test debug:
        //if(textureColor.r > 0.0 || textureColor.g > 0.0)
        //{
        //    textureColor = vec4(1.0, 1.0, 0.5, 1.0);
        //}
    }
    else if(uTextureType == 1)
    {
        // CUBE_TEXTURE.***
        // To see the value of 4byte encoded color4.***
        textureColor = textureCube(texture_cube, v_normal);
        float linearDepth = unpackDepth(textureColor); // original.
        textureColor = vec4(linearDepth, linearDepth, linearDepth, 1.0);
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
    
    gl_FragColor = textureColor;
	
}