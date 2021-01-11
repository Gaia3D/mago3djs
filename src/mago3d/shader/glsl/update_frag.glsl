precision highp float;

uniform sampler2D u_particles;
uniform sampler2D u_wind;
uniform sampler2D u_windGlobeDepthTex;
uniform sampler2D u_windGlobeNormalTex;

uniform mat4 modelViewMatrixInv;

uniform vec2 u_wind_res;
uniform vec2 u_wind_min;
uniform vec2 u_wind_max;
uniform vec3 u_geoCoordRadiansMax;
uniform vec3 u_geoCoordRadiansMin;
uniform float u_rand_seed;
uniform float u_speed_factor;
uniform float u_interpolation;
uniform float u_drop_rate;
uniform float u_drop_rate_bump;
uniform bool u_flipTexCoordY_windMap;
uniform vec4 u_visibleTilesRanges[16];
uniform int u_visibleTilesRangesCount;

uniform float tangentOfHalfFovy;
uniform float far;            
uniform float aspectRatio; 

// new uniforms test.
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 buildingRotMatrix;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform mat4 buildingRotMatrixInv;
uniform vec2 uNearFarArray[4];

#define M_PI 3.1415926535897932384626433832795

varying vec2 v_tex_pos;

// pseudo-random generator
const vec3 rand_constants = vec3(12.9898, 78.233, 4375.85453);
// https://community.khronos.org/t/random-values/75728
float rand(const vec2 co) {
    float t = dot(rand_constants.xy, co);
    return fract(sin(t) * (rand_constants.z + t));
}

// wind speed lookup; use manual bilinear filtering based on 4 adjacent pixels for smooth interpolation
vec2 lookup_wind(const vec2 uv) {
    //return texture2D(u_wind, uv).rg; // lower-res hardware filtering
	
    vec2 px = 1.0 / u_wind_res;
    vec2 vc = (floor(uv * u_wind_res)) * px;
    vec2 f = fract(uv * u_wind_res);
    vec2 tl = texture2D(u_wind, vc).rg;
    vec2 tr = texture2D(u_wind, vc + vec2(px.x, 0)).rg;
    vec2 bl = texture2D(u_wind, vc + vec2(0, px.y)).rg;
    vec2 br = texture2D(u_wind, vc + px).rg;
    return mix(mix(tl, tr, f.x), mix(bl, br, f.x), f.y);
	
}


vec2 getOffset(vec2 particlePos, float radius)
{
	// "particlePos" is a unitary position.
	float minLonRad = u_geoCoordRadiansMin.x;
	float maxLonRad = u_geoCoordRadiansMax.x;
	float minLatRad = u_geoCoordRadiansMin.y;
	float maxLatRad = u_geoCoordRadiansMax.y;
	float lonRadRange = maxLonRad - minLonRad;
	float latRadRange = maxLatRad - minLatRad;

	float distortion = cos((minLatRad + particlePos.y * latRadRange ));
	float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;
	float yOffset = (0.5 - particlePos.y) * latRadRange * radius;

	return vec2(xOffset, yOffset);
}
/*
vec3 get_NDCCoord(in vec2 pos)
{
	// calculate the offset at the earth radius.***
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;
	float radius = length(buildingPos);
	vec2 offset = getOffset(pos, radius);

	float xOffset = offset.x;
	float yOffset = offset.y;
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);
	
	vec4 position = vec4((rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow) + ( buildingPosHIGH - encodedCameraPositionMCHigh), 1.0);
	
	// Now calculate the position on camCoord.***
	vec4 posCC = ModelViewProjectionMatrixRelToEye * position;
	vec3 ndc_coord = vec3(posCC.xyz/posCC.w);

	return ndc_coord;
}
*/

bool is_NDCCoord_InsideOfFrustum(in vec3 ndc_coord)
{
	bool pointIsInside = true;

	float ndc_x = ndc_coord.x;
	float ndc_y = ndc_coord.y;

	if(ndc_x < -1.0)
		return false;
	else if(ndc_x > 1.0)
		return false;
	else if(ndc_y < -1.0)
		return false;
	else if(ndc_y > 1.0)
		return false;
	
	return pointIsInside;
}

