// Everything the page says about you lives here, so updating the site
// means editing this file, not hunting through markup.

export const me = {
  name: 'Sushant Kumar',
  handle: 'hex3961',
  tagline: 'I hunt bugs, fix broken things, and teach computers to see.',
  about:
    'ECE undergrad at VIT Vellore who lives in a Linux terminal. I take apart radar signals, ' +
    'broken desktops and flaky code until they make sense, then I put them back together better. ' +
    'Hackathon gold medalist who builds under pressure, with a habit of filing bug reports ' +
    'with repro steps people actually thank me for.',
  email: 'sushantrsbth@gmail.com',
  github: 'https://github.com/hex3961',
  linkedin: 'https://linkedin.com/in/sushantkumar-vit',
  // Fill these in once the gigs are live; empty strings show as "soon".
  fiverr: '',
  upwork: '',
};

export const services = [
  {
    code: 'BUG-01',
    title: 'Debugging & issue fixing',
    color: 'pink',
    blurb: 'Crashes, weird errors, "it works on my machine". I reproduce it, find the real cause and fix it.',
    items: ['Python / C / C++ / JS bugs', 'Linux & desktop breakage', 'Build + dependency hell', 'Clear write-up of what broke'],
  },
  {
    code: 'OSS-02',
    title: 'Open-source contributions',
    color: 'lime',
    blurb: 'Issue triage, reproducible bug reports, testing PRs on real hardware, and patches upstream.',
    items: ['Repro steps + logs', 'PR testing on KDE / Wayland', 'Docs & README fixes', 'Small features & patches'],
  },
  {
    code: 'CV-03',
    title: 'OpenCV / computer vision',
    color: 'cyan',
    blurb: 'Image and video pipelines that detect, track, measure and clean things up.',
    items: ['Detection & tracking', 'Edge / contour / colour work', 'Camera + sensor pipelines', 'Fast prototypes in Python'],
  },
  {
    code: 'ML-04',
    title: 'AI / ML bits',
    color: 'yellow',
    blurb: 'Signal processing and ML on messy real-world data, plus local LLM tooling.',
    items: ['Scikit-learn models', 'Sensor / time-series features', 'Data pipelines', 'Local LLM (Ollama) apps'],
  },
];

export const projects = [
  {
    name: 'RadarBed',
    kind: 'Hackathon · Gold medal',
    color: 'pink',
    stack: ['60 GHz radar', 'DSP', 'C/C++', 'ESP32', 'Python'],
    text: 'Non-contact vital-sign monitor. Reads heart rate from radar with under 3% error against a clinical ECG. Took home hackathon gold.',
  },
  {
    name: 'RubbleSense',
    kind: 'In progress',
    color: 'orange',
    stack: ['Infineon BGT60', 'FMCW radar', 'Python', 'ML'],
    text: 'Radar subsystem for a search-and-rescue rover: captures breathing-band motion, extracts phase features and trains session-split classifiers.',
  },
  {
    name: 'InfraWatch',
    kind: 'Hackathon',
    color: 'cyan',
    stack: ['Radar', 'Scikit-learn', 'Pipelines'],
    text: 'Bridge health monitoring. ML on vibration frequencies predicts structural health, with a live pipeline for anomaly detection.',
  },
  {
    name: 'Adaptive SR ECG',
    kind: 'Course project',
    color: 'violet',
    stack: ['Signal processing', 'Python', 'NumPy'],
    text: 'Adaptive stochastic-resonance processing to pull weak ECG features out of noise.',
  },
  {
    name: 'Magnus',
    kind: 'Personal · AI',
    color: 'lime',
    stack: ['Python', 'Ollama', 'Local LLM', 'systemd'],
    text: 'A desktop AI companion running fully on a local LLM, with a phone web app, conversation memory and a personality that grows over time.',
  },
  {
    name: 'Swing Force',
    kind: 'Game · built in 3 days',
    color: 'yellow',
    stack: ['Unity', 'C#', 'Procedural gen'],
    text: 'Physics web-swinging game with procedural maps. Learned Unity and C# from zero to ship it in three days.',
    link: 'https://github.com/hex3961/Swing_Force',
  },
];

export const bugLog = [
  {
    tag: 'ISSUE',
    where: 'crafter-station/petdex',
    title: '#836 · Settings scroll jumps to top/bottom on one wheel notch (KDE Plasma)',
    link: 'https://github.com/crafter-station/petdex/issues/836',
    state: 'filed',
  },
  {
    tag: 'REVIEW',
    where: 'crafter-station/petdex',
    title: '#828 · Tested the Wayland layer-shell + Linux settings fix on KDE Plasma 6.8',
    link: 'https://github.com/crafter-station/petdex/pull/828',
    state: 'tested',
  },
  {
    tag: 'FIX',
    where: 'my machine',
    title: 'Patched the WhiteSur SDDM login theme to run on Plasma 6.8',
    state: 'fixed',
  },
];

export const tickerWords = [
  'DEBUGGING', 'OPEN SOURCE', 'OPENCV', 'AI / ML', 'LINUX', 'PYTHON', 'C / C++', 'RADAR DSP',
  'BUG REPORTS', 'WAYLAND', 'SCIKIT-LEARN', 'ESP32', 'UNITY', 'GIT',
];
