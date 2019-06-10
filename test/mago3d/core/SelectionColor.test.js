/* eslint-disable strict */

describe("SelectionColor", function() 
{
	var testSelectionColor;
	var testColor;
    
	beforeEach(function()
	{
		testSelectionColor = new SelectionColor();
		testColor = new Color();
		testColor.setRGB(0, 10, 202);
	});

	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 한다.', function()
	{
		expect(function ()
		{
			return SelectionColor();
		}).not.toThrowError('이 객체는 new 키워드를 사용하여 생성해야 합니다.');
	});

	describe('init()', function()
	{
		it('초기화 설정이 되어야 한다.', function()
		{
			testSelectionColor.init();
			expect(testSelectionColor.color.r).toEqual(0);
			expect(testSelectionColor.color.g).toEqual(0);
			expect(testSelectionColor.color.b).toEqual(0);
			expect(testSelectionColor.cycle).toEqual(0);
		});
	});

	describe('decodeColor3(r,g,b)', function()
	{
		it("결과값 체크", function() 
		{
			var idx = testSelectionColor.decodeColor3(testColor.r, testColor.g, testColor.b);
			expect(idx).toEqual(2742);
		});
	});

});