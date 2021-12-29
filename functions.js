const ical = require('ical');
const fs = require('fs');
const download = require('download');
module.exports = { addOrUpdateNotionCalendar,checkIcalObjectEqual, getNewIcal, convertUTCtoBarcelonaTime };

const {
    createNotionEvent,
    updateDatabaseNotion,
    queryDatabaseNotion
} = require('./notionApiCalls');

require('dotenv').config();


/**
 * Downloads the new calendar from the Raco
 */
async function getNewIcal() {
    try {
        const file = `${process.env.LINK_ICAL}`;
        await download(file, '.', { filename: 'newCalendar.ics' });
        console.log('Downloaded new Ical...\n');
    } catch (error) {
        console.log('ERROR in getNewIcal: ' + error);
    }
}

/**
 * Adds or updates the Notion Calendar based on the new events added or the old ones updated
 */
async function addOrUpdateNotionCalendar() {
    try {
        const newIcal = ical.parseFile('./newCalendar.ics');
        // The old Calendar will start empty the first time you run the program
        if (!fs.existsSync('./oldCalendar.ics')) fs.writeFileSync('./oldCalendar.ics', '');
        const oldIcal = ical.parseFile('./oldCalendar.ics');
        let counterEventsAdded = 0;
        for (let id in newIcal) {
            // If the event represented by id is not in the old calendar
            if (!(id in oldIcal)) {
                ++counterEventsAdded;
                console.log('New event was found: ' + newIcal[id].summary);
                createNotionEvent(newIcal[id]);
                // NO AWAIT FOR EXPLOIT CONCURRENCY
            }
            // If the event represented in the id exists in the old calendar and its modified
            else if (!(await checkIcalObjectEqual(newIcal[id], oldIcal[id]))) {
                ++counterEventsAdded;
                console.log(newIcal[id].summary + ' event was found (to update)...');
                const notionPageId = await queryDatabaseNotion(newIcal[id]);
                updateDatabaseNotion(newIcal[id], notionPageId);
                // NO AWAIT FOR EXPLOIT CONCURRENCY
            }
        }
        if (counterEventsAdded == 1) console.log('\nA total of ' + counterEventsAdded + ' event was created/updated.');
        else console.log('\nA total of ' + counterEventsAdded + ' events were created/updated.');

        // Replace the old Calendar with the new one, so when the program is executed again the old version is updated.
        fs.rename('./newCalendar.ics', './oldCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        console.log('\nFinished adding/updating tasks!');
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

/**
 * Compare two calendar events to see if they're the same.
 */
async function checkIcalObjectEqual(icalEvent1, icalEvent2) {
    return (
        icalEvent1.summary === icalEvent2.summary &&
        icalEvent1.start.toISOString() === icalEvent2.start.toISOString() &&
        icalEvent1.end.toISOString() === icalEvent2.end.toISOString()
    );
}

/**
 * Returns the time of the event of Barcelona time (UTC+1) in ISO8601 format
 */
async function convertUTCtoBarcelonaTime(icalEventDate) {
    //Add one hour to the UTC time
    let hourToChange = icalEventDate.getHours();
    hourToChange += 1;
    icalEventDate.setHours(hourToChange);
    //Change date ISO format to show it's (UTC+1) time
    let stringWithISOtime = icalEventDate.toISOString().slice(0, -1);
    stringWithISOtime = stringWithISOtime + '+01:00';
    return stringWithISOtime;
}

//npm run start  0,86s user 0,17s system 25% cpu 4,089 total
//npm run start  1,38s user 0,20s system 0% cpu 2:54,86 total
//removing awaits, speedup increases 43.5x YIKES
