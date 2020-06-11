#ifdef GL_ES
    precision highp float;
#endif
  
uniform sampler2D shadowMapTex;// 0
uniform sampler2D shadowMapTex2;// 1
//uniform sampler2D depthTex;//2
//uniform sampler2D noiseTex;//3
uniform sampler2D diffuseTex;  // 4
uniform sampler2D diffuseTex_1;// 5
uniform sampler2D diffuseTex_2;// 6
uniform sampler2D diffuseTex_3;// 7
uniform sampler2D diffuseTex_4;// 8
uniform sampler2D diffuseTex_5;// 9
uniform bool textureFlipYAxis;
uniform bool bIsMakingDepth;
uniform bool bExistAltitudes;
uniform mat4 projectionMatrix;
uniform vec2 noiseScale;
uniform float near;
uniform float far;            
uniform float fov;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight;    
uniform float shininessValue;
uniform vec3 kernel[16];   
uniform int uActiveTextures[8];
uniform float externalAlphasArray[8];
uniform vec2 uMinMaxAltitudes;
uniform int uTileDepth;
uniform int uSeaOrTerrainType;
uniform int uRenderType;

uniform vec4 oneColor4;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

varying vec2 vTexCoord;   
varying vec3 vLightWeighting;

varying vec3 diffuseColor;
uniform vec3 specularColor;
varying float depthValue;

const int kernelSize = 16;  
uniform float radius;      
uniform float uTime;  

uniform float ambientReflectionCoef;
uniform float diffuseReflectionCoef;  
uniform float specularReflectionCoef; 
uniform float externalAlpha;
uniform bool bApplyShadow;
uniform bool bApplySsao;
uniform float shadowMapWidth;    
uniform float shadowMapHeight;
varying vec3 v3Pos;
varying float vFogAmount;

varying float applySpecLighting;
varying vec4 vPosRelToLight; 
varying vec3 vLightDir; 
varying vec3 vNormal;
varying vec3 vNormalWC;
varying float currSunIdx;
varying float vAltitude;

const float equatorialRadius = 6378137.0;
const float polarRadius = 6356752.3142;

// water caustics: https://catlikecoding.com/unity/tutorials/flow/texture-distortion/

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
} 

float unpackDepthOcean(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
} 

float UnpackDepth32( in vec4 pack )
{
    float depth = dot( pack, 1.0 / vec4(1.0, 256.0, 256.0*256.0, 16777216.0) );// 256.0*256.0*256.0 = 16777216.0
    return depth * (16777216.0) / (16777216.0 - 1.0);
}

vec4 packDepth(const in float depth)
{
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); 
    //vec4 res = fract(depth * bit_shift); // Is not precise.
	vec4 res = mod(depth * bit_shift * vec4(255), vec4(256) ) / vec4(255); // Is better.
    res -= res.xxyz * bit_mask;
    return res;  
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
	// in this shader the depthTex is "diffuseTex"
	return unpackDepth(texture2D(diffuseTex, coord.xy));
}

//linear view space depth
//float getDepth(vec2 coord)
//{
//    return unpackDepth(texture2D(depthTex, coord.xy));
//}  

vec3 getRainbowColor_byHeight(float height)
{
	float minHeight_rainbow = -200.0;
	float maxHeight_rainbow = 0.0;
	
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
		return 1000.0;
} 

float getGridLineWidth(int depth)
{
	float gridLineWidth = 0.025;
	
	if(depth == 17)
	{
		gridLineWidth = 0.025;
	}
	else{
		int dif = 18 - depth;
		if(dif < 1)
		dif = 1;
		gridLineWidth = (0.04/17.0) * float(depth/dif);
	}
	
	return gridLineWidth;
}

//#define SHOW_TILING
#define TAU 6.28318530718 // https://www.shadertoy.com/view/4sXfDj
#define MAX_ITER 5 // https://www.shadertoy.com/view/4sXfDj

// Water Caustics with BCC-Noise :https://www.shadertoy.com/view/wlc3zr

