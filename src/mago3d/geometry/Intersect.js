'use strict';
/**
 * 교차 판단값
 * 한 객체가 다른 한 객체에 완전히 안쪽에 포함된 경우: INSIDE
 * 한 객체가 다른 한 객체에 일부는 안쪽에 포함되고 일부는 바깥쪽에 포함된 경우: INTERSECT
 * 한 객체가 다른 한 객체에 완전히 바깥쪽에 있는 경우: OUTSIDE
 * A 지점에 포함된 경우: POINT_A
 * B 지점에 포함된 경우: POINT_B
 * 
 * @enum
 */
var Intersect = {
	/**
     * 한 객체가 다른 한 객체에 완전히 바깥쪽에 존재함
     * @type {Number}
     * @constant
     */
	OUTSIDE: 0,
    
	/**
     * 한 객체가 다른 한 객체의 일부분만 포함
     * @type {Number}
     * @constant
     */
	INTERSECT: 1,
    
	/**
     * 한 객체가 다른 한 객체를 완전히 포함
     * @type {Number}
     * @constant
     */
	INSIDE: 2,
    
	/**
     * A 지점에 포함
     * @type {Number}
     * @constant
     */
	POINT_A: 3,
    
	/**
     * B 지점에 포함
     * @type {Number}
     * @constant
     */
	POINT_B: 4
};