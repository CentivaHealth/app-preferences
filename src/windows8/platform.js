function AppPreferencesW8() {

}

// http://blogs.msdn.com/b/going_metro/archive/2012/04/22/integrating-with-windows-8-settings-charm.aspx
// http://msdn.microsoft.com/en-us/library/windows/apps/hh770544.aspx
// http://www.silverlightshow.net/items/Windows-8-Metro-Add-settings-to-your-application.aspx
// http://blogs.msdn.com/b/glengordon/archive/2012/09/17/managing-settings-in-windows-phone-and-windows-8-store-apps.aspx

function getContainer (settings, dict, create) {
	var hasContainer;

	if (!dict) {
		return settings;
	}

	hasContainer = settings.containers.hasKey (dict);

	if (!hasContainer) {

		if (create) {
			return settings.createContainer(dict, Windows.Storage.ApplicationDataCreateDisposition.Always);
		}

		return null;
	}

	return settings.containers.lookup(dict)

}

function watchEventHandler (event) {
	if (typeof cordova !== "undefined" && this.watchChanges) {
		cordova.fireDocumentEvent('preferencesChanged', {});
	}
}

AppPreferencesW8.prototype.nativeWatch = function (args) {
	// Occurs when roaming application data is synchronized.
	// https://msdn.microsoft.com/en-us/magazine/dn857358.aspx
	var applicationData = Windows.Storage.ApplicationData.current;
	var eventHandler = watchEventHandler.bind (this);


	if (args.subscribe) {
		applicationData.addEventListener ("datachanged", eventHandler);
	} else {
		applicationData.removeEventListener ("datachanged", eventHandler);
	}
}

AppPreferencesW8.prototype.nativeFetch = function(successCallback, errorCallback, args) {

	var self = this;

	var settings = Windows.Storage.ApplicationData.current[args.cloudSync ? 'roamingSettings' : 'localSettings'];

	var container = getContainer (settings, args.dict);

	if (container === null) {
		return successCallback(null);
	}

	var result = null;

	if (container.values.hasKey(args.key)) {
		result = container.values[args.key];
	}

	var value = null;
	if (result) {
		try {
			value = JSON.parse (result);
		} catch (e) {
			value = result;
		}
	}
	successCallback(value);

	// argscheck.checkArgs('fF', 'Device.getInfo', arguments);
	// exec(successCallback, errorCallback, "Device", "getDeviceInfo", []);
};

AppPreferencesW8.prototype.nativeStore = function(successCallback, errorCallback, args) {

	var self = this;

	args.value = JSON.stringify(args.value);

	var settings = Windows.Storage.ApplicationData.current[args.cloudSync ? 'roamingSettings' : 'localSettings'];

	var container = getContainer (settings, args.dict, true);

	if (container === null) {
		return successCallback(null);
	}

	var result = null;

	container.values[args.key] = args.value;

	successCallback ();
};

AppPreferencesW8.prototype.nativeRemove = function (successCallback, errorCallback, args) {

	var self = this;

	var settings = Windows.Storage.ApplicationData.current[args.cloudSync ? 'roamingSettings' : 'localSettings'];

	var container = getContainer (settings, args.dict);

	if (container === null) {
		return successCallback(null);
	}

	var result = null;

	if (container.values.hasKey(args.key)) {
		result = container.values.remove (args.key);
	}

	successCallback();
};

AppPreferencesW8.prototype.nativeClearAll = function (successCallback, errorCallback, args) {

	var self = this;

	var settings = Windows.Storage.ApplicationData.current[args.cloudSync ? 'roamingSettings' : 'localSettings'];

	var container = getContainer (settings, args.dict);

	if (container === null) {
		return successCallback(null);
	}

	var result = null;

	container.clear ();

	successCallback();
};

