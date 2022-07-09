/* globals
List,
ListController,

*/

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { strftime } = ChromeUtils.import("chrome://printingtoolsng/content/strftime.js"); 
var PMDstr = Cc["@mozilla.org/supports-string;1"]
	.createInstance(Ci.nsISupportsString);

var strBundleService = Services.strings;

var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
var fullPanel;
var fromPreview;
var gheaderList;
var abook = false;


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

async function loadHelp(bmark) {
	//console.log("help load")
	t = await window.opener.ptngAddon.notifyTools.notifyBackground({ command: "openHelp", locale: Services.locale.appLocaleAsBCP47});
}

async function  initPMDpanel() {

	// cleidigh
	//console.debug('initialize panel');
	
	var win = Cc["@mozilla.org/appshell/window-mediator;1"]
		.getService(Ci.nsIWindowMediator)
		.getMostRecentWindow("mail:3pane");

		
	var PTNGVersion = win.printingtoolsng.extension.addonData.version;

	let title = document.getElementById("ptng-options").getAttribute("title");

	document.getElementById("ptng-options").setAttribute("title", `${title} - v${PTNGVersion}`);

	if (window.arguments) {
		if (typeof window.arguments[0] === 'object' || window.arguments[0] === false) {
			fromPreview = false;
			abook = window.arguments[1] || false;

		} else {
			fromPreview = window.arguments[0] || false;
			abook = window.arguments[1] || false;
		}
	} else {
		fromPreview = false;
		abook = false;
	}
	// console.debug(fromPreview);
	// console.debug(abook);

	var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
		.getService(Ci.nsIWindowMediator);
	var awin = wm.getMostRecentWindow("mail:addressbook");
	if (awin) {
		abook = true;
	}

	if (abook) {
		document.getElementById("ptng-tbox").selectedIndex = 4;
	}

	fullPanel = true;
	initPMDabpanel();

	var bundle = strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");


	document.getElementById("useCcBccAlways").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always");

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
	document.getElementById("border_style").value = prefs.getCharPref("extensions.printingtoolsng.headers.border_style");

	document.getElementById("PMDhide").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.hide");


	document.getElementById("useHeadersBkColor").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.use_background_color");
	toggleUseBackgroundColor(document.getElementById("useHeadersBkColor"));

	document.getElementById("headersBkColor").value = prefs.getCharPref("extensions.printingtoolsng.headers.background.color");


	document.getElementById("PMDextHide").checked = prefs.getBoolPref("extensions.printingtoolsng.ext_headers.hide");
	document.getElementById("PMDhideImgs").checked = prefs.getBoolPref("extensions.printingtoolsng.images.hide");
	document.getElementById("resizeImgs").checked = prefs.getBoolPref("extensions.printingtoolsng.images.resize");
	document.getElementById("PMDtruncate").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.truncate");
	document.getElementById("PMDmaxchars").value = prefs.getIntPref("extensions.printingtoolsng.headers.maxchars");

	document.getElementById("PMDhideAtt").checked = prefs.getBoolPref("extensions.printingtoolsng.hide.inline_attachments");
	document.getElementById("InlineAttsListhide").checked = prefs.getBoolPref("extensions.printingtoolsng.hide.inline_attachments_list");

	document.getElementById("PMDselection").checked = prefs.getBoolPref("extensions.printingtoolsng.print.just_selection");
	document.getElementById("PMDattachIcon").checked = prefs.getBoolPref("extensions.printingtoolsng.process.attachments_with_icon");
	document.getElementById("num_atts_line").value = prefs.getIntPref("extensions.printingtoolsng.headers.attachments_per_line");

	document.getElementById("addP7M").checked = prefs.getBoolPref("extensions.printingtoolsng.process.add_p7m_vcf_attach");
	document.getElementById("headersStyle").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.style");
	document.getElementById("messageStyle").checked = prefs.getBoolPref("extensions.printingtoolsng.messages.style");
	document.getElementById("addFolder").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.addfolder");
	document.getElementById("PMDtruncate").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.truncate");
	document.getElementById("alignHeaders").checked = prefs.getBoolPref("extensions.printingtoolsng.headers.align");
	document.getElementById("dateLongRG").selectedIndex = prefs.getIntPref("extensions.printingtoolsng.date.long_format_type");

	document.getElementById("customDate").value = prefs.getStringPref("extensions.printingtoolsng.date.custom_format");

	var max_pre_len = prefs.getIntPref("extensions.printingtoolsng.pre_max_length");
	if (max_pre_len > 0) {
		document.getElementById("PREtruncate").checked = true;
		document.getElementById("PREmaxchars").value = max_pre_len;
	}

	document.getElementById("PMDsilent").checked = prefs.getBoolPref("extensions.printingtoolsng.print.silent");
	
	var sID = "s" + prefs.getIntPref("extensions.printingtoolsng.cite.size");
	document.getElementById("citeSize").selectedItem = document.getElementById(sID);
	var hID = "h" + prefs.getIntPref("extensions.printingtoolsng.headers.size");
	document.getElementById("hdrfontsize").selectedItem = document.getElementById(hID);

	
	var xID = "x" + prefs.getIntPref("extensions.printingtoolsng.messages.size");
	document.getElementById("fontsize").selectedItem = document.getElementById(xID);

	// document.getElementById("citeColor").color = prefs.getCharPref("extensions.printingtoolsng.cite.color");
	document.getElementById("citeColor").value = prefs.getCharPref("extensions.printingtoolsng.cite.color");
	document.getElementById("citeCheck").checked = prefs.getBoolPref("extensions.printingtoolsng.cite.style");

	var hdrfontlist = document.getElementById("hdrfontlist");
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

	var hdrselindex = 0;
	var hdrpopup = document.createXULElement("menupopup");

	for (var j = 0; j < allfonts.length; j++) {
		let menuitem = document.createXULElement("menuitem");
		menuitem.setAttribute("value", allfonts[j]);
		menuitem.setAttribute("label", allfonts[j]);
		if (prefs.getPrefType("extensions.printingtoolsng.headers.font_family") > 0 &&
			allfonts[j] === getComplexPref("extensions.printingtoolsng.headers.font_family")) {
			hdrselindex = j;
		}
		hdrpopup.appendChild(menuitem);
	}
	hdrfontlist.appendChild(hdrpopup);
	hdrfontlist.selectedIndex = hdrselindex;


	toggleCiteStyle(document.getElementById("citeCheck"));
	toggleHeadersStyle(document.getElementById("headersStyle"), false);
	toggleMessageStyle(document.getElementById("messageStyle"), false);
	toggleAtt();

	// cleidigh fix

	/* List.js is required to make this table work. */

	Document.prototype.createElement = function (e) {
		var element = document.createElementNS("http://www.w3.org/1999/xhtml", e);
		return element;
	};

	var options = {
		valueNames: ['headerName', { data: ['id', 'headerToken', 'show'] }],
		item: '<tr class="list-row"><td class="headerName"></td></tr>',
	};

	gheaderList = new List('headersListContainer', options);
	gheaderList.controller = new ListController(gheaderList, { onSelectedCB: this.onSelectListRow });

	//   var list = document.getElementById("headersList");
	var order = prefs.getCharPref("extensions.printingtoolsng.headers.order");
	var u = order.split(",");
	if (u.length < 7)
		u[6] = "%r3";

	gheaderList.clear();
	for (var i = 0; i < u.length; i++) {
		var lab = getHeaderLabel(u[i].replace('!', ''));
		let show = !u[i].startsWith('!');
		
		gheaderList.add({ headerName: lab, headerToken: u[i], id: i + 1, show: show });
	}
	// console.debug(gheaderList.listElement.outerHTML);
	gheaderList.controller.selectRowByDataId('1');

	// Services.console.logStringMessage("printingtools: call printer setup");
	setPrinterList();

	document.getElementById("debug-options").value = prefs.getCharPref("extensions.printingtoolsng.debug.options");

	document.getElementById("useCcBccAlways").focus;
}

