import { mount } from "svelte";

import App from "./App.svelte";

const target = document.getElementById("app");

if (target === null) {
  throw new Error("App root element was not found.");
}

mount(App, {
  target,
});
