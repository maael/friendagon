fetch('/api/rooms')
  .then((res) => res.json())
  .then((json) => {
    document.querySelector('#games').innerHTML = Object.keys(json).map((room) => {
      return `<div><a href='/room/${room}'>${room} - ${Object.keys(json[room]).length} players</a></div>`
    }).join('')
  })
  .catch(console.error)
