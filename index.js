const { addOrUpdateNotionCalendar, getNewIcal } = require('./functions.js');

getNewIcal().then(addOrUpdateNotionCalendar)
    .catch((error) => {
        console.error(error)
        process.exit(0);
    });
