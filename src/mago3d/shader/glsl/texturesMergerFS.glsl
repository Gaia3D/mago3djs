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
uniform vec2 uMinMaxAltitudes; // used for altitudes textures as bathymetry.
//uniform vec2 uMinMaxAltitudesBathymetryToGradient; // used for altitudes textures as bathymetry.

// gradient white-blue vars.***
uniform float uGradientSteps[16];
uniform int uGradientStepsCount;

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

vec3 RGBtoHSV(vec3 color)
{
    // https://stackoverflow.com/questions/13806483/increase-or-decrease-color-saturation
    float r,g,b,h,s,v;
    r= color.r;
    g= color.g;
    b= color.b;
    float minVal = getMinValue( r, g, b );
    float maxVal = getMaxValue( r, g, b );

    v = maxVal;
    float delta = maxVal - minVal;
    if( maxVal != 0.0 )
        s = delta / maxVal;        // s
    else {
        // r = g = b = 0        // s = 0, v is undefined
        s = 0.0;
        h = -1.0;
        return vec3(h, s, 0.0);
    }
    if( r == maxVal )
        h = ( g - b ) / delta;      // between yellow & magenta
    else if( g == maxVal )
        h = 2.0 + ( b - r ) / delta;  // between cyan & yellow
    else
        h = 4.0 + ( r - g ) / delta;  // between magenta & cyan
    h *= 60.0;                // degrees
    if( h < 0.0 )
        h += 360.0;
    if ( isNan(h) )
        h = 0.0;
    return vec3(h,s,v);
}

vec3 HSVtoRGB(vec3 color)
{
    int i;
    float h,s,v,r,g,b;
    h= color.r;
    s= color.g;
    v= color.b;
    if(s == 0.0 ) {
        // achromatic (grey)
        r = g = b = v;
        return vec3(r,g,b);
    }
    h /= 60.0;            // sector 0 to 5
    i = int(floor( h ));
    float f = h - float(i);          // factorial part of h
    float p = v * ( 1.0 - s );
    float q = v * ( 1.0 - s * f );
    float t = v * ( 1.0 - s * ( 1.0 - f ) );
    if( i == 0 ) 
    {
        r = v;
        g = t;
        b = p;
    }
    else if(i == 1)
    {
        r = q;
        g = v;
        b = p;
    }
    else if(i == 2)
    {
        r = p;
        g = v;
        b = t;
    }
    else if(i == 3)
    {
        r = p;
        g = q;
        b = v;
    }
    else if(i == 4)
    {
        r = t;
        g = p;
        b = v;
    }
    else
    {       // case 5:
        r = v;
        g = p;
        b = q;
    }
    return vec3(r,g,b);
}

vec3 getSaturatedColor(vec3 color, float saturation)
{
    vec3 hsv = RGBtoHSV(color);
    hsv.y *= saturation;
    return HSVtoRGB(hsv);
}

vec3 getRainbowColor_byHeight(float height, float minHeight, float maxHeight)
{
	float minHeight_rainbow = minHeight;
	float maxHeight_rainbow = maxHeight;
	
	float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }
	
	float r, g, b;
	
	if(gray < 0.16666)
	{
		b = 0.0;
		g = gray*6.0;
		r = 1.0;
	}
	else if(gray >= 0.16666 && gray < 0.33333)
	{
		b = 0.0;
		g = 1.0;
		r = 2.0 - gray*6.0;
	}
	else if(gray >= 0.33333 && gray < 0.5)
	{
		b = -2.0 + gray*6.0;
		g = 1.0;
		r = 0.0;
	}
	else if(gray >= 0.5 && gray < 0.66666)
	{
		b = 1.0;
		g = 4.0 - gray*6.0;
		r = 0.0;
	}
	else if(gray >= 0.66666 && gray < 0.83333)
	{
		b = 1.0;
		g = 0.0;
		r = -4.0 + gray*6.0;
	}
	else if(gray >= 0.83333)
	{
		b = 6.0 - gray*6.0;
		g = 0.0;
		r = 1.0;
	}
	
	float aux = r;
	r = b;
	b = aux;
	
	//b = -gray + 1.0;
	//if (gray > 0.5)
	//{
	//	g = -gray*2.0 + 2.0; 
	//}
	//else 
	//{
	//	g = gray*2.0;
	//}
	//r = gray;
	vec3 resultColor = vec3(r, g, b);
    return resultColor;
} 

