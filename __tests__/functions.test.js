const fs = require('fs');
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

require('dotenv').config();

//To mock the API calls
jest.mock('download');
jest.mock('../notionApiCalls.js');

beforeEach(() => {
    jest.clearAllMocks();
});

beforeAll(() => {
    if (fs.existsSync('./oldCalendar.ics'))
        fs.rename('./oldCalendar.ics', './oldCalendarReal.ics', function (err) {
           if (err) console.log('ERROR: ' + err);
        });
});

afterAll(() => {
    if (fs.existsSync('./oldCalendarReal.ics'))
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
        fs.unlinkSync('./__tests__/getNewCalendar.ics',  function (err) {
            if (err) console.log('ERROR: ' + err);
        }); 
        expect(download).toHaveBeenCalledTimes(1);
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
        const calendar = ical.parseFile('./__tests__/randomCalendar.ics');
        fs.copyFileSync('./__tests__/randomCalendar.ics', './newCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        await addOrUpdateNotionCalendar();
        fs.unlinkSync('./oldCalendar.ics',  function (err) {
            if (err) console.log('ERROR: ' + err);
        }); 
        expect(createNotionEvent).toHaveBeenCalledTimes(1);
        expect(createNotionEvent).toBeCalledWith(Object.values(calendar)[0]);
    });

    test('Updating an existing event', async () => {
        const calendar = ical.parseFile('./__tests__/newCalendarUpdateDate.ics');
        fs.copyFileSync('./__tests__/newCalendarUpdateDate.ics', './newCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        fs.copyFileSync('./__tests__/oldCalendarUpdateDate.ics', './oldCalendar.ics', function (err) {
            if (err) console.log('ERROR: ' + err);
        });
        queryDatabaseNotion.mockReturnValue('fn2323id23');
        await addOrUpdateNotionCalendar();
        fs.unlinkSync('./oldCalendar.ics',  function (err) {
            if (err) console.log('ERROR: ' + err);
        }); 
        expect(queryDatabaseNotion).toHaveBeenCalledTimes(1);
        expect(queryDatabaseNotion).toBeCalledWith(Object.values(calendar)[0]);
        expect(updateDatabaseNotion).toHaveBeenCalledTimes(1);
        expect(updateDatabaseNotion).toBeCalledWith(Object.values(calendar)[0],'fn2323id23');

    });
});

