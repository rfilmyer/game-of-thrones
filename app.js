var express = require('Express'),
  bodyParser = require('body-parser'),
  path = require('path'),
  app = new express()

app.use(bodyParser.json())

app.get('/', function (req, res) {
  app.use('/css', express.static(path.join(__dirname, 'css')))
  res.sendFile(path.join(__dirname, 'views/layout.html'))
})

app.get('/login', function (req, res) {
  app.use('/css', express.static(path.join(__dirname, 'css')))
  res.sendFile(path.join(__dirname, 'views/loginForm.html'))
})

app.get('/justify', function (req, res) {
  app.use('/css', express.static(path.join(__dirname, 'css')))
  res.sendFile(path.join(__dirname, 'views/shiTestimony.html'))
})

app.listen(3000)

/* app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'))
  //__dirname : It will resolve to your project folder.
}); */