AppPreferencesW8.prototype.show = function (successCallback, errorCallback, args) {

	var self = this;

//    The Show method raises an exception if one of the following is true:
//  ???It is called from a snapped app.
//  ???It is called when the current app does not have focus.
//  ???It is called when the pane is already displayed.

	try {
		var settingsPane = Windows.UI.ApplicationSettings.SettingsPane.show();
	} catch (e) {

	}

	successCallback();

	return;

	// adding command to settings charm example

	var settingsPane = Windows.UI.ApplicationSettings.SettingsPane.getForCurrentView();

	function commandsRequested(eventArgs) {

		var applicationCommands = eventArgs.request.applicationCommands;

		var privacyCommand = new Windows.UI.ApplicationSettings.SettingsCommand('privacy', 'Privacy Policy', function () {

			window.open('index.html');

		});

		applicationCommands.append(privacyCommand);

	}

	settingsPane.addEventListener("commandsrequested", commandsRequested);

	return;

	// another way (not works)
	"use strict";
	var page = WinJS.UI.Pages.define("/html/4-ProgrammaticInvocation.html", {
		ready: function (element, options) {
			document.getElementById("scenario4Add").addEventListener("click", scenario4AddSettingsFlyout, false);
			document.getElementById("scenario4Show").addEventListener("click", scenario4ShowSettingsFlyout, false);

			// clear out the current on settings handler to ensure scenarios are atomic
			WinJS.Application.onsettings = null;

			// Display invocation instructions in the SDK sample output region
			WinJS.log && WinJS.log("To show the settings charm, invoke the charm bar by swiping your finger on the right edge of the screen or bringing your mouse to the lower-right corner of the screen, then select Settings. Or you can just press Windows logo + i. To dismiss the settings charm, tap in the application, swipe a screen edge, right click, invoke another charm or application.", "sample", "status");
		}
	});

	function scenario4AddSettingsFlyout() {
		WinJS.Application.onsettings = function (e) {
			e.detail.applicationcommands = {
				"defaults": {
					title: "Defaults",
					href: "/html/4-SettingsFlyout-Settings.html"
				}
			};
			WinJS.UI.SettingsFlyout.populateSettings(e);
		};
		// Make sure the following is called after the DOM has initialized. Typically this would be part of app initialization
		WinJS.Application.start();

		// Display a status message in the SDK sample output region
		WinJS.log && WinJS.log("Defaults settings flyout added from 4-SettingsFlyout-Settings.html", "samples", "status");
	}

	function scenario4ShowSettingsFlyout() {
		WinJS.UI.SettingsFlyout.showSettings("defaults", "/html/4-SettingsFlyout-Settings.html");

		// Display a status message in the SDK sample output region
		WinJS.log && WinJS.log("Defaults settings flyout showing", "samples", "status");
	}
};


if (!window.WinJS.UI.SettingsFlyout) {
	var scriptElem = document.createElement("script");

	if (navigator.appVersion.indexOf('MSAppHost/3.0') !== -1) {
		// Windows 10 UWP
		scriptElem.src = '/WinJS/js/ui.js';
	} else if (navigator.appVersion.indexOf("Windows Phone 8.1;") !== -1) {
		// not supported: https://msdn.microsoft.com/en-us/library/windows/apps/hh701253.aspx
		// windows phone 8.1 + Mobile IE 11
		// scriptElem.src = "//Microsoft.Phone.WinJS.2.1/js/ui.js";
	} else if (navigator.appVersion.indexOf("MSAppHost/2.0;") !== -1) {
		// windows 8.1 + IE 11
		scriptElem.src = "//Microsoft.WinJS.2.0/js/ui.js";
	} else {
		// windows 8.0 + IE 10
		scriptElem.src = "//Microsoft.WinJS.1.0/js/ui.js";
	}
	scriptElem.addEventListener("load", onWinFlyoutReady);
	document.head.appendChild(scriptElem);
}
else {
	onWinFlyoutReady();
}

function onWinFlyoutReady() {
	AddSettingsFlyout();
}

function AddSettingsFlyout() {
	WinJS.Application.onsettings = function (e) {
		e.detail.applicationcommands = {
			"Preferences": {
				title: "Preferences",
				href: "/www/apppreferences.html"
			}
		};
		WinJS.UI.SettingsFlyout.populateSettings(e);
	};
	// Make sure the following is called after the DOM has initialized. Typically this would be part of app initialization
	WinJS.Application.start();

	// Display a status message in the SDK sample output region
	WinJS.log && WinJS.log("Defaults settings flyout added from 4-SettingsFlyout-Settings.html", "samples", "status");
}

module.exports = new AppPreferencesW8();
