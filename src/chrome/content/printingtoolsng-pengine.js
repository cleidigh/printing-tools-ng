/*
	PrintingTools NG is a derivative extension for Thunderbird 68+
	providing printing tools for messages.
	The derivative extension authors:
		Copyright (C) 2023 : Christopher Leidigh

	The original extension & derivatives, PrintingTools, by Paolo "Kaosmos",
	is covered by the GPLv3 open-source license (see LICENSE file).
		Copyright (C) 2007 : Paolo "Kaosmos"

	PrintingTools NG is free software: you can redistribute it and/or modify
		it under the terms of the GNU General Public License as published by
		the Free Software Foundation, either version 3 of the License, or
		(at your option) any later version.

		This program is distributed in the hope that it will be useful,
		but WITHOUT ANY WARRANTY; without even the implied warranty of
		MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
		GNU General Public License for more details.

		You should have received a copy of the GNU General Public License
		along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

		var { MailE10SUtils } = ChromeUtils.import("resource:///modules/MailE10SUtils.jsm");

		var st = {};
		Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/strftime.js", st);
		Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/utils.js");
		
		var { printerSettings } = ChromeUtils.import("chrome://printingtoolsng/content/printerSettings.js");
		
		var mail3paneWin = Services.wm.getMostRecentWindow("mail:3pane");
		
		if (window == mail3paneWin) {
			console.log("PTNG: Engine loaded ")
			printerSettings.addPrintPreviewObserver();
		}
		
		var printingtools = {
		
			current: null,
			num: null,
			prefs: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
			maxChars: null,
			strBundleService: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
			mainStrBundle: null,
			previewDoc: null,
			msgUris: [],
			attList: null,
			running: false,
			extRunning: false,
			externalQ: [],
			msgRestoration: {},
		
			WEXT_cmd_print: async function (data) {
				let tabId = data.tabId;
				let windowId = data.windowId;
		
				let windowObject = window.printingtoolsng.extension.windowManager.get(windowId);
				let realWindow = windowObject.window;
		
				if (realWindow !== window) {
					return;
				}
		
				await printingtools.cmd_printng();
				return true;
			},
		
			getMessageWindow: function (tabId) {
				// Get about:message from the tabId.
				let { nativeTab } = window.printingtoolsng.extension.tabManager.get(tabId);
				if (nativeTab instanceof Ci.nsIDOMWindow) {
					return nativeTab.messageBrowser.contentWindow
				} else if (nativeTab.mode && nativeTab.mode.name == "mail3PaneTab") {
					return nativeTab.chromeBrowser.contentWindow.messageBrowser.contentWindow
				} else if (nativeTab.mode && nativeTab.mode.name == "mailMessageTab") {
					return nativeTab.chromeBrowser.contentWindow;
				}
				return null;
			},
		
			/** Prints the messages selected in the thread pane. */
			PrintSelectedMessages: async function (options) {
		
				var dbgopts = this.prefs.getCharPref("extensions.printingtoolsng.debug.options");
				printingtools.current = 0;
				printingtools.msgUris = [];
		
				let url2 = await window.ptngAddon.notifyTools.notifyBackground({ command: "getCurrentURL" });
		
				let msgList = await window.ptngAddon.notifyTools.notifyBackground({ command: "getSelectedMessages" });
				msgList.messages.forEach(msg => {
					let realMessage = window.printingtoolsng.extension
						.messageManager.get(msg.id);
					try {
						let uri = realMessage.folder.getUriForMsg(realMessage);
						printingtools.msgUris.push(uri)
					} catch { }
				});
		
				if (url2 && printingtools.msgUris.length == 0) {
					printingtools.msgUris.push(url2)
		
				}
		
				printingtools.num = printingtools.msgUris.length;
		
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PTNG: selectedMessageUris", printingtools.msgUris);
				}
		
				if (!printingtools.num) {
					return;
				}
		
				var url = await window.ptngAddon.notifyTools.notifyBackground({ command: "getCurrentURL" });
		
				// loadptng settings 
		
				if (this.prefs.getBoolPref("extensions.printingtoolsng.printer.persistent") &&
					this.prefs.getPrefType("extensions.printingtoolsng.print_printer") &&
					this.prefs.getStringPref("extensions.printingtoolsng.print_printer") !== ""
				) {
					printerSettings.forcePrinterToPTNGPrinter();
				}
				await printerSettings.savePrinterSettingsFromPTNGsettings();
		
				var ps = mail3paneWin.PrintUtils.getPrintSettings();
				// overlay ptng ps like pageRanges not saved in prefs, fixes #195
				ps = printerSettings.setPrinterSettingsFromPTNGsettings(ps);
		
				var pdfOutput = false;
				var pdfOutputEnabled = printingtools.prefs.getBoolPref("extensions.printingtoolsng.pdf.enable_pdf_output_dir");
				var pdfOutputDir = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.output_dir");
				var sel = document.commandDispatcher.focusedWindow.getSelection();
		
				if (ps.printerName.toLowerCase().includes("pdf") &&
					printingtools.num == 1 && options.printSilent == false
				) {
					pdfOutput = true;
		
					if (dbgopts.indexOf("pdfoutput") > -1) {
						console.log("PTNG: PDF Output using      : ", ps.printerName);
						console.log("PTNG: PDF Output Dir enabled: ", pdfOutputEnabled);
						console.log("PTNG: Output directory (cfg): ", pdfOutputDir);
					}
					var autoPDFSave = false;
					if (pdfOutputEnabled && pdfOutputDir !== "" && options.printSilent == false && sel.rangeCount == 0) {
						autoPDFSave = confirm(this.mainStrBundle.GetStringFromName("confirm_pdf_autosave"));
						var dbgopts = this.prefs.getCharPref("extensions.printingtoolsng.debug.options");
						if (dbgopts.indexOf("pdfoutput") > -1) {
							console.log("PTNG: PDF Output autosave : ", autoPDFSave);
						}
					}
				}
		
				if (printingtools.num == 1 && options.printSilent == false && !autoPDFSave) {
		
					if (url !== "undefinedURL") {
		
						var messagePaneBrowser;
		
						if (window.document.URL.endsWith("messenger.xhtml")) {
							var mail3PaneTabBrowser1Doc = gTabmail.currentTabInfo.chromeBrowser.contentDocument;
		
							if (mail3PaneTabBrowser1Doc.getElementById("messagepane")) {
								messagePaneBrowser = mail3PaneTabBrowser1Doc.getElementById("messagepane")
							} else {
								let messageBrowserDoc = mail3PaneTabBrowser1Doc.getElementById("messageBrowser").contentDocument;
								messagePaneBrowser = messageBrowserDoc.getElementById("messagepane")
							}
		
						} else {
							try {
								messagePaneBrowser = document.getElementById("messageBrowser").contentDocument.getElementById("messagepane");
							} catch {
								messagePaneBrowser = document.getElementById("messagepane");
							}
						}
		
						// Load the only message in a hidden browser, then use the print preview UI.
						let uri = printingtools.msgUris[0];
						if (dbgopts.indexOf("pdfoutput") > -1) {
							console.log("PTNG: Single message, Use existing print messagePane")
							console.log("PTNG: Message uri: ", uri);
						}
		
						printingtools.previewDoc = messagePaneBrowser.contentDocument;
		
						var ht1 = printingtools.previewDoc.querySelector('.moz-header-part1');
						var ht2 = printingtools.previewDoc.querySelector('.moz-header-part2');
						var ht3 = printingtools.previewDoc.querySelector('.moz-header-part3');
		
						var ht1c = ht1.cloneNode(true)
						ht1c.classList.add("orig")
		
						if (ht2) {
							var ht2c = ht2.cloneNode(true);
						}
		
						if (ht3) {
							var ht3c = ht3.cloneNode(true);
						}
		
						await printingtools.reformatLayout();
		
						var sel = window.getSelection();
		
						var topSelection;
		
						var th = printingtools.previewDoc.querySelector('.ptng-tophdr');
						if (th) {
							topSelection = th;
						} else {
							topSelection = printingtools.previewDoc.querySelector('table');
						}
		
		
						const br = printingtools.previewDoc.querySelector('br');
						br.setAttribute("id", "sep1")
						//console.log(t)
						// Create new range for the page and main headers 
						const range = new Range();
		
						// Start range at the top
						range.setStartBefore(topSelection);
		
						// End range at the br spacer
						range.setEndAfter(br);
		
						//var selection = document.commandDispatcher.focusedWindow.getSelection();
						var selection = messagePaneBrowser.contentWindow.getSelection()
		
						// Carret selection not valid
						if (selection.type == "Caret") {
							selection.removeAllRanges();
						}
		
						if (selection.rangeCount) {
							selection.addRange(range);
						}
		
						var w = document.commandDispatcher.focusedWindow
		
						// Use message pane focus event to restore message 
		
						var l = w.addEventListener("focus", function (e) {
		
							//console.log("Message pane focused  ")
		
							// Remove headers selection 
							if (selection.rangeCount) {
								selection.removeRange(range)
							}
		
		
							var mht1 = printingtools.previewDoc.querySelector('.moz-header-part1');
							var mht2 = printingtools.previewDoc.querySelector('.moz-header-part2');
							var mht3 = printingtools.previewDoc.querySelector('.moz-header-part3');
		
							var body_elem = mht1.parentElement
		
							mht1.remove();
		
							if (mht2) {
								mht2.remove();
							}
		
							if (mht3) {
								mht3.remove();
							}
		
							var th = printingtools.previewDoc.querySelector('.ptng-tophdr');
							if (th) {
								th.remove();
							}
		
							var hr = printingtools.previewDoc.querySelector('hr');
							if (hr) {
								hr.remove();
							}
		
							if (ht3c) {
								body_elem.prepend(ht3c);
							}
		
							if (ht2c) {
								body_elem.prepend(ht2c);
							}
							body_elem.prepend(ht1c);
		
							printingtools.showAttatchmentBodyTable();
							printingtools.restoreIMGstyle();
		
							// restore msg fonts
							if (printingtools.msgRestoration.msgFontFamilyOrig) {
								printingtools.msgRestoration.msgDiv.style.fontFamily = printingtools.msgRestoration.msgFontFamilyOrig;
							}
		
							if (printingtools.msgRestoration.msgFontSizeOrig) {
								printingtools.msgRestoration.msgDiv.style.fontSize = printingtools.msgRestoration.msgFontSizeOrig;
							}
		
							try {
								printingtools.doc.styleSheets[0].deleteRule(printingtools.msgRestoration.ruleIndex);
							} catch {
		
							}
		
						}, { once: true });
		
						if (dbgopts.indexOf("pdfoutput") > -1 && pdfOutput) {
							console.log("PTNG: Message URI: ", uri);
						}
		
						if (selection.rangeCount > 1) {
							//console.log("print selection")
							top.PrintUtils.startPrintWindow(messagePaneBrowser.browsingContext, { printSelectionOnly: true });
						} else {
							//console.log("print no selection")
							top.PrintUtils.startPrintWindow(messagePaneBrowser.browsingContext, {});
						}
		
					} else {
						let uri = printingtools.msgUris[0];
		
						if (dbgopts.indexOf("trace1") > -1) {
							console.log("PTNG: Use PrintUtils browser",);
							console.log("PTNG: Message uri: ", uri);
						}
		
						if (!uri) {
							return;
						}
		
						var MailService = MailServices.messageServiceFromURI(uri);
		
						// This is key to flushing cache else we operate on modified browser
						await top.PrintUtils.loadPrintBrowser("chrome://printingtoolsng/content/test.html");
		
						await top.PrintUtils.loadPrintBrowser(MailService.getUrlForUri(uri).spec);
						printingtools.previewDoc = top.PrintUtils.printBrowser.contentDocument
		
						await printingtools.reformatLayout();
		
						top.PrintUtils.startPrintWindow(PrintUtils.printBrowser.browsingContext);
					}
		
					return;
				}
		
				if (printingtools.num < 1) {
					return;
				}
		
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PTNG: Use existing print hidden pane - multiple messages (" + printingtools.msgUris.length + ")");
					console.log("PTNG: msgUris: ", printingtools.msgUris);
				}
		
		
				// Multiple messages. Get the printer settings, then load the messages into
				// a hidden browser and print them one at a time.
		
				if (dbgopts.indexOf("msprompt") > -1) {
					try {
						await Cc["@mozilla.org/widget/printdialog-service;1"]
							.getService(Ci.nsIPrintDialogService)
							.showPrintDialog(browsingContext.topChromeWindow, false, ps);
					} catch (e) {
						if (e.result == Cr.NS_ERROR_ABORT) {
							return;
						}
					}
					this.prefs.setCharPref("print_printer", ps.printerName);
					await printerSettings.savePrinterSettingsFromPTNGsettings();
					ps = top.PrintUtils.getPrintSettings();
					// overlay ptng ps like pageRanges not saved in prefs, fixes #195
					ps = printerSettings.setPrinterSettingsFromPTNGsettings(ps);
				}
		
				if (ps.printerName.toLowerCase().includes("pdf")) {
					pdfOutput = true;
		
					if (dbgopts.indexOf("pdfoutput") > -1) {
						console.log("PTNG: PDF Output using      : ", ps.printerName);
						console.log("PTNG: PDF Output Dir enabled: ", pdfOutputEnabled);
						console.log("PTNG: Output directory (cfg): ", pdfOutputDir);
					}
		
					if (!pdfOutputEnabled || pdfOutputDir == "") {
						let fpMode = Ci.nsIFilePicker.modeGetFolder;
		
						let fpTitle = this.mainStrBundle.GetStringFromName("select_pdf_dir");
						let fpDisplayDirectory = null;
						this.utils.window = window;
						let resultObj = await this.utils.openFileDialog(fpMode, fpTitle, fpDisplayDirectory, Ci.nsIFilePicker.filterAll);
						if (resultObj.result == -1) {
							return;
						}
						pdfOutputDir = resultObj.folder;
						//printingtools.prefs.setStringPref("extensions.printingtoolsng.pdf.output_dir", pdfOutputDir)
						if (dbgopts.indexOf("pdfoutput") > -1) {
							console.log("PTNG: Output directory (sel): ", pdfOutputDir);
						}
					} else {
						// console.log("")
		
					}
				}
		
				ps.printSilent = false;
		
				var msgSubject;
				var pdfFileName;
		
				var currentPrinterName = this.prefs.getCharPref("print_printer");
		
				for (let msgURI of printingtools.msgUris) {
					var MailService = MailServices.messageServiceFromURI(msgURI);
					let msgHdr = top.messenger.msgHdrFromURI(msgURI);
					msgSubject = msgHdr.mime2DecodedSubject;
		
					if (pdfOutput) {
						pdfFileName = await this.utils.constructPDFoutputFilename(msgURI, pdfOutputDir);
						ps.toFileName = PathUtils.join(pdfOutputDir, pdfFileName);
						ps.outputFormat = Ci.nsIPrintSettings.kOutputFormatPDF;
						if (ps.outputDestination !== undefined) {
							ps.outputDestination = Ci.nsIPrintSettings.kOutputDestinationFile;
						}
						if (dbgopts.indexOf("pdfoutput") > -1 && pdfOutput) {
							console.log("PTNG: Message URI: ", msgURI);
							console.log("PTNG: Filename: ", pdfFileName);
							console.log("PTNG: toFilename: ", ps.toFileName);
							console.log("PTNG: pageRanges: ", ps.pageRanges);
						}
					}
					if (!top.PrintUtils.printBrowser) {
						console.log(window)
						console.log(top)

						let messagePaneBrowser;
						if (window.document.URL.endsWith("messenger.xhtml") || window.document.URL.endsWith("messageWindow.xhtml")) {
							messagePaneBrowser = document.getElementById("messageBrowser").contentDocument.getElementById("messagepane");
						} else {
						   messagePaneBrowser = document.getElementById("messagepane");

						}
						console.log(messagePaneBrowser)

						messagePaneBrowser.browsingContext.print(ps);
					} else {
						//console.log("use pb print")
						// This is key to flushing cache else we operate on modified browser
						await top.PrintUtils.loadPrintBrowser("chrome://printingtoolsng/content/test.html");
						await top.PrintUtils.loadPrintBrowser(MailService.getUrlForUri(msgURI).spec);
		
						// getUrlForUri
						printingtools.previewDoc = top.PrintUtils.printBrowser.contentDocument
						await printingtools.reformatLayout();
		
						await top.PrintUtils.printBrowser.browsingContext.print(ps);
					}
		
					if (pdfOutput) {
						this.utils.PTNG_WriteStatus(this.mainStrBundle.GetStringFromName("writing") + ": " + pdfFileName);
					} else {
						this.utils.PTNG_WriteStatus(this.mainStrBundle.GetStringFromName("printing") + ": " + msgSubject);
					}
				}
				this.prefs.setCharPref("print_printer", currentPrinterName);
			},
		
			getMessagePaneBrowser: function (b) {
				return document.getElementById("messagepane");
			},
		
			PrintExternalMsg: async function (msgURI) {
				var dbgopts = this.prefs.getCharPref("extensions.printingtoolsng.debug.options");
				printingtools.current = 0;
				printingtools.num = 1;
				printingtools.msgUris = [msgURI];
		
		
				if (this.prefs.getBoolPref("extensions.printingtoolsng.printer.persistent") &&
					this.prefs.getPrefType("extensions.printingtoolsng.print_printer") &&
					this.prefs.getStringPref("extensions.printingtoolsng.print_printer") !== ""
				) {
					printerSettings.forcePrinterToPTNGPrinter();
				}
		
				await printerSettings.savePrinterSettingsFromPTNGsettings();
				let ps = top.PrintUtils.getPrintSettings();
				// overlay ptng ps like pageRanges not saved in prefs, fixes #195
				ps = printerSettings.setPrinterSettingsFromPTNGsettings(ps);
		
				var pdfOutput = false;
				var pdfOutputEnabled;
				var pdfOutputDir;
		
				if (ps.printerName.toLowerCase().includes("pdf")) {
					pdfOutput = true;
					pdfOutputEnabled = printingtools.prefs.getBoolPref("extensions.printingtoolsng.pdf.enable_pdf_output_dir");
					pdfOutputDir = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.output_dir");
		
					if (!pdfOutputEnabled || pdfOutputDir == "") {
						let fpMode = Ci.nsIFilePicker.modeGetFolder;
						let fpTitle = this.mainStrBundle.GetStringFromName("select_pdf_dir");
						let fpDisplayDirectory = null;
						this.utils.window = window;
						let resultObj = await this.utils.openFileDialog(fpMode, fpTitle, fpDisplayDirectory, Ci.nsIFilePicker.filterAll);
						if (resultObj.result == -1) {
							return;
						}
						pdfOutputDir = resultObj.folder;
					} else {
						if (dbgopts.indexOf("trace1") > -1) {
							console.log("PTNG: PDF output to: ", pdfOutputDir);
						}
					}
				}
		
				
				if (pdfOutput) {
		
					pdfFileName = await this.utils.constructPDFoutputFilename(msgURI, pdfOutputDir);
					ps.toFileName = PathUtils.join(pdfOutputDir, pdfFileName);
					ps.outputFormat = Ci.nsIPrintSettings.kOutputFormatPDF;
					if (ps.outputDestination !== undefined) {
						ps.outputDestination = Ci.nsIPrintSettings.kOutputDestinationFile;
					}
		
				}
				let messageService = MailServices.messageServiceFromURI(msgURI);
				let msgHdr = top.messenger.msgHdrFromURI(msgURI);
				let msgSubject = msgHdr.mime2DecodedSubject;
		
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PTNG: Print Ext: ", msgSubject);
				}
				await top.PrintUtils.loadPrintBrowser("chrome://printingtoolsng/content/test.html");
				await top.PrintUtils.loadPrintBrowser(messageService.getUrlForUri(msgURI).spec);
		
				printingtools.previewDoc = top.PrintUtils.printBrowser.contentDocument
				await printingtools.reformatLayout();
		
				await top.PrintUtils.printBrowser.browsingContext.print(ps);
		
				if (pdfOutput) {
					this.utils.PTNG_WriteStatus(this.mainStrBundle.GetStringFromName("writing") + " (Ext): " + pdfFileName);
				} else {
					this.utils.PTNG_WriteStatus(this.mainStrBundle.GetStringFromName("printing") + " (Ext): " + msgSubject);
				}
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PTNG: Print Ext Done: ", msgSubject);
				}
			},
		
			cmd_printng_external: async function (extMsgReq) {
				var dbgopts = this.prefs.getCharPref("extensions.printingtoolsng.debug.options");
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PrintingTools NG Received a message from external add-on", extMsgReq.messageHeader);
				}
		
				let msgHeader = extMsgReq.messageHeader;
		
				if (!msgHeader.id) {
					if (dbgopts.indexOf("trace1") > -1) {
						console.log("PTNG: No useful id for message");
					}
					return;
				}
		
				let realMessage = window.printingtoolsng.extension
					.messageManager.get(msgHeader.id);
		
				let uri = realMessage.folder.getUriForMsg(realMessage);
		
				if (this.extRunning) {
					//console.log("Q dont run")
					//console.log(this.externalQ)
					this.externalQ.push(uri);
					//console.log(this.externalQ)
		
					return;
				} else {
					//console.log("Q and run")
					//console.log(this.externalQ)
					this.externalQ.push(uri);
					//console.log(this.externalQ)
				}
		
				this.extRunning = true;
				var extMsgURI;
		
				while (this.externalQ.length) {
					//console.log("grab next ");
					//console.log(this.externalQ)
					extMsgURI = this.externalQ.shift()
					//console.log(this.externalQ)
		
					//console.log(extMsgURI)
		
					await this.PrintExternalMsg(extMsgURI);
					//console.log("after q ");
				}
				this.extRunning = false;
		
				return;
		
			},
		
		
			cmd_printng: async function (options) {
				var dbgopts = printingtools.prefs.getCharPref("extensions.printingtoolsng.debug.options");
		
		
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PTNG: cmd_printng start: options : ", options);
				}
		
		
				var allWin = await window.ptngAddon.notifyTools.notifyBackground({ command: "windowsGetAll", options: { populate: true } });
				var curWin = allWin.find(win => win.focused)
		
				var curTab = curWin.tabs.find(tab => tab.active);
				var mailType = false;
		
				if (curTab.mailTab) {
					mailType = true;
				} else if (curTab.type == "messageDisplay") {
					mailType = true;
				}
		
		
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PTNG: current window: ", curWin);
					console.log("PTNG: current tab: ", curTab);
					console.log("PTNG: tab type : ", curTab.type);
					console.log("PTNG: tab url: ", curTab.url);
					console.log("PTNG: mailType: ", mailType);
					if (!mailType) {
						console.log("PTNG: resorting to TB cmd_print()");
					}
				}
		
				if (!mailType) {
					goDoCommand("cmd_print");
					return;
				}
		
				options = options || {};
		
				if (options.printSilent == null) {
					options.printSilent = printingtools.prefs.getBoolPref("extensions.printingtoolsng.print.silent");
				}
		
				this.running = true;
		
				await printingtools.PrintSelectedMessages(options);
				if (dbgopts.indexOf("trace1") > -1) {
					console.log("PTNG: Done")
				}
		
				this.running = false;
		
				return;
		
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
		
			sanitizeHeaders: function () {
		
		
				//console.log(printingtools.doc.documentElement.outerHTML);
		
				var bundle;
		
				if (Services.locale.appLocaleAsBCP47 === "ja") {
					bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/headers-ja.properties");
				} else if (Services.locale.appLocaleAsBCP47 === "zh-CN") {
					bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/headers-zh.properties");
				} else if (Services.locale.appLocaleAsBCP47 === "zh-TW") {
					bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/headers-zh-tw.properties");
				} else {
					bundle = printingtools.strBundleService.createBundle("chrome://messenger/locale/mime.properties");
				}
		
				// Add trimEnd to remove some odd endings like nbsp in fr mime.properties #190
				var dateEnUS = "Date";
				var toEnUS = "To";
				var dateLocalized = bundle.GetStringFromID(1007).trimEnd();
				var toLocalized = bundle.GetStringFromID(1012).trimEnd();
		
				var regExp = new RegExp("(\\p{L}*)\\s*:", 'u');
				var table0 = printingtools.getTable(0);
				var trs0 = [...table0.getElementsByTagName("TR")];
		
				t0hdrs = trs0.map(tr => {
					let hdr = tr.firstChild.firstChild.textContent.match(regExp)[1];
					let hdrVal = tr.firstChild.firstChild.nextSibling.textContent;
					return { hdr: hdr, hdrVal: hdrVal }
				});
				//console.log(t0hdrs)
		
				let dateHdr = t0hdrs.find(h => h.hdr == dateLocalized || h.hdr == dateEnUS);
				//console.log(dateHdr)
		
				if (!dateHdr) {
					printingtools.addHdr(dateLocalized, new Date().toLocaleString(), trs0[0].parentNode), true;
				}
		
				//console.log(printingtools.doc.documentElement.outerHTML);
		
				var table1 = printingtools.getTable(1);
				if (!table1) {
					return;
				}
		
				var trs1 = [...table1.getElementsByTagName("TR")];
		
				if (!trs1 || trs1.length < 1) {
		
					return;
				}
		
				//trs1.map(e => console.log(e.outerHTML))
		
				t1hdrs = trs1.map(tr => {
					let hdr = tr.firstChild.firstChild.textContent.match(regExp)[1];
					let hdrVal = tr.firstChild.firstChild.nextSibling.textContent;
					return { hdr: hdr, hdrVal: hdrVal }
				});
		
				if (Services.locale.appLocaleAsBCP47 === "zh-TW") {
					if (t1hdrs.find(h => h.hdr == '到')) {
						trs1[0].firstChild.firstChild.textContent = toLocalized + ':';
						t1hdrs[0].hdr = toLocalized;
					}
				}
		
		
				let toHdr = t1hdrs.find(h => h.hdr == toLocalized || h.hdr == toEnUS);
		
				if (!toHdr) {
					//console.log("no to hdr")
					printingtools.addHdr(toLocalized, "empty", trs1[0].parentNode), true;
				}
				//console.log(printingtools.doc.documentElement.outerHTML);
		
				return
		
			},
		
			addHdr(hdrName, hdrVal, parent, hide) {
		
				var dummyHdr = printingtools.previewDoc.createElement("TR");
				var dummyHdrTD = printingtools.previewDoc.createElement("TD");
				var dummyHdrDIV = printingtools.previewDoc.createElement("DIV");
		
				dummyHdrDIV.classList.add("moz-header-display-name");
				dummyHdrDIV.innerText = hdrName + ":";
		
				dummyHdrTD.appendChild(dummyHdrDIV);
				var t = printingtools.previewDoc.createTextNode(hdrVal);
				dummyHdrTD.appendChild(t)
				dummyHdr.appendChild(dummyHdrTD);
				dummyHdr.classList.add("ptng-hide-dummyhdr");
				parent.appendChild(dummyHdr);
		
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
				//console.log("idx " + string + " " + index)
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
				// Services.console.logStringMessage(Services.locale.appLocaleAsBCP47);
		
				if (Services.locale.appLocaleAsBCP47.split('-')[0] === "ja") {
					bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/headers-ja.properties");
				} else if (Services.locale.appLocaleAsBCP47 === "zh-CN") {
					bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/headers-zh.properties");
				} else if (Services.locale.appLocaleAsBCP47 === "zh-TW") {
					bundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/headers-zh-tw.properties");
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
				var toPresent = false;
				var fromPresent = false;
		
				var div;
				var divHTML;
		
				for (var i = 0; i < trs.length; i++) {
					div = trs[i].firstChild.firstChild;
					divHTML = div.innerHTML;
					if (Services.locale.appLocaleAsBCP47.split('-')[0] === "ja") {
						divHTML = div.innerHTML.replace("Subject:", subject + ':');
						divHTML = divHTML.replace("Date:", date + ':');
						divHTML = divHTML.replace("To:", to + ':');
						divHTML = divHTML.replace("From:", from + ':');
						divHTML = divHTML.replace("Attachments:", attachments + ':');
						div.innerHTML = divHTML;
						// var divHTML = div.innerHTML.replace(":", );
					} else if (Services.locale.appLocaleAsBCP47.split('-')[0] === "zh") {
						divHTML = divHTML.replace("From:", from + ':');
						if (divHTML) {
							div.innerHTML = divHTML;
						}
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
						fromPresent = true;
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
						if (index & 0x100 || trs[i].classList.contains("ptng-hide-dummyhdr")) {
							arr[index &= ~0x100] = trs[i];
							arr[index &= ~0x100].style.display = "none";
							printingtools.dateTRpos = index &= ~0x100;
							//console.log("datepos" + index)
						} else {
							arr[index] = trs[i];
							printingtools.dateTRpos = index;
							//console.log("datepos" + index)
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
					//console.log("sort " + Services.locale.appLocaleAsBCP47)
					for (var i = 0; i < trs.length; i++) {
						var div = trs[i].firstChild.firstChild;
						var divHTML = div.innerHTML.replace(/\&nbsp;/g, " ");
		
						if (Services.locale.appLocaleAsBCP47 === "zh-TW") {
							var div = trs[i].firstChild.firstChild;
		
							if (divHTML.indexOf(bcc) == 0) {
								divHTML = bcc + ":";
								div.innerHTML = divHTML;
								//console.log("rpl bcc " + div.outerHTML)
							}
							if (divHTML.indexOf(cc) == 0) {
								divHTML = cc + ":";
								div.innerHTML = divHTML;
								//console.log("rpl cc " + div.outerHTML)
							}
						}
		
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
								cc = "Cc";
								bcc = "Bcc";
							}
						} else if (Services.locale.appLocaleAsBCP47.split('-')[0] === "zh") {
							if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always")) {
								var div = trs[i].firstChild.firstChild;
								if (divHTML.indexOf(bcc) > -1) {
									divHTML = divHTML.replace(bcc, "Bcc");
									bcc = "Bcc";
								}
								if (divHTML.indexOf(cc) > -1) {
									divHTML = divHTML.replace(cc, "Cc");
									cc = "Cc";
								}
							}
							div.innerHTML = divHTML;
						} else if (Services.locale.appLocaleAsBCP47.split('-')[0] === "en") {
							if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always")) {
								var div = trs[i].firstChild.firstChild;
								divHTML = divHTML.replace("BCC:", "Bcc:");
								divHTML = divHTML.replace("CC:", "Cc:");
								div.innerHTML = divHTML;
								cc = "Cc";
								bcc = "Bcc";
							}
		
		
						} else if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always")) {
							var div = trs[i].firstChild.firstChild;
							if (divHTML.indexOf(bcc) > -1) {
								divHTML = divHTML.replace(bcc, "Bcc");
								bcc = "Bcc";
							}
							if (divHTML.indexOf(cc) > -1) {
								divHTML = divHTML.replace(cc, "Cc");
								cc = "Cc";
							}
							div.innerHTML = divHTML;
						}
		
						// Services.console.logStringMessage(divHTML.outerHTML);
						regExp = new RegExp(to + "\\s*:");
						if (divHTML.match(regExp)) {
							index = printingtools.getIndexForHeader("%r1");
							toPresent = true;
							// Services.console.logStringMessage('to');
							if (index & 0x100 || trs[i].classList.contains("ptng-hide-dummyhdr")) {
								arr[index &= ~0x100] = trs[i];
								arr[index &= ~0x100].style.display = "none";
							} else {
								arr[index] = trs[i];
							}
							// Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
							// Services.console.logStringMessage(`header entry: ${trs[i].outerHTML}`);
							continue;
						}
						//console.log("bcc = " + bcc)
						//console.log(divHTML)
						regExp = new RegExp(bcc + ".*:");
						index = printingtools.getIndexForHeader("%r3");
						//console.log(divHTML.indexOf(bcc))
						//console.log("check bcc")
						if (divHTML.indexOf(bcc) == 0) {
							//Services.console.logStringMessage('bcc');
							bccPresent = true;
		
							if (index & 0x100) {
								arr[index &= ~0x100] = trs[i];
								arr[index &= ~0x100].style.display = "none";
							} else {
								trs[i].firstChild.classList.add("bccHdr");
								arr[index] = trs[i];
							}
							//Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
							continue;
						}
						//console.log("check cc")
						regExp = new RegExp(cc + ".*:");
						index = printingtools.getIndexForHeader("%r2");
						if (divHTML.indexOf(cc) == 0) {
							//Services.console.logStringMessage('cc');
							//Services.console.logStringMessage(`header entry: ${index} ${trs[i].outerHTML}`);
							ccPresent = true;
		
							if (index & 0x100) {
								arr[index &= ~0x100] = trs[i];
								arr[index &= ~0x100].style.display = "none";
							} else {
								arr[index] = trs[i];
							}
							//Services.console.logStringMessage(`header entry: ${trs[i].outerHTML}`);
							continue;
						}
					}
					// Services.console.logStringMessage(table1.outerHTML);
		
				}
		
				//console.log(arr)
				index = printingtools.getIndexForHeader("%s");
				let subjectIndex = index &= ~0x100;
		
				index = printingtools.getIndexForHeader("%a");
				let attIndex = index &= ~0x100;
		
				index = printingtools.getIndexForHeader("%f");
				let fromIndex = index &= ~0x100;
		
				index = printingtools.getIndexForHeader("%r1");
				let toIndex = index &= ~0x100;
				index = printingtools.getIndexForHeader("%r2");
				let ccIndex = index &= ~0x100;
				index = printingtools.getIndexForHeader("%r3");
				let bccIndex = index &= ~0x100;
		
				let tempPos = printingtools.dateTRpos;
		
				if (!fromPresent && fromIndex < printingtools.dateTRpos) {
					tempPos--;
				}
		
				if (!toPresent && toIndex < printingtools.dateTRpos) {
					tempPos--;
				}
		
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
					//tempPos--;
				}
		
				printingtools.dateTRpos = tempPos;
		
				var tbody = table1.firstChild;
				for (var i = 0; i < arr.length; i++) {
					if (arr[i])
						tbody.appendChild(arr[i]);
				}
		
				//Services.console.logStringMessage("after sort");
				//Services.console.logStringMessage(`${table1.outerHTML} ${printingtools.dateTRpos}`);
			},
		
			getHdr: async function () {
				//var uris = window.arguments[1];
				var uris = printingtools.msgUris;
		
				var m = Cc["@mozilla.org/messenger;1"]
					.createInstance(Ci.nsIMessenger);
				if (uris && uris[printingtools.current]) {
					// 115 file spec diff
					if (uris[printingtools.current].includes(".eml?")) {
						// If we're printing a eml file, there is no nsIMsgHdr object, so we create an object just with properties
						// used by the extension ("folder" and "dateInSeconds"), reading directly the file (needing just 1000 bytes)
						var dummy = {};
						dummy.folder = null;
		
						var os = navigator.platform.toLowerCase();
						var f;
		
		
						if (os.indexOf("win") > -1) {
							f = decodeURI(uris[printingtools.current].split("mailbox:///")[1].split("?")[0]).replace(/\//g, "\\");
						} else {
							f = decodeURI(uris[printingtools.current].split("mailbox://")[1].split("?")[0]);
						}
		
						let str_message = await IOUtils.readUTF8(f, { bytes: 3000 })
		
						str_message = str_message.toLowerCase();
		
						// Handle absent Date hdr #109
						try {
							var dateOrig = str_message.split("\ndate:")[1].split("\n")[0];
							//console.log("try date " + dateOrig)
						} catch {
							var dateOrig = new Date().toString();
							//console.log("ca date " + dateOrig)
						}
		
						//console.log("fin date " + dateOrig)
						dateOrig = dateOrig.replace(/ +$/, "");
						dateOrig = dateOrig.replace(/^ +/, "");
						var secs = Date.parse(dateOrig) / 1000;
						dummy.dateInSeconds = secs;
						dummy.dateReceived = secs;
						printingtools.hdr = dummy;
		
						//console.log(str_message)
						//console.log(dummy)
		
					}
					else {
						printingtools.hdr = m.msgHdrFromURI(uris[printingtools.current]);
					}
				}
			},
		
			reformatLayout: async function () {
		
				//console.debug('pTNG: Reformat layout ');
		
		
				printingtools.doc = printingtools.previewDoc;
		
				//console.log(printingtools.doc.body.outerHTML)
		
				var dbgopts = printingtools.prefs.getCharPref("extensions.printingtoolsng.debug.options");
				if (dbgopts.indexOf("initialsource") > -1) {
					console.log("PTNG: initial source:\n");
					console.log(printingtools.doc.documentElement.outerHTML);
				}
		
				if (dbgopts.indexOf("passthrough") > -1) {
					Services.console.logStringMessage("PTNG: Pass through (no processing):\n");
					//Services.console.logStringMessage(printingtools.doc.documentElement.outerHTML);
					return;
				}
		
				printingtools.sanitizeHeaders();
		
				await printingtools.addAttTable(printingtools.attList);
		
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
		
				//console.debug('printing e-mail');
		
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
		
				await printingtools.getHdr(); // save hdr
				printingtools.current = printingtools.current + 1;
		
		
				var table1 = printingtools.getTable(0);
				var table2 = printingtools.getTable(1);
				var table3 = printingtools.getTable(2);
		
				var hpref = printingtools.prefs.getIntPref("mail.show_headers");
				var noheaders = printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.hide");
				var noExtHeaders = printingtools.prefs.getBoolPref("extensions.printingtoolsng.ext_headers.hide");
		
				// if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.messages.black_text"))
				// printingtools.doc.body.removeAttribute("text");
		
				var hSize = printingtools.prefs.getIntPref("extensions.printingtoolsng.headers.size");
		
				var mSize = printingtools.prefs.getIntPref("extensions.printingtoolsng.messages.size");
		
				if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.messages.style")) {
					var mFamily = printingtools.getComplexPref("extensions.printingtoolsng.messages.font_family");
		
					var rule;
					let mozPlainTextDiv = printingtools.doc.querySelector("div.moz-text-plain");
					let mozTextFlowedDiv = printingtools.doc.querySelector("div.moz-text-flowed");
					let mozTextHtmlDiv = printingtools.doc.querySelector("div.moz-text-html");
		
					if (mozPlainTextDiv) {
						printingtools.msgRestoration.msgDiv = mozPlainTextDiv;
						printingtools.msgRestoration.msgFontFamilyOrig = mozPlainTextDiv.style.fontFamily;
						printingtools.msgRestoration.msgFontSizeOrig = mozPlainTextDiv.style.fontSize;
						mozPlainTextDiv.style.fontFamily = mFamily;
						mozPlainTextDiv.style.fontSize = mSize + "px";
					} else if (mozTextFlowedDiv) {
						printingtools.msgRestoration.msgDiv = mozTextFlowedDiv;
						printingtools.msgRestoration.msgFontFamilyOrig = mozTextFlowedDiv.style.fontFamily;
						printingtools.msgRestoration.msgFontSizeOrig = mozTextFlowedDiv.style.fontSize;
						mozTextFlowedDiv.style.fontFamily = mFamily;
						mozTextFlowedDiv.style.fontSize = mSize + "px";
					} else {
						printingtools.msgRestoration.msgDiv = mozTextHtmlDiv;
						printingtools.msgRestoration.msgFontFamilyOrig = null;
						printingtools.msgRestoration.msgFontSizeOrig = null;
					}
		
					rule = 'div.moz-text-html *  {font-size: +' + mSize + 'px !important; font-family: ' + mFamily + ' !important;}';
		
					//rule = '* {font-size: +' + mSize + 'px !important; font-family: ' + mFamily + ' !important;}';
					printingtools.msgRestoration.ruleIndex = printingtools.doc.styleSheets[0].insertRule(rule, printingtools.doc.styleSheets[0].cssRules.length);
		
				}
		
				if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.style")) {
					var hFamily = printingtools.getComplexPref("extensions.printingtoolsng.headers.font_family");
					if (table1) {
						table1.style.fontFamily = hFamily;
						table1.style.fontSize = hSize + "px";
					}
					if (table2) {
						table2.style.fontFamily = hFamily;
						table2.style.fontSize = hSize + "px";
					}
					if (!noExtHeaders && hpref == 2 && table3) {
						table3.style.fontFamily = hFamily;
						table3.style.fontSize = hSize + "px";
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
					//var sel = printingtools.getMail3Pane().content.getSelection();
					var sel = document.commandDispatcher.focusedWindow.getSelection();
		
					var range2 = sel.getRangeAt(0);
					var contents2 = range2.cloneContents();
					// Services.console.logStringMessage(contents2.textContent);
		
				} catch (error) {
					sel = "";
					//Services.console.logStringMessage("no selection " + error );
				}
		
				//Services.console.logStringMessage("sel " + sel);
		
				if (0 && sel && sel != "" && printingtools.prefs.getBoolPref("extensions.printingtoolsng.print.just_selection")) {
					Services.console.logStringMessage("valid selection");
					Services.console.logStringMessage("Selection :\n" + sel);
					Services.console.logStringMessage("process selection");
					console.log(sel)
					console.log(sel.rangeCount)
					var contents = [];
		
					for (let i = 0; i < sel.rangeCount; i++) {
						console.log(sel.getRangeAt(i))
						console.log(sel.getRangeAt(i).commonAncestorContainer)
		
						let s = sel.getRangeAt(i).cloneContents();
						console.log(s)
		
						contents.push(s)
						//contents = contents + sel.getRangeAt(i).cloneContents() + "...\n"
					}
		
		
					//console.log(sel.getRangeAt(1))
		
					//var range = sel.getRangeAt(0);
					//var contents = range.cloneContents();
					Services.console.logStringMessage(contents);
					console.log(contents)
					printingtools.printSelection(contents);
					// Services.console.logStringMessage("After selection");
					//Services.console.logStringMessage(printingtools.doc.documentElement.outerHTML);
		
				}
				else {
					if (printingtools.prefs.getBoolPref("mail.inline_attachments"))
						printingtools.attCheck();
					var hideImg = printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.hide");
					if (hideImg || printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.resize"))
						printingtools.setIMGstyle(hideImg);
				}
		
				//console.debug('check attachments');
		
				if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.process.attachments")) {
					printingtools.rewriteAttList();
				} else
					printingtools.sortHeaders();
				if (!noheaders && printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate"))
					printingtools.truncateHeaders(printingtools.maxChars);
		
		
				if (table3 && !noExtHeaders) {
		
					var trs = table3.getElementsByTagName("tr");
					for (var i = trs.length - 1; i > -1; i--) {
						table1.firstChild.appendChild(trs[i]);
					}
				}
		
		
				if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.align")) {
					if (table2) {
						var trs = table2.getElementsByTagName("tr");
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
						}
						trs[i].firstChild.style.verticalAlign = "top";
					}
		
					let md = printingtools.getMail3Pane();
		
					if (this.getTable(2)) {
		
						var tw = printingtools.doc.createElement("TABLE");
						// var tw = md.document.createElement("TABLE");
						tw.style.fontFamily = table1.style.fontFamily;
						tw.style.fontSize = table1.style.fontSize;
		
						trs = table1.getElementsByTagName("tr");
						for (var i = 0; i < trs.length; i++) {
							let trw = printingtools.doc.createElement("TR");
							// let trw = md.document.createElement("TR");
							trw.style.display = trs[i].style.display;
							trs[i].firstChild.style.paddingLeft = "6px";
							// trw.appendChild(trs[i].firstChild.cloneNode(true));
							trw.innerHTML = trs[i].firstChild.outerHTML;
							tw.appendChild(trw);
						}
						// tw.style.height = 0;
		
						tw.setAttribute("border", "1px solid black");
						tw.setAttribute("border-collapse", "collapse");
						tw.setAttribute("cellspacing", "0");
						// md.document.body.appendChild(tw);
		
						if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.style")) {
							var hSize = printingtools.prefs.getIntPref("extensions.printingtoolsng.headers.size");
							var hFamily = printingtools.getComplexPref("extensions.printingtoolsng.headers.font_family");
							tw.style.fontFamily = hFamily;
							tw.style.fontSize = hSize + "px";
						}
		
						if (!table3) {
							printingtools.insertAfter(tw, table2);
							var maxHdrWidth = table2.nextSibling.getBoundingClientRect().width;
		
						} else {
							printingtools.insertAfter(tw, table3);
							var maxHdrWidth = tw.getBoundingClientRect().width + 12;
						}
						//console.log(printingtools.doc.documentElement.outerHTML);
						tw.remove()
					}
		
					if (this.getTable(2) && !noExtHeaders) {
						//maxHdrWidth = 160;
					} else {
						let locale = Services.locale.appLocaleAsBCP47.split("-")[0];
						let alwaysCcBcc = printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.useCcBcc_always");
						var fs = window.getComputedStyle(table1).getPropertyValue('font-size');
						var fsn = Number(fs.split("px")[0])
		
						switch (locale) {
							case "de":
								if (!alwaysCcBcc) {
									maxHdrWidth = 130 + 6 * (fsn - 14);
		
								} else {
									maxHdrWidth = 120 + 6 * (fsn - 14);
								}
								break;
		
							default:
		
								maxHdrWidth = 120 + 6 * Math.max((fsn - 14), 0);
		
								break;
						}
		
					}
		
		
		
					for (var i = 0; i < trs.length; i++) {
		
						trs[i].firstChild.setAttribute("width", `${maxHdrWidth}px`);
		
					}
				}
		
				//console.log(printingtools.doc.documentElement.outerHTML);
		
				table1.style.tableLayout = "fixed";
				table1.style.marginRight = "10px";
		
				if (table2) {
					table2.style.display = "none";
				}
		
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
					//Services.console.logStringMessage("finish table layout");
				}
				printingtools.setTableLayout();
		
				// Remove attachments  table from  end of message 
		
				if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.hide.inline_attachments_list")) {
					//console.log("remove att list")
					printingtools.hideAttatchmentBodyTable();
				}
		
				// Always remove our temp table
				let ptngAttTable = printingtools.doc.getElementById("ptng-att-table");
				if (ptngAttTable) {
					ptngAttTable.remove();
				}
		
				dbgopts = printingtools.prefs.getCharPref("extensions.printingtoolsng.debug.options");
				if (dbgopts.indexOf("finaloutput") > -1) {
					Services.console.logStringMessage("PTNG: final output:\n");
					Services.console.logStringMessage(printingtools.doc.documentElement.outerHTML);
				}
		
			},
		
			hideAttatchmentBodyTable: function () {
		
				var attTableHdrs = printingtools.previewDoc.querySelectorAll(".moz-mime-attachment-header")
				for (let index = 0; index < attTableHdrs.length; index++) {
					let element = attTableHdrs[index];
					element.style.display = "none";
				}
		
				//console.log(attTableHdrs.outerHTML)
				var attTableEntries = printingtools.previewDoc.querySelectorAll(".moz-mime-attachment-table")
				for (let index = 0; index < attTableEntries.length; index++) {
					let element = attTableEntries[index];
					element.style.display = "none";
				}
			},
		
			showAttatchmentBodyTable: function () {
		
				var attTableHdrs = printingtools.previewDoc.querySelectorAll(".moz-mime-attachment-header")
				for (let index = 0; index < attTableHdrs.length; index++) {
					let element = attTableHdrs[index];
					element.style.display = null;
				}
				//console.log(attTableHdrs.outerHTML)
				var attTableEntries = printingtools.previewDoc.querySelectorAll(".moz-mime-attachment-table")
				for (let index = 0; index < attTableEntries.length; index++) {
					let element = attTableEntries[index];
					element.style.display = null;
				}
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
		
					//suff.textContent = "…  ";
		
					contents.forEach(element => {
						console.log(element)
						console.log(element.firstChild.outerHTML)
						console.log(element.firstChild)
		
						var suff = printingtools.previewDoc.createElement("SPAN");
						var br = printingtools.previewDoc.createElement("BR");
						var br2 = printingtools.previewDoc.createElement("BR");
						var t = printingtools.previewDoc.createElement("TABLE");
						suff.textContent = "…  "
		
						containerDiv.appendChild(element);
						//t.appendChild(element);
						containerDiv.appendChild(suff);
						containerDiv.appendChild(br);
						containerDiv.appendChild(br2);
						//console.log(suff)
						console.log(containerDiv.outerHTML)
					});
		
					var ops = containerDiv.getElementsByTagName("o:p");
					for (i = 0; i < ops.length; i++)
						// hides microsoft crap
						ops[i].style.display = "none";
					var hideImg = printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.hide");
					//if (hideImg || printingtools.prefs.getBoolPref("extensions.printingtoolsng.images.resize"))
					//	printingtools.setIMGstyle(hideImg);
				}
				catch (e) {
					console.log(e)
				}
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
					h3.classList.add("ptng-tophdr");
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
						if (hide) {
							imgs[i].setAttribute("_display", imgs[i].style.display);
							imgs[i].style.display = "none";
							console.log(imgs[i].getAttribute("style"))
							//imgs[i].setAttribute("style", "display:none !important;");
						} else {
							if (imgs[i].style.display == "none" || imgs[i].getAttribute("shrinktofit")) {
								return;
							}
		
							imgs[i].style.height = "auto";
							imgs[i].style.width = "auto";
							imgs[i].style.maxHeight = "100%";
							imgs[i].style.maxWidth = "100%";
						}
					}
				}
			},
		
			restoreIMGstyle: function () {
				var imgs = printingtools.doc.getElementsByTagName("img");
				for (i = 0; i < imgs.length; i++) {
					if (imgs[i].getAttribute("class") != "attIcon") {
		
						let display = imgs[i].getAttribute("_display");
		
						if (display !== undefined && display !== null) {
							if (display == "") {
		
								imgs[i].style.display = null;
							} else {
								imgs[i].style.display = display;
							}
		
							imgs[i].removeAttribute("_display");
						}
		
					}
		
				}
			},
		
			getTable: function (num) {
				// The function check if the requested table exists and if it's an header table
				var tabclass = new Array(".moz-header-part1", ".moz-header-part2", ".moz-header-part3");
				var doc = printingtools.previewDoc;
				//console.debug('get Table ' + num);
		
				//var table = doc.getElementsByTagName("TABLE")[num];
				var table = doc.querySelector(tabclass[num]);
		
				//if (table && table.getAttribute("class") && table.getAttribute("class").includes(tabclass[num]))
				if (table)
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
								tableTDS[i].appendChild(printingtools.previewDoc.createTextNode(" "));
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
		
				//Services.console.logStringMessage(table1.outerHTML);
				//Services.console.logStringMessage("finish table borders");
			},
		
			setTableLayout: function () {
				// Services.console.logStringMessage("table layout");
				var table1 = printingtools.getTable(0);
				var tds1 = table1.getElementsByTagName("TD");
				for (var i = 0; i < tds1.length; i++) {
					if (i === 0) {
						// We process the first row in a different way, to set the top-padding = 3px
						tds1[0].style.padding = "3px 0px 0px 5px";
						if (tds1[0].firstChild)
							tds1[0].firstChild.style.paddingRight = "0px";
					} else {
						tds1[i].style.padding = "0px 0px 0px 5px";
					}
		
					if (tds1[i].firstChild && tds1[i].firstChild.nodeName !== "#text")
						tds1[i].firstChild.style.paddingRight = "0px";
		
					// Services.console.logStringMessage(`${tds1[i].outerHTML} ${tds1[i].offsetWidth}  ${tds1[i].clientWidth}`);
		
		
					if (tds1[i].firstChild.tagName === "DIV" && tds1[i].firstChild.classList.contains("subjectHdr")) {
						tds1[i].firstChild.style.float = "left";
						var s;
						if (tds1[i].nextSibling) {
							s = tds1[i].nextSibling.firstChild;
						}
		
						if (!s) {
		
							s = tds1[i].firstChild.nextSibling
							let sub = s.textContent;
							s.outerHTML = sub;
						}
						if (printingtools.prefs.getBoolPref("extensions.printingtoolsng.headers.truncate")) {
							s.style.overflow = "hidden";
							s.style.whiteSpace = "nowrap";
							s.style.overflowWrap = null;
							s.style.textOverflow = "ellipsis";
		
						} else {
							s.style.wordWrap = "break-word";
							s.style.textOverflow = "ellipsis";
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
					} else if (longFormat === 2) {
						var formatted_date = date_obj.toUTCString();
					} else if (longFormat === 3) {
						let customDateFormat = printingtools.prefs.getStringPref("extensions.printingtoolsng.date.custom_format");
						let locale = Services.locale.appLocaleAsBCP47;
						var formatted_date = st.strftime.strftime(customDateFormat, date_obj, locale);
		
					} else {
						var formatted_date = date_obj.toUTCString();
					}
				}
				catch (e) {
					console.log(e)
				}
				//console.log(formatted_date)
				return formatted_date;
			},
		
			correctDate: function () {
				//console.log("start date")
				var table = printingtools.getTable(0);
				//console.log(table)
				if (!table || !printingtools.hdr)
					return;
				var longFormat = printingtools.prefs.getIntPref("extensions.printingtoolsng.date.long_format_type");
		
				var formatted_date = printingtools.formatDate((printingtools.hdr.dateInSeconds * 1000), longFormat);
				if (!formatted_date)
					return;
		
		
				var tds = table.getElementsByTagName("TD");
		
				var node = tds[tds.length - 1];
				//console.log(tds)
				//console.log(node)
		
				if (node) {
					//var data = node.childNodes[1].nodeValue;
					node.childNodes[1].nodeValue = formatted_date;
				}
			},
		
			appendReceivedTD: function () {
				if (printingtools.hdr) {
					try {
						var formatted_date = printingtools.formatDate((printingtools.hdr.getUint32Property("dateReceived") * 1000), null);
					} catch {
						var formatted_date = printingtools.formatDate((printingtools.hdr.dateReceived * 1000), null);
					}
		
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
		
			formatBytes: function (bytes, decimals) {
				if (bytes == 0) return '0 Bytes';
				var k = 1024,
					dm = decimals || 2,
					sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
					i = Math.floor(Math.log(bytes) / Math.log(k));
				return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
			},
		
			getFullMessage: async function (msgUri) {
				printingtools.hdr = messenger.msgHdrFromURI(msgUri);
		
				let mHdr = window.printingtoolsng.extension.messageManager.convert(printingtools.hdr);
				let message = await window.ptngAddon.notifyTools.notifyBackground({ command: "getFullMessage", messageId: mHdr.id });
		
				return message;
			},
		
			getAttatchmentList: async function () {
		
				let currentUri = printingtools.msgUris[printingtools.current];
		
				// 115 eml exp
				if (currentUri.includes(".eml?")) {
		
					let fileNames = [...printingtools.previewDoc.querySelectorAll(".moz-mime-attachment-table .moz-mime-attachment-file")].map(elm => elm.innerHTML)
					let fileSizes = [...printingtools.previewDoc.querySelectorAll(".moz-mime-attachment-table .moz-mime-attachment-size")].map(elm => elm.innerHTML)
		
					printingtoolsng.attList = fileNames.map((fn, i) => {
						return { name: fn, size: fileSizes[i] };
					});
		
					//console.log(attList)
					return printingtoolsng.attList;
				} else {
		
					printingtools.hdr = mail3paneWin.messenger.msgHdrFromURI(currentUri);
		
					var mHdr = window.printingtoolsng.extension.messageManager.convert(printingtools.hdr);
					//console.log(mHdr)
					printingtools.attList = await window.ptngAddon.notifyTools.notifyBackground({ command: "getAttatchmentList", messageId: mHdr.id });
					return printingtools.attList;
				}
		
			},
		
		
			addAttTable: async function () {
		
				let attList = await printingtools.getAttatchmentList();
				//let attList = [];
				//console.log(printingtools.attList);
		
				if (!attList || !attList.length) {
					return;
				}
				var attTable = printingtools.doc.createElement("TABLE");
				var attRowTR;
				var attTD;
		
				for (let index = 0; index < attList.length; index++) {
					const attEntry = attList[index];
					attRowTR = printingtools.doc.createElement("TR");
					attTD = printingtools.doc.createElement("TD");
					attTD.textContent = attEntry.name;
					attRowTR.appendChild(attTD);
		
					attTD = printingtools.doc.createElement("TD");
					// fix for #125 eml files have string sizes for attachments 
					if (isNaN(attEntry.size)) {
						attTD.textContent = attEntry.size;
					} else {
						attTD.textContent = printingtools.formatBytes(attEntry.size);
					}
		
					attRowTR.appendChild(attTD);
		
					attTable.appendChild(attRowTR);
		
				}
		
				attTable.setAttribute("id", "ptng-att-table");
				attTable.classList.add("mimeAttachmentTable");
				var t;
		
				if (t = this.getTable(2)) {
					t.after(attTable);
				} else if (t = this.getTable(1)) {
					t.after(attTable);
				} else {
					t = this.getTable(0);
					t.after(attTable);
				}
				//console.log("after att")
				//console.log(printingtools.doc.body.outerHTML)
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
		
			shutdown: function () {
				if (document.getElementById("fp")) {
					document.getElementById("fp").remove();
				}
				printerSettings.removePrintPreviewObserver();
				// 115 exp
				window.ptngAddon.notifyTools.removeListener(listener_id);
			}
		}
		
		Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/utils.js", printingtools);
		printingtools.mainStrBundle = printingtools.strBundleService.createBundle("chrome://printingtoolsng/locale/printingtoolsng.properties");
		
		var listener_id = window.ptngAddon.notifyTools.addListener(printingtools.WEXT_cmd_print);