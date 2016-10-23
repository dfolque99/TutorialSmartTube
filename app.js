var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

var port = process.env.PORT || 8000; // first change

/*var azure = require('azure-storage');
var blobService = azure.createBlobService();

blobService.createContainerIfNotExists('taskcontainer', {
  publicAccessLevel: 'blob'
}, function(error, result, response) {
  if (!error) {
    // if result = true, container was created.
    // if result = false, container already existed.
  }
});
*/
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get("/contacts/:id", function(req, res, next) {
  res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
  res.end("Hola id " + req.params.id);
  return next();
});

app.post('/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
	/*blobService.createBlockBlobFromLocalFile('mycontainer', 'taskblob', file.path, function(error, result, response) {
	  if (!error) {
	    // file uploaded
	  }
	});*/
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);

});

var server = app.listen(port, function(){
  console.log('Server listening on port 80');
});
