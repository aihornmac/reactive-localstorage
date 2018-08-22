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

You can also trigger changes manually, especially when you have other sources that manage localStorage.

```js
localStorage.feed('foo', 'alice');

// print key foo changed to alice
```

You can also use injection to override `window.localStorage`

```js
import 'reactive-localstorage/lib/inject';
import localStorage from 'reactive-localstorage';

console.log(window.localStorage === localStorage);

// print true
```

#### Related Projects
- [mobx-localstorage](https://github.com/aihornmac/mobx-localstorage)
- [rx-localstorage](https://github.com/aihornmac/rx-localstorage)
