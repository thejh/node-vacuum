var vacuum = require('./')

exports.foreach = function FOREACH(template, functions, context, chunk, done) {
  if (context.list == null) throw new Error('"list" value is necessary')
  if (context.element == null) throw new Error('"element" value is necessary')
  
  var list = context[context.list]
  if (!Array.isArray(list)) throw new Error('context[context.list] is not an array')
  
  vacuum.renderTemplate({parts: repeat(template, list.length)}, functions, context, chunk, done)
  
  function repeat(value, count) {
    var arr = new Array(count)
    while (count--) arr.push(value)
    return arr
  }
}

exports.var = function VAR(template, functions, context, chunk, done) {
  if (typeof context.name !== 'string') throw new Error('context.name must be a string')
  var value = context[context.name]
  if (value == null) throw new Error('specified variable ("'+context.name+'") not found')
  
  chunk(value)
  done()
}
