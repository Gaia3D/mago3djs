precision highp float;

uniform sampler2D u_particles;
uniform sampler2D u_wind;
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

// new uniforms test.
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 buildingRotMatrix;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

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

bool checkFrustumCulling(vec2 pos)
{
	for(int i=0; i<16; i++)
	{
		if(i >= u_visibleTilesRangesCount)
		return false;
		
		vec4 range = u_visibleTilesRanges[i]; // range = minX(x), minY(y), maxX(z), maxY(w)

		float minX = range.x;
		float minY = range.y;
		float maxX = range.z;
		float maxY = range.w;
		
		if(pos.x > minX && pos.x < maxX)
		{
			if(pos.y > minY && pos.y < maxY)
			{
				return true;
			}
		}
	}
	return false;
}

vec2 getOffset(vec2 particlePos, float radius)
{
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
	
	vec4 position = vec4((rotatedPos.xyz + buildingPosLOW - encodedCameraPositionMCLow) + ( buildingPosHIGH - encodedCameraPositionMCHigh), 1.0);
	
	// Now calculate the position on camCoord.***
	vec4 posCC = ModelViewProjectionMatrixRelToEye * position;
	vec3 ndc_pos = vec3(posCC.xyz/posCC.w);
	float ndc_x = ndc_pos.x;
	float ndc_y = ndc_pos.y;

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

    // take EPSG:4236 distortion into account for calculating where the particle moved
	float minLat = u_geoCoordRadiansMin.y;
	float maxLat = u_geoCoordRadiansMax.y;
	float latRange = maxLat - minLat;
	float distortion = cos((minLat + pos.y * latRange ));
    //vec2 offset = vec2(velocity.x / distortion, -velocity.y) * 0.0001 * u_speed_factor * u_interpolation; // original.
	vec2 offset = vec2(velocity.x / distortion, -velocity.y) * 0.0002 * u_speed_factor * u_interpolation;

    // update particle position, wrapping around the date line
    pos = fract(1.0 + pos + offset);


    // drop rate is a chance a particle will restart at random position, to avoid degeneration
	float drop = 0.0;

	if(u_interpolation < 0.99) // 0.9
	{
		drop = 0.0;
	}
	else
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
	

    // encode the new particle position back into RGBA
    gl_FragColor = vec4(
        fract(pos * 255.0),
        floor(pos * 255.0) / 255.0);
}