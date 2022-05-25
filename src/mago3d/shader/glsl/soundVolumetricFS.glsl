//#version 300 es

#ifdef GL_ES
    //precision lowp float;
    //precision lowp int;
    precision highp float;
#endif

#define %USE_LOGARITHMIC_DEPTH%
#ifdef USE_LOGARITHMIC_DEPTH
#extension GL_EXT_frag_depth : enable
#endif

#define %USE_MULTI_RENDER_TARGET%
#ifdef USE_MULTI_RENDER_TARGET
#extension GL_EXT_draw_buffers : require
#endif

// https://draemm.li/various/volumeRendering/webgl2/

    //*********************************************************
    // R= right, F= front, U= up, L= left, B= back, D= down.
    // RFU = x, y, z.
    // LBD = -x, -y, -z.
    //*********************************************************

    //      +-----------------+
	//      |                 |          
	//      |   screen size   |  
	//      |                 | 
	//      +-----------------+
	//      +-----------------+----------------+
	//      |                 |                | 
	//      |   front depth   |   rear depth   |
	//      |                 |                |
	//      +-----------------+----------------+
	
uniform sampler2D simulationBoxDoubleDepthTex;
uniform sampler2D simulationBoxDoubleNormalTex; // used to calculate the current frustum idx.***
uniform sampler2D airPressureMosaicTex;
uniform sampler2D depthTex; // scene depth texture.***
uniform sampler2D normalTex; // scene depth texture.***
uniform sampler2D airVelocityTex; 

uniform int u_texSize[3]; // The original texture3D size.***
//uniform int u_mosaicTexSize[3]; // The mosaic texture size.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***

varying vec2 v_tex_pos;

uniform mat4 modelViewMatrixRelToEyeInv;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;
uniform float u_airMaxPressure;
uniform vec2 u_screenSize;
uniform vec2 uNearFarArray[4];
uniform float tangentOfHalfFovy;
uniform float aspectRatio;

uniform mat4 u_simulBoxTMatInv;
uniform vec3 u_simulBoxPosHigh;
uniform vec3 u_simulBoxPosLow;
uniform vec3 u_simulBoxMinPosLC;
uniform vec3 u_simulBoxMaxPosLC;

float unpackDepth(const in vec4 rgba_depth)
{
	return dot(rgba_depth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}

float getDepth(vec2 coord)
{
	//if(bUseLogarithmicDepth)
	//{
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
	//	// flogz = 1.0 + gl_Position.z*0.0001;
    //    float Fcoef_half = uFCoef_logDepth/2.0;
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);
	//	float z = (flogzAux - 1.0);
	//	linearDepth = z/(far);
	//	return linearDepth;
	//}
	//else{
		return unpackDepth(texture2D(depthTex, coord.xy));
	//}
}

float getDepth_simulationBox(vec2 coord)
{
	//if(bUseLogarithmicDepth)
	//{
	//	float linearDepth = unpackDepth(texture2D(depthTex, coord.xy));
	//	// gl_FragDepthEXT = linearDepth = log2(flogz) * Fcoef_half;
	//	// flogz = 1.0 + gl_Position.z*0.0001;
    //    float Fcoef_half = uFCoef_logDepth/2.0;
	//	float flogzAux = pow(2.0, linearDepth/Fcoef_half);
	//	float z = (flogzAux - 1.0);
	//	linearDepth = z/(far);
	//	return linearDepth;
	//}
	//else{
		return unpackDepth(texture2D(simulationBoxDoubleDepthTex, coord.xy));
	//}
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

vec3 encodeVelocity(in vec3 vel)
{
	return vel*0.5 + 0.5;
}

vec3 decodeVelocity(in vec3 encodedVel)
{
	return vec3(encodedVel * 2.0 - 1.0);
}

vec3 getVelocity(in vec2 texCoord)
{
    vec4 encodedVel = texture2D(airVelocityTex, texCoord);
    return encodeVelocity(encodedVel.xyz);
}

vec4 getNormal_simulationBox(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, texCoord);
    return decodeNormal(encodedNormal);
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

void get_FrontAndRear_depthTexCoords(in vec2 texCoord, inout vec2 frontTexCoord, inout vec2 rearTexCoord)
{
    //      +-----------------+
	//      |                 |          
	//      |   screen size   |  
	//      |                 | 
	//      +-----------------+
	//      +-----------------+----------------+
	//      |                 |                | 
	//      |   front depth   |   rear depth   |
	//      |                 |                |
	//      +-----------------+----------------+
    vec2 normalTexSize = vec2(u_screenSize.x * 2.0, u_screenSize.y); // the normal tex width is double of the screen size width.***
    vec2 frontNormalFragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);
    vec2 rearNormalFragCoord = vec2(gl_FragCoord.x + u_screenSize.x, gl_FragCoord.y);
    frontTexCoord = vec2(frontNormalFragCoord.x / normalTexSize.x, frontNormalFragCoord.y / normalTexSize.y);
    rearTexCoord = vec2(rearNormalFragCoord.x / normalTexSize.x, rearNormalFragCoord.y / normalTexSize.y);
}

