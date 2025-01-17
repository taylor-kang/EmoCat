'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug');
var http = require('http');
var models = require('./models');
var config = require('./config/config.json')[process.env.NODE_ENV || "development"];
var viewPath = config.path;
var session = require('express-session');
var sequelize = require('sequelize');
var cors = require('cors');



console.log(process.env.NODE_ENV);

var app = express();

// view engine setup
app.engine('html', require('ejs').renderFile);
if (process.env.NODE_ENV === "production") {
    // production인 경우, gulp가 전부 다 컴파일한 파일들을 생성하기 때문에 그것만 제대로 라우팅해주면 됨.
    app.use('/', express.static(path.join(__dirname, viewPath.index)));
    app.use('/', express.static(path.join(__dirname, "/../public")));
    app.use('/assets', express.static(path.join(__dirname, "/"+viewPath.index+"/assets")));
    //app.use('/app', express.static(path.join(__dirname, viewPath.src, 'app')));
} else {
    // development인 경우, gulp가 .tmp 폴더에 컴포넌트들 inject한 html을 생성함. 따라서 그에 맞게 경로 설정해줌.
    app.use('/', express.static(path.join(__dirname, viewPath.view)));
    //app.use('/profsystem', express.static(path.join(__dirname, viewPath.index)));
    app.use('/app', express.static(path.join(__dirname, viewPath.index, 'app')));
    // app.use('/profsystem/app', express.static(path.join(__dirname, viewPath.index, 'app')));
    app.use('/assets', express.static(path.join(__dirname, viewPath.index, 'assets')));
    app.use('/bower_components', express.static(path.join(__dirname, "/../bower_components")));
    app.use('/', express.static(path.join(__dirname, "/../public")));
}
app.set('view engine', 'html');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(cors());

//error handling
app.use(function(err, req, res, next) {
    console.error(err.stack);
    next(err);
    res.send('error');
});

//routing
var routes = require('./routes/index');



app.use('/', routes);
app.use('/webdata', express.static(path.join(__dirname, "/../webdata")));

//angular route html5Mode support
// app.use('/*', function(req, res) {
//     res.sendFile('index.html', {
//         root: path.join(__dirname, process.env.NODE_ENV === "production" ? viewPath.index : viewPath.view)
//     })
// })


// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


app.set('port', config.port);
var server = http.createServer(app);

models.sequelize.sync(function(){
    force: true
});




/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(config.port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
    debug('Listening on ' + bind);
}

////////////////////////////////////////////////////////////////////////
