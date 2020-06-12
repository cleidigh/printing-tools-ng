/* globals
List,
ListController,

*/

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

var PMDstr = Cc["@mozilla.org/supports-string;1"]
	.createInstance(Ci.nsISupportsString);

var strBundleService = Services.strings;

var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
var fullPanel;
var fromPreview;
var gheaderList;

function getComplexPref(pref) {
	if (prefs.getStringPref)
		return prefs.getStringPref(pref);
	return prefs.getComplexValue(pref, Ci.nsISupportsString).data;
}

function setComplexPref(pref, value) {
	if (prefs.setStringPref)
		prefs.setStringPref(pref, value);
	else {
		PMDstr.data = value;
		prefs.setComplexValue(pref, Ci.nsISupportsString, PMDstr);
	}
}

function initPMDpanel() {
	var abook = false;

	if (window.arguments) {
		fromPreview = window.arguments[0] || false;
		abook = window.arguments[1] || false;
	} else
		fromPreview = false;

	var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
		.getService(Ci.nsIWindowMediator);
	var win = wm.getMostRecentWindow("mail:addressbook");
	if (win) {
		abook = true;
	}

	if (abook) {
		document.getElementById("ptng-tbox").selectedIndex = 4;
	}

	fullPanel = true;
	initPMDabpanel();

	var bundle = strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
	if (Array.isArray) {
		document.getElementById("dateLoc").collapsed = true;
		document.getElementById("dateSpacer").collapsed = true;
		document.getElementById("dateShortRadio").label += (" " + bundle.GetStringFromName("dateformatTB5"));
	}

	if (prefs.getPrefType("extensions.printingtoolsng.headers.addname") > 0) {
		if (prefs.getBoolPref("extensions.printingtoolsng.headers.addname"))
			prefs.setIntPref("extensions.printingtoolsng.headers.add_name_type", 1);
		else
			prefs.setIntPref("extensions.printingtoolsng.headers.add_name_type", 0);
		prefs.deleteBranch("extensions.printingtoolsng.headers.addname");
	}
	document.getElementById("addRdate").checked = prefs.getBoolPref("extensions.printingtoolsng.add_received_date");
	document.getElementById("addNameRG").selectedIndex = prefs.getIntPref("extensions.printingtoolsng.headers.add_name_type");
	document.getElementById("addNameBox").value = getComplexPref("extensions.printingtoolsng.headers.custom_name_value");
	document.getElementById("PMDdate").checked = prefs.getBoolPref("extensions.printingtoolsng.process.date");
	document.getElementById("PMDattach").checked = prefs.getBoolPref("extensions.printingtoolsng.process.attachments");
	document.getElementById("PMDborders").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.setborders");
	document.getElementById("PMDhide").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.hide");
	document.getElementById("PMDextHide").checked = prefs.getBoolPref("extensions.printingtoolsng.ext_headers.hide");
	document.getElementById("PMDhideImgs").checked = prefs.getBoolPref("extensions.printingtoolsng.images.hide");
	document.getElementById("resizeImgs").checked = prefs.getBoolPref("extensions.printingtoolsng.images.resize");
	document.getElementById("PMDtruncate").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.truncate");
	document.getElementById("PMDmaxchars").value = prefs.getIntPref("extensions.printingtoolsng.headers.maxchars");
	document.getElementById("PMDprogress").checked = !prefs.getBoolPref("print.show_print_progress");
	document.getElementById("PMDhideAtt").checked = prefs.getBoolPref("extensions.printingtoolsng.hide.inline_attachments");
	document.getElementById("PMDselection").checked = prefs.getBoolPref("extensions.printingtoolsng.print.just_selection");
	document.getElementById("PMDattachIcon").checked = prefs.getBoolPref("extensions.printingtoolsng.process.attachments_with_icon");
	document.getElementById("showButtonPreview").checked = prefs.getBoolPref("extensions.printingtoolsng.show_options_button");

	if (String.trim)
		document.getElementById("addP7M").checked = prefs.getBoolPref("extensions.printingtoolsng.process.add_p7m_vcf_attach");
	else
		document.getElementById("addP7M").setAttribute("collapsed", "true");
	document.getElementById("radiostyle").selectedIndex = prefs.getIntPref("extensions.printingtoolsng.messages.style_apply");
	document.getElementById("messageStyle").checked = prefs.getBoolPref("extensions.printingtoolsng.messages.style");
	document.getElementById("addFolder").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.addfolder");
	document.getElementById("PMDblack").checked = prefs.getBoolPref("extensions.printingtoolsng.messages.black_text");
	document.getElementById("PMDtruncate").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.truncate");
	document.getElementById("alignHeaders").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.align");
	document.getElementById("dateLongRG").selectedIndex = prefs.getIntPref("extensions.printingtoolsng.date.long_format_type");

	var max_pre_len = prefs.getIntPref("extensions.printingtoolsng.pre_max_length");
	if (max_pre_len > 0) {
		document.getElementById("PREtruncate").checked = true;
		document.getElementById("PREmaxchars").value = max_pre_len;
	}

	if (prefs.getPrefType("print.always_print_silent") !== 0 && prefs.getBoolPref("print.always_print_silent"))
		document.getElementById("PMDsilent").checked = true;
	else
		document.getElementById("PMDsilent").checked = false;

	var sID = "s" + prefs.getIntPref("extensions.printingtoolsng.cite.size");
	document.getElementById("citeSize").selectedItem = document.getElementById(sID);
	var xID = "x" + prefs.getIntPref("extensions.printingtoolsng.messages.size");
	document.getElementById("fontsize").selectedItem = document.getElementById(xID);

	// document.getElementById("citeColor").color = prefs.getCharPref("extensions.printingtoolsng.cite.color");
	document.getElementById("citeColor").value = prefs.getCharPref("extensions.printingtoolsng.cite.color");
	document.getElementById("citeCheck").checked = prefs.getBoolPref("extensions.printingtoolsng.cite.style");

	var fontlist = document.getElementById("fontlist");
	var fonten = Cc["@mozilla.org/gfx/fontenumerator;1"].createInstance(Ci.nsIFontEnumerator);
	var allfonts = fonten.EnumerateAllFonts({});
	var selindex = 0;
	var popup = document.createXULElement("menupopup");

	for (var j = 0; j < allfonts.length; j++) {
		var menuitem = document.createXULElement("menuitem");
		menuitem.setAttribute("value", allfonts[j]);
		menuitem.setAttribute("label", allfonts[j]);
		if (prefs.getPrefType("extensions.printingtoolsng.messages.font_family") > 0 &&
			allfonts[j] === getComplexPref("extensions.printingtoolsng.messages.font_family")) {
			selindex = j;
		}
		popup.appendChild(menuitem);
	}
	fontlist.appendChild(popup);
	fontlist.selectedIndex = selindex;

	toggleCiteStyle(document.getElementById("citeCheck"));
	toggleMessageStyle(document.getElementById("messageStyle"));
	toggleAtt();

	// cleidigh fix

	/* List.js is required to make this table work. */

	Document.prototype.createElement = function (e) {
		var element = document.createElementNS("http://www.w3.org/1999/xhtml", e);
		return element;
	};

	var options = {
		valueNames: ['headerName', { data: ['id', 'headerToken'] }],
		item: '<tr class="list-row"><td class="headerName"></td></tr>',
	};

	gheaderList = new List('headersListContainer', options);
	gheaderList.controller = new ListController(gheaderList, { onSelectedCB: this.onSelectListRow });

	//   var list = document.getElementById("headersList");
	var order = prefs.getCharPref("extensions.printingtoolsng.headers.order");
	var u = order.split(",");
	if (u.length < 7)
		u[6] = "%r3";

	console.debug(u);
	for (var i = 0; i < u.length; i++) {
		var lab = getHeaderLabel(u[i]);
		gheaderList.add({ headerName: lab, headerToken: u[i], id: i + 1 });
	}
	gheaderList.controller.selectRowByDataId('1');
	
	setPrinterList();
}

