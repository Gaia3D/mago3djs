precision mediump float;

#define M_PI 3.1415926535897932384626433832795

uniform sampler2D volumeTex;
uniform mat4 projectionMatrix;  
uniform mat4 modelViewMatrix;
uniform mat4 modelViewMatrixInv;
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

uniform float screenWidth;    
uniform float screenHeight;
uniform float aspectRatio;
uniform float far;
uniform float fovyRad;
uniform float tanHalfFovy;

// volume tex definition.***
uniform int texNumCols;
uniform int texNumRows;
uniform int texNumSlices;
uniform float maxLon;
uniform float minLon;
uniform float maxLat;
uniform float minLat;
uniform float maxAlt;
uniform float minAlt;

uniform float maxValue;
uniform float minValue;

vec3 getViewRay(vec2 tc)
{
	float hfar = 2.0 * tanHalfFovy * far;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -far);    
    return ray;                      
} 

float squaredLength(vec3 point1, vec3 point2)
{
	float a = point1.x - point2.x;
	float b = point1.y - point2.y;
	float c = point1.z - point2.z;
	
	float sqDist = a*a + b*b + c*c;
	return sqDist;
}

void intersectionLineSphere(float radius, vec3 rayPos, vec3 rayDir, out int intersectType, out vec3 nearIntersectPos, out vec3 farIntersectPos)
{
	// line: (x, y, z) = x1 + t(x2 - x1), y1 + t(y2 - y1), z1 + t(z2 - z1)
	// sphere: (x - x3)^2 + (y - y3)^2 + (z - z3)^2 = r^2, where x3, y3, z3 is the center of the sphere.
	
	// line:
	vec3 p1 = rayPos;
	vec3 lineDir = rayDir;
	float dist = 1000.0;// any value is ok.***
	vec3 p2 = vec3(p1.x + lineDir.x * dist, p1.y + lineDir.y * dist, p1.z + lineDir.z * dist);
	float x1 = p1.x;
	float y1 = p1.y;
	float z1 = p1.z;
	float x2 = p2.x;
	float y2 = p2.y;
	float z2 = p2.z;

	// sphere:
	float x3 = 0.0;
	float y3 = 0.0;
	float z3 = 0.0;
	float r = radius;
	
	// resolve:
	float x21 = (x2-x1);
	float y21 = (y2-y1);
	float z21 = (z2-z1);
	
	float a = x21*x21 + y21*y21 + z21*z21;
	
	float x13 = (x1-x3);
	float y13 = (y1-y3);
	float z13 = (z1-z3);
	
	float b = 2.0*(x21 * x13 + y21 * y13 + z21 * z13);
	
	float c = x3*x3 + y3*y3 + z3*z3 + x1*x1 + y1*y1 + z1*z1 - 2.0*(x3*x1 + y3*y1+ z3*z1) - r*r;
	
	float discriminant = b*b - 4.0*a*c;
	
	if (discriminant < 0.0)
	{
		// no intersection.***
		intersectType = 0;
	}
	else if (discriminant == 0.0)
	{
		// this is tangent.***
		intersectType = 1;
		
		float t1 = (-b)/(2.0*a);
		nearIntersectPos = vec3(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);
	}
	else
	{
		intersectType = 2;
		
		// find the nearest to p1.***
		float sqrtDiscriminant = sqrt(discriminant);
		float t1 = (-b + sqrtDiscriminant)/(2.0*a);
		float t2 = (-b - sqrtDiscriminant)/(2.0*a);
		
		// solution 1.***
		vec3 intersectPoint1 = vec3(x1 + (x2 - x1)*t1, y1 + (y2 - y1)*t1, z1 + (z2 - z1)*t1);
		vec3 intersectPoint2 = vec3(x1 + (x2 - x1)*t2, y1 + (y2 - y1)*t2, z1 + (z2 - z1)*t2);
		
		float dist1 = squaredLength(p1,intersectPoint1);
		float dist2 = squaredLength(p1,intersectPoint2);
		
		// nearIntersectPos, out vec3 farIntersectPos
		if (dist1 < dist2)
		{
			nearIntersectPos = intersectPoint1;
			farIntersectPos = intersectPoint2;
		}
		else
		{
			nearIntersectPos = intersectPoint2;
			farIntersectPos = intersectPoint1;
		}
	}
}

float atan2(float y, float x) 
{
	if(x > 0.0)
	{
		return atan(y/x);
	}
	else if(x < 0.0)
	{
		if(y >= 0.0)
		{
			return atan(y/x) + M_PI;
		}
		else{
			return atan(y/x) - M_PI;
		}
	}
	else if(x == 0.0)
	{
		if(y>0.0)
		{
			return M_PI/2.0;
		}
		else if(y<0.0)
		{
			return -M_PI/2.0;
		}
		else{
			return 0.0; // return undefined.***
		}
	}
}

