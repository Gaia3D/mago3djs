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

	this._year = 2023;
	this._month = 0; // month starts in 0.***
	this._day = 1;
	this._hour = 0;
	this._minute = 0;
	this._second = 0;
	this._milisecond = 0;

	this._animationState = CODE.processState.NO_STARTED;
	this._animationStartUnixTimeMilisec = 0;
	//this._animationStartTimeMilisec = 0; // old.***
	this._currentUnixTimeMilisec = 0;
	//this._currentTimeMilisec = 0; // old.***
	this._timeScale = 1.0;
	this._date; // a referencial date.***

	// intern parameters.***
	this._incrementalAddingTimeMilisec = 0;

	this.setOptions(options);
};

AnimationTimeController.prototype.setOptions = function (options)
{
	if (options !== undefined)
	{
		if (options.year !== undefined)
		{
			this._year = options.year;
		}
		if (options.month !== undefined)
		{
			this._month = options.month;
		}
		if (options.day !== undefined)
		{
			this._day = options.day;
		}
		if (options.hour !== undefined)
		{
			this._hour = options.hour;
		}
		if (options.minute !== undefined)
		{
			this._minute = options.minute;
		}
		if (options.second !== undefined)
		{
			this._second = options.second;
		}
		if (options.milisecond !== undefined)
		{
			this._milisecond = options.milisecond;
		}
		if (options.timeScale !== undefined)
		{
			this._timeScale = options.timeScale;
		}
		if (options.incrementalAddingTimeMilisec !== undefined)
		{
			this._incrementalAddingTimeMilisec = options.incrementalAddingTimeMilisec;
		}
	}

	// now calculate the unixTime.***
	this.calculateAnimationStartUnixTimeMilisec();

};

AnimationTimeController.prototype.calculateAnimationStartUnixTimeMilisec = function ()
{
	var time = new Date(this._year, this._month - 1, this._day, this._hour, this._minute, this._second, this._milisecond);
	this._animationStartUnixTimeMilisec = time.getTime();

	// now calculate the unixTime.***
	this._currentUnixTimeMilisec = this._animationStartUnixTimeMilisec;
};

AnimationTimeController.prototype.switchPlayPause = function ()
{
	if (this._animationState === CODE.processState.STARTED)
	{
		this._animationState = CODE.processState.PAUSED;
	}
	else if (this._animationState === CODE.processState.PAUSED)
	{
		this._animationState = CODE.processState.STARTED;
	}
};

AnimationTimeController.prototype.reset = function (options)
{
	this._animationState = CODE.processState.NO_STARTED;
	this.setOptions(options);
};

AnimationTimeController.prototype.getCurrentTimeMilisec = function ()
{
	return this._currentUnixTimeMilisec; 
};

AnimationTimeController.prototype.getCurrentUnixTimeMilisec = function ()
{
	return this._currentUnixTimeMilisec;
};

AnimationTimeController.prototype.setCurrentTimeMilisec = function (timeMilisec)
{
	this._currentTimeMilisec = timeMilisec;
};

AnimationTimeController.prototype.incrementCurrentTime = function (diffTime)
{
	if (this._animationState !== CODE.processState.STARTED)
	{
		return;
	}

	if (this._animationState === CODE.processState.PAUSED)
	{
		return;
	}

	this._incrementalAddingTimeMilisec = diffTime;
	this._currentUnixTimeMilisec += this._incrementalAddingTimeMilisec * this._timeScale;
};

AnimationTimeController.prototype.startAnimation = function ()
{
	this._animationState = CODE.processState.STARTED;
};

AnimationTimeController.prototype.pauseAnimation = function ()
{
	this._animationState = CODE.processState.PAUSED;
};

AnimationTimeController.prototype.getAnimationState = function ()
{
	return this._animationState;
};
