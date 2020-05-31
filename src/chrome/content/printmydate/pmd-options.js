var PMDstr = Components.classes["@mozilla.org/supports-string;1"]
      .createInstance(Components.interfaces.nsISupportsString);
var strBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]
	.getService(Components.interfaces.nsIStringBundleService);
var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
var fullPanel;
var fromPreview;

function getComplexPref(pref) {
	if (prefs.getStringPref)
		return prefs.getStringPref(pref);
	else
		return prefs.getComplexValue(pref,Components.interfaces.nsISupportsString).data;
}

function setComplexPref(pref,value) {
	if (prefs.setStringPref)
		prefs.setStringPref(pref,value);
	else {
		PMDstr.data = value;
		prefs.setComplexValue(pref,Components.interfaces.nsISupportsString,PMDstr);
	}
}

function initPMDpanel()  {
	if (window.arguments && window.arguments[0])
		fromPreview = window.arguments[0];
	else
		fromPreview = false; 
	if (opener.location.href.indexOf("messenger.xul") > -1) {
		fullPanel = false;
		document.getElementById("abTab").setAttribute("collapsed", "true");
	}
	else { 
		fullPanel = true;
		initPMDabpanel();
	}

	var bundle = strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
	if (Array.isArray) {
		document.getElementById("dateLoc").collapsed = true;
		document.getElementById("dateSpacer").collapsed = true;
		document.getElementById("dateShortRadio").label +=  (" "+ bundle.GetStringFromName("dateformatTB5"));
	}
	
	if (prefs.getPrefType("extensions.printingtools.headers.addname") > 0) {
		if (prefs.getBoolPref("extensions.printingtools.headers.addname"))
			 prefs.setIntPref("extensions.printingtools.headers.add_name_type", 1);
		else
			 prefs.setIntPref("extensions.printingtools.headers.add_name_type", 0);
		prefs.deleteBranch("extensions.printingtools.headers.addname");
	}
	document.getElementById("addRdate").checked = prefs.getBoolPref("extensions.printingtools.add_received_date");
	document.getElementById("addNameRG").selectedIndex = prefs.getIntPref("extensions.printingtools.headers.add_name_type");
	document.getElementById("addNameBox").value = getComplexPref("extensions.printingtools.headers.custom_name_value");
	document.getElementById("PMDdate").checked = prefs.getBoolPref("extensions.printingtools.process.date");
	document.getElementById("PMDattach").checked = prefs.getBoolPref("extensions.printingtools.process.attachments");
	document.getElementById("PMDborders").checked = prefs.getBoolPref("extensions.printingtools.headers.setborders");
	document.getElementById("PMDhide").checked = prefs.getBoolPref("extensions.printingtools.headers.hide");
	document.getElementById("PMDextHide").checked = prefs.getBoolPref("extensions.printingtools.ext_headers.hide");
	document.getElementById("PMDhideImgs").checked = prefs.getBoolPref("extensions.printingtools.images.hide");
	document.getElementById("resizeImgs").checked = prefs.getBoolPref("extensions.printingtools.images.resize");
	document.getElementById("PMDtruncate").checked = prefs.getBoolPref("extensions.printingtools.headers.truncate");
	document.getElementById("PMDmaxchars").value = prefs.getIntPref("extensions.printingtools.headers.maxchars");
	document.getElementById("PMDprogress").checked = ! prefs.getBoolPref("print.show_print_progress");
	document.getElementById("PMDhideAtt").checked = prefs.getBoolPref("extensions.printingtools.hide.inline_attachments");
	document.getElementById("PMDselection").checked = prefs.getBoolPref("extensions.printingtools.print.just_selection");
	document.getElementById("PMDattachIcon").checked = prefs.getBoolPref("extensions.printingtools.process.attachments_with_icon");
	document.getElementById("showButtonPreview").checked = prefs.getBoolPref("extensions.printingtools.show_options_button");

	if (String.trim) 
		document.getElementById("addP7M").checked = prefs.getBoolPref("extensions.printingtools.process.add_p7m_vcf_attach");
	else
		document.getElementById("addP7M").setAttribute("collapsed", "true");
	document.getElementById("radiostyle").selectedIndex = prefs.getIntPref("extensions.printingtools.messages.style_apply");
	document.getElementById("messageStyle").checked= prefs.getBoolPref("extensions.printingtools.messages.style");
	document.getElementById("addFolder").checked = prefs.getBoolPref("extensions.printingtools.headers.addfolder");
	document.getElementById("PMDblack").checked = prefs.getBoolPref("extensions.printingtools.messages.black_text");
	document.getElementById("PMDtruncate").checked = prefs.getBoolPref("extensions.printingtools.headers.truncate");
	document.getElementById("alignHeaders").checked = prefs.getBoolPref("extensions.printingtools.headers.align");
	document.getElementById("dateLongRG").selectedIndex = prefs.getIntPref("extensions.printingtools.date.long_format_type");

	var max_pre_len = prefs.getIntPref("extensions.printingtools.pre_max_length");
	if (max_pre_len > 0) {
		document.getElementById("PREtruncate").checked = true;
		document.getElementById("PREmaxchars").value = max_pre_len;
	}

	if (prefs.getPrefType("print.always_print_silent") != 0 && prefs.getBoolPref("print.always_print_silent"))
		document.getElementById("PMDsilent").checked = true;
	else
		document.getElementById("PMDsilent").checked = false;
	
	var sID = "s"+prefs.getIntPref("extensions.printingtools.cite.size");
	document.getElementById("citeSize").selectedItem = document.getElementById(sID);
	var xID = "x"+prefs.getIntPref("extensions.printingtools.messages.size");
	document.getElementById("fontsize").selectedItem = document.getElementById(xID);
	
	document.getElementById("citeColor").color = prefs.getCharPref("extensions.printingtools.cite.color");
	document.getElementById("citeColor").value = prefs.getCharPref("extensions.printingtools.cite.color");
	document.getElementById("citeCheck").checked = prefs.getBoolPref("extensions.printingtools.cite.style");
	
	var fontlist = document.getElementById("fontlist");
	var fonten = Components.classes["@mozilla.org/gfx/fontenumerator;1"].createInstance(Components.interfaces.nsIFontEnumerator);	
	var allfonts = fonten.EnumerateAllFonts({});
	var selindex = 0;
	var popup = document.createXULElement("menupopup");
	
	for (var j=0;j<allfonts.length;j++) {
		var menuitem = document.createXULElement("menuitem");
		menuitem.setAttribute("value", allfonts[j]);
		menuitem.setAttribute("label", allfonts[j]);
		if (prefs.getPrefType("extensions.printingtools.messages.font_family") > 0 && 
			allfonts[j] == getComplexPref("extensions.printingtools.messages.font_family")) {
			selindex = j;
		}
		popup.appendChild(menuitem);
	}
	fontlist.appendChild(popup);
	fontlist.selectedIndex=selindex;
	
	toggleCiteStyle(document.getElementById("citeCheck"));
	toggleMessageStyle(document.getElementById("messageStyle"));
	toggleAtt();

// cleidigh fix
	// var list = document.getElementById("headersList");
	// var order = prefs.getCharPref("extensions.printingtools.headers.order");
	// var u = order.split(",");
	// if (u.length < 7)
	// 	u[6] = "%r3";

	// for (var i=0;i<u.length; i++) {
	// 	var lab =  getHeaderLabel(u[i]);
	// 	list.appendItem(lab, u[i]);
	// }	

}

