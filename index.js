const { addOrUpdateNotionCalendar, getNewIcal } = require('./functions.js');

getNewIcal().then(addOrUpdateNotionCalendar);
