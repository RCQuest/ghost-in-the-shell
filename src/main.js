var Sprites = {
  NODE: "▣",
  VIRUS: "❉"
}

var CHAR_HEIGHT = 20;
var CHAR_WIDTH = 20;
var FONT = "24px Courier";

var H = {
  sp: function(x, y, whole) {
    if(whole || (whole === undefined))
      return {x: parseInt(x)*CHAR_WIDTH, y: parseInt(y)*CHAR_HEIGHT};
    else
      return {x: x*CHAR_WIDTH, y: y*CHAR_HEIGHT};
  },
  R: function(x, y, w, h, c, f) {
    c.fillStyle = '#'+f;
    c.fillRect(x, y, w, h);
  },
  T: function(t, x, y, c, f, l, a, w) {
    c.font = f;
    c.fillStyle = '#'+l;
    c.textAlign = a || 'left';
    c.fillText(t, x, y);
  },
  RE: function(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
  }
};

function Char(s, color, bg, alpha) {
  var t = this;
  t.s = s;
  t.color = color;
  t.bg = bg;
  t.r = t.renderer = new Renderer((CHAR_WIDTH*s.length), CHAR_HEIGHT, alpha);
  if(t.bg !== undefined)
  {
    H.R(0, 0, (CHAR_WIDTH*s.length), CHAR_HEIGHT, t.r.x, t.bg);
  }
  H.T(t.s, (CHAR_WIDTH*s.length)/2, CHAR_HEIGHT -1, t.r.x, FONT, t.color, 'center');
  t.stamp = function(d, x, y){
    t.r.stamp(d, x, y);
  };
  t.kill = function(){
    t.r.kill();
    t = null;
  };
};

function Body(x, y, width, height) {
  var t = this;
  t.x = x; t.y = y; t.width = width; t.height = height;
  t.velocity = {x: 0, y: 0};
  t.update = function(dt) {
    t.x += t.velocity.x * dt;
    t.y += t.velocity.y * dt;
  };
};

var p_i = 1;

var Physics = {
  createBody: function(entity, x, y, width, height, fixed) {
    var body = new Body(x, y, width, height, fixed);
    body.i = p_i;
    p_i ++;
    return body;
  }
};

function Renderer(width, height, alpha) {
  var t = this;
  t.canvas = t.c = document.createElement('canvas');
  t.c.width = t.width = width;
  t.c.height = t.height = height;
  t.context = t.x = t.c.getContext('2d');
  t.x.globalAlpha = t.alpha = alpha || 1;
  t.x.imageSmoothingEnabled = false;
  t.x.fontStyle = FONT;
  t.whole = false;
  this.stamp = function(d, x, y){
    var c = H.sp(x || 0, y || 0, t.whole);
    d.drawImage(t.c, c.x, c.y);
  };
  this.kill = function() {
    t.c = null;
    t = null;
  }
};

function Sprite(x, y, renderer) {
  var t = this;
  t.renderer = renderer;
  t.x = x;
  t.y = y;
  t.body = Physics.createBody(t, x, y, CHAR_WIDTH, CHAR_HEIGHT);
  t.stamp = function(toCanvas, x, y) {
    t.renderer.stamp(toCanvas, x || t.body.x, y || t.body.y);
  };
  t.update = function(dt) {
    t.body.update(dt);
  };
  t.kill = function() {
    t.renderer.kill();
    t = null;
  };
};

function Player(){
  this.viruses = [ new Virus(null,1,1,1) ];
}

Player.prototype.releaseVirus = function(nodes) {
  this.viruses[0].setLocation(nodes[0]);
};

function Network(level) {
  this.nodes = this.generateMap(level);
};

Network.prototype.generateMapLegacy = function(level){
  var mapSize = level*5;
  var currentNode = new Node(
    Math.floor((Game.width)*Math.random()),
    Math.floor((Game.height)*Math.random()));
  var nodes = [];
  nodes = [ currentNode ];
  while(nodes.length < mapSize){
    var node = new Node(
      Math.floor((Game.width)*Math.random()),
      Math.floor((Game.height)*Math.random()));
    currentNode.addConnectedNode(node);
    nodes.push(node);
    if(Math.random()>0.5){
      currentNode = node;
    }
  }
  for (var i = level - 1; i >= 0; i--) {
    var node1 = nodes[Math.floor(Math.random() * nodes.length)];
    var node2 = nodes[Math.floor(Math.random() * nodes.length)];
    if(node1!=node2) node1.addConnectedNode(node2);
  }
  console.log(nodes);
  return nodes;
}

