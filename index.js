const { text, send } = require('micro')
const { router, get, post } = require('microrouter')
const fetch = require('node-fetch')
const { prepack } = require('prepack')

const disallowedOptions = ['logStatistics', 'logModules', 'trace']

const defaultOptions = {
  timeout: 3000
}

const parseOptions = opts => {
  Object.keys(opts).forEach(key => {
    const val = opts[key]

    if (disallowedOptions.includes(key)) {
      delete opts[key]
      return
    }

    if (val === 'true') {
      opts[key] = true
    } else if (val === 'false') { 
      opts[key] = false
    } else if (val === 'null') {
      opts[key] = null
    }
  })
  
  return Object.assign({}, opts, defaultOptions)
}

const pack = (string, opts) => prepack(string, parseOptions(opts))

const urlHandler = async (req, res) => { 
  const url = await text(req)
  const fileBuffer = await fetch(url).then(res => res.buffer())
  const string = fileBuffer.toString('utf8')
  return pack(string, req.query)
}

const stringHandler = async (req, res) => {
  const string = await text(req)
  return pack(string, req.query)
}

const homeHandler = () => `
  <h1><a href="http://prepack.io" target="_blank">Prepack</a> with POST</h1>
  <p>
    post a url to /url or some code to /string
    <br>
    query params are mapped to options, e.g.  /url?uniqueSuffix=test
    <br>
  </p>
  <p style="width: 400px">
    <strong>example:</strong><br>
    <code>curl -X POST -d "(function () { function hello() { return 'hello'; } function world() { return 'world'; } global.s = hello() + ' ' + world(); })();" https://prepack.now.sh/string</code>
  </p>
`

const notFoundHandler = (req, res) => send(res, 404, 'Not found')

module.exports = router(
  get('/', homeHandler),
  post('/url', urlHandler),
  post('/string', stringHandler),
  get('/*', notFoundHandler)
)