void cartesianToGeographicWgs84(vec3 point, out vec3 result) 
{
	// From WebWorldWind.***
	// According to H. Vermeille, "An analytical method to transform geocentric into geodetic coordinates"
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf
	
	float firstEccentricitySquared = 6.69437999014E-3;
	float equatorialRadius = 6378137.0;

	// wwwind coord type.***
	// X = point.z;
	// Y = point.x;
	// Z = point.y;

	// magoWorld coord type.***
	float X = point.x;
	float Y = point.y;
	float Z = point.z;
	float XXpYY = X * X + Y * Y;
	float sqrtXXpYY = sqrt(XXpYY);
	float a = equatorialRadius;
	float ra2 = 1.0 / (a * a);
	float e2 = firstEccentricitySquared;
	float e4 = e2 * e2;
	float p = XXpYY * ra2;
	float q = Z * Z * (1.0 - e2) * ra2;
	float r = (p + q - e4) / 6.0;
	float h;
	float phi;
	float u;
	float evoluteBorderTest = 8.0 * r * r * r + e4 * p * q;
	float rad1;
	float rad2;
	float rad3;
	float atanAux;
	float v;
	float w;
	float k;
	float D;
	float sqrtDDpZZ;
	float e;
	float lambda;
	float s2;
	float cbrtFac = 1.0/3.0;

	if (evoluteBorderTest > 0.0 || q != 0.0) 
	{
		if (evoluteBorderTest > 0.0) 
		{
			// Step 2: general case
			rad1 = sqrt(evoluteBorderTest);
			rad2 = sqrt(e4 * p * q);

			// 10*e2 is my arbitrary decision of what Vermeille means by "near... the cusps of the evolute".
			if (evoluteBorderTest > 10.0 * e2) 
			{
				rad3 = pow((rad1 + rad2) * (rad1 + rad2), cbrtFac);
				u = r + 0.5 * rad3 + 2.0 * r * r / rad3;
			}
			else 
			{
				u = r + 0.5 * pow((rad1 + rad2) * (rad1 + rad2), cbrtFac)
					+ 0.5 * pow((rad1 - rad2) * (rad1 - rad2), cbrtFac);
			}
		}
		else 
		{
			// Step 3: near evolute
			rad1 = sqrt(-evoluteBorderTest);
			rad2 = sqrt(-8.0 * r * r * r);
			rad3 = sqrt(e4 * p * q);
			atanAux = 2.0 * atan2(rad3, rad1 + rad2) / 3.0;

			u = -4.0 * r * sin(atanAux) * cos(M_PI / 6.0 + atanAux);
		}

		v = sqrt(u * u + e4 * q);
		w = e2 * (u + v - q) / (2.0 * v);
		k = (u + v) / (sqrt(w * w + u + v) + w);
		D = k * sqrtXXpYY / (k + e2);
		sqrtDDpZZ = sqrt(D * D + Z * Z);

		h = (k + e2 - 1.0) * sqrtDDpZZ / k;
		phi = 2.0 * atan2(Z, sqrtDDpZZ + D);
	}
	else 
	{
		// Step 4: singular disk
		rad1 = sqrt(1.0 - e2);
		rad2 = sqrt(e2 - p);
		e = sqrt(e2);

		h = -a * rad1 * rad2 / e;
		phi = rad2 / (e * rad2 + rad1 * sqrt(p));
	}

	// Compute lambda
	s2 = sqrt(2.0);
	if ((s2 - 1.0) * Y < sqrtXXpYY + X) 
	{
		// case 1 - -135deg < lambda < 135deg
		lambda = 2.0 * atan2(Y, sqrtXXpYY + X);
	}
	else if (sqrtXXpYY + Y < (s2 + 1.0) * X) 
	{
		// case 2 - -225deg < lambda < 45deg
		lambda = -M_PI * 0.5 + 2.0 * atan2(X, sqrtXXpYY - Y);
	}
	else 
	{
		// if (sqrtXXpYY-Y<(s2=1)*X) {  // is the test, if needed, but it's not
		// case 3: - -45deg < lambda < 225deg
		lambda = M_PI * 0.5 - 2.0 * atan2(X, sqrtXXpYY + Y);
	}

	float factor = 180.0 / M_PI;
	result = vec3(factor * lambda, factor * phi, h); // (longitude, latitude, altitude).***
}

