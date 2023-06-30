// messengerOL - overlay loader for messenger.xul - Source: mzcw-overlay.xul

// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment

var Services = globalThis.Services || ChromeUtils.import(
  'resource://gre/modules/Services.jsm'
).Services;

// Import any needed modules.
var ADDON_ID = "PrintingToolsNG@cleidigh.kokkini.net";
var extMsgHandler;
var btListener;

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

// Get our extension object.
let extension2 = ExtensionParent.GlobalManager.getExtension(ADDON_ID);

// Load notifyTools into a custom namespace, to prevent clashes with other add-ons.
window.ptngAddon = {};
Services.scriptloader.loadSubScript(extension2.rootURI.resolve("chrome/content/notifyTools.js"), window.ptngAddon, "UTF-8");


async function onLoad() {

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
	<menuitem id="ptng-options-filemenu" insertafter="printMenuItem" accesskey="o" label="&ptngOptions.label;" oncommand="openPTdialog(false)"/>
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

	window.getUI_status.startup();

	// inject extension object into private context
	window.printingtoolsng = {};
	window.printingtoolsng.extension = WL.extension;


	extMsgHandler = window.ptngAddon.notifyTools.addListener(handleExternalPrint);







	let ctxMenu =
		`<menupopup>
			<menuitem id="ptng-button-print" accesskey="&contextPrint.accesskey;" label="&print.label;" oncommand="printingtools.cmd_printng({printSilent: true}); event.stopPropagation();" />
			<menuitem id="ptng-button-printpreview" accesskey="&contextPrintPreview.accesskey;" label="&printPreview.label;" oncommand="printingtools.cmd_printng({printSilent: false}); event.stopPropagation();"/>
			<menuseparator />
			<menuitem accesskey="o" label="&ptngOptions.label;" oncommand="openPTdialog(false); event.stopPropagation();" style=""/>
			<menuitem id="ptng-button-help" accesskey="h" label="&Help;" oncommand="utils.loadHelp(); event.stopPropagation();"/>
		</menupopup>`;

	let dtdFiles = ["chrome://printingtoolsng/locale/printingtoolsng.dtd", "chrome://messenger/locale/messenger.dtd"];

	addTBbuttonMainFuncOrCtxMenu(ADDON_ID, "unified-toolbar-button", window.printingtools.cmd_printng, ctxMenu, dtdFiles);

	// These are the signatures for button function only or context menu only:
	// addTBbuttonMainFuncOrCtxMenu(ADDON_ID, "unified-toolbar-button", window.printingtools.cmd_printng, null, null);
	// addTBbuttonMainFuncOrCtxMenu(ADDON_ID, "unified-toolbar-button", null, ctxMenu, dtdFiles);
}


function addTBbuttonMainFuncOrCtxMenu(addOnId, toolbarClass, mainButtFunc, buttCtxMenu, ctxMenuDTDs) {
	// width of ucarret dropdown area in px
	const dropdownTargetWidth = 21;
	// we need tabmail for its tabMonitor
	var tabmail = document.getElementById("tabmail");

	if (!mainButtFunc && !buttCtxMenu) {
		// can't operate on ziltch
		return false;
	}

	// The toolbar buttons are added in a lazy fashion. They do not get
	// placed in the toolbar DOM at install or startup, instead they 
	// get added the fist time either the 3Pane or a messageDisplay tab
	// is focused. We therefore use a tabmonitor to listen when we have
	// our button we can add the listener. We then remove the tabmonitor.

	var tabMonitor = {
		monitorName: "tbButtonListenerMonitor",

		onTabTitleChanged() { },
		onTabOpened() { },
		onTabPersist() { },
		onTabRestored() { },
		onTabClosing() { },

		async onTabSwitched(newTabInfo, oldTabInfo) {
			// console.log(newTabInfo.mode?.name)
			if (newTabInfo.mode?.name == "mail3PaneTab" || newTabInfo.mode?.name == "mailMessageTab") {
				await setup();
			}
		}
	}

	// register tabmonitor for setting up listener
	tabmail.registerTabMonitor(tabMonitor);
	return true;

	// Setup parent div listener according to parameters.
	// Wait until button is installed to add listener.

	async function setup() {
		var tbExtButton;
		for (var index = 0; index < 100; index++) {
			tbExtButton = document.querySelector(`button.${toolbarClass}[extension="${addOnId}"]`);
			if (tbExtButton) {
				break;
			}
			await new Promise(resolve => window.setTimeout(resolve, 1));
		}

		if (!tbExtButton) {
			console("Exception: Extension button not found on toolbar")
			return;
		}
		// get parent div for listener
		let listenerTarget = tbExtButton.parentElement;
		let listenerTargetId = `tbButtonParentListenerDiv_${addOnId}`;
		listenerTarget.setAttribute("id", listenerTargetId);

		// setup for context menu if requested
		if (buttCtxMenu) {
			let ctxMenuXML = `<div id="${listenerTargetId}"> ${buttCtxMenu} </div>`;
			try {
				WL.injectElements(ctxMenuXML, ctxMenuDTDs);
			} catch (e) {
				console.log("Exception adding context menu:", e);
				return;
			}
		}

		// we setup our listener on the button container parent div
		// key is to use the capture phase mode, this follows the propagation from the
		// top of the DOM down and proceeds the bubbling phase where our listener would 
		// be blocked by the normal button listener 
		listenerTarget.addEventListener('click', listenerFunc, true);
		tabmail.unregisterTabMonitor(tabMonitor);
	}

	// Listener function called when on mail type tabs, however we need
	// to poll for button. Not ideal, but given it's not instant no
	// beter way. Setup according to call params. Kill unnecessary tabmonitor.

	function listenerFunc(e) {
		e.stopImmediatePropagation();
		e.stopPropagation();

		if (e.target.nodeName == "menuitem") {
			return;
		}
		if (mainButtFunc && !buttCtxMenu) {
			// only a main click action
			mainButtFunc();
			return;
		}

		let tbExtButton = document.querySelector(`button.${toolbarClass}[extension="${addOnId}"]`);
		// get click location and determine if in dropdown window if split button
		let targetDivBRect = tbExtButton.getBoundingClientRect();
		let inTargetWindow = e.clientX > (targetDivBRect.x + targetDivBRect.width - dropdownTargetWidth);
		// open context menu if configure
		if ((buttCtxMenu && !mainButtFunc) || (buttCtxMenu && inTargetWindow)) {
			tbExtButton.nextElementSibling.openPopup(tbExtButton, "after_start", 0, 0, false, false);
		} else {
			mainButtFunc();
		}
	};
}




// -- Define listeners for messages from the background script.

async function handleExternalPrint(data) {
	console.log(" incoming ext msg" + data);
	console.log(data)
	if (!data.messageHeader) {
		return;
	}
	await window.printingtools.cmd_printng_external({ messageHeader: data.messageHeader || "error" })
	console.log("PTNG: External print handler done")
	return true;
}




function onUnload(shutdown) {
	// console.debug('PT unloading');
	document.removeEventListener('click', btListener);
	window.ptngAddon.notifyTools.removeListener(extMsgHandler);
	window.getUI_status.shutdown();
	window.printingtools.shutdown();
}