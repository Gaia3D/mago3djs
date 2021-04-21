precision highp float;

attribute vec3 position;
attribute vec2 texCoord;

uniform mat4 buildingRotMatrix; 
uniform mat4 modelViewMatrixRelToEye; 
uniform mat4 RefTransfMatrix;
uniform mat4 ModelViewProjectionMatrixRelToEye;
uniform mat4 modelViewProjectionMatrix;
uniform vec3 buildingPosHIGH;
uniform vec3 buildingPosLOW;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform float near;
uniform float far;
uniform vec3 aditionalPosition;
uniform vec3 refTranslationVec;
uniform int refMatrixType; // 0= identity, 1= translate, 2= transform

varying float vDepth;
varying vec2 vTexCoord;
varying vec4 vColor4;
#define M_PI 3.1415926535897932384626433832795
//#define M_PI 3.1415926535

float cbrt(in float val)
{
	if (val < 0.0) {
 
        return -pow(-val, 1.0 / 3.0);
    }
 
    else {
 
        return pow(val, 1.0 / 3.0);
    }
}

float atanHP_getConstant(in int j) 
{
	float constant = 0.0;

	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan
	// The constants tan(j*PI/24), (j = 1, 2, • • • , 11) and PI/2 are:
	// j = 1 -> tan(PI/24) =     0.13165 24975 87395 85347 2
	// j = 2 -> tan(PI/12) =     0.26794 91924 31122 70647 3
	// j = 3 -> tan(PI/8) =      0.41421 35623 73095 04880 2
	// j = 4 -> tan(PI/6) =      0.57735 02691 89625 76450 9
	// j = 5 -> tan(5*PI/24) =   0.76732 69879 78960 34292 3
	// j = 6 -> tan(PI/4) =      1.00000 00000 00000 00000 0
	// j = 7 -> tan(7*PI/24) =   1.30322 53728 41205 75586 8
	// j = 8 -> tan(PI/3) =      1.73205 08075 68877 29352 7
	// j = 9 -> tan(3*PI/8) =    2.41421 35623 73095 04880 2
	// j = 10 -> tan(5*PI/12) =  3.73205 08075 68877 29352 7
	// j = 11 -> tan(11*PI/24) = 7.59575 41127 25150 44052 6
	// PI/2 =                    1.57079 63267 94896 61923 1

	if(j == 1)
	{
		constant = 0.131652497587395853472;
	}
	else if(j == 2)
	{
		constant = 0.267949192431122706473;
	}
	else if(j == 3)
	{
		constant = 0.414213562373095048802;
	}
	else if(j == 4)
	{
		constant = 0.577350269189625764509;
	}
	else if(j == 5)
	{
		constant = 0.767326987978960342923;
	}
	else if(j == 6)
	{
		constant = 1.000000000000000000000;
	}
	else if(j == 7)
	{
		constant = 1.303225372841205755868;
	}
	else if(j == 8)
	{
		constant = 1.732050807568877293527;
	}
	else if(j == 9)
	{
		constant = 2.414213562373095048802;
	}
	else if(j == 10)
	{
		constant = 3.732050807568877293527;
	}
	else if(j == 11)
	{
		constant = 7.595754112725150440526;
	}
	else if(j == 12)
	{
		constant = 1.570796326794896619231;
	}

	return constant;
}

int atanHP_getInterval(in float x) 
{
	// Subdivide the interval (0, infinite ) into seven intervals as follows:
	// 0 <= u < tan(PI/24)
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6
	// tan(11PI/24) <= u < infinite.
	//------------------------------------------------------------------------
	float u = abs(x);
	int interval = -1;

	// check if is interval = 0.******************************************************************
	// 0 <= u < tan(PI/24)
	float tan_PIdiv24 = atanHP_getConstant(1);
	if(u < tan_PIdiv24)
	{
		return 0;
	}

	// check if is interval = 1: (j = interval + 1), so j = 2.***********************************
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6
	// tan(PI/24) <= u < tan(PI/8)
	float min = atanHP_getConstant(1);
	float max = atanHP_getConstant(3);
	if(u >= min && u < max)
	{
		return 1;
	}
	
	// check if is interval = 2: (j = interval + 1), so j = 3.***********************************
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6
	// tan(PI/8) <= u < tan(5*PI/24)
	min = atanHP_getConstant(3);
	max = atanHP_getConstant(5);
	if(u >= min && u < max)
	{
		return 2;
	}

	// check if is interval = 3: (j = interval + 1), so j = 4.***********************************
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6
	// tan(5*PI/24) <= u < tan(7*PI/24)
	min = atanHP_getConstant(5);
	max = atanHP_getConstant(7);
	if(u >= min && u < max)
	{
		return 3;
	}

	// check if is interval = 4: (j = interval + 1), so j = 5.***********************************
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6
	// tan(7*PI/24) <= u < tan(3*PI/8)
	min = atanHP_getConstant(7);
	max = atanHP_getConstant(9);
	if(u >= min && u < max)
	{
		return 4;
	}

	// check if is interval = 5: (j = interval + 1), so j = 6.***********************************
	// tan[(2j - 3)*PI/24] <= u < tan[(2j - 1)*PI/24] for j = 2, 3, 4, 5, 6
	// tan(3*PI/8) <= u < tan(11*PI/24)
	min = atanHP_getConstant(9);
	max = atanHP_getConstant(11);
	if(u >= min && u < max)
	{
		return 5;
	}

	// check if is interval = 6: (j = interval + 1), so j = 6.***********************************
	// tan(11PI/24) <= u < infinite.
	min = atanHP_getConstant(11);
	if(u >= min)
	{
		return 6;
	}


	return interval;
}

