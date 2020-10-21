
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

float getOcclusion(vec3 origin, vec3 rotatedKernel, float radius, vec2 origin_nearFar)
{
    float result_occlusion = 0.0;
    vec3 sample = origin + rotatedKernel * radius;
    vec4 offset = projectionMatrix * vec4(sample, 1.0);	
    vec3 offsetCoord = vec3(offset.xyz);				
    offsetCoord.xyz /= offset.w;
    offsetCoord.xyz = offsetCoord.xyz * 0.5 + 0.5;  	

    vec4 normalRGBA = getNormal(offsetCoord.xy);
    int currFrustumIdx = int(floor(100.0*normalRGBA.w));
    vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
    float currNear = nearFar.x;
    float currFar = nearFar.y;

    float originFar = origin_nearFar.y;
    float originNear = origin_nearFar.x;
    float sampleDepth = -sample.z/currFar;// original.***
    float depthBufferValue = getDepth(offsetCoord.xy);
    //------------------------------------
    /*
    float sampleZ = -sample.z;
    float bufferZ = currNear + depthBufferValue * (currFar - currNear);
    float zDiff = abs(bufferZ - sampleZ);
    if(zDiff < radius)
    {
        float rangeCheck = smoothstep(0.0, 1.0, radius/zDiff);
        if (bufferZ < sampleZ)//-tolerance*1.0)
        {
            result_occlusion = 1.0 * rangeCheck;
        }
    }
    */
    
    float depthDiff = abs(depthBufferValue - sampleDepth);
    if(depthDiff < radius/currFar)
    {
        float rangeCheck = smoothstep(0.0, 1.0, radius / (depthDiff*currFar));
        if (depthBufferValue < sampleDepth)//-tolerance*1.0)
        {
            result_occlusion = 1.0 * rangeCheck;
        }
    }
    
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



void main()
{
    float occlusion_C = 0.0;
    float occlusion_B = 0.0;
    float occlusion_A = 0.0;
    float occlusion_D = 0.0;

    //float occlusion_CC = 0.0;
    //float occlusion_BB = 0.0;
    //float occlusion_AA = 0.0;
    //float occlusion_DD = 0.0;

    vec3 normal = vec3(0.0);
    vec2 screenPos = vec2(gl_FragCoord.x / screenWidth, gl_FragCoord.y / screenHeight);
    vec4 normalRGBA = getNormal(screenPos);
    vec3 normal2 = normalRGBA.xyz; // original.***
    int currFrustumIdx = int(floor(100.0*normalRGBA.w));

    if(currFrustumIdx > 3)
    discard;

    vec2 nearFar = getNearFar_byFrustumIdx(currFrustumIdx);
    float currNear = nearFar.x;
    float currFar = nearFar.y;

    vec3 ray = getViewRay(screenPos, (currFar)); // The "far" for depthTextures if fixed in "RenderShowDepthVS" shader.
    vec3 rayNear = getViewRay(screenPos, currNear);
    float linearDepth = getDepth(screenPos);  

    float radius_D = 20.0;
    float radius_C = 12.0;
    float radius_B = 5.0;
    float radius_A = 0.5;

    //float radius_DD = 26.0;
    //float radius_CC = 15.0;
    //float radius_BB = 5.0;
    //float radius_AA = 0.5;

    float factorByDist = 1.0;
    //vec3 posCC = reconstructPosition(screenPos, linearDepth);
    vec3 posCC = ray * linearDepth + rayNear; 
    //float realDist = near + linearDepth * far;
    float realDist = -posCC.z;

    //if(realDist < bigRadius*5.0)
    //{
    //    factorByDist = smoothstep(0.0, 1.0, realDist/(bigRadius*5.0));
    //}

    float aux = 30.0;
    if(realDist < aux)
    {
        factorByDist = smoothstep(0.0, 1.0, realDist/(aux));
    }

    //if(factorByDist < 0.05)
    //    discard;

    if(bApplySsao)// && !isAlmostOutOfFrustum)
	{        
		vec3 origin = ray * linearDepth;// + rayNear; 
        //vec3 origin = reconstructPosition(screenPos, linearDepth);
        bool isValid = true;
        //vec3 normal2 = normal_from_depth(linearDepth, screenPos, isValid); // normal from depthTex.***
        
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

            // Big radius.***
            occlusion_C += getOcclusion(origin, rotatedKernel, radius_C, nearFar) * factorByDist;
            //occlusion_C += getOcclusion(origin, rotatedKernel, radius_CC, nearFar) * factorByDist;

            // small occl.***
            occlusion_B += getOcclusion(origin, rotatedKernel, radius_B, nearFar) * factorByDist;
            //occlusion_B += getOcclusion(origin, rotatedKernel, radius_BB, nearFar) * factorByDist;

            // radius A.***
            occlusion_A += getOcclusion(origin, rotatedKernel, radius_A, nearFar) * factorByDist;
            //occlusion_A += getOcclusion(origin, rotatedKernel, radius_AA, nearFar) * factorByDist;

            // veryBigRadius.***
            occlusion_D += getOcclusion(origin, rotatedKernel, radius_D, nearFar) * factorByDist;
            //occlusion_D += getOcclusion(origin, rotatedKernel, radius_DD, nearFar) * factorByDist;
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
    else
    {
        // Apply edges from depth.***

    }

    // Do lighting.***
    //float scalarProd = max(0.01, dot(normal, normalize(-ray)));
   // scalarProd /= 3.0;
	//scalarProd += 0.666;
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - scalarProd);

	gl_FragColor = vec4(occlusion_A, occlusion_B, occlusion_C, occlusion_D);
    //gl_FragColor = vec4(normal.xyz, 1.0);
}