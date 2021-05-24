var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

function ReplaceWithSelection() {
	// disables the native function in TB 3.1, that prints
	// selection without headers
	return true;
}

var printingtools = {

	current: null,
	num: null,
	prefs: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
	maxChars: null,

	strBundleService: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),

	loadContentListener: function () {
		window.removeEventListener("DOMContentLoaded", printingtools.loadContentListener, false);
		printingtools.current = 0;
		var contentEl = document.getElementById("content");
		contentEl.addEventListener("load", printingtools.correctLayout, true);
		if (window.arguments && window.arguments[1])
			printingtools.num = window.arguments[1].length;
		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.show_options_button")) {
			var bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");
			var box = document.createXULElement("hbox");
			var button = document.createXULElement("button");
			button.setAttribute("oncommand", "printingtools.openDialog(true)");
			button.setAttribute("label", bundle.GetStringFromName("options"));
			button.setAttribute("height", "28px");
			button.setAttribute("style", "margin: 6px;");
			box.appendChild(button);
			contentEl.parentNode.insertBefore(box, contentEl.nextSibling);
		}

		var PSSVC2 = Cc["@mozilla.org/gfx/printerenumerator;1"]
			.getService(Ci.nsIPrinterEnumerator);

		// Services.console.logStringMessage("printingtools: printerD: " + PSSVC2.defaultPrinterName);
		var pe = PSSVC2.printerNameList;
		var printers = [];

		while (pe.hasMore()) {
			let printerName = pe.getNext();
			// Services.console.logStringMessage("printingtools: printerName: " + printerName);
			printers.push(printerName);
		}

		// var PSSVC = Cc["@mozilla.org/gfx/printsettings-service;1"]
		// 	.getService(Ci.nsIPrintSettingsService);
	},

	getMail3Pane: function () {
		var w = Cc["@mozilla.org/appshell/window-mediator;1"]
			.getService(Ci.nsIWindowMediator)
			.getMostRecentWindow("mail:3pane");
		return w;
	},

	getComplexPref: function (pref) {
		if (printingtools.prefs.getStringPref)
			return printingtools.prefs.getStringPref(pref);
		else
			return printingtools.prefs.getComplexValue(pref, Ci.nsISupportsString).data;
	},

	openDialog: function (fromPreview) {
		openDialog("chrome://printingtoolsng/content/ptng-options.xhtml", "", "chrome,centerscreen", fromPreview, printingtools.isAB);

	},

	getIndexForHeader: function (string) {
		var order = printingtools.prefs.getCharPref("extensions.printingtoolsng.headers.order");
		var hdrs = order.split(",");
		var index = -1;
		for (var j = 0; j < hdrs.length; j++) {
			if (hdrs[j] == string) {
				index = j;
				break;
			} else if (hdrs[j] == '!' + string) {
				index = j | 0x100;
			}
		}
		return index;
	},

	sortHeaders: function () {
		// Services.console.logStringMessage("printingtools: sortheaders");
		// Services.console.logStringMessage("printingtools: sortheader order " + printingtools.prefs.getCharPref("extensions.printingtoolsng.headers.order"));

		var table1 = printingtools.getTable(0);
		var trs = table1.getElementsByTagName("TR");
		var arr = new Array;
		var index;

		var bundle;
		if (Services.locale.appLocaleAsBCP47 === "ja") {
			bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/headers-ja.properties");
		} else {
			bundle = printingtools.strBundleService.createBundle("chrome://messenger/locale/mime.properties");
		}
		var subject = bundle.GetStringFromID(1000).replace(/\s*$/, "");
		var from = bundle.GetStringFromID(1009).replace(/\s*$/, "");
		var to = bundle.GetStringFromID(1012).replace(/\s*$/, "");
		var cc = bundle.GetStringFromID(1013).replace(/\s*$/, "");
		var date = bundle.GetStringFromID(1007).replace(/\s*$/, "");
		var bcc = bundle.GetStringFromID(1023).replace(/\s*$/, "");
		var attachments = bundle.GetStringFromID(1028).replace(/\s*$/, "");
		var subjectPresent = false;
		var attPresent = false;

		for (var i = 0; i < trs.length; i++) {
			if (Services.locale.appLocaleAsBCP47 === "ja") {
				var div = trs[i].firstChild.firstChild;
				var divHTML = div.innerHTML.replace("Subject:", subject + ':');
				divHTML = divHTML.replace("Date:", date + ':');
				divHTML = divHTML.replace("To:", to + ':');
				divHTML = divHTML.replace("From:", from + ':');
				divHTML = divHTML.replace("Attachments:", attachments + ':');
				div.innerHTML = divHTML;
				// var divHTML = div.innerHTML.replace(":", );
			}

			if (trs[i].id == "attTR") {
				// Services.console.logStringMessage(trs[i].firstChild.outerHTML);
				// Services.console.logStringMessage(trs[i].firstChild);
				index = printingtools.getIndexForHeader("%a");
				if (index & 0x100) {
					arr[index &= ~0x100] = trs[i];
					arr[index &= ~0x100].style.display = "none";
				} else {
					div.classList.add("attHdr");
					attPresent = true;
					arr[index] = trs[i];
				}
				// Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
				// Services.console.logStringMessage(`header entry: ${trs[i].outerHTML}`);
				continue;
			}
			var div = trs[i].firstChild.firstChild;
			var divHTML = div.innerHTML.replace(/\&nbsp;/g, " ");
			var regExp = new RegExp(subject + "\\s*:");
			if (divHTML.match(regExp)) {
				index = printingtools.getIndexForHeader("%s");
				subjectPresent = true;

				if (index & 0x100) {
					arr[index &= ~0x100] = trs[i];
					arr[index &= ~0x100].style.display = "none";
				} else {
					arr[index &= ~0x100] = trs[i];
					let s = arr[index].querySelectorAll('td')[0];
					if (s.lastChild && s.lastChild.nodeName === "#text") {
						let subjValue = s.lastChild.nodeValue;
						s.lastChild.remove();
						let sd = printingtools.doc.createElement("DIV");

						sd.textContent = subjValue;
						if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate")) {
							sd.style.overflow = "hidden";
							sd.style.whiteSpace = "nowrap";
						} else {
							sd.style.overflow = "hidden";
							sd.style.overflowWrap = "break-word";
							sd.style.wordWrap = "break-word";
						}
						s.appendChild(sd);
						div.classList.add("subjectHdr");
					}

				}
				// Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
				// Services.console.logStringMessage(`header entry: ${trs[i].outerHTML}`);
				continue;
			}
			regExp = new RegExp(from + "\\s*:");
			if (divHTML.match(regExp)) {
				index = printingtools.getIndexForHeader("%f");
				if (index & 0x100) {
					arr[index &= ~0x100] = trs[i];
					arr[index &= ~0x100].style.display = "none";
				} else {
					arr[index] = trs[i];
				}
				// Services.console.logStringMessage(`header entry: ${trs[i].outerHTML}`);
				continue;
			}
			regExp = new RegExp(date + "\\s*:");
			if (divHTML.match(regExp)) {
				index = printingtools.getIndexForHeader("%d");
				if (index & 0x100) {
					arr[index &= ~0x100] = trs[i];
					arr[index &= ~0x100].style.display = "none";
				} else {
					arr[index] = trs[i];
					printingtools.dateTRpos = index;
				}
				// Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
				// Services.console.logStringMessage(`header entry: ${trs[i].outerHTML} index ${printingtools.dateTRpos}`);
			}
		}
		var table2 = printingtools.getTable(1);
		if (table2) {
			// Services.console.logStringMessage('table 2 ');
			// Services.console.logStringMessage(table2.outerHTML);

			// var attPresent = false;
			var ccPresent = false;
			var bccPresent = false;

			trs = table2.getElementsByTagName("TR");
			for (var i = 0; i < trs.length; i++) {
				var div = trs[i].firstChild.firstChild;
				var divHTML = div.innerHTML.replace(/\&nbsp;/g, " ");
				if (Services.locale.appLocaleAsBCP47 === "ja") {
					var div = trs[i].firstChild.firstChild;
					divHTML = divHTML.replace("To:", to + ':');
					divHTML = divHTML.replace("BCC:", bcc + ':');
					divHTML = divHTML.replace("CC:", cc + ':');

					div.innerHTML = divHTML;
					// var divHTML = div.innerHTML.replace(":", );
					// Services.console.logStringMessage(`header entry: ${i} ${trs[i].outerHTML}`);
				} else if (Services.locale.appLocaleAsBCP47.split('-')[0] === "de") {
					if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always")) {
						var div = trs[i].firstChild.firstChild;
						divHTML = divHTML.replace("Blindkopie (BCC):", "Bcc:");
						divHTML = divHTML.replace("Kopie (CC):", "Cc:");
						div.innerHTML = divHTML;
					}
				} else if (Services.locale.appLocaleAsBCP47.split('-')[0] === "en") {
					if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always")) {
						var div = trs[i].firstChild.firstChild;
						divHTML = divHTML.replace("BCC:", "Bcc:");
						divHTML = divHTML.replace("CC:", "Cc:");
						div.innerHTML = divHTML;
					}
				}

				// Services.console.logStringMessage(divHTML.outerHTML);
				regExp = new RegExp(to + "\\s*:");
				if (divHTML.match(regExp)) {
					index = printingtools.getIndexForHeader("%r1");
					// attPresent = true;
					// Services.console.logStringMessage('to');
					if (index & 0x100) {
						arr[index &= ~0x100] = trs[i];
						arr[index &= ~0x100].style.display = "none";
					} else {
						arr[index] = trs[i];
					}
					// Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
					// Services.console.logStringMessage(`header entry: ${trs[i].outerHTML}`);
					continue;
				}
				regExp = new RegExp(bcc + "\\s*:");
				index = printingtools.getIndexForHeader("%r3");
				if (divHTML.indexOf(bcc) == 0) {
					// Services.console.logStringMessage('bcc');
					bccPresent = true;

					if (index & 0x100) {
						arr[index &= ~0x100] = trs[i];
						arr[index &= ~0x100].style.display = "none";
					} else {
						trs[i].firstChild.classList.add("bccHdr");
						arr[index] = trs[i];
					}
					// Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
					continue;
				}

				regExp = new RegExp(cc + "\\s*:");
				index = printingtools.getIndexForHeader("%r2");
				if (divHTML.indexOf(cc) == 0) {
					// Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
					ccPresent = true;

					if (index & 0x100) {
						arr[index &= ~0x100] = trs[i];
						arr[index &= ~0x100].style.display = "none";
					} else {
						arr[index] = trs[i];
					}
					// Services.console.logStringMessage(`header entry: ${trs[i].outerHTML}`);
					continue;
				}
			}
			// Services.console.logStringMessage(table1.outerHTML);

		}

		index = printingtools.getIndexForHeader("%s");
		let subjectIndex = index &= ~0x100;

		index = printingtools.getIndexForHeader("%a");
		let attIndex = index &= ~0x100;

		index = printingtools.getIndexForHeader("%r2");
		let ccIndex = index &= ~0x100;
		index = printingtools.getIndexForHeader("%r3");
		let bccIndex = index &= ~0x100;

		// Services.console.logStringMessage(`${table1.outerHTML} ${printingtools.dateTRpos}`);

		let tempPos = printingtools.dateTRpos;
		if (!ccPresent && ccIndex < printingtools.dateTRpos) {
			// printingtools.dateTRpos--;
			tempPos--;
		}

		if (!bccPresent && bccIndex < printingtools.dateTRpos) {
			// printingtools.dateTRpos--;
			tempPos--;
		}

		if (attPresent && attIndex < printingtools.dateTRpos) {
			// printingtools.dateTRpos--;
			tempPos++;
		}

		if (subjectPresent && subjectIndex < printingtools.dateTRpos) {
			// printingtools.dateTRpos--;
			tempPos--;
		}

		printingtools.dateTRpos = tempPos;

		var tbody = table1.firstChild;
		for (var i = 0; i < arr.length; i++) {
			if (arr[i])
				tbody.appendChild(arr[i]);
			// else
			//	printingtools.dateTRpos = printingtools.dateTRpos - 1;
		}

		// Services.console.logStringMessage("after sort");
		// Services.console.logStringMessage(`${table1.outerHTML} ${printingtools.dateTRpos}`);
	},

	correctABprint: function (gennames) {
		// console.debug('correct address book');
		var gnLen = printingtools.doc.getElementsByTagName("GeneratedName").length;
		var dirNode = printingtools.doc.getElementsByTagName("directory")[0];
		var multipleCards = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.print_multiple_cards");
		var sepr;

		// if gnLen is equal to 1, we're printing a single contact		
		if (gnLen == 1 && multipleCards) {
			try {
				// Get the selected cards from addressbook window
				var abWin = Cc["@mozilla.org/appshell/window-mediator;1"].
					getService(Ci.nsIWindowMediator).
					getMostRecentWindow("mail:addressbook");
				var start = new Object();
				var end = new Object();
				var card;
				var treeSelection = abWin.gAbView.selection;
				var numRanges = treeSelection.getRangeCount();
				var parser = Cc["@mozilla.org/xmlextras/domparser;1"]
					.createInstance(Ci.nsIDOMParser);
				var firstCard = true;

				for (var t = 0; t < numRanges; t++) {
					treeSelection.getRangeAt(t, start, end);
					for (var v = start.value; v <= end.value; v++) {
						if (firstCard) {
							// The first card is already present in print window
							firstCard = false;
							continue;
						}
						card = abWin.gAbView.getCardFromRow(v);
						if (!card.isMailList) {
							// Add the xml translation of card to the root node ("directory")
							sepr = printingtools.doc.createElement("separator");
							dirNode.appendChild(sepr);
							var xmlParts = card.translateTo("xml").split("<table>");
							// It's necessary to add a root node, otherwise parser will fail
							var temp = "<root>" + xmlParts[0] + "</root>";
							var gn = parser.parseFromString(temp, "text/xml");
							dirNode.appendChild(gn.firstChild);
							temp = "<root><table>" + xmlParts[1] + "</root>";
							var table = parser.parseFromString(temp, "text/xml");
							dirNode.appendChild(table.firstChild);
						}
					}
				}
				sepr = printingtools.doc.createElement("separator");
				dirNode.appendChild(sepr);
			}
			catch (e) { }
		}


		var rule;
		var hideHeaderCard = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.hide_header_card");
		var compactFormat = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.print_just_addresses");
		var smallFont = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_size");
		var maxCompact = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.max_compact");
		var fontFamily = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.use_custom_font_family");
		var cutNotes = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.cut_notes");
		var addABname = printingtools.prefs.getBoolPref("extensions.printingtoolsng.addressbook.add_ab_name");

		if (addABname) {
			sepr = printingtools.doc.createElement("separator");
			dirNode.insertBefore(sepr, dirNode.firstChild);
			var sec = printingtools.doc.createElement("section");
			var GN = printingtools.doc.createElement("GeneratedName");
			var now = new Date();
			var selDir = opener.GetSelectedDirectory();
			var abDir = opener.GetDirectoryFromURI(selDir);
			var intro = printingtools.doc.createElement("intro");
			var abNameNode = printingtools.doc.createTextNode(abDir.dirName + " - " + now.toLocaleString());
			GN.appendChild(abNameNode);
			sec.appendChild(GN);
			intro.appendChild(sec);
			dirNode.insertBefore(intro, dirNode.firstChild);
		}

		if (!String.trim && hideHeaderCard) {
			var ABbundle = printingtools.strBundleService.createBundle("chrome://messenger/locale/addressbook/addressBook.properties");
			// The heading card is taken from addressBook.properties
			var headingCard = ABbundle.GetStringFromName("headingCardFor");
			for (i = 0; i < gennames.length; i++) {
				gennames[i].firstChild.nodeValue = gennames[i].firstChild.nodeValue.replace(headingCard, "");
				if (maxCompact)
					// Maybe this is superflous
					gennames[i].firstChild.nodeValue = gennames[i].firstChild.nodeValue.replace("\n", "");
			}
		}

		var tables = printingtools.doc.getElementsByTagName("table");
		for (j = 0; j < tables.length; j++) {
			var isMCFABinstalled = (printingtools.prefs.getPrefType("morecols.custom1.label") > 0);
			if (isMCFABinstalled) {
				for (var k = 1; k < 5; k++) {
					var custom = tables[j].getElementsByTagName("Custom" + k.toString())[0];
					if (custom) {
						var newLabel = printingtools.prefs.getCharPref("morecols.custom" + k.toString() + ".label");
						if (newLabel != "")
							custom.previousSibling.firstChild.nodeValue = newLabel + ": ";
					}
				}
			}

			if (cutNotes) {
				var notes = tables[j].getElementsByTagName("Notes")[0]
				if (notes)
					notes.firstChild.nodeValue = notes.firstChild.nodeValue.substring(0, 100) + " [...]";
			}

			if (maxCompact || compactFormat) {
				// The first row contains name & addresses, the second one the other data
				var trs = tables[j].childNodes;
				if (!compactFormat) {
					// Moving all the card properties in one single TR tag, the layout is much more compact
					var chs = trs[1].childNodes;
					trs[0].appendChild(chs[1]);
					trs[0].appendChild(chs[0]);
				}
				if (maxCompact) {
					// To compact more, the useless property "Displayname" is deleted
					var lrow = tables[j].getElementsByTagName("labelrow")[0];
					try { trs[1].appendChild(lrow); }
					catch (e) { }

					// Remove empty sections
					var secs = tables[j].getElementsByTagName("section");
					for (o = secs.length - 1; o > -1; o--) {
						if (!secs[o].hasChildNodes())
							secs[o].parentNode.removeChild(secs[o]);
					}
				}
				// Delete the second TR tag
				tables[j].removeChild(trs[1]);
			}
		}

		if (maxCompact) {
			// To compact more the layout, the margin is made smaller (usually is 20px)
			rule = "GeneratedName {margin: 5px !important;}"
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
		if (smallFont) {
			var fontsize = printingtools.prefs.getIntPref("extensions.printingtoolsng.addressbook.custom_font_size");
			rule = "* {font-size: " + fontsize + "px !important;}";
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
			fontsize = fontsize + 2;
			rule = "intro * {display:block !important; padding:15px !important; font-size:" + fontsize + "px !important;}"
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
		else {
			rule = "intro * {display:block !important; padding:15px !important; font-size:16px !important;}"
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
		if (fontFamily) {
			var fontfamily = printingtools.prefs.getCharPref("extensions.printingtoolsng.addressbook.font_family");
			rule = "* {font-family: " + fontfamily + " !important;}";
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
	},

	getHdr: function () {
		var uris = window.arguments[1];
		var m = Cc["@mozilla.org/messenger;1"]
			.createInstance(Ci.nsIMessenger);
		if (uris && uris[printingtools.current]) {
			if (uris[printingtools.current].indexOf("file") == 0) {
				// If we're printing a eml file, there is no nsIMsgHdr object, so we create an object just with properties
				// used by the extension ("folder" and "dateInSeconds"), reading directly the file (needing just 1000 bytes)
				var dummy = {};
				dummy.folder = null;
				var scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"]
					.getService(Ci.nsIScriptableInputStream);
				var ioService = Cc["@mozilla.org/network/io-service;1"]
					.getService(Ci.nsIIOService);
				var channel = ioService.newChannel(uris[printingtools.current], null, null);
				var input = channel.open();
				scriptableStream.init(input);
				var str_message = scriptableStream.read(3000);
				scriptableStream.close();
				input.close();
				str_message = str_message.toLowerCase();
				var dateOrig = str_message.split("\ndate:")[1].split("\n")[0];
				dateOrig = dateOrig.replace(/ +$/, "");
				dateOrig = dateOrig.replace(/^ +/, "");
				var secs = Date.parse(dateOrig) / 1000;
				dummy.dateInSeconds = secs;
				printingtools.hdr = dummy;
			}
			else {
				printingtools.hdr = m.msgHdrFromURI(uris[printingtools.current]);
			}
		}
	},

	correctLayout: function () {
		// console.debug('correctly layout');
		// Services.console.logStringMessage("CorrectLayout");
		printingtools.doc = window.content.document;
		// Services.console.logStringMessage(printingtools.doc.documentElement.outerHTML);
		// console.debug(printingtools.doc);
		var gennames = printingtools.doc.getElementsByTagName("GeneratedName");
		printingtools.maxChars = printingtools.prefs.getIntPref("extensions.printingtoolsng.headers.maxchars");
		// If there is some "GeneratedName" tag, so we're printing from addressbook
		if (gennames.length > 0) {
			printingtools.isAB = true;
			// console.debug('is address book');
			if (gennames.length == 1)
				printingtools.isContact = true;
			// Services.console.logStringMessage("Correct  AB Layout");
			printingtools.correctABprint(gennames);
			return;
		}

		// console.debug('printing e-mail');

		var tablesNum = printingtools.doc.getElementsByTagName("Table").length;
		// If there is no "Table" tag, so we can't do nothing... It can happen, because the printEngine window
		// is loaded twice, but the first time the content is not loaded

		if (printingtools.prefs.getBoolPref("mail.inline_attachments") &&
			printingtools.prefs.getBoolPref("extensions.printingtoolsng.hide.inline_attachments"))
			printingtools.toggleInlinePref();

		if (tablesNum == 0)
			return;

		var max_pre_len = printingtools.prefs.getIntPref("extensions.printingtoolsng.pre_max_length");
		if (max_pre_len > 0) {
			var preTags = printingtools.doc.getElementsByTagName("P");
			for (var j = 0; j < preTags.length; j++) {
				// #23 #53 fix translation
				preTags[j].setAttribute("style", `max-width: ${max_pre_len}ch;`);
				// preTags[j].setAttribute("style", `width: ${max_pre_len}ch;`);
			}
		}

		printingtools.getHdr(); // save hdr
		printingtools.current = printingtools.current + 1;

		var table1 = printingtools.getTable(0);
		var table2 = printingtools.getTable(1);
		var table3 = printingtools.getTable(2);

		var hpref = printingtools.prefs.getIntPref("mail.show_headers");
		var noheaders = printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.hide");
		var noExtHeaders = printingtools.prefs.getBoolPref("extensions.printingtoolsng.ext_headers.hide");

		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.messages.black_text"))
			printingtools.doc.body.removeAttribute("text");

		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.messages.style")) {
			var mSize = printingtools.prefs.getIntPref("extensions.printingtoolsng.messages.size");
			var mFamily = printingtools.getComplexPref("extensions.printingtoolsng.messages.font_family");
			if (printingtools.prefs.getIntPref("extensions.printingtoolsng.messages.style_apply") == 0) {
				rule = '* {font-size: +' + mSize + 'px !important; font-family: ' + mFamily + ' !important;}';
				printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
			}
			else {
				if (table1) {
					// table1.style.width = "75%";
					table1.style.fontFamily = mFamily;
					table1.style.fontSize = mSize;
				}
				if (table2) {
					table2.style.fontFamily = mFamily;
					table2.style.fontSize = mSize;
				}
				if (!noExtHeaders && hpref == 2 && table3) {
					table3.style.fontFamily = mFamily;
					table3.style.fontSize = mSize;
				}
			}
		}

		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.cite.style")) {
			var cSize = printingtools.prefs.getIntPref("extensions.printingtoolsng.cite.size");
			var cColor = printingtools.prefs.getCharPref("extensions.printingtoolsng.cite.color");
			rule = 'blockquote[type="cite"]{font-size: ' + cSize + 'px !important; color:' + cColor + ' !important;}';
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
			rule = 'blockquote[type="cite"] * {font-size: ' + cSize + 'px !important; color:' + cColor + '!important;}';
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}

		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.process.date"))
			printingtools.correctDate();

		if (noheaders)
			printingtools.hideHeaders(hpref);
		else if (noExtHeaders && table3 && hpref == 2)
			table3.setAttribute("style", "display:none !important");

		var borders = printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.setborders");
		if (!noheaders)
			printingtools.addName(borders);


		try {
			// var sel = opener.content.getSelection();
			// Services.console.logStringMessage("window: " + printingtools.getMail3Pane().document.URL);
			var sel = printingtools.getMail3Pane().content.getSelection();
			// Services.console.logStringMessage("valid selection");
			// Services.console.logStringMessage("sel " + sel);
			var range2 = sel.getRangeAt(0);
			var contents2 = range2.cloneContents();
			// Services.console.logStringMessage(contents2.textContent);

		} catch (error) {
			sel = "";
			// Services.console.logStringMessage("no selection");
		}
		if (sel && sel != "" && printingtools.prefs.getBoolPref("extensions.printingtoolsng.print.just_selection")) {
			// Services.console.logStringMessage("process selection");
			var range = sel.getRangeAt(0);
			var contents = range.cloneContents();
			// Services.console.logStringMessage(contents);
			printingtools.printSelection(contents);
			// Services.console.logStringMessage("After selection");
			// Services.console.logStringMessage(printingtools.doc.documentElement.outerHTML);

		}
		else {
			if (printingtools.prefs.getBoolPref("mail.inline_attachments"))
				printingtools.attCheck();
			var hideImg = printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.hide");
			if (hideImg || printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.resize"))
				printingtools.setIMGstyle(hideImg);
		}

		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.process.attachments")) {
			printingtools.rewriteAttList();
		} else
			printingtools.sortHeaders();
		if (!noheaders && printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate"))
			printingtools.truncateHeaders(printingtools.maxChars);

		// Services.console.logStringMessage("After truncate");
		// Services.console.logStringMessage(printingtools.doc.documentElement.outerHTML);

		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.align")) {
			if (table2) {
				var trs = table2.getElementsByTagName("tr");
				for (var i = trs.length - 1; i > -1; i--)
					table1.firstChild.appendChild(trs[i]);
			}

			if (table3 && !noExtHeaders) {
				var trs = table3.getElementsByTagName("tr");
				for (var i = trs.length - 1; i > -1; i--)
					table1.firstChild.appendChild(trs[i]);
			}

			var trs = table1.getElementsByTagName("tr");
			for (var i = 0; i < trs.length; i++) {
				// trs[i].firstChild..childNodes[1].setAttribute("width", "16%");

				var tdElement = printingtools.doc.createElement("td");
				if (trs[i].getAttribute("id") == "attTR") {
					var style = trs[i].firstChild.getAttribute("style");
					trs[i].querySelector("#attTD").setAttribute("style", "overflow: hidden;");
					trs[i].firstChild.removeAttribute("style");
					var newTDelement = trs[i].insertBefore(tdElement, trs[i].firstChild);
					newTDelement.setAttribute("style", style);

					// switch (Services.locale.appLocaleAsBCP47.split('-')[0]) {
					// 	case "ja":
					// 		if (table1.querySelector(".attHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "17%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "12%");
					// 		}

					// 		break;
					// 	case "el":
					// 		if (table1.querySelector(".bccHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "18.5%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "13%");
					// 		}
					// 		break;
					// 	case "de":
					// 		if (table1.querySelector(".bccHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "17%");
					// 		} else if (table1.querySelector(".attHdr") || table1.querySelector("#recTR")) {
					// 			trs[i].firstChild.setAttribute("width", "12.5%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "7.6%");
					// 		}
					// 		break;
					// 	case "ko":
					// 		trs[i].firstChild.setAttribute("width", "14%");
					// 		break;
					// 	case "en":
					// 		// if (table1.querySelector(".attHdr") || table1.querySelector("#recTR")) {
					// 		if (table1.querySelector(".attHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "12.4%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "9%");
					// 		}
					// 		break;
					// 	default:
					// 		trs[i].firstChild.setAttribute("width", "12%");
					// 		break;
					// }


					newTDelement.appendChild(printingtools.doc.getElementById("spanTD"));
				}
				else {
					// continue;
					trs[i].appendChild(tdElement);
					// This is called when a header exists, with a null value (for example "Subject:");
					// Adding a text node, we restore the original structure
					if (!trs[i].firstChild.childNodes[1])
						trs[i].firstChild.appendChild(printingtools.doc.createTextNode(" "));
					tdElement.appendChild(trs[i].firstChild.childNodes[1]);

					// switch (Services.locale.appLocaleAsBCP47.split('-')[0]) {
					// 	case "ja":
					// 		if (table1.querySelector(".attHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "17%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "12%");
					// 		}

					// 		break;
					// 	case "el":
					// 		if (table1.querySelector(".bccHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "18.5%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "13%");
					// 		}
					// 		break;
					// 	case "de":
					// 		if (table1.querySelector(".bccHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "17%");
					// 		} else if (table1.querySelector(".attHdr") || table1.querySelector("#recTR")) {
					// 			trs[i].firstChild.setAttribute("width", "12.5%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "7.6%");
					// 		}
					// 		break;
					// 	case "ko":
					// 		trs[i].firstChild.setAttribute("width", "14%");
					// 		break;
					// 	case "en":
					// 		if (table1.querySelector(".attHdr")) {
					// 			trs[i].firstChild.setAttribute("width", "12.4%");
					// 		} else {
					// 			trs[i].firstChild.setAttribute("width", "9%");
					// 		}
					// 		break;
					// 	default:
					// 		trs[i].firstChild.setAttribute("width", "12%");
					// 		break;
					// }

				}
				trs[i].firstChild.style.verticalAlign = "top";
				// trs[i].firstChild.style.paddingRight = "10px";
			}

			var tw = printingtools.doc.createElement("TABLE");
			trs = table1.getElementsByTagName("tr");
			for (var i = 0; i < trs.length; i++) {
				Services.console.logStringMessage(trs[i].firstChild.outerHTML)
				Services.console.logStringMessage(trs[i].firstChild.firstChild.textContent);
				Services.console.logStringMessage(trs[i].firstChild.firstChild.clientWidth);
				let trw = printingtools.doc.createElement("TR");
				trw.style.display = trs[i].style.display;
				trw.appendChild(trs[i].firstChild.firstChild.cloneNode(true));
				tw.appendChild(trw);
				Services.console.logStringMessage(trw.clientWidth);
			}
			if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.messages.style")) {
				var mSize = printingtools.prefs.getIntPref("extensions.printingtoolsng.messages.size");
				var mFamily = printingtools.getComplexPref("extensions.printingtoolsng.messages.font_family");
				tw.style.fontFamily = mFamily;
				tw.style.fontSize = mSize;
			}
			
			printingtools.insertAfter(tw, table1);
			let maxHdrWidth = tw.clientWidth;
			
			for (var i = 0; i < trs.length; i++) {
				trs[i].firstChild.setAttribute("width", `${maxHdrWidth}px`);
				// trs[i].firstChild.style.backgroundColor = `#ffff50`;
			}

			tw.setAttribute("border", "1px solid black");
			Services.console.logStringMessage(tw.clientWidth);
			tw.remove();
		}

		// Services.console.logStringMessage("After aligned");

		table1.setAttribute("width", "100%");
		table1.style.tableLayout = "fixed";
		table1.style.marginRight = "10px";
		table2.style.display = "none";


		var backgroundColor = printingtools.prefs.getCharPref("extensions.printingtoolsng.headers.background.color");
		if (!printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.use_background_color")) {
			backgroundColor = "#ffffff";
		}

		if (!noheaders && borders) {
			printingtools.setTableBorders(noExtHeaders);
			table1.style.backgroundColor = backgroundColor;
		}
		else if (!noheaders) {
			if (table1) {
				table1.style.color = "black";
				table1.style.backgroundColor = backgroundColor;
			}
			if (table2) {
				table2.style.color = "black";
				table2.style.backgroundColor = backgroundColor;
			}
			if (!noExtHeaders && hpref == 2 && table3) {
				table3.style.color = "black";
				table3.style.backgroundColor = backgroundColor;
			}
			// Services.console.logStringMessage("finish table layout");
		}
		printingtools.setTableLayout();

		// Services.console.logStringMessage("final document");
		Services.console.logStringMessage(printingtools.doc.documentElement.outerHTML);

	},

	insertAfter: function (newNode, existingNode) {
		existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
	},

	printSelection: function (contents) {
		try {
			if (printingtools.num && printingtools.num > 1)
				return;
			var divs = printingtools.doc.getElementsByTagName("div");
			for (i = 0; i < divs.length; i++) {
				var classe = divs[i].getAttribute("class")
				if (classe == "moz-text-html" || classe == "moz-text-plain" || classe == "moz-text-flowed") {
					var containerDiv = divs[i];
					break;
				}
			}
			containerDiv.innerHTML = "";
			containerDiv.appendChild(contents);
			var ops = containerDiv.getElementsByTagName("o:p");
			for (i = 0; i < ops.length; i++)
				// hides microsoft crap
				ops[i].style.display = "none";
			var hideImg = printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.hide");
			if (hideImg || printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.resize"))
				printingtools.setIMGstyle(hideImg);
		}
		catch (e) { }
	},

	toggleInlinePref: function () {
		printingtools.prefs.setBoolPref("mail.inline_attachments", false);
		setTimeout(function () { printingtools.prefs.setBoolPref("mail.inline_attachments", true); }, 2000);
	},

	attCheck: function () {
		try {
			// This avoids priting inline attachments with wrong mimetype (for ex. doc document with text/msword)
			// Text attachments are inside PRE tags
			var pres = printingtools.doc.getElementsByTagName("pre");
			for (i = 0; i < pres.length; i++) {
				var initHTML = pres[i].innerHTML.substring(0, 200);
				// Office files signature
				var docSignature = "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1";
				// Check if there is the office/RTF file signature
				if (initHTML.indexOf(docSignature) > -1 || initHTML.indexOf("{\\rtf1") > -1)
					pres[i].parentNode.setAttribute("style", "display:none");
			}
		}
		catch (e) { }
	},

	addName: function (borders) {

		try {

			if (printingtools.prefs.getPrefType("extensions.printingtoolsng.headers.addname") > 0) {
				if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.addname"))
					printingtools.prefs.setIntPref("extensions.printingtoolsng.headers.add_name_type", 1);
				else
					printingtools.prefs.setIntPref("extensions.printingtoolsng.headers.add_name_type", 0);
				printingtools.prefs.deleteBranch("extensions.printingtoolsng.headers.addname");
			}

			var add_name_type = printingtools.prefs.getIntPref("extensions.printingtoolsng.headers.add_name_type");
			var add_folder = printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.addfolder");
			if (add_name_type == 0 && !add_folder)
				return;

			var folder = printingtools.hdr.folder;
			var h3 = printingtools.doc.createElement("h3");
			var folderHtml = "";
			var myname = "&nbsp;"

			if (add_name_type > 0) {

				if (add_name_type == 2) {
					myname = printingtools.getComplexPref("extensions.printingtoolsng.headers.custom_name_value");
				}
				else {
					try {
						var myAccountManager = Cc["@mozilla.org/messenger/account-manager;1"].
							getService(Ci.nsIMsgAccountManager);
						if (folder) {
							var incServer = folder.server;
							var identity = myAccountManager.getFirstIdentityForServer(incServer);
						}
						else
							var identity = null;
						if (identity)
							myname = identity.fullName;
						else
							myname = myAccountManager.defaultAccount.defaultIdentity.fullName;
					}
					catch (e) { }
				}

			}
			if (add_folder) {
				var folderName = folder.name;
				while (true) {
					folder = folder.parent;
					folderName = folder.name + "/" + folderName;
					if (folder.isServer)
						break;
				}
				folderHtml = '<span style="font-size: 12px; margin-left:40px;"><img src="resource://printingtoolsng/icons/folder.gif" class="attIcon">&nbsp;' + folderName + '</span>';
			}
			h3.innerHTML = myname + folderHtml;
			var firsttable = printingtools.getTable(0);
			if (firsttable) {
				firsttable.parentNode.insertBefore(h3, firsttable);
				if (!borders) {
					var hr = printingtools.doc.createElement("hr");
					firsttable.parentNode.insertBefore(hr, firsttable);
				}
			}

		}
		catch (e) { }
	},

	setIMGstyle: function (hide) {
		var imgs = printingtools.doc.getElementsByTagName("img");
		for (i = 0; i < imgs.length; i++) {
			if (imgs[i].getAttribute("class") != "attIcon") {
				if (hide)
					imgs[i].setAttribute("style", "display:none !important;");
				else
					imgs[i].setAttribute("style", "height:auto; width:auto; max-width:100%; max-height:100%;");
			}
		}
	},

	getTable: function (num) {
		// The function check if the requested table exists and if it's an header table
		var tabclass = new Array("header-part1", "header-part2", "header-part3");
		var doc = window.content.document;
		var table = doc.getElementsByTagName("TABLE")[num];
		if (table && table.getAttribute("class") == tabclass[num])
			return table;
		else
			return false;
	},

	truncateHeaders: function (maxchars) {
		printingtools.scanTDS(printingtools.getTable(0), maxchars);
		printingtools.scanTDS(printingtools.getTable(1), maxchars);
		printingtools.scanTDS(printingtools.getTable(2), maxchars);
	},

	scanTDS: function (table, maxchars) {
		var textNode;
		if (table) {
			var tableTDS = table.getElementsByTagName("TD");

			for (var i = 0; i < tableTDS.length; i++) {

				if (tableTDS[i].getAttribute("id") == "attTD") {
					var avChars = maxchars;
					var divs = tableTDS[i].getElementsByTagName("img");

					for (var j = 0; j < divs.length; j++) {
						textNode = divs[j].nextSibling;
						if ((avChars - textNode.nodeValue.length) < 0 && maxchars) {
							textNode.nodeValue = textNode.nodeValue.substring(0, avChars) + " [...]";
							// break;
						}
						// avChars -= textNode.nodeValue.length;
					}
				}

				else if (tableTDS[i].getAttribute("id") == "receivedDate") {
					var avChars = maxchars;
					var divs = tableTDS[i].getElementsByTagName("div");
					for (var j = 0; j < divs.length; j++) {
						textNode = divs[j].firstChild;
						if ((avChars - textNode.nodeValue.length) < 0 && maxchars) {
							textNode.nodeValue = textNode.nodeValue.substring(0, avChars) + " [...]";
							break;
						}
						avChars -= textNode.nodeValue.length;
					}
				}
				else {
					textNode = tableTDS[i].getElementsByTagName("div")[0].nextSibling;
					if (!textNode) {
						// This is called when a header exists, with a null value (for example "Subject:");
						// Adding a text node, we restore the original structure
						tableTDS[i].appendChild(document.createTextNode(" "));
					}
					else if (textNode && textNode.textContent && textNode.textContent.length > maxchars && maxchars) {
						textNode.textContent = textNode.textContent.substring(0, maxchars) + " [...]";
					}
				}
			}
		}
	},

	hideHeaders: function (hpref) {
		var table1 = printingtools.getTable(0);
		var table2 = printingtools.getTable(1);
		var table3 = printingtools.getTable(2);
		if (table1)
			table1.setAttribute("style", "display:none !important");
		if (table2)
			table2.setAttribute("style", "display:none !important");
		if (hpref == 2 && table3)
			table3.setAttribute("style", "display:none !important");
	},

	setTableBorders: function (noExtHeaders) {
		var hpref = printingtools.prefs.getIntPref("mail.show_headers");
		var table1 = printingtools.getTable(0);
		var table2 = printingtools.getTable(1);
		var tableStyle = printingtools.prefs.getCharPref("extensions.printingtoolsng.headers.border_style");

		// Services.console.logStringMessage("settableborders initial table");
		// Services.console.logStringMessage(table1.outerHTML);
		if (noExtHeaders)
			var table3 = null;
		else
			var table3 = printingtools.getTable(2);
		if (table1) {
			if (table2 && table2.getElementsByTagName("tr").length > 0) {
				let style = table1.getAttribute("style");
				table1.setAttribute("style", style + "; " + tableStyle);
			}
			else {
				let style = table1.getAttribute("style");
				table1.setAttribute("style", style + "; " + tableStyle + ";");
			}
			var tds1 = table1.getElementsByTagName("TD");
			// We process the first row in a different way, to set the top-padding = 3px
			tds1[0].style.padding = "3px 0px 0px 0px";
			for (var i = 1; i < tds1.length; i++) {
				tds1[i].style.padding = "0px 0px 0px 0px";


				if (tds1[i].id === "attTD") {
					let s = tds1[i].nextSibling || tds1[i];

					var maxAttPerLine = printingtools.prefs.getIntPref("extensions.printingtoolsng.headers.attachments_per_line");
					if (maxAttPerLine !== 100) {
						s.style.whiteSpace = "wrap";

					} else {
						if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate")) {
							s.style.overflow = "hidden";
						}
						s.style.whiteSpace = "wrap";
						s.style.wordWrap = "break-word";
					}
					tds1[i].innerHTML = "<div  style='overflow-wrap: break-word; word-wrap: break-word; '>" + tds1[i].innerHTML + "</div>";
				}
			}
		}

		// The style of table-headers 2 is different if exits the table-headers 3 or it doesn't
		if (table2) {
			table2.style.borderLeft = "1px solid black";
			table2.style.borderRight = "1px solid black";
			if (noExtHeaders || hpref != 2)
				table2.style.borderBottom = "1px solid black";

			var tds2 = table2.getElementsByTagName("TD");
			for (i = 0; i < tds2.length; i++) {
				tds2[i].style.padding = "0px 10px 0px 10px";
			}
		}
		if (table3 && hpref == 2) {
			table3.style.borderLeft = "1px solid black";
			table3.style.borderRight = "1px solid black";
			table3.style.borderBottom = "1px solid black";
			var tds3 = table3.getElementsByTagName("TD");
			for (i = 0; i < tds3.length; i++)
				tds3[i].style.padding = "0px 10px 0px 10px";
		}

		// Services.console.logStringMessage(table1.outerHTML);
		// Services.console.logStringMessage("finish table borders");
	},

	setTableLayout: function () {
		// Services.console.logStringMessage("table layout");
		var table1 = printingtools.getTable(0);
		var tds1 = table1.getElementsByTagName("TD");
		for (var i = 0; i < tds1.length; i++) {
			if (i === 0) {
				// We process the first row in a different way, to set the top-padding = 3px
				tds1[0].style.padding = "3px 0px 0px 6px";
				if (tds1[0].firstChild)
					tds1[0].firstChild.style.paddingRight = "0px";
			} else {
				tds1[i].style.padding = "0px 0px 0px 6px";
			}

			if (tds1[i].firstChild && tds1[i].firstChild.nodeName !== "#text")
				tds1[i].firstChild.style.paddingRight = "0px";

			// Services.console.logStringMessage(`${tds1[i].outerHTML} ${tds1[i].offsetWidth}  ${tds1[i].clientWidth}`);


			if (tds1[i].firstChild.tagName === "DIV" && tds1[i].firstChild.classList.contains("subjectHdr")) {
				tds1[i].firstChild.style.float = "left";
				let s = tds1[i].nextSibling;
				if (!s) {

					s = tds1[i].firstChild.nextSibling
					let sub = s.textContent;
					s.outerHTML = sub;
				}
				if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate")) {
					s.style.overflow = "hidden";
					s.style.whiteSpace = "nowrap";
					s.style.textOverflow = "ellipsis";

				} else {
					s.style.wordWrap = "break-word";
				}
			}

			if (tds1[i].id === "attTD") {
				if (i === 1) {
					tds1[i].style.paddingTop = "3px";
				}
				let s = tds1[i].nextSibling || tds1[i];
				s.style.paddingRight = "8px";
				var maxAttPerLine = printingtools.prefs.getIntPref("extensions.printingtoolsng.headers.attachments_per_line");
				// if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate")) {
				if (maxAttPerLine !== 100) {
					// s.style.overflow = "hidden";
					s.style.whiteSpace = "wrap";
					// s.style.textOverflow = "ellipsis";

				} else {
					if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate")) {
						s.style.overflow = "hidden";
					}
					s.style.whiteSpace = "wrap";
					// s.style.textOverflow = "ellipsis";

					s.style.wordWrap = "break-word";
				}

				tds1[i].innerHTML = "<div  style='overflow-wrap: break-word; word-wrap: break-word; '>" + tds1[i].innerHTML + "</div>";
			}
		}
		// Services.console.logStringMessage(table1.outerHTML);
		// Services.console.logStringMessage("finish table layout");
	},

	formatDate: function (msecs, longFormat) {
		var formatted_date = null;
		var options;
		// Services.console.logStringMessage(Services.locale.appLocaleAsBCP47);
		if (!longFormat)
			longFormat = printingtools.prefs.getIntPref("extensions.printingtoolsng.date.long_format_type");
		try {
			var date_obj = new Date(msecs);
			// cleidigh fix short format #28


			if (longFormat === 0) {
				options = {
					year: 'numeric', month: '2-digit',
					hour: 'numeric', minute: 'numeric', day: '2-digit',
				};
				if (Services.locale.appLocaleAsBCP47 === "en-HK") {
					options.hour12 = false;
				}
				formatted_date = new Intl.DateTimeFormat(Services.locale.appLocaleAsBCP47, options).format(date_obj);
			} else if (longFormat === 1) {
				options = {
					weekday: 'short',
					year: 'numeric', month: 'short',
					hour: 'numeric', minute: 'numeric', day: 'numeric',
				};
				if (Services.locale.appLocaleAsBCP47 === "en-HK") {
					options.hour12 = false;
				}
				formatted_date = new Intl.DateTimeFormat('default', options).format(date_obj);
			}
			else
				var formatted_date = date_obj.toUTCString();
		}
		catch (e) { }
		return formatted_date;
	},

	correctDate: function () {
		var table = printingtools.getTable(0);
		if (!table || !printingtools.hdr)
			return;
		var longFormat = printingtools.prefs.getIntPref("extensions.printingtoolsng.date.long_format_type");
		var formatted_date = printingtools.formatDate((printingtools.hdr.dateInSeconds * 1000), longFormat);
		if (!formatted_date)
			return;
		var tds = table.getElementsByTagName("TD");
		var node = tds[tds.length - 1];
		if (node) {
			var data = node.childNodes[1].nodeValue;
			node.childNodes[1].nodeValue = formatted_date;
		}
	},

	appendReceivedTD: function () {
		if (printingtools.hdr) {
			var formatted_date = printingtools.formatDate((printingtools.hdr.getUint32Property("dateReceived") * 1000), null);
			var bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");
			var headtable1 = printingtools.getTable(0);
			var newTR = printingtools.doc.createElement("TR");
			newTR.setAttribute("id", "recTR");
			var newTD = printingtools.doc.createElement("TD");
			newTD.setAttribute("id", "receivedDate");
			newTD.innerHTML = "<span><b>" + bundle.GetStringFromName("received") + ": </b></span>" + formatted_date;
			newTR.appendChild(newTD);

			// Services.console.logStringMessage("printingtools: rd " + newTR.outerHTML);
			if (headtable1 && headtable1.lastChild) {
				// Services.console.logStringMessage("printingtools: rd " + printingtools.dateTRpos);
				// Services.console.logStringMessage([...headtable1.lastChild.getElementsByTagName("TR")]);
				var dateTR = headtable1.lastChild.getElementsByTagName("TR")[printingtools.dateTRpos];

				headtable1.lastChild.insertBefore(newTR, dateTR.nextSibling);
				// Services.console.logStringMessage("printingtools: final " + headtable1.outerHTML);
			}
		}
	},

	appendAttTD: function (newTD) {
		if (!newTD.innerHTML)
			return;
		var bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");
		var headtable1 = printingtools.getTable(0);
		var newTR = printingtools.doc.createElement("TR");
		newTR.setAttribute("id", "attTR");
		var newTDhtml = "<span id='spanTD'><b>" + bundle.GetStringFromName("attachments") + ": </b></span>" + newTD.innerHTML;
		newTD.innerHTML = newTDhtml;
		//if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.setborders"))
		//	newTD.setAttribute("style", "padding: 0px 10px;");
		newTR.appendChild(newTD);
		if (headtable1 && headtable1.lastChild)
			headtable1.lastChild.appendChild(newTR);
	},

	rewriteAttList: function () {
		var bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");
		var firsttime = true;
		var counter = 0;
		var newTD = printingtools.doc.createElement("TD");
		newTD.setAttribute("id", "attTD");
		// takes the second table of the headers (A , CC fields)
		var headtable1 = printingtools.getTable(0);
		var comma = "";
		var withIcon = printingtools.prefs.getBoolPref("extensions.printingtoolsng.process.attachments_with_icon");
		// takes all the TABLE elements of the doc
		var attTable = printingtools.doc.getElementsByTagName("TABLE");

		if (Array.isArray) {  // Thunderbird 5 or higher (different layout)
			var attTab = null;
			for (var i = 0; i < attTable.length; i++) {
				var tabclass = attTable[i].getAttribute("class");
				if (attTable[i].getAttribute("class") == "mimeAttachmentTable") {
					attTab = attTable[i];
					break;
				}
			}
			if (attTab) {
				var tds = attTab.getElementsByTagName("TD");
				var attDiv = "";
				var maxAttPerLine = printingtools.prefs.getIntPref("extensions.printingtoolsng.headers.attachments_per_line");
				for (var i = 0; i < tds.length; i = i + 2) {

					if (tds.length > 1 && i < tds.length - 2 && maxAttPerLine !== 1) {
						comma = ", ";
					} else {
						comma = "";
					}
					var currAtt = tds[i].innerHTML + "&nbsp;(" + tds[i + 1].innerHTML + ")";
					if (withIcon) {
						var filename = currAtt.substring(0, currAtt.lastIndexOf("&")).toLowerCase();
						var imgSrc = printingtools.findIconSrc(filename);
						// currAtt = '<nobr><img src="' + imgSrc + '" class="attIcon" height="16px" width="16px" >&nbsp;' + currAtt + "</nobr>";
						// currAtt = '<img src="' + imgSrc + '" class="attIcon" height="16px" width="16px" >&nbsp;' + currAtt + "";
						// currAtt = '<div style="word-wrap: pre-line" ><img src="' + imgSrc + '" class="attIcon" height="16px" width="16px" >&nbsp;' + currAtt + "</div>";
						currAtt = '<span style="padding-left: 16px; word-wrap: nowrap; position: relative;" ><img src="' + imgSrc + '" class="attIcon" height="16px" width="16px" style="position: absolute; bottom: 2px; left: 0px">&nbsp;' + currAtt + "</span>"
					}
					attDiv = attDiv + currAtt + comma;
					if (((i / 2) + 1) % maxAttPerLine === 0 && maxAttPerLine !== 100) {
						attDiv += '<br>'
					}
				}
				newTD.innerHTML = attDiv;
				attTab.parentNode.removeChild(attTab);
			}
		}
		else {
			// skips the first TABLE, that are the headers-part1
			for (var i = 0; i < attTable.length; i++) {
				// skips the TABLE with class=header-part2 and 3 and without the words "Content-Type"
				var tabclass = attTable[i].getAttribute("class");
				var tabindexof = attTable[i].innerHTML.indexOf("Content-Type");
				var tabindexof2 = attTable[i].innerHTML.indexOf("Content-Encoding");
				var tabindexof3 = attTable[i].innerHTML.indexOf("X-UIDL");
				if (attTable[i] && tabindexof3 < 0 && (tabindexof > -1 || tabindexof2 > -1) && tabclass != "header-part2" && tabclass != "header-part3") {
					// takes all the TD elements of the TABLE 
					var tds = attTable[i].getElementsByTagName("TD");
					// remove from the first TD element (the name of the attachment) the class "bold"
					tds[0].firstChild.removeAttribute("class");
					if (!firsttime)
						comma = ", ";
					var attDiv = tds[0].innerHTML;
					if (withIcon) {
						var filename = attDiv.substring(0, attDiv.lastIndexOf("&")).toLowerCase();
						var imgSrc = printingtools.findIconSrc(filename);
						// attDiv = '<nobr><img src="' + imgSrc + '" class="attIcon" height="16px" width="16px">&nbsp;' + attDiv + "</nobr>";
						attDiv = '<img src="' + imgSrc + '" class="attIcon" height="16px" width="16px">&nbsp;' + attDiv + "";
					}
					// write into the new TD innerHTML the name of the attachment, if necessary with a comma
					newTD.innerHTML = newTD.innerHTML + comma + attDiv;
					firsttime = false;
					counter++;
					// empty the TABLE
					attTable[i].innerHTML = "";
				}
			}
		}

		try {
			if (opener && printingtools.prefs.getBoolPref("extensions.printingtoolsng.process.add_p7m_vcf_attach")) {
				var attList = opener.document.getElementById("attachmentList");
				if (attList) {
					var atts = attList.childNodes;
					for (var i = 0; i < atts.length; i++) {
						if (Array.isArray)
							var attDiv = atts[i].getAttribute("tooltiptext");
						else
							var attDiv = atts[i].label;
						if (attDiv.lastIndexOf(".p7m") + 4 != attDiv.length && attDiv.lastIndexOf(".p7s") + 4 != attDiv.length && attDiv.lastIndexOf(".vcf") + 4 != attDiv.length)
							continue;
						if (!firsttime)
							comma = ", ";
						if (Array.isArray)
							attDiv = atts[i].attachment.name;
						if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.process.attachments_with_icon")) {
							var imgSrc = printingtools.findIconSrc(attDiv);
							// attDiv = '<nobr><img src="' + imgSrc + '" class="attIcon"  height="16px" width="16px">&nbsp;' + attDiv + "</nobr>";
							attDiv = '<img src="' + imgSrc + '" class="attIcon"  height="16px" width="16px">&nbsp;' + attDiv + "";
						}
						// write into the new TD innerHTML the name of the attachment, if necessary with a comma
						newTD.innerHTML = newTD.innerHTML + comma + attDiv;
						firsttime = false;
					}
				}
			}
		}
		catch (e) { }

		if (newTD)
			printingtools.appendAttTD(newTD);

		printingtools.sortHeaders();
		if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.add_received_date"))
			printingtools.appendReceivedTD();

		// if (!String.trim) {
		if (0) {
			// TB2 and lower
			// removes the HR elements, in the same numbers of the attachments, beginning from the last one
			var hrs = printingtools.doc.getElementsByTagName("HR");
			var hrsLength = hrs.length;
			for (var i = hrsLength - 1; i > hrsLength - counter; i--)
				hrs[i].parentNode.removeChild(hrs[i]);
		}
		else {
			// TB3 or higher
			// removes all the FIELDSET elements with class = mimeAttachmentHeader
			var fieldSets = printingtools.doc.getElementsByTagName("FIELDSET");
			for (var i = fieldSets.length - 1; i > -1; i--) {
				if (fieldSets[i].getAttribute("class") == "mimeAttachmentHeader")
					fieldSets[i].parentNode.removeChild(fieldSets[i]);
			}
		}
	},

	findIconSrc: function (filename) {
		var url;
		var ext;
		ext = filename.substring(filename.lastIndexOf(".") + 1);

		switch (ext) {
			case "doc":
			case "eml":
			case "gif":
			case "jpg":
			case "jpeg":
			case "ods":
			case "odt":
			case "msg":
			case "tif":
			case "tiff":
			case "pdf":
			case "png":
			case "ppt":
			case "rtf":
			case "txt":
			case "vcf":
			case "xls":
			case "xml":
			case "zip":
				url = "resource://printingtoolsng/icons/" + ext + ".gif";
				break;
			case "avi":
			case "mpg":
			case "mp3":
			case "wav":
			case "wmv":
			case "wma":
				url = "resource://printingtoolsng/icons/media.gif";
				break;
			case "7z":
				url = "resource://printingtoolsng/icons/7z.png";
				break;
			case "docx":
				url = "resource://printingtoolsng/icons/docx.png";
				break;
			case "xlsx":
				url = "resource://printingtoolsng/icons/xlsx.png";
				break;
			case "pptx":
				url = "resource://printingtoolsng/icons/pptx.png";
				break;
			case "p7m":
			case "p7s":
				url = "resource://printingtoolsng/icons/" + "signature" + ".gif";
				break;

			default:
				url = "resource://printingtoolsng/icons/file.gif";
		}
		// console.debug(url);
		return url;
	},
}

window.addEventListener("DOMContentLoaded", printingtools.loadContentListener, false);