function getHeaderLabel(string) {
	var bundle = strBundleService.createBundle("chrome://messenger/locale/mime.properties");
	var bundle2 = strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
	switch(string) {
		case "%a" :
			return bundle2.GetStringFromName("attachments");
		case "%s" :
			return bundle.GetStringFromID(1000);
		case "%f" :
			return bundle.GetStringFromID(1009);
		case "%r1" :
			return bundle.GetStringFromID(1012);
		case "%r2" :
			return bundle.GetStringFromID(1013);
		case "%r3" :
			return bundle.GetStringFromID(1023);
		case "%d" :
			return bundle.GetStringFromID(1007);
		default:
			return null;
	}
}
    
function savePMDprefs()  {
	if (fullPanel)
		savePMDabprefs(true);

	if (document.getElementById("PREtruncate").checked)
		var max_pre_len = document.getElementById("PREmaxchars").value;
	else	
		var max_pre_len = -1;
	prefs.setIntPref("extensions.printingtools.pre_max_length",  max_pre_len);
	prefs.setIntPref("extensions.printingtools.headers.add_name_type", document.getElementById("addNameRG").selectedIndex);
	prefs.setBoolPref("extensions.printingtools.process.date", document.getElementById("PMDdate").checked);
 	prefs.setBoolPref("extensions.printingtools.process.attachments", document.getElementById("PMDattach").checked);
	prefs.setBoolPref("extensions.printingtools.headers.setborders", document.getElementById("PMDborders").checked);
	prefs.setBoolPref("extensions.printingtools.headers.hide", document.getElementById("PMDhide").checked);
	prefs.setBoolPref("extensions.printingtools.ext_headers.hide", document.getElementById("PMDextHide").checked);
	prefs.setBoolPref("extensions.printingtools.images.hide", document.getElementById("PMDhideImgs").checked);
	prefs.setBoolPref("extensions.printingtools.images.resize", document.getElementById("resizeImgs").checked);
	prefs.setBoolPref("extensions.printingtools.headers.truncate", document.getElementById("PMDtruncate").checked);
	prefs.setIntPref("extensions.printingtools.headers.maxchars", document.getElementById("PMDmaxchars").value);
	prefs.setBoolPref("print.always_print_silent", document.getElementById("PMDsilent").checked);
	prefs.setBoolPref("print.show_print_progress", ! document.getElementById("PMDprogress").checked);
	prefs.setBoolPref("extensions.printingtools.headers.truncate", document.getElementById("PMDtruncate").checked);
	prefs.setBoolPref("extensions.printingtools.hide.inline_attachments", document.getElementById("PMDhideAtt").checked);
	prefs.setBoolPref("extensions.printingtools.print.just_selection", document.getElementById("PMDselection").checked);
	prefs.setBoolPref("extensions.printingtools.headers.addfolder", document.getElementById("addFolder").checked);
	prefs.setBoolPref("extensions.printingtools.messages.black_text", document.getElementById("PMDblack").checked);
	prefs.setBoolPref("extensions.printingtools.headers.align", document.getElementById("alignHeaders").checked);
	prefs.setBoolPref("extensions.printingtools.show_options_button", document.getElementById("showButtonPreview").checked);
	prefs.setBoolPref("extensions.printingtools.add_received_date", document.getElementById("addRdate").checked);

	prefs.setIntPref("extensions.printingtools.date.long_format_type", document.getElementById("dateLongRG").selectedIndex);

	var size = document.getElementById("citeSize").selectedItem.id.replace("s", "");
	prefs.setIntPref("extensions.printingtools.cite.size", size);	
	prefs.setCharPref("extensions.printingtools.cite.color", document.getElementById("citeColor").color);
	prefs.setBoolPref("extensions.printingtools.cite.style", document.getElementById("citeCheck").checked);
	prefs.setBoolPref("extensions.printingtools.process.attachments_with_icon", document.getElementById("PMDattachIcon").checked);
	
	var fontlistchild = document.getElementById("fontlist").getElementsByTagName("menuitem");
	var selfont = fontlistchild[document.getElementById("fontlist").selectedIndex].getAttribute("value");
	setComplexPref("extensions.printingtools.messages.font_family",selfont);	
	setComplexPref("extensions.printingtools.headers.custom_name_value",document.getElementById("addNameBox").value);
	
	prefs.setBoolPref("extensions.printingtools.messages.style", document.getElementById("messageStyle").checked);
	size = document.getElementById("fontsize").selectedItem.id.replace("x", "");
	prefs.setIntPref("extensions.printingtools.messages.size", size);
	prefs.setIntPref("extensions.printingtools.messages.style_apply", document.getElementById("radiostyle").selectedIndex);
	
	var list = document.getElementById("headersList");
	var val = "";
	for (var i=0;i<6;i++) {
		var item = list.getItemAtIndex(i);
		val = val + item.value + ",";
	}
	val = val + list.getItemAtIndex(6).value;
	prefs.setCharPref("extensions.printingtools.headers.order", val);
	prefs.setBoolPref("extensions.printingtools.process.add_p7m_vcf_attach", document.getElementById("addP7M").checked);
	if (fromPreview) {
		try {
			opener.close();
			var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
        	           .getService(Components.interfaces.nsIWindowMediator);
			var win = wm.getMostRecentWindow("mail:3pane");
			if (win)
				win.PrintEnginePrintPreview();
		}
		catch(e) {}
	}
}

