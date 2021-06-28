
//#version 300 es

	attribute vec3 position;
	attribute vec3 normal;
	attribute vec2 texCoord;
	attribute vec4 color4;
	
	uniform mat4 buildingRotMatrix; // use this matrix to calculate normals from highMaps.***
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

// Textures.********************************
uniform sampler2D waterHeightTex;
uniform sampler2D terrainmap;
uniform sampler2D contaminantHeightTex;

uniform vec2 u_heightMap_MinMax; // terrain.
uniform float u_waterMaxHeigh;
uniform float u_contaminantMaxHeigh;
uniform vec2 u_tileSize; // tile size in meters.
uniform vec2 u_simulationTextureSize; // for example 512 x 512.
uniform vec2 u_terrainTextureSize; // for example 512 x 512.

uniform sampler2D depthTex;

varying float flogz;
varying float Fcoef_half;

varying vec4 vColorAuxTest;
varying float vWaterHeight;
varying float vContaminantHeight;
varying float vExistContaminant;
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


vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}

float decodeRG(in vec2 waterColorRG)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    return dot(waterColorRG, vec2(1.0, 1.0 / 255.0));
}

vec2 encodeRG(in float wh)
{
    // https://titanwolf.org/Network/Articles/Article?AID=666e7443-0511-4210-b39c-db0bb6738246#gsc.tab=0
    float encodedBit = 1.0/255.0;
    vec2 enc = vec2(1.0, 255.0) * wh;
    enc = fract(enc);
    enc.x -= enc.y * encodedBit;
    return enc; // R = HIGH, G = LOW.***
}

float getWaterHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(waterHeightTex, texCoord);
    //float decoded = decodeRG(color4.rg); // old.
    float decoded = unpackDepth(color4);
    float waterHeight = decoded * u_waterMaxHeigh;
    return waterHeight;
}

float getContaminantHeight(in vec2 texCoord)
{
    vec4 color4 = texture2D(contaminantHeightTex, texCoord);
    //float decoded = decodeRG(color4.rg); // 16bit.
    float decoded = unpackDepth(color4); // 32bit.
    float waterHeight = decoded * u_contaminantMaxHeigh;
    return waterHeight;
}

float getTerrainHeight(in vec2 texCoord)
{
    float terainHeight = texture2D(terrainmap, texCoord).r;
    terainHeight = u_heightMap_MinMax.x + terainHeight * (u_heightMap_MinMax.y - u_heightMap_MinMax.x);
    return terainHeight;
}

/*
vec3 calnor(vec2 uv){
    float eps = 1.0/u_SimRes;
    vec4 cur = texture(waterHeightTex,uv);
    vec4 r = texture(waterHeightTex,uv+vec2(eps,0.f));
    vec4 t = texture(waterHeightTex,uv+vec2(0.f,eps));

    vec3 n1 = normalize(vec3(-1.0, cur.y + cur.x - r.y - r.x, 0.f));
    vec3 n2 = normalize(vec3(-1.0, t.x + t.y - r.y - r.x, 1.0));

    vec3 nor = -cross(n1,n2);
    nor = normalize(nor);
    return nor;
}

vec3 sky(in vec3 rd){
    return mix(vec3(0.6,0.6,0.6),vec3(0.3,0.5,0.9),clamp(rd.y,0.f,1.f));
}

float linearDepth(float depthSample)
{
    depthSample = 2.0 * depthSample - 1.0;
    float zLinear = 2.0 * u_near * u_far / (u_far + u_near - depthSample * (u_far - u_near));
    return zLinear;
}
*/

float getTotalHeight(in vec2 texCoord)
{
	float waterHeight = getWaterHeight(texCoord);
	float terrainHeight = getTerrainHeight(texCoord);
	float contaminHeight = 0.0;
	if(u_contaminantMaxHeigh > 0.0)
	{
		// exist contaminant.
		contaminHeight = getContaminantHeight(texCoord);
	}

	float totalHeight = waterHeight + terrainHeight + contaminHeight;
	return totalHeight;
}

float getLiquidHeight(in vec2 texCoord)
{
	float waterHeight = getWaterHeight(texCoord);
	float contaminHeight = 0.0;
	if(u_contaminantMaxHeigh > 0.0)
	{
		// exist contaminant.
		contaminHeight = getContaminantHeight(texCoord);
	}

	float totalHeight = waterHeight + contaminHeight;
	return totalHeight;
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

	vec3 curPos = vec3(0.0, 0.0, getTotalHeight(texCoord));
	vec3 upPos = vec3(0.0, cellSize_y, getTotalHeight(texCoord + vec2(0.0, divY)));
	vec3 rightPos = vec3(cellSize_x, 0.0, getTotalHeight(texCoord + vec2(divX, 0.0)));

	vec3 rightDir = (rightPos - curPos);
	vec3 upDir = (upPos - curPos);

	normal = normalize(cross(rightDir, upDir));

	return normal;
}


void main()
{
	// read the altitude from waterHeightTex.
	vTexCoord = texCoord;
	vWaterHeight = getWaterHeight(texCoord);

	vContaminantHeight = 0.0;
	vExistContaminant = -1.0;
	// check if exist contaminat.
	if(u_contaminantMaxHeigh > 0.0)
	{
		// exist contaminant.
		vContaminantHeight = getContaminantHeight(texCoord);
		vExistContaminant = 1.0;
	}

	// Test check neighbor(adjacent) waterHeights.**************************
	// If some adjacent waterHeight is zero, then this waterHeight is zero.
	/*
	float extrudeHeight = 0.0;
	float minLiquidHeight = 0.0001;
	bool thisIsBorderWater = false;
	if(vWaterHeight + vContaminantHeight < minLiquidHeight)
	{
		thisIsBorderWater = true;
		extrudeHeight = 0.0;
	}
	*/
	// End test.------------------------------------------------------------

	float terrainHeight = getTerrainHeight(texCoord);
	//float terrainHeight = getTerrainHeight_interpolated(texCoord);
	float height = terrainHeight + vWaterHeight + vContaminantHeight;

	// Test debug:
	//height += 5.0;

	//if(thisIsBorderWater)
	//{
	//	height = extrudeHeight;
	//}

	//float alpha = max(vWaterHeight/u_waterMaxHeigh*1.5, 0.4); // original.***
	float alpha = max(vWaterHeight/u_waterMaxHeigh*1.5, 0.7);

	
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
	float depth = (-vOrthoPos.z)/(far); // the correct value.

	// try to calculate normal here.
	vec3 ndc = gl_Position.xyz / gl_Position.w; //perspective divide/normalize
	vec2 screenPos = ndc.xy * 0.5 + 0.5; //ndc is -1 to 1 in GL. scale for 0 to 1

	// Calculate normal.
	vec3 normalLC = calculateNormalFromHeights(texCoord);
	vec4 normalWC = buildingRotMatrix * vec4(normalLC, 1.0);
	vec4 normalCC = normalMatrix4 * normalWC;

	vNormal = normalCC.xyz;
	vViewRay = normalize(-getViewRay(screenPos, depth)); // original.***

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
