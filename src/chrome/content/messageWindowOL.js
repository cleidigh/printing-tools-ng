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

	window.printingtoolsng = {};
	window.printingtoolsng.extension = WL.extension;

	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", window);
	
	WL.injectElements(`
	<menupopup id="menu_FilePopup">
		<menuitem label="Print... (NG)" insertbefore="printMenuItem" oncommand="printingtools.cmd_printng()"/>
	</menupopup>
	`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);
	
		

WL.injectElements(`
<panelview id="appMenu-mainView">
	<toolbarbutton label="Print... (NG)" insertbefore="appmenu_print" oncommand="printingtools.cmd_printng()"/>
</panelview>`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);

}

WL.injectElements(`
<menupopup id="mailContext">
	<menuitem label="Print... (NG)" insertbefore="mailContext-print" oncommand="printingtools.cmd_printng()"/>
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);

		
if(1) {
	WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem label="&PMDmenuitem;" insertafter="printMenuItem" oncommand="openPTdialog(false)"/>
	
</menupopup>

`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);


//<menuitem label="Print..." insertafter="printMenuItem" oncommand="printingtools.cmd_printng()" accesskey="y" />


	
}
