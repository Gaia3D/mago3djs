attribute vec3 position;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform mat4 buildingRotMatrix;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform bool bPositionCompressed;
uniform vec3 minPosition;
uniform vec3 bboxSize;
attribute vec4 color4;
varying vec4 vColor;

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

    vColor=color4;
	
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;
	gl_PointSize = 1.0 + 150.0/gl_Position.z;
	if(gl_PointSize > 10.0)
		gl_PointSize = 10.0;
}