import axios from 'axios';
import { openDB } from 'idb';

export default ({
  endpoint,
  dbVersion = 1,
  initDataItemCallback,
  dataChangedCallback,
  successCallback,
  startLoadingCallback,
  namespaced = false,
  indexes = [],
  idColumn = 'id',
  autoRefresh = false,
  autoRefreshIntervallMs = 10000,
  writeChunkSize = 200,
}) => {
  const lastCacheUpdateKey = `${endpoint}/lastUpdateV${dbVersion}`;
  const lastCacheUpdate = () => JSON.parse(localStorage.getItem(lastCacheUpdateKey));
  function doSuccessCallback(taskName, store) {
    if (successCallback) {
      successCallback(taskName, store);
    }
  }

  if (!indexes.some((index) => index.column === idColumn)) {
    indexes.push({ column: idColumn, unique: 'true' });
  }
  async function getIdb() {
    return openDB(`${endpoint}-store`, dbVersion, {
      async upgrade(db, oldVersion, newVersion, versionChangeTransaction) {
        if (oldVersion === 0) {
          db.createObjectStore(endpoint, {
            // The 'id' property of the object will be the key.
            keyPath: idColumn,
            // If it isn't explicitly set, create a value by auto incrementing.
            autoIncrement: true,
          });
        } else if (oldVersion !== newVersion) {
          await versionChangeTransaction.store.clear();
          await versionChangeTransaction.done;
        }
      },
    });
  }

  // returns map id to object
  const getCacheData = async () => {
    const cachedItems = await (await getIdb()).getAll(endpoint);
    if (cachedItems) {
      return new Map(cachedItems.map((i) => [i[idColumn], i]));
    }
    return new Map();
  };

  const buildIndex = (store, items) => {
    // build indexes
    if (indexes && items) {
      indexes.forEach((index) => {
        store.itemsByIndex.set(index.column, new Map());
      });
      items.forEach((item) => {
        indexes.forEach((index) => {
          const indexMap = store.itemsByIndex.get(index.column);
          if (index.unique) {
            indexMap.set(item[index.column], item);
          } else {
            const indexValue = indexMap.get(item[index.column]);
            if (!indexValue) {
              indexMap.set(item[index.column], [item]);
            } else {
              indexValue.push(item);
            }
          }
        });
      });
    }
  };

  const removeItemFromIndexes = (store, item) => {
    indexes.forEach((index) => {
      if (index.unique) {
        store.itemsByIndex.get(index.column).delete(item[index.column]);
      } else {
        const indexArray = store.itemsByIndex.get(index.column).get(item[index.column]);
        indexArray.splice(indexArray.findIndex((v) => v[idColumn] === item[idColumn]), 1);
      }
    });
  };

  const addItemToIndexes = (store, item) => {
    indexes.forEach((index) => {
      if (index.unique) {
        store.itemsByIndex.get(index.column).set(item[index.column], item);
      } else {
        const newIndexArray = store.itemsByIndex.get(index.column).get(item[index.column]);
        newIndexArray.push(item);
      }
    });
  };

  const updateItemIndexes = (store, oldItem, newItem) => {
    indexes.forEach((index) => {
      // eslint-disable-next-line no-prototype-builtins
      if (oldItem[index.column] !== newItem[index.column]) {
        if (index.unique) {
          store.itemsByIndex.get(index.column).delete(oldItem[index.column]);
          store.itemsByIndex.get(index.column).set(oldItem[index.column], oldItem);
        } else {
          if (store.itemsByIndex.get(index.column).has(oldItem[index.column])) {
            const oldIndexArray = store.itemsByIndex.get(index.column).get(oldItem[index.column]);
            oldIndexArray.splice(oldIndexArray.findIndex((v) => v[idColumn] === oldItem[idColumn]), 1);
          }

          if (!store.itemsByIndex.get(index.column).has(newItem[index.column])) {
            store.itemsByIndex.get(index.column).set(newItem[index.column], []);
          }

          const newIndexArray = store.itemsByIndex.get(index.column).get(newItem[index.column]);
          newIndexArray.push(newItem);
        }
      }
    });
  };

  // refresh handling
  let refreshIntervallId;

  const loadDataFunction = async (store,
    isRefresh, initData, initCacheData, showLoading, showSuccess) => {
    if (showLoading === undefined) {
      // eslint-disable-next-line no-param-reassign
      showLoading = true;
    }
    if (showSuccess === undefined) {
      // eslint-disable-next-line no-param-reassign
      showSuccess = true;
    }
    const { commit } = store;
    await commit('startLoading');

    // this will be set to the localstorage at the end if everything was successfull
    const startFetchingTime = Date.now();

    // load data from cache
    let cachedItemsMap;
    if (!isRefresh && initCacheData) {
      cachedItemsMap = initCacheData;
    } else {
      cachedItemsMap = await getCacheData();
    }

    let stopLoading;
    if (showLoading && startLoadingCallback && !isRefresh) {
      stopLoading = startLoadingCallback('Initialization', store);
    }

    // load data from backend

    // load items - from initData or from endpoint
    let changedItems; // TODO rename -> changedItems
    if (!isRefresh && initData) {
      changedItems = initData;
    } else {
      const dataResponse = (await axios.get(endpoint, {
        params: { lastCacheUpdate: lastCacheUpdate() },
      }));
      changedItems = dataResponse.data || [];
    }

    // run init callback (for heavy processes like calculating dates)
    if (initDataItemCallback) {
      changedItems.forEach((newItem) => cachedItemsMap
        .set(newItem[idColumn], initDataItemCallback(newItem)));
    } else {
      changedItems.forEach((newItem) => cachedItemsMap
        .set(newItem[idColumn], newItem));
    }

    // we need to remove deleted items
    const itemArrayWithoutDeleted = Array.from(cachedItemsMap.values()).filter((i) => !i.deleted);

    // save in store
    await commit('setAll', itemArrayWithoutDeleted);
    await commit('stopLoading');

    commit('persistInBrowser', { newItems: itemArrayWithoutDeleted, startFetchingTime });

    if (dataChangedCallback) {
      await dataChangedCallback(store, changedItems);
    }
    if (stopLoading) {
      (await Promise.resolve(stopLoading))();
    }
    if (showSuccess && !isRefresh) {
      await doSuccessCallback('Initialization', store);
    }
  };

  const storeModule = ({
    namespaced,
    state() {
      return {
        items: [],
        state: undefined,
        itemsByIndex: new Map(), // map of maps
      };
    },
    mutations: {
      setAll(store, items) {
        store.items = items;

        buildIndex(store, store.items);
      },
      async delete(store, { id }) {
        // remove from indexes
        const item = store.itemsByIndex.get(idColumn).get(id);
        removeItemFromIndexes(store, item);

        // update items & itemsById
        store.items.splice(store.items.findIndex((v) => v[idColumn] === id), 1);
      },
      update: async (store, updatedFields) => {
        const id = updatedFields[idColumn];
        const item = store.itemsByIndex.get(idColumn).get(id);

        updateItemIndexes(store, item, updatedFields);

        Object.keys(updatedFields).forEach((field) => { item[field] = updatedFields[field]; });

        if (dataChangedCallback) {
          dataChangedCallback(store, [updatedFields]);
        }
      },
      add(store, item) {
        store.items.unshift(item);
        addItemToIndexes(store, item);
      },
      startLoading(store) {
        store.state = 'LOADING';
      },
      stopLoading(store) {
        store.state = 'FINISHED';
      },
      async persistInBrowser(store, { newItems, startFetchingTime }) {
        // save in browser cache
        // this is an asynchronous operation running after the application is up and running
        const db = await getIdb();
        // new items in 10er arrays aufteilen
        // je 10er array ein timeout starten
        const saveElements = async (startIndex) => {
          const endIndex = startIndex + writeChunkSize;
          const tx = db.transaction(endpoint, 'readwrite');

          const itemsToAdd = newItems.slice(startIndex, endIndex);
          await Promise.all(
            itemsToAdd.map((item) => tx.store.put(item)),
          );
          await tx.done;
          if (endIndex < newItems.length) {
            setTimeout(saveElements, 0, endIndex);
          } else {
            localStorage.setItem(lastCacheUpdateKey, JSON.stringify(startFetchingTime));
          }
        };
        setTimeout(saveElements, 0, 0);
      },
    },
    actions: {
      enableAutoRefresh: async (store) => {
        store.dispatch('disableAutoRefresh');
        refreshIntervallId = setInterval(
          () => loadDataFunction(store, true),
          autoRefreshIntervallMs,
        );
      },
      disableAutoRefresh: async (store) => {
        if (refreshIntervallId) {
          clearInterval(refreshIntervallId);
          refreshIntervallId = undefined;
        }
      },
      loadData: async (store, options) => {
        const { state, commit } = store;
        // we have to wait for an other run to finish
        // this is just a waiting method so multiple calls to this method at the same time
        // will result in first call -> fetch data, second call -> wait for fetch data
        if (state.state === 'LOADING') {
          const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          while (state.state === 'LOADING') {
            // eslint-disable-next-line no-await-in-loop
            await wait(100);
          }
          // we return nothing here - getters should be used to fetch data
          return;
        }
        // we already finished initialization - so we don't have to fetch again
        if (state.state === 'FINISHED') {
          return;
        }

        store.dispatch('disableAutoRefresh');

        await loadDataFunction(store, false, options?.initData,
          options?.initCacheData, options?.showLoading, options?.showSuccess);

        if (autoRefresh) {
          store.dispatch('enableAutoRefresh');
        }
      },
      add: async (store, item) => {
        let stopLoading;
        if (startLoadingCallback) {
          stopLoading = startLoadingCallback('Initialization', store);
        }

        const newItem = (await axios.post(endpoint, item)).data;

        if (initDataItemCallback) {
          await store.commit('add', initDataItemCallback(newItem));
        } else {
          await store.commit('add', newItem);
        };

        if (stopLoading) {
          (await Promise.resolve(stopLoading))();
        }
        doSuccessCallback('Add', store);
      },
      update: async (store, item) => {
        let stopLoading;
        if (startLoadingCallback) {
          stopLoading = startLoadingCallback('Initialization', store);
        }

        const saveResponse = (await axios.put(`${endpoint}/${item[idColumn]}`, item));
        const savedItem = saveResponse.data;

        if (initDataItemCallback) {
          await store.commit('update', initDataItemCallback(savedItem));
        } else {
          await store.commit('update', savedItem);
        };

        // if (dataChangedCallback) {
        //   dataChangedCallback(store, [savedItem]);
        // }

        if (stopLoading) {
          (await Promise.resolve(stopLoading))();
        }
        doSuccessCallback('Update', store);
        return savedItem;
      },
      delete: async (store, item) => {
        const id = item[idColumn];
        let stopLoading;
        if (startLoadingCallback) {
          stopLoading = startLoadingCallback('Initialization', store);
        }

        await axios.delete(`${endpoint}/${id}`);
        await store.commit('delete', { id });

        if (stopLoading) {
          (await Promise.resolve(stopLoading))();
        }
        doSuccessCallback('Delete', store);
      },
    },
    getters: {
      all: (state) => state.items,
      byId: (state) => (itemId) => state.itemsByIndex.get(idColumn)?.get(itemId),
      byIndex: (state) => ({ index, values }) => {
        const test = values
          .flatMap((v) => state.itemsByIndex.get(index)?.get(v) || []);
        return test;
      },
      lastCacheUpdate: (state) => lastCacheUpdate(),
    },
  });

  return storeModule;
};
