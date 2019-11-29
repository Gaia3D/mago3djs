precision mediump float;

// This shader draws windParticles in 3d directly from positions on u_particles image.***
attribute float a_index;

uniform sampler2D u_particles;
uniform float u_particles_res;
uniform mat4 ModelViewProjectionMatrix;
uniform vec3 u_camPosWC;
uniform vec3 u_geoCoordRadiansMax;
uniform vec3 u_geoCoordRadiansMin;
uniform float pendentPointSize;
uniform float u_alpha;
uniform float u_layerAltitude;

varying vec2 v_particle_pos;

#define M_PI 3.1415926535897932384626433832795
vec4 geographicToWorldCoord(float lonRad, float latRad, float alt)
{
	// defined in the LINZ standard LINZS25000 (Standard for New Zealand Geodetic Datum 2000)
	// https://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum
	// a = semi-major axis.
	// e2 = firstEccentricitySquared.
	// v = a / sqrt(1 - e2 * sin2(lat)).
	// x = (v+h)*cos(lat)*cos(lon).
	// y = (v+h)*cos(lat)*sin(lon).
	// z = [v*(1-e2)+h]*sin(lat).
	float equatorialRadius = 6378137.0; // meters.
	float firstEccentricitySquared = 6.69437999014E-3;
	float cosLon = cos(lonRad);
	float cosLat = cos(latRad);
	float sinLon = sin(lonRad);
	float sinLat = sin(latRad);
	float a = equatorialRadius;
	float e2 = firstEccentricitySquared;
	float v = a/sqrt(1.0 - e2 * sinLat * sinLat);
	float h = alt;
	
	vec4 resultCartesian = vec4((v+h)*cosLat*cosLon, (v+h)*cosLat*sinLon, (v*(1.0-e2)+h)*sinLat, 1.0);
	return resultCartesian;
}

void main() {
	
    vec4 color = texture2D(u_particles, vec2(
        fract(a_index / u_particles_res),
        floor(a_index / u_particles_res) / u_particles_res));

    // decode current particle position from the pixel's RGBA value
    v_particle_pos = vec2(
        color.r / 255.0 + color.b,
        color.g / 255.0 + color.a);

	// Now, must calculate geographic coords of the pos2d.***
	float altitude = u_layerAltitude;
	float minLonRad = u_geoCoordRadiansMin.x;
	float maxLonRad = u_geoCoordRadiansMax.x;
	float minLatRad = u_geoCoordRadiansMin.y;
	float maxLatRad = u_geoCoordRadiansMax.y;
	float lonRadRange = maxLonRad - minLonRad;
	float latRadRange = maxLatRad - minLatRad;
	float longitudeRad = -minLonRad + v_particle_pos.x * lonRadRange;
	float latitudeRad = maxLatRad - v_particle_pos.y * latRadRange;
	
	// Now, calculate worldPosition of the geographicCoords (lon, lat, alt).***
	vec4 worldPos = geographicToWorldCoord(longitudeRad, latitudeRad, altitude);
	
	// Now calculate the position on camCoord.***
	gl_Position = ModelViewProjectionMatrix * worldPos;
	float dist = distance(vec4(u_camPosWC.xyz, 1.0), worldPos);
	gl_PointSize = (2.0 + pendentPointSize/(dist))*u_alpha; 
	if(gl_PointSize > 10.0)
	gl_PointSize = 10.0;
}