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
uniform sampler2D pollutionMosaicTex; // pollutionTex. (from chemical accident).***
uniform sampler2D sceneDepthTex; // scene depth texture.***
uniform sampler2D sceneNormalTex; // scene normal texture.***
uniform sampler2D cuttingPlaneDepthTex;
uniform sampler2D cuttingPlaneNormalTex;

uniform int u_texSize[3]; // The original texture3D size.***
uniform int u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
uniform vec3 u_voxelSizeMeters;

varying vec2 v_tex_pos;

uniform mat4 modelViewMatrixRelToEye;
uniform mat4 modelViewMatrixRelToEyeInv;
uniform vec3 encodedCameraPositionMCHigh;
uniform vec3 encodedCameraPositionMCLow;

uniform vec2 u_minMaxPollutionValues;
uniform vec2 u_minMaxPollutionValuesToRender;
uniform float u_airEnvirontmentPressure;
uniform vec2 u_screenSize;
uniform vec2 uNearFarArray[4];
uniform float tangentOfHalfFovy;
uniform float aspectRatio;
uniform vec2 uMinMaxAltitudeSlices[32]; // limited to 32 slices.***
uniform int u_useCuttingPlane;
uniform int u_useMinMaxValuesToRender;
uniform vec4 u_cuttingPlanePosLC;

uniform mat4 u_simulBoxTMat;
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
		return unpackDepth(texture2D(sceneDepthTex, coord.xy));
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

float getDepth_cuttingPlane(vec2 coord)
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
		return unpackDepth(texture2D(cuttingPlaneDepthTex, coord.xy));
	//}
}

vec4 decodeNormal(in vec4 normal)
{
	return vec4(normal.xyz * 2.0 - 1.0, normal.w);
}

vec4 getNormal(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(sceneNormalTex, texCoord);
    return decodeNormal(encodedNormal);
}


vec4 getNormal_simulationBox(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, texCoord);
    return decodeNormal(encodedNormal);
}

