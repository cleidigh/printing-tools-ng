// messengerOL - overlay loader for messenger.xul - Source: mzcw-overlay.xul

// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

// Import any needed modules.
var ADDON_ID = "PrintingToolsNG@cleidigh.kokkini.net";
var extMsgHandler;

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

// Get our extension object.
let extension2 = ExtensionParent.GlobalManager.getExtension(ADDON_ID);

// Load notifyTools into a custom namespace, to prevent clashes with other add-ons.
window.notifyExampleAddon = {};
Services.scriptloader.loadSubScript(extension2.rootURI.resolve("chrome/content/notifyTools.js"), window.notifyExampleAddon, "UTF-8");



// -- Define listeners for messages from the background script.

var tabmonitor;

function onLoad() {

	console.debug('messenger ol');

	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-overlay.js", window);
	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", window);
	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/UIlisteners.js", window);
	
	WL.injectElements(`
<keyset id="mailKeys">
	<key replaceattributes="key_print" command="" oncommand="printingtools.cmd_printng();"/>
</keyset>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);

	
		WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem replaceattributes="printMenuItem" label= "Print... (NG)"  oncommand="printingtools.cmd_printng()" command="" disabled="" />
</menupopup>`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);



		WL.injectElements(`
<panelview id="appMenu-mainView">
	<toolbarbutton replaceattributes="appmenu_print" label="Print... (NG)" oncommand="printingtools.cmd_printng()" command="" disabled="" />
</panelview>`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);


		WL.injectElements(`
<menupopup id="mailContext">
	<menuitem replaceattributes="mailContext-print" label="Print... (NG)" oncommand="printingtools.cmd_printng()" command="" disabled="" />
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);

		WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem id="ptng-options-filemenu" insertafter="printMenuItem" accesskey="o" label="&PMDmenuitem;" oncommand="openPTdialog(false)"/>
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);

		WL.injectElements(`
<toolbarpalette id="MailToolbarPalette">
	<toolbarbutton id="ptng-button"
	  label="Print NG"
	  tooltiptext="Printing Tools NG"
	  oncommand="printingtools.cmd_printng(null, {})"
	  class="toolbarbutton-1"
	  type="menu-button"
	  is="toolbarbutton-menu-button">

	  	<menupopup>
		  <menuitem id="ptng-button-print" accesskey="P" label="Print" oncommand="printingtools.cmd_printng(null, {printSilent: true}); event.stopPropagation();" />
		  <menuitem id="ptng-button-printpreview" accesskey="v" label="Print Preview" oncommand="printingtools.cmd_printng(null, {printSilent: false}); event.stopPropagation();"  />
		  <menuseparator />
		  <menuitem id="ptng-button-options" accesskey="o" label="Printingtools NG Options" oncommand="openPTdialog(false); event.stopPropagation();"/>
		  </menupopup>
	  </toolbarbutton>
</toolbarpalette>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);


WL.injectElements(`
<toolbarpalette id="header-view-toolbar">
	<toolbarbutton id="ptng-button-hdr"
	  label="Print NG"
	  tooltiptext="Printing Tools NG"
	  oncommand="printingtools.cmd_printng(null, {})"
	  class="ptng-button-hdr toolbarbutton-icon toolbarbutton-1 message-header-view-button msgHeaderView-button customize-header-toolbar-button"
	  type="menu-button"
	  insertafter="hdrJunkButton"
	  is="toolbarbutton-menu-button">

	  	<menupopup>
		  <menuitem id="ptng-button-print" accesskey="P" label="Print" oncommand="printingtools.cmd_printng(null, {printSilent: true}); event.stopPropagation();" />
		  <menuitem id="ptng-button-printpreview" accesskey="v" label="Print Preview" oncommand="printingtools.cmd_printng(null, {printSilent: false}); event.stopPropagation();"  />
		  <menuseparator />
		  <menuitem id="ptng-button-options" accesskey="o" label="Printingtools NG Options" oncommand="openPTdialog(false); event.stopPropagation();"/>
		  </menupopup>
	  </toolbarbutton>
</toolbarpalette>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);




		WL.injectCSS("chrome://printingtoolsng/content/ptng-button.css");

		window.getUI_status.startup();

	// inject extension object into private context
	window.printingtoolsng = {};
	window.printingtoolsng.extension = WL.extension;
 

	extMsgHandler = window.notifyExampleAddon.notifyTools.addListener(handleExternalPrint);

  
}

function handleExternalPrint(data) {
	console.log(data);
	window.printingtools.cmd_printng({printSilent: true, msgId: data.messageHeader.id})
	return true;
}




function onUnload(shutdown) {
	// console.debug('PT unloading');
	// Services.console.logStringMessage("onUnload messenger");
	// Services.obs.removeObserver(window.printingtoolsng.printObserver, "subdialog-loaded");

	window.notifyExampleAddon.notifyTools.removeListener(extMsgHandler);
	window.getUI_status.shutdown();
	window.printingtools.shutdown();
}