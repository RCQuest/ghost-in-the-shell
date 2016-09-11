var Levels = {
  1 : [
    [1,3,4,5,1]
  ],
  3 : [
    [4,4,5,2,1],
    [1,4,5,1,2],
    [3,3,5,3,3],
    [1,4,5,2,1]
  ],
  5 : [
    [1,1,1,1,1,1,1,1],
    [3,3,3,1,1,3,3,3],
    [1,1,0,1,1,0,1,1],
    [1,1,5,5,5,5,1,1],
    [1,0,0,0,0,0,0,1],
    [1,4,1,1,1,1,4,1],
    [4,4,4,4,4,4,4,4]
  ]
}

var Sprites = {
  NODE: "▣",
  VIRUS: "❉",
  ARGOLAB: "A",
  MEGATEC: "M",
  NANOCORP: "N"
};

var LOW_HP = 0.25;

var Colors = {
  WHITE : 'FFFFFF',
  BULKY : 'f400b6',
  BULKY_LOW_HP: 'C039A6',
  TINY : '88b700',
  TINY_LOW_HP : '859D42',
  SPEEDY : '00b7b7',
  SPEEDY_LOW_HP : '3A9DA7',
  ERROR : 'FF00FF',
  DEAD : '817e93',
  NEUTRAL : 'FFFFFF',
  NEUTRAL_LOW_HP : 'C0BEC9',
  NODE : 'd6d0da',
  NODE_INFECTED : '444057',
  NODE_UNINFECTED : '817e93',
  BG : '363246'
};

var SpecialNarrative = {
  ARGOLAB : "Renegade! ARGOLAB nodes have firewall technology which helps eliminate viruses of smaller size.",
  NANOCORP : "Renegade! NANOCORP nodes are more suspicious of bigger viruses and take longer to upload to.",
  MEGATEC : "Renegade! MEGATEC nodes have strong firewalls that reduce infection speeds."
};

var NarrativeStack = [
  "Renegade! Viruses will spread across a network by mutliplying to and attacking adjacent nodes.",
  "Renegade! You should pick the virus that you suspect performed the best at infecting a particular node, or particularly strong descendants.",
  "Renegade! Viruses that split off others will inherit the properties of their parent, but will mutate slightly, getting better or worse at random.",
  "Renegade! As your level increases, networks will become harder to infect as our enemies adapt to our technology.",
  "Renegade! Viruses are coloured based on their best stat.",
  "Renegade! Viruses that have turned partly grey have little HP left, and fully grey viruses have been eliminated.",
  "Renegade! Viruses that infect a node faster probably have a higher SPEED stat.",
  "Renegade! Viruses will appear translucent as they initially upload to a node, and smaller viruses will take less time to upload."
];

var States = {
  INIT : 0,
  INFECTING : 1,
  SUCCESS : 2,
  DEFEAT : 3,
  METAGAME : 4
};

var VirusType = {
  TINY: 0,
  SPEEDY: 1,
  BULKY: 2,
  NEUTRAL: 3
};

var NodeTypes = {
  NORMAL : 0,
  MEGATEC : 1,
  NANOCORP : 2,
  ARGOLAB : 3
};

var NodeTypeToNarrative = {};
NodeTypeToNarrative[NodeTypes.MEGATEC] = SpecialNarrative.MEGATEC;
NodeTypeToNarrative[NodeTypes.NANOCORP] = SpecialNarrative.NANOCORP;
NodeTypeToNarrative[NodeTypes.ARGOLAB] = SpecialNarrative.ARGOLAB;

var virusTypeToColorMap = {};
virusTypeToColorMap[VirusType.TINY] = {healthy:Colors.TINY,harmed:Colors.TINY_LOW_HP};
virusTypeToColorMap[VirusType.SPEEDY] = {healthy:Colors.SPEEDY,harmed:Colors.SPEEDY_LOW_HP};
virusTypeToColorMap[VirusType.BULKY] = {healthy:Colors.BULKY,harmed:Colors.BULKY_LOW_HP};
virusTypeToColorMap[VirusType.NEUTRAL] = {healthy:Colors.NEUTRAL,harmed:Colors.NEUTRAL_LOW_HP};