vec4 getNormal_cuttingPlane(in vec2 texCoord)
{
    vec4 encodedNormal = texture2D(cuttingPlaneNormalTex, texCoord);
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
    //vec2 frontNormalFragCoord = vec2(gl_FragCoord.x, gl_FragCoord.y);
    //vec2 rearNormalFragCoord = vec2(gl_FragCoord.x + u_screenSize.x, gl_FragCoord.y);
    float windows_x = texCoord.x * u_screenSize.x;
    float windows_y = texCoord.y * u_screenSize.y;
    vec2 frontNormalFragCoord = vec2(windows_x, windows_y);
    vec2 rearNormalFragCoord = vec2(windows_x + u_screenSize.x, windows_y);

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

void get_cuttingPlane_posCC(in vec2 screenPos, in float currFar, inout vec3 posCC)
{

    // posCC.***
    float frontLinearDepth = getDepth_cuttingPlane(screenPos);
    if(frontLinearDepth < 1e-8)
    {
        posCC = vec3(0.0);
    }
    else
    {
        float front_zDist = frontLinearDepth * currFar; 
        posCC = getViewRay(screenPos, front_zDist);
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

void checkTexCoordRange(inout vec2 texCoord)
{
    float error = 0.0;
    if(texCoord.x < 0.0)
    {
        texCoord.x = 0.0 + error;
    }
    else if(texCoord.x > 1.0)
    {
        texCoord.x = 1.0 - error;
    }

    if(texCoord.y < 0.0)
    {
        texCoord.y = 0.0 + error;
    }
    else if(texCoord.y > 1.0)
    {
        texCoord.y = 1.0 - error;
    }
}

void checkTexCoord3DRange(inout vec3 texCoord)
{
    float error = 0.0;
    if(texCoord.x < 0.0)
    {
        texCoord.x = 0.0 + error;
    }
    else if(texCoord.x > 1.0)
    {
        texCoord.x = 1.0 - error;
    }

    if(texCoord.y < 0.0)
    {
        texCoord.y = 0.0 + error;
    }
    else if(texCoord.y > 1.0)
    {
        texCoord.y = 1.0 - error;
    }

    if(texCoord.z < 0.0)
    {
        texCoord.z = 0.0 + error;
    }
    else if(texCoord.z > 1.0)
    {
        texCoord.z = 1.0 - error;
    }
}

vec2 subTexCoord_to_texCoord(in vec2 subTexCoord, in int col_mosaic, in int row_mosaic)
{
    // given col, row & subTexCoord, this function returns the texCoord into mosaic texture.***
    // The "subTexCoord" is the texCoord of the subTexture[col, row].***
    // u_mosaicSize =  The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    checkTexCoordRange(subTexCoord);
    float sRange = 1.0 / float(u_mosaicSize[0]);
    float tRange = 1.0 / float(u_mosaicSize[1]);

    float s = float(col_mosaic) * sRange + subTexCoord.x * sRange;
    float t = float(row_mosaic) * tRange + subTexCoord.y * tRange;

    // must check if the texCoord_tl is boundary in x & y.***************************************************************************
    float mosaicTexSize_x = float(u_texSize[0] * u_mosaicSize[0]); // for example : 150 pixels * 3 columns = 450 pixels.***
    float mosaicTexSize_y = float(u_texSize[1] * u_mosaicSize[1]); // for example : 150 pixels * 3 rows = 450 pixels.***

    float currMosaicStart_x = float(col_mosaic * u_texSize[0]);
    float currMosaicStart_y = float(row_mosaic * u_texSize[1]);
    float currMosaicEnd_x = currMosaicStart_x + float(u_texSize[0]);
    float currMosaicEnd_y = currMosaicStart_y + float(u_texSize[1]);

    float pixel_x = s * mosaicTexSize_x;
    float pixel_y = t * mosaicTexSize_y;

    if(pixel_x < currMosaicStart_x + 1.0)
    {
        pixel_x = currMosaicStart_x + 1.0;
    }
    else if(pixel_x > currMosaicEnd_x - 1.0)
    {
        pixel_x = currMosaicEnd_x - 1.0;
    }

    if(pixel_y < currMosaicStart_y + 1.0)
    {
        pixel_y = currMosaicStart_y + 1.0;
    }
    else if(pixel_y > currMosaicEnd_y - 1.0)
    {
        pixel_y = currMosaicEnd_y - 1.0;
    }

    s = pixel_x / mosaicTexSize_x;
    t = pixel_y / mosaicTexSize_y;


    vec2 resultTexCoord = vec2(s, t);

    return resultTexCoord;
}



float getPollution_inMosaicTexture(in vec2 texCoord)
{
    checkTexCoordRange(texCoord);
    vec4 color4;
    color4 = texture2D(pollutionMosaicTex, texCoord);
    float decoded = unpackDepth(color4); // 32bit.
    float pollution = decoded * u_minMaxPollutionValues.y;

    return pollution;
}

float _getPollution_triLinearInterpolation(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic)
{
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), 
    // and the col & row into the mosaic texture, returns a trilinear interpolation of the pressure.***

    //************************************************************************************
    // u_texSize[3]; // The original texture3D size.***
    // mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***
    //------------------------------------------------------------------------------------

    checkTexCoordRange(subTexCoord2d);
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    vec2 px = 1.0 / sim_res3d.xy;
    vec2 vc = (floor(subTexCoord2d * sim_res3d.xy)) * px;
    vec2 f = fract(subTexCoord2d * sim_res3d.xy);
    vec2 texCoord_tl = vec2(vc);

    
    

    vec2 texCoord_tr = vec2(vc + vec2(px.x, 0));
    vec2 texCoord_bl = vec2(vc + vec2(0, px.y));
    vec2 texCoord_br = vec2(vc + vec2(px.x, px.y));

    checkTexCoordRange(texCoord_tl);
    checkTexCoordRange(texCoord_tr);
    checkTexCoordRange(texCoord_bl);
    checkTexCoordRange(texCoord_br);
    vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);
    vec2 mosaicTexCoord_tr = subTexCoord_to_texCoord(texCoord_tr, col_mosaic, row_mosaic);
    vec2 mosaicTexCoord_bl = subTexCoord_to_texCoord(texCoord_bl, col_mosaic, row_mosaic);
    vec2 mosaicTexCoord_br = subTexCoord_to_texCoord(texCoord_br, col_mosaic, row_mosaic);

    // vec2 mosaicTexCoord_tl = subTexCoord_to_texCoord(texCoord_tl, col_mosaic, row_mosaic);
    // vec2 mosaicTexCoord_tr = vec2(mosaicTexCoord_tl + vec2(px.x, 0));
    // vec2 mosaicTexCoord_bl = vec2(mosaicTexCoord_tl + vec2(0, px.y));
    // vec2 mosaicTexCoord_br = vec2(mosaicTexCoord_tl + vec2(px.x, px.y));


    float ap_tl = getPollution_inMosaicTexture(mosaicTexCoord_tl);
    float ap_tr = getPollution_inMosaicTexture(mosaicTexCoord_tr);
    float ap_bl = getPollution_inMosaicTexture(mosaicTexCoord_bl);
    float ap_br = getPollution_inMosaicTexture(mosaicTexCoord_br);

    float airPressure = mix(mix(ap_tl, ap_tr, f.x), mix(ap_bl, ap_br, f.x), f.y);

    return airPressure;
}


float _getPollution_nearest(in vec2 subTexCoord2d, in int col_mosaic, in int row_mosaic)
{
    // This function : given a subTexture2d(real texCoord.xy of a realTex3D), 
    // and the col & row into the mosaic texture, returns a nearest interpolation of the pressure.***
    checkTexCoordRange(subTexCoord2d);
    vec2 mosaicTexCoord = subTexCoord_to_texCoord(subTexCoord2d, col_mosaic, row_mosaic);
    float ap = getPollution_inMosaicTexture(mosaicTexCoord);
    return ap;
}

bool getUpDownSlicesIdx(in vec3 posLC, inout int sliceDownIdx, inout int sliceUpIdx, inout float distUp, inout float distDown)
{
    // uMinMaxAltitudeSlices[32]; // limited to 32 slices.***
    // u_texSize[3] =  The original texture3D size.***
    float altitude = posLC.z;
    int currSliceIdx = -1;
    for(int i=0; i<32; i++)
    {
        if(altitude >= uMinMaxAltitudeSlices[i].x && altitude < uMinMaxAltitudeSlices[i].y)
        {
            currSliceIdx = i;
            break;
        }
    }

    if(currSliceIdx < 0)
    {
        return false;
    }

    if(currSliceIdx == 0)
    {
        sliceDownIdx = currSliceIdx;
        sliceUpIdx = currSliceIdx;
    }
    else
    {
        sliceDownIdx = currSliceIdx-1;
        sliceUpIdx = currSliceIdx;
    }

    if(sliceUpIdx > u_texSize[2] - 1)
    {
        sliceUpIdx = u_texSize[2] - 1;
    }

    // +------------------------------+ <- sliceUp
    //                 |
    //                 |
    //                 |  distUp
    //                 |
    //                 * <- posL.z
    //                 |
    //                 |  distDown
    // +------------------------------+ <- sliceDown
    float sliceUpAltitude = 0.0;
    float sliceDownAltitude = 0.0;
    for(int i=0; i<32; i++)
    {
        if(sliceUpIdx == i)
        {
            sliceUpAltitude = uMinMaxAltitudeSlices[i].y;
            sliceDownAltitude = uMinMaxAltitudeSlices[i].x;
            break;
        }
    }

    distUp = abs(sliceUpAltitude - altitude);
    distDown = abs(altitude - sliceDownAltitude);

    return true;
}

bool getUpDownSlicesIdx_FAST(in vec3 posLC, inout int sliceDownIdx, inout int sliceUpIdx)
{
    // uMinMaxAltitudeSlices[32]; // limited to 32 slices.***
    // u_texSize[3] =  The original texture3D size.***
    float altitude = posLC.z;
    int currSliceIdx = -1;
    for(int i=0; i<32; i++)
    {
        if(altitude >= uMinMaxAltitudeSlices[i].x && altitude < uMinMaxAltitudeSlices[i].y)
        {
            currSliceIdx = i;
            break;
        }
    }

    if(currSliceIdx < 0)
    {
        return false;
    }

    if(currSliceIdx == 0)
    {
        sliceDownIdx = currSliceIdx;
        sliceUpIdx = currSliceIdx;
    }
    else
    {
        sliceDownIdx = currSliceIdx-1;
        sliceUpIdx = currSliceIdx;
    }

    if(sliceUpIdx > u_texSize[2] - 1)
    {
        sliceUpIdx = u_texSize[2] - 1;
    }

    return true;
}

bool get_pollution_fromTexture3d_triLinearInterpolation_FAST(in vec3 texCoord3d, in vec3 posLC, inout float airPressure)
{
    // Here is not important the pollution value. Only need know if the pollution value is zero or not.***
    // this function is called by "findFirstSamplePosition".***
    // tex3d : airPressureMosaicTex

    // 1rst, determine the sliceIdx.***
    int currSliceIdx_down = -1;
    int currSliceIdx_up = -1;
    float distUp = 0.0;
    float distDown = 0.0;

    if(!getUpDownSlicesIdx_FAST(posLC, currSliceIdx_down, currSliceIdx_up))
    {
        return false;
    }

    float distUpAndDown = distUp + distDown;
    float distUpRatio = distUp / distUpAndDown;
    float distDownRatio = distDown / distUpAndDown;

    // Down slice.************************************************************
    int col_down, row_down;
    //if(currSliceIdx_down <= u_mosaicSize[0])
    //{
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
    //    row_down = 0;
    //    col_down = currSliceIdx_down;
    //}
    //else
    {
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));

        col_down = int(colAux);
        row_down = int(rowAux);
    }

    float airPressure_down = _getPollution_nearest(texCoord3d.xy, col_down, row_down);

    if(airPressure_down > 0.0)
    {
        airPressure = airPressure_down;
        return true;
    }

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

    // test.***
    col_up = col_down + 1;
    row_up = row_down;
    if(col_up >= u_mosaicSize[0])
    {
        col_up = 0;
        row_up = row_down + 1;
    }

    if(row_up >= u_mosaicSize[1])
    {
        return false;
    }

    float airPressure_up = _getPollution_nearest(texCoord3d.xy, col_up, row_up);
    if(airPressure_up > 0.0)
    {
        airPressure = airPressure_up;
        return true;
    }


    return false;
}

