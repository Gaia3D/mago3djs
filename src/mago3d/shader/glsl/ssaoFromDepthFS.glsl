
#ifdef GL_ES
    precision highp float;
#endif

uniform sampler2D depthTex;
uniform sampler2D noiseTex;  
uniform sampler2D normalTex;

uniform mat4 projectionMatrix;
uniform mat4 projectionMatrixInv;

uniform float near;
uniform float far;         
uniform float fov;
uniform float tangentOfHalfFovy;
uniform float aspectRatio;    
uniform float screenWidth;    
uniform float screenHeight; 
uniform vec2 noiseScale;
uniform vec2 uNearFarArray[4];


uniform bool bApplySsao;
uniform vec3 kernel[16]; 

const int kernelSize = 16; 

uniform bool bUseLogarithmicDepth;
uniform float uFCoef_logDepth;


/*
float unpackDepth(const in vec4 rgba_depth)
{
    // mago unpackDepth.***
    const vec4 bit_shift = vec4(0.000000059605, 0.000015258789, 0.00390625, 1.0);// original.***
    float depth = dot(rgba_depth, bit_shift);
    return depth;
}  
*/


float unpackDepth(vec4 packedDepth)
{
	// See Aras Pranckevičius' post Encoding Floats to RGBA
	// http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
	//vec4 packDepth( float v ) // function to packDepth.***
	//{
	//	vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
	//	enc = fract(enc);
	//	enc -= enc.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);
	//	return enc;
	//}
	return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}


vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec4 getNormal(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(normalTex, texCoord);
    return decodeNormal(encodedNormal);
}
            

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}         
            
float getDepth(vec2 coord)
{
	if(bUseLogarithmicDepth)
	{
		float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
		// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
		// flogz = 1.0 + gl_Position.z*0.0001;
        float Fcoef_half = uFCoef_logDepth/2.0;
		float flogzAux = pow(2.0, linearDepth/Fcoef_half);
		float z = (flogzAux - 1.0);
		linearDepth = z/(far);
		return linearDepth;
	}
	else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	}
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

vec3 reconstructPosition(vec2 texCoord, float depth)
{
    // https://wickedengine.net/2019/09/22/improved-normal-reconstruction-from-depth/
    float x = texCoord.x * 2.0 - 1.0;
    //float y = (1.0 - texCoord.y) * 2.0 - 1.0;
    float y = (texCoord.y) * 2.0 - 1.0;
    float z = (1.0 - depth) * 2.0 - 1.0;
    vec4 pos_NDC = vec4(x, y, z, 1.0);
    vec4 pos_CC = projectionMatrixInv * pos_NDC;
    return pos_CC.xyz / pos_CC.w;
}

