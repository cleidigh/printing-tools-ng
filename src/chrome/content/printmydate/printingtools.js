var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

Services.console.logStringMessage("printing");

function ReplaceWithSelection() {
	// disables the native function in TB 3.1, that prints
	// selection without headers
	return true;
}

var printingtools = {

	current : null,
	num : null,
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
	maxChars : null,

	strBundleService : Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService),
	
	loadContentListener : function() {
		Services.console.logStringMessage("printingListener");
		console.debug('ContentList');
		window.removeEventListener("DOMContentLoaded", printingtools.loadContentListener, false);
		printingtools.current = 0;
		var contentEl = document.getElementById("content");
		contentEl.addEventListener("load", printingtools.correctLayout, true);
		if (window.arguments && window.arguments[1])
			printingtools.num = window.arguments[1].length;
		if (printingtools.prefs.getBoolPref("extensions.printingtools.show_options_button")) {
			var bundle = printingtools.strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
			var box = document.createXULElement("hbox");
			var button = document.createElement("button");
			button.setAttribute("oncommand", "printingtools.openDialog(true)");
			button.setAttribute("label", bundle.GetStringFromName("options"));
			box.appendChild(button);
			contentEl.parentNode.insertBefore(box, contentEl.nextSibling);
		}		
	},

	getComplexPref : function(pref) {
		if (printingtools.prefs.getStringPref)
			return printingtools.prefs.getStringPref(pref);
		else
			return printingtools.prefs.getComplexValue(pref,Components.interfaces.nsISupportsString).data;
	},

	openDialog : function(fromPreview) {
		if (printingtools.isAB)
			openDialog("chrome://printmydate/content/pmd-ABoptions.xul","","chrome,centerscreen",fromPreview);
		else
			openDialog("chrome://printmydate/content/pmd-options.xul","","chrome,centerscreen",fromPreview);
	},
	
	getIndexForHeader : function(string) {
		var order = printingtools.prefs.getCharPref("extensions.printingtools.headers.order");
		var hdrs = order.split(",");
		var index = -1;
		for (var j=0;j<hdrs.length;j++) {
			if (hdrs[j] == string) {
				index = j;
				break;
			}
		}
		return index;
	},

	sortHeaders : function() {	
		if (printingtools.prefs.getCharPref("extensions.printingtools.headers.order") == "%s,%f,%d,%a,%r1,%r2,%r3") {
			printingtools.dateTRpos = 2;
			return // default order
		}
		var table1 = printingtools.getTable(0);
		var trs = table1.getElementsByTagName("TR");
		var arr = new Array;
		var index;
	
		var bundle = printingtools.strBundleService.createBundle("chrome://messenger/locale/mime.properties");
		var subject = bundle.GetStringFromID(1000).replace(/\s*$/, "");
		var from = bundle.GetStringFromID(1009).replace(/\s*$/, "");
		var to = bundle.GetStringFromID(1012).replace(/\s*$/, "");
		var cc = bundle.GetStringFromID(1013).replace(/\s*$/, "");
		var date = bundle.GetStringFromID(1007).replace(/\s*$/, "");
		var bcc =  bundle.GetStringFromID(1023).replace(/\s*$/, "");

		for (var i=0;i<trs.length;i++) {
			if (trs[i].id == "attTR") {
				index = printingtools.getIndexForHeader("%a");
				arr[index] = trs[i];
				continue;
			}
			var div = trs[i].firstChild.firstChild;
			var divHTML = div.innerHTML.replace(/\&nbsp;/g, " ");
			var regExp = new RegExp(subject+"\\s*:");
			if (divHTML.match(regExp)) {
				index = printingtools.getIndexForHeader("%s");
				arr[index] = trs[i];
				continue;
			}
			regExp = new RegExp(from+"\\s*:");
			if (divHTML.match(regExp)) {
				index = printingtools.getIndexForHeader("%f");
				arr[index] = trs[i];
				continue
			}
			regExp = new RegExp(date+"\\s*:");
			if (divHTML.match(regExp)) {
				index = printingtools.getIndexForHeader("%d");
				printingtools.dateTRpos = index;
				arr[index] = trs[i]; 
			}
		}
		var table2 = printingtools.getTable(1);
		if (table2) {
			trs = table2.getElementsByTagName("TR");
			for (var i=0;i<trs.length;i++) {
				var div = trs[i].firstChild.firstChild;
				var divHTML = div.innerHTML.replace(/\&nbsp;/g, " ");
				regExp = new RegExp(to+"\\s*:");
				if (divHTML.match(regExp)) {
					index = printingtools.getIndexForHeader("%r1");
					arr[index] = trs[i];
					continue;
				}
				regExp = new RegExp(bcc+"\\s*:");
				if (divHTML.match(regExp)) {
					index = printingtools.getIndexForHeader("%r3");
					arr[index] = trs[i];
					continue;
				}
				regExp = new RegExp(cc+"\\s*:");
				if (divHTML.indexOf(cc) ==0) {
					index = printingtools.getIndexForHeader("%r2");
					arr[index] = trs[i];
				}
			}
		}

		var tbody = table1.firstChild;
		for (var i=0;i<arr.length;i++) {
			if (arr[i])
				tbody.appendChild(arr[i]);
			// else
			//	printingtools.dateTRpos = printingtools.dateTRpos - 1;
		}
		
	},

	correctABprint : function(gennames) {
		var gnLen = printingtools.doc.getElementsByTagName("GeneratedName").length;
		var dirNode = printingtools.doc.getElementsByTagName("directory")[0];
		var multipleCards = printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.print_multiple_cards");
		var sepr;

		// if gnLen is equal to 1, we're printing a single contact		
		if (gnLen == 1 && multipleCards) {
			try {
				// Get the selected cards from addressbook window
				var abWin = Components.classes["@mozilla.org/appshell/window-mediator;1"].
					getService(Components.interfaces.nsIWindowMediator).
					getMostRecentWindow("mail:addressbook");
				var start = new Object();
				var end = new Object();
				var card;
				var treeSelection = abWin.gAbView.selection;
				var numRanges = treeSelection.getRangeCount();
				var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]  
		             		.createInstance(Components.interfaces.nsIDOMParser);  
				var firstCard = true;
					
				for (var t=0; t<numRanges; t++) {
					treeSelection.getRangeAt(t,start,end);
					for (var v=start.value; v<=end.value; v++) {
						if (firstCard) {
							// The first card is already present in print window
							firstCard = false;
							continue;
						}
						card = abWin.gAbView.getCardFromRow(v);
						if (! card.isMailList) {
							// Add the xml translation of card to the root node ("directory")
							sepr = printingtools.doc.createElement("separator");
							dirNode.appendChild(sepr);
							var xmlParts = card.translateTo("xml").split("<table>");
							// It's necessary to add a root node, otherwise parser will fail
							var temp = "<root>"+xmlParts[0]+"</root>";
							var gn = parser.parseFromString(temp,"text/xml");  
							dirNode.appendChild(gn.firstChild);
							temp = "<root><table>"+xmlParts[1]+"</root>";
							var table = parser.parseFromString(temp,"text/xml");  
							dirNode.appendChild(table.firstChild);
						}
					}
				}
				sepr = printingtools.doc.createElement("separator");
				dirNode.appendChild(sepr);
			}
			catch(e) {}
		}
		
					
		var rule;
		var hideHeaderCard = printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.hide_header_card");
		var compactFormat = printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.print_just_addresses");
		var smallFont = printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.use_custom_font_size");
		var maxCompact = printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.max_compact");
		var fontFamily = printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.use_custom_font_family");
		var cutNotes = printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.cut_notes");
		var addABname =  printingtools.prefs.getBoolPref("extensions.printingtools.addressbook.add_ab_name");

		if (addABname) {
			sepr = printingtools.doc.createElement("separator");
			dirNode.insertBefore(sepr,dirNode.firstChild);
			var sec = printingtools.doc.createElement("section");
			var GN = printingtools.doc.createElement("GeneratedName");
			var now = new Date();
			var selDir = opener.GetSelectedDirectory();
			var abDir = opener.GetDirectoryFromURI(selDir);
			var intro = printingtools.doc.createElement("intro");
			var abNameNode = printingtools.doc.createTextNode(abDir.dirName+" - "+ now.toLocaleString());
			GN.appendChild(abNameNode);
			sec.appendChild(GN);
			intro.appendChild(sec);
			dirNode.insertBefore(intro,dirNode.firstChild);
		}
		
		if (! String.trim && hideHeaderCard) {
			var ABbundle = printingtools.strBundleService.createBundle("chrome://messenger/locale/addressbook/addressBook.properties");
			// The heading card is taken from addressBook.properties
			var headingCard = ABbundle.GetStringFromName("headingCardFor");
			for (i=0;i<gennames.length;i++) {
				gennames[i].firstChild.nodeValue = gennames[i].firstChild.nodeValue.replace(headingCard, "");
				if (maxCompact)
					// Maybe this is superflous
					gennames[i].firstChild.nodeValue = gennames[i].firstChild.nodeValue.replace("\n", "");
			}
		}
		
		var tables = printingtools.doc.getElementsByTagName("table");
		for (j=0;j<tables.length;j++) {
			var isMCFABinstalled = (printingtools.prefs.getPrefType("morecols.custom1.label") > 0);
			if (isMCFABinstalled) {
				for (var k=1;k<5;k++) {
					var custom = tables[j].getElementsByTagName("Custom"+k.toString())[0];
					if (custom) {
						var newLabel = printingtools.prefs.getCharPref("morecols.custom"+k.toString()+".label");
						if (newLabel != "")
							custom.previousSibling.firstChild.nodeValue = newLabel+": ";
					}
				}
			}

			if (cutNotes) {
				var notes = tables[j].getElementsByTagName("Notes")[0]
				if (notes) 
					notes.firstChild.nodeValue = notes.firstChild.nodeValue.substring(0,100)+" [...]";
			}

			if (maxCompact || compactFormat) {
				// The first row contains name & addresses, the second one the other data
				var trs =tables[j].childNodes;
				if (! compactFormat) {
					// Moving all the card properties in one single TR tag, the layout is much more compact
					var chs = trs[1].childNodes;
					trs[0].appendChild(chs[1]);
					trs[0].appendChild(chs[0]);
				}
				if (maxCompact) {
					// To compact more, the useless property "Displayname" is deleted
					var lrow = tables[j].getElementsByTagName("labelrow")[0];
					try {trs[1].appendChild(lrow);}
					catch(e) {}
									
					// Remove empty sections
					var secs = tables[j].getElementsByTagName("section");
					for (o=secs.length-1;o>-1;o--) {
						if (! secs[o].hasChildNodes())
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
			var fontsize = printingtools.prefs.getIntPref("extensions.printingtools.addressbook.custom_font_size");
			rule = "* {font-size: "+fontsize+"px !important;}";
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
			fontsize = fontsize + 2;
			rule = "intro * {display:block !important; padding:15px !important; font-size:"+ fontsize+"px !important;}"
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
		else {
			rule = "intro * {display:block !important; padding:15px !important; font-size:16px !important;}"
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
		if (fontFamily) {
			var fontfamily = printingtools.prefs.getCharPref("extensions.printingtools.addressbook.font_family");
			rule = "* {font-family: "+fontfamily+" !important;}";
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
	},		
	
	getHdr : function() {
		var uris = window.arguments[1];
		var m = Components.classes["@mozilla.org/messenger;1"]
           		.createInstance(Components.interfaces.nsIMessenger);
		if (uris && uris[printingtools.current]) {
			if  (uris[printingtools.current].indexOf("file") == 0) {
				// If we're printing a eml file, there is no nsIMsgHdr object, so we create an object just with properties
				// used by the extension ("folder" and "dateInSeconds"), reading directly the file (needing just 1000 bytes)
				var dummy = {};
				dummy.folder = null;
				var scriptableStream=Components.classes["@mozilla.org/scriptableinputstream;1"]
					.getService(Components.interfaces.nsIScriptableInputStream);
				var ioService=Components.classes["@mozilla.org/network/io-service;1"]
					.getService(Components.interfaces.nsIIOService);
				var channel=ioService.newChannel(uris[printingtools.current],null,null);
				var input=channel.open();
				scriptableStream.init(input);
				var str_message=scriptableStream.read(3000);
				scriptableStream.close();
				input.close();
				str_message = str_message.toLowerCase();
				var dateOrig = str_message.split("\ndate:")[1].split("\n")[0];
				dateOrig = dateOrig.replace(/ +$/,"");
				dateOrig = dateOrig.replace(/^ +/,"");
				var secs = Date.parse(dateOrig)/1000;
				dummy.dateInSeconds = secs;
				printingtools.hdr = dummy;
			}
			else {
				printingtools.hdr = m.msgHdrFromURI(uris[printingtools.current]);
			}			
		}
	},

	correctLayout : function() {
		Services.console.logStringMessage("correctly layout");
		printingtools.doc = window.content.document;
		var gennames = printingtools.doc.getElementsByTagName("GeneratedName");
		printingtools.maxChars = printingtools.prefs.getIntPref("extensions.printingtools.headers.maxchars");
		// If there is some "GeneratedName" tag, so we're printing from addressbook
		if (gennames.length > 0) {
			printingtools.isAB = true;	
			if (gennames.length ==  1)
				printingtools.isContact = true;					
			printingtools.correctABprint(gennames);
			return;
		}

		var tablesNum = printingtools.doc.getElementsByTagName("Table").length;
		// If there is no "Table" tag, so we can't do nothing... It can happen, because the printEngine window
		// is loaded twice, but the first time the content is not loaded
		
		if (printingtools.prefs.getBoolPref("mail.inline_attachments") &&
			printingtools.prefs.getBoolPref("extensions.printingtools.hide.inline_attachments") )
				printingtools.toggleInlinePref();
		
		if (tablesNum == 0)
			return;

		var max_pre_len = printingtools.prefs.getIntPref("extensions.printingtools.pre_max_length");
		if (max_pre_len > 0) {
			var preTags = printingtools.doc.getElementsByTagName("PRE");
			for (var j=0;j<preTags.length;j++)
				preTags[j].width = max_pre_len;
		}

		printingtools.getHdr(); // save hdr
		printingtools.current = printingtools.current + 1;

		var table1 = printingtools.getTable(0);
		var table2 = printingtools.getTable(1);
		var table3 = printingtools.getTable(2);

		var hpref = printingtools.prefs.getIntPref("mail.show_headers");
		var noheaders = printingtools.prefs.getBoolPref("extensions.printingtools.headers.hide");
		var noExtHeaders = printingtools.prefs.getBoolPref("extensions.printingtools.ext_headers.hide");

		if (printingtools.prefs.getBoolPref("extensions.printingtools.messages.black_text"))
			printingtools.doc.body.removeAttribute("text");
		
		if (printingtools.prefs.getBoolPref("extensions.printingtools.messages.style")) {
			var mSize = printingtools.prefs.getIntPref("extensions.printingtools.messages.size");
			var mFamily = printingtools.getComplexPref("extensions.printingtools.messages.font_family");
			if (printingtools.prefs.getIntPref("extensions.printingtools.messages.style_apply") == 0) {
				rule = '* {font-size: +'+mSize+'px !important; font-family: '+mFamily+' !important;}';
				printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
			}
			else {
				if (table1) {
					table1.style.fontFamily = mFamily;
					table1.style.fontSize = mSize;
				}
				if (table2) {
					table2.style.fontFamily = mFamily;
					table2.style.fontSize = mSize;
				}
				if (! noExtHeaders && hpref == 2 && table3) {
					table3.style.fontFamily = mFamily;
					table3.style.fontSize = mSize;
				}
			}
		}	
		
		if (printingtools.prefs.getBoolPref("extensions.printingtools.cite.style")) {
			var cSize = printingtools.prefs.getIntPref("extensions.printingtools.cite.size");
			var cColor = printingtools.prefs.getCharPref("extensions.printingtools.cite.color");
			rule = 'blockquote[type="cite"]{font-size: '+cSize+'px !important; color:'+cColor+' !important;}';
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
			rule = 'blockquote[type="cite"] * {font-size: '+cSize+'px !important; color:'+cColor+'!important;}';
			printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		}
		
		if (printingtools.prefs.getBoolPref("extensions.printingtools.process.date"))
			printingtools.correctDate();
		
		if (noheaders) 
			printingtools.hideHeaders(hpref);
		else if (noExtHeaders && table3 && hpref == 2)
			table3.setAttribute("style","display:none !important");

		var borders = printingtools.prefs.getBoolPref("extensions.printingtools.headers.setborders");
		Services.console.logStringMessage("borders " + borders);
		if (! noheaders)
			printingtools.addName(borders);
		Services.console.logStringMessage("before check selection");
		

		var sel = opener.content.getSelection();
		if (sel && sel != "" && printingtools.prefs.getBoolPref("extensions.printingtools.print.just_selection")) {
				var range = sel.getRangeAt(0);
				var contents = range.cloneContents();
				if (String.trim)
					printingtools.printSelection(contents);
				else
					setTimeout(function() { printingtools.printSelection(contents); }, 100);
		}
		else {
			if (printingtools.prefs.getBoolPref("mail.inline_attachments"))
				printingtools.attCheck();
			var hideImg = printingtools.prefs.getBoolPref("extensions.printingtools.images.hide");
			if (hideImg  || printingtools.prefs.getBoolPref("extensions.printingtools.images.resize")) 
				printingtools.setIMGstyle(hideImg);
		}
		Services.console.logStringMessage("before attachments");
		if (printingtools.prefs.getBoolPref("extensions.printingtools.process.attachments")) {
			Services.console.logStringMessage("process attachments");
			printingtools.rewriteAttList();
		} else
			printingtools.sortHeaders();
		if (! noheaders && printingtools.prefs.getBoolPref("extensions.printingtools.headers.truncate"))
			printingtools.truncateHeaders(printingtools.maxChars);
	
		if (printingtools.prefs.getBoolPref("extensions.printingtools.headers.align")) {
			if (table2) {
				var trs = table2.getElementsByTagName("tr");
				for (var i=trs.length-1;i>-1;i--)
					table1.firstChild.appendChild(trs[i]);
			}

			if (table3 && ! noExtHeaders) {
				var trs = table3.getElementsByTagName("tr");
				for (var i=trs.length-1;i>-1;i--)
					table1.firstChild.appendChild(trs[i]);
			}
			var trs = table1.getElementsByTagName("tr");
			for (var i=0;i<trs.length;i++) {
				var tdElement = printingtools.doc.createElement("td");
				if (trs[i].getAttribute("id") == "attTR") {
					var style = trs[i].firstChild.getAttribute("style");		
					trs[i].firstChild.removeAttribute("style");
					var newTDelement = trs[i].insertBefore(tdElement,trs[i].firstChild);
					newTDelement.setAttribute("style", style);
					newTDelement.appendChild(printingtools.doc.getElementById("spanTD"));
				}
				else {
					trs[i].appendChild(tdElement);
					// This is called when a header exists, with a null value (for example "Subject:");
					// Adding a text node, we restore the original structure
					if (! trs[i].firstChild.childNodes[1]) 
						trs[i].firstChild.appendChild(document.createTextNode(" "));
					tdElement.appendChild(trs[i].firstChild.childNodes[1]);
					trs[i].firstChild.setAttribute("width", "6%");
				}
				trs[i].firstChild.style.verticalAlign = "top";
				trs[i].firstChild.style.paddingRight = "2px";
			}
		}
		if (! noheaders && borders) 
			printingtools.setTableBorders(noExtHeaders);
		else if (! noheaders) {
			if (table1)
				table1.style.color = "black";
			if (table2)
				table2.style.color = "black";
			if (! noExtHeaders && hpref == 2 && table3)
				table3.style.color = "black";
		}
	},

	printSelection : function(contents) {
		try {
			if (printingtools.num && printingtools.num > 1)
				return;
			var divs = printingtools.doc.getElementsByTagName("div");
			for (i=0; i<divs.length; i++) {
				var classe = divs[i].getAttribute("class")
				if ( classe == "moz-text-html" || classe == "moz-text-plain" || classe == "moz-text-flowed" ) {
					var containerDiv = divs[i];
					break;
				}
			}
			containerDiv.innerHTML = "";
			containerDiv.appendChild(contents);
			var ops  = containerDiv.getElementsByTagName("o:p");
			for(i=0;i<ops.length;i++)
				// hides microsoft crap
				ops[i].style.display="none";
			var hideImg = printingtools.prefs.getBoolPref("extensions.printingtools.images.hide");
			if (hideImg  || printingtools.prefs.getBoolPref("extensions.printingtools.images.resize")) 
				printingtools.setIMGstyle(hideImg);
		}
		catch(e) {}
	},
	
	toggleInlinePref : function() {
		printingtools.prefs.setBoolPref("mail.inline_attachments", false);
		setTimeout(function() { printingtools.prefs.setBoolPref("mail.inline_attachments", true); }, 2000);
	},
	
	attCheck : function() {
		try {
			// This avoids priting inline attachments with wrong mimetype (for ex. doc document with text/msword)
			// Text attachments are inside PRE tags
			var pres = printingtools.doc.getElementsByTagName("pre");
			for (i=0;i<pres.length;i++) {
				var initHTML = pres[i].innerHTML.substring(0,200);
				// Office files signature
				var docSignature = "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1";
				// Check if there is the office/RTF file signature
				if (initHTML.indexOf(docSignature) > -1 || initHTML.indexOf("{\\rtf1") > -1) 
					pres[i].parentNode.setAttribute("style", "display:none");
			}
		}
		catch(e) {}
	},

	addName : function(borders) {
	
		try {

		if (printingtools.prefs.getPrefType("extensions.printingtools.headers.addname") > 0) {
			if (printingtools.prefs.getBoolPref("extensions.printingtools.headers.addname"))
				 printingtools.prefs.setIntPref("extensions.printingtools.headers.add_name_type", 1);
			else
				 printingtools.prefs.setIntPref("extensions.printingtools.headers.add_name_type", 0);
			printingtools.prefs.deleteBranch("extensions.printingtools.headers.addname");
		}

		var add_name_type = printingtools.prefs.getIntPref("extensions.printingtools.headers.add_name_type");
		var add_folder = printingtools.prefs.getBoolPref("extensions.printingtools.headers.addfolder");
		if (add_name_type == 0 && ! add_folder)
			return;

		var folder = printingtools.hdr.folder;
		var h3 = printingtools.doc.createElement("h3");
		var folderHtml = "";
		var myname = "&nbsp;"

		if (add_name_type > 0) {	
			
			if (add_name_type == 2) {
				myname = printingtools.getComplexPref("extensions.printingtools.headers.custom_name_value");
			}
			else {
				try {
					var myAccountManager = Components.classes["@mozilla.org/messenger/account-manager;1"].
						getService(Components.interfaces.nsIMsgAccountManager);
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
				catch(e) {}
			}	
		
		}
		if (add_folder) {
			var folderName = folder.name;
			while(true) {
				folder = folder.parent;
				folderName = folder.name + "/" + folderName;
				if (folder.isServer)
					break;
			}
			folderHtml = '<span style="font-size: 12px; margin-left:40px;"><img src="chrome://printmydate/content/icons/folder.gif" class="attIcon">&nbsp;' + folderName + '</span>';
		}
		h3.innerHTML = myname + folderHtml;
		var firsttable = printingtools.getTable(0);
		if (firsttable) {
			firsttable.parentNode.insertBefore(h3,firsttable);
			if (! borders) {
				var hr = printingtools.doc.createElement("hr");
				firsttable.parentNode.insertBefore(hr,firsttable);
			}
		}
			
		}
		catch(e) {}
		Services.console.logStringMessage("finished name");
	},		

	setIMGstyle : function(hide) {
		Services.console.logStringMessage("set image style");
		var imgs = printingtools.doc.getElementsByTagName("img");
		for (i=0;i<imgs.length;i++) {
			if (imgs[i].getAttribute("class") != "attIcon") {
				if (hide)
					imgs[i].setAttribute("style", "display:none !important;");	
				else
					imgs[i].setAttribute("style", "height:auto; width:auto; max-width:100%; max-height:100%;");
			}
		}
	},

	getTable : function(num) {
		// The function check if the requested table exists and if it's an header table
		var tabclass = new Array("header-part1", "header-part2", "header-part3");
		var doc = window.content.document;
		var table = doc.getElementsByTagName("TABLE")[num];
		if (table && table.getAttribute("class") == tabclass[num])
			return table;
		else
			return false;
	},
	
	truncateHeaders : function(maxchars) {
		printingtools.scanTDS(printingtools.getTable(0),maxchars);
		printingtools.scanTDS(printingtools.getTable(1),maxchars);
		printingtools.scanTDS(printingtools.getTable(2),maxchars);
	},

	scanTDS : function(table,maxchars) {
		var textNode;
		if (table) {
			var tableTDS = table.getElementsByTagName("TD");
			for (var i=0; i<tableTDS.length; i++) {
				if (tableTDS[i].getAttribute("id") == "attTD" || tableTDS[i].getAttribute("id") == "receivedDate") { 
					var avChars = maxchars;
					var divs = tableTDS[i].getElementsByTagName("div");
					for (var j=0;j<divs.length;j++) {
						textNode = divs[j].firstChild;
						if ( (avChars - textNode.nodeValue.length) < 0) {
							textNode.nodeValue = textNode.nodeValue.substring(0,avChars) + " [...]";
							break;
						}
						avChars -= textNode.nodeValue.length;
					}
				}
				else {
					textNode = tableTDS[i].getElementsByTagName("div")[0].nextSibling;
					if (! textNode) {
						// This is called when a header exists, with a null value (for example "Subject:");
						// Adding a text node, we restore the original structure
						tableTDS[i].appendChild(document.createTextNode(" "));
					}						
					else if (textNode && textNode.nodeValue && textNode.nodeValue.length > maxchars)
						textNode.nodeValue = textNode.nodeValue.substring(0,maxchars)	+ " [...]";
				}
			}
		}
	},

	hideHeaders : function(hpref) {
		var table1 = printingtools.getTable(0);
		var table2 = printingtools.getTable(1);
		var table3 = printingtools.getTable(2);
		if (table1)
			table1.setAttribute("style","display:none !important");
		if (table2)
			table2.setAttribute("style","display:none !important");
		if (hpref == 2 && table3)
			table3.setAttribute("style","display:none !important");
	},

	setTableBorders : function(noExtHeaders) {
		Services.console.logStringMessage("printing set borders");
		var hpref = printingtools.prefs.getIntPref("mail.show_headers");
		var table1 = printingtools.getTable(0);
		var table2 = printingtools.getTable(1);
		if (noExtHeaders)
			var table3 = null;
		else
			var table3 = printingtools.getTable(2);
		if (table1) {
			if (table2 && table2.getElementsByTagName("tr").length > 0) {
				table1.style.borderLeft ="1px solid black";
				table1.style.borderRight = "1px solid black";
				table1.style.borderTop = "1px solid black";
			}
			else {
				table1.style.border = "1px solid black";
			}
			var tds1 = table1.getElementsByTagName("TD");
			// We process the first row in a different way, to set the top-padding = 3px
			tds1[0].style.padding = "3px 10px 0px 10px";
			for (var i=1; i<tds1.length;i++)
				tds1[i].style.padding = "0px 10px 0px 10px";
		}
		// The style of table-headers 2 is different if exits the table-headers 3 or it doesn't
		if (table2) {
			table2.style.borderLeft = "1px solid black";
			table2.style.borderRight = "1px solid black";
			if (noExtHeaders || hpref != 2)
				table2.style.borderBottom = "1px solid black";

			var tds2 = table2.getElementsByTagName("TD");
			for (i=0; i<tds2.length;i++)
				tds2[i].style.padding = "0px 10px 0px 10px";
		}
		if (table3 && hpref==2) {
			table3.style.borderLeft = "1px solid black";
			table3.style.borderRight = "1px solid black";
			table3.style.borderBottom = "1px solid black";
			var tds3 = table3.getElementsByTagName("TD");
			for (i=0; i<tds3.length;i++)
				tds3[i].style.padding = "0px 10px 0px 10px";
		}
	},

	formatDate : function(msecs, longFormat) {
		var formatted_date = null;
		if (! longFormat)
			longFormat = printingtools.prefs.getIntPref("extensions.printingtools.date.long_format_type");
		try {
			var date_obj = new Date(msecs);
			if (longFormat != 1) 
				var formatted_date = date_obj.toLocaleString();
			else 
				var formatted_date = date_obj.toUTCString();
		}
		catch(e) {}
		return formatted_date;
	},

	correctDate : function() {
		var table = printingtools.getTable(0);
		if (!  table || ! printingtools.hdr)
			return;
		var longFormat = printingtools.prefs.getIntPref("extensions.printingtools.date.long_format_type");
		if (longFormat == 0)
			return;
		var formatted_date = printingtools.formatDate((printingtools.hdr.dateInSeconds * 1000), longFormat);
		if (! formatted_date)
			return;
		var tds = table.getElementsByTagName("TD");
		var node = tds[tds.length-1];		
		if (node) {
			var data = node.childNodes[1].nodeValue;
			node.childNodes[1].nodeValue = formatted_date;
		}	
	},

	appendReceivedTD : function() {
		if (printingtools.hdr) {
			var formatted_date = printingtools.formatDate((printingtools.hdr.getUint32Property("dateReceived")*1000), null);
			if (! formatted_date)
				return;
			var bundle = printingtools.strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
			var headtable1 = printingtools.getTable(0);
			var newTR = printingtools.doc.createElement("TR");
			newTR.setAttribute("id", "recTR");
			var newTD = printingtools.doc.createElement("TD");
			newTD.setAttribute("id", "receivedDate");
			newTD.innerHTML = "<span><b>"+ bundle.GetStringFromName("received")+": </b></span>" + formatted_date;
			newTR.appendChild(newTD);
			if (headtable1 && headtable1.lastChild) {
				var dateTR = headtable1.lastChild.getElementsByTagName("TR")[printingtools.dateTRpos];
				headtable1.lastChild.insertBefore(newTR, dateTR.nextSibling);
			}
		}
	},

	appendAttTD : function(newTD) {
		if (! newTD.innerHTML)
			return;
		Services.console.logStringMessage("print attachment table");
		var bundle = printingtools.strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
		var headtable1 = printingtools.getTable(0);
		var newTR = printingtools.doc.createElement("TR");
		newTR.setAttribute("id", "attTR");
		var newTDhtml = "<span id='spanTD'><b>"+ bundle.GetStringFromName("attachments")+": </b></span>" + newTD.innerHTML;
		newTD.innerHTML = newTDhtml;
		//if (printingtools.prefs.getBoolPref("extensions.printingtools.headers.setborders"))
		//	newTD.setAttribute("style", "padding: 0px 10px;");
		newTR.appendChild(newTD);
		if (headtable1 && headtable1.lastChild)
			headtable1.lastChild.appendChild(newTR);	
	},

	rewriteAttList :function() {
		Services.console.logStringMessage("print rewriteattachment icons");
		console.debug('RewriteAttachmentsList');
		var bundle = printingtools.strBundleService.createBundle("chrome://printmydate/locale/printmydate.properties");
		var firsttime = true;
		var counter = 0;
		var newTD = printingtools.doc.createElement("TD");
		newTD.setAttribute("id", "attTD");
		// takes the second table of the headers (A , CC fields)
		var headtable1 = printingtools.getTable(0);
		var comma = "";
		var withIcon = printingtools.prefs.getBoolPref("extensions.printingtools.process.attachments_with_icon");
		// takes all the TABLE elements of the doc
		var attTable = printingtools.doc.getElementsByTagName("TABLE");

		if (Array.isArray) {  // Thunderbird 5 or higher (different layout)
			var attTab = null;
			for (var i=0;i<attTable.length;i++) {
				var tabclass = attTable[i].getAttribute("class");
				if (attTable[i].getAttribute("class") == "mimeAttachmentTable") {
					attTab = attTable[i];
					break;
				}
			}
			if (attTab) {
				var tds = attTab.getElementsByTagName("TD");
				var attDiv = "";
				for (var i=0;i<tds.length;i=i+2) {
					if (! firsttime)
						comma = ", ";
					else
						firsttime = false;
					var currAtt = tds[i].innerHTML +"&nbsp;("+ tds[i+1].innerHTML+")";
					if (withIcon) {
						var imgSrc = printingtools.findIconSrc(currAtt);				
						currAtt = '<nobr><img src="'+imgSrc+'" class="attIcon">&nbsp;'+currAtt+"</nobr>";
					}	
					attDiv = attDiv + comma + currAtt;			
				}
				newTD.innerHTML = attDiv;
				attTab.parentNode.removeChild(attTab);
			}
		}
		else {
			// skips the first TABLE, that are the headers-part1
			for (var i=0;i<attTable.length;i++) {
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
					if (! firsttime)
						comma = ", ";
					var attDiv = tds[0].innerHTML;
					if (withIcon) {
						var imgSrc = printingtools.findIconSrc(attDiv);				
						attDiv = '<nobr><img src="'+imgSrc+'" class="attIcon">&nbsp;'+attDiv+"</nobr>";
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
			if (opener && printingtools.prefs.getBoolPref("extensions.printingtools.process.add_p7m_vcf_attach")) {
				var attList = opener.document.getElementById("attachmentList");
				if (attList) {
					var atts = attList.childNodes;
						for (var i=0; i<atts.length; i++) {
							if (Array.isArray)
								var attDiv = atts[i].getAttribute("tooltiptext");
							else				
								var attDiv = atts[i].label;
							if (attDiv.lastIndexOf(".p7m")+4 != attDiv.length && attDiv.lastIndexOf(".vcf")+4 != attDiv.length)
								continue;
							if (! firsttime)
								comma = ", ";
							if (Array.isArray)
								attDiv = atts[i].label;
							if (printingtools.prefs.getBoolPref("extensions.printingtools.process.attachments_with_icon")) {
								Services.console.logStringMessage("print attachment icons");
								console.debug('AttachmentIcons');
								var imgSrc = printingtools.findIconSrc(attDiv);				
								attDiv = '<nobr><img src="'+imgSrc+'" class="attIcon">&nbsp;'+attDiv+"</nobr>";
							}
							// write into the new TD innerHTML the name of the attachment, if necessary with a comma
							newTD.innerHTML = newTD.innerHTML + comma + attDiv;
							firsttime = false;
						}
				}
			}
		}
		catch(e) {}
		
		if (newTD) 
			printingtools.appendAttTD(newTD);
		printingtools.sortHeaders();
		if (printingtools.prefs.getBoolPref("extensions.printingtools.add_received_date"))
			printingtools.appendReceivedTD();
					
		if (! String.trim) {
			// TB2 and lower
			// removes the HR elements, in the same numbers of the attachments, beginning from the last one
			var hrs = printingtools.doc.getElementsByTagName("HR");
			var hrsLength = hrs.length;
			for (var i=hrsLength -1;i>hrsLength -counter;i--) 
				hrs[i].parentNode.removeChild(hrs[i]);
		}
		else {	
			// TB3 or higher
			// removes all the FIELDSET elements with class = mimeAttachmentHeader
			var fieldSets = printingtools.doc.getElementsByTagName("FIELDSET");
			for (var i=fieldSets.length-1;i>-1;i--) {
				if (fieldSets[i].getAttribute("class") == "mimeAttachmentHeader")
					fieldSets[i].parentNode.removeChild(fieldSets[i]);
			}
		}
	},

	findIconSrc : function(filename) {
		Services.console.logStringMessage("printing find icons " + filename);
		console.debug('icon ' + filename);
		var url;
		var ext = filename.substring(filename.lastIndexOf("&")-3);
		Services.console.logStringMessage("printing find icons extension1 " + ext);
		console.debug('extension ' + ext);
		ext = ext.substring(0,3).toLowerCase();
		Services.console.logStringMessage("printing find icons extension2 " + ext);

		switch(ext) {
			case "doc":
			case "eml":
			case "gif":
			case "jpg":
			case "ods":
			case "odt":
			case "pdf":
			case "png":
			case "ppt":
			case "rtf":
			case "txt":
			case "vcf":
			case "xls":
			case "xml":
			case "zip":
				url = "chrome://printmydate/content/icons/"+ext+".gif";
				break;
			case "avi":
			case "mpg":
			case "mp3":
			case "wav":
			case "wmv":
			case "wma":
				url = "chrome://printmydate/content/icons/media.gif";
			default:
				url = "chrome://printmydate/content/icons/file.gif";
		}
		console.debug(url);
		return url;
	}
}	

window.addEventListener("DOMContentLoaded", printingtools.loadContentListener, false);
