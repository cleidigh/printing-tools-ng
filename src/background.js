// background.js - this kicks off the WindowListener framework
// console.debug('background Start');

// onButtonClicked listener for the notification
messenger.notificationbar.onButtonClicked.addListener((windowId, notificationId, buttonId) => {
  if (["btn-moreinfo"].includes(buttonId)) {
    messenger.windows.openDefaultBrowser("https://thunderbird.topicbox.com/groups/addons/T02a09c034809ca6d/resolving-the-add-on-options-chaos-introduced-by-my-wrapper-apis-windowlistener-and-bootstraploader");
  }
});
// show notification when this version is being installed or updated
browser.runtime.onInstalled.addListener(async (info) => {
	let version = parseInt((await browser.runtime.getBrowserInfo()).version.split(".").shift(), 10);
	if (version < 78)
		return;
	
	if (!["update", "install"].includes(info.reason))
		return;
	
	let windows = await messenger.mailTabs.query({});
	for (let window of windows) {
		await messenger.notificationbar.create({
		windowId: window.id,
		label: "Note: Options of PrintingTools NG have been moved into the add-on manager.",
		icon: "chrome/content/icons/printing-tools-ng-icon-32px.png",
		placement: "bottom", 
		style: {
		  "background-color": "yellow",
		},
		buttons: [
		  {
			id: "btn-moreinfo",
			label: "More info",
			accesskey: "m",
		  }
		]
	  });	
	}
});


messenger.WindowListener.registerDefaultPrefs("defaults/preferences/prefs.js");

// Register all necessary content, Resources, and locales

messenger.WindowListener.registerChromeUrl([
	["content", "printingtoolsng", "chrome/content/"],
	["resource", "printingtoolsng", "chrome/content/"],

	["locale", "printingtoolsng", "en-US", "chrome/locale/en-US/"],
	["locale", "printingtoolsng", "ca", "chrome/locale/ca/"],
	["locale", "printingtoolsng", "da-DK", "chrome/locale/da-DK/"],
	["locale", "printingtoolsng", "de-DE", "chrome/locale/de-DE/"],
	["locale", "printingtoolsng", "el", "chrome/locale/el/"],
	["locale", "printingtoolsng", "es-ES", "chrome/locale/es-ES/"],
	["locale", "printingtoolsng", "fi", "chrome/locale/fi/"],
	["locale", "printingtoolsng", "fr-FR", "chrome/locale/fr-FR/"],
	["locale", "printingtoolsng", "gl-ES", "chrome/locale/gl-ES/"],
	["locale", "printingtoolsng", "hy-AM", "chrome/locale/hy-AM/"],
	["locale", "printingtoolsng", "it-IT", "chrome/locale/it-IT/"],
	["locale", "printingtoolsng", "ja-JP", "chrome/locale/ja-JP/"],
	["locale", "printingtoolsng", "ko-KR", "chrome/locale/ko-KR/"],
	["locale", "printingtoolsng", "nl", "chrome/locale/nl/"],
	["locale", "printingtoolsng", "hu-HU", "chrome/locale/hu-HU/"],
	["locale", "printingtoolsng", "nb-NO", "chrome/locale/nb-NO/"],
	["locale", "printingtoolsng", "pl", "chrome/locale/pl/"],
	["locale", "printingtoolsng", "pt-PT", "chrome/locale/pt-PT/"],
	["locale", "printingtoolsng", "ru", "chrome/locale/ru/"],
	["locale", "printingtoolsng", "sk-SK", "chrome/locale/sk-SK/"],
	["locale", "printingtoolsng", "sl-SI", "chrome/locale/sl-SI/"],
	["locale", "printingtoolsng", "sv-SE", "chrome/locale/sv-SE/"],
	["locale", "printingtoolsng", "uk", "chrome/locale/uk/"],
	["locale", "printingtoolsng", "zh-CN", "chrome/locale/zh-CN/"],
	
]);

messenger.WindowListener.registerOptionsPage("chrome://printingtoolsng/content/ptng-options.xhtml");

// Register each overlay script Which controls subsequent fragment loading


messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xul",
	"chrome://printingtoolsng/content/messengerOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xhtml",
	"chrome://printingtoolsng/content/messengerOL.js");
	

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/msgPrintEngine.xhtml",
	"chrome://printingtoolsng/content/msgPrintEngineOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/msgPrintEngine.xul",
	"chrome://printingtoolsng/content/msgPrintEngineOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/addressbook/addressbook.xul",
	"chrome://printingtoolsng/content/ABprintingtoolsOL.js");
	
messenger.WindowListener.registerWindow(
	"chrome://messenger/content/addressbook/addressbook.xhtml",
	"chrome://printingtoolsng/content/ABprintingtoolsOL.js");
	
	messenger.WindowListener.startListening();

