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

 
uniform sampler2D diffuseTex;
uniform bool textureFlipYAxis;  
uniform vec4 oneColor4;

//uniform bool bApplyScpecularLighting;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

uniform float externalAlpha;
uniform vec4 colorMultiplier;
uniform bool bUseLogarithmicDepth;
uniform bool bUseMultiRenderTarget;
uniform int uFrustumIdx;

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

// Code color for selection:
uniform vec4 uSelColor4;

varying vec3 vNormal;
varying vec4 vColor4; // color from attributes
varying vec2 vTexCoord;   

varying vec3 vertexPos; // this is the orthoPos.***
varying vec3 vertexPosLC;


varying float flogz;
varying float Fcoef_half;
varying float depth;

vec4 packDepth( float v ) {
  vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
  enc = fract(enc);
  enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
  return enc;
}

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
} 

vec3 encodeNormal(in vec3 normal)
{
	return normal*0.5 + 0.5;
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


void main()
{
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
	
	float depthAux = depth;

	#ifdef USE_LOGARITHMIC_DEPTH
	if(bUseLogarithmicDepth)
	{
		gl_FragDepthEXT = log2(flogz) * Fcoef_half;
		depthAux = gl_FragDepthEXT; 
	}
	#endif

	vec4 albedo4 = vec4(textureColor.xyz, 1.0);
	gl_FragData[0] = albedo4; // anything.

	#ifdef USE_MULTI_RENDER_TARGET
	if(bUseMultiRenderTarget)
	{
		// save depth, normal, albedo.
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


	
}