var wh = 500;
var count = 0;
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
  function App(){
    //
    this.init=function(){
      //this.rand = function(){return Math.random();}
      this.rand = new Math.seedrandom(6666);
      // console.log(this.rand());
      this.main_canvas = canvas;
    	this.ctx = ctx;
      this.canvasHeight = wh;
    	this.canvasWidth = wh;
      this.centerH = this.canvasHeight/2;
    	this.centerW = this.canvasWidth/2;
      this.firstTime = true;
      // this.ctx.scale(7,7);
      this.ctx.clearRect(0,0,wh,wh);
      this.ctx.fillStyle="#FFFFFF";
      this.ctx.fillRect(0,0,wh,wh);

      //
      //instantiate Managers
      this.strMgr = new StringManager();
      this.clrMgr = new ColorManager();
      //
      this.strMgr.init();
    }
    //
    this.createBGShape=function(){
      this.firstTime=true;
      var p=this.strMgr.iter;
      this.clrMgr.setColor(33,33,33);
      // var p=7;
      for (var h = 0; h < p-1; h++) {

        var arr=this.strMgr.ptsArr;

        for (var i = h+1; i < p; i++) {
          this.addHalfPoints(arr);
          this.drawShape();
          if(i%4!=0){
              this.clrMgr.setColor();
          }else{
            //  this.clrMgr.setColor(252,250,0);
            this.clrMgr.setColor(this.clrMgr.c.r,this.clrMgr.c.g,this.clrMgr.c.b);
          }
        }
      }
      // this.clrMgr.setColor(222,150,20);
    }

    this.drawShape=function(){
      // console.log("drawShape called");
      if(this.firstTime){

            this.rotateIt();
            this.firstTime=false;
        }
        this.ctx.fillStyle="rgba("+this.clrMgr.c.r+","+this.clrMgr.c.g+","+this.clrMgr.c.b+",0.012)";
        if(Math.round(this.rand()*100)%4==0){
          this.ctx.globalCompositeOperation = 'multiply';
        }else if(Math.round(this.rand()*100)%3==0){
          this.ctx.globalCompositeOperation = 'overlay';
          // this.ctx.globalCompositeOperation = 'color-dodge';
        }else {
          this.ctx.globalCompositeOperation = 'hard-light';
        }
        this.ctx.beginPath();
        this.ctx.moveTo(this.strMgr.ptsArr[0].x, this.strMgr.ptsArr[0].y);
        for (var i = 0; i < this.strMgr.ptsArr.length; i++) {
          var itm = this.strMgr.ptsArr[i];
            // console.log(itm.x, itm.y);
              // this.ctx.lineTo(itm.x, itm.y);
              if(i%5==0){
                this.ctx.quadraticCurveTo(itm.x, itm.y, itm.x+(this.rand()*10), itm.y+(this.rand()*40));
              }else{
                this.ctx.lineTo(itm.x, itm.y);
              }
        }
        this.ctx.fill();
    }

    this.rotateIt = function(){
      var n = this.strMgr.ptsArr[4].x%this.strMgr.ptsArr[4].y;
      // console.log(n);
      if (n<25) {
        //270
        console.log("<<<");
        this.ctx.translate(0, this.centerH*2);
        this.ctx.rotate(270*Math.PI/180);

      }else if (n>=25 && n<=50) {
        //90
        console.log(">>>");
        this.ctx.translate(this.centerW*2, 0);
        this.ctx.rotate(90*Math.PI/180);
      }else if (n>50 && n<=75) {
        //180
        console.log("^^^^");
        this.ctx.translate(this.centerW*2, this.centerH*2);
        this.ctx.rotate(180*Math.PI/180);
      }else{
        console.log("vvvvvv");
        //keep it at 0
      }
    }

    this.addHalfPoints=function(arr){
      if(arr.length>31000){
        return false;
      }
      // console.log("addHalfPoints() called");
      var newArr = [];
    //  this.ctx.beginPath();
      //
      for (var i = 0; i < arr.length; i++) {
        if(i==0){
          //*|* first one
          newArr.push(arr[i]);
        }else{
          //*|* main loop
          var newPt = this.createNewPoint(arr[i], arr[i-1]);
          newArr.push(newPt);
          //
          newArr.push(arr[i]);
        }
      }
      //*|* last one! Wrap back to connect to the first point at the end of the loop
      var newPt = this.createNewPoint(arr[arr.length-1], arr[0]);
      newArr.push(newPt);
      //
      this.strMgr.ptsArr = newArr;
      newArr = [];
    }
    //
    this.createNewPoint=function(p1, p2){
        var p = {};
        var xx =(p1.x+p2.x) / 2;
        var yy = (p1.y+p2.y) / 2;
        //
        var rrr = this.rand();
        var ang =rrr *(2*Math.PI);
        var r= rrr*this.strMgr.randomness;
        var x = xx+r*Math.cos(ang);
        var y = yy+r*Math.sin(ang);
        //
        p.x = x;
        p.y = y;

        return p;
    }
    //
  }

