var SPRITES = {
  computerAscii : "       ___________\n"+
"      |.---------.|\n"+
"      ||         ||\n"+
"      ||         ||\n"+
"      ||         ||\n"+
"      |'---------'|\n"+
"       ‾)__ ____(‾\n"+
"       [=== -- o ]\n"+
"       '---------'\n"
};

function Body(x, y, width, height) {
  var t = this;
  t.x = x; t.y = y; t.width = width; t.height = height;
  t.velocity = {x: 0, y: 0};
  t.update = function(dt) {
    t.x += t.velocity.x * dt;
    t.y += t.velocity.y * dt;
  };
  // this.impact = function
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
  this.flip = function(){
    H.FlipCanvas(t.c);
  };
  this.kill = function() {
    t.c = null;
    H.Null(t);
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
    H.Null(t)
  };
};

function renderMultilineText(text,lineheight,x,y){
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i],x,y); 
    y+=lineheight;
  }
}

function Player(){
  this.viruses = [ new Virus(null,1,1,1) ];
}

Player.prototype.releaseVirus = function(nodes) {
  this.viruses[0].setLocation(nodes[0]);
};

function Network(level) {
  this.nodes = this.generateMap(level);
};

Network.prototype.generateMap = function(level){
  var mapSize = level*5;
  var currentNode = new Node(null);
  var nodes = [];
  nodes = [ currentNode ];
  while(nodes.length < mapSize){
    var node = new Node(null);
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

function Virus(el,size,speed,hp) {
  this.element = el;
  this.size = size;
  this.speed = speed;
  this.hp = hp;
  this.location = null;
  this.dormant = false;
};

function Node(el) {
  this.element = el;
  this.linkedNodes = [];
  this.infectionLevel = 0;
  this.resilience = 100;
  this.infector = null;
};

Node.prototype.addConnectedNode = function(node) {
  this.linkedNodes.push(node);
  node.linkedNodes.push(this);
};

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

Virus.prototype.update = function() {
  if(this.location.infectionLevel>this.location.resilience){
    if(!this.dormant) Game.infected++;
    this.dormant = true;

    for (var i = this.location.linkedNodes.length - 1; i >= 0; i--) {
      if(this.location.linkedNodes[i].infectionLevel<this.location.linkedNodes[i].resilience) {
        if(!this.location.linkedNodes[i].infector) {
          var newVirus = this.split();
          newVirus.setLocation(this.location.linkedNodes[i]);
          Game.player.viruses.push(newVirus);
          break;
        }
      }
    }
  } else {
    this.location.infectionLevel+=this.speed;
  }
};

var Game = {
  level : 1,
  turns : 0,
  infected : 0,
  player : new Player(),
  map : new Network(25),
};

function update(){
    for (var i = Game.player.viruses.length - 1; i >= 0; i--) {
      Game.player.viruses[i].update();
    }
  }

Game.player.releaseVirus(Game.map.nodes);

while(Game.infected<Game.map.nodes.length) {
  Game.turns++;
  console.log(Game.infected+"<"+Game.map.nodes.length);  
  update();
}
console.log("completed in "+Game.turns+" turns.");
