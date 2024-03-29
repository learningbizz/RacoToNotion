const { Client } = require('@notionhq/client');
const functions = require('./functions.js');

require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;
module.exports = { createNotionEvent, updateDatabaseNotion, queryDatabaseNotion };

/**
 * Add a calendar event (icalEvent) to the Notion database (databaseId).
 */
async function createNotionEvent(icalEvent, startTimeBarcelona, endTimeBarcelona) {
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
                    start: startTimeBarcelona,
                    end: endTimeBarcelona
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
    }) // read more into catching API calls and why handle each error differently
    .catch((error) => {
        console.error(error)
        process.exit(0);
    });
    
    return response;
}

/**
 * Returns Notion id page from databaseId to be modified
 */
async function queryDatabaseNotion(icalEvent) {
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: 'Id',
            rich_text: {
                equals: icalEvent.uid
            }
        }
    })
    .catch((error) => {
        console.error(error)
        process.exit(0);
    });

    return response;
}

/**
 * Updates a Notion page (notionPageId) with the icalEvent data
 */
async function updateDatabaseNotion(icalEvent, notionPageId, startTimeBarcelona, endTimeBarcelona) {
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
                    start: startTimeBarcelona,
                    end: endTimeBarcelona
                }
            }
        }
    })
    .catch((error) => {
        console.error(error)
        process.exit(0);
    });
    
    return response;
}