vec3 getViewRay(vec2 tc, in float relFar)
{
	float hfar = 2.0 * tangentOfHalfFovy * relFar;
    float wfar = hfar * aspectRatio;    
    vec3 ray = vec3(wfar * (tc.x - 0.5), hfar * (tc.y - 0.5), -relFar);    
	
    return ray;                      
}

void get_FrontAndRear_posCC(in vec2 screenPos, in float currFar_rear, in float currFar_front, inout vec3 frontPosCC, inout vec3 rearPosCC)
{
    vec2 frontTexCoord;
    vec2 rearTexCoord;
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);

    // If the linear depth is 1, then, take the camPos as the position, so, pos = (0.0, 0.0, 0.0).***
    //vec4 depthColor4 = texture2D(simulationBoxDoubleDepthTex, screenPos);
    //float depthColLength = length(depthColor4);

    // Front posCC.***
    float frontLinearDepth = getDepth_simulationBox(frontTexCoord);
    if(frontLinearDepth < 1e-8)
    {
        frontPosCC = vec3(0.0);
    }
    else
    {
        float front_zDist = frontLinearDepth * currFar_front; 
        frontPosCC = getViewRay(screenPos, front_zDist);
    }
    

    // Rear posCC.***
    float rearLinearDepth = getDepth_simulationBox(rearTexCoord);
    if(rearLinearDepth < 1e-8)
    {
        rearPosCC = vec3(0.0);
    }
    else
    {
        float rear_zDist = rearLinearDepth * currFar_rear; 
        rearPosCC = getViewRay(screenPos, rear_zDist);
    }
    

}

void posWCRelToEye_to_posLC(in vec4 posWC_relToEye, in mat4 local_mat4Inv, in vec3 localPosHIGH, in vec3 localPosLOW, inout vec3 posLC)
{
    vec3 highDifferenceSun = -localPosHIGH.xyz + encodedCameraPositionMCHigh;
	vec3 lowDifferenceSun = posWC_relToEye.xyz -localPosLOW.xyz + encodedCameraPositionMCLow;
	vec4 pos4Sun = vec4(highDifferenceSun.xyz + lowDifferenceSun.xyz, 1.0);
	vec4 vPosRelToLight = local_mat4Inv * pos4Sun;

	posLC = vPosRelToLight.xyz / vPosRelToLight.w;
}

vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col, in int row)
{
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    float sRange = 1.0 / float(u_mosaicSize[0]);
    float tRange = 1.0 / float(u_mosaicSize[1]);

    float s = float(col) * sRange + subTexCoord.x * sRange;
    float t = float(row) * tRange + subTexCoord.y * tRange;

    vec2 resultTexCoord = vec2(s, t);
    return resultTexCoord;
}

float getAirPressure_inMosaicTexture(in vec2 texCoord)
{
    vec4 color4 = texture2D(airPressureMosaicTex, texCoord);
    float decoded = unpackDepth(color4); // 32bit.
    float airPressure = decoded * u_airMaxPressure;

    return airPressure;
}

