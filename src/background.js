// background.js - this kicks off the WindowListener framework
// console.debug('background Start');

messenger.WindowListener.registerDefaultPrefs("defaults/preferences/prefs.js");

// Register all necessary content, Resources, and locales

messenger.WindowListener.registerChromeUrl([
	["content", "columnswizard", "chrome/content/"],
	["content", "columnswizard", "chrome/content/ico"],
	["resource", "columnswizard", "chrome/content/", "contentaccessible=yes"],
	["resource", "columnswizard", "chrome/content/modules/"],
	["resource", "columnswizard2", "chrome/resource/"],
	["resource", "columnswizard", "chrome/skin/classic/"],
	["locale", "columnswizard", "en-US", "chrome/locale/en-US/"],
	["locale", "columnswizard", "de", "chrome/locale/de/"],
	["locale", "columnswizard", "es-ES", "chrome/locale/es-ES/"],
	["locale", "columnswizard", "fr", "chrome/locale/fr/"],
	["locale", "columnswizard", "hu", "chrome/locale/hu/"],
	["locale", "columnswizard", "it", "chrome/locale/it/"],
	["locale", "columnswizard", "ja", "chrome/locale/ja/"],
	["content", "cwrl2", "./_locales/"],
	["content", "cwrl", "./"],
	
]);


// messenger.WindowListener.registerShutdownScript("chrome://columnswizardSee if/content/shutdown.js");

messenger.WindowListener.registerOptionsPage("chrome://columnswizard/content/settings-tab-launch.xhtml");

// Register each overlay script Which controls subsequent fragment loading


messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xul",
	"chrome://columnswizard/content/messengerOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xhtml",
	"chrome://columnswizard/content/messengerOL.js");
	
messenger.WindowListener.startListening();