function move(offset) {
	var list = document.getElementById("headersList");
	var pos = list.selectedIndex;
	if ( (pos == 0 && offset > 0) || ( pos == (list.itemCount -1) && offset < 0) )
		return;
	var label = list.currentItem.label;
	var value = list.currentItem.value;
	var newpos = pos - offset;
	var item = list.removeItemAt(list.currentIndex);
	var newitem = list.insertItemAt(newpos, label, value);
	list.selectedIndex = newpos;
}

function toggleCiteStyle(el) {
	document.getElementById("citeColor").disabled = ! el.checked;
	document.getElementById("citeSize").disabled = ! el.checked;
}
	
function toggleMessageStyle(el) {
	document.getElementById("fontlist").disabled = ! el.checked;
	document.getElementById("fontsize").disabled = ! el.checked;
	document.getElementById("radiostyle").disabled = ! el.checked;
}

function toggleAtt() {
	document.getElementById("PMDattachIcon").disabled = ! document.getElementById("PMDattach").checked;
	document.getElementById("addP7M").disabled = ! document.getElementById("PMDattach").checked;
}

function toggleDate() {
	document.getElementById("dateLongRG").disabled = ! document.getElementById("PMDdate").checked;
}


document.addEventListener("dialogaccept", function (event) {
    savePMDprefs();
});

window.addEventListener("load", function (event) {
    initPMDpanel();
});


