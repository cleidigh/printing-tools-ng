// messengerOL - overlay loader for messenger.xul - Source: mzcw-overlay.xul

// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

function onLoad() {

	// Services.scriptloader.loadSubScript("", window);
	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-overlay.js", window);

	WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem label="&PMDmenuitem;" insertafter="printMenuItem" oncommand="openPTdialog(false)"/>
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);

	// inject extension object into private context
	window.printingtoolsng = {};
	window.printingtoolsng.extension = WL.extension;

}

function onUnload(shutdown) {
	// console.debug('PT unloading');
	// Services.console.logStringMessage("onUnload messenger");

}