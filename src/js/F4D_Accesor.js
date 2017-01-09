var F4D_Accesor = function()
{
	this.buffer_id = undefined;
	this.accesor_type = undefined; // 0= position, 1= normal, 2= color, 3= texcoord.***
	this.buffer_start = undefined;
	this.stride = undefined;
	this.data_ytpe = undefined;
	this.dimension = undefined;
	//---------------------------------------------
	
	this.min_x = 0.0;
	this.min_y = 0.0;
	this.min_z = 0.0;
	this.max_x = 0.0;
	this.max_y = 0.0;
	this.max_z = 0.0;
	
};