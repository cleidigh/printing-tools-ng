/* Port of strftime() by T. H. Doan (https://thdoan.github.io/strftime/)
 *
 * Day of year (%j) code based on Joe Orost's answer:
 * http://stackoverflow.com/questions/8619879/javascript-calculate-the-day-of-the-year-1-366
 *
 * Week number (%V) code based on Taco van den Broek's prototype:
 * http://techblog.procurios.nl/k/news/view/33796/14863/calculate-iso-8601-week-and-year-in-javascript.html
 */


// cleidigh - use as es6 module


export var strftime = {
  strftime: function (sFormat, date, locale) {

    if (date === undefined) {
      date = new Date();
    }

    // instanceof does not recognize date ??
    // if (!(date instanceof Date)) date = new Date();

    var nDay = date.getDay(),
      nDate = date.getDate(),
      nMonth = date.getMonth(),
      nYear = date.getFullYear(),
      nHour = date.getHours(),
      aDays = this.getDayNames(locale, 'long'),
      aDaysShort = this.getDayNames(locale, 'short'),
      aMonths = this.getMonthNames(locale, 'long'),
      aMonthsShort = this.getMonthNames(locale, 'short'),
      //aMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      aDayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
      isLeapYear = function () {
        return (nYear % 4 === 0 && nYear % 100 !== 0) || nYear % 400 === 0;
      },
      getThursday = function () {
        var target = new Date(date);
        target.setDate(nDate - ((nDay + 6) % 7) + 3);
        return target;
      },
      zeroPad = function (nNum, nPad) {
        return ((Math.pow(10, nPad) + nNum) + '').slice(1);
      };



    return sFormat.replace(/%[a-z0-9]/gi, function (sMatch) {
      return (({
        '%a': aDaysShort[nDay],
        '%A': aDays[nDay],
        '%b': aMonthsShort[nMonth],
        '%B': aMonths[nMonth],
        '%c': date.toUTCString(),
        '%C': Math.floor(nYear / 100),
        '%d': zeroPad(nDate, 2),
        '%e': nDate,
        '%F': date.toISOString().slice(0, 10),
        '%G': getThursday().getFullYear(),
        '%g': (getThursday().getFullYear() + '').slice(2),
        '%H': zeroPad(nHour, 2),
        '%I': zeroPad((nHour + 11) % 12 + 1, 2),
        '%j': zeroPad(aDayCount[nMonth] + nDate + ((nMonth > 1 && isLeapYear()) ? 1 : 0), 3),
        '%k': nHour,
        '%l': (nHour + 11) % 12 + 1,
        '%m': zeroPad(nMonth + 1, 2),
        '%n': nMonth + 1,
        '%M': zeroPad(date.getMinutes(), 2),
        '%p': (nHour < 12) ? 'AM' : 'PM',
        '%P': (nHour < 12) ? 'am' : 'pm',
        '%s': Math.round(date.getTime() / 1000),
        '%S': zeroPad(date.getSeconds(), 2),
        '%u': nDay || 7,
        '%V': (function () {
          var target = getThursday(),
            n1stThu = target.valueOf();
          target.setMonth(0, 1);
          var nJan1 = target.getDay();
          if (nJan1 !== 4) target.setMonth(0, 1 + ((4 - nJan1) + 7) % 7);
          return zeroPad(1 + Math.ceil((n1stThu - target) / 604800000), 2);
        })(),
        '%w': nDay,
        '%x': date.toLocaleDateString(),
        '%X': date.toLocaleTimeString(),
        '%y': (nYear + '').slice(2),
        '%Y': nYear,
        '%z': date.toTimeString().replace(/.+GMT([+-]\d+).+/, '$1'),
        '%Z': date.toTimeString().replace(/.+\((.+?)\)$/, '$1'),
        '%t': date.toLocaleDateString([], { timeZoneName: 'short', day: '2-digit' }).slice(3),
        '%0': strftime.getLiteral(date, locale, 0),
        '%1': strftime.getLiteral(date, locale, 1),
        '%2': strftime.getLiteral(date, locale, 2),
      }[sMatch] || '') + '') || sMatch;
    });
  },

  
  getLiteral: function (date, locale, literal) {
    let options = {
      year: 'numeric', month: 'short',
      day: 'numeric',

    };
    var formatter = new Intl.DateTimeFormat(locale, options);
    var l = formatter.formatToParts(date);
    
    if (l[0].type == 'year') {
      
    
    switch (locale) {
      case 'ko':
        switch (literal) {
          case 0:
            return '년';
          case 1:
            return '월';
          case 2:
            return '일';
        }
        default:
          return l[literal * 2 + 1].value;
    }
  }
  
 
    return '-';

  },

  getDayNames: function (locale = 'en', format = 'long', dbg) {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: format, timeZone: 'UTC' });
    const days = [1, 2, 3, 4, 5, 6, 7].map(day => {
      const dd = day < 10 ? `0${day}` : day;
      return new Date(`2017-01-${dd}T00:00:00+00:00`);
    });
    let ds = days.map(date => formatter.format(date));
    if (dbg) {
      console.log(`loc: ${locale}: fmt: ${format} ::`)
      console.log(ds)
      console.log(" ")
    }

    return days.map(date => formatter.format(date));
  },

  getMonthNames: function (locale = 'en', format = 'long') {
    const formatter = new Intl.DateTimeFormat(locale, { month: format, timeZone: 'UTC' });
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
      const mm = month < 10 ? `0${month}` : month;
      return new Date(`2017-${mm}-01T00:00:00+00:00`);
    });
    return months.map(date => formatter.format(date));
  },


};
