// @refresh reset

import { Image } from 'react-native';
import { Asset } from 'expo-asset';
import * as Assets from './requireAssets';
import { firebase } from './firebase';
import CacheStorage from 'react-native-cache-storage';
import FastImage from 'react-native-fast-image';
import * as Shop from '../Screens/Shop/src';

function cacheStaticImg(images: any[]) {
  return images.map(image => Asset.fromModule(image).downloadAsync());
}

async function loadAssetsAsync() {
  const imageAssets: any = cacheStaticImg(Assets.images);
  await Promise.all([...imageAssets]).catch(err => console.log("Load Assets Error:", err));
}

async function loadUserAssetAsync() {
  new Promise((resolve, reject) => shop.fetch(resolve, reject))
    .then(resolve => console.log("CACHE SHOP RESOLVED:", resolve))
    .catch(reject => console.log("CACHE SHOP ERROR:", reject));

  new Promise((resolve, reject) => inventory.fetch(resolve, reject))
    .then(resolve => console.log("CACHE INVENTORY RESOLVED:", resolve))
    .catch(err => console.log("CACHE INVENTORY ERROR:", err));
}

function getFileUrl(path: string) {
  return firebase
    .storage()
    .ref(path)
    .getDownloadURL()
    .catch(err => console.log("Getting download URL Error:", err));
}

// =======================================================================
// INVENTORY CACHING

const inventory = (() => {

  let cachedInventory: string = JSON.stringify([]);
  const cacheStorage = new CacheStorage();
  
  const fetchInventory = (() => {

    const getItemInfo = (itemName: string) => new Promise((resolve, reject) => {
      firebase
        .database()
        .ref('items/' + itemName)
        .once("value")
        .then(snapshot => resolve(snapshot.val()))
        .catch(err => reject(err));
    });
  
    const cacheInventory = async (inventoryResolve: any, inventoryReject: any) => {
      const user = firebase.auth().currentUser;
  
      firebase
        .database()
        .ref('users/' + user?.uid + '/inventory')
        .once('value')
        .then(snapshot => {
          if (!snapshot) return ;

          let allItemUri: any[] = [];

          new Promise((allResolve, allReject) => {
            
            const inventory: string[] = snapshot.val();
            let promiseAllItems: Promise<unknown>[] = [];

            inventory?.forEach(async (item: string) => {
              const promise = new Promise((itemResolve, itemReject) => {
                Promise.all([
                  getFileUrl('item_images/' + item + '.png'),
                  getFileUrl('item_sprites/' + item + '.png'),
                  getItemInfo(item)
                ])
                  .then(async arg => {
                    itemResolve({ 
                      id: item, 
                      url: arg[0], 
                      spriteUrl: arg[1], 
                      info: arg[2] 
                    });
                    allItemUri.push({ uri: arg[0] });
                  })
                  .catch(err => itemReject(err));
              });
              promiseAllItems.push(promise);

            });
            Promise.all(promiseAllItems).then(allItems => allResolve(allItems)).catch(err => allReject(err))
  
          })
          .then(allItems => {

            allItemUri[0]?.uri !== void 0 ? FastImage.preload(allItemUri) : null;
            const cacheItems = JSON.stringify(allItems);
            cacheStorage.setItem('inventory', cacheItems, 60 * 60 * 24)
              .then(() => { // @remind refactor
                cacheStorage.getItem("inventory").then(arg => {
                  cachedInventory = arg!;
                  inventoryResolve("Success");
                })
              })
              .catch(err => inventoryReject(err));
  
          })
          .catch(err => inventoryReject(err));
  
        })
        .catch(err => inventoryReject(err));
    }
  
    return async (resolve: any, reject: any) => {
      console.log("CONSOLE: Fetching inventory...")
      cacheStorage.getItem("inventory")
        .then(arg => {
          console.log("CONSOLE: CURRENT INVENTORY", typeof arg, arg)
          if (arg && JSON.parse(arg!).length) {
            cachedInventory = arg;
            resolve("Inventory Already Cached");
          } else {
            cacheInventory(resolve, reject);
          }
        })
        .catch(err => reject(err));
    }
  })();
  
  return {
    fetch: fetchInventory,
    
    get cache() {
      return cachedInventory;
    },

    storage: cacheStorage,
  }
})();

