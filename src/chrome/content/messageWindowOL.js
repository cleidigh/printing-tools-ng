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
	<menuitem id="ptng-options-filemenu" insertafter="printMenuItem" accesskey="o" label="&PMDmenuitem;" oncommand="openPTdialog(false)"/>
</menupopup>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);

		WL.injectElements(`
<toolbarpalette id="MailToolbarPalette">
	<toolbarbutton id="ptng-button"
	  label="&printButton.label; NG"
	  tooltiptext="Printing Tools NG"
	  oncommand="printingtools.cmd_printng(null, {})"
	  class="toolbarbutton-1"
	  type="menu-button"
	  is="toolbarbutton-menu-button">

	  	<menupopup>
		  <menuitem id="ptng-button-print" label="&printButton.label;" accesskey="P" oncommand="printingtools.cmd_printng(null, {printSilent: true}); event.stopPropagation();" />
		  <menuitem id="ptng-button-printpreview" accesskey="v" label="&contextPrintPreview.label;" oncommand="printingtools.cmd_printng(null, {printSilent: false}); event.stopPropagation();"  />
		  <menuseparator />
		  <menuitem id="ptng-button-options" accesskey="o" label="Printingtools NG Options" oncommand="openPTdialog(false); event.stopPropagation();"/>
		  </menupopup>
	  </toolbarbutton>
</toolbarpalette>
`, ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"]);


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

		//window.getUI_status.startup();
	}


