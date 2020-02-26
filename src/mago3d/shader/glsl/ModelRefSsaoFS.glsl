#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D noiseTex;  
uniform sampler2D diffuseTex;
uniform sampler2D shadowMapTex;
uniform sampler2D shadowMapTex2;
uniform bool textureFlipYAxis;
uniform mat4 projectionMatrix;
uniform mat4 m;
uniform vec2 noiseScale;
uniform float near;
uniform float far;            
uniform float fov;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight;   
uniform float shadowMapWidth;    
uniform float shadowMapHeight; 
uniform float shininessValue;
uniform vec3 kernel[16];   
uniform vec4 oneColor4;
varying vec4 aColor4; // color from attributes
uniform bool bApplyScpecularLighting;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

uniform vec3 specularColor;
uniform vec3 ambientColor;

const int kernelSize = 16;  
uniform float radius;      

uniform float ambientReflectionCoef;
uniform float diffuseReflectionCoef;  
uniform float specularReflectionCoef; 
uniform bool bApplySsao;
uniform bool bApplyShadow;
uniform float externalAlpha;
uniform vec4 colorMultiplier;

//uniform int sunIdx;

// clipping planes.***
//uniform bool bApplyClippingPlanes;
//uniform int clippingPlanesCount;
//uniform vec4 clippingPlanes[6];

varying vec3 vNormal;
varying vec2 vTexCoord;   
varying vec3 vLightWeighting;
varying vec3 diffuseColor;
varying vec3 vertexPos;
varying float applySpecLighting;
varying vec4 vPosRelToLight; 
varying vec3 vLightDir; 
varying vec3 vNormalWC;
varying float currSunIdx; 
varying float discardFrag;

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
float getDepth(vec2 coord)
{
	return unpackDepth(texture2D(depthTex, coord.xy));
}   

float getDepthShadowMap(vec2 coord)
{
	// currSunIdx
	if(currSunIdx > 0.0 && currSunIdx < 1.0)
	{
		return UnpackDepth32(texture2D(shadowMapTex, coord.xy));
	}
    else if(currSunIdx > 1.0 && currSunIdx < 2.0)
	{
		return UnpackDepth32(texture2D(shadowMapTex2, coord.xy));
	}
	else
		return -1.0;
}  

bool clipVertexByPlane(in vec4 plane, in vec3 point)
{
	float dist = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;
	
	if(dist < 0.0)
	return true;
	else return false;
}

