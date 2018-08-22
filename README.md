# reactive-localstorage
A reactive localStorage with no dependency

#### Install
```bash
yarn add reactive-localstorage
```
```bash
npm i -S reactive-localstorage
```

#### Features
* inject window.localStorage
* Emit changes from same window
* Emit external changes

#### Usage
Changes from `reactive-localstorage` or other pages will be emitted as events

```js
import localStorage from 'reactive-localstorage';

localStorage.on('change', (key, value) => {
  console.log(`key ${key} changed to ${value}`);
});

localStorage.setItem('foo', 'bar');

// print key foo changed to bar
```

It also works with window.localStorage

```js
window.localStorage.setItem('foo', 'alice');

// print key foo changed to alice
```

You can also trigger changes manually, especially when you have other sources that manage localStorage.

```js
localStorage.feed('foo', 'bob');

// print key foo changed to bob
```

#### Related Projects
- [mobx-localstorage](https://github.com/aihornmac/mobx-localstorage)
- [rx-localstorage](https://github.com/aihornmac/rx-localstorage)
