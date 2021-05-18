precision highp float;

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

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

vec2 encodeVelocity(in vec2 vel)
{
	return vel*0.5 + 0.5;
}

vec2 decodeVelocity(in vec2 encodedVel)
{
	return vec2(encodedVel.xy * 2.0 - 1.0);
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

float radiusAtLatitudeRad(in float latRad)
{
	// a = equatorialRadius, b = polarRadius.
	// r = a*b / sqrt(a2*sin2(lat) + b2*cos2(lat)).
	//------------------------------------------------------
	float a = 6378137.0; // Globe.equatorialRadius();
	float b = 6356752.3142; // Globe.polarRadius();
	float a2 = 40680631590769.0; // Globe.equatorialRadiusSquared();
	float b2 = 40408299984087.05552164; // Globe.polarRadiusSquared();
	
	float sin = sin(latRad);
	float cos = cos(latRad);
	float sin2 = sin*sin;
	float cos2 = cos*cos;
	
	float radius = (a*b)/(sqrt(a2*sin2 + b2*cos2));
	return radius;
}

void main() 
{
    vec4 color = texture2D(u_particles, v_tex_pos);
    vec2 pos = vec2(
        color.r / 255.0 + color.b,
        color.g / 255.0 + color.a); // decode particle position from pixel RGBA
	vec2 windMapTexCoord = pos;
	if(u_flipTexCoordY_windMap)
	{
		windMapTexCoord.y = 1.0 - windMapTexCoord.y;
	}

    vec2 velocity = mix(u_wind_min, u_wind_max, decodeVelocity(lookup_wind(windMapTexCoord)));
    float speed_t = length(velocity) / length(u_wind_max);

    // Calculate pixelSizes.**************************************************************************************************
	//vec3 buildingPos = buildingPosHIGH + buildingPosLOW;
	//float radius = length(buildingPos);
	float minLonRad = u_geoCoordRadiansMin.x;
	float maxLonRad = u_geoCoordRadiansMax.x;
	float minLatRad = u_geoCoordRadiansMin.y;
	float maxLatRad = u_geoCoordRadiansMax.y;
	float lonRadRange = maxLonRad - minLonRad;
	float latRadRange = maxLatRad - minLatRad;

    float midLatRad = (maxLatRad + minLatRad) / 2.0;
    float radius = radiusAtLatitudeRad(midLatRad);

	float distortion = cos((minLatRad + pos.y * latRadRange ));

	float meterToLon = 1.0/(radius * distortion);
	float meterToLat = 1.0 / radius;

	float xSpeedFactor = meterToLon / lonRadRange;
	float ySpeedFactor = meterToLat / latRadRange;

	xSpeedFactor *= 1.0 * u_speed_factor;
	ySpeedFactor *= 1.0 * u_speed_factor;

	vec2 offset = vec2(velocity.x / distortion * xSpeedFactor, -velocity.y * ySpeedFactor);

    // update particle position, wrapping around the date line
    vec2 auxVec2 = vec2(pos.x, pos.y);
    pos = fract(1.0 + pos + offset);
	// End ******************************************************************************************************************

    float drop = 0.0;

    // a random seed to use for the particle drop
    vec2 seed = (pos + v_tex_pos) * u_rand_seed;
    float drop_rate = u_drop_rate + speed_t * u_drop_rate_bump;
    drop = step(1.0 - drop_rate, rand(seed));

    vec4 vel = texture2D(u_wind, v_tex_pos);

    if(drop > 0.1 || speed_t < 0.01) // 0.01
	{
		vec2 random_pos = vec2( rand(pos), rand(v_tex_pos) );
		pos = random_pos;
	}
    
    // encode the new particle position back into RGBA
    gl_FragData[0] = vec4(
        fract(pos * 255.0),
        floor(pos * 255.0) / 255.0);

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = vec4(0.0); //
        gl_FragData[2] = vec4(0.0); // 
        gl_FragData[3] = vec4(0.0); // 
        gl_FragData[4] = vec4(0.0); // 
    #endif
}