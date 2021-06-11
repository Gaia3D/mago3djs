
attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord;
attribute vec4 color4;

uniform mat4 buildingRotMatrix; // use this to calculate normal from hightMap textures.
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

uniform sampler2D terrainmap;
uniform sampler2D terrainMapToCompare;

uniform vec2 u_screenSize;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;

uniform vec2 u_heightMap_MinMax;
uniform vec2 u_tileSize; // tile size in meters.
uniform vec2 u_simulationTextureSize; // for example 512 x 512.
uniform vec2 u_terrainTextureSize; // for example 512 x 512.

varying float flogz;
varying float Fcoef_half;

varying vec4 vColorAuxTest;
varying vec2 vTexCoord;
varying float depth;
varying vec3 vNormal;
varying vec3 vViewRay;
varying float vTerrainSlided;

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}

float getTerrainHeight(in vec2 texCoord)
{
    float terainHeight = texture2D(terrainmap, texCoord).r;
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);
    return terainHeight;
}

float getTerrainToCompareHeight(in vec2 texCoord)
{
    float terainHeight = texture2D(terrainMapToCompare, texCoord).r;
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);
    return terainHeight;
}

float getTerrainHeight_interpolated(const vec2 uv) 
{
    vec2 px = 1.0 / u_terrainTextureSize;
    vec2 vc = (floor(uv * u_terrainTextureSize)) * px;
    vec2 f = fract(uv * u_terrainTextureSize);
    float tl = texture2D(terrainmap, vc).r;
    float tr = texture2D(terrainmap, vc + vec2(px.x, 0)).r;
    float bl = texture2D(terrainmap, vc + vec2(0, px.y)).r;
    float br = texture2D(terrainmap, vc + px).r;

    float h =  mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
	h = u_heightMap_MinMax.x + h * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);
	return h;
}

vec3 calculateNormalFromHeights(in vec2 texCoord, in float curHeight)
{
	vec3 normal;
	float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;

	float divX = 1.0/u_simulationTextureSize.x;
    float divY = 1.0/u_simulationTextureSize.y;

	vec3 curPos = vec3(0.0, 0.0, curHeight);
	vec3 upPos = vec3(0.0, cellSize_y, getTerrainHeight_interpolated(texCoord + vec2(0.0, divY)));
	vec3 rightPos = vec3(cellSize_x, 0.0, getTerrainHeight_interpolated(texCoord + vec2(divX, 0.0)));

	vec3 rightDir = (rightPos - curPos);
	vec3 upDir = (upPos - curPos);

	normal = normalize(cross(rightDir, upDir));
	return normal;
}

void main()
{
	// read the altitude from hightmap.
	vTexCoord = texCoord; // used for difusseTex.

	//float terrainHeight = getTerrainHeight_interpolated(texCoord);
	float terrainHeight = getTerrainHeight(texCoord);
	float height = terrainHeight;
	float terrainToCompareHeight = getTerrainToCompareHeight(texCoord);

	vTerrainSlided = -1.0;
	if(abs(terrainToCompareHeight - terrainHeight) > 0.8)
	{
		vTerrainSlided = 1.0;
	}

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

	vec4 orthoPos = modelViewMatrixRelToEye * finalPos4;
	//vertexPos = orthoPos.xyz;
	depth = (-orthoPos.z)/(far); // the correct value.

	// Calculate normal.
	// try to calculate normal here.
	////vec3 ndc = gl_Position.xyz / gl_Position.w; //perspective divide/normalize
	////vec2 screenPos = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1
	////vViewRay = normalize(-getViewRay(screenPos, depth));

	vec3 normalLC = calculateNormalFromHeights(texCoord, terrainHeight);
	vec4 normalWC = buildingRotMatrix * vec4(normalLC, 1.0);
	vec4 normalCC = normalMatrix4 * normalWC;
	vNormal = normalCC.xyz;
	

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
