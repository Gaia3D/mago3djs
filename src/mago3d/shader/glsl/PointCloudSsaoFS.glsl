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
varying vec4 aColor4; // color from attributes
varying vec4 vColor;
varying float glPointSize;

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
	finalColor = vec4((vColor.xyz) * occlusion, externalAlpha);
	//finalColor = vec4(vec3(0.8, 0.8, 0.8) * occlusion, externalAlpha);
    gl_FragColor = finalColor; 
}