bool get_pollution_fromTexture3d_triLinearInterpolation(in vec3 texCoord3d, in vec3 posLC, inout float airPressure)
{
    // tex3d : airPressureMosaicTex
    // 1rst, check texCoord3d boundary limits.***
    float error = 0.001;
    // if(texCoord3d.x < 0.0 + error || texCoord3d.x > 1.0 - error)
    // {
    //     return false;
    // }

    // if(texCoord3d.y < 0.0 + error || texCoord3d.y > 1.0 - error)
    // {
    //     return false;
    // }

    // if(texCoord3d.z < 0.0 + error || texCoord3d.z > 1.0 - error)
    // {
    //     return false;
    // }
    // 1rst, determine the sliceIdx.***
    int currSliceIdx_down = -1;
    int currSliceIdx_up = -1;
    float distUp = 0.0;
    float distDown = 0.0;

    if(!getUpDownSlicesIdx(posLC, currSliceIdx_down, currSliceIdx_up, distUp, distDown))
    {
        return false;
    }

    float distUpAndDown = distUp + distDown;
    float distUpRatio = distUp / distUpAndDown;
    float distDownRatio = distDown / distUpAndDown;

    // Down slice.************************************************************
    int col_down, row_down;
    //if(currSliceIdx_down <= u_mosaicSize[0])
    //{
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
    //    row_down = 0;
    //    col_down = currSliceIdx_down;
    //}
    //else
    {
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));

        col_down = int(colAux);
        row_down = int(rowAux);
    }

    float airPressure_down = _getPollution_triLinearInterpolation(texCoord3d.xy, col_down, row_down);

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

    // test.***
    col_up = col_down + 1;
    row_up = row_down;
    if(col_up >= u_mosaicSize[0])
    {
        col_up = 0;
        row_up = row_down + 1;
    }

    if(row_up >= u_mosaicSize[1])
    {
        return false;
    }

    float airPressure_up = _getPollution_triLinearInterpolation(texCoord3d.xy, col_up, row_up);

    airPressure = mix(airPressure_down, airPressure_up, distDownRatio);
    //airPressure = mix(airPressure_down, airPressure_up, 0.5);

    return true;
}

