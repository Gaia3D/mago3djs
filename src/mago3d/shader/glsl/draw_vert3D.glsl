precision mediump float;

	// This shader draws windParticles in 3d directly from positions on u_particles image.***
attribute float a_index;

uniform sampler2D u_particles;
uniform float u_particles_res;
uniform mat4 ModelViewProjectionMatrix;

varying vec2 v_particle_pos;

#define M_PI 3.1415926535897932384626433832795
vec4 geographicToWorldCoord(float lonDeg, float latDeg, float alt)
{
	// defined in the LINZ standard LINZS25000 (Standard for New Zealand Geodetic Datum 2000)
	// https://www.linz.govt.nz/data/geodetic-system/coordinate-conversion/geodetic-datum-conversions/equations-used-datum
	// a = semi-major axis.
	// e2 = firstEccentricitySquared.
	// v = a / sqrt(1 - e2 * sin2(lat)).
	// x = (v+h)*cos(lat)*cos(lon).
	// y = (v+h)*cos(lat)*sin(lon).
	// z = [v*(1-e2)+h]*sin(lat).
	float degToRadFactor = M_PI/180.0;
	float equatorialRadius = 6378137.0; // meters.
	float firstEccentricitySquared = 6.69437999014E-3;
	float lonRad = lonDeg * degToRadFactor;
	float latRad = latDeg * degToRadFactor;
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

    gl_PointSize = 1.0;
    vec4 pos2d = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);
	
	// Now, must calculate geographic coords of the pos2d.***
	float longitudeDeg = -180.0 + pos2d.x * 360.0;
	float latitudeDeg = 90.0 - pos2d.y * 180.0;
	float altitude = 0.0;
	// Now, calculate worldPosition of the geographicCoords (lon, lat, alt).***
	vec4 worldPos = geographicToWorldCoord(longitudeDeg, latitudeDeg, altitude);
	
	// Now calculate the position on camCoord.***
	
	gl_Position = ModelViewProjectionMatrix * worldPos;
}