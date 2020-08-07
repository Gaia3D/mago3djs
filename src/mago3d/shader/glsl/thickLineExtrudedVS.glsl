
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
uniform float uExtrudeHeight;

varying vec4 vColor;
varying float flogz;
varying float Fcoef_half;

const float error = 0.001;

// see https://weekly-geekly.github.io/articles/331164/index.html
// see too https://github.com/ridiculousfish/wavefiz/blob/master/ts/polyline.ts#L306

//                                   Bottom                                      Top
//       
//                        (1)                    (2)                  (3)                    (4)
//                         +-----------------------+                   +-----------------------+ 
//                         |                       |                   |                       |
//                         |                       |                   |                       |
//                         *---------------------->*                   *---------------------->*
//                         |                       |                   |                       |
//                         |                       |                   |                       |
//                         +-----------------------+                   +-----------------------+
//                         (-1)                    (-2)                (-3)                    (-4)


vec2 project(vec4 p){
	return (0.5 * p.xyz / p.w + 0.5).xy * viewport;
}

bool isEqual(float value, float valueToCompare)
{
	if(value + error > valueToCompare && value - error < valueToCompare)
	return true;
	
	return false;
}

vec4 getPointWC(in vec3 point)
{
	vec4 rotatedCurrent = buildingRotMatrix * vec4(point.xyz, 1.0);
	vec3 objPosHigh = buildingPosHIGH;
	vec3 objPosLow = buildingPosLOW.xyz + rotatedCurrent.xyz;
	return vec4(objPosHigh.xyz + objPosLow.xyz, 1.0);
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

void main()
{
	// current, prev & next.***
	vec4 vCurrent = getPointRelToEye(vec4(current.xyz, 1.0));
	vec4 vPrev = getPointRelToEye(vec4(prev.xyz, 1.0));
	vec4 vNext = getPointRelToEye(vec4(next.xyz, 1.0));

    float currW = current.w;
    float prevW = prev.w;
    float nextW = next.w;

    vec4 rotatedCurr = buildingRotMatrix * vec4(current.xyz, 1.0);
    vec4 rotatedPrev = buildingRotMatrix * vec4(prev.xyz, 1.0);
    vec4 rotatedNext = buildingRotMatrix * vec4(next.xyz, 1.0);

	float sense = 1.0;
	int orderInt = int(floor(currW + 0.1));
    int orderIntPrev = int(floor(prevW + 0.1));
    int orderIntNext = int(floor(nextW + 0.1));

    float absOrderCurr = currW > 0.0? currW : currW*-1.0;
    float absOrderPrev = prevW > 0.0? prevW : prevW*-1.0;
    float absOrderNext = nextW > 0.0? nextW : nextW*-1.0;

    float provisionalExtrudeHeght = 500.0; // provisional for debug.



    // calculate the triangle's normal. To do it, calculate prevDir & currDir.
    vec3 rotatedUp = normalize(vec3(( rotatedCurr.xyz + buildingPosLOW ) + buildingPosHIGH)); 
    vec3 rotatedPrevDir = normalize(vec3(rotatedCurr.xyz - rotatedPrev.xyz));
    vec3 rotatedNextDir = normalize(vec3(rotatedNext.xyz - rotatedCurr.xyz));

    // check if any dir is vertical.
    //float dotPrev = abs(dot(rotatedUp, rotatedPrevDir));
    //float dotCurr = abs(dot(rotatedUp, rotatedNextDir));
    vec3 rotatedDir;
    vec3 rotatedLeft;

    
    int faceType = 0; // 0= bottom, 1= rear, 2= top, 3= front, 4= left, 5= right.
    int faceTypeNext = 0;

    if(orderInt == 1)
    {
        //rotatedDir
    }
    else if(orderInt == -1)
    {

    }
    else if(orderInt == 2)
    {
        
    }
    else if(orderInt == -2)
    {
        
    }



    vec4 rotatedOffSet;

    
    //////////////////////////////////////////////////////////////////////////////////////////////////
	//float aspect = viewport.x / viewport.y;
	//vec2 aspectVec = vec2(aspect, 1.0);
	
	vec4 previousProjected = ModelViewProjectionMatrixRelToEye * vPrev;
	vec4 currentProjected = ModelViewProjectionMatrixRelToEye * vCurrent;
	vec4 nextProjected = ModelViewProjectionMatrixRelToEye * vNext;
	
	float projectedDepth = currentProjected.w;                

    vec4 rotatedPos = vec4(rotatedCurr.xyz + rotatedOffSet.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
	vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
	vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
	vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
	vec4 posCC =  vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    vec4 finalPosProjected = ModelViewProjectionMatrixRelToEye * posCC;
	gl_Position = finalPosProjected; 


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
		vColor = color4; //vec4(color4.r+0.8, color4.g+0.8, color4.b+0.8, color4.a+0.8);
	else
		vColor = oneColor4;

     // test.***
    if(orderInt == 1 || orderInt == 11 || orderInt == 21 || orderInt == 31)
    {
        vColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
    else if(orderInt == -1 || orderInt == -11 || orderInt == -21 || orderInt == -31)
    {
        vColor = vec4(0.0, 1.0, 0.0, 1.0);
    }
    else if(orderInt == 2 || orderInt == 12 || orderInt == 22 || orderInt == 32)
    {
        vColor = vec4(0.0, 1.0, 1.0, 1.0);
    }
    else if(orderInt == -2 || orderInt == -12 || orderInt == -22 || orderInt == -32)
    {
        vColor = vec4(1.0, 1.0, 0.0, 1.0);
    }

    //if(isRear )
    //{
    //    vColor = vec4(1.0, 0.0, 1.0, 1.0);
    //}
}