bool get_pollution_fromTexture3d_triLinearInterpolation_original(in vec3 texCoord3d, inout float airPressure)
{
    // This function is used if all slices of the texture3d has same altitude differences.***
    //---------------------------------------------------------------------------------------
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
    int slicesCount = u_texSize[2];

    float currSliceIdx_float = texCoord3d.z * float(slicesCount - 1);
    int currSliceIdx_down = int(floor(currSliceIdx_float));
    int currSliceIdx_up = currSliceIdx_down + 1;

    if(currSliceIdx_up >= u_texSize[2])
    {
        return false;
    }

    // now, calculate the mod.***
    //float remain = currSliceIdx_float -  floor(currSliceIdx_float);
    float remain = fract(currSliceIdx_float);

    // Now, calculate the "col" & "row" in the mosaic texture3d.***
    // u_mosaicSize[3]; // The mosaic composition (xTexCount X yTexCount X zSlicesCount).***

    // Down slice.************************************************************
    int col_down, row_down;
    //if(currSliceIdx_down <= u_mosaicSize[0])
    //{
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
    //    row_down = 0;
    //    col_down = currSliceIdx_down;
   // }
    //else
    {
        float rowAux = floor(float(currSliceIdx_down) / float(u_mosaicSize[0]));
        float colAux = float(currSliceIdx_down) - (rowAux * float(u_mosaicSize[0]));

        col_down = int(colAux);
        row_down = int(rowAux);
    }

    // now, must calculate the mosaicTexCoord.***
    vec2 mosaicTexCoord_down = subTexCoord_to_texCoord(texCoord3d.xy, col_down, row_down);
    
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    vec2 px = 1.0 / sim_res3d.xy;
    vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;
    vec3 f = fract(texCoord3d * sim_res3d);

    float airPressure_down = _getPollution_triLinearInterpolation(texCoord3d.xy, col_down, row_down);

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

    // test.***
    col_up = col_down + 1;
    row_up = row_down;
    if(col_up >= u_mosaicSize[0])
    {
        col_up = 0;
        row_up = row_down + 1;
    }

    if(row_up >= u_mosaicSize[1])
    {
        return false;
    }

    float airPressure_up = _getPollution_triLinearInterpolation(texCoord3d.xy, col_up, row_up);

    airPressure = mix(airPressure_down, airPressure_up, f.z);
    //airPressure = airPressure_down; // test delete.***
    return true;
}

bool get_pollution_fromTexture3d_nearest(in vec3 texCoord3d, inout float airPressure)
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
    int slicesCount = u_texSize[2];

    float currSliceIdx_float = texCoord3d.z * float(slicesCount -  1);
    int currSliceIdx_down = int(floor(currSliceIdx_float));
    int currSliceIdx_up = currSliceIdx_down + 1;
    int currSliceIdx = currSliceIdx_down;

    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    //vec2 px = 1.0 / sim_res3d.xy;
    //vec2 vc = (floor(texCoord3d.xy * sim_res3d.xy)) * px;
    vec3 f = fract(texCoord3d * sim_res3d);

    if(f.z > 0.5)
    {
        currSliceIdx = currSliceIdx_up;
    }

    if(currSliceIdx >= u_texSize[2])
    {
        return false;
    }

    // ************************************************************
    int col, row;
    //if(currSliceIdx <= u_mosaicSize[0])
    //{
        // Our current sliceIdx_down is smaller than the columns count of the mosaic, so:
        // in this case, the row = 0.***
    //    row = 0;
   //     col = currSliceIdx;
   /// }
    //else
    {
        float mosaicSize_x = float(u_mosaicSize[0]);
        float rowAux = floor(float(currSliceIdx) / mosaicSize_x);
        float colAux = float(currSliceIdx) - (rowAux * mosaicSize_x);

        col = int(colAux);
        row = int(rowAux);
    }

    // now, must calculate the mosaicTexCoord.***

    airPressure = _getPollution_nearest(texCoord3d.xy, col, row);

    return true;
}

