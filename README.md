# RogueWasm

Rogue game using [rot.js](http://ondras.github.io/rot.js/hp/), Rust and WebAssembly. Exercise from 
[Programming WebAssembly with Rust](https://pragprog.com/titles/khrust/programming-webassembly-with-rust/) book.

## Run project

In order to run the project, you have to follow several steps.

1 - Compile Rust library project:

```
cargo build --target wasm32-unknown-unknown
```

2 - Use wasm-bindgen to generate JS, Wasm and Typescript files:

```
wasm-bindgen target/wasm32-unknown-unknown/debug/roguewasm.wasm --out-dir . 
```

3 - Run a local server from www folder:

```
npm run serve
```