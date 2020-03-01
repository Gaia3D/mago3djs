attribute vec4 position;
attribute vec2 texCoord;
uniform mat4 buildingRotMatrix;
uniform mat4 modelViewMatrixRelToEye;  
uniform mat4 ModelViewProjectionMatrixRelToEye;  
uniform mat4 projectionMatrix;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec2 scale2d;
uniform vec2 size2d;
uniform vec3 aditionalOffset;
uniform vec2 imageSize;
uniform float screenWidth;    
uniform float screenHeight;
uniform bool bUseOriginalImageSize;
varying vec2 v_texcoord;
varying vec2 imageSizeInPixels;

void main()
{
    vec4 position2 = vec4(position.xyz, 1.0);
    vec4 rotatedPos = buildingRotMatrix * vec4(position2.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
	//imageSizeInPixels = vec2(imageSize.x, imageSize.y);
	
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

	// Now, calculate the pixelSize in the plane of the projected point.
	float pixelWidthRatio = 2. / (screenWidth * projectionMatrix[0][0]);
	// alternative : float pixelWidthRatio = 2. / (screenHeight * projectionMatrix[1][1]);
	float pixelWidth = projected.w * pixelWidthRatio;
	
	if(projected.w < 5.0)
		pixelWidth = 5.0 * pixelWidthRatio;
	
	vec4 offset;
	float offsetX;
	float offsetY;
	if(bUseOriginalImageSize)
	{
		offsetX = pixelWidth*imageSize.x/2.0;
		offsetY = pixelWidth*imageSize.y/2.0;
	}
	else{
		offsetX = pixelWidth*size2d.x/2.0;
		offsetY = pixelWidth*size2d.y/2.0;
	}
	
	// Offset our position along the normal
	if(orderInt == 1)
	{
		offset = vec4(-offsetX*scale2d.x, 0.0, 0.0, 1.0);
	}
	else if(orderInt == -1)
	{
		offset = vec4(offsetX*scale2d.x, 0.0, 0.0, 1.0);
	}
	else if(orderInt == 2)
	{
		offset = vec4(-offsetX*scale2d.x, offsetY*4.0*scale2d.y, 0.0, 1.0);
	}
	else if(orderInt == -2)
	{
		offset = vec4(offsetX*scale2d.x, offsetY*4.0*scale2d.y, 0.0, 1.0);
	}

	gl_Position = projected + offset + vec4(aditionalOffset.x*pixelWidth, aditionalOffset.y*pixelWidth, aditionalOffset.z*pixelWidth, 0.0); 
}
































