var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

function initPMDabpanel() {

	Services.console.logStringMessage("printing options init ab");
	
	document.documentElement.style.setProperty("--groupbox-header-bg", "#f0f0f0");

	document.getElementById("multipleCards").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.print_multiple_cards");
	document.getElementById("PMDabmaxcompact").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.max_compact");
	document.getElementById("PMDabsmallfont").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_size");
	document.getElementById("ABcustomFont").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_family");
	if (String.trim)
		document.getElementById("PMDabnohead").collapsed = true;
	else	
		document.getElementById("PMDabnohead").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.hide_header_card");
	document.getElementById("PMDabjustaddress").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.print_just_addresses");
	document.getElementById("PMDcutnotes").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.cut_notes");
	document.getElementById("PMDaddname").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.add_ab_name");
	

	// return;

	var fontsize = prefs.getIntPref("extensions.printingtoolsng.addressbook.custom_font_size");
	if (fontsize > 7 && fontsize < 19)
		document.getElementById("ABfontsize").selectedIndex = fontsize - 8;
	else
		document.getElementById("ABfontsize").selectedIndex = 2;
		
		Services.console.logStringMessage("printing options Toafter partial");
	var fontlist = document.getElementById("ABfontlist2");
	var fonten = Components.classes["@mozilla.org/gfx/fontenumerator;1"].createInstance(Components.interfaces.nsIFontEnumerator);	
	var allfonts = fonten.EnumerateAllFonts({});
	var selindex = 0;
	var popup = document.createXULElement("menupopup");
	
	for (var j=0;j<allfonts.length;j++) {
		var menuitem = document.createXULElement("menuitem");
		menuitem.setAttribute("value", allfonts[j]);
		menuitem.setAttribute("label", allfonts[j]);
		if (prefs.getPrefType("extensions.printingtoolsng.addressbook.font_family") > 0 && allfonts[j] == prefs.getCharPref("extensions.printingtoolsng.addressbook.font_family")) {
			selindex = j;
		}
		popup.appendChild(menuitem);
		// Services.console.logStringMessage("printingtools options font " + allfonts[j]);
	}
	
	// Services.console.logStringMessage(popup.outerHTML);
	fontlist.appendChild(popup);
	fontlist.selectedIndex = selindex;
	Services.console.logStringMessage("printing options ab pushpin –");
}
    
function savePMDabprefs(fullpanel)  {
	Services.console.logStringMessage("printing options ab save");
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.max_compact", document.getElementById("PMDabmaxcompact").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_size", document.getElementById("PMDabsmallfont").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.hide_header_card", document.getElementById("PMDabnohead").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.print_just_addresses", document.getElementById("PMDabjustaddress").checked);
	prefs.setIntPref("extensions.printingtoolsng.addressbook.custom_font_size", document.getElementById("ABfontsize").selectedItem.label);
	
	var fontlistchild = document.getElementById("ABfontlist").getElementsByTagName("menuitem");
	var selfont = fontlistchild[document.getElementById("ABfontlist2").selectedIndex].getAttribute("value")
	prefs.setCharPref("extensions.printingtoolsng.addressbook.font_family", selfont);
	
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_family", document.getElementById("ABcustomFont").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.cut_notes", document.getElementById("PMDcutnotes").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.add_ab_name", document.getElementById("PMDaddname").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.print_multiple_cards", document.getElementById("multipleCards").checked);
	if (document.getElementById("PMDabsmallfont") && opener.printingtools) {
		var isContact = opener.printingtools.isContact;
		opener.close();
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
		var win = wm.getMostRecentWindow("mail:addressbook");
		if (! win)
			return;
		if (! isContact)
			win.AbPrintPreviewAddressBook();
		else
			win.AbPrintPreviewCard();
	}
	Services.console.logStringMessage("printing options ab saved");
}


document.addEventListener("dialogaccept", function (event) {
	savePMDabprefs();
});

window.addEventListener("load", function (event) {
	initPMDabpanel();
});
