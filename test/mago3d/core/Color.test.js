/* eslint-disable strict */

describe("Color", function () 
{
	var testColor;

	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
	{
		expect(function () 
		{
			testColor = new Color();
		}).not.toThrowError('이 객체는 new를 사용하여 생성해야 합니다.');
	});

	beforeEach(function () 
	{
		testColor = new Color();
	});

	describe("()", function () 
	{
		it("객체 생성시 기본 색상값은 0 이다.", function () 
		{
			expect(testColor.r).toEqual(0.0);
			expect(testColor.g).toEqual(0.0);
			expect(testColor.b).toEqual(0.0);
		});

		it("객체 생성시 기본 알파값은 1 이다.", function () 
		{
			expect(testColor.a).toEqual(1.0);
		});

		
	});

	describe("setRGB(red, green, blue)", function () 
	{
		it("함수를 실행해도 알파값엔 변함이 없다.", function () 
		{
			testColor.setRGB(1.0, 2.0, 3.0);
			expect(testColor.a).toEqual(1);
		});
	});

});
