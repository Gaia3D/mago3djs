#ifdef GL_ES
    precision highp float;
#endif

//uniform sampler2D depthTex;
//uniform sampler2D noiseTex;  
uniform sampler2D diffuseTex;
uniform sampler2D shadowMapTex;
uniform sampler2D shadowMapTex2;
uniform bool textureFlipYAxis;
uniform bool bIsMakingDepth;
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
uniform float shininessValue;
uniform vec3 kernel[16];   

uniform vec4 oneColor4;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

varying vec2 vTexCoord;   
varying vec3 vLightWeighting;

varying vec3 diffuseColor;
uniform vec3 specularColor;
varying vec3 vertexPos;
varying float depthValue;

const int kernelSize = 16;  
uniform float radius;      

uniform float ambientReflectionCoef;
uniform float diffuseReflectionCoef;  
uniform float specularReflectionCoef; 
uniform float externalAlpha;
uniform bool bApplyShadow;
uniform float shadowMapWidth;    
uniform float shadowMapHeight;
varying vec3 v3Pos;

varying vec4 vPosRelToLight; 
varying vec3 vLightDir; 
varying vec3 vNormalWC;
varying float currSunIdx;

const float equatorialRadius = 6378137.0;
const float polarRadius = 6356752.3142;

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
//float getDepth(vec2 coord)
//{
//    return unpackDepth(texture2D(depthTex, coord.xy));
//}  

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

void main()
{           
	if(bIsMakingDepth)
	{
		gl_FragColor = packDepth(-depthValue);
	}
	else{
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
					
					float depthRelToLight = getDepthShadowMap(posRelToLight.xy);
					if(posRelToLight.z > depthRelToLight*tolerance )
					{
						shadow_occlusion = 0.5;
					}
					
				}
			}
		}
	
		vec4 textureColor;
		if(colorType == 0)
		{
			textureColor = oneColor4;
			
			if(textureColor.w == 0.0)
			{
				discard;
			}
		}
		else if(colorType == 2)
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
		else{
			textureColor = oneColor4;
		}
		
		//vec3 ambientColor = vec3(textureColor.x, textureColor.y, textureColor.z);
		//gl_FragColor = vec4(textureColor.xyz, externalAlpha); 
		textureColor.w = externalAlpha;
		vec4 fogColor = vec4(0.9, 0.9, 0.9, 1.0);
		float fogParam = v3Pos.z/(far - 100000.0);
		float fogParam2 = fogParam*fogParam;
		float fogAmount = fogParam2*fogParam2;
		vec4 finalColor = mix(textureColor, fogColor, fogAmount); 
		gl_FragColor = vec4(finalColor.xyz * shadow_occlusion, 1.0);
		
		//if(currSunIdx > 0.0 && currSunIdx < 1.0 && shadow_occlusion<0.9)gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
	}
}