var NodeTypesToSprites = {};
NodeTypesToSprites[NodeTypes.NORMAL] = Sprites.NODE;
NodeTypesToSprites[NodeTypes.MEGATEC] = Sprites.MEGATEC;
NodeTypesToSprites[NodeTypes.NANOCORP] = Sprites.NANOCORP;
NodeTypesToSprites[NodeTypes.ARGOLAB] = Sprites.ARGOLAB;

var CHAR_HEIGHT = 30;
var CHAR_WIDTH = 30;
var FONT = "36px Courier";

var H = {
  MouseCoords : null,
  MouseClick : false,
  sp: function(x, y, whole) {
    if(whole || (whole === undefined))
      return {x: parseInt(x)*CHAR_WIDTH, y: parseInt(y)*CHAR_HEIGHT};
    else
      return {x: x*CHAR_WIDTH, y: y*CHAR_HEIGHT};
  },
  C: function(n,min,max) {
    return Math.max(min,Math.min(n,max));
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
  },
  ODP: function(n) {
    return Math.round(n * 10) / 10
  },
  NWC: function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  this.viruses = [ new Virus(1,1,1) ];
}

Player.prototype.getVirusFromPosition = function(x,y) {
  for (var i = this.viruses.length - 1; i >= 0; i--) {
    if(this.viruses[i].location.x==x&&this.viruses[i].location.y==y) 
      return this.viruses[i];
  }
  return null;
};

Player.prototype.releaseVirus = function(nodes) {
  this.viruses[0].setLocation(nodes[0]);
};

Player.prototype.killViruses = function() {
  for (var i = this.viruses.length - 1; i >= 0; i--) {
    this.viruses[i].char.kill();
    this.viruses.splice(i,1);
  }
};

function Network(level) {
  if(!Levels.hasOwnProperty((level%10).toString())) this.nodes = this.generateMap(level);
  else this.nodes = this.createMapFromLevelData(Levels[(level%10).toString()]);
};

Network.prototype.killNodes = function() {
  for (var i = this.nodes.length - 1; i >= 0; i--) {
    this.nodes[i].char.kill();
    this.nodes.splice(i,1);
  }
};

Network.prototype.getNodeFromPosition = function(x,y) {
  for (var i = this.nodes.length - 1; i >= 0; i--) {
    if(this.nodes[i].x==x&&this.nodes[i].y==y) 
      return this.nodes[i];
  }
  return null;
};

Network.prototype.createMapFromLevelData = function(levelData) {
  var xOffset = Math.floor((Game.width/2));
  var yOffset = Math.floor((Game.height/2));
  var nodes = [];
  for (var i = levelData.length - 1; i >= 0; i--) {
    for (var j = levelData[i].length - 1; j >= 0; j--) {
      switch(levelData[i][j]) {
        case 0:
          break;
        case 1:
          nodes.push(new Node(j+xOffset,i+yOffset));
          break;
        case 2:
          nodes.push(new Node(j+xOffset,i+yOffset,NodeTypes.NORMAL,false));
          break;
        case 3:
          nodes.push(new Node(j+xOffset,i+yOffset,Game.getNodeIfIntroduced(NodeTypes.ARGOLAB),false));
          break;
        case 4:
          nodes.push(new Node(j+xOffset,i+yOffset,Game.getNodeIfIntroduced(NodeTypes.MEGATEC),false));
          break;
        case 5:
          nodes.push(new Node(j+xOffset,i+yOffset,Game.getNodeIfIntroduced(NodeTypes.NANOCORP),false));
          break;
        default:
          break;
      }
    }
  }

  return this.linkUpNodes(nodes);
};

