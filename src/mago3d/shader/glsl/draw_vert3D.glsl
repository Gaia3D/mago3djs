precision highp float;

// This shader draws windParticles in 3d directly from positions on u_particles image.***
attribute float a_index;

uniform sampler2D u_particles;
uniform float u_particles_res;
uniform mat4 buildingRotMatrix;
uniform mat4 ModelViewProjectionMatrix;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform vec3 u_camPosWC;
uniform vec3 u_geoCoordRadiansMax;
uniform vec3 u_geoCoordRadiansMin;
uniform float pendentPointSize;
uniform float u_tailAlpha;
uniform float u_layerAltitude;

uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;

varying vec2 v_particle_pos;
varying float flogz;
varying float Fcoef_half;

#define M_PI 3.1415926535897932384626433832795

vec2 splitValue(float value)
{
	float doubleHigh;
	vec2 resultSplitValue;
	if (value >= 0.0) 
	{
		doubleHigh = floor(value / 65536.0) * 65536.0; //unsigned short max
		resultSplitValue.x = doubleHigh;
		resultSplitValue.y = value - doubleHigh;
	}
	else 
	{
		doubleHigh = floor(-value / 65536.0) * 65536.0;
		resultSplitValue.x = -doubleHigh;
		resultSplitValue.y = value + doubleHigh;
	}
	
	return resultSplitValue;
}
	
vec3 geographicToWorldCoord(float lonRad, float latRad, float alt)
{
	// NO USED.
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
	
	float x = (v+h)*cosLat*cosLon;
	float y = (v+h)*cosLat*sinLon;
	float z = (v*(1.0-e2)+h)*sinLat;
	
	
	vec3 resultCartesian = vec3(x, y, z);
	
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
	//vec3 posWC = geographicToWorldCoord(longitudeRad, latitudeRad, altitude);
	//vec4 posCC = vec4((posWC - encodedCameraPositionMCHigh) - encodedCameraPositionMCLow, 1.0);
	
	// Alternative.
	
	vec3 buildingPos = buildingPosHIGH + buildingPosLOW;
	float radius = length(buildingPos);
	float distortion = cos((minLatRad + v_particle_pos.y * latRadRange ));
	float xOffset = (v_particle_pos.x - 0.5)*distortion * lonRadRange * radius;
	float yOffset = (0.5 - v_particle_pos.y) * latRadRange * radius;
	vec4 rotatedPos = buildingRotMatrix * vec4(xOffset, yOffset, 0.0, 1.0);
	
	
	vec4 posWC = vec4((rotatedPos.xyz+buildingPosLOW) +( buildingPosHIGH ), 1.0);
	vec4 posCC = vec4((rotatedPos.xyz+buildingPosLOW- encodedCameraPositionMCLow) +( buildingPosHIGH- encodedCameraPositionMCHigh), 1.0);
	
	// Now calculate the position on camCoord.***
	//gl_Position = ModelViewProjectionMatrix * posWC;
	gl_Position = ModelViewProjectionMatrixRelToEye * posCC;
	//gl_Position = vec4(2.0 * v_particle_pos.x - 1.0, 1.0 - 2.0 * v_particle_pos.y, 0, 1);
	//gl_Position = vec4(v_particle_pos.x, v_particle_pos.y, 0, 1);

	if(bUseLogarithmicDepth)
	{
		// logarithmic zBuffer:
		// https://outerra.blogspot.com/2013/07/logarithmic-depth-buffer-optimizations.html
		gl_Position.z = log2(max(1e-6, 1.0 + gl_Position.w)) * uFCoef_logDepth - 1.0;

		flogz = 1.0 + gl_Position.w;
		Fcoef_half = 0.5 * uFCoef_logDepth;
	}
	
	// Now calculate the point size.
	float dist = distance(vec4(u_camPosWC.xyz, 1.0), vec4(posWC.xyz, 1.0));
	gl_PointSize = (1.0 + pendentPointSize/(dist))*u_tailAlpha; 
	
	if(gl_PointSize > 10.0)
	gl_PointSize = 10.0;
}












