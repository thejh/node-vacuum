`vacuum` is another node.js module for templating.

Goals
=====
This is not necessarily what the code already does, e.g. I have no idea whether it's fast.

 - be fast
 - be secure
 - be streaming (e.g. send out a static head while the DB is still looking up some data)
 - be easy to understand (no big pile of special cases)

Basic usage
===========
Look into the "example" folder for a working example.

Setup code:

    var vacuum = require('vacuum')
    // Load all .html files from that folder and register them by name.
    var renderTemplate = vacuum.loadSync(__dirname+'/templates')

Rendering a template to a HTTP response (`article.html` is the file name of the template):

    renderTemplate('article', {articleID: articleID, title: articleTitle}, httpResponse)

The template files are normal HTML with some special-syntax tags inside. Example:

    <!DOCTYPE html>
    <html>
      <head>
        <title>
          {var name="title"}
        </title>
      </head>
      <body>
        {childblock}
      </body>
    </html>

This could be a HTML document template. It only contains bodyless special tags, the syntax for them is
```js {tagName key1="value1" key2="value2" ...}```. The tag name determines which template should be inserted.
There are two kinds of templates:

 - template files (like this one)
 - template functions (like `var` and `childblock`)

Template functions are JS functions that can be used inside of templates. Because of them, there's
something called "context". In the `renderTemplate` example above, the initial context is
```js {articleID: articleID, title: articleTitle}```, but context can also be changed by template functions - however, these changes
only affect descendants of that template function. Attributes also change the context - in the
HTML template above, the ```js {var name="title"}``` inclusion calls the `var` template with the context
```js {articleID: articleID, title: articleTitle, name: 'title'}`. The `var` template then does (this is
somewhat simplified) ```js chunk(context[context.name]); done()```.

Here's an example that uses the HTML template defined above:

    {#document title="Test"}
      Hello You!
    {/document}

This example contains an inclusion with body - it has an opening tag with `#` and a closing tag with `/`.
The body of the inclusion becomes a template which is given to `document`'s context as `$block`.
`document` can then do things with it - it could e.g. call it multiple times with different contexts.
However, here it's only used with the ```js {childblock}``` default template function.

Default functions
=================
You can make your own template functions, but there are also some defaults:

foreach
-------
This calls the body that was given to it for each element in the given array.

Important context variables:

 - `list` - name of the context variable which contains the array
 - `element` - name of the context variable inside of which the element from the array should be stored

var
---
This prints the value from the variable whose name is stored in `name`.

childblock
----------
This takes the template stored in `$block` on the context and renders it.
