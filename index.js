const ical = require('ical');
const fs = require('fs');
const download = require('download');
const { Client } = require('@notionhq/client');
const { resolve } = require('path');

require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

getNewIcal().then(addOrUpdateNotionCalendar);

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
                await createNotionEvent(newIcal[id]);
                // Does the await above matter?
                //console.log('ISO Time: ' + newIcal[id].start.toISOString());
                //console.log('BCN Time: ' + (await changeUTCtoBarcelonaTime(newIcal[id])) + '\n');
            }
            // If the event represented in the id exists in the old calendar and its modified
            else if (!(await checkIcalObjectUpdate(newIcal[id], oldIcal[id]))) {
                ++counterEventsAdded;
                console.log(newIcal[id].summary + ' event was found (to update)...');
                //NEED UPDATE
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
 * @param {*} ical1
 * @param {*} ical2
 * @returns
 */
async function checkIcalObjectUpdate(ical1, ical2) {
    return (
        ical1.summary === ical2.summary &&
        ical1.start.toISOString() === ical2.start.toISOString() &&
        ical1.end.toISOString() === ical2.end.toISOString()
    );
}

/**
 * Returns the time of the event of Barcelona time (UTC+1) in ISO8601 format
 *
 */
async function changeUTCtoBarcelonaTime(icalEvent) {
    //Add one hour to the UTC time
    let hourToChange = icalEvent.start.getHours();
    hourToChange += 1;
    icalEvent.start.setHours(hourToChange);
    //Change date ISO format to show it's (UTC+1) time
    let stringWithISOtime = icalEvent.start.toISOString().slice(0, -1);
    stringWithISOtime = stringWithISOtime + '+01:00';
    return stringWithISOtime;
}

/**
 * Add an iCal event to the Notion database.
 * @param {*} icalEvent
 */
async function createNotionEvent(icalEvent) {
    try {
        const barcelonaTime = await changeUTCtoBarcelonaTime(icalEvent);
        const response = await notion.pages.create({
            parent: {
                database_id: databaseId
            },
            icon: {
                type: 'emoji',
                emoji: '🗒️'
            },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: icalEvent.summary
                            }
                        }
                    ]
                },
                Date: {
                    date: {
                        start: barcelonaTime
                    }
                }
            }
        });
        // console.log(response)
        console.log('Success! Event added to the calendar.\n');
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}
