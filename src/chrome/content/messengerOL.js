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

	window.printingtoolsng.printObserver = {
		async observe(subDialogWindow) {
			// A subDialog has been opened.
			console.log("subDialog opened: " + subDialogWindow.location.href);

			// We only want to deal with the print subDialog.
			if (!subDialogWindow.location.href.startsWith("chrome://global/content/print.html?")) {
				return;
			}

			// Wait until print-settings in the subDialog have been loaded/rendered.
			await new Promise(resolve =>
				subDialogWindow.document.addEventListener("print-settings", resolve, { once: true })
			);

			console.log("subDialog print-settings loaded");
			console.log("subDialog print-settings caller/opener: " + subDialogWindow.PrintEventHandler.activeCurrentURI);

			/*Services.scriptloader.loadSubScript(
				"chrome://calendar/content/calendar-print.js",
				subDialogWindow
			);*/
		},
	};

	Services.obs.addObserver(window.printingtoolsng.printObserver, "subdialog-loaded" );

}

function onUnload(shutdown) {
	// console.debug('PT unloading');
	// Services.console.logStringMessage("onUnload messenger");
	Services.obs.removeObserver(window.printingtoolsng.printObserver, "subdialog-loaded" );

}