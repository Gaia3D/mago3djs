#ifdef GL_ES
    precision highp float;
#endif

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

uniform sampler2D depthTex;
uniform sampler2D normalTex;
uniform mat4 projectionMatrix;
uniform float tangentOfHalfFovy;
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

uniform bool bUseLogarithmicDepth;
uniform vec2 uNearFarArray[4];
uniform bool bUseMultiRenderTarget;
uniform int uFrustumIdx;
// Code color for selection:
uniform vec4 uSelColor4;

varying float flogz;
varying float Fcoef_half;
varying float depth;

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
}

vec3 decodeNormal(in vec3 normal)
{
	return normal * 2.0 - 1.0;
}

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

void main()
{
	vec2 pt = gl_PointCoord - vec2(0.5);
	if(pt.x*pt.x+pt.y*pt.y > 0.25)
	{
		discard;
	}
	
	float occlusion = 1.0;
	float lighting = 0.0;
	bool testBool = false;
	vec4 colorAux = vec4(1.0, 1.0, 1.0, 1.0);

	if(lighting < 0.5)
	lighting = 0.0;

	//vec3 fogColor = vec3(1.0, 1.0, 1.0);
	vec3 fogColor = vec3(0.0, 0.0, 0.0);
	vec3 finalFogColor = mix(vColor.xyz, fogColor, 0.0);

    vec4 finalColor;
	finalColor = vec4(finalFogColor * occlusion, externalAlpha);

    gl_FragData[0] = finalColor; // original.***

	#ifdef USE_MULTI_RENDER_TARGET
	if(bUseMultiRenderTarget)
	{
		//if(!bUseLogarithmicDepth)
		//{
			gl_FragData[1] = packDepth(depth);
		//}

		// Note: points cloud data has frustumIdx 20 .. 23.********
		float frustumIdx = 0.1; // realFrustumIdx = 0.1 * 100 = 10. 
		
		if(uFrustumIdx == 0)
		frustumIdx = 0.205; // frustumIdx = 20.***
		else if(uFrustumIdx == 1)
		frustumIdx = 0.215; // frustumIdx = 21.***
		else if(uFrustumIdx == 2)
		frustumIdx = 0.225; // frustumIdx = 22.***
		else if(uFrustumIdx == 3)
		frustumIdx = 0.235; // frustumIdx = 23.***

		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***

		// now, albedo.
		gl_FragData[3] = vColor; 

		// selColor4 (if necessary).
		gl_FragData[4] = uSelColor4; 
	}
	#endif

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	}
	#endif

}