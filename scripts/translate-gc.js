const fs = require('fs-extra');
const path = require('path');
const prettier = require("prettier");

const projectId = 'ThunderbirdTranslations';

const key = fs.readJSONSync("/Dev/SecurityMaterial/gapi-key.json").gapiKey;

// Imports the Google Cloud client library
const { Translate } = require('@google-cloud/translate').v2;

// Instantiates a client
const translate = new Translate({ projectId, key });

// console.debug( translate );
var translationArray = [
	// { key: "dateFormatRefTooltipText", text: "Date Format Reference" },
	// { key: "extFilenameFormatRefTooltipText", text: "Extended Filename Format Reference" },
	{ key: "defaultPrinter", text: "Default Printer" },
]

// const localeDir = "../src/chrome/locale";
const localeDir = "./src/chrome/locale";
const _localeDir = "./src/_locales";
// const localeFile = "printmydate/messages.json";
// const localeFile = "printmydate/printmydate.properties";
// const localeFile = "mboximport/mboximport.properties";
var localeFile;

const referenceLocaleId = "en";


var _getAllFilesOrFolders = function (dir, foldersOnly) {

	var filesystem = require("fs");
	var files = [];
	var folders = [];

	filesystem.readdirSync(dir).forEach(function (fileObj) {

		file = dir + '/' + fileObj;
		var stat = filesystem.statSync(file);

		if (stat && stat.isDirectory()) {
			// results = results.concat(_getAllFilesFromFolder(file));
			folders.push(fileObj);
		} else files.push(fileObj);
	});

	if (foldersOnly) {
		return folders;
	} else {
		return files;
	}
	return results;

};

async function translateAllLocales2(sourceArray, locales, format) {
	var sourceLocale = referenceLocaleId;

	for (let i = 0; i < locales.length; i++) {
		var locale = locales[i];
		var shortLocale = locale.split('-')[0];

		if (shortLocale === referenceLocaleId) {
			// continue;
		}


		if (translate.languages[locale] !== undefined) {
			shortLocale = locale;
		}

		console.debug(locale + '\n');

		var ts = "\n";

		for (let index = 0; index < sourceArray.length; index++) {
			const sourceString = sourceArray[index];

			var translatedString = await syncTranslate(sourceString.text, { from: sourceLocale, to: shortLocale });

			ts += `<!ENTITY ${sourceString.key} "${translatedString}">\n`;
		}
		console.debug('');

		fs.appendFileSync(`${localeDir}/${locale}/${localeFile}`, ts);

	};

}

async function translateAllLocales3(sourceArray, locales, format) {
	var sourceLocale = referenceLocaleId;

	var promises = [];
	var ts = "\n";
	var tarray = new Array(locales.length);
	for (let i = 0; i < locales.length; i++) {
		tarray[i] = new Array(sourceArray.length);
	}

	console.debug(translate.languages);

	for (let i = 0; i < locales.length; i++) {
		var locale = locales[i].toLowerCase();
		var shortLocale = locale.split('-')[0];


		if (shortLocale === referenceLocaleId) {
			continue;
		}

		console.debug('Locale ' + locale + ' ' + translate.languages[locale]);
		if (translate.languages[locale] !== undefined) {
			console.debug('Locale ' + locale + ' ' + translate.languages[locale]);
			shortLocale = locale;
		}

		console.debug(locale + '\n');


		// var t2 = new Array(sourceArray.length);

		for (let index = 0; index < tarray.length; index++) {
			tarray[index][0] = '_0';
			tarray[index][1] = '_1';

		}


		for (let index = 0; index < sourceArray.length; index++) {
			const sourceString = sourceArray[index];

			var sep = "~~__";
			// var translatedString = await syncTranslate(sourceString.text, { from: sourceLocale, to: shortLocale });
			// promises.push(translate(`${i}${sep}${index}${sep}${locale}${sep} ` + sourceString.text, { from: sourceLocale, to: shortLocale })
			promises.push(translate(sourceString.text + ` ~~~ ${sep}${i}${sep}${index}${sep}${locale}${sep} `, { from: sourceLocale, to: shortLocale })
				.then((res) => {
					// console.debug(res);

					let rp1 = res.text.split('~~~');

					let rp = rp1[1].replace(/\s+/g, '').split(sep);
					console.debug(rp);
					let lidx = Number(rp[0]);
					let index = Number(rp[1]);
					let locale = rp[2];
					let t = rp1[0].trimRight();
					// ts += `<!ENTITY ${sourceString.key} "${translatedString}">\n`;
					ts += `<!ENTITY ${sourceString.key} "${res.text}">\n`;
					// tarray.push({index: index, locale: locale, translation: t})

					// console.debug('Parts ' + lidx + ' : '+ index + ' '+t);
					tarray[lidx][index] = { index: index, locale: locale, key: sourceString.key, translation: t };

				}));
		}



	};


	await Promise.all(promises);

	console.debug(tarray);
	for (let i = 0; i < locales.length; i++) {
		if (locales[i].split('-')[0] === referenceLocaleId) {
			continue;
		}

		let lt = tarray[i].map(s => {
			return `<!ENTITY ${s.key} "${s.translation}">`;
		});
		lt = lt.join('\n');

		fs.appendFileSync(`${localeDir}/${locales[i]}/${localeFile}`, lt);
	}
}

