const express = require('express')
const helmet = require('helmet')
const mysql = require('mysql')
const fs = require('fs')
const mysqlCredentials = {
    host: '35.204.233.169',
    port: '3306',
    user: 'nowsh-deployment',
    password: process.env.mysql_pass,
    database: 'validatormon',
    ssl: {
        ca: fs.readFileSync(__dirname + '/certs/ca'),
        key: new Buffer(process.env.mysql_key, 'base64').toString('utf-8'),
        cert: new Buffer(process.env.mysql_cert, 'base64').toString('utf-8')
    }
}

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
    const ts = new Date().toISOString().split('.')[0]
    
    const connection = mysql.createConnection(mysqlCredentials)
    connection.connect()
    
    await Promise.all(Object.keys(req.body).reduce((a, b) => {
        return [...a, new Promise((resolve, reject) => {
            const val = parseInt(req.body[b])
            if (isNaN(val)) {
                const e = new Error('NaN', b, req.body[b])
                console.log(e.message)
                return reject(e)
            }
            connection.query('INSERT INTO data (`key`, `value`, `moment`) VALUES (' + connection.escape(b) + ', ' + val + ', "' + ts + '")', function (error, results, fields) {
                if (error) {
                    console.log(error.message || error)
                    return reject(error)
                }
                resolve()
            })
        })]
    }, []))

    res.status(200).send({
        stored: true,
        data: req.body
    })    
       
    connection.end()
})

module.exports = app
