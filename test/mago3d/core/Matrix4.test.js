/* eslint-disable strict */

describe("Matrix4 테스트", function () 
{
	var matrix;
	var IdentyArray = new Float32Array([1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	]);

	beforeEach(function () 
	{
		matrix = new Matrix4();
	});

	it("Matrix4 Indentity 초기화 테스트", function () 
	{
		expect(matrix._floatArrays).toEqual(IdentyArray);
	});

	describe('getIndexOfArray()', function()
	{
		it('getIndexOfArray 파라미터가 없으면 초기값 0으로 처리한다.', function () 
		{
			var row;
			var col = 0;
			expect(matrix.getIndexOfArray(col, row)).toEqual(0);
		});	
	});
	
	describe('getRowMajorMatrix()', function () 
	{
		it("단위행렬에 대한 결과값은 단위행렬이다.", function () 
		{
			expect(matrix.getRowMajorMatrix()).toEqual(IdentyArray);
		});
	});
});
