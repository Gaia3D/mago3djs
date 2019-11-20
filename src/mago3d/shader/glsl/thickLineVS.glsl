attribute vec4 prev;
attribute vec4 current;
attribute vec4 next;
attribute float order;
uniform float thickness;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec2 viewport;

const float C = 0.1;
const float far = 149.6e+9;
float logc = 2.0 / log( C * far + 1.0 );

const float NEAR = -1.0;
const float error = 0.001;

// based on https://weekly-geekly.github.io/articles/331164/index.html
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

void main(){
	
	vec4 vCurrent = modelViewMatrix * vec4(current.xyz, 1.0);
	//vec4 vPrev = modelViewMatrix * vec4(prev.xyz, 1.0);
	//vec4 vNext = modelViewMatrix * vec4(next.xyz, 1.0);
	
	float order_w = current.w;
	
	//vec3 dir = normalize(vec3(vNext.xyz - vCurrent.xyz));
	//vec3 offSetDir = vec3();
	float sense = 1.0;
	int orderInt = 0;
	if(order_w > 0.0)
	{
		sense = 1.0;
		if(isEqual(order_w, 1.0))
		{
			// order is 1.***
			orderInt = 1;
		}
		else{
			// order is 2.***
			orderInt = 2;
		}
	}
	else
	{
		sense = -1.0;
		if(isEqual(order_w, -1.0))
		{
			// order is -1.***
			orderInt = -1;
		}
		else{
			// order is -2.***
			orderInt = -2;
		}
	}
	
	float aspect = viewport.x / viewport.y;
	vec2 aspectVec = vec2(aspect, 1.0);
	mat4 projViewModel = projectionMatrix * modelViewMatrix;
	
	// Project all of our points to model space
	vec4 previousProjected = projViewModel * vec4(prev.xyz, 1.0);
	vec4 currentProjected = projViewModel * vec4(current.xyz, 1.0);
	vec4 nextProjected = projViewModel * vec4(next.xyz, 1.0);
	
	// Pass the projected depth to the fragment shader
	//projectedDepth = currentProjected.w;                
	// Get 2D screen space with W divide and aspect correction
	vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;
	vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;
	vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;
					
	// Use the average of the normals
	// This helps us handle 90 degree turns correctly
	vec2 tangentNext = normalize(nextScreen - currentScreen);
	vec2 tangentPrev = normalize(currentScreen - previousScreen);
	vec2 averageTangent = normalize(tangentNext + tangentPrev);
	vec2 normal = vec2(-averageTangent.y, averageTangent.x);
	if(orderInt == 1 || orderInt == -1)
	{
		normal = tangentNext;
	}
	else{
		normal = tangentPrev;
	}
	normal *= thickness/2.0;
	normal.x /= aspect;
	//edgeiness = direction;
	float direction = thickness*sense*vCurrent.z*0.005;
	//direction *= 100.0;
	// Offset our position along the normal
	vec4 offset = vec4(normal * direction, 0.0, 1.0);
	gl_Position = currentProjected + offset; 
}