vec3 getWhiteToBlueColor_byHeight(float height)//, float minHeight, float maxHeight)
{
    // White to Blue in 32 steps.
    float gray = 1.0;
    //gray = 1.0 - gray; // invert gray value (white to blue).
    // calculate r, g, b values by gray.

    // Test to quadratic gray scale.***
    float stepGray = 1.0;

    for(int i=0; i<16-1; i++)
    {
        if(i >= uGradientStepsCount-1)
        break;

        float stepValue = uGradientSteps[i];
        float stepValue2 = uGradientSteps[i+1];

        // check if is frontier.***
        if(height >= uGradientSteps[0])
        {
            stepGray = 0.0;
            break;
        }

        if(height <= stepValue && height > stepValue2)
        {
            // calculate decimal.***
            //float decimal = (height - stepValue)/(stepValue2-stepValue);
            float decimal = (stepValue - height)/(stepValue-stepValue2);
            float unit = float (i);
            float value = unit + decimal;
            stepGray = value/float(uGradientStepsCount-1);
            break;
        }
    }
    gray = stepGray;
    // End test.-----------------------

    float r, g, b;

    // Red.
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.
    {
        float minGray = 0.0;
        float maxGray = 0.15625;
        //float maxR = 0.859375; // 220/256.
        float maxR = 1.0;
        float minR = 0.3515625; // 90/256.
        float relativeGray = (gray- minGray)/(maxGray - minGray);
        r = maxR - relativeGray*(maxR - minR);
    }
    else if(gray >= 0.15625 && gray < 0.40625) // [6, 13] from 32 divisions.
    {
        float minGray = 0.15625;
        float maxGray = 0.40625;
        float maxR = 0.3515625; // 90/256.
        float minR = 0.0; // 0/256.
        float relativeGray = (gray- minGray)/(maxGray - minGray);
        r = maxR - relativeGray*(maxR - minR);
    }
    else  // [14, 32] from 32 divisions.
    {
        r = 0.0;
    }

    // Green.
    if(gray >= 0.0 && gray < 0.15625) // [1, 5] from 32 divisions.
    {
        g = 1.0; // 256.
    }
    else if(gray >= 0.15625 && gray < 0.5625) // [6, 18] from 32 divisions.
    {
        float minGray = 0.15625;
        float maxGray = 0.5625;
        float maxG = 1.0; // 256/256.
        float minG = 0.0; // 0/256.
        float relativeGray = (gray- minGray)/(maxGray - minGray);
        g = maxG - relativeGray*(maxG - minG);
    }
    else  // [18, 32] from 32 divisions.
    {
        g = 0.0;
    }

    // Blue.
    if(gray < 0.5625)
    {
        b = 1.0;
    }
    else // gray >= 0.5625 && gray <= 1.0
    {
        float minGray = 0.5625;
        float maxGray = 1.0;
        float maxB = 1.0; // 256/256.
        float minB = 0.0; // 0/256.
        float relativeGray = (gray- minGray)/(maxGray - minGray);
        b = maxB - relativeGray*(maxB - minB);
    }

    return vec3(r, g, b);
}

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

void getTextureColor(in int activeNumber, in vec4 currColor4, in vec2 texCoord,  inout bool victory, in float externalAlpha, in vec4 externalTexCoords, inout vec4 resultTextureColor)
{
    if(activeNumber == 1 || activeNumber == 2)
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

            // debug.
            //resultTextureColor = mix(resultTextureColor, vec4(1.0, 1.0, 1.0, 1.0), 0.4);
        }
    }
    else if(activeNumber == 10)
    {
        // Bathymetry texture.
        float altitude = 1000000.0;
        if(currColor4.w > 0.0)
        {
            // decode the grayScale.***
            float r = currColor4.r;
            float g = currColor4.g;
            float b = currColor4.b;

            float height = currColor4.r;
            float incre = 1.0/16.0;

            //height = 256.0*g*289.75 + b*289.75 - 2796.0;
            height = (256.0*g + b)/(256.0/2.0);
            
            //altitude = uMinMaxAltitudes.x + height * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);
				altitude = -2796.0 + height * (0.1 +2796.0);
            //altitude = height;

            if(altitude < 0.1)
            {
                /*
                float minHeight_rainbow = uMinMaxAltitudes.x;
                float maxHeight_rainbow = 0.0;
                float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
                vec4 seaColor;

                float red = gray + 0.1;//float red = gray + 0.2;
                float green = gray + 0.5;//float green = gray + 0.6;
                float blue = gray*2.0 + 2.0;
                seaColor = vec4(red, green, blue, 1.0);
                */
                // vec3 seaColorRGB = getWhiteToBlueColor_byHeight(altitude, 0.0, uMinMaxAltitudes.x);

                //uMinMaxAltitudesBathymetryToGradient
                //vec3 seaColorRGB = getWhiteToBlueColor_byHeight(altitude, 0.0, -200.0);
                vec3 seaColorRGB = getWhiteToBlueColor_byHeight(altitude);//, uMinMaxAltitudesBathymetryToGradient.y, uMinMaxAltitudesBathymetryToGradient.x);
                //vec3 seaColorRGB = getWhiteToBlueColor_byHeight(altitude, uMinMaxAltitudes.y, uMinMaxAltitudes.x);
                vec4 seaColor = vec4(seaColorRGB, 1.0);
                
                resultTextureColor = mix(resultTextureColor, seaColor, 0.99); 
            }

        }
    }
}

