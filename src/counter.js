import OBR from "@owlbear-rodeo/sdk";

export function setupCounter(element) {
  let counter = 0;
  const setCounter = (count) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;
    OBR.notification.show(`THE count is ${OBR.scene.items.getItems().count()}`);
  };
  element.addEventListener("click", () => setCounter(counter + 1));
  setCounter(0);
}