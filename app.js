var express = require('Express'),
  bodyParser = require('body-parser'),
  path = require('path'),
  app = new express()

app.use(bodyParser.json())
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.get('/', function (req, res) {
  res.render('rankingForm', {data: peoples})
// es.json {peoples: JSON.stringify(peoples), times: JSON.stringify(times)})
})

app.get('/login', function (req, res) {
  res.render('loginForm')
})

app.get('/justify', function (req, res) {
  res.render('shiTestimony')
})

app.get('/signup', function (req, res) {
  res.render('signupForm')
})

var times = [2000, 300, 400, 600, 1200]
var peoples = [{
  'name': 'Aaron',
  'justification': 'I lika da poop'
}, {
  'name': 'T-RAD',
  'justification': 'How you like me now bitch'
}, {
  'name': 'Pepino',
  'justification': 'I am Spartacus'
}, {
  'name': 'Turd Burglar',
  'justification': "That's not what your mother said last night Trebek"
}, {
  'name': 'Teenage Mutant Ninja',
  'justification': 'Turdles'
}, {
  'name': 'Donald Dump',
  'justification': "I POOP, I have da best poops, they're UUGE"
}]
app.listen(3000)

/* app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/index.html'))
  //__dirname : It will resolve to your project folder.
}); */
