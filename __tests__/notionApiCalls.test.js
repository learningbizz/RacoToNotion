const ical = require('ical');
const fs = require('fs');
const { Client } = require('@notionhq/client');
const {
    queryDatabaseNotion,
    updateDatabaseNotion,
    createNotionEvent
} = require('../notionApiCalls.js');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

require('dotenv').config();

//To mock the Notion API
jest.mock('@notionhq/client');

const data = {
        object: 'pene',
        id: '411c21e0-fa26-4b70-b4fa-126ad5af19ee',
        created_time: '2021-12-29T20:07:00.000Z',
        last_edited_time: '2021-12-29T20:07:00.000Z',
        cover: null,
        icon: { type: 'emoji', emoji: '🗒️' },
        parent: {
            type: 'database_id',
            database_id: '6df1b13f-82d3-46a1-9915-28bc9221a02b'
        },
        archived: false,
        properties: {
            Id: { id: 'Bghv', type: 'rich_text', rich_text: [Array] },
            Date: { id: 'z%3E%7CS', type: 'date', date: [Object] },
            Title: { id: 'title', type: 'title', title: [Array] }
        },
        url: 'https://www.notion.so/Random-411c21e0fa264b70b4fa126ad5af19ee'
    }



beforeEach(() => {
    jest.clearAllMocks();
});


describe('Tests createNotionEvent', () => {
    test('Create a Notion Event without end date', async () => {
        const calendar = ical.parseFile('./__tests__/randomCalendar.ics');
        notion.pages = {
            create: jest.fn(() => {
                return data;
            })     
        };
        const response = await createNotionEvent(Object.values(calendar)[0]);
        console.log(response);
        //        expect(response).toBe
    });

    test('Create a Notion Event with end date', async () => {
    });
});

describe('Tests queryDatabaseNotion', () => {
    test('Find id of a Notion Event', async () => {
    });
});

describe('Tests updateDatabaseNotion', () => {
    test('Update a Notion Event without end date', async () => {
    });

    test('Update a Notion Event with end date', async () => {
    });
});
