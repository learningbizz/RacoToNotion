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

/**
 * found way to simulate newCalendar and oldCalendar
 * Need to find a way to test the different methods (finish thinking about it).
 */

const fs = require('fs');
const Client = require('@notionhq/client');
const ical = require('ical');
const { addOrUpdateNotionCalendar, checkIcalObjectUpdate } = require('../index.js');
const exp = require('constants');

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

test('updating a succesful title change', () => {
    try {
        const newIcal = ical.parseFile('./__tests__/newCalendarUpdateTitle.ics');
        const oldIcal = ical.parseFile('./__tests__/oldCalendarUpdateTitle.ics');
        for (id in newIcal)
            checkIcalObjectUpdate(newIcal[id], oldIcal[id]).then((data) => {
                expect(data).toBe(false);
            });
    } catch (error) {
        console.log(error);
    }
});

test('updating a succesful date change', () => {
    try {
        const newIcal = ical.parseFile('./__tests__/newCalendarUpdateDate.ics');
        const oldIcal = ical.parseFile('./__tests__/oldCalendarUpdateDate.ics');
        for (id in newIcal)
            checkIcalObjectUpdate(newIcal[id], oldIcal[id]).then((data) => {
                expect(data).toBe(false);
            });
    } catch (error) {
        console.log(error);
    }
});
