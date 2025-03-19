// background.js - this kicks off the WindowListener framework
// console.debug('background Start');


messenger.WindowListener.registerDefaultPrefs("defaults/preferences/prefs.js");

// Register all necessary conIt's6'tent, Resources, and locales

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
	["locale", "printingtoolsng", "ja", "chrome/locale/ja/"],
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
	["locale", "printingtoolsng", "zh-TW", "chrome/locale/zh-TW/"],

]);

messenger.WindowListener.registerOptionsPage("chrome://printingtoolsng/content/ptng-options.xhtml");

// Register each overlay script Which controls subsequent fragment loading

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xhtml",
	"chrome://printingtoolsng/content/messengerOL.js");


messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messageWindow.xhtml",
	"chrome://printingtoolsng/content/messageWindowOL.js");

messenger.WindowListener.registerWindow(
	"about:message",
	"chrome://printingtoolsng/content/aboutMessageOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/customizeToolbar.xhtml",
	"chrome://printingtoolsng/content/customizeToolbar.js");

messenger.WindowListener.startListening();

// listener for external print requests eg FiltaQuila 
browser.runtime.onMessageExternal.addListener(handleMessage);


browser.runtime.onInstalled.addListener(async (info) => {
	if (info.reason != "install" && info.reason != "update") {
		return;
	}
	await openHelp({ opentype: "tab" });
});


messenger.NotifyTools.onNotifyBackground.addListener(async (info) => {
	let rv;
	switch (info.command) {
		case "windowsGetAll":
			var w = await browser.windows.getAll(info.options);
			return w;
		case "getCurrentURL":
			// method one: via tabs in focused window
			try {
				var w = await browser.windows.getAll({ populate: true });
			} catch {
				return "unknown";
			}

			let cw = w.find(fw => fw.focused)
			let url1 = cw.tabs.find(t => t.active).url;
			if (!url1) {
				url1 = "undefinedURL";
			}
			return url1;
		case "getSelectedMessages":
			var windows = await browser.windows.getAll({ populate: true });
			let currentWin = windows.find(fw => fw.focused)
			let currentTab = currentWin.tabs.find(t => t.active);

			var msgListPage = null;
			var msgList = [];
			if (currentTab.mailTab) {

				try {
					do {
						if (!msgListPage) {
							msgListPage = await messenger.mailTabs.getSelectedMessages();
							msgList = msgListPage.messages.map(msgHdr => msgHdr.id);
						} else {
							msgListPage = await messenger.messages.continueList(msgListPage.id);
							msgList = msgList.concat(msgListPage.messages.map(msgHdr => msgHdr.id));
						}

					} while (msgListPage.id);

				} catch {
					msgList = null;
				}
				return msgList;
			} else if (currentTab.type == "messageDisplay") {
				let msgDisplayed = await browser.messageDisplay.getDisplayedMessage(currentTab.id);
				msgList = [msgDisplayed.id];
				return msgList;
			}
		case "getFullMessage":

			rv = await getFullMessage(info.messageId);
			return rv;

		case "getAttatchmentList":

			rv = await getAttatchmentList(info.messageId);
			return rv;

		case "openHelp":
			rv = await openHelp(info);
			return "help";
	}
});

var helpLocales = ['ja', 'ca', 'da', 'de', 'el', 'en-US', 'es-ES', 'fi', 'fr', 'gl-ES', 'hu',
	'hy-AM', 'it', 'ko', 'nl', 'nb-NO', 'pl', 'pt-PT', 'ru', 'sk', 'sl', 'sv-SE', 'uk', 'zh-CN', 'zh-TW'];

async function openHelp(info) {
	var locale = messenger.i18n.getUILanguage();

	if (!helpLocales.includes(locale)) {
		var baseLocale = locale.split("-")[0];

		locale = helpLocales.find(l => l.split("-")[0] == baseLocale)
		if (!locale) {
			locale = "en-US";
		}
	}
	var bm = "";
	if (info.bmark) {
		bm = info.bmark;
	}
	try {
		if (info.opentype == "tab") {
			await browser.tabs.create({ url: `chrome/content/help/locale/${locale}/printingtoolsng-help.html${bm}`, index: 1 })
		} else {
			await browser.windows.create({ url: `chrome/content/help/locale/${locale}/printingtoolsng-help.html${bm}`, type: "panel", width: 1180, height: 520 })
		}
	} catch (ex) {
		if (info.opentype == "tab") {
			await browser.tabs.create({ url: `chrome/content/help/locale/en-US/printingtoolsng-help.html${bm}`, index: 1 })
		} else {
			await browser.windows.create({ url: `chrome/content/help/locale/en-US/printingtoolsng-help.html${bm}`, type: "panel", width: 1180, height: 520 })
		}
	}
}

async function getFullMessage(messageId) {

	var m = await messenger.messages.getFull(messageId);
	return m;
}


async function getAttatchmentList(messageId) {

	var m = await messenger.messages.get(messageId);
	//console.log(m)
	var a = await messenger.messages.listAttachments(m.id);
	//console.log(a)

	return a;
}

// External print handler 
function handleMessage(message, sender) {

	//console.log(message)
	messenger.NotifyTools.notifyExperiment({ command: "handleExternalPrint", messageHeader: message.messageHeader }).then((data) => {
		//console.log(data)
		return true;
	});

	return true;

}

const msgCtxMenu_TopId = "msgCtxMenu_TopId";

let ptngMenuDef = {
	contexts: ["message_list", "page"],
	id: msgCtxMenu_TopId,
	title: browser.i18n.getMessage("printLabel") + " NG…",
	onclick: cmd_print

}


async function cmd_print(ctxInfo) {
	var windows = await browser.windows.getAll({ populate: true });
	let currentWin = windows.find(fw => fw.focused)
	let currentTab = currentWin.tabs.find(t => t.active);
	messenger.NotifyTools.notifyExperiment({ command: "WEXT_cmd_print", tabId: currentTab.id, windowId: currentWin.id }).then((data) => {
		//console.log(data)
	});
}

await((async () => {
	await messenger.menus.create(ptngMenuDef);
})());

browser.browserAction.onClicked.addListener(cmd_print);