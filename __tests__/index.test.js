/**
 * Tests I want to run:
 *
 * 1. Creating a new event
 *      1.1 Succesful creation
 * 2. Updating an existing event
 *      2.1 Succesful update of title change
 *      2.2 Succesful update of date change
 * 3. Event already exists
 *
 * To simulate this, I really only have to test if it finds it as a new item or not
 * How do I simulate the oldCalendar.ics and the newCalendar.ics?
 * I also will have to maybe mock the API function calls like updateDatabaseNotino and createNotionEvent
 */

const fs = require('fs');
const { Client } = require('@notionhq/client');
const ical = require('ical');
const {
    addOrUpdateNotionCalendar,
    checkIcalObjectEqual,
    convertUTCtoBarcelonaTime,
    queryDatabaseNotion,
    updateDatabaseNotion,
    createNotionEvent
} = require('../functions.js');
const exp = require('constants');

require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

//To mock all the calls to the Notion API
jest.mock('@notionhq/client');

//NO CREO QUE HACE FALTA
// beforeAll(() => {
//     //If there is an existing current oldCalendar, change the name to not affect the testing
//     if (fs.existsSync('./oldCalendar.ics'))
//         fs.rename('./oldCalendar.ics', './oldCalendar-real.ics', function (err) {
//             if (err) console.log('ERROR: ' + err);
//         });
// });

// beforeEach(() => {
//     fs.writeFileSync('./oldCalendar.ics', '');
// });

// //NO CREO QUE HACE FALTA
// afterAll(() => {
//     //If there was an existing oldCalendar before testing, revert the testing changes
//     if (fs.existsSync('./oldCalendar-real.ics'))
//         fs.rename('./oldCalendar-real.ics', './oldCalendar.ics', function (err) {
//             if (err) console.log('ERROR: ' + err);
//         });
// });

//test('creating a new succesful event', () => {});

// TESTS checkIcalObjectEqual
test('Check if iCal events are equal: different title', async () => {
    const newIcal = ical.parseFile('./__tests__/newCalendarUpdateTitle.ics');
    const oldIcal = ical.parseFile('./__tests__/oldCalendarUpdateTitle.ics');
    const isEqual = await checkIcalObjectEqual(Object.values(newIcal)[0], Object.values(oldIcal)[0]);
    expect(isEqual).toBe(false);
});

test('Check if iCal events are equal: different date', async () => {
    const newIcal = ical.parseFile('./__tests__/newCalendarUpdateDate.ics');
    const oldIcal = ical.parseFile('./__tests__/oldCalendarUpdateDate.ics');
    const isEqual = await checkIcalObjectEqual(Object.values(newIcal)[0], Object.values(oldIcal)[0]);
    expect(isEqual).toBe(false);
});

test('Check if iCal events are equal: equal events', async () => {
    const newIcal = ical.parseFile('./__tests__/randomCalendar.ics');
    const isEqual = await checkIcalObjectEqual(Object.values(newIcal)[0], Object.values(newIcal)[0]);
    expect(isEqual).toBe(true);
});

// TESTS convertUTCtoBarcelonaTime
test('Translate UTC to UTC+1', async () => {
    const calendar = ical.parseFile('./__tests__/randomCalendar.ics');
    const timeConverted = await convertUTCtoBarcelonaTime(Object.values(calendar)[0].start);
    expect(timeConverted).toBe('2019-11-07T23:59:00.000+01:00');
});

//TESTS createNotionEvent
/**
test('create Notion event: sucess', async () => {
    const calendar = ical.parseFile('./__tests__/randomCalendar.ics');
    const data = {
        object: 'page',
        id: '251d2b5f-268c-4de2-afe9-c71ff92ca95c',
        created_time: '2020-03-17T19:10:04.968Z',
        last_edited_time: '2020-03-17T21:49:37.913Z',
        parent: {
            type: 'database_id',
            database_id: '48f8fee9-cd79-4180-bc2f-ec0398253067'
        },
        icon: {
            type: 'emoji',
            emoji: '🎉'
        },
        cover: {
            type: 'external',
            external: {
                url: 'https://website.domain/images/image.png'
            }
        },
        archived: false,
        url: 'https://www.notion.so/Tuscan-Kale-251d2b5f268c4de2afe9c71ff92ca95c',
        properties: {
            Recipes: {
                id: 'Ai`L',
                type: 'relation',
                relation: []
            }
        }
    };
    const response = notion.pages.create.mockResolvedValues(data);
    await createNotionEvent(Object.values(calendar)[0]);
    expect(response).toHaveBeenCalled();
});
*/
