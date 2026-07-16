/**
 * Stock dmak crashes when an SVG loads (HTTP 200) but has no `kvg:{code}` root:
 * it calls getElementById, gets null, then immediately reads `.childNodes`.
 *
 * It also crashes when the React host unmounts before the async SVG fetch
 * finishes: prepare() still runs and Raphael throws "SVG container not found."
 *
 * Replaces window.DmakLoader with a guarded loader, and no-ops prepare() when
 * the target element is already gone.
 */

type StrokePath = {
  path: string | null;
  groups: (string | null)[];
  text?: { value: string | null; x: string; y: string };
};

type LoaderCallbacks = {
  done: (index: number, data: StrokePath[]) => void;
  error: (msg: string) => void;
};

type DmakLike = {
  options: { element: string | HTMLElement };
  prepare: (data: StrokePath[][]) => void;
  pause?: () => void;
};

type DmakConstructor = {
  fn: { prepare: (this: DmakLike, data: StrokePath[][]) => void };
  __kanjiHeatmapGuards?: boolean;
};

/** Instances torn down by React (Strict Mode remount / unmount) before SVG XHR finishes. */
const abandonedDmakInstances = new WeakSet<object>();

/** Pause + ignore later prepare/render from this instance; clear host SVG separately. */
export function abandonDmak(dmak: object | null | undefined) {
  if (dmak == null) return;
  abandonedDmakInstances.add(dmak);
  try {
    (dmak as DmakLike).pause?.();
  } catch {
    // ignore — may be mid-load / already torn down
  }
}

function resolveElement(
  element: string | HTMLElement | null | undefined
): HTMLElement | null {
  if (element == null) return null;
  if (typeof element === "string") {
    return document.getElementById(element);
  }
  return element.isConnected ? element : null;
}

function parseResponse(response: string, code: string): StrokePath[] {
  const data: StrokePath[] = [];
  const dom = new DOMParser().parseFromString(response, "application/xml");
  const texts = dom.querySelectorAll("text");
  const groups: (string | null)[] = [];

  const rootElement = dom.getElementById(`kvg:${code}`);
  if (!rootElement) {
    console.warn(`Element kvg:${code} not found in SVG`);
    return data;
  }

  const parse = (element: Element) => {
    const children = element.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Element;
      if (child.tagName === "g") {
        groups.push(child.getAttribute("id"));
        parse(child);
        groups.splice(groups.indexOf(child.getAttribute("id")), 1);
      } else if (child.tagName === "path") {
        data.push({
          path: child.getAttribute("d"),
          groups: groups.slice(0),
        });
      }
    }
  };

  parse(rootElement);

  for (let i = 0; i < texts.length; i++) {
    if (!data[i]) continue;
    const transform = texts[i].getAttribute("transform") ?? "";
    const parts = transform.split(" ");
    data[i].text = {
      value: texts[i].textContent,
      x: parts[4] ?? "0",
      y: (parts[5] ?? "0").replace(")", ""),
    };
  }

  return data;
}

function loadSvg(
  uri: string,
  index: number,
  charCode: string,
  callbacks: LoaderCallbacks
) {
  const code = `00000${charCode}`.slice(-5);

  if (code === "00020" || code === "03000") {
    callbacks.done(index, []);
    return;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", `${uri}${code}.svg`, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      callbacks.done(index, parseResponse(xhr.response, code));
    } else if (xhr.status === 0) {
      // Aborted / navigated away — ignore.
    } else {
      callbacks.error(xhr.statusText);
      // Still complete so Dmak.prepare runs instead of hanging forever.
      callbacks.done(index, []);
    }
  };
  xhr.send();
}

class SafeDmakLoader {
  uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }

  load(text: string, callback: (paths: StrokePath[][]) => void) {
    const paths: StrokePath[][] = [];
    const nbChar = text.length;
    let done = 0;

    const callbacks: LoaderCallbacks = {
      done: (index, data) => {
        paths[index] = data;
        done++;
        if (done === nbChar) {
          callback(paths);
        }
      },
      error: (msg) => {
        console.warn("DmakLoader error", msg);
      },
    };

    for (let i = 0; i < nbChar; i++) {
      loadSvg(this.uri, i, text.charCodeAt(i).toString(16), callbacks);
    }
  }
}

function installPrepareGuard() {
  const Dmak = (window as unknown as { Dmak?: DmakConstructor }).Dmak;
  if (!Dmak?.fn?.prepare || Dmak.__kanjiHeatmapGuards) return;

  const originalPrepare = Dmak.fn.prepare;
  Dmak.fn.prepare = function (data) {
    // Strict Mode remounts keep the same host div: an abandoned instance's
    // late XHR must not append a second SVG. Also skip if the host is gone.
    if (
      abandonedDmakInstances.has(this) ||
      !resolveElement(this.options.element)
    ) {
      return;
    }
    return originalPrepare.call(this, data);
  };
  Dmak.__kanjiHeatmapGuards = true;
}

export function installSafeDmakLoader() {
  (window as unknown as { DmakLoader: typeof SafeDmakLoader }).DmakLoader =
    SafeDmakLoader;
  installPrepareGuard();
}
