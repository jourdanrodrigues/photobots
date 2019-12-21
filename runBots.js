const axios = require('axios')

const entryId = parseInt(process.env.ENTRY_ID)
const variationId = parseInt(process.env.VARIATION_ID)
const wishpondHost = `https://${process.env.WISHPOND_SUBDOMAIN}.wishpond.com`
const entriesEndpoint = process.env.ENTRIES_ENDPOINT.replace(/^\/|\/$/g, '')

function buildData({captcha, email, token, cid}) {
    return {
        submission_entry_id: entryId,
        captcha_response: captcha,
        social_participant: {email},
        interaction_token: token,
        variation_id: variationId,
        cid,
    }
}

const headers = {
    authority: 'www.wishpond.com',
    accept: 'application/json, text/plain, */*',
    origin: wishpondHost,
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    'content-type': 'application/json;charset=UTF-8',
    'sec-fetch-site': 'same-site',
    'sec-fetch-mode': 'cors',
    referer: `${wishpondHost}/${entriesEndpoint}/${entryId}`,
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
}


function runBots(inputs) {
    const voted = []
    const waiting = []
    const expired = []
    const promises = inputs.map(input => (
        axios.post(
            `https://www.wishpond.com/api/pages_v1/social_campaigns/${process.env.CAMPAIGN_ID}/votes`,
            {social_participants: [buildData(input)]},
            {headers},
        )
            .then(response => {
                const data = response.data.social_participants[0]
                const errors = data.errors || []
                const entry = `${input.email} (${data.votes.length} votes)`
                if (errors.find(error => /^Captcha requirements not met.$/.test(error))) {
                    expired.push(entry)
                } else if (errors.find(error => /^Por favor, tente novamente/.test(error))) {
                    waiting.push(entry)
                } else {
                    voted.push(entry)
                }
                return data
            })
    ))
    return Promise.all(promises).then(responses => {
        const totalVotes = responses.map(({voted_entry}) => voted_entry ? voted_entry.votes : null).filter(value => !!value)
        return {
            voted: voted.sort(),
            waiting: waiting.sort(),
            expired: expired.sort(),
            votes: Math.max(...totalVotes),
        }
    })
}

module.exports = runBots
