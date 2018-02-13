require('dotenv').config();
var _P = _P || {};
_P.seedrandom = require('seedrandom');
_P.rand = new Math.seedrandom(6666);
_P.twit = require('twit');
_P.fs = require('fs');
_P.wh = 500;
_P.jsonObj = {items:[]};
_P.jsn = require('./myjsonfile.json')
_P.Canvas = require('canvas');
_P.canvas = new _P.Canvas(_P.wh, _P.wh);
_P.ctx = _P.canvas.getContext('2d');
//
_P.App = {
    //
    init: function() {
      this.main_canvas = _P.canvas;
    	this.canvasHeight = _P.wh;
    	this.canvasWidth = _P.wh;
      this.centerH = this.canvasHeight/2;
    	this.centerW = this.canvasWidth/2;
      //
      this.mode = "MonitorForNew";
      //
      switch (this.mode) {
        case "GetJSON":
          console.log("GetJSON");
          _P.TwtrAPI.init();
          _P.TwtrAPI.getTimeline();
          break;
        case "GenerateImagesFromJSON":
          console.log("switch says GenerateImages FromJSON");
          _P.ImageManager.count = _P.jsn.items.length-1;
          _P.ImageManager.generateImagesFromJSON();
          break;
        case "PostCatchUps":
          console.log("switch says PostCatchUps");
          _P.TwtrAPI.init();
          _P.TwtrAPI.postImagesFromJSON();
          break;
        case "MonitorForNew":
          console.log("switch says MonitorForNew");
          _P.TwtrAPI.init();
          var time = 1000*60*60;
          var interval = setInterval(_P.TwtrAPI.getTimeline, time);
          _P.TwtrAPI.getTimeline();
          break;
        default:
      }
    }
  };
