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
  const loadShop = new Promise(() => shop.fetch()).catch(err => console.log("Load Shop Error 1:", err));
  const loadInventory = new Promise((resolve, reject) => {
    inventory.fetch(resolve, reject).catch(err => console.log("Error fetching inventory 2:", err));
  }).catch(err => console.log("Error fetching inventory 2:", err));
  
  await Promise.all([loadInventory, loadShop])
    .then(arg => console.log("SUCCESS USER LOAD", arg))
    .catch(err => console.log("[inventory, loadShop] ", err))
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
  
    const getItemUrl = (itemName: string) => firebase
      .storage()
      .ref('item_images/' + itemName + '.png')
      .getDownloadURL();

    const getSpriteUrl = (itemName: string) => firebase
      .storage()
      .ref('item_sprites/' + itemName + '.png')
      .getDownloadURL();
  
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
                  getItemUrl(item), 
                  getSpriteUrl(item), 
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

            allItemUri.length ? FastImage.preload(allItemUri) : null;
            const cacheItems = JSON.stringify(allItems);
            cacheStorage.setItem('inventory', cacheItems, 60 * 60 * 24)
              .then(() => { // @remind refactor
                cacheStorage.getItem("inventory").then(arg => {
                  cachedInventory = arg!;
                  inventoryResolve("Success caching inventory");
                })
              })
              .catch(err => inventoryReject(err));
  
          })
          .catch(err => inventoryReject(err));
  
        });
    }
  
    return async (resolve: any, reject: any) => {
      cacheStorage.getItem("inventory")
        .then(arg => {
          console.log("CURRENT INVENTORY", typeof arg, arg)
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

    clear: () => cacheStorage.clear()
  }
})();

// INVENTORY CACHING
// =======================================================================
// =======================================================================
// SHOP CACHING

const shop = (() => {
  const
    reference = firebase.storage().ref('item_images'),
    cacheStorage = new CacheStorage();
  // let cachedShop: string = JSON.stringify([]);
  let items: Shop.Item[] = [];

  const fetchShop = () => reference.list().then( async (result) => {
    // let items: Shop.Item[] = [];
    let allItemUri: any[] = [];

    await new Promise((resolve) => {
      result.items.forEach(async (ref) => {
        let url, itemName, description!: string;
        // set itemName
        itemName = ref.name.replace('.png', '');
        // set url
        url = await firebase.storage()
          .ref(ref.fullPath)
          .getDownloadURL();
        // set description
        await firebase
          .database()
          .ref('items/' + itemName + '/description')
          .once("value")
          .then(snapshot => {
            description = snapshot.val();
          })
          .catch(err => console.log("Database Error 1:", err));

        items.push({
          id: itemName,
          description: description,
          url: url,
        });

        allItemUri.push({ uri: url });

        if (result.items.indexOf(ref) === (result.items.length-1)) {
          resolve(null) 
        }
      })
    });

    const stringItems = JSON.stringify(items);
    allItemUri.length ? FastImage.preload(allItemUri) : null;
    
    cacheStorage.setItem('shop', stringItems, 60 * 60 * 24)
      .catch(err => console.log("Caching Shop Error 1:", err));

      // .then(() => {
      //   cacheStorage.getItem("shop").then(arg => {
      //     cachedShop = arg!;
      //     console.log("Success Caching Shop");
      //   })
      // })

    console.log("TEST shop items", items)
  });

  return {
    fetch: fetchShop,
    
    get cache() {
      return items;
    },

    clear: () => cacheStorage.clear()
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