/* globals
List,
ListController,
printerSettings,
*/

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { strftime } = ChromeUtils.import("chrome://printingtoolsng/content/strftime.js");
//var { utils} = ChromeUtils.import("chrome://printingtoolsng/content/utils.js", utils);

//var utils = {};
Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/utils.js");
console.log(utils)
utils.test();

utils.window = window;

var PMDstr = Cc["@mozilla.org/supports-string;1"]
	.createInstance(Ci.nsISupportsString);

var strBundleService = Services.strings;
var mainStrBundle = strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");

var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
var gheaderList;
var printerSettings;

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

async function initPMDpanel() {

	// cleidigh
	//console.debug('initialize panel');

	var win = Cc["@mozilla.org/appshell/window-mediator;1"]
		.getService(Ci.nsIWindowMediator)
		.getMostRecentWindow("mail:3pane");

	var PTNGVersion = win.printingtoolsng.extension.addonData.version;

	let title = document.getElementById("ptng-options").getAttribute("title");

	document.getElementById("ptng-options").setAttribute("title", `${title} - v${PTNGVersion}`);

	document.getElementById("ptng-options").setAttribute("lang", Services.locale.appLocaleAsBCP47);

	printerSettings = win.printerSettings;

	console.log(mainStrBundle.GetStringFromName("dateformatTB5"));

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

	// document.getElementById("PMDselection").checked = prefs.getBoolPref("extensions.printingtoolsng.print.just_selection");
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

  // PDF Output Options
  document.getElementById("enablePDFoutputDir").checked = prefs.getBoolPref("extensions.printingtoolsng.pdf.enable_pdf_output_dir");
  document.getElementById("PDFoutputDir").value = prefs.getStringPref("extensions.printingtoolsng.pdf.output_dir");
  document.getElementById("customDatePDF").value = prefs.getStringPref("extensions.printingtoolsng.pdf.filename.custom_date_format");
  document.getElementById("prefixText").value = prefs.getStringPref("extensions.printingtoolsng.pdf.filename.prefix");
  document.getElementById("suffixText").value = prefs.getStringPref("extensions.printingtoolsng.pdf.filename.suffix");
  document.getElementById("enableLatinize").checked = prefs.getBoolPref("extensions.printingtoolsng.pdf.filename.latinize");
  document.getElementById("enableEmojiAndSymbolFilter").checked = prefs.getBoolPref("extensions.printingtoolsng.pdf.filename.filter_emojis_and_symbols");
  document.getElementById("characterFilter").value = prefs.getStringPref("extensions.printingtoolsng.pdf.filename.filter_characters");
  document.getElementById("PDFcustomFilenameFormat").value = prefs.getStringPref("extensions.printingtoolsng.pdf.custom_filename_format");

	Services.console.logStringMessage("printingtools: call printer setup");

	document.getElementById("debug-options").value = prefs.getCharPref("extensions.printingtoolsng.debug.options");

	var outputPrinter =  await setPrinterList();
	printerSettings.getPrinterSettings(window, outputPrinter);
  addValidationListeners();

	document.getElementById("useCcBccAlways").focus;
}

async function pickPDFoutputDir() {
  let fpMode = Ci.nsIFilePicker.modeGetFolder;
					
					let fpTitle = this.mainStrBundle.GetStringFromName("select_pdf_dir");
					let fpDisplayDirectory = null;
					let resultObj = await utils.openFileDialog(fpMode, fpTitle, fpDisplayDirectory, Ci.nsIFilePicker.filterAll);
					if (resultObj.result == -1) {
						return;
					}
					let pdfOutputDir = resultObj.folder;
					
          document.getElementById("PDFoutputDir").value = pdfOutputDir;
  
}

async function setPrinterList() {
	// change for 91
	var printerList = Cc["@mozilla.org/gfx/printerlist;1"]
		.getService(Ci.nsIPrinterList);

	// Services.console.logStringMessage("printingtools: print_printer " + outputPrinter);
	var printers = await printerList.printers;
	var defaultPrinter = printerList.systemDefaultPrinterName;

	var outputPrinter = null;
	var type = prefs.getPrefType("print_printer");
	if (type) {
		outputPrinter = prefs.getCharPref("print_printer");
	} else {
		console.log("no tb printer")
		outputPrinter = defaultPrinter;
	}

	console.log(outputPrinter)
	var printerListMenu = document.getElementById("OutputPrinter");
	var selindex = 0;
	var popup = document.createXULElement("menupopup");

	
	// var printers = [];
	var i = 1;
	var menuitem0 = document.createXULElement("menuitem");
	menuitem0.setAttribute("value", "Mozilla Save to PDF");
	menuitem0.setAttribute("label", this.mainStrBundle.GetStringFromName("save_to_pdf"));
	popup.appendChild(menuitem0);

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

	if (outputPrinter === "Mozilla Save to PDF") {
		selindex = 0;
	}

	printerListMenu.appendChild(popup);
	printerListMenu.selectedIndex = selindex;
	// Services.console.logStringMessage("printingtools: printerName index: " + selindex);
	console.log("Selected printer : ", outputPrinter);
	return outputPrinter;
}

