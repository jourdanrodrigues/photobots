io().on('votes update', data => {
    console.log(data)
    const voted = document.querySelector('.voted')
    const waiting = document.querySelector('.waiting')
    const expired = document.querySelector('.expired')
    const info = document.querySelector('.info')

    voted.innerHTML = ''
    waiting.innerHTML = ''
    expired.innerHTML = ''

    load('Votaram', data.voted, document.querySelector('.voted'))
    load('Esperando', data.waiting, document.querySelector('.waiting'))
    load('Expiraram', data.expired, document.querySelector('.expired'))

    const activeCount = data.voted.length + data.waiting.length
    const count = activeCount + data.expired.length
    let infoText = `${count} bots (${activeCount} ativos)`
    if (data.votes) {
        infoText += ` / ${data.votes} votos`
    }
    info.innerText = infoText
})

function load(label, values, parent) {
    const labelEl = document.createElement('span')
    labelEl.innerHTML = label
    parent.appendChild(labelEl)
    values.forEach(entry => {
        const entryEl = document.createElement('span')
        entryEl.innerHTML = entry
        entryEl.style = 'cursor: pointer;'
        entryEl.addEventListener('click', event => {
            copyToClipboard(event.target.innerHTML.split(' ')[0])
        })
        parent.appendChild(entryEl)
    })
}

function copyToClipboard(text) {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function updateEmail() {
    const input = document.querySelector('textarea[name=code]')
    fetch('/update/', {
        method: 'POST',
        headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify({data: input.value}),
    }).then(() => input.value = '')
    return false
}
