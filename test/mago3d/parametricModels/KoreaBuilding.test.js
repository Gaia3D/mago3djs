/* eslint-disable strict */

describe("KoreaBuilding 테스트", function()
{
    var mockjson = JSON.parse("{\"type\":\"Feature\",\"geometry\":{\"type\":\"MultiPolygon\",\"coordinates\":[[[[127.361873,36.476407],[127.36186,36.476406],[127.361848,36.476416],[127.361849,36.476422],[127.361852,36.476427],[127.361857,36.47643],[127.361859,36.476431],[127.361872,36.476433],[127.36188,36.476429],[127.361883,36.476421],[127.361881,36.476412],[127.361873,36.476407]]]]},\"properties\":{\"ARCHAREA\":0,\"BC_RAT\":0,\"BD_MGT_SN\":null,\"BLDG_PNU\":null,\"BLDG_PNU_Y\":null,\"BLDRGST_PK\":null,\"BLD_NM\":null,\"BLD_UNLICE\":null,\"COL_ADM_SE\":\"36110\",\"DONG_NM\":null,\"GB_CD\":null,\"GEOIDN\":null,\"GRND_FLR\":0,\"HEIGHT\":0,\"PLATAREA\":0,\"PNU\":\"3611034033200130002\",\"REGIST_DAY\":null,\"SGG_OID\":60223,\"STRCT_CD\":null,\"TOTALAREA\":0,\"UFID\":\"0000232358603306640200000000\",\"UGRND_FLR\":0,\"USABILITY\":null,\"USEAPR_DAY\":null,\"VIOL_BD_YN\":null,\"VL_RAT\":0}}");
	describe('생성자 테스트 : ', function () 
	{
		it('객체 생성시 new 키워드 없이 생성할 경우 예외를 던져야 함', function () 
		{
			expect(function () 
			{
				layer = KoreaBuilding();
			}).toThrowError(Messages.CONSTRUCT_ERROR);
		});
        describe('필수속성이 없을 경우 : ', function () 
		{
			it('empty', function () 
			{
				expect(function()
				{
					layer = new KoreaBuilding();
				}).toThrowError(Messages.REQUIRED_EMPTY_ERROR('geojson'));
			});
		});
	});

    describe('기능 테스트 : ', function () 
	{
        it('geometry', function () 
		{
            expect(KoreaBuilding.geometryToGeographicCoordsList(mockjson.geometry)).toBeInstanceOf(GeographicCoordsList);
		});
    })
});