bool isPointInsideOfFrustum(in vec2 pos)
{
	bool pointIsInside = true;
	
	// calculate the offset at the earth radius.***
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;
	float radius = length(buildingPos);
	vec2 offset = getOffset(pos, radius);

	float xOffset = offset.x;
	float yOffset = offset.y;
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);
	
	vec4 position = vec4(( rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow ) + ( buildingPosHIGH - encodedCameraPositionMCHigh ), 1.0);
	
	// Now calculate the position on camCoord.***
	vec4 posCC = ModelViewProjectionMatrixRelToEye * position;
	vec3 ndc_pos = vec3(posCC.xyz/posCC.w);

	return is_NDCCoord_InsideOfFrustum(ndc_pos);
}


vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
    return ray;                      
} 

vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec4 getNormal(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(u_windGlobeNormalTex, texCoord);
    return decodeNormal(encodedNormal);
}

int getRealFrustumIdx(in int estimatedFrustumIdx, inout int dataType)
{
    // Check the type of the data.******************
    // frustumIdx 0 .. 3 -> general geometry data.
    // frustumIdx 10 .. 13 -> tinTerrain data.
    // frustumIdx 20 .. 23 -> points cloud data.
    //----------------------------------------------
    int realFrustumIdx = -1;
    
     if(estimatedFrustumIdx >= 10)
    {
        estimatedFrustumIdx -= 10;
        if(estimatedFrustumIdx >= 10)
        {
            // points cloud data.
            estimatedFrustumIdx -= 10;
            dataType = 2;
        }
        else
        {
            // tinTerrain data.
            dataType = 1;
        }
    }
    else
    {
        // general geomtry.
        dataType = 0;
    }

    realFrustumIdx = estimatedFrustumIdx;
    return realFrustumIdx;
}

vec2 getNearFar_byFrustumIdx(in int frustumIdx)
{
    vec2 nearFar;
    if(frustumIdx == 0)
    {
        nearFar = uNearFarArray[0];
    }
    else if(frustumIdx == 1)
    {
        nearFar = uNearFarArray[1];
    }
    else if(frustumIdx == 2)
    {
        nearFar = uNearFarArray[2];
    }
    else if(frustumIdx == 3)
    {
        nearFar = uNearFarArray[3];
    }

    return nearFar;
}

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
} 

