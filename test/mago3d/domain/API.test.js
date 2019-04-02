'use district';

describe('Accessor 테스트', function() {
	var accessor;
	
	it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function() {
		expect(function() {
			accessor = Accessor();
		}).toThrowError('이 객체는 new를 사용하여 생성해야 합니다.');
	});
	
	it('new 를 이용하여 객체 생성 성공 후 buffer_id를 사용하려고 하면 undefined', function() {
		accessor = new Accessor();
		expect(accessor.buffer_id).toEqual(undefined);
	});
});
