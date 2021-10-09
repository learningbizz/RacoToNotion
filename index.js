const ical = require('ical');
const fs = require('fs');
const download = require('download');
const { Client } = require('@notionhq/client');

require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

getNewIcal().then(addOrUpdateNotionCalendar);

async function getNewIcal() {
    try {
        const file = `${process.env.LINK_ICAL}`;
        await download(file, '.', { filename: 'newCalendar.ics' });
        console.log('Downloaded new Ical...');
    } catch (error) {
        console.log('ERROR in getNewIcal: ' + error);
    }
}

async function addOrUpdateNotionCalendar() {
    try {
        const newIcal = ical.parseFile('./newCalendar.ics');
        //The old Calendar will start empty the first time you run the program
        if (!fs.existsSync('./oldCalendar.ics')) fs.writeFileSync('./oldCalendar.ics', '');
        const oldIcal = ical.parseFile('./oldCalendar.ics');
        let counterEventsAdded = 0;
        for (let id in newIcal) {
            //if the event is not in the old calendar
            if (!(id in oldIcal)) {
                ++counterEventsAdded;
                console.log('new event was found: ' + newIcal[id].summary);
                await createNotionEvent(newIcal[id]);
            }
            // its modified in the new calendar
            else if (!(await checkIcalObjectUpdate(newIcal[id], oldIcal[id]))) {
                ++counterEventsAdded;
                console.log(newIcal[id].summary + ' event was found (to update)...');
                //NEED UPDATE
            }
        }
        if (counterEventsAdded == 1) console.log('\nA total of ' + counterEventsAdded + ' event was created/updated.');
        else console.log('\nA total of ' + counterEventsAdded + ' events were created/updated.');

        fs.rename('./newCalendar.ics', './oldCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        console.log('\nFinished adding/updating tasks!');
    } catch (error) {
        console.log('ERROR: ' + error);
    }
}

/**
 *
 * @param {*} ical1
 * @param {*} ical2
 * @returns
 */
async function checkIcalObjectUpdate(ical1, ical2) {
    return (
        ical1.summary === ical2.summary &&
        ical1.start.toISOString() == ical2.start.toISOString() &&
        ical1.end.toISOString() === ical2.end.toISOString()
    );
}

/**
 * Add an iCal event to the Notion database.
 * @param {*} icalEvent
 */
async function createNotionEvent(icalEvent) {
    try {
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
                        start: icalEvent.start.toISOString()
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
