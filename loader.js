exports.loadSync = load

var vacuum = require('./index')
  , defaults = require('./functions')
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , path = require('path')

var HTML = '.html'

function loadFolder(folderName, functions) {
  var files = fs.readdirSync(folderName)
  files.forEach(function(file) {
    var filePath = path.join(folderName, file)
    var stats = fs.statSync(filePath)
    if (stats.isFile() && file.slice(-HTML.length) === HTML) {
      var content = fs.readFileSync(filePath, 'utf8')
      var templateData = vacuum.compileTemplate(content)
      var template = function wrapTextTemplate(template, functions, context, chunk, done) {
        return vacuum.renderTemplate(templateData, functions, context, chunk, done)
      }
      functions[file.slice(0, file.indexOf('.'))] = template
    } else if (stats.isDirectory()) {
      loadFolder(filePath, functions)
    }
  })
}

function load(path) {
  var functions = function renderByName(name, context, chunk, done) {
    var starttime = Date.now()
    if (!{}.hasOwnProperty.call(functions, name)) throw new Error('template '+JSON.stringify(name)+' not found')
    var fn = functions[name]
    if (chunk.write && chunk.end && chunk.writeHead) {
      var response = chunk
      var chunks = []
      chunk = function writeTemplateChunkToHTTP(chunk) {
        if (chunks.length === 0) {
          process.nextTick(function() {
            if (chunks) {
              response.write(chunks.join(''))
              chunks = []
            }
          })
        }
        chunks.push(chunk)
      }
      done = function(err) {
        if (err) {
          try {
            err = JSON.stringify(err.stack || err)
          } catch(jsonerr) {}
          response.end('<<<<[[[[(((( AN ERROR OCCURED, RENDERING TERMINATED ))))]]]]>>>><br>\n'+err)
          console.error('Error during template rendering:'+err)
          chunk = done = function(){}
        } else {
          response.end(chunks.join('')+'\n<!-- RENDER TIME: '+(Date.now()-starttime)+'ms -->')
          chunks = null
        }
      }
      response.writeHead(200, 'let me render that template for you...',
      { 'Content-Type': 'text/html; charset=utf-8'
      , 'X-Powered-By': 'node-vacuum'
      , 'X-Where-Can-I-Download-This-Cool-Template-Renderer': 'https://github.com/thejh/node-vacuum'
      })
    }
    fn(null, functions, context, chunk, done)
  }
  vacuum.copyProps(functions, defaults)
  loadFolder(path, functions)
  return functions
}
