import { 
  BODIES, 
  PLAYER_SIZE, 
  FLOOR_HEIGHT, 
  ROOF_HEIGHT, 
  world, 
  WORLD, 
  NAVBAR_HEIGHT,
  GAME_LANDSCAPE_WIDTH,
  GAME_PORTRAIT_WIDTH,
} from "./constants";
import { GameDimension } from "../helpers/dimensions";

export namespace Matter {
  type Coordinates = {x?: number, y?:number};
  type MatterProps = { [key: string]: any };
  type Body = (matter: MatterProps) => MatterProps
  type WallParams = Coordinates & { position?: string };
  type StaticBody = (params: WallParams) => MatterProps; // object is required, but params are optional
  type DynamicBody = (center: Coordinates) => MatterProps;  // center obj is required but x, y props is optional LOL
  type FollowingParams = { wall: WallParams }; // this should not be optional/undefined
  type FollowingBodies = (bodies?: FollowingParams) => MatterProps;
  type InitialParams = { player: Coordinates }; // player obj is required but props are optional
  type InitialBodies = (bodies?: InitialParams) => MatterProps;

  // ================================ Matter entities ================================
  const createPlayer: DynamicBody = ({ x = 40, y = 100 }) => {
    const 
      { screenWidth, screenHeight, gameHeight } = GameDimension.window(),
      playerBaseSize = gameHeight * PLAYER_SIZE;
    return createCircle ({
      x: x,
      y: y,
      size: playerBaseSize,
      borderRadius: playerBaseSize / 2,
      color: "red",
      static: false,
    });
  }
  
  const createFloor: StaticBody = () => {
    const 
      // NOTE: matter js CENTER x, y works differently.
      // Observe centerX, which is half of screen width
      // but we didn't explicity minus the half of floor width to it
      { screenWidth, screenHeight, gameHeight } = GameDimension.window(),
      [ floorWidth, floorHeight ] = [ screenWidth, gameHeight * FLOOR_HEIGHT ],
      [ centerX, centerY ] = [ screenWidth / 2, gameHeight - (floorHeight / 2) ]
    ////////////////////////////////////////////////////////////
    console.log("\nmatter.tsx: ");
    console.log("=========== ============== ===========");
    console.log("CREATING FLOOR");
    console.log("\tDimensions width: " + screenWidth)
    console.log("\tDimensions height: " + screenHeight)
    ////////////////////////////////////////////////////////////
    return createRectangle ({
      x: centerX,
      y: centerY,
      width: floorWidth,
      height: floorHeight,
      borderRadius: 0,
      color: "green",
      static: true,
    });
  }
  
  const createRoof: StaticBody = () => {
    const 
      { screenWidth, screenHeight, gameHeight } = GameDimension.window(),
      roofWidth = screenWidth, 

      roofHeight = gameHeight * ROOF_HEIGHT,
      centerX = screenWidth / 2, 
      centerY = roofHeight / 2; // papatong lang sa nav bar pababa
    return createRectangle ({
      x: centerX,
      y: centerY,
      width: roofWidth,
      height: roofHeight,
      borderRadius: 0,
      color: "brown",
      static: true,
    });
  }
  
  //@todo put type in todo to limit up down string val
  const createWall: StaticBody = ({ x, y, position = "down" }) => {
    const 
      { screenWidth, screenHeight, gameHeight } = GameDimension.window(), //@note gameHeight is auto update
      wallWidth = gameHeight * 0.07, 
      wallHeight = gameHeight * 0.2;

    if (!x) { // if x undefined
      if (GameDimension.getOrientation(screenWidth, screenHeight) === "landscape") x = GAME_LANDSCAPE_WIDTH + (wallWidth / 2)
      else x = GAME_PORTRAIT_WIDTH + (wallWidth / 2);
    }
    if (!y) { // if y undefined
      if (position === "down") {
        y = (gameHeight - (gameHeight * FLOOR_HEIGHT)) - (wallHeight / 2); // papatong lang sa nav bar pababa
      } else if (position === "up") {
        y = ((gameHeight * ROOF_HEIGHT)) + (wallHeight / 2);
      }
    }
    return createRectangle ({
      x: x,
      y: y,
      width: wallWidth,
      height: wallHeight,
      borderRadius: 0,
      color: "black",
      static: true,
    });
  }
  // ================================ Matter Entities ================================

  // ======================= Matter General Functions/Getters =======================
  const createRectangle: Body = (prop) => {
    return {
      width: prop.width,
      height: prop.height,
      borderRadius: prop.borderRadius,
      color: prop.color,
      body: BODIES.rectangle(prop.x, prop.y, prop.width, prop.height, { isStatic: prop.static })
    }
  }

  const createCircle: Body = (prop) => {
    // circle view size is effected by border radius
    // while circle body in matter js, it's size = radius
    const bodySize = prop.size / 2; // for Circle Matterjs Body
    return {
      size: prop.size, // for Circle View Component
      borderRadius: prop.borderRadius,
      color: prop.color,
      body: BODIES.circle(prop.x, prop.y, bodySize, { isStatic: prop.static })
    }
  }


  // export const getInitial: InitialBodies = (bodies = { player: {} }) => { 
    
  //   const 
  //     player = bodies.player,
  //     matter = {
  //       player: createPlayer(player),
  //       floor: createFloor({}), // object is required, but params are optional
  //       roof: createRoof({}),
  //     }
  //   WORLD.add(world, [matter.player.body, matter.floor.body, matter.roof.body]);
  //   ////////////////////////////////////////////////////////////
  //   console.log("----------- GETTING MATTER -----------");
  //   console.log("world.bodies.length: " + world.bodies.length);
  //   console.log("=========== ============== ===========");
  //   ////////////////////////////////////////////////////////////
  //   return matter;
  // }

  // we can't extract property from undefined obj
  // but we can extract undefined props from obj
  // won't work                         { player } - because we access x,y from player which is possibly undef obj
  export const getPlayer = (body = { player: {} }) => {
    // @todo we have issue here, if dynamic is undefined this will work
    // but if dynamic is eg. { wall: {} } which is not undefined, i assume default val wont work 
    const player = createPlayer(body.player);
    WORLD.add(world, player.body);
    console.log("Creating Player - world.bodies.length: " + world.bodies.length);
    return player;
  }
  export const getRoof = () => {
    const roof = createRoof({});
    WORLD.add(world, roof.body);
    console.log("Creating Roof - world.bodies.length: " + world.bodies.length);
    return roof;
  }
  export const getFloor = () => {
    const floor = createFloor({});
    WORLD.add(world, floor.body);
    console.log("Creating Floor - world.bodies.length: " + world.bodies.length);
    return floor;
  }
  export const getWall = (body = { wall: {} }) => { // @todo same issue to player
    const wall = createWall(body.wall);
    WORLD.add(world, wall.body);
    console.log("Creating Wall - world.bodies.length: " + world.bodies.length);
    return wall;
  }

  // used in entities
  // export const getFollowing: FollowingBodies = (bodies = { wall: {} }) => {
  //   const matter = {
  //     wall: createWall(bodies.wall),
  //   };
  //   WORLD.add(world, matter.wall.body);
  //   console.log("world.bodies.length: " + world.bodies.length);
  //   return matter;
  // }
  // @todo refactor this fn
  export const getFollowing: FollowingBodies = (bodies = { wall: {} }) => {
    const matter = {
      wall: createWall(bodies.wall),
    };
    WORLD.add(world, matter.wall.body);
    console.log("world.bodies.length: " + world.bodies.length);
    return matter;
  }
  // ======================= Matter General Functions/Getters =======================

}

