precision highp float;


#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

varying vec2 v_texcoord;
uniform bool textureFlipYAxis;
uniform sampler2D u_texture;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.
uniform vec4 oneColor4;

uniform vec2 imageSize;
uniform int uFrustumIdx;


varying vec2 imageSizeInPixels;
varying float vDepth;

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

void make_kernel(inout vec4 n[9], vec2 coord)
{
	float w = 1.0 / imageSize.x;
	float h = 1.0 / imageSize.y;

	n[0] = texture2D(u_texture, coord + vec2( -w, -h));
	n[1] = texture2D(u_texture, coord + vec2(0.0, -h));
	n[2] = texture2D(u_texture, coord + vec2(  w, -h));
	n[3] = texture2D(u_texture, coord + vec2( -w, 0.0));
	n[4] = texture2D(u_texture, coord);
	n[5] = texture2D(u_texture, coord + vec2(  w, 0.0));
	n[6] = texture2D(u_texture, coord + vec2( -w, h));
	n[7] = texture2D(u_texture, coord + vec2(0.0, h));
	n[8] = texture2D(u_texture, coord + vec2(  w, h));
}

void main()
{
    vec4 textureColor;
	vec2 finalTexCoord = v_texcoord;

	// 1rst, check if the texture.w != 0.
	if(textureFlipYAxis)
	{
		finalTexCoord = vec2(v_texcoord.s, 1.0 - v_texcoord.t);
	}
	
	textureColor = texture2D(u_texture, finalTexCoord);

	if(textureColor.w == 0.0)
	{
		discard;
	}

	// now, check neibourgh pixels to determine a silhouette.***
	//if(textureColor.a == 0.0)
	//{
	//	vec4 n[9];
	//	make_kernel(n, finalTexCoord);
	//
	//	for(int i=0; i<9; i++)
	//	{
	//		// check if exist one or more neibourgh pixel with alpha != 0.0.***
	//		if(n[i].a > 0.0)
	//		{
	//			textureColor = vec4(1.0, 1.0, 1.0, 0.5);
	//			break;
	//		}
	//	}
	//}
	


	if(colorType == 2)
	{
		// do nothing.
	}
	else if( colorType == 0)
	{
		textureColor = oneColor4;
	}

    //gl_FragColor = textureColor;
	gl_FragData[0] = textureColor;

	#ifdef USE_MULTI_RENDER_TARGET
		gl_FragData[1] = packDepth(0.0);
		//gl_FragData[1] = packDepth(vDepth);
		
		// Note: points cloud data has frustumIdx 20 .. 23.********
		float frustumIdx = 0.005; // frustum zero.
		
		if(uFrustumIdx == 0)
		frustumIdx = 0.005; // frustumIdx = 20.***
		else if(uFrustumIdx == 1)
		frustumIdx = 0.015; // frustumIdx = 21.***
		else if(uFrustumIdx == 2)
		frustumIdx = 0.025; // frustumIdx = 22.***
		else if(uFrustumIdx == 3)
		frustumIdx = 0.035; // frustumIdx = 23.***

		vec3 normal = encodeNormal(vec3(0.0, 0.0, 1.0));
		gl_FragData[2] = vec4(normal, frustumIdx); // save normal.***

		// now, albedo.
		gl_FragData[3] = textureColor; 
	#endif

	#ifdef USE_LOGARITHMIC_DEPTH
	//if(bUseLogarithmicDepth)
	//{
	//	gl_FragDepthEXT = log2(flogz) * Fcoef_half;
	//}
	#endif
}