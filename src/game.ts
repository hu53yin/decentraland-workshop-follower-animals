// globals
let player = Camera.instance;
let targetPoint = new Vector3(8, 0, 8);
let followPlayer = true;

const boundarySizeXMax = 16-3;
const boundarySizeXMin = 3;
const boundarySizeZMax = 16-3;
const boundarySizeZMin = 3;

// assets
let axieShape = new GLTFShape("models/Axie_1.glb");

// components
@Component("FollowsPlayer")
export class FollowsPlayer {
  defaultHeight:number = 0;
  moving:boolean = true;
  elapsedTime:number = 0;
}

// entities
let axie = new Entity();

axie.addComponent(new Transform({
  position: new Vector3(8, 0, 8),
  scale: new Vector3(0.5, 0.5, 0.5)
}));
axie.addComponent(axieShape);
axie.addComponent(new FollowsPlayer());

engine.addEntity(axie);

// ground collider box for clicking
let groundCollider = new Entity();
groundCollider.addComponent(new BoxShape());
groundCollider.addComponent(new Transform({
  position:new Vector3(8, 0, 8),
  scale: new Vector3(16, 0.1, 16)}));

engine.addEntity(groundCollider);

//distance between two points (squared result)
function distance(pos1: Vector3, pos2: Vector3): number {
  const a = pos1.x - pos2.x
  const b = pos1.z - pos2.z
  return a * a + b * b
}

// systems
class PlayerFollowSystem {
  group = engine.getComponentGroup(FollowsPlayer);

  update(dt: number) {
    for(let entity of this.group.entities) {
      //entity.getComponent(Transform).position = player.position;
      let transform = entity.getComponent(Transform);

      let target = targetPoint;

      if(followPlayer) {
        target = player.feetPosition;
      }

      if(distance(target, transform.position) > 0.5) {
        let moveDirection = target.subtract(transform.position);
        moveDirection = moveDirection.normalize().multiplyByFloats(2*dt, 2*dt, 2*dt);

        let nextPosition = transform.position.add(moveDirection);

        // check if out of bounds and restrict direction
        if(nextPosition.x > boundarySizeXMax || nextPosition.x < boundarySizeXMin) {
          nextPosition.x = transform.position.x;
        }

        if(nextPosition.z > boundarySizeZMax || nextPosition.z < boundarySizeZMin) {
          nextPosition.z = transform.position.z;
        }

        transform.position.copyFrom(nextPosition);
      }

      transform.lookAt(player.feetPosition);
    }
  }
}

engine.addSystem(new PlayerFollowSystem());

//idle floating movement of axies 
class bounceSystem {
  //jump height
  amplitude = 0.4;
  frequency = 5;
  elapsedTime = 0;
  group = engine.getComponentGroup(FollowsPlayer,Transform);

  update(dt: number) {
     for (let entity of this.group.entities) {

      const objectInfo = entity.getComponent(FollowsPlayer)      
      let transform = entity.getComponentOrCreate(Transform)

      objectInfo.elapsedTime += dt

      //bounce higher and faster while moving
      if(objectInfo.moving){
        this.amplitude = 0.4
        this.frequency = 12         
      }
      else{
        this.amplitude = 0.05
        this.frequency = 5
      }   
      //bounce movement (bouncy sine wave)
      transform.position.y = objectInfo.defaultHeight + Math.abs(Math.sin(this.elapsedTime * this.frequency) * this.amplitude)  
    } 
  }
}

engine.addSystem(new bounceSystem())

// inputs
const input = Input.instance;

input.subscribe("BUTTON_DOWN", ActionButton.POINTER, true, e => {
  if(e.hit) {
    if(e.hit.hitPoint.x != 0 && e.hit.hitPoint.z != 0) {
      targetPoint = e.hit.hitPoint,
      followPlayer = false
    }
  }
});

//make axies follow player with E button
input.subscribe("BUTTON_DOWN", ActionButton.PRIMARY, false, e => {     
  followPlayer = true;
})