vec4 getRainbowColor_byHeight(in float height, in float minHeight_rainbow, in float maxHeight_rainbow, bool hotToCold)
{
    
    float gray = (height - minHeight_rainbow)/(maxHeight_rainbow - minHeight_rainbow);
	if (gray > 1.0){ gray = 1.0; }
	else if (gray<0.0){ gray = 0.0; }

    float value = gray * 3.99;
    float h = floor(value);
    float f = fract(value);

    // test.***
    if(gray > 0.0000001)
    {
        //gray = 0.95;
    }

    vec4 resultColor = vec4(0.0, 0.0, 0.0, (gray));

    if(hotToCold)
    {
        // HOT to COLD.***
        resultColor.rgb = vec3(1.0, 0.0, 0.0); // init
        if(h >= 0.0 && h < 1.0)
        {
            // mix red & yellow.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(red, yellow, f);
        }
        else if(h >= 1.0 && h < 2.0)
        {
            // mix yellow & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, green, f);
        }
        else if(h >= 2.0 && h < 3.0)
        {
            // mix green & cyan.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(green, cyan, f);
        }
        else if(h >= 3.0)
        {
            // mix cyan & blue.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, blue, f);
        }
    }
    else
    {
        // COLD to HOT.***
        resultColor.rgb = vec3(0.0, 0.0, 1.0); // init
        if(h >= 0.0 && h < 1.0)
        {
            // mix blue & cyan.***
            vec3 blue = vec3(0.0, 0.0, 1.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(blue, cyan, f);
        }
        else if(h >= 1.0 && h < 2.0)
        {
            // mix cyan & green.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            resultColor.rgb = mix(cyan, green, f);  
        }
        else if(h >= 2.0 && h < 3.0)
        {
            // mix green & yellow.***
            vec3 green = vec3(0.0, 1.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(green, yellow, f);
        }
        else if(h >= 3.0)
        {
            // mix yellow & red.***
            vec3 red = vec3(1.0, 0.0, 0.0);
            vec3 yellow = vec3(1.0, 1.0, 0.0);
            resultColor.rgb = mix(yellow, red, f);
        }
    }

    return resultColor;
}


// https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
// The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. 
//--------------------------------------------------------------------------------------------------------------------------

// https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques
//--------------------------------------------------------------------------------------------------------------------------

/*
// https://martinopilia.com/posts/2018/09/17/volume-raycasting.html
// Estimate the normal from a finite difference approximation of the gradient
vec3 normal(vec3 position, float intensity)
{
    float d = step_length;
    float dx = texture(volume, position + vec3(d,0,0)).r - intensity;
    float dy = texture(volume, position + vec3(0,d,0)).r - intensity;
    float dz = texture(volume, position + vec3(0,0,d)).r - intensity;
    return -normalize(NormalMatrix * vec3(dx, dy, dz));
}*/

bool normalLC(vec3 texCoord3d, in vec3 posLC, inout vec3 result_normal)
{
    // Estimate the normal from a finite difference approximation of the gradient
    vec3 sim_res3d = vec3(u_texSize[0], u_texSize[1], u_texSize[2]);
    vec3 pix = 1.0 / sim_res3d;

    checkTexCoord3DRange(texCoord3d);

    vec3 vc = texCoord3d;

    // dx.*************************************************
    float airPressure_dx = 0.0;
    vec3 velocity_dx;
    vec3 texCoord3d_dx = vec3(vc + vec3(pix.x, 0.0, 0.0));
    bool succes_dx =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dx, posLC, airPressure_dx);
    if(!succes_dx)return false;

    float airPressure_dx_neg = 0.0;
    vec3 velocity_dx_neg;
    vec3 texCoord3d_dx_neg = vec3(vc - vec3(pix.x, 0.0, 0.0));
    bool succes_dx_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dx_neg, posLC, airPressure_dx_neg);
    if(!succes_dx_neg)return false;

    // dy.*************************************************
    float airPressure_dy = 0.0;
    vec3 velocity_dy;
    vec3 texCoord3d_dy = vec3(vc + vec3(0.0, pix.y, 0.0));
    bool succes_dy =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dy, posLC, airPressure_dy);
    if(!succes_dy)return false;

    float airPressure_dy_neg = 0.0;
    vec3 velocity_dy_neg;
    vec3 texCoord3d_dy_neg = vec3(vc - vec3(0.0, pix.y, 0.0));
    bool succes_dy_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dy_neg, posLC, airPressure_dy_neg);
    if(!succes_dy_neg)return false;

    // dz.*************************************************
    float airPressure_dz = 0.0;
    vec3 velocity_dz;
    vec3 texCoord3d_dz = vec3(vc + vec3(0.0, 0.0, pix.z));
    bool succes_dz =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dz, posLC, airPressure_dz);
    if(!succes_dz)return false;

    float airPressure_dz_neg = 0.0;
    vec3 velocity_dz_neg;
    vec3 texCoord3d_dz_neg = vec3(vc - vec3(0.0, 0.0, pix.z));
    bool succes_dz_neg =  get_pollution_fromTexture3d_triLinearInterpolation(texCoord3d_dz_neg, posLC, airPressure_dz_neg);
    if(!succes_dz_neg)return false;

    //result_normal = normalize(vec3(airPressure_dx - pressure, airPressure_dy - pressure, airPressure_dz - pressure));
    result_normal = normalize(vec3(airPressure_dx - airPressure_dx_neg, airPressure_dy - airPressure_dy_neg, airPressure_dz - airPressure_dz_neg));

    if(abs(result_normal.x) > 0.0 || abs(result_normal.y) > 0.0 || abs(result_normal.z) > 0.0 )
    {
        return true;
    }
    else return false;

    return true;
}

vec4 transfer_fnc(in float pressure)
{
    // The transfer function specifies what color and opacity value should be assigned for a given value sampled from the volume. 
    //float maxPressureRef = 1.05;
    //float minPressureRef = u_airEnvirontmentPressure;
    float maxPressureRef = u_minMaxPollutionValues.y; // test.***
    float minPressureRef = u_minMaxPollutionValues.x; // test.***
    bool bHotToCold = false; // we want coldToHot (blue = min to red = max).***
    vec4 rainbowCol3 = getRainbowColor_byHeight(pressure, minPressureRef, maxPressureRef, bHotToCold);

    return rainbowCol3;
}

