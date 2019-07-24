#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D noiseTex;  
uniform sampler2D diffuseTex;
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
varying vec3 v3Pos;
varying vec3 camPos;

const int kernelSize = 16;  
uniform float radius;      

uniform float ambientReflectionCoef;
uniform float diffuseReflectionCoef;  
uniform float specularReflectionCoef; 
uniform float externalAlpha;
const float equatorialRadius = 6378137.0;
const float polarRadius = 6356752.3142;
const float PI = 3.1415926535897932384626433832795;
const float PI_2 = 1.57079632679489661923; 
const float PI_4 = 0.785398163397448309616;

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
} 

vec4 packDepth(const in float depth)
{
    const vec4 bit_shift = vec4(16777216.0, 65536.0, 256.0, 1.0);
    const vec4 bit_mask  = vec4(0.0, 0.00390625, 0.00390625, 0.00390625); 
    vec4 res = fract(depth * bit_shift);
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
    return unpackDepth(texture2D(depthTex, coord.xy));
}    

void main()
{  
	float camElevation = length(camPos) - equatorialRadius;
	if(v3Pos.z > equatorialRadius + camElevation - 1400000.0)
		discard;
	
	if(bIsMakingDepth)
	{
		gl_FragColor = packDepth(-depthValue);
	}
	else{
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
		// Calculate the angle between camDir & vNormal.***
		//vec3 camDir = normalize(v3Pos);
		vec3 normal = normalize(-v3Pos);
		vec3 camDir = normalize(v3Pos - camPos);
		float alpha = 1.0 - (far - v3Pos.z)/far;
		alpha = 1.0;
		float angRad = acos(dot(camDir, normal));
		float angDeg = angRad*180.0/PI;
		textureColor.xyz *= (equatorialRadius + 500.0)/equatorialRadius;
		if(angDeg > 160.0)
			textureColor = vec4(1.0, 0.0, 0.0, 1.0);
		float pixelElevation = length(v3Pos) - equatorialRadius;
		float maxAngDeg = 120.0;
		if(camElevation > 200000.0)
		{
			//float factor = 1.0/(maxAngDeg-90.0)*angDeg - 90.0*(1.0/maxAngDeg-90.0);
			//if(factor < 0.0)
			//factor = 0.0;
			//alpha *= factor;
			
		}
		else{
			
		}

		gl_FragColor = vec4(textureColor.xyz, alpha); 
	}
}