//
_P.TwtrAPI= {
  count: 0,
  since_id: "963152799486828544",
  init: function(){
    this.count=0;
    this.fetchNum = 200;
    this.uid = '25073877'; //realdonaldtrump
    this.bot = new _P.twit({
      consumer_key:process.env.consumer_key,
      consumer_secret:process.env.consumer_secret,
      access_token:process.env.access_token,
      access_token_secret:process.env.access_token_secret,
      timeout_ms:process.env.timeout_ms
    });
  },
  getTimeline: function(){
    var t = _P.TwtrAPI;
    t.bot.get('statuses/user_timeline', {user_id: t.uid, count:t.fetchNum, since_id:t.since_id }, function(err, data){
      if(_P.App.mode=="getJSON"){
        console.log("parsing jsond");
        _P.TweetHandler.parseTweets(data);
      }else if(_P.App.mode=="MonitorForNew"){
        console.log("inspectForNew", data.length);
        t.inspectForNew(data);
      }

    });
  },
  postImagesFromJSON: function(){
    var itm = _P.jsn.items[_P.jsn.items.length-1];
    console.log(itm.date.slice(0,19));
    if (_P.fs.existsSync( "img/"+itm.id+".png" ) ) {
        this.uploadImage(itm);
    }else{
      console.log("missing image: ", itm.date);
    }
  },
  uploadImage: function(itm){
    var imgPath = 'img/'+itm.id+".png";
    console.log("\n here we go! "+imgPath+" "+itm.text.slice(0, 35));
    _P.TwtrAPI.bot.postMediaChunked({ file_path: imgPath }, function (err, data, response) {
      // var mediaIdStr = itm.id_str;
      if(err){
        console.log(err);
        return;
      }
      var mediaIdStr = data.media_id_string;
      // console.log(mediaIdStr);
      var altText = "Abstract image based on @realdonaldtrump tweet on "+itm.date;
      console.log("is this hereer???>> ",itm.id_str);
      var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };
        _P.TwtrAPI.bot.post('media/metadata/create', meta_params, function (err, data, response) {
          if (!err) {
            console.log("no error.......", meta_params.media_id);
            var tweeturl="https://twitter.com/realDonaldTrump/status/"+itm.id_str;
            var params = { id:meta_params.media_id, status:tweeturl+" "+itm.text, media_ids: [meta_params.media_id] }
            // var params = { id:meta_params.media_id, status:tweeturl+" "+itm.text.slice(0, 80)+'...', media_ids: [meta_params.media_id] }
            // console.log("this one should get posted: ", params.status.slice(20,40));
            _P.TwtrAPI.bot.post('statuses/update', params, function (err, data, response) {
              if (err) {
                console.log("err 1 ", err);
              }else{
                if(_P.App.mode=="PostCatchUps"){
                  _P.jsn.items.pop();
                  var itm = _P.jsn.items[_P.jsn.items.length-1];
                  var time = 1000*6;
                  setTimeout(_P.TwtrAPI.uploadImage, time, itm);
                  console.log("should be posted pls check \n");
                }else if(_P.App.mode=="MonitorForNew"){
                  console.log("new one should be posted pls check \n");
                  _P.ImageManager.numCreated--;
                  // console.log("_P.ImageManager.numCreated is ",_P.ImageManager.numCreated, "should be 0");
                  if(_P.ImageManager.numCreated==0){
                    _P.ImageManager.numCreated = 0;
                    _P.ImageManager.createdTgt = 0;
                    _P.TwtrAPI.since_id = _P.ImageManager.imageQueue[0].id_str;
                    _P.ImageManager.imageQueue = {};
                    console.log("all cleaned up, you go on ahead i'll keep listening for new ones.");
                  }
                }
              }
            });
          }else{
            console.log("OOOOOOOOOOOOOOOOYOU MESSED UP",err);
          }
        })
      })
  },
  inspectForNew: function(data){
    if(data.length==0){
      console.log("we are up to date");
      return;
    }else{
      // console.log("we have some work to do.");
      _P.TweetHandler.parseTweets(data);
    }
  }
}
_P.TweetHandler = {
  parseTweets: function(data){
    console.log("parsing "+data.length+" tweets");
      if (_P.App.mode=="GetJSON") {
        for (var i = 0; i < data.length; i++) {
          var d = data[i];
          console.log(i,": ",d.id, "    ", d.text.slice(0,10), "   ", new Date(Date.parse(d.created_at.replace(/( +)/, ' UTC$1'))).getDate());
          _P.jsonObj.items.push(['\n{\n\"text\":\"'+d.text+"\"",'\n\"id_str\":'+d.id_str, '\n\"id\":'+d.id+',\n\"date\":\"'+d.created_at+"\"}"]);
        }
        this.writeJSON();
      }else if (_P.App.mode=="MonitorForNew") {
        _P.ImageManager.generateLatestImages(data);
      }
  },
  writeJSON: function(){
      _P.fs.writeFile('myjsonfile.json', _P.jsonObj.items, 'utf8', function(){
        console.log("json written!");
      });
    }
}
_P.Utils = {
  prepTweet: function(str){
    var s = str;
    if(s!=undefined){
      //remove links
      s = s.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
      //remove RT
      if(s.substr(0,2)=="RT"){
        s = s.slice(2);
      }
      if(s.substr(0,1).charCodeAt(0)==8220){ // it's the “ character
        // console.log("GOT ONEEEE");
        s = s.slice(1);
        s = s.slice(0, -1)
      }
      if(s.substr(0,18)==" @realDonaldTrump:"){
        s = s.slice(18);
      }
      //
      // s = s.replace(/&amp;/gi, "&");
      while(s.length < 140){
        s = s.concat(str);
      }
      s = s.slice(0,140);
    }
    return s;
  },
  clearCanvas: function(){
    _P.ctx.clearRect(0,0,_P.wh, _P.wh);
    _P.ctx.fillStyle="#FFFFFF";
    _P.ctx.fillRect(0,0,_P.wh,_P.wh);
  },
  debug: function(arr){
    // console.log("de-bug: arr is this linig: ", arr.length);
    arr.forEach(function(e,i){
      _P.ctx.fillStyle="rgba(0,0,0, 0.5)";
      _P.ctx.beginPath();
      _P.ctx.arc(e.x, e.y, 1, 0, Math.PI*2, false);
      _P.ctx.fill();
    });
  }
}
_P.StringManager = {
  valuesArr: [],
  shapeSourceArr: [],
  ptsArr: [],
  string: "",
  figureOutString: function(str){
    this.tweet="If Republican Senate doesn't get rid of the Filibuster Rule & go to a simple majority, which the Dems would do, they are just wasting time!";
    if(str==undefined || str==""){
      this.string = this.tweet;
    }else{
      this.string = str;
    }
    //prepTweet cleans up the string, sets it to 140 chars if needed, etc
    this.string = _P.Utils.prepTweet(this.string);
    return this.string;
  },
  createInitialPoints:function(){
    this.valuesArr = [];
    this.shapeSourceArr = [];
    this.ptsArr = [];
    for (var i = 0; i <this.string.length; i++) {
      this.valuesArr.push(this.string.charCodeAt(i));
    }
    // console.log(this.valuesArr);
    var lucky = this.valuesArr[61]%2+1;
    var vert = 0;
    if (this.valuesArr[77] <= 38){
      //creates two pts waaay down below
      vert = 1000*this.valuesArr[77];
    }
    this.shapeSourceArr = [
      {x:(this.valuesArr[6]), y:this.valuesArr[7]},
      {x:(_P.App.centerW-this.valuesArr[6])*lucky, y:_P.App.centerH-this.valuesArr[7]},
      {x:this.valuesArr[8], y:this.valuesArr[9]*(-lucky)},
      {x:_P.App.centerW+(this.valuesArr[10]), y:this.valuesArr[11]*(this.valuesArr[95]/42)},
      {x:_P.App.centerW+this.valuesArr[12], y:_P.App.centerH+this.valuesArr[13]*(this.valuesArr[93]/42.5)*lucky+vert},
      {x:_P.App.centerW-this.valuesArr[84], y:_P.App.centerH+this.valuesArr[15]*(this.valuesArr[91]/48.5)*-lucky+vert}
    ];
    this.ptsArr = this.shapeSourceArr.slice();
    // console.log("ptsARR is ", this.ptsArr.length);
    this.iter = Math.floor(this.valuesArr[87]/10)+3;
    this.iter = Math.min(12, this.iter);
    // this.iter = 3;
    this.randomness = this.valuesArr[80]+19;
  }
}
_P.ColorManager={
    c: {r:0,g:0,b:0},
    chooseColor: function(i){
      if(i%4==0){
          this.setColor();
      }else{
        this.setColor(this.c.r,this.c.g,this.c.b);
      }
    },
    setColor: function(r,g,b){
      if(r==undefined){
        // console.log("gonna calculate the color myself");
        this.c.r=Math.floor(_P.StringManager.valuesArr[36]*(_P.StringManager.valuesArr[72]/50));;
        this.c.g=Math.floor(_P.StringManager.valuesArr[33]*(_P.StringManager.valuesArr[3]/83));;
        this.c.b=Math.floor(_P.StringManager.valuesArr[43]*(_P.StringManager.valuesArr[13]/80));
      }else{
        // console.log("color's passed in, ",r, g, b);
        this.c.r = r;
        this.c.g = g;
        this.c.b = b;
      }
      // console.log(this.c);
    },
    getColor: function(){
      return "rgba("+this.c.r+","+this.c.g+","+this.c.b+",0.012)";
    },
    setCompositeType: function(){
      var n = Math.round(_P.rand()*100);
      // console.log(n);
      if(n%4==0){
        _P.ctx.globalCompositeOperation = 'multiply';
      }else if(n%3==0){
        _P.ctx.globalCompositeOperation = 'overlay';
      }else {
        _P.ctx.globalCompositeOperation = 'hard-light';
      }
    }
}
_P.ImageManager={
  createdTgt:0,
  numCreated:0,
  count:0,
  generateImagesFromJSON: function(){
    // for (var i = _P.jsn.items.length-1; i >= _P.jsn.items.length-1; i--) {
    // for (var i = _P.jsn.items.length-1; i >= 0; i--) {
      var itm = _P.jsn.items[this.count];
      // console.log(this.count, "gonna create an image here", itm.date);
      var s = _P.StringManager.figureOutString(itm.text);
      console.log(this.count+" create img: "+s.slice(0,20)+"...\n");
      _P.StringManager.createInitialPoints();
      this.createArt();
      this.writeImage(itm);
    // }
  },
  generateLatestImages: function(data){
    this.imageQueue = data;
    this.createdTgt = data.length;
    for (var i = 0; i < data.length; i++) {
      var itm = data[i];
      console.log(i, "gonna create an image here rn", itm.text.slice(0,33)+"...");
      var s = _P.StringManager.figureOutString(itm.text);
      _P.StringManager.createInitialPoints();
      this.createArt();
      this.writeImage(itm);
    }
  },

  createArt: function(){
    // console.log("createArt");
    this.firstTime=true;
    _P.Utils.clearCanvas();
    var p = _P.StringManager.iter;
    // for (var h = 0; h < p-1; h++) {
    for (var h = 0; h < p; h++) {
      var arr=_P.StringManager.ptsArr.slice();
      for (var i = 0; i < p; i++) {
      // for (var i = h+1; i < p; i++) {
        _P.ColorManager.chooseColor(h*i);
        this.subDivide(arr);
        this.drawShape();
      }
    }
    // _P.Utils.debug(arr);

  },
  drawShape: function(){
    // console.log("drawShape called");
    if(this.firstTime){
      // console.log("first time in drawShape");
          this.rotateIt();
          this.firstTime=false;
      }
      _P.ctx.fillStyle=_P.ColorManager.getColor();
      _P.ColorManager.setCompositeType();
      _P.ctx.beginPath();
      _P.ctx.moveTo(_P.StringManager.ptsArr[0].x, _P.StringManager.ptsArr[0].y);
      for (var i = 1; i < _P.StringManager.ptsArr.length; i++) {
        var itm = _P.StringManager.ptsArr[i];
        if(i%5==0){
          _P.ctx.quadraticCurveTo(itm.x, itm.y, itm.x+(_P.rand()*10), itm.y+(_P.rand()*40));
        }else{
          _P.ctx.lineTo(itm.x, itm.y);
        }
      }
      _P.ctx.fill();
  },

  rotateIt: function(){
    var n = _P.StringManager.ptsArr[4].x%_P.StringManager.ptsArr[4].y;
    if (n<25) {
      // console.log("270 <<<");
      _P.ctx.translate(0, _P.App.centerH*2);
      _P.ctx.rotate(270*Math.PI/180);
    }else if (n>=25 && n<=50) {
      // console.log("90 >>>");
      _P.ctx.translate(_P.App.centerW*2, 0);
      _P.ctx.rotate(90*Math.PI/180);
    }else if (n>50 && n<=75) {
      // console.log("180 ^^^ ");
      _P.ctx.translate(_P.App.centerW*2, _P.App.centerH*2);
      _P.ctx.rotate(180*Math.PI/180);
    }else{
      // console.log("0 vvv");
    }
  },
  subDivide: function(arr){

    if(arr.length>31000){
      console.log("sufficient # of points, no more subdivision");
      return false;
    }
    var newArr = [];
    for (var i = 0; i < arr.length; i++) {
      if(i==0){
        //*|* first one
        newArr.push(arr[i]);
      }else{
        //*|* main loop
        var newPt = this.createNewPoint(arr[i], arr[i-1]);
        //push new point, then push older existing point
        newArr.push(newPt);
        newArr.push(arr[i]);
      }
    }
    //*|* last one! Wrap back to connect to the first point at the end of the loop
    var newPt = this.createNewPoint(arr[arr.length-1], arr[0]);
    newArr.push(newPt);
    _P.StringManager.ptsArr = newArr.slice();
    newArr=[];
  },
  createNewPoint: function(p1, p2){
      var p = {};
      var xx =(p1.x+p2.x) / 2;
      var yy = (p1.y+p2.y) / 2;
      var rrr = _P.rand();
      var ang =rrr *(2*Math.PI);
      var r= rrr*_P.StringManager.randomness;
      var x = xx+r*Math.cos(ang);
      var y = yy+r*Math.sin(ang);
      //
      p.x = x;
      p.y = y;
      return p;
  },
  writeImage: function(data){
    // console.log("writing image...");
    var imgD = _P.canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
    _P.fs.writeFile("img/"+data.id+'.png', imgD, 'base64', function(err){
      if (err) throw err
      if(_P.App.mode=="GenerateImagesFromJSON"){
          _P.ImageManager.count--;
          if(_P.ImageManager.count>=0){
            console.log("...keep going...");
              _P.ImageManager.generateImagesFromJSON();
          }else{
            console.log("so long, farewell.");
          }
      }else if(_P.App.mode=="MonitorForNew"){
        _P.ImageManager.numCreated++;
        // console.log("image created on the fly. "+_P.ImageManager.numCreated);
        // console.log(_P.ImageManager.numCreated," <<<so far    tgt>>>" , _P.ImageManager.createdTgt);
        if(_P.ImageManager.numCreated==_P.ImageManager.createdTgt){
          console.log("OKAY LOOKS LIKE WE ARE GOOD, GOT EM ALL CREATED. NOW NEED TO POST. ");
          // console.log(_P.ImageManager.createdTgt);
          for (var i = _P.ImageManager.createdTgt-1; i >= 0; i--) {
          // for (var i = 0; i <= _P.ImageManager.createdTgt-1; i--) {
            //image is created, need the data in json form somehow - need to store it
            // console.log("iterating!", i);
            var itm = _P.ImageManager.imageQueue[i];
            // console.log('uplaiding this', itm.text.slice(0,20));
            _P.TwtrAPI.uploadImage(itm);
          }

        }
      }
    })
  }
}
_P.App.init();