vec3 causticColor(vec2 texCoord)
{
	// To avoid mosaic repetitions.******************
	float uPlus = texCoord.x - 1.0;
	float vPlus = texCoord.y - 1.0;
	//float timePlus = max(uPlus, vPlus);
	float timePlus = uPlus + vPlus;
	if(timePlus < 0.0)
	timePlus = 0.0;
	// End avoid mosaic repetitions.-------------------------
	
	// Water turbulence effect by joltz0r 2013-07-04, improved 2013-07-07
	float time = (uTime+timePlus) * .5+23.0;
    // uv should be the 0-1 uv of texture...

	

	vec2 uv = texCoord;
    
#ifdef SHOW_TILING
	vec2 p = mod(uv*TAU*2.0, TAU)-250.0;
#else
    vec2 p = mod(uv*TAU, TAU)-250.0;
#endif
	vec2 i = vec2(p);
	float c = 1.0;
	float inten = .005;

	for (int n = 0; n < MAX_ITER; n++) 
	{
		float t = time * (1.0 - (3.5 / float(n+1)));
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
	}
	c /= float(MAX_ITER);
	c = 1.17-pow(c, 1.4);
	vec3 colour = vec3(pow(abs(c), 8.0));
    colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);

	#ifdef SHOW_TILING
	// Flash tile borders...
	vec2 pixel = 2.0 / vec2(screenWidth, screenHeight);//iResolution.xy;
	uv *= 2.0;

	float f = floor(mod(time*.5, 2.0)); 	// Flash value.
	vec2 first = step(pixel, uv) * f;		   	// Rule out first screen pixels and flash.
	uv  = step(fract(uv), pixel);				// Add one line of pixels per tile.
	colour = mix(colour, vec3(1.0, 1.0, 0.0), (uv.x + uv.y) * first.x * first.y); // Yellow line
	
	#endif

	return colour;
}

