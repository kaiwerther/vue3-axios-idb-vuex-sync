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
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/kaiwerther/repo_name">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">project_title</h3>

  <p align="center">
    project_description
    <br />
    <a href="https://github.com/kaiwerther/repo_name"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/kaiwerther/repo_name">View Demo</a>
    ·
    <a href="https://github.com/kaiwerther/repo_name/issues">Report Bug</a>
    ·
    <a href="https://github.com/kaiwerther/repo_name/issues">Request Feature</a>
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
   npm install vue3-axios-idb-store-sync -save
   ```

<p align="right">(<a href="#top">back to top</a>)</p>

### usage

We expect your Vue3 project uses axios.

It is recommended to use environment variables.

in main.js
```js
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;
```

in .env.development (+ .env.production)
```js
VITE_BACKEND_URL=http://localhost:8080/
```

in store.js
   ```js
   import { createBackendIdbVuexDataSync } from 'vue3-axios-idb-store-sync';
   ...
   export default createStore({
    modules: {
      moduleName: createBackendIdbVuexDataSync(
          { endpoint: endpointName },
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
    store.dispatch('tags/initialize');
   });
   ...
   function deleteItem(id) {
     store.dispatch('moduleName/delete', { id })
   }
   ```

### backend API needed
This plugin expects the following endpoints under your backend URL:

1. POST /endpoint/
Creating an new entity
Expects entity as JSON in body
Returns saved entity as JSON
2. GET /endpoint/
Get a list of ALL entities - as JSON list
3. GET /endpoint/?lastCacheUpdate={timestampInMs}
Get a list of all entities that have been changed since {timestampInMs} - as JSON list
4. PUT /endpoint/{itemId}
Saves an existing entity
Expects entity as JSON in body
Returns saved entity as JSON
5. DELETE /endpoint/{itemId}
Deletes an entity
Expects no body and returns nothing

TODO: make this configurable

### frontend API
#### Options
##### endpoint
endpoint where client looks for when calling the backend
##### afterUpdateCallback
this callback will be called whenever an item was saved
Parameters:
1. store
2. saved entity the backend sends
##### initDataCallback
This callback will be called after initialization for every NEW entity.
This callback is used to transform entites and to do expensive precalculations.
For example: Date formating and status calculations
There is no need to make a deep copy of the entity. Just add / change new properties and return the entity.
Parameters:
1. ONE new entity the backend sends
#### Getters
##### moduleName/all
returns an array of all entites
##### moduleName/byId
returns one entity by its id.
Parameters:
Object with id property
#### Actions
##### moduleName/initialize
Needs to be called. Can be called multiple times. Will only load once.
Parameters:
none
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

- Add more customizability
- Add live sync

See the [open issues](https://github.com/kaiwerther/repo_name/issues) for a full list of proposed features (and known issues).

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

kaiwerther - kaiwerther@gmail.com

Project Link: [https://github.com/kaiwerther/repo_name](https://github.com/kaiwerther/repo_name)

<p align="right">(<a href="#top">back to top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/kaiwerther/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/kaiwerther/repo_name/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/kaiwerther/repo_name.svg?style=for-the-badge
[forks-url]: https://github.com/kaiwerther/repo_name/network/members
[stars-shield]: https://img.shields.io/github/stars/kaiwerther/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/kaiwerther/repo_name/stargazers
[issues-shield]: https://img.shields.io/github/issues/kaiwerther/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/kaiwerther/repo_name/issues
[license-shield]: https://img.shields.io/github/license/kaiwerther/repo_name.svg?style=for-the-badge
[license-url]: https://github.com/kaiwerther/repo_name/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png