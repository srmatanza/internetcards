
export default function(fnMessage, fnOpen, fnClose) {
  this.onmessage = function(msg) {
    const response = JSON.parse(msg.data)
    console.debug('WebSocket message handler: ', response)
    if(typeof fnMessage === 'function') {
      fnMessage(response)
    }
  }

  this.onopen = fnOpen || function(msg) {
    console.debug('WebSocket connection opened', msg)
  }

  this.onclose = fnClose || function(msg) {
    console.debug('WebSocket connection closed', msg)
  }

  return this
}
