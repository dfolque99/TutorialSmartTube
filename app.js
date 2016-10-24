var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

var port = process.env.PORT || 8000; // first change

var azure = require('azure-storage');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;  
var config = {  
        userName: 'bug-destroyer-1',  
        password: 'HelloWorld1',  
        server: 'server-tutorial-smart-tube.database.windows.net',  
        // If you are on Microsoft Azure, you need this:  
        options: {encrypt: true, database: 'my-database'}  
    };

app.use(express.static(path.join(__dirname, 'public')));

var lastImage = 0;
var llistaUsers = [];


app.get("/removeAll", function (req, res, next) {
	console.log("eliminar tot");
	res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
	initConnection( function(con) {
		var str = "DELETE FROM users;";
		request = new Request(str, function(err) {  
			if (err) { console.log(err);}  
		});
		request.on('doneProc', function() {
			res.end("suceed");
			console.log("eliminat tot");
			next();
		});
		con.execSql(request);
	});
});

app.get("/sumaViatges/:id", function(req, res, next) {
	console.log("usuari " + req.params.id + " suma " + req.query.viatges + " viatges");
	res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
	initConnection( function(con) {
		var str = "UPDATE users SET viatges = viatges + "+req.query.viatges + " WHERE id = " + req.params.id;
		request = new Request(str, function(err) {  
			if (err) { console.log(err);}  
		});
		request.on('doneProc', function() {
			res.end("suceed");
			next();
		});
		con.execSql(request);
	});
});

app.get("/register/:id", function(req, res, next) {
	console.log("usuari " + req.params.id + " registrantse");
	res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
	initConnection( function(con) {
		var str = "INSERT users (mac, id, nom, viatges, ultims_viatges) VALUES (@mac, @id, @nom, @viatges, '');";
		request = new Request(str, function(err) {  
			if (err) { console.log(err);}  
		});
		request.addParameter('mac', TYPES.NVarChar,req.query.mac);
        request.addParameter('id', TYPES.NVarChar , ""+req.params.id);  
        request.addParameter('nom', TYPES.NVarChar, req.query.nom);  
        request.addParameter('viatges', TYPES.Int,req.query.viatges);
		request.on('doneProc', function() {
			res.end("suceed");
			next();
		});
		con.execSql(request);
	});
});

app.get("/info/:id", function(req, res, next) {
	console.log('info id '+req.params.id);
  res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
  initConnection( function(con) {
	    console.log('iniciem select');
		request = new Request("SELECT * FROM users WHERE id = "+req.params.id, function(err, rowCount, rowCount2) {  
			if (err) { console.log(err);}  
			console.log('rowCount: ' + rowCount + " " + rowCount2);
		});
		request.on('row', function(columns) {  
			console.log('row received');
			var retorn = {
				mac: columns[0].value,
				id: columns[1].value,
				nom: columns[2].value,
				num_viatges: columns[3].value,
				ultims_viatges: columns[4].value
			};
			console.log(JSON.stringify(retorn));
			res.end(JSON.stringify(retorn));
		});
		request.on('doneProc', function() {
			console.log('suceed');
		});  
		con.execSql(request);
	  return next();
    });
});

app.get('/getLastImage', function (req, res) {
	var retorn = {
		url: 'https://tutorialsmarttube.blob.core.windows.net/mycontainer/image'+lastImage+".png"
	};
	res.end(JSON.stringify(retorn));
});

app.get('/getMacs', function(req, res) {
	res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
	res.end(JSON.stringify({macs: llistaUsers}));
});

app.get('/uploadMacs', function(req, res) {
	console.log('info id '+req.params.id);
  res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
  initConnection( function(con) {
	  var llistaTots = []
	    console.log('iniciem select');
		request = new Request("SELECT * FROM users", function(err, rowCount, rowCount2) {
			if (err) { console.log(err);}  
			console.log('rowCount: ' + rowCount + " " + rowCount2);
		});
		request.on('row', function(columns) {  
			console.log('row received');
			llistaTots.push(columns[0].value);
		});
		request.on('doneProc', function() {
			llistaUsers = intersect(llistaTots, JSON.parse(req.query.macs));
			console.log('suceed');
			res.end('coincideixen ' + JSON.stringify(llistaUsers));
		});  
		con.execSql(request);
    });
});

function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        if (b.indexOf(e) !== -1) return true;
    });
}


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
	var accessKey = '2MCKpWE5Zwa1uq0A9/jRyJRW+SKCNH7DzTwXc8DYPPDnefWUqV89Z4TIz3AvYsAWdp8uyv2+5mJOBACBIxcPgg==';
	var storageAccount = 'tutorialsmarttube';
	var blobService = azure.createBlobService(storageAccount, accessKey);

	blobService.createContainerIfNotExists('mycontainer', { publicAccessLevel: 'blob'}, function(error, result, response) {
	  if (!error) {
	    // if result = true, container was created.
	    // if result = false, container already existed.
	  }
	});
	lastImage = (lastImage+1)%20;
	var name = 'image'+lastImage+'.png';
	blobService.createBlockBlobFromLocalFile('mycontainer', name, file.path, function(error, result, response) {
	  if (!error) {
	    // file uploaded
	  }
	});
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
  console.log('Server listening on port '+port);
});

function initConnection (next) {
	var con = new Connection(config);
	con.on('connect', function(err) {
		console.log('connectat a db');
		//initDB(con, next);
		next(con);
	});
}

function initDB(con, next) {
	//request = new Request("DROP TABLE users", function(err) {
	request = new Request("CREATE TABLE users (mac VARCHAR(20), id VARCHAR(100) PRIMARY KEY, nom VARCHAR(50), viatges INTEGER, ultims_viatges VARCHAR(100))", function(err) {  
	if (err) {
		console.log(err);}
		console.log('taula inicialitzada');
		next(con);
	});
	con.execSql(request);
}