function StringManager() {
  //
  this.init = function(str){
    // ctx.clearRect(0,0,wh,wh);
    // ctx.fillStyle="#FFFFFF";
    // ctx.fillRect(0,0,wh,wh);
    // //
    this.valuesArr = [];
    this.shapeSourceArr = [];
    this.ptsArr = [];
    this.urlParams = {};
    //
    this.tweet="If Republican Senate doesn't get rid of the Filibuster Rule & go to a simple majority, which the Dems would do, they are just wasting time!";
    this.tweet="Hurricane looks like largest ever recorded in the Atlantic!";
    this.tweet="I am allowing Japan & South Korea to buy a substantially increased amount of highly sophisticated military equipment from the United States.";
    var str = this.setURLParams();
    console.log(str);
    if(str==undefined || str==""){
      this.string = this.tweet;
    }else{
      this.string = str;
    }
    //prepTweet cleans up the string, sets it to 140 chars if needed, etc
    this.string = this.prepTweet(this.string);
    //
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
    //
    // console.log(APP.rand());
    this.shapeSourceArr = [
      {x:(this.valuesArr[6]), y:this.valuesArr[7]},
      {x:(APP.centerW-this.valuesArr[6])*lucky, y:APP.centerH-this.valuesArr[7]},
      {x:this.valuesArr[8], y:this.valuesArr[9]*(-lucky)},
      {x:APP.centerW+(this.valuesArr[10]), y:this.valuesArr[11]*(this.valuesArr[95]/42)},
      {x:APP.centerW+this.valuesArr[12], y:APP.centerH+this.valuesArr[13]*(this.valuesArr[93]/42.5)*lucky+vert},
      {x:APP.centerW-this.valuesArr[84], y:APP.centerH+this.valuesArr[15]*(this.valuesArr[91]/48.5)*-lucky+vert}
    ];
    //
    // create random pts for shapeSourceArr
    // var it = Math.floor(this.valuesArr[3]/10);
    // // // console.log(it);
    // for (var i = 0; i < it;  i++) {
    //   this.shapeSourceArr.push({x:APP.rand()*APP.canvasWidth,y:APP.rand()*APP.canvasHeight})
    // }
    // create roughly circular pts for shapeSourceArr
    // this.shapeSourceArr = [{x:250, y:10},{x:400, y:150},{x:450, y:300},{x:250, y:400},{x:50, y:350},{x:100, y:100}];
    // this.debug(this.shapeSourceArr);
    // console.log(this.shapeSourceArr);
    this.ptsArr = this.shapeSourceArr.slice();
    this.iter = Math.floor(this.valuesArr[87]/10) +7;
    this.iter = Math.min(14, this.iter);
    // this.iter = 16;
    this.randomness = this.valuesArr[80]+20;
    // this.randomness = 1;
    // console.log(this.randomness);
    APP.createBGShape();

  };
  //
  this.setURLParams = function(){
    console.log("in setURLParams()");
      var searchStr = decodeURI(window.location.search.substring(1));
      var paramArr = searchStr.split('&');
        for(var i = 0; i < paramArr.length; i++){
            var KeyValPair = paramArr[i].split('=');
            this.urlParams[KeyValPair[0]] = KeyValPair[1];
        }
     	if(this.urlParams.string!=undefined && this.urlParams.string.length>0){
        var t = this.urlParams.string.replace('#','_');

        return t;
     	}

  }

  //
  this.prepTweet = function(str){
    var s = str;
    // console.log("before ", s);
    // console.log(s.substr(0,1).charCodeAt(0));
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

    while(s.length < 140){
      // console.log("notyet");
      s = s.concat(str);
    }
    s = s.slice(0,140);
    return s;
  }
  //
  this.debug = function(arr){
    arr.forEach(function(e,i){
      APP.ctx.fillStyle="rgb(0,0,0)";
      APP.ctx.beginPath();
      APP.ctx.arc(e.x, e.y, 3, 0, Math.PI*2, false);
      APP.ctx.fill();
    });
  }
}
/////
function ColorManager() {
  this.count=0;
  //
  this.setColor = function(r,g,b){
    this.count++;
    this.c={};
    if(r==undefined){
      // console.log("gonna calculate the color myself");
      this.c.r=Math.floor(APP.strMgr.valuesArr[36+this.count]*(APP.strMgr.valuesArr[72]/50));;
      this.c.g=Math.floor(APP.strMgr.valuesArr[33+this.count]*(APP.strMgr.valuesArr[3]/83));;
      this.c.b=Math.floor(APP.strMgr.valuesArr[43-this.count]*(APP.strMgr.valuesArr[13]/80));
    }else{
      // console.log("color's passed in, ",r, g, b);
      this.c.r = r;
      this.c.g = g;
      this.c.b = b;
    }
  }
}

var APP = new App();
APP.init();