function setPrinterList() {
	var outputPrinter = prefs.getCharPref("print_printer");
	var printerListMenu = document.getElementById("OutputPrinter");
	var selindex = 0;
	var popup = document.createXULElement("menupopup");

	var PSSVC2 = Cc["@mozilla.org/gfx/printerenumerator;1"]
	.getService(Ci.nsIPrinterEnumerator);

	Services.console.logStringMessage("printingtools: print_printer " + outputPrinter);
	var pe = PSSVC2.printerNameList;
	var printers = [];
	var i = 0;
	while(pe.hasMore()) {
		let printerName = pe.getNext();
		var menuitem = document.createXULElement("menuitem");

		Services.console.logStringMessage("printingtools: printerName: " + printerName);
		printers.push(printerName);
		menuitem.setAttribute("value", printerName);
		menuitem.setAttribute("label", printerName);
		popup.appendChild(menuitem);
		if ( printerName === outputPrinter) {
			selindex = i;
			Services.console.logStringMessage("printingtools: selected: " + outputPrinter);
		}
		i++;
	}

	var PSSVC = Cc["@mozilla.org/gfx/printsettings-service;1"]
		.getService(Ci.nsIPrintSettingsService);

	
	printerListMenu.appendChild(popup);
	printerListMenu.selectedIndex = selindex;
	Services.console.logStringMessage("printingtools: printerName index: " + selindex);
}

