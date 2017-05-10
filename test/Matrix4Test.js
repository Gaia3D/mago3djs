'use district';

describe("Matrix4 테스트", function(){
	var matrix;
	beforeEach(function (){
		matrix = new Matrix4();
	});
	
	it("Matrix4 Indentity 초기화 테스트",function() {
		matrix.Identity();
		var IdentyArray = [ 	1, 0, 0, 0,
								0, 1, 0, 0,
								0, 0, 1, 0,
								0, 0, 0, 1
							];
		expect(matrix._floatArrays).toEqual(IdentyArray);				
	});
	
    it('Matrix4 getIndexOfArray row 파라미터가 없으면 예외 처리', function() {
        var row;
        var col = 0.0;
        expect(function() {
            matrix.getIndexOfArray(col, row);
        }).toThrowError("row 입력하세요");
    });
    
    it("Matrix4 getRowMajorMatrix 열", function() {
    	spyOn(matrix, 'getRowMajorMatrix').andReturn();
    })
})
