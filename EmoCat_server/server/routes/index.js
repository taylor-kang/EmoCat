Object.assign = require('object-assign');   //노드 하위버전에서 assign 메서드 지원용 모듈
var express = require('express');
var router = express.Router();
var session = require('express-session');
var models = require('../models');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var multer = require('multer');
var async = require('async');
var config = require('../config/config.json')[process.env.NODE_ENV || "development"];
var cors = require('cors')

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

router.use(session({
  key: 'scgsessionkey',
  secret: '5c9SeCrEtKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60
  }
}));

function auth(req, res, next){
  if (req.session.user){
    auth = req.session.user.auth;
    if (auth >= 10) next();
    else    res.redirect('/');
  }else res.redirect('/login');
}

router.post('/emoInfo', function (req, res, next){
  models.device.findOne({
    where: {
      deviceId: req.query.device_id
    }
  }).then(function(data){
    models.emoticon.create({
      happiness: req.query.happiness,
      face_id : req.query.face_id,
      device_id: data.dataValues.id
    }).then(function(){
      res.send({result: true});
      console.log(req.query.device_id + "의 감정 상태가 추가되었습니다.");
    }).catch(function(){
      res.send({result: false});
    });
  })
})

router.get('/happiness', cors(corsOptions), function(req, res){
  models.device.findOne({
    where: {
      deviceId: req.query.device_id
    }
  }).then(function(data){
    res.set('Access-Control-Allow-Origin', req.headers.origin || "*");
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'content-Type,x-requested-with');
    models.emoticon.findOne({
      where: {
        device_id: data.dataValues.id
      },
      order: [['updatedAt', 'DESC']]
    }).then(function(latest){
      // res.set('Access-Control-Allow-Origin', '*');
      // res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization');
      // res.set('Access-Control-Max-Age', 3600);



      res.send(latest);
    });
  });
})

router.get('/info/user/:uid/:id', function(req, res){
  var recentData = {};

  models.emoticon.findAll({
    include: { model: models.device, include: { model: models.user, where: { uid: req.params.uid }}, required: true},
    where:
      {id: { gt: req.params.id }}
  }).then(function(data){
    res.send(data);
  })
});

router.get('/info/device/:device_id/:id', function(req, res){
  models.emoticon.findAll({
    include: {model: models.device, required: true, where: { deviceId: req.params.device_id }},
    where: {
      id: { gt: req.params.id }
    },
    order: [['id', 'DESC']],
    limit: 20
  }).then(function(data){
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if(data) res.send(data);
    else res.send({result: false});
  });
});


module.exports = router;

// router.get('/info/user/:uid/:id', function(req, res){
//   var recentData = {};
//
//   models.emoticon.findAll({
//     include: { model: models.device, include: {model: models.user, where: { uid: uid }}},
//     where: {
//       id: {gt: id}
//     }
//   }).then(function(data){
//     res.send(data);
//   })
// });
