const ical = require('ical');
const fs = require('fs');
const download = require('download');
module.exports = {
    addOrUpdateNotionCalendar,
    checkIcalObjectEqual,
    getNewIcal,
    convertUTCtoBarcelonaTime,
    getStartAndEndDate
};

const { createNotionEvent, updateDatabaseNotion, queryDatabaseNotion } = require('./notionApiCalls');

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
        throw new Error(`[functions.getNewIcal] ${error.message}`);
    }
}

/**
 * Adds or updates the Notion Calendar based on the new events added or the old ones updated
 */
async function addOrUpdateNotionCalendar() {
    try {
        const newIcal = ical.parseFile('./newCalendar.ics');
        // The old Calendar will start empty the first time you run the program
        if (!fs.existsSync('./oldCalendar.ics'))
            fs.writeFileSync('./oldCalendar.ics', '');
        const oldIcal = ical.parseFile('./oldCalendar.ics');
        let counterEventsAdded = 0;

        for (let id in newIcal) {
            // If the event represented by id is not in the old calendar
            if (!(id in oldIcal)) {
                ++counterEventsAdded;
                console.log('New event was found: ' + newIcal[id].summary);
                const dates = await getStartAndEndDate(newIcal[id]);
                createNotionEvent(newIcal[id], dates[0], dates[1]);
                // NO AWAIT FOR EXPLOIT CONCURRENCY
            }
            // If the event represented in the id exists in the old calendar and its modified
            else if (!(await checkIcalObjectEqual(newIcal[id], oldIcal[id]))) {
                ++counterEventsAdded;
                console.log(newIcal[id].summary + ' event was found (to update)...');
                const response_query_database = await queryDatabaseNotion(newIcal[id]);
                const dates = await getStartAndEndDate(newIcal[id]);
                // If the user deletes the event from the database but it gets updated
                response_query_database.results.length == 0 ?
                    createNotionEvent(newIcal[id], dates[0], dates[1]) :
                    updateDatabaseNotion(newIcal[id], response_query_database.results[0].id, dates[0], dates[1]);
                    // NO AWAIT FOR EXPLOIT CONCURRENCY
            }
        }
        if (counterEventsAdded == 1)
            console.log('\nA total of ' + counterEventsAdded + ' event was created/updated.');
        else
            console.log('\nA total of ' + counterEventsAdded + ' events were created/updated.');

        // Replace the old Calendar with the new one, so when the program is executed again the old version is updated.
        fs.rename('./newCalendar.ics', './oldCalendar.ics', function (err) {
            if (err)
                console.log('ERROR: ' + err);
        });
        console.log('\nFinished adding/updating tasks!');
    } catch (error) {
        throw new Error(`[functions.addOrUpdateNotionCalendar] ${error.message}`);
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
    try {
        let result = new Date(icalEventDate);
        //Change the date to ISO string without changing the current timezone (toISOString removes the timezone for some reason)
        var dateConvertedToBarcelonaTime =
            new Date(result.getTime() - result.getTimezoneOffset() * 60000).toISOString().slice(0, -1) + '+01:00';
        return dateConvertedToBarcelonaTime;
    } catch (error) {
        throw new Error(`[functions.convertUTCtoBarcelonaTime] ${error.message}`);
    }
}

/**
 * Get the start and end date of a calendar event
 */
async function getStartAndEndDate(icalEvent) {
    const startTimeBarcelona = await convertUTCtoBarcelonaTime(icalEvent.start);
    let endTimeBarcelona = await convertUTCtoBarcelonaTime(icalEvent.end);

    if (startTimeBarcelona == endTimeBarcelona) {
        endTimeBarcelona = null;
    }

    return [startTimeBarcelona, endTimeBarcelona];
}

//npm run start  0,86s user 0,17s system 25% cpu 4,089 total
//npm run start  1,38s user 0,20s system 0% cpu 2:54,86 total
//removing awaits, speedup increases 43.5x YIKES
