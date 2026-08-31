const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const hero = document.querySelector<HTMLElement>("[data-hero-rotator]");
const heroPhrase = document.querySelector<HTMLElement>("[data-hero-phrase]");
const phrases = JSON.parse(hero?.dataset.phrases ?? "[]") as string[];
let heroRun = 0;
let heroRunning = false;
const siteMotionIsPaused = () =>
  document.documentElement.dataset.motion === "paused";

function heroIsPaused() {
  return Boolean(
    reducedMotion.matches ||
    siteMotionIsPaused() ||
    document.hidden ||
    hero?.matches(":hover") ||
    hero?.contains(document.activeElement),
  );
}

const delay = (duration: number) =>
  new Promise((resolve) => window.setTimeout(resolve, duration));

function waitUntilResumed(
  isPaused: () => boolean,
  extraEvents: [EventTarget, string][] = [],
) {
  if (!isPaused()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const events: [EventTarget, string][] = [
      [reducedMotion, "change"],
      [window, "n15m:motion-change"],
      [document, "visibilitychange"],
      ...extraEvents,
    ];
    const check = () => {
      if (isPaused()) return;
      for (const [target, name] of events) {
        target.removeEventListener(name, check);
      }
      resolve();
    };
    for (const [target, name] of events) {
      target.addEventListener(name, check);
    }
  });
}

async function waitForHero(run: number) {
  await waitUntilResumed(
    () => run === heroRun && heroIsPaused(),
    hero
      ? [
          [hero, "mouseleave"],
          [hero, "focusout"],
        ]
      : [],
  );
}

async function waitForHeroDelay(duration: number, run: number) {
  let remaining = duration;
  while (remaining > 0 && run === heroRun) {
    await waitForHero(run);
    if (run !== heroRun) return;
    const step = Math.min(remaining, 50);
    await delay(step);
    if (!heroIsPaused()) remaining -= step;
  }
}

async function typeHero(value: string, run: number) {
  if (!heroPhrase) return;
  for (let index = 1; index <= value.length && run === heroRun; index += 1) {
    await waitForHero(run);
    if (run !== heroRun) return;
    heroPhrase.textContent = value.slice(0, index);
    await waitForHeroDelay(65, run);
  }
}

async function eraseHero(value: string, run: number) {
  if (!heroPhrase) return;
  for (
    let index = value.length - 1;
    index >= 0 && run === heroRun;
    index -= 1
  ) {
    await waitForHero(run);
    if (run !== heroRun) return;
    heroPhrase.textContent = value.slice(0, index);
    await waitForHeroDelay(36, run);
  }
}

async function runHero() {
  if (!heroPhrase || !phrases.length) return;
  if (reducedMotion.matches || siteMotionIsPaused()) {
    heroPhrase.textContent = phrases[0];
    return;
  }
  heroRunning = true;
  const run = ++heroRun;
  try {
    while (run === heroRun) {
      for (const phrase of phrases) {
        if (run !== heroRun) return;
        heroPhrase.textContent = "";
        await typeHero(phrase, run);
        await waitForHeroDelay(2200, run);
        await eraseHero(phrase, run);
        await waitForHeroDelay(300, run);
      }
    }
  } finally {
    if (run === heroRun) heroRunning = false;
  }
}

function syncReducedHeroMotion() {
  if (reducedMotion.matches) {
    heroRun += 1;
    heroRunning = false;
    if (heroPhrase && phrases.length) heroPhrase.textContent = phrases[0];
  } else if (!siteMotionIsPaused() && !heroRunning) {
    void runHero();
  }
}

function resumeHeroMotion() {
  if (!reducedMotion.matches && !siteMotionIsPaused() && !heroRunning) {
    void runHero();
  }
}

reducedMotion.addEventListener("change", syncReducedHeroMotion);
window.addEventListener("n15m:motion-change", resumeHeroMotion);
resumeHeroMotion();

const bee = document.querySelector<HTMLElement>(
  ".principle-artwork-prosperity",
);
const compactViewport = window.matchMedia("(max-width: 39.999rem)");
const randomBetween = (minimum: number, maximum: number) =>
  Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
const beeMotionIsPaused = () =>
  reducedMotion.matches || siteMotionIsPaused() || document.hidden;
