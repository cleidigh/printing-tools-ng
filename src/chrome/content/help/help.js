// help.js

/* globals
browser,
*/

// set version for banner
document.getElementById("extVersion").innerText = "v" + browser.runtime.getManifest().version;
