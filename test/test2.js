/**
 * 
 */
var assert = require('assert');

describe('Array', function() {
	describe('#indexOf()', function() {
		it('배열에 요소가 없으면 -1을 리턴 합니다.', function() {
			assert.equal(-1, [ 1, 2, 3 ].indexOf(4));
		});
	});
});