vec3 normal_from_depth(float depth, vec2 texCoord, inout bool isValid) {
    // http://theorangeduck.com/page/pure-depth-ssao
    float pixelSizeX = 1.0/screenWidth;
    float pixelSizeY = 1.0/screenHeight;

    vec2 offset1 = vec2(0.0,pixelSizeY);
    vec2 offset2 = vec2(pixelSizeX,0.0);

	float depthA = 0.0;
	float depthB = 0.0;
	for(float i=0.0; i<2.0; i++)
	{
        float depthAux = getDepth(texCoord + offset1*(1.0+i));
        if(depthAux > 0.996)
        {
            depthAux = depth;
            isValid = false;
        }
		depthA += depthAux;

        depthAux = getDepth(texCoord + offset2*(1.0+i));
        if(depthAux > 0.996)
        {
            depthAux = depth;
            isValid = false;
        }
		depthB += depth;
	}
    
	//vec3 posA = reconstructPosition(texCoord + offset1*2.0, depthA/2.0);
	//vec3 posB = reconstructPosition(texCoord + offset2*2.0, depthB/2.0);
    //vec3 pos0 = reconstructPosition(texCoord, depth);
    
    vec3 posA = getViewRay(texCoord + offset1*2.0, far)* depthA/2.0;
	vec3 posB = getViewRay(texCoord + offset2*2.0, far)* depthB/2.0;
    vec3 pos0 = getViewRay(texCoord, far)* depth;

    posA.z *= -1.0;
    posB.z *= -1.0;
    pos0.z *= -1.0;
    
    vec3 normal = cross(posA - pos0, posB - pos0);
    normal.z = -normal.z;
    isValid = true;

    return normalize(normal);
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

float getOcclusion(vec3 origin, vec3 rotatedKernel, float radius, int originFrustumIdx)
{
    float result_occlusion = 0.0;
    vec3 sample = origin + rotatedKernel * radius;
    vec4 offset = projectionMatrix * vec4(sample, 1.0);	
    vec3 offsetCoord = vec3(offset.xyz);				
    offsetCoord.xyz /= offset.w;
    offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5;  	

    if(abs(offsetCoord.x) > 1.0 || abs(offsetCoord.y) > 1.0)
    {
        return result_occlusion;
    }
    vec4 normalRGBA = getNormal(offsetCoord.xy);
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA.w));

    // Test.***************************************************************

    // check the data type of the pixel.
    /*
    int dataType = -1;
    int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);
    if(originFrustumIdx != currFrustumIdx)// test "if".***
    {
        //if(radius < 6.0)
        //return result_occlusion; // test "if".***
    }
    */
    // End test.-----------------------------------------------------------

    vec2 nearFar = getNearFar_byFrustumIdx(estimatedFrustumIdx);
    float currNear = nearFar.x;
    float currFar = nearFar.y;
    float depthBufferValue = getDepth(offsetCoord.xy);
    //------------------------------------
    
    float sampleZ = -sample.z;
    //float bufferZ = currNear + depthBufferValue * (currFar - currNear);
    float bufferZ = depthBufferValue * currFar;
    float zDiff = abs(bufferZ - sampleZ);
    if(zDiff < radius)
    {
        //float rangeCheck = smoothstep(0.0, 1.0, radius/zDiff);
        if (bufferZ < sampleZ)//-tolerance*1.0)
        {
            result_occlusion = 1.0;// * rangeCheck;
        }
    }
    
    /*
    float depthDiff = abs(depthBufferValue - sampleDepth);
    if(depthDiff < radius/currFar)
    {
        float rangeCheck = smoothstep(0.0, 1.0, radius / (depthDiff*currFar));
        if (depthBufferValue < sampleDepth)
        {
            result_occlusion = 1.0 * rangeCheck;
        }
    }
    */
    return result_occlusion;
}

float getFactorByDist(in float radius, in float realDist)
{
    float factorByDist = 1.0;
    if(realDist < radius*5.0)
    {
        factorByDist = smoothstep(0.0, 1.0, realDist/(radius*5.0));
    }
    return factorByDist;
}



float getOcclusion_pointsCloud(vec2 screenPosAdjacent)
{
    float result_occlusion = 0.0;

    vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));

    // check the data type of the pixel.
    int dataType = -1;
    int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);

    vec2 nearFar_adjacent = getNearFar_byFrustumIdx(currFrustumIdx);
    float currNear_adjacent = nearFar_adjacent.x;
    float currFar_adjacent = nearFar_adjacent.y;

    float depthBufferValue = getDepth(screenPosAdjacent);
    //float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent; // correct.
    float zDist = depthBufferValue * currFar_adjacent;



    return result_occlusion;
}


