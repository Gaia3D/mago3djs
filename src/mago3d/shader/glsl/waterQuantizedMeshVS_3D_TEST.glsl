//precision mediump float;

attribute vec3 a_pos;
attribute vec4 color4;

uniform mat4 buildingRotMatrix; 
	uniform mat4 modelViewMatrixRelToEye; 
	uniform mat4 ModelViewProjectionMatrixRelToEye;
	uniform mat4 RefTransfMatrix;
	uniform mat4 normalMatrix4;
	uniform vec3 buildingPosHIGH;
	uniform vec3 buildingPosLOW;
	uniform float near;
	uniform float far;
	uniform vec3 scaleLC;
	uniform vec3 encodedCameraPositionMCHigh;
	uniform vec3 encodedCameraPositionMCLow;
	uniform vec3 aditionalPosition;
	uniform vec3 refTranslationVec;
	uniform int refMatrixType; // 0= identity, 1= translate, 2= transform
	uniform highp int colorType; // 0= oneColor, 1= attribColor, 2= texture.

uniform vec3 u_minGeoCoord;
uniform vec3 u_maxGeoCoord;

uniform vec3 u_totalMinGeoCoord; // (lon, lat, alt).
uniform vec3 u_totalMaxGeoCoord;
uniform vec3 u_currentMinGeoCoord;
uniform vec3 u_currentMaxGeoCoord;

varying vec2 v_tex_pos;
varying vec3 vPos;
varying vec4 vColor4;

/*
vec3 geographicToCartesianWgs84 = function(longitude, latitude, altitude)
{
	// a = semi-major axis.
	// e2 = firstEccentricitySquared.
	// v = a / sqrt(1 - e2 * sin2(lat)).
	// x = (v+h)*cos(lat)*cos(lon).
	// y = (v+h)*cos(lat)*sin(lon).
	// z = [v*(1-e2)+h]*sin(lat).
	var degToRadFactor = Math.PI/180.0;
	var equatorialRadius = 6378137.0;
	var firstEccentricitySquared = 6.69437999014E-3;
	var lonRad = longitude * degToRadFactor;
	var latRad = latitude * degToRadFactor;
	var cosLon = Math.cos(lonRad);
	var cosLat = Math.cos(latRad);
	var sinLon = Math.sin(lonRad);
	var sinLat = Math.sin(latRad);
	var a = equatorialRadius;
	var e2 = firstEccentricitySquared;
	var v = a/Math.sqrt(1.0 - e2 * sinLat * sinLat);
	var h = altitude;
	
	if (resultCartesian === undefined)
	{ resultCartesian = []; }
	
	resultCartesian[0]=(v+h)*cosLat*cosLon;
	resultCartesian[1]=(v+h)*cosLat*sinLon;
	resultCartesian[2]=(v*(1.0-e2)+h)*sinLat;
	
	return resultCartesian;
};
*/

void main() {
    // Note: the position attributte is initially (in javascript) unsignedInt16 (0 to 32,767) (quantizedMesh).
    // So, when normalize the data it transforms to (0.0 to 0.5), so must multiply by 2.0.
    vec3 pos = a_pos * 2.0; // quantizedMeshes uses the positive parts of the signed short, so must multiply by 2.
    
	pos = vec3(pos.xy * 2000.0, pos.z * 500.0 + 500.0);
	//pos = vec3(pos.xy * 20.0, pos.z + 500.0);
    //----------------------------------------------------------------------------------------------------
	vec4 rotatedPos = buildingRotMatrix * vec4(pos.xyz, 1.0);
    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0);
    //vec3 rotatedNormal = currentTMat * normal;

    //vNormal = normalize((normalMatrix4 * vec4(rotatedNormal, 1.0)).xyz); // original.***
    //vTexCoord = texCoord;

    gl_Position = ModelViewProjectionMatrixRelToEye * pos4;

    vColor4 = color4;
}