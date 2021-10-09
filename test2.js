const ical = require('ical')
const fs = require('fs');
const download = require('download');
require('dotenv').config();


getNewIcal().then(addOrUpdateNotionCalendar);


async function getNewIcal() {
    try {
        const file = `${process.env.LINK_ICAL}`;
        const filePath = `${process.env.CURRENTDIR}`;
        await download(file,filePath)
        console.log('Downloaded new Ical...');
        fs.rename('./portada.ics', './newCalendar.ics', function (err) {
            if (err)
                console.log('ERROR: ' + err);
        })
        console.log('Changed new Ical name to newCalendar...\n')
    }
    catch(error) {
        console.log('ERROR: ' + error);
    }
}

async function addOrUpdateNotionCalendar() {
    try {
        const newIcal = ical.parseFile('./newCalendar.ics')
        const oldIcal = ical.parseFile('./oldCalendar.ics')
        let counterEventsAdded = 0;
        let sub = {};
        for (let k in newIcal) {
            //if the event is not in the old calendar OR its modified in the new calendar
            if(!(k in oldIcal) || (await checkIcalObjectUpdate(newIcal[k],oldIcal[k]) == false)) {
                ++counterEventsAdded;
                console.log(newIcal[k].summary + ' event was found...')
                sub[k] = newIcal[k];
                //console.log(sub[k]);
            }
        }
        if(counterEventsAdded == 1) 
            console.log('\nA total of ' + counterEventsAdded + ' event was created/updated...')
        else
        console.log('\nA total of ' + counterEventsAdded + ' events were created/updated...')
    }
    catch(error) {
        console.log('ERROR: ' + error);
    }

}


async function checkIcalObjectUpdate(ical1, ical2) {
    return (ical1.summary === ical2.summary) &&
           (ical1.start.toISOString() == ical2.start.toISOString()) &&
           (ical1.end.toISOString() === ical2.end.toISOString());
}
  
/**
 * Add an iCal event to the Notion database.
 * @param {*} icalEvent 
 */
async function addEventToNotionDB(icalEvent) {

}
