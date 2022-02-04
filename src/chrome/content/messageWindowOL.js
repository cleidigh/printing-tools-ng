var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

// Import any needed modules.
var ADDON_ID = "PrintingToolsNG@cleidigh.kokkini.net";

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

// Get our extension object.
let extension2 = ExtensionParent.GlobalManager.getExtension(ADDON_ID);

// Load notifyTools into a custom namespace, to prevent clashes with other add-ons.
window.notifyExampleAddon = {};
Services.scriptloader.loadSubScript(extension2.rootURI.resolve("chrome/content/notifyTools.js"), window.notifyExampleAddon, "UTF-8");



// -- Define listeners for messages from the background script.


function onLoad() {

	console.debug('messageWindow ol');

	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", window);
	
	WL.injectElements(`
	<menupopup id="menu_FilePopup">
		<menuitem label="PTNG Print3" insertbefore="printMenuItem" oncommand="printingtools.cmd_printng()"/>
	</menupopup>
	`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);
	
	
	
}