bool get_airPressure_fromTexture3d(in vec3 texCoord3d, inout float airPressure, inout vec3 velocity)
{
    // tex3d : airPressureMosaicTex
    // 1rst, check texCoord3d boundary limits.***
    if(texCoord3d.x < 0.0 || texCoord3d.x > 1.0)
    {
        return false;
    }

    if(texCoord3d.y < 0.0 || texCoord3d.y > 1.0)
    {
        return false;
    }

    if(texCoord3d.z < 0.0 || texCoord3d.z > 1.0)
    {
        return false;
    }
    // 1rst, determine the sliceIdx.***
    // u_texSize[3]; // The original texture3D size.***
    int originalTexWidth = u_texSize[0];
    int originalTexHeight = u_texSize[1];
    int slicesCount = u_texSize[2];

    float currSliceIdx_float = texCoord3d.z * float(slicesCount);
    int currSliceIdx_down = int(floor(currSliceIdx_float));
    int currSliceIdx_up = currSliceIdx_down + 1;

    // now, calculate the mod.***
    float remain = currSliceIdx_float -  floor(currSliceIdx_float);

    // Now, calculate the "col" & "row" in the mosaic texture3d.***
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***

    // Down slice.************************************************************
    int col_down, row_down;
    if(currSliceIdx_down <= u_mosaicSize[0])
    {
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
        row_down = 0;
        col_down = currSliceIdx_down;
    }
    else
    {
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));

        col_down = int(colAux);
        row_down = int(rowAux);
    }

    // now, must calculate the mosaicTexCoord.***
    vec2 mosaicTexCoord_down = subTexCoord_to_texCoord(texCoord3d.xy, col_down, row_down);

    // Now, read the color4 of the texture in "airPressureMosaicTex".***
    float airPressure_down = getAirPressure_inMosaicTexture(mosaicTexCoord_down);

    vec3 vel_down = getVelocity(mosaicTexCoord_down);

    // up slice.************************************************************
    int col_up, row_up;
    if(currSliceIdx_up <= u_mosaicSize[0])
    {
        // Our current sliceIdx_up is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
        row_up = 0;
        col_up = currSliceIdx_up;
    }
    else
    {
        float rowAux = floor(float(currSliceIdx_up) / float(u_mosaicSize[0]));
        float colAux = float(currSliceIdx_up) - (rowAux * float(u_mosaicSize[0]));

        col_up = int(colAux);
        row_up = int(rowAux);
    }

    // now, must calculate the mosaicTexCoord.***
    vec2 mosaicTexCoord_up = subTexCoord_to_texCoord(texCoord3d.xy, col_up, row_up);

    // Now, read the color4 of the texture in "airPressureMosaicTex".***
    float airPressure_up = getAirPressure_inMosaicTexture(mosaicTexCoord_up);

    vec3 vel_up = getVelocity(mosaicTexCoord_up);

    velocity = mix(vel_down, vel_up, remain);


    airPressure = mix(airPressure_down, airPressure_up, remain);
    return true;
}

void main(){

    // 1rst, read front depth & rear depth and check if exist rear depth.***
    // If no exist rear depth, then discard.***
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y); // 
    vec2 screenPos = v_tex_pos;

    // read normal in rear depth. If no exist normal, then, discard.***
    // calculate the texCoord for rear normal:
    vec2 frontTexCoord;
    vec2 rearTexCoord;
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);

    // test:::
    //vec2 normalTexSize = vec2(u_screenSize.x * 2.0, u_screenSize.y); // the normal tex width is double of the screen size width.***
    //vec2 frontNormalFragCoord = vec2(v_tex_pos.x * u_screenSize.x, v_tex_pos.y * u_screenSize.y);
    //vec2 rearNormalFragCoord = vec2(v_tex_pos.x * u_screenSize.x + u_screenSize.x, v_tex_pos.y * u_screenSize.y);
    //frontTexCoord = vec2(frontNormalFragCoord.x / normalTexSize.x, frontNormalFragCoord.y / normalTexSize.y);
    //rearTexCoord = vec2(rearNormalFragCoord.x / normalTexSize.x, rearNormalFragCoord.y / normalTexSize.y);
    //----------------------

    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);
	vec3 normal = normal4rear.xyz;
    
	if(length(normal) < 0.1)
    {
        discard;
        /*
        vec4 color4discard = vec4(0.0, 0.5, 0.8, 1.0);
        gl_FragData[0] = color4discard;

        #ifdef USE_MULTI_RENDER_TARGET

            gl_FragData[1] = color4discard;

            gl_FragData[2] = color4discard;

            gl_FragData[3] = color4discard;
        #endif

        return;
        */
    }
    
	//discard;

    // 1rst, know the scene depth.***
    vec4 normal4scene = getNormal(v_tex_pos);
    int estimatedFrustumIdx = int(floor(normal4scene.w * 100.0));
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_scene = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear_scene = nearFar_scene.x; // no used in this shader.***
	float currFar_scene = nearFar_scene.y;
    float sceneLinearDepth = getDepth(v_tex_pos);
    float distToCam = sceneLinearDepth * currFar_scene;

    // Now, calculate the positions with the simulation box, front & rear.***
    // rear.***
	estimatedFrustumIdx = int(floor(normal4rear.w * 100.0));
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_rear = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear_rear = nearFar_rear.x; // no used in this shader.***
	float currFar_rear = nearFar_rear.y;

    // front.***
    estimatedFrustumIdx = int(floor(normal4front.w * 100.0));
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_front = getNearFar_byFrustumIdx(currFrustumIdx);
	float currNear_front = nearFar_front.x; // no used in this shader.***
	float currFar_front = nearFar_front.y;

    // Now, calculate the rearPosCC & frontPosCC.***
    vec3 frontPosCC;
    vec3 rearPosCC;
    get_FrontAndRear_posCC(screenPos, currFar_rear, currFar_front, frontPosCC, rearPosCC);
    

    // Now, calculate frontPosWC & rearPosWC.***
    vec4 frontPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);
    vec4 rearPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(rearPosCC.xyz, 1.0);

    // Now, calculate frontPosLC & rearPosLC.***
    vec3 frontPosLC;
    vec3 rearPosLC;
    posWCRelToEye_to_posLC(frontPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLC);
    posWCRelToEye_to_posLC(rearPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, rearPosLC);

    //if(abs(frontPosLC.z) > distToCam)
    //{
    //    discard;
    //}

    // Now, with "frontPosLC" & "rearPosLC", calculate the frontTexCoord3d & rearTexCoord3d.***
    vec3 simulBoxRange = vec3(u_simulBoxMaxPosLC.x - u_simulBoxMinPosLC.x, u_simulBoxMaxPosLC.y - u_simulBoxMinPosLC.y, u_simulBoxMaxPosLC.z - u_simulBoxMinPosLC.z);
    vec3 frontTexCoord3d = vec3((frontPosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (frontPosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (frontPosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);
    vec3 rearTexCoord3d = vec3((rearPosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (rearPosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (rearPosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);

    
    bool testBool = false;

    float totalAirPressure = 0.0;
    float airPressure = 0.0;
    float smplingCount = 0.0;
    float currMaxPressure = 0.0;
    int col = 0;
    int row = 0;
    vec3 samplingDir = normalize(rearTexCoord3d - frontTexCoord3d);
    float increLength = 0.02;
    vec3 velocity;

    vec3 camRay = normalize(getViewRay(v_tex_pos, 1.0));
    
    for(int i=0; i<50; i++)
    {
        if(get_airPressure_fromTexture3d(frontTexCoord3d + samplingDir * increLength * float(i), airPressure, velocity))
        {
            // Now, compare the velocity direction with the camRay.***
            vec3 normalizedVel = normalize(velocity);
            float dotProd = abs(dot(camRay, normalizedVel));
            totalAirPressure += airPressure * (1.0 - dotProd) * 100.0;
            smplingCount += 1.0;
            if(airPressure > currMaxPressure)
            {
                currMaxPressure = airPressure;
            }
        }
        else
        {
            //if (i>0)
            {
                testBool = true;
            }
        }
        
    }

    float averageAirPressure = totalAirPressure / smplingCount;

    if(averageAirPressure < 1e-8)
    {
        discard;
    }

    float unitaryAirPressure = averageAirPressure / u_airMaxPressure;

    vec4 color4Aux = vec4(totalAirPressure*100.0, 0.5, 0.3, 1.0);
    float f = 1.0;
    color4Aux = vec4(totalAirPressure*f, totalAirPressure*f, totalAirPressure*f, totalAirPressure*1.0);

    //if(currMaxPressure > 0.01)
    //{
    //    currMaxPressure = 0.9;
    //}
    //color4Aux = vec4(currMaxPressure, currMaxPressure, currMaxPressure, currMaxPressure);


    gl_FragData[0] = color4Aux;

    #ifdef USE_MULTI_RENDER_TARGET

        gl_FragData[1] = color4Aux;

        gl_FragData[2] = color4Aux;

        gl_FragData[3] = color4Aux;
    #endif
}

/*
uniform sampler3D tex;
uniform sampler3D normals;
uniform sampler2D colorMap;

uniform mat4 transform;
uniform int depthSampleCount;
uniform float zScale;

uniform vec3 lightPosition;

uniform float brightness;

//uniform vec4 opacitySettings;
// x: minLevel
// y: maxLevel
// z: lowNode
// w: highNode

in vec2 texCoord;

//in vec4 origin;
//in vec4 direction;

out vec4 color;

vec3 ambientLight = vec3(0.34, 0.32, 0.32);
vec3 directionalLight = vec3(0.5, 0.5, 0.5);
vec3 lightVector = normalize(vec3(-1.0, -1.0, 1.0));
vec3 specularColor = vec3(0.5, 0.5, 0.5);

vec3 aabb[2] = vec3[2](
	vec3(0.0, 0.0, 0.0),
	vec3(1.0, 1.0, 1.0)
);

struct Ray {
    vec3 origin;
    vec3 direction;
    vec3 inv_direction;
    int sign[3];
};

Ray makeRay(vec3 origin, vec3 direction) {
    vec3 inv_direction = vec3(1.0) / direction;
    
    return Ray(
        origin,
        direction,
        inv_direction,
        int[3](
			((inv_direction.x < 0.0) ? 1 : 0),
			((inv_direction.y < 0.0) ? 1 : 0),
			((inv_direction.z < 0.0) ? 1 : 0)
		)
    );
}

/*
	From: https://github.com/hpicgs/cgsee/wiki/Ray-Box-Intersection-on-the-GPU
void intersect(
    in Ray ray, in vec3 aabb[2],
    out float tmin, out float tmax
){
    float tymin, tymax, tzmin, tzmax;
    tmin = (aabb[ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;
    tmax = (aabb[1-ray.sign[0]].x - ray.origin.x) * ray.inv_direction.x;
    tymin = (aabb[ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;
    tymax = (aabb[1-ray.sign[1]].y - ray.origin.y) * ray.inv_direction.y;
    tzmin = (aabb[ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;
    tzmax = (aabb[1-ray.sign[2]].z - ray.origin.z) * ray.inv_direction.z;
    tmin = max(max(tmin, tymin), tzmin);
    tmax = min(min(tmax, tymax), tzmax);
}
*/


/*

void main(){
	
	//transform = inverse(transform);
	
	vec4 origin = vec4(0.0, 0.0, 2.0, 1.0);
	origin = transform * origin;
	origin = origin / origin.w;
	origin.z = origin.z / zScale;
	origin = origin + 0.5;

	vec4 image = vec4(texCoord, 4.0, 1.0);
	image = transform * image;
	//image = image / image.w;
	image.z = image.z / zScale;
	image = image + 0.5;
	//vec4 direction = vec4(0.0, 0.0, 1.0, 0.0);
	vec4 direction = normalize(origin-image);
	//direction = transform * direction;

	Ray ray = makeRay(origin.xyz, direction.xyz);
	float tmin = 0.0;
	float tmax = 0.0;
	intersect(ray, aabb, tmin, tmax);

	vec4 value = vec4(0.0, 0.0, 0.0, 0.0);
,
	if(tmin > tmax){
		color = value;
		discard;
	}

	vec3 start = origin.xyz + tmin*direction.xyz;
	vec3 end = origin.xyz + tmax*direction.xyz;
	
	float length = distance(end, start);
	int sampleCount = int(float(depthSampleCount)*length);
	//vec3 increment = (end-start)/float(sampleCount);
	//vec3 originOffset = mod((start-origin.xyz), increment);

	float s = 0.0;
	float px = 0.0;
	vec4 pxColor = vec4(0.0, 0.0, 0.0, 0.0);
	vec3 texCo = vec3(0.0, 0.0, 0.0);
	vec3 normal = vec3(0.0, 0.0, 0.0);
	vec4 zero = vec4(0.0);
	
	for(int count = 0; count < sampleCount; count++){

		texCo = mix(start, end, float(count)/float(sampleCount));// - originOffset;

		//texCo = start + increment*float(count);
		px = texture(tex, texCo).r;

		
		//px = length(texture(normals, texCo).xyz - 0.5);
		//px = px * 1.5;
		
		pxColor = texture(colorMap, vec2(px, 0.0));
		
		normal = normalize(texture(normals, texCo).xyz - 0.5);
		float directional = clamp(dot(normal, lightVector), 0.0, 1.0);

		//vec3 R = -reflect(lightDirection, surfaceNormal);
		//return pow(max(0.0, dot(viewDirection, R)), shininess);

		float specular = max(dot(direction.xyz, reflect(lightVector, normal)), 0.0);
		specular = pow(specular, 3.0);

		pxColor.rgb = ambientLight*pxColor.rgb + directionalLight*directional*pxColor.rgb + pxColor.a*specular*specularColor;
			
		
		//value = mix(value, pxColor, px);
		//value = (1.0-value.a)*pxColor + value;
		//value = mix(pxColor, zero, value.a) + value;
		
		value = value + pxColor - pxColor*value.a;
		
		if(value.a >= 0.95){
			break;
		}
	}
	color = value*brightness;
}
*/
