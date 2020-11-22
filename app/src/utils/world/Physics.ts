import { Bodies } from "matter-js";
import FlappyBallGame from "../..";
import { gameOverAlert } from "../helpers/alerts";
import { GameDimension } from "../helpers/dimensions";
import { 
  BODY, 
  engine, 
  world, 
  ENGINE, 
  EVENTS, 
  COMPOSITE, 
  WALL_DISTANCE, 
  GAME_LANDSCAPE_WIDTH,
  GAME_PORTRAIT_WIDTH
} from "./constants";
import { Entities } from './Entities';

export namespace Physics {
  type Physics = (entities: Entities.All, { time }: any) => Entities.All;
  type Event = (game: FlappyBallGame) => void;
  type Relativity = (entiies: Entities.All) => void;
  
  // this GameEngine system is called every ticks
  // that's why i didn't put collision event listener here
  // yes 2nd param should be object
  export const system: Physics = (entities, { time }) => {
    const { engine } = entities.physics;
    engine.world.gravity.y = entities.gravity;

    wallRelativity(entities);

    // //////////////////////////////////////////////////////////
    // entities.distance+=1; // this is on the entities script
    // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
    // console.log("physics.tsx: distance " + entities.distance);
    // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
    // //////////////////////////////////////////////////////////
    ENGINE.update(engine, time.delta);
    return entities;
  };

  // special relativity
  const wallRelativity: Relativity = (() => { 
    type Ent = {get: Entities.All | any, set: (ent: Entities.All) => void};
    const entities: Ent = {
      get: null,
      set: function (entities: Entities.All) {this.get = entities},
    };
    const moveWalls = () => {
      let wallLen = entities.get.wall.length, wallIndex, wall;
      (function move(){
        if (wallLen > 0) {
          wallIndex = entities.get.wall[wallLen-1];
          wall = entities.get[wallIndex];
          wallLen--;
          BODY.translate( wall.body, {x: -1, y: 0} );
          move();
        }
      })();
    }
    const isWallOutOfVision = () => { // sadly, i need to pass whole entities obj for the sake of pass by reference so that i can delete an entity of it
      const wallIndex = entities.get.wall[0], wall = entities.get[wallIndex]; // always the first wall
      if ((wall.body.position.x + (wall.size[0] / 2)) < 0) {
        COMPOSITE.remove(world, wall.body);
        delete entities.get[wallIndex]; // this is necessary
        return true;
      }
      return false;
    }
    const removeWall = () => {
      if ( entities.get.wall.length > 0 && isWallOutOfVision()) {
        entities.get.wall.splice(0, 1); // remove wall id
      }
    }
    const showNextWall = () => {
      let wallCount = entities.get.wall.length;
      if (wallCount > 0) {
        const lastIndex = entities.get.wall[wallCount-1],
              lastWallX = entities.get[lastIndex].body.position.x,
              gameWidth = GameDimension.getWidth("now"),
              lastDistance = gameWidth - lastWallX,
              percentLastDist = lastDistance / gameWidth;
        if (percentLastDist >= WALL_DISTANCE) {
          console.log("CREATING WALL IN PHYSICS BASE ON DISTANCE")
          Entities.getFollowing.walls(entities.get);
        }
      }
    }
    return (ent: Entities.All) => {
      entities.set(ent);
      moveWalls();
      removeWall();
      showNextWall();
    }
  })();

  // this is called in componentDidMount() 
  export const collision: Event = (game) => {
    EVENTS.on(engine, 'collisionStart', (event) => {
      ////////////////////////////////////////////////////////////
      console.log("\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
      console.log("physics.tsx: COLLIDED... GAME OVER");
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
      ////////////////////////////////////////////////////////////
      // alternative for this is use dispatch method of GameEngine
      game.over = true;
      game.paused = true; // for orientation change while game over
      // -----------------------------------------------------------
      // engine.stop() doesn't work here in matter EVENTS,
      // but works with setTimeout() as callback, i donno why
      setTimeout(() => game.engine.stop(), 0);
      // -----------------------------------------------------------
      gameOverAlert();
    });
  }
  
}