bool getValue(vec3 geoLoc, out vec4 value)
{
	// geoLoc = (longitude, latitude, altitude).***
	float lon = geoLoc.x;
	float lat = geoLoc.y;
	float alt = geoLoc.z;
	
	// 1rst, check if geoLoc intersects the volume.***
	if(lon < minLon || lon > maxLon)
		return false;
	else if(lat < minLat || lat > maxLat)
		return false;
	else if(alt < minAlt || alt > maxAlt)
		return false;
		
	// provisionally filter = NEAREST.***
	float lonRange = maxLon - minLon;
	float latRange = maxLat - minLat;
	float altRange = maxAlt - minAlt;
	float col = (lon - minLon)/lonRange * float(texNumCols);
	float row = (lat - minLat)/latRange * float(texNumRows);
	float slice = (alt - minAlt)/altRange * float(texNumSlices);
	
	slice = 0.0;
	vec2 texCoord = vec2(col/float(texNumCols), (row+slice)/float(texNumRows*texNumSlices));
	value = texture2D(volumeTex, texCoord);
	return true;
}

void main() {
	vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
	float linearDepth = 1.0; // the quad is 1m of dist of the camera.***          
    vec3 rayCamCoord = getViewRay(screenPos) * linearDepth;  
	rayCamCoord = normalize(rayCamCoord);
	
	vec3 camTarget = rayCamCoord * 10000.0;
	vec4 camPosWorld = vec4(encodedCameraPositionMCHigh + encodedCameraPositionMCLow, 1.0);
	vec4 camTargetWorld = modelViewMatrixInv * vec4(camTarget.xyz, 1.0);
	vec3 camDirWorld = camTargetWorld.xyz - camPosWorld.xyz;
	camDirWorld = normalize(camDirWorld);

	// now, must find sampling points.***
	int intersectType = 0;
	vec3 nearP;
	vec3 farP;
	float radius = 6378137.0 + maxAlt; // equatorial radius.***
	//radius = 6250000.0 + maxAlt; // test radius.***
	
	intersectionLineSphere(radius, camPosWorld.xyz, camDirWorld, intersectType, nearP, farP);
	
	if(intersectType == 0)
	{
		//gl_FragColor = vec4(0.0, 1.0, 0.0, 0.8);
		//return;
		discard;
	}
		
	if(intersectType == 1)
	{
		// provisionally discard.***
		//gl_FragColor = vec4(0.0, 1.0, 0.0, 0.8);
		//return;
		discard;	
	}
	
	// check if nearP is rear of the camera.***
	float dist = distance(nearP, farP);
	float testDist = dist;
	if(dist > 150000.0)
		testDist = 150000.0;
	vec3 endPoint = vec3(nearP.x + camDirWorld.x * testDist, nearP.y + camDirWorld.y * testDist, nearP.z + camDirWorld.z * testDist);
	vec3 endGeoLoc;
	cartesianToGeographicWgs84(endPoint, endGeoLoc);
	vec3 strGeoLoc;
	cartesianToGeographicWgs84(nearP, strGeoLoc);
	
	// now calculate the geographicCoords of 2 points.***
	// now, depending the dist(nearP, endPoint), determine numSmples.***
	// provisionally take 16 samples.***
	float numSamples = 64.0;
	vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
	float alpha = 0.8/numSamples;
	float tempRange = maxValue - minValue;
	vec4 value;
	float totalValue = 0.0;
	int sampledsCount = 0;
	int intAux = 0;
	float increDist = testDist / numSamples;
	int c = 0;
	for(int i=0; i<128; i++)
	{
		vec3 currGeoLoc;
		vec3 currPosWorld = vec3(nearP.x + camDirWorld.x * increDist*float(c), nearP.y + camDirWorld.y * increDist*float(c), nearP.z + camDirWorld.z * increDist*float(c));
		cartesianToGeographicWgs84(currPosWorld, currGeoLoc);
		if(getValue(currGeoLoc, value))
		{
			float realValue = value.r * tempRange + minValue*255.0;
			totalValue += (value.r);
			sampledsCount += 1;
		}
		if(sampledsCount >= 1)
		{
			break;
		}
		c++;
	}
	if(sampledsCount == 0)
	{
		discard;
	}
	float fValue = totalValue/numSamples;
	fValue = totalValue;
	if(fValue > 1.0)
	{
		gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);
		return;
	}
	float b = 1.0 - fValue;
	float g;
	if(fValue > 0.5)
	{
		g = 2.0-2.0*fValue;
	}
	else{
		g = 2.0*fValue;
	}
	float r = fValue;
	color += vec4(r,g,b,0.8);
	gl_FragColor = color;
}


















