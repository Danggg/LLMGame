// canvas refs + game state
'use strict';

const W = 960, H = 540;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

// ---------- state ----------
let state = 'menu';           // 'menu' | 'play' | 'over'
let score = 0, time = 0, spawnTimer = 0.8;
let lastT = 0;
const mouse = { x: W / 2, y: H / 2 - 60 };
const player = {
  x: W / 2, y: H / 2, r: 13, speed: 230,
  hp: 100, maxHp: 100, facing: 0,
  swing: 0, cool: 0.4, coolLeft: 0, invuln: 0, swingId: 0,
  moving: false, walk: 0,
};
let zombies = [];
let particles = [];
let pickups = [];
let stones = [];
let boss = null;              // current Boss reference (null when none alive)
let best = 0;                 // best score (localStorage 'zs-best')
try { best = parseInt(localStorage.getItem('zs-best'), 10) || 0; } catch (e) {}
let wave = 1;
