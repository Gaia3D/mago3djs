
attribute vec4 prev;
attribute vec4 current;
attribute vec4 next;
attribute vec4 color4;

uniform float thickness;
uniform mat4 buildingRotMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec2 viewport;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec4 oneColor4;
uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.
uniform float near;
uniform float far;
uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;

varying vec4 vColor;
varying float flogz;
varying float Fcoef_half;
varying float vDepth;
varying float vOrder;

const float error = 0.001;

// see https://weekly-geekly.github.io/articles/331164/index.html
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306

vec2 project(vec4 p){
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;
}

bool isEqual(float value, float valueToCompare)
{
	if(value + error > valueToCompare && value - error < valueToCompare)
	return true;
	
	return false;
}

vec4 getPointRelToEye(in vec4 point)
{
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);
	vec3 objPosHigh = buildingPosHIGH;
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
	return vec4(highDifference.xyz + lowDifference.xyz, 1.0);
}

void main(){
	// current, prev & next.***
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));
	
	float order_w = current.w;
	float sense = 1.0;
	int orderInt = 0;
	if(order_w > 0.0)
	{
		// Positive order.***
		sense = -1.0;
		if(order_w < 1.5)
		{
			orderInt = 1;
		}
		else{
			orderInt = 2;
		}
	}
	else
	{
		// Negative order.***
		sense = 1.0;
		if(order_w > -1.5)
		{
			orderInt = -1;
		}
		else{
			orderInt = -2;
		}
	}

	// To render outline : vOrder.********************************************************
	// In the outLine zone, the vOrder is near to zero or near to 1, so in fragment shader
	// use this information to render outline.***
	if(orderInt == 1 || orderInt == 2)
	{
		vOrder = 0.0;
	}
	else if(orderInt == -1 || orderInt == -2)
	{
		vOrder = 1.0;
	}
	//--------------------------------------------------------------------------------------
	
	float aspect = viewport.x / viewport.y;
	vec2 aspectVec = vec2(aspect, 1.0);
	
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;

	vec4 orthoPos = modelViewMatrixRelToEye * vCurrent;
	vDepth = -orthoPos.z/far;
	
	float projectedDepth = currentProjected.w;                
	// Get 2D screen space with W divide and aspect correction

	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;
					
	// This helps us handle 90 degree turns correctly
	vec2 normal; 
	if(orderInt == 1 || orderInt == -1) // original.***
	{
		vec2 tangentPrev = normalize(currentScreen - previousScreen);
		if(previousProjected.w > 0.0)
		{
			normal = vec2(-tangentPrev.y, tangentPrev.x); // left perpendicular.***
		}
		else
		{
			normal = vec2(tangentPrev.y, -tangentPrev.x); // right perpendicular.***
		}
	}
	else
	{
		vec2 tangentNext = normalize(nextScreen - currentScreen);
		if(nextProjected.w > 0.0)
		{
			normal = vec2(-tangentNext.y, tangentNext.x); // left perpendicular.***
		}
		else
		{
			normal = vec2(tangentNext.y, -tangentNext.x); // right perpendicular.***
		}
	}
	normal *= thickness/2.0;
	normal.x /= aspect;
	float direction = (thickness * sense * projectedDepth) / 1000.0;

	// Offset our position along the normal
	vec4 offset = vec4(normal * direction, 0.0, 0.0);
	gl_Position = currentProjected + offset; 

	if(bUseLogarithmicDepth)
	{
		// logarithmic zBuffer:
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
		float Fcoef = 2.0 / log2(far + 1.0);
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * Fcoef - 1.0;

		flogz = 1.0 + gl_Position.w;
		Fcoef_half = 0.5 * Fcoef;
	}
	
	if(colorType == 0)
		vColor = oneColor4;
	else if(colorType == 1)
		vColor = color4; 
	else
	{
		// use this else to test.***
		vColor = oneColor4;

		// test debug::::
		if(orderInt == 1)
		{
			vColor = vec4(1.0, 0.0, 0.0, 1.0);
		}
		else if(orderInt == -1)
		{
			vColor = vec4(0.0, 1.0, 0.0, 1.0);
		}
		else if(orderInt == 2)
		{
			vColor = vec4(0.0, 0.0, 1.0, 1.0);
		}
		else if(orderInt == -2)
		{
			vColor = vec4(1.0, 1.0, 0.0, 1.0);
		}
	}
}












