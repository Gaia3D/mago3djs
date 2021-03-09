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
uniform sampler2D noiseTex;  
uniform sampler2D diffuseTex;
uniform sampler2D shadowMapTex;
uniform sampler2D shadowMapTex2;
uniform sampler2D ssaoFromDepthTex;
uniform bool textureFlipYAxis;
uniform mat4 projectionMatrix;
uniform mat4 projectionMatrixInv;
uniform mat4 modelViewMatrixRelToEyeInv;

uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

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
uniform float externalAlpha; // used by effects.
uniform float uModelOpacity; // this is model's alpha.
uniform vec4 colorMultiplier;
uniform bool bUseLogarithmicDepth;

// clipping planes.***
uniform mat4 clippingPlanesRotMatrix; 
uniform vec3 clippingPlanesPosHIGH;
uniform vec3 clippingPlanesPosLOW;
uniform bool bApplyClippingPlanes; // old. deprecated.***
uniform int clippingType; // 0= no clipping. 1= clipping by planes. 2= clipping by localCoord polyline. 3= clip by heights, 4= clip by (2, 3)
uniform int clippingPlanesCount;
uniform vec4 clippingPlanes[6];
uniform vec2 clippingPolygon2dPoints[64];
uniform int clippingConvexPolygon2dPointsIndices[64];
uniform vec4 limitationInfringedColor4;
uniform vec2 limitationHeights;

uniform int uFrustumIdx;
// Code color for selection:
uniform vec4 uSelColor4;

varying vec3 vNormal;
varying vec4 vColor4; // color from attributes
varying vec2 vTexCoord;   
varying vec3 vLightWeighting;
varying vec3 diffuseColor;
varying vec3 vertexPos; // this is the orthoPos.***
varying vec3 vertexPosLC;
varying float applySpecLighting;
varying vec4 vPosRelToLight; 
varying vec3 vLightDir; 
varying vec3 vNormalWC;
varying float currSunIdx; 
varying float vDepth;

varying float flogz;
varying float Fcoef_half;

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***
    float depthAux = dot(rgba_depth, bit_shift);
    return depthAux;
}  

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
}

/*
// unpack depth used for shadow on screen.***
float unpackDepth_A(vec4 packedDepth)
{
	// See Aras Pranckevičius' post Encoding Floats to RGBA
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
*/

float UnpackDepth32( in vec4 pack )
{
	float depth = dot( pack, vec4(1.0, 0.00390625, 0.000015258789, 0.000000059605) );
    return depth * 1.000000059605;// 1.000000059605 = (16777216.0) / (16777216.0 - 1.0);
}             

vec3 getViewRay(vec2 tc)
{
	float hfar = 2.0 * tangentOfHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
}         
            
float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z;

		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = flogzAux - 1.0;
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
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

vec2 getDirection2d(in vec2 startPoint, in vec2 endPoint)
{
	//vec2 vector = endPoint - startPoint;
	//float length = length( vector);
	//vec2 dir = vec2(vector.x/length, vector.y/length);
	vec2 dir = normalize(endPoint - startPoint);
	return dir;
}

bool intersectionLineToLine(in vec2 line_1_pos, in vec2 line_1_dir,in vec2 line_2_pos, in vec2 line_2_dir, out vec2 intersectionPoint2d)
{
	bool bIntersection = false;

	float zero = 10E-8;
	float intersectX;
	float intersectY;

	// check if 2 lines are parallel.***
	float dotProd = abs(dot(line_1_dir, line_2_dir));
	if(abs(dotProd-1.0) < zero)
	return false;

	if (abs(line_1_dir.x) < zero)
	{
		// this is a vertical line.
		float slope = line_2_dir.y / line_2_dir.x;
		float b = line_2_pos.y - slope * line_2_pos.x;
		
		intersectX = line_1_pos.x;
		intersectY = slope * line_1_pos.x + b;
		bIntersection = true;
	}
	else if (abs(line_1_dir.y) < zero)
	{
		// this is a horizontal line.
		// must check if the "line" is vertical.
		if (abs(line_2_dir.x) < zero)
		{
			// "line" is vertical.
			intersectX = line_2_pos.x;
			intersectY = line_1_pos.y;
			bIntersection = true;
		}
		else 
		{
			float slope = line_2_dir.y / line_2_dir.x;
			float b = line_2_pos.y - slope * line_2_pos.x;
			
			intersectX = (line_1_pos.y - b)/slope;
			intersectY = line_1_pos.y;
			bIntersection = true;
		}	
	}
	else 
	{
		// this is oblique.
		if (abs(line_2_dir.x) < zero)
		{
			// "line" is vertical.
			float mySlope = line_1_dir.y / line_1_dir.x;
			float myB = line_1_pos.y - mySlope * line_1_pos.x;
			intersectX = line_2_pos.x;
			intersectY = intersectX * mySlope + myB;
			bIntersection = true;
		}
		else 
		{
			float mySlope = line_1_dir.y / line_1_dir.x;
			float myB = line_1_pos.y - mySlope * line_1_pos.x;
			
			float slope = line_2_dir.y / line_2_dir.x;
			float b = line_2_pos.y - slope * line_2_pos.x;
			
			intersectX = (myB - b)/ (slope - mySlope);
			intersectY = slope * intersectX + b;
			bIntersection = true;
		}
	}

	intersectionPoint2d.x = intersectX;
	intersectionPoint2d.y = intersectY;

	return bIntersection;
}

