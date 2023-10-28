var Services = globalThis.Services ||
  ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

// Import any needed modules.
var ADDON_ID = "PrintingToolsNG@cleidigh.kokkini.net";

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

// Get our extension object.
let extension2 = ExtensionParent.GlobalManager.getExtension(ADDON_ID);

// Load notifyTools into a custom namespace, to prevent clashes with other add-ons.
window.ptngAddon = {};
Services.scriptloader.loadSubScript(extension2.rootURI.resolve("chrome/content/notifyTools.js"), window.ptngAddon, "UTF-8");


function onLoad() {

	//console.debug('messageWindow ol');
	window.printingtoolsng = {};
	window.printingtoolsng.extension = WL.extension;
	var PTNGVersion = window.printingtoolsng.extension.addonData.version;

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
	<menuitem id="ptng-options-filemenu" insertafter="printMenuItem" accesskey="G" label="&PMDmenuitem;" oncommand="openPTdialog(false)"/>
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);


	WL.injectElements(`
<menupopup id="menu_FilePopup">
	<menuitem insertafter="printMenuItem" label= "&printCmd.label; NG"  oncommand="printingtools.cmd_printng()" command="" disabled="" />
</menupopup>`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);


	WL.injectElements(`
<menupopup id="mailContext">
	<menuitem replaceattributes="mailContext-print" label="&printCmd.label; (NG)" oncommand="printingtools.cmd_printng()" command="" disabled="" />
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);

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
		  <menuitem id="ptng-button-help" accesskey="h" label="&Help;" oncommand="utils.loadHelp(); event.stopPropagation();"/> 
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
		  <menuitem id="ptng-button-help" accesskey="h" label="&Help;" oncommand="utils.loadHelp(); event.stopPropagation();"/> 
		  </menupopup>
	  </toolbarbutton>
</toolbarpalette>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);

	WL.injectCSS("chrome://printingtoolsng/content/ptng-button.css");


}

// Capture Control-P print shortcut
let mk = document.getElementById("key_print");
mk.removeAttribute("oncommand");
mk.setAttribute("oncommand", "printingtools.cmd_printng()");


function onUnload(shutdown) {
	// Restore Control-P print shortcut
	let mk = document.getElementById("key_print");
	mk.removeAttribute("oncommand");
	mk.setAttribute("oncommand", "goDoCommand('cmd_print')");

}
