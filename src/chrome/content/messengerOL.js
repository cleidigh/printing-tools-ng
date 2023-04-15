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
window.ptngAddon = {};
Services.scriptloader.loadSubScript(extension2.rootURI.resolve("chrome/content/notifyTools.js"), window.ptngAddon, "UTF-8");


function onLoad() {

	//console.debug('messenger ol');

	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-overlay.js", window);
	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", window);
	Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/UIlisteners.js", window);

	WL.injectElements(`
<keyset id="mailKeys">
	<key replaceattributes="key_print" command="" oncommand="printingtools.cmd_printng();"/>
	<key insertafter="key_print" key="P" modifiers ="control, shift" command="" oncommand="openPTdialog(false);"/>
</keyset>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);


	WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem replaceattributes="printMenuItem" label= "&printCmd.label; (NG)"  oncommand="printingtools.cmd_printng()" command="" disabled="" />
</menupopup>`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);



	WL.injectElements(`
<panelview id="appMenu-mainView">
	<toolbarbutton replaceattributes="appmenu_print" label="&printCmd.label; (NG)" oncommand="printingtools.cmd_printng()" command="" disabled="" />
</panelview>`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);


	WL.injectElements(`
<menupopup id="mailContext">
	<menuitem replaceattributes="mailContext-print" label="&printCmd.label; (NG)" oncommand="printingtools.cmd_printng()" command="" disabled="" />
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);


	WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem id="ptng-options-filemenu" insertafter="printMenuItem" accesskey="G" label="&ptngOptions.label;" oncommand="openPTdialog(false)"/>
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd"]);


	WL.injectElements(`
<toolbarpalette id="MailToolbarPalette">
	<toolbarbutton id="ptng-button"
	  label="&print.label; NG"
	  tooltiptext="&ptng.label;"  
	  oncommand="printingtools.cmd_printng(null, {})"
	  class="toolbarbutton-1"
	  type="menu-button"
	  is="toolbarbutton-menu-button">
	  	<menupopup>
		  <menuitem id="ptng-button-print" accesskey="&contextPrint.accesskey;" label="&print.label;" oncommand="printingtools.cmd_printng({printSilent: true}); event.stopPropagation();" />
		  <menuitem id="ptng-button-printpreview" accesskey="&contextPrintPreview.accesskey;" label="&printPreview.label;" oncommand="printingtools.cmd_printng({printSilent: false}); event.stopPropagation();"  />
		  <menuseparator />
		  <menuitem id="ptng-button-options" accesskey="o" label="&ptngOptions.label;" oncommand="openPTdialog(false); event.stopPropagation();"/>
		  <menuitem id="ptng-button-help" accesskey="&contextHelp.accesskey;" label="&Help;" oncommand="utils.loadHelp(); event.stopPropagation();"/>
		  </menupopup>
	  </toolbarbutton>
</toolbarpalette>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);



	WL.injectElements(`
<toolbarpalette id="header-view-toolbar">
	<toolbarbutton id="ptng-button-hdr"
	  label="&print.label; NG"
	  tooltiptext="&ptng.label;"
	  oncommand="printingtools.cmd_printng(null, {})"
	  class="ptng-button-hdr toolbarbutton-icon toolbarbutton-1 message-header-view-button msgHeaderView-button customize-header-toolbar-button"
	  type="menu-button"
	  insertafter="hdrJunkButton"
	  is="toolbarbutton-menu-button">

	  	<menupopup>
		  <menuitem id="ptng-button-print" accesskey="&contextPrint.accesskey;" label="&print.label;" oncommand="printingtools.cmd_printng({printSilent: true}); event.stopPropagation();" />
		  <menuitem id="ptng-button-printpreview" accesskey="&contextPrintPreview.accesskey;" label="&printPreview.label;" oncommand="printingtools.cmd_printng({printSilent: false}); event.stopPropagation();"  />
		  <menuseparator />
		  <menuitem id="ptng-button-options" accesskey="o" label="&ptngOptions.label;" oncommand="openPTdialog(false); event.stopPropagation();"/>
		  <menuitem id="ptng-button-help" accesskey="&contextHelp.accesskey;" label="&Help;" oncommand="utils.loadHelp(); event.stopPropagation();"/>
		  </menupopup>
	  </toolbarbutton>
</toolbarpalette>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);




	WL.injectCSS("chrome://printingtoolsng/content/ptng-button.css");

	window.getUI_status.startup();

	// inject extension object into private context
	window.printingtoolsng = {};
	window.printingtoolsng.extension = WL.extension;


	extMsgHandler = window.ptngAddon.notifyTools.addListener(handleExternalPrint);

}

// -- Define listeners for messages from the background script.

async function handleExternalPrint(data) {
	console.log(" incoming ext msg" + data);
	await window.printingtools.cmd_printng_external({ messageHeader: data.messageHeader || "error" })
	console.log("PTNG: External print handler done")
	return true;
}




function onUnload(shutdown) {
	// console.debug('PT unloading');

	window.ptngAddon.notifyTools.removeListener(extMsgHandler);
	window.getUI_status.shutdown();
	window.printingtools.shutdown();
}