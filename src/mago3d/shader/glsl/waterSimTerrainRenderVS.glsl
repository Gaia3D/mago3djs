
//#version 300 es

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
    

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;
uniform vec2 u_PlanePos; // Our location in the virtual world displayed by the plane

uniform sampler2D hightmap;
uniform sampler2D terrainmap;
uniform float u_SimRes;

uniform vec2 u_screenSize;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;
uniform mat4 projectionMatrixInv;

uniform vec2 u_heightMap_MinMax;
uniform vec2 u_tileSize; // tile size in meters.
uniform vec2 u_simulationTextureSize; // for example 512 x 512.

varying float flogz;
varying float Fcoef_half;

varying vec4 vColorAuxTest;
varying vec2 vTexCoord;
varying float depth;
varying vec3 vNormal;
varying vec3 vViewRay;

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
    terainHeight = u_heightMap_MinMax.x + terainHeight * u_heightMap_MinMax.y;
    return terainHeight;
}

vec3 calculateNormalFromHeights(in vec2 texCoord)
{
	vec3 normal;
	float cellSize_x = u_tileSize.x / u_simulationTextureSize.x;
    float cellSize_y = u_tileSize.y / u_simulationTextureSize.y;

	float divX = 1.0/u_simulationTextureSize.x;
    float divY = 1.0/u_simulationTextureSize.y;

	// curPos = (0, 0, curH).
	// upPos = (0, dy, upH).
	// rightPos = (dz, 0, rightH).
	vec3 curPos = vec3(0.0, 0.0, getTerrainHeight(texCoord));
	vec3 upPos = vec3(0.0, cellSize_y, getTerrainHeight(texCoord + vec2(0.0, divY)));
	vec3 rightPos = vec3(cellSize_x, 0.0, getTerrainHeight(texCoord + vec2(divX, 0.0)));

	vec3 rightDir = normalize(rightPos - curPos);
	vec3 upDir = normalize(upPos - curPos);

	normal = normalize(cross(rightDir, upDir));

	return normal;
}

void main()
{
	// read the altitude from hightmap.
	vec4 terrainHeight4 = texture2D(terrainmap, vec2(texCoord.x, 1.0 - texCoord.y)); // delete this.
	vTexCoord = texCoord;

	float terrainHeight = getTerrainHeight(vec2(texCoord.x, 1.0 - texCoord.y));
	float height = terrainHeight;

	vColorAuxTest = terrainHeight4; // delete this.

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

	vec3 normalLC = calculateNormalFromHeights(vec2(texCoord.x, 1.0 - texCoord.y));
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
