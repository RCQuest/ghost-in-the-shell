var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var viruses = [ new Virus(null,1,1,1) ];

var nodes = [];

var level = 0;

var turns=0;

var infected = 0;

function mutate(value){
  return Math.max(value+((Math.random()*2)-1),1);
}

function Virus(el,size,speed,hp) {
  this.element = el;
  this.size = size;
  this.speed = speed;
  this.hp = hp;
  this.location = null;
  this.dormant = false;
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
    if(!this.dormant) infected++;
    this.dormant = true;

    for (var i = this.location.linkedNodes.length - 1; i >= 0; i--) {
      if(this.location.linkedNodes[i].infectionLevel<this.location.linkedNodes[i].resilience) {
        if(!this.location.linkedNodes[i].infector) {
          var newVirus = this.split();
          newVirus.setLocation(this.location.linkedNodes[i]);
          viruses.push(newVirus);
          break;
        }
      }
    }
  } else {
    this.location.infectionLevel+=this.speed;
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
  for (var i = level - 1; i >= 0; i--) {
    var node1 = nodes[Math.floor(Math.random() * nodes.length)];
    var node2 = nodes[Math.floor(Math.random() * nodes.length)];
    if(node1!=node2) node1.addConnectedNode(node2);
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

generateMap(5);
releaseVirus();


while(infected<nodes.length) {
  turns++;
  console.log(infected+"<"+nodes.length);  
  update();
}
console.log("completed in "+turns+" turns.");