vec2 getProjectedPoint2dToLine(in vec2 line_point, in vec2 line_dir, in vec2 point)
{
	bool intersection = false;

	// create a perpendicular left line.***
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);
	vec2 lineLeft_point = vec2(point.x, point.y);
	vec2 projectedPoint = vec2(0);
	intersection = intersectionLineToLine(line_point, line_dir, lineLeft_point, lineLeft_dir, projectedPoint);

	return projectedPoint;
}

int getRelativePositionOfPointToLine(in vec2 line_pos, in vec2 line_dir, vec2 point)
{
	// 0 = coincident. 1= left side. 2= right side.***
	int relPos = -1;

	vec2 projectedPoint = getProjectedPoint2dToLine(line_pos, line_dir, point );
	float dist = length(point - projectedPoint);

	if(dist < 1E-8)
	{
		relPos = 0; // the point is coincident to line.***
		return relPos;
	}

	vec2 myVector = normalize(point - projectedPoint);
	vec2 lineLeft_dir = vec2(-line_dir.y, line_dir.x);

	float dotProd = dot(lineLeft_dir, myVector);

	if(dotProd > 0.0)
	{
		relPos = 1; // is in left side of the line.***
	}
	else
	{
		relPos = 2; // is in right side of the line.***
	}

	return relPos;
}

bool isPointInsideLimitationConvexPolygon(in vec2 point2d)
{
	bool isInside = true;

	// Check polygons.***
	int startIdx = -1;
	int endIdx = -1;
	for(int i=0; i<32; i++)
	{
		startIdx = clippingConvexPolygon2dPointsIndices[2*i];  // 0
		endIdx = clippingConvexPolygon2dPointsIndices[2*i+1];	 // 3

		if(startIdx < 0 || endIdx < 0)
		break;

		isInside  = true;
		
		isInside = true;
		vec2 pointStart = clippingPolygon2dPoints[0];
		for(int j=0; j<32; j++)
		{
			if(j > endIdx)
			break;

			if(j == startIdx)
				pointStart = clippingPolygon2dPoints[j];

			if(j >= startIdx && j<endIdx)
			{
				vec2 point0;
				vec2 point1;
				
				if(j == endIdx)
				{
					point0 = clippingPolygon2dPoints[j];
					point1 = pointStart;
				}
				else
				{
					point0 = clippingPolygon2dPoints[j];
					point1 = clippingPolygon2dPoints[j+1];
				}

				// create the line of the segment.***
				vec2 dir = getDirection2d(point0, point1);

				// now, check the relative position of the point with the edge line.***
				int relPos = getRelativePositionOfPointToLine(point0, dir, point2d);
				if(relPos == 2)
				{
					// the point is in the right side of the edge line, so is out of the polygon.***
					isInside = false;
					break;
				}
			}

		}
		

		if(isInside)
		return true;

	}

	return isInside;
}



/*

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
	for(float i=0.0; i<1.0; i++)
	{
		depthA += getDepth(texCoord + offset1*(1.0+i));
		depthB += getDepth(texCoord + offset2*(1.0+i));
	}

	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);

    vec3 pos0 = reconstructPosition(texCoord, depth);
    vec3 normal = cross(posA - pos0, posB - pos0);
    normal.z = -normal.z;

    return normalize(normal);
}

mat3 sx = mat3( 
    1.0, 2.0, 1.0, 
    0.0, 0.0, 0.0, 
    -1.0, -2.0, -1.0 
);
mat3 sy = mat3( 
    1.0, 0.0, -1.0, 
    2.0, 0.0, -2.0, 
    1.0, 0.0, -1.0 
);

bool isEdge()
{
	vec3 I[3];
	vec2 screenPos = vec2((gl_FragCoord.x) / screenWidth, (gl_FragCoord.y) / screenHeight);
	float linearDepth = getDepth(screenPos);
	vec3 normal = normal_from_depth(linearDepth, screenPos);

    for (int i=0; i<3; i++) {
        //vec3 norm1 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,-1), 0 ).rgb * 2.0f - 1.0f;
        //vec3 norm2 =  texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,0), 0 ).rgb * 2.0f - 1.0f;
        //vec3 norm3 = texelFetch(normalTexture, ivec2(gl_FragCoord) + ivec2(i-1,1), 0 ).rgb * 2.0f - 1.0f;
		vec2 screenPos1 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-1.0) / screenHeight);
		float linearDepth1 = getDepth(screenPos1);  

		vec2 screenPos2 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y-0.0) / screenHeight);
		float linearDepth2 = getDepth(screenPos2);  

		vec2 screenPos3 = vec2((gl_FragCoord.x+float(i-1)) / screenWidth, (gl_FragCoord.y+1.0) / screenHeight);
		float linearDepth3 = getDepth(screenPos1);  

		vec3 norm1 = normal_from_depth(linearDepth1, screenPos1);
        vec3 norm2 =  normal_from_depth(linearDepth2, screenPos2);
        vec3 norm3 = normal_from_depth(linearDepth3, screenPos3);
        float sampleValLeft  = dot(normal, norm1);
        float sampleValMiddle  = dot(normal, norm2);
        float sampleValRight  = dot(normal, norm3);
        I[i] = vec3(sampleValLeft, sampleValMiddle, sampleValRight);
    }

    float gx = dot(sx[0], I[0]) + dot(sx[1], I[1]) + dot(sx[2], I[2]); 
    float gy = dot(sy[0], I[0]) + dot(sy[1], I[1]) + dot(sy[2], I[2]);

    if((gx < 0.0 && gy < 0.0) || (gy < 0.0 && gx < 0.0) ) 
        return false;
	float g = sqrt(pow(gx, 2.0)+pow(gy, 2.0));

    if(g > 0.2) {
        return true;
    } 
	return false;
}
*/


