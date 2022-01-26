// messengerOL - overlay loader for messenger.xul - Source: mzcw-overlay.xul

// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var tabmonitor;

function onLoad() {

	console.debug('messenger ol');
	// Add post processing method

	let print_context_cmd = document.documentElement.querySelector("#mailContext-print");
	let pcmd = print_context_cmd.getAttribute("oncommand");
	// pcmd += "; printT();";
	pcmd = "goDoCommand(\"cmd_print\"); printingtools.printT();";
	print_context_cmd.setAttribute("oncommand", pcmd);
	console.debug('new command: ' + print_context_cmd.getAttribute("oncommand"));
	// Services.scriptloader.loadSubScript("", window);
	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-overlay.js", window);
	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", window);
	WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem label="&PMDmenuitem;" insertafter="printMenuItem" oncommand="openPTdialog(false)"/>
	<menuitem label="PTNG Print" insertafter="printMenuItem" oncommand="printingtools.printT2()"/>
</menupopup>

`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);

	// inject extension object into private context
	window.printingtoolsng = {};
	window.printingtoolsng.extension = WL.extension;

	let ps = document.documentElement.querySelector(".printPreviewStack");
	console.debug(' messsengerol pp');
	console.debug(ps);

	tabmonitor = {
        self: this,

        onTabClosing: function (tab) {
          console.debug('onTabClosing');
          // console.debug(tab);
		},
		
        onTabOpened: function (tab) {
			console.debug('onTabOpened:');
			console.debug(tab);
			console.debug('Title: ' + tab.title);
			console.debug('Browser: ' + tab.browser);
		},
		onTabSwitched: function (tab) { },
		onTabTitleChanged: function (tab) {
			console.debug('onTabTitleChanged:');
			console.debug(tab);
			console.debug('Title: ' + tab.title);
			console.debug('Browser: ' + tab.browser);
		
		},

	}

	// ps.registerTabMonitor(tabmonitor);




	window.printingtoolsng.printObserver = {
		async observe(subDialogWindow) {
			// A subDialog has been opened.
			console.log("subDialog opened: " + subDialogWindow.location.href);

			// We only want to deal with the print subDialog.
			if (!subDialogWindow.location.href.startsWith("chrome://global/content/print.html?")) {
				return;
			}


			Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", subDialogWindow);

			// subDialogWindow.printingtools.printT(subDialogWindow);
			// let mw = subDialogWindow.printingtools.getMail3Pane();
			// let ps = mw.document.documentElement.querySelector(".printPreviewStack print-preview browser");
			// console.debug(ps);

			// ps.addEventListener('DOMContentLoaded', (event) => {
			// 	console.log('DOM fully loaded and parsed');
			// });

			// Wait until print-settings in the subDialog have been loaded/rendered.
			await new Promise(resolve =>
				subDialogWindow.document.addEventListener("print-settings", resolve, { once: true })
			);

			console.log("subDialog print-settings loaded");
			console.log("subDialog print-settings caller/opener: " + subDialogWindow.PrintEventHandler.activeCurrentURI);

			// subDialogWindow.printingtools.printT(subDialogWindow);
			// setTimeout(subDialogWindow.printingtools.printT, 9000);
			/*Services.scriptloader.loadSubScript(
				"chrome://calendar/content/calendar-print.js",
				subDialogWindow
			);*/
		},
	};

	// Services.obs.addObserver(window.printingtoolsng.printObserver, "subdialog-loaded");



}


function onUnload(shutdown) {
	// console.debug('PT unloading');
	// Services.console.logStringMessage("onUnload messenger");
	Services.obs.removeObserver(window.printingtoolsng.printObserver, "subdialog-loaded");

}