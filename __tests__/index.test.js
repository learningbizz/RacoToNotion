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
const download = require('download');
const {
    addOrUpdateNotionCalendar,
    checkIcalObjectEqual,
    convertUTCtoBarcelonaTime,
    getNewIcal
} = require('../functions.js');
const {
    queryDatabaseNotion,
    updateDatabaseNotion,
    createNotionEvent
} = require('../notionApiCalls.js');

const exp = require('constants');

require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

//To mock all the calls to the Notion API
jest.mock('@notionhq/client');
jest.mock('download');
jest.mock('../notionApiCalls.js');


beforeAll(() => {
    fs.rename('./oldCalendar.ics', './oldCalendarReal.ics', function (err) {
           if (err) console.log('ERROR: ' + err);
    });
});

afterAll(() => {
    fs.rename('./oldCalendarReal.ics', './oldCalendar.ics', function (err) {
        if (err) console.log('ERROR: ' + err);
 });
})


describe('Tests checkIcalObjectEqual', () => {
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
});


describe('Tests convertUTCtoBarcelonaTime', () => {
    test('Translate UTC to UTC+1', async () => {
        const calendar = ical.parseFile('./__tests__/randomCalendar.ics');
        const timeConverted = await convertUTCtoBarcelonaTime(Object.values(calendar)[0].start);
        expect(timeConverted).toBe('2012-11-07T23:59:00.000+01:00');
    });
});


describe('Tests getNewIcal', () => {
    test('Download new iCal', async () => {
        download.mockImplementation( () => {
            fs.writeFileSync('./__tests__/getNewCalendar.ics', '');
        });
        await getNewIcal();
        expect(download).toHaveBeenCalledTimes(1);
        fs.unlinkSync('./__tests__/getNewCalendar.ics',  function (err) {
            if (err) console.log('ERROR: ' + err);
        }); 
    });
});



describe('Test addOrUpdateNotionCalendar', () => {
    test('Both calendars are the same, no creating or updating', async () => {
        fs.copyFileSync('./__tests__/randomCalendar.ics', './newCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        fs.copyFileSync('./__tests__/randomCalendar.ics', './oldCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        await addOrUpdateNotionCalendar();
        fs.unlinkSync('./oldCalendar.ics',  function (err) {
            if (err) console.log('ERROR: ' + err);
        }); 
        expect(queryDatabaseNotion).not.toHaveBeenCalled();
        expect(updateDatabaseNotion).not.toHaveBeenCalled();
        expect(createNotionEvent).not.toHaveBeenCalled();
    });

    test('Creating a new event', async () => {
        fs.copyFileSync('./__tests__/randomCalendar.ics', './newCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        await addOrUpdateNotionCalendar();
        fs.unlinkSync('./oldCalendar.ics',  function (err) {
            if (err) console.log('ERROR: ' + err);
        }); 
        expect(createNotionEvent).toHaveBeenCalled();
    });

    test('Updating an existing event', async () => {
        fs.copyFileSync('./__tests__/newCalendarUpdateDate.ics', './newCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        fs.copyFileSync('./__tests__/oldCalendarUpdateDate.ics', './oldCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        await addOrUpdateNotionCalendar();
        fs.unlinkSync('./oldCalendar.ics',  function (err) {
            if (err) console.log('ERROR: ' + err);
        }); 
        expect(queryDatabaseNotion).toHaveBeenCalled();
        expect(updateDatabaseNotion).toHaveBeenCalled();
    });
});

