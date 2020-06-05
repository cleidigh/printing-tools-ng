var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

function openPTdialog(abook) {
	Services.console.logStringMessage("openPTdialogue " + abook);
		openDialog("chrome://printmydate/content/pmd-options.xul","","chrome,centerscreen", false, abook);
}
