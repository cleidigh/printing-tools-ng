
/* globals
Services,
printingtools,
IOUtils,
PathUtils,
st,

*/

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

var window3Pane = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow("mail:3pane");

//var printingtools = window3Pane.printingtools;
var window;
var document;

var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);

var EXPORTED_SYMBOLS = ["printerSettings"];

var printerSettings = {
   defaultPTNGprinterSettings:  {
    numCopies: 1,
    pageRanges: [],
    marginTop: 0.5,
    marginBottom: 0.5,
    marginLeft: 0.5,
    marginRight: 0.5,
    headerStrLeft: "",
    headerStrCenter: "&T",
    headerStrRight: "",
    footerStrLeft: "&PT",
    footerStrCenter: "",
    footerStrRight: "&D",
  },

  getPrinterSettings: function (window) {
    var win = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow("mail:3pane");
    var printSettings = win.PrintUtils.getPrintSettings();
    document = window.document;
    console.log("set print settings ", document);

    let printerName = printSettings.printerName;
    let printerNameEsc = printerName.replace(/ /g, '_');
    let p = `extensions.printingtoolsng.printer.${printerNameEsc}`;
    console.log(p);
    let t = prefs.getPrefType(`extensions.printingtoolsng.printer.${printerNameEsc}`);
    console.log(t);
    var props;
    var customProps;

    if (t > 0) {
      printSettings = this.setPrinterSettingsFromPTNGsettings(printSettings);

      console.log(printSettings);

    } else {
      this.initCustomPrinterOptions(printerName);
      printSettings = this.setPrinterSettingsFromPTNGsettings(printSettings);
    }

    console.log(printSettings.paperSizeUnit);
    let un = document.querySelector("#units");
    let unitsStr = ["(in)", "(mm)"];
    un.value = unitsStr[printSettings.paperSizeUnit];

    let prRG = document.querySelector("#pageRangesRG");
    let cr = document.querySelector("#pages");
    let pr = printSettings.pageRanges;

    if (pr.length == 0) {
      console.log(pr);
      prRG.selectedIndex = 0;
      cr.setAttribute("disabled", "true");
      cr.value = "1";
      console.log(cr);
    } else {
      console.log(pr);
      prRG.selectedIndex = 1;
      cr.removeAttribute("disabled");
      cr.value = this.pageRangesToString(pr);
    }

    let nc = document.querySelector("#copies-count");
    nc.value = printSettings.numCopies;
    if (printerName.toLowerCase().includes("pdf")) {
      nc.setAttribute("disabled", "");
    } else {
      nc.removeAttribute("disabled");
    }

    console.log(printSettings.numCopies);
    let units = printSettings.paperSizeUnit;

    let el = document.querySelector("#margin-top");
    el.value = this.inchesToPaperUnits(printSettings.marginTop, units).toFixed(2);
    el = document.querySelector("#margin-bottom");
    el.value = this.inchesToPaperUnits(printSettings.marginBottom, units).toFixed(2);

    el = document.querySelector("#margin-left");
    el.value = this.inchesToPaperUnits(printSettings.marginLeft, units).toFixed(2);

    el = document.querySelector("#margin-right");
    el.value = this.inchesToPaperUnits(printSettings.marginRight, units).toFixed(2);


    el = document.querySelector("#headerleft");
    el.value = printSettings.headerStrLeft;
    el = document.querySelector("#headercenter");
    el.value = printSettings.headerStrCenter;
    el = document.querySelector("#headerright");
    el.value = printSettings.headerStrRight;

    el = document.querySelector("#footerleft");
    el.value = printSettings.footerStrLeft;
    el = document.querySelector("#footercenter");
    el.value = printSettings.footerStrCenter;
    el = document.querySelector("#footerright");
    el.value = printSettings.footerStrRight;

    el = document.querySelector("#leftHeaderTD");
    let frfc_cs = window.getComputedStyle(el);
    let frfc_width = frfc_cs.getPropertyValue("width");
    console.log(frfc_width)
    let w = Number(frfc_width.split("px")[0]) + 4;
    let ws = w + "px"
    console.log(ws)
    document.querySelector("#headerleft").style.width = ws;
    document.querySelector("#headercenter").style.width = ws;
    document.querySelector("#headerright").style.width = ws;
    document.querySelector("#footerleft").style.width = ws;
    document.querySelector("#footercenter").style.width = ws;
    document.querySelector("#footerright").style.width = ws;
  },

  pageRangesToString: function (pageRanges) {
    var pageRangesStr = "";
    console.log(pageRanges);
    console.log(pageRanges.length);
    if (pageRanges.length == 0) {
      return [];
    }
    let totalRangeItems = pageRanges.length;
    for (let pair = 0; pair < totalRangeItems - 1; pair += 2) {
      let startRange = pageRanges[pair];
      let endRange = pageRanges[pair + 1];
      console.log(startRange + " - " + endRange);
      if (startRange == endRange) {
        pageRangesStr += startRange;
      } else {
        pageRangesStr += (startRange + "-" + endRange);
        console.log(pageRangesStr);
      }
      if (pair < totalRangeItems - 2) {
        pageRangesStr += ", ";
      }
    }
    return pageRangesStr;
  },


  setPageRangesFromString: function (pageRangesStr) {
    var pageRanges = [];
    console.log(pageRangesStr);
    if (pageRangesStr == "") {
      return pageRanges;
    }
    let ranges = pageRangesStr.split(",");

    for (let range of ranges) {
      let rangeParts = range.split("-");
      let startRange = parseInt(rangeParts[0], 10);
      let endRange = parseInt(
        rangeParts.length == 2 ? rangeParts[1] : rangeParts[0],
        10
      );

      console.log(startRange);
      console.log(endRange);

      if (isNaN(startRange) && isNaN(endRange)) {
        continue;
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
        continue;
      }

      if (startRange == 0 || endRange == 0) {
        continue;
      }
      pageRanges.push(startRange);
      pageRanges.push(endRange);

    }
    console.log(pageRanges);
    return pageRanges;
  },

  toInchValue: function (val) {
    if (typeof val == "string") {
      val = parseFloat(val);
    }
    return val * 1;
  },

  inchesToPaperUnits: function (val, units) {
    if (units == 0) {
      return val;
    }
    return val * 25.4;
  },



  savePrinterSettingsFromPTNGsettings: function () {
    var w = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow("mail:3pane");
    var printSettings = w.PrintUtils.getPrintSettings();

    console.log(printSettings);

    let printerName = printSettings.printerName;
    let printerNameEsc = printerName.replace(/ /g, '_');
    let p = `extensions.printingtoolsng.printer.${printerNameEsc}`;
    console.log(p);
    let t = prefs.getPrefType(`extensions.printingtoolsng.printer.${printerNameEsc}`);
    console.log(t);
    var props;
    var customProps;

    if (t > 0) {
      printSettings = this.setPrinterSettingsFromPTNGsettings(printSettings);
      let cr = document.querySelector("#pages");
      cr.value = printSettings.pageRanges;
      console.log(printSettings);

    } else {
      this.initCustomPrinterOptions(printerName);
      printSettings = this.setPrinterSettingsFromPTNGsettings(printSettings);
    }
    var PSSVC = Cc["@mozilla.org/gfx/printsettings-service;1"]
      .getService(Ci.nsIPrintSettingsService);
    PSSVC.savePrintSettingsToPrefs(printSettings, true, Ci.nsIPrintSettings.kInitSaveAll);
  },



  savePrintSettings: function () {
    var PSSVC = Cc["@mozilla.org/gfx/printsettings-service;1"]
      .getService(Ci.nsIPrintSettingsService);
    var ps;
    if (PSSVC.newPrintSettings) {
      ps = PSSVC.newPrintSettings;
    } else {
      ps = PSSVC.createNewPrintSettings();
    }

    ps.printerName = document.getElementById("OutputPrinter").value;
    PSSVC.initPrintSettingsFromPrefs(ps, true, ps.kInitSaveAll);
    console.log(ps.marginTop);
    ps.marginTop = 1.6;
    console.log(ps.marginTop);

    var printSettings = ps;
    let nc = Number(document.querySelector("#copies-count").value);
    console.log(nc);
    if (nc < 1 || nc > 1000) {
      nc = 1;
      alert("Copies out of range: set to  1");
    }
    printSettings.numCopies = nc;

    let prRG = document.querySelector("#pageRangesRG");
    let pr = document.querySelector("#pages");

    if (prRG.selectedIndex == 0) {
      printSettings.pageRanges = [];
    } else if (pr.value == "") {
      alert("Empty page range set to All");
    } else {
      printSettings.pageRanges = this.setPageRangesFromString(pr.value);
    }

    let units = printSettings.paperSizeUnit;
    let el = document.querySelector("#margin-top");
    let val = this.paperUnitsToInches(this.toInchValue(el.value), units);
    if (val == undefined) {
      val = 0.5;
      alert("Margin out of range: set to  0.5");
    }
    printSettings.marginTop = val;

    el = document.querySelector("#margin-bottom");
    val = this.paperUnitsToInches(this.toInchValue(el.value), units);
    if (val == undefined) {
      val = 0.5;
      alert("Margin out of range: set to  0.5");
    }
    printSettings.marginBottom = val;

    el = document.querySelector("#margin-left");
    val = this.paperUnitsToInches(this.toInchValue(el.value), units);
    if (val == undefined) {
      val = 0.5;
      alert("Margin out of range: set to  0.5");
    }
    printSettings.marginLeft = val;
    el = document.querySelector("#margin-right");
    val = this.paperUnitsToInches(this.toInchValue(el.value), units);
    if (val == undefined) {
      val = 0.5;
      alert("Margin out of range: set to  0.5");
    }
    printSettings.marginRight = val;

    el = document.querySelector("#headerleft");
    printSettings.headerStrLeft = el.value;
    el = document.querySelector("#headercenter");
    printSettings.headerStrCenter = el.value;
    el = document.querySelector("#headerright");
    printSettings.headerStrRight = el.value;

    el = document.querySelector("#footerleft");
    printSettings.footerStrLeft = el.value;
    el = document.querySelector("#footercenter");
    printSettings.footerStrCenter = el.value;
    el = document.querySelector("#footerright");
    printSettings.footerStrRight = el.value;


    console.log(printSettings);
    // printSettings.marginTop = "0.6";
    // console.log(printSettings.marginTop)
    PSSVC.savePrintSettingsToPrefs(printSettings, true, Ci.nsIPrintSettings.kInitSaveAll);

    let printerName = printSettings.printerName;
    let printerNameEsc = printerName.replace(/ /g, '_');
    let p = `extensions.printingtoolsng.printer.${printerNameEsc}`;
    console.log(p);
    let props = prefs.getStringPref(`extensions.printingtoolsng.printer.${printerNameEsc}`);

    var customProps = JSON.parse(props);

    for (const printProperty in customProps) {
      customProps[printProperty] = printSettings[printProperty];
    }

    let js = JSON.stringify(customProps);
    prefs.setStringPref(`extensions.printingtoolsng.printer.${printerNameEsc}`, js);
  },

  initCustomPrinterOptions: function (printerName) {
    let printerNameEsc = printerName.replace(/ /g, '_');
    let p = `extensions.printingtoolsng.printer.${printerNameEsc}`;
    console.log(p);
    let t = prefs.getPrefType(`extensions.printingtoolsng.printer.${printerNameEsc}`);
    console.log(t);
    var props;

    if (t == 0) {
      let customProps = this.defaultPTNGprinterSettings;
      let customPropsStr = JSON.stringify(customProps);
      prefs.setStringPref(p, customPropsStr);

    }

  },

  setPrinterSettingsFromPTNGsettings: function (printerSettings) {
    let printerNameEsc = printerSettings.printerName.replace(/ /g, '_');
    let p = `extensions.printingtoolsng.printer.${printerNameEsc}`;
    let t = prefs.getPrefType(`extensions.printingtoolsng.printer.${printerNameEsc}`);

    if (t == 0) {
      this.initCustomPrinterOptions(printerSettings.printerName);
    }

    let props = prefs.getStringPref(`extensions.printingtoolsng.printer.${printerNameEsc}`);
    var customProps = JSON.parse(props);
    let pr = "pageRanges";

    console.log(customProps);
    console.log(printerSettings.numCopies);
    // printerSettings["pageRanges"] = [1]

    for (const printProperty in customProps) {

      printerSettings[printProperty] = customProps[printProperty];
      console.log(printProperty + "" + printerSettings[printProperty]);
    }
    return printerSettings;
  },

  paperUnitsToInches: function (val, units) {
    if (isNaN(val) || val < 0 || val > 2000) {
      return undefined;
    }
    if (units == 0) {
      return val;
    }
    return val / 25.4;
  },

  addPrintPreviewObserver: function () {
    Services.obs.addObserver(this.printPreviewSetPrinterPrefs, "subdialog-loaded");
  },

  removePrintPreviewObserver: function () {
    Services.obs.removeObserver(this.printPreviewSetPrinterPrefs, "subdialog-loaded");
  },

  printPreviewSetPrinterPrefs: {


      async observe(subDialogWindow) {
        // A subDialog has been opened.
        console.log("subDialog opened: " + subDialogWindow.location.href);

        // We only want to deal with the print subDialog.
        if (!subDialogWindow.location.href.startsWith("chrome://global/content/print.html?")) {
          return;
        }

        var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
        

        // Wait until print-settings in the subDialog have been loaded/rendered.
        await new Promise(resolve =>
          subDialogWindow.document.addEventListener("print-settings", resolve, { once: true })
        );

        console.log("subDialog print-settings loaded");
        console.log("subDialog print-settings caller/opener: " + subDialogWindow.PrintEventHandler.activeCurrentURI);

        // console.log(window.printingtools);
        // setTimeout(subDialogWindow.printingtools.printT, 9000);

        // console.debug(subDialogWindow.document.documentElement.outerHTML);
        let cr = subDialogWindow.document.querySelector("#custom-range");
        let rp = subDialogWindow.document.querySelector("#range-picker");
        let mp = subDialogWindow.document.querySelector("#margins-picker");
        let cmg = subDialogWindow.document.querySelector("#custom-margins");
        let nc = subDialogWindow.document.querySelector("#copies-count");

        let printerName = prefs.getCharPref("print_printer").replace(/ /g, '_');
        console.debug(printerName);
        let props = prefs.getStringPref(`extensions.printingtoolsng.printer.${printerName}`);
        var customProps = JSON.parse(props);


        console.debug(mp);
        console.debug(rp.options);
        let o = [...rp.options];
        let rangeType;
        if (customProps.pageRanges.length == 0) {
          rangeType = "all";
        } else {
          rangeType = "custom";
          cr.removeAttribute("disabled");
          cr.removeAttribute("hidden");
        }
        console.log(rangeType);
        rp.selectedIndex = o.findIndex(el => el.value == rangeType);
        cmg.removeAttribute("hidden");
        mp.selectedIndex = 3;

        cr.value = printerSettings.pageRangesToString(customProps.pageRanges);

        console.log(nc.value)
        nc.value = customProps.numCopies;

        console.log(nc.value , customProps.numCopies)


        },

  },



};