function initPMDabpanel() {

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

	var fontlist = document.getElementById("ABfontlist");
	var fonten = Cc["@mozilla.org/gfx/fontenumerator;1"].createInstance(Ci.nsIFontEnumerator);
	var allfonts = fonten.EnumerateAllFonts({});
	var selindex = 0;
	var popup = document.createXULElement("menupopup");

	for (var j = 0; j < allfonts.length; j++) {
		var menuitem = document.createXULElement("menuitem");
		menuitem.setAttribute("value", allfonts[j]);
		menuitem.setAttribute("label", allfonts[j]);
		if (prefs.getPrefType("extensions.printingtoolsng.addressbook.font_family") > 0 &&
			allfonts[j] === getComplexPref("extensions.printingtoolsng.addressbook.font_family")) {
			selindex = j;
		}
		popup.appendChild(menuitem);
	}
	fontlist.appendChild(popup);
	fontlist.selectedIndex = selindex;


	document.getElementById("ABcustomFont").checked = prefs.getBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_family");
	var fontsize = prefs.getIntPref("extensions.printingtoolsng.addressbook.custom_font_size");
	if (fontsize > 7 && fontsize < 19)
		document.getElementById("ABfontsize").selectedIndex = fontsize - 8;
	else
		document.getElementById("ABfontsize").selectedIndex = 2;

}

function onSelectListRow(event, data_id) {
	if (event.type === 'onclick') {
		// miczThunderStatsPrefPanel.onNBDItemClick(event, data_id);

	} else {
		// miczThunderStatsPrefPanel.updateNBDButtons(window);
	}
}

function getHeaderLabel(string) {
	var bundle = strBundleService.createBundle("chrome://messenger/locale/mime.properties");
	var bundle2 = strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
	switch (string) {
		case "%a":
			return bundle2.GetStringFromName("attachments");
		case "%s":
			return bundle.GetStringFromID(1000);
		case "%f":
			return bundle.GetStringFromID(1009);
		case "%r1":
			return bundle.GetStringFromID(1012);
		case "%r2":
			return bundle.GetStringFromID(1013);
		case "%r3":
			return bundle.GetStringFromID(1023);
		case "%d":
			return bundle.GetStringFromID(1007);
		default:
			return null;
	}
}

