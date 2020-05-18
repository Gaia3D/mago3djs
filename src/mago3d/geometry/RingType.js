"use strict";

/**
 * 링폴리곤의 형태를 정의
 * @enum RingType
 */
var RingType = {
	/**
     * 아치형태의 폴리곤 {@link Arc2D}
     * @type {Number}
     * @constant
     */
	ARC: 0,

	/**
     * 원형태의 폴리곤 {@link Circle2D}
     * @type {Number}
     * @constant
     */
	CIRCLE: 1,

	/**
     * 폴리라인형태의 폴리곤 {@link PolyLine2D}
     * @type {Number}
     * @constant
     */
	POLYLINE: 2,

	/**
     * 사각형형태의 폴리곤 {@link Rectangle2D}
     * @type {Number}
     * @constant
     */
	RECTANGLE: 3,

	/**
     * 별형태의 폴리곤 {@link Star2D}
     * @type {Number}
     * @constant
     */
	Star2D: 4,

	/**
     * @private
     */
	NUMBER_OF_RING_TYPE: 5
};