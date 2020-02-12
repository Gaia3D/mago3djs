attribute vec4 position;
attribute vec2 texCoord;
uniform mat4 buildingRotMatrix;
uniform mat4 modelViewMatrixRelToEye;  
uniform mat4 ModelViewProjectionMatrixRelToEye;  
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec2 scale2d;
//uniform float screenWidth;    
//uniform float screenHeight;
varying vec2 v_texcoord;

void main()
{
    vec4 position2 = vec4(position.xyz, 1.0);
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
	float order_w = position.w;
	float sense = 1.0;
	int orderInt = 0;
	if(order_w > 0.0)
	{
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
		sense = 1.0;
		if(order_w > -1.5)
		{
			orderInt = -1;
		}
		else{
			orderInt = -2;
		}
	}
	
    v_texcoord = texCoord;
	vec4 projected = ModelViewProjectionMatrixRelToEye * pos4;
	//vec4 projected2 = modelViewMatrixRelToEye * pos4;
	float thickness = 30.0;
	vec4 offset;
	float projectedDepth = projected.w;
	float offsetQuantity = (thickness*projectedDepth)/1000.0;
	// Offset our position along the normal
	if(orderInt == 1)
	{
		offset = vec4(-offsetQuantity*scale2d.x, 0.0, 0.0, 1.0);
	}
	else if(orderInt == -1)
	{
		offset = vec4(offsetQuantity*scale2d.x, 0.0, 0.0, 1.0);
	}
	else if(orderInt == 2)
	{
		offset = vec4(-offsetQuantity*scale2d.x, offsetQuantity*4.0*scale2d.y, 0.0, 1.0);
	}
	else if(orderInt == -2)
	{
		offset = vec4(offsetQuantity*scale2d.x, offsetQuantity*4.0*scale2d.y, 0.0, 1.0);
	}

	gl_Position = projected + offset; 
}
