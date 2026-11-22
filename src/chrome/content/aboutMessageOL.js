

var ADDON_ID = "PrintingToolsNG@cleidigh.kokkini.net";

var { ExtensionParent } = ChromeUtils.importESModule("resource://gre/modules/ExtensionParent.sys.mjs");

// Get our extension object.
let extension2 = ExtensionParent.GlobalManager.getExtension(ADDON_ID);

// Load notifyTools into a custom namespace, to prevent clashes with other add-ons.
window.ptngAddon = {};
Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/notifyTools.js", window.ptngAddon, "UTF-8");


function onLoad() {
  window.printingtoolsng = {};
  window.printingtoolsng.extension = WL.extension;
  var PTNGVersion = window.printingtoolsng.extension.addonData.version;


  Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-overlay.js", window);
  Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/printingtoolsng-pengine.js", window);
  Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/UIlisteners.js", window);


}
