// messengerOL - overlay loader for messenger.xul - Source: mzcw-overlay.xul

// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

// test processing function
function printT() {
	console.debug(' processing function');
	// Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", window);
	// window.console.debug("loaded");
	// let table1 = printingtools.getTable(0);
	// table1.border = "1";
	// Services.console.logStringMessage("tableb");
}

function onLoad() {

	console.debug('messenger ol');
	// Add post processing method
	let print_context_cmd= document.documentElement.querySelector("#mailContext-print");
	let pcmd = print_context_cmd.getAttribute("oncommand");
	// pcmd += "; printT();";
	pcmd = "printT();"; 
	print_context_cmd.setAttribute("oncommand", pcmd);
	console.debug('new command: ' + print_context_cmd.getAttribute("oncommand"));
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