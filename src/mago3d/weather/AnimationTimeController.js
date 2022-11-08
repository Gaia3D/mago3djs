'use strict';

/**
 * @class AnimationTimeController
 */
var AnimationTimeController = function(options) 
{
	if (!(this instanceof AnimationTimeController)) 
	{
		throw new Error(Messages.CONSTRUCT_ERROR);
	}

	this._animationState === CODE.processState.NO_STARTED;
	this._animationStartTimeMilisec = 0;
	this._currentTimeMilisec = 0;
	this._timeScale = 1.0;
	this._date; // a referencial date.***

	// intern parameters.***
	this._incrementalAddingTimeMilisec = 0;

	if (options !== undefined)
	{
		if (options.incrementalAddingTimeMilisec !== undefined)
		{
			this._incrementalAddingTimeMilisec = options.incrementalAddingTimeMilisec;
		}
	}
};

AnimationTimeController.prototype.getCurrentTimeMilisec = function ()
{
	return this._currentTimeMilisec;
};

AnimationTimeController.prototype.setCurrentTimeMilisec = function (timeMilisec)
{
	this._currentTimeMilisec = timeMilisec;
};

AnimationTimeController.prototype.incrementCurrentTime = function ()
{
	this._currentTimeMilisec += this._incrementalAddingTimeMilisec;
};

AnimationTimeController.prototype.setAnimationStartTimeMilisec = function (startTimeMilisec)
{
	this._animationStartTimeMilisec = startTimeMilisec;
};

AnimationTimeController.prototype.startAnimation = function ()
{
	this._animationState = CODE.processState.STARTED;
};

AnimationTimeController.prototype.getAnimationState = function ()
{
	return this._animationState;
};

AnimationTimeController.prototype.getIncrementTimeMilisec = function ()
{
	return this._currentTimeMilisec - this._animationStartTimeMilisec;
};