Network.prototype.linkUpNodes = function(nodes) {
  var direction = [[1,0],[0,1],[-1,0],[0,-1]];
  for (var i = nodes.length - 1; i >= 0; i--) {
    for (var j = nodes.length - 1; j >= 0; j--) {
      for (var k = direction.length - 1; k >= 0; k--) {
        if(nodes[i].x+direction[k][0]==nodes[j].x
          &&nodes[i].y+direction[k][1]==nodes[j].y)
          nodes[i].addConnectedNode(nodes[j]);
      }
    }
  }
  return nodes;
};

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
  }

  nodes = this.linkUpNodes(nodes);

  if(Game.nodeTypes.length>0){
    Game.nodeTypes.forEach(function(nodeType){
      Game.typeToConsole(Game.nodeTypes);
      var randomNode = H.RE(nodes);
      if(Math.random()>0.5){
        var x = randomNode.x;
        for (var i = nodes.length - 1; i >= 0; i--) {
          if(nodes[i].x==x) nodes[i].setType(nodeType);
        }
      } else {
        var y = randomNode.y;
        for (var i = nodes.length - 1; i >= 0; i--) {
          if(nodes[i].y==y) nodes[i].setType(nodeType);
        }
      }
    });
  }

  return nodes;

};

function Virus(size,speed,hp) {
  this.char = null;
  this.setType(size,speed,hp);
  this.size = size;
  this.uploading = true;
  this.uploadProgress = 1;
  this.speed = speed;
  this.maxHp = this.hp = hp;
  this.location = null;
  this.dormant = false;
  this.generateColoration(this.type);
};

