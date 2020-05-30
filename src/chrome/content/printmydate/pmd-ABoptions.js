var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

function initPMDabpanel() {
	document.getElementById("multipleCards").checked = prefs.getBoolPref("extensions.printingtools.addressbook.print_multiple_cards");
	document.getElementById("PMDabmaxcompact").checked = prefs.getBoolPref("extensions.printingtools.addressbook.max_compact");
	document.getElementById("PMDabsmallfont").checked = prefs.getBoolPref("extensions.printingtools.addressbook.use_custom_font_size");
	document.getElementById("ABcustomFont").checked = prefs.getBoolPref("extensions.printingtools.addressbook.use_custom_font_family");
	if (String.trim)
		document.getElementById("PMDabnohead").collapsed = true;
	else	
		document.getElementById("PMDabnohead").checked = prefs.getBoolPref("extensions.printingtools.addressbook.hide_header_card");
	document.getElementById("PMDabjustaddress").checked = prefs.getBoolPref("extensions.printingtools.addressbook.print_just_addresses");
	document.getElementById("PMDcutnotes").checked = prefs.getBoolPref("extensions.printingtools.addressbook.cut_notes");
	document.getElementById("PMDaddname").checked = prefs.getBoolPref("extensions.printingtools.addressbook.add_ab_name");
	
	var fontsize = prefs.getIntPref("extensions.printingtools.addressbook.custom_font_size");
	if (fontsize > 7 && fontsize < 19)
		document.getElementById("ABfontsize").selectedIndex = fontsize - 8;
	else
		document.getElementById("ABfontsize").selectedIndex = 2;
		
	var fontlist = document.getElementById("ABfontlist");
	var fonten = Components.classes["@mozilla.org/gfx/fontenumerator;1"].createInstance(Components.interfaces.nsIFontEnumerator);	
	var allfonts = fonten.EnumerateAllFonts({});
	var selindex = 0;
	var popup = document.createElement("menupopup");
	
	for (var j=0;j<allfonts.length;j++) {
		var menuitem = document.createElement("menuitem");
		menuitem.setAttribute("value", allfonts[j]);
		menuitem.setAttribute("label", allfonts[j]);
		if (prefs.getPrefType("extensions.printingtools.addressbook.font_family") > 0 && allfonts[j] == prefs.getCharPref("extensions.printingtools.addressbook.font_family")) {
			selindex = j;
		}
		popup.appendChild(menuitem);
	}

	fontlist.appendChild(popup);
	fontlist.selectedIndex=selindex;
}
    
function savePMDabprefs(fullpanel)  {
	prefs.setBoolPref("extensions.printingtools.addressbook.max_compact", document.getElementById("PMDabmaxcompact").checked);
	prefs.setBoolPref("extensions.printingtools.addressbook.use_custom_font_size", document.getElementById("PMDabsmallfont").checked);
	prefs.setBoolPref("extensions.printingtools.addressbook.hide_header_card", document.getElementById("PMDabnohead").checked);
	prefs.setBoolPref("extensions.printingtools.addressbook.print_just_addresses", document.getElementById("PMDabjustaddress").checked);
	prefs.setIntPref("extensions.printingtools.addressbook.custom_font_size", document.getElementById("ABfontsize").selectedItem.label);
	var fontlistchild = document.getElementById("ABfontlist").getElementsByTagName("menuitem");
	var selfont = fontlistchild[document.getElementById("ABfontlist").selectedIndex].getAttribute("value")
	prefs.setCharPref("extensions.printingtools.addressbook.font_family", selfont);
	prefs.setBoolPref("extensions.printingtools.addressbook.use_custom_font_family", document.getElementById("ABcustomFont").checked);
	prefs.setBoolPref("extensions.printingtools.addressbook.cut_notes", document.getElementById("PMDcutnotes").checked);
	prefs.setBoolPref("extensions.printingtools.addressbook.add_ab_name", document.getElementById("PMDaddname").checked);
	prefs.setBoolPref("extensions.printingtools.addressbook.print_multiple_cards", document.getElementById("multipleCards").checked);
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
}
