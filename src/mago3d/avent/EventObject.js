'use strict';

/**
 * 이벤트 객체
 * @class EventObject
 * @param {string} type
 * @param {function} listener
 */
var EventObject = function (type, listener)
{
	/**
     * @type {string}
     */
	this.type = type || undefined;
     
     /**
     * @type {function}
     */
     this.listener;
     if (listener && typeof listener === 'function') 
     {
          this.listener = listener;
     }
};