void main()
{
	//gl_FragData = vColor4; 
	//return;

	if(clippingType == 2)
	{
		// clip by limitationPolygon.***
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);
		if(!isPointInsideLimitationConvexPolygon(pointLC))
		{
			gl_FragData[0] = limitationInfringedColor4; 
			return;
		}
	}
	else if(clippingType == 3)
	{
		// check limitation heights.***
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)
		{
			gl_FragData[0] = limitationInfringedColor4; 
			return;
		}
	}
	else if(clippingType == 4)
	{
		// clip by limitationPolygon & heights.***
		vec2 pointLC = vec2(vertexPosLC.x, vertexPosLC.y);
		if(!isPointInsideLimitationConvexPolygon(pointLC))
		{
			gl_FragData[0] = limitationInfringedColor4; 
			return;
		}
		if(vertexPosLC.z < limitationHeights.x || vertexPosLC.z > limitationHeights.y)
		{
			gl_FragData[0] = limitationInfringedColor4; 
			return;
		}
	}

	// Check if clipping.********************************************
	
	if(bApplyClippingPlanes)
	{
		bool discardFrag = false;
		for(int i=0; i<6; i++)
		{
			vec4 plane = clippingPlanes[i];
			
			// calculate any point of the plane.
			if(!clipVertexByPlane(plane, vertexPos))
			{
				discardFrag = false; // false.
				break;
			}
			if(i >= clippingPlanesCount)
			break;
		}
		
	}
	
	//----------------------------------------------------------------

	//bool testBool = false;
	float occlusion = 1.0; // ambient occlusion.***
	float shadow_occlusion = 1.0;
	vec3 normal2 = vNormal;	
	float scalarProd = 1.0;
	
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
	//float linearDepth = getDepth(screenPos);   
	vec3 ray = getViewRay(screenPos); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
	scalarProd = abs(dot(normal2, normalize(-ray)));
	//scalarProd *= scalarProd;
	scalarProd *= 0.6;
	scalarProd += 0.4;

	occlusion = 1.0;

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
        textureColor = vColor4;
    }
	
    // Do specular lighting.***
	float lambertian = 1.0;
	float specular = 0.0;

	//if((textureColor.r < 0.5 && textureColor.b > 0.5) || textureColor.a < 1.0)

	lambertian = 1.0;
	
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

	
	// New lighting.***********************************************************************************************
	vec3 ambientColor = vec3(0.6);
	vec3 directionalLightColor = vec3(0.9, 0.9, 0.9);
	vec3 lightingDirection = normalize(vec3(0.6, 0.6, 0.6));
	float directionalLightWeighting = max(dot(vNormal, lightingDirection), 0.0);
	vec3 lightWeighting = ambientColor + directionalLightColor * directionalLightWeighting; // original.***
	// End lighting.-------------------------------------------------------------------------------------------------
	
	
	float alfa = textureColor.w * externalAlpha * uModelOpacity;
    vec4 finalColor;
	finalColor = vec4(textureColor.r, textureColor.g, textureColor.b, alfa);
	finalColor *= vec4(lightWeighting, 1.0) ;
	finalColor *= colorMultiplier;

	vec4 albedo4 = finalColor;
    gl_FragData[0] = finalColor; 

	#ifdef USE_MULTI_RENDER_TARGET
	//if(bUseMultiRenderTarget)
	{
		// save depth, normal, albedo.
		float depthAux = vDepth;
		gl_FragData[1] = packDepth(depthAux); 

		// When render with cull_face disabled, must correct the faces normal.
		float frustumIdx = 1.0;
		if(uFrustumIdx == 0)
		frustumIdx = 0.005;
		else if(uFrustumIdx == 1)
		frustumIdx = 0.015;
		else if(uFrustumIdx == 2)
		frustumIdx = 0.025;
		else if(uFrustumIdx == 3)
		frustumIdx = 0.035;

		vec3 normal = vNormal;

		vec3 encodedNormal = encodeNormal(normal);
		gl_FragData[2] = vec4(encodedNormal, frustumIdx); // save normal.***

		// albedo.
		gl_FragData[3] = albedo4; 

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