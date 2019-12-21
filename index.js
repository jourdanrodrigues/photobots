require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient

const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

const runBots = require('./runBots')

const PORT = parseInt(process.env.PORT || 3000)

let collection
MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
        throw err
    }
    collection = client.db().collection('data')
    triggerBots()
    setInterval(triggerBots, 1000 * 5)
})

app.use(bodyParser.json())
app.use(express.static('public'))

app.post('/update/', (req, res) => {
    const data = extractDataFromCURL(req.body.data)
    collection.replaceOne({email: data.email}, data, {upsert: true})
    res.send()
})

http.listen(PORT, () => console.log(`App listening on port ${PORT}!`))

function triggerBots() {
    collection.find({}, {_id: false}).toArray((_, entries) => {
        runBots(entries).then(output => io.emit('votes update', output))
    })
}

function extractDataFromCURL(email) {
    const json = email.replace(/(.+--data-binary | --compressed)/g, '').replace(/^'|'$/g, '')
    const data = JSON.parse(json).social_participants[0]
    return {
        captcha: data.captcha_response,
        email: data.social_participant.email,
        token: data.interaction_token,
        cid: data.cid,
    }
}