async function translateAllLocales(sourceArray, localeDir, locales, format, overwrite) {
	var sourceLocale = referenceLocaleId;

	var promises = [];
	var ts = "\n";
	// var tarray = new Array(locales.length);

	var tarray = [];

	// console.debug(translate);

	var ignoreShortLocales = ignoreLocales.map(l => l.toLowerCase().split('-')[0]);
	console.debug(ignoreShortLocales);

	for (let i = 0; i < locales.length; i++) {
		var locale = locales[i].toLowerCase();
		var shortLocale = locale.split('-')[0];

		if (shortLocale === referenceLocaleId || ignoreShortLocales.includes(shortLocale)) {
			continue;
		}

		// console.debug('Locale ' + locale + ' ' + translate.languages[locale]);
		console.debug(locale + '\n');

		// set up source identifier for locale 
		// var sourceIdentifier = `<label class="notranslate" locale="${locale}">test</label>`;
		var sourceIdentifier = `<data-translation class="notranslate" locale="${locales[i]}">`;
		var text = ["hello everybody"];

		var sourceStrings = sourceArray.map(s => s.text);
		sourceStrings.unshift(sourceIdentifier);
		// text.push("test this");
		console.debug(sourceStrings);
		promises.push(translate.translate(sourceStrings, shortLocale)
			// promises.push(translate.translate(sourceIdentifier, shortLocale)
			// promises.push(translate.translate(['hello there', 'goodbye'], shortLocale)
			.then(([translations]) => {
				console.debug(translations);
				tarray.push(translations);
			}));
		// console.debug('after locale');

	};

	await Promise.all(promises);

	console.debug(tarray);
	// console.debug(tarray[0]);

	// return;

	for (let i = 0; i < tarray.length; i++) {

		let targetLocale = tarray[i][0].match(/locale="(.*)"/)[1];
		let stringArray = tarray[i].slice(1);

		// console.debug(targetLocale);
		console.debug(stringArray);
		// continue;

		var outTemplate;
		
		let lt = stringArray.map((s, i) => {
			switch (format) {
				// entitlt = lt.join('\n');ies (.dtd)
				case 1:
					return `<!ENTITY ${translationArray[i].key} "${s}">`;
					break;
				// properties (.properties)
				case 2:
					return `${translationArray[i].key}=${s}`;
					break;
				case 3:
					return `\t"${translationArray[i].key}": {\n\t\t"message": "${s}"\n\t}`;
					break;
				default:
					break;
			}
			return "";
			// return `${translationArray[i].key}=${s}`;
		});

		if (format === 3) {
			lt = "{\n" + lt.join(',\n') + "\n}\n";
		} else {
			lt = lt.join('\n');
		}

		console.debug(lt)
		console.debug(`${localeDir}/${targetLocale}/${localeFile}`);
		try {
			if (!overwrite) {
				console.debug(`Append: ${localeDir}/${targetLocale}/${localeFile}`);
				fs.appendFileSync(`${localeDir}/${targetLocale}/${localeFile}`, lt);
			} else {
				console.debug(`Write: ${localeDir}/${targetLocale}/${localeFile}`);
				fs.outputFileSync(`${localeDir}/${targetLocale}/${localeFile}`, lt);
			}
			
		} catch (error) {
			console.debug(error);
		}
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


// console.debug(translate);

async function translateHelpPage() {
	var localeFolders = _getAllFilesOrFolders(localeDir, true);
	var supportedLocales = ['ca', 'da', 'de', 'en-US', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM',
		'it', 'ja', 'ko-KR', 'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN', 'el'];

	//  const supportedLocales2 = ['pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE' ];
	// supportedLocales = ['el' ];

	localeFolders = supportedLocales;
	// console.debug(localeFolders);
	var helpLocaleDir ="./src/chrome/content/mboximport/help/locale";
	var helpPage = "./src/chrome/content/mboximport/help/locale/en-US/importexport-help.html";
	var helpBase = "importexport-help";
	var source = fs.readFileSync(helpPage, { encoding: 'utf8' });

	for (let i = 0; i < localeFolders.length; i++) {
		if (localeFolders[i] === 'en-US') {
			continue;
		}
		await sleep(100);
		// var locale = locales[i].toLowerCase();
		var shortLocale = localeFolders[i].split('-')[0];
		if (shortLocale === 'zh') {
			shortLocale = 'zh-CN';
		}
		var outputFileName = `${helpLocaleDir}/${localeFolders[i]}/${helpBase}.html`;

		// if (fs.existsSync(outputFileName)) {
		// 	console.debug('Exists: ' + outputFileName);
		// 	continue;
		// }

		console.debug('Translate ' + shortLocale);

		try {
			translatePage([`<data class="notranslate">${outputFileName}`, source], 'en', shortLocale, translation => {
				console.debug('call back ' + translation[0].split('>')[1]);
				let outputFileName = translation[0].split('>')[1];
				console.debug(outputFileName);
				fs.outputFileSync(outputFileName, translation[1]);
				console.debug('Translated ' + shortLocale);
			});
		} catch (e) {
			console.debug(e);
		}
		// break;
		sleep(2);
	}
}


function translatePage(pageSource, sourceLocale, targetLocale, saveOutputCB) {
	// promises.push(translate.translate(sourceStrings, shortLocale)
	// var helpPage = "./src/chrome/content/mboximport/importexport-help-en-US.html";
	// var helpBase = "./src/chrome/content/mboximport/importexport-help";
	// var helpPage = "./src/chrome/content/mboximport/test1.html";
	// var source = fs.readFileSync(helpPage, {encoding: 'utf8'});
	// console.debug(source);
	// var sourceLocale = "en";
	// var shortLocale = "pt-PT";
	var translatedString = translate.translate(pageSource, { prettyPrint: true, from: sourceLocale, to: targetLocale, format: 'html' })
		.then(([translations]) => {
			try {
				console.debug('T0 ' + translations[0]);
				translations[1] = prettier.format(translations[1], { parser: 'html', printWidth: 110 });
			} catch (error) {
				console.debug(error);
			}
			// fs.outputFileSync(helpBase+"-"+shortLocale+".html",translations);
			// console.debug(translations);
			// tarray.push(translations);
			saveOutputCB(translations);
		});
	// console.debug(translatedString);
}



async function translateNew(srcLocaleFile, localeDir, format, overwrite) {
	let s = new Date();
	console.debug('Start ' + s);

	// const srcLocaleFile = "printmydate.dtd";
	// const srcLocaleFile = "messages.json";
	// const srcLocaleFile = "printmydate.properties";
	const sourceFileName = `${localeDir}/en-US/${srcLocaleFile}`;
	localeFile = srcLocaleFile;
	
	var sourceFile;

	var matches;
	switch (format) {
		// entities (.dtd)
		case 1:
			sourceFile = fs.readFileSync(sourceFileName, { encoding: 'utf8' });
			// <!ENTITY defaultPrinter "Default Printer">
			matches = [...sourceFile.matchAll(/<!ENTITY[\s+](.*?)\s"(.*?)"/g)];
			// console.debug(matches);
			translationArray = matches.map(m => {
				return {key: m[1], text: m[2]};
			});

			break;
		// properties (.properties)
		case 2:
			sourceFile = fs.readFileSync(sourceFileName, { encoding: 'utf8' });
			matches = [...sourceFile.matchAll(/(.*?)=(.*?)\n/g)];
			// console.debug(matches);
			translationArray = matches.map(m => {
				return {key: m[1], text: m[2]};
			});
			break;
		case 3:
			var sourceJSON = fs.readJSONSync(sourceFileName);
			var m = Object.entries(sourceJSON);
			// console.debug(m);
			translationArray = m.map(m => {
				return {key: m[0], text: m[1].message};
			});
			console.debug(translationArray);
			break;
		default:
			break;
	}

	
	// console.debug(translationArray);
	var newLocales = ['ca', 'da-DK', 'de-DE', 'el', 'en-US', 'es-ES', 'fi', 'fr-FR', 'gl-ES', 'hu-HU',
	 'hy-AM', 'it-IT', 'ja', 'ko-KR', 'nl', 'no', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'uk', 'zh-CN'];

	// const newLocaleFolders = ['ko-KR', 'hu', 'el', 'uk'];
	await translateAllLocales(translationArray, localeDir, newLocales, format, true);

	let st = new Date();
	console.debug('Stop ' + st);
	console.debug('Stop ' + (st - s) / 1000);
}

async function translateAll() {
	let s = new Date();
	console.debug('Start ' + s);

	await translateAllLocales(translationArray, localeFolders, 1, true);

	let st = new Date();
	console.debug('Stop ' + st);
	console.debug('Stop ' + (st - s) / 1000);
}


function t() {
	let tb_locale = 'hu';
	var supportedLocales = ['ca', 'da', 'de', 'en-US', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hu-HG', 'hy-AM',
		'it', 'ja', 'ko-KR', 'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

	var supportedLocaleRegions = supportedLocales.filter(l => {
		if (l === tb_locale || l.split('-')[0] === tb_locale.split('-')[0]) {
			return true;
		}
		return false;
	});

	console.debug(supportedLocaleRegions);
	if (!tb_locale || supportedLocaleRegions.length === 0) {
		tb_locale = "en-US";
	} else if ( !supportedLocaleRegions.includes(tb_locale)) {
		tb_locale = supportedLocaleRegions[0];
	}

	console.debug(' locale subset');
	console.debug(supportedLocaleRegions);
	console.debug(tb_locale);

}

const originalLocales = [
	'da-DK', 'de-DE',
	'en-US',
	'fr-FR', 
	'it-IT', 'ja-JP',
	'pt-PT',
	'sk',    'sv-SE'
  ];
  

const localeFolders = _getAllFilesOrFolders(localeDir, true);
console.debug(localeFolders);

var l =	 localeFolders.map(f => `locale  printmydate    ${f}\t\tchrome/locale/${f}/`);
var ignoreLocales = originalLocales;

// var ignoreLocales = [];
// for (e of l) {console.debug(e);}

// console.debug(...l);

  // t();
// translateHelpPage();
// translatePage();
translateAll();
// locale  printmydate     de-DE   chrome/locale/de-DE/


// translateNew("messages.json", _localeDir, 3, true);
// translateNew("printmydate.dtd", localeDir, 1, true);
// translateNew("printmydate.properties", localeDir, 2, true);

