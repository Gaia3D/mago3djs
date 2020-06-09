/* eslint-disable strict */
describe("MagoLayerCollection", function () 
{
	describe('생성자 테스트 : ', function () 
	{
		it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
		{
			expect(function () 
			{
				MagoLayerCollection();
			}).toThrowError(Messages.CONSTRUCT_ERROR);
		});
	});

	describe('메소드 테스트 : ', function () 
	{
		var collection = new MagoLayerCollection();
		collection.addSpy = jasmine.createSpy('add', function(){ console.log('added'); });
		collection.removeSpy = jasmine.createSpy('remove', function(){ console.log('removed'); });

		beforeAll(function()
		{
			collection.on(MagoLayerCollection.EVENT_TYPE.ADD, collection.addSpy);
			collection.on(MagoLayerCollection.EVENT_TYPE.REMOVE, collection.removeSpy);
		});
		
		describe('add ', function () 
		{
			it('empty', function () 
			{
				expect(function () 
				{
					collection.add();
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('layer'));
                
			});
			it('invalid case', function () 
			{
				expect(function () 
				{
					collection.add({});
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('dataGroupId'));
			});
			it('standard', function () 
			{
				
				var layer = {
					dataGroupId   : 1,
					dataGroupKey  : 'edc',
					dataGroupName : '이디시',
					dataGroupPath : 'abc/edc/'
				};
				collection.add(layer);
				expect(collection.addSpy).toHaveBeenCalled();

				expect(collection.layers.length).toEqual(1);

				var addedLayer = collection.layers[0];
				//expect(addedLayer).toBeInstanceOf(MagoLayer);
				expect(addedLayer.id).toEqual(1);
				expect(addedLayer.key).toEqual('edc');
				expect(addedLayer.name).toEqual('이디시');
				expect(addedLayer.path).toEqual('abc/edc/');

				
			});
		});

		describe('removeById ', function () 
		{
			it('empty', function () 
			{
				expect(function () 
				{
					collection.removeById();
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('id'));
			});

			it('invalid id', function () 
			{
				expect(function () 
				{
					collection.removeById('aaa');
				}).toThrowError('this id is not exist');
			});

			it('valid id', function () 
			{
				expect(function () 
				{
					collection.removeById(1);
				}).not.toThrowError();
				expect(collection.removeSpy).toHaveBeenCalled();
			});
		});
	});
});