Network.prototype.generateMap = function(level) {
  var mapSize = level*5;
  var nodes = [];
  var direction = [[1,0],[0,1],[-1,0],[0,-1]];
  nodes = [ new Node(Math.floor(Game.width/2),Math.floor(Game.height/2)) ];
  while(nodes.length < mapSize){
    var nextNode = H.RE(nodes);
    var isOccupied = false;
    var nX = nextNode.x+direction[nodes.length%direction.length][0];
    var nY = nextNode.y+direction[nodes.length%direction.length][1];
    for (var i = nodes.length - 1; i >= 0; i--) {
      if(nodes[i].x==nX&&nodes[i].y==nY) isOccupied=true;
    }
    if(!isOccupied) nodes.push(new Node(nX,nY));
    console.log(nX+","+nY);
  }
  for (var i = nodes.length - 1; i >= 0; i--) {
    for (var j = nodes.length - 1; j >= 0; j--) {
      for (var k = direction.length - 1; k >= 0; k--) {
        if(nodes[i].x+direction[k][0]==nodes[j].x
          &&nodes[i].y+direction[k][1]==nodes[j].y)
          nodes[i].addConnectedNode(nodes[j]);
      }
    }
  }
  console.log(nodes);
  return nodes;

};

function Virus(el,size,speed,hp) {
  this.element = el;
  this.size = size;
  this.speed = speed;
  this.hp = hp;
  this.location = null;
  this.dormant = false;
};

function Node(x,y) {
  this.char = new Char(
    Sprites.NODE, 
    "FFFFFF", 
    "FF0000", 
    1);
  this.x = x;
  this.y = y;
  this.linkedNodes = [];
  this.infectionLevel = 0;
  this.resilience = 1;
  this.infector = null;

};

Node.prototype.addConnectedNode = function(node) {
  if(this.linkedNodes.indexOf(node)==-1)
    this.linkedNodes.push(node);
  if(node.linkedNodes.indexOf(this)==-1)
    node.linkedNodes.push(this);
};

Node.prototype.isInfected = function() {
  return this.infectionLevel>this.resilience;
};

Node.prototype.draw = function() {
  this.char = new Char(
    Sprites.NODE,
    "FFFFFF",
    this.isInfected() ? "00FF00" : "FF0000",
    1);
  this.char.r.stamp(UI.ctx,this.x,this.y);
}

Virus.prototype.split = function() {
  return new Virus(
    null,
    this.mutate(this.size),
    this.mutate(this.speed),
    this.mutate(this.hp));
};

Virus.prototype.setLocation = function(node) {
  this.location = node;
  node.infector = this;
};

Virus.prototype.mutate = function(value){
  return Math.max(value+((Math.random()*2)-1),1);
};

Virus.prototype.update = function(dt) {
  if(this.location.infectionLevel>this.location.resilience){
    if(!this.dormant) Game.infected++;
    this.dormant = true;

    for (var i = this.location.linkedNodes.length - 1; i >= 0; i--) {
      if(this.location.linkedNodes[i].infectionLevel<this.location.linkedNodes[i].resilience) {
        if(!this.location.linkedNodes[i].infector) {
          console.log("splitting!");
          var newVirus = this.split();
          newVirus.setLocation(this.location.linkedNodes[i]);
          Game.player.viruses.push(newVirus);
          break;
        }
      }
    }
  } else {
    this.location.infectionLevel+=this.speed*dt;
  }
};

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var States = {
  INIT : 0,
  INFECTING : 1,
  SUCCESS : 2,
  DEFEAT : 3
};

var Game = {
  state : States.INIT,
  level : 1,
  infected : 0,
  player : new Player(),
  map : null,
  time : 1,
  active : true,
  width : canvas.width/CHAR_WIDTH,
  height : canvas.height/CHAR_HEIGHT,
  allNodesAreInfected : function() {
    return (Game.infected>=Game.map.nodes.length);
  }
};

var UI = {
  ctx : null,
  renderer : null,
  init : function(ctx) {
    UI.ctx = ctx;
    UI.renderer = new Renderer(Game.width, Game.height, 1);
  },
  update : function(dt) {
    if(Game.state==States.INIT) {
      Game.map = new Network(10);
      Game.player.viruses[0].setLocation(Game.map.nodes[0]);
      Game.state = States.INFECTING;
    } 
    else if(Game.state==States.INFECTING) {
      for (var i = Game.player.viruses.length - 1; i >= 0; i--) {
        Game.player.viruses[i].update(dt);
      }
      if(Game.allNodesAreInfected()) {
        Game.state = States.SUCCESS;
        console.log("infected all nodes!");
      }
    }
  },
  draw : function() {
    var ctx =  UI.renderer.x;
    ctx.clearRect(0, 0, Game.width, Game.height);
    Game.map.nodes.forEach(function(node){
      node.draw();
    });
  }
}

var last_stamp = 0;

UI.init(ctx);

function update(timestamp) {

  var dt = (timestamp - last_stamp)/1000;
  last_stamp = timestamp;

  if(Game.active) {

    dt = dt * Game.time;

    UI.update(dt);

    UI.draw();

    // if(CALLBACKS)
    //   CALLBACKS.forEach(function(cb){
    //     cb.f(dt);
    //   });
    // H.MouseClick = false;
  }

  window.requestAnimationFrame(update);
}

window.requestAnimationFrame(update);