void main()
{
	// 1rst, check if there are clipping planes.
	/*
	if(bApplyClippingPlanes)
	{
		bool discardFrag = true;
		for(int i=0; i<6; i++)
		{
			vec4 plane = clippingPlanes[i];
			if(!clipVertexByPlane(plane, vertexPos))
			{
				discardFrag = false;
				break;
			}
			if(i >= clippingPlanesCount)
			break;
		}
		
		if(discardFrag)
		discard;
	}
	*/

	//bool testBool = false;
	float occlusion = 1.0; // ambient occlusion.***
	float shadow_occlusion = 1.0;
	vec3 normal2 = vNormal;	
		
	if(bApplySsao)
	{        
		////float farForDepth = 30000.0;
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
		float linearDepth = getDepth(screenPos);  
		vec3 ray = getViewRay(screenPos); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
		vec3 origin = ray * linearDepth;  
		float tolerance = radius/far; // original.***
		////float tolerance = radius/(far-near);// test.***
		////float tolerance = radius/farForDepth;

		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));
		vec3 bitangent = cross(normal2, tangent);
		mat3 tbn = mat3(tangent, bitangent, normal2);   
		float minDepthBuffer;
		float maxDepthBuffer;
		for(int i = 0; i < kernelSize; ++i)
		{    	 
			vec3 sample = origin + (tbn * vec3(kernel[i].x*1.0, kernel[i].y*1.0, kernel[i].z)) * radius*2.0;
			vec4 offset = projectionMatrix * vec4(sample, 1.0);					
			offset.xy /= offset.w;
			offset.xy = offset.xy * 0.5 + 0.5;  				
			float sampleDepth = -sample.z/far;// original.***
			////float sampleDepth = -sample.z/(far-near);// test.***
			////float sampleDepth = -sample.z/farForDepth;

			float depthBufferValue = getDepth(offset.xy);

			if(depthBufferValue > 0.00391 && depthBufferValue < 0.00393)
			{
				if (depthBufferValue < sampleDepth-tolerance*1000.0)
				{
					occlusion +=  0.5;
				}
				
				continue;
			}			
			
			if (depthBufferValue < sampleDepth-tolerance)
			{
				occlusion +=  1.0;
			}
		} 

		occlusion = 1.0 - occlusion / float(kernelSize);	
	}
	
    // Do specular lighting.***
	float lambertian;
	float specular;
	
	if(applySpecLighting> 0.0)
	{
		vec3 L;
		if(bApplyShadow)
		{
			L = vLightDir;// test.***
			lambertian = max(dot(normal2, L), 0.0); // original.***
			//lambertian = max(dot(vNormalWC, L), 0.0); // test.
		}
		else
		{
			vec3 lightPos = vec3(1.0, 1.0, 1.0);
			L = normalize(lightPos - vertexPos);
			lambertian = max(dot(normal2, L), 0.0);
		}
		
		specular = 0.0;
		if(lambertian > 0.0)
		{
			vec3 R = reflect(-L, normal2);      // Reflected light vector
			vec3 V = normalize(-vertexPos); // Vector to viewer
			
			// Compute the specular term
			float specAngle = max(dot(R, V), 0.0);
			specular = pow(specAngle, shininessValue);
			
			if(specular > 1.0)
			{
				specular = 1.0;
			}
		}
		
		if(lambertian < 0.5)
		{
			lambertian = 0.5;
		}

	}
	
	if(bApplyShadow)
	{
		if(currSunIdx > 0.0)
		{
			float ligthAngle = dot(vLightDir, vNormalWC);
			if(ligthAngle > 0.0)
			{
				// The angle between the light direction & face normal is less than 90 degree, so, the face is in shadow.***
				shadow_occlusion = 0.5;
			}
			else
			{
				vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;
				float tolerance = 0.9963;
				posRelToLight = posRelToLight * 0.5 + 0.5; // transform to [0,1] range
				if(posRelToLight.x >= 0.0 && posRelToLight.x <= 1.0)
				{
					if(posRelToLight.y >= 0.0 && posRelToLight.y <= 1.0)
					{
						float depthRelToLight = getDepthShadowMap(posRelToLight.xy);
						if(posRelToLight.z > depthRelToLight*tolerance )
						{
							shadow_occlusion = 0.5;
						}
					}
				}

				// test. Calculate the zone inside the pixel.************************************
				//https://docs.microsoft.com/ko-kr/windows/win32/dxtecharts/cascaded-shadow-maps
			}
		}
	}
	

    vec4 textureColor;
    if(colorType == 2)
    {
        if(textureFlipYAxis)
        {
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, 1.0 - vTexCoord.t));
        }
        else{
            textureColor = texture2D(diffuseTex, vec2(vTexCoord.s, vTexCoord.t));
        }
		
        if(textureColor.w == 0.0)
        {
            discard;
        }
    }
    else if(colorType == 0)
	{
        textureColor = oneColor4;
    }
	else if(colorType == 1)
	{
        textureColor = aColor4;
    }
	
	//textureColor = vec4(0.85, 0.85, 0.85, 1.0);
	
	vec3 ambientColorAux = vec3(textureColor.x*ambientColor.x, textureColor.y*ambientColor.y, textureColor.z*ambientColor.z);
	float alfa = textureColor.w * externalAlpha;

    vec4 finalColor;
	if(applySpecLighting> 0.0)
	{
		finalColor = vec4((ambientReflectionCoef * ambientColorAux + 
							diffuseReflectionCoef * lambertian * textureColor.xyz + 
							specularReflectionCoef * specular * specularColor)*vLightWeighting * occlusion * shadow_occlusion, alfa); 
	}
	else{
		finalColor = vec4((textureColor.xyz) * occlusion * shadow_occlusion, alfa);
	}
	
	//if(testBool)
	//finalColor *= vec4(0.99, 0.33, 0.32, 1.0);
	
	finalColor *= colorMultiplier;


	//finalColor = vec4(linearDepth, linearDepth, linearDepth, 1.0); // test to render depth color coded.***
    gl_FragColor = finalColor; 

}