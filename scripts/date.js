Intl.DateTimeFormat

var date = new Date();
let options = {
	year: 'numeric', month: 'numeric', day: 'numeric',
	hour: 'numeric', minute: 'numeric', second: 'numeric',
	// hour12: false,
  };
  console.log(new Intl.DateTimeFormat('en-US', options).format(date));
  console.log(new Intl.DateTimeFormat('en-HK', options).format(date));
  console.log(new Intl.DateTimeFormat('en-HK').format(date));
  console.log(new Intl.DateTimeFormat('en-UK', options).format(date));
  console.log(new Intl.DateTimeFormat('de', options).format(date));
  