// INVENTORY CACHING
// =======================================================================
// =======================================================================
// SHOP CACHING

const shop = (() => {
  const
    // reference = firebase.storage().ref('item_images'), // @remind clear
    cacheStorage = new CacheStorage();
  // purpose of this is not to rely on get method of cache
  let cachedShop: Shop.Item[] | undefined; // @note this is needed trust me, because local let items should be cleared

  const iterateFetch = async (config: {
    list: string[],
    from: keyof { database: string, storage: string },
    database?: any
  }, resolve: any, reject: any) => {

    let allItemUri: any[] = [];

    new Promise((allResolve, allReject) => {
      let promiseAllItems: Promise<unknown>[] = [];

      config.list.forEach(async (item: any) => {

        const promise = new Promise((itemResolve, itemReject) => {
          Promise.all([
            config.database[item],
            config.from === "storage" ? getFileUrl('item_images/' + item + '.png') : void 0,
            config.from === "storage" ? getFileUrl('item_sprites/' + item + '.png') : void 0
          ]).then(async resolve => {
              itemResolve({ 
                id: item,
                info: resolve[0],
                url: resolve[1],
                spriteUrl: resolve[2]
              });
              allItemUri.push({ uri: resolve[1] });
            })
            .catch(err => itemReject(err));
        });

        promiseAllItems.push(promise);
      });
      
      Promise.all(promiseAllItems).then(allItems => allResolve(allItems)).catch(err => allReject(err))
    })
    .then(allItems => {

      // cachedShop = allItems as Shop.Item[];
      // const stringShop = JSON.stringify(allItems);
      // allItemUri[0]?.uri !== void 0 ? FastImage.preload(allItemUri) : null;
      // cacheStorage.setItem('shop', stringShop, 60 * 60 * 24).catch(err => reject(err));
    
      allItemUri[0]?.uri !== void 0 ? FastImage.preload(allItemUri) : null;
    
      if ((allItemUri[0]?.uri !== void 0) || (config.from === "database")) {
        cachedShop = allItems as Shop.Item[];
        const stringShop = JSON.stringify(allItems);
        cacheStorage.setItem('shop', stringShop, 60 * 60 * 24).catch(err => reject(err));
        resolve("success");
      } else {
        reject("Getting URL error");
      }

    })
    .catch(err => reject(err));
  }

  const fetchShop = async (resolve: any, reject: any) => {

    new Promise((resolve, reject) => {
      firebase
        .database()
        .ref('items/')
        .once('value')
        .then(snapshot => resolve(snapshot.val()))
        .catch(err => reject(err))
    }).then(async (res) => {
        const obj = res as any;
        const itemNames = Object.keys(obj);
        
        cacheStorage.getItem('shop').then(async (arg) => {

          console.log("TEST getting shop cache", arg)

          !arg ? await new Promise((resolve, reject) => {
              iterateFetch({
                list: itemNames,
                from: "database",
                database: obj
              }, resolve, reject)
            }).catch(err => reject(err))
          : cacheStorage.getItem('shop').then(arg => arg ? cachedShop = JSON.parse(arg) : null);

          await new Promise((resolve, reject) => {
            iterateFetch({
              list: itemNames,
              from: "storage",
              database: obj
            }, resolve, reject)
          }).catch(err => reject(err))

          resolve("succeed")
        })

        

        // await new Promise((resolve, reject) => {
        //   iterateFetch({
        //     list: itemNames,
        //     from: "storage",
        //     database: obj
        //   }, resolve, reject)
        // }).catch(err => reject(err))

      })
      .catch(err => reject(err))
  }

  return {
    fetch: fetchShop,
    
    get cache() {
      return cachedShop;
    },

    storage: cacheStorage
  }
})();

// CACHE SHOP
// =======================================================================


export { 
  loadAssetsAsync, 
  loadUserAssetAsync, 
  inventory,
  shop,
}