var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var viruses = [ new Virus(null,1,1,1) ];

var nodes = [];

var level = 0;

function mutate(value){
  return Math.max(value+((Math.random()*2)-1),1);
}

function Virus(el,size,speed,hp) {
  this.element = el;
  this.size = size;
  this.speed = speed;
  this.hp = hp;
  this.location = null;
}

function Node(el) {
  this.element = el;
  this.linkedNodes = [];
  this.infectionLevel = 0;
  this.resilience = 10;
  this.infector = null;
}

Node.prototype.addConnectedNode = function(node) {
  this.linkedNodes.push(node);
  node.linkedNodes.push(this);
};

Virus.prototype.split = function() {
  return new Virus(
    null,
    mutate(this.size),
    mutate(this.speed),
    mutate(this.hp));
};

Virus.prototype.setLocation = function(node) {
  this.location = node;
  node.infector = this;
};

Virus.prototype.update = function() {
  if(this.location.infectionLevel>this.location.resilience){
    for (var i = this.location.linkedNodes.length - 1; i >= 0; i--) {
      if(this.location.linkedNodes[i].infectionLevel<this.location.linkedNodes[i].resilience) {
        if(!this.location.linkedNodes[i].infector) {
          var newVirus = this.split();
          console.log("split");
          newVirus.setLocation(this.location.linkedNodes[i]);
          viruses.push(newVirus);
          break;
        }
      }
    }
  } else {
    this.location.infectionLevel+=this.speed;
    console.log(this.location.infectionLevel);
  }
};

function generateMap(level){
  var mapSize = level*5;
  var currentNode = new Node(null);
  nodes = [ currentNode ];
  while(nodes.length < mapSize){
    var node = new Node(null);
    currentNode.addConnectedNode(node);
    nodes.push(node);
    if(Math.random()>0.5){
      currentNode = node;
    }
  }
  console.log(nodes);
}

function releaseVirus() {
  viruses[0].setLocation(nodes[0]);
}

function update() {
  for (var i = viruses.length - 1; i >= 0; i--) {
    viruses[i].update();
  }
}

generateMap(1);
releaseVirus();

var turns=0;

while(viruses.length<nodes.length) { // last node never gets infected - fix
  turns++;
  console.log(viruses.length+"<"+nodes.length);  
  update();
}
console.log("completed in "+turns+" turns.");
