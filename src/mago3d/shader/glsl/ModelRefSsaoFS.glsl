#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D noiseTex;  
uniform sampler2D diffuseTex;
uniform sampler2D shadowMapTex;
uniform bool textureFlipYAxis;
varying vec3 vNormal;
uniform mat4 projectionMatrix;
uniform mat4 m;
uniform vec2 noiseScale;
uniform float near;
uniform float far;            
uniform float fov;
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

const int kernelSize = 16;  
uniform float radius;      

uniform float ambientReflectionCoef;
uniform float diffuseReflectionCoef;  
uniform float specularReflectionCoef; 
uniform bool bApplySsao;
uniform float externalAlpha;
uniform bool bApplyShadow;

// clipping planes.***
uniform bool bApplyClippingPlanes;
uniform int clippingPlanesCount;
uniform vec4 clippingPlanes[6];

varying vec2 vTexCoord;   
varying vec3 vLightWeighting;
varying vec3 diffuseColor;
varying vec3 vertexPos;
varying float applySpecLighting;
varying vec4 vPosRelToLight; 
varying vec3 vLightDir; 
varying vec3 vNormalWC;

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
}  


float UnpackDepth32( in vec4 pack )
{
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0
    return depth * (16777216.0) / (16777216.0 - 1.0);
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

float getDepthShadowMap(vec2 coord)
{
    return UnpackDepth32(texture2D(shadowMapTex, coord.xy));
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

	bool testBool = false;
	float occlusion = 1.0; // ambient occlusion.***
	float shadow_occlusion = 1.0;
	vec3 normal2 = vNormal;	
		
	if(bApplySsao)
	{         
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
		float linearDepth = getDepth(screenPos);  
		vec3 ray = getViewRay(screenPos);
		vec3 origin = ray * linearDepth;  
		float tolerance = radius/far;

		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));
		vec3 bitangent = cross(normal2, tangent);
		mat3 tbn = mat3(tangent, bitangent, normal2);   

		for(int i = 0; i < kernelSize; ++i)
		{    	 
			vec3 sample = origin + (tbn * vec3(kernel[i].x*1.0, kernel[i].y*1.0, kernel[i].z)) * radius*2.0;
			vec4 offset = projectionMatrix * vec4(sample, 1.0);					
			offset.xy /= offset.w;
			offset.xy = offset.xy * 0.5 + 0.5;  				
			float sampleDepth = -sample.z/far;

			float depthBufferValue = getDepth(offset.xy);	

			if (depthBufferValue < sampleDepth-tolerance)
			{
				occlusion +=  1.0;
			}
		} 
		
		occlusion = 1.0 - occlusion / float(kernelSize);	
		
	}
	
	//if(occlusion > 0.93)
	//occlusion = 1.0;

    // Do specular lighting.***
	float lambertian;
	float specular;
		
	if(applySpecLighting> 0.0)
	{
		//vec3 lightPos = vec3(20.0, 60.0, 200.0);
		vec3 lightPos = vec3(1.0, 1.0, 1.0);
		vec3 L = normalize(lightPos - vertexPos);
		lambertian = max(dot(normal2, L), 0.0);
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
	
		vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;
		if(posRelToLight.x >= -0.5 && posRelToLight.x <= 0.5)
		{
			if(posRelToLight.y >= -0.5 && posRelToLight.y <= 0.5)
			{
				float ligthAngle = dot(vLightDir, vNormalWC);
				if(ligthAngle > 0.0)
				{
					// The angle between the light direction & face normal is less than 90 degree, so, the face is in shadow.***
					if(shadow_occlusion > 0.4)
						shadow_occlusion = 0.4;
				}
				else{
					float pixelWidth = 1.0 / shadowMapWidth;
					float pixelHeight = 1.0 / shadowMapHeight;
					posRelToLight = posRelToLight * 0.5 + 0.5;
					
					float depthRelToLight = getDepthShadowMap(posRelToLight.xy);
					if(posRelToLight.z > depthRelToLight*0.9963 )
					{
						if(shadow_occlusion > 0.4)
							shadow_occlusion = 0.4;
					}
					
					//for(int horit = -1; horit<2; horit++)
					//{
					//	for(int vert = -1; vert < 2; vert++)
					//	{
					//		vec2 shadowMapTexCoord = vec2(posRelToLight.x+float(horit)*pixelWidth, posRelToLight.y+float(vert)*pixelHeight);
					//		float depthRelToLight = getDepthShadowMap(shadowMapTexCoord);
					//		if(posRelToLight.z > depthRelToLight*0.9963 )
					//		{
					//			if(shadow_occlusion > 0.4)
					//				shadow_occlusion -= (0.4/9.0);
					//		}
					//	}
					//}
					
				}
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
	
	vec3 ambientColor = vec3(textureColor.x, textureColor.y, textureColor.z);
	float alfa = textureColor.w * externalAlpha;
	
	// test render by depth.************************************************************
	//if(testBool)
	//textureColor = vec4(1.0, 0.0, 0.0, 1.0);
	// End test.------------------------------------------------------------------------

    vec4 finalColor;
	if(applySpecLighting> 0.0)
	{
		finalColor = vec4((ambientReflectionCoef * ambientColor + diffuseReflectionCoef * lambertian * textureColor.xyz + specularReflectionCoef * specular * specularColor)*vLightWeighting * occlusion * shadow_occlusion, alfa); 
	}
	else{
		finalColor = vec4((textureColor.xyz) * occlusion * shadow_occlusion, alfa);
	}
	//finalColor = vec4(linearDepth, linearDepth, linearDepth, 1.0); // test to render depth color coded.***
    gl_FragColor = finalColor; 
}