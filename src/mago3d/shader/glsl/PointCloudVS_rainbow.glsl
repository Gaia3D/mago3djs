attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;
attribute vec4 color4;
uniform mat4 ModelViewProjectionMatrixRelToEye;
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
uniform bool bUse1Color;
uniform vec4 oneColor4;
uniform float fixPointSize;
uniform float maxPointSize;
uniform float minPointSize;
uniform float pendentPointSize;
uniform bool bUseFixPointSize;
varying vec4 vColor;
varying float glPointSize;
varying float realHeigh;

void main()
{
	vec3 realPos;
	vec4 rotatedPos;
	if(bPositionCompressed)
	{
		//float maxShort = 65535.0;
		//maxShort = 1.0;
		//realPos = vec3(float(position.x)/maxShort*bboxSize.x + minPosition.x, float(position.y)/maxShort*bboxSize.y + minPosition.y, float(position.z)/maxShort*bboxSize.z + minPosition.z);
		realPos = vec3(position.x * bboxSize.x + minPosition.x, position.y * bboxSize.y + minPosition.y, position.z * bboxSize.z + minPosition.z);
	}
	else
	{
		realPos = position;
	}
	realHeigh = realPos.z;
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
	float z_b = gl_Position.z/gl_Position.w;
	float z_n = 2.0 * z_b - 1.0;
    float z_e = 2.0 * near * far / (far + near - z_n * (far - near));
    gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***
    if(gl_PointSize > maxPointSize)
        gl_PointSize = maxPointSize;
    if(gl_PointSize < 2.0)
        gl_PointSize = 2.0;
        
    glPointSize = gl_PointSize;
}
