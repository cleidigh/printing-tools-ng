printPreviewStack = document.querySelector(".printPreviewStack");

let messagePaneBrowser = document.getElementById("messagepane");
        PrintUtils.startPrintWindow(messagePaneBrowser.browsingContext, {});

		"startPrintWindow(aBrowsingContext, aOptions) {
    const printInitiationTime = Date.now();
    let openWindowInfo, printSelectionOnly, printFrameOnly;
    if (aOptions) {
      ({ openWindowInfo, printSelectionOnly, printFrameOnly } = aOptions);
    }
    if (
      PRINT_TAB_MODAL &&
      !PRINT_ALWAYS_SILENT &&
      (!openWindowInfo || openWindowInfo.isForWindowDotPrint)
    ) {
      let browsingContext = aBrowsingContext;
      let focusedBc = Services.focus.focusedContentBrowsingContext;
      if (
        focusedBc &&
        focusedBc.top.embedderElement == browsingContext.top.embedderElement &&
        (!openWindowInfo || !openWindowInfo.isForWindowDotPrint) &&
        !printFrameOnly
      ) {
        browsingContext = focusedBc;
      }
      let { promise, browser } = this._openTabModalPrint(
        browsingContext,
        openWindowInfo,
        printInitiationTime,
        printSelectionOnly,
        printFrameOnly
      );
      promise.catch(e => {
        Cu.reportError(e);
      });
      return browser;
    }

    if (openWindowInfo) {
      let printPreview = new PrintPreview({
        sourceBrowsingContext: aBrowsingContext,
        openWindowInfo,
      });
      let browser = printPreview.createPreviewBrowser(\"source\");
      document.documentElement.append(browser);
      // Legacy print dialog or silent printing, the content process will print
      // in this <browser>.
      return browser;
    }

    let settings = this.getPrintSettings();
    settings.printSelectionOnly = printSelectionOnly;
    this.printWindow(aBrowsingContext, settings);
    return null;
  }"


  
  let messagePaneBrowser = document.getElementById("messagepane");
  PrintUtils.startPrintWindow(messagePaneBrowser.browsingContext, {});

  ps = document.getElementById(".printPreviewStack");
  ps3 = document.documentElement.querySelector(".printPreviewStack print-preview browser")

  ps = document.querySelector(".printPreviewStack")
  ps3.contentDocument.documentElement.querySelector("body");