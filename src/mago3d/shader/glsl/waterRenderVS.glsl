
//#version 300 es

	attribute vec3 position;
	attribute vec3 normal;
	attribute vec2 texCoord;
	attribute vec4 color4;
	
	uniform mat4 buildingRotMatrix; 
	uniform mat4 modelViewMatrixRelToEye; 
	uniform mat4 ModelViewProjectionMatrixRelToEye;
	uniform mat4 normalMatrix4;
	uniform vec3 buildingPosHIGH;
	uniform vec3 buildingPosLOW;
	uniform float near;
	uniform float far;
	uniform vec3 scaleLC;
	uniform vec3 encodedCameraPositionMCHigh;
	uniform vec3 encodedCameraPositionMCLow;
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.
	
	uniform bool bUseLogarithmicDepth;
	uniform float uFCoef_logDepth;
    
uniform vec2 u_screenSize;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;
uniform mat4 projectionMatrixInv;


uniform sampler2D hightmap;
uniform sampler2D terrainmap;
uniform float u_SimRes;

uniform vec2 u_heightMap_MinMax;

uniform sampler2D depthTex;

varying float flogz;
varying float Fcoef_half;

varying vec4 vColorAuxTest;
varying float vWaterHeight;
varying vec3 vNormal;
varying vec3 vViewRay;
varying vec3 vOrthoPos;
varying vec2 vTexCoord;

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

float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z;

		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = flogzAux - 1.0;
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
}


vec3 reconstructPosition(vec2 texCoord, float depth)
{
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
    float x = texCoord.x * 2.0 - 1.0;
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;
    float y = (texCoord.y) * 2.0 - 1.0;
    float z = (1.0 - depth) * 2.0 - 1.0;
    vec4 pos_NDC = vec4(x, y, z, 1.0);
    vec4 pos_CC = projectionMatrixInv * pos_NDC;
    return pos_CC.xyz / pos_CC.w;
}

vec3 normal_from_depth(float depth, vec2 texCoord) {
    // http://theorangeduck.com/page/pure-depth-ssao
    float pixelSizeX = 1.0/u_screenSize.x;
    float pixelSizeY = 1.0/u_screenSize.y;

    vec2 offset1 = vec2(0.0,pixelSizeY);
    vec2 offset2 = vec2(pixelSizeX,0.0);

	float depthA = 0.0;
	float depthB = 0.0;
	for(float i=0.0; i<1.0; i++)
	{
		depthA += getDepth(texCoord + offset1*(1.0+i));
		depthB += getDepth(texCoord + offset2*(1.0+i));
	}

	vec3 posA = reconstructPosition(texCoord + offset1*1.0, depthA/1.0);
	vec3 posB = reconstructPosition(texCoord + offset2*1.0, depthB/1.0);

    vec3 pos0 = reconstructPosition(texCoord, depth);
    vec3 normal = cross(posA - pos0, posB - pos0);
    normal.z = -normal.z;

    return normalize(normal);
}

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}

void main()
{
	// read the altitude from hightmap.
	vTexCoord = texCoord;
	vec4 heightVec4 = texture2D(hightmap, vec2(texCoord.x, 1.0 - texCoord.y));
	vec4 terrainHeight4 = texture2D(terrainmap, vec2(texCoord.x, 1.0 - texCoord.y));
	float r = heightVec4.r;
	float g = heightVec4.g;

	float decodedHeight = r;
	float terrainH = terrainHeight4.r;

	//float height = u_heightMap_MinMax.x + decodedHeight * u_heightMap_MinMax.y;
	float waterHeight = decodedHeight * 40.0;
	float terrainHeight = u_heightMap_MinMax.x + terrainH * u_heightMap_MinMax.y;
	float height = terrainHeight + waterHeight;

	vWaterHeight = waterHeight;

	//vColorAuxTest = heightVec4;
	//vColorAuxTest = vec4(heightVec4.rgb, 0.5);
	float alpha = max(r*1.5, 0.4);
	vColorAuxTest = vec4(0.1, 0.3, 1.0, alpha);

	vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + position.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
	
	// calculate the up direction:
	vec4 posWC = vec4(objPosLow + objPosHigh, 1.0);
	vec3 upDir = normalize(posWC.xyz);

	vec4 finalPos4 =  vec4(pos4.x + upDir.x * height, pos4.y + upDir.y * height, pos4.z + upDir.z * height, 1.0);

	gl_Position = ModelViewProjectionMatrixRelToEye * finalPos4;

	vOrthoPos = (modelViewMatrixRelToEye * finalPos4).xyz;

	// try to calculate normal here.
	vec3 ndc = gl_Position.xyz / gl_Position.w; //perspective divide/normalize
	
	vec2 screenPos = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1
    float depth = getDepth(screenPos);
    vNormal = normal_from_depth(depth, screenPos);
	if(vNormal.z < 0.0)
	{
		vNormal *= -1.0;
	}
	//vNormal = normalize(vNormal * vec3(1.0, 1.0, 2.0));
	vViewRay = normalize(-getViewRay(screenPos, depth));

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