async function setPrinterList() {
	var outputPrinter = null;
	try {
		outputPrinter = prefs.getCharPref("print_printer");
	} catch (error) {

	}
	var printerListMenu = document.getElementById("OutputPrinter");
	var selindex = 0;
	var popup = document.createXULElement("menupopup");

	// change for 91
	var printerList = Cc["@mozilla.org/gfx/printerlist;1"]
		.getService(Ci.nsIPrinterList);

	// Services.console.logStringMessage("printingtools: print_printer " + outputPrinter);
	var printers = await printerList.printers;
	// var printers = [];
	var i = 0;
	// while(pe.hasMore()) {
	for (let printer of printers) {
		printer.QueryInterface(Ci.nsIPrinter);
		let printerName = printer.name;
		var menuitem = document.createXULElement("menuitem");

		// Services.console.logStringMessage("printingtools: printerName: " + printerName);
		// printers.push(printerName);
		menuitem.setAttribute("value", printerName);
		menuitem.setAttribute("label", printerName);
		popup.appendChild(menuitem);
		if (printerName === outputPrinter) {
			selindex = i;
			// Services.console.logStringMessage("printingtools: selected: " + outputPrinter);
		}
		i++;
	}

	var PSSVC = Cc["@mozilla.org/gfx/printsettings-service;1"]
		.getService(Ci.nsIPrintSettingsService);


	printerListMenu.appendChild(popup);
	printerListMenu.selectedIndex = selindex;
	// Services.console.logStringMessage("printingtools: printerName index: " + selindex);
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
	
	var bundle;
	//console.log(Services.locale.appLocaleAsBCP47)
	if (Services.locale.appLocaleAsBCP47 === "ja") {
		bundle = strBundleService.createBundle("chrome://printingtoolsng/locale/headers-ja.properties");
	} else if (Services.locale.appLocaleAsBCP47 === "zh-CN") {
		
		bundle = strBundleService.createBundle("chrome://printingtoolsng/locale/headers-zh.properties");
} else if (Services.locale.appLocaleAsBCP47 === "zh-TW") {
		
		bundle = strBundleService.createBundle("chrome://printingtoolsng/locale/headers-zh-tw.properties");
	} else {
		bundle = strBundleService.createBundle("chrome://messenger/locale/mime.properties");
	}

	var bundle2 = strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");
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
			if (prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always")) {
				return "Cc"
			}
			return bundle.GetStringFromID(1013);
		case "%r3":
			if (prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always")) {
				return "Bcc"
			}
			return bundle.GetStringFromID(1023);
		case "%d":
			return bundle.GetStringFromID(1007);
		default:
			return null;
	}
}

