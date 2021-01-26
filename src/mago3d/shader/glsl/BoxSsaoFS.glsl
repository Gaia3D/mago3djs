#ifdef GL_ES
    precision highp float;
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif
  
varying vec4 vcolor4;   
  

void main()
{ 
	vec4 textureColor;
	textureColor = vcolor4;  
	/*
	if(bUseNormal)
    {
		vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);		                 
		float linearDepth = getDepth(screenPos);          
		vec3 origin = getViewRay(screenPos) * linearDepth;   
		vec3 normal2 = vNormal;   
				
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));
		vec3 bitangent = cross(normal2, tangent);
		mat3 tbn = mat3(tangent, bitangent, normal2);        
		
		float occlusion = 0.0;
		for(int i = 0; i < kernelSize; ++i)
		{    	 
			vec3 sample = origin + (tbn * kernel[i]) * radius;
			vec4 offset = projectionMatrix * vec4(sample, 1.0);		
			offset.xy /= offset.w;
			offset.xy = offset.xy * 0.5 + 0.5;        
			float sampleDepth = -sample.z/far;
			float depthBufferValue = getDepth(offset.xy);				              
			float range_check = abs(linearDepth - depthBufferValue)+radius*0.998;
			if (range_check < radius*1.001 && depthBufferValue <= sampleDepth)
			{
				occlusion +=  1.0;
			}
			
		}   
			
		occlusion = 1.0 - occlusion / float(kernelSize);
									
		vec3 lightPos = vec3(10.0, 10.0, 10.0);
		vec3 L = normalize(lightPos);
		float DiffuseFactor = dot(normal2, L);
		float NdotL = abs(DiffuseFactor);
		vec3 diffuse = vec3(NdotL);
		vec3 ambient = vec3(1.0);
		gl_FragColor.rgb = vec3((textureColor.xyz)*vLightWeighting * occlusion); 
		gl_FragColor.a = 1.0; 
	}
	else
	{
		gl_FragColor.rgb = vec3(textureColor.xyz); 
		gl_FragColor.a = 1.0; 
	}	
	*/
	gl_FragData[0] = vec4(textureColor.xyz, 1.0);

	#ifdef USE_MULTI_RENDER_TARGET
	gl_FragData[3] = vec4(textureColor.xyz, 1.0);
	#endif
}