float atanHP_polynomialApproximation(in float x) 
{
	// P(x) = a1*x + a3*pow(x, 3) + ... + a17*pow(x, 17)
	float result_atan = -1.0;

	float a1 = 1.0;
	float a3 = -0.333333333333333331607;
	float a5 = 0.199999999999998244448;
	float a7 = -0.142857142856331306529;
	float a9 = 0.111111110907793967393;
	float a11 = -0.0909090609633677637073;
	float a13 = 0.0769204073249154081320;
	float a15 = -0.0665248229413108277905;
	float a17 = 0.0546721009395938806941;

	result_atan = a1*x + a3*pow(x, 3.0) + a5*pow(x, 5.0) +  a7*pow(x, 7.0) +  a9*pow(x, 9.0) +  a11*pow(x, 11.0) +  a13*pow(x, 13.0) +  a15*pow(x, 15.0) +  a17*pow(x, 17.0);

	return result_atan;
}

float atanHP(in float x) // atan High Precision.
{
	// https://studylib.net/doc/18241330/high-precision-calculation-of-arcsin-x--arceos-x--and-arctan
	//-----------------------------------------------------------------------------------------------

	// Obtain the interval.
	int interval = atanHP_getInterval(x);

	if(interval == 0)
	{
		// use polynomial approximation.
		return atanHP_polynomialApproximation(x);
	}
	else if(interval >= 1 && interval <6)
	{
		// use Arctan|x| = (j*PI/12) + Arctan(tj),
		// where tj = A / B, where
		// A = |x| - tan(j*PI/12)
		// B = 1 + |x| * tan(j*PI/12).
		float tan_jPIdiv12;
		float j = float(interval);
		if(interval == 1)
		{
			tan_jPIdiv12 = atanHP_getConstant(2);
		}
		else if(interval == 2)
		{
			tan_jPIdiv12 = atanHP_getConstant(4);
		}
		else if(interval == 3)
		{
			tan_jPIdiv12 = atanHP_getConstant(6);
		}
		else if(interval == 4)
		{
			tan_jPIdiv12 = atanHP_getConstant(8);
		}
		else if(interval == 5)
		{
			tan_jPIdiv12 = atanHP_getConstant(10);
		}

		float A = abs(x) - tan_jPIdiv12;
		float B = 1.0 + abs(x) * tan_jPIdiv12;
		float tj = A/B;
		float arctan_tj = atanHP_polynomialApproximation(tj);
		float arctan = (j*M_PI/12.0) + arctan_tj;
		return arctan;
	}
	else
	{
		// the interval = 6 (the last interval).
		// In this case,
		// Arctan|x| = PI/2 - Arctan(1/|x|).
		float pi_div2 = atanHP_getConstant(12);
		float arctan = pi_div2 - atan(1.0/abs(x));
		return arctan;
	}

	return -1.0;
}

float atan2(in float y, in float x) 
{
	if (x > 0.0)
	{
		return atanHP(y/x);
	}
	else if (x < 0.0)
	{
		if (y >= 0.0)
		{
			return atanHP(y/x) + M_PI;
		}
		else 
		{
			return atanHP(y/x) - M_PI;
		}
	}
	else if (x == 0.0)
	{
		if (y>0.0)
		{
			return M_PI/2.0;
		}
		else if (y<0.0)
		{
			return -M_PI/2.0;
		}
		else 
		{
			return 0.0; // return undefined.
		}
	}
}