function savePMDprefs() {
	//console.debug('save options');
	
	prefs.setCharPref("print_printer", document.getElementById("OutputPrinter").value);
	prefs.setCharPref("print_printer", "");
	prefs.setCharPref("print_printer", document.getElementById("OutputPrinter").value);
	//Services.console.logStringMessage("printingtools: print_printer " + document.getElementById("OutputPrinter").value);

	prefs.setBoolPref("extensions.printingtoolsng.headers.useCcBcc_always", document.getElementById("useCcBccAlways").checked);

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
	prefs.setCharPref("extensions.printingtoolsng.headers.border_style", document.getElementById("border_style").value);

	prefs.setBoolPref("extensions.printingtoolsng.headers.hide", document.getElementById("PMDhide").checked);
	prefs.setCharPref("extensions.printingtoolsng.headers.background.color", document.getElementById("headersBkColor").value);
	prefs.setBoolPref("extensions.printingtoolsng.ext_headers.hide", document.getElementById("PMDextHide").checked);
	prefs.setBoolPref("extensions.printingtoolsng.images.hide", document.getElementById("PMDhideImgs").checked);
	prefs.setBoolPref("extensions.printingtoolsng.images.resize", document.getElementById("resizeImgs").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.truncate", document.getElementById("PMDtruncate").checked);
	prefs.setIntPref("extensions.printingtoolsng.headers.maxchars", document.getElementById("PMDmaxchars").value);
	prefs.setBoolPref("extensions.printingtoolsng.print.silent", document.getElementById("PMDsilent").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.truncate", document.getElementById("PMDtruncate").checked);
	prefs.setBoolPref("extensions.printingtoolsng.hide.inline_attachments", document.getElementById("PMDhideAtt").checked);
	prefs.setBoolPref("extensions.printingtoolsng.hide.inline_attachments_list", document.getElementById("InlineAttsListhide").checked);
	prefs.setBoolPref("extensions.printingtoolsng.print.just_selection", document.getElementById("PMDselection").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.addfolder", document.getElementById("addFolder").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.align", document.getElementById("alignHeaders").checked);

	//prefs.setBoolPref("extensions.printingtoolsng.show_options_button", document.getElementById("showButtonPreview").checked);

	prefs.setBoolPref("extensions.printingtoolsng.add_received_date", document.getElementById("addRdate").checked);


	prefs.setIntPref("extensions.printingtoolsng.date.long_format_type", document.getElementById("dateLongRG").selectedIndex);

	prefs.setStringPref("extensions.printingtoolsng.date.custom_format", document.getElementById("customDate").value);	
	var size = document.getElementById("citeSize").selectedItem.id.replace("s", "");
	prefs.setIntPref("extensions.printingtoolsng.cite.size", size);
	prefs.setCharPref("extensions.printingtoolsng.cite.color", document.getElementById("citeColor").value);
	prefs.setBoolPref("extensions.printingtoolsng.cite.style", document.getElementById("citeCheck").checked);
	prefs.setBoolPref("extensions.printingtoolsng.process.attachments_with_icon", document.getElementById("PMDattachIcon").checked);

	prefs.setIntPref("extensions.printingtoolsng.headers.attachments_per_line", document.getElementById("num_atts_line").selectedItem.value);

	var hdrfontlistchild = document.getElementById("hdrfontlist").getElementsByTagName("menuitem");
	var hdrselfont = hdrfontlistchild[document.getElementById("hdrfontlist").selectedIndex].getAttribute("value");
	console.log(hdrselfont)
	setComplexPref("extensions.printingtoolsng.headers.font_family", hdrselfont);
	
	var fontlistchild = document.getElementById("fontlist").getElementsByTagName("menuitem");
	var selfont = fontlistchild[document.getElementById("fontlist").selectedIndex].getAttribute("value");
	setComplexPref("extensions.printingtoolsng.messages.font_family", selfont);
	
	setComplexPref("extensions.printingtoolsng.headers.custom_name_value", document.getElementById("addNameBox").value);

	prefs.setBoolPref("extensions.printingtoolsng.headers.style", document.getElementById("headersStyle").checked);
	size = document.getElementById("hdrfontsize").selectedItem.id.replace("h", "");
	prefs.setIntPref("extensions.printingtoolsng.headers.size", size);
	
	prefs.setBoolPref("extensions.printingtoolsng.messages.style", document.getElementById("messageStyle").checked);
	size = document.getElementById("fontsize").selectedItem.id.replace("x", "");
	prefs.setIntPref("extensions.printingtoolsng.messages.size", size);
	

	let ubkc = document.getElementById("useHeadersBkColor").checked;
	prefs.setBoolPref("extensions.printingtoolsng.headers.use_background_color", ubkc);

	prefs.setCharPref("extensions.printingtoolsng.headers.background.color", document.getElementById("headersBkColor").value);


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
		// console.debug('closing from preview');
		try {
			opener.close();
			var wm = Cc["@mozilla.org/appshell/window-mediator;1"]
				.getService(Ci.nsIWindowMediator);
			var win;
			if (abook) {
				win = wm.getMostRecentWindow("mail:addressbook");
				win.AbPrintPreviewAddressBook();
			} else {
				win = wm.getMostRecentWindow("mail:3pane");
				win.PrintEnginePrintPreview();
			}
		} catch (e) {
			console.debug(e);
		}
	}

	prefs.setCharPref("extensions.printingtoolsng.debug.options", document.getElementById("debug-options").value);
	
}

function savePMDabprefs(fullpanel) {

	prefs.setBoolPref("extensions.printingtoolsng.addressbook.max_compact", document.getElementById("PMDabmaxcompact").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_size", document.getElementById("PMDabsmallfont").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.hide_header_card", document.getElementById("PMDabnohead").checked);
	prefs.setBoolPref("extensions.printingtoolsng.addressbook.print_just_addresses", document.getElementById("PMDabjustaddress").checked);
	prefs.setIntPref("extensions.printingtoolsng.addressbook.custom_font_size", document.getElementById("ABfontsize").selectedItem.label);

	var fontlistchild = document.getElementById("ABfontlist").getElementsByTagName("menuitem");
	var selfont = fontlistchild[document.getElementById("ABfontlist").selectedIndex].getAttribute("value");
	setComplexPref("extensions.printingtoolsng.addressbook.font_family", selfont);

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
		if (!isContact) {
			// console.debug('address.Preview');
			win.AbPrintPreviewAddressBook();
		}
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

function dumpList() {
	var listElement = gheaderList.list;
	var selectedID = Number(gheaderList.controller.getSelectedRowDataId());

	[...listElement.rows].forEach(element => {
		let v = element.firstChild.textContent;
		let i = element.getAttribute("data-id")
		// Services.console.logStringMessage(`${v} ${i}`);
	});
}

function move(offset) {
	var listElement = gheaderList.list;
	var selectedID = Number(gheaderList.controller.getSelectedRowDataId());
	// Services.console.logStringMessage(`move ${offset} ${selectedID}`);
	// Services.console.logStringMessage(listElement.outerHTML);
	dumpList();

	if (selectedID === 1 && offset === 1 || selectedID === listElement.rows.length && offset === -1) {
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

	// Services.console.logStringMessage(listElement.outerHTML);
	dumpList();

	// Services.console.logStringMessage(`swap ${swapElement.getAttribute("data-id")}`);
	if (offset === 1) {
		selectedElement.setAttribute("data-id", selectedID - 1);
		swapElement.setAttribute("data-id", selectedID);
		gheaderList.controller.selectRowByDataId(selectedID - 1);
	} else {
		selectedElement.setAttribute("data-id", selectedID + 1);
		swapElement.setAttribute("data-id", selectedID);

		gheaderList.controller.selectRowByDataId(selectedID + 1);
	}
	gheaderList.reIndex();
	// Services.console.logStringMessage(listElement.outerHTML);
	dumpList();
}

function toggleHeaderShow() {
	// Services.console.logStringMessage("toggle show");

	// Services.console.logStringMessage(gheaderList.list.outerHTML);
	dumpList();
	var selectedElement = gheaderList.controller.getSelectedRowElement();
	var idx = Number(selectedElement.getAttribute("data-id")) - 1;
	var s = selectedElement.getAttribute("data-show");
	// Services.console.logStringMessage(`${selectedElement.outerHTML}\n${idx} ${s}`);
	s = ((s === "true") ? "false" : "true");
	// s = !s;
	// Services.console.logStringMessage(`${selectedElement.outerHTML}\n${idx} ${s}`);
	var t = gheaderList.items[idx].values().headerToken;
	t = ((s === "true") ? t.replace('!', '') : '!' + t);
	// Services.console.logStringMessage(`after just ${s} ${t}`); 
	gheaderList.items[idx].values({ "show": s, "headerToken": t });

	// Services.console.logStringMessage(`${selectedElement.outerHTML}\n${idx} ${s} ${t}`);
	// Services.console.logStringMessage(gheaderList.list.outerHTML);
	dumpList();
	// if (s) {

	// } else {

	// }
}

function toggleUseBackgroundColor(el) {
	document.getElementById("headersBkColor").disabled = !el.checked;
}

function toggleCiteStyle(el) {
	document.getElementById("citeColor").disabled = !el.checked;
	document.getElementById("citeSize").disabled = !el.checked;
}


function toggleHeadersStyle(el) {
	document.getElementById("hdrfontlist").disabled = !el.checked;
	document.getElementById("hdrfontsize").disabled = !el.checked;
}

function toggleMessageStyle(el, notify) {
	document.getElementById("fontlist").disabled = !el.checked;
	document.getElementById("fontsize").disabled = !el.checked;
	//document.getElementById("radiostyle").disabled = !el.checked;
	var strBundleService = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
	var bundle = strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");
	if (document.getElementById("messageStyle").checked && notify) {
		// alert("The system option:\n  Allow messages to use other fonts\nhas been enabled");
		alert(bundle.GetStringFromName("allowFonts"));
		prefs.setIntPref("browser.display.use_document_fonts", 1);
	} else if (notify) {
		// alert("The system option:\n  Allow messages to use other fonts\nhas been disabled");
		alert(bundle.GetStringFromName("disallowFonts"));
		prefs.setIntPref("browser.display.use_document_fonts", 0);
	}
}

function toggleAtt() {
	document.getElementById("PMDattachIcon").disabled = !document.getElementById("PMDattach").checked;
	document.getElementById("addP7M").disabled = !document.getElementById("PMDattach").checked;
	document.getElementById("num_atts_line").disabled = !document.getElementById("PMDattach").checked;
}

function toggleDate() {
	document.getElementById("dateLongRG").disabled = !document.getElementById("PMDdate").checked;
}


document.addEventListener("dialogaccept", function (event) {
	savePMDprefs();
	
});

window.addEventListener("load", function (event) {
	initPMDpanel();
	document.getElementById("useCcBccAlways").focus;
	document.getElementById("useCcBccAlways").selected;
});