void main()
{           
	if(bIsMakingDepth)
	{
		gl_FragColor = packDepth(-depthValue);
	}
	else
	{
		if(uRenderType == 2)
		{
			gl_FragColor = oneColor4; 
			return;
		}

		if(uSeaOrTerrainType == 1)
		{
			//gl_FragColor = vec4(oneColor4.xyz * shadow_occlusion * lambertian, 0.5); // original.***
			// Render a dot matrix in the sea surface.***
			

			return;
		}

		

		float shadow_occlusion = 1.0;
		if(bApplyShadow)
		{
			if(currSunIdx > 0.0)
			{
				vec3 fragCoord = gl_FragCoord.xyz;
				vec3 fragWC;
				
				//float ligthAngle = dot(vLightDir, vNormalWC);
				//if(ligthAngle > 0.0)
				//{
				//	// The angle between the light direction & face normal is less than 90 degree, so, the face is in shadow.***
				//	shadow_occlusion = 0.5;
				//}
				//else
				{

					vec3 posRelToLight = vPosRelToLight.xyz / vPosRelToLight.w;
					float tolerance = 0.9963;
					//tolerance = 0.9962;
					//tolerance = 1.0;
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
				}
			}
		}
		
		// Do specular lighting.***
		vec3 normal2 = vNormal;	
		float lambertian = 1.0;
		float specular;
		vec2 texCoord;
		if(applySpecLighting> 0.0)
		{
			vec3 L;
			if(bApplyShadow)
			{
				L = vLightDir;// test.***
				lambertian = max(dot(normal2, L), 0.0); // original.***
			}
			else
			{
				vec3 lightPos = vec3(0.0, 0.0, 0.0);
				L = normalize(lightPos - v3Pos);
				lambertian = max(dot(normal2, L), 0.0);
			}
			/*
			specular = 0.0;
			if(lambertian > 0.0)
			{
				vec3 R = reflect(-L, normal2);      // Reflected light vector
				vec3 V = normalize(-v3Pos); // Vector to viewer
				
				// Compute the specular term
				float specAngle = max(dot(R, V), 0.0);
				specular = pow(specAngle, shininessValue);
				
				if(specular > 1.0)
				{
					specular = 1.0;
				}
			}
			*/
			// test.
			lambertian += 0.3;

			if(lambertian < 0.8)
			{
				lambertian = 0.8;
			}
			else if(lambertian > 1.1)
			{
				lambertian = 1.1;
			}
		}
		
		// check if apply ssao.
		float occlusion = 1.0;
		//vec3 normal2 = vNormal;	
		
	
		vec4 textureColor = vec4(0.0);
		if(colorType == 0) // one color.
		{
			textureColor = oneColor4;
			
			if(textureColor.w == 0.0)
			{
				discard;
			}
		}
		else if(colorType == 2) // texture color.
		{
			
			if(textureFlipYAxis)
			{
				texCoord = vec2(vTexCoord.s, 1.0 - vTexCoord.t);
			}
			else{
				texCoord = vec2(vTexCoord.s, vTexCoord.t);
			}
			
			bool firstColorSetted = false;
			float externalAlpha = 0.0;
			
			
			
			
			
			
			
			
			
			
			if(uActiveTextures[2] == 1)
			{
				vec4 layersTextureColor = texture2D(diffuseTex, texCoord);
				externalAlpha = externalAlphasArray[2];
				if(layersTextureColor.w > 0.0 && externalAlpha > 0.0)
				{
					if(firstColorSetted)
					{
 						textureColor = mix(textureColor, layersTextureColor, layersTextureColor.w*externalAlpha);
					}
					else{
						textureColor = layersTextureColor;
						textureColor.w *= externalAlpha;
					}
					
					firstColorSetted = true;
				}
			}

			if(uActiveTextures[3] == 1)
			{
				vec4 layersTextureColor = texture2D(diffuseTex_1, texCoord);
				externalAlpha = externalAlphasArray[3];
				if(layersTextureColor.w > 0.0 && externalAlpha > 0.0)
				{
					if(firstColorSetted)
					{
 						textureColor = mix(textureColor, layersTextureColor, layersTextureColor.w*externalAlpha);
					}
					else{
						textureColor = layersTextureColor;
						textureColor.w *= externalAlpha;
					}
					
					firstColorSetted = true;
				}
			}

			if(uActiveTextures[4] == 1)
			{
				vec4 layersTextureColor = texture2D(diffuseTex_2, texCoord);
				externalAlpha = externalAlphasArray[4];
				if(layersTextureColor.w > 0.0 && externalAlpha > 0.0)
				{
					if(firstColorSetted)
					{
 						textureColor = mix(textureColor, layersTextureColor, layersTextureColor.w*externalAlpha);
					}
					else{
						textureColor = layersTextureColor;
						textureColor.w *= externalAlpha;
					}
					
					firstColorSetted = true;
				}
			}

			if(uActiveTextures[5] == 1)
			{
				vec4 layersTextureColor = texture2D(diffuseTex_3, texCoord);
				externalAlpha = externalAlphasArray[5];
				if(layersTextureColor.w > 0.0 && externalAlpha > 0.0)
				{
					if(firstColorSetted)
					{
 						textureColor = mix(textureColor, layersTextureColor, layersTextureColor.w*externalAlpha);
					}
					else{
						textureColor = layersTextureColor;
						textureColor.w *= externalAlpha;
					}
					
					firstColorSetted = true;
				}
			}

			if(uActiveTextures[6] == 1)
			{
				vec4 layersTextureColor = texture2D(diffuseTex_4, texCoord);
				externalAlpha = externalAlphasArray[6];
				if(layersTextureColor.w > 0.0 && externalAlpha > 0.0)
				{
					if(firstColorSetted)
					{
 						textureColor = mix(textureColor, layersTextureColor, layersTextureColor.w*externalAlpha);
					}
					else{
						textureColor = layersTextureColor;
						textureColor.w *= externalAlpha;
					}
					
					firstColorSetted = true;
				}
			}

			if(uActiveTextures[7] == 1)
			{
				vec4 layersTextureColor = texture2D(diffuseTex_5, texCoord);
				externalAlpha = externalAlphasArray[7];
				if(layersTextureColor.w > 0.0 && externalAlpha > 0.0)
				{
					if(firstColorSetted)
					{
 						textureColor = mix(textureColor, layersTextureColor, layersTextureColor.w*externalAlpha);
					}
					else{
						textureColor = layersTextureColor;
						textureColor.w *= externalAlpha;
					}
					
					firstColorSetted = true;
				}
			}
			
			if(textureColor.w == 0.0)
			{
				discard;
			}
		}
		else{
			textureColor = oneColor4;
		}

		textureColor.w = externalAlpha;
		vec4 fogColor = vec4(0.9, 0.9, 0.9, 1.0);
		
		
		// Test dem image.***************************************************************************************************************
		float altitude = 1000000.0;
		if(uActiveTextures[5] == 10)
		{
			vec4 layersTextureColor = texture2D(diffuseTex_3, texCoord);
			if(layersTextureColor.w > 0.0)
			{
				// decode the grayScale.***
				altitude = uMinMaxAltitudes.x + layersTextureColor.r * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);
			}

			//if(layersTextureColor.w > 0.0)
			//{
			//	// decode the grayScale.***
			//	float depth = unpackDepthOcean(layersTextureColor);
			//	altitude = uMinMaxAltitudes.x + depth * (uMinMaxAltitudes.y - uMinMaxAltitudes.x);
			//}
		}
		// End test dem image.------------------------------------------------------------------------------------------------------------
		if(bApplySsao && altitude<0.0)
		{
			// must find depthTex & noiseTex.***
			////float farForDepth = 30000.0;
			vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
			float linearDepth = getDepth(screenPos);  
			vec3 ray = getViewRay(screenPos); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
			vec3 origin = ray * linearDepth;  
			float ssaoRadius = radius*20.0;
			float tolerance = ssaoRadius/far; // original.***
			////float tolerance = radius/(far-near);// test.***
			////float tolerance = radius/farForDepth;

			// in this shader noiseTex is "diffusse_1".
			vec3 rvec = texture2D(diffuseTex_1, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;
			vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));
			vec3 bitangent = cross(normal2, tangent);
			mat3 tbn = mat3(tangent, bitangent, normal2);   
			float minDepthBuffer;
			float maxDepthBuffer;
			for(int i = 0; i < kernelSize; ++i)
			{    	 
				vec3 sample = origin + (tbn * vec3(kernel[i].x*3.0, kernel[i].y*3.0, kernel[i].z)) * ssaoRadius*2.0; // original.***
				vec4 offset = projectionMatrix * vec4(sample, 1.0);					
				offset.xy /= offset.w;
				offset.xy = offset.xy * 0.5 + 0.5;  				
				float sampleDepth = -sample.z/far;// original.***

				float depthBufferValue = getDepth(offset.xy);
				/*
				if(depthBufferValue > 0.00391 && depthBufferValue < 0.00393)
				{
					if (depthBufferValue < sampleDepth-tolerance*1000.0)
					{
						occlusion +=  0.5;
					}
					
					continue;
				}			
				*/
				if (depthBufferValue < sampleDepth)//-tolerance)
				{
					occlusion +=  1.0;
				}
			} 

			occlusion = 1.0 - occlusion / float(kernelSize);
			
			shadow_occlusion *= occlusion;
		}
		
		if(altitude < 0.0)
		{
			//if(uSeaOrTerrainType == 1)
			//{
			//	gl_FragColor = vec4(oneColor4.xyz * shadow_occlusion * lambertian, 0.5); // original.***
			//	return;
			//}
			
			

			float minHeight_rainbow = -100.0;
			float maxHeight_rainbow = 0.0;
			float gray = (altitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
			//float gray = (vAltitude - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
			//vec3 rainbowColor = getRainbowColor_byHeight(altitude);

			// caustics.*********************
			if(uTime > 0.0 && uTileDepth > 6 && altitude > -120.0)
			{
				// Active this code if want same size caustic effects for different tileDepths.***
				// Take tileDepth 14 as the unitary tile depth.
				//float tileDethDiff = float(16 - uTileDepth);
				//vec2 cauticsTexCoord = texCoord*pow(2.0, tileDethDiff);
				//-----------------------------------------------------------------------
				vec2 cauticsTexCoord = texCoord;
				vec3 causticColor = causticColor(cauticsTexCoord);
				textureColor = vec4(mix(textureColor.rgb, causticColor, gray), externalAlpha);
			}
			// End caustics.--------------------------

			
			if(gray < 0.05)
			gray = 0.05;
			float red = gray + 0.2;
			float green = gray + 0.6;
			float blue = gray*2.0 + 2.0;
			//fogColor = vec4(gray*1.3, gray*2.1, gray*2.7, 1.0);
			fogColor = vec4(red, green, blue, 1.0);
			
			// Test drawing grid.***
			/*
			if(uTileDepth > 7)
			{
				float numSegs = 5.0;
				float fX = fract(texCoord.x * numSegs);

				float gridLineWidth = getGridLineWidth(uTileDepth);
				if( fX < gridLineWidth || fX > 1.0-gridLineWidth)
				{
					vec3 color = vec3(0.99, 0.5, 0.5);
					gl_FragColor = vec4(color.rgb* shadow_occlusion * lambertian, 1.0);
					return;
				}
				
				float fY = fract(texCoord.y * numSegs);
				if( fY < gridLineWidth|| fY > 1.0-gridLineWidth)
				{
					vec3 color = vec3(0.3, 0.5, 0.99);
					gl_FragColor = vec4(color.rgb* shadow_occlusion * lambertian, 1.0);
					return;
				}
			}
			*/
			// End test drawing grid.---
			float specularReflectionCoef = 0.6;
			vec3 specularColor = vec3(0.8, 0.8, 0.8);
			vec4 finalColor = mix(textureColor, fogColor, 0.7); 
			//gl_FragColor = vec4(finalColor.xyz * shadow_occlusion * lambertian + specularReflectionCoef * specular * specularColor * shadow_occlusion, 1.0); // with specular.***
			gl_FragColor = vec4(finalColor.xyz * shadow_occlusion * lambertian, 1.0); // original.***

			return;
		}
		else{
			if(uSeaOrTerrainType == 1)
			discard;
		
		}
		
		
		vec4 finalColor = mix(textureColor, fogColor, vFogAmount); 
		gl_FragColor = vec4(finalColor.xyz * shadow_occlusion * lambertian, 1.0); // original.***
		//gl_FragColor = textureColor; // test.***
		//gl_FragColor = vec4(vNormal.xyz, 1.0); // test.***
		
		//if(currSunIdx > 0.0 && currSunIdx < 1.0 && shadow_occlusion<0.9)gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	}
}