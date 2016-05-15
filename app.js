var express = require('Express'),
  bodyParser = require('body-parser'),
  path = require('path'),
  app = new express()

app.use(bodyParser.json())
app.set('views', path.join(__dirname, 'views'))

app.get('/', function (req, res) {
  res.sendFile('layout.html')
})

app.get('/login', function (req, res) {
  res.sendFile('loginForm.html')
})

app.get('/justify', function (req, res) {
  res.sendFile('shiTestimony.html')
})

app.listen(3000)

/* app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'))
  //__dirname : It will resolve to your project folder.
}); */