void main()
{
    float occlusion_A = 0.0;
    float occlusion_B = 0.0;
    float occlusion_C = 0.0;
    float occlusion_D = 0.0;

    vec3 normal = vec3(0.0);
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
    vec4 normalRGBA = getNormal(screenPos);
    vec3 normal2 = normalRGBA.xyz; // original.***

    // test check.
    int estimatedFrustumIdx = int(floor(100.0*normalRGBA.w));
    int dataType = 0; // 0= general geometry. 1= tinTerrain. 2= PointsCloud.

    // Check the type of the data.******************
    // dataType = 0 -> general geometry data.
    // dataType = 1 -> tinTerrain data.
    // dataType = 2 -> points cloud data.
    //----------------------------------------------
    int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType);

    // If the data is no generalGeomtry or pointsCloud, then discard.
    //if(dataType != 0 && dataType != 2)
    //discard;

    vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx); 
    float currNear = nearFar.x;
    float currFar = nearFar.y;
    float linearDepth = getDepth(screenPos);

    // calculate the real pos of origin.
    float origin_zDist = linearDepth * currFar;
    vec3 origin_real = getViewRay(screenPos, origin_zDist);

    float radius_A = 0.5;
    float radius_B = 5.0;
    float radius_C = 12.0;
    float radius_D = 20.0;

    float factorByDist = 1.0;
    float realDist = -origin_real.z;

    float aux = 30.0;
    if(realDist < aux)
    {
        factorByDist = smoothstep(0.0, 1.0, realDist/(aux));
    }

    // Test. Variate the radius in function of "origin_zDist".***
    //radius_A *= factorByDist;
    //radius_B *= factorByDist;
    //radius_C *= factorByDist;
    //radius_D *= factorByDist;
    // End test.-------------------------------------------------

    // Now, factorByFarDist. When object are in far, no apply ssao.
    float factorByFarDist = 1.0;
    factorByFarDist = 1000.0/realDist;
    if(factorByFarDist > 1.0)
    factorByFarDist = 1.0;

    factorByDist *= factorByFarDist;

    if(factorByDist < 0.01)
    discard;

    // General data type.*************************************************************************************
    if(dataType != 2 && bApplySsao)
	{        
        vec3 origin = origin_real;
        //vec3 origin = reconstructPosition(screenPos, linearDepth); // used when there are no normal-texture.
        bool isValid = true;
        
        if(length(normal2) < 0.1)
        isValid = false;
        if(!isValid)
        {
            //gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            //return;
            discard;
        }
        normal = normal2;
        
		vec3 rvec = texture2D(noiseTex, screenPos.xy * noiseScale).xyz * 2.0 - 1.0;
		vec3 tangent = normalize(rvec - normal2 * dot(rvec, normal2));
		vec3 bitangent = cross(normal2, tangent);
		mat3 tbn = mat3(tangent, bitangent, normal2);   

		for(int i = 0; i < kernelSize; ++i)
		{    	
            vec3 rotatedKernel = tbn * vec3(kernel[i].x*1.0, kernel[i].y*1.0, kernel[i].z);

            occlusion_A += getOcclusion(origin, rotatedKernel, radius_A, currFrustumIdx);
            occlusion_B += getOcclusion(origin, rotatedKernel, radius_B, currFrustumIdx);
            occlusion_C += getOcclusion(origin, rotatedKernel, radius_C, currFrustumIdx);
            occlusion_D += getOcclusion(origin, rotatedKernel, radius_D, currFrustumIdx);
		} 

        occlusion_A *= factorByDist;
        occlusion_B *= factorByDist;
        occlusion_C *= factorByDist;
        occlusion_D *= factorByDist;

        float fKernelSize = float(kernelSize);

		occlusion_C = occlusion_C / fKernelSize;	
        if(occlusion_C < 0.0)
        occlusion_C = 0.0;
        else if(occlusion_C > 1.0)
        occlusion_C = 1.0;

        occlusion_B = occlusion_B / fKernelSize;	
        if(occlusion_B < 0.0)
        occlusion_B = 0.0;
        else if(occlusion_B > 1.0)
        occlusion_B = 1.0;

        occlusion_A = occlusion_A / fKernelSize;	
        if(occlusion_A < 0.0)
        occlusion_A = 0.0;
        else if(occlusion_A > 1.0)
        occlusion_A = 1.0;

        occlusion_D = occlusion_D / fKernelSize;	
        if(occlusion_D < 0.0)
        occlusion_D = 0.0;
        else if(occlusion_D > 1.0)
        occlusion_D = 1.0;

	}

    // Points cloud data type.**************************************************************************************
    /*
    if(dataType == 2 && bApplySsao)
	{        
		float linearDepth = getDepth(screenPos);
		//vec3 origin = getViewRay(screenPos) * linearDepth;


		vec4 normalRGBA = getNormal(screenPos);
		int currFrustumIdx = int(floor(100.0*normalRGBA.w));

		if(currFrustumIdx >= 10)
		currFrustumIdx -= 20;

		vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
		float currNear = nearFar.x;
		float currFar = nearFar.y;


		float myZDist = currNear + linearDepth * currFar;

		float radiusAux = glPointSize/1.9; // radius in pixels.
		float radiusFog = glPointSize*3.0; // radius in pixels.
		vec2 screenPosAdjacent;



		// calculate the pixelSize in the screenPos.***
		float h = 2.0 * tangentOfHalfFovy * currFar * linearDepth; // height in meters of the screen in the current pixelDepth
    	float w = h * aspectRatio;     							   // width in meters of the screen in the current pixelDepth
		// vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);   

		float pixelSize_x = w/screenWidth; // the pixelSize in meters in the x axis.
		float pixelSize_y = h/screenHeight;  // the pixelSize in meters in the y axis.
		
		float radiusInMeters = 0.20;
		radiusAux = radiusInMeters / pixelSize_x;
		float radiusFogInMeters = 1.0;
		radiusFog = radiusFogInMeters / pixelSize_x;

		//radiusAux = 6.0;
		float farFactor = 0.1*sqrt(myZDist);
		

        //radiusAux = 1.5 *(float(j)+1.0);
        for(int i = 0; i < 8; ++i)
        {  
            // Find occlussion.***  	 
            if(i == 0)
                screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
            else if(i == 1)
                screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
            else if(i == 2)
                screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y - radiusAux) / screenHeight);
            else if(i == 3)
                screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);
            else if(i == 4)
                screenPosAdjacent = vec2((gl_FragCoord.x + radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
            else if(i == 5)
                screenPosAdjacent = vec2((gl_FragCoord.x)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
            else if(i == 6)
                screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y + radiusAux) / screenHeight);
            else if(i == 7)
                screenPosAdjacent = vec2((gl_FragCoord.x - radiusAux)/ screenWidth, (gl_FragCoord.y) / screenHeight);

            vec4 normalRGBA_adjacent = getNormal(screenPosAdjacent);
            int adjacentFrustumIdx = int(floor(100.0*normalRGBA_adjacent.w));

            if(adjacentFrustumIdx >= 10)
            adjacentFrustumIdx -= 20;

            vec2 nearFar_adjacent = getNearFar_byFrustumIdx(adjacentFrustumIdx);
            float currNear_adjacent = nearFar_adjacent.x;
            float currFar_adjacent = nearFar_adjacent.y;

            float depthBufferValue = getDepth(screenPosAdjacent);
            float zDist = currNear_adjacent + depthBufferValue * currFar_adjacent;
            float zDistDiff = abs(myZDist - zDist);

            
            
            if(myZDist > zDist)
            {
                // My pixel is rear
                if(zDistDiff > farFactor  &&  zDistDiff < 100.0)
                occlusion +=  1.0;
            }
        }

        float fKernelSize = float(kernelSize);

		occlusion_C = occlusion_C / fKernelSize;	
        if(occlusion_C < 0.0)
        occlusion_C = 0.0;
        else if(occlusion_C > 1.0)
        occlusion_C = 1.0;

        occlusion_B = occlusion_B / fKernelSize;	
        if(occlusion_B < 0.0)
        occlusion_B = 0.0;
        else if(occlusion_B > 1.0)
        occlusion_B = 1.0;

        occlusion_A = occlusion_A / fKernelSize;	
        if(occlusion_A < 0.0)
        occlusion_A = 0.0;
        else if(occlusion_A > 1.0)
        occlusion_A = 1.0;

        occlusion_D = occlusion_D / fKernelSize;	
        if(occlusion_D < 0.0)
        occlusion_D = 0.0;
        else if(occlusion_D > 1.0)
        occlusion_D = 1.0;
	}
    */

    
    // Do lighting.***
    //float scalarProd = max(0.01, dot(normal, normalize(-ray)));
   // scalarProd /= 3.0;
	//scalarProd += 0.666;
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - scalarProd);

	gl_FragColor = vec4(occlusion_A, occlusion_B, occlusion_C, occlusion_D);
    //gl_FragColor = vec4(normal.xyz, 1.0);
}