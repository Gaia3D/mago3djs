attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;
attribute vec4 color4;
uniform mat4 modelViewMatrixRelToEye;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform mat4 buildingRotMatrix;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform float near;
uniform float far;
uniform float uDustConcentration;
uniform bool bUse1Color;
uniform vec4 oneColor4;
uniform bool bUseLogarithmicDepth;
varying vec4 vColor;
varying float glPointSize;
varying float vDepth;

uniform float uFCoef_logDepth;
varying float flogz;
varying float Fcoef_half;
varying vec2 vTexCoord;

void main()
{
	vec4 rotatedPos;
	rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
    if(bUse1Color)
	{
		vColor = oneColor4;
	}
	else
		vColor = color4;
	
    gl_Position = ModelViewProjectionMatrixRelToEye * pos;
	vDepth = -(modelViewMatrixRelToEye * pos).z/far; // original.***
	vTexCoord = texCoord;
/*
	if(bUseFixPointSize)
	{
		gl_PointSize = fixPointSize;
	}
	else{
		float z_b = gl_Position.z/gl_Position.w;
		float z_n = 2.0 * z_b - 1.0;
		float z_e = 2.0 * near * far / (far + near - z_n * (far - near));
		gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***
		if(gl_PointSize > maxPointSize)
			gl_PointSize = maxPointSize;
		if(gl_PointSize < 2.0)
			gl_PointSize = 2.0;
	}
	*/
	/*
	float minPointSize = 2.0;
	float maxPointSize = 60.0;
	float pendentPointSize = 2000.0 * uDustConcentration;
	float z_b = gl_Position.z/gl_Position.w;
	float z_n = 2.0 * z_b - 1.0;
	float z_e = 2.0 * near * far / (far + near - z_n * (far - near));
	gl_PointSize = minPointSize + pendentPointSize/z_e; // Original.***
	//if(gl_PointSize > maxPointSize)
	//	gl_PointSize = maxPointSize;
	//if(gl_PointSize < 2.0)
	//	gl_PointSize = 2.0;

	//vDustConcentRel = uDustConcentration/uDustConcentMinMax[1];
	//glPointSize = gl_PointSize;
	*/
	if(bUseLogarithmicDepth)
	{
		// logarithmic zBuffer:
			// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
			// float Fcoef = 2.0 / log2(far + 1.0);
			// gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;
			// flogz = 1.0 + gl_Position.w;
			//---------------------------------------------------------------------------------
			flogz = 1.0 + gl_Position.w;
			Fcoef_half = 0.5 * uFCoef_logDepth;
	}
}