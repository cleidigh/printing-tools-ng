Intl.DateTimeFormat

var date = new Date();
let o = {
	year: 'numeric', month: 'numeric', day: 'numeric',
	hour: 'numeric', minute: 'numeric', second: 'numeric',
	// hour12: false,
  };
  console.log("en-US : " + new Intl.DateTimeFormat('en-US', o).format(date));
  console.log("en-HK : " + new Intl.DateTimeFormat('en-HK', o).format(date));
  console.log("en-HK : " + new Intl.DateTimeFormat('en-HK').format(date));
  console.log("en-UK : " + new Intl.DateTimeFormat('en-UK', o).format(date));
  console.log("de : " + new Intl.DateTimeFormat('de', o).format(date));
  