function savePMDprefs() {
	if (fullPanel)
		savePMDabprefs(true);
		prefs.setCharPref("print_printer", document.getElementById("OutputPrinter").value);
		Services.console.logStringMessage("printingtools: print_printer " + document.getElementById("OutputPrinter").value);	
	
	var max_pre_len;
	if (document.getElementById("PREtruncate").checked)
		max_pre_len = document.getElementById("PREmaxchars").value;
	else
		max_pre_len = -1;

	prefs.setIntPref("extensions.printingtoolsng.pre_max_length", max_pre_len);
	prefs.setIntPref("extensions.printingtoolsng.headers.add_name_type", document.getElementById("addNameRG").selectedIndex);
	prefs.setBoolPref("extensions.printingtoolsng.process.date", document.getElementById("PMDdate").checked);
	prefs.setBoolPref("extensions.printingtoolsng.process.attachments", document.getElementById("PMDattach").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.setborders", document.getElementById("PMDborders").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.hide", document.getElementById("PMDhide").checked);
	prefs.setBoolPref("extensions.printingtoolsng.ext_headers.hide", document.getElementById("PMDextHide").checked);
	prefs.setBoolPref("extensions.printingtoolsng.images.hide", document.getElementById("PMDhideImgs").checked);
	prefs.setBoolPref("extensions.printingtoolsng.images.resize", document.getElementById("resizeImgs").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.truncate", document.getElementById("PMDtruncate").checked);
	prefs.setIntPref("extensions.printingtoolsng.headers.maxchars", document.getElementById("PMDmaxchars").value);
	prefs.setBoolPref("print.always_print_silent", document.getElementById("PMDsilent").checked);
	prefs.setBoolPref("print.show_print_progress", !document.getElementById("PMDprogress").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.truncate", document.getElementById("PMDtruncate").checked);
	prefs.setBoolPref("extensions.printingtoolsng.hide.inline_attachments", document.getElementById("PMDhideAtt").checked);
	prefs.setBoolPref("extensions.printingtoolsng.print.just_selection", document.getElementById("PMDselection").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.addfolder", document.getElementById("addFolder").checked);
	prefs.setBoolPref("extensions.printingtoolsng.messages.black_text", document.getElementById("PMDblack").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.align", document.getElementById("alignHeaders").checked);
	prefs.setBoolPref("extensions.printingtoolsng.show_options_button", document.getElementById("showButtonPreview").checked);
	prefs.setBoolPref("extensions.printingtoolsng.add_received_date", document.getElementById("addRdate").checked);

	prefs.setIntPref("extensions.printingtoolsng.date.long_format_type", document.getElementById("dateLongRG").selectedIndex);

	var size = document.getElementById("citeSize").selectedItem.id.replace("s", "");
	prefs.setIntPref("extensions.printingtoolsng.cite.size", size);
	prefs.setCharPref("extensions.printingtoolsng.cite.color", document.getElementById("citeColor").value);
	prefs.setBoolPref("extensions.printingtoolsng.cite.style", document.getElementById("citeCheck").checked);
	prefs.setBoolPref("extensions.printingtoolsng.process.attachments_with_icon", document.getElementById("PMDattachIcon").checked);

	var fontlistchild = document.getElementById("fontlist").getElementsByTagName("menuitem");
	var selfont = fontlistchild[document.getElementById("fontlist").selectedIndex].getAttribute("value");
	setComplexPref("extensions.printingtoolsng.messages.font_family", selfont);
	setComplexPref("extensions.printingtoolsng.headers.custom_name_value", document.getElementById("addNameBox").value);

	prefs.setBoolPref("extensions.printingtoolsng.messages.style", document.getElementById("messageStyle").checked);
	size = document.getElementById("fontsize").selectedItem.id.replace("x", "");
	prefs.setIntPref("extensions.printingtoolsng.messages.size", size);
	prefs.setIntPref("extensions.printingtoolsng.messages.style_apply", document.getElementById("radiostyle").selectedIndex);

	var list = document.getElementById("headersList");
	var val = "";
	for (var i = 0; i < 6; i++) {
		var item = list.rows.item(i);
		val = val + item.getAttribute("data-headerToken") + ",";
	}
	val = val + list.rows.item(6).getAttribute("data-headerToken");
	prefs.setCharPref("extensions.printingtoolsng.headers.order", val);
	prefs.setBoolPref("extensions.printingtoolsng.process.add_p7m_vcf_attach", document.getElementById("addP7M").checked);
	if (fromPreview) {
		try {
			opener.close();
			var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
				.getService(Ci.nsIWindowMediator);
			var win = wm.getMostRecentWindow("mail:3pane");
			if (win)
				win.PrintEnginePrintPreview();
		} catch (e) { }
	}
}

function savePMDabprefs(fullpanel) {

	prefs.setBoolPref("extensions.printingtoolsng.addressbook.max_compact", document.getElementById("PMDabmaxcompact").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_size", document.getElementById("PMDabsmallfont").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.hide_header_card", document.getElementById("PMDabnohead").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.print_just_addresses", document.getElementById("PMDabjustaddress").checked);
	prefs.setIntPref("extensions.printingtoolsng.addressbook.custom_font_size", document.getElementById("ABfontsize").selectedItem.label);

	var fontlistchild = document.getElementById("ABfontlist").getElementsByTagName("menuitem");
	var selfont = fontlistchild[document.getElementById("ABfontlist").selectedIndex].getAttribute("value");
	prefs.setCharPref("extensions.printingtoolsng.addressbook.font_family", selfont);

	prefs.setBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_family", document.getElementById("ABcustomFont").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.cut_notes", document.getElementById("PMDcutnotes").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.add_ab_name", document.getElementById("PMDaddname").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.print_multiple_cards", document.getElementById("multipleCards").checked);
	if (document.getElementById("PMDabsmallfont") && opener.printingtools) {
		var isContact = opener.printingtools.isContact;
		opener.close();
		var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator);
		var win = wm.getMostRecentWindow("mail:addressbook");
		if (!win)
			return;
		if (!isContact)
			win.AbPrintPreviewAddressBook();
		else
			win.AbPrintPreviewCard();
	}
}


function move2(offset) {
	var list = document.getElementById("headersList");
	var pos = list.selectedIndex;
	if ((pos === 0 && offset > 0) || (pos === (list.itemCount - 1) && offset < 0))
		return;
	var label = list.currentItem.label;
	var value = list.currentItem.value;
	var newpos = pos - offset;
	var item = list.removeItemAt(list.currentIndex);
	var newitem = list.insertItemAt(newpos, label, value);
	list.selectedIndex = newpos;
}

function move(offset) {
	var listElement = gheaderList.list;
	var selectedID = gheaderList.controller.getSelectedRowDataId();
	if (selectedID === '1' && offset > 1 || selectedID === listElement.rows.length && offset < 0) {
		return;
	}

	var selectedElement = gheaderList.controller.getSelectedRowElement();
	var swapElement;
	if (offset === 1) {
		swapElement = selectedElement.previousElementSibling;

	} else {
		swapElement = selectedElement.nextElementSibling;
	}

	selectedElement.remove();
	if (offset === 1) {
		listElement.insertBefore(selectedElement, swapElement);
	} else {
		swapElement.parentNode.insertBefore(selectedElement, swapElement.nextSibling);
	}
	gheaderList.reindex();
	selectedElement.setAttribute("data-id", selectedID - 1);
	swapElement.setAttribute("data-id", selectedID + 1);
	gheaderList.controller.selectRowByDataId(selectedID - 1);
}

function toggleCiteStyle(el) {
	document.getElementById("citeColor").disabled = !el.checked;
	document.getElementById("citeSize").disabled = !el.checked;
}

function toggleMessageStyle(el) {
	document.getElementById("fontlist").disabled = !el.checked;
	document.getElementById("fontsize").disabled = !el.checked;
	document.getElementById("radiostyle").disabled = !el.checked;
}

function toggleAtt() {
	document.getElementById("PMDattachIcon").disabled = !document.getElementById("PMDattach").checked;
	document.getElementById("addP7M").disabled = !document.getElementById("PMDattach").checked;
}

function toggleDate() {
	document.getElementById("dateLongRG").disabled = !document.getElementById("PMDdate").checked;
}


document.addEventListener("dialogaccept", function (event) {
	savePMDprefs();
});

window.addEventListener("load", function (event) {
	initPMDpanel();
});


