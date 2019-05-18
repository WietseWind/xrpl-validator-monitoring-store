const express = require('express')
const helmet = require('helmet')
const algoliasearch = require('algoliasearch')
const db = algoliasearch(process.env.algolia_appid || '-', process.env.algolia_apikey || '-');
const dataset = db.initIndex('xrplvalidators')

const app = express()

// add some security-related headers to the response
app.use(helmet())
// parse body
app.use(express.json())

app.get('*', (req, res) => {
    res.set('Content-Type', 'text/html')
    res.status(200).send(`
        <h1>Nothing here.</h1>
        <p>By: ${process.env.developer || 'nobody'}</p>
    `)
})

app.post('/', async (req, res) => {
    res.set('Content-Type', 'application/json')
    console.log('Got post: ', req.body)
	const record = await dataset.addObject(Object.assign(req.body, {
		moment: Math.round(new Date().getTime() / 1000)
	}))
	console.log('Inserted Algolia Record', record)

    res.status(200).send({
    	stored: true,
    	data: req.body
    })

})

module.exports = app
