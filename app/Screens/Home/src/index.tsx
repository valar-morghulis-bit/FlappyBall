import * as React from 'react';
import { 
  View, 
  Text, 
  Button, 
  BackHandler, Alert,
  ImageBackground, 
  StyleSheet
} from 'react-native';
import { NavigationParams } from 'react-navigation';
import { PulseIndicator } from 'react-native-indicators';
import { firebase } from '../../../src/firebase'
import * as Cache from '../../../src/cacheAssets'
import CacheStorage from 'react-native-cache-storage';

type HomeButton = keyof { play: string; resume: string; restart: string };
type HomeProps = { navigation: NavigationParams; route: { params: { button: HomeButton; } } }
type HomeState = { 
  loadingBG: boolean;
  user: { 
    loading: boolean; 
    error: boolean; 
    codeName: string; 
    record: number;
  }; 
}

const cache = new CacheStorage();
let userGold: number;

export default class HomeScreen extends React.PureComponent<HomeProps, HomeState> {
  user = firebase.auth().currentUser;
  db = firebase.database();
  mounted = true;

  constructor(props: HomeProps) {
    super(props);
    this.state = { 
      loadingBG: true, 
      user: {
        loading: true,
        error: true,
        codeName: "",
        record: 0,
      } 
    }

    Cache.loadUserAssetAsync();
    this.getUserData();
  }

  componentDidMount() {
    console.log("Home MOUNT");
  }

  componentWillUnmount() {
    console.log("== home: UN-MOUNT");
  }

  private safeSetState = (update: any) => {
    if (this.mounted) this.setState(update);
  }

  private fetchUser = () => {
    this.db.ref('users/' + this.user?.uid)
      .once('value')
      .then(snapshot => {
        const 
          user = snapshot.val(), 
          homeData = {
            codeName: user.codeName, 
            record: user.record,
          };
        cache.setItem('current-user', JSON.stringify({
          ...homeData,
          gold: user.gold,
        }), 0);
        this.safeSetState({ user: {
          loading: false,
          error: false,
          ...homeData,
        }});
        userGold = user.gold;
      })
      .catch(err => {
        this.safeSetState({
          user: {
            ...this.state.user, 
            loading: false, 
            error: true
          }
        })
      });
  }

  private getUserData = () => {
    // @remind to clear user data cache in log out
    cache.getItem('current-user').then(arg => {
      if (arg) {
        const userData = JSON.parse(arg)
        this.safeSetState({ user: {
          loading: false,
          error: false,
          codeName: userData.codeName,
          record: userData.record,
        }});
        userGold = userData.gold;
      } else {
        this.fetchUser();
      }
    })
  }

  alertQuit = (cb: any, lastWords: string) => {
    Alert.alert("Hold on!", lastWords, [
      {
        text: "Cancel",
        onPress: () => null,
        style: "cancel"
      },
      { text: "YES", onPress: () => {
        cb();
      }}
    ]);
  }

  quit = () => {
    this.alertQuit(() => {
      this.alertQuit(() => BackHandler.exitApp(), "Seriously?")
    }, "Are you sure you want to quit?");
  }

  play = () => {
    this.props.navigation.reset({
      index: 0,
      routes: [
        { name: 'FlappyBall', params: { button: "play", connection: "online" } },
      ],
    });
  }

  goSettings = () => {
    this.props.navigation.navigate('Settings');
  }

  goHallOfFame = () => {
    this.props.navigation.navigate('HallOfFame');
  }

  render() {
    return (
      <View style={{ ...styles.flexCenter, }}>
        <View style={{
          backgroundColor: "black",
          width: "100%",
          height: "100%",
          borderRadius: 10,
        }}>
          <ImageBackground 
            source={require('../assets/bg.png')}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
            }}
            onLoadEnd={() => this.setState({ loadingBG: false })}>
          </ImageBackground>
          <View style={{ ...styles.flexCenter, }}>
            <View style={{ flex: 1, justifyContent: "center", }}>
              <Text style={{ 
                fontSize: 40, 
                fontWeight: "bold", 
                color: "white" 
              }}>FLAPPY BALL</Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center", }}>
              <View style={[styles.HomeButton]}>
                <Button
                  title="PLAY"
                  color="transparent"
                  onPress={this.play} />
              </View>
              <View style={[styles.HomeButton]}>
                <Button
                  title="Hall of Fame"
                  color="transparent"
                  onPress={this.goHallOfFame} />
              </View>
              <View style={[styles.HomeButton]}>
                <Button
                  title="SETTINGS"
                  color="transparent"
                  onPress={this.goSettings} />
              </View>
              <View style={[styles.HomeButton]}>
                <Button
                  title="QUIT"
                  color="transparent"
                  onPress={this.quit} />
              </View>
            </View>
            <View style={{ marginTop: 30, ...styles.flexCenter, }}>
              {
                this.state.user.error
                  ? <Text style={{color: "white"}}>Error getting data</Text>
                  : <View>
                      <Text style={styles.txt}>{this.state.user.codeName}</Text>
                      <Text style={{ color: "white", textAlign: "center", marginTop: 5 }}>Highest score:</Text>
                      <Text style={styles.txt}>{this.state.user.record}</Text>
                    </View>
              }
            </View>
          </View>
        </View>
        {
          this.state.loadingBG || this.state.user.loading
            ? <View style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "black",
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}>
                <PulseIndicator color='white'/>
              </View>
            : null
        }
      </View>
    )
  }

}

function getCurrentGold() {
  return userGold;
}

function setCurrentGold(val: number) {
  userGold = val;
}

const styles = StyleSheet.create({
  HomeButton: {
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 10,
    marginTop: 5,
  },
  txt: { 
    textAlign: "center", 
    color: "white" ,
    fontSize: 25,
    fontWeight: "bold",
  },
  flexCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
});


export { getCurrentGold, setCurrentGold };
export { cache };