void main()
{           
    // Debug.
    /*
    if((v_tex_pos.x < 0.006 || v_tex_pos.x > 0.994) || (v_tex_pos.y < 0.006 || v_tex_pos.y > 0.994))
    {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        return;
    }
    */

    vec2 texCoord = vec2(1.0 - v_tex_pos.x, 1.0 - v_tex_pos.y);

    // Take the base color.
    vec4 textureColor = vec4(0.0, 0.0, 0.0, 0.0);
    bool victory = false;

    if(uActiveTextures[0] > 0)
    {
        if(uActiveTextures[0] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[0];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], uExternalTexCoordsArray[0], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[0], texture2D(texture_0, texCoord), texCoord,  victory, externalAlphasArray[0], uExternalTexCoordsArray[0], textureColor);
        
    }
    if(uActiveTextures[1] > 0)
    {
        if(uActiveTextures[1] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[1];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], uExternalTexCoordsArray[1], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[1], texture2D(texture_1, texCoord), texCoord,  victory, externalAlphasArray[1], uExternalTexCoordsArray[1], textureColor);
    }
    if(uActiveTextures[2] > 0)
    {
        if(uActiveTextures[2] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[2];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], uExternalTexCoordsArray[2], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[2], texture2D(texture_2, texCoord), texCoord,  victory, externalAlphasArray[2], uExternalTexCoordsArray[2], textureColor);
    }
    if(uActiveTextures[3] > 0)
    {
        if(uActiveTextures[3] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[3];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], uExternalTexCoordsArray[3], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[3], texture2D(texture_3, texCoord), texCoord,  victory, externalAlphasArray[3], uExternalTexCoordsArray[3], textureColor);
    }
    if(uActiveTextures[4] > 0)
    {
        if(uActiveTextures[4] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[4];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], uExternalTexCoordsArray[4], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[4], texture2D(texture_4, texCoord), texCoord,  victory, externalAlphasArray[4], uExternalTexCoordsArray[4], textureColor);
    }
    if(uActiveTextures[5] > 0)
    {
        if(uActiveTextures[5] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[5];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], uExternalTexCoordsArray[5], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[5], texture2D(texture_5, texCoord), texCoord,  victory, externalAlphasArray[5], uExternalTexCoordsArray[5], textureColor);
    }
    if(uActiveTextures[6] > 0)
    {
        if(uActiveTextures[6] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[6];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], uExternalTexCoordsArray[6], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[6], texture2D(texture_6, texCoord), texCoord,  victory, externalAlphasArray[6], uExternalTexCoordsArray[6], textureColor);
    }
    if(uActiveTextures[7] > 0)
    {
        if(uActiveTextures[7] == 2)
        {
            // CustomImage. Must recalculate texCoords.
            vec4 externalTexCoord = uExternalTexCoordsArray[7];
            
            // check if intersects.
            vec2 texCoordAux = vec2(texCoord.x, 1.0-texCoord.y);
            if(intersects(texCoordAux, externalTexCoord))
            {
                // convert myTexCoord to customImageTexCoord.
                vec2 minTexCoord = vec2(externalTexCoord.x, externalTexCoord.y);
                vec2 maxTexCoord = vec2(externalTexCoord.z, externalTexCoord.w);

                texCoord.x = (texCoordAux.x - minTexCoord.x)/(maxTexCoord.x - minTexCoord.x);
                texCoord.y = (texCoordAux.y - minTexCoord.y)/(maxTexCoord.y - minTexCoord.y);

                texCoord.y = 1.0 - texCoord.y;
                getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], uExternalTexCoordsArray[7], textureColor);
            }
        }
        else
            getTextureColor(uActiveTextures[7], texture2D(texture_7, texCoord), texCoord,  victory, externalAlphasArray[7], uExternalTexCoordsArray[7], textureColor);
    }
    
    if(!victory)
    discard;
    
    gl_FragColor = textureColor;
	
}