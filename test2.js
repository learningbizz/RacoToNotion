const { rejects } = require('assert');
const open = require('open');
const ical = require('ical')
const fs = require('fs');
const download = require('download');
require('dotenv').config();
const { resolve } = require('path');

getNewIcal();
//addOrUpdateNotionCalendar();




async function getNewIcal() {
    try {
        const file = `${process.env.LINK_ICAL}`;
        const filePath = `${process.env.CURRENTDIR}`;
        download(file,filePath)
        .then(() => {
            console.log('Download Completed');
        })
        .then(() => {
            fs.rename('./portada.ics', './newCalendar.ics', function(err) {
                if ( err ) console.log('ERROR: ' + err);
            });
        });
    }
    catch(error) {
        console.log(error);
    }
}

async function addOrUpdateNotionCalendar() {
    try {
        const newIcal = ical.parseFile('./newCalendar.ics')
        const oldIcal = ical.parseFile('./oldCalendar.ics')
        let sub = {};
        for (let k in newIcal) {
            //if the event is not in the old calendar OR its modified in the new calendar
            if(!(k in oldIcal) || (await checkIcalObjectUpdate(newIcal[k],oldIcal[k]) == false)) {
                sub[k] = newIcal[k];
                console.log(sub[k])
            }
            
        }
    }
    catch(error) {
        console.log(error);
    }


}

async function checkIcalObjectUpdate(ical1, ical2) {
    return (ical1.summary === ical2.summary) &&
           (ical1.start.toISOString() == ical2.start.toISOString()) &&
           (ical1.end.toISOString() === ical2.end.toISOString());
}
  
