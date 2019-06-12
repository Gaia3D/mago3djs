#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform mat4 projectionMatrix;
uniform float near;
uniform float far;            
uniform float fov;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight;    
uniform vec3 kernel[16];   
uniform vec4 oneColor4;
uniform bool bUseColorCodingByHeight;
uniform float minHeight_rainbow;   
uniform float maxHeight_rainbow;  
varying vec4 aColor4; // color from attributes
varying vec4 vColor;
varying float glPointSize;
varying float realHeigh;

const int kernelSize = 16;  
uniform float radius;      

uniform bool bApplySsao;
uniform float externalAlpha;

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
}                

vec3 getViewRay(vec2 tc)
{
    float hfar = 2.0 * tan(fov/2.0) * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
}         
            
//linear view space depth
float getDepth(vec2 coord)
{
    return unpackDepth(texture2D(depthTex, coord.xy));
}  

vec3 getRainbowColor_byHeight(float height)
{
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

void main()
{
	float occlusion = 0.0;
	if(bApplySsao)
	{          
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
		float linearDepth = getDepth(screenPos);
		vec3 origin = getViewRay(screenPos) * linearDepth;
		float radiusAux = glPointSize/1.9;
		radiusAux = 1.5;
		vec2 screenPosAdjacent;
		
		for(int j = 0; j < 1; ++j)
		{
			radiusAux = 1.5 *(float(j)+1.0);
			for(int i = 0; i < 8; ++i)
			{    	 
				if(i == 0)
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
				else if(i == 1)
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
				else if(i == 2)
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
				else if(i == 3)
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);
				else if(i == 4)
					screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
				else if(i == 5)
					screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
				else if(i == 6)
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
				else if(i == 7)
					screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);
				float depthBufferValue = getDepth(screenPosAdjacent);
				float range_check = abs(linearDepth - depthBufferValue)*far;
				if (range_check > 1.5 && depthBufferValue > linearDepth)
				{
					if (range_check < 20.0)
						occlusion +=  1.0;
				}
			}   
		}   
			
		if(occlusion > 6.0)
			occlusion = 8.0;
		//else occlusion = 0.0;
		occlusion = 1.0 - occlusion / 8.0;
	}
	else{
		occlusion = 1.0;
	}

    vec4 finalColor;
	if(bUseColorCodingByHeight)
	{
		float rainbow = 0.5;
		float texCol = 0.5;
		vec3 rainbowColor3 = getRainbowColor_byHeight(realHeigh);
		vec3 blendedColor3 = vec3(vColor.x * texCol + rainbowColor3.r * rainbow, vColor.y * texCol + rainbowColor3.g * rainbow, vColor.z * texCol + rainbowColor3.b * rainbow);
		finalColor = vec4(blendedColor3 * occlusion, externalAlpha);
	}
	else
		finalColor = vec4((vColor.xyz) * occlusion, externalAlpha);
	//finalColor = vec4(vec3(0.8, 0.8, 0.8) * occlusion, externalAlpha);
    gl_FragColor = finalColor; 
}

