void main() {
    vec4 color = texture2D(u_particles, v_tex_pos);
    vec2 pos = vec2(
        color.r / 255.0 + color.b,
        color.g / 255.0 + color.a); // decode particle position from pixel RGBA
	vec2 windMapTexCoord = pos;
	if(u_flipTexCoordY_windMap)
	{
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;
	}
    vec2 velocity = mix(u_wind_min, u_wind_max, lookup_wind(windMapTexCoord));
    float speed_t = length(velocity) / length(u_wind_max);

	// Calculate pixelSizes.**************************************************************************************************
	
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;
	float radius = length(buildingPos);
	float minLonRad = u_geoCoordRadiansMin.x;
	float maxLonRad = u_geoCoordRadiansMax.x;
	float minLatRad = u_geoCoordRadiansMin.y;
	float maxLatRad = u_geoCoordRadiansMax.y;
	float lonRadRange = maxLonRad - minLonRad;
	float latRadRange = maxLatRad - minLatRad;

	float distortion = cos((minLatRad + pos.y * latRadRange ));

	float meterToLon = 1.0/(radius * distortion);
	float meterToLat = 1.0 / radius;

	float xSpeedFactor = meterToLon / lonRadRange;
	float ySpeedFactor = meterToLat / latRadRange;

	xSpeedFactor *= 3.0 * u_speed_factor;
	ySpeedFactor *= 3.0 * u_speed_factor;

	vec2 offset = vec2(velocity.x / distortion * xSpeedFactor, -velocity.y * ySpeedFactor);

	// End ******************************************************************************************************************

	

    // update particle position, wrapping around the date line
    pos = fract(1.0 + pos + offset);


    // drop rate is a chance a particle will restart at random position, to avoid degeneration
	float drop = 0.0;

	//if(u_interpolation < 0.99) // 0.9
	//{
	//	drop = 0.0;
	//}
	//else
	{
		// a random seed to use for the particle drop
		vec2 seed = (pos + v_tex_pos) * u_rand_seed;
		float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
		drop = step(1.0 - drop_rate, rand(seed));
	}
	/*
	if(drop > 0.5) // 0.01
	{
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );
		float randomValue = (u_rand_seed);
		int index = int(floor(float(u_visibleTilesRangesCount+1)*(randomValue)));
		for(int i=0; i<32; i++)
		{
			if(i >= u_visibleTilesRangesCount)
			break;
		
			if(i == index)
			{
				vec4 posAux4 = u_visibleTilesRanges[i];
				float width = (posAux4.z-posAux4.x);
				float height = (posAux4.w-posAux4.y);
				float scaledX = posAux4.x + random_pos.x*width;
				float scaledY = posAux4.y + random_pos.y*height;
				random_pos = vec2(scaledX, 1.0-scaledY);
				pos = random_pos;
				break;
			}
		}
	}
	*/
	if(drop > 0.01)
	{
		// Intersection ray with globe mode:
		vec2 random_screenPos = vec2( rand(pos), rand(v_tex_pos) );
		vec4 normal4 = getNormal(random_screenPos);
		vec3 normal = normal4.xyz;
		if(length(normal) < 0.1)
		{
			// do nothing.
		}
		else
		{
			int estimatedFrustumIdx = int(floor(normal4.w * 100.0));
			int dataType = -1;
			int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);
			vec2 nearFar_origin = getNearFar_byFrustumIdx(currFrustumIdx);
			float currNear_origin = nearFar_origin.x;
			float currFar_origin = nearFar_origin.y;

			vec4 depth4 = texture2D(u_windGlobeDepthTex, random_screenPos);
			float linearDepth = unpackDepth(depth4);
			float relativeFar = linearDepth * currFar_origin;
			vec3 posCC = getViewRay(random_screenPos, relativeFar);  
			vec4 posWC = modelViewMatrixInv * vec4(posCC, 1.0);

			// convert nearP(wc) to local coord.
			posWC.x -= (buildingPosHIGH.x + buildingPosLOW.x);
			posWC.y -= (buildingPosHIGH.y + buildingPosLOW.y);
			posWC.z -= (buildingPosHIGH.z + buildingPosLOW.z);

			vec4 posLC = buildingRotMatrixInv * vec4(posWC.xyz, 1.0);

			// now, convert localPos to unitary-offset position.
			float minLonRad = u_geoCoordRadiansMin.x;
			float maxLonRad = u_geoCoordRadiansMax.x;
			float minLatRad = u_geoCoordRadiansMin.y;
			float maxLatRad = u_geoCoordRadiansMax.y;
			float lonRadRange = maxLonRad - minLonRad;
			float latRadRange = maxLatRad - minLatRad;

			// Calculate the inverse of xOffset & yOffset.****************************************
			// Remember : float xOffset = (particlePos.x - 0.5)*distortion * lonRadRange * radius;
			// Remember : float yOffset = (0.5 - particlePos.y) * latRadRange * radius;
			//------------------------------------------------------------------------------------
			
			float unitaryOffset_y = 0.5 - (posLC.y / (latRadRange * radius));
			float distortion = cos((minLatRad + unitaryOffset_y * latRadRange ));
			float unitaryOffset_x = (posLC.x /(distortion * lonRadRange * radius)) + 0.5;

			pos = vec2(unitaryOffset_x, unitaryOffset_y);
		}
	}
	
	/*
	if(drop > 0.01)
	{
		// Methode 2:
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );
		
		// New version:
		// try to born inside of the camera's frustum.

		vec2 posA = vec2(pos);
		vec2 posB = vec2(v_tex_pos);
		bool isInsideOfFrustum = false;
		for(int i=0; i<30; i++)
		{
			if(isPointInsideOfFrustum(random_pos))
			{
				isInsideOfFrustum = true;
				break;
			}
			else
			{
				posA.x = random_pos.y;
				posA.y = random_pos.x;

				posB.x = random_pos.x;
				posB.y = random_pos.y;

				random_pos = vec2( rand(posA), rand(posB) );
			}
		}

		pos = random_pos;
	}
	*/

    // encode the new particle position back into RGBA
    gl_FragColor = vec4(
        fract(pos * 255.0),
        floor(pos * 255.0) / 255.0);
}