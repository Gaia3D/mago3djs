'use strict';

/**
 * 메세지
 * 
 * @class
 */
var Message = function(i18next, message) 
{
	this.handle  = i18next;
	this.message = message || {};
};

/**
 * 메세지 클래스 초기화
 *
 * @param {Function} callback
 */
Message.prototype.init = function (callback)
{
	var h = this.handle;
	this.handle.use(i18nextXHRBackend)
		.use(i18nextBrowserLanguageDetector)
		.init({
			// Useful for debuging, displays which key is missing
			debug: true,

			detection: {
				// keys or params to lookup language from
				lookupQuerystring  : 'lang',
				lookupCookie       : 'i18nextLang',
				lookupLocalStorage : 'i18nextLang',
			},
    
			// If translation key is missing, which lang use instead
			fallbackLng: 'en',

			resources: this.message,

			// all, languageOnly
			load: "languageOnly",

			ns        : ['common'],
			// Namespace to use by default, when not indicated
			defaultNS : 'common',
    
			keySeparator     : ".",
			nsSeparator      : ":",
			pluralSeparator  : "_",
			contextSeparator : "_"

		}, function(err, t)
		{
			console.log("detected user language: " + h.language);
			console.log("loaded languages: " + h.languages.join(', '));
			h.changeLanguage(h.languages[0]);
			callback(err, t);
		});
};

/**
 * 메세지 핸들러를 가져온다.
 *
 * @return {i18next} message handler
 */
Message.prototype.getHandle = function ()
{
	return this.handle;
};

/**
 * 메세지를 가져온다.
 *
 * @return {Object} message
 */
Message.prototype.getMessage = function ()
{
	return this.message;
};