vec3 CartesianToGeographicWgs84(vec3 posWC, inout float inoutAux)
{
	vec3 geoCoord;

	// From WebWorldWind.
	// According to H. Vermeille, "An analytical method to transform geocentric into geodetic coordinates"
	// http://www.springerlink.com/content/3t6837t27t351227/fulltext.pdf
	// Journal of Geodesy, accepted 10/2010, not yet published
	
	
	//// equatorialRadius = 6378137.0; // meters.
	//// polarRadius = 6356752.3142; // meters.
	//// firstEccentricitySquared = 6.69437999014E-3;
	//// secondEccentricitySquared = 6.73949674228E-3;
	//// degToRadFactor = Math.PI/180.0;
	
	float firstEccentricitySquared = 6.69437999014E-3;
	float equatorialRadius = 6378137.0;

	float X = posWC.x;
	float Y = posWC.y;
	float Z = posWC.z;

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
	float atan_son;
	float v;
	float w;
	float k;
	float D;
	float sqrtDDpZZ;
	float e;
	float lambda;
	float s2;

	

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
				rad3 = cbrt((rad1 + rad2) * (rad1 + rad2));
				u = r + 0.5 * rad3 + 2.0 * r * r / rad3;
			}
			else 
			{
				u = r + 0.5 * cbrt((rad1 + rad2) * (rad1 + rad2))
					+ 0.5 * cbrt((rad1 - rad2) * (rad1 - rad2));
			}
		}
		else 
		{
			// Step 3: near evolute
			rad1 = sqrt(-evoluteBorderTest);
			rad2 = sqrt(-8.0 * r * r * r);
			rad3 = sqrt(e4 * p * q);
			atan_son = 2.0 * atan2(rad3, rad1 + rad2) / 3.0;

			u = -4.0 * r * sin(atan_son) * cos(M_PI / 6.0 + atan_son);
		}

		v = sqrt(u * u + e4 * q);
		w = e2 * (u + v - q) / (2.0 * v);
		k = (u + v) / (sqrt(w * w + u + v) + w);
		D = k * sqrtXXpYY / (k + e2);
		float D_scaled = D/10000.0;
		float Z_scaled = Z/10000.0;
		sqrtDDpZZ = sqrt(D_scaled * D_scaled + Z_scaled * Z_scaled) * 10000.0; // more precision.
		//sqrtDDpZZ = sqrt(D * D + Z * Z);

		h = (k + e2 - 1.0) * sqrtDDpZZ / k;
		phi = 2.0 * atan2(Z, (sqrtDDpZZ + D));
		
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
	geoCoord = vec3(factor * lambda, factor * phi, h);

	return geoCoord;
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

bool aproxEqual(float valA, float valB, float error)
{
	bool areEquals = false;

	if(abs(valA - valB) < error)
	{
		areEquals = true;
	}
	else{
		areEquals = false;
	}

	return areEquals;
}
  
void main()
{	
	// Function for overWrite waterSystem DEM texture.
	vec4 rotatedPos;

	if(refMatrixType == 0)
	{
		rotatedPos = buildingRotMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}
	else if(refMatrixType == 1)
	{
		rotatedPos = buildingRotMatrix * vec4(position.xyz + refTranslationVec.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}
	else if(refMatrixType == 2)
	{
		rotatedPos = RefTransfMatrix * vec4(position.xyz, 1.0) + vec4(aditionalPosition.xyz, 0.0);
	}

    vec3 objPosHigh = buildingPosHIGH;
    vec3 objPosLow = buildingPosLOW.xyz + rotatedPos.xyz;
    vec3 highDifference = objPosHigh.xyz; // - encodedCameraPositionMCHigh.xyz;
    vec3 lowDifference = objPosLow.xyz; // - encodedCameraPositionMCLow.xyz;
    vec4 pos4 = vec4(highDifference.xyz + lowDifference.xyz, 1.0); // world position.

	float inoutAux = 0.0;
	vec3 geoCoord = CartesianToGeographicWgs84(pos4.xyz, inoutAux);

	//gl_Position = ModelViewProjectionMatrixRelToEye * pos4;
	gl_Position = modelViewProjectionMatrix * vec4(geoCoord, 1.0);
	gl_Position.y *= -1.0;
	vDepth = gl_Position.z * 0.5 + 0.5;
	vTexCoord = texCoord;
	vColor4 = vec4(1.0, 0.0, 0.0, 1.0);

	// test debug:
	gl_PointSize = 10.0;
}
