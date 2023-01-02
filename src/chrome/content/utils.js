// utils.js

/* globals
Services,
printingtools,
IOUtils,
PathUtils,
st,
latinizeString,

*/

Services.scriptloader.loadSubScript("chrome://printingtoolsng/content/modules/latinize.js");

var EXPORTED_SYMBOLS = ["utils"];

var utils = {

  test: function () {
    console.log("utils test");
  },

  constructPDFoutputFilename: async function (msgURI, outputDir) {
    let msgHdr = messenger.msgHdrFromURI(msgURI);
    var fileName;

    fileName = await this.formatTokenizedFileName(msgHdr, outputDir);

    return fileName;
  },

  formatTokenizedFileName: async function (msgHdr, outputDir) {
    // needed prefs
    var fileNameFormat = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.custom_filename_format");
    var customDateFormat = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.custom_date_format");
    var prefix = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.filename.prefix");
    var suffix = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.filename.suffix");
    var latinize = printingtools.prefs.getBoolPref("extensions.printingtoolsng.pdf.filename.latinize");
    var filterCharacters = printingtools.prefs.getStringPref("extensions.printingtoolsng.pdf.filename.filter_characters");
    var filterEmojisAndSymbols = printingtools.prefs.getBoolPref("extensions.printingtoolsng.pdf.filename.filter_emojis_and_symbols");
    var maxSubjectLen = printingtools.prefs.getIntPref("extensions.printingtoolsng.pdf.filename.max_subject_len");
    var maxFileNameLen = printingtools.prefs.getIntPref("extensions.printingtoolsng.pdf.filename.max_filename_len");

    // get raw hdr components
    var rawSubject = msgHdr.mime2DecodedSubject;
    var rawAuthor = msgHdr.mime2DecodedAuthor;
    var rawDateInSeconds = msgHdr.dateInSeconds;
    var rawRecipients = msgHdr.mime2DecodedRecipients;
    var rawKey = msgHdr.messagekey;
    var rawMsgFlags = msgHdr.Flags;
    var rawFolder = msgHdr.folder;
    var rawFolderFlags = msgHdr.folder.flags;

    var fileName;

    // set processed components

    // Subject
    var subject = "";
    if (rawSubject) {
      subject = rawSubject;
      if (rawMsgFlags & 0x0010) {
        subject = "Re_" + subject;
      }
    } else {
      subject = "NOSUBJECT";
    }

    // This transliterator converts accents and other
    // non-latin characters to latin characters
    if (latinize) {
      subject = latinizeString(subject);
    }
    // This filter removes unicode emojis and symbols
    if (filterEmojisAndSymbols) {
      subject = this.filterNonASCIICharacters(subject);
    }
    // Restrict max subject length
    if (maxSubjectLen) {
      subject = subject.substring(0, maxSubjectLen);
    }

    // Sender (author name, email)
    var senderName = "";
    var senderEmail = "";
    if (rawAuthor) {
      senderName = this.extractNameFromFullAddress(rawAuthor, false);
      senderEmail = this.extractEmailsFromFullAddresses(rawAuthor)[0].email;
      if (latinize) {
        senderName = latinizeString(senderName);
      }
    }

    // Recipient (name, email)
    var recipientName = "";
    var recipientEmail = "";
    if (rawRecipients) {
      recipientName = this.extractNameFromFullAddress(rawRecipients, true);
      recipientEmail = this.extractEmailsFromFullAddresses(rawRecipients)[0].email;
      // deal with e-mail without 'To:' headerSwitch to insiders
      if (recipientEmail == "" || !recipientEmail) {
        recipientEmail = "(none)";
      }
      if (latinize) {
        recipientName = latinizeString(recipientName);
      }
    }

    // Dates
    var std8601Date = st.strftime.strftime("%y%m%d", new Date(rawDateInSeconds * 1000));
    var customDate = st.strftime.strftime(customDateFormat, new Date(rawDateInSeconds * 1000));

    // SmartName for Sent or Drafts folder
    var isSentFolder = rawFolderFlags & 0x0200 || rawFolderFlags & 0x0400;
    var isSentSubFolder = rawFolder.URI.indexOf("/Sent/");
    var smartName;
    if (isSentFolder || isSentSubFolder > -1) {
      smartName = recipientName;
    } else {
      smartName = senderName;
    }

    // DeTokenize and construct filename

    // Allow en-US tokens always
    fileName = fileNameFormat;
    fileName = fileName.replace("${subject}", subject);
    fileName = fileName.replace("${sender}", senderName);
    fileName = fileName.replace("${sender_email}", senderEmail);
    fileName = fileName.replace("${recipient}", recipientName);
    fileName = fileName.replace("${recipient_email}", recipientEmail);
    fileName = fileName.replace("${smart_name}", smartName);
    fileName = fileName.replace("${index}", rawKey);
    fileName = fileName.replace("${prefix}", prefix);
    fileName = fileName.replace("${suffix}", suffix);
    fileName = fileName.replace("${date_custom}", customDate);
    fileName = fileName.replace("${date}", std8601Date);

    // User defined character filter
    if (filterCharacters !== "") {
      let filter = new RegExp(`[${filterCharacters}]`, "g");
      fileName = fileName.replace(filter, "");
    }

    fileName = this.subInvalidFileNameChars(fileName);
    fileName += ".pdf";

    // Add -XXX suffix to make fn unique
    fileName = await this.createUniqueFilename(outputDir, fileName, { fileNameOnly: true });
    if (maxFileNameLen && 0) {
      maxFileNameLen -= (outputDir.length + 4);
      fileName = fileName.substring(maxFileNameLen);
    }

    return fileName;
  },

  subInvalidFileNameChars: function (fileName) {
    fileName = fileName.replace(/[\x00-\x19]/g, "_");
    // Allow ',' and single quote character which is valid
    return fileName.replace(/[\/\\:<>*\?\"\|]/g, "_");

  },

  extractNameFromFullAddress: function (fullAddress, recipients) {
    var name = fullAddress;
    if (recipients) {
      name = fullAddress.replace(/\s*\,.+/, "");
    }
    if (name.indexOf("<") > -1) {
      name = name.replace(/\s*<.+>/, "");
    } else {
      name = name.replace(/[@\.]/g, "_");
    }
    return name;
  },

  extractEmailsFromFullAddresses(fullAddresses) {
    var msgHeaderParser = Cc["@mozilla.org/messenger/headerparser;1"]
      .getService(Ci.nsIMsgHeaderParser);
    var strippedAddresses = {};
    strippedAddresses = msgHeaderParser.makeFromDisplayAddress(fullAddresses, {});
    return strippedAddresses;
  },



  filterNonASCIICharacters: function (str) {
    //str = str.replace(/[^\P{L}a-z][^a-z]*/gui, '_');
    //str = str.replace(/[^\x00-\x7f]*/gi, '_');
    str = str.replace(/[\u{0080}-\u{FFFF}]/gu, "");
    str = str.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '');


    return str;
  },

  createUniqueFilename: async function (parent, prefix, options) {

    var ext = "";
    if (prefix.includes(".")) {
      ext = "." + prefix.split('.').pop();
    }

    var name;
    if (prefix.lastIndexOf(".") > -1) {
      name = prefix.substring(0, (prefix.lastIndexOf('.')));
    } else {
      name = prefix;
    }

    var tmpUniqueName = await PathUtils.join(parent, prefix);

    for (let i = 0; i < 600; i++) {
      if (i === 0 && !(await IOUtils.exists(tmpUniqueName))) {
        //console.log("no exist", tmpUniqueName)
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

      //console.log(tmpUniqueName)
      if (!await IOUtils.exists(tmpUniqueName)) {
        if (options && options.create) {
          await IOUtils.write(tmpUniqueName, new Uint8Array(), { mode: "create" });
        }
        if (options && options.fileNameOnly) {
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

