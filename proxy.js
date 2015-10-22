(function(){
  "use strict";

  //--------------------------
  // NAMESPACE
  //--------------------------
  var sn = {};

  //--------------------------
  // INCLUDES
  //--------------------------
  var httpProxy = require('http-proxy'),
      express = require('express'),
      cors = require('cors'),
      exec = require('child_process').exec,
      fs = require('fs'),
      multer  = require('multer'),
      request = require('request'),
      config = require("./config");

  //--------------------------
  // VARS
  //--------------------------
  var app = express(),
      proxy = httpProxy.createProxyServer({
        changeOrigin:true
      });

  //--------------------------
  // CONFIGURATION
  //--------------------------
  app.use(multer({ dest: config.folder.upload}));

  //--------------------------
  // METHODS
  //--------------------------
  sn.processReq = function (req){
    var processedReq = req;
    if (req){
      if (req.headers){

        //check for "auth" in header
        if (req.headers.auth){
          processedReq.headers.authorization = req.headers.auth;
        }

        //check for MSDynmics, apply auth headers
        if (req.header('Origin') && req.header('Origin') === "crm.dynamics.com" && req.headers.authorization.indexOf("Basic") != -1){
          processedReq.headers.authorization = "Basic " + config.token.msdynamics;
        }

        //check for multiple multipart/form-data in content type
        if (req.header('content-type') && req.header('content-type').indexOf('multipart/form-data') !== -1){
          if ((req.header('content-type').match(/multipart\/form-data/g) || []).length > 1){
            processedReq.headers['content-type'] = req.header('content-type').replace('multipart\/form-data', '');
          }
        }

      }
    }
    return processedReq;
  };

  //--------------------------
  // CORS
  //--------------------------
  var whitelist = config.cors.whitelist;
  var corsOptions = config.cors.options;

  function findMatch(origin){
    var match = false;
    if (origin){
      for (var i=0; i < whitelist.length; i++){
        if (origin.indexOf(whitelist[i])  !== -1){
          return true;
        }
      }
    }
    return false;
  }

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  //--------------------------
  // ROUTES
  //--------------------------
  app.all("/signnow/api/*", function(req, res, next){
    req.url = req.url.replace('/signnow/api/', '');
      req = sn.processReq(req);
      proxy.web(req, res, { target: 'https://api.signnow.com:443' });
  });

  app.all("/signnow/eval/*", function(req, res, next){
    if (req.header('Origin') && findMatch(req.header('Origin'))){
      req.url = req.url.replace('/signnow/eval/', '');
      req = sn.processReq(req);
      proxy.web(req, res, { target: 'https://capi-eval.signnow.com:443/api' });
    }else{
      console.log("Unauthorized");
      res.status(500).send({error: "Unauthorized!"});
    }
  });

  app.all("/requestbin/:id", function(req, res, next){
    if (req.header('Origin') && findMatch(req.header('Origin'))){
      req.url = req.url.replace('/requestbin', '');
      req = sn.processReq(req);
      proxy.web(req, res, { target: 'http://requestb.in/' });
    }else{
      console.log("Unauthorized");
      res.status(500).send({error: "Unauthorized!"});
    }
  });

  app.all("/copy/*", function(req, res, next){
    if (req.header('Origin') && findMatch(req.header('Origin'))){
      req.url = req.url.replace('/copy/', '');
      req.headers["X-Api-Version"] = 1;
      proxy.web(req, res, { target: 'https://api.copy.com:443' });
    }else{
      console.log("Unauthorized");
      res.status(500).send({error: "Unauthorized!"});
    }
  });

  //MS Dynamics Integration Specific Route --------------
  app.get("/signnow/auth/:clientId/", function(req, res, next){
    if (req.query.redirectURL){
      var fullUrl = config.protocol + '://' + config.domain + '/msdynamics/' + req.query.redirectURL.replace(/\//g, '@') + '/'; //req.query.redirectURL
      console.log(fullUrl);
      res.redirect('https://signnow.com:443/proxy/index.php/authorize?client_id=' + req.params.clientId + '&response_type=code&redirect_uri=' +  fullUrl);
    }else{
      res.status(500).send({error: "A redirect url is required."});
    }
  });

  app.get("/msdynamics/:path/", function(req, res, next){
    res.redirect(req.params.path.replace(/@/g, '/') + '?data=code=' + req.query.code);
    console.log(req.params.path);
    console.log(req.query.code);
  });

  //NetSuite Integration Specific Route -----------
  app.get("/netsuite", function(req, res, next){
    res.redirect("https://system.na1.netsuite.com/core/media/media.nl?id=5835&c=TSTDRV1302132&h=a710884a7a88de87f39d&_xt=.html&code=" + req.query.code);
  });

  app.post("/savefile", function(req, res, next){
    var file = req.files.file;
    //var filename = req.files.file.name.replace(/\.[^/.]+$/, "");
console.log(req.files);
      //fs.readFile(file.path, function(err, data){
        /*fs.appendFile(file.path, file.body, function() {
          if (err) throw err;
          console.log('The "data to append" was appended to file!');
        });*/
      //});
  });

  //Convert Postscript File to PDF and upload to CudaSign
  app.post("/signnow/document/fieldextract/ps", function(req, res, next){
    console.log("CONVERT & UPLOAD PS FILE =======================>");
    var file = req.files.file;
    var filename = req.files.file.name.replace(/\.[^/.]+$/, "");
    var name = req.body.filename.replace(/[^a-zA-Z0-9\-]/gi, '');

    if (file.extension === 'ps'){
      fs.readFile(file.path, function(err, data){

        //convert the PostScript file to a PDF
        exec('gs -dQUIET -dPARANOIDSAFER -dBATCH -dNOPAUSE -dNOPROMPT -sDEVICE=pdfwrite -o "' + config.folder.output + name + '.pdf" "' + config.folder.upload + filename + '.ps"', function (error, stdout, stderr) {
      		if ( error !== null ) {
      			console.log(error);
            res.status(500).send({error: "Error Converting PS File to PDF"});
      		}
      		else {
            console.log('Successfuly converted PS file to PDF: '+name+'.pdf');

            var formData = {file: fs.createReadStream(config.folder.output+name+'.pdf')};
            var options = {
              url: 'https://api.signnow.com:443/document/fieldextract',
              formData: formData,
              headers: {
                'Authorization': req.headers.authorization
              }
            };

            //upload file to CudaSign
            request.post(options, function optionalCallback(err, httpResponse, body) {
              //remove old files regardless
              fs.unlink(config.folder.output+name+'.pdf');
              fs.unlink(config.folder.upload+filename+'.ps');

              var error = (err) ? err : JSON.parse(body).errors;
              if (error) {
                res.status(500).send({error: "Upload Failed", message: error});
                return console.error('upload failed:', err);
              }
              console.log('Upload successful!  Server responded with:', body);
              res.status(200).send(body);
            });

      		}
      	});//end convert file

      });
    }else if (file.extension === 'zip'){
      console.log("File is a ZIP");
      console.log(file);
    }else{
      res.status(500).send({error: "The file must be of type PostScript."});
    }
  });


  //--------------------------
  // PROXY EVENTS
  //--------------------------
  proxy.on('error', function (err, req, res) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.send(err);
  });

  proxy.on('proxyRes', function (proxyRes, req, res) {
    console.log('RAW Response HEADERS: ', JSON.stringify(proxyRes.headers, true, 2));
  });

  //--------------------------
  // SET PORT & START SERVER
  //--------------------------
  var port = process.env.PORT || 3000;
  app.listen(port);

  console.log("Listening on port " + port);
})();
