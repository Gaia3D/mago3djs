attribute vec3 position;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 modelViewMatrixRelToEye; 
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform mat4 buildingRotMatrix;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform float near;
uniform float far;
uniform bool bPositionCompressed;
uniform vec3 minPosition;
uniform vec3 bboxSize;
attribute vec4 color4;
uniform bool bUse1Color;
uniform vec4 oneColor4;
uniform float fixPointSize;
uniform bool bUseFixPointSize;
varying vec4 vColor;
//varying float glPointSize;
varying float depth;  

void main()
{
	vec3 realPos;
	vec4 rotatedPos;
	if(bPositionCompressed)
	{
		float maxShort = 65535.0;
		realPos = vec3(float(position.x)/maxShort*bboxSize.x + minPosition.x, float(position.y)/maxShort*bboxSize.y + minPosition.y, float(position.z)/maxShort*bboxSize.z + minPosition.z);
	}
	else
	{
		realPos = position;
	}
	rotatedPos = buildingRotMatrix * vec4(realPos.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
    if(bUse1Color)
	{
		vColor=oneColor4;
	}
	else
		vColor=color4;
	
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;
	//gl_PointSize = 1.0 + 50.0/gl_Position.z; // Original.***
	gl_PointSize = 1.0 + gl_Position.z/300.0;
	if(gl_PointSize > 10.0)
		gl_PointSize = 10.0;
	if(gl_PointSize < 4.0)
		gl_PointSize = 4.0;
		
		//gl_PointSize = 4.0;
		//glPointSize = gl_PointSize;
	depth = (modelViewMatrixRelToEye * pos).z/far; // original.***
}