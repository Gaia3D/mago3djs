/**
 * 
 */
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect
var should = chai.should();

describe('Array', function() {
	describe('#indexOf()', function() {
		it('-1 return.', function() {
			assert.equal(-1, [ 1, 2, 3 ].indexOf(4));
		});
	});
});