bool isSimulationBoxEdge(vec2 screenPos)
{
    // This function is used to render the simulation box edges.***
    // check the normals.***
    vec2 frontTexCoord;
    vec2 rearTexCoord;
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);
    float pixelSize_x = 1.0 / (u_screenSize.x * 2.0);
    float pixelSize_y = 1.0 / u_screenSize.y;
    
    // check front.***
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);
    vec4 normal4front_up = getNormal_simulationBox(vec2(frontTexCoord.x, frontTexCoord.y + pixelSize_y));

    if(dot(normal4front.xyz, normal4front_up.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    vec4 normal4front_left = getNormal_simulationBox(vec2(frontTexCoord.x - pixelSize_x, frontTexCoord.y));    
    if(dot(normal4front.xyz, normal4front_left.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    vec4 normal4front_down = getNormal_simulationBox(vec2(frontTexCoord.x, frontTexCoord.y - pixelSize_y));    
    if(dot(normal4front.xyz, normal4front_down.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    vec4 normal4front_rigth = getNormal_simulationBox(vec2(frontTexCoord.x + pixelSize_x, frontTexCoord.y));    
    if(dot(normal4front.xyz, normal4front_rigth.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    // now, check the rear normals.***
    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);
    vec4 normal4rear_up = getNormal_simulationBox(vec2(rearTexCoord.x, rearTexCoord.y + pixelSize_y));

    if(dot(normal4rear.xyz, normal4rear_up.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    vec4 normal4rear_left = getNormal_simulationBox(vec2(rearTexCoord.x - pixelSize_x, rearTexCoord.y));    
    if(dot(normal4rear.xyz, normal4rear_left.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    vec4 normal4rear_down = getNormal_simulationBox(vec2(rearTexCoord.x, rearTexCoord.y - pixelSize_y));    
    if(dot(normal4rear.xyz, normal4rear_down.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    vec4 normal4rear_rigth = getNormal_simulationBox(vec2(rearTexCoord.x + pixelSize_x, rearTexCoord.y));    
    if(dot(normal4rear.xyz, normal4rear_rigth.xyz) < 0.95)
    {
        return true; // is edge.***
    }

    return false;
}

bool findFirstSamplePosition(in vec3 frontPosLC, in vec3 rearPosLC, in vec3 samplingDirLC, in float increLength, in vec3 simulBoxRange, inout vec3 result_samplePos, inout int iteration)
{
    // This function finds the first sample position.***
    // Here is not important the pollution value. Only need know if the pollution value is zero or not.***
    float contaminationSample = 0.0;
    vec3 samplePosLC;
    vec3 samplePosLC_prev;
    float minValToConsidereSample = u_minMaxPollutionValues[0]; // original.***
    //float minValToConsidereSample = (u_minMaxPollutionValues[1] - u_minMaxPollutionValues[0]) * 0.0001;
    for(int i=0; i<30; i++)
    {
        // Note : for each smple, must depth check with the scene depthTexure.***
        float dist = float(i) * increLength;
        samplePosLC = frontPosLC + samplingDirLC * dist;
        iteration = i;

        if(i == 0)
        {
            samplePosLC_prev = samplePosLC;
        }

        contaminationSample = 0.0;
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);
        checkTexCoord3DRange(sampleTexCoord3d);

        if(get_pollution_fromTexture3d_triLinearInterpolation_FAST(sampleTexCoord3d, samplePosLC, contaminationSample))
        {
            if(contaminationSample > minValToConsidereSample)
            {
                if(i > 0)
                {
                    // check the prev semiPos.***
                    vec3 samplePosLC_semiPrev = samplePosLC - samplingDirLC * increLength * 0.5;
                    if(get_pollution_fromTexture3d_triLinearInterpolation_FAST(sampleTexCoord3d, samplePosLC_semiPrev, contaminationSample))
                    {
                        if(contaminationSample > minValToConsidereSample)
                        {
                            result_samplePos = samplePosLC_prev;
                            return true;
                        }
                        else
                        {
                            //result_samplePos = (samplePosLC + samplePosLC_prev) * 0.5;
                            result_samplePos = samplePosLC_semiPrev;
                            return true;
                        }
                    }
                }

                //result_samplePos = (samplePosLC + samplePosLC_prev) * 0.5;
                result_samplePos = samplePosLC_prev;
                return true;
            }
        }
        //currSamplePosLC += step_vector_LC;
        samplePosLC_prev = samplePosLC;
    }

    return false;
}

void main(){

    // 1rst, read front depth & rear depth and check if exist rear depth.***
    // If no exist rear depth, then discard.***
    //vec2 screenPos = vec2(gl_FragCoord.x / u_screenSize.x, gl_FragCoord.y / u_screenSize.y); // 
    vec2 screenPos = v_tex_pos;

    if(isSimulationBoxEdge(screenPos))
    {
        vec4 edgeColor = vec4(0.25, 0.5, 0.99, 1.0);
        gl_FragData[0] = edgeColor;

        #ifdef USE_MULTI_RENDER_TARGET
            gl_FragData[1] = edgeColor;
            gl_FragData[2] = edgeColor;
            gl_FragData[3] = edgeColor;
        #endif
        return;
    }

    // read normal in rear depth. If no exist normal, then, discard.***
    // calculate the texCoord for rear normal:
    vec2 frontTexCoord;
    vec2 rearTexCoord;
    get_FrontAndRear_depthTexCoords(screenPos, frontTexCoord, rearTexCoord);

    vec4 encodedNormal = texture2D(simulationBoxDoubleNormalTex, frontTexCoord);
	if(length(encodedNormal.xyz) < 0.1)
    {
        vec4 encodedNormal_rear = texture2D(simulationBoxDoubleNormalTex, rearTexCoord);
        if(length(encodedNormal_rear.xyz) < 0.1)
        {
            discard;
        }
        //discard;
    }

    vec4 normal4rear = getNormal_simulationBox(rearTexCoord);
    vec4 normal4front = getNormal_simulationBox(frontTexCoord);
	//vec3 normal = normal4front.xyz;

    // 1rst, know the scene depth.***
    vec4 normal4scene = getNormal(v_tex_pos);
    int estimatedFrustumIdx = int(floor(normal4scene.w * 100.0));
	int dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	int currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_scene = getNearFar_byFrustumIdx(currFrustumIdx);
	//float currNear_scene = nearFar_scene.x; // no used in this shader.***
	float currFar_scene = nearFar_scene.y;
    float sceneLinearDepth = getDepth(v_tex_pos);
    float distToCam = sceneLinearDepth * currFar_scene;
    //vec3 sceneDepthPosCC = getViewRay(v_tex_pos, distToCam - 1.0);


    // Now, calculate the positions with the simulation box, front & rear.***
    // rear.***
	estimatedFrustumIdx = int(floor(normal4rear.w * 100.0));
	dataType = -1;// DATATYPE 0 = objects. 1 = terrain. 2 = pointsCloud.
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_rear = getNearFar_byFrustumIdx(currFrustumIdx);
	//float currNear_rear = nearFar_rear.x; // no used in this shader.***
	float currFar_rear = nearFar_rear.y;

    // front.***
    estimatedFrustumIdx = int(floor(normal4front.w * 100.0));
	currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
	vec2 nearFar_front = getNearFar_byFrustumIdx(currFrustumIdx);
	//float currNear_front = nearFar_front.x; // no used in this shader.***
	float currFar_front = nearFar_front.y;

    // Now, calculate the rearPosCC & frontPosCC.***
    vec3 frontPosCC;
    vec3 rearPosCC;
    get_FrontAndRear_posCC(screenPos, currFar_rear, currFar_front, frontPosCC, rearPosCC);

    // Now check cutting plane if exist.***
    // u_cuttingPlanePosLC
    // uniform mat4 modelViewMatrixRelToEyeInv;
    // uniform vec3 encodedCameraPositionMCHigh;
    // uniform vec3 encodedCameraPositionMCLow;
    // u_simulBoxTMatInv
    vec4 camPosRelToSimBox;
    vec3 cuttingPosCC;
    vec3 frontPosLCKeep;
    if(u_useCuttingPlane == 1)
    {
        vec4 encodedNormal4cuttingPlane = texture2D(cuttingPlaneNormalTex, v_tex_pos);
        if(length(encodedNormal4cuttingPlane.xyz) > 0.1)
        {
            vec4 normal4cuttingPlane = getNormal_cuttingPlane(v_tex_pos);
            estimatedFrustumIdx = int(floor(normal4cuttingPlane.w * 100.0));
            currFrustumIdx = getRealFrustumIdx(estimatedFrustumIdx, dataType); // Note : "dataType" no used in this shader.***
            vec2 nearFar_cuttingPlane = getNearFar_byFrustumIdx(currFrustumIdx);
            float currFar_cuttingPlane = nearFar_cuttingPlane.y;
            
            get_cuttingPlane_posCC(screenPos, currFar_cuttingPlane, cuttingPosCC);

            // before to change the frontPosCC, must calculate the camPosRelToSimBox.***
            vec4 frontPosWCRelToEyeKeep = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);
            posWCRelToEye_to_posLC(frontPosWCRelToEyeKeep, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLCKeep);

            // now change the frontPosCC.***
            frontPosCC = cuttingPosCC;

            if(cuttingPosCC.z < rearPosCC.z)
            {
                // if cutting plane moves entirely inside of the simulBox, then never enter here.***
                discard;
            }
        }

        // now, calculate camPosRelToSimBox.***
        vec3 highDiff = encodedCameraPositionMCHigh - u_simulBoxPosHigh;
        vec3 lowDiff = encodedCameraPositionMCLow - u_simulBoxPosLow;
        vec3 camPosWC = highDiff + lowDiff;
        camPosRelToSimBox = u_simulBoxTMatInv * vec4(camPosWC, 1.0);
    }

    // Now, calculate frontPosWC & rearPosWC.***
    vec4 frontPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(frontPosCC.xyz, 1.0);
    vec4 rearPosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(rearPosCC.xyz, 1.0);
    //vec4 scenePosWCRelToEye = modelViewMatrixRelToEyeInv * vec4(sceneDepthPosCC.xyz, 1.0);

    // Now, calculate frontPosLC & rearPosLC.***
    vec3 frontPosLC;
    vec3 rearPosLC;
    //vec3 scenePosLC;
    posWCRelToEye_to_posLC(frontPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, frontPosLC);
    posWCRelToEye_to_posLC(rearPosWCRelToEye, u_simulBoxTMatInv, u_simulBoxPosHigh, u_simulBoxPosLow, rearPosLC);

    if(u_useCuttingPlane == 1)
    {
        float error = 10.0;
        if(camPosRelToSimBox.y >= u_cuttingPlanePosLC.y)
        {
            if(frontPosLC.y - error > u_cuttingPlanePosLC.y)// || rearPosLC.y < u_cuttingPlanePosLC.y)
            {
                // vec4 colorDiscard = vec4(1.0, 0.3, 0.3, 1.0);
                // gl_FragData[0] = colorDiscard;

                // #ifdef USE_MULTI_RENDER_TARGET
                //     gl_FragData[1] = colorDiscard;
                //     gl_FragData[2] = colorDiscard;
                //     gl_FragData[3] = colorDiscard;
                // #endif
                // return;
                discard;
            }
        }
        else
        {
            if(frontPosLC.y + error < u_cuttingPlanePosLC.y)// || rearPosLC.y < u_cuttingPlanePosLC.y)
            {
                // vec4 colorDiscard = vec4(0.3, 1.0, 0.3, 1.0);
                // gl_FragData[0] = colorDiscard;

                // #ifdef USE_MULTI_RENDER_TARGET
                //     gl_FragData[1] = colorDiscard;
                //     gl_FragData[2] = colorDiscard;
                //     gl_FragData[3] = colorDiscard;
                // #endif
                // return;
                discard;
            }
        }

        
    }

    // Now, with "frontPosLC" & "rearPosLC", calculate the frontTexCoord3d & rearTexCoord3d.***
    vec3 simulBoxRange = vec3(u_simulBoxMaxPosLC.x - u_simulBoxMinPosLC.x, u_simulBoxMaxPosLC.y - u_simulBoxMinPosLC.y, u_simulBoxMaxPosLC.z - u_simulBoxMinPosLC.z);

    float contaminationSample = 0.0;
    float smplingCount = 0.0;
    float segmentLength = distance(rearPosLC, frontPosLC);
    vec3 samplingDirLC = normalize(rearPosLC - frontPosLC);
    //vec3 samplingDirCC = normalize(rearPosCC - frontPosCC);
    float samplingsCount = 30.0;
    float increLength = segmentLength / samplingsCount;
    if(increLength < u_voxelSizeMeters.x)
    {
        //increLength = u_voxelSizeMeters.x;
    }

    vec4 color4Aux = vec4(0.0, 0.0, 0.0, 0.0);

    vec4 finalColor4 = vec4(0.0);
    float contaminationAccum = 0.0;
    // u_minMaxPollutionValues

    vec3 firstPosLC = vec3(frontPosLC);
    int iteration = 0;
    if(!findFirstSamplePosition(frontPosLC, rearPosLC, samplingDirLC, increLength, simulBoxRange, firstPosLC, iteration))
    {
        // vec4 colorDiscard = vec4(0.3, 0.3, 0.3, 1.0);
        // gl_FragData[0] = colorDiscard;

        // #ifdef USE_MULTI_RENDER_TARGET
        //     gl_FragData[1] = colorDiscard;
        //     gl_FragData[2] = colorDiscard;
        //     gl_FragData[3] = colorDiscard;
        // #endif
        
        return;
    }
    
    // recalculate segmentLength & increLength.***
    samplingsCount = 30.0;
    segmentLength = distance(rearPosLC, firstPosLC);
    increLength = segmentLength / samplingsCount;

    vec4 colorTest = vec4(0.0, 0.0, 0.5, 1.0);
    colorTest = vec4(firstPosLC.x /u_voxelSizeMeters.x, firstPosLC.y /u_voxelSizeMeters.y, firstPosLC.z /u_voxelSizeMeters.z , 1.0);
    
    // Sampling far to near.***
    bool normalLC_calculated = true;
    float contaminationSamples[30];
    int samplesCount = 0;
    for(int i=0; i<30; i++)
    {
        // Note : for each smple, must depth check with the scene depthTexure.***
        vec3 samplePosLC = firstPosLC + samplingDirLC * increLength * float(i);

        //vec3 samplePosCC = firstPosLC + samplingDirCC * increLength * float(i);
        //if(abs(samplePosCC.z) > distToCam)
        //{
        //    break;
        //}

        contaminationSample = 0.0;
        vec3 sampleTexCoord3d = vec3((samplePosLC.x - u_simulBoxMinPosLC.x)/simulBoxRange.x, (samplePosLC.y - u_simulBoxMinPosLC.y)/simulBoxRange.y, (samplePosLC.z - u_simulBoxMinPosLC.z)/simulBoxRange.z);
        checkTexCoord3DRange(sampleTexCoord3d);

        if(get_pollution_fromTexture3d_triLinearInterpolation(sampleTexCoord3d, samplePosLC, contaminationSample))
        {
            contaminationSamples[i] = contaminationSample;
            samplesCount += 1;
            // vec3 currNormalLC;
            // // if(!normalLC(sampleTexCoord3d, samplePosLC, currNormalLC))
            // // {
            // //    normalLC_calculated = false;
            // //    continue;
            // // }

            // //vec4 currColor4 = transfer_fnc(contaminationSample);
            // vec4 currColor4 = getRainbowColor_byHeight(contaminationSample, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y * 0.3, false);
            // //float unitaryContaminationSample = (contaminationSample - u_minMaxPollutionValues.x) / (u_minMaxPollutionValues.y - u_minMaxPollutionValues.x);
 
            // //if(length(currNormalLC) > 0.0)
            // {
            //     // https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
            //     finalColor4.rgb += (1.0 - finalColor4.a) * currColor4.a * currColor4.rgb; 
            //     finalColor4.a += (1.0 - finalColor4.a) * currColor4.a;
            // }

            // smplingCount += 1.0;

            // // Optimization: break out of the loop when the color is near opaque
            // if (finalColor4.a >= 0.95) {
            //     break;
            // }

            // contaminationAccum += contaminationSample;
            
        }
        else{
            contaminationSamples[i] = 0.0;
        }
    }

    int samplesCount2 = 0;
    for(int i=0; i<30; i++)
    {
        contaminationSample = contaminationSamples[i];
        if(contaminationSample > 0.0)
        {
            vec4 currColor4 = getRainbowColor_byHeight(contaminationSample, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y * 0.3, false);

            if(u_useMinMaxValuesToRender == 1)
            {
                float targetValue = u_minMaxPollutionValuesToRender.y;
                
                //targetValue = u_minMaxPollutionValues.y;
                //currColor4.a = contaminationSample / targetValue;
                if(currColor4.a > 1.0)
                {
                    currColor4.a = 1.0;
                }

                //currColor4.a *= smoothstep(0.0, targetValue, contaminationSample);
                currColor4.a = smoothstep(0.0, targetValue, contaminationSample);
            }

            // https://www.willusher.io/webgl/2019/01/13/volume-rendering-with-webgl
            finalColor4.rgb += (1.0 - finalColor4.a) * currColor4.a * currColor4.rgb; 
            finalColor4.a += (1.0 - finalColor4.a) * currColor4.a;
            samplesCount2 += 1;

            contaminationAccum += contaminationSample;
        }

        // Optimization: break out of the loop when the color is near opaque
        if (finalColor4.a >= 0.95) {
            break;
        }

        // if(samplesCount2 >= samplesCount)
        // {
        //     break;
        // }
    }

    // contaminationAccum /= float(samplesCount2);
    // finalColor4 = getRainbowColor_byHeight(contaminationAccum, u_minMaxPollutionValues.x, u_minMaxPollutionValues.y * 0.3, false);
    // finalColor4.a *= 10.0;

    if(smplingCount < 1.0)
    {
        //discard;
    }

    if(smplingCount < 1.0)
    {
        smplingCount = 1.0;
    }

    color4Aux = finalColor4;

    if(!normalLC_calculated)
    {
        //color4Aux = vec4(1.0, 0.0, 0.0, 1.0);
    }

    gl_FragData[0] = color4Aux;

    #ifdef USE_MULTI_RENDER_TARGET
        gl_FragData[1] = color4Aux;
        gl_FragData[2] = color4Aux;
        gl_FragData[3] = color4Aux;
    #endif
}
