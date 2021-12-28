

#define M_PI 3.1415926535897932384626433832795

#define %USE_GL_EXT_FRAGDEPTH%
#ifdef USE_GL_EXT_FRAGDEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

//#ifdef GL_ES
    precision highp float;
//#endif

uniform sampler2D depthTex; // 0
uniform sampler2D normalTex; // 1
uniform sampler2D albedoTex; // 2

uniform mat4 modelViewMatrixRelToEyeInv;
uniform mat4 projectionMatrixInv;
uniform mat4 normalMatrix4;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

uniform float near;
uniform float far; 

uniform float screenWidth;    
uniform float screenHeight;  
uniform int uFrustumIdx;

// This shader is used only to copy depth, normal  or albedo of Cesium.***
// A uniform to use if is NO MRT.***************************************************
// If we are in NO MRT, then, must choose what type of texture we are going to copy:
uniform int u_textureTypeToCopy; // 0 = depth. 1 = normal. 2 = color.
//----------------------------------------------------------------------------------

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

float unpackDepth(vec4 packedDepth)
{
	// See Aras Pranckevičius' post Encoding Floats to RGBA
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
	//vec4 packDepth( float v ) // function to packDepth.***
	//{
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
	//	enc = fract(enc);
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);
	//	return enc;
	//}
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
} 

float getDepthFrom_ZWindow(float zWindow, vec2 screenPos, inout vec4 posWC)
{
	float depth = 0.0;

	// https://stackoverflow.com/questions/11277501/how-to-recover-view-space-position-given-view-space-depth-value-and-ndc-xy
	float depthRange_near = 0.0;
	float depthRange_far = 1.0;
	float x_ndc = 2.0 * screenPos.x - 1.0;
	float y_ndc = 2.0 * screenPos.y - 1.0;
	float z_ndc = (2.0 * zWindow - depthRange_near - depthRange_far) / (depthRange_far - depthRange_near);
	// Note: NDC range = (-1,-1,-1) to (1,1,1).***
	
	vec4 viewPosH = projectionMatrixInv * vec4(x_ndc, y_ndc, z_ndc, 1.0);
	vec3 posCC = viewPosH.xyz/viewPosH.w;
	posWC = modelViewMatrixRelToEyeInv * vec4(posCC.xyz, 1.0) + vec4((encodedCameraPositionMCHigh + encodedCameraPositionMCLow).xyz, 1.0);
	//------------------------------------------------------------------------------------------------------------------------------

	depth = -posCC.z/far;

	return depth;
}

void main()
{
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);

	#ifdef USE_MULTI_RENDER_TARGET

		vec4 albedo = texture2D(albedoTex, screenPos.xy);

		// in this case, do not other process.
		// 1rst, calculate the pixelPosWC.
		vec4 depthColor4 = texture2D(depthTex, screenPos.xy);
		float z_window  = unpackDepth(depthColor4); // z_window  is [-1.0, 1.0] range depth, but only uses [0.0, 1.0] range.***

		vec4 posWC;
		float depth = getDepthFrom_ZWindow(z_window, screenPos, posWC);

		//if(z_window >= 1.0) {
		//	discard;
		//}

		float frustumIdx = 1.0;
		if(uFrustumIdx == 0)
		frustumIdx = 0.105;
		else if(uFrustumIdx == 1)
		frustumIdx = 0.115;
		else if(uFrustumIdx == 2)
		frustumIdx = 0.125;
		else if(uFrustumIdx == 3)
		frustumIdx = 0.135;

		bool bDiscard = false;

		//************************
		// z_window = 1.0 -> near
		// z_window = 0.0 -> far
		//------------------------

		if(z_window <= 0.0 && uFrustumIdx < 2) {
			// frustum =2 & 3 -> renders sky, so dont discard.
			discard;
		}

		gl_FragData[0] = packDepth(depth); // depth.
					

		//#ifdef USE_GL_EXT_FRAGDEPTH
			//gl_FragDepthEXT = z_window;
		//#endif
		

		if(z_window > 0.0)
		{
			vec4 normal4WC = vec4(normalize(posWC.xyz), 1.0);
			vec4 normal4 = normalMatrix4 * normal4WC;
			vec3 encodedNormal = encodeNormal(normal4.xyz);
			gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***
		}
		else
		{
			vec3 encodedNormal = encodeNormal(vec3(0.0, 0.0, 1.0));
			gl_FragData[1] = vec4(encodedNormal, frustumIdx); // save normal.***
		}

		// Now, save the albedo.
		gl_FragData[2] = albedo; // copy albedo.
		

	
	#else
		// We are in ORT (one rendering target).
		if(u_textureTypeToCopy == 0)
		{
			// Depth.***
			vec4 depthColor4 = texture2D(depthTex, screenPos.xy);
			float z_window  = unpackDepth(depthColor4); // z_window  is [-1.0, 1.0] range depth.

			if(z_window >= 1.0) {
				discard;
			}

			if(z_window <= 0.0 && uFrustumIdx < 2) {
				// frustum =2 & 3 -> renders sky, so dont discard.
				discard;
			}

			vec4 posWC;
			float depth = getDepthFrom_ZWindow(z_window, screenPos, posWC);
			gl_FragData[0] = packDepth(depth); // depth.
		}
		else if ( u_textureTypeToCopy == 1)
		{
			vec4 depthColor4 = texture2D(depthTex, screenPos.xy);
			float z_window  = unpackDepth(depthColor4); // z_window  is [-1.0, 1.0] range depth.

			if(z_window >= 1.0) {
				discard;
			}

			if(z_window <= 0.0 && uFrustumIdx < 2) {
				// frustum =2 & 3 -> renders sky, so dont discard.
				discard;
			}

			vec4 posWC;
			float depth = getDepthFrom_ZWindow(z_window, screenPos, posWC);
			
			// Normal.***
			float frustumIdx = 1.0;
			if(uFrustumIdx == 0)
			frustumIdx = 0.105;
			else if(uFrustumIdx == 1)
			frustumIdx = 0.115;
			else if(uFrustumIdx == 2)
			frustumIdx = 0.125;
			else if(uFrustumIdx == 3)
			frustumIdx = 0.135;

			if(z_window > 0.0)
			{
				vec4 normal4WC = vec4(normalize(posWC.xyz), 1.0);
				vec4 normal4 = normalMatrix4 * normal4WC;
				vec3 encodedNormal = encodeNormal(normal4.xyz);
				gl_FragData[0] = vec4(encodedNormal, frustumIdx); // save normal.***
			}
			else
			{
				vec3 encodedNormal = encodeNormal(vec3(0.0, 0.0, 1.0));
				gl_FragData[0] = vec4(encodedNormal, frustumIdx); // save normal.***
			}
		}
		else if(u_textureTypeToCopy == 2)
		{
			// Albedo.***
			vec4 albedo = texture2D(albedoTex, screenPos.xy);
			gl_FragData[0] = albedo;
		}
		
	#endif

	return;

}