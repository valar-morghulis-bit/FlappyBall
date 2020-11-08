
import * as React from 'react'
import { AppState, Dimensions } from 'react-native'
import { StatusBar, TouchableWithoutFeedback, View } from 'react-native';
import { GameEngine, GameEngineProperties } from 'react-native-game-engine';

// import { addStateChangeListener, removeStateChangeListener } from './utils/helpers/events/gameState';
import { GameAppState } from './utils/helpers/events/GameState';

import { Orientation } from './utils/helpers/events/Orientation';
import { COMPOSITE, NAVBAR_HEIGHT, world } from './utils/world/constants';

// import { GameEntities, getEntities } from './utils/world/Entities';
import { Entities } from './utils/world/Entities';

// import { getBodies, getWall } from './utils/world/Matter';
import { Matter } from './utils/world/Matter';


// import { hasCollision, physics } from './utils/world/Physics';
import { Physics } from './utils/world/Physics';

interface EventType { type: string; }
interface Game {
  engine: GameEngine;
  entities: Entities.Game;
  paused: boolean;
  over: boolean;
  pauseOrResume(): boolean; // toggle true/false and pass to paused
  onEvent(e: EventType): void;
}

export default class FlappyBallGame extends React.PureComponent implements Game{
  playerCoords = [50, 200]; // temporary testing

  engine: any;
  entities: Entities.Game; // all entities (player, floor)
  paused: boolean; // used in pause button
  over: boolean; // used in pause button

  constructor(props: object) {
    super(props);
    this.paused = false; 
    this.over = false;
    this.entities = Entities.get(Matter.get([...this.playerCoords]));
    this.pauseOrResume = this.pauseOrResume.bind(this);
    this.onEvent = this.onEvent.bind(this);

    // getWall(this, this.entities.nWall);
    // this.entities.nWall++;
  }

  // all side effects here
  componentDidMount() {
    ////////////////////////////////////////////////////////////
    console.log("\nindex.tsx:\n--------------------------");
    console.log("componentDidMount!!");
    Physics.collision(this); // game over

    // Orientation.addChangeListener<FlappyBallGame>(this); // refactor
    Orientation.addChangeListener(this); // refactor

    GameAppState.addChangeListener(this); // run|stop game engine
    console.log("--------------------------\n")
    ////////////////////////////////////////////////////////////
  }

  componentWillUnmount() {
    console.log("componentWillUnmount!!")
    GameAppState.removeChangeListener();

    // removeOrientationChangeListener();
    Orientation.removeChangeListener();
  }

  // used in pause button,
  pauseOrResume() { 
    ////////////////////////////////////////////////////////////
    console.log("\nindex.tsx:\n--------------------------");
    if (!this.over) {
      if (!this.paused) {
        console.log("=======>>>>>>>>>>>>>>>PAUSED<<<<<<<<<<<<<<<<=======")
        // this.paused = true;
        this.engine.stop();
        // console.log();
      } else {
        console.log("=======>>>>>>>>>>>>>>>RESUME<<<<<<<<<<<<<<<<=======")
        // this.paused = false;
        this.engine.start();
      }
    } else {
      console.log("GAME OVER")
    }
    const 
      lastPlayerX = this.entities.player.body.position.x,
      lastPlayerY = this.entities.player.body.position.y;
    console.log("this.over: " + this.over);
    console.log("this.paused: " + this.paused);
    console.log("lastPlayer x,y: " + lastPlayerX + ", " + lastPlayerY );
    console.log("--------------------------");
    ////////////////////////////////////////////////////////////
    return false;
  }

  onEvent(e: EventType) {
    if (e.type === "stopped") {
      this.paused = true;
    } else if (e.type === "started") {
      this.paused = false;
    }
    ////////////////////////////////////////////////////////////
    console.log("\nindex.tsx:\n--------------------------");
    console.log(e);
    console.log("this.paused " + this.paused);
    console.log("--------------------------");
    ////////////////////////////////////////////////////////////
  }

  render() {
    ////////////////////////////////////////////////////////////
    console.log("\nindex.tsx:")
    console.log("--------------------------");
    console.log("RENDER()...");
    console.log("--------------------------\n");
    ////////////////////////////////////////////////////////////
    return (
      <View style={{ 
        flex: 1,
      }}>
        
        <TouchableWithoutFeedback
          onPress={this.pauseOrResume}
          >
          <View style={{ 
            backgroundColor:"yellow",
            width: "100%",
            height: NAVBAR_HEIGHT,
            top: 0,
            }}></View>
        </TouchableWithoutFeedback>

        {/* ------------------------------------------------------------ */}
        <TouchableWithoutFeedback
          onPressIn={() => {
            this.entities.gravity = -0.5;
            }}
          onPressOut={() => {
            this.entities.gravity = 0.5;
            }}>
          <View style={{ flex: 1 }}> 
          {/* this view is necessary, because GameEngine return many components
          and TouchableWithoutFeedback only works with 1 component */}
            <GameEngine
              ref={ (ref) => { this.engine = ref; } }
              onEvent={ this.onEvent }
              style={{ flex: 1 }}
              systems={ [Physics.system] }
              entities={ this.entities } />
            <StatusBar hidden />
          </View>
        </TouchableWithoutFeedback>
        {/* ------------------------------------------------------------ */}

      </View>
    );
  }
}
