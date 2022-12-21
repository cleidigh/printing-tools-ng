// utils.js

/* globals
IOUtils,
PathUtils,

*/


var EXPORTED_SYMBOLS = ["utils"];

var utils = {

	test: function () {
		console.log("utils test");
	},

	constructPDFoutputFilename: async function (msgURI, outputDir) {
		let msgHdr = messenger.msgHdrFromURI(msgURI);
		var fileName;
		var fileNameFormat = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.custom_filename_format");
		var dateFormat = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.custom_date_format");
		
		console.log(msgHdr);

		var subject = msgHdr.mime2DecodedSubject;
		var dateInSec = msgHdr.dateInSeconds;

		var customDate = st.strftime.strftime(dateFormat, new Date(dateInSec * 1000));

		if (fileNameFormat == "{custom-date} {subject}") {
			fileName =  customDate + " " + subject + ".pdf";
		} else {
			fileName = subject + ".pdf";
		}

		
		fileName = this.subInvalidFileNameChars(fileName);

		fileName = await this.createUniqueFilename(outputDir, fileName, {fileNameOnly: true});

		return fileName;
	},

	subInvalidFileNameChars: function (fileName) {
		fileName = fileName.replace(/[\x00-\x19]/g, "_");
		// Allow ',' and single quote character which is valid
		return fileName.replace(/[\/\\:<>*\?\"\|]/g, "_");

	},

	createUniqueFilename: async function (parent, prefix, options) {

		let ext = "";
		if (prefix.includes(".")) {
			ext = "." + prefix.split('.').pop();
		}

		let name;
		if (prefix.lastIndexOf(".") > -1) {
			name = prefix.substring(0, (prefix.lastIndexOf('.')));
		} else {
			name = prefix;
		}

		var tmpUniqueName = await PathUtils.join(parent, prefix);

		console.log(parent)
		console.log(name)
		console.log(ext)
		console.log(tmpUniqueName)

		for (let i = 0; i < 600; i++) {
			if (i === 0 && !(await IOUtils.exists(tmpUniqueName))) {
				console.log("no exist", tmpUniqueName)
				if (options && options.create) {
					await IOUtils.write(tmpUniqueName, new Uint8Array(), { mode: "create" });
				}
				if (options && options.fileNameOnly) {
					tmpUniqueName = PathUtils.filename(tmpUniqueName);
				}
				return tmpUniqueName;

			} else if (i === 0) {
				continue;
			}

			let index = i.toString().padStart(3, '0');
			tmpUniqueName = await PathUtils.join(parent, `${name}-${index}${ext}`);

			console.log(tmpUniqueName)
			if (!await IOUtils.exists(tmpUniqueName)) {
				if (options && options.create) {
					await IOUtils.write(tmpUniqueName, new Uint8Array(), { mode: "create" });
				}
				if (options && options.fileNameOnly) {
					console.log("ufo ", tmpUniqueName)

					tmpUniqueName = PathUtils.filename(tmpUniqueName);
				}
				return tmpUniqueName;
			}
		}
		return null;
	},

	PTNG_WriteStatus: function (text, displayDelay) {
		if (document.getElementById("statusText")) {
			document.getElementById("statusText").setAttribute("label", text);
			document.getElementById("statusText").setAttribute("value", text);

			var delay = 5000;
			if (displayDelay) {
				delay = displayDelay;
			}
			if (delay > 0) {
				window.setTimeout(function () { utils.PTNG_DeleteStatus(text); }, delay);
			}
		}
	},

	PTNG_DeleteStatus: function (text) {
		if (document.getElementById("statusText").getAttribute("label") === text) {
			document.getElementById("statusText").setAttribute("label", "");
			document.getElementById("statusText").setAttribute("value", "");
		}
	},




};

