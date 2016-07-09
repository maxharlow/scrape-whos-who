const Process = require('process')
const Highland = require('highland')
const Request = require('request')
const RetryMe = require('retry-me')
const Cheerio = require('cheerio')
const FS = require('fs')
const CSVWriter = require('csv-write-stream')
const CSVParser = require('neat-csv')
const Config = require('./config.json')

const http = Highland.wrapCallback((location, callback) => {
    const wrapper = location => {
        return callbackInner => {
            Request.defaults({ jar: true })(location, (error, response) => {
                const failure = error ? error
                      : response.statusCode >= 400 ? new Error(response.statusCode)
                      : response.request.uri.pathname === '/public/home.html' ? new Error('hit rate limit') // roughly every 30k requests
                      : null
                if (failure) console.error('Failed: ' + (location.uri ? location.uri : location) + ' at ' + new Date() + ' (' + failure + ')')
                callbackInner(failure, response)
            })
        }
    }
    const retryConfig = {
        retries: 9999,
        factor: 10,
        minTimeout: 1000, // in milliseconds
        maxTimeout: 60 * 60 * 1000 // in milliseconds
    }
    RetryMe(wrapper(location), retryConfig, callback)
})

const location = 'http://www.ukwhoswho.com'

const filename = 'whos-who.csv'

const login = {
    uri: location + '/LIBRARY',
    method: 'POST',
    form: {
        'dest': '/app?service=externalpagemethod',
        'lib_card': Config.libraryCardNumber
    }
}

function series(from, to, increment) {
    return Array.from(Array(to).keys())
        .reduce((a, x) => x / increment % 1 === 0 ? a.concat(x) : a, [])
        .map(n => n + 1 + from)
}

function initial() {
    return location + '/browse/people'
}

function paginate(response) {
    const document = Cheerio.load(response.body)
    const pagesTotal = Number(document('p + .SearchPaginate .last a:last-of-type').attr('href').match(/paginate\/(\d+)\?/)[1])
    const pages = series(0, pagesTotal, 20) // 20 names on each page
    return pages.map(n => location + '/browse/people/paginate/' + n)
}

function listings(response) {
    console.log('Retrieving listings: ' + response.request.href)
    const document = Cheerio.load(response.body)
    const rows = document('li.www').get().map(rowData => {
        const row = Cheerio.load(rowData)
        const seeOther = row('h3 a:nth-of-type(2)').attr('href')
        if (seeOther) return null // don't bother with duplicates
        const uri = location + row('h3 a:first-of-type').attr('href').split('?')[0]
        return {
            // uri,
            // last: {
            location: uri,
            name: row('h3 a').text().trim(),
            dates: row('.bdate').text().trim(),
            bio: row('.occ').text().trim()
            // }
        }
    })
    return rows.filter(row => row !== null)
}

/* The rate limit for library card holders is too small to do this in any reasonable amount of time */
// function person(response) {
//     console.log('  Retrieving person: ' + response.request.href)
//     const document = Cheerio.load(response.body)
//     return {
//         location: response.request.last.location,
//         name: response.request.last.name,
//         namePeer: document('.peername').text().trim().replace(/\s(\s+)/, ' '),
//         dates: response.request.last.dates,
//         bio: response.request.last.bio,
//         life: document('.life').text().trim()
//     }
// }

const headers = ['location', 'name', 'namePeer', 'dates', 'bio', 'life']
FS.closeSync(FS.openSync(filename, 'a')) // make sure it exists so it can be read
CSVParser(FS.readFileSync(filename), { headers }).then(existing => {
    const existingLocations = existing.map(row => row.location)
    Highland([login])
        .flatMap(http)
        .map(initial)
        .flatMap(http)
        .flatMap(paginate)
        .flatMap(http)
        .flatMap(listings)
        // .filter(request => existingLocations.indexOf(request.last.location) < 0)
        // .flatMap(http)
        // .map(person)
        .errors(e => console.error(e.stack))
        .through(CSVWriter({ sendHeaders: false }))
        .pipe(FS.createWriteStream(filename, { flags: 'a' }))
})
