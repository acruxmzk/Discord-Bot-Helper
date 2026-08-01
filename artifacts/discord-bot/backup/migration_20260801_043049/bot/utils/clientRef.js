let _client = null;
function set(client) { _client = client; }
function get() { return _client; }
module.exports = { set, get };