function printerChange() {
	prefs.setCharPref("print_printer", document.getElementById("OutputPrinter").value);
	prefs.setCharPref("print_printer", "");
	prefs.setCharPref("print_printer", document.getElementById("OutputPrinter").value);
	printerSettings.getPrinterSettings(window, document.getElementById("OutputPrinter").value);
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
	//prefs.setBoolPref("extensions.printingtoolsng.print.just_selection", document.getElementById("PMDselection").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.addfolder", document.getElementById("addFolder").checked);
	prefs.setBoolPref("extensions.printingtoolsng.headers.align", document.getElementById("alignHeaders").checked);
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
	prefs.setCharPref("extensions.printingtoolsng.debug.options", document.getElementById("debug-options").value);

    // PDF Output Options
    prefs.setBoolPref("extensions.printingtoolsng.pdf.enable_pdf_output_dir", document.getElementById("enablePDFoutputDir").checked);
    prefs.setStringPref("extensions.printingtoolsng.pdf.output_dir", document.getElementById("PDFoutputDir").value);
    prefs.setStringPref("extensions.printingtoolsng.pdf.filename.custom_date_format", document.getElementById("customDatePDF").value);
    prefs.setStringPref("extensions.printingtoolsng.pdf.filename.prefix", document.getElementById("prefixText").value);
    prefs.setStringPref("extensions.printingtoolsng.pdf.filename.suffix", document.getElementById("suffixText").value);
    prefs.setBoolPref("extensions.printingtoolsng.pdf.filename.latinize", document.getElementById("enableLatinize").checked);
    prefs.setBoolPref("extensions.printingtoolsng.pdf.filename.filter_emojis_and_symbols", document.getElementById("enableEmojiAndSymbolFilter").checked);
    prefs.setStringPref("extensions.printingtoolsng.pdf.filename.filter_characters", document.getElementById("characterFilter").value);
    prefs.setStringPref("extensions.printingtoolsng.pdf.custom_filename_format", document.getElementById("PDFcustomFilenameFormat").value);
  
	printerSettings.savePrintSettings(window);
	window.close();
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

function pageRangeToggle(pageRangeRG) {
	console.log("toggle ", pageRangeRG.selectedIndex)
	let cr = document.querySelector("#pages");
	if (pageRangeRG.selectedIndex == 0) {


		cr.setAttribute("disabled", "true");
		cr.value = "1";
		console.log(cr)
	} else {
		cr.removeAttribute("disabled");
	}
}

function addValidationListeners() {

	let cr = document.querySelector("#pages");
	cr.addEventListener("keypress", handlePageRangesKeypress);
	cr.addEventListener("input", pageRangesValidation);
	let nc = document.querySelector("#copies-count");
	nc.addEventListener("keypress", handleCopiesKeypress);
	nc.addEventListener("input", copiesValidation);

	let margin = document.querySelector("#margin-top");
	margin.addEventListener("keypress", handleMarginsKeypress);
	margin.addEventListener("input", handleMarginsValidation);
	margin = document.querySelector("#margin-bottom");
	margin.addEventListener("keypress", handleMarginsKeypress);
	margin.addEventListener("input", handleMarginsValidation);
	margin = document.querySelector("#margin-left");
	margin.addEventListener("keypress", handleMarginsKeypress);
	margin.addEventListener("input", handleMarginsValidation);
	margin = document.querySelector("#margin-right");
	margin.addEventListener("keypress", handleMarginsKeypress);
	margin.addEventListener("input", handleMarginsValidation);

}


function handleCopiesKeypress(e) {
	console.log(e)
	let char = String.fromCharCode(e.charCode);
	let acceptedChar = char.match(/^[0-9]$/);
	if (!acceptedChar && !char.match("\x00") && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
	}
	//copiesValidation();
}

function copiesValidation() {
	let nc = document.querySelector("#copies-count");
	let nce = document.querySelector("#copies-count-error");
	console.log("chk v", nc.validity.valueMissing)
	let v = nc.validity;
	console.log(v)
	if (nc.validity.valueMissing) {
		console.log("v m")
		//nc.setCustomValidity("Value Required");
		//nc.reportValidity();
		//pstr
		nce.textContent = mainStrBundle.GetStringFromName("err_copies_val_req");
		let l = nce.textContent.length * 0.50 + "em";
		nce.style.width = l
		nce.className = "error active";
		enableOKbutton(false);
	} else if (nc.validity.rangeUnderflow) {
		nce.textContent = mainStrBundle.GetStringFromName("err_copies_val_notzero");
		let l = nce.textContent.length * 0.50 + "em";
		nce.style.width = l
		nce.className = "error active";
		enableOKbutton(false);
	} else {
		nce.className = "error";
		enableOKbutton(true);
	}
}
function handlePageRangesKeypress(e) {
	console.log(e)
	let char = String.fromCharCode(e.charCode);
	let acceptedChar = char.match(/^[0-9,-]$/);
	if (!acceptedChar && !char.match("\x00") && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
		//let cr = document.querySelector("#pages");
		//cr.setCustomValidity("invalid");
	}
}

function pageRangesValidation(e) {
	let pr = document.querySelector("#pages");
	let pre = document.querySelector("#page-ranges-error");
	console.log("chk v", pr.validity.valueMissing)
	let v = pr.validity;
	console.log(v)
	if (pr.validity.valueMissing) {
		console.log("v m")
		//nc.setCustomValidity("Value Required");
		//nc.reportValidity();
		pre.textContent = mainStrBundle.GetStringFromName("err_pageranges_val_req");
		let l = pre.textContent.length * 0.50 + "em";
		pre.style.width = l
		pre.className = "error active";
		enableOKbutton(false);
	} else if (pageRangesStringValidation(pr.value)) {
		if (pageRangesStringValidation(pr.value) == 1) {
			pre.textContent = mainStrBundle.GetStringFromName("err_pageranges_val_notzero");
		} else {
			pre.textContent = mainStrBundle.GetStringFromName("err_pageranges_val_endgrbeg");
		}
		let l = pre.textContent.length * 0.50 + "em";
		pre.style.width = "100%"
		pre.className = "error active";
		enableOKbutton(false);
	} else {
		pre.className = "error";
		enableOKbutton(true);
	}
}

function handleMarginsKeypress(e) {
	console.log(e)
	let char = String.fromCharCode(e.charCode);
	let acceptedChar = char.match(/^[0-9,.]$/);
	if (!acceptedChar && !char.match("\x00") && !e.ctrlKey && !e.metaKey) {
		e.preventDefault();
	}
	//copiesValidation();
}

function handleMarginsValidation(e) {
	console.log(e)
	let margin = e.target;

	// console.log(margin.validity);
	if (margin.validity.valueMissing || margin.validity.badInput) {
		enableOKbutton(false);
	} else {
		enableOKbutton(true);
	}
}

function enableOKbutton(enable) {
	let okButton = document.getElementById("okbutton");
	if (enable) {

	}
	okButton.disabled = !enable;
}
function pageRangesStringValidation(pageRangesStr) {

	let ranges = pageRangesStr.split(",");

	for (let range of ranges) {
		let rangeParts = range.split("-");
		let startRange = parseInt(rangeParts[0], 10);
		let endRange = parseInt(
			rangeParts.length == 2 ? rangeParts[1] : rangeParts[0],
			10
		);

		console.log(startRange)
		console.log(endRange)

		if (startRange == 0 || endRange == 0) {
			console.log("zero")
			return 1;
		}
		// If the startRange was not specified, then we infer this
		// to be 1.
		if (isNaN(startRange) && rangeParts[0] == "") {
			startRange = 1;
		}
		// If the end range was not specified, then we infer this
		// to be the total number of pages.
		if (isNaN(endRange) && rangeParts[1] == "") {
			endRange = 1000;
		}

		if (endRange < startRange) {
			return 2;
		}


	}

	return 0;
}



document.addEventListener("dialogaccept", function (event) {
	savePMDprefs();

});

window.addEventListener("load", function (event) {
	initPMDpanel();
	document.getElementById("useCcBccAlways").focus;
	document.getElementById("useCcBccAlways").selected;
});


