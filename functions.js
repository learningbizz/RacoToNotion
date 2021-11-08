const ical = require('ical');
const fs = require('fs');
const download = require('download');
const { Client } = require('@notionhq/client');
const { resolve } = require('path');
const { type } = require('os');

require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;
module.exports = { addOrUpdateNotionCalendar, checkIcalObjectEqual, getNewIcal, convertUTCtoBarcelonaTime };

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
async function convertUTCtoBarcelonaTime(icalEvent) {
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
 * Add a calendar event (icalEvent) to the Notion database (databaseId).
 */
async function createNotionEvent(icalEvent) {
    try {
        const barcelonaTime = await convertUTCtoBarcelonaTime(icalEvent);
        const response = await notion.pages.create({
            parent: {
                database_id: databaseId
            },
            icon: {
                type: 'emoji',
                emoji: '🗒️'
            },
            properties: {
                title: {
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
                },
                Id: {
                    rich_text: [
                        {
                            text: {
                                content: icalEvent.uid
                            }
                        }
                    ]
                }
            }
        });
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

/**
 * Returns Notion id page from databaseId to be modified
 */
async function queryDatabaseNotion(icalEvent) {
    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'Id',
                rich_text: {
                    equals: icalEvent.uid
                }
            }
        });
        console.log(response.results[0].properties);
        return response.results[0].id;
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

/**
 * Updates a Notion page (notionPageId) with the icalEvent data
 */
async function updateDatabaseNotion(icalEvent, notionPageId) {
    try {
        const barcelonaTime = await convertUTCtoBarcelonaTime(icalEvent);
        const response = await notion.pages.update({
            page_id: notionPageId,
            properties: {
                title: {
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
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

//npm run start  0,86s user 0,17s system 25% cpu 4,089 total
//npm run start  1,38s user 0,20s system 0% cpu 2:54,86 total
//removing awaits, speedup increases 43.5x YIKES
