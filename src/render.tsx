import { ComputeAPI, MorphFrameData, RenderData, RenderTextData, TextData, TextsRecord } from "./interfaces";
import { createElement, createFragment } from "./jsx";
import { images } from "./sources";

export const computeWorker = new Worker(new URL('compute/compute.ts', import.meta.url), { type: 'module' });

// for restoring shortened ids in order to get 
// relation between records and dom
const restoreIDs: Record<string, Array<string>> = {
  "ps": ["telegram", "instagram", "github", "twitter", "email"],
  "rg": ["nav-home", "nav-about", "nav-projects", "nav-work"],
  "ft": ["cr", "lg"],
}

// order and details of animating each node
const animatingOrder: Record<string, RenderData> = {
  "pf": { type: 'img', delay: 0, alt: 'profilePicture' },
  "tt": { type: 'text', delay: 50 },
  "d1": { type: 'text', delay: 300 },
  "d2": { type: 'text', delay: 50 },
  "ps": { type: 'img', delay: 50, children: true },
  "rg": { type: 'text', delay: 50, children: true },
  "cr": { type: 'img', delay: 100 },
}

const textsData: Record<string, TextData> = {
  "tt": {
    text: 'Oleksii',
    font: 'display',
    fontSize: 128,
    y: 100,
    letterSpacing: -0.04,
    width: 386,
    height: 120,
    fromPath: "M103 0H0V160H103V80V0ZM52 80H51V79H52V80ZM103 0H129V160H103V80V0ZM129 0H201V160H129V0ZM167 81V80H168V81H167ZM201 0H267V160H201V0ZM324 0H267V160H324V50.5V0ZM324 0V50.5H355V0H324ZM324 50.5V160H355V50.5H324ZM386 50.5V0H355V50.5H386ZM386 160V50.5H355V160H386Z",
  },
  "d1": {
    text: 'Redefining the way humans interact', // Pereosmyslenńa sposobu vzajemodiji ĺudyny
    font: 'text',
    fontSize: 20,
    width: 337,
    height: 28,
  },
  "d2": {
    text: 'with computers', // z kompjuterom
    font: 'text',
    fontSize: 20,
    width: 128,
    height: 28,

  },
  "nav-home": {
    text: 'oleksii.xyz',
    font: 'text',
    fontSize: 20,
    width: 128,
    height: 28,

  },
  "nav-about": {
    text: 'about',
    font: 'text',
    fontSize: 20,
    width: 128,
    height: 28,

  },
  "nav-projects": {
    text: 'projects',
    font: 'text',
    fontSize: 20,
    width: 128,
    height: 28,
  },
  "nav-work": {
    text: 'work',
    font: 'text',
    fontSize: 20,
    width: 128,
    height: 28,
  }
}

computeWorker.postMessage({ deliver: 'texts', data: textsData });

/** Shorthand for getting an `HTMLElement` */
function byId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

/** Retreive child by tag */
function tagById(id: string, tag: string): Element | undefined {
  return byId(id)?.getElementsByTagName(tag)[0];
}

let resolveMorph: (value: TextsRecord) => void;
export let textMorphReady = new Promise<TextsRecord>((resolve) => resolveMorph = resolve);

export default async function render(): Promise<void> {
  if (!sessionStorage.getItem('loaded')) {
    await window["skeleton"];
    sessionStorage.setItem('loaded', 'true');
  }

  let renderTextData = await textMorphReady;

  // restore id's for shortened components
  for (let id in restoreIDs) {
    let children = byId(id)!.children;
    for (var i = 0; i < children.length; i++)
      children[i].id = restoreIDs[id][i];
  }

  let delayCounter: number = 0;

  // restore everything;
  for (let item in animatingOrder) {
    let data: RenderData = animatingOrder[item];
    let node: HTMLElement;

    let queue: Array<string> = [item];
    // if data.children is true, retreive children
    if (data.children) queue = [...byId(item)!.children]
      .map(child => child.id);

    switch (data.type) {
      case 'img':
        for (let child of queue) {
          // generate future node;
          node = <img src={images[child]} alt={item} />;
          // insert it to appropriate skeleton element;
          byId(child)?.append(node);
          // schedule animation
          delayCounter += data.delay;
          setTimeout((child) => byId(child)?.classList.add('rendered'), delayCounter, child);
        }
        break;

      case 'text':
        for (let child of queue) {
          delayCounter += data.delay;
          setTimeout((item) => {
            var data = renderTextData[item] as RenderTextData;

            let loadVector = (element) => { element.parentElement.parentElement.replaceWith(<p>hhh</p>); }

            let vector = <svg><path fill="var(--el)" fill-rule="evenodd" clip-rule="evenodd">
              <animate attributeName="d" dur=".8s" values={data.from + ';' + data.to}
                calcMode="spline" keySplines="0.87 0 0.13 1"
                onendEvent={loadVector} />
            </path></svg>

            byId(item)!.append(vector);

            tagById(item, 'path')?.animate(
              [{ fill: 'var(--el)' }, { fill: 'var(--text)' }],
              { delay: 400, duration: 800, easing: 'cubic-bezier(0.87, 0, 0.13, 1)' },
            );

            byId(item)?.classList.add('rendered');

          }, delayCounter, child);
        }
        break;

      default:
        break;
    }
  }
}

computeWorker.onmessage = (message) => {
  if (message.data.deliver == 'texts') resolveMorph(message.data.data as TextsRecord);
}