function Node(x,y,nodeType,deployable) {
  this.char = null;
  this.type = nodeType || NodeTypes.NORMAL;
  this.x = x;
  this.y = y;
  this.deployable = deployable==null ? true : deployable;
  this.linkedNodes = [];
  this.infectionLevel = 0;
  this.antiVirusPower = Game.baseAntiVirusLevel();
  this.resilience = Game.baseResilienceLevel();
  this.infector = null;
  this.uploadMultiplier = 1;
  this.infectionMultiplier = 1;
  this.antivirusMultiplier = 1;
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

Node.prototype.setType = function(type) {
  this.type = type;
  switch(type){
    case NodeTypes.ARGOLAB:
      this.antivirusMultiplier = 2;
      break;
    case NodeTypes.MEGATEC:
      this.infectionMultiplier = 0.5;
      break;
    case NodeTypes.NANOCORP:
      this.uploadMultiplier = 0.5;
    default:
      break;
  }
};

Node.prototype.setModifiers = function(infectorType) {
  if(this.type==NodeTypes.NORMAL)
    return;
  switch(this.type){
    case NodeTypes.ARGOLAB:
      if(infectorType==VirusType.TINY) this.uploadMultiplier = 0.5;
      break;
    case NodeTypes.MEGATEC:
      if(infectorType==VirusType.SPEEDY) this.antivirusMultiplier = 2;
      break;
    case NodeTypes.NANOCORP:
      if(infectorType==VirusType.BULKY) this.infectionMultiplier = 0.5;
    default:
      break;
  }
};

Node.prototype.draw = function() {
  this.char = new Char(
    NodeTypesToSprites[this.type],
    Colors.NODE,
    this.isInfected() ? Colors.NODE_INFECTED : Colors.NODE_UNINFECTED,
    1);
  this.char.r.stamp(UI.ctx,this.x,this.y);
};

Virus.prototype.draw = function() {
  if(this.location) {
    this.char = new Char(
      Sprites.VIRUS,
      this.determineCurrentColor(),
      undefined,
      (this.uploadProgress>0) ? 0.5 : 1);
      this.char.r.stamp(UI.ctx,this.location.x,this.location.y);
  }
};

Virus.prototype.determineCurrentColor = function() {
  if(this.hp>this.maxHp*0.4){
    return this.color;
  } else if(this.hp>0) { 
    return this.lowHpColor;
  } else {
    return Colors.DEAD;
  }
};

Virus.prototype.split = function() {
  return new Virus(
    this.mutate(this.size),
    this.mutate(this.speed),
    this.mutate(this.maxHp));
};

Virus.prototype.setType = function(sizeRating,speed,hp) {
  if(sizeRating>speed&&sizeRating>hp){
    this.type = VirusType.TINY;
    return;
  }
  if(speed>sizeRating&&speed>hp){
    this.type = VirusType.SPEEDY;
    return;
  }
  if(hp>sizeRating&&hp>speed){
    this.type = VirusType.BULKY;
    return;
  }
  this.type = VirusType.NEUTRAL;
};

Virus.prototype.setLocation = function(node) {
  this.location = node;
  node.infector = this;
  this.location.setModifiers(this.type);
};

Virus.prototype.mutate = function(value){
  return Math.max(value+((Math.random()*2)-1),Math.exp((1-Game.level)/10));
};

Virus.prototype.generateColoration = function(type) {
  this.color = virusTypeToColorMap[type].healthy;
  this.lowHpColor = virusTypeToColorMap[type].harmed;
};

Virus.prototype.update = function(dt) {
  if(this.dormant) return;
  if(this.hp<0) this.dormant = true;
  if(this.location.infectionLevel>this.location.resilience){
    this.dormant = true;
    Game.infected++;

    Game.addToCurrency(H.ODP(this.maxHp+this.size+this.speed));
    
    for (var i = this.location.linkedNodes.length - 1; i >= 0; i--) {
      if(!this.location.linkedNodes[i].infector) {
        var newVirus = this.split();
        newVirus.setLocation(this.location.linkedNodes[i]);
        Game.player.viruses.push(newVirus);
      }
    }
  } else {
    if(this.uploading){
      this.uploadProgress-=this.size*dt*this.location.uploadMultiplier;
      if(this.uploadProgress<0) this.uploading=false;
      else {
        this.hp-=this.location.antiVirusPower*dt;
      }
    } else {
      this.location.infectionLevel+=this.speed*dt*this.location.infectionMultiplier;
      this.hp-=this.location.antiVirusPower*dt*this.location.antivirusMultiplier;
    }
  }
};

var canvas = document.querySelector('#game');
var htmlConsole = document.querySelector('#c');
var currencyHUD = document.querySelector('#hc');
var infectionHUD = document.querySelector('#hi');
var ctx = canvas.getContext('2d');

var Game = {
  state : States.INIT,
  level : 1,
  infected : 0,
  nodeIntroductionCounter : 5,
  player : new Player(),
  map : null,
  time : 1,
  active : true,
  width : canvas.width/CHAR_WIDTH,
  height : canvas.height/CHAR_HEIGHT,
  nodeTypes: [],
  currency: 0,
  formattedCurrency : "0",
  infectionAward: 1000,
  difficultyMultiplier: 1,
  difficultyError: function(){
    return H.C((((this.level-6)/90)+0.6),0.6,0.9);
  },
  allNodesAreInfected : function() {
    return (Game.infected>=Game.map.nodes.length);
  },
  allVirusesAreDormant : function(){
    for (var i = this.player.viruses.length - 1; i >= 0; i--) {
      if(!this.player.viruses[i].dormant) {
        return false;
      }
    }
    return true;
  },
  hasWonThisRound : function() {
    return (this.infected*2 > this.map.nodes.length);
  },
  baseResilienceLevel : function() {
    return (1+(this.level-1)*0.4)*Game.difficultyMultiplier;
  },
  baseAntiVirusLevel : function() {
    return (0.45+(this.level-1)*0.1)*Game.difficultyMultiplier;
  },
  infectedPercentage : function() {
    return this.infected/this.map.nodes.length;
  },
  introduceNode : function() {
    var allNodeTypes = [NodeTypes.MEGATEC,NodeTypes.ARGOLAB,NodeTypes.NANOCORP];
    for (var i = allNodeTypes.length - 1; i >= 0; i--) {
      if(this.nodeTypes.indexOf(allNodeTypes[i])==-1){
        this.nodeTypes.push(allNodeTypes[i]);
        return allNodeTypes[i];
      }
    }
  },
  resetNodeIntroductionCounter : function() {
    this.nodeIntroductionCounter = 5;
  },
  typeToConsole : function(text){
    var para = document.createElement("div");
    var node = document.createTextNode(text);
    para.appendChild(node);

    htmlConsole.appendChild(para);
    this.lastConsoleMessage = para;
  },
  clearConsole : function(){
    while (htmlConsole.hasChildNodes()) {
      htmlConsole.removeChild(htmlConsole.lastChild);
    }
  },
  getVirusDelta : function(newVirus,oldVirus){
    return {
      hp: H.ODP(newVirus.maxHp).toString()+" ("+ H.ODP(newVirus.maxHp-oldVirus.maxHp)+")",
      speed: H.ODP(newVirus.speed).toString()+" ("+ H.ODP(newVirus.speed-oldVirus.speed)+")",
      size: H.ODP(newVirus.size).toString()+" ("+ H.ODP(newVirus.size-oldVirus.size)+")"
    }
  },
  addToCurrency : function(award){
    this.currency+=this.infectionAward*award;
    this.formattedCurrency = H.NWC(this.currency);
  },
  getNodeIfIntroduced : function(nodeType){
    if(Game.nodeTypes.indexOf(nodeType)==-1) return NodeTypes.NORMAL;
    else return nodeType;
  },
  balanceDifficulty : function() {
    var averageVirusPower = 0;
    var averageNodePower = 0;
    for (var i = this.player.viruses.length - 1; i >= 0; i--) {
      var virus = this.player.viruses[i];
      averageVirusPower += (virus.maxHp+virus.size+virus.speed);
    }
    averageVirusPower /= this.player.viruses.length;

    averageNodePower = (node.resilience+node.antiVirusPower*2);

    this.difficultyMultiplier = this.difficultyError()*(averageVirusPower/averageNodePower);
  },
  triggerNarrative : function(specialNarrative){
    if(specialNarrative) {
      Game.typeToConsole(specialNarrative);
    } else {
      var msg = NarrativeStack.shift();
      if(typeof msg!=="undefined") Game.typeToConsole(msg);
    }
  },
  endOfLevelMessage : function(virusDelta,specialNarrative){
    Game.clearConsole();          
    Game.typeToConsole("Your virus stats:");
    Game.typeToConsole("HP: "+virusDelta.hp);
    Game.typeToConsole("SPEED: "+virusDelta.speed);
    Game.typeToConsole("UPLOAD: "+virusDelta.size);
    Game.triggerNarrative(specialNarrative);
    Game.typeToConsole("Level "+Game.level+" (RESIL: "+ H.ODP(Game.baseResilienceLevel())+") (ANTIV: "+ H.ODP(Game.baseAntiVirusLevel())+")"); 
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
      Game.map = new Network(Game.level);
      Game.player.viruses[0].setLocation(Game.map.nodes[0]);
      Game.state = States.INFECTING;
    } 
    else if(Game.state==States.METAGAME) {
      if(H.MouseClick){
        var node = Game.map.getNodeFromPosition(
          Math.floor(H.MouseCoords.x/CHAR_WIDTH),
          Math.floor(H.MouseCoords.y/CHAR_HEIGHT));
        if(node) {
          Game.player.viruses[0].setLocation(node);
          Game.state = States.INFECTING;
        }
      }
    }
    else if(Game.state==States.INFECTING) {
      for (var i = Game.player.viruses.length - 1; i >= 0; i--) {
        Game.player.viruses[i].update(dt);
      }
      if(Game.allNodesAreInfected()) {
        Game.state = States.SUCCESS;
        Game.typeToConsole("Infected all nodes!");
        if(Game.level>5) Game.balanceDifficulty();
      } else if(Game.allVirusesAreDormant()) {
        Game.typeToConsole("All viruses are dormant.");
        if(Game.level>5) Game.balanceDifficulty();
        if(Game.hasWonThisRound()) {  
          Game.typeToConsole("Success.");
          Game.state = States.SUCCESS;
        } else {
          Game.typeToConsole("Defeat!");
          Game.state = States.DEFEAT;
        }
      }
    }
    else if(Game.state==States.SUCCESS) {
      if(H.MouseClick){
        
        var virus = Game.player.getVirusFromPosition(
          Math.floor(H.MouseCoords.x/CHAR_WIDTH),
          Math.floor(H.MouseCoords.y/CHAR_HEIGHT));
        if(virus) {
          var newVirus = new Virus(virus.size,virus.speed,virus.maxHp);

          var virusDelta = Game.getVirusDelta(newVirus,Game.player.viruses[0]);

          Game.level++;

          if(Game.infectedPercentage()>0.90) {
            Game.nodeIntroductionCounter--;
          }
          var specialNarrative;
          if(Game.nodeIntroductionCounter<=0) {
            nodeIntroduced = Game.introduceNode();
            Game.resetNodeIntroductionCounter();
            console.log("introduced new node");
            specialNarrative = NodeTypeToNarrative[nodeIntroduced];
          }
          Game.infected=0;
          Game.map.killNodes();
          Game.player.killViruses();
          Game.map = null;
          Game.map = new Network(Game.level);
          
          Game.player.viruses = null;
          Game.player.viruses = [newVirus];
          Game.state=States.METAGAME;

          Game.endOfLevelMessage(virusDelta,specialNarrative);
        }
      }
    }
    else if(Game.state==States.DEFEAT) {
      if(H.MouseClick){
        var virus = Game.player.viruses[0];
        var newVirus = new Virus(virus.size,virus.speed,virus.maxHp);
        Game.level--;

        Game.infected=0;
        Game.map.killNodes();
        Game.player.killViruses();
        Game.map = null;
        Game.map = new Network(Game.level);
        
        Game.player.viruses = null;
        Game.player.viruses = [newVirus];
        Game.state=States.METAGAME;

        Game.endOfLevelMessage({hp:H.ODP(newVirus.maxHp),speed:H.ODP(newVirus.speed),size:H.ODP(newVirus.size)},null);
      }
    }
    H.MouseClick=false;
  },
  draw : function() {
    UI.ctx.fillStyle = '#'+Colors.BG;
    UI.ctx.fillRect(0, 0, Game.width*CHAR_WIDTH, Game.height*CHAR_HEIGHT);
    for (var i = Game.map.nodes.length - 1; i >= 0; i--) {
      Game.map.nodes[i].draw();
    }
    for (var i = Game.player.viruses.length - 1; i >= 0; i--) {
      Game.player.viruses[i].draw();
    }
    currencyHUD.innerHTML = Game.formattedCurrency;
    infectionHUD.innerHTML = H.ODP(Game.infected*100/Game.map.nodes.length);
  }
}

var last_stamp = 0;

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  if(evt != undefined)
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
  else
    return H.MouseCoords;
}

canvas.addEventListener('click', function(event) {
  H.MouseCoords = getMousePos(canvas, event);
  H.MouseClick = true;
});

UI.init(ctx);

function update(timestamp) {

  var dt = (timestamp - last_stamp)/1000;
  last_stamp = timestamp;

  if(Game.active) {

    dt = dt * Game.time;

    UI.update(dt);

    UI.draw();
  }

  window.requestAnimationFrame(update);
}

window.requestAnimationFrame(update);