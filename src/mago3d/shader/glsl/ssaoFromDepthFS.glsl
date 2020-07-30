
#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D noiseTex;  

uniform mat4 projectionMatrix;
uniform mat4 projectionMatrixInv;

uniform float near;
uniform float far;            
uniform float fov;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight; 
uniform vec2 noiseScale;

uniform bool bApplySsao;
uniform float radius; 
uniform vec3 kernel[16]; 

const int kernelSize = 16; 

uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;



float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***
    float depth = dot(rgba_depth, bit_shift);
    return depth;
}  


float UnpackDepth32( in vec4 pack )
{
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);
}             

vec3 getViewRay(vec2 tc)
{
	/*
	// The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
	float farForDepth = 30000.0;
	float hfar = 2.0 * tangentOfHalfFovy * farForDepth;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -farForDepth);  
	*/	
	
	
	float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
	
    return ray;                      
}         
            
//linear view space depth
/*
float getDepth(vec2 coord)
{
	return unpackDepth(texture2D(depthTex, coord.xy));
} 
*/
float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z*0.0001;
        float Fcoef_half = uFCoef_logDepth/2.0;
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = (flogzAux - 1.0);
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
}

vec3 reconstructPosition(vec2 texCoord, float depth)
{
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
    float x = texCoord.x * 2.0 - 1.0;
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;
    float y = (texCoord.y) * 2.0 - 1.0;
    float z = (1.0 - depth) * 2.0 - 1.0;
    vec4 pos_NDC = vec4(x, y, z, 1.0);
    vec4 pos_CC = projectionMatrixInv * pos_NDC;
    return pos_CC.xyz / pos_CC.w;
}

vec3 normal_from_depth(float depth, vec2 texCoord) {
    // http://theorangeduck.com/page/pure-depth-ssao
    float pixelSizeX = 1.0/screenWidth;
    float pixelSizeY = 1.0/screenHeight;

    vec2 offset1 = vec2(0.0,pixelSizeY);
    vec2 offset2 = vec2(pixelSizeX,0.0);

	float depthA = 0.0;
	float depthB = 0.0;
	for(float i=0.0; i<2.0; i++)
	{
		depthA += getDepth(texCoord + offset1*(1.0+i));
		depthB += getDepth(texCoord + offset2*(1.0+i));
	}

	vec3 posA = reconstructPosition(texCoord + offset1*2.0, depthA/2.0);
	vec3 posB = reconstructPosition(texCoord + offset2*2.0, depthB/2.0);

    vec3 pos0 = reconstructPosition(texCoord, depth);
    vec3 normal = cross(posA - pos0, posB - pos0);
    normal.z = -normal.z;

    return normalize(normal);
}



void main()
{
    float ambientLight = 1.0; // initially all bright.
    float occlusion = 0.0;
    float smallOcclusion = 0.0;
    vec3 normal = vec3(0.0);
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
    vec3 ray = getViewRay(screenPos); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
    float linearDepth = getDepth(screenPos);  

    // test.***
    //float linearDepthTest = unpackDepth(texture2D(depthTex, screenPos));
    //if(linearDepthTest > 0.99)
    //discard;

    float bigRadius = 10.0;
    float factorByDist = 1.0;
    float realDist = linearDepth * far;

    if(realDist < bigRadius*5.0)
    {
        factorByDist = smoothstep(0.0, 1.0, realDist/(bigRadius*5.0));
    }

    if(factorByDist < 0.05)
        discard;

    if(bApplySsao)
	{        
		vec3 origin = ray * linearDepth;  
        vec3 normal2 = normal_from_depth(linearDepth, screenPos); // normal from depthTex.***
        normal = normal2;
        
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));
		vec3 bitangent = cross(normal2, tangent);
		mat3 tbn = mat3(tangent, bitangent, normal2);   

		for(int i = 0; i < kernelSize; ++i)
		{    	 
			vec3 sample = origin + (tbn * vec3(kernel[i].x*1.0, kernel[i].y*1.0, kernel[i].z)) * bigRadius;
			vec4 offset = projectionMatrix * vec4(sample, 1.0);	
            vec3 offsetCoord = vec3(offset.xyz);				
			offsetCoord.xyz /= offset.w;
			offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5;  				
			float sampleDepth = -sample.z/far;// original.***

			float depthBufferValue = getDepth(offsetCoord.xy);
            float depthDiff = abs(depthBufferValue - sampleDepth);
            if(depthDiff < bigRadius/far)
            {
                float rangeCheck = smoothstep(0.0, 1.0, bigRadius / (depthDiff*far));
                if (depthBufferValue < sampleDepth)//-tolerance*1.0)
                {
                    occlusion += 1.0 * rangeCheck * factorByDist;
                }
            }

            // do very big radius.***
            /*
            offsetCoord = vec2(offset.xy*3.0);				
			offsetCoord.xy /= offset.w;
			offsetCoord.xy = offsetCoord.xy * 0.5 + 0.5;  		
            depthBufferValue = getDepth(offset.xy*3.0);

            if (depthBufferValue - sampleDepth > bigRadius*3.0)
            {
                continue;
            }

			if (depthBufferValue > sampleDepth)//-tolerance*1.0)
			{
				smallOcclusion +=  1.0;
			}
            */
		} 

        

		occlusion = occlusion / float(kernelSize);	
        if(occlusion < 0.0)
        occlusion = 0.0;
	}

    // Do lighting.***
    //float scalarProd = max(0.01, dot(normal, normalize(-ray)));
   // scalarProd /= 3.0;
	//scalarProd += 0.666;
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - scalarProd);

	gl_FragColor = vec4(0.0, 0.0, 0.0, occlusion);
    //gl_FragColor = vec4(normal.xyz, 1.0);
}