const waitForBee = async (duration: number) => {
  let remaining = duration;
  while (remaining > 0 && bee?.isConnected) {
    await waitUntilResumed(beeMotionIsPaused);
    const step = Math.min(remaining, 50);
    await delay(step);
    if (!beeMotionIsPaused()) remaining -= step;
  }
};
const clampBeePosition = (value: number) => {
  const boundary = compactViewport.matches ? 4 : 7;
  return Math.max(-boundary, Math.min(boundary, value));
};
let beeX = 0;
let beeY = 0;
const setBeePosition = (x: number, y: number) => {
  if (!bee) return;
  const pixelSize = bee.getBoundingClientRect().width / 40;
  bee.style.transform = `translate(${x * pixelSize}px, ${y * pixelSize}px)`;
};
const moveBee = async (targetX: number, targetY: number, duration: number) => {
  const startX = beeX;
  const startY = beeY;
  const distance = Math.max(
    Math.abs(targetX - startX),
    Math.abs(targetY - startY),
    1,
  );
  for (let step = 1; step <= distance; step += 1) {
    await waitForBee(duration / distance);
    const progress = step / distance;
    setBeePosition(
      Math.round(startX + (targetX - startX) * progress),
      Math.round(startY + (targetY - startY) * progress),
    );
  }
  beeX = targetX;
  beeY = targetY;
};
const runBeeMotion = async () => {
  if (!bee) return;
  while (bee.isConnected) {
    await waitForBee(randomBetween(2000, 5000));

    const direction =
      beeX > 3 ? -1 : beeX < -3 ? 1 : Math.random() < 0.5 ? -1 : 1;
    const horizontalDistance = compactViewport.matches
      ? randomBetween(2, 4)
      : randomBetween(3, 6);
    await moveBee(
      clampBeePosition(beeX + direction * horizontalDistance),
      clampBeePosition(
        beeY +
          randomBetween(
            compactViewport.matches ? -1 : -2,
            compactViewport.matches ? 1 : 2,
          ),
      ),
      randomBetween(80, 140),
    );

    if (Math.random() < 0.65) {
      await waitForBee(randomBetween(40, 100));
      const verticalDirection = Math.random() < 0.5 ? -1 : 1;
      await moveBee(
        clampBeePosition(beeX + direction * randomBetween(1, 3)),
        clampBeePosition(beeY + verticalDirection * randomBetween(1, 3)),
        randomBetween(70, 120),
      );
    }

    await moveBee(
      clampBeePosition(beeX - direction),
      clampBeePosition(beeY - Math.sign(beeY)),
      randomBetween(160, 240),
    );
  }
};

compactViewport.addEventListener("change", () => {
  beeX = clampBeePosition(beeX);
  beeY = clampBeePosition(beeY);
  setBeePosition(beeX, beeY);
});
void runBeeMotion();

const projectRail = document.querySelector<HTMLElement>("[data-project-rail]");
const projectCards = [
  ...(projectRail?.querySelectorAll<HTMLElement>(".project-card") ?? []),
];
const projectPrevious = document.querySelector<HTMLButtonElement>(
  "[data-project-previous]",
);
const projectNext = document.querySelector<HTMLButtonElement>(
  "[data-project-next]",
);
const projectCount = document.querySelector<HTMLOutputElement>(
  "[data-project-count]",
);
let projectIndex = 0;
let requestedProjectIndex: number | null = null;
let projectScrollTimer = 0;

function renderProjectControls() {
  if (!projectCount) return;
  const value = `${String(projectIndex + 1).padStart(2, "0")} / ${String(projectCards.length).padStart(2, "0")}`;
  if (projectCount.value !== value) projectCount.value = value;
  if (projectPrevious) projectPrevious.disabled = projectIndex === 0;
  if (projectNext)
    projectNext.disabled = projectIndex === projectCards.length - 1;
}

function updateProjectControls() {
  if (!projectRail || !projectCards.length || !projectCount) return;
  if (requestedProjectIndex !== null) return;
  const left =
    projectRail.getBoundingClientRect().left +
    parseFloat(getComputedStyle(projectRail).scrollPaddingLeft || "0");
  projectIndex = projectCards.reduce(
    (nearest, card, index) =>
      Math.abs(card.getBoundingClientRect().left - left) <
      Math.abs(projectCards[nearest].getBoundingClientRect().left - left)
        ? index
        : nearest,
    0,
  );
  renderProjectControls();
}

function scrollToProject(index: number, behavior?: ScrollBehavior) {
  if (!projectRail || !projectCards.length) return;
  projectIndex = Math.max(0, Math.min(projectCards.length - 1, index));
  requestedProjectIndex = projectIndex;
  const card = projectCards[projectIndex];
  const padding = parseFloat(
    getComputedStyle(projectRail).scrollPaddingLeft || "0",
  );
  renderProjectControls();
  const railLeft = projectRail.getBoundingClientRect().left;
  projectRail.scrollTo({
    left:
      projectRail.scrollLeft +
      card.getBoundingClientRect().left -
      railLeft -
      padding,
    behavior:
      behavior ??
      (reducedMotion.matches || siteMotionIsPaused() ? "auto" : "smooth"),
  });
}

projectPrevious?.addEventListener("click", () =>
  scrollToProject(Math.max(0, projectIndex - 1)),
);
projectNext?.addEventListener("click", () =>
  scrollToProject(Math.min(projectCards.length - 1, projectIndex + 1)),
);
projectRail?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  scrollToProject(projectIndex + (event.key === "ArrowRight" ? 1 : -1));
});
projectRail?.addEventListener("scroll", updateProjectControls, {
  passive: true,
});
const settleProjectScroll = () => {
  requestedProjectIndex = null;
  updateProjectControls();
};
projectRail?.addEventListener(
  "scroll",
  () => {
    window.clearTimeout(projectScrollTimer);
    projectScrollTimer = window.setTimeout(settleProjectScroll, 150);
  },
  { passive: true },
);
projectRail?.addEventListener("scrollend", settleProjectScroll);
if (projectRail && "ResizeObserver" in window) {
  new ResizeObserver(() => {
    const index = requestedProjectIndex ?? projectIndex;
    scrollToProject(index, "auto");
    requestAnimationFrame(settleProjectScroll);
  }).observe(projectRail);
}
updateProjectControls();
if (projectRail && projectCards.length) {
  document.documentElement.classList.add("project-rail-ready");
}
