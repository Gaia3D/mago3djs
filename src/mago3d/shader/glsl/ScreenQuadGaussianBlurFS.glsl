#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D image; // 0

uniform bool u_bHorizontal;
//uniform float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);   

uniform float screenWidth;  // this is the image width.***  
uniform float screenHeight;  // this is the image height.***
uniform vec2 uImageSize;


// Tutorial for bloom effect : https://learnopengl.com/Advanced-Lighting/Bloom

void main()
{
    //float weight[5] = float[5] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);   
    float weight[5];   
    weight[0] = 0.227027;
    weight[1] = 0.1945946;
    weight[2] = 0.1216216;
    weight[3] = 0.054054;
    weight[4] = 0.016216;
	//vec2 TexCoords = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
    //float pixelSize_x = 1.0/screenWidth;
	//float pixelSize_y = 1.0/screenHeight;

    vec2 TexCoords = vec2(gl_FragCoord.x / uImageSize.x, gl_FragCoord.y / uImageSize.y);
    float pixelSize_x = 1.0/uImageSize.x;
	float pixelSize_y = 1.0/uImageSize.y;

    vec3 result = texture2D(image, TexCoords).rgb * weight[0]; // current fragment's contribution
    if(u_bHorizontal)
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture2D(image, TexCoords + vec2(pixelSize_x * float(i), 0.0)).rgb * weight[i];
            result += texture2D(image, TexCoords - vec2(pixelSize_x * float(i), 0.0)).rgb * weight[i];
        }
    }
    else
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture2D(image, TexCoords + vec2(0.0, pixelSize_y * float(i))).rgb * weight[i];
            result += texture2D(image, TexCoords - vec2(0.0, pixelSize_y * float(i))).rgb * weight[i];
        }
    }
    gl_FragData[0] = vec4(result, 1.0);
}