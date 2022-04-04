<div id="top"></div>
<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/kaiwerther/vue3-axios-idb-vuex-sync">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Vue3 Axios IDB Store Sync</h3>

  <p align="center">
    Small projects that creates an Vuex store, populates it with backend data and stores the data in idb - then on next page refresh it only loads the delta!
    <br />
    <a href="https://github.com/kaiwerther/vue3-axios-idb-vuex-sync"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/kaiwerther/vue3-axios-idb-vuex-sync">View Demo</a>
    ·
    <a href="https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/issues">Report Bug</a>
    ·
    <a href="https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#usage">Usage</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

This vuex store module aims to provide basic CRUD functionality for large datasets.

Features:
- Stores data in idb at client side and synchronizes the idb on startup with the backend. Only changed entites will be loaded.
- Indexes entites by ID
- Provides Get, Delete, Save, Create functionality
- We lowered initial page loading from 9 seconds to 200 ms

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

### Installation

   ```sh
   npm install vue3-axios-idb-vuex-sync -save
   ```

### Installation Axios
Axios is needed for this project and needs to be correctly configured. Here is the recommended configuration:

install package
   ```sh
   npm install axios -save
   ```

in main.js
  ```js
  axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
  ```

in .env.development (+ .env.production)
  ```js
  VITE_BACKEND_URL=http://localhost:8080/
  ```

<p align="right">(<a href="#top">back to top</a>)</p>


### Usage
endpointName: in these examples can be replaced to anything
moduleName: for consistency normaly the same as endpoint name. This is the name of the Vuex store module

in store.js
   ```js
   import { createBackendIdbVuexDataSync } from 'vue3-axios-idb-vuex-sync';
   ...
   export default createStore({
    modules: {
      'moduleName': createBackendIdbVuexDataSync(
          { endpoint: 'endpointName' },
        )
      },
   });
   ```

in any component
```js
   import { onMounted, computed } from 'vue';
   import { useStore } from 'vuex';
   ...
   const allEntites = computed(() => store.getters['moduleName/all']);
   ...
   onMounted(() => {
    store.dispatch('moduleName/initialize');
   });
   ...
   function deleteItem(id) {
     store.dispatch('moduleName/delete', { id })
   }
   ```

### backend API needed
This plugin expects the following endpoints under your backend URL:

1. POST /endpointName/
Creating an new entity
Expects entity as JSON in body
Returns saved entity as JSON
2. GET /endpointName/
Get a list of ALL entities - as JSON list
3. GET /endpointName/?lastCacheUpdate={timestampInMs}
Get a list of all entities that have been changed since {timestampInMs} - as JSON list
4. PUT /endpointName/{itemId}
Saves an existing entity
Expects entity as JSON in body
Returns saved entity as JSON
5. DELETE /endpointName/{itemId}
Deletes an entity
Expects no body and returns nothing

These are currently not configurable for consistency reasons. If you have a legacy API and need other endpoints feel free to make a pull request :)

### frontend API
#### Options for backendDataSync
| Attribute  | Description | Default | Optional |
| :------------ |:---------------| :----- | :----- |
| endpoint      | used to identify the backend URLs | - | false |
| dbVersion      | Version of the IDB - this should be increased on breaking entity changes | 1 | true |
| initDataItemCallback      | This callback will be called after initialization for every NEW entity.<br />This callback is used to transform entites and to do expensive precalculations.<br />For example: Date formating and status calculations<br />There is no need to make a deep copy of the entity. Just add / change new properties and return the entity.<br />Parameters:<br />1. ONE new entity the backend sends | - | true |
| dataChangedCallback      | this callback will be called whenever an item was saved<br />Parameters:<br />1. store<br />2. saved entity the backend sends | - | true |
| successCallback      | will be called whenever an action (loading, delete, create, update) was successfull. This is normaly used to show success messages.<br />Parameters:<br />1. task name (one of: loading, delete, create, update)<br />2. store | - | true |
| startLoadingCallback      | This callback is used to show a loading overlay. It should return a method to hide the overlay.| - | true |
| namespaced | If the module should be namespaced or not | false | true |
| indexes | list of indexes that should be build up. Array of objects with attributes 'column' and 'unique'.<br />There is always an unique index with the idColumn build up. No need to add it here. | [] | true |
| idColumn | name of the column to identify entities | 'id' | true |
| autoRefresh | turns the auto refresh on or off | false | true |
| autoRefreshInverallMs | interval in ms whenever new entities should be automatically fetched | 10000 | true |
#### Getters
| Name  | Parameters | Description | 
| :------------ | :--------------- | :--------------- |
| all | - | returns all entities |
| byId | itemId | returns an entity based on the value of the idColumn |
| byIndex | {index, values}<br />index: index name<br />values: array of values to look up in the indexes| returns entities based on values in indexes. See Option 'indexes' |
| lastCacheUpdate | - | timestamp on the last time the cache was updated |

#### Actions
##### moduleName/loadData
Needs to be called to initialize the module on application startup. All parameters are optional
Parameters:
showSuccess: default true. Determinates if the successCallback should be called.
initData: Array of Entities that (can be) loaded from another source. This should normaly not be used. Used in case we bundle initialization requests to the backend into one init call.
initCacheData: Same use case as above but contains data from idb
##### moduleName/update
Updates one entity by its id. Also removes it from IDB
Parameters:
Object with id property. Will be send like this to backend.
##### moduleName/add
Creates one entity. Also removes it from IDB
Parameters:
Object that will be send like this to backend.
##### moduleName/delete
Deletes one entity by its id. Also removes it from IDB
Parameters:
Object with id property

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

kaiwerther - kai.werther@infineon.com / kaiwerther@gmail.com

Project Link: [https://github.com/kaiwerther/vue3-axios-idb-vuex-sync](https://github.com/kaiwerther/vue3-axios-idb-vuex-sync)

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/kaiwerther/vue3-axios-idb-vuex-sync.svg?style=for-the-badge
[contributors-url]: https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/kaiwerther/vue3-axios-idb-vuex-sync.svg?style=for-the-badge
[forks-url]: https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/network/members
[stars-shield]: https://img.shields.io/github/stars/kaiwerther/vue3-axios-idb-vuex-sync.svg?style=for-the-badge
[stars-url]: https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/stargazers
[issues-shield]: https://img.shields.io/github/issues/kaiwerther/vue3-axios-idb-vuex-sync.svg?style=for-the-badge
[issues-url]: https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/issues
[license-shield]: https://img.shields.io/github/license/kaiwerther/vue3-axios-idb-vuex-sync.svg?style=for-the-badge
[license-url]: https://github.com/kaiwerther/vue3-axios-idb-vuex-sync/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
