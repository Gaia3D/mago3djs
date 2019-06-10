/* eslint-disable strict */

describe('Ring3DList', function() 
{
	var test;

	beforeEach(function() 
	{
		test = [1, 3, 5, 7, 8, 9];
	});


	describe('getBinarySearchIndex()', function()
	{
		it('특정 인덱스의 값을 입력값으로 주었을때 동일한 위치의 인덱스를 구한다.', function() 
		{
			for (var i=0, len=test.length; i<len; i++)
			{
				expect(Ring2DList.getBinarySearchIndex(test, test[i])).toEqual(i);
			}
		});
        
		it('주어진 배열의 최소값보다 작은 값이 주어지면 배열의 첫번째 0 위치를 구한다.', function()
		{
			expect(Ring2DList.getBinarySearchIndex(test, Math.min.apply(null, test) - 1 )).toEqual(0);
		});
        
		it('주어진 배열의 최대값보다 큰 값이 주어지면 배열의 마지막 위치 + 1 을 구한다.', function()
		{
			expect(Ring2DList.getBinarySearchIndex(test, Math.max.apply(null, test) + 1)).toEqual(test.length);
		});
        
		it('자료접근을 위한 함수로 배열값의 속성이 주어지면 cost 값에 따른 비교를 수행한다. ', function ()
		{
			var testArray = [{name: "A", cost: 10}, {name: "B", cost: 20}, {name: "C", cost: 30}, {name: "D", cost: 40}];
			var ref = {name: "A", cost: 50};
			function cost(value)
			{
				return value.cost;
			}
			function name(value)
			{
				return value.name;
			}
			expect(Ring2DList.getBinarySearchIndex(testArray, ref, name)).toEqual(0);
			expect(Ring2DList.getBinarySearchIndex(testArray, ref, cost)).toEqual(testArray.length);
		});
	});
});