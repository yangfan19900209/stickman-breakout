System.register("chunks:///_virtual/AudioBridge.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _asyncToGenerator, _regeneratorRuntime, cclegacy, AudioSource, assetManager, resources, AudioClip;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      AudioSource = module.AudioSource;
      assetManager = module.assetManager;
      resources = module.resources;
      AudioClip = module.AudioClip;
    }],
    execute: function () {
      cclegacy._RF.push({}, "18ddc8Alsk01CLWTEvzqett", "AudioBridge", undefined);
      /** Cocos owns playback on Web and WeChat. No browser audio API in game code. */
      var AudioBridge = exports('AudioBridge', /*#__PURE__*/function () {
        function AudioBridge(parent) {
          _classCallCheck(this, AudioBridge);
          _defineProperty(this, "source", void 0);
          _defineProperty(this, "clips", new Map());
          _defineProperty(this, "destroyed", false);
          _defineProperty(this, "shots", 0);
          _defineProperty(this, "swings", 0);
          _defineProperty(this, "meleeHits", 0);
          _defineProperty(this, "explosions", 0);
          _defineProperty(this, "health", 5);
          _defineProperty(this, "pickups", 0);
          _defineProperty(this, "stepAt", 0);
          _defineProperty(this, "muted", false);
          _defineProperty(this, "played", 0);
          _defineProperty(this, "loadErrors", []);
          this.source = parent.addComponent(AudioSource);
        }
        _createClass(AudioBridge, [{
          key: "load",
          value: function () {
            var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
              var _this = this;
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return Promise.all(["knife", "melee-hit", "rifle", "shotgun", "rocket", "blast", "hit", "step", "pickup"].map(function (name) {
                      return new Promise(function (resolve) {
                        resources.load("audio/".concat(name), AudioClip, function (error, clip) {
                          if (error) {
                            _this.loadErrors.push(name);
                            console.warn("[Breakout] Audio unavailable", name, error.message);
                          } else if (_this.destroyed) assetManager.releaseAsset(clip);else _this.clips.set(name, clip);
                          resolve();
                        });
                      });
                    }));
                  case 2:
                  case "end":
                    return _context.stop();
                }
              }, _callee);
            }));
            function load() {
              return _load.apply(this, arguments);
            }
            return load;
          }()
        }, {
          key: "play",
          value: function play(name) {
            var clip = this.clips.get(name);
            if (this.muted || !clip || this.destroyed) return;
            this.source.playOneShot(clip, name === "step" ? 0.17 : name === "blast" ? 0.4 : 0.32);
            this.played++;
          }
        }, {
          key: "update",
          value: function update(s) {
            if (s.state === "playing" || s.state === "dying") {
              if (s.weapon.shots > this.shots) this.play(s.weapon.lastShot);
              if (s.melee.swings > this.swings) this.play("knife");
              if (s.melee.hits > this.meleeHits) this.play("melee-hit");
              if (s.explosions.total > this.explosions) this.play("blast");
              if (s.player.health < this.health) this.play("hit");
              if (s.pickups.collected > this.pickups) this.play("pickup");
              if (s.player.grounded && Math.abs(s.player.vx) > 25 && s.time - this.stepAt > Math.min(0.4, 56 / Math.abs(s.player.vx))) {
                this.stepAt = s.time;
                this.play("step");
              }
            }
            this.shots = s.weapon.shots;
            this.swings = s.melee.swings;
            this.meleeHits = s.melee.hits;
            this.explosions = s.explosions.total;
            this.health = s.player.health;
            this.pickups = s.pickups.collected;
            if (s.time < this.stepAt) this.stepAt = s.time;
          }
        }, {
          key: "status",
          value: function status() {
            return {
              loaded: this.clips.size,
              played: this.played,
              muted: this.muted,
              loadErrors: this.loadErrors
            };
          }
        }, {
          key: "destroy",
          value: function destroy() {
            this.destroyed = true;
            if (this.source.isValid) this.source.stop();
            var _iterator = _createForOfIteratorHelper(this.clips.values()),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var clip = _step.value;
                assetManager.releaseAsset(clip);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.clips.clear();
          }
        }]);
        return AudioBridge;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CameraFollow.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig, clamp;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      clamp = module.clamp;
    }],
    execute: function () {
      cclegacy._RF.push({}, "ba296ytchriHsX9QCK3FOAn", "CameraFollow", undefined);
      var CameraFollow = exports('CameraFollow', /*#__PURE__*/function () {
        function CameraFollow() {
          _classCallCheck(this, CameraFollow);
          _defineProperty(this, "x", 0);
          _defineProperty(this, "y", 0);
          _defineProperty(this, "visibleWidth", GameConfig.width);
          _defineProperty(this, "zoom", 1);
        }
        _createClass(CameraFollow, [{
          key: "reset",
          value: function reset() {
            this.x = this.zoom > 1 ? -110 : 0;
            this.y = 0;
          }
        }, {
          key: "update",
          value: function update(playerX, dt, mapWidth) {
            var facing = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
            var playerY = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 150;
            var arenaStart = arguments.length > 5 ? arguments[5] : undefined;
            var min = arenaStart !== null && arenaStart !== void 0 ? arenaStart : this.zoom > 1 ? -110 : 0;
            var max = Math.max(min, mapWidth - this.visibleWidth);
            var target = clamp(playerX - this.visibleWidth * (facing > 0 ? 0.36 : 0.64), min, max);
            this.x += (target - this.x) * (1 - Math.exp(-dt * 8));
            this.x = clamp(this.x, min, max);
            var vertical = clamp(playerY - 260, 0, 220);
            this.y += (vertical - this.y) * (1 - Math.exp(-dt * 3));
          }
        }]);
        return CameraFollow;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CharacterArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Ink.ts', './StickmanAnimator.ts', './WeaponArt.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, Color, Graphics, GameConfig, colors, StickmanAnimator, WeaponArt;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Graphics = module.Graphics;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      colors = module.colors;
    }, function (module) {
      StickmanAnimator = module.StickmanAnimator;
    }, function (module) {
      WeaponArt = module.WeaponArt;
    }],
    execute: function () {
      cclegacy._RF.push({}, "5e821lYdrzSBbyKuLk0Gd/G", "CharacterArt", undefined);
      /** Original rounded comic infantry; volumes track the same joints as the muzzle. */
      var CharacterArt = exports('CharacterArt', /*#__PURE__*/function () {
        function CharacterArt() {
          _classCallCheck(this, CharacterArt);
          _defineProperty(this, "animator", new StickmanAnimator());
          _defineProperty(this, "weapon", new WeaponArt());
          _defineProperty(this, "outline", new Color());
          _defineProperty(this, "paper", new Color());
          _defineProperty(this, "shade", new Color());
        }
        _createClass(CharacterArt, [{
          key: "draw",
          value: function draw(ink, a, cameraX) {
            var _a$aimPitch, _a$airJumpTime, _a$weaponId, _a$aimPitch2, _a$shieldHealth;
            var armed = a.kind !== "melee";
            var pose = this.animator.sample(a.animation, a.animationTime, a.recoil, armed, a.deadTime, (_a$aimPitch = a.aimPitch) !== null && _a$aimPitch !== void 0 ? _a$aimPitch : 0, a);
            var alpha = a.animation === "Dead" ? Math.max(0, 1 - a.deadTime / 1.25) : a.invincible && Math.floor(a.invincible * 14) % 2 === 0 ? 0.35 : 1;
            var hit = a.animation === "Hit" && Math.floor(a.animationTime * 35) % 2 === 0;
            this.outline.set(hit ? 120 : 20, hit ? 120 : 20, hit ? 120 : 20, alpha * 255);
            this.paper.set(253, 253, 251, alpha * 255);
            this.shade.set(179, 179, 174, alpha * 255);
            var black = this.outline,
              white = this.paper,
              gray = this.shade;
            var x = a.x - cameraX,
              y = a.y,
              d = a.facing,
              g = ink.g;
            var width = (a.kind ? GameConfig.rendering.lineWidths.enemy : GameConfig.rendering.lineWidths.hero) * 0.55;
            var px = function px(v) {
                return x + v * d;
              },
              py = function py(v) {
                return y + v;
              };
            var line = function line(ax, ay, bx, by) {
              var w = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1.7;
              var tint = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : black;
              g.lineCap = Graphics.LineCap.BUTT;
              ink.segment(px(ax), py(ay), px(bx), py(by), w, tint);
              g.lineCap = Graphics.LineCap.ROUND;
            };
            var finish = function finish() {
              var fill = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : white;
              var w = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : width;
              g.close();
              g.fillColor = fill;
              g.fill();
              g.strokeColor = black;
              g.lineWidth = w;
              g.stroke();
            };
            var shape = function shape(pts) {
              var fill = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : white;
              var w = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : width;
              g.moveTo(px(pts[0]), py(pts[1]));
              for (var i = 2; i < pts.length; i += 2) g.lineTo(px(pts[i]), py(pts[i + 1]));
              finish(fill, w);
            };
            var curve = function curve(ax, ay, bx, by, cx, cy) {
              return g.bezierCurveTo(px(ax), py(ay), px(bx), py(by), px(cx), py(cy));
            };
            var limb = function limb(start, joint, end, w) {
              var fill = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : white;
              for (var pass = 0; pass < 2; pass++) {
                g.moveTo(px(start.x), py(start.y));
                g.lineTo(px(joint.x), py(joint.y));
                g.lineTo(px(end.x), py(end.y));
                g.strokeColor = pass ? fill : black;
                g.lineWidth = pass ? w : w + width * 2;
                g.stroke();
              }
            };
            var boot = function boot(v) {
              g.moveTo(px(v.x - 6), py(v.y + 6));
              curve(v.x - 3, v.y + 9, v.x + 4, v.y + 6, v.x + 5, v.y + 3);
              curve(v.x + 16, v.y + 3, v.x + 15, v.y - 2, v.x + 10, v.y - 2);
              g.lineTo(px(v.x - 7), py(v.y - 2));
              finish(black, 2);
              line(v.x - 4, v.y + 1, v.x + 9, v.y + 1, 1.6, gray);
            };
            if (a.animation !== "Dead") ink.ellipse(x, y - 3, 25, 3, colors.far, colors.far, 1);
            if (((_a$airJumpTime = a.airJumpTime) !== null && _a$airJumpTime !== void 0 ? _a$airJumpTime : 0) > 0) {
              ink.ellipse(x, y - 7, 26 + (0.18 - a.airJumpTime) * 80, 5, black, undefined, 2.5);
              line(-16, -13, -28, -18, 1.7, gray);
              line(15, -13, 28, -18, 1.7, gray);
            }
            limb(pose.leftHip, pose.leftKnee, pose.leftAnkle, 6, gray);
            boot(pose.leftAnkle);
            var t = pose.torso,
              n = pose.neck;
            // A curved pack with a distinct rolled blanket; no rectangular body substitute.
            var bx = t.x - 15,
              by = t.y + 13;
            g.moveTo(px(bx - 9), py(by - 12));
            curve(bx - 15, by - 5, bx - 14, by + 15, bx - 5, by + 16);
            curve(bx + 14, by + 20, bx + 13, by - 13, bx + 4, by - 15);
            curve(bx, by - 17, bx - 6, by - 15, bx - 9, by - 12);
            finish(gray, 3);
            ink.ellipse(px(bx - 1), py(by + 13), 12, 5, black, gray, 2.5);
            line(bx - 7, by + 14, bx + 6, by + 14, 1.8, white);
            line(bx - 6, by - 9, bx - 3, by + 6, 2.4);
            line(bx + 2, by - 9, bx + 5, by + 6, 2.4);
            g.moveTo(px(bx - 8), py(by + 2));
            curve(bx - 7, by - 4, bx + 4, by - 4, bx + 6, by + 2);
            g.strokeColor = black;
            g.lineWidth = 1.6;
            g.stroke();
            line(bx - 1, by, bx - 1, by - 4, 2.5);
            limb(pose.leftShoulder, pose.leftElbow, pose.leftHand, 6, gray);
            // Vest shoulders and waist form a soft tapered silhouette around the rig.
            g.moveTo(px(n.x - 9), py(n.y - 2));
            curve(n.x - 16, n.y - 10, t.x - 12, t.y + 5, t.x - 8, t.y - 1);
            curve(t.x - 2, t.y - 5, t.x + 9, t.y - 3, t.x + 11, t.y + 2);
            curve(t.x + 14, t.y + 10, n.x + 15, n.y - 7, n.x + 8, n.y - 3);
            finish();
            line(n.x - 6, n.y - 5, t.x - 4, t.y + 3, 3.5, gray);
            line(n.x - 6, n.y - 4, n.x, n.y - 8, 1.8);
            line(n.x, n.y - 8, n.x + 6, n.y - 4, 1.8);
            line(t.x - 6, t.y + 11, t.x - 1, t.y + 10, 1.4, gray);
            line(t.x - 8, t.y + 1, t.x + 9, t.y + 1, 4.5);
            shape([t.x - 2, t.y + 3, t.x + 3, t.y + 3, t.x + 3, t.y - 1, t.x - 2, t.y - 1], white, 1.4);
            shape([t.x + 1, t.y + 12, t.x + 9, t.y + 11, t.x + 8, t.y + 4, t.x, t.y + 4], gray, 2);
            limb(pose.rightHip, pose.rightKnee, pose.rightAnkle, 6.5);
            // Cloth folds, articulated knee pad and ankle cuff read as a uniform at phone scale.
            var k = pose.rightKnee,
              f = pose.rightAnkle;
            ink.ellipse(px(k.x + 1), py(k.y), 4.5, 5.5, black, gray, 1.6);
            line(f.x - 3, f.y + 8, f.x + 4, f.y + 8, 2.1);
            line(pose.rightHip.x + 1, pose.rightHip.y - 5, k.x - 2, k.y + 8, 1.3, gray);
            boot(pose.rightAnkle);
            limb(pose.rightShoulder, pose.rightElbow, pose.rightHand, 7);
            ink.ellipse(px(pose.rightShoulder.x), py(pose.rightShoulder.y - 3), 5, 5.5, black, white, 1.7);
            line(pose.rightShoulder.x - 2, pose.rightShoulder.y - 2, pose.rightShoulder.x + 2, pose.rightShoulder.y - 4, 1.4);
            // Keep the receiver and magazine visible in front of the sleeve; hand/muzzle still share the rig.
            if (armed && a.animation !== "Dead") this.weapon.draw(ink, (_a$weaponId = a.weaponId) !== null && _a$weaponId !== void 0 ? _a$weaponId : "rifle", px(pose.rightHand.x), py(pose.rightHand.y), d, (_a$aimPitch2 = a.aimPitch) !== null && _a$aimPitch2 !== void 0 ? _a$aimPitch2 : 0, 1, black, white);
            var h = pose.head;
            g.moveTo(px(h.x - 11), py(h.y + 5));
            curve(h.x - 16, h.y - 5, h.x - 5, h.y - 15, h.x + 4, h.y - 11);
            curve(h.x + 11, h.y - 11, h.x + 12, h.y - 7, h.x + 12, h.y - 4);
            curve(h.x + 18, h.y - 3, h.x + 15, h.y + 1, h.x + 12, h.y + 2);
            curve(h.x + 11, h.y + 15, h.x - 9, h.y + 17, h.x - 11, h.y + 5);
            finish();
            if (a.kind === "melee") {
              line(h.x - 13, h.y + 5, h.x + 12, h.y + 5, 5.5);
              shape([h.x - 11, h.y + 5, h.x - 24, h.y + 9, h.x - 19, h.y + 1, h.x - 24, h.y - 5, h.x - 12, h.y + 2], black, 1);
            } else {
              // Round steel dome and broad rolled rim; rifle troops use a forward visor.
              g.moveTo(px(h.x - 15), py(h.y + 5));
              curve(h.x - 16, h.y + 21, h.x + 12, h.y + 23, h.x + 15, h.y + 6);
              g.lineTo(px(h.x + (a.kind === "ranged" ? 21 : 15)), py(h.y + 3));
              g.lineTo(px(h.x - 15), py(h.y + 3));
              finish(a.kind ? gray : white, width);
              line(h.x - 13, h.y + 7, h.x + 12, h.y + 7, 2.5);
              // Hero goggles sit on the rim with a broad pale lens, visibly separate from the face.
              if (!a.kind) {
                shape([h.x - 3, h.y + 12, h.x + 7, h.y + 12, h.x + 10, h.y + 7, h.x - 4, h.y + 7], gray, 2.3);
                line(h.x - 1, h.y + 10, h.x + 5, h.y + 10, 1.6, white);
              }
            }
            if (a.kind === "shield") {
              shape([h.x - 4, h.y + 3, h.x + 13, h.y + 2, h.x + 11, h.y - 9, h.x, h.y - 10], gray, 2);
              line(h.x, h.y - 1, h.x + 8, h.y - 1, 3, white);
            } else {
              line(h.x + 1, h.y + 1, h.x + 8, h.y, 2.1);
              line(h.x + 7, h.y - 1, h.x + 7, h.y - 4, 2.5);
              line(h.x + 3, h.y - 8, h.x + 9, h.y - 8, 1.8);
              ink.ellipse(px(h.x - 8), py(h.y - 1), 3, 4, black, white, 1.5);
              g.moveTo(px(h.x - 10), py(h.y + 3));
              curve(h.x - 12, h.y - 9, h.x - 1, h.y - 14, h.x + 5, h.y - 11);
              g.strokeColor = black;
              g.lineWidth = 1.5;
              g.stroke();
              if (a.animation === "Hit" || a.animation === "Dead") line(h.x + 2, h.y - 3, h.x + 8, h.y + 2, 2);
            }
            ink.circle(px(pose.rightHand.x), py(pose.rightHand.y), 3.6, black, white, 2.5);
            if (armed && a.animation !== "Dead") {
              ink.ellipse(px(pose.leftHand.x), py(pose.leftHand.y), 4.6, 3.8, black, white, 2);
              line(pose.leftHand.x - 1, pose.leftHand.y + 1, pose.leftHand.x + 3, pose.leftHand.y + 1, 1.1);
              if (a.action === "reload") shape([pose.leftHand.x - 2, pose.leftHand.y - 2, pose.leftHand.x + 3, pose.leftHand.y - 3, pose.leftHand.x + 3, pose.leftHand.y - 11, pose.leftHand.x - 2, pose.leftHand.y - 10], gray, 1.6);
            }
            if (a.kind === "melee" && a.animation !== "Dead") {
              line(pose.rightHand.x + 2, pose.rightHand.y + 2, pose.rightHand.x + 13, pose.rightHand.y + 29, 7);
              line(pose.rightHand.x + 4, pose.rightHand.y + 8, pose.rightHand.x + 11, pose.rightHand.y + 26, 2, gray);
            }
            if (a.kind === "shield" && ((_a$shieldHealth = a.shieldHealth) !== null && _a$shieldHealth !== void 0 ? _a$shieldHealth : 0) > 0 && a.animation !== "Dead") {
              shape([18, 60, 30, 66, 44, 58, 43, 15, 30, 6, 18, 17], gray, 4);
              shape([24, 50, 38, 50, 38, 42, 24, 42], white, 2);
              line(24, 21, 37, 21, 2.5);
              line(24, 27, 37, 27, 2);
            }
            if (a.animation === "Run" || a.animation === "Shoot") {
              line(-32, 44, -43, 42, 2.2, gray);
              line(-32, 35, -40, 34, 2, gray);
            } else if (a.animation === "Hit") {
              line(h.x - 21, h.y + 8, h.x - 29, h.y + 13, 3);
              line(h.x - 20, h.y - 2, h.x - 30, h.y - 2, 2.5);
            }
            if (a.action === "chargeWindup" || a.action === "bash") {
              line(h.x + 22, h.y + 21, h.x + 22, h.y + 11, 3);
              ink.circle(px(h.x + 22), py(h.y + 6), 1.8, black, black, 1);
            }
          }
        }]);
        return CharacterArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CocosInputAdapter.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './TouchInputManager.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Vec2, input, Input, KeyCode, sys, view, UITransform, TouchInputManager;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
      Vec2 = module.Vec2;
      input = module.input;
      Input = module.Input;
      KeyCode = module.KeyCode;
      sys = module.sys;
      view = module.view;
      UITransform = module.UITransform;
    }, function (module) {
      TouchInputManager = module.TouchInputManager;
    }],
    execute: function () {
      cclegacy._RF.push({}, "0bcc4SPVYPR8dHAAgg/hEdQ", "CocosInputAdapter", undefined);
      /** All fingers pass through the same explicit hit test before they acquire an action. */
      var CocosInputAdapter = exports('CocosInputAdapter', /*#__PURE__*/function () {
        function CocosInputAdapter(state, onEnter) {
          _classCallCheck(this, CocosInputAdapter);
          _defineProperty(this, "touch", void 0);
          _defineProperty(this, "location", new Vec2());
          _defineProperty(this, "keys", new Set());
          _defineProperty(this, "bindings", []);
          _defineProperty(this, "lastTouchAt", -Infinity);
          this.state = state;
          this.onEnter = onEnter;
          this.touch = new TouchInputManager(state);
          input.on(Input.EventType.KEY_DOWN, this.down, this);
          input.on(Input.EventType.KEY_UP, this.up, this);
          input.on(Input.EventType.TOUCH_START, this.touchStart, this);
          input.on(Input.EventType.TOUCH_MOVE, this.touchMove, this);
          input.on(Input.EventType.TOUCH_END, this.touchEnd, this);
          input.on(Input.EventType.TOUCH_CANCEL, this.touchCancel, this);
          input.on(Input.EventType.MOUSE_DOWN, this.mouseDown, this);
          input.on(Input.EventType.MOUSE_MOVE, this.mouseMove, this);
          input.on(Input.EventType.MOUSE_UP, this.mouseUp, this);
        }
        _createClass(CocosInputAdapter, [{
          key: "action",
          value: function action(code) {
            switch (code) {
              case KeyCode.KEY_A:
              case KeyCode.ARROW_LEFT:
                return "left";
              case KeyCode.KEY_D:
              case KeyCode.ARROW_RIGHT:
                return "right";
              case KeyCode.SPACE:
                return "jump";
              case KeyCode.KEY_J:
                return "shoot";
              case KeyCode.KEY_S:
              case KeyCode.ARROW_DOWN:
                return "crouch";
              case KeyCode.KEY_W:
              case KeyCode.ARROW_UP:
                return "aimUp";
              case KeyCode.KEY_K:
                return "grenade";
              case KeyCode.KEY_L:
                return "melee";
              case KeyCode.KEY_Q:
                return "switchWeapon";
              case KeyCode.KEY_P:
              case KeyCode.ESCAPE:
                return "pause";
              default:
                return null;
            }
          }
        }, {
          key: "down",
          value: function down(e) {
            if (this.keys.has(e.keyCode)) return;
            this.keys.add(e.keyCode);
            if (e.keyCode === KeyCode.ENTER) this.onEnter();
            var a = this.action(e.keyCode);
            if (a) this.state.press("key:".concat(e.keyCode), a);
          }
        }, {
          key: "up",
          value: function up(e) {
            this.keys["delete"](e.keyCode);
            this.state.release("key:".concat(e.keyCode));
          }
        }, {
          key: "touchStart",
          value: function touchStart(e) {
            this.lastTouchAt = sys.now();
            this.refreshRegions();
            var _iterator = _createForOfIteratorHelper(e.getTouches()),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var point = _step.value;
                point.getUILocation(this.location);
                this.touch.start(point.getID(), this.location.x, this.location.y);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        }, {
          key: "touchMove",
          value: function touchMove(e) {
            var _iterator2 = _createForOfIteratorHelper(e.getTouches()),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var point = _step2.value;
                point.getUILocation(this.location);
                this.touch.move(point.getID(), this.location.x, this.location.y);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }, {
          key: "touchEnd",
          value: function touchEnd(e) {
            var _this = this;
            this.lastTouchAt = sys.now();
            var _iterator3 = _createForOfIteratorHelper(e.getTouches()),
              _step3;
            try {
              var _loop = function _loop() {
                var _this$bindings$find, _this$bindings$find$c;
                var point = _step3.value;
                point.getUILocation(_this.location);
                var ui = _this.touch.end(point.getID(), _this.location.x, _this.location.y);
                if (ui) (_this$bindings$find = _this.bindings.find(function (b) {
                  return b.id === ui && b.node.activeInHierarchy;
                })) === null || _this$bindings$find === void 0 || (_this$bindings$find$c = _this$bindings$find.callback) === null || _this$bindings$find$c === void 0 || _this$bindings$find$c.call(_this$bindings$find);
              };
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                _loop();
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
        }, {
          key: "touchCancel",
          value: function touchCancel(e) {
            this.lastTouchAt = sys.now();
            var _iterator4 = _createForOfIteratorHelper(e.getTouches()),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var point = _step4.value;
                point.getUILocation(this.location);
                this.touch.end(point.getID(), this.location.x, this.location.y, true);
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
          }
        }, {
          key: "mouseDown",
          value: function mouseDown(e) {
            if (e.getButton() !== 0 || sys.now() - this.lastTouchAt < 700) return;
            e.getUILocation(this.location);
            this.refreshRegions();
            this.touch.start(-1, this.location.x, this.location.y);
          }
        }, {
          key: "mouseMove",
          value: function mouseMove(e) {
            e.getUILocation(this.location);
            this.touch.move(-1, this.location.x, this.location.y);
          }
        }, {
          key: "mouseUp",
          value: function mouseUp(e) {
            var _this$bindings$find2, _this$bindings$find2$;
            if (e.getButton() !== 0) return;
            e.getUILocation(this.location);
            var ui = this.touch.end(-1, this.location.x, this.location.y);
            if (ui) (_this$bindings$find2 = this.bindings.find(function (b) {
              return b.id === ui && b.node.activeInHierarchy;
            })) === null || _this$bindings$find2 === void 0 || (_this$bindings$find2$ = _this$bindings$find2.callback) === null || _this$bindings$find2$ === void 0 || _this$bindings$find2$.call(_this$bindings$find2);
          }
        }, {
          key: "refreshRegions",
          value: function refreshRegions() {
            var d = view.getDesignResolutionSize(),
              regions = [];
            var _iterator5 = _createForOfIteratorHelper(this.bindings),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var b = _step5.value;
                if (b.node.activeInHierarchy) {
                  var t = b.node.getComponent(UITransform),
                    w = t.width * Math.abs(b.node.worldScale.x),
                    h = t.height * Math.abs(b.node.worldScale.y);
                  regions.push({
                    id: b.id,
                    action: b.action,
                    priority: b.priority,
                    bounds: {
                      x: b.node.worldPosition.x + d.width / 2 - w / 2,
                      y: b.node.worldPosition.y + d.height / 2 - h / 2,
                      w: w,
                      h: h
                    }
                  });
                }
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
            this.touch.setRegions(regions);
          }
        }, {
          key: "bindJoystick",
          value: function bindJoystick(_stick) {} // Visual only: the whole left half owns movement.
        }, {
          key: "bindButton",
          value: function bindButton(node, action) {
            this.bindings.push({
              node: node,
              id: "action:".concat(this.bindings.length),
              action: action,
              priority: action === "jump" ? 1 : action === "grenade" ? 2 : 5
            });
          }
        }, {
          key: "registerUI",
          value: function registerUI(node, callback) {
            this.bindings.push({
              node: node,
              id: "menu:".concat(this.bindings.length),
              callback: callback,
              priority: 0
            });
          }
        }, {
          key: "clear",
          value: function clear() {
            this.keys.clear();
            this.touch.clear();
          }
        }, {
          key: "hidden",
          value: function hidden() {
            this.clear();
          }
        }, {
          key: "destroy",
          value: function destroy() {
            input.off(Input.EventType.KEY_DOWN, this.down, this);
            input.off(Input.EventType.KEY_UP, this.up, this);
            input.off(Input.EventType.TOUCH_START, this.touchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this.touchMove, this);
            input.off(Input.EventType.TOUCH_END, this.touchEnd, this);
            input.off(Input.EventType.TOUCH_CANCEL, this.touchCancel, this);
            input.off(Input.EventType.MOUSE_DOWN, this.mouseDown, this);
            input.off(Input.EventType.MOUSE_MOVE, this.mouseMove, this);
            input.off(Input.EventType.MOUSE_UP, this.mouseUp, this);
            this.bindings.length = 0;
            this.clear();
          }
        }]);
        return CocosInputAdapter;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ColossusArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, cclegacy, colors;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      colors = module.colors;
    }],
    execute: function () {
      cclegacy._RF.push({}, "94a69hBjL/+6MRvDbvbJr39", "ColossusArt", undefined);
      /** Original armored walking colossus. Large negative spaces keep the silhouette readable. */
      var ColossusArt = exports('ColossusArt', /*#__PURE__*/function () {
        function ColossusArt() {
          _classCallCheck(this, ColossusArt);
        }
        _createClass(ColossusArt, [{
          key: "draw",
          value: function draw(ink, a, cam) {
            var _a$windup2;
            var x = a.x - cam,
              y = a.y,
              d = a.facing,
              g = ink.g,
              dead = a.animation === "Dead";
            var collapse = dead ? Math.min(1, a.deadTime / 1.4) * 100 : 0;
            var bob = dead ? 0 : Math.sin(a.animationTime * 2) * 1.8;
            var p = function p(xx, yy) {
              return {
                x: x + xx * d,
                y: y + yy - collapse + bob
              };
            };
            var plate = function plate(coords) {
              var fill = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : colors.paper;
              var w = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 4;
              var pts = [];
              for (var i = 0; i < coords.length; i += 2) pts.push(p(coords[i], coords[i + 1]));
              ink.polygon(pts, fill);
              ink.line([].concat(pts, [pts[0]]), w, colors.ink);
            };
            var line = function line(ax, ay, bx, by) {
              var w = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 2;
              var tint = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : colors.ink;
              var v = p(ax, ay),
                u = p(bx, by);
              ink.segment(v.x, v.y, u.x, u.y, w, tint);
            };
            ink.ellipse(x, y - 3, 145, 7, colors.far, colors.far, 1);
            // Pistons and wide grounded feet: clearly a walking machine, separate from the tank tracks.
            for (var _i = 0, _arr = [-1, 1]; _i < _arr.length; _i++) {
              var _a$windup;
              var side = _arr[_i];
              var lift = !dead && a.action === "stomp" && ((_a$windup = a.windup) !== null && _a$windup !== void 0 ? _a$windup : 0) > 0 && side === 1 ? Math.min(30, (1.1 - a.windup) * 42) : 0;
              ink.segment(x + side * 52, y + 116, x + side * 79, y + 63 + lift, 30, colors.ink);
              ink.segment(x + side * 52, y + 116, x + side * 79, y + 63 + lift, 20, colors.wall);
              ink.segment(x + side * 79, y + 63 + lift, x + side * 97, y + 20 + lift, 25, colors.ink);
              ink.segment(x + side * 79, y + 63 + lift, x + side * 97, y + 20 + lift, 16, colors.paper);
              ink.rect(x + side * 97 - 32, y + lift, 64, 20, colors.ink, colors.wall, 4);
              ink.rect(x + side * 79 - 14, y + 52 + lift, 28, 23, colors.ink, colors.paper, 3);
              ink.segment(x + side * 58, y + 95, x + side * 87, y + 30 + lift, 3, colors.muted);
            }
            plate([-63, 109, -101, 158, -110, 211, -73, 227, 70, 227, 109, 210, 99, 155, 62, 109], colors.ink, 5);
            plate([-56, 112, -80, 159, -83, 211, -61, 221, 60, 221, 83, 211, 80, 159, 56, 112], colors.paper, 4);
            plate([-49, 109, -48, 131, 48, 131, 49, 109], colors.mid, 3);
            line(-40, 121, 40, 121, 3);
            plate([-112, 192, -147, 207, -149, 241, -125, 249, -87, 237, -83, 213], colors.wall, 4);
            plate([112, 192, 147, 207, 149, 241, 125, 249, 87, 237, 83, 213], colors.wall, 4);
            for (var _i2 = 0, _arr2 = [-1, 1]; _i2 < _arr2.length; _i2++) {
              var _side = _arr2[_i2];
              for (var n = 0; n < 3; n++) {
                var v = p(_side * (104 + n * 12), 225);
                ink.circle(v.x, v.y, 4.8, colors.ink, colors.ink, 1);
              }
            }
            // Heavy forearms and a forward cannon match the gameplay emission height/side.
            plate([-97, 192, -128, 181, -143, 129, -117, 113, -96, 127, -90, 163], colors.wall, 4);
            plate([98, 192, 121, 180, 139, 135, 118, 118, 98, 133, 90, 162], colors.wall, 4);
            plate([112, 157, 158, 158, 166, 145, 164, 126, 112, 125], colors.paper, 4);
            line(116, 141, 186 - a.recoil * 4, 141, 19);
            line(119, 145, 183 - a.recoil * 4, 145, 6, colors.paper);
            line(184 - a.recoil * 4, 130, 184 - a.recoil * 4, 152, 4);
            plate([-145, 130, -113, 126, -112, 101, -140, 97, -151, 108], colors.mid, 3);
            for (var _n = 0; _n < 3; _n++) line(-143 + _n * 9, 103, -141 + _n * 9, 119, 2);
            var core = p(0, 176);
            ink.circle(core.x, core.y, 25, colors.ink, colors.mid, 4);
            ink.circle(core.x, core.y, 16, colors.ink, ((_a$windup2 = a.windup) !== null && _a$windup2 !== void 0 ? _a$windup2 : 0) > 0 ? colors.white : colors.paper, 3);
            line(-8, 176, 8, 176, 3);
            line(0, 168, 0, 184, 3);
            for (var _i3 = 0, _arr3 = [-1, 1]; _i3 < _arr3.length; _i3++) {
              var _side2 = _arr3[_i3];
              plate([_side2 * 38, 158, _side2 * 69, 166, _side2 * 71, 196, _side2 * 38, 191], colors.wall, 2.5);
              for (var _n2 = 0; _n2 < 3; _n2++) line(_side2 * 43, 166 + _n2 * 8, _side2 * 63, 171 + _n2 * 8, 2);
              line(_side2 * 31, 209, _side2 * 49, 216, 3);
            }
            // Narrow armored visor and shoulder silhouette dominate the infantry's round heads.
            plate([-38, 228, -48, 250, -33, 279, -12, 287, 22, 285, 45, 271, 43, 242, 28, 228], colors.wall, 4);
            plate([-35, 253, -22, 268, 28, 266, 37, 252, 23, 239, -22, 240], colors.ink, 3);
            line(-22, 257, 24, 256, 4, colors.white);
            plate([-14, 239, -9, 226, 16, 227, 22, 240], colors.paper, 2.5);
            line(-7, 234, 12, 234, 2);
            line(-21, 278, -32, 305, 5);
            line(21, 279, 30, 303, 5);
            for (var _n3 = 0; _n3 < 4; _n3++) {
              var _v = p(-63 + _n3 * 42, 216);
              ink.circle(_v.x, _v.y, 2.5, colors.ink, colors.ink, 1);
            }
            if (dead) for (var _n4 = 0; _n4 < 4; _n4++) {
              var t = a.deadTime,
                dx = (_n4 - 1.5) * t * 80,
                dy = t * 100 - t * t * 90;
              ink.rect(x + dx - 8, y + 160 + dy, 16, 9, colors.ink, colors.wall, 2);
            }
          }
        }]);
        return ColossusArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ColossusBoss.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts', './EnemyController.ts'], function (exports) {
  var _inherits, _createSuper, _createClass, _classCallCheck, _defineProperty, _assertThisInitialized, _createForOfIteratorHelper, cclegacy, GameConfig, clamp, EnemyController;
  return {
    setters: [function (module) {
      _inherits = module.inherits;
      _createSuper = module.createSuper;
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _assertThisInitialized = module.assertThisInitialized;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      clamp = module.clamp;
    }, function (module) {
      EnemyController = module.EnemyController;
    }],
    execute: function () {
      cclegacy._RF.push({}, "79331SNw8IHtW4ZK9v8suMh", "ColossusBoss", undefined);
      /** Towering final encounter. Locked warnings, distinct attacks, bounded pressure, free retreat. */
      var ColossusBoss = exports('ColossusBoss', /*#__PURE__*/function (_EnemyController) {
        _inherits(ColossusBoss, _EnemyController);
        var _super = _createSuper(ColossusBoss);
        function ColossusBoss(data) {
          var _this;
          _classCallCheck(this, ColossusBoss);
          _this = _super.call(this, data);
          _defineProperty(_assertThisInitialized(_this), "active", false);
          _defineProperty(_assertThisInitialized(_this), "mode", "dormant");
          _defineProperty(_assertThisInitialized(_this), "attack", "salvo");
          _defineProperty(_assertThisInitialized(_this), "introTime", GameConfig.colossus.intro);
          _defineProperty(_assertThisInitialized(_this), "warningX", 0);
          _defineProperty(_assertThisInitialized(_this), "warningTime", 0);
          _defineProperty(_assertThisInitialized(_this), "warningY", 150);
          _defineProperty(_assertThisInitialized(_this), "summons", 0);
          _defineProperty(_assertThisInitialized(_this), "impactSerial", 0);
          _defineProperty(_assertThisInitialized(_this), "onSummon", void 0);
          _defineProperty(_assertThisInitialized(_this), "introduced", false);
          _defineProperty(_assertThisInitialized(_this), "sequence", 0);
          _defineProperty(_assertThisInitialized(_this), "pendingShots", 0);
          _defineProperty(_assertThisInitialized(_this), "shotDelay", 0);
          _defineProperty(_assertThisInitialized(_this), "lockedY", 185);
          _defineProperty(_assertThisInitialized(_this), "summonTime", 10);
          _defineProperty(_assertThisInitialized(_this), "box", {
            x: 0,
            y: 0,
            w: 272,
            h: 258
          });
          _this.halfWidth = 136;
          _this.height = 276;
          _this.attackCooldown = 0.45;
          return _this;
        }
        _createClass(ColossusBoss, [{
          key: "phase",
          get: function get() {
            return this.health <= this.maxHealth * 0.5 ? 2 : 1;
          }
        }, {
          key: "warningTargetY",
          get: function get() {
            return this.lockedY;
          }
        }, {
          key: "action",
          get: function get() {
            return this.mode === "entering" ? "intro" : this.attack;
          }
        }, {
          key: "bounds",
          get: function get() {
            this.box.x = this.x - 136;
            this.box.y = this.y + 10;
            return this.box;
          }
        }, {
          key: "takeDamage",
          value: function takeDamage(amount, _direction, _kind) {
            if (!this.alive || !this.active) return false;
            this.health = Math.max(0, this.health - amount);
            this.hitTime = 0.12;
            if (!this.alive) {
              this.state = "Dead";
              this.mode = "destroyed";
              this.warningTime = this.windup = 0;
              this.pendingShots = 0;
            }
            return true;
          }
        }, {
          key: "update",
          value: function update(dt, p, level, shots) {
            this.animationTime += dt;
            this.hitTime = Math.max(0, this.hitTime - dt);
            this.recoil = Math.max(0, this.recoil - dt * 5);
            if (!this.alive) {
              this.deadTime += dt;
              return;
            }
            this.active = level.arenaEntered;
            if (!this.active || !p.alive) {
              this.state = "Idle";
              this.mode = "dormant";
              this.windup = this.warningTime = 0;
              this.pendingShots = 0;
              return;
            }
            this.facing = p.x > this.x ? 1 : -1;
            if (!this.introduced) {
              this.mode = "entering";
              this.state = "Idle";
              this.introTime = Math.max(0, this.introTime - dt);
              if (this.introTime === 0) this.introduced = true;
              return;
            }
            this.state = "Attack";
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
            this.warningTime = Math.max(0, this.warningTime - dt);
            this.summonTime -= dt;
            if (this.summonTime <= 0 && this.summons < GameConfig.colossus.maxSummons) {
              var _this$onSummon;
              this.summonTime = GameConfig.colossus.summonInterval;
              (_this$onSummon = this.onSummon) === null || _this$onSummon === void 0 || _this$onSummon.call(this, this.x - 340);
              this.summons += 2;
            }
            if (this.pendingShots > 0) {
              this.shotDelay -= dt;
              if (this.shotDelay <= 0) {
                this.emit(shots, this.pendingShots);
                this.pendingShots--;
                this.shotDelay = 0.18;
              }
            }
            if (this.attackCooldown === 0 && this.windup === 0 && this.pendingShots === 0) {
              var _level$data$arena$sta, _level$data$arena;
              this.attack = ["salvo", "stomp", "sweep"][this.sequence++ % 3];
              this.windup = this.phase === 1 ? GameConfig.colossus.firstWindup : GameConfig.colossus.secondWindup;
              this.warningX = clamp(p.x + p.vx * 0.18, ((_level$data$arena$sta = (_level$data$arena = level.data.arena) === null || _level$data$arena === void 0 ? void 0 : _level$data$arena.start) !== null && _level$data$arena$sta !== void 0 ? _level$data$arena$sta : 0) + 60, level.data.width - 60);
              this.warningY = level.groundY(this.warningX);
              this.lockedY = p.y + 35;
              this.warningTime = this.windup + (this.attack === "salvo" ? GameConfig.colossus.shellFlight + 0.4 : 0.35);
              this.mode = "aiming";
            }
            if (this.windup > 0) {
              this.windup = Math.max(0, this.windup - dt);
              if (this.windup === 0) {
                this.emit(shots, 0);
                this.pendingShots = this.attack === "stomp" ? 0 : this.phase === 2 ? 2 : 1;
                this.shotDelay = 0.18;
                this.attackCooldown = this.phase === 1 ? GameConfig.colossus.firstRecovery : GameConfig.colossus.secondRecovery;
                this.mode = "recovering";
              }
            }
            if (Math.abs(p.x - this.x) < 132 && p.y < this.y + 200) p.takeDamage(1, p.x < this.x ? -1 : 1);
          }
        }, {
          key: "emit",
          value: function emit(shots, index) {
            this.recoil = 2;
            if (this.attack === "stomp") {
              this.impactSerial++;
              var _iterator = _createForOfIteratorHelper([-1, 1]),
                _step;
              try {
                for (_iterator.s(); !(_step = _iterator.n()).done;) {
                  var d = _step.value;
                  shots.spawn({
                    owner: "enemy",
                    x: this.x + d * 144,
                    y: this.y + 14,
                    direction: d,
                    speed: GameConfig.colossus.waveSpeed,
                    damage: 1,
                    range: 1050,
                    kind: "shockwave"
                  });
                }
              } catch (err) {
                _iterator.e(err);
              } finally {
                _iterator.f();
              }
              shots.particles.blast(this.x, this.y + 15, 80, this.y);
              return;
            }
            var x = this.x + this.facing * 132,
              y = this.y + (this.attack === "salvo" ? 226 : 138);
            var target = this.warningX + (index === 0 ? 0 : index % 2 ? 90 : -90);
            if (this.attack === "salvo") {
              var flight = GameConfig.colossus.shellFlight,
                vx = (target - x) / flight,
                vy = (this.warningY - y + 0.5 * 800 * flight * flight) / flight;
              shots.spawn({
                owner: "enemy",
                x: x,
                y: y,
                direction: vx >= 0 ? 1 : -1,
                pitch: Math.atan2(vy, Math.abs(vx)),
                speed: Math.hypot(vx, vy),
                damage: 1,
                range: 2000,
                gravity: 800,
                kind: "cannon",
                blastRadius: 65
              });
            } else {
              var pitch = Math.atan2(this.lockedY - y, Math.abs(this.warningX - x)) + (index === 0 ? 0 : index % 2 ? 0.055 : -0.055);
              shots.spawn({
                owner: "enemy",
                x: x,
                y: y,
                direction: this.facing,
                pitch: pitch,
                speed: 360,
                damage: 1,
                range: 1450,
                kind: "cannon",
                blastRadius: 35
              });
            }
          }
        }]);
        return ColossusBoss;
      }(EnemyController));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CombatRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts', './ProjectileArt.ts', './ColossusBoss.ts', './ComicCombatArt.ts', './MeleePose.ts', './ComicAssets.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Color, Graphics, colors, ProjectileArt, ColossusBoss, ComicCombatArt, meleePose, ComicAssets;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Graphics = module.Graphics;
    }, function (module) {
      colors = module.colors;
    }, function (module) {
      ProjectileArt = module.ProjectileArt;
    }, function (module) {
      ColossusBoss = module.ColossusBoss;
    }, function (module) {
      ComicCombatArt = module.ComicCombatArt;
    }, function (module) {
      meleePose = module.meleePose;
    }, function (module) {
      ComicAssets = module.ComicAssets;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7fbc6X82fOQGSvecMSWPscB", "CombatRenderer", undefined);
      var CombatRenderer = exports('CombatRenderer', /*#__PURE__*/function () {
        function CombatRenderer() {
          _classCallCheck(this, CombatRenderer);
          _defineProperty(this, "comic", new ComicCombatArt());
          _defineProperty(this, "projectileArt", new ProjectileArt());
          _defineProperty(this, "tint", new Color(24, 24, 24));
          _defineProperty(this, "smoke", new Color(30, 30, 30));
          _defineProperty(this, "light", new Color(250, 249, 245));
          _defineProperty(this, "points", Array.from({
            length: 25
          }, function () {
            return {
              x: 0,
              y: 0
            };
          }));
        }
        _createClass(CombatRenderer, [{
          key: "status",
          value: function status() {
            return {
              rockets: this.comic.playerRockets,
              muzzle: this.comic.muzzlePoint
            };
          }
        }, {
          key: "cloud",
          value: /** Scalloped Bezier silhouette, not a pile of overlaid circles. */
          function cloud(ink, x, y, rx, ry, fill, outline) {
            var seed = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
            var width = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : 2.8;
            var g = ink.g,
              count = 5,
              step = Math.PI * 2 / count;
            g.moveTo(x + Math.cos(seed) * rx * 0.78, y + Math.sin(seed) * ry * 0.78);
            for (var n = 0; n < count; n++) {
              var a = seed + n * step,
                end = a + step;
              g.bezierCurveTo(x + Math.cos(a + step * 0.2) * rx * 1.32, y + Math.sin(a + step * 0.2) * ry * 1.32, x + Math.cos(a + step * 0.8) * rx * 1.32, y + Math.sin(a + step * 0.8) * ry * 1.32, x + Math.cos(end) * rx * 0.78, y + Math.sin(end) * ry * 0.78);
            }
            g.close();
            g.fillColor = fill;
            g.fill();
            g.strokeColor = outline;
            g.lineWidth = width;
            g.stroke();
          }
        }, {
          key: "shape",
          value: function shape(ink, x, y, rx, ry, seed, jagged, fill) {
            var stroke = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : fill;
            var width = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 2;
            for (var n = 0; n < 24; n++) {
              var a = n * Math.PI / 12;
              var r = jagged ? n % 2 ? 0.42 : 1 + Math.sin(n * 2.4 + seed) * 0.18 : 0.88 + Math.sin(n * 1.9 + seed) * 0.1;
              this.points[n].x = x + Math.cos(a) * rx * r;
              this.points[n].y = y + Math.sin(a) * ry * r;
            }
            this.points[24].x = this.points[0].x;
            this.points[24].y = this.points[0].y;
            ink.polygon(this.points, fill);
            ink.line(this.points, width, stroke);
          }
        }, {
          key: "draw",
          value: function draw(ink, session) {
            var _this = this;
            ink.clear();
            this.comic.begin(ink);
            ink.g.lineCap = Graphics.LineCap.BUTT;
            var cam = session.camera.x,
              visible = session.camera.visibleWidth;
            var player = session.player;
            // New complete knife frames already contain the blade and painted slash.
            // Drawing the legacy attached blade/arc here would duplicate the weapon.
            if (player.meleeTime > 0 && !ComicAssets.enabled) {
              var view = meleePose(player),
                facing = player.facing,
                x = player.x - cam,
                y = player.y + view.originY;
              var hx = x + view.hand.x * facing,
                hy = player.y + view.hand.y;
              if (!this.comic.knife(hx, hy, view.angle, facing, view.width)) ink.segment(hx, hy, hx + Math.cos(view.angle) * view.width * facing, hy + Math.sin(view.angle) * view.width, 6);
              if (view.active) {
                var direction = view.stage === 2 ? 1 : -1;
                var tail = view.end - direction * .85;
                var arc = Array.from({
                  length: 14
                }, function (_, i) {
                  var a = tail + (view.end - tail) * i / 13;
                  return {
                    x: hx + Math.cos(a) * view.range * facing,
                    y: hy + Math.sin(a) * view.range
                  };
                });
                ink.line(arc, view.stage === 3 ? 13 : 9, colors.ink);
                ink.line(arc, view.stage === 3 ? 8 : 5, colors.white);
                var _loop = function _loop() {
                  var offset = _arr[_i];
                  ink.line(arc.map(function (p) {
                    return {
                      x: p.x - offset * facing,
                      y: p.y + offset * .25
                    };
                  }), 2, colors.muted);
                };
                for (var _i = 0, _arr = [8, 16]; _i < _arr.length; _i++) {
                  _loop();
                }
                for (var i = 0; i < 3; i++) ink.segment(x - facing * (30 + i * 9), y + 18 - i * 12, x - facing * (50 + i * 9), y + 18 - i * 12, 2.5);
              }
            }
            var tracking = session.projectiles.items.find(function (p) {
              var _p$target;
              return p.active && p.homing && ((_p$target = p.target) === null || _p$target === void 0 ? void 0 : _p$target.alive);
            });
            if (tracking !== null && tracking !== void 0 && tracking.target) {
              var b = tracking.target.bounds,
                _x = b.x + b.w / 2 - cam,
                _y = b.y + b.h / 2;
              ink.circle(_x, _y, 19, colors.ink, undefined, 2);
              for (var _i2 = 0, _arr2 = [-1, 1]; _i2 < _arr2.length; _i2++) {
                var sign = _arr2[_i2];
                ink.segment(_x + sign * 15, _y, _x + sign * 25, _y, 2.5);
                ink.segment(_x, _y + sign * 15, _x, _y + sign * 25, 2.5);
              }
            }
            var _iterator = _createForOfIteratorHelper(session.projectiles.marks),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var m = _step.value;
                if (m.active && m.x > cam - 10 && m.x < cam + visible + 10) {
                  ink.circle(m.x - cam, m.y, 1.6, colors.muted, colors.muted, 1);
                  ink.segment(m.x - cam - 3, m.y + 3, m.x - cam + 2, m.y - 2, 1, colors.muted);
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            for (var _i3 = 0, _arr3 = [session.spawner.guard, session.spawner.miniBoss]; _i3 < _arr3.length; _i3++) {
              var boss = _arr3[_i3];
              if (!(boss !== null && boss !== void 0 && boss.active) || boss.warningTime <= 0) continue;
              if (boss instanceof ColossusBoss && boss.attack === "sweep") {
                var ax = boss.x + boss.facing * 132 - cam,
                  ay = boss.y + 138;
                var bx = boss.warningX - cam,
                  by = boss.warningTargetY;
                for (var n = 0; n < 16; n += 2) ink.segment(ax + (bx - ax) * n / 16, ay + (by - ay) * n / 16, ax + (bx - ax) * (n + 1) / 16, ay + (by - ay) * (n + 1) / 16, 2, colors.muted);
                ink.circle(bx, by, 14, colors.ink, undefined, 2.5);
              } else if (boss instanceof ColossusBoss && boss.attack === "stomp") {
                var _x2 = boss.x - cam;
                ink.ellipse(_x2, boss.y + 5, 156, 11, colors.ink, undefined, 3);
                for (var _i4 = 0, _arr4 = [-1, 1]; _i4 < _arr4.length; _i4++) {
                  var side = _arr4[_i4];
                  for (var _n = 0; _n < 3; _n++) {
                    var px = _x2 + side * (170 + _n * 40);
                    ink.line([{
                      x: px,
                      y: boss.y + 8
                    }, {
                      x: px + side * 18,
                      y: boss.y + 17
                    }, {
                      x: px,
                      y: boss.y + 26
                    }], 2.5);
                  }
                }
              } else {
                var offsets = boss instanceof ColossusBoss ? boss.phase === 2 ? [-90, 0, 90] : [0, 90] : boss.phase === 2 ? [0, 75] : [0];
                for (var _i5 = 0, _offsets = offsets; _i5 < _offsets.length; _i5++) {
                  var offset = _offsets[_i5];
                  var _x3 = boss.warningX + offset - cam,
                    _y2 = session.level.groundY(boss.warningX + offset);
                  ink.ellipse(_x3, _y2 + 4, boss instanceof ColossusBoss ? 65 : 85, 10, colors.ink, undefined, 2.5);
                  ink.segment(_x3 - 25, _y2 + 7, _x3 + 25, _y2 + 7, 2);
                  ink.segment(_x3 - 38, _y2 + 25, _x3 - 30, _y2 + 33, 2);
                  ink.segment(_x3 + 38, _y2 + 25, _x3 + 30, _y2 + 33, 2);
                }
              }
            }
            var _iterator2 = _createForOfIteratorHelper(session.explosions.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _b2 = _step2.value;
                if (_b2.active && _b2.x > cam - _b2.radius && _b2.x < cam + visible + _b2.radius) {
                  if (this.comic.blast(ink, _b2, cam, session.level.groundY(_b2.x))) continue;
                  var _x4 = _b2.x - cam,
                    age = _b2.age,
                    t = age / 0.85,
                    radius = _b2.radius;
                  var grenade = _b2.style === "grenade",
                    shockTime = grenade ? 0.4 : 0.28;
                  // A fast shock front separates from the slower, rising ink cloud.
                  if (age < shockTime) {
                    this.tint.set(24, 24, 24, 240 * (1 - age / shockTime));
                    ink.circle(_x4, _b2.y, radius * Math.sqrt(age / shockTime), this.tint, undefined, 7 * (1 - age / shockTime) + 1);
                    var ground = session.level.groundY(_b2.x) + 5;
                    if (_b2.y - radius < ground) ink.ellipse(_x4, ground, radius * Math.sqrt(age / shockTime), 12 + age * 18, this.tint, undefined, 4);
                  }
                  if (age > (grenade ? 0.075 : 0.035)) for (var _n2 = 0; _n2 < 6; _n2++) {
                    var a = _n2 * Math.PI / 3 + Math.sin(_b2.x) * 0.3;
                    var reach = radius * (0.14 + t * 0.32),
                      size = radius * (0.18 + t * 0.16);
                    this.smoke.set(32 + _n2 * 7, 32 + _n2 * 7, 30 + _n2 * 7, 235 * Math.min(1, (0.85 - age) / 0.3));
                    this.tint.set(24, 24, 24, this.smoke.a);
                    this.cloud(ink, _x4 + Math.cos(a) * reach, _b2.y + Math.abs(Math.sin(a)) * reach + t * (grenade ? 110 : 85), size, size * 1.05, this.smoke, this.tint, _n2 * 0.4, 4.2);
                  }
                  if (age > 0.08 && age < 0.55) {
                    this.light.set(250, 249, 245, 235 * Math.min(1, (0.55 - age) / 0.2));
                    this.tint.set(24, 24, 24, this.light.a);
                    this.cloud(ink, _x4, _b2.y + age * 70, radius * (0.36 + age * 0.14), radius * 0.35, this.light, this.tint, 0.4, 4);
                    // Ink flecks inside the pale foreground separate the cloud from a flat white disc.
                    for (var _n3 = 0; _n3 < 7; _n3++) {
                      var dx = Math.sin(_n3 * 2.3) * radius * 0.22;
                      var dy = Math.cos(_n3 * 1.7) * radius * 0.18;
                      ink.segment(_x4 + dx, _b2.y + age * 70 + dy, _x4 + dx * 1.08 + 2, _b2.y + age * 70 + dy + 4, 3, this.tint);
                    }
                  }
                  if (age < (grenade ? 0.2 : 0.16)) {
                    var r = radius * (0.5 + age * 1.7);
                    this.shape(ink, _x4, _b2.y, r, r * 0.9, _b2.x, true, colors.ink);
                    this.shape(ink, _x4, _b2.y, r * 0.78, r * 0.7, _b2.x, true, colors.white, colors.white, 1);
                    // Light foreground puff breaks the dark ink crown into a comic blast.
                    this.cloud(ink, _x4, _b2.y + age * 95, radius * 0.23, radius * 0.3, colors.white, colors.ink, 0.4, 3);
                  }
                  if (age < 0.24) for (var _n4 = 0; _n4 < 9; _n4++) {
                    var _a = _n4 * Math.PI * 2 / 9,
                      _r = radius * (0.35 + age * 1.8);
                    ink.segment(_x4 + Math.cos(_a) * _r, _b2.y + Math.sin(_a) * _r, _x4 + Math.cos(_a) * (_r + 22), _b2.y + Math.sin(_a) * (_r + 22), 4);
                  }
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            var _iterator3 = _createForOfIteratorHelper(session.particles.items),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var p = _step3.value;
                if (p.active && p.x > cam - 80 && p.x < cam + visible + 80) {
                  if (this.comic.particle(p, cam)) continue;
                  var color = this.tint,
                    amount = 1 - p.life / p.maxLife;
                  color.set(p.kind === "smoke" ? 225 : 24, p.kind === "smoke" ? 225 : 24, p.kind === "smoke" ? 220 : 24, 255 * p.life / p.maxLife);
                  if (p.kind === "impact") {
                    var _r2 = p.size * (0.5 + amount * 0.7);
                    this.shape(ink, p.x - cam, p.y, _r2, p.material === "metal" ? _r2 * 0.5 : _r2, p.spin, true, color);
                    this.shape(ink, p.x - cam, p.y, _r2 * 0.55, _r2 * 0.55, p.spin, true, colors.white);
                  } else if (p.kind === "smoke") {
                    this.smoke.set(24, 24, 24, color.a * 0.85);
                    this.cloud(ink, p.x - cam, p.y, p.size + amount * 14, p.size * 0.8 + amount * 7, color, this.smoke, p.spin * 0.15, 2.8);
                  } else if (p.kind === "dust") ink.ellipse(p.x - cam, p.y, p.size + amount * 7, p.size * 0.65 + amount * 5, color, color, 1);else if (p.kind === "wood" || p.kind === "metal") {
                    var _x5 = p.x - cam,
                      _y3 = p.y,
                      cs = Math.cos(p.spin),
                      sn = Math.sin(p.spin),
                      _r3 = p.size * 2.2;
                    ink.polygon([{
                      x: _x5 - _r3 * cs,
                      y: _y3 - _r3 * sn
                    }, {
                      x: _x5 + 3 * sn,
                      y: _y3 - 3 * cs
                    }, {
                      x: _x5 + _r3 * cs,
                      y: _y3 + _r3 * sn
                    }, {
                      x: _x5 - 3 * sn,
                      y: _y3 + 3 * cs
                    }], color);
                    if (p.kind === "wood") ink.segment(_x5 - _r3 * cs * 0.65, _y3 - _r3 * sn * 0.65, _x5 + _r3 * cs * 0.65, _y3 + _r3 * sn * 0.65, 1, colors.paper);
                  } else if (p.kind === "shell") {
                    var length = p.kind === "shell" ? 3 : 7;
                    ink.segment(p.x - cam - Math.cos(p.spin) * length, p.y - Math.sin(p.spin) * length, p.x - cam + Math.cos(p.spin) * length, p.y + Math.sin(p.spin) * length, p.size, color);
                  } else ink.segment(p.x - cam, p.y, p.x - cam - p.vx * 0.018, p.y - p.vy * 0.018, p.size, color);
                }
              }
              // Render bodies after their smoke so the special weapon silhouette stays legible.
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            var _iterator4 = _createForOfIteratorHelper(session.projectiles.items),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var _p = _step4.value;
                if (_p.active && _p.x > cam - 70 && _p.x < cam + visible + 70) if (!this.comic.projectile(_p, cam)) this.projectileArt.draw(ink, _p, cam, session.time);
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
            var _iterator5 = _createForOfIteratorHelper(session.grenades.items),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var g = _step5.value;
                if (g.active && g.x > cam - 30 && g.x < cam + visible + 30) if (!this.comic.grenade(g, cam)) this.projectileArt.grenade(ink, g, cam);
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
            var flash = function flash(weapon) {
              if (weapon.flash <= 0) return;
              if (_this.comic.muzzle(weapon, cam, weapon === session.weapon ? session.player : undefined)) return;
              var x = weapon.flashX - cam,
                y = weapon.flashY,
                d = weapon.flashFacing;
              var cs = Math.cos(weapon.flashPitch),
                sn = Math.sin(weapon.flashPitch);
              var g = ink.g,
                wide = weapon.id === "shotgun" ? 1.7 : weapon.id === "rocket" ? 1.4 : 1;
              var points = [0, 0, 6, 8, 13, 5, 26, 12, 20, 2, 33, 0, 19, -3, 25, -11, 12, -5, 6, -8];
              for (var _i6 = 0; _i6 < points.length; _i6 += 2) {
                var a = points[_i6] * wide,
                  _b = points[_i6 + 1] * wide;
                var _px = x + (a * cs - _b * sn) * d,
                  py = y + a * sn + _b * cs;
                if (_i6 === 0) g.moveTo(_px, py);else g.lineTo(_px, py);
              }
              g.close();
              g.fillColor = colors.white;
              g.fill();
              g.strokeColor = colors.ink;
              g.lineWidth = 2.8;
              g.stroke();
              if (weapon.id === "shotgun") for (var _i7 = 0, _arr5 = [-1, 1]; _i7 < _arr5.length; _i7++) {
                var _side = _arr5[_i7];
                ink.segment(x + 22 * d, y + _side * 23, x + 40 * d, y + _side * 30, 2);
              }
            };
            flash(session.weapon);
            var _iterator6 = _createForOfIteratorHelper(session.spawner.enemies),
              _step6;
            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                var e = _step6.value;
                if (e.x < cam - 60 || e.x > cam + visible + 60) continue;
                flash(e.weapon);
                if (e.windup > 0 && e.alive && e.kind !== "guard" && e.kind !== "colossus") {
                  var _x6 = e.x - cam,
                    _y4 = e.y + 91;
                  ink.line([{
                    x: _x6,
                    y: _y4 + 6
                  }, {
                    x: _x6,
                    y: _y4 + 16
                  }], 2);
                  ink.circle(_x6, _y4, 1, colors.ink, colors.ink, 1);
                }
                if (e.alive && e.health < e.maxHealth && e.kind !== "guard" && e.kind !== "colossus") {
                  ink.rect(e.x - cam - 18, e.y + 84, 36, 3, colors.muted, colors.paper, 1);
                  ink.rect(e.x - cam - 18, e.y + 84, 36 * e.health / e.maxHealth, 3, colors.ink, colors.ink, 1);
                }
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }
            ink.g.lineCap = Graphics.LineCap.ROUND;
            this.comic.end();
          }
        }]);
        return CombatRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicActorArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ComicAssets.ts', './ComicFrames.ts', './ComicPose.ts', './ComicEquipment.ts', './WeaponPresentation.ts', './DirectPose.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, Sprite, ComicBatch, ComicAssets, ComicFrames, comicMuzzle, comicEquipment, weaponPresentation, isDirectActor;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Sprite = module.Sprite;
    }, function (module) {
      ComicBatch = module.ComicBatch;
      ComicAssets = module.ComicAssets;
    }, function (module) {
      ComicFrames = module.ComicFrames;
    }, function (module) {
      comicMuzzle = module.comicMuzzle;
    }, function (module) {
      comicEquipment = module.comicEquipment;
    }, function (module) {
      weaponPresentation = module.weaponPresentation;
    }, function (module) {
      isDirectActor = module.isDirectActor;
    }],
    execute: function () {
      cclegacy._RF.push({}, "19af5HIo5U7RbOuCPDBueYu", "ComicActorArt", undefined);

      /** Whole supplied action frames. No segmented legs, geometric limbs or rotated corpses. */
      var ComicActorArt = exports('ComicActorArt', /*#__PURE__*/function () {
        function ComicActorArt() {
          _classCallCheck(this, ComicActorArt);
          _defineProperty(this, "playerStatus", {
            body: "",
            weapon: "",
            weaponVisible: false
          });
          _defineProperty(this, "batch", void 0);
        }
        _createClass(ComicActorArt, [{
          key: "begin",
          value: function begin(ink) {
            var _this$batch;
            (_this$batch = this.batch) !== null && _this$batch !== void 0 ? _this$batch : this.batch = new ComicBatch(ink.node, "Comic actors");
            this.batch.begin();
          }
        }, {
          key: "end",
          value: function end() {
            var _this$batch2;
            (_this$batch2 = this.batch) === null || _this$batch2 === void 0 || _this$batch2.end();
          }
        }, {
          key: "draw",
          value: function draw(ink, a, cam) {
            // The supplied sheets contain no walking giant. Keep that separate final encounter
            // explicitly outside this first-two-zone art pass, rather than disguising it as a tank.
            if (!ComicAssets.enabled || a.kind === "colossus") return false;
            if (!this.batch) this.begin(ink);
            var equipment = comicEquipment(a),
              id = equipment.body,
              data = ComicFrames[id];
            var scale = a.kind === "guard" ? 1.25 : a.kind ? .8 : isDirectActor(id) ? .84 : .64;
            var alpha = a.invincible && Math.floor(a.invincible * 15) % 2 ? 130 : 255;
            var dead = a.animation === "Dead";
            var bodyNode = this.batch.put(id, a.x - cam, a.y, data.sourceSize[0] * scale, data.sourceSize[1] * scale, 0, dead && a.kind !== "guard" ? Math.min(alpha, Math.max(0, (.85 - a.deadTime) * 900)) : alpha, a.facing);
            if (!a.kind) {
              var _bodyNode$getComponen, _bodyNode$getComponen2;
              var baked = equipment.bakedWeapon || (equipment.bakedRifle ? "rifle" : "");
              this.playerStatus = {
                body: (_bodyNode$getComponen = (_bodyNode$getComponen2 = bodyNode.getComponent(Sprite)) === null || _bodyNode$getComponen2 === void 0 || (_bodyNode$getComponen2 = _bodyNode$getComponen2.spriteFrame) === null || _bodyNode$getComponen2 === void 0 ? void 0 : _bodyNode$getComponen2.name) !== null && _bodyNode$getComponen !== void 0 ? _bodyNode$getComponen : "",
                weapon: baked ? "baked.".concat(baked) : "",
                weaponVisible: !!baked
              };
            }
            // The cleaned source frame removes the original rifle pixels. One equipped
            // weapon is drawn between the body and the retained original hand pixels.
            if (equipment.weapon) {
              var _a$weaponId, _a$aimPitch, _gunNode$getComponent, _gunNode$getComponent2;
              var weapon = (_a$weaponId = a.weaponId) !== null && _a$weaponId !== void 0 ? _a$weaponId : "rifle",
                pitch = (_a$aimPitch = a.aimPitch) !== null && _a$aimPitch !== void 0 ? _a$aimPitch : 0;
              var view = weaponPresentation(weapon, -1);
              var tip = comicMuzzle(a, pitch, view.muzzleExtra);
              var knife = weapon === "knife";
              var gunNode = this.batch.put(equipment.weapon, a.x - cam + (tip.x - (knife ? 35 : 0)) * a.facing, a.y + tip.y, view.width, undefined, (knife ? .35 : pitch) * a.facing * 180 / Math.PI, alpha, a.facing, knife ? [0, .5] : [1, .6]);
              this.playerStatus.weapon = (_gunNode$getComponent = (_gunNode$getComponent2 = gunNode.getComponent(Sprite)) === null || _gunNode$getComponent2 === void 0 || (_gunNode$getComponent2 = _gunNode$getComponent2.spriteFrame) === null || _gunNode$getComponent2 === void 0 ? void 0 : _gunNode$getComponent2.name) !== null && _gunNode$getComponent !== void 0 ? _gunNode$getComponent : "";
              this.playerStatus.weaponVisible = gunNode.active && !!this.playerStatus.weapon;
              if (equipment.grip) this.batch.put(equipment.grip, a.x - cam, a.y, data.sourceSize[0] * scale, data.sourceSize[1] * scale, 0, alpha, a.facing);
            }
            return true;
          }
        }]);
        return ComicActorArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicAssets.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ComicFrames.ts', './SupplementFrames.ts', './DirectFrames.ts', './GameConfig.ts', './Ink.ts'], function (exports) {
  var _createClass, _defineProperty, _classCallCheck, _toConsumableArray, _asyncToGenerator, _regeneratorRuntime, _slicedToArray, _construct, cclegacy, SpriteFrame, Rect, Size, Sprite, UITransform, Color, Texture2D, resources, ComicFrames, SupplementFrames, DirectFrames, GameConfig, node;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _defineProperty = module.defineProperty;
      _classCallCheck = module.classCallCheck;
      _toConsumableArray = module.toConsumableArray;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
      _slicedToArray = module.slicedToArray;
      _construct = module.construct;
    }, function (module) {
      cclegacy = module.cclegacy;
      SpriteFrame = module.SpriteFrame;
      Rect = module.Rect;
      Size = module.Size;
      Sprite = module.Sprite;
      UITransform = module.UITransform;
      Color = module.Color;
      Texture2D = module.Texture2D;
      resources = module.resources;
    }, function (module) {
      ComicFrames = module.ComicFrames;
    }, function (module) {
      SupplementFrames = module.SupplementFrames;
    }, function (module) {
      DirectFrames = module.DirectFrames;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      node = module.node;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1576a+LdAzpQ7e2i9jQCcxR", "ComicAssets", undefined);

      /** Preloaded shared textures. No resource loads during weapon changes. */
      var ComicAssets = exports('ComicAssets', /*#__PURE__*/function () {
        function ComicAssets() {
          _classCallCheck(this, ComicAssets);
        }
        _createClass(ComicAssets, null, [{
          key: "enabled",
          get: function get() {
            return GameConfig.artStyle === "comic" && this.ready;
          }
        }, {
          key: "load",
          value: function () {
            var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
              var _load2, _yield$Promise$all, _yield$Promise$all2, texture, supplement, _native, _i, _arr, id, data, f;
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    if (!(GameConfig.artStyle !== "comic" || this.ready)) {
                      _context.next = 2;
                      break;
                    }
                    return _context.abrupt("return");
                  case 2:
                    _context.prev = 2;
                    _load2 = function _load2(name) {
                      return new Promise(function (resolve, reject) {
                        return resources.load("comic/".concat(name, "/texture"), Texture2D, function (err, asset) {
                          return err ? reject(err) : resolve(asset);
                        });
                      });
                    };
                    _context.next = 6;
                    return Promise.all([_load2("comic"), _load2("supplement"), _load2("native")]);
                  case 6:
                    _yield$Promise$all = _context.sent;
                    _yield$Promise$all2 = _slicedToArray(_yield$Promise$all, 3);
                    texture = _yield$Promise$all2[0];
                    supplement = _yield$Promise$all2[1];
                    _native = _yield$Promise$all2[2];
                    // Clamp padded atlas edges on WebGL 1 and WeChat; V0.5.3 is 2048 square.
                    texture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
                    supplement.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
                    _native.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
                    for (_i = 0, _arr = Object.keys(ComicFrames); _i < _arr.length; _i++) {
                      id = _arr[_i];
                      data = ComicFrames[id], f = new SpriteFrame();
                      f.name = id;
                      f.texture = id in DirectFrames ? _native : id in SupplementFrames ? supplement : texture;
                      f.rect = _construct(Rect, _toConsumableArray(data.atlas));
                      f.originalSize = _construct(Size, _toConsumableArray(data.size));
                      this.frames.set(id, f);
                    }
                    this.ready = true;
                    console.info("[Breakout] Comic atlases loaded: ".concat(this.frames.size, " frames, 3 textures."));
                    _context.next = 23;
                    break;
                  case 19:
                    _context.prev = 19;
                    _context.t0 = _context["catch"](2);
                    this.error = String(_context.t0);
                    console.error("[Breakout] Comic atlas unavailable; using legacy art.", _context.t0);
                  case 23:
                  case "end":
                    return _context.stop();
                }
              }, _callee, this, [[2, 19]]);
            }));
            function load() {
              return _load.apply(this, arguments);
            }
            return load;
          }()
        }, {
          key: "frame",
          value: function frame(id) {
            return this.frames.get(id);
          }
        }, {
          key: "has",
          value: function has(id) {
            return this.frames.has(id);
          }
        }, {
          key: "region",
          value: function region(id, crop) {
            var key = "".concat(id, "/").concat(crop.join(","));
            var frame = this.regions.get(key);
            if (!frame) {
              var data = ComicFrames[id];
              frame = new SpriteFrame();
              frame.texture = this.frame(id).texture;
              frame.rect = new Rect(data.atlas[0] + crop[0], data.atlas[1] + crop[1], crop[2], crop[3]);
              frame.originalSize = new Size(crop[2], crop[3]);
              this.regions.set(key, frame);
            }
            return frame;
          }
        }]);
        return ComicAssets;
      }());

      /** Reusable per-layer sprite slots. No per-frame node/texture creation after warmup. */
      _defineProperty(ComicAssets, "ready", false);
      _defineProperty(ComicAssets, "error", "");
      _defineProperty(ComicAssets, "frames", new Map());
      _defineProperty(ComicAssets, "regions", new Map());
      var ComicBatch = exports('ComicBatch', /*#__PURE__*/function () {
        function ComicBatch(parent, name) {
          _classCallCheck(this, ComicBatch);
          _defineProperty(this, "slots", []);
          _defineProperty(this, "cursor", 0);
          this.parent = parent;
          this.name = name;
        }
        _createClass(ComicBatch, [{
          key: "begin",
          value: function begin() {
            this.cursor = 0;
          }
        }, {
          key: "put",
          value: function put(id, x, y, width, height) {
            var _slot$transform;
            var angle = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
            var alpha = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 255;
            var flip = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 1;
            var anchor = arguments.length > 8 ? arguments[8] : undefined;
            var cached = ComicAssets.frame(id);
            // Keep the previous complete visual when an optional frame is unavailable.
            // Startup preloads the entire atlas, so switching never initiates a load.
            if (!cached && this.slots[this.cursor]) return this.slots[this.cursor++].node;
            if (!cached) throw new Error("Missing preloaded comic frame: ".concat(id));
            var i = this.cursor++;
            if (!this.slots[i]) {
              var n = node(this.parent, "".concat(this.name, "/").concat(i)),
                sprite = n.addComponent(Sprite);
              sprite.sizeMode = Sprite.SizeMode.CUSTOM;
              sprite.trim = false;
              this.slots[i] = {
                node: n,
                sprite: sprite,
                transform: n.getComponent(UITransform),
                color: new Color(255, 255, 255)
              };
            }
            var slot = this.slots[i],
              d = ComicFrames[id];
            if (slot.id !== id) {
              slot.sprite.spriteFrame = cached;
              slot.id = id;
            }
            (_slot$transform = slot.transform).setAnchorPoint.apply(_slot$transform, _toConsumableArray(anchor !== null && anchor !== void 0 ? anchor : d.anchor));
            slot.transform.setContentSize(width, height !== null && height !== void 0 ? height : width * d.size[1] / d.size[0]);
            slot.node.active = true;
            slot.node.setPosition(x, y);
            slot.node.setScale(flip, 1, 1);
            slot.node.angle = angle;
            slot.color.set(255, 255, 255, alpha);
            slot.sprite.color = slot.color;
            return slot.node;
          }
        }, {
          key: "end",
          value: function end() {
            for (var i = this.cursor; i < this.slots.length; i++) this.slots[i].node.active = false;
          }
        }, {
          key: "capacity",
          get: function get() {
            return this.slots.length;
          }
          /** Cropped repeat tiles keep exactly one uniform scale in both axes. */
        }, {
          key: "tile",
          value: function tile(id, x, y, scale, crop) {
            this.putRegion(id, x, y, scale, crop);
          }
        }, {
          key: "putRegion",
          value: function putRegion(id, x, y, scale, crop) {
            var angle = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
            var anchor = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : [0, 0];
            var result = this.put(id, x, y, crop[2] * scale, crop[3] * scale, angle, 255, 1, anchor);
            this.slots[this.cursor - 1].sprite.spriteFrame = ComicAssets.region(id, crop);
            // A later ordinary put must restore its full frame even when the ID matches.
            this.slots[this.cursor - 1].id = undefined;
            return result;
          }
        }]);
        return ComicBatch;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicCombatArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ComicAssets.ts', './Ink.ts', './ComicFrames.ts', './ComicPose.ts', './RocketPresentation.ts', './GameConfig.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, UITransform, ComicBatch, ComicAssets, colors, ComicClips, ComicFrames, comicMuzzle, rocketCrop, GameConfig;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      UITransform = module.UITransform;
    }, function (module) {
      ComicBatch = module.ComicBatch;
      ComicAssets = module.ComicAssets;
    }, function (module) {
      colors = module.colors;
    }, function (module) {
      ComicClips = module.ComicClips;
      ComicFrames = module.ComicFrames;
    }, function (module) {
      comicMuzzle = module.comicMuzzle;
    }, function (module) {
      rocketCrop = module.rocketCrop;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d5583cD7rF62E+Us4waPIgn", "ComicCombatArt", undefined);

      /** Separate timed flash, illustrated ink burst, rising sprite smoke and physical debris. */
      var ComicCombatArt = exports('ComicCombatArt', /*#__PURE__*/function () {
        function ComicCombatArt() {
          _classCallCheck(this, ComicCombatArt);
          _defineProperty(this, "batch", void 0);
          _defineProperty(this, "playerRockets", []);
          _defineProperty(this, "muzzlePoint", void 0);
        }
        _createClass(ComicCombatArt, [{
          key: "begin",
          value: function begin(ink) {
            var _this$batch;
            this.playerRockets.length = 0;
            this.muzzlePoint = undefined;
            (_this$batch = this.batch) !== null && _this$batch !== void 0 ? _this$batch : this.batch = new ComicBatch(ink.node, "Comic combat pool");
            this.batch.begin();
          }
        }, {
          key: "end",
          value: function end() {
            var _this$batch2;
            (_this$batch2 = this.batch) === null || _this$batch2 === void 0 || _this$batch2.end();
          }
        }, {
          key: "knife",
          value: function knife(x, y, angle, facing, width) {
            if (!ComicAssets.enabled) return false;
            this.batch.put("weapon.knife", x, y, width, undefined, angle * facing * 180 / Math.PI, 255, facing, [0, .5]);
            return true;
          }
        }, {
          key: "blast",
          value: function blast(ink, b, cam, ground) {
            if (!ComicAssets.enabled) return false;
            var x = b.x - cam,
              r = b.radius,
              t = b.age;
            if (t < 0.32) {
              ink.circle(x, b.y, r * Math.sqrt(t / 0.32), colors.ink, undefined, Math.max(1, 5 * (1 - t / 0.32)));
              if (b.y - r < ground) ink.ellipse(x, ground + 3, r * Math.sqrt(t / 0.32), 10 + t * 30, colors.muted, undefined, 2);
            }
            if (t < 0.055) ink.circle(x, b.y, 15 + t * r * 7, colors.ink, colors.white, 4);
            var stage = Math.min(6, Math.floor(t / .07));
            if (t < 0.56) this.batch.put(ComicClips.explosion[stage], x, b.y - r * 0.32, r * [.22, .48, .85, 1.1, 1.45, 1.7, 1.85][stage], undefined, 0, Math.min(255, (0.56 - t) * 1800), 1, [0.5, 0.08]);
            if (t > 0.1) for (var n = 0; n < 3; n++) {
              var age = t - 0.1,
                side = n - 1;
              this.batch.put("effect.smoke", x + side * r * (0.17 + age * 0.22), b.y + r * 0.12 + age * (65 + n * 16), r * (0.35 + age * 0.45), undefined, side * (8 + age * 12), Math.min(230, Math.max(0, (0.85 - t) * 400)), n % 2 ? -1 : 1);
            }
            return true;
          }
        }, {
          key: "particle",
          value: function particle(p, cam) {
            if (!ComicAssets.enabled) return false;
            if (p.kind !== "smoke" && p.kind !== "impact" && p.kind !== "dust") return false;
            var a = 1 - p.life / p.maxLife;
            this.batch.put(p.kind === "smoke" ? "effect.smoke" : p.kind === "dust" ? "effect.dust" : p.material === "metal" ? "effect.metal" : p.material === "wood" ? "effect.wood" : "effect.impact", p.x - cam, p.y, p.kind === "smoke" ? p.size * 2.8 + a * 32 : p.kind === "dust" ? 22 + a * 20 : p.size * 2.4, undefined, p.kind === "smoke" ? p.spin * 8 : p.spin * 25, Math.max(0, 255 * p.life / p.maxLife));
            return true;
          }
        }, {
          key: "projectile",
          value: function projectile(p, cam) {
            if (!ComicAssets.enabled || p.kind === "shockwave") return false;
            var angle = Math.atan2(p.vy, p.vx) * 180 / Math.PI;
            var rocket = p.kind === "rocket" || p.kind === "cannon";
            if (p.kind === "rocket" && p.owner === "player") {
              var size = ComicFrames["projectile.rocket"].size;
              var sprite = this.batch.putRegion("projectile.rocket", p.x - cam, p.y, GameConfig.rocketLaunch.visualLength / size[0], rocketCrop(p.distance, size[0], size[1]), angle, [1, .5]);
              this.playerRockets.push({
                x: sprite.position.x + cam,
                y: sprite.position.y,
                width: sprite.getComponent(UITransform).contentSize.width,
                angle: sprite.angle,
                age: p.age
              });
              return true;
            }
            this.batch.put(rocket ? "projectile.rocket" : p.kind === "pellet" ? "projectile.pellet" : "projectile.bullet", p.x - cam, p.y, rocket ? 116 : p.kind === "pellet" ? 30 : 86, rocket ? undefined : p.kind === "pellet" ? 11 : 19, angle, 255, 1, [1, 0.5]);
            return true;
          }
        }, {
          key: "grenade",
          value: function grenade(g, cam) {
            if (!ComicAssets.enabled) return false;
            this.batch.put("projectile.grenade", g.x - cam, g.y, 19, 26, g.spin * 180 / Math.PI, 255, 1, [0.5, 0.42]);
            return true;
          }
        }, {
          key: "muzzle",
          value: function muzzle(w, cam, source) {
            var _source$aimPitch;
            if (!ComicAssets.enabled) return false;
            var tip = source ? comicMuzzle(source, (_source$aimPitch = source.aimPitch) !== null && _source$aimPitch !== void 0 ? _source$aimPitch : 0, w.id === "rifle" ? 0 : 9) : undefined;
            if (w.flash > 0) {
              var sprite = this.batch.put(w.id === "rocket" ? "effect.smoke" : w.id === "shotgun" ? "effect.muzzle-large" : "effect.muzzle", tip && source ? source.x + tip.x * source.facing - cam : w.flashX - cam, tip && source ? source.y + tip.y : w.flashY, w.id === "shotgun" ? 84 : w.id === "rocket" ? 72 : 48, undefined, w.flashPitch * w.flashFacing * 180 / Math.PI, 255, w.flashFacing, [0, 0.5]);
              if (source) this.muzzlePoint = {
                x: sprite.position.x + cam,
                y: sprite.position.y,
                pitch: sprite.angle * Math.PI / 180 / w.flashFacing
              };
            }
            return true;
          }
        }]);
        return ComicCombatArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicEquipment.ts", ['cc', './ComicFrames.ts', './ComicPose.ts', './DirectPose.ts'], function (exports) {
  var cclegacy, ComicFrames, ComicSockets, comicPose, isDirectActor;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ComicFrames = module.ComicFrames;
      ComicSockets = module.ComicSockets;
    }, function (module) {
      comicPose = module.comicPose;
    }, function (module) {
      isDirectActor = module.isDirectActor;
    }],
    execute: function () {
      exports('comicEquipment', comicEquipment);
      cclegacy._RF.push({}, "0c752ojp0UqG2r9VOyEVjDg", "ComicEquipment", undefined);

      /** Exactly one visible weapon: baked rifle OR a weapon-free body plus one gun. */
      function comicEquipment(a) {
        var _a$meleeTime, _a$throwTime, _a$weaponId, _a$aimPitch, _a$weaponId2;
        var pose = comicPose(a),
          clean = "unarmed.".concat(pose);
        if (isDirectActor(pose)) return {
          pose: pose,
          body: pose,
          weapon: null,
          grip: null,
          bakedRifle: false,
          bakedWeapon: pose.startsWith("direct.knife.") ? "knife" : "rocket"
        };
        var suppressed = a.animation === "Dead" || ((_a$meleeTime = a.meleeTime) !== null && _a$meleeTime !== void 0 ? _a$meleeTime : 0) > 0 || ((_a$throwTime = a.throwTime) !== null && _a$throwTime !== void 0 ? _a$throwTime : 0) > 0;
        var replacement = !a.kind && !suppressed && (((_a$weaponId = a.weaponId) !== null && _a$weaponId !== void 0 ? _a$weaponId : "rifle") !== "rifle" || ((_a$aimPitch = a.aimPitch) !== null && _a$aimPitch !== void 0 ? _a$aimPitch : 0) > .01);
        // Some falling/hit poses have no original weapon; still carry the equipped gun.
        var body = replacement && clean in ComicFrames ? clean : pose;
        var grip = "grip.".concat(pose);
        // Missing optional action variants fall back to a cached hold, never null.
        var fallback = a.crouched ? "unarmed.player.crouch.0" : "unarmed.player.stand-shoot.0";
        var hold = replacement && !(clean in ComicFrames) && pose !== "player.fall.1" && a.animation !== "Hit" ? fallback : body;
        return {
          pose: pose,
          body: hold,
          weapon: replacement ? "weapon.".concat((_a$weaponId2 = a.weaponId) !== null && _a$weaponId2 !== void 0 ? _a$weaponId2 : "rifle") : null,
          grip: replacement && grip in ComicFrames ? grip : null,
          bakedWeapon: "",
          bakedRifle: !a.kind && body === pose && !suppressed && pose !== "player.fall.1" && (pose in ComicSockets || pose === "player.hit.0")
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicFrames.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './SupplementFrames.ts', './DirectFrames.ts'], function (exports) {
  var _objectSpread2, cclegacy, SupplementFrames, DirectFrames;
  return {
    setters: [function (module) {
      _objectSpread2 = module.objectSpread2;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      SupplementFrames = module.SupplementFrames;
    }, function (module) {
      DirectFrames = module.DirectFrames;
    }],
    execute: function () {
      cclegacy._RF.push({}, "14a86ft1/z7mqTRhbJtO6Hh", "ComicFrames", undefined);
      var BaseComicFrames = {
        "player.idle.0": {
          "atlas": [870, 279, 95, 131],
          "anchor": [0.45263157894736844, 0.01526717557251911],
          "sourceSize": [95, 131],
          "size": [95, 131]
        },
        "player.idle.1": {
          "atlas": [1181, 279, 92, 128],
          "anchor": [0.45652173913043476, 0.0078125],
          "sourceSize": [92, 128],
          "size": [92, 128]
        },
        "player.idle.2": {
          "atlas": [973, 279, 95, 130],
          "anchor": [0.43157894736842106, 0.007692307692307665],
          "sourceSize": [95, 130],
          "size": [95, 130]
        },
        "player.idle.3": {
          "atlas": [1076, 279, 97, 130],
          "anchor": [0.4329896907216495, 0.0],
          "sourceSize": [97, 130],
          "size": [97, 130]
        },
        "player.run.0": {
          "atlas": [339, 437, 118, 122],
          "anchor": [0.5, 0.008196721311475419],
          "sourceSize": [118, 122],
          "size": [118, 122]
        },
        "player.run.1": {
          "atlas": [130, 437, 91, 123],
          "anchor": [0.45054945054945056, 0.016260162601625994],
          "sourceSize": [91, 123],
          "size": [91, 123]
        },
        "player.run.2": {
          "atlas": [1482, 279, 88, 126],
          "anchor": [0.42045454545454547, 0.023809523809523836],
          "sourceSize": [88, 126],
          "size": [88, 126]
        },
        "player.run.3": {
          "atlas": [1578, 279, 94, 125],
          "anchor": [0.5106382978723404, 0.016000000000000014],
          "sourceSize": [94, 125],
          "size": [94, 125]
        },
        "player.run.4": {
          "atlas": [1680, 279, 100, 124],
          "anchor": [0.52, 0.0],
          "sourceSize": [100, 124],
          "size": [100, 124]
        },
        "player.run.5": {
          "atlas": [706, 437, 90, 121],
          "anchor": [0.5111111111111111, 0.016528925619834656],
          "sourceSize": [90, 121],
          "size": [90, 121]
        },
        "player.run.6": {
          "atlas": [1788, 279, 83, 124],
          "anchor": [0.5060240963855421, 0.008064516129032251],
          "sourceSize": [83, 124],
          "size": [83, 124]
        },
        "player.run.7": {
          "atlas": [1273, 437, 87, 119],
          "anchor": [0.5517241379310345, -0.025210084033613356],
          "sourceSize": [87, 119],
          "size": [87, 119]
        },
        "player.run.8": {
          "atlas": [465, 437, 101, 122],
          "anchor": [0.6435643564356436, 0.0],
          "sourceSize": [101, 122],
          "size": [101, 122]
        },
        "player.jump.0": {
          "atlas": [660, 694, 113, 112],
          "anchor": [0.40707964601769914, 0.0267857142857143],
          "sourceSize": [113, 112],
          "size": [113, 112]
        },
        "player.jump.1": {
          "atlas": [4, 569, 113, 117],
          "anchor": [0.504424778761062, -0.21367521367521358],
          "sourceSize": [113, 117],
          "size": [113, 117]
        },
        "player.jump.2": {
          "atlas": [781, 694, 128, 109],
          "anchor": [0.546875, -0.17431192660550465],
          "sourceSize": [128, 109],
          "size": [128, 109]
        },
        "player.jump.3": {
          "atlas": [676, 569, 107, 116],
          "anchor": [0.4205607476635514, 0.025862068965517238],
          "sourceSize": [107, 116],
          "size": [107, 116]
        },
        "player.fall.0": {
          "atlas": [904, 1139, 129, 91],
          "anchor": [0.43410852713178294, -0.07692307692307687],
          "sourceSize": [129, 91],
          "size": [129, 91]
        },
        "player.fall.1": {
          "atlas": [1389, 1240, 130, 87],
          "anchor": [0.45384615384615384, -0.05747126436781613],
          "sourceSize": [130, 87],
          "size": [130, 87]
        },
        "player.crouch.0": {
          "atlas": [252, 927, 105, 99],
          "anchor": [0.45714285714285713, -0.010101010101010166],
          "sourceSize": [105, 99],
          "size": [105, 99]
        },
        "player.crouch.1": {
          "atlas": [923, 1240, 97, 88],
          "anchor": [0.4948453608247423, 0.0],
          "sourceSize": [97, 88],
          "size": [97, 88]
        },
        "player.crouch-walk.0": {
          "atlas": [365, 927, 109, 99],
          "anchor": [0.42201834862385323, 0.010101010101010055],
          "sourceSize": [109, 99],
          "size": [109, 99]
        },
        "player.crouch-walk.1": {
          "atlas": [273, 1035, 101, 95],
          "anchor": [0.3564356435643564, 0.0],
          "sourceSize": [101, 95],
          "size": [101, 95]
        },
        "player.crouch-walk.2": {
          "atlas": [1679, 927, 114, 96],
          "anchor": [0.4649122807017544, 0.0],
          "sourceSize": [114, 96],
          "size": [114, 96]
        },
        "player.crouch-walk.3": {
          "atlas": [1045, 927, 126, 97],
          "anchor": [0.4444444444444444, 0.010309278350515427],
          "sourceSize": [126, 97],
          "size": [126, 97]
        },
        "player.crouch-walk.4": {
          "atlas": [1302, 816, 123, 100],
          "anchor": [0.45528455284552843, 0.010000000000000009],
          "sourceSize": [123, 100],
          "size": [123, 100]
        },
        "player.crouch-walk.5": {
          "atlas": [1433, 816, 105, 100],
          "anchor": [0.34285714285714286, 0.010000000000000009],
          "sourceSize": [105, 100],
          "size": [105, 100]
        },
        "player.stand-shoot.0": {
          "atlas": [1614, 569, 109, 114],
          "anchor": [0.41284403669724773, 0.02631578947368418],
          "sourceSize": [109, 114],
          "size": [109, 114]
        },
        "player.stand-shoot.1": {
          "atlas": [791, 569, 109, 116],
          "anchor": [0.41284403669724773, 0.025862068965517238],
          "sourceSize": [109, 116],
          "size": [109, 116]
        },
        "player.stand-shoot.2": {
          "atlas": [125, 569, 109, 117],
          "anchor": [0.3853211009174312, 0.02564102564102566],
          "sourceSize": [109, 117],
          "size": [109, 117]
        },
        "player.stand-shoot.3": {
          "atlas": [1731, 569, 111, 114],
          "anchor": [0.3333333333333333, 0.01754385964912286],
          "sourceSize": [111, 114],
          "size": [111, 114]
        },
        "player.run-shoot.0": {
          "atlas": [1368, 437, 150, 119],
          "anchor": [0.48, 0.01680672268907568],
          "sourceSize": [150, 119],
          "size": [150, 119]
        },
        "player.run-shoot.1": {
          "atlas": [804, 437, 113, 121],
          "anchor": [0.2743362831858407, 0.016528925619834656],
          "sourceSize": [113, 121],
          "size": [113, 121]
        },
        "player.run-shoot.2": {
          "atlas": [925, 437, 113, 121],
          "anchor": [0.25663716814159293, 0.024793388429752095],
          "sourceSize": [113, 121],
          "size": [113, 121]
        },
        "player.run-shoot.3": {
          "atlas": [574, 437, 124, 122],
          "anchor": [0.3709677419354839, 0.016393442622950838],
          "sourceSize": [124, 122],
          "size": [124, 122]
        },
        "player.run-shoot.4": {
          "atlas": [1879, 279, 113, 124],
          "anchor": [0.4690265486725664, 0.024193548387096753],
          "sourceSize": [113, 124],
          "size": [113, 124]
        },
        "player.run-shoot.5": {
          "atlas": [229, 437, 102, 123],
          "anchor": [0.46078431372549017, 0.024390243902439046],
          "sourceSize": [102, 123],
          "size": [102, 123]
        },
        "player.run-shoot.6": {
          "atlas": [4, 437, 118, 124],
          "anchor": [0.4661016949152542, 0.024193548387096753],
          "sourceSize": [118, 124],
          "size": [118, 124]
        },
        "player.crouch-shoot.0": {
          "atlas": [522, 1240, 121, 89],
          "anchor": [0.36363636363636365, 0.0],
          "sourceSize": [121, 89],
          "size": [121, 89]
        },
        "player.crouch-shoot.1": {
          "atlas": [790, 1035, 121, 94],
          "anchor": [0.38016528925619836, 0.0],
          "sourceSize": [121, 94],
          "size": [121, 94]
        },
        "player.crouch-shoot.2": {
          "atlas": [1041, 1139, 106, 91],
          "anchor": [0.29245283018867924, 0.0],
          "sourceSize": [106, 91],
          "size": [106, 91]
        },
        "player.crouch-shoot.3": {
          "atlas": [337, 1139, 106, 92],
          "anchor": [0.3867924528301887, 0.0],
          "sourceSize": [106, 92],
          "size": [106, 92]
        },
        "player.throw.0": {
          "atlas": [210, 694, 122, 113],
          "anchor": [0.4426229508196721, 0.04424778761061943],
          "sourceSize": [122, 113],
          "size": [122, 113]
        },
        "player.throw.1": {
          "atlas": [1330, 569, 137, 115],
          "anchor": [0.45255474452554745, 0.034782608695652195],
          "sourceSize": [137, 115],
          "size": [137, 115]
        },
        "player.throw.2": {
          "atlas": [1801, 927, 128, 96],
          "anchor": [0.4453125, 0.05208333333333337],
          "sourceSize": [128, 96],
          "size": [128, 96]
        },
        "player.throw.3": {
          "atlas": [1179, 927, 146, 97],
          "anchor": [0.4794520547945205, 0.061855670103092786],
          "sourceSize": [146, 97],
          "size": [146, 97]
        },
        "player.throw.4": {
          "atlas": [382, 1035, 117, 95],
          "anchor": [0.47863247863247865, 0.06315789473684208],
          "sourceSize": [117, 95],
          "size": [117, 95]
        },
        "player.hit.0": {
          "atlas": [4, 816, 113, 103],
          "anchor": [0.48672566371681414, 0.03883495145631066],
          "sourceSize": [113, 103],
          "size": [113, 103]
        },
        "player.hit.1": {
          "atlas": [451, 1139, 123, 92],
          "anchor": [0.3983739837398374, 0.09782608695652173],
          "sourceSize": [123, 92],
          "size": [123, 92]
        },
        "player.hit.2": {
          "atlas": [651, 1240, 133, 89],
          "anchor": [0.40601503759398494, 0.0786516853932584],
          "sourceSize": [133, 89],
          "size": [133, 89]
        },
        "player.hit.3": {
          "atlas": [1656, 1035, 121, 93],
          "anchor": [0.2892561983471074, 0.09677419354838712],
          "sourceSize": [121, 93],
          "size": [121, 93]
        },
        "player.death.0": {
          "atlas": [4, 1429, 134, 65],
          "anchor": [0.4552238805970149, 0.07692307692307687],
          "sourceSize": [134, 65],
          "size": [134, 65]
        },
        "player.death.1": {
          "atlas": [146, 1429, 130, 63],
          "anchor": [0.43846153846153846, 0.07936507936507942],
          "sourceSize": [130, 63],
          "size": [130, 63]
        },
        "player.death.2": {
          "atlas": [1352, 1429, 133, 48],
          "anchor": [0.44360902255639095, 0.10416666666666663],
          "sourceSize": [133, 48],
          "size": [133, 48]
        },
        "player.death.3": {
          "atlas": [976, 1429, 147, 49],
          "anchor": [0.47619047619047616, 0.10204081632653061],
          "sourceSize": [147, 49],
          "size": [147, 49]
        },
        "player.death.4": {
          "atlas": [1701, 1429, 160, 46],
          "anchor": [0.4625, 0.10869565217391308],
          "sourceSize": [160, 46],
          "size": [160, 46]
        },
        "player.death.5": {
          "atlas": [1131, 1429, 124, 49],
          "anchor": [0.5241935483870968, 0.10204081632653061],
          "sourceSize": [124, 49],
          "size": [124, 49]
        },
        "rifle.idle.0": {
          "atlas": [919, 1035, 66, 94],
          "anchor": [0.49242424242424243, -0.010638297872340496],
          "sourceSize": [66, 94],
          "size": [66, 94]
        },
        "rifle.idle.1": {
          "atlas": [993, 1035, 72, 94],
          "anchor": [0.5138888888888888, 0.0],
          "sourceSize": [72, 94],
          "size": [72, 94]
        },
        "rifle.walk.0": {
          "atlas": [1073, 1035, 58, 94],
          "anchor": [0.5, -0.010638297872340496],
          "sourceSize": [58, 94],
          "size": [58, 94]
        },
        "rifle.walk.1": {
          "atlas": [1139, 1035, 54, 94],
          "anchor": [0.46296296296296297, -0.010638297872340496],
          "sourceSize": [54, 94],
          "size": [54, 94]
        },
        "rifle.walk.2": {
          "atlas": [1201, 1035, 52, 94],
          "anchor": [0.5576923076923077, -0.010638297872340496],
          "sourceSize": [52, 94],
          "size": [52, 94]
        },
        "rifle.walk.3": {
          "atlas": [1785, 1035, 71, 93],
          "anchor": [0.4647887323943662, -0.010752688172043001],
          "sourceSize": [71, 93],
          "size": [71, 93]
        },
        "rifle.shoot.0": {
          "atlas": [582, 1139, 74, 92],
          "anchor": [0.3918918918918919, 0.0],
          "sourceSize": [74, 92],
          "size": [74, 92]
        },
        "rifle.shoot.1": {
          "atlas": [664, 1139, 77, 92],
          "anchor": [0.38961038961038963, 0.0],
          "sourceSize": [77, 92],
          "size": [77, 92]
        },
        "rifle.shoot.2": {
          "atlas": [749, 1139, 82, 92],
          "anchor": [0.4146341463414634, 0.0],
          "sourceSize": [82, 92],
          "size": [82, 92]
        },
        "rifle.shoot.3": {
          "atlas": [1864, 1035, 105, 93],
          "anchor": [0.34285714285714286, 0.0],
          "sourceSize": [105, 93],
          "size": [105, 93]
        },
        "rifle.hit.0": {
          "atlas": [1527, 1240, 66, 87],
          "anchor": [0.4621212121212121, 0.0],
          "sourceSize": [66, 87],
          "size": [66, 87]
        },
        "rifle.hit.1": {
          "atlas": [839, 1139, 57, 92],
          "anchor": [0.5087719298245614, 0.0],
          "sourceSize": [57, 92],
          "size": [57, 92]
        },
        "rifle.hit.2": {
          "atlas": [1937, 927, 70, 96],
          "anchor": [0.5785714285714286, 0.0],
          "sourceSize": [70, 96],
          "size": [70, 96]
        },
        "rifle.dead.0": {
          "atlas": [346, 1338, 73, 79],
          "anchor": [0.4452054794520548, 0.012658227848101222],
          "sourceSize": [73, 79],
          "size": [73, 79]
        },
        "rifle.dead.1": {
          "atlas": [284, 1429, 79, 62],
          "anchor": [0.5253164556962026, 0.0],
          "sourceSize": [79, 62],
          "size": [79, 62]
        },
        "rifle.dead.2": {
          "atlas": [738, 1429, 76, 51],
          "anchor": [0.5263157894736842, -0.03921568627450989],
          "sourceSize": [76, 51],
          "size": [76, 51]
        },
        "rifle.dead.3": {
          "atlas": [220, 1502, 100, 41],
          "anchor": [0.57, -0.07317073170731714],
          "sourceSize": [100, 41],
          "size": [100, 41]
        },
        "knife.walk.0": {
          "atlas": [507, 1035, 80, 95],
          "anchor": [0.39375, -0.010526315789473717],
          "sourceSize": [80, 95],
          "size": [80, 95]
        },
        "knife.walk.1": {
          "atlas": [4, 1035, 85, 96],
          "anchor": [0.4588235294117647, -0.01041666666666674],
          "sourceSize": [85, 96],
          "size": [85, 96]
        },
        "knife.walk.2": {
          "atlas": [1261, 1035, 84, 94],
          "anchor": [0.5476190476190477, 0.0],
          "sourceSize": [84, 94],
          "size": [84, 94]
        },
        "knife.walk.3": {
          "atlas": [97, 1035, 93, 96],
          "anchor": [0.5698924731182796, -0.01041666666666674],
          "sourceSize": [93, 96],
          "size": [93, 96]
        },
        "knife.attack.0": {
          "atlas": [1353, 1035, 97, 94],
          "anchor": [0.42783505154639173, 0.03191489361702127],
          "sourceSize": [97, 94],
          "size": [97, 94]
        },
        "knife.attack.1": {
          "atlas": [595, 1035, 98, 95],
          "anchor": [0.5306122448979592, 0.03157894736842104],
          "sourceSize": [98, 95],
          "size": [98, 95]
        },
        "knife.attack.2": {
          "atlas": [1777, 1240, 98, 84],
          "anchor": [0.5459183673469388, 0.0357142857142857],
          "sourceSize": [98, 84],
          "size": [98, 84]
        },
        "knife.attack.3": {
          "atlas": [1546, 816, 86, 100],
          "anchor": [0.5232558139534884, 0.030000000000000027],
          "sourceSize": [86, 100],
          "size": [86, 100]
        },
        "knife.hit.0": {
          "atlas": [125, 816, 77, 103],
          "anchor": [0.38961038961038963, 0.029126213592232997],
          "sourceSize": [77, 103],
          "size": [77, 103]
        },
        "knife.hit.1": {
          "atlas": [1601, 1240, 76, 87],
          "anchor": [0.4473684210526316, 0.02298850574712641],
          "sourceSize": [76, 87],
          "size": [76, 87]
        },
        "knife.hit.2": {
          "atlas": [198, 1035, 67, 96],
          "anchor": [0.4253731343283582, 0.03125],
          "sourceSize": [67, 96],
          "size": [67, 96]
        },
        "knife.dead.0": {
          "atlas": [4, 1139, 77, 93],
          "anchor": [0.4090909090909091, 0.032258064516129004],
          "sourceSize": [77, 93],
          "size": [77, 93]
        },
        "knife.dead.1": {
          "atlas": [1847, 1338, 89, 68],
          "anchor": [0.48314606741573035, 0.11764705882352944],
          "sourceSize": [89, 68],
          "size": [89, 68]
        },
        "knife.dead.2": {
          "atlas": [1263, 1429, 81, 49],
          "anchor": [0.5432098765432098, 0.061224489795918324],
          "sourceSize": [81, 49],
          "size": [81, 49]
        },
        "knife.dead.3": {
          "atlas": [328, 1502, 101, 40],
          "anchor": [0.5495049504950495, 0.050000000000000044],
          "sourceSize": [101, 40],
          "size": [101, 40]
        },
        "shield.walk.0": {
          "atlas": [482, 927, 70, 99],
          "anchor": [0.4357142857142857, 0.010101010101010055],
          "sourceSize": [70, 99],
          "size": [70, 99]
        },
        "shield.walk.1": {
          "atlas": [560, 927, 67, 99],
          "anchor": [0.4626865671641791, 0.010101010101010055],
          "sourceSize": [67, 99],
          "size": [67, 99]
        },
        "shield.walk.2": {
          "atlas": [1640, 816, 66, 100],
          "anchor": [0.5151515151515151, 0.010000000000000009],
          "sourceSize": [66, 100],
          "size": [66, 100]
        },
        "shield.walk.3": {
          "atlas": [635, 927, 60, 99],
          "anchor": [0.6083333333333333, 0.010101010101010055],
          "sourceSize": [60, 99],
          "size": [60, 99]
        },
        "shield.brace.0": {
          "atlas": [1028, 1240, 77, 88],
          "anchor": [0.5714285714285714, 0.022727272727272707],
          "sourceSize": [77, 88],
          "size": [77, 88]
        },
        "shield.brace.1": {
          "atlas": [1113, 1240, 85, 88],
          "anchor": [0.5882352941176471, 0.022727272727272707],
          "sourceSize": [85, 88],
          "size": [85, 88]
        },
        "shield.shoot.0": {
          "atlas": [756, 816, 105, 101],
          "anchor": [0.45714285714285713, 0.02970297029702973],
          "sourceSize": [105, 101],
          "size": [105, 101]
        },
        "shield.shoot.1": {
          "atlas": [869, 816, 99, 101],
          "anchor": [0.5303030303030303, 0.02970297029702973],
          "sourceSize": [99, 101],
          "size": [99, 101]
        },
        "shield.shoot.2": {
          "atlas": [468, 816, 81, 102],
          "anchor": [0.5555555555555556, 0.039215686274509776],
          "sourceSize": [81, 102],
          "size": [81, 102]
        },
        "shield.hit.0": {
          "atlas": [976, 816, 70, 101],
          "anchor": [0.5428571428571428, 0.03960396039603964],
          "sourceSize": [70, 101],
          "size": [70, 101]
        },
        "shield.hit.1": {
          "atlas": [1714, 816, 81, 100],
          "anchor": [0.6975308641975309, 0.030000000000000027],
          "sourceSize": [81, 100],
          "size": [81, 100]
        },
        "shield.hit.2": {
          "atlas": [1333, 927, 76, 97],
          "anchor": [0.6644736842105263, 0.04123711340206182],
          "sourceSize": [76, 97],
          "size": [76, 97]
        },
        "shield.dead.0": {
          "atlas": [701, 1035, 81, 95],
          "anchor": [0.4506172839506173, 0.0736842105263158],
          "sourceSize": [81, 95],
          "size": [81, 95]
        },
        "shield.dead.1": {
          "atlas": [242, 1338, 96, 82],
          "anchor": [0.484375, 0.08536585365853655],
          "sourceSize": [96, 82],
          "size": [96, 82]
        },
        "shield.dead.2": {
          "atlas": [822, 1429, 87, 50],
          "anchor": [0.5402298850574713, 0.14],
          "sourceSize": [87, 50],
          "size": [87, 50]
        },
        "shield.dead.3": {
          "atlas": [1869, 1429, 97, 45],
          "anchor": [0.5515463917525774, 0.1333333333333333],
          "sourceSize": [97, 45],
          "size": [97, 45]
        },
        "rocket.idle.0": {
          "atlas": [1417, 927, 71, 97],
          "anchor": [0.4788732394366197, 0.0],
          "sourceSize": [71, 97],
          "size": [71, 97]
        },
        "rocket.idle.1": {
          "atlas": [703, 927, 74, 98],
          "anchor": [0.6013513513513513, 0.010204081632653073],
          "sourceSize": [74, 98],
          "size": [74, 98]
        },
        "rocket.aim.0": {
          "atlas": [785, 927, 86, 98],
          "anchor": [0.48255813953488375, 0.010204081632653073],
          "sourceSize": [86, 98],
          "size": [86, 98]
        },
        "rocket.aim.1": {
          "atlas": [879, 927, 83, 98],
          "anchor": [0.5963855421686747, 0.010204081632653073],
          "sourceSize": [83, 98],
          "size": [83, 98]
        },
        "rocket.fire.0": {
          "atlas": [1496, 927, 86, 97],
          "anchor": [0.4418604651162791, 0.010309278350515427],
          "sourceSize": [86, 97],
          "size": [86, 97]
        },
        "rocket.fire.1": {
          "atlas": [917, 694, 139, 107],
          "anchor": [0.31654676258992803, 0.01869158878504673],
          "sourceSize": [139, 107],
          "size": [139, 107]
        },
        "rocket.fire.2": {
          "atlas": [970, 927, 67, 98],
          "anchor": [0.6268656716417911, 0.020408163265306145],
          "sourceSize": [67, 98],
          "size": [67, 98]
        },
        "rocket.hit.0": {
          "atlas": [1458, 1035, 71, 94],
          "anchor": [0.4788732394366197, 0.03191489361702127],
          "sourceSize": [71, 94],
          "size": [71, 94]
        },
        "rocket.hit.1": {
          "atlas": [1206, 1240, 73, 88],
          "anchor": [0.5205479452054794, 0.045454545454545414],
          "sourceSize": [73, 88],
          "size": [73, 88]
        },
        "rocket.hit.2": {
          "atlas": [1685, 1240, 84, 86],
          "anchor": [0.47619047619047616, 0.03488372093023251],
          "sourceSize": [84, 86],
          "size": [84, 86]
        },
        "rocket.dead.0": {
          "atlas": [923, 1338, 76, 73],
          "anchor": [0.3881578947368421, -0.09589041095890405],
          "sourceSize": [76, 73],
          "size": [76, 73]
        },
        "rocket.dead.1": {
          "atlas": [1259, 1338, 84, 70],
          "anchor": [0.5238095238095238, -0.3142857142857143],
          "sourceSize": [84, 70],
          "size": [84, 70]
        },
        "rocket.dead.2": {
          "atlas": [127, 1502, 85, 43],
          "anchor": [0.7529411764705882, 0.06976744186046513],
          "sourceSize": [85, 43],
          "size": [85, 43]
        },
        "rocket.dead.3": {
          "atlas": [610, 1429, 120, 54],
          "anchor": [0.65, 0.20370370370370372],
          "sourceSize": [120, 54],
          "size": [120, 54]
        },
        "tank.idle": {
          "atlas": [908, 569, 175, 116],
          "anchor": [0.49142857142857144, -0.01724137931034475],
          "sourceSize": [175, 116],
          "size": [175, 116]
        },
        "tank.fire": {
          "atlas": [1091, 569, 231, 116],
          "anchor": [0.35064935064935066, -0.01724137931034475],
          "sourceSize": [231, 116],
          "size": [231, 116]
        },
        "tank.damaged": {
          "atlas": [1850, 569, 167, 114],
          "anchor": [0.49700598802395207, -0.01754385964912286],
          "sourceSize": [167, 114],
          "size": [167, 114]
        },
        "tank.heavy": {
          "atlas": [340, 694, 177, 113],
          "anchor": [0.4576271186440678, -0.03539823008849563],
          "sourceSize": [177, 113],
          "size": [177, 113]
        },
        "tank.wreck": {
          "atlas": [1403, 1139, 162, 90],
          "anchor": [0.4876543209876543, -0.04444444444444451],
          "sourceSize": [162, 90],
          "size": [162, 90]
        },
        "tank.explode.0": {
          "atlas": [1537, 1035, 111, 94],
          "anchor": [0.43243243243243246, -0.05319148936170204],
          "sourceSize": [111, 94],
          "size": [111, 94]
        },
        "tank.explode.1": {
          "atlas": [1287, 1240, 94, 88],
          "anchor": [0.44148936170212766, -0.05681818181818188],
          "sourceSize": [94, 88],
          "size": [94, 88]
        },
        "tank.explode.2": {
          "atlas": [1488, 694, 108, 105],
          "anchor": [0.4351851851851852, -0.04761904761904767],
          "sourceSize": [108, 105],
          "size": [108, 105]
        },
        "tank.explode.3": {
          "atlas": [371, 1429, 48, 58],
          "anchor": [0.6979166666666666, -0.6379310344827587],
          "sourceSize": [48, 58],
          "size": [48, 58]
        },
        "weapon.rifle": {
          "atlas": [89, 1139, 240, 93],
          "anchor": [0.5, 0.5],
          "sourceSize": [262, 101],
          "size": [240, 93]
        },
        "weapon.shotgun": {
          "atlas": [427, 1338, 240, 76],
          "anchor": [0.5, 0.5],
          "sourceSize": [240, 76],
          "size": [240, 76]
        },
        "weapon.rocket": {
          "atlas": [675, 1338, 240, 75],
          "anchor": [0.5, 0.5],
          "sourceSize": [296, 93],
          "size": [240, 75]
        },
        "projectile.grenade": {
          "atlas": [557, 816, 73, 102],
          "anchor": [0.5, 0.5],
          "sourceSize": [73, 102],
          "size": [73, 102]
        },
        "pickup.grenades": {
          "atlas": [210, 816, 125, 103],
          "anchor": [0.5, 0.5],
          "sourceSize": [125, 103],
          "size": [125, 103]
        },
        "pickup.health": {
          "atlas": [1852, 694, 122, 104],
          "anchor": [0.5, 0.5],
          "sourceSize": [122, 104],
          "size": [122, 104]
        },
        "effect.muzzle": {
          "atlas": [540, 1429, 62, 55],
          "anchor": [0.5, 0.5],
          "sourceSize": [62, 55],
          "size": [62, 55]
        },
        "effect.muzzle-large": {
          "atlas": [1803, 816, 146, 100],
          "anchor": [0.5, 0.5],
          "sourceSize": [146, 100],
          "size": [146, 100]
        },
        "effect.smoke": {
          "atlas": [792, 1240, 123, 89],
          "anchor": [0.5, 0.5],
          "sourceSize": [123, 89],
          "size": [123, 89]
        },
        "projectile.bullet": {
          "atlas": [636, 1502, 142, 31],
          "anchor": [0.5, 0.5],
          "sourceSize": [142, 31],
          "size": [142, 31]
        },
        "projectile.pellet": {
          "atlas": [786, 1502, 53, 19],
          "anchor": [0.5, 0.5],
          "sourceSize": [53, 19],
          "size": [53, 19]
        },
        "projectile.rocket": {
          "atlas": [1493, 1429, 200, 47],
          "anchor": [0.5, 0.5],
          "sourceSize": [200, 47],
          "size": [200, 47]
        },
        "effect.impact": {
          "atlas": [1868, 437, 164, 118],
          "anchor": [0.5, 0.5],
          "sourceSize": [164, 118],
          "size": [164, 118]
        },
        "effect.metal": {
          "atlas": [638, 816, 110, 102],
          "anchor": [0.5, 0.5],
          "sourceSize": [110, 102],
          "size": [110, 102]
        },
        "effect.wood": {
          "atlas": [1312, 694, 168, 106],
          "anchor": [0.5, 0.5],
          "sourceSize": [168, 106],
          "size": [168, 106]
        },
        "effect.explosion": {
          "atlas": [340, 4, 289, 233],
          "anchor": [0.5, 0.5],
          "sourceSize": [289, 233],
          "size": [289, 233]
        },
        "effect.trail": {
          "atlas": [4, 1338, 230, 83],
          "anchor": [0.5, 0.5],
          "sourceSize": [230, 83],
          "size": [230, 83]
        },
        "effect.dust": {
          "atlas": [427, 1429, 105, 58],
          "anchor": [0.5, 0.5],
          "sourceSize": [105, 58],
          "size": [105, 58]
        },
        "explosion.0": {
          "atlas": [917, 1429, 51, 50],
          "anchor": [0.5490196078431373, -0.21999999999999997],
          "sourceSize": [51, 50],
          "size": [51, 50]
        },
        "explosion.1": {
          "atlas": [1590, 927, 81, 97],
          "anchor": [0.4382716049382716, -0.030927835051546282],
          "sourceSize": [81, 97],
          "size": [81, 97]
        },
        "explosion.2": {
          "atlas": [343, 816, 117, 103],
          "anchor": [0.41025641025641024, -0.07766990291262132],
          "sourceSize": [117, 103],
          "size": [117, 103]
        },
        "explosion.3": {
          "atlas": [1475, 569, 131, 115],
          "anchor": [0.48854961832061067, -0.05217391304347818],
          "sourceSize": [131, 115],
          "size": [131, 115]
        },
        "explosion.4": {
          "atlas": [1115, 4, 169, 193],
          "anchor": [0.48520710059171596, -0.02590673575129543],
          "sourceSize": [169, 193],
          "size": [169, 193]
        },
        "explosion.5": {
          "atlas": [637, 4, 289, 233],
          "anchor": [0.5380622837370242, -0.012875536480686733],
          "sourceSize": [289, 233],
          "size": [289, 233]
        },
        "explosion.6": {
          "atlas": [4, 4, 328, 267],
          "anchor": [0.5274390243902439, -0.022471910112359605],
          "sourceSize": [328, 267],
          "size": [328, 267]
        },
        "ground.flat-a": {
          "atlas": [1526, 437, 187, 119],
          "anchor": [0.5, 0.5],
          "sourceSize": [187, 119],
          "size": [187, 119]
        },
        "ground.flat-b": {
          "atlas": [1155, 1139, 240, 91],
          "anchor": [0.5, 0.5],
          "sourceSize": [312, 118],
          "size": [240, 91]
        },
        "ground.small": {
          "atlas": [525, 694, 127, 113],
          "anchor": [0.5, 0.5],
          "sourceSize": [127, 113],
          "size": [127, 113]
        },
        "ground.slope": {
          "atlas": [242, 569, 240, 117],
          "anchor": [0.5, 0.5],
          "sourceSize": [310, 151],
          "size": [240, 117]
        },
        "platform.stone": {
          "atlas": [4, 694, 198, 114],
          "anchor": [0.5, 0.5],
          "sourceSize": [198, 114],
          "size": [198, 114]
        },
        "platform.short": {
          "atlas": [1599, 1338, 240, 69],
          "anchor": [0.5, 0.5],
          "sourceSize": [247, 71],
          "size": [240, 69]
        },
        "platform.metal": {
          "atlas": [1351, 1338, 240, 70],
          "anchor": [0.5, 0.5],
          "sourceSize": [243, 71],
          "size": [240, 70]
        },
        "platform.wood": {
          "atlas": [4, 927, 240, 100],
          "anchor": [0.5, 0.5],
          "sourceSize": [248, 103],
          "size": [240, 100]
        },
        "crate.intact": {
          "atlas": [1721, 437, 139, 119],
          "anchor": [0.5, 0.5],
          "sourceSize": [139, 119],
          "size": [139, 119]
        },
        "crate.broken": {
          "atlas": [490, 569, 178, 117],
          "anchor": [0.5, 0.5],
          "sourceSize": [178, 117],
          "size": [178, 117]
        },
        "crate.debris": {
          "atlas": [1046, 437, 219, 121],
          "anchor": [0.5, 0.5],
          "sourceSize": [219, 121],
          "size": [219, 121]
        },
        "barrel.intact": {
          "atlas": [772, 279, 90, 138],
          "anchor": [0.5, 0.5],
          "sourceSize": [90, 138],
          "size": [90, 138]
        },
        "barrel.dented": {
          "atlas": [352, 279, 164, 141],
          "anchor": [0.5, 0.5],
          "sourceSize": [164, 141],
          "size": [164, 141]
        },
        "barrel.broken": {
          "atlas": [1640, 4, 240, 158],
          "anchor": [0.5, 0.5],
          "sourceSize": [264, 174],
          "size": [240, 158]
        },
        "cover.sandbags": {
          "atlas": [1064, 694, 240, 107],
          "anchor": [0.5, 0.5],
          "sourceSize": [269, 120],
          "size": [240, 107]
        },
        "cover.concrete": {
          "atlas": [1054, 816, 240, 101],
          "anchor": [0.5, 0.5],
          "sourceSize": [256, 108],
          "size": [240, 101]
        },
        "prop.sign": {
          "atlas": [524, 279, 240, 139],
          "anchor": [0.5, 0.5],
          "sourceSize": [246, 142],
          "size": [240, 139]
        },
        "prop.warning": {
          "atlas": [1281, 279, 193, 127],
          "anchor": [0.5, 0.5],
          "sourceSize": [193, 127],
          "size": [193, 127]
        },
        "prop.rocks": {
          "atlas": [4, 1502, 115, 44],
          "anchor": [0.5, 0.5],
          "sourceSize": [115, 44],
          "size": [115, 44]
        },
        "building.base": {
          "atlas": [1292, 4, 340, 179],
          "anchor": [0.5, 0.5],
          "sourceSize": [403, 212],
          "size": [340, 179]
        },
        "prop.tent": {
          "atlas": [1604, 694, 240, 105],
          "anchor": [0.5, 0.5],
          "sourceSize": [377, 165],
          "size": [240, 105]
        },
        "prop.tower": {
          "atlas": [934, 4, 173, 207],
          "anchor": [0.5, 0.5],
          "sourceSize": [173, 207],
          "size": [173, 207]
        },
        "building.barracks": {
          "atlas": [4, 279, 340, 150],
          "anchor": [0.5, 0.5],
          "sourceSize": [455, 201],
          "size": [340, 150]
        },
        "background.cloud": {
          "atlas": [1007, 1338, 244, 71],
          "anchor": [0.5, 0.5],
          "sourceSize": [244, 71],
          "size": [244, 71]
        },
        "background.cloud-small": {
          "atlas": [437, 1502, 191, 37],
          "anchor": [0.5, 0.5],
          "sourceSize": [191, 37],
          "size": [191, 37]
        },
        "background.mountains": {
          "atlas": [4, 1240, 510, 90],
          "anchor": [0.5, 0.5],
          "sourceSize": [510, 90],
          "size": [510, 90]
        },
        "crate.worn": {
          "atlas": [490, 569, 178, 117],
          "anchor": [0.5, 0.5],
          "sourceSize": [178, 117],
          "size": [178, 117]
        },
        "barrel.worn": {
          "atlas": [352, 279, 164, 141],
          "anchor": [0.5, 0.5],
          "sourceSize": [164, 141],
          "size": [164, 141]
        },
        "barrel.wreck": {
          "atlas": [1640, 4, 240, 158],
          "anchor": [0.5, 0.5],
          "sourceSize": [264, 174],
          "size": [240, 158]
        },
        "cover.sandbags-broken": {
          "atlas": [1064, 694, 240, 107],
          "anchor": [0.5, 0.5],
          "sourceSize": [269, 120],
          "size": [240, 107]
        },
        "cover.concrete-broken": {
          "atlas": [1054, 816, 240, 101],
          "anchor": [0.5, 0.5],
          "sourceSize": [256, 108],
          "size": [240, 101]
        },
        "platform.scaffold": {
          "atlas": [1351, 1338, 240, 70],
          "anchor": [0.5, 0.5],
          "sourceSize": [243, 71],
          "size": [240, 70]
        },
        "building.bunker": {
          "atlas": [1292, 4, 340, 179],
          "anchor": [0.5, 0.5],
          "sourceSize": [403, 212],
          "size": [340, 179]
        },
        "prop.flag": {
          "atlas": [1281, 279, 193, 127],
          "anchor": [0.5, 0.5],
          "sourceSize": [193, 127],
          "size": [193, 127]
        },
        "prop.rock": {
          "atlas": [4, 1502, 115, 44],
          "anchor": [0.5, 0.5],
          "sourceSize": [115, 44],
          "size": [115, 44]
        },
        "prop.scrub": {
          "atlas": [4, 1502, 115, 44],
          "anchor": [0.5, 0.5],
          "sourceSize": [115, 44],
          "size": [115, 44]
        }
      };
      var ComicFrames = exports('ComicFrames', _objectSpread2(_objectSpread2(_objectSpread2({}, BaseComicFrames), SupplementFrames), DirectFrames));
      var ComicClips = exports('ComicClips', {
        "player.idle": ["player.idle.0", "player.idle.1", "player.idle.2", "player.idle.3"],
        "player.run": ["player.run.0", "player.run.1", "player.run.2", "player.run.3", "player.run.4", "player.run.5", "player.run.6", "player.run.7", "player.run.8"],
        "player.jump": ["player.jump.0", "player.jump.1", "player.jump.2", "player.jump.3"],
        "player.fall": ["player.fall.0", "player.fall.1"],
        "player.crouch": ["player.crouch.0", "player.crouch.1"],
        "player.crouch-walk": ["player.crouch-walk.0", "player.crouch-walk.1", "player.crouch-walk.2", "player.crouch-walk.3", "player.crouch-walk.4", "player.crouch-walk.5"],
        "player.stand-shoot": ["player.stand-shoot.0", "player.stand-shoot.1", "player.stand-shoot.2", "player.stand-shoot.3"],
        "player.run-shoot": ["player.run-shoot.0", "player.run-shoot.1", "player.run-shoot.2", "player.run-shoot.3", "player.run-shoot.4", "player.run-shoot.5", "player.run-shoot.6"],
        "player.crouch-shoot": ["player.crouch-shoot.0", "player.crouch-shoot.1", "player.crouch-shoot.2", "player.crouch-shoot.3"],
        "player.throw": ["player.throw.0", "player.throw.1", "player.throw.2", "player.throw.3", "player.throw.4"],
        "player.hit": ["player.hit.0", "player.hit.1", "player.hit.2", "player.hit.3"],
        "player.death": ["player.death.0", "player.death.1", "player.death.2", "player.death.3", "player.death.4", "player.death.5"],
        "rifle.idle": ["rifle.idle.0", "rifle.idle.1"],
        "rifle.walk": ["rifle.walk.0", "rifle.walk.1", "rifle.walk.2", "rifle.walk.3"],
        "rifle.shoot": ["rifle.shoot.0", "rifle.shoot.1", "rifle.shoot.2", "rifle.shoot.3"],
        "rifle.hit": ["rifle.hit.0", "rifle.hit.1", "rifle.hit.2"],
        "rifle.dead": ["rifle.dead.0", "rifle.dead.1", "rifle.dead.2", "rifle.dead.3"],
        "knife.walk": ["knife.walk.0", "knife.walk.1", "knife.walk.2", "knife.walk.3"],
        "knife.attack": ["knife.attack.0", "knife.attack.1", "knife.attack.2", "knife.attack.3"],
        "knife.hit": ["knife.hit.0", "knife.hit.1", "knife.hit.2"],
        "knife.dead": ["knife.dead.0", "knife.dead.1", "knife.dead.2", "knife.dead.3"],
        "shield.walk": ["shield.walk.0", "shield.walk.1", "shield.walk.2", "shield.walk.3"],
        "shield.brace": ["shield.brace.0", "shield.brace.1"],
        "shield.shoot": ["shield.shoot.0", "shield.shoot.1", "shield.shoot.2"],
        "shield.hit": ["shield.hit.0", "shield.hit.1", "shield.hit.2"],
        "shield.dead": ["shield.dead.0", "shield.dead.1", "shield.dead.2", "shield.dead.3"],
        "rocket.idle": ["rocket.idle.0", "rocket.idle.1"],
        "rocket.aim": ["rocket.aim.0", "rocket.aim.1"],
        "rocket.fire": ["rocket.fire.0", "rocket.fire.1", "rocket.fire.2"],
        "rocket.hit": ["rocket.hit.0", "rocket.hit.1", "rocket.hit.2"],
        "rocket.dead": ["rocket.dead.0", "rocket.dead.1", "rocket.dead.2", "rocket.dead.3"],
        "tank.explode": ["tank.explode.0", "tank.explode.1", "tank.explode.2", "tank.explode.3"],
        "explosion": ["explosion.0", "explosion.1", "explosion.2", "explosion.3", "explosion.4", "explosion.5", "explosion.6"]
      });
      var ComicSockets = exports('ComicSockets', {
        "player.idle.0": [32.0, 28.8],
        "player.idle.1": [31.36, 29.44],
        "player.idle.2": [32.64, 29.44],
        "player.idle.3": [34.56, 29.44],
        "player.run.0": [33.92, 30.72],
        "player.run.1": [28.8, 28.8],
        "player.run.2": [28.8, 29.44],
        "player.run.3": [26.88, 28.16],
        "player.run.4": [29.44, 28.16],
        "player.run.5": [30.08, 28.16],
        "player.run.6": [29.44, 27.52],
        "player.run.7": [28.16, 28.16],
        "player.run.8": [23.04, 27.52],
        "player.jump.0": [45.44, 32.0],
        "player.jump.1": [35.84, 37.12],
        "player.jump.2": [39.04, 39.68],
        "player.jump.3": [44.8, 24.96],
        "player.fall.0": [32.64, 51.2],
        "player.fall.1": [42.88, 30.08],
        "player.crouch.0": [32.64, 24.32],
        "player.crouch.1": [30.72, 21.12],
        "player.crouch-walk.0": [35.84, 24.96],
        "player.crouch-walk.1": [40.32, 24.96],
        "player.crouch-walk.2": [42.24, 23.68],
        "player.crouch-walk.3": [40.32, 25.6],
        "player.crouch-walk.4": [42.88, 24.96],
        "player.crouch-walk.5": [43.52, 24.96],
        "player.stand-shoot.0": [37.76, 42.24],
        "player.stand-shoot.1": [39.04, 42.24],
        "player.stand-shoot.2": [40.96, 41.6],
        "player.stand-shoot.3": [43.52, 41.6],
        "player.run-shoot.0": [47.36, 48.64],
        "player.run-shoot.1": [49.92, 48.0],
        "player.run-shoot.2": [43.52, 48.64],
        "player.run-shoot.3": [40.32, 48.0],
        "player.run-shoot.4": [35.84, 49.28],
        "player.run-shoot.5": [30.08, 48.64],
        "player.run-shoot.6": [39.04, 48.0],
        "player.crouch-shoot.0": [49.28, 28.16],
        "player.crouch-shoot.1": [46.72, 29.44],
        "player.crouch-shoot.2": [47.36, 28.8],
        "player.crouch-shoot.3": [32.0, 27.52]
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicLevelRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ComicAssets.ts', './Ink.ts', './TerrainTiles.ts', './TerrainSurface.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _toConsumableArray, _createForOfIteratorHelper, cclegacy, ComicBatch, node, Ink, colors, terrainTiles, metalTiles, terrainSurface;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _toConsumableArray = module.toConsumableArray;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ComicBatch = module.ComicBatch;
    }, function (module) {
      node = module.node;
      Ink = module.Ink;
      colors = module.colors;
    }, function (module) {
      terrainTiles = module.terrainTiles;
      metalTiles = module.metalTiles;
    }, function (module) {
      terrainSurface = module.terrainSurface;
    }],
    execute: function () {
      cclegacy._RF.push({}, "f8fec4GioQfePSaZCx0A8+B", "ComicLevelRenderer", undefined);

      /** Independent parallax art, physical surface data stays in LevelController. */
      var ComicLevelRenderer = exports('ComicLevelRenderer', /*#__PURE__*/function () {
        function ComicLevelRenderer(parent, level) {
          _classCallCheck(this, ComicLevelRenderer);
          _defineProperty(this, "chunks", []);
          _defineProperty(this, "gate", void 0);
          _defineProperty(this, "surfaceFill", void 0);
          _defineProperty(this, "visibleChunks", 0);
          this.level = level;
          // Plan against full solids, independent of culling chunks. Chunk boundaries
          // must not introduce a fresh cap or squeeze the remaining source pixels.
          var roads = terrainSurface(level.staticSolids);
          var base = Math.min.apply(Math, _toConsumableArray(roads.map(function (s) {
            return s.top;
          }))) - 72;
          var tiles = roads.flatMap(function (s, i) {
            var _roads;
            return terrainTiles(s.x, s.top, s.w, s.top - base, {
              left: i > 0 && roads[i - 1].x + roads[i - 1].w === s.x ? roads[i - 1].top : undefined,
              right: ((_roads = roads[i + 1]) === null || _roads === void 0 ? void 0 : _roads.x) === s.x + s.w ? roads[i + 1].top : undefined
            });
          });
          var _iterator = _createForOfIteratorHelper(level.staticSolids),
            _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var _s = _step.value;
              if (_s.kind === "platform") tiles.push.apply(tiles, _toConsumableArray(metalTiles(_s.x, _s.y + _s.h, _s.w)));
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
          for (var _i = 0, _arr = [0.12, 0.38, 0.72, 1]; _i < _arr.length; _i++) {
            var factor = _arr[_i];
            if (factor === 1) {
              // All opaque fill sits behind ALL foreground chunks. A tile crossing
              // x=800 must not be erased by the following chunk's white polygon.
              this.surfaceFill = node(parent, "Continuous ground fill");
              var fill = new Ink(this.surfaceFill),
                top = [];
              var _iterator2 = _createForOfIteratorHelper(roads),
                _step2;
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  var s = _step2.value;
                  top.push({
                    x: s.x,
                    y: s.top - 16
                  }, {
                    x: s.x + s.w,
                    y: s.top - 16
                  });
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              fill.polygon([{
                x: 0,
                y: -100
              }].concat(top, [{
                x: level.data.width,
                y: -100
              }]), colors.paper);
            }
            for (var x = -800; x < level.data.width + 1600; x += 800) {
              var root = node(parent, "Comic scenery ".concat(factor, "/").concat(x), x, 0),
                batch = new ComicBatch(root, "Scenery");
              this.chunks.push({
                node: root,
                x: x,
                factor: factor
              });
              var index = Math.floor(x / 800) + 3;
              if (factor === 0.12) {
                batch.put("background.mountains", 400, 200, 1000, undefined, 0, 45, 1, [0.5, 0]);
                for (var n = 0; n < 3; n++) batch.put(n % 2 ? "background.cloud-small" : "background.cloud", 40 + n * 290, 355 + n % 2 * 50, 240, undefined, 0, 65);
              } else if (factor === 0.38) {
                batch.put(index % 3 === 0 ? "building.base" : index % 3 === 1 ? "building.barracks" : "building.bunker", 150, 150, 350, undefined, 0, 65, 1, [0.5, 0]);
                batch.put("prop.tower", 660, 150, 110, undefined, 0, 65, 1, [0.5, 0]);
              } else if (factor === 0.72) {
                batch.put(index % 2 ? "prop.tent" : "building.barracks", 390, 140, 200, undefined, 0, 65, 1, [0.5, 0]);
                batch.put("prop.tower", 730, 145, 115, undefined, 0, 55, 1, [0.5, 0]);
              } else {
                var _iterator3 = _createForOfIteratorHelper(tiles),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var tile = _step3.value;
                    if (tile.x >= x && tile.x < x + 800) batch.tile(tile.id, tile.x - x, tile.y, tile.scale, tile.crop);
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
                for (var _n = 0; _n < 3; _n++) {
                  var px = 90 + _n * 275,
                    wx = x + px;
                  batch.put(_n % 2 ? "prop.scrub" : "prop.rock", px, level.groundY(wx) - 1, 28 + _n % 2 * 12, undefined, 0, 215, 1, [0.5, 0]);
                }
                if (index % 3 === 0) batch.put("prop.warning", 500, level.groundY(x + 500), 42, undefined, 0, 230, 1, [0.5, 0]);
              }
              batch.end();
            }
          }
          this.gate = new Ink(node(parent, "Exit portal"));
        }
        _createClass(ComicLevelRenderer, [{
          key: "update",
          value: function update(cam, unlocked) {
            var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1280;
            this.surfaceFill.setPosition(-cam, 0);
            this.visibleChunks = 0;
            var _iterator4 = _createForOfIteratorHelper(this.chunks),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var c = _step4.value;
                var x = c.x - cam * c.factor;
                c.node.setPosition(x, 0);
                c.node.active = x < width + 250 && x + 1050 > -100;
                if (c.node.active) this.visibleChunks++;
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
            var exit = this.level.data.exit.x - cam;
            this.gate.clear();
            if (exit > width + 100 || exit < -100) return;
            this.gate.line([{
              x: exit - 70,
              y: 150
            }, {
              x: exit - 70,
              y: 295
            }, {
              x: exit + 70,
              y: 295
            }, {
              x: exit + 70,
              y: 150
            }], 4);
            if (!unlocked) for (var px = exit - 50; px < exit + 60; px += 20) this.gate.segment(px, 153, px, 288, 2, colors.muted);else this.gate.line([{
              x: exit - 36,
              y: 210
            }, {
              x: exit - 12,
              y: 190
            }, {
              x: exit + 38,
              y: 240
            }], 5);
          }
        }]);
        return ComicLevelRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicObjectArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './ComicAssets.ts', './ComicFrames.ts', './TerrainTiles.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, ComicBatch, ComicAssets, ComicFrames, metalTiles;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ComicBatch = module.ComicBatch;
      ComicAssets = module.ComicAssets;
    }, function (module) {
      ComicFrames = module.ComicFrames;
    }, function (module) {
      metalTiles = module.metalTiles;
    }],
    execute: function () {
      cclegacy._RF.push({}, "a265fF4JkE2nxZgpbcrKYxm", "ComicObjectArt", undefined);
      var ComicObjectArt = exports('ComicObjectArt', /*#__PURE__*/function () {
        function ComicObjectArt() {
          _classCallCheck(this, ComicObjectArt);
          _defineProperty(this, "batch", void 0);
        }
        _createClass(ComicObjectArt, [{
          key: "begin",
          value: function begin(ink) {
            var _this$batch;
            (_this$batch = this.batch) !== null && _this$batch !== void 0 ? _this$batch : this.batch = new ComicBatch(ink.node, "Comic objects");
            this.batch.begin();
          }
        }, {
          key: "end",
          value: function end() {
            var _this$batch2;
            (_this$batch2 = this.batch) === null || _this$batch2 === void 0 || _this$batch2.end();
          }
        }, {
          key: "draw",
          value: function draw(o, cam) {
            if (!ComicAssets.enabled || o.kind === "rope") return false;
            var id;
            var damage = 1 - o.health / o.maxHealth;
            if (o.kind === "barrel") id = !o.alive ? "barrel.broken" : damage > 0.65 ? "barrel.dented" : damage > 0.2 ? "barrel.worn" : "barrel.intact";else if (o.kind === "sandbag") id = !o.alive ? "cover.sandbags-broken" : "cover.sandbags";else if (o.kind === "concrete" || o.kind === "steel") id = damage > 0.3 ? "cover.concrete-broken" : "cover.concrete";else id = !o.alive ? "crate.debris" : damage > 0.55 ? "crate.broken" : damage > 0 ? "crate.worn" : "crate.intact";
            var x = o.x - cam + o.w / 2;
            if (o.alive) {
              var size = ComicFrames[id].size;
              var scale = Math.min((o.w + 5) / size[0], (o.h + 3) / size[1]);
              this.batch.put(id, x + (o.hitTime > 0 ? Math.sin(o.hitTime * 120) * 1.5 : 0), o.y, size[0] * scale, size[1] * scale, 0, o.hitTime > 0.12 ? 180 : 255, 1, [0.5, 0]);
            } else if (o.kind === "barrel") {
              // This supplied frame is a bursting barrel, not a flattened wreck.
              if (o.deadTime < 0.4) this.batch.put(id, x, o.y - 2, o.w * (2.2 + o.deadTime), undefined, 0, Math.round(255 * (1 - o.deadTime / 0.4)), 1, [0.5, 0]);
            } else if (o.deadTime < 2) {
              this.batch.put(id, x, o.y - 2, o.w * 1.25, Math.min(o.h * 0.52, 25), 0, Math.min(255, (2 - o.deadTime) * 255), 1, [0.5, 0]);
            }
            return true;
          }
        }, {
          key: "mechanism",
          value: function mechanism(x, y, w, h) {
            var _iterator = _createForOfIteratorHelper(metalTiles(x, y + h, w)),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var t = _step.value;
                this.batch.tile(t.id, t.x, t.y, t.scale, t.crop);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        }, {
          key: "pickup",
          value: function pickup(s, p) {
            var id = p.kind === "health" ? "pickup.health" : p.kind === "grenades" ? "pickup.grenades" : "weapon.".concat(p.kind);
            this.batch.put(id, p.x - s.camera.x, p.y + Math.sin(p.age * 5) * 3, 33, undefined, 0, 255);
          }
        }]);
        return ComicObjectArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ComicPose.ts", ['cc', './ComicFrames.ts', './SupplementFrames.ts', './MeleePose.ts', './DirectPose.ts'], function (exports) {
  var cclegacy, ComicClips, ComicSockets, SupplementSockets, meleePose, directPose, directMuzzle;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ComicClips = module.ComicClips;
      ComicSockets = module.ComicSockets;
    }, function (module) {
      SupplementSockets = module.SupplementSockets;
    }, function (module) {
      meleePose = module.meleePose;
    }, function (module) {
      directPose = module.directPose;
      directMuzzle = module.directMuzzle;
    }],
    execute: function () {
      exports({
        comicMuzzle: comicMuzzle,
        comicPose: comicPose
      });
      cclegacy._RF.push({}, "bc092zAvhzk5xPQRcs5v+R+", "ComicPose", undefined);

      /** Pure pose selection: no engine, DOM, random clock or per-frame allocations. */

      function frame(clip, phase) {
        var loop = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        var frames = ComicClips[clip];
        var index = loop ? (Math.floor(phase) % frames.length + frames.length) % frames.length : Math.min(frames.length - 1, Math.max(0, Math.floor(phase)));
        return frames[index];
      }
      function comicPose(a) {
        var _a$vx, _a$hitTime2, _a$meleeTime, _a$throwTime, _a$stride4, _a$stride5;
        var direct = directPose(a);
        if (direct) return direct;
        var moving = Math.abs((_a$vx = a.vx) !== null && _a$vx !== void 0 ? _a$vx : 0) > 5 || a.animation === "Run";
        var shoot = a.recoil > .04;
        if (a.kind === "guard") {
          var _a$health, _a$maxHealth;
          if (a.animation === "Dead") return a.deadTime < .52 ? frame("tank.explode", a.deadTime * 8, false) : "tank.wreck";
          if (shoot) return "tank.fire";
          var hp = ((_a$health = a.health) !== null && _a$health !== void 0 ? _a$health : 1) / ((_a$maxHealth = a.maxHealth) !== null && _a$maxHealth !== void 0 ? _a$maxHealth : 1);
          return hp < .3 ? "tank.heavy" : hp < .65 ? "tank.damaged" : "tank.idle";
        }
        if (a.kind) {
          var _a$shieldHealth, _a$hitTime, _a$windup, _a$stride, _a$windup2, _a$windup3, _a$stride2, _a$stride3;
          var family = a.kind === "melee" ? "knife" : a.kind === "shield" && ((_a$shieldHealth = a.shieldHealth) !== null && _a$shieldHealth !== void 0 ? _a$shieldHealth : 8) > 0 ? "shield" : a.kind === "turret" ? "rocket" : "rifle";
          if (a.animation === "Dead") return frame("".concat(family, ".dead"), a.deadTime * 9, false);
          if (a.animation === "Hit") return frame("".concat(family, ".hit"), (0.13 - ((_a$hitTime = a.hitTime) !== null && _a$hitTime !== void 0 ? _a$hitTime : .13)) * 24, false);
          if (family === "knife") return a.action === "swing" ? frame("knife.attack", (.35 - ((_a$windup = a.windup) !== null && _a$windup !== void 0 ? _a$windup : .35)) * 12, false) : frame("knife.walk", ((_a$stride = a.stride) !== null && _a$stride !== void 0 ? _a$stride : 0) * 4);
          if (family === "rocket") return shoot ? frame("rocket.fire", (1.5 - a.recoil) * 8, false) : ((_a$windup2 = a.windup) !== null && _a$windup2 !== void 0 ? _a$windup2 : 0) > 0 ? frame("rocket.aim", a.animationTime * 5) : frame("rocket.idle", a.animationTime * 3);
          if (family === "shield") return shoot ? frame("shield.shoot", a.animationTime * 12) : ((_a$windup3 = a.windup) !== null && _a$windup3 !== void 0 ? _a$windup3 : 0) > 0 || !moving ? frame("shield.brace", a.animationTime * 4) : frame("shield.walk", ((_a$stride2 = a.stride) !== null && _a$stride2 !== void 0 ? _a$stride2 : 0) * 4);
          return shoot ? frame("rifle.shoot", a.animationTime * 12) : moving ? frame("rifle.walk", ((_a$stride3 = a.stride) !== null && _a$stride3 !== void 0 ? _a$stride3 : 0) * 4) : frame("rifle.idle", a.animationTime * 3);
        }
        if (a.animation === "Dead") return frame("player.death", a.deadTime * 11, false);
        if (a.animation === "Hit") return frame("player.hit", (.22 - ((_a$hitTime2 = a.hitTime) !== null && _a$hitTime2 !== void 0 ? _a$hitTime2 : .22)) * 18, false);
        if (((_a$meleeTime = a.meleeTime) !== null && _a$meleeTime !== void 0 ? _a$meleeTime : 0) > 0) return meleePose(a).frame;
        if (((_a$throwTime = a.throwTime) !== null && _a$throwTime !== void 0 ? _a$throwTime : 0) > 0) return frame("player.throw", (.24 - a.throwTime) * 21, false);
        if (a.animation === "Jump") return frame("player.jump", 1 + a.animationTime * 5 % 2, false);
        if (a.animation === "Fall") return frame("player.fall", a.animationTime * 5);
        var crouch = a.crouched || a.animation === "Crouch";
        // Crouched movement always advances the supplied SIX real leg poses, even firing.
        if (crouch && moving) return frame("player.crouch-walk", ((_a$stride4 = a.stride) !== null && _a$stride4 !== void 0 ? _a$stride4 : 0) * 6);
        if (crouch) return frame(shoot ? "player.crouch-shoot" : "player.crouch", a.animationTime * (shoot ? 12 : 3));
        if (moving) return frame(shoot ? "player.run-shoot" : "player.run", ((_a$stride5 = a.stride) !== null && _a$stride5 !== void 0 ? _a$stride5 : 0) * (shoot ? 7 : 9));
        return frame(shoot ? "player.stand-shoot" : "player.idle", a.animationTime * (shoot ? 12 : 3));
      }
      function comicMuzzle(a, pitch) {
        var _ComicSockets$id, _SupplementSockets$id;
        var extra = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var id = comicPose(a),
          _native = directMuzzle(id);
        // The complete rocket frame already includes the full launcher length. Its
        // painted muzzle is used as-is; extra attachment length must not be added.
        if (_native) return {
          x: _native[0],
          y: _native[1]
        };
        var tip = (_ComicSockets$id = ComicSockets[id]) !== null && _ComicSockets$id !== void 0 ? _ComicSockets$id : [44, 43];
        var adjust = extra > 0 || pitch > .01 ? (_SupplementSockets$id = SupplementSockets[id]) !== null && _SupplementSockets$id !== void 0 ? _SupplementSockets$id : [0, 0] : [0, 0];
        // Rotate about the supporting hand when aiming; horizontal rifle uses the exact cutout tip.
        return {
          x: tip[0] + adjust[0] - 25 + (25 + extra) * Math.cos(pitch),
          y: tip[1] + adjust[1] + (25 + extra) * Math.sin(pitch)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ControlLayout.ts", ['cc', './Types.ts'], function (exports) {
  var cclegacy, clamp;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      clamp = module.clamp;
    }],
    execute: function () {
      exports('controlLayout', controlLayout);
      cclegacy._RF.push({}, "1cf1apvWKctnx27epH/H0YB", "ControlLayout", undefined);
      function controlLayout() {
        var insets = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        };
        var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1280;
        var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 720;
        var cssHeight = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 390;
        var sideLimit = Math.min(180, 90 + Math.max(0, width - 960) / 2);
        var l = clamp(insets.left, 0, sideLimit),
          r = clamp(insets.right, 0, sideLimit),
          b = clamp(insets.bottom, 0, 120),
          t = clamp(insets.top, 0, 120);
        var k = height / cssHeight,
          baseR = clamp(cssHeight * 0.375, 136, 156) * k / 2,
          knobR = clamp(cssHeight * 0.18, 62, 76) * k / 2,
          dragR = clamp(cssHeight * 0.133, 45, 58) * k;
        var fireDiameter = clamp(cssHeight * 0.3, 108, 122) * k,
          jumpDiameter = clamp(cssHeight * 0.18, 64, 76) * k,
          grenadeDiameter = clamp(cssHeight * 0.152, 54, 66) * k;
        var fireHit = fireDiameter + 14 * k,
          jumpHit = jumpDiameter + 12 * k,
          grenadeHit = grenadeDiameter + 12 * k;
        var fireX = width - r - 18 * k - fireHit / 2,
          // Equal thumb centres balance the persistent left base and the main attack button.
          fireY = b + Math.max(baseR + 16 * k, 12 * k + fireHit / 2);
        var pauseHit = clamp(cssHeight * 0.11, 44, 48) * k;
        return {
          joystick: {
            x: baseR + 20 * k + l,
            y: baseR + 16 * k + b,
            r: dragR,
            baseR: baseR,
            knobR: knobR,
            hit: baseR * 2,
            unit: k
          },
          jump: {
            x: fireX - (fireHit + jumpHit) / 2 - 10 * k,
            y: fireY + fireHit * 0.22 + 6 * k,
            r: jumpDiameter / 2,
            hit: jumpHit
          },
          shoot: {
            x: fireX,
            y: fireY,
            r: fireDiameter / 2,
            hit: fireHit
          },
          grenade: {
            x: fireX + 6 * k,
            y: fireY + (fireHit + grenadeHit) / 2 + 8 * k,
            r: grenadeDiameter / 2,
            hit: grenadeHit
          },
          pause: {
            x: width - r - 8 * k - pauseHit / 2,
            y: height - t - 6 * k - pauseHit / 2,
            hit: pauseHit
          }
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DestructibleManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './DestructibleObject.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, DestructibleObject, surfaceY;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      DestructibleObject = module.DestructibleObject;
    }, function (module) {
      surfaceY = module.surfaceY;
    }],
    execute: function () {
      cclegacy._RF.push({}, "db109fkB95sPhOnekrsJ6W/", "DestructibleManager", undefined);
      var DestructibleManager = exports('DestructibleManager', /*#__PURE__*/function () {
        function DestructibleManager() {
          _classCallCheck(this, DestructibleManager);
          _defineProperty(this, "objects", []);
          _defineProperty(this, "revision", 0);
          _defineProperty(this, "destroyed", 0);
          _defineProperty(this, "onHit", void 0);
        }
        _createClass(DestructibleManager, [{
          key: "reset",
          value: function reset(data) {
            this.objects = data.map(function (d) {
              return new DestructibleObject(d);
            });
            this.revision++;
            this.destroyed = 0;
          }
        }, {
          key: "update",
          value: function update(dt, ground) {
            var _iterator = _createForOfIteratorHelper(this.objects),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var o = _step.value;
                o.hitTime = Math.max(0, o.hitTime - dt);
                if (!o.alive) {
                  o.deadTime += dt;
                  continue;
                }
                if (o.falling) {
                  var oldY = o.y;
                  o.vy -= 1000 * dt;
                  o.y += o.vy * dt;
                  var _iterator2 = _createForOfIteratorHelper(ground),
                    _step2;
                  try {
                    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                      var r = _step2.value;
                      if (o.x + o.w > r.x && o.x < r.x + r.w && oldY >= surfaceY(r, o.x + o.w / 2) && o.y <= surfaceY(r, o.x + o.w / 2)) {
                        var _this$onHit;
                        o.y = surfaceY(r, o.x + o.w / 2);
                        o.falling = false;
                        o.vy = 0;
                        (_this$onHit = this.onHit) === null || _this$onHit === void 0 || _this$onHit.call(this, o, false);
                      }
                    }
                  } catch (err) {
                    _iterator2.e(err);
                  } finally {
                    _iterator2.f();
                  }
                  o.bounds.y = o.y;
                  this.revision++;
                }
                if (o.dirty) {
                  var _this$onHit2;
                  o.dirty = false;
                  this.revision++;
                  (_this$onHit2 = this.onHit) === null || _this$onHit2 === void 0 || _this$onHit2.call(this, o, !o.alive);
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        }, {
          key: "flushHits",
          value: function flushHits() {
            var _iterator3 = _createForOfIteratorHelper(this.objects),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var o = _step3.value;
                if (o.dirty) {
                  var _this$onHit3;
                  o.dirty = false;
                  this.revision++;
                  if (!o.alive) this.destroyed++;
                  (_this$onHit3 = this.onHit) === null || _this$onHit3 === void 0 || _this$onHit3.call(this, o, !o.alive);
                }
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
        }]);
        return DestructibleManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DestructibleObject.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d157fEJmJ44ev6pSeIaTmXK", "DestructibleObject", undefined);
      var DestructibleObject = exports('DestructibleObject', /*#__PURE__*/function () {
        function DestructibleObject(data) {
          _classCallCheck(this, DestructibleObject);
          _defineProperty(this, "id", void 0);
          _defineProperty(this, "kind", void 0);
          _defineProperty(this, "maxHealth", void 0);
          _defineProperty(this, "x", void 0);
          _defineProperty(this, "y", void 0);
          _defineProperty(this, "w", void 0);
          _defineProperty(this, "h", void 0);
          _defineProperty(this, "health", void 0);
          _defineProperty(this, "hitTime", 0);
          _defineProperty(this, "hitDirection", 1);
          _defineProperty(this, "deadTime", 0);
          _defineProperty(this, "falling", false);
          _defineProperty(this, "vy", 0);
          _defineProperty(this, "triggered", false);
          _defineProperty(this, "dirty", false);
          _defineProperty(this, "category", void 0);
          _defineProperty(this, "bounds", void 0);
          this.data = data;
          this.id = data.id;
          this.kind = data.kind;
          this.x = data.x;
          this.y = data.y;
          this.w = data.w;
          this.h = data.h;
          this.health = this.maxHealth = GameConfig.objects[data.kind];
          this.category = data.kind === "concrete" ? "indestructible" : data.kind === "hanging" || data.kind === "rope" ? "mechanism" : "destructible";
          this.bounds = {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h
          };
        }
        _createClass(DestructibleObject, [{
          key: "alive",
          get: function get() {
            return this.health > 0;
          }
        }, {
          key: "solid",
          get: function get() {
            return this.alive && this.kind !== "rope" && (this.kind !== "hanging" || this.triggered);
          }
        }, {
          key: "takeDamage",
          value: function takeDamage(amount, _direction, _kind) {
            if (!this.alive) return false;
            this.hitTime = 0.16;
            this.hitDirection = _direction;
            if (this.category === "indestructible") return false;
            this.health = Math.max(0, this.health - amount);
            this.dirty = true;
            if (this.health === 0 && this.kind === "hanging" && !this.triggered) {
              this.triggered = true;
              this.falling = true;
              this.health = 1;
            }
            return true;
          }
        }]);
        return DestructibleObject;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DirectFrames.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "8cb86lrZbOgXb6xkzLjvRL4", "DirectFrames", undefined);
      // Generated by scripts/prepare-comic-v057.py. Original complete action frames.
      var DirectFrames = exports('DirectFrames', {
        "direct.knife.idle.0": {
          "atlas": [1680, 4, 90, 105],
          "anchor": [0.3888888888888889, 0.01904761904761909],
          "sourceSize": [90, 105],
          "size": [90, 105]
        },
        "direct.knife.idle.1": {
          "atlas": [1274, 4, 90, 106],
          "anchor": [0.4111111111111111, 0.028301886792452824],
          "sourceSize": [90, 106],
          "size": [90, 106]
        },
        "direct.knife.idle.2": {
          "atlas": [1372, 4, 92, 106],
          "anchor": [0.40217391304347827, 0.037735849056603765],
          "sourceSize": [92, 106],
          "size": [92, 106]
        },
        "direct.knife.idle.3": {
          "atlas": [1472, 4, 90, 106],
          "anchor": [0.4111111111111111, 0.047169811320754707],
          "sourceSize": [90, 106],
          "size": [90, 106]
        },
        "direct.knife.run.0": {
          "atlas": [563, 240, 103, 103],
          "anchor": [0.42718446601941745, 0.009708737864077666],
          "sourceSize": [103, 103],
          "size": [103, 103]
        },
        "direct.knife.run.1": {
          "atlas": [932, 4, 102, 107],
          "anchor": [0.4117647058823529, 0.04672897196261683],
          "sourceSize": [102, 107],
          "size": [102, 107]
        },
        "direct.knife.run.2": {
          "atlas": [1570, 4, 102, 106],
          "anchor": [0.4411764705882353, 0.047169811320754707],
          "sourceSize": [102, 106],
          "size": [102, 106]
        },
        "direct.knife.run.3": {
          "atlas": [1042, 4, 102, 107],
          "anchor": [0.4411764705882353, 0.05607476635514019],
          "sourceSize": [102, 107],
          "size": [102, 107]
        },
        "direct.knife.run.4": {
          "atlas": [467, 4, 105, 109],
          "anchor": [0.45714285714285713, 0.05504587155963303],
          "sourceSize": [105, 109],
          "size": [105, 109]
        },
        "direct.knife.run.5": {
          "atlas": [240, 4, 109, 111],
          "anchor": [0.44036697247706424, 0.018018018018018056],
          "sourceSize": [109, 111],
          "size": [109, 111]
        },
        "direct.knife.run.6": {
          "atlas": [809, 4, 115, 108],
          "anchor": [0.40869565217391307, -0.02777777777777768],
          "sourceSize": [115, 108],
          "size": [115, 108]
        },
        "direct.knife.run.7": {
          "atlas": [580, 4, 108, 109],
          "anchor": [0.3611111111111111, 0.01834862385321101],
          "sourceSize": [108, 109],
          "size": [108, 109]
        },
        "direct.knife.run.8": {
          "atlas": [357, 4, 102, 111],
          "anchor": [0.38235294117647056, 0.009009009009009028],
          "sourceSize": [102, 111],
          "size": [102, 111]
        },
        "direct.knife.jump.0": {
          "atlas": [1567, 240, 107, 100],
          "anchor": [0.38317757009345793, 0.030000000000000027],
          "sourceSize": [107, 100],
          "size": [107, 100]
        },
        "direct.knife.jump.1": {
          "atlas": [696, 4, 105, 108],
          "anchor": [0.4095238095238095, -0.10185185185185186],
          "sourceSize": [105, 108],
          "size": [105, 108]
        },
        "direct.knife.jump.2": {
          "atlas": [181, 240, 106, 104],
          "anchor": [0.4056603773584906, -0.07692307692307687],
          "sourceSize": [106, 104],
          "size": [106, 104]
        },
        "direct.knife.jump.3": {
          "atlas": [975, 240, 99, 102],
          "anchor": [0.36363636363636365, 0.02941176470588236],
          "sourceSize": [99, 102],
          "size": [99, 102]
        },
        "direct.knife.fall.0": {
          "atlas": [118, 4, 114, 112],
          "anchor": [0.32456140350877194, 0.0],
          "sourceSize": [114, 112],
          "size": [114, 112]
        },
        "direct.knife.fall.1": {
          "atlas": [1452, 240, 107, 100],
          "anchor": [0.3644859813084112, -0.030000000000000027],
          "sourceSize": [107, 100],
          "size": [107, 100]
        },
        "direct.knife.crouch.0": {
          "atlas": [373, 660, 96, 85],
          "anchor": [0.4270833333333333, 0.02352941176470591],
          "sourceSize": [96, 85],
          "size": [96, 85]
        },
        "direct.knife.crouch.1": {
          "atlas": [607, 660, 100, 84],
          "anchor": [0.44, 0.011904761904761862],
          "sourceSize": [100, 84],
          "size": [100, 84]
        },
        "direct.knife.crouch-walk.0": {
          "atlas": [1842, 563, 96, 86],
          "anchor": [0.40625, 0.0],
          "sourceSize": [96, 86],
          "size": [96, 86]
        },
        "direct.knife.crouch-walk.1": {
          "atlas": [382, 563, 104, 88],
          "anchor": [0.4326923076923077, 0.022727272727272707],
          "sourceSize": [104, 88],
          "size": [104, 88]
        },
        "direct.knife.crouch-walk.2": {
          "atlas": [867, 563, 105, 87],
          "anchor": [0.42857142857142855, 0.0],
          "sourceSize": [105, 87],
          "size": [105, 87]
        },
        "direct.knife.crouch-walk.3": {
          "atlas": [262, 660, 103, 85],
          "anchor": [0.3786407766990291, -0.0235294117647058],
          "sourceSize": [103, 85],
          "size": [103, 85]
        },
        "direct.knife.crouch-walk.4": {
          "atlas": [980, 563, 100, 87],
          "anchor": [0.39, 0.0],
          "sourceSize": [100, 87],
          "size": [100, 87]
        },
        "direct.knife.crouch-walk.5": {
          "atlas": [1088, 563, 97, 87],
          "anchor": [0.4020618556701031, 0.0],
          "sourceSize": [97, 87],
          "size": [97, 87]
        },
        "direct.knife.crouch-walk.6": {
          "atlas": [1193, 563, 99, 87],
          "anchor": [0.35353535353535354, 0.0],
          "sourceSize": [99, 87],
          "size": [99, 87]
        },
        "direct.knife.combo1.0": {
          "atlas": [859, 460, 108, 92],
          "anchor": [0.37037037037037035, 0.010869565217391353],
          "sourceSize": [108, 92],
          "size": [108, 92]
        },
        "direct.knife.combo1.1": {
          "atlas": [975, 460, 122, 92],
          "anchor": [0.3114754098360656, 0.010869565217391353],
          "sourceSize": [122, 92],
          "size": [122, 92]
        },
        "direct.knife.combo1.2": {
          "atlas": [1105, 460, 112, 92],
          "anchor": [0.38392857142857145, 0.010869565217391353],
          "sourceSize": [112, 92],
          "size": [112, 92]
        },
        "direct.knife.combo1.3": {
          "atlas": [1542, 353, 92, 95],
          "anchor": [0.391304347826087, 0.010526315789473717],
          "sourceSize": [92, 95],
          "size": [92, 95]
        },
        "direct.knife.combo2.0": {
          "atlas": [1367, 460, 136, 91],
          "anchor": [0.4117647058823529, 0.02197802197802201],
          "sourceSize": [136, 91],
          "size": [136, 91]
        },
        "direct.knife.combo2.1": {
          "atlas": [491, 353, 112, 98],
          "anchor": [0.5446428571428571, 0.010204081632653073],
          "sourceSize": [112, 98],
          "size": [112, 98]
        },
        "direct.knife.combo2.2": {
          "atlas": [758, 563, 101, 87],
          "anchor": [0.40594059405940597, 0.011494252873563204],
          "sourceSize": [101, 87],
          "size": [101, 87]
        },
        "direct.knife.combo2.3": {
          "atlas": [493, 460, 127, 93],
          "anchor": [0.33070866141732286, 0.021505376344086002],
          "sourceSize": [127, 93],
          "size": [127, 93]
        },
        "direct.knife.combo3.0": {
          "atlas": [120, 460, 123, 94],
          "anchor": [0.34146341463414637, -0.010638297872340496],
          "sourceSize": [123, 94],
          "size": [123, 94]
        },
        "direct.knife.combo3.1": {
          "atlas": [1225, 460, 134, 92],
          "anchor": [0.3358208955223881, -0.021739130434782705],
          "sourceSize": [134, 92],
          "size": [134, 92]
        },
        "direct.knife.combo3.2": {
          "atlas": [1648, 460, 179, 89],
          "anchor": [0.4022346368715084, -0.0898876404494382],
          "sourceSize": [179, 89],
          "size": [179, 89]
        },
        "direct.knife.combo3.3": {
          "atlas": [981, 353, 120, 96],
          "anchor": [0.4166666666666667, 0.02083333333333337],
          "sourceSize": [120, 96],
          "size": [120, 96]
        },
        "direct.knife.combo3.4": {
          "atlas": [1642, 353, 100, 95],
          "anchor": [0.47, 0.021052631578947323],
          "sourceSize": [100, 95],
          "size": [100, 95]
        },
        "direct.knife.air-attack.0": {
          "atlas": [609, 563, 141, 87],
          "anchor": [0.3546099290780142, -0.10344827586206895],
          "sourceSize": [141, 87],
          "size": [141, 87]
        },
        "direct.knife.air-attack.1": {
          "atlas": [241, 563, 133, 88],
          "anchor": [0.41353383458646614, -0.09090909090909083],
          "sourceSize": [133, 88],
          "size": [133, 88]
        },
        "direct.knife.hit.0": {
          "atlas": [628, 460, 93, 93],
          "anchor": [0.34408602150537637, 0.0],
          "sourceSize": [93, 93],
          "size": [93, 93]
        },
        "direct.knife.hit.1": {
          "atlas": [1835, 460, 111, 89],
          "anchor": [0.32432432432432434, 0.0],
          "sourceSize": [111, 89],
          "size": [111, 89]
        },
        "direct.knife.hit.2": {
          "atlas": [4, 563, 113, 89],
          "anchor": [0.3805309734513274, 0.0561797752808989],
          "sourceSize": [113, 89],
          "size": [113, 89]
        },
        "direct.knife.hit.3": {
          "atlas": [1511, 460, 129, 90],
          "anchor": [0.40310077519379844, 0.05555555555555558],
          "sourceSize": [129, 90],
          "size": [129, 90]
        },
        "direct.knife.death.0": {
          "atlas": [1095, 660, 105, 74],
          "anchor": [0.3238095238095238, 0.05405405405405406],
          "sourceSize": [105, 74],
          "size": [105, 74]
        },
        "direct.knife.death.1": {
          "atlas": [4, 754, 118, 66],
          "anchor": [0.4745762711864407, 0.045454545454545414],
          "sourceSize": [118, 66],
          "size": [118, 66]
        },
        "direct.knife.death.2": {
          "atlas": [130, 754, 130, 58],
          "anchor": [0.4230769230769231, 0.051724137931034475],
          "sourceSize": [130, 58],
          "size": [130, 58]
        },
        "direct.knife.death.3": {
          "atlas": [942, 754, 129, 48],
          "anchor": [0.43410852713178294, -0.08333333333333326],
          "sourceSize": [129, 48],
          "size": [129, 48]
        },
        "direct.knife.death.4": {
          "atlas": [1381, 754, 137, 43],
          "anchor": [0.41605839416058393, -0.11627906976744184],
          "sourceSize": [137, 43],
          "size": [137, 43]
        },
        "direct.knife.death.5": {
          "atlas": [1193, 754, 180, 44],
          "anchor": [0.32222222222222224, -0.09090909090909083],
          "sourceSize": [180, 44],
          "size": [180, 44]
        },
        "direct.rocket.idle.0": {
          "atlas": [740, 353, 96, 97],
          "anchor": [0.4166666666666667, 0.010309278350515427],
          "sourceSize": [96, 97],
          "size": [96, 97]
        },
        "direct.rocket.idle.1": {
          "atlas": [1231, 353, 96, 96],
          "anchor": [0.4270833333333333, 0.01041666666666663],
          "sourceSize": [96, 96],
          "size": [96, 96]
        },
        "direct.rocket.idle.2": {
          "atlas": [1335, 353, 95, 96],
          "anchor": [0.42105263157894735, 0.01041666666666663],
          "sourceSize": [95, 96],
          "size": [95, 96]
        },
        "direct.rocket.idle.3": {
          "atlas": [1438, 353, 96, 96],
          "anchor": [0.4270833333333333, 0.01041666666666663],
          "sourceSize": [96, 96],
          "size": [96, 96]
        },
        "direct.rocket.run.0": {
          "atlas": [851, 240, 116, 103],
          "anchor": [0.4396551724137931, 0.01941747572815533],
          "sourceSize": [116, 103],
          "size": [116, 103]
        },
        "direct.rocket.run.1": {
          "atlas": [1682, 240, 122, 100],
          "anchor": [0.47540983606557374, 0.020000000000000018],
          "sourceSize": [122, 100],
          "size": [122, 100]
        },
        "direct.rocket.run.2": {
          "atlas": [1082, 240, 112, 102],
          "anchor": [0.4017857142857143, 0.019607843137254943],
          "sourceSize": [112, 102],
          "size": [112, 102]
        },
        "direct.rocket.run.3": {
          "atlas": [1202, 240, 114, 102],
          "anchor": [0.4298245614035088, 0.009803921568627416],
          "sourceSize": [114, 102],
          "size": [114, 102]
        },
        "direct.rocket.run.4": {
          "atlas": [448, 240, 107, 104],
          "anchor": [0.42990654205607476, 0.009615384615384581],
          "sourceSize": [107, 104],
          "size": [107, 104]
        },
        "direct.rocket.run.5": {
          "atlas": [1324, 240, 120, 101],
          "anchor": [0.44166666666666665, -0.01980198019801982],
          "sourceSize": [120, 101],
          "size": [120, 101]
        },
        "direct.rocket.jump.0": {
          "atlas": [1778, 4, 104, 105],
          "anchor": [0.3942307692307692, -0.02857142857142847],
          "sourceSize": [104, 105],
          "size": [104, 105]
        },
        "direct.rocket.jump.1": {
          "atlas": [371, 460, 114, 94],
          "anchor": [0.37719298245614036, -0.2127659574468086],
          "sourceSize": [114, 94],
          "size": [114, 94]
        },
        "direct.rocket.jump.2": {
          "atlas": [1864, 353, 113, 95],
          "anchor": [0.4247787610619469, -0.16842105263157903],
          "sourceSize": [113, 95],
          "size": [113, 95]
        },
        "direct.rocket.jump.3": {
          "atlas": [1152, 4, 114, 107],
          "anchor": [0.39473684210526316, 0.028037383177570097],
          "sourceSize": [114, 107],
          "size": [114, 107]
        },
        "direct.rocket.fall.0": {
          "atlas": [729, 460, 122, 93],
          "anchor": [0.38524590163934425, -0.12903225806451624],
          "sourceSize": [122, 93],
          "size": [122, 93]
        },
        "direct.rocket.fall.1": {
          "atlas": [477, 660, 122, 85],
          "anchor": [0.36885245901639346, -0.15294117647058814],
          "sourceSize": [122, 85],
          "size": [122, 85]
        },
        "direct.rocket.crouch.0": {
          "atlas": [4, 660, 111, 86],
          "anchor": [0.40540540540540543, 0.011627906976744207],
          "sourceSize": [111, 86],
          "size": [111, 86]
        },
        "direct.rocket.crouch.1": {
          "atlas": [843, 660, 108, 83],
          "anchor": [0.4166666666666667, 0.012048192771084376],
          "sourceSize": [108, 83],
          "size": [108, 83]
        },
        "direct.rocket.crouch-walk.0": {
          "atlas": [1490, 563, 113, 87],
          "anchor": [0.3893805309734513, 0.0],
          "sourceSize": [113, 87],
          "size": [113, 87]
        },
        "direct.rocket.crouch-walk.1": {
          "atlas": [1611, 563, 107, 87],
          "anchor": [0.40186915887850466, 0.011494252873563204],
          "sourceSize": [107, 87],
          "size": [107, 87]
        },
        "direct.rocket.crouch-walk.2": {
          "atlas": [494, 563, 107, 88],
          "anchor": [0.3925233644859813, 0.011363636363636354],
          "sourceSize": [107, 88],
          "size": [107, 88]
        },
        "direct.rocket.crouch-walk.3": {
          "atlas": [125, 563, 108, 89],
          "anchor": [0.37037037037037035, 0.011235955056179803],
          "sourceSize": [108, 89],
          "size": [108, 89]
        },
        "direct.rocket.aim.0": {
          "atlas": [251, 460, 112, 94],
          "anchor": [0.39285714285714285, 0.03191489361702127],
          "sourceSize": [112, 94],
          "size": [112, 94]
        },
        "direct.rocket.aim.1": {
          "atlas": [1109, 353, 114, 96],
          "anchor": [0.42105263157894735, 0.03125],
          "sourceSize": [114, 96],
          "size": [114, 96]
        },
        "direct.rocket.aim.2": {
          "atlas": [611, 353, 121, 98],
          "anchor": [0.4462809917355372, 0.061224489795918324],
          "sourceSize": [121, 98],
          "size": [121, 98]
        },
        "direct.rocket.stand-fire.0": {
          "atlas": [4, 460, 108, 95],
          "anchor": [0.39814814814814814, 0.03157894736842104],
          "sourceSize": [108, 95],
          "size": [108, 95]
        },
        "direct.rocket.stand-fire.1": {
          "atlas": [4, 353, 114, 99],
          "anchor": [0.43859649122807015, 0.030303030303030276],
          "sourceSize": [114, 99],
          "size": [114, 99]
        },
        "direct.rocket.stand-fire.2": {
          "atlas": [126, 353, 202, 99],
          "anchor": [0.23267326732673269, 0.030303030303030276],
          "sourceSize": [202, 99],
          "size": [202, 99]
        },
        "direct.rocket.crouch-fire.0": {
          "atlas": [715, 660, 120, 83],
          "anchor": [0.38333333333333336, 0.07228915662650603],
          "sourceSize": [120, 83],
          "size": [120, 83]
        },
        "direct.rocket.crouch-fire.1": {
          "atlas": [959, 660, 128, 81],
          "anchor": [0.4375, 0.07407407407407407],
          "sourceSize": [128, 81],
          "size": [128, 81]
        },
        "direct.rocket.crouch-fire.2": {
          "atlas": [1300, 563, 182, 87],
          "anchor": [0.3021978021978022, 0.09195402298850575],
          "sourceSize": [182, 87],
          "size": [182, 87]
        },
        "direct.rocket.run-fire.0": {
          "atlas": [844, 353, 129, 97],
          "anchor": [0.40310077519379844, 0.020618556701030966],
          "sourceSize": [129, 97],
          "size": [129, 97]
        },
        "direct.rocket.run-fire.1": {
          "atlas": [1812, 240, 141, 99],
          "anchor": [0.3971631205673759, 0.030303030303030276],
          "sourceSize": [141, 99],
          "size": [141, 99]
        },
        "direct.rocket.run-fire.2": {
          "atlas": [674, 240, 169, 103],
          "anchor": [0.35502958579881655, 0.03883495145631066],
          "sourceSize": [169, 103],
          "size": [169, 103]
        },
        "direct.rocket.hit.0": {
          "atlas": [1750, 353, 106, 95],
          "anchor": [0.41509433962264153, -0.010526315789473717],
          "sourceSize": [106, 95],
          "size": [106, 95]
        },
        "direct.rocket.hit.1": {
          "atlas": [1726, 563, 108, 87],
          "anchor": [0.39814814814814814, -0.06896551724137923],
          "sourceSize": [108, 87],
          "size": [108, 87]
        },
        "direct.rocket.hit.2": {
          "atlas": [123, 660, 131, 86],
          "anchor": [0.3893129770992366, -0.023255813953488413],
          "sourceSize": [131, 86],
          "size": [131, 86]
        },
        "direct.rocket.hit.3": {
          "atlas": [295, 240, 145, 104],
          "anchor": [0.43448275862068964, 0.038461538461538436],
          "sourceSize": [145, 104],
          "size": [145, 104]
        },
        "direct.rocket.death.0": {
          "atlas": [1208, 660, 180, 73],
          "anchor": [0.2611111111111111, -0.06849315068493156],
          "sourceSize": [180, 73],
          "size": [180, 73]
        },
        "direct.rocket.death.1": {
          "atlas": [1834, 660, 152, 68],
          "anchor": [0.3355263157894737, -0.02941176470588225],
          "sourceSize": [152, 68],
          "size": [152, 68]
        },
        "direct.rocket.death.2": {
          "atlas": [725, 754, 209, 50],
          "anchor": [0.24401913875598086, -0.040000000000000036],
          "sourceSize": [209, 50],
          "size": [209, 50]
        },
        "direct.rocket.death.3": {
          "atlas": [1526, 754, 128, 38],
          "anchor": [0.3828125, -0.026315789473684292],
          "sourceSize": [128, 38],
          "size": [128, 38]
        },
        "direct.rocket.death.4": {
          "atlas": [268, 754, 172, 54],
          "anchor": [0.3313953488372093, -0.05555555555555558],
          "sourceSize": [172, 54],
          "size": [172, 54]
        },
        "native.top.left": {
          "atlas": [1396, 660, 27, 71],
          "anchor": [0, 0],
          "sourceSize": [27, 71],
          "size": [27, 71]
        },
        "native.top.middle": {
          "atlas": [577, 754, 140, 51],
          "anchor": [0, 0],
          "sourceSize": [140, 51],
          "size": [140, 51]
        },
        "native.top.right": {
          "atlas": [1431, 660, 29, 71],
          "anchor": [0, 0],
          "sourceSize": [29, 71],
          "size": [29, 71]
        },
        "native.fill.left": {
          "atlas": [1662, 754, 27, 38],
          "anchor": [0, 0],
          "sourceSize": [27, 38],
          "size": [27, 38]
        },
        "native.fill.right": {
          "atlas": [1697, 754, 29, 38],
          "anchor": [0, 0],
          "sourceSize": [29, 38],
          "size": [29, 38]
        },
        "native.bottom.left": {
          "atlas": [1734, 754, 37, 33],
          "anchor": [0, 0],
          "sourceSize": [37, 33],
          "size": [37, 33]
        },
        "native.bottom.middle": {
          "atlas": [1779, 754, 50, 33],
          "anchor": [0, 0],
          "sourceSize": [50, 33],
          "size": [50, 33]
        },
        "native.bottom.right": {
          "atlas": [1837, 754, 29, 33],
          "anchor": [0, 0],
          "sourceSize": [29, 33],
          "size": [29, 33]
        },
        "native.soil": {
          "atlas": [4, 240, 169, 105],
          "anchor": [0, 0],
          "sourceSize": [169, 105],
          "size": [169, 105]
        },
        "native.grass": {
          "atlas": [448, 754, 121, 51],
          "anchor": [0, 0],
          "sourceSize": [121, 51],
          "size": [121, 51]
        },
        "native.stone-ledge": {
          "atlas": [336, 353, 147, 99],
          "anchor": [0, 0],
          "sourceSize": [147, 99],
          "size": [147, 99]
        },
        "native.metal.left": {
          "atlas": [1468, 660, 50, 70],
          "anchor": [0, 0],
          "sourceSize": [50, 70],
          "size": [50, 70]
        },
        "native.metal.middle": {
          "atlas": [1526, 660, 235, 70],
          "anchor": [0, 0],
          "sourceSize": [235, 70],
          "size": [235, 70]
        },
        "native.metal.right": {
          "atlas": [1769, 660, 57, 70],
          "anchor": [0, 0],
          "sourceSize": [57, 70],
          "size": [57, 70]
        },
        "native.metal.bracket": {
          "atlas": [1079, 754, 106, 46],
          "anchor": [0, 0],
          "sourceSize": [106, 46],
          "size": [106, 46]
        },
        "native.metal.post": {
          "atlas": [4, 4, 106, 228],
          "anchor": [0, 0],
          "sourceSize": [106, 228],
          "size": [106, 228]
        }
      });
      var DirectClips = exports('DirectClips', {
        "knife.idle": ["direct.knife.idle.0", "direct.knife.idle.1", "direct.knife.idle.2", "direct.knife.idle.3"],
        "knife.run": ["direct.knife.run.0", "direct.knife.run.1", "direct.knife.run.2", "direct.knife.run.3", "direct.knife.run.4", "direct.knife.run.5", "direct.knife.run.6", "direct.knife.run.7", "direct.knife.run.8"],
        "knife.jump": ["direct.knife.jump.0", "direct.knife.jump.1", "direct.knife.jump.2", "direct.knife.jump.3"],
        "knife.fall": ["direct.knife.fall.0", "direct.knife.fall.1"],
        "knife.crouch": ["direct.knife.crouch.0", "direct.knife.crouch.1"],
        "knife.crouch-walk": ["direct.knife.crouch-walk.0", "direct.knife.crouch-walk.1", "direct.knife.crouch-walk.2", "direct.knife.crouch-walk.3", "direct.knife.crouch-walk.4", "direct.knife.crouch-walk.5", "direct.knife.crouch-walk.6"],
        "knife.combo1": ["direct.knife.combo1.0", "direct.knife.combo1.1", "direct.knife.combo1.2", "direct.knife.combo1.3"],
        "knife.combo2": ["direct.knife.combo2.0", "direct.knife.combo2.1", "direct.knife.combo2.2", "direct.knife.combo2.3"],
        "knife.combo3": ["direct.knife.combo3.0", "direct.knife.combo3.1", "direct.knife.combo3.2", "direct.knife.combo3.3", "direct.knife.combo3.4"],
        "knife.air-attack": ["direct.knife.air-attack.0", "direct.knife.air-attack.1"],
        "knife.hit": ["direct.knife.hit.0", "direct.knife.hit.1", "direct.knife.hit.2", "direct.knife.hit.3"],
        "knife.death": ["direct.knife.death.0", "direct.knife.death.1", "direct.knife.death.2", "direct.knife.death.3", "direct.knife.death.4", "direct.knife.death.5"],
        "rocket.idle": ["direct.rocket.idle.0", "direct.rocket.idle.1", "direct.rocket.idle.2", "direct.rocket.idle.3"],
        "rocket.run": ["direct.rocket.run.0", "direct.rocket.run.1", "direct.rocket.run.2", "direct.rocket.run.3", "direct.rocket.run.4", "direct.rocket.run.5"],
        "rocket.jump": ["direct.rocket.jump.0", "direct.rocket.jump.1", "direct.rocket.jump.2", "direct.rocket.jump.3"],
        "rocket.fall": ["direct.rocket.fall.0", "direct.rocket.fall.1"],
        "rocket.crouch": ["direct.rocket.crouch.0", "direct.rocket.crouch.1"],
        "rocket.crouch-walk": ["direct.rocket.crouch-walk.0", "direct.rocket.crouch-walk.1", "direct.rocket.crouch-walk.2", "direct.rocket.crouch-walk.3"],
        "rocket.aim": ["direct.rocket.aim.0", "direct.rocket.aim.1", "direct.rocket.aim.2"],
        "rocket.stand-fire": ["direct.rocket.stand-fire.0", "direct.rocket.stand-fire.1", "direct.rocket.stand-fire.2"],
        "rocket.crouch-fire": ["direct.rocket.crouch-fire.0", "direct.rocket.crouch-fire.1", "direct.rocket.crouch-fire.2"],
        "rocket.run-fire": ["direct.rocket.run-fire.0", "direct.rocket.run-fire.1", "direct.rocket.run-fire.2"],
        "rocket.hit": ["direct.rocket.hit.0", "direct.rocket.hit.1", "direct.rocket.hit.2", "direct.rocket.hit.3"],
        "rocket.death": ["direct.rocket.death.0", "direct.rocket.death.1", "direct.rocket.death.2", "direct.rocket.death.3", "direct.rocket.death.4"]
      });
      var DirectSockets = exports('DirectSockets', {
        "direct.rocket.idle.0": [45.36, 57.12],
        "direct.rocket.idle.1": [45.36, 57.96],
        "direct.rocket.idle.2": [44.52, 57.96],
        "direct.rocket.idle.3": [44.52, 59.64],
        "direct.rocket.run.0": [52.08, 58.8],
        "direct.rocket.run.1": [52.08, 59.64],
        "direct.rocket.run.2": [52.92, 65.52],
        "direct.rocket.run.3": [52.92, 67.2],
        "direct.rocket.run.4": [49.56, 65.52],
        "direct.rocket.run.5": [54.6, 72.24],
        "direct.rocket.jump.0": [51.24, 66.36],
        "direct.rocket.jump.1": [54.6, 71.4],
        "direct.rocket.jump.2": [52.08, 69.72],
        "direct.rocket.jump.3": [57.12, 68.04],
        "direct.rocket.fall.0": [50.4, 77.28],
        "direct.rocket.fall.1": [52.08, 68.04],
        "direct.rocket.crouch.0": [52.92, 45.36],
        "direct.rocket.crouch.1": [51.24, 45.36],
        "direct.rocket.crouch-walk.0": [57.12, 51.24],
        "direct.rocket.crouch-walk.1": [52.92, 51.24],
        "direct.rocket.crouch-walk.2": [53.76, 50.4],
        "direct.rocket.crouch-walk.3": [56.28, 54.6],
        "direct.rocket.aim.0": [54.6, 52.92],
        "direct.rocket.aim.1": [53.76, 54.6],
        "direct.rocket.aim.2": [54.6, 56.28],
        "direct.rocket.stand-fire.0": [52.92, 51.24],
        "direct.rocket.stand-fire.1": [51.24, 52.08],
        "direct.rocket.stand-fire.2": [43.68, 52.92],
        "direct.rocket.crouch-fire.0": [58.8, 43.68],
        "direct.rocket.crouch-fire.1": [58.8, 44.52],
        "direct.rocket.crouch-fire.2": [46.2, 42.0],
        "direct.rocket.run-fire.0": [62.16, 55.44],
        "direct.rocket.run-fire.1": [69.72, 57.96],
        "direct.rocket.run-fire.2": [57.12, 47.88]
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DirectPose.ts", ['cc', './DirectFrames.ts'], function (exports) {
  var cclegacy, DirectClips, DirectSockets;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      DirectClips = module.DirectClips;
      DirectSockets = module.DirectSockets;
    }],
    execute: function () {
      exports({
        directBarrel: directBarrel,
        directMuzzle: directMuzzle,
        directPose: directPose,
        isDirectActor: isDirectActor
      });
      cclegacy._RF.push({}, "6c427JsqW5Gwu13+XF+s5pk", "DirectPose", undefined);
      function frame(clip, phase) {
        var loop = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
        var frames = DirectClips[clip];
        var index = loop ? (Math.floor(phase) % frames.length + frames.length) % frames.length : Math.min(frames.length - 1, Math.max(0, Math.floor(phase)));
        return frames[index];
      }
      function isDirectActor(id) {
        return id.startsWith("direct.");
      }

      /** Complete painted soldiers: no gun-removal masks or extra hand/weapon layers. */
      function directPose(a) {
        var _a$meleeTime, _a$hitTime, _a$throwTime, _a$vx, _a$stride, _a$stride2;
        if (a.kind) return undefined;
        var melee = ((_a$meleeTime = a.meleeTime) !== null && _a$meleeTime !== void 0 ? _a$meleeTime : 0) > 0;
        var family = melee || a.weaponId === "knife" ? "knife" : a.weaponId === "rocket" ? "rocket" : undefined;
        if (!family) return undefined;
        if (a.animation === "Dead") return frame("".concat(family, ".death"), a.deadTime * 10, false);
        if (a.animation === "Hit") return frame("".concat(family, ".hit"), (.22 - ((_a$hitTime = a.hitTime) !== null && _a$hitTime !== void 0 ? _a$hitTime : .22)) * 18, false);
        // Neither new sheet contains a grenade throw. The existing supplied unarmed
        // throwing action is selected by ComicPose, rather than inventing body parts.
        if (((_a$throwTime = a.throwTime) !== null && _a$throwTime !== void 0 ? _a$throwTime : 0) > 0) return undefined;
        var moving = Math.abs((_a$vx = a.vx) !== null && _a$vx !== void 0 ? _a$vx : 0) > 5 || a.animation === "Run";
        var crouch = a.crouched || a.animation === "Crouch";
        if (melee) {
          var _a$meleeProgress, _a$meleeStage;
          var progress = Math.min(.999, Math.max(0, (_a$meleeProgress = a.meleeProgress) !== null && _a$meleeProgress !== void 0 ? _a$meleeProgress : 0));
          if (a.meleeStance === "jump") return frame("knife.air-attack", progress * 2, false);
          // No crouched cutting row is supplied: keep the native low knife pose and
          // its intact arms/blade. Gameplay still uses the low sector and hit effects.
          if (a.meleeStance === "crouch") return frame("knife.crouch-walk", progress * 7, false);
          var clip = "knife.combo".concat(Math.max(1, Math.min(3, (_a$meleeStage = a.meleeStage) !== null && _a$meleeStage !== void 0 ? _a$meleeStage : 1)));
          return frame(clip, progress * DirectClips[clip].length, false);
        }
        if (a.animation === "Jump") return frame("".concat(family, ".jump"), 1 + a.animationTime * 5 % 2, false);
        if (a.animation === "Fall") return frame("".concat(family, ".fall"), a.animationTime * 5);
        if (family === "rocket" && a.recoil > .04) {
          var action = crouch ? "crouch-fire" : moving ? "run-fire" : "stand-fire";
          // Recoil decays at 8/s. Use the actual shot age, never the idle animation
          // clock (which previously jumped directly to an unrelated firing pose).
          return frame("rocket.".concat(action), (1.9 - a.recoil) / 8 * 16, false);
        }
        if (crouch && moving) return frame("".concat(family, ".crouch-walk"), ((_a$stride = a.stride) !== null && _a$stride !== void 0 ? _a$stride : 0) * DirectClips["".concat(family, ".crouch-walk")].length);
        if (crouch) return frame("".concat(family, ".crouch"), a.animationTime * 3);
        if (moving) return frame("".concat(family, ".run"), ((_a$stride2 = a.stride) !== null && _a$stride2 !== void 0 ? _a$stride2 : 0) * DirectClips["".concat(family, ".run")].length);
        return frame("".concat(family, ".idle"), a.animationTime * 3);
      }
      function directMuzzle(id) {
        return isDirectActor(id) ? DirectSockets[id] : undefined;
      }

      /** Axis of the PAINTED launcher, independent of the requested guided heading.
       * The supplied standing/running/crouching tubes are horizontal. Falling poses
       * paint a raised tube; angles are measured in source-image coordinates.
       */
      function directBarrel(id) {
        var tip = directMuzzle(id);
        if (!tip || !id.startsWith("direct.rocket.")) return undefined;
        var pitch = id === "direct.rocket.fall.0" ? .48 : id === "direct.rocket.fall.1" ? .37 : 0;
        return {
          x: tip[0],
          y: tip[1],
          pitch: pitch,
          backX: tip[0] - 80 * Math.cos(pitch),
          backY: tip[1] - 80 * Math.sin(pitch)
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './WeaponSystem.ts', './EnemyTactics.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig, WeaponSystem, EnemyTactics;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      WeaponSystem = module.WeaponSystem;
    }, function (module) {
      EnemyTactics = module.EnemyTactics;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b69b4fFvzYITT6G4RCBc0hw", "EnemyController", undefined);
      var EnemyController = exports('EnemyController', /*#__PURE__*/function () {
        function EnemyController(spawn) {
          var _spawn$health;
          _classCallCheck(this, EnemyController);
          _defineProperty(this, "x", void 0);
          _defineProperty(this, "y", void 0);
          _defineProperty(this, "vx", 0);
          _defineProperty(this, "vy", 0);
          _defineProperty(this, "grounded", true);
          _defineProperty(this, "halfWidth", 13);
          _defineProperty(this, "height", 74);
          _defineProperty(this, "kind", void 0);
          _defineProperty(this, "id", void 0);
          _defineProperty(this, "maxHealth", void 0);
          _defineProperty(this, "health", void 0);
          _defineProperty(this, "state", "Idle");
          _defineProperty(this, "facing", -1);
          _defineProperty(this, "hitTime", 0);
          _defineProperty(this, "deadTime", 0);
          _defineProperty(this, "animationTime", 0);
          _defineProperty(this, "stride", 0);
          _defineProperty(this, "groundSlope", 0);
          _defineProperty(this, "recoil", 0);
          _defineProperty(this, "attackCooldown", 0.8);
          _defineProperty(this, "windup", 0);
          _defineProperty(this, "aimPitch", 0);
          _defineProperty(this, "shieldHealth", 0);
          _defineProperty(this, "shieldHit", 0);
          _defineProperty(this, "deathEffectPlayed", false);
          _defineProperty(this, "tactics", new EnemyTactics());
          _defineProperty(this, "stuckTime", 0);
          _defineProperty(this, "hopCooldown", 0);
          _defineProperty(this, "hopDirection", 1);
          _defineProperty(this, "hopTime", 0);
          _defineProperty(this, "weapon", new WeaponSystem());
          _defineProperty(this, "hurtbox", {
            x: 0,
            y: 0,
            w: 26,
            h: 65
          });
          this.spawn = spawn;
          this.x = spawn.x;
          this.y = spawn.y;
          this.kind = spawn.kind;
          this.id = spawn.id;
          this.health = this.maxHealth = (_spawn$health = spawn.health) !== null && _spawn$health !== void 0 ? _spawn$health : GameConfig.enemies[this.kind].health;
          if (this.kind === "shield") this.shieldHealth = 8;
          if (this.kind === "turret") {
            this.halfWidth = 28;
            this.height = 70;
          }
        }
        _createClass(EnemyController, [{
          key: "action",
          get: function get() {
            return this.tactics.action;
          }
        }, {
          key: "alive",
          get: function get() {
            return this.health > 0;
          }
        }, {
          key: "bounds",
          get: function get() {
            this.hurtbox.x = this.x - (this.kind === "shield" ? 22 : this.halfWidth);
            this.hurtbox.y = this.y + 3;
            this.hurtbox.h = this.kind === "guard" ? 72 : 65;
            this.hurtbox.w = this.kind === "shield" ? 44 : this.halfWidth * 2;
            return this.hurtbox;
          }
        }, {
          key: "animation",
          get: function get() {
            if (!this.alive) return "Dead";
            if (this.hitTime > 0) return "Hit";
            if (!this.grounded) return this.vy > 0 ? "Jump" : "Fall";
            if (this.state === "Attack" && Math.abs(this.vx) < 4) return "Shoot";
            if (Math.abs(this.vx) > 4) return "Run";
            return "Idle";
          }
        }, {
          key: "takeDamage",
          value: function takeDamage(amount, direction) {
            var kind = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "bullet";
            if (!this.alive) return false;
            var blocked = this.kind === "shield" && this.shieldHealth > 0 && direction === -this.facing && kind !== "explosion";
            if (blocked) {
              this.shieldHealth = Math.max(0, this.shieldHealth - amount);
              this.shieldHit = 0.16;
              amount *= 0.2;
            }
            this.health = Math.max(0, this.health - amount);
            this.hitTime = blocked ? 0.025 : 0.13;
            this.vx = this.kind === "turret" ? 0 : direction * 65;
            this.state = this.alive ? "Hit" : "Dead";
            if (!blocked) this.tactics.interrupt(this);
            return true;
          }
        }, {
          key: "update",
          value: function update(dt, player, level, projectiles) {
            this.animationTime += dt;
            this.weapon.update(dt);
            this.recoil = Math.max(0, this.recoil - dt * 8);
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
            this.hitTime = Math.max(0, this.hitTime - dt);
            this.shieldHit = Math.max(0, this.shieldHit - dt);
            var dx = player.x - this.x;
            if (!this.alive) {
              this.state = "Dead";
              this.deadTime += dt;
              this.vx *= Math.exp(-dt * 3);
            } else if (this.hitTime > 0) {
              this.state = "Hit";
              this.vx *= Math.exp(-dt * 5);
            } else this.tactics.update(this, dt, player, level, projectiles);
            // Ranged platform soldiers remain on their patrol surface. Melee soldiers can negotiate crates.
            if (this.kind === "ranged" && this.spawn.onPlatform && (this.x <= this.spawn.x - this.spawn.patrol && this.vx < 0 || this.x >= this.spawn.x + this.spawn.patrol && this.vx > 0)) this.vx = 0;
            var oldX = this.x;
            this.hopTime = Math.max(0, this.hopTime - dt);
            // Keep takeoff momentum: acquiring sight mid-jump must not stop a soldier
            // above the same lip and drop it back into the depression.
            if (this.hopTime > 0 && !this.grounded && this.alive && this.hitTime === 0) this.vx = this.hopDirection * 160;
            var walking = Math.abs(this.vx) > 4;
            var walkDirection = this.vx >= 0 ? 1 : -1;
            this.hopCooldown = Math.max(0, this.hopCooldown - dt);
            this.vy -= GameConfig.player.gravity * dt;
            level.move(this, dt);
            if (this.grounded) this.stride += (this.x - oldX) * this.facing / GameConfig.animation.strideLength;
            var mobile = this.kind === "melee" || this.kind === "ranged" || this.kind === "shield";
            this.stuckTime = this.alive && mobile && !this.spawn.onPlatform && walking && this.grounded && this.hitTime === 0 && Math.abs(this.x - oldX) < 0.01 ? this.stuckTime + dt : 0;
            if (this.stuckTime > 0.14 && this.hopCooldown === 0) {
              this.vy = 480;
              this.grounded = false;
              this.stuckTime = 0;
              this.hopCooldown = 0.85;
              this.hopTime = .85;
              this.hopDirection = walkDirection;
            }
          }
        }]);
        return EnemyController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemySpawner.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './LevelData.ts', './EnemyController.ts', './TankBoss.ts', './ColossusBoss.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, AbandonedBase, EnemyController, TankBoss, ColossusBoss;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      AbandonedBase = module.AbandonedBase;
    }, function (module) {
      EnemyController = module.EnemyController;
    }, function (module) {
      TankBoss = module.TankBoss;
    }, function (module) {
      ColossusBoss = module.ColossusBoss;
    }],
    execute: function () {
      cclegacy._RF.push({}, "8b089lYev8djBrTgA9ztYVw", "EnemySpawner", undefined);
      var EnemySpawner = exports('EnemySpawner', /*#__PURE__*/function () {
        function EnemySpawner() {
          _classCallCheck(this, EnemySpawner);
          _defineProperty(this, "enemies", []);
        }
        _createClass(EnemySpawner, [{
          key: "reset",
          value: function reset() {
            var _this = this;
            var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : AbandonedBase.enemies;
            this.enemies = data.map(function (d) {
              return d.kind === "colossus" ? new ColossusBoss(d) : d.kind === "guard" ? new TankBoss(d) : new EnemyController(d);
            });
            this.guard.onSummon = function (x) {
              var count = _this.enemies.filter(function (e) {
                return e.alive && e.id.startsWith("reinforce");
              }).length;
              if (count >= 4) return;
              for (var i = 0; i < 2; i++) _this.enemies.push(new EnemyController({
                id: "reinforce-".concat(_this.enemies.length),
                kind: i === 0 ? "ranged" : "melee",
                x: x + i * 80,
                y: 150,
                patrol: 20
              }));
            };
          }
        }, {
          key: "remaining",
          get: function get() {
            return this.enemies.filter(function (e) {
              return e.alive;
            }).length;
          }
        }, {
          key: "kills",
          get: function get() {
            return this.enemies.length - this.remaining;
          }
        }, {
          key: "guard",
          get: function get() {
            var _this$enemies$find;
            return (_this$enemies$find = this.enemies.find(function (e) {
              return e.kind === "colossus";
            })) !== null && _this$enemies$find !== void 0 ? _this$enemies$find : this.enemies.find(function (e) {
              return e.kind === "guard";
            });
          }
        }, {
          key: "miniBoss",
          get: function get() {
            return this.enemies.find(function (e) {
              return e.kind === "guard" && e.miniBoss;
            });
          }
        }]);
        return EnemySpawner;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemyTactics.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig, segmentRect, clamp;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      segmentRect = module.segmentRect;
      clamp = module.clamp;
    }],
    execute: function () {
      cclegacy._RF.push({}, "5b7d3y5oYDdgaep/3oPNuat", "EnemyTactics", undefined);
      /** Per-soldier tactics. Every high-threat action has a tell and a recovery window. */
      var EnemyTactics = exports('EnemyTactics', /*#__PURE__*/function () {
        function EnemyTactics() {
          _classCallCheck(this, EnemyTactics);
          _defineProperty(this, "action", "patrol");
          _defineProperty(this, "timer", 0);
          _defineProperty(this, "burstLeft", 0);
          _defineProperty(this, "lockedPitch", 0);
          _defineProperty(this, "direction", -1);
          _defineProperty(this, "patrol", -1);
          _defineProperty(this, "turn", 0);
        }
        _createClass(EnemyTactics, [{
          key: "interrupt",
          value: function interrupt(e) {
            this.action = "recover";
            this.timer = 0.2;
            this.burstLeft = 0;
            e.windup = 0;
          }
        }, {
          key: "update",
          value: function update(e, dt, p, level, shots) {
            var cfg = GameConfig.enemies[e.kind],
              dx = p.x - e.x,
              dy = p.y - e.y,
              dist = Math.abs(dx);
            this.timer = Math.max(0, this.timer - dt);
            if (!p.alive || dist > cfg.notice) {
              e.windup = 0;
              this.burstLeft = 0;
              this.action = "patrol";
              e.state = dist > 900 ? "Idle" : "Patrol";
              if (e.x < e.spawn.x - e.spawn.patrol) this.patrol = 1;
              if (e.x > e.spawn.x + e.spawn.patrol) this.patrol = -1;
              e.vx = e.state === "Patrol" ? this.patrol * cfg.speed * 0.3 : 0;
              if (e.vx) e.facing = e.vx > 0 ? 1 : -1;
              return;
            }
            var desired = dx >= 0 ? 1 : -1;
            if (e.kind === "shield" && desired !== e.facing) {
              this.turn += dt;
              if (this.turn >= 0.45) {
                e.facing = desired;
                this.turn = 0;
              }
            } else {
              e.facing = desired;
              this.turn = 0;
            }
            var sight = !level.solids.some(function (s) {
              if (segmentRect({
                x: e.x,
                y: e.y + 50
              }, {
                x: p.x,
                y: p.y + 35
              }, s) === null) return false;
              if (!s.entityId) return true;
              var cover = level.objects.objects.find(function (o) {
                return o.id === s.entityId;
              });
              // Mobile soldiers must reposition around cover. Wooden boxes and barrels
              // remain valid firing targets: shots can destroy/explode those objects.
              return (cover === null || cover === void 0 ? void 0 : cover.kind) === "sandbag" || (cover === null || cover === void 0 ? void 0 : cover.category) === "indestructible";
            });
            if (e.kind === "melee") {
              this.melee(e, dt, p, dx, dy);
              return;
            }
            if (this.action === "recover" && this.timer > 0) {
              e.vx = 0;
              e.state = "Idle";
              return;
            }
            var close = dist <= cfg.range && Math.abs(dy) < 160 && sight;
            if (!close) {
              this.action = "approach";
              this.burstLeft = 0;
              e.windup = 0;
              e.state = "Chase";
              e.vx = e.facing * cfg.speed;
              return;
            }
            e.state = "Attack";
            if (e.kind === "turret") {
              e.vx = 0;
              if (e.attackCooldown === 0 && e.windup === 0) {
                this.action = "lock";
                e.windup = 0.9;
                this.lockedPitch = clamp(Math.atan2(dy - 12, dist), -0.3, 0.65);
              }
              e.aimPitch = this.lockedPitch;
              if (e.windup > 0) {
                e.windup = Math.max(0, e.windup - dt);
                if (e.windup === 0) {
                  shots.spawn({
                    owner: "enemy",
                    x: e.x + e.facing * 36 * Math.cos(e.aimPitch),
                    y: e.y + 50 + 36 * Math.sin(e.aimPitch),
                    direction: e.facing,
                    pitch: e.aimPitch,
                    speed: 260,
                    damage: 2,
                    range: 1150,
                    kind: "cannon",
                    blastRadius: 55
                  });
                  e.recoil = 1.5;
                  e.attackCooldown = cfg.interval;
                  this.action = "recover";
                  this.timer = 0.45;
                }
              }
              return;
            }
            if (e.kind === "shield") {
              if (e.attackCooldown === 0 && e.windup === 0) {
                this.action = dist < 55 ? "bash" : "brace";
                e.windup = dist < 55 ? 0.45 : 0.6;
                this.lockedPitch = 0;
              }
              e.vx = e.windup > 0 ? 0 : e.shieldHealth > 0 ? dist > 170 ? e.facing * cfg.speed : 0 : dist < 220 ? -e.facing * cfg.speed : 0;
              if (e.windup === 0) this.action = e.shieldHealth > 0 ? "push" : "retreat";
              if (e.windup > 0) {
                e.windup = Math.max(0, e.windup - dt);
                if (e.windup === 0) {
                  if (this.action === "bash") {
                    if (dist < 66 && Math.abs(dy) < 50) p.takeDamage(1, e.facing);
                  } else {
                    e.aimPitch = 0;
                    e.weapon.fire(e, shots, "enemy", cfg.interval);
                  }
                  e.attackCooldown = cfg.interval;
                  this.action = "recover";
                  this.timer = 0.35;
                }
              }
              return;
            }
            // Rifle troops fire a short, locked burst, then visibly reload and seek nearby cover.
            if (this.action === "reload" && this.timer > 0) {
              e.state = "Chase";
              var cover = level.objects.objects.find(function (o) {
                return o.alive && o.solid && Math.abs(o.x - e.x) < 130 && o.y < e.y + 10 && ["wood", "steel", "sandbag"].includes(o.kind);
              });
              var target = cover ? p.x < e.x ? cover.x + cover.w + 20 : cover.x - 20 : e.spawn.onPlatform ? e.spawn.x + (Math.floor(e.animationTime) % 2 ? 1 : -1) * e.spawn.patrol * 0.6 : e.x + (dist < 230 ? -e.facing : e.facing) * 45;
              e.vx = Math.abs(target - e.x) > 5 ? Math.sign(target - e.x) * cfg.speed * 0.7 : 0;
              return;
            }
            if (this.action !== "aim" && this.action !== "burst") {
              this.action = "aim";
              e.windup = 0.65;
              this.burstLeft = 2;
              this.direction = e.facing;
              this.lockedPitch = clamp(Math.atan2(dy - 16, dist), -0.25, 0.55);
            }
            e.vx = 0;
            e.facing = this.direction;
            e.aimPitch = this.lockedPitch;
            if (e.windup > 0) {
              e.windup = Math.max(0, e.windup - dt);
              if (e.windup > 0) return;
              this.action = "burst";
            }
            if (this.burstLeft > 0 && e.weapon.fire(e, shots, "enemy", 0.26)) this.burstLeft--;
            if (this.burstLeft === 0 && e.weapon.cooldown === 0) {
              this.action = "reload";
              this.timer = 2.25;
              e.windup = 0;
            }
          }
        }, {
          key: "melee",
          value: function melee(e, dt, p, dx, dy) {
            var dist = Math.abs(dx),
              cfg = GameConfig.enemies.melee;
            if (this.action === "recover" && this.timer > 0) {
              e.state = "Idle";
              e.vx = 0;
              return;
            }
            if (this.action === "chargeWindup") {
              e.state = "Attack";
              e.vx = 0;
              e.facing = this.direction;
              e.windup = Math.max(0, e.windup - dt);
              if (e.windup === 0) {
                this.action = "charge";
                this.timer = 0.42;
              }
              return;
            }
            if (this.action === "charge") {
              e.state = "Chase";
              e.facing = this.direction;
              e.vx = this.direction * 285;
              if (dist < 48 && Math.abs(dy) < 50 || this.timer === 0) {
                if (dist < 48 && Math.abs(dy) < 50) p.takeDamage(1, this.direction);
                this.action = "recover";
                this.timer = 0.7;
                e.attackCooldown = 1.1;
                e.vx = 0;
              }
              return;
            }
            if (this.action === "swing") {
              e.state = "Attack";
              e.vx = 0;
              e.windup = Math.max(0, e.windup - dt);
              if (e.windup === 0) {
                if (dist < cfg.range + 10 && Math.abs(dy) < 50) p.takeDamage(1, e.facing);
                this.action = "recover";
                this.timer = 0.45;
                e.attackCooldown = cfg.interval;
              }
              return;
            }
            if (e.attackCooldown === 0 && e.grounded && Math.abs(dy) < 50 && dist < 175) {
              this.action = dist < 55 ? "swing" : "chargeWindup";
              e.windup = dist < 55 ? 0.35 : 0.6;
              this.direction = e.facing;
              e.state = "Attack";
              e.vx = 0;
              return;
            }
            this.action = "approach";
            e.state = "Chase";
            e.vx = e.facing * cfg.speed;
          }
        }]);
        return EnemyTactics;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ExplosionSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "5b45aStG7EApQgKnXDD57eZ", "ExplosionSystem", undefined);
      /** Bounded FIFO keeps barrel chains iterative and schedules each destroyed barrel once. */
      var ExplosionSystem = exports('ExplosionSystem', /*#__PURE__*/function () {
        function ExplosionSystem() {
          _classCallCheck(this, ExplosionSystem);
          _defineProperty(this, "items", Array.from({
            length: 24
          }, function () {
            return {
              active: false,
              x: 0,
              y: 0,
              radius: 0,
              damage: 0,
              owner: "neutral",
              age: 0,
              style: "barrel"
            };
          }));
          _defineProperty(this, "queue", Array.from({
            length: 32
          }, function () {
            return {
              x: 0,
              y: 0,
              radius: 0,
              damage: 0,
              owner: "neutral",
              style: "barrel"
            };
          }));
          _defineProperty(this, "head", 0);
          _defineProperty(this, "count", 0);
          _defineProperty(this, "total", 0);
          _defineProperty(this, "dropped", 0);
          _defineProperty(this, "pending", Array.from({
            length: 32
          }, function () {
            return {
              active: false,
              delay: 0,
              x: 0,
              y: 0,
              radius: 0,
              damage: 0,
              owner: "neutral"
            };
          }));
        }
        _createClass(ExplosionSystem, [{
          key: "schedule",
          value: function schedule(x, y, radius, damage, owner) {
            var delay = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0.09;
            var p = this.pending.find(function (p) {
              return !p.active;
            });
            if (!p) {
              this.dropped++;
              return;
            }
            Object.assign(p, {
              active: true,
              delay: delay,
              x: x,
              y: y,
              radius: radius,
              damage: damage,
              owner: owner
            });
          }
        }, {
          key: "advance",
          value: function advance(dt) {
            var _iterator = _createForOfIteratorHelper(this.pending),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var p = _step.value;
                if (p.active) {
                  p.delay -= dt;
                  if (p.delay <= 0) {
                    p.active = false;
                    this.enqueue(p.x, p.y, p.radius, p.damage, p.owner);
                  }
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        }, {
          key: "enqueue",
          value: function enqueue(x, y, radius, damage, owner) {
            var style = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : "barrel";
            if (this.count === this.queue.length) {
              this.dropped++;
              return;
            }
            Object.assign(this.queue[(this.head + this.count) % this.queue.length], {
              x: x,
              y: y,
              radius: radius,
              damage: damage,
              owner: owner,
              style: style
            });
            this.count++;
          }
        }, {
          key: "flush",
          value: function flush(apply) {
            var budget = 64;
            while (this.count > 0 && budget-- > 0) {
              var b = this.queue[this.head];
              this.head = (this.head + 1) % this.queue.length;
              this.count--;
              var _x = b.x,
                _y = b.y,
                _radius = b.radius,
                _damage = b.damage,
                _owner = b.owner,
                style = b.style;
              var visible = this.items.find(function (p) {
                return !p.active;
              });
              if (visible) Object.assign(visible, {
                active: true,
                x: _x,
                y: _y,
                radius: _radius,
                damage: _damage,
                owner: _owner,
                age: 0,
                style: style
              });
              this.total++;
              apply(_x, _y, _radius, _damage, _owner);
            }
          }
        }, {
          key: "update",
          value: function update(dt) {
            var _iterator2 = _createForOfIteratorHelper(this.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var b = _step2.value;
                if (b.active) {
                  b.age += dt;
                  if (b.age > 0.85) b.active = false;
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }, {
          key: "reset",
          value: function reset() {
            var _iterator3 = _createForOfIteratorHelper(this.items),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var b = _step3.value;
                b.active = false;
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            var _iterator4 = _createForOfIteratorHelper(this.pending),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var p = _step4.value;
                p.active = false;
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
            this.head = this.count = this.total = this.dropped = 0;
          }
        }]);
        return ExplosionSystem;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameConfig.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "692b0vdk/dJcMDIrfhnzhP1", "GameConfig", undefined);
      /** Units: design pixels, seconds. All combat/movement tuning lives here. */
      var GameConfig = exports('GameConfig', {
        artStyle: "comic",
        width: 1280,
        height: 720,
        fps: 60,
        fixedStep: 1 / 120,
        maxFrameDelta: 0.1,
        input: {
          joystickRadius: 92,
          deadZone: 0.16,
          crouchThreshold: -0.52,
          aimThreshold: 0.52
        },
        player: {
          maxHealth: 5,
          speed: 280,
          acceleration: 2600,
          deceleration: 3200,
          jumpVelocity: 550,
          airJumpVelocity: 500,
          airJumps: 1,
          gravity: 1200,
          height: 74,
          halfWidth: 13,
          invincibility: 1.15,
          coyoteTime: 0.085,
          jumpBuffer: 0.11,
          jumpCut: 0.55,
          crouchSpeed: 115,
          deathDuration: 0.9
        },
        animation: {
          strideLength: 96,
          legSegment: 23
        },
        melee: {
          range: 88,
          height: 64,
          damage: 4,
          interval: 0.48,
          duration: 0.28,
          windup: 0.07,
          comboWindow: .42,
          combo: [{
            duration: .26,
            windup: .055,
            active: .115,
            range: 94,
            damage: 4,
            knockback: 125,
            lunge: 100,
            start: 1.05,
            end: -1.05
          }, {
            duration: .30,
            windup: .075,
            active: .13,
            range: 105,
            damage: 4,
            knockback: 160,
            lunge: 120,
            start: -1.15,
            end: 1.10
          }, {
            duration: .43,
            windup: .13,
            active: .16,
            range: 116,
            damage: 7,
            knockback: 250,
            lunge: 145,
            start: 1.50,
            end: -1.30
          }]
        },
        homing: {
          turnRate: 2.5,
          acquireRange: 680,
          cone: 1.05,
          delay: 0.08
        },
        rocketLaunch: {
          turnRate: 14,
          exposedNose: 10,
          visualLength: 116
        },
        weapons: {
          knife: {
            id: "knife",
            name: "战术刀",
            interval: .26,
            speed: 0,
            damage: 4,
            range: 94,
            muzzleHeight: 40,
            pellets: 0,
            spread: 0,
            recoil: 0,
            ammo: -1,
            muzzleLength: 0,
            blastRadius: 0,
            knockback: 125
          },
          rifle: {
            id: "rifle",
            name: "突击步枪",
            interval: 0.14,
            speed: 1100,
            damage: 1,
            range: 980,
            muzzleHeight: 44,
            pellets: 1,
            spread: 0,
            recoil: 1,
            ammo: -1,
            muzzleLength: 17,
            blastRadius: 0,
            knockback: 45
          },
          shotgun: {
            id: "shotgun",
            name: "霰弹枪",
            interval: 0.48,
            speed: 880,
            damage: 1.5,
            range: 520,
            muzzleHeight: 44,
            pellets: 6,
            spread: 0.065,
            recoil: 1.65,
            ammo: 18,
            muzzleLength: 27,
            blastRadius: 0,
            knockback: 160
          },
          rocket: {
            id: "rocket",
            name: "追踪火箭筒",
            interval: 0.95,
            speed: 460,
            damage: 9,
            range: 1150,
            muzzleHeight: 44,
            pellets: 1,
            spread: 0,
            recoil: 1.9,
            ammo: 6,
            muzzleLength: 26,
            blastRadius: 160,
            knockback: 240
          }
        },
        grenade: {
          initial: 3,
          max: 6,
          interval: 0.7,
          speed: 350,
          upward: 380,
          gravity: 900,
          fuse: 1.1,
          radius: 155,
          damage: 7
        },
        objects: {
          wood: 3,
          barrel: 3,
          sandbag: 6,
          steel: 9,
          hanging: 2,
          rope: 2,
          concrete: 10000
        },
        enemies: {
          melee: {
            health: 3,
            speed: 155,
            range: 39,
            interval: 1.15,
            notice: 620,
            damage: 1
          },
          ranged: {
            health: 4,
            speed: 54,
            range: 570,
            interval: 1.35,
            notice: 690,
            damage: 1
          },
          guard: {
            health: 90,
            speed: 0,
            range: 700,
            interval: 0.7,
            notice: 800,
            damage: 1
          },
          shield: {
            health: 6,
            speed: 65,
            range: 400,
            interval: 1.65,
            notice: 670,
            damage: 1
          },
          turret: {
            health: 8,
            speed: 0,
            range: 740,
            interval: 2.3,
            notice: 820,
            damage: 2
          },
          colossus: {
            health: 132,
            speed: 0,
            range: 1100,
            interval: 1.4,
            notice: 1500,
            damage: 1
          }
        },
        boss: {
          firstInterval: 2.3,
          secondInterval: 1.35,
          firstWindup: 1.05,
          secondWindup: 0.72,
          summonInterval: 14,
          maxSummons: 8,
          blastRadius: 85,
          shellFlight: 0.95
        },
        colossus: {
          intro: 1.3,
          firstWindup: 1.05,
          secondWindup: 0.78,
          firstRecovery: 1.25,
          secondRecovery: 0.95,
          summonInterval: 15,
          maxSummons: 4,
          shellFlight: 1.05,
          waveSpeed: 360
        },
        enemyProjectile: {
          speed: 430,
          range: 1000
        },
        pools: {
          projectiles: 96,
          particles: 320
        },
        rendering: {
          lineWidth: 6.4,
          headRadius: 10,
          corpseDuration: 0.8,
          lineWidths: {
            hero: 6.4,
            enemy: 5.6,
            interactive: 4.5,
            platform: 5.8,
            structure: 3.6,
            background: 1.25,
            ui: 4.5,
            detail: 2
          }
        }
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './InputManager.ts', './GameSession.ts', './Ink.ts', './StickmanRenderer.ts', './LevelRenderer.ts', './PlatformBridge.ts', './CombatRenderer.ts', './CocosInputAdapter.ts', './HUDController.ts', './ObjectRenderer.ts', './AudioBridge.ts', './ViewportLayout.ts', './ComicAssets.ts', './ComicLevelRenderer.ts', './ComicPose.ts', './ComicEquipment.ts', './DirectFrames.ts'], function (exports) {
  var _inherits, _createSuper, _classCallCheck, _defineProperty, _assertThisInitialized, _createClass, _objectSpread2, _toConsumableArray, _slicedToArray, _createForOfIteratorHelper, _asyncToGenerator, _regeneratorRuntime, cclegacy, _decorator, view, ResolutionPolicy, game, profiler, Canvas, Camera, Layers, Color, UITransform, Component, GameConfig, InputManager, GameSession, node, Ink, StickmanRenderer, LevelRenderer, PlatformBridge, CombatRenderer, CocosInputAdapter, HUDController, ObjectRenderer, AudioBridge, viewportLayout, ComicAssets, ComicLevelRenderer, comicPose, comicEquipment, DirectClips;
  return {
    setters: [function (module) {
      _inherits = module.inherits;
      _createSuper = module.createSuper;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _assertThisInitialized = module.assertThisInitialized;
      _createClass = module.createClass;
      _objectSpread2 = module.objectSpread2;
      _toConsumableArray = module.toConsumableArray;
      _slicedToArray = module.slicedToArray;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
      _asyncToGenerator = module.asyncToGenerator;
      _regeneratorRuntime = module.regeneratorRuntime;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      view = module.view;
      ResolutionPolicy = module.ResolutionPolicy;
      game = module.game;
      profiler = module.profiler;
      Canvas = module.Canvas;
      Camera = module.Camera;
      Layers = module.Layers;
      Color = module.Color;
      UITransform = module.UITransform;
      Component = module.Component;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      InputManager = module.InputManager;
    }, function (module) {
      GameSession = module.GameSession;
    }, function (module) {
      node = module.node;
      Ink = module.Ink;
    }, function (module) {
      StickmanRenderer = module.StickmanRenderer;
    }, function (module) {
      LevelRenderer = module.LevelRenderer;
    }, function (module) {
      PlatformBridge = module.PlatformBridge;
    }, function (module) {
      CombatRenderer = module.CombatRenderer;
    }, function (module) {
      CocosInputAdapter = module.CocosInputAdapter;
    }, function (module) {
      HUDController = module.HUDController;
    }, function (module) {
      ObjectRenderer = module.ObjectRenderer;
    }, function (module) {
      AudioBridge = module.AudioBridge;
    }, function (module) {
      viewportLayout = module.viewportLayout;
    }, function (module) {
      ComicAssets = module.ComicAssets;
    }, function (module) {
      ComicLevelRenderer = module.ComicLevelRenderer;
    }, function (module) {
      comicPose = module.comicPose;
    }, function (module) {
      comicEquipment = module.comicEquipment;
    }, function (module) {
      DirectClips = module.DirectClips;
    }],
    execute: function () {
      var _dec, _class;
      cclegacy._RF.push({}, "b4669UY3DhKvLhbKoPGtQ8Q", "GameManager", undefined);
      var ccclass = _decorator.ccclass;
      var GameManager = exports('GameManager', (_dec = ccclass("GameManager"), _dec(_class = /*#__PURE__*/function (_Component) {
        _inherits(GameManager, _Component);
        var _super = _createSuper(GameManager);
        function GameManager() {
          var _this;
          _classCallCheck(this, GameManager);
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _super.call.apply(_super, [this].concat(args));
          _defineProperty(_assertThisInitialized(_this), "controls", new InputManager());
          _defineProperty(_assertThisInitialized(_this), "session", new GameSession());
          _defineProperty(_assertThisInitialized(_this), "platform", new PlatformBridge());
          _defineProperty(_assertThisInitialized(_this), "adapter", void 0);
          _defineProperty(_assertThisInitialized(_this), "hud", void 0);
          _defineProperty(_assertThisInitialized(_this), "actors", void 0);
          _defineProperty(_assertThisInitialized(_this), "effects", void 0);
          _defineProperty(_assertThisInitialized(_this), "map", void 0);
          _defineProperty(_assertThisInitialized(_this), "objects", void 0);
          _defineProperty(_assertThisInitialized(_this), "world", void 0);
          _defineProperty(_assertThisInitialized(_this), "audio", void 0);
          _defineProperty(_assertThisInitialized(_this), "renderer", new StickmanRenderer());
          _defineProperty(_assertThisInitialized(_this), "combatRenderer", new CombatRenderer());
          _defineProperty(_assertThisInitialized(_this), "accumulator", 0);
          _defineProperty(_assertThisInitialized(_this), "ready", false);
          _defineProperty(_assertThisInitialized(_this), "lastState", _this.session.state);
          _defineProperty(_assertThisInitialized(_this), "frameWidth", 0);
          _defineProperty(_assertThisInitialized(_this), "frameHeight", 0);
          _defineProperty(_assertThisInitialized(_this), "board", void 0);
          _defineProperty(_assertThisInitialized(_this), "canvasNode", void 0);
          _defineProperty(_assertThisInitialized(_this), "camera", void 0);
          _defineProperty(_assertThisInitialized(_this), "portrait", false);
          _defineProperty(_assertThisInitialized(_this), "orientationPaused", false);
          _defineProperty(_assertThisInitialized(_this), "display", viewportLayout(GameConfig.width, GameConfig.height));
          return _this;
        }
        _createClass(GameManager, [{
          key: "onLoad",
          value: function onLoad() {
            void this.boot();
          }
        }, {
          key: "boot",
          value: function () {
            var _boot = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    _context.prev = 0;
                    _context.next = 3;
                    return ComicAssets.load();
                  case 3:
                    this.session.weapon.canPresent = function (id) {
                      return !ComicAssets.enabled || ComicAssets.has("weapon.".concat(id)) && (id !== "knife" && id !== "rocket" || Object.entries(DirectClips).filter(function (_ref) {
                        var _ref2 = _slicedToArray(_ref, 1),
                          clip = _ref2[0];
                        return clip.startsWith(id + ".");
                      }).every(function (_ref3) {
                        var _ref4 = _slicedToArray(_ref3, 2),
                          frames = _ref4[1];
                        return frames.every(function (frame) {
                          return ComicAssets.has(frame);
                        });
                      }));
                    };
                    this.initialize();
                    this.ready = true;
                    console.info("[Breakout] V0.5.7 ready; complete supplied knife/rocket actions and native modular terrain.");
                    _context.next = 13;
                    break;
                  case 9:
                    _context.prev = 9;
                    _context.t0 = _context["catch"](0);
                    console.error("[Breakout] Initialization failed", _context.t0);
                    throw _context.t0;
                  case 13:
                  case "end":
                    return _context.stop();
                }
              }, _callee, this, [[0, 9]]);
            }));
            function boot() {
              return _boot.apply(this, arguments);
            }
            return boot;
          }()
        }, {
          key: "initialize",
          value: function initialize() {
            var _this2 = this;
            view.resizeWithBrowserSize(true);
            view.setDesignResolutionSize(GameConfig.width, GameConfig.height, ResolutionPolicy.FIXED_HEIGHT);
            game.frameRate = GameConfig.fps;
            profiler.hideStats();
            var canvasNode = node(this.node, "Canvas", 0, 0, GameConfig.width, GameConfig.height),
              canvas = canvasNode.addComponent(Canvas);
            var cameraNode = node(canvasNode, "Camera");
            cameraNode.setPosition(0, 0, 1000);
            var camera = cameraNode.addComponent(Camera);
            camera.projection = Camera.ProjectionType.ORTHO;
            camera.orthoHeight = GameConfig.height / 2;
            camera.visibility = Layers.Enum.UI_2D;
            camera.clearColor = new Color(250, 249, 245);
            camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
            canvas.cameraComponent = camera;
            this.canvasNode = canvasNode;
            this.camera = camera;
            var board = node(canvasNode, "Screen", -GameConfig.width / 2, -GameConfig.height / 2, GameConfig.width, GameConfig.height);
            board.getComponent(UITransform).setAnchorPoint(0, 0);
            this.board = board;
            this.world = node(board, "World presentation");
            this.map = ComicAssets.enabled ? new ComicLevelRenderer(this.world, this.session.level) : new LevelRenderer(this.world, this.session.level);
            this.objects = new ObjectRenderer(this.world);
            this.actors = new Ink(node(this.world, "Stickmen"));
            this.effects = new Ink(node(this.world, "Combat effects"));
            this.audio = new AudioBridge(this.node);
            void this.audio.load();
            this.adapter = new CocosInputAdapter(this.controls, function () {
              return _this2.enter();
            });
            this.hud = new HUDController(board, this.adapter, function () {
              return _this2.startRun();
            }, function () {
              return _this2.togglePause();
            }, function () {
              return _this2.resume();
            }, function () {
              return _this2.home();
            }, function () {
              _this2.audio.muted = !_this2.audio.muted;
            }, this.platform.adapter);
            this.platform.install(function () {
              _this2.orientationPaused = false;
              _this2.adapter.hidden();
              _this2.session.pause();
              _this2.accumulator = 0;
            }, function () {
              return _objectSpread2(_objectSpread2({}, _this2.session.snapshot()), {}, {
                playerShots: _this2.session.weapon.shots,
                audio: _this2.audio.status(),
                art: {
                  requested: GameConfig.artStyle,
                  active: ComicAssets.enabled ? "comic" : "legacy",
                  loaded: ComicAssets.ready,
                  error: ComicAssets.error,
                  playerFrame: comicPose(_this2.session.player),
                  equipment: comicEquipment(_this2.session.player),
                  renderedPlayer: _this2.renderer.playerStatus(),
                  hudWeapon: _this2.hud.weaponStatus(),
                  combat: _this2.combatRenderer.status(),
                  terrain: "native-v057"
                },
                visibleChunks: _this2.map.visibleChunks,
                platform: _this2.platform.adapter.status(),
                display: _objectSpread2(_objectSpread2({}, _this2.display), {}, {
                  combatZoom: _this2.session.camera.zoom,
                  worldVisibleWidth: _this2.session.camera.visibleWidth,
                  cameraY: _this2.session.camera.y,
                  frameWidth: _this2.frameWidth,
                  frameHeight: _this2.frameHeight,
                  orientationPaused: _this2.orientationPaused
                }),
                controls: {
                  shootHeld: _this2.controls.isHeld("shoot"),
                  hudHeight: _this2.adapter.touch.hudHeight,
                  stick: {
                    x: _this2.controls.joystick.x,
                    y: _this2.controls.joystick.y,
                    axis: _this2.controls.joystick.axis,
                    vertical: _this2.controls.joystick.vertical,
                    owner: _this2.controls.joystick.owner
                  },
                  layout: _this2.hud.layout,
                  floating: {
                    originX: _this2.adapter.touch.originX,
                    originY: _this2.adapter.touch.originY,
                    baseX: _this2.adapter.touch.baseX,
                    baseY: _this2.adapter.touch.baseY,
                    owners: _toConsumableArray(_this2.adapter.touch.owners).map(function (_ref5) {
                      var _ref6 = _slicedToArray(_ref5, 2),
                        id = _ref6[0],
                        o = _ref6[1];
                      return {
                        id: id,
                        role: o.role
                      };
                    })
                  }
                }
              });
            });
          }
        }, {
          key: "enter",
          value: function enter() {
            if (this.portrait) return;
            if (this.session.state === "title" || this.session.state === "gameover" || this.session.state === "complete") this.startRun();else if (this.session.state === "paused") this.resume();
          }
        }, {
          key: "startRun",
          value: function startRun() {
            if (this.portrait) return;
            this.adapter.clear();
            this.accumulator = 0;
            this.session.reset();
            console.info("[Breakout] New run: Abandoned Base.");
          }
        }, {
          key: "home",
          value: function home() {
            this.adapter.clear();
            this.accumulator = 0;
            this.session.reset("title");
          }
        }, {
          key: "resume",
          value: function resume() {
            if (this.portrait) return;
            this.adapter.clear();
            this.accumulator = 0;
            this.session.resume();
          }
        }, {
          key: "togglePause",
          value: function togglePause() {
            if (this.portrait) return;
            if (this.session.state === "paused") this.resume();else {
              this.session.pause();
              this.adapter.clear();
              this.accumulator = 0;
            }
          }
        }, {
          key: "update",
          value: function update(dt) {
            if (!this.ready) return;
            var frame = this.platform.adapter.frame();
            var engineFrame = view.getFrameSize();
            if (frame.width !== engineFrame.width || frame.height !== engineFrame.height) view.setFrameSize(frame.width, frame.height);
            if (frame.width !== this.frameWidth || frame.height !== this.frameHeight) {
              this.frameWidth = frame.width;
              this.frameHeight = frame.height;
              this.display = viewportLayout(frame.width, frame.height);
              var _this$display = this.display,
                width = _this$display.width,
                height = _this$display.height,
                portrait = _this$display.portrait,
                zoom = _this$display.zoom;
              view.setDesignResolutionSize(width, height, portrait ? ResolutionPolicy.FIXED_WIDTH : ResolutionPolicy.FIXED_HEIGHT);
              this.canvasNode.getComponent(UITransform).setContentSize(width, height);
              this.camera.orthoHeight = height / 2;
              this.board.setPosition(-width / 2, -height / 2);
              this.board.getComponent(UITransform).setContentSize(width, height);
              this.session.camera.visibleWidth = width / zoom;
              this.session.camera.zoom = zoom;
              this.world.setScale(zoom, zoom, 1);
              this.hud.applyInsets(this.platform.safeInsets(width, height), width, height);
              if (portrait !== this.portrait) this.adapter.hidden();
              if (portrait && !this.portrait) {
                this.orientationPaused = this.session.state === "playing" || this.session.state === "dying";
                this.session.pause();
              } else if (!portrait && this.portrait && this.orientationPaused) {
                this.session.resume();
                this.orientationPaused = false;
              }
              this.portrait = portrait;
              this.world.active = !portrait;
              this.accumulator = 0;
            }
            if (this.portrait) {
              this.adapter.hidden();
              this.hud.update(this.session, this.controls, true);
              return;
            }
            if (this.controls.consumePause()) this.togglePause();
            if (this.session.hitStop > 0 && (this.session.state === "playing" || this.session.state === "dying")) {
              this.session.hitStop = Math.max(0, this.session.hitStop - dt);
              this.accumulator = 0;
            } else if (this.session.state === "playing" || this.session.state === "dying") {
              this.accumulator += Math.min(GameConfig.maxFrameDelta, Math.max(0, dt));
              while (this.accumulator >= GameConfig.fixedStep) {
                this.session.update(GameConfig.fixedStep, this.controls.consume());
                this.accumulator -= GameConfig.fixedStep;
              }
            } else this.accumulator = 0;
            var s = this.session;
            var targetZoom = s.level.arenaEntered ? Math.min(this.display.zoom, this.display.width / 1250) : this.display.zoom;
            s.camera.zoom += (targetZoom - s.camera.zoom) * (1 - Math.exp(-Math.min(dt, 0.1) * 4));
            s.camera.visibleWidth = this.display.width / s.camera.zoom;
            this.world.setScale(s.camera.zoom, s.camera.zoom, 1);
            var shake = s.shakeTime > 0 ? s.shakePower * Math.min(1, s.shakeTime / 0.12) : 0;
            this.world.setPosition(Math.sin(s.time * 103) * shake,
            // Keep the ground above the thumb controls even when the boss view pulls back.
            Math.cos(s.time * 119) * shake * 0.6 + 260 - (150 + s.camera.y) * s.camera.zoom);
            this.audio.update(s);
            this.map.update(s.camera.x, s.level.guardDefeated, s.camera.visibleWidth);
            this.objects.draw(s);
            this.actors.clear();
            this.renderer.begin(this.actors);
            var _iterator = _createForOfIteratorHelper(s.spawner.enemies),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var e = _step.value;
                if (e.x > s.camera.x - 100 && e.x < s.camera.x + s.camera.visibleWidth + 100 && e.deadTime < (e.kind === "guard" || e.kind === "colossus" ? 2.6 : GameConfig.rendering.corpseDuration)) this.renderer.draw(this.actors, e, s.camera.x);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.renderer.draw(this.actors, s.player, s.camera.x);
            this.renderer.end();
            this.combatRenderer.draw(this.effects, s);
            this.hud.update(s, this.controls, view.getFrameSize().height > view.getFrameSize().width);
            if (s.state !== this.lastState) {
              console.info("[Breakout] ".concat(this.lastState, " \u2192 ").concat(s.state));
              this.lastState = s.state;
            }
          }
        }, {
          key: "onDestroy",
          value: function onDestroy() {
            var _this$adapter, _this$audio;
            (_this$adapter = this.adapter) === null || _this$adapter === void 0 || _this$adapter.destroy();
            this.platform.destroy();
            (_this$audio = this.audio) === null || _this$audio === void 0 || _this$audio.destroy();
          }
        }]);
        return GameManager;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameSession.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts', './PlayerController.ts', './LevelController.ts', './CameraFollow.ts', './EnemySpawner.ts', './ParticlePool.ts', './ProjectileManager.ts', './WeaponSystem.ts', './ExplosionSystem.ts', './GrenadeSystem.ts', './PickupSystem.ts', './ColossusBoss.ts', './MeleeSystem.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _objectSpread2, cclegacy, GameConfig, clamp, PlayerController, LevelController, CameraFollow, EnemySpawner, ParticlePool, ProjectileManager, WeaponSystem, ExplosionSystem, GrenadeSystem, PickupSystem, ColossusBoss, MeleeSystem;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
      _objectSpread2 = module.objectSpread2;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      clamp = module.clamp;
    }, function (module) {
      PlayerController = module.PlayerController;
    }, function (module) {
      LevelController = module.LevelController;
    }, function (module) {
      CameraFollow = module.CameraFollow;
    }, function (module) {
      EnemySpawner = module.EnemySpawner;
    }, function (module) {
      ParticlePool = module.ParticlePool;
    }, function (module) {
      ProjectileManager = module.ProjectileManager;
    }, function (module) {
      WeaponSystem = module.WeaponSystem;
    }, function (module) {
      ExplosionSystem = module.ExplosionSystem;
    }, function (module) {
      GrenadeSystem = module.GrenadeSystem;
    }, function (module) {
      PickupSystem = module.PickupSystem;
    }, function (module) {
      ColossusBoss = module.ColossusBoss;
    }, function (module) {
      MeleeSystem = module.MeleeSystem;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b16efgJYJ2n40Av2yujA+rP", "GameSession", undefined);

      /** Session owns simulation order; no engine or browser dependencies. */
      var GameSession = exports('GameSession', /*#__PURE__*/function () {
        function GameSession(data) {
          _classCallCheck(this, GameSession);
          _defineProperty(this, "state", "title");
          _defineProperty(this, "player", new PlayerController());
          _defineProperty(this, "level", void 0);
          _defineProperty(this, "camera", new CameraFollow());
          _defineProperty(this, "spawner", new EnemySpawner());
          _defineProperty(this, "particles", new ParticlePool());
          _defineProperty(this, "projectiles", new ProjectileManager(this.particles));
          _defineProperty(this, "weapon", new WeaponSystem());
          _defineProperty(this, "melee", new MeleeSystem());
          _defineProperty(this, "explosions", new ExplosionSystem());
          _defineProperty(this, "grenades", new GrenadeSystem());
          _defineProperty(this, "pickups", new PickupSystem());
          _defineProperty(this, "combo", 0);
          _defineProperty(this, "comboTime", 0);
          _defineProperty(this, "bestCombo", 0);
          _defineProperty(this, "lastKills", 0);
          _defineProperty(this, "dropSeed", 1);
          _defineProperty(this, "shakeTime", 0);
          _defineProperty(this, "shakePower", 0);
          _defineProperty(this, "hitStop", 0);
          _defineProperty(this, "time", 0);
          _defineProperty(this, "hitFlash", 0);
          _defineProperty(this, "resumeState", "playing");
          _defineProperty(this, "bossDeathStarted", false);
          _defineProperty(this, "introEffectPlayed", false);
          _defineProperty(this, "stompSerial", 0);
          _defineProperty(this, "weaponRevision", 0);
          this.player.bindWeapon(this.weapon);
          this.level = new LevelController(data);
          this.reset("title");
        }
        _createClass(GameSession, [{
          key: "reset",
          value: function reset() {
            var _this = this;
            var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "playing";
            this.state = state;
            this.time = 0;
            this.hitFlash = 0;
            this.level.reset();
            this.player.reset(this.level.data.spawn.x, this.level.data.spawn.y);
            this.player.throwTime = 0;
            this.camera.reset();
            this.spawner.reset(this.level.data.enemies);
            this.particles.reset();
            this.projectiles.reset();
            this.weapon.reset();
            this.weaponRevision = this.weapon.revision;
            this.melee.reset();
            this.player.meleeTime = 0;
            this.explosions.reset();
            this.grenades.reset();
            this.pickups.reset();
            this.combo = this.bestCombo = this.lastKills = 0;
            this.comboTime = 0;
            this.dropSeed = 1;
            this.shakeTime = this.shakePower = this.hitStop = 0;
            this.bossDeathStarted = false;
            this.introEffectPlayed = false;
            this.stompSerial = 0;
            this.projectiles.onExplosion = function (x, y, radius, damage, owner, style) {
              return _this.explosions.enqueue(x, y, radius, damage, owner, style);
            };
            this.level.objects.onHit = function (o, destroyed) {
              return _this.objectHit(o, destroyed);
            };
          }
        }, {
          key: "pause",
          value: function pause() {
            if (this.state === "playing" || this.state === "dying") {
              this.resumeState = this.state;
              this.state = "paused";
            }
          }
        }, {
          key: "resume",
          value: function resume() {
            if (this.state === "paused") this.state = this.resumeState;
          }
        }, {
          key: "update",
          value: function update(dt, input) {
            var _this2 = this;
            if (this.state !== "playing" && this.state !== "dying") return;
            if (this.state === "playing" && input.switchWeapon) this.weapon.toggleKnife();
            if (this.state === "playing" && input.melee && this.weapon.id !== "knife") this.weapon.equip("knife");
            if (this.weaponRevision !== this.weapon.revision) {
              this.melee.cancel(this.player);
              this.weaponRevision = this.weapon.revision;
            }
            this.time += dt;
            this.player.throwTime = Math.max(0, this.player.throwTime - dt);
            this.explosions.advance(dt);
            this.shakeTime = Math.max(0, this.shakeTime - dt);
            this.comboTime = Math.max(0, this.comboTime - dt);
            if (this.comboTime === 0) this.combo = 0;
            this.hitFlash = Math.max(0, this.hitFlash - dt);
            var health = this.player.health;
            this.level.updateWorld(dt, this.player, this.spawner.enemies);
            var grounded = this.player.grounded;
            var jumpSerial = this.player.jumpSerial;
            this.level.objects.update(dt, this.level.staticSolids);
            this.level.objects.flushHits();
            this.level.refreshSolids();
            this.player.update(dt, input, this.level);
            if (this.player.jumpSerial !== jumpSerial && this.player.jumpCount === 2) for (var _n = 0; _n < 7; _n++) this.particles.emit(this.player.x + (_n - 3) * 5, this.player.y + 3, "dust", (_n - 3) * 45, -25);
            if (!grounded && this.player.grounded) {
              for (var i = 0; i < 5; i++) this.particles.emit(this.player.x + (i - 2) * 5, this.player.y, "dust", (i - 2) * 30, 30);
            }
            this.weapon.update(dt);
            var oldMeleeHits = this.melee.hits;
            var slashing = this.melee.update(dt, this.player, this.spawner.enemies, this.level.solids, this.state === "playing" && input.shoot, this.state === "playing" && !!input.melee, this.particles, this.level, this.level.objects.objects);
            if (this.melee.hits > oldMeleeHits) {
              this.hitStop = this.melee.stage === 3 ? .065 : .04;
              this.shakePower = this.melee.stage === 3 ? 6 : 3.5;
              this.shakeTime = this.melee.stage === 3 ? .16 : .10;
            }
            if (this.state === "playing" && input.shoot && this.player.alive && !slashing) this.weapon.fire(this.player, this.projectiles, "player");
            if (input.grenade && this.state === "playing") this.grenades["throw"](this.player);
            this.grenades.update(dt, this.level, this.explosions);
            var _iterator = _createForOfIteratorHelper(this.spawner.enemies),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var enemy = _step.value;
                enemy.update(dt, this.player, this.level, this.projectiles);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            var finalBoss = this.spawner.guard;
            if (finalBoss instanceof ColossusBoss) {
              if (finalBoss.mode === "entering" && !this.introEffectPlayed) {
                this.introEffectPlayed = true;
                this.shakeTime = 0.3;
                this.shakePower = 3;
              }
              if (finalBoss.impactSerial !== this.stompSerial) {
                this.stompSerial = finalBoss.impactSerial;
                this.shakeTime = 0.22;
                this.shakePower = 5;
                this.hitStop = 0.035;
              }
            }
            this.projectiles.update(dt, this.player, this.spawner.enemies, this.level.solids, function (target) {
              if ("state" in target) {
                _this2.hitStop = Math.max(_this2.hitStop, 0.024);
                _this2.shakePower = Math.max(_this2.shakePower, 2.2);
                _this2.shakeTime = Math.max(_this2.shakeTime, 0.09);
              }
            }, this.level.objects.objects);
            this.level.objects.flushHits();
            var _iterator2 = _createForOfIteratorHelper(this.spawner.enemies),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _e = _step2.value;
                if (!_e.alive && (_e.kind === "turret" || _e.kind === "guard" && _e !== this.spawner.guard) && !_e.deathEffectPlayed) {
                  _e.deathEffectPlayed = true;
                  this.explosions.enqueue(_e.x, _e.y + 35, 85, 0, "player");
                  if (_e.kind === "guard") {
                    this.pickups.spawn(_e.x - 90, _e.y + 25, "health");
                    this.pickups.spawn(_e.x - 130, _e.y + 30, "rocket");
                  }
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            this.explosions.flush(function (x, y, radius, damage, owner) {
              return _this2.applyBlast(x, y, radius, damage, owner);
            });
            this.explosions.update(dt);
            this.level.refreshSolids();
            this.pickups.update(dt, this.player, this.weapon, this.level.solids);
            if (this.weaponRevision !== this.weapon.revision) {
              this.melee.cancel(this.player);
              this.weaponRevision = this.weapon.revision;
            }
            var kills = this.spawner.kills;
            if (kills > this.lastKills) {
              this.combo += kills - this.lastKills;
              this.comboTime = 3;
              this.bestCombo = Math.max(this.bestCombo, this.combo);
              this.lastKills = kills;
            }
            this.particles.update(dt);
            if (this.player.health < health) this.hitFlash = 0.15;
            if (!this.spawner.guard.alive && !this.bossDeathStarted) {
              this.bossDeathStarted = true;
              if (this.level.data.arena) {
                for (var _n2 = 0; _n2 < 5; _n2++) this.explosions.enqueue(this.spawner.guard.x + (_n2 - 2) * 35, this.spawner.guard.y + 35 + _n2 % 3 * 70, 130, 0, "player");
                var _iterator3 = _createForOfIteratorHelper(this.projectiles.items),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var p = _step3.value;
                    if (p.owner === "enemy") p.active = false;
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
                var _iterator4 = _createForOfIteratorHelper(this.spawner.enemies),
                  _step4;
                try {
                  for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                    var e = _step4.value;
                    if (e.alive && e.id.startsWith("reinforce")) e.takeDamage(999, 1, "explosion");
                  }
                } catch (err) {
                  _iterator4.e(err);
                } finally {
                  _iterator4.f();
                }
              }
            }
            this.level.guardDefeated = !this.spawner.guard.alive && (!this.level.data.arena || this.spawner.guard.deadTime > 1.6);
            if (!this.player.alive) {
              this.state = "dying";
              if (this.player.deadTime >= GameConfig.player.deathDuration) this.state = "gameover";
            } else if (this.level.reachedExit(this.player.x)) this.state = "complete";
            this.camera.update(this.player.x, dt, this.level.data.width, this.player.facing, this.player.y, this.level.arenaEntered && this.level.data.arena ? this.level.data.arena.start - this.camera.visibleWidth * 0.25 : undefined);
          }
        }, {
          key: "snapshot",
          value: function snapshot() {
            var _this$level$data$zone,
              _this3 = this;
            return {
              state: this.state,
              time: this.time,
              player: {
                x: this.player.x,
                y: this.player.y,
                vx: this.player.vx,
                vy: this.player.vy,
                health: this.player.health,
                grounded: this.player.grounded,
                facing: this.player.facing,
                animation: this.player.animation,
                crouched: this.player.crouched,
                aimPitch: this.player.aimPitch,
                airJumpsRemaining: this.player.airJumpsRemaining,
                jumpCount: this.player.jumpCount,
                canJump: this.player.canJump
              },
              cameraX: this.camera.x,
              kills: this.spawner.kills,
              melee: {
                swings: this.melee.swings,
                hits: this.melee.hits,
                time: this.melee.time,
                stage: this.melee.stage,
                state: this.melee.state,
                action: this.melee.action,
                stance: this.melee.stance,
                comboRemaining: this.melee.comboRemaining,
                heavyHits: this.melee.heavyHits,
                blockedHits: this.melee.blockedHits
              },
              weapon: this.weapon.id,
              weaponPresentation: this.weapon.presentation,
              weaponShot: {
                x: this.weapon.flashX,
                y: this.weapon.flashY,
                pitch: this.weapon.flashPitch,
                flash: this.weapon.flash
              },
              playerWeapon: this.player.weaponId,
              ammo: this.weapon.ammo,
              grenades: this.player.grenades,
              grenadesThrown: this.grenades.thrown,
              destroyedObjects: this.level.objects.destroyed,
              explosions: this.explosions.total,
              feedback: {
                shakeTime: this.shakeTime,
                shakePower: this.shakePower,
                hitStop: this.hitStop,
                blasts: this.explosions.items.filter(function (b) {
                  return b.active;
                }).map(function (b) {
                  return {
                    x: b.x,
                    y: b.y,
                    age: b.age,
                    radius: b.radius,
                    style: b.style
                  };
                }),
                particles: this.particles.items.filter(function (p) {
                  return p.active;
                }).map(function (p) {
                  return {
                    kind: p.kind,
                    material: p.material
                  };
                }),
                peakParticles: this.particles.peak,
                droppedParticles: this.particles.dropped
              },
              combo: this.combo,
              bestCombo: this.bestCombo,
              objects: this.level.objects.objects.map(function (o) {
                return {
                  id: o.id,
                  kind: o.kind,
                  x: o.x,
                  y: o.y,
                  w: o.w,
                  h: o.h,
                  health: o.health,
                  alive: o.alive,
                  solid: o.solid,
                  triggered: o.triggered
                };
              }),
              pickups: this.pickups.items.filter(function (p) {
                return p.active;
              }).map(function (p) {
                return {
                  kind: p.kind,
                  x: p.x,
                  y: p.y
                };
              }),
              projectileStates: this.projectiles.items.filter(function (p) {
                return p.active;
              }).map(function (p) {
                var _p$target;
                return {
                  owner: p.owner,
                  kind: p.kind,
                  x: p.x,
                  y: p.y,
                  vx: p.vx,
                  vy: p.vy,
                  homing: p.homing,
                  locked: !!((_p$target = p.target) !== null && _p$target !== void 0 && _p$target.alive),
                  age: p.age
                };
              }),
              remaining: this.spawner.remaining,
              guardHealth: this.spawner.guard.health,
              boss: {
                kind: this.spawner.guard.kind,
                name: this.spawner.guard.kind === "colossus" ? "重装裁决者" : "履带战车",
                attack: this.spawner.guard instanceof ColossusBoss ? this.spawner.guard.attack : "salvo",
                introTime: this.spawner.guard instanceof ColossusBoss ? this.spawner.guard.introTime : 0,
                phase: this.spawner.guard.phase,
                active: this.spawner.guard.active,
                mode: this.spawner.guard.mode,
                warningX: this.spawner.guard.warningX,
                warningTime: this.spawner.guard.warningTime,
                windup: this.spawner.guard.windup,
                summons: this.spawner.guard.summons
              },
              miniBoss: this.spawner.miniBoss ? {
                x: this.spawner.miniBoss.x,
                health: this.spawner.miniBoss.health,
                maxHealth: this.spawner.miniBoss.maxHealth,
                active: this.spawner.miniBoss.active,
                phase: this.spawner.miniBoss.phase,
                warningX: this.spawner.miniBoss.warningX,
                warningTime: this.spawner.miniBoss.warningTime
              } : null,
              levelWidth: this.level.data.width,
              exitX: this.level.data.exit.x,
              arenaEntered: this.level.arenaEntered,
              zones: ((_this$level$data$zone = this.level.data.zones) !== null && _this$level$data$zone !== void 0 ? _this$level$data$zone : []).map(function (z) {
                return _objectSpread2(_objectSpread2({}, z), {}, {
                  cleared: _this3.level.clearedZones.has(z.id)
                });
              }),
              mechanisms: this.level.mechanisms.map(function (m) {
                return {
                  id: m.data.id,
                  kind: m.data.kind,
                  x: m.rect.x,
                  y: m.rect.y,
                  w: m.rect.w,
                  h: m.rect.h,
                  released: m.released,
                  landed: m.landed
                };
              }),
              terrain: this.level.solids.map(function (r) {
                return {
                  x: r.x,
                  y: r.y,
                  w: r.w,
                  h: r.h,
                  kind: r.kind,
                  slope: r.slope,
                  entityId: r.entityId
                };
              }),
              exitOpen: this.level.guardDefeated,
              bullets: this.projectiles.items.filter(function (p) {
                return p.active;
              }).length,
              shots: this.projectiles.fired,
              hits: this.projectiles.hits,
              peakBullets: this.projectiles.peak,
              droppedBullets: this.projectiles.dropped,
              enemies: this.spawner.enemies.map(function (e) {
                return {
                  id: e.id,
                  x: e.x,
                  y: e.y,
                  health: e.health,
                  state: e.state,
                  kind: e.kind,
                  shield: e.shieldHealth,
                  windup: e.windup,
                  action: e.action
                };
              })
            };
          }
        }, {
          key: "objectHit",
          value: function objectHit(o, destroyed) {
            this.particles.burst(o.x + o.w / 2, o.y + o.h / 2, destroyed ? 16 : 5, o.kind === "wood" || o.kind === "hanging" ? "wood" : "spark");
            if (o.kind === "wood" || o.kind === "hanging") {
              var _iterator5 = _createForOfIteratorHelper(this.particles.items),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var p = _step5.value;
                  if (p.active && p.kind === "wood" && p.x === o.x + o.w / 2 && p.y === o.y + o.h / 2) p.vx = o.hitDirection * (80 + Math.abs(p.vx) * 0.8);
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
            }
            if (destroyed) {
              if (o.kind === "barrel") this.explosions.schedule(o.x + o.w / 2, o.y + o.h / 2, 155, 7, "neutral");
              if (o.data.drop) {
                var _o$data$dropChance;
                this.dropSeed = this.dropSeed * 1664525 + 1013904223 >>> 0;
                if (this.dropSeed / 4294967296 < ((_o$data$dropChance = o.data.dropChance) !== null && _o$data$dropChance !== void 0 ? _o$data$dropChance : 0.65)) this.pickups.spawn(o.x + o.w / 2, o.y + 25, o.data.drop);
              }
            } else if (o.kind === "hanging" && o.triggered && !o.falling) this.explosions.enqueue(o.x + o.w / 2, o.y, 80, 5, "neutral");
          }
        }, {
          key: "applyBlast",
          value: function applyBlast(x, y, radius, damage, owner) {
            this.particles.blast(x, y, radius, this.level.groundY(x));
            this.shakeTime = Math.max(this.shakeTime, 0.28);
            this.shakePower = Math.max(this.shakePower, 7);
            this.hitStop = Math.max(this.hitStop, 0.05);
            if (damage === 0) return;
            var hit = function hit(target, amount) {
              if (!target.alive) return false;
              var r = target.bounds,
                dx = x - clamp(x, r.x, r.x + r.w),
                dy = y - clamp(y, r.y, r.y + r.h),
                distance = Math.hypot(dx, dy);
              return distance <= radius && target.takeDamage(amount * (1 - 0.35 * distance / radius), r.x + r.w / 2 >= x ? 1 : -1, "explosion");
            };
            if (owner !== "player") hit(this.player, owner === "enemy" ? damage : 1);
            if (owner !== "enemy") {
              var _iterator6 = _createForOfIteratorHelper(this.spawner.enemies),
                _step6;
              try {
                for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                  var e = _step6.value;
                  if (hit(e, damage * (damage >= 9 && (e.kind === "guard" || e.kind === "turret" || e.kind === "colossus") ? 1.5 : 1))) {
                    e.vx = (e.x > x ? 1 : -1) * 250;
                    e.vy = 380;
                    e.grounded = false;
                  }
                }
              } catch (err) {
                _iterator6.e(err);
              } finally {
                _iterator6.f();
              }
            }
            var _iterator7 = _createForOfIteratorHelper(this.level.objects.objects),
              _step7;
            try {
              for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                var o = _step7.value;
                hit(o, damage);
              }
            } catch (err) {
              _iterator7.e(err);
            } finally {
              _iterator7.f();
            }
            this.level.objects.flushHits();
          }
        }]);
        return GameSession;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GrenadeSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, GameConfig, surfaceY;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      surfaceY = module.surfaceY;
    }],
    execute: function () {
      cclegacy._RF.push({}, "04390MeeTO/+lsfCruu8TY5", "GrenadeSystem", undefined);
      var GrenadeSystem = exports('GrenadeSystem', /*#__PURE__*/function () {
        function GrenadeSystem() {
          _classCallCheck(this, GrenadeSystem);
          _defineProperty(this, "items", Array.from({
            length: 8
          }, function () {
            return {
              active: false,
              x: 0,
              y: 0,
              vx: 0,
              vy: 0,
              fuse: 0,
              spin: 0
            };
          }));
          _defineProperty(this, "cooldown", 0);
          _defineProperty(this, "thrown", 0);
        }
        _createClass(GrenadeSystem, [{
          key: "reset",
          value: function reset() {
            var _iterator = _createForOfIteratorHelper(this.items),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var g = _step.value;
                g.active = false;
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.cooldown = this.thrown = 0;
          }
        }, {
          key: "throw",
          value: function _throw(player) {
            if (this.cooldown > 0 || player.grenades <= 0 || !player.alive) return false;
            var g = this.items.find(function (g) {
              return !g.active;
            });
            if (!g) return false;
            Object.assign(g, {
              active: true,
              x: player.x + player.facing * 20,
              y: player.y + 44,
              vx: player.facing * GameConfig.grenade.speed,
              vy: GameConfig.grenade.upward,
              fuse: GameConfig.grenade.fuse,
              spin: 0
            });
            player.grenades--;
            player.throwTime = 0.24;
            this.thrown++;
            this.cooldown = GameConfig.grenade.interval;
            return true;
          }
        }, {
          key: "update",
          value: function update(dt, level, explosions) {
            this.cooldown = Math.max(0, this.cooldown - dt);
            var _iterator2 = _createForOfIteratorHelper(this.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var g = _step2.value;
                if (!g.active) continue;
                g.fuse -= dt;
                g.spin += dt * 9;
                if (g.fuse <= 0) {
                  g.active = false;
                  explosions.enqueue(g.x, g.y, GameConfig.grenade.radius, GameConfig.grenade.damage, "player", "grenade");
                  continue;
                }
                var oldX = g.x,
                  oldY = g.y;
                g.vy -= GameConfig.grenade.gravity * dt;
                g.x += g.vx * dt;
                g.y += g.vy * dt;
                var _iterator3 = _createForOfIteratorHelper(level.solids),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var r = _step3.value;
                    if (g.x + 5 > r.x && g.x - 5 < r.x + r.w && oldY - 5 >= surfaceY(r, oldX) - 0.01 && g.y - 5 <= surfaceY(r, g.x)) {
                      g.y = surfaceY(r, g.x) + 5;
                      var slope = r.slope ? (r.slope.right - r.slope.left) / r.w : 0;
                      var normalSpeed = (g.vy - slope * g.vx) / (1 + slope * slope);
                      if (normalSpeed < 0) {
                        g.vx += 1.3 * normalSpeed * slope;
                        g.vy -= 1.3 * normalSpeed;
                      }
                      g.vx *= 0.65;
                    } else if (!r.slope && g.y + 5 > r.y && g.y - 5 < r.y + r.h && (oldX + 5 <= r.x && g.x + 5 >= r.x || oldX - 5 >= r.x + r.w && g.x - 5 <= r.x + r.w)) {
                      g.x = oldX;
                      g.vx *= -0.35;
                    }
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }]);
        return GrenadeSystem;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HUDController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Ink.ts', './StickmanRenderer.ts', './JoystickView.ts', './ControlLayout.ts', './PlatformAdapter.ts', './WeaponArt.ts', './ComicAssets.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _slicedToArray, cclegacy, UITransform, Sprite, Color, Label, view, GameConfig, node, Ink, colors, StickmanRenderer, JoystickView, controlLayout, PlatformAdapter, WeaponArt, ComicAssets, ComicBatch;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
      _slicedToArray = module.slicedToArray;
    }, function (module) {
      cclegacy = module.cclegacy;
      UITransform = module.UITransform;
      Sprite = module.Sprite;
      Color = module.Color;
      Label = module.Label;
      view = module.view;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      node = module.node;
      Ink = module.Ink;
      colors = module.colors;
    }, function (module) {
      StickmanRenderer = module.StickmanRenderer;
    }, function (module) {
      JoystickView = module.JoystickView;
    }, function (module) {
      controlLayout = module.controlLayout;
    }, function (module) {
      PlatformAdapter = module.PlatformAdapter;
    }, function (module) {
      WeaponArt = module.WeaponArt;
    }, function (module) {
      ComicAssets = module.ComicAssets;
      ComicBatch = module.ComicBatch;
    }],
    execute: function () {
      cclegacy._RF.push({}, "57cedYylhxGlVuP7wp2UQhx", "HUDController", undefined);
      function text(parent, s, x, y) {
        var size = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 22;
        var color = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : colors.ink;
        var w = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 600;
        var n = node(parent, "Text:".concat(s), x, y, w, size * 1.6),
          l = n.addComponent(Label);
        l.string = s;
        l.fontSize = size;
        l.lineHeight = size * 1.3;
        l.fontFamily = "sans-serif";
        l.color = color;
        l.overflow = Label.Overflow.SHRINK;
        return l;
      }
      function createButton(parent, title, x, y, w, h, onClick) {
        var dark = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
        var adapter = arguments.length > 8 ? arguments[8] : undefined;
        var n = node(parent, title, x, y, w, h),
          ink = new Ink(n);
        ink.rect(-w / 2, -h / 2, w, h, colors.ink, dark ? colors.ink : colors.paper, 4);
        text(n, title, 0, 0, 22, dark ? colors.paper : colors.ink, w - 12);
        adapter === null || adapter === void 0 || adapter.registerUI(n, onClick);
        return n;
      }

      /** Persistent UI nodes; panels toggle instead of being recreated every frame/restart. */
      var HUDController = exports('HUDController', /*#__PURE__*/function () {
        function HUDController(parent, adapter, onStart, onPause, onResume, onHome) {
          var _this = this;
          var onMute = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : function () {};
          var platform = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : new PlatformAdapter();
          _classCallCheck(this, HUDController);
          _defineProperty(this, "hud", void 0);
          _defineProperty(this, "hudInk", void 0);
          _defineProperty(this, "controls", void 0);
          _defineProperty(this, "objective", void 0);
          _defineProperty(this, "stats", void 0);
          _defineProperty(this, "guardLabel", void 0);
          _defineProperty(this, "guardInk", void 0);
          _defineProperty(this, "guardNode", void 0);
          _defineProperty(this, "panels", new Map());
          _defineProperty(this, "resultStats", []);
          _defineProperty(this, "touchButtons", []);
          _defineProperty(this, "lastState", null);
          _defineProperty(this, "lastHealth", -1);
          _defineProperty(this, "lastExit", false);
          _defineProperty(this, "progress", -1);
          _defineProperty(this, "rotateNote", void 0);
          _defineProperty(this, "rotateInk", void 0);
          _defineProperty(this, "rotateTitle", void 0);
          _defineProperty(this, "rotateSub", void 0);
          _defineProperty(this, "panelInk", new Map());
          _defineProperty(this, "levelLabel", void 0);
          _defineProperty(this, "width", 1280);
          _defineProperty(this, "height", 720);
          _defineProperty(this, "insets", {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          });
          _defineProperty(this, "joystick", void 0);
          _defineProperty(this, "weaponLabel", void 0);
          _defineProperty(this, "weaponIcon", void 0);
          _defineProperty(this, "weaponToggle", void 0);
          _defineProperty(this, "weaponArt", new WeaponArt());
          _defineProperty(this, "comicWeapon", void 0);
          _defineProperty(this, "lastWeapon", "");
          _defineProperty(this, "message", void 0);
          _defineProperty(this, "layout", controlLayout());
          _defineProperty(this, "pauseButton", void 0);
          _defineProperty(this, "platformTools", void 0);
          _defineProperty(this, "platformHint", void 0);
          this.adapter = adapter;
          var button = function button(p, title, x, y, w, h, fn) {
            var dark = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
            return createButton(p, title, x, y, w, h, fn, dark, adapter);
          };
          this.hud = node(parent, "HUD");
          this.hudInk = new Ink(this.hud);
          this.levelLabel = text(this.hud, "废弃前哨站", 995, 678, 34, colors.ink, 350);
          this.pauseButton = node(this.hud, "Pause", 1214, 666, 88, 88);
          var pauseArt = new Ink(this.pauseButton);
          pauseArt.g.roundRect(-42, -42, 84, 84, 12);
          pauseArt.g.fillColor = colors.paper;
          pauseArt.g.fill();
          pauseArt.g.strokeColor = colors.ink;
          pauseArt.g.lineWidth = 5;
          pauseArt.g.stroke();
          pauseArt.rect(-14, -17, 9, 34, colors.ink, colors.ink, 1);
          pauseArt.rect(5, -17, 9, 34, colors.ink, colors.ink, 1);
          adapter.registerUI(this.pauseButton, onPause);
          this.objective = text(this.hud, "向右推进 · 击败出口守卫", 920, 590, 26, colors.ink, 620);
          this.stats = text(this.hud, "", 170, 590, 26, colors.ink, 320);
          this.weaponLabel = text(this.hud, "", 300, 640, 32, colors.ink, 570);
          this.weaponIcon = new Ink(node(this.hud, "Current weapon silhouette"));
          this.weaponToggle = node(this.hud, "Switch tactical knife", 210, 640, 220, 64);
          adapter.registerUI(this.weaponToggle, function () {
            if (!_this.controls.active) return;
            adapter.state.press("tap:weapon", "switchWeapon");
            adapter.state.release("tap:weapon");
          });
          this.message = text(parent, "", 640, 534, 30, colors.ink, 750);
          this.guardNode = node(parent, "Guard health");
          this.guardInk = new Ink(this.guardNode);
          this.guardLabel = text(this.guardNode, "出口守卫", 640, 595, 28, colors.ink, 350);
          this.controls = node(parent, "Touch controls");
          this.joystick = new JoystickView(this.controls, adapter);
          var touch = function touch(action, x, y, r) {
            var n = node(_this.controls, "Touch:".concat(action), x, y, r * 2 + 12, r * 2 + 12),
              ink = new Ink(n);
            adapter.bindButton(n, action);
            _this.touchButtons.push({
              action: action,
              ink: ink,
              held: false,
              key: "",
              cooldownInk: new Ink(node(n, "Cooldown arc")),
              cooldownBucket: -1
            });
            _this.paintTouch(ink, action, false);
          };
          touch("jump", this.layout.jump.x, this.layout.jump.y, 70);
          touch("shoot", this.layout.shoot.x, this.layout.shoot.y, 84);
          touch("grenade", this.layout.grenade.x, this.layout.grenade.y, 54);
          var panel = function panel(state) {
            var n = node(parent, "Panel:".concat(state), 640, 360, GameConfig.width, GameConfig.height),
              ink = new Ink(n);
            ink.rect(-640, -360, 1280, 720, new Color(250, 249, 245, 236), new Color(250, 249, 245, 236), 1);
            n.active = false;
            _this.panels.set(state, n);
            _this.panelInk.set(state, ink);
            return n;
          };
          var title = panel("title"),
            art = new Ink(node(title, "Title stickman"));
          art.line([{
            x: -486,
            y: -167
          }, {
            x: -213,
            y: -167
          }], 3);
          var hero = node(title, "Hero illustration", -380, -160);
          hero.setScale(2.7, 2.7, 1);
          new StickmanRenderer().draw(new Ink(hero), {
            x: 0,
            y: 0,
            facing: 1,
            animation: "Run",
            animationTime: 0.45,
            recoil: 0,
            deadTime: 0
          }, 0);
          art.line([{
            x: -245,
            y: -42
          }, {
            x: -221,
            y: -42
          }], 3);
          art.line([{
            x: -238,
            y: -65
          }, {
            x: -216,
            y: -65
          }], 2);
          art.line([{
            x: -445,
            y: -16
          }, {
            x: -465,
            y: -16
          }], 2, colors.muted);
          text(title, "STICKMAN BREAKOUT", -341, 155, 15, colors.muted, 450);
          text(title, "线条突围", 120, 122, 72, colors.ink, 660);
          text(title, "一根线，也能冲出包围。", 120, 46, 23, colors.muted, 640);
          text(title, "01 / 废弃前哨站", 116, -17, 18, colors.ink, 520);
          text(title, "击碎箱子，引爆油桶，冲出前哨站。", 122, -56, 18, colors.muted, 600);
          button(title, "开始突围  →", 120, -128, 300, 62, onStart, true);
          text(title, "A D 移动 · Space 二段跳 · J 普攻 · Q 切刀 / 回枪", 120, -204, 17, colors.muted, 760);
          text(title, "手机轻触武器栏切刀，长按普攻连斩 · L 拔刀攻击 · P 暂停", 120, -239, 14, colors.muted, 760);
          text(title, "V0.5.7  /  原图武器动作与新地形", -368, -270, 16, colors.muted, 390);
          var paused = panel("paused");
          text(paused, "暂停一下", 0, 103, 52);
          text(paused, "战场等你回来。", 0, 42, 20, colors.muted);
          button(paused, "继续突围", 0, -34, 280, 60, onResume, true);
          button(paused, "重新开始", -153, -122, 280, 56, onStart);
          button(paused, "返回首页", 153, -122, 280, 56, onHome);
          button(paused, "切换音效开关", 0, -204, 280, 48, onMute);
          text(paused, "P / Esc 继续", 0, -269, 15, colors.muted);
          var _iterator = _createForOfIteratorHelper(["gameover", "complete"]),
            _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var state = _step.value;
              var p = panel(state);
              text(p, state === "complete" ? "突围成功" : "突围失败", 0, 114, 58);
              text(p, state === "complete" ? "守卫已击败，出口已抵达。" : "倒下之后，还可以再来一次。", 0, 47, 22, colors.muted);
              this.resultStats.push(text(p, "", 0, -10, 18, colors.muted));
              button(p, "重新开始  →", 0, -89, 300, 62, onStart, true);
              button(p, "返回首页", 0, -167, 300, 54, onHome);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
          this.platformTools = node(parent, "Fullscreen and home screen tools");
          button(this.platformTools, "进入全屏", 140, 0, 200, 54, function () {
            void platform.enterFullscreen().then(function (result) {
              return _this.platformHint.string = result.message;
            });
          });
          button(this.platformTools, "主屏幕说明", -100, 0, 230, 54, function () {
            _this.platformHint.string = platform.status().mode === "standalone" ? "已独立运行；系统状态栏仍由系统管理。" : "iPhone/iPad：Safari 分享 → 添加到主屏幕 → 从游戏图标启动。";
          });
          this.platformHint = text(this.platformTools, platform.status().ios && platform.status().mode === "browser" ? "Safari：添加到主屏幕后可独立启动，移除浏览器工具栏。" : "支持的浏览器可进入全屏；主屏幕模式与普通网页不同。", 0, -52, 21, colors.muted, 1000);
          this.rotateNote = node(parent, "Rotate device hint");
          this.rotateInk = new Ink(this.rotateNote);
          this.rotateTitle = text(this.rotateNote, "请旋转设备\n横屏游玩", 360, 700, 54, colors.ink, 620);
          this.rotateTitle.node.getComponent(UITransform).setContentSize(620, 160);
          this.rotateSub = text(this.rotateNote, "战斗已暂停\n旋转后自动恢复", 360, 540, 30, colors.muted, 600);
          this.rotateSub.node.getComponent(UITransform).setContentSize(600, 100);
          this.applyInsets(this.insets);
        }
        _createClass(HUDController, [{
          key: "weaponStatus",
          value: function weaponStatus() {
            var _this$weaponIcon$node, _this$weaponIcon$node2;
            return {
              text: this.weaponLabel.string,
              id: this.lastWeapon,
              frame: (_this$weaponIcon$node = (_this$weaponIcon$node2 = this.weaponIcon.node.getComponentInChildren(Sprite)) === null || _this$weaponIcon$node2 === void 0 || (_this$weaponIcon$node2 = _this$weaponIcon$node2.spriteFrame) === null || _this$weaponIcon$node2 === void 0 ? void 0 : _this$weaponIcon$node2.name) !== null && _this$weaponIcon$node !== void 0 ? _this$weaponIcon$node : "legacy",
              "switch": {
                x: this.weaponToggle.position.x,
                y: this.weaponToggle.position.y
              }
            };
          }
        }, {
          key: "paintTouch",
          value: function paintTouch(ink, action, held) {
            var disabled = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
            var count = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "";
            var knife = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
            ink.clear();
            var p = action === "shoot" ? this.layout.shoot : action === "grenade" ? this.layout.grenade : this.layout.jump,
              r = p.r,
              k = this.layout.joystick.unit,
              color = disabled ? colors.far : colors.paper;
            ink.circle(0, 0, r, disabled ? colors.mid : colors.ink, new Color(30, 30, 30, disabled ? 115 : held ? 245 : 210), (action === "shoot" ? 3 : 2.6) * k);
            ink.circle(0, 0, r - 5 * k, new Color(250, 249, 245, held ? 200 : 95), undefined, 1 * k);
            var q = r * 0.36;
            if (action === "shoot") {
              if (knife) {
                ink.line([{
                  x: -q,
                  y: -q * .5
                }, {
                  x: q,
                  y: q
                }, {
                  x: q * .5,
                  y: 0
                }, {
                  x: -q,
                  y: -q * .5
                }], 2.4 * k, color);
                ink.segment(-q * 1.1, -q * .7, -q * .5, -q * .1, 4 * k, color);
              } else {
                ink.circle(0, 5 * k, q, color, undefined, 2.2 * k);
                for (var _i = 0, _arr = [-1, 1]; _i < _arr.length; _i++) {
                  var d = _arr[_i];
                  ink.segment(d * q * 0.72, 5 * k, d * q * 1.55, 5 * k, 2.2 * k, color);
                  ink.segment(0, 5 * k + d * q * 0.72, 0, 5 * k + d * q * 1.55, 2.2 * k, color);
                }
                ink.circle(0, 5 * k, 2 * k, color, color, 1);
              }
            } else if (action === "jump") {
              ink.line([{
                x: 0,
                y: -q * 0.7
              }, {
                x: 0,
                y: q
              }, {
                x: -q * 0.65,
                y: q * 0.3
              }], 3 * k, color);
              ink.segment(0, q, q * 0.65, q * 0.3, 3 * k, color);
            } else {
              ink.ellipse(0, -q * 0.1, q * 0.7, q * 0.85, color, undefined, 2.8 * k);
              ink.line([{
                x: -q * 0.2,
                y: q * 0.65
              }, {
                x: -q * 0.2,
                y: q * 1.15
              }, {
                x: q * 0.28,
                y: q * 1.15
              }, {
                x: q * 0.28,
                y: q * 0.65
              }], 2.3 * k, color);
              ink.segment(q * 0.28, q * 1.12, q * 0.9, q * 1.4, 2.3 * k, color);
            }
            var label = ink.node.getComponentInChildren(Label);
            if (!label) label = text(ink.node, "", 0, -r * 0.56, 13 * k, color, r * 1.7);
            label.string = action === "shoot" ? knife ? "斩击" : "普攻" : action === "grenade" ? "\u96F7 ".concat(count) : "跳跃";
            label.fontSize = (action === "shoot" ? 15 : 13) * k;
            label.lineHeight = 16 * k;
            label.color = color;
            label.node.setPosition(0, -r * 0.55);
            label.node.getComponent(UITransform).setContentSize(r * 1.7, 22 * k);
          }
        }, {
          key: "applyInsets",
          value: function applyInsets(insets) {
            var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1280;
            var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 720;
            this.width = width;
            this.height = height;
            this.insets = insets;
            this.layout = controlLayout(insets, width, height, view.getFrameSize().height);
            this.adapter.touch.configure(width, height, this.layout, insets);
            this.joystick.configure(this.layout.joystick);
            this.joystick.node.setPosition(this.layout.joystick.x, this.layout.joystick.y);
            var _iterator2 = _createForOfIteratorHelper(this.touchButtons),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var b = _step2.value;
                var p = b.action === "jump" ? this.layout.jump : b.action === "shoot" ? this.layout.shoot : this.layout.grenade;
                b.ink.node.setPosition(p.x, p.y);
                b.ink.node.getComponent(UITransform).setContentSize(p.hit, p.hit);
                b.key = "";
                b.cooldownBucket = -1;
                this.paintTouch(b.ink, b.action, false);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            this.pauseButton.setPosition(this.layout.pause.x, this.layout.pause.y);
            this.pauseButton.setScale(this.layout.pause.hit / 88, this.layout.pause.hit / 88, 1);
            var top = height - insets.top;
            var k = this.layout.joystick.unit;
            this.adapter.touch.hudHeight = 52 * k;
            this.platformTools.setPosition(width / 2, top - 44);
            this.platformTools.setScale(Math.max(1, 44 * k / 54), Math.max(1, 44 * k / 54), 1);
            this.weaponIcon.node.setPosition(161 * k + insets.left, top - 22 * k);
            this.weaponToggle.setPosition(210 * k + insets.left, top - 25 * k);
            this.weaponToggle.getComponent(UITransform).setContentSize(220 * k, 64 * k);
            this.weaponIcon.node.setScale(1.3 * k, 1.3 * k, 1);
            this.weaponLabel.node.setPosition(280 * k + insets.left, top - 25 * k);
            this.weaponLabel.fontSize = 14 * k;
            this.weaponLabel.lineHeight = 18 * k;
            this.weaponLabel.node.getComponent(UITransform).setContentSize(142 * k, 42 * k);
            this.levelLabel.node.setPosition(width - 125 * k - insets.right, top - 18 * k);
            this.levelLabel.fontSize = 14 * k;
            this.levelLabel.lineHeight = 18 * k;
            this.levelLabel.node.getComponent(UITransform).setContentSize(132 * k, 26 * k);
            this.objective.node.setPosition(width * 0.6, top - 25 * k);
            this.objective.fontSize = 12 * k;
            this.objective.lineHeight = 16 * k;
            this.objective.node.getComponent(UITransform).setContentSize(180 * k, 25 * k);
            this.stats.node.active = false;
            this.message.node.setPosition(width / 2, top - 63 * k);
            this.message.fontSize = 13 * k;
            this.message.lineHeight = 17 * k;
            this.message.node.getComponent(UITransform).setContentSize(Math.min(width - 40 * k, 600 * k), 30 * k);
            this.guardNode.setPosition(width / 2 - 640, top - 70 * k - 565);
            this.guardLabel.node.setPosition(640, 565);
            this.guardLabel.fontSize = 16 * k;
            this.guardLabel.lineHeight = 20 * k;
            this.guardLabel.node.getComponent(UITransform).setContentSize(380 * k, 30 * k);
            var _iterator3 = _createForOfIteratorHelper(this.panels),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var _step3$value = _slicedToArray(_step3.value, 2),
                  state = _step3$value[0],
                  _p = _step3$value[1];
                _p.setPosition(width / 2, height / 2);
                var ink = this.panelInk.get(state);
                ink.clear();
                ink.rect(-width / 2, -height / 2, width, height, colors.paper, colors.paper, 1);
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            this.rotateNote.getComponent(UITransform).setContentSize(width, height);
            this.rotateNote.getComponent(UITransform).setAnchorPoint(0, 0);
            this.rotateInk.clear();
            this.rotateInk.rect(0, 0, width, height, colors.paper, colors.paper, 1);
            var cx = width / 2,
              cy = height / 2;
            this.rotateInk.rect(cx - 52, cy + 170, 104, 170, colors.ink, undefined, 7);
            this.rotateInk.line([{
              x: cx + 84,
              y: cy + 292
            }, {
              x: cx + 124,
              y: cy + 240
            }, {
              x: cx + 84,
              y: cy + 208
            }], 7);
            this.rotateTitle.node.setPosition(cx, cy + 30);
            this.rotateSub.node.setPosition(cx, cy - 140);
            this.lastHealth = this.progress = -1;
          }
        }, {
          key: "update",
          value: function update(s, input, portrait) {
            var _s$spawner$miniBoss, _zone$name;
            this.hud.active = s.state === "playing" || s.state === "dying" || s.state === "paused";
            this.controls.active = s.state === "playing" && !portrait;
            this.adapter.touch.enabled = this.controls.active;
            var presentation = s.weapon.presentation;
            this.weaponLabel.string = "".concat(presentation.name, "\n").concat(presentation.ammoText).concat(s.weapon.id === "knife" ? "" : " · 切刀");
            if (this.lastWeapon !== s.weapon.id) {
              this.weaponIcon.clear();
              if (ComicAssets.enabled) {
                var _this$comicWeapon;
                (_this$comicWeapon = this.comicWeapon) !== null && _this$comicWeapon !== void 0 ? _this$comicWeapon : this.comicWeapon = new ComicBatch(this.weaponIcon.node, "HUD weapon");
                this.comicWeapon.begin();
                this.comicWeapon.put(presentation.icon, -5, 0, 52, undefined, 0, 255, 1, [.5, .5]);
                this.comicWeapon.end();
              } else this.weaponArt.draw(this.weaponIcon, s.weapon.id, 0, 0);
              this.lastWeapon = s.weapon.id;
            }
            this.levelLabel.string = "\u5173\u5361 01 \xB7 ".concat(Math.floor(s.player.x / s.level.data.width * 100), "%");
            this.objective.node.active = this.width / this.layout.joystick.unit >= 800 && !s.level.arenaEntered;
            this.message.node.active = s.state === "playing" && !s.level.arenaEntered && (s.pickups.messageTime > 0 || s.combo > 1);
            this.message.string = s.pickups.messageTime > 0 ? s.pickups.lastMessage : "COMBO \xD7 ".concat(s.combo);
            this.joystick.update(input);
            this.rotateNote.active = portrait;
            this.platformTools.active = !portrait && (s.state === "title" || s.state === "paused");
            if (portrait) {
              this.hud.active = this.guardNode.active = this.message.node.active = false;
              var _iterator4 = _createForOfIteratorHelper(this.panels.values()),
                _step4;
              try {
                for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                  var p = _step4.value;
                  p.active = false;
                }
              } catch (err) {
                _iterator4.e(err);
              } finally {
                _iterator4.f();
              }
              this.lastState = null;
              return;
            }
            var encounter = s.spawner.guard.active && s.spawner.guard.alive ? s.spawner.guard : (_s$spawner$miniBoss = s.spawner.miniBoss) !== null && _s$spawner$miniBoss !== void 0 && _s$spawner$miniBoss.active && s.spawner.miniBoss.alive ? s.spawner.miniBoss : null;
            this.guardNode.active = s.state === "playing" && !!encounter;
            if (this.guardNode.active) {
              this.guardInk.clear();
              var bw = 320 * this.layout.joystick.unit;
              this.guardInk.rect(640 - bw / 2, 539, bw, 7 * this.layout.joystick.unit, colors.ink, colors.paper, 2);
              this.guardInk.rect(640 - bw / 2, 539, bw * encounter.health / encounter.maxHealth, 7 * this.layout.joystick.unit, colors.ink, colors.ink, 1);
              var name = encounter.kind === "colossus" ? "重装裁决者" : "巡逻战车 · 小 BOSS";
              this.guardLabel.string = "".concat(name, " \xB7 \u9636\u6BB5 ").concat(encounter.phase, "  ").concat(Math.ceil(encounter.health), " / ").concat(encounter.maxHealth);
            }
            if (this.lastState !== s.state) {
              var _iterator5 = _createForOfIteratorHelper(this.panels),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var _step5$value = _slicedToArray(_step5.value, 2),
                    state = _step5$value[0],
                    _p2 = _step5$value[1];
                  _p2.active = state === s.state;
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
              this.lastState = s.state;
            }
            var progress = Math.floor(s.player.x / s.level.data.width * this.width);
            if (this.lastHealth !== s.player.health || this.progress !== progress) {
              this.hudInk.clear();
              var top = this.height - this.insets.top;
              var k = this.layout.joystick.unit;
              this.hudInk.rect(0, top - 52 * k, this.width, 52 * k, colors.far, colors.paper, 2);
              for (var i = 0; i < GameConfig.player.maxHealth; i++) {
                var x = (24 + i * 20) * k + this.insets.left,
                  y = top - 26 * k;
                var g = this.hudInk.g;
                g.moveTo(x, y - 8 * k);
                g.bezierCurveTo(x - 18 * k, y + 4 * k, x - 7 * k, y + 16 * k, x, y + 7 * k);
                g.bezierCurveTo(x + 7 * k, y + 16 * k, x + 18 * k, y + 4 * k, x, y - 8 * k);
                g.close();
                g.fillColor = i < s.player.health ? colors.ink : colors.paper;
                g.fill();
                g.strokeColor = colors.ink;
                g.lineWidth = 1.5 * k;
                g.stroke();
              }
              var trackX = this.width - this.insets.right - 182 * k,
                trackY = top - 37 * k;
              this.hudInk.segment(trackX, trackY, trackX + 112 * k, trackY, 3 * k, colors.far);
              this.hudInk.segment(trackX, trackY, trackX + 112 * k * progress / this.width, trackY, 3 * k);
              for (var n = 0; n < 4; n++) this.hudInk.circle(trackX + n * 112 * k / 3, trackY, 2.5 * k, colors.ink, n / 3 <= progress / this.width ? colors.ink : colors.paper, 1.3 * k);
              this.lastHealth = s.player.health;
              this.progress = progress;
            }
            var zone = s.level.zone;
            this.objective.string = s.level.guardDefeated ? "裁决者已击毁 · 抵达出口 →" : s.level.arenaEntered ? s.spawner.guard.mode === "entering" ? "警报 · 重装裁决者启动" : s.spawner.guard.action === "stomp" ? "重踏预警 · 跳过地波" : s.spawner.guard.action === "sweep" ? "锁定炮击 · 及时换位" : "齐射预警 · 离开落点" : "".concat((_zone$name = zone === null || zone === void 0 ? void 0 : zone.name) !== null && _zone$name !== void 0 ? _zone$name : "向右推进", " \xB7 \u5411\u53F3\u7A81\u56F4 \u2192");
            this.stats.string = "\u51FB\u8D25  ".concat(s.spawner.kills, " / ").concat(s.spawner.enemies.length);
            var _iterator6 = _createForOfIteratorHelper(this.resultStats),
              _step6;
            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                var stat = _step6.value;
                stat.string = "\u8017\u65F6 ".concat(Math.floor(s.time), " \u79D2    \xB7    \u51FB\u8D25 ").concat(s.spawner.kills, " \u540D\u654C\u4EBA");
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }
            var _iterator7 = _createForOfIteratorHelper(this.touchButtons),
              _step7;
            try {
              for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                var b = _step7.value;
                var held = input.isHeld(b.action);
                var disabled = b.action === "grenade" ? s.player.grenades === 0 : b.action === "jump" ? !s.player.canJump : !s.player.alive;
                var cooldown = b.action === "grenade" ? s.grenades.cooldown / GameConfig.grenade.interval : b.action === "shoot" ? Math.min(1, s.weapon.cooldown / (s.weapon.id === "knife" ? GameConfig.melee.combo[Math.max(0, s.melee.stage - 1)].duration + (s.melee.stage === 3 ? .14 : 0) : GameConfig.weapons[s.weapon.id].interval)) : 0;
                var key = "".concat(held, ":").concat(disabled, ":").concat(s.weapon.id, ":").concat(b.action === "grenade" ? s.player.grenades : "");
                if (key !== b.key) {
                  this.paintTouch(b.ink, b.action, held, disabled, String(s.player.grenades), s.weapon.id === "knife");
                  b.held = held;
                  b.key = key;
                }
                var bucket = Math.ceil(cooldown * 3);
                if (bucket !== b.cooldownBucket) {
                  b.cooldownInk.clear();
                  if (bucket > 0) {
                    var r = b.action === "shoot" ? this.layout.shoot.r : this.layout.grenade.r,
                      _g = b.cooldownInk.g,
                      _k = this.layout.joystick.unit;
                    _g.lineWidth = 3 * _k;
                    _g.strokeColor = colors.mid;
                    _g.arc(0, 0, r - 5 * _k, Math.PI / 2, Math.PI / 2 - Math.PI * 2 * bucket / 3, true);
                    _g.stroke();
                  }
                  b.cooldownBucket = bucket;
                }
              }
            } catch (err) {
              _iterator7.e(err);
            } finally {
              _iterator7.f();
            }
          }
        }]);
        return HUDController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Ink.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, Color, Node, Layers, UITransform, Graphics;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Node = module.Node;
      Layers = module.Layers;
      UITransform = module.UITransform;
      Graphics = module.Graphics;
    }],
    execute: function () {
      exports('node', node);
      cclegacy._RF.push({}, "e6427oaZAwRO82nR7A3zU/v", "Ink", undefined);
      var colors = exports('colors', {
        ink: new Color(24, 24, 24),
        paper: new Color(250, 249, 245),
        muted: new Color(126, 126, 122),
        mid: new Color(175, 175, 168),
        wall: new Color(237, 237, 231),
        far: new Color(215, 215, 209),
        white: new Color(255, 255, 255)
      });
      function node(parent, name) {
        var x = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var y = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var w = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
        var h = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 1;
        var n = new Node(name);
        n.layer = Layers.Enum.UI_2D;
        n.parent = parent;
        n.setPosition(x, y);
        n.addComponent(UITransform).setContentSize(w, h);
        return n;
      }
      var Ink = exports('Ink', /*#__PURE__*/function () {
        function Ink(node) {
          _classCallCheck(this, Ink);
          _defineProperty(this, "g", void 0);
          /** Per-layer style, never a global multiplier for both foreground and scenery. */
          _defineProperty(this, "strokeScale", 1);
          this.node = node;
          this.g = node.addComponent(Graphics);
          this.g.lineCap = Graphics.LineCap.ROUND;
          this.g.lineJoin = Graphics.LineJoin.ROUND;
        }
        _createClass(Ink, [{
          key: "clear",
          value: function clear() {
            this.g.clear();
          }
        }, {
          key: "segment",
          value: function segment(x1, y1, x2, y2) {
            var width = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 3;
            var color = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : colors.ink;
            this.g.strokeColor = color;
            this.g.lineWidth = width * this.strokeScale;
            this.g.moveTo(x1, y1);
            this.g.lineTo(x2, y2);
            this.g.stroke();
          }
        }, {
          key: "ellipse",
          value: function ellipse(x, y, rx, ry) {
            var stroke = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : colors.ink;
            var fill = arguments.length > 5 ? arguments[5] : undefined;
            var width = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 2;
            this.g.strokeColor = stroke;
            this.g.lineWidth = width * this.strokeScale;
            this.g.ellipse(x, y, rx, ry);
            if (fill) {
              this.g.fillColor = fill;
              this.g.fill();
            }
            this.g.stroke();
          }
        }, {
          key: "polygon",
          value: function polygon(points) {
            var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : colors.ink;
            if (points.length < 3) return;
            this.g.fillColor = color;
            this.g.moveTo(points[0].x, points[0].y);
            for (var i = 1; i < points.length; i++) this.g.lineTo(points[i].x, points[i].y);
            this.g.close();
            this.g.fill();
          }
        }, {
          key: "line",
          value: function line(points) {
            var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;
            var color = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : colors.ink;
            if (points.length < 2) return;
            this.g.strokeColor = color;
            this.g.lineWidth = width * this.strokeScale;
            this.g.moveTo(points[0].x, points[0].y);
            for (var i = 1; i < points.length; i++) this.g.lineTo(points[i].x, points[i].y);
            this.g.stroke();
          }
        }, {
          key: "rect",
          value: function rect(x, y, w, h) {
            var stroke = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : colors.ink;
            var fill = arguments.length > 5 ? arguments[5] : undefined;
            var width = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 2;
            this.g.lineWidth = width * this.strokeScale;
            this.g.strokeColor = stroke;
            this.g.rect(x, y, w, h);
            if (fill) {
              this.g.fillColor = fill;
              this.g.fill();
            }
            this.g.stroke();
          }
        }, {
          key: "circle",
          value: function circle(x, y, r) {
            var stroke = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : colors.ink;
            var fill = arguments.length > 4 ? arguments[4] : undefined;
            var width = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 3;
            this.g.strokeColor = stroke;
            this.g.lineWidth = width * this.strokeScale;
            this.g.circle(x, y, r);
            if (fill) {
              this.g.fillColor = fill;
              this.g.fill();
            }
            this.g.stroke();
          }
        }]);
        return Ink;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/InputManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './VirtualJoystick.ts', './GameConfig.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, VirtualJoystick, GameConfig;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      VirtualJoystick = module.VirtualJoystick;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      cclegacy._RF.push({}, "4f72bUOSdHuOY8ko2oq7Sdv", "InputManager", undefined);

      /** Device independent. Multiple keyboard keys and touch IDs can hold an action. */
      var InputManager = exports('InputManager', /*#__PURE__*/function () {
        function InputManager() {
          _classCallCheck(this, InputManager);
          _defineProperty(this, "held", new Map());
          _defineProperty(this, "jumpQueued", false);
          _defineProperty(this, "pauseQueued", false);
          _defineProperty(this, "grenadeQueued", false);
          _defineProperty(this, "shootQueued", false);
          _defineProperty(this, "meleeQueued", false);
          _defineProperty(this, "switchQueued", false);
          _defineProperty(this, "joystick", new VirtualJoystick());
          _defineProperty(this, "frame", {
            axis: 0,
            jump: false,
            shoot: false,
            jumpHeld: false,
            crouch: false,
            aimY: 0,
            grenade: false
          });
        }
        _createClass(InputManager, [{
          key: "press",
          value: function press(source, action) {
            if (this.held.has(source)) return;
            this.held.set(source, action);
            if (action === "jump") this.jumpQueued = true;
            if (action === "pause") this.pauseQueued = true;
            if (action === "grenade") this.grenadeQueued = true;
            if (action === "shoot") this.shootQueued = true;
            if (action === "melee") this.meleeQueued = true;
            if (action === "switchWeapon") this.switchQueued = true;
          }
        }, {
          key: "release",
          value: function release(source) {
            this.held["delete"](source);
          }
        }, {
          key: "isHeld",
          value: function isHeld(action) {
            var _iterator = _createForOfIteratorHelper(this.held.values()),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var held = _step.value;
                if (held === action) return true;
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            return false;
          }
        }, {
          key: "consume",
          value: function consume() {
            var keyboard = Number(this.isHeld("right")) - Number(this.isHeld("left"));
            var frame = this.frame;
            frame.axis = keyboard || this.joystick.axis;
            frame.jump = this.jumpQueued;
            frame.shoot = this.isHeld("shoot") || this.shootQueued;
            frame.jumpHeld = this.isHeld("jump");
            frame.crouch = this.isHeld("crouch") || this.joystick.vertical < GameConfig.input.crouchThreshold;
            frame.aimY = this.isHeld("aimUp") || this.joystick.vertical > GameConfig.input.aimThreshold ? 1 : 0;
            frame.grenade = this.grenadeQueued;
            frame.melee = this.meleeQueued || this.isHeld("melee");
            frame.switchWeapon = this.switchQueued;
            this.switchQueued = false;
            this.meleeQueued = false;
            this.jumpQueued = false;
            this.grenadeQueued = false;
            this.shootQueued = false;
            return frame;
          }
        }, {
          key: "consumePause",
          value: function consumePause() {
            var p = this.pauseQueued;
            this.pauseQueued = false;
            return p;
          }
        }, {
          key: "clear",
          value: function clear() {
            this.switchQueued = false;
            this.meleeQueued = false;
            this.held.clear();
            this.jumpQueued = false;
            this.pauseQueued = false;
            this.grenadeQueued = false;
            this.shootQueued = false;
            this.joystick.reset();
          }
        }]);
        return InputManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/JoystickView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts', './ControlLayout.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, Color, node, Ink, colors, controlLayout;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
    }, function (module) {
      node = module.node;
      Ink = module.Ink;
      colors = module.colors;
    }, function (module) {
      controlLayout = module.controlLayout;
    }],
    execute: function () {
      cclegacy._RF.push({}, "cc96dLMjMj8ozKsDa3wzzYZ", "JoystickView", undefined);
      var JoystickView = exports('JoystickView', /*#__PURE__*/function () {
        function JoystickView(parent, adapter) {
          _classCallCheck(this, JoystickView);
          _defineProperty(this, "node", void 0);
          _defineProperty(this, "ink", void 0);
          _defineProperty(this, "lastX", 999);
          _defineProperty(this, "lastY", 999);
          _defineProperty(this, "active", false);
          _defineProperty(this, "style", controlLayout().joystick);
          this.adapter = adapter;
          this.node = node(parent, "Virtual joystick", 158, 128, 224, 224);
          this.ink = new Ink(this.node);
          adapter.bindJoystick(this.node);
        }
        _createClass(JoystickView, [{
          key: "configure",
          value: function configure(style) {
            this.style = style;
            this.lastX = 999;
          }
        }, {
          key: "update",
          value: function update(input) {
            var s = input.joystick,
              active = s.owner !== null;
            this.node.setScale(1, 1, 1);
            this.node.setPosition(active ? this.adapter.touch.baseX : this.style.x, active ? this.adapter.touch.baseY : this.style.y);
            if (s.x === this.lastX && s.y === this.lastY && active === this.active) return;
            this.lastX = s.x;
            this.lastY = s.y;
            this.active = active;
            this.ink.clear();
            this.ink.circle(0, 0, this.style.baseR, new Color(25, 25, 25, active ? 245 : 185), new Color(223, 223, 220, active ? 140 : 65), 3 * this.style.unit);
            this.ink.circle(0, 0, this.style.baseR * 0.82, new Color(25, 25, 25, active ? 110 : 55), undefined, 1.2 * this.style.unit);
            for (var n = 0; n < 4; n++) {
              var angle = n * Math.PI / 2,
                cs = Math.cos(angle),
                sn = Math.sin(angle);
              var r = this.style.baseR * 0.75,
                q = this.style.unit * 6;
              this.ink.polygon([{
                x: (r + q) * cs,
                y: (r + q) * sn
              }, {
                x: (r - q) * cs - q * sn,
                y: (r - q) * sn + q * cs
              }, {
                x: (r - q) * cs + q * sn,
                y: (r - q) * sn - q * cs
              }], new Color(90, 90, 86, active ? 170 : 105));
            }
            this.ink.circle(s.x, s.y, this.style.knobR, colors.ink, new Color(35, 35, 35, active ? 245 : 210), 2.6 * this.style.unit);
            this.ink.circle(s.x, s.y, this.style.knobR * 0.7, new Color(250, 249, 245, active ? 190 : 110), undefined, 1.1 * this.style.unit);
            this.ink.segment(s.x - this.style.knobR * 0.35, s.y + this.style.knobR * 0.5, s.x + this.style.knobR * 0.1, s.y + this.style.knobR * 0.58, 2 * this.style.unit, new Color(255, 255, 255, active ? 185 : 100));
          }
        }]);
        return JoystickView;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './LevelData.ts', './Types.ts', './DestructibleManager.ts', './MechanismController.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _objectSpread2, cclegacy, AbandonedBase, surfaceY, DestructibleManager, MechanismController;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
      _objectSpread2 = module.objectSpread2;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      AbandonedBase = module.AbandonedBase;
    }, function (module) {
      surfaceY = module.surfaceY;
    }, function (module) {
      DestructibleManager = module.DestructibleManager;
    }, function (module) {
      MechanismController = module.MechanismController;
    }],
    execute: function () {
      cclegacy._RF.push({}, "0f849NFYsOErwds5S7GpI4u", "LevelController", undefined);
      /** Deterministic kinematic collisions, independent of Box2D and platform/browser APIs. */
      var LevelController = exports('LevelController', /*#__PURE__*/function () {
        function LevelController() {
          var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : AbandonedBase;
          _classCallCheck(this, LevelController);
          _defineProperty(this, "data", void 0);
          _defineProperty(this, "solids", []);
          _defineProperty(this, "staticSolids", []);
          _defineProperty(this, "objects", new DestructibleManager());
          _defineProperty(this, "objectRevision", -1);
          _defineProperty(this, "guardDefeated", false);
          _defineProperty(this, "arenaEntered", false);
          _defineProperty(this, "mechanisms", []);
          _defineProperty(this, "clearedZones", new Set());
          _defineProperty(this, "playerX", 0);
          this.data = data;
          this.reset();
        }
        _createClass(LevelController, [{
          key: "reset",
          value: function reset() {
            var _this$data$mechanisms;
            this.guardDefeated = false;
            this.arenaEntered = false;
            this.clearedZones.clear();
            this.mechanisms = ((_this$data$mechanisms = this.data.mechanisms) !== null && _this$data$mechanisms !== void 0 ? _this$data$mechanisms : []).map(function (d) {
              return new MechanismController(d);
            });
            this.playerX = this.data.spawn.x;
            this.staticSolids.length = 0;
            var _iterator = _createForOfIteratorHelper(this.data.solids),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var s = _step.value;
                if (s.kind !== "crate") this.staticSolids.push(_objectSpread2({}, s));
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.objects.reset(this.data.objects);
            this.objectRevision = -1;
            this.refreshSolids();
          }
        }, {
          key: "refreshSolids",
          value: function refreshSolids() {
            if (this.objectRevision === this.objects.revision) return;
            this.objectRevision = this.objects.revision;
            this.solids.length = 0;
            var _iterator2 = _createForOfIteratorHelper(this.staticSolids),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var s = _step2.value;
                this.solids.push(s);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            var _iterator3 = _createForOfIteratorHelper(this.objects.objects),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var o = _step3.value;
                if (o.solid) this.solids.push(Object.assign(o.bounds, {
                  kind: "crate",
                  entityId: o.id,
                  breakable: o.category !== "indestructible"
                }));
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            var _iterator4 = _createForOfIteratorHelper(this.mechanisms),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var m = _step4.value;
                this.solids.push(m.rect);
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
          }
        }, {
          key: "updateWorld",
          value: function updateWorld(dt, p, enemies) {
            var _this = this,
              _this$data$zones;
            var changed = false;
            var _iterator5 = _createForOfIteratorHelper(this.mechanisms),
              _step5;
            try {
              var _loop = function _loop() {
                var _this$objects$objects;
                var m = _step5.value;
                if (m.data.ropeId && !((_this$objects$objects = _this.objects.objects.find(function (o) {
                  return o.id === m.data.ropeId;
                })) !== null && _this$objects$objects !== void 0 && _this$objects$objects.alive)) m.released = true;
                var top = m.rect.y + m.rect.h,
                  delta = m.update(dt);
                if (delta !== 0) {
                  changed = true;
                  if (p.grounded && Math.abs(p.y - top) < 1 && p.x + 13 > m.rect.x && p.x - 13 < m.rect.x + m.rect.w) p.y += delta;
                }
              };
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                _loop();
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
            var _iterator6 = _createForOfIteratorHelper((_this$data$zones = this.data.zones) !== null && _this$data$zones !== void 0 ? _this$data$zones : []),
              _step6;
            try {
              var _loop2 = function _loop2() {
                var z = _step6.value;
                if (z.id === "D" || _this.clearedZones.has(z.id)) return 1; // continue
                if (!enemies.some(function (e) {
                  return e.alive && e.spawn.x >= z.start && e.spawn.x < z.end;
                })) {
                  _this.clearedZones.add(z.id);
                  changed = true;
                }
              };
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                if (_loop2()) continue;
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }
            this.playerX = p.x;
            // Clearance is optional. Enter by position; retreat never traps the player.
            // Hysteresis keeps the camera/encounter stable while moving across the entrance.
            this.arenaEntered = !!this.data.arena && p.x >= this.data.arena.start + (this.arenaEntered ? -80 : 30);
            if (changed) {
              this.objectRevision = -1;
              this.refreshSolids();
            }
          }
        }, {
          key: "zone",
          get: function get() {
            var _find,
              _this$data$zones2,
              _this2 = this;
            return (_find = ((_this$data$zones2 = this.data.zones) !== null && _this$data$zones2 !== void 0 ? _this$data$zones2 : []).find(function (z) {
              return _this2.playerX >= z.start && _this2.playerX < z.end;
            })) !== null && _find !== void 0 ? _find : null;
          }
        }, {
          key: "bounds",
          value: function bounds(body) {
            return {
              x: body.x - body.halfWidth,
              y: body.y,
              w: body.halfWidth * 2,
              h: body.height
            };
          }
        }, {
          key: "move",
          value: function move(body, dt) {
            var oldX = body.x,
              dx = body.vx * dt;
            var onTerrain = body.grounded && body.vy <= 0 && this.solids.some(function (s) {
              return s.slope && oldX >= s.x && oldX <= s.x + s.w && Math.abs(body.y - surfaceY(s, oldX)) < 0.6;
            });
            body.x += dx;
            var _iterator7 = _createForOfIteratorHelper(this.solids),
              _step7;
            try {
              for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                var s = _step7.value;
                // Shallow terraces snap while walking, but their vertical faces must
                // remain solid when an airborne body approaches below the top.
                if (s.oneWay || s.slope && (onTerrain || s.slope.left !== s.slope.right)) continue;
                if (body.y >= s.y + s.h - 0.01 || body.y + body.height <= s.y + 0.01) continue;
                if (s.slope) {
                  // Feet can overlap the lip before the body center crosses it. Resolve
                  // that partial overlap too; a swept-edge-only check misses this case.
                  if (dx > 0 && oldX < s.x && body.x + body.halfWidth >= s.x) {
                    body.x = Math.min(body.x, s.x - body.halfWidth);
                    body.vx = 0;
                  } else if (dx < 0 && oldX > s.x + s.w && body.x - body.halfWidth <= s.x + s.w) {
                    body.x = Math.max(body.x, s.x + s.w + body.halfWidth);
                    body.vx = 0;
                  }
                  continue;
                }
                if (dx > 0 && oldX + body.halfWidth <= s.x + 0.01 && body.x + body.halfWidth >= s.x) {
                  body.x = Math.min(body.x, s.x - body.halfWidth);
                  body.vx = 0;
                } else if (dx < 0 && oldX - body.halfWidth >= s.x + s.w - 0.01 && body.x - body.halfWidth <= s.x + s.w) {
                  body.x = Math.max(body.x, s.x + s.w + body.halfWidth);
                  body.vx = 0;
                }
              }
            } catch (err) {
              _iterator7.e(err);
            } finally {
              _iterator7.f();
            }
            var oldY = body.y,
              dy = body.vy * dt;
            body.y += dy;
            body.grounded = false;
            body.groundSlope = 0;
            var _iterator8 = _createForOfIteratorHelper(this.solids),
              _step8;
            try {
              for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                var _s = _step8.value;
                if (body.x + body.halfWidth <= _s.x || body.x - body.halfWidth >= _s.x + _s.w) continue;
                if (_s.slope && (body.x < _s.x || body.x > _s.x + _s.w)) continue;
                var top = surfaceY(_s, body.x);
                if (dy <= 0 && (onTerrain && _s.slope || oldY >= surfaceY(_s, oldX) - 0.01 && body.y <= top)) {
                  body.y = onTerrain && _s.slope ? top : Math.max(body.y, top);
                  body.vy = 0;
                  body.grounded = true;
                  body.groundSlope = _s.slope ? (_s.slope.right - _s.slope.left) / _s.w : 0;
                } else if (!_s.oneWay && dy > 0 && oldY + body.height <= _s.y + 0.01 && body.y + body.height >= _s.y) {
                  body.y = Math.min(body.y, _s.y - body.height);
                  body.vy = 0;
                }
              }
            } catch (err) {
              _iterator8.e(err);
            } finally {
              _iterator8.f();
            }
            body.x = Math.max(body.halfWidth, Math.min(this.data.width - body.halfWidth, body.x));
          }
        }, {
          key: "groundY",
          value: function groundY(x) {
            var s = this.staticSolids.find(function (s) {
              return s.kind === "ground" && x >= s.x && x <= s.x + s.w;
            });
            return s ? surfaceY(s, x) : 150;
          }
        }, {
          key: "reachedExit",
          value: function reachedExit(x) {
            return this.guardDefeated && x >= this.data.exit.x - 28;
          }
        }]);
        return LevelController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelData.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './TerrainProfile.ts'], function (exports) {
  var _toConsumableArray, _objectSpread2, _createForOfIteratorHelper, cclegacy, road, roadHeight;
  return {
    setters: [function (module) {
      _toConsumableArray = module.toConsumableArray;
      _objectSpread2 = module.objectSpread2;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      road = module.road;
      roadHeight = module.roadHeight;
    }],
    execute: function () {
      cclegacy._RF.push({}, "9c49eNdxVQMaAW/JTYg7ErN", "LevelData", undefined);
      var AbandonedBase = exports('AbandonedBase', {
        name: "废弃前哨站",
        width: 8200,
        spawn: {
          x: 110,
          y: 150
        },
        exit: {
          x: 8070,
          y: 150
        },
        solids: [].concat(_toConsumableArray(road.map(function (r) {
          return _objectSpread2(_objectSpread2({}, r), {}, {
            kind: "ground"
          });
        })), [{
          x: 420,
          y: 150,
          w: 76,
          h: 54,
          kind: "crate"
        }, {
          x: 950,
          y: 150,
          w: 92,
          h: 48,
          kind: "step"
        }, {
          x: 1042,
          y: 150,
          w: 90,
          h: 88,
          kind: "step"
        }, {
          x: 1150,
          y: 248,
          w: 340,
          h: 14,
          kind: "platform"
        }, {
          x: 1430,
          y: 360,
          w: 205,
          h: 14,
          kind: "platform"
        }, {
          x: 1750,
          y: 150,
          w: 64,
          h: 64,
          kind: "crate"
        }, {
          x: 2040,
          y: 150,
          w: 100,
          h: 55,
          kind: "step"
        }, {
          x: 2140,
          y: 150,
          w: 100,
          h: 95,
          kind: "step"
        }, {
          x: 2300,
          y: 266,
          w: 320,
          h: 16,
          kind: "platform"
        }, {
          x: 2710,
          y: 150,
          w: 72,
          h: 60,
          kind: "crate"
        }, {
          x: 2920,
          y: 150,
          w: 160,
          h: 50,
          kind: "step"
        },
        // Leave standing/jumping clearance above the raised exit and its cover.
        {
          x: 3300,
          y: 320,
          w: 160,
          h: 16,
          kind: "platform"
        }, {
          x: 4150,
          y: 150,
          w: 85,
          h: 58,
          kind: "step"
        }, {
          x: 4235,
          y: 150,
          w: 85,
          h: 108,
          kind: "step"
        }, {
          x: 4300,
          y: 292,
          w: 250,
          h: 18,
          kind: "platform"
        }, {
          x: 5200,
          y: 278,
          w: 390,
          h: 16,
          kind: "platform"
        }, {
          x: 5900,
          y: 150,
          w: 180,
          h: 50,
          kind: "step"
        }]),
        enemies: [{
          id: "m1",
          kind: "melee",
          x: 620,
          y: 150,
          patrol: 60
        }, {
          id: "r1",
          kind: "ranged",
          x: 850,
          y: 150,
          patrol: 35
        }, {
          id: "r2",
          kind: "ranged",
          x: 1290,
          y: 262,
          patrol: 60
        }, {
          id: "m2",
          kind: "melee",
          x: 1540,
          y: 150,
          patrol: 65
        }, {
          id: "r3",
          kind: "ranged",
          x: 1950,
          y: 150,
          patrol: 40
        }, {
          id: "m3",
          kind: "melee",
          x: 2440,
          y: 150,
          patrol: 70
        }, {
          id: "r4",
          kind: "ranged",
          x: 2500,
          y: 282,
          patrol: 75
        }, {
          id: "m4",
          kind: "melee",
          x: 2860,
          y: 150,
          patrol: 65
        }, {
          id: "r5",
          kind: "ranged",
          x: 3230,
          y: 150,
          patrol: 35
        }, {
          id: "shield-B",
          kind: "shield",
          x: 2810,
          y: 150,
          patrol: 45
        }, {
          id: "turret-B",
          kind: "turret",
          x: 3600,
          y: 150,
          patrol: 0
        }, {
          id: "shield-C",
          kind: "shield",
          x: 4100,
          y: 150,
          patrol: 45
        }, {
          id: "charge-C",
          kind: "melee",
          x: 4650,
          y: 150,
          patrol: 40
        }, {
          id: "rifle-C1",
          kind: "ranged",
          x: 4900,
          y: 150,
          patrol: 45
        }, {
          id: "rifle-C2",
          kind: "ranged",
          x: 5360,
          y: 294,
          patrol: 70
        }, {
          id: "turret-C",
          kind: "turret",
          x: 5800,
          y: 150,
          patrol: 0
        }, {
          id: "shield-C2",
          kind: "shield",
          x: 6280,
          y: 150,
          patrol: 40
        }, {
          id: "rifle-C3",
          kind: "ranged",
          x: 6530,
          y: 150,
          patrol: 30
        }, {
          id: "outpost-tank",
          kind: "guard",
          x: 6160,
          y: 150,
          patrol: 0,
          health: 42,
          encounter: "mini"
        }, {
          id: "gate-colossus",
          kind: "colossus",
          x: 7840,
          y: 150,
          patrol: 0,
          encounter: "final"
        }],
        objects: [{
          id: "shotgun-cache",
          kind: "wood",
          x: 300,
          y: 150,
          w: 55,
          h: 50,
          drop: "shotgun",
          dropChance: 1
        }, {
          id: "crate-01",
          kind: "wood",
          x: 420,
          y: 150,
          w: 76,
          h: 54,
          drop: "health",
          dropChance: 0.7
        }, {
          id: "barrel-01",
          kind: "barrel",
          x: 660,
          y: 150,
          w: 38,
          h: 58
        }, {
          id: "barrel-02",
          kind: "barrel",
          x: 735,
          y: 150,
          w: 38,
          h: 58
        }, {
          id: "rocket-cache",
          kind: "wood",
          x: 1350,
          y: 262,
          w: 55,
          h: 50,
          drop: "rocket",
          dropChance: 1
        }, {
          id: "hanging-01",
          kind: "hanging",
          x: 1530,
          y: 410,
          w: 54,
          h: 48
        }, {
          id: "crate-02",
          kind: "wood",
          x: 1750,
          y: 150,
          w: 64,
          h: 64,
          drop: "grenades",
          dropChance: 1
        }, {
          id: "sandbags-01",
          kind: "sandbag",
          x: 1890,
          y: 150,
          w: 85,
          h: 44
        }, {
          id: "barrel-03",
          kind: "barrel",
          x: 2410,
          y: 150,
          w: 38,
          h: 58
        }, {
          id: "crate-03",
          kind: "wood",
          x: 2710,
          y: 150,
          w: 72,
          h: 60,
          drop: "health",
          dropChance: 0.6
        }, {
          id: "steel-01",
          kind: "steel",
          x: 3100,
          y: 150,
          w: 58,
          h: 62,
          drop: "rocket",
          dropChance: 1
        }],
        zones: [{
          id: "A",
          name: "道路遭遇",
          start: 0,
          end: 1850
        }, {
          id: "B",
          name: "工业突破",
          start: 1850,
          end: 3800
        }, {
          id: "C",
          name: "机械阵地",
          start: 3800,
          end: 6740
        }, {
          id: "D",
          name: "裁决者决战",
          start: 6740,
          end: 8200
        }],
        mechanisms: [{
          id: "bridge-B",
          kind: "bridge",
          x: 3080,
          y: 266,
          w: 210,
          h: 14,
          minY: 150,
          maxY: 266,
          speed: 0,
          ropeId: "bridge-rope"
        }, {
          id: "lift-C",
          kind: "lift",
          x: 5000,
          y: 152,
          w: 142,
          h: 16,
          minY: 152,
          maxY: 318,
          speed: 65
        }],
        arena: {
          start: 6840,
          end: 8170
        }
      });
      AbandonedBase.objects.push({
        id: "bridge-rope",
        kind: "rope",
        x: 3140,
        y: 285,
        w: 14,
        h: 102,
        link: "bridge-B"
      }, {
        id: "sandbags-B",
        kind: "sandbag",
        x: 3520,
        y: 150,
        w: 75,
        h: 44
      }, {
        id: "cargo-B",
        kind: "hanging",
        x: 3590,
        y: 440,
        w: 65,
        h: 55
      }, {
        id: "health-B",
        kind: "wood",
        x: 3730,
        y: 150,
        w: 52,
        h: 47,
        drop: "health",
        dropChance: 1
      }, {
        id: "concrete-C",
        kind: "concrete",
        x: 3880,
        y: 150,
        w: 90,
        h: 72
      }, {
        id: "hidden-rockets",
        kind: "wood",
        x: 4420,
        y: 310,
        w: 56,
        h: 48,
        drop: "rocket",
        dropChance: 1,
        hidden: true
      }, {
        id: "barrel-C1",
        kind: "barrel",
        x: 5580,
        y: 150,
        w: 38,
        h: 58
      }, {
        id: "barrel-C2",
        kind: "barrel",
        x: 5680,
        y: 150,
        w: 38,
        h: 58
      }, {
        id: "grenades-C",
        kind: "wood",
        x: 5800,
        y: 150,
        w: 53,
        h: 48,
        drop: "grenades",
        dropChance: 1
      }, {
        id: "cargo-C",
        kind: "hanging",
        x: 5980,
        y: 425,
        w: 56,
        h: 50
      }, {
        id: "health-C",
        kind: "wood",
        x: 6630,
        y: 150,
        w: 56,
        h: 48,
        drop: "health",
        dropChance: 1
      }, {
        id: "arena-rockets",
        kind: "wood",
        x: 7100,
        y: 150,
        w: 58,
        h: 48,
        drop: "rocket",
        dropChance: 1
      }, {
        id: "arena-sandbag",
        kind: "sandbag",
        x: 7410,
        y: 150,
        w: 80,
        h: 40
      }, {
        id: "arena-barrel",
        kind: "barrel",
        x: 7590,
        y: 150,
        w: 38,
        h: 58
      });

      // Attach ground props to the authored level pads; elevated caches keep their platform heights.
      var _iterator = _createForOfIteratorHelper(AbandonedBase.solids),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var s = _step.value;
          if (s.kind !== "ground" && s.y === 150) s.y = roadHeight(s.x + s.w / 2);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      var _iterator2 = _createForOfIteratorHelper(AbandonedBase.objects),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var o = _step2.value;
          if (o.y === 150) o.y = roadHeight(o.x + o.w / 2);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      var _iterator3 = _createForOfIteratorHelper(AbandonedBase.enemies),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var e = _step3.value;
          e.onPlatform = e.y > 150;
          if (!e.onPlatform) e.y = roadHeight(e.x);
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Types.ts', './Ink.ts', './SceneryArt.ts', './GameConfig.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Label, surfaceY, node, Ink, colors, SceneryArt, GameConfig;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
      Label = module.Label;
    }, function (module) {
      surfaceY = module.surfaceY;
    }, function (module) {
      node = module.node;
      Ink = module.Ink;
      colors = module.colors;
    }, function (module) {
      SceneryArt = module.SceneryArt;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      cclegacy._RF.push({}, "ce266XwPE5kjMxHJkBriZYn", "LevelRenderer", undefined);
      var LevelRenderer = exports('LevelRenderer', /*#__PURE__*/function () {
        function LevelRenderer(parent, level) {
          var _this = this;
          _classCallCheck(this, LevelRenderer);
          _defineProperty(this, "chunks", []);
          _defineProperty(this, "gate", void 0);
          _defineProperty(this, "visibleChunks", 0);
          _defineProperty(this, "exitX", 0);
          _defineProperty(this, "lastUnlocked", null);
          for (var _i = 0, _arr = [0.16, 0.42, 1]; _i < _arr.length; _i++) {
            var factor = _arr[_i];
            var _loop = function _loop(x) {
              var n = node(parent, "Scenery ".concat(factor, "/").concat(x), x, 0, 820, 650),
                g = new Ink(n),
                index = Math.floor(x / 800);
              _this.chunks.push({
                node: n,
                x: x,
                factor: factor
              });
              if (factor === 1) g.strokeScale = GameConfig.rendering.lineWidths.platform / 3;
              if (factor === 0.16) {
                for (var i = 0; i < 3; i++) SceneryArt.cloud(g, 30 + i * 260, 365 + (index + i + 9) % 3 * 24, 0.8 + (index + i + 8) % 2 * 0.3);
                SceneryArt.ridge(g, index + 12);
                SceneryArt.truck(g, 590, 158);
              } else if (factor === 0.42) {
                if ((index + 9) % 3 === 0) SceneryArt.bunker(g, 180, 150, 300);else if ((index + 9) % 3 === 1) SceneryArt.factory(g, 120, 150);else SceneryArt.crane(g, 300, 150);
                if ((index + 9) % 2 === 0) SceneryArt.tower(g, 700, 150);
                SceneryArt.serviceBay(g, 510, 150);
                g.segment(24, 150, 21, 344, 2.5, colors.mid);
                g.segment(3, 329, 44, 327, 3, colors.mid);
                for (var _i2 = 0, _arr2 = [8, 37]; _i2 < _arr2.length; _i2++) {
                  var px = _arr2[_i2];
                  g.ellipse(px, 334, 3, 5, colors.mid, colors.paper, 1.5);
                }
                g.g.moveTo(24, 338);
                g.g.bezierCurveTo(224, 268, 510, 279, 812, 338);
                g.g.strokeColor = colors.mid;
                g.g.lineWidth = 1.8;
                g.g.stroke();
              } else {
                var _iterator = _createForOfIteratorHelper(level.staticSolids),
                  _step;
                try {
                  var _loop2 = function _loop2() {
                    var s = _step.value;
                    if (s.x + s.w <= x || s.x >= x + 800) return 1; // continue
                    var left = Math.max(s.x, x) - x,
                      right = Math.min(s.x + s.w, x + 800) - x;
                    if (s.kind === "ground") {
                      var top = function top(px) {
                        return surfaceY(s, x + px);
                      };
                      var outline = [];
                      for (var _px = left; _px < right; _px += 14) outline.push({
                        x: _px,
                        y: top(_px) + Math.sin((x + _px) * 0.17) * 0.75
                      });
                      outline.push({
                        x: right,
                        y: top(right) + Math.sin((x + right) * 0.17) * 0.75
                      });
                      g.polygon([].concat(outline, [{
                        x: right,
                        y: -240
                      }, {
                        x: left,
                        y: -240
                      }]), colors.paper);
                      g.line(outline, 3, colors.ink);
                      // Broken strata follow the actual contour; only the walking edge is solid black.
                      for (var _px2 = left + 8; _px2 < right - 30; _px2 += 71) {
                        var py = top(_px2);
                        g.line([{
                          x: _px2,
                          y: py - 9
                        }, {
                          x: _px2 + 13,
                          y: py - 12
                        }, {
                          x: _px2 + 28,
                          y: top(_px2 + 28) - 10
                        }], 1.1, colors.muted);
                        g.line([{
                          x: _px2 + 14,
                          y: py - 43
                        }, {
                          x: _px2 + 22,
                          y: py - 48
                        }, {
                          x: _px2 + 40,
                          y: py - 44
                        }], 0.8, colors.mid);
                        if (Math.floor((x + _px2) / 71) % 3 === 0) SceneryArt.rock(g, _px2 + 12, py - 3, 0.32, true);
                      }
                      var count = Math.ceil((right - left) / 13);
                      for (var _i3 = 0; _i3 < count; _i3++) {
                        var _px3 = left + (_i3 * 137 + index * 41 + 8000) % (right - left);
                        g.g.circle(_px3, top(_px3) - 21 - (_i3 * 71 + 19) % 320, _i3 % 7 === 0 ? 1.6 : 0.75);
                      }
                      g.g.fillColor = colors.mid;
                      g.g.fill();
                    } else {
                      g.rect(left, s.y, right - left, s.h, colors.ink, colors.paper, 3);
                      g.segment(left, s.y + s.h - 5, right, s.y + s.h - 5, 1, colors.muted);
                      for (var _px4 = left + 10; _px4 < right - 6; _px4 += 30) {
                        g.circle(_px4, s.y + Math.min(s.h / 2, 9), 1.8, colors.ink, colors.ink, 1);
                      }
                      if (s.kind === "platform") for (var _i4 = 0, _arr3 = [s.x + 12, s.x + s.w - 12]; _i4 < _arr3.length; _i4++) {
                        var wx = _arr3[_i4];
                        if (wx >= x && wx < x + 800) {
                          g.rect(wx - x - 5, level.groundY(wx), 10, s.y - level.groundY(wx), colors.ink, colors.wall, 1.8);
                        }
                      }
                      if (s.kind === "platform" && s.x >= x && s.x + s.w <= x + 800) {
                        var a = s.x - x + 18,
                          b = s.x - x + s.w - 18;
                        g.segment(a, level.groundY(x + a) + 3, b, s.y - 4, 6, colors.ink);
                        g.segment(a, level.groundY(x + a) + 3, b, s.y - 4, 2.6, colors.wall);
                        g.segment(b, level.groundY(x + b) + 3, a, s.y - 4, 6, colors.ink);
                        g.segment(b, level.groundY(x + b) + 3, a, s.y - 4, 2.6, colors.wall);
                      }
                    }
                  };
                  for (_iterator.s(); !(_step = _iterator.n()).done;) {
                    if (_loop2()) continue;
                  }
                } catch (err) {
                  _iterator.e(err);
                } finally {
                  _iterator.f();
                }
                if (index === 0) {
                  g.segment(310, 150, 310, 221, 4, colors.mid);
                  g.rect(275, 204, 102, 27, colors.mid, colors.paper, 1.4);
                  _this.label(n, "前哨站  →", 326, 218, 15);
                }
              }
            };
            for (var x = -800; x < level.data.width + 1600; x += 800) {
              _loop(x);
            }
          }
          var exitRoot = node(parent, "Exit gate"),
            exit = level.data.exit.x;
          this.gate = new Ink(exitRoot);
          this.label(exitRoot, "出口 / EXIT", exit, 327, 23);
          this.gate.node.setPosition(0, 0);
          this.exitX = exit;
        }
        _createClass(LevelRenderer, [{
          key: "label",
          value: function label(parent, value, x, y, size) {
            var n = node(parent, value, x, y, 500, 42),
              l = n.addComponent(Label);
            l.string = value;
            l.fontSize = size;
            l.color = colors.muted;
            l.fontFamily = "sans-serif";
          }
        }, {
          key: "update",
          value: function update(cameraX, unlocked) {
            var visibleWidth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1280;
            this.visibleChunks = 0;
            var _iterator2 = _createForOfIteratorHelper(this.chunks),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var c = _step2.value;
                var _px5 = c.x - cameraX * c.factor;
                c.node.setPosition(_px5, 0);
                c.node.active = _px5 < visibleWidth + 70 && _px5 + 820 > -70;
                if (c.node.active) this.visibleChunks++;
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            this.gate.node.setPosition(-cameraX, 0);
            this.gate.node.active = this.exitX - cameraX < visibleWidth + 100;
            if (this.lastUnlocked === unlocked) return;
            this.lastUnlocked = unlocked;
            this.gate.clear();
            var x = this.exitX;
            this.gate.line([{
              x: x - 75,
              y: 150
            }, {
              x: x - 75,
              y: 298
            }, {
              x: x + 75,
              y: 298
            }, {
              x: x + 75,
              y: 150
            }], 4);
            if (!unlocked) for (var px = x - 55; px < x + 70; px += 22) this.gate.segment(px, 154, px, 291, 2, colors.muted);else this.gate.line([{
              x: x - 42,
              y: 210
            }, {
              x: x - 14,
              y: 192
            }, {
              x: x + 40,
              y: 241
            }], 4);
          }
        }]);
        return LevelRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./GameManager.ts', './CameraFollow.ts', './ExplosionSystem.ts', './GrenadeSystem.ts', './MeleeGeometry.ts', './MeleeSystem.ts', './ParticlePool.ts', './ProjectileManager.ts', './WeaponPresentation.ts', './WeaponSystem.ts', './GameConfig.ts', './GameSession.ts', './InputManager.ts', './TouchInputManager.ts', './Types.ts', './VirtualJoystick.ts', './ColossusBoss.ts', './EnemyController.ts', './EnemySpawner.ts', './EnemyTactics.ts', './TankBoss.ts', './LevelController.ts', './LevelData.ts', './MechanismController.ts', './TerrainProfile.ts', './AudioBridge.ts', './CocosInputAdapter.ts', './PlatformAdapter.ts', './PlatformBridge.ts', './PlayerController.ts', './CharacterArt.ts', './ColossusArt.ts', './CombatRenderer.ts', './ComicActorArt.ts', './ComicAssets.ts', './ComicCombatArt.ts', './ComicEquipment.ts', './ComicFrames.ts', './ComicLevelRenderer.ts', './ComicObjectArt.ts', './ComicPose.ts', './DirectFrames.ts', './DirectPose.ts', './Ink.ts', './LevelRenderer.ts', './MechanicalEnemyArt.ts', './MeleePose.ts', './ObjectRenderer.ts', './ProjectileArt.ts', './RocketPresentation.ts', './SceneryArt.ts', './StickmanAnimator.ts', './StickmanRenderer.ts', './SupplementFrames.ts', './TerrainSurface.ts', './TerrainTiles.ts', './WeaponArt.ts', './ControlLayout.ts', './HUDController.ts', './JoystickView.ts', './ViewportLayout.ts', './DestructibleManager.ts', './DestructibleObject.ts', './PickupSystem.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
  };
});

System.register("chunks:///_virtual/MechanicalEnemyArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, cclegacy, colors;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      colors = module.colors;
    }],
    execute: function () {
      cclegacy._RF.push({}, "ea422G9wgPHQz32HJQ1gXuc", "MechanicalEnemyArt", undefined);
      var MechanicalEnemyArt = exports('MechanicalEnemyArt', /*#__PURE__*/function () {
        function MechanicalEnemyArt() {
          _classCallCheck(this, MechanicalEnemyArt);
        }
        _createClass(MechanicalEnemyArt, [{
          key: "draw",
          value: function draw(ink, a, cam) {
            var x = a.x - cam,
              y = a.y,
              d = a.facing,
              dead = a.animation === "Dead";
            if (a.kind === "turret") {
              var _a$aimPitch;
              if (dead) {
                ink.segment(x - 25, y + 8, x + 30, y + 3, 3);
                ink.segment(x, y + 8, x + 21, y + 28, 3);
                return;
              }
              ink.rect(x - 26, y, 52, 14, colors.ink, colors.paper, 3);
              ink.segment(x - 15, y + 14, x - 11, y + 36, 4);
              ink.segment(x + 15, y + 14, x + 11, y + 36, 4);
              ink.ellipse(x, y + 47, 22, 17, colors.ink, a.windup && a.windup > 0 ? colors.far : colors.paper, 3);
              ink.circle(x, y + 47, 7, colors.ink, undefined, 2);
              ink.segment(x, y + 47, x + 4, y + 52, 2);
              var angle = (_a$aimPitch = a.aimPitch) !== null && _a$aimPitch !== void 0 ? _a$aimPitch : 0;
              ink.segment(x, y + 50, x + d * 36 * Math.cos(angle), y + 50 + 36 * Math.sin(angle), 7);
              ink.segment(x - 12, y + 66, x - 12, y + 80, 2);
              ink.circle(x - 12, y + 82, 3, colors.ink, colors.ink, 1);
              for (var n = 0; n < 4; n++) ink.segment(x - 17 + n * 10, y + 21, x - 12 + n * 10, y + 27, 1.5);
              return;
            }
            var shift = dead ? Math.min(a.deadTime, 1) * 14 : a.animation === "Hit" ? Math.sin(a.animationTime * 75) * 2 : 0;
            ink.ellipse(x, y + 26, 117, 25, colors.ink, colors.far, 4);
            for (var i = 0; i < 6; i++) {
              var wx = x - 88 + i * 35;
              ink.circle(wx, y + 25, 15, colors.ink, colors.paper, 2.5);
              ink.circle(wx, y + 25, 5, colors.ink, colors.far, 2);
              for (var j = 0; j < 4; j++) {
                var _angle = a.animationTime * 2 + j * Math.PI / 2;
                ink.segment(wx + Math.cos(_angle) * 6, y + 25 + Math.sin(_angle) * 6, wx + Math.cos(_angle) * 13, y + 25 + Math.sin(_angle) * 13, 1);
              }
            }
            for (var _i = 0; _i < 11; _i++) {
              ink.segment(x - 95 + _i * 19, y + 50, x - 88 + _i * 19, y + 45, 2);
              ink.segment(x - 95 + _i * 19, y + 2, x - 88 + _i * 19, y + 6, 2);
            }
            ink.line([{
              x: x - 106,
              y: y + 53
            }, {
              x: x - 83,
              y: y + 99 - shift
            }, {
              x: x + 66,
              y: y + 108 - shift
            }, {
              x: x + 104,
              y: y + 73
            }, {
              x: x + 96,
              y: y + 51
            }, {
              x: x - 106,
              y: y + 53
            }], 3.5);
            ink.rect(x - 55, y + 58, 58, 29, colors.ink, colors.paper, 2);
            ink.circle(x - 38, y + 72, 6, colors.ink, undefined, 2);
            ink.segment(x - 42, y + 72, x - 33, y + 72, 1.5);
            ink.rect(x + 10, y + 58, 65, 27, colors.ink, colors.paper, 2);
            for (var _n = 0; _n < 6; _n++) ink.segment(x + 18 + _n * 9, y + 63, x + 18 + _n * 9, y + 80, 1.6);
            ink.line([{
              x: x - 57,
              y: y + 101 - shift
            }, {
              x: x - 30,
              y: y + 130 - shift
            }, {
              x: x + 23,
              y: y + 130 - shift
            }, {
              x: x + 53,
              y: y + 108 - shift
            }, {
              x: x - 57,
              y: y + 101 - shift
            }], 3);
            var recoil = a.recoil * 3,
              gunY = y + 92 - shift;
            ink.segment(x + d * 4 - recoil * d, gunY, x + d * 123 - recoil * d, gunY, 12);
            ink.segment(x + d * 9, gunY + 4, x + d * 120, gunY + 4, 1.6, colors.paper);
            ink.rect(x - 3, y + 114 - shift, 21, 9, colors.ink, colors.paper, 2);
            ink.segment(x + 40, y + 115, x + 45, y + 157, 2.2);
            ink.segment(x + 45, y + 157, x + 73, y + 153, 1.6);
            ink.circle(x + 44, y + 162, 3, colors.ink, colors.ink, 1);
            for (var _n2 = 0; _n2 < 8; _n2++) ink.circle(x - 83 + _n2 * 23, y + 93 - shift, 1.8, colors.ink, colors.ink, 1);
            if (dead) {
              for (var _n3 = 0; _n3 < 6; _n3++) {
                var age = a.deadTime,
                  dx = (_n3 - 2.5) * age * 72,
                  dy = age * 120 - age * age * 140;
                ink.rect(x + dx - 8, y + 55 + dy, 16, 7, colors.ink, colors.far, 2);
              }
            } else if (a.recoil > 1.4) {
              ink.line([{
                x: x + d * 130,
                y: gunY - 10
              }, {
                x: x + d * 148,
                y: gunY
              }, {
                x: x + d * 130,
                y: gunY + 10
              }], 3);
            }
          }
        }]);
        return MechanicalEnemyArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/MechanismController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "55da8kN1CifsEtmEoe8ivHp", "MechanismController", undefined);
      var MechanismController = exports('MechanismController', /*#__PURE__*/function () {
        function MechanismController(data) {
          _classCallCheck(this, MechanismController);
          _defineProperty(this, "rect", void 0);
          _defineProperty(this, "released", false);
          _defineProperty(this, "landed", false);
          _defineProperty(this, "direction", 1);
          _defineProperty(this, "vy", 0);
          this.data = data;
          this.rect = {
            x: data.x,
            y: data.y,
            w: data.w,
            h: data.h,
            kind: "platform",
            oneWay: data.kind === "lift"
          };
        }
        _createClass(MechanismController, [{
          key: "update",
          value: function update(dt) {
            var old = this.rect.y;
            if (this.data.kind === "lift") {
              this.rect.y += this.direction * this.data.speed * dt;
              if (this.rect.y >= this.data.maxY) {
                this.rect.y = this.data.maxY;
                this.direction = -1;
              }
              if (this.rect.y <= this.data.minY) {
                this.rect.y = this.data.minY;
                this.direction = 1;
              }
            } else if (this.released && !this.landed) {
              this.vy -= 650 * dt;
              this.rect.y = Math.max(this.data.minY, this.rect.y + this.vy * dt);
              if (this.rect.y === this.data.minY) {
                this.landed = true;
                this.vy = 0;
              }
            }
            return this.rect.y - old;
          }
        }]);
        return MechanismController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/MeleeGeometry.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Types.ts'], function (exports) {
  var _slicedToArray, cclegacy, clamp;
  return {
    setters: [function (module) {
      _slicedToArray = module.slicedToArray;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      clamp = module.clamp;
    }],
    execute: function () {
      exports({
        meleeHand: meleeHand,
        sectorHitsRect: sectorHitsRect
      });
      cclegacy._RF.push({}, "9bbd6WoEXUJHdaxKTcnwZw2", "MeleeGeometry", undefined);
      function meleeHand(stage, stance) {
        return stance === "crouch" ? {
          x: 25,
          y: 27
        } : stance === "jump" ? {
          x: 30,
          y: 43
        } : stage === 1 ? {
          x: 41,
          y: 44
        } : stage === 2 ? {
          x: 49,
          y: 49
        } : {
          x: 31,
          y: 33
        };
      }

      /** Rect versus swept angular sector. Wall visibility is checked separately. */
      function sectorHitsRect(x, y, range, from, to, r, facing) {
        var left = facing > 0 ? r.x - x : x - r.x - r.w,
          right = left + r.w;
        var low = r.y - y,
          high = low + r.h,
          min = Math.min(from, to) - .12,
          max = Math.max(from, to) + .12;
        if (right < 0) return right >= -24 && low <= 12 && high >= -12;
        var points = [[left, low], [right, low], [left, high], [right, high], [(left + right) / 2, (low + high) / 2], [clamp(0, left, right), clamp(0, low, high)]];
        for (var _i = 0, _arr = [min, max, (min + max) / 2]; _i < _arr.length; _i++) {
          var angle = _arr[_i];
          var px = Math.cos(angle) * range,
            py = Math.sin(angle) * range;
          if (px >= left && px <= right && py >= low && py <= high) return true;
        }
        return points.some(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2),
            px = _ref2[0],
            py = _ref2[1];
          return px >= 0 && px * px + py * py <= range * range && Math.atan2(py, px) >= min && Math.atan2(py, px) <= max;
        });
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/MeleePose.ts", ['cc', './GameConfig.ts', './MeleeGeometry.ts'], function (exports) {
  var cclegacy, GameConfig, meleeHand;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      meleeHand = module.meleeHand;
    }],
    execute: function () {
      exports('meleePose', meleePose);
      cclegacy._RF.push({}, "8ae12Yak6gCNBIMVZZyZdFQ", "MeleePose", undefined);
      /** Shared blade/arc attachment and body selection; all poses reuse supplied pixels. */
      function meleePose(a) {
        var _a$meleeStage, _a$meleeProgress, _a$meleeTime, _a$meleeStance;
        var stage = Math.max(1, (_a$meleeStage = a.meleeStage) !== null && _a$meleeStage !== void 0 ? _a$meleeStage : 1),
          c = GameConfig.melee.combo[Math.min(2, stage - 1)],
          progress = (_a$meleeProgress = a.meleeProgress) !== null && _a$meleeProgress !== void 0 ? _a$meleeProgress : (GameConfig.melee.duration - ((_a$meleeTime = a.meleeTime) !== null && _a$meleeTime !== void 0 ? _a$meleeTime : 0)) / GameConfig.melee.duration,
          elapsed = progress * c.duration,
          t = Math.max(0, Math.min(1, (elapsed - c.windup) / c.active)),
          stance = (_a$meleeStance = a.meleeStance) !== null && _a$meleeStance !== void 0 ? _a$meleeStance : a.crouched ? "crouch" : "stand",
          windup = elapsed < c.windup;
        var frame = stance === "crouch" ? "unarmed.player.crouch.0" : stance === "jump" ? "unarmed.player.jump.1" : windup ? "player.throw.0" : stage === 1 ? "player.throw.3" : stage === 2 ? "player.throw.1" : "player.throw.4";
        var hand = windup && stance === "stand" ? {
          x: -27,
          y: 49
        } : meleeHand(stage, stance);
        var bladeWidth = (stance === "crouch" ? 78 : c.range) - meleeHand(stage, stance).x;
        return {
          frame: frame,
          hand: hand,
          angle: windup ? c.start : c.start + (c.end - c.start) * t,
          start: c.start,
          end: c.start + (c.end - c.start) * t,
          active: !windup && t < 1,
          range: bladeWidth,
          originY: hand.y,
          stage: stage,
          width: bladeWidth,
          progress: progress
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/MeleeSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts', './MeleeGeometry.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _toConsumableArray, cclegacy, GameConfig, segmentRect, sectorHitsRect, meleeHand;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _toConsumableArray = module.toConsumableArray;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      segmentRect = module.segmentRect;
    }, function (module) {
      sectorHitsRect = module.sectorHitsRect;
      meleeHand = module.meleeHand;
    }],
    execute: function () {
      cclegacy._RF.push({}, "cffb1ecjY2HjdryURJYp3tV", "MeleeSystem", undefined);

      /** Dedicated knife combos; contextual firearm quick-strikes remain a single cut. */
      var MeleeSystem = exports('MeleeSystem', /*#__PURE__*/function () {
        function MeleeSystem() {
          _classCallCheck(this, MeleeSystem);
          _defineProperty(this, "cooldown", 0);
          _defineProperty(this, "time", 0);
          _defineProperty(this, "swings", 0);
          _defineProperty(this, "hits", 0);
          _defineProperty(this, "blockedHits", 0);
          _defineProperty(this, "stage", 0);
          _defineProperty(this, "comboRemaining", 0);
          _defineProperty(this, "heavyHits", 0);
          _defineProperty(this, "state", "idle");
          _defineProperty(this, "stance", "stand");
          _defineProperty(this, "facing", 1);
          _defineProperty(this, "struck", new Set());
          _defineProperty(this, "duration", .28);
          _defineProperty(this, "lastAngle", 1.05);
          _defineProperty(this, "dedicated", false);
          _defineProperty(this, "buffered", false);
          _defineProperty(this, "previousAttack", false);
        }
        _createClass(MeleeSystem, [{
          key: "action",
          get: function get() {
            return this.state === "hit" ? "melee_hit" : this.time > 0 ? "".concat(this.stance, "_melee_attack_").concat(this.stage) : "melee_combo_reset";
          }
        }, {
          key: "cancel",
          value: function cancel(p) {
            this.cooldown = this.time = this.comboRemaining = this.stage = 0;
            this.buffered = this.previousAttack = false;
            this.state = "idle";
            this.struck.clear();
            if (p) p.meleeTime = p.meleeStage = p.meleeProgress = 0;
          }
        }, {
          key: "reset",
          value: function reset() {
            this.cancel();
            this.swings = this.hits = this.blockedHits = this.heavyHits = 0;
          }
        }, {
          key: "visible",
          value: function visible(p, e, solids) {
            var r = e.bounds,
              from = {
                x: p.x,
                y: p.y + (this.stance === "crouch" ? 25 : 42)
              },
              to = {
                x: Math.max(r.x, Math.min(r.x + r.w, from.x)),
                y: Math.max(r.y, Math.min(r.y + r.h, from.y))
              };
            return !solids.some(function (s) {
              return s !== r && segmentRect(from, to, s, .4) !== null;
            });
          }
        }, {
          key: "near",
          value: function near(p, e, solids) {
            return e.alive && sectorHitsRect(p.x, p.y + 38, GameConfig.melee.range, -.75, .75, e.bounds, p.facing) && this.visible(p, e, solids);
          }
        }, {
          key: "update",
          value: function update(dt, p, enemies, solids, shoot, manual, particles, level) {
            var _this = this;
            var objects = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : [];
            this.cooldown = Math.max(0, this.cooldown - dt);
            this.comboRemaining = Math.max(0, this.comboRemaining - dt);
            var old = this.time;
            this.time = Math.max(0, this.time - dt);
            if (!p.alive || p.hitTime > 0 || p.throwTime > 0) {
              this.cancel(p);
              if (p.alive && p.hitTime > 0) this.state = "hit";
              return false;
            }
            if (this.state === "hit") this.state = "idle";
            if (old > 0 && this.time === 0) {
              this.state = "idle";
              this.comboRemaining = this.stage < 3 ? GameConfig.melee.comboWindow : 0;
            }
            if (this.time === 0 && this.comboRemaining === 0) this.stage = 0;
            var knife = p.weaponId === "knife",
              request = manual || shoot;
            if (this.time > 0 && request && !this.previousAttack && knife) this.buffered = true;
            this.previousAttack = request;
            if (this.time === 0 && this.cooldown === 0 && (manual || knife && (shoot || this.buffered) || !knife && shoot && enemies.some(function (e) {
              return _this.near(p, e, solids);
            }))) {
              this.dedicated = knife;
              this.stance = p.crouched ? "crouch" : p.grounded ? "stand" : "jump";
              this.stage = knife && this.stance === "stand" ? this.stage % 3 + 1 : 1;
              var c = GameConfig.melee.combo[this.stage - 1];
              this.duration = knife ? c.duration : GameConfig.melee.duration;
              this.time = this.duration;
              this.cooldown = knife ? this.duration + (this.stage === 3 ? .14 : 0) : GameConfig.melee.interval;
              this.facing = p.facing;
              this.struck.clear();
              this.buffered = false;
              this.swings++;
              this.lastAngle = c.start;
              this.state = "windup";
            }
            if (this.time > 0) {
              var _c = GameConfig.melee.combo[this.stage - 1],
                elapsed = this.duration - this.time,
                windup = this.dedicated ? _c.windup : GameConfig.melee.windup,
                t = Math.max(0, Math.min(1, (elapsed - windup) / _c.active)),
                angle = _c.start + (_c.end - _c.start) * t;
              this.state = elapsed < windup ? "windup" : t < 1 ? "active" : "recovery";
              p.facing = this.facing;
              p.meleeStage = this.stage;
              p.meleeStance = this.stance;
              p.meleeProgress = elapsed / this.duration;
              if (this.state === "active") {
                if (this.dedicated && p.grounded && this.stance !== "jump" && level) {
                  var vx = p.vx,
                    vy = p.vy;
                  p.vx = this.facing * _c.lunge * (this.stance === "crouch" ? .35 : 1);
                  p.vy = 0;
                  level.move(p, dt);
                  p.vx = vx;
                  p.vy = vy;
                }
                var hand = meleeHand(this.stage, this.stance);
                var originX = p.x + hand.x * this.facing,
                  originY = p.y + hand.y,
                  reach = this.stance === "crouch" ? 78 : this.dedicated ? _c.range : GameConfig.melee.range,
                  range = reach - hand.x;
                for (var _i = 0, _arr = [].concat(_toConsumableArray(enemies), _toConsumableArray(objects)); _i < _arr.length; _i++) {
                  var _body$shieldHealth, _body$facing;
                  var e = _arr[_i];
                  if (!e.alive || this.struck.has(e) || (e.bounds.x + e.bounds.w / 2 - p.x) * this.facing < 0 || !sectorHitsRect(originX, originY, range, this.lastAngle, angle, e.bounds, this.facing) || !this.visible(p, e, solids)) continue;
                  var body = e;
                  var blocked = body.kind === "shield" && ((_body$shieldHealth = body.shieldHealth) !== null && _body$shieldHealth !== void 0 ? _body$shieldHealth : 0) > 0 && this.facing === -((_body$facing = body.facing) !== null && _body$facing !== void 0 ? _body$facing : 1);
                  var material = blocked || body.kind === "steel" || body.kind === "concrete" ? "metal" : body.kind === "wood" || body.kind === "hanging" ? "wood" : "enemy";
                  if (e.takeDamage(this.dedicated ? _c.damage : GameConfig.melee.damage, this.facing, "melee")) {
                    var _body$kind;
                    this.struck.add(e);
                    this.hits++;
                    if (blocked) this.blockedHits++;
                    var r = e.bounds,
                      ix = Math.max(r.x, Math.min(r.x + r.w, p.x + range * this.facing * .7)),
                      iy = Math.max(r.y + 3, Math.min(r.y + r.h - 3, originY));
                    particles.impact(ix, iy, material);
                    particles.burst(ix, iy, this.stage === 3 ? 9 : 4, "spark");
                    if (!blocked && !["guard", "colossus", "turret", "wood", "barrel", "sandbag", "steel", "concrete", "hanging"].includes((_body$kind = body.kind) !== null && _body$kind !== void 0 ? _body$kind : "")) {
                      body.vx = this.facing * (this.dedicated ? _c.knockback : 95);
                      body.hitTime = this.dedicated ? this.stage === 3 ? .32 : .20 : .13;
                      if (this.dedicated && this.stage === 3) {
                        body.vy = 180;
                        body.grounded = false;
                        this.heavyHits++;
                      }
                    }
                  }
                }
              }
              this.lastAngle = angle;
            }
            p.meleeTime = this.time;
            if (this.time === 0) p.meleeStage = 0;
            return this.time > 0;
          }
        }]);
        return MeleeSystem;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ObjectRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts', './ComicObjectArt.ts', './ComicAssets.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Label, Color, Ink, node, colors, ComicObjectArt, ComicAssets;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
      Label = module.Label;
      Color = module.Color;
    }, function (module) {
      Ink = module.Ink;
      node = module.node;
      colors = module.colors;
    }, function (module) {
      ComicObjectArt = module.ComicObjectArt;
    }, function (module) {
      ComicAssets = module.ComicAssets;
    }],
    execute: function () {
      cclegacy._RF.push({}, "03284mwF1ud5d3gbnrdZfUz", "ObjectRenderer", undefined);
      var ObjectRenderer = exports('ObjectRenderer', /*#__PURE__*/function () {
        function ObjectRenderer(parent) {
          _classCallCheck(this, ObjectRenderer);
          _defineProperty(this, "comic", new ComicObjectArt());
          _defineProperty(this, "ink", void 0);
          _defineProperty(this, "labels", []);
          this.ink = new Ink(node(parent, "Destructibles and pickups"));
          this.ink.strokeScale = 1.8;
          for (var i = 0; i < 32; i++) {
            var n = node(parent, "Pickup glyph", 0, 0, 44, 40),
              l = n.addComponent(Label);
            l.fontSize = 20;
            l.color = colors.ink;
            l.fontFamily = "sans-serif";
            this.labels.push(l);
          }
        }
        _createClass(ObjectRenderer, [{
          key: "draw",
          value: function draw(s) {
            var ink = this.ink,
              cam = s.camera.x;
            ink.clear();
            this.comic.begin(ink);
            var _iterator = _createForOfIteratorHelper(s.level.objects.objects),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var o = _step.value;
                if (o.x + o.w < cam - 50 || o.x > cam + s.camera.visibleWidth + 50) continue;
                var _x = o.x - cam,
                  _y = o.y,
                  w = o.w,
                  h = o.h;
                var imageDrawn = this.comic.draw(o, cam);
                if (imageDrawn && o.alive) {
                  if (o.kind === "hanging" && !o.triggered) ink.segment(_x + w / 2, _y + h, _x + w / 2, _y + h + 80, 2);
                  continue;
                }
                if (!o.alive) {
                  if (o.kind === "barrel" && o.deadTime < 0.09) {
                    ink.rect(_x - 2, _y - 2, w + 4, h + 4, colors.ink, colors.white, 4);
                    ink.segment(_x, _y, _x + w, _y + h, 4);
                    ink.segment(_x + w, _y, _x, _y + h, 4);
                  } else if (o.deadTime < 0.75) {
                    for (var n = 0; n < 6; n++) {
                      var age = o.deadTime,
                        dx = _x + w / 2 + (n - 2.5) * age * 80,
                        dy = _y + h * 0.5 + (90 + n % 3 * 65) * age - age * age * 310;
                      var angle = n + age * (n % 2 ? 6 : -6),
                        cs = Math.cos(angle),
                        sn = Math.sin(angle);
                      var pts = [{
                        x: dx - 12 * cs + 4 * sn,
                        y: dy - 12 * sn - 4 * cs
                      }, {
                        x: dx + 12 * cs + 4 * sn,
                        y: dy + 12 * sn - 4 * cs
                      }, {
                        x: dx + 10 * cs - 4 * sn,
                        y: dy + 10 * sn + 4 * cs
                      }, {
                        x: dx - 10 * cs - 4 * sn,
                        y: dy - 10 * sn + 4 * cs
                      }];
                      ink.polygon(pts, o.kind === "wood" || o.kind === "hanging" ? colors.paper : colors.mid);
                      pts.push(pts[0]);
                      ink.line(pts, 2.5);
                    }
                  }
                  continue;
                }
                var shade = o.hitTime > 0 ? new Color(185, 185, 180) : colors.paper;
                if (o.kind === "rope") {
                  ink.segment(_x + w / 2, _y, _x + w / 2, _y + h, 3);
                  for (var t = _y; t < _y + h; t += 9) ink.segment(_x + w / 2 - 3, t, _x + w / 2 + 3, t + 5, 1, colors.muted);
                } else if (o.kind === "barrel") {
                  var g = ink.g;
                  g.roundRect(_x + 2, _y, w - 4, h - 3, 5);
                  g.fillColor = shade;
                  g.fill();
                  g.strokeColor = colors.ink;
                  g.lineWidth = 4;
                  g.stroke();
                  ink.ellipse(_x + w / 2, _y + h - 4, w / 2, 4, colors.ink, shade, 1.8);
                  for (var _i = 0, _arr = [_y + 10, _y + h - 13]; _i < _arr.length; _i++) {
                    var ry = _arr[_i];
                    g.moveTo(_x, ry + 2);
                    g.bezierCurveTo(_x + w / 3, ry - 2, _x + w * 0.7, ry - 2, _x + w, ry + 2);
                    g.strokeColor = colors.ink;
                    g.lineWidth = 4;
                    g.stroke();
                  }
                  // A filled flame makes the explosive barrel readable without color or text.
                  var cx = _x + w / 2,
                    cy = _y + h / 2 - 3;
                  g.moveTo(cx, cy - 9);
                  g.bezierCurveTo(cx - 13, cy - 8, cx - 6, cy + 3, cx - 5, cy + 7);
                  g.bezierCurveTo(cx - 2, cy + 1, cx + 1, cy + 7, cx + 1, cy + 13);
                  g.bezierCurveTo(cx + 13, cy + 5, cx + 11, cy - 8, cx, cy - 9);
                  g.fillColor = colors.ink;
                  g.fill();
                  ink.segment(cx + 1, cy - 4, cx + 3, cy + 1, 1.8, shade);
                  ink.ellipse(_x + w - 9, _y + h - 3, 3, 1.4, colors.ink, undefined, 1);
                } else if (o.kind === "sandbag") {
                  for (var row = 0; row < 3; row++) {
                    var count = row === 1 ? 1 : 2,
                      inset = row === 2 ? 5 : 0;
                    for (var _n = 0; _n < count; _n++) {
                      var sw = (w - inset * 2) / count,
                        bx = _x + inset + _n * sw,
                        by = _y + row * h / 3;
                      var sh = h / 3 + 2,
                        _g = ink.g;
                      _g.moveTo(bx + 3, by);
                      _g.bezierCurveTo(bx - 5, by + sh * 0.8, bx + sw * 0.25, by + sh * 1.1, bx + sw * 0.53, by + sh);
                      _g.bezierCurveTo(bx + sw * 0.9, by + sh * 1.1, bx + sw + 3, by + sh * 0.5, bx + sw - 2, by);
                      _g.close();
                      _g.fillColor = shade;
                      _g.fill();
                      _g.strokeColor = colors.ink;
                      _g.lineWidth = 3.6;
                      _g.stroke();
                      ink.segment(bx + 6, by + 3, bx + sw - 8, by + 3, 0.8, colors.muted);
                      for (var j = 8; j < sw - 6; j += 9) ink.segment(bx + j, by + 2, bx + j + 1, by + 4, 0.7, colors.muted);
                    }
                  }
                } else {
                  ink.rect(_x, _y, w, h, colors.ink, shade, o.category === "indestructible" ? 5 : 2.5);
                  ink.rect(_x + 5, _y + 5, w - 10, h - 10, colors.muted, undefined, 1);
                  if (o.kind === "wood" || o.kind === "hanging") {
                    for (var plank = 14; plank < w - 7; plank += 13) ink.segment(_x + plank, _y + 7, _x + plank + 1, _y + h - 7, 0.8, colors.muted);
                    ink.segment(_x + 9, _y + h - 9, _x + w * 0.4, _y + h - 10, 1, colors.muted);
                    ink.segment(_x + w * 0.65, _y + 9, _x + w - 9, _y + 10, 1, colors.muted);
                  }
                  if (o.kind === "steel" || o.kind === "concrete") {
                    for (var _i2 = 0, _arr2 = [8, w - 8]; _i2 < _arr2.length; _i2++) {
                      var a = _arr2[_i2];
                      for (var _i3 = 0, _arr3 = [8, h - 8]; _i3 < _arr3.length; _i3++) {
                        var b = _arr3[_i3];
                        ink.circle(_x + a, _y + b, 2, colors.ink, colors.ink, 1);
                      }
                    }
                    ink.line([{
                      x: _x + 10,
                      y: _y + h / 2
                    }, {
                      x: _x + w - 10,
                      y: _y + h / 2
                    }], 3);
                  } else {
                    // Broad pale diagonal slats, outlined like drawn timber instead of an X glyph.
                    ink.segment(_x + 7, _y + 7, _x + w - 7, _y + h - 7, 7, colors.ink);
                    ink.segment(_x + 7, _y + 7, _x + w - 7, _y + h - 7, 4.5, shade);
                    ink.segment(_x + 7, _y + h - 7, _x + w - 7, _y + 7, 7, colors.ink);
                    ink.segment(_x + 7, _y + h - 7, _x + w - 7, _y + 7, 4.5, shade);
                    ink.line([{
                      x: _x + 6,
                      y: _y + 6
                    }, {
                      x: _x + w - 6,
                      y: _y + h - 6
                    }], 0.6);
                    ink.line([{
                      x: _x + 6,
                      y: _y + h - 6
                    }, {
                      x: _x + w - 6,
                      y: _y + 6
                    }], 0.6);
                  }
                  if (o.data.drop && !o.data.hidden) {
                    ink.rect(_x + w / 2 - 10, _y + h / 2 - 9, 20, 18, colors.ink, colors.paper, 1.5);
                    ink.line([{
                      x: _x + w / 2 - 5,
                      y: _y + h / 2
                    }, {
                      x: _x + w / 2 + 5,
                      y: _y + h / 2
                    }], 2);
                    ink.line([{
                      x: _x + w / 2,
                      y: _y + h / 2 - 5
                    }, {
                      x: _x + w / 2,
                      y: _y + h / 2 + 5
                    }], 2);
                  }
                }
                if (o.health < o.maxHealth) {
                  var damage = 1 - o.health / o.maxHealth;
                  ink.line([{
                    x: _x + w * 0.28,
                    y: _y + h
                  }, {
                    x: _x + w * 0.4,
                    y: _y + h * 0.62
                  }, {
                    x: _x + w * 0.58,
                    y: _y + h * 0.7
                  }, {
                    x: _x + w * 0.47,
                    y: _y + h * (0.6 - damage * 0.5)
                  }], 2.5);
                }
                if (o.kind === "hanging" && !o.triggered) ink.line([{
                  x: _x + w / 2,
                  y: _y + h
                }, {
                  x: _x + w / 2,
                  y: _y + h + 80
                }], 2);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            var _iterator2 = _createForOfIteratorHelper(s.level.mechanisms),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var m = _step2.value;
                var r = m.rect,
                  _x2 = r.x - cam;
                if (_x2 + r.w < 0 || _x2 > s.camera.visibleWidth) continue;
                if (ComicAssets.enabled) this.comic.mechanism(_x2, r.y, r.w, r.h);else ink.rect(_x2, r.y, r.w, r.h, colors.ink, colors.paper, 3);
                for (var _t = 12; _t < r.w - 8; _t += 24) ink.circle(_x2 + _t, r.y + r.h / 2, 2, colors.ink, colors.ink, 1);
                if (m.data.kind === "lift") {
                  ink.segment(_x2 + 12, 150, _x2 + 12, m.data.maxY + 44, 1.5, colors.muted);
                  ink.segment(_x2 + r.w - 12, 150, _x2 + r.w - 12, m.data.maxY + 44, 1.5, colors.muted);
                  ink.segment(_x2 + r.w / 2, r.y + 8, _x2 + r.w / 2, m.data.maxY + 42, 2, colors.muted);
                } else if (!m.released) {
                  ink.segment(_x2 + 16, r.y + r.h, _x2 + 16, r.y + 100, 2);
                  ink.segment(_x2 + r.w - 16, r.y + r.h, _x2 + r.w - 16, r.y + 100, 2);
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            for (var i = 0; i < s.pickups.items.length; i++) {
              var p = s.pickups.items[i],
                l = this.labels[i],
                visible = p.active && p.x > cam - 30 && p.x < cam + s.camera.visibleWidth + 30;
              l.node.active = visible;
              if (!visible) continue;
              if (ComicAssets.enabled) {
                l.node.active = false;
                this.comic.pickup(s, p);
                continue;
              }
              var x = p.x - cam,
                y = p.y + Math.sin(p.age * 5) * 3;
              ink.circle(x, y, 18, colors.ink, colors.paper, 2);
              ink.circle(x, y, 23, colors.far, undefined, 1);
              l.node.setPosition(x, y);
              l.string = p.kind === "health" ? "+" : p.kind === "grenades" ? "G" : p.kind === "shotgun" ? "S" : p.kind === "rocket" ? "R" : "A";
            }
            this.comic.end();
          }
        }]);
        return ObjectRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ParticlePool.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, GameConfig;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      cclegacy._RF.push({}, "07bdcysvwQs/bOGbdPJN8I8", "ParticlePool", undefined);
      var ParticlePool = exports('ParticlePool', /*#__PURE__*/function () {
        function ParticlePool() {
          _classCallCheck(this, ParticlePool);
          _defineProperty(this, "items", Array.from({
            length: GameConfig.pools.particles
          }, function () {
            return {
              active: false,
              x: 0,
              y: 0,
              vx: 0,
              vy: 0,
              life: 0,
              maxLife: 1,
              size: 1,
              kind: "spark",
              gravity: 500,
              spin: 0
            };
          }));
          _defineProperty(this, "dropped", 0);
          _defineProperty(this, "peak", 0);
          _defineProperty(this, "seed", 19283);
        }
        _createClass(ParticlePool, [{
          key: "random",
          value: function random() {
            this.seed = this.seed * 1664525 + 1013904223 >>> 0;
            return this.seed / 4294967296;
          }
        }, {
          key: "reset",
          value: function reset() {
            var _iterator = _createForOfIteratorHelper(this.items),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var p = _step.value;
                p.active = false;
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.dropped = 0;
            this.peak = 0;
            this.seed = 19283;
          }
        }, {
          key: "burst",
          value: function burst(x, y) {
            var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 8;
            var kind = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "spark";
            for (var i = 0; i < count; i++) {
              var p = this.items.find(function (p) {
                return !p.active;
              });
              if (!p) {
                this.dropped++;
                break;
              }
              var a = this.random() * Math.PI * 2,
                speed = 90 + this.random() * 180;
              Object.assign(p, {
                active: true,
                x: x,
                y: y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed,
                life: (kind === "wood" || kind === "metal" ? 0.45 : 0.18) + this.random() * 0.22,
                size: (kind === "wood" ? 3 : 1.5) + this.random() * 2,
                kind: kind,
                material: undefined,
                gravity: kind === "smoke" ? -30 : 500,
                spin: this.random() * 6
              });
              p.maxLife = p.life;
              this.peak = Math.max(this.peak, this.items.reduce(function (n, p) {
                return n + Number(p.active);
              }, 0));
            }
          }
        }, {
          key: "emit",
          value: function emit(x, y, kind) {
            var vx = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
            var vy = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
            var p = this.items.find(function (p) {
              return !p.active;
            });
            if (!p) {
              this.dropped++;
              return;
            }
            var life = kind === "shell" ? 1 : kind === "smoke" ? 0.6 : 0.3;
            Object.assign(p, {
              active: true,
              x: x,
              y: y,
              vx: vx,
              vy: vy,
              kind: kind,
              material: undefined,
              life: life,
              maxLife: life,
              size: kind === "smoke" ? 9 : kind === "dust" ? 4 : 2,
              gravity: kind === "smoke" ? -25 : 650,
              spin: this.random() * 6
            });
            this.peak = Math.max(this.peak, this.items.reduce(function (n, p) {
              return n + Number(p.active);
            }, 0));
          }
        }, {
          key: "impact",
          value: function impact(x, y, material) {
            this.emit(x, y, "impact");
            var p = this.items.find(function (p) {
              return p.active && p.kind === "impact" && p.x === x && p.y === y && !p.material;
            });
            if (p) {
              p.material = material;
              p.size = material === "enemy" ? 22 : material === "metal" ? 18 : 15;
              p.life = p.maxLife = 0.14;
              p.gravity = 0;
            }
            this.burst(x, y, material === "enemy" ? 7 : 5, material === "wood" ? "wood" : "spark");
            if (material === "metal") this.burst(x, y, 3, "metal");
          }
        }, {
          key: "blast",
          value: function blast(x, y, radius) {
            var groundY = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 150;
            this.burst(x, y, 12, "metal");
            this.burst(x, y, 8, "wood");
            if (y - radius < groundY + 5) for (var n = 0; n < 8; n++) this.emit(x + (n - 3.5) * 12, groundY + 6, "dust", (n - 3.5) * 58, 35 + n % 3 * 15);
          }
        }, {
          key: "update",
          value: function update(dt) {
            var _iterator2 = _createForOfIteratorHelper(this.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var p = _step2.value;
                if (p.active) {
                  p.life -= dt;
                  if (p.life <= 0) {
                    p.active = false;
                    continue;
                  }
                  p.vy -= p.gravity * dt;
                  p.spin += dt * 6;
                  p.x += p.vx * dt;
                  p.y += p.vy * dt;
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }]);
        return ParticlePool;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PickupSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, GameConfig, surfaceY;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      surfaceY = module.surfaceY;
    }],
    execute: function () {
      cclegacy._RF.push({}, "1b490Er9x9MFaF2YE2O0EbB", "PickupSystem", undefined);
      var PickupSystem = exports('PickupSystem', /*#__PURE__*/function () {
        function PickupSystem() {
          _classCallCheck(this, PickupSystem);
          _defineProperty(this, "items", Array.from({
            length: 32
          }, function () {
            return {
              active: false,
              x: 0,
              y: 0,
              kind: "health",
              age: 0,
              vy: 0
            };
          }));
          _defineProperty(this, "collected", 0);
          _defineProperty(this, "lastMessage", "");
          _defineProperty(this, "messageTime", 0);
        }
        _createClass(PickupSystem, [{
          key: "reset",
          value: function reset() {
            var _iterator = _createForOfIteratorHelper(this.items),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var p = _step.value;
                p.active = false;
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.collected = 0;
            this.lastMessage = "";
            this.messageTime = 0;
          }
        }, {
          key: "spawn",
          value: function spawn(x, y, kind) {
            var p = this.items.find(function (p) {
              return !p.active;
            });
            if (p) Object.assign(p, {
              active: true,
              x: x,
              y: y,
              kind: kind,
              age: 0,
              vy: 130
            });
          }
        }, {
          key: "update",
          value: function update(dt, player, weapon, solids) {
            this.messageTime = Math.max(0, this.messageTime - dt);
            var _iterator2 = _createForOfIteratorHelper(this.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var p = _step2.value;
                if (!p.active) continue;
                // A drop created beside a large machine can start inside a nearby step.
                // Resolve that overlap once, so it never becomes an unreachable supply below the floor.
                if (p.age === 0) {
                  var _iterator3 = _createForOfIteratorHelper(solids),
                    _step3;
                  try {
                    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                      var s = _step3.value;
                      if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y < surfaceY(s, p.x) + 10) p.y = surfaceY(s, p.x) + 10;
                    }
                  } catch (err) {
                    _iterator3.e(err);
                  } finally {
                    _iterator3.f();
                  }
                }
                p.age += dt;
                var oldY = p.y;
                p.vy -= 600 * dt;
                p.y += p.vy * dt;
                var _iterator4 = _createForOfIteratorHelper(solids),
                  _step4;
                try {
                  for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                    var _s = _step4.value;
                    if (p.x > _s.x - 8 && p.x < _s.x + _s.w + 8 && oldY - 10 >= surfaceY(_s, p.x) && p.y - 10 <= surfaceY(_s, p.x)) {
                      p.y = surfaceY(_s, p.x) + 10;
                      p.vy = 0;
                    }
                  }
                } catch (err) {
                  _iterator4.e(err);
                } finally {
                  _iterator4.f();
                }
                if (!player.alive || Math.abs(player.x - p.x) > 35 || Math.abs(player.y + 25 - p.y) > 64) continue;
                if (p.kind === "health") {
                  if (player.health === GameConfig.player.maxHealth) continue;
                  player.health = Math.min(GameConfig.player.maxHealth, player.health + 2);
                  this.lastMessage = "生命补给 +2";
                } else if (p.kind === "grenades") {
                  if (player.grenades === GameConfig.grenade.max) continue;
                  player.grenades = Math.min(GameConfig.grenade.max, player.grenades + 2);
                  this.lastMessage = "手雷补给 +2";
                } else {
                  if (!weapon.equip(p.kind)) continue;
                  this.lastMessage = p.kind === "knife" ? "战术刀 · 长按普攻三段连击" : p.kind === "shotgun" ? "拾取霰弹枪 · 近距离爆发" : p.kind === "rocket" ? "追踪火箭 · 自动锁敌 / 范围爆炸" : "拾取自动步枪";
                }
                p.active = false;
                this.collected++;
                this.messageTime = 2.4;
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }]);
        return PickupSystem;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PlatformAdapter.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, cclegacy, view, sys;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
    }, function (module) {
      cclegacy = module.cclegacy;
      view = module.view;
      sys = module.sys;
    }],
    execute: function () {
      cclegacy._RF.push({}, "b8afa8IQ89wR7aDvyLGgpb7", "PlatformAdapter", undefined);
      /** Browser shell implements this contract; Cocos/WeChat never import browser APIs. */
      var PlatformAdapter = exports('PlatformAdapter', /*#__PURE__*/function () {
        function PlatformAdapter() {
          _classCallCheck(this, PlatformAdapter);
        }
        _createClass(PlatformAdapter, [{
          key: "web",
          get: function get() {
            return globalThis.__BREAKOUT_PLATFORM__;
          }
        }, {
          key: "frame",
          value: function frame() {
            var _this$web$viewport, _this$web;
            return (_this$web$viewport = (_this$web = this.web) === null || _this$web === void 0 ? void 0 : _this$web.viewport()) !== null && _this$web$viewport !== void 0 ? _this$web$viewport : view.getFrameSize();
          }
        }, {
          key: "browserSafeInsets",
          value: function browserSafeInsets() {
            var _this$web2;
            return (_this$web2 = this.web) === null || _this$web2 === void 0 ? void 0 : _this$web2.safeInsets();
          }
        }, {
          key: "status",
          value: function status() {
            var _this$web$status, _this$web3;
            return (_this$web$status = (_this$web3 = this.web) === null || _this$web3 === void 0 ? void 0 : _this$web3.status()) !== null && _this$web$status !== void 0 ? _this$web$status : {
              mode: sys.platform === sys.Platform.WECHAT_GAME ? "wechat-mini-game" : sys.isBrowser ? "browser" : "native",
              fullscreen: false,
              fullscreenSupported: false,
              ios: false
            };
          }
        }, {
          key: "enterFullscreen",
          value: function enterFullscreen() {
            var _this$web$enterFullsc, _this$web4;
            return (_this$web$enterFullsc = (_this$web4 = this.web) === null || _this$web4 === void 0 ? void 0 : _this$web4.enterFullscreen()) !== null && _this$web$enterFullsc !== void 0 ? _this$web$enterFullsc : Promise.resolve({
              entered: false,
              message: "当前平台由系统管理显示方向与全屏。"
            });
          }
        }, {
          key: "subscribeInactive",
          value: function subscribeInactive(fn) {
            var _this$web$subscribeIn, _this$web5;
            return (_this$web$subscribeIn = (_this$web5 = this.web) === null || _this$web5 === void 0 ? void 0 : _this$web5.subscribeInactive(fn)) !== null && _this$web$subscribeIn !== void 0 ? _this$web$subscribeIn : function () {};
          }
        }]);
        return PlatformAdapter;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PlatformBridge.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './PlatformAdapter.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, view, sys, game, Game, PlatformAdapter;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      view = module.view;
      sys = module.sys;
      game = module.game;
      Game = module.Game;
    }, function (module) {
      PlatformAdapter = module.PlatformAdapter;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d600bzHuylURQg/PYNiQ6L5", "PlatformBridge", undefined);
      /** All platform integration stays here. No storage/ads/network needed for V0.1. */
      var PlatformBridge = exports('PlatformBridge', /*#__PURE__*/function () {
        function PlatformBridge() {
          _classCallCheck(this, PlatformBridge);
          _defineProperty(this, "adapter", new PlatformAdapter());
          _defineProperty(this, "unsubscribe", void 0);
          _defineProperty(this, "onHide", void 0);
        }
        _createClass(PlatformBridge, [{
          key: "safeInsets",
          value: function safeInsets() {
            var _browserInsets$left, _browserInsets$right, _browserInsets$bottom, _browserInsets$top;
            var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1280;
            var height = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 720;
            var frame = view.getFrameSize(),
              r = sys.getSafeAreaRect(false),
              scale = Math.min(frame.width / width, frame.height / height);
            var mx = (frame.width - width * scale) / 2,
              my = (frame.height - height * scale) / 2;
            var browserInsets = this.adapter.browserSafeInsets();
            return {
              left: Math.max(0, (r.x - mx) / scale, ((_browserInsets$left = browserInsets === null || browserInsets === void 0 ? void 0 : browserInsets.left) !== null && _browserInsets$left !== void 0 ? _browserInsets$left : 0) / scale),
              right: Math.max(0, (frame.width - r.x - r.width - mx) / scale, ((_browserInsets$right = browserInsets === null || browserInsets === void 0 ? void 0 : browserInsets.right) !== null && _browserInsets$right !== void 0 ? _browserInsets$right : 0) / scale),
              bottom: Math.max(0, (r.y - my) / scale, ((_browserInsets$bottom = browserInsets === null || browserInsets === void 0 ? void 0 : browserInsets.bottom) !== null && _browserInsets$bottom !== void 0 ? _browserInsets$bottom : 0) / scale),
              top: Math.max(0, (frame.height - r.y - r.height - my) / scale, ((_browserInsets$top = browserInsets === null || browserInsets === void 0 ? void 0 : browserInsets.top) !== null && _browserInsets$top !== void 0 ? _browserInsets$top : 0) / scale)
            };
          }
        }, {
          key: "install",
          value: function install(onHide, snapshot) {
            this.onHide = onHide;
            game.on(Game.EVENT_HIDE, onHide);
            this.unsubscribe = this.adapter.subscribeInactive(onHide);
            globalThis.__BREAKOUT__ = {
              version: "0.5.7",
              snapshot: snapshot
            };
          }
        }, {
          key: "destroy",
          value: function destroy() {
            var _this$unsubscribe;
            if (this.onHide) game.off(Game.EVENT_HIDE, this.onHide);
            (_this$unsubscribe = this.unsubscribe) === null || _this$unsubscribe === void 0 || _this$unsubscribe.call(this);
            delete globalThis.__BREAKOUT__;
          }
        }]);
        return PlatformBridge;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/PlayerController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig, overlaps;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      overlaps = module.overlaps;
    }],
    execute: function () {
      cclegacy._RF.push({}, "5a048s+oK2pe63qhhmY9lXj", "PlayerController", undefined);
      var PlayerController = exports('PlayerController', /*#__PURE__*/function () {
        function PlayerController() {
          _classCallCheck(this, PlayerController);
          _defineProperty(this, "isPlayer", true);
          _defineProperty(this, "x", 110);
          _defineProperty(this, "y", 150);
          _defineProperty(this, "vx", 0);
          _defineProperty(this, "vy", 0);
          _defineProperty(this, "grounded", true);
          _defineProperty(this, "halfWidth", GameConfig.player.halfWidth);
          _defineProperty(this, "crouched", false);
          _defineProperty(this, "aimPitch", 0);
          _defineProperty(this, "landTime", 0);
          _defineProperty(this, "jumpCut", false);
          _defineProperty(this, "health", GameConfig.player.maxHealth);
          _defineProperty(this, "grenades", GameConfig.grenade.initial);
          _defineProperty(this, "standaloneWeapon", "rifle");
          _defineProperty(this, "equipped", void 0);
          _defineProperty(this, "facing", 1);
          _defineProperty(this, "invincible", 0);
          _defineProperty(this, "hitTime", 0);
          _defineProperty(this, "meleeTime", 0);
          _defineProperty(this, "meleeStage", 0);
          _defineProperty(this, "meleeProgress", 0);
          _defineProperty(this, "meleeStance", "stand");
          _defineProperty(this, "deadTime", 0);
          _defineProperty(this, "recoil", 0);
          _defineProperty(this, "animationTime", 0);
          _defineProperty(this, "stride", 0);
          _defineProperty(this, "groundSlope", 0);
          _defineProperty(this, "airJumpsRemaining", GameConfig.player.airJumps);
          _defineProperty(this, "jumpCount", 0);
          _defineProperty(this, "jumpSerial", 0);
          _defineProperty(this, "airJumpTime", 0);
          _defineProperty(this, "throwTime", 0);
          _defineProperty(this, "jumpWasPressed", false);
          _defineProperty(this, "coyote", 0);
          _defineProperty(this, "buffer", 0);
          _defineProperty(this, "hurtbox", {
            x: 0,
            y: 0,
            w: 26,
            h: 65
          });
        }
        _createClass(PlayerController, [{
          key: "height",
          get: function get() {
            return this.crouched ? 43 : GameConfig.player.height;
          }
        }, {
          key: "bindWeapon",
          value: function bindWeapon(source) {
            this.equipped = source;
          }
        }, {
          key: "weaponId",
          get: function get() {
            var _this$equipped$id, _this$equipped;
            return (_this$equipped$id = (_this$equipped = this.equipped) === null || _this$equipped === void 0 ? void 0 : _this$equipped.id) !== null && _this$equipped$id !== void 0 ? _this$equipped$id : this.standaloneWeapon;
          }
          // Compatibility for standalone model tests; the session never keeps a second ID.
          ,

          set: function set(id) {
            this.standaloneWeapon = id;
          }
        }, {
          key: "canJump",
          get: function get() {
            return this.alive && (this.grounded || this.coyote > 0 || this.airJumpsRemaining > 0);
          }
        }, {
          key: "alive",
          get: function get() {
            return this.health > 0;
          }
        }, {
          key: "bounds",
          get: function get() {
            this.hurtbox.x = this.x - 13;
            this.hurtbox.y = this.y + 3;
            this.hurtbox.h = this.crouched ? 36 : 65;
            return this.hurtbox;
          }
        }, {
          key: "animation",
          get: function get() {
            if (!this.alive) return "Dead";
            if (this.hitTime > 0) return "Hit";
            if (!this.grounded) return this.vy > 0 ? "Jump" : "Fall";
            if (this.crouched) return "Crouch";
            if (this.landTime > 0) return "Land";
            if (Math.abs(this.vx) > 8) return "Run";
            return this.recoil > 0 ? "Shoot" : "Idle";
          }
        }, {
          key: "reset",
          value: function reset(x, y) {
            this.meleeTime = 0;
            this.meleeStage = this.meleeProgress = 0;
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.grounded = true;
            this.health = GameConfig.player.maxHealth;
            this.grenades = GameConfig.grenade.initial;
            this.weaponId = "rifle";
            this.facing = 1;
            this.crouched = false;
            this.aimPitch = 0;
            this.landTime = 0;
            this.stride = this.groundSlope = 0;
            this.airJumpsRemaining = GameConfig.player.airJumps;
            this.jumpCount = this.jumpSerial = this.airJumpTime = 0;
            this.jumpWasPressed = false;
            this.jumpCut = false;
            this.invincible = this.hitTime = this.deadTime = this.recoil = this.animationTime = this.coyote = this.buffer = 0;
          }
        }, {
          key: "update",
          value: function update(dt, input, level) {
            var _this = this;
            this.animationTime += dt;
            this.airJumpTime = Math.max(0, this.airJumpTime - dt);
            var jumpPressed = input.jump && !this.jumpWasPressed;
            this.jumpWasPressed = input.jump;
            this.landTime = Math.max(0, this.landTime - dt);
            this.recoil = Math.max(0, this.recoil - dt * 8);
            this.invincible = Math.max(0, this.invincible - dt);
            this.hitTime = Math.max(0, this.hitTime - dt);
            if (!this.alive) {
              this.deadTime += dt;
              this.vx *= Math.exp(-dt * 8);
            } else {
              if (Math.abs(input.axis) > 0.06) this.facing = input.axis > 0 ? 1 : -1;
              var wantsCrouch = !!input.crouch && this.grounded;
              var blockedStanding = this.crouched && level.solids.some(function (s) {
                return !s.slope && overlaps({
                  x: _this.x - 13,
                  y: _this.y + 0.5,
                  w: 26,
                  h: GameConfig.player.height - 0.5
                }, s);
              });
              this.crouched = wantsCrouch || blockedStanding;
              this.aimPitch = input.aimY ? Math.abs(input.axis) > 0.3 ? Math.PI / 4 : Math.PI / 2 : 0;
              var target = input.axis * (this.crouched ? GameConfig.player.crouchSpeed : GameConfig.player.speed);
              var change = (input.axis ? GameConfig.player.acceleration : GameConfig.player.deceleration) * dt;
              this.vx += Math.max(-change, Math.min(change, target - this.vx));
              this.coyote = this.grounded ? GameConfig.player.coyoteTime : Math.max(0, this.coyote - dt);
              this.buffer = jumpPressed ? GameConfig.player.jumpBuffer : Math.max(0, this.buffer - dt);
              if (this.buffer > 0 && this.coyote > 0) {
                this.vy = GameConfig.player.jumpVelocity;
                this.grounded = false;
                this.coyote = 0;
                this.buffer = 0;
                this.jumpCut = false;
                this.crouched = false;
                this.jumpCount = 1;
                this.jumpSerial++;
              } else if (jumpPressed && !this.grounded && this.airJumpsRemaining > 0) {
                this.vy = GameConfig.player.airJumpVelocity;
                this.airJumpsRemaining--;
                this.jumpCount = 2;
                this.jumpSerial++;
                this.airJumpTime = 0.18;
                this.buffer = this.coyote = 0;
                this.jumpCut = this.crouched = false;
              }
              // Legacy simulation frames omit jumpHeld; real device frames always provide it.
              if (input.jumpHeld === false && !this.jumpCut && this.vy > 0) {
                this.vy *= GameConfig.player.jumpCut;
                this.jumpCut = true;
              }
            }
            this.vy -= GameConfig.player.gravity * dt;
            var wasGrounded = this.grounded;
            var oldX = this.x;
            level.move(this, dt);
            if (this.grounded) {
              this.stride += (this.x - oldX) * this.facing / GameConfig.animation.strideLength;
              this.airJumpsRemaining = GameConfig.player.airJumps;
              this.jumpCount = 0;
            }
            if (!wasGrounded && this.grounded) this.landTime = 0.14;
            if (this.y < -200) this.takeDamage(this.health, this.facing);
          }
        }, {
          key: "takeDamage",
          value: function takeDamage(amount, direction) {
            if (!this.alive || this.invincible > 0) return false;
            this.health = Math.max(0, this.health - Math.ceil(amount));
            this.invincible = GameConfig.player.invincibility;
            this.hitTime = 0.22;
            this.vx = direction * 145;
            return true;
          }
        }]);
        return PlayerController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ProjectileArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, cclegacy, colors;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      colors = module.colors;
    }],
    execute: function () {
      cclegacy._RF.push({}, "22769E7gj/khm2ZKyyCe5Hn", "ProjectileArt", undefined);

      /** The nose is at the collision point. All shapes rotate along the actual velocity. */
      var ProjectileArt = exports('ProjectileArt', /*#__PURE__*/function () {
        function ProjectileArt() {
          _classCallCheck(this, ProjectileArt);
        }
        _createClass(ProjectileArt, [{
          key: "draw",
          value: function draw(ink, p, cameraX, time) {
            var x = p.x - cameraX,
              y = p.y,
              length = Math.hypot(p.vx, p.vy) || 1;
            var visualScale = p.kind === "rocket" ? 2.1 : p.kind === "bullet" || p.kind === "pellet" ? 1.6 : 1;
            var cs = p.vx / length * visualScale,
              sn = p.vy / length * visualScale;
            var line = function line(a, b, c, d) {
              var w = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 2;
              var tint = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : colors.ink;
              return ink.segment(x + a * cs - b * sn, y + a * sn + b * cs, x + c * cs - d * sn, y + c * sn + d * cs, w, tint);
            };
            var shape = function shape(points) {
              var fill = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : colors.paper;
              var w = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 2.5;
              var g = ink.g;
              g.moveTo(x + points[0] * cs - points[1] * sn, y + points[0] * sn + points[1] * cs);
              for (var i = 2; i < points.length; i += 2) g.lineTo(x + points[i] * cs - points[i + 1] * sn, y + points[i] * sn + points[i + 1] * cs);
              g.close();
              g.fillColor = fill;
              g.fill();
              g.strokeColor = colors.ink;
              g.lineWidth = w;
              g.stroke();
            };
            if (p.kind === "shockwave") {
              shape([-34, -9, -21, 4, -16, 21, -6, 9, 5, 20, 12, 5, 3, -10], colors.white, 3);
              line(-38, 2, -57, 3, 2.4);
              line(-37, -6, -51, -6, 2);
            } else if (p.kind === "rocket") {
              var flame = 8 + Math.sin(time * 63) * 3;
              shape([-32, 4, -41, 6, -39, 2, -49 - flame, 0, -40, -2, -44, -6, -32, -4], colors.white, 2);
              shape([-24, 5, -31, 12, -37, 12, -33, 0, -37, -12, -31, -12, -24, -5]);
              var g = ink.g;
              var px = function px(a, b) {
                return x + a * cs - b * sn;
              };
              var py = function py(a, b) {
                return y + a * sn + b * cs;
              };
              g.moveTo(x, y);
              g.bezierCurveTo(px(-4, 5), py(-4, 5), px(-10, 7), py(-10, 7), px(-18, 6), py(-18, 6));
              g.lineTo(px(-30, 5), py(-30, 5));
              g.lineTo(px(-30, -5), py(-30, -5));
              g.bezierCurveTo(px(-18, -7), py(-18, -7), px(-6, -7), py(-6, -7), x, y);
              g.close();
              g.fillColor = colors.paper;
              g.fill();
              g.strokeColor = colors.ink;
              g.lineWidth = 3;
              g.stroke();
              line(-9, -5, -9, 5, 2.2);
              line(-14, -5, -14, 5, 2);
              line(-18, 3, -27, 3, 1.2, colors.mid);
              line(-46, 13, -65, 13, 1.5, colors.muted);
              line(-46, -13, -60, -13, 1.5, colors.muted);
            } else if (p.kind === "pellet") {
              line(-15, 0, -5, 0, 1.5, colors.muted);
              ink.circle(x, y, 2.8, colors.ink, colors.paper, 1.7);
            } else if (p.kind === "cannon") {
              line(-22, 0, -8, 0, 2, colors.muted);
              shape([0, 0, -5, 6, -12, 4, -12, -4, -5, -6], colors.paper);
            } else {
              line(-23, 0, -12, 0, 1.6, colors.muted);
              shape([0, 0, -3, 2, -10, 2, -10, -2, -3, -2], colors.paper, 1.8);
            }
          }
        }, {
          key: "grenade",
          value: function grenade(ink, p, cameraX) {
            var x = p.x - cameraX,
              y = p.y,
              cs = Math.cos(p.spin),
              sn = Math.sin(p.spin),
              g = ink.g;
            var px = function px(a, b) {
              return x + a * cs - b * sn;
            };
            var py = function py(a, b) {
              return y + a * sn + b * cs;
            };
            ink.circle(x, y, 7, colors.ink, colors.mid, 2.5);
            g.moveTo(px(-3, 5), py(-3, 5));
            g.lineTo(px(-3, 10), py(-3, 10));
            g.lineTo(px(3, 10), py(3, 10));
            g.lineTo(px(3, 5), py(3, 5));
            g.close();
            g.fillColor = colors.paper;
            g.fill();
            g.strokeColor = colors.ink;
            g.lineWidth = 2;
            g.stroke();
            ink.segment(px(3, 9), py(3, 9), px(8, 7), py(8, 7), 2);
            ink.segment(px(-4, 1), py(-4, 1), px(4, 1), py(4, 1), 1.4, colors.paper);
            ink.segment(x - p.vx * 0.035, y - p.vy * 0.035, x - p.vx * 0.065, y - p.vy * 0.065, 1.5, colors.muted);
            if (p.fuse < 0.3) ink.segment(px(3, 13), py(3, 13), px(7, 17), py(7, 17), 2);
          }
        }]);
        return ProjectileArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ProjectileManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, GameConfig, segmentRect;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      segmentRect = module.segmentRect;
    }],
    execute: function () {
      cclegacy._RF.push({}, "c63b8nadg3alJkZlwB3eZ+6", "ProjectileManager", undefined);
      var ProjectileManager = exports('ProjectileManager', /*#__PURE__*/function () {
        function ProjectileManager(particles) {
          _classCallCheck(this, ProjectileManager);
          _defineProperty(this, "marks", Array.from({
            length: 36
          }, function () {
            return {
              active: false,
              x: 0,
              y: 0
            };
          }));
          _defineProperty(this, "markCursor", 0);
          _defineProperty(this, "items", Array.from({
            length: GameConfig.pools.projectiles
          }, function () {
            return {
              active: false,
              owner: "player",
              x: 0,
              y: 0,
              lastX: 0,
              lastY: 0,
              vy: 0,
              vx: 0,
              damage: 0,
              distance: 0,
              range: 0,
              kind: "bullet",
              blastRadius: 0,
              knockback: 0,
              gravity: 0,
              smokeTime: 0,
              firstFrame: false,
              originX: 0,
              originY: 0,
              homing: false,
              age: 0,
              launchRemaining: 0,
              launchAngle: 0
            };
          }));
          _defineProperty(this, "fired", 0);
          _defineProperty(this, "hits", 0);
          _defineProperty(this, "dropped", 0);
          _defineProperty(this, "peak", 0);
          _defineProperty(this, "onExplosion", void 0);
          _defineProperty(this, "playerTargets", []);
          this.particles = particles;
        }
        _createClass(ProjectileManager, [{
          key: "reset",
          value: function reset() {
            var _iterator = _createForOfIteratorHelper(this.marks),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var m = _step.value;
                m.active = false;
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.markCursor = 0;
            var _iterator2 = _createForOfIteratorHelper(this.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var p = _step2.value;
                p.active = false;
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            this.fired = this.hits = this.dropped = this.peak = 0;
          }
        }, {
          key: "spawn",
          value: function spawn(s) {
            var _ref, _s$launchPitch, _ref2, _s$launchPitch2, _s$kind, _s$blastRadius, _s$knockback, _s$gravity, _s$originX, _s$originY, _s$homing, _s$pitch, _s$pitch2, _s$pitch3;
            var p = this.items.find(function (p) {
              return !p.active;
            });
            if (!p) {
              this.dropped++;
              return false;
            }
            Object.assign(p, {
              active: true,
              owner: s.owner,
              x: s.x,
              y: s.y,
              lastX: s.x,
              vx: s.direction * Math.cos((_ref = (_s$launchPitch = s.launchPitch) !== null && _s$launchPitch !== void 0 ? _s$launchPitch : s.pitch) !== null && _ref !== void 0 ? _ref : 0) * s.speed,
              vy: Math.sin((_ref2 = (_s$launchPitch2 = s.launchPitch) !== null && _s$launchPitch2 !== void 0 ? _s$launchPitch2 : s.pitch) !== null && _ref2 !== void 0 ? _ref2 : 0) * s.speed,
              lastY: s.y,
              damage: s.damage,
              distance: 0,
              range: s.range,
              kind: (_s$kind = s.kind) !== null && _s$kind !== void 0 ? _s$kind : "bullet",
              blastRadius: (_s$blastRadius = s.blastRadius) !== null && _s$blastRadius !== void 0 ? _s$blastRadius : 0,
              knockback: (_s$knockback = s.knockback) !== null && _s$knockback !== void 0 ? _s$knockback : 0,
              gravity: (_s$gravity = s.gravity) !== null && _s$gravity !== void 0 ? _s$gravity : 0,
              smokeTime: 0,
              firstFrame: true,
              originX: (_s$originX = s.originX) !== null && _s$originX !== void 0 ? _s$originX : s.x,
              originY: (_s$originY = s.originY) !== null && _s$originY !== void 0 ? _s$originY : s.y,
              homing: (_s$homing = s.homing) !== null && _s$homing !== void 0 ? _s$homing : false,
              age: 0,
              target: undefined,
              launchAngle: Math.atan2(Math.sin((_s$pitch = s.pitch) !== null && _s$pitch !== void 0 ? _s$pitch : 0), s.direction * Math.cos((_s$pitch2 = s.pitch) !== null && _s$pitch2 !== void 0 ? _s$pitch2 : 0)),
              launchRemaining: s.launchPitch === undefined ? 0 : Math.abs(((_s$pitch3 = s.pitch) !== null && _s$pitch3 !== void 0 ? _s$pitch3 : 0) - s.launchPitch) / GameConfig.rocketLaunch.turnRate
            });
            this.fired++;
            this.peak = Math.max(this.peak, this.items.filter(function (p) {
              return p.active;
            }).length);
            return true;
          }
        }, {
          key: "update",
          value: function update(dt, player, enemies, solids, onHit) {
            var objects = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : [];
            var _iterator3 = _createForOfIteratorHelper(this.items),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var p = _step3.value;
                if (!p.active) continue;
                p.lastX = p.x;
                p.lastY = p.y;
                p.age += dt;
                // The first sweep leaves the painted barrel. Upward input used to rotate
                // the entire 116-unit missile instantly beside a horizontal launcher.
                if (p.launchRemaining > 0) {
                  if (p.age > dt + 1e-8) {
                    var angle = Math.atan2(p.vy, p.vx),
                      speed = Math.hypot(p.vx, p.vy);
                    var delta = Math.atan2(Math.sin(p.launchAngle - angle), Math.cos(p.launchAngle - angle));
                    var turn = Math.max(-GameConfig.rocketLaunch.turnRate * dt, Math.min(GameConfig.rocketLaunch.turnRate * dt, delta));
                    p.vx = Math.cos(angle + turn) * speed;
                    p.vy = Math.sin(angle + turn) * speed;
                    p.launchRemaining = Math.max(0, p.launchRemaining - dt);
                  }
                } else if (p.homing && p.owner === "player" && p.age >= GameConfig.homing.delay) this.guide(p, dt, enemies, solids);
                p.vy -= p.gravity * dt;
                if (p.kind === "rocket" || p.kind === "cannon") {
                  p.smokeTime -= dt;
                  if (p.smokeTime <= 0) {
                    var _speed = Math.hypot(p.vx, p.vy) || 1;
                    var tail = p.kind === "rocket" && p.owner === "player" ? Math.max(32, Math.min(GameConfig.rocketLaunch.visualLength, GameConfig.rocketLaunch.exposedNose + p.distance)) : 50;
                    this.particles.emit(p.x - p.vx / _speed * tail, p.y - p.vy / _speed * tail, "smoke", -p.vx * 0.05, 20);
                    p.smokeTime = 0.045;
                  }
                }
                var end = {
                    x: p.x + p.vx * dt,
                    y: p.y + p.vy * dt
                  },
                  start = {
                    x: p.firstFrame ? p.originX : p.x,
                    y: p.firstFrame ? p.originY : p.y
                  };
                p.firstFrame = false;
                var nearest = 1.01,
                  _target = void 0;
                var _iterator4 = _createForOfIteratorHelper(solids),
                  _step4;
                try {
                  for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                    var solid = _step4.value;
                    if ("entityId" in solid) continue;
                    var _t = segmentRect(start, end, solid, 1.5);
                    if (_t !== null && _t < nearest) {
                      nearest = _t;
                      _target = undefined;
                    }
                  }
                } catch (err) {
                  _iterator4.e(err);
                } finally {
                  _iterator4.f();
                }
                this.playerTargets[0] = player;
                var actors = p.owner === "player" ? enemies : this.playerTargets;
                for (var index = 0; index < actors.length + objects.length; index++) {
                  var candidate = index < actors.length ? actors[index] : objects[index - actors.length];
                  if (!candidate.alive) continue;
                  var t = segmentRect(start, end, candidate.bounds, p.kind === "shockwave" ? 12 : p.kind === "cannon" ? 6 : p.kind === "rocket" ? 4 : 2);
                  if (t !== null && t < nearest) {
                    nearest = t;
                    _target = candidate;
                  }
                }
                if (nearest <= 1) {
                  p.x = start.x + (end.x - start.x) * nearest;
                  p.y = start.y + (end.y - start.y) * nearest;
                  p.active = false;
                  var material = _target && "kind" in _target ? _target.kind : undefined;
                  this.particles.impact(p.x, p.y, material === "wood" || material === "hanging" ? "wood" : material === "steel" || material === "barrel" || material === "guard" || material === "colossus" || material === "turret" || material === "shield" ? "metal" : _target && !("category" in _target) ? "enemy" : "stone");
                  if (!_target || "category" in _target && _target.category === "indestructible") {
                    var m = this.marks[this.markCursor++ % this.marks.length];
                    m.active = true;
                    m.x = p.x;
                    m.y = p.y;
                  }
                  if (p.blastRadius > 0) {
                    var _this$onExplosion;
                    (_this$onExplosion = this.onExplosion) === null || _this$onExplosion === void 0 || _this$onExplosion.call(this, p.x, p.y, p.blastRadius, p.damage, p.owner, p.kind === "rocket" ? "rocket" : "cannon");
                  } else if (_target && _target.takeDamage(p.kind === "pellet" && p.distance < 180 ? p.damage * 1.5 : p.damage, p.vx > 0 ? 1 : -1, "bullet")) {
                    this.hits++;
                    var body = _target;
                    if (body.vx !== undefined && p.knockback > 0) {
                      body.vx = (p.vx > 0 ? 1 : -1) * p.knockback;
                      if (p.kind === "pellet" && body.vy !== undefined) body.vy = Math.max(body.vy, 100);
                    }
                    onHit === null || onHit === void 0 || onHit(_target);
                  }
                } else {
                  p.x = end.x;
                  p.y = end.y;
                  p.distance += Math.hypot(p.vx, p.vy) * dt;
                  if (p.distance >= p.range) p.active = false;
                }
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
        }, {
          key: "guide",
          value: function guide(p, dt, enemies, solids) {
            var angle = Math.atan2(p.vy, p.vx);
            var delta = function delta(to) {
              return Math.atan2(Math.sin(to - angle), Math.cos(to - angle));
            };
            var visible = function visible(e) {
              var b = e.bounds,
                point = {
                  x: b.x + b.w / 2,
                  y: b.y + b.h / 2
                };
              return e.alive && Math.hypot(point.x - p.x, point.y - p.y) < GameConfig.homing.acquireRange && !solids.some(function (s) {
                return segmentRect(p, point, s, 1) !== null;
              });
            };
            if (p.target && !visible(p.target)) p.target = undefined;
            if (!p.target) {
              var nearest = Infinity;
              var _iterator5 = _createForOfIteratorHelper(enemies),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var e = _step5.value;
                  var _b = e.bounds,
                    dx = _b.x + _b.w / 2 - p.x,
                    dy = _b.y + _b.h / 2 - p.y;
                  var distance = Math.hypot(dx, dy);
                  if (distance < nearest && Math.abs(delta(Math.atan2(dy, dx))) <= GameConfig.homing.cone && visible(e)) {
                    nearest = distance;
                    p.target = e;
                  }
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
            }
            if (!p.target) return;
            var b = p.target.bounds;
            var turn = delta(Math.atan2(b.y + b.h / 2 - p.y, b.x + b.w / 2 - p.x));
            var next = angle + Math.max(-GameConfig.homing.turnRate * dt, Math.min(GameConfig.homing.turnRate * dt, turn));
            var speed = Math.hypot(p.vx, p.vy);
            p.vx = Math.cos(next) * speed;
            p.vy = Math.sin(next) * speed;
          }
        }]);
        return ProjectileManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/RocketPresentation.ts", ['cc', './GameConfig.ts'], function (exports) {
  var cclegacy, GameConfig;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      exports('rocketCrop', rocketCrop);
      cclegacy._RF.push({}, "81aac/QBdCXQzASzDvMOmlt", "RocketPresentation", undefined);

      /** Reveal the original sprite from its nose while it is leaving the barrel.
       * Four-source-pixel steps bound the region cache to 50 entries for this sheet.
       */
      function rocketCrop(distance, sourceWidth, sourceHeight) {
        var exposed = Math.min(GameConfig.rocketLaunch.visualLength, GameConfig.rocketLaunch.exposedNose + Math.max(0, distance));
        var width = Math.min(sourceWidth, Math.max(4, Math.ceil(exposed / GameConfig.rocketLaunch.visualLength * sourceWidth / 4) * 4));
        return [sourceWidth - width, 0, width, sourceHeight];
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SceneryArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _defineProperty, _classCallCheck, _slicedToArray, cclegacy, Color, colors;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _defineProperty = module.defineProperty;
      _classCallCheck = module.classCallCheck;
      _slicedToArray = module.slicedToArray;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
    }, function (module) {
      colors = module.colors;
    }],
    execute: function () {
      cclegacy._RF.push({}, "d4986IOojGJFuRRCYu743Ir", "SceneryArt", undefined);
      /** Original ink contours: authored irregular silhouettes, sparse material strokes. */
      var SceneryArt = exports('SceneryArt', /*#__PURE__*/function () {
        function SceneryArt() {
          _classCallCheck(this, SceneryArt);
        }
        _createClass(SceneryArt, null, [{
          key: "stroke",
          value: function stroke(g, x, y, points) {
            var width = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 2;
            var color = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : colors.mid;
            var fill = arguments.length > 6 ? arguments[6] : undefined;
            var smooth = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0.12;
            var p = [];
            for (var i = 0; i < points.length; i += 2) p.push({
              x: x + points[i],
              y: y + points[i + 1]
            });
            var closed = !!fill,
              n = p.length,
              ctx = g.g;
            ctx.moveTo(p[0].x, p[0].y);
            for (var _i = 0; _i < (closed ? n : n - 1); _i++) {
              var a = p[_i],
                b = p[(_i + 1) % n],
                prev = p[(_i - 1 + n) % n],
                next = p[(_i + 2) % n];
              var before = !closed && _i === 0 ? a : prev,
                after = !closed && _i === n - 2 ? b : next;
              ctx.bezierCurveTo(a.x + (b.x - before.x) * smooth, a.y + (b.y - before.y) * smooth, b.x - (after.x - a.x) * smooth, b.y - (after.y - a.y) * smooth, b.x, b.y);
            }
            if (fill) {
              ctx.close();
              ctx.fillColor = fill;
              ctx.fill();
            }
            ctx.strokeColor = color;
            ctx.lineWidth = width;
            ctx.stroke();
          }
        }, {
          key: "cloud",
          value: function cloud(g, x, y) {
            var size = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
            this.stroke(g, x, y, [0, 0, 4, 8, 21, 9, 28, 20, 42, 20, 50, 14, 64, 29, 82, 26, 90, 13, 107, 16, 112, 7, 126, 5, 129, -1, 93, -3, 42, -2, 0, 0].map(function (v) {
              return v * size;
            }), 2, colors.far);
          }
        }, {
          key: "ridge",
          value: function ridge(g, variant) {
            // Rounded eroded escarpment; asymmetry and long resting contours avoid triangular mountains.
            var shift = variant % 3 * 12;
            this.stroke(g, 0, 0, [-16, 209, 35, 222, 64, 243, 99, 247, 122, 263, 135, 306, 145, 324 + shift, 170, 337 + shift, 209, 335 + shift, 227, 341 + shift, 252, 334, 271, 283, 291, 275, 311, 247, 350, 233, 408, 228, 439, 254, 474, 260, 501, 286, 526, 298, 534, 321, 560, 327, 593, 324, 620, 334, 643, 317, 651, 292, 680, 262, 701, 259, 745, 218, 816, 209], 2.5, this.rockInk);
            for (var _i2 = 0, _arr = [[154, 325 + shift], [220, 324], [550, 315], [605, 316]]; _i2 < _arr.length; _i2++) {
              var _arr$_i = _slicedToArray(_arr[_i2], 2),
                x = _arr$_i[0],
                y = _arr$_i[1];
              this.stroke(g, x, y, [0, 0, -4, -25, 2, -41, -8, -68, -5, -89], 1.5, this.rockInk);
              this.stroke(g, x - 12, y - 42, [0, 0, 18, -3, 32, 0], 1.2, this.rockInk);
            }
            this.stroke(g, 0, 0, [-10, 188, 56, 204, 99, 201, 134, 218, 168, 211, 201, 196, 258, 193, 298, 214, 342, 209, 397, 191, 456, 206, 494, 203, 553, 189, 609, 209, 658, 207, 707, 192, 815, 188], 1.8, this.rockInk);
          }
        }, {
          key: "rock",
          value: function rock(g, x, y) {
            var size = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
            var foreground = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
            var c = foreground ? colors.muted : colors.mid;
            this.stroke(g, x, y, [-18, 0, -22, 8, -13, 21, 0, 25, 12, 19, 21, 8, 18, 0].map(function (v) {
              return v * size;
            }), foreground ? 2.2 : 1.6, c, colors.paper, 0.08);
            this.stroke(g, x, y, [-12, 18, 0, 15, 7, 5, 18, 1].map(function (v) {
              return v * size;
            }), 1.2, c);
          }
        }, {
          key: "tower",
          value: function tower(g, x, y) {
            var c = colors.mid;
            for (var _i3 = 0, _arr2 = [-1, 1]; _i3 < _arr2.length; _i3++) {
              var side = _arr2[_i3];
              g.segment(x + side * 36, y, x + side * 27, y + 171, 6, c);
              g.segment(x + side * 36, y, x + side * 27, y + 171, 2.5, colors.paper);
            }
            for (var h = 10; h < 150; h += 48) {
              g.segment(x - 32, y + h, x + 31, y + h + 43, 2.4, c);
              g.segment(x + 32, y + h, x - 31, y + h + 43, 2.4, c);
            }
            this.stroke(g, x, y, [-42, 171, -42, 183, 42, 184, 42, 170], 2.5, c, colors.paper, 0.025);
            this.stroke(g, x, y, [-36, 185, -36, 209, 35, 210, 35, 185], 2.5, c);
            for (var p = -28; p <= 28; p += 18) g.segment(x + p, y + 186, x + p, y + 209, 2, c);
            g.segment(x + 25, y + 211, x + 25, y + 254, 2.5, c);
            this.stroke(g, x, y, [26, 249, 41, 245, 48, 247, 46, 231, 37, 229, 26, 233], 2, c, colors.wall);
          }
        }, {
          key: "bunker",
          value: function bunker(g, x, y) {
            var width = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 280;
            var s = width / 280,
              p = function p(a) {
                return a.map(function (v, i) {
                  return i % 2 ? v : v * s;
                });
              },
              c = colors.mid;
            this.stroke(g, x, y, p([0, 0, -2, 91, 2, 145, 25, 148, 26, 166, 53, 172, 94, 172, 111, 163, 178, 163, 179, 146, 226, 147, 237, 136, 277, 136, 280, 58, 277, 0]), 2.6, c, colors.wall, 0.025);
            this.stroke(g, x, y, p([-7, 146, 26, 150, 27, 163, 61, 166, 98, 165, 110, 157, 175, 157]), 2.2, c);
            // Recessed arched doorway and a boarded observation window.
            this.stroke(g, x, y, p([21, 0, 22, 65, 29, 84, 47, 90, 65, 82, 72, 63, 72, 0]), 2.2, c, colors.paper);
            this.stroke(g, x, y, p([29, 0, 30, 60, 38, 75, 56, 74, 63, 59, 63, 0]), 1.3, c);
            this.stroke(g, x, y, p([123, 69, 123, 103, 186, 105, 188, 70]), 2, c, colors.paper, 0.035);
            this.stroke(g, x, y, p([120, 81, 190, 86, 190, 91, 121, 86]), 1.4, c, colors.wall, 0.025);
            this.stroke(g, x, y, p([232, 135, 221, 112, 232, 98, 217, 83]), 1.7, c);
            this.stroke(g, x, y, p([246, 32, 230, 35, 221, 26, 212, 30]), 1.5, c);
            for (var _i4 = 0, _arr3 = [[92, 22], [98, 33], [189, 125], [199, 117]]; _i4 < _arr3.length; _i4++) {
              var _arr3$_i = _slicedToArray(_arr3[_i4], 2),
                bx = _arr3$_i[0],
                by = _arr3$_i[1];
              g.segment(x + bx * s, y + by, x + (bx + 12) * s, y + by + 1, 1.4, c);
            }
            // Curved roof tank and a short bent pipe replace the old window lattice.
            this.stroke(g, x, y, p([39, 174, 40, 192, 47, 201, 71, 201, 80, 191, 80, 174]), 1.8, c, colors.paper);
            this.stroke(g, x, y, p([59, 200, 59, 224, 66, 231, 80, 231, 85, 224, 85, 215]), 5, colors.wall);
            this.stroke(g, x, y, p([59, 200, 59, 224, 66, 231, 80, 231, 85, 224, 85, 215]), 1.8, c);
            this.rock(g, x + width - 3, y, 0.75);
            this.rock(g, x + width + 19, y - 1, 0.48);
          }
        }, {
          key: "factory",
          value: function factory(g, x, y) {
            // A ruined pump house, not a repeated box of identical windows.
            this.bunker(g, x, y, 250);
            var c = colors.mid;
            this.stroke(g, x, y, [212, 138, 211, 202, 206, 214, 212, 238, 226, 244, 242, 239, 247, 225, 242, 202, 244, 138], 2.2, c, colors.paper);
            this.stroke(g, x, y, [211, 229, 228, 226, 246, 230], 1.7, c);
            this.stroke(g, x, y, [253, 20, 286, 23, 301, 42, 300, 91, 286, 107, 267, 108], 9, colors.wall);
            this.stroke(g, x, y, [253, 20, 286, 23, 301, 42, 300, 91, 286, 107, 267, 108], 2, c);
            g.ellipse(x + 282, y + 60, 13, 15, c, colors.paper, 2);
            g.segment(x + 271, y + 60, x + 293, y + 60, 1.7, c);
            this.rock(g, x + 294, y, 1.1);
          }
        }, {
          key: "crane",
          value: function crane(g, x, y) {
            // Small broken loading gantry; large blank openings keep the battle readable.
            var c = colors.mid;
            this.stroke(g, x, y, [0, 0, 3, 192, 13, 199, 27, 196, 24, 0], 2.4, c, colors.wall, 0.02);
            this.stroke(g, x, y, [9, 188, 12, 207, 229, 208, 230, 190], 2.5, c, colors.paper, 0.02);
            this.stroke(g, x, y, [210, 0, 211, 187, 226, 190, 232, 0], 2.3, c, colors.wall, 0.02);
            g.segment(x + 17, y + 146, x + 70, y + 191, 2, c);
            this.stroke(g, x, y, [129, 190, 128, 136, 137, 124, 135, 100, 128, 96, 122, 103], 2.3, c);
            this.stroke(g, x, y, [26, 56, 40, 69, 73, 65, 87, 54, 84, 0, 22, 0], 2, c, colors.wall);
            this.rock(g, x + 214, y, 0.8);
          }
        }, {
          key: "truck",
          value: function truck(g, x, y) {
            var c = colors.far;
            this.stroke(g, x, y, [0, 18, 1, 60, 18, 73, 87, 73, 99, 65, 99, 18], 1.8, c, undefined, 0.04);
            this.stroke(g, x, y, [100, 19, 149, 19, 148, 53, 132, 69, 103, 68, 100, 19], 1.8, c);
            g.circle(x + 24, y + 17, 12, c, undefined, 1.5);
            g.circle(x + 127, y + 17, 12, c, undefined, 1.5);
          }
        }, {
          key: "serviceBay",
          value: function serviceBay(g, x, y) {
            // A low weathered wall with vegetation and rubble, not another box machine.
            var c = colors.mid;
            this.stroke(g, x, y, [0, 0, 0, 44, 12, 49, 23, 43, 31, 51, 56, 48, 63, 30, 83, 34, 95, 25, 113, 28, 119, 0], 2, c, colors.wall, 0.06);
            this.stroke(g, x, y, [30, 47, 26, 28, 37, 20, 32, 10], 1.6, c);
            this.rock(g, x + 99, y, 0.9);
            this.rock(g, x + 119, y, 0.5);
            this.stroke(g, x - 14, y, [0, 0, -3, 14, -8, 26, -5, 35], 2, c);
            this.stroke(g, x - 14, y, [-2, 12, 10, 18, 14, 29], 2, c);
          }
        }]);
        return SceneryArt;
      }());
      _defineProperty(SceneryArt, "rockInk", new Color(198, 198, 192));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/StickmanAnimator.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      cclegacy._RF.push({}, "91a23jJpaZCdfPepzNcCdBj", "StickmanAnimator", undefined);
      var p = function p(x, y) {
        return {
          x: x,
          y: y
        };
      };
      var StickmanAnimator = exports('StickmanAnimator', /*#__PURE__*/function () {
        function StickmanAnimator() {
          var _this = this;
          _classCallCheck(this, StickmanAnimator);
          _defineProperty(this, "points", Array.from({
            length: 64
          }, function () {
            return p(0, 0);
          }));
          _defineProperty(this, "cursor", 0);
          _defineProperty(this, "point", function (x, y) {
            var v = _this.points[_this.cursor++];
            v.x = x;
            v.y = y;
            return v;
          });
        }
        _createClass(StickmanAnimator, [{
          key: "sample",
          value: /** Local coordinates face right, origin at feet. Upper body remains aimed while running. */
          function sample(state, time, recoil, armed) {
            var _motion$stride;
            var deadTime = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
            var aimPitch = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
            var motion = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : {};
            this.cursor = 0;
            var p = this.point;
            var run = state === "Run",
              air = state === "Jump" || state === "Fall";
            var phase = (_motion$stride = motion.stride) !== null && _motion$stride !== void 0 ? _motion$stride : time * 2.5;
            var wave = Math.sin(phase * Math.PI * 2),
              breathe = Math.sin(time * 3) * 0.8;
            var bob = run ? -1.5 * Math.cos(phase * Math.PI * 4) : breathe;
            var lean = (run ? 9 : state === "Hit" ? -12 : state === "Shoot" ? 7 : 4) - recoil * 3;
            var kick = recoil * 4.8;
            var pose = {
              head: p(lean, 68 + bob * 0.65),
              neck: p(lean, 54 + bob),
              torso: p(0, 32 + bob),
              leftShoulder: p(lean - 4, 49 + bob),
              rightShoulder: p(lean + 4, 49 + bob),
              leftElbow: p(18 - kick, 34 + bob),
              rightElbow: p(12 - kick, 36 + bob),
              leftHand: p(35 - kick, 42 + bob),
              rightHand: p(25 - kick, 45 + bob),
              leftHip: p(-3, 32 + bob),
              rightHip: p(3, 32 + bob),
              leftKnee: p(run ? wave * 19 : -13, 16),
              rightKnee: p(run ? -wave * 19 : 15, 17),
              leftAnkle: p(run ? wave * 28 : -19, run ? Math.max(0, -wave) * 15 : 0),
              rightAnkle: p(run ? -wave * 28 : 21, run ? Math.max(0, wave) * 15 : 0)
            };
            if (run) {
              var foot = function foot(offset) {
                var u = ((phase + offset) % 1 + 1) % 1;
                // Stance: constant reverse speed cancels body travel. Swing: eased recovery arc.
                var length = GameConfig.animation.strideLength,
                  half = length * 0.28;
                if (u < 0.56) return p(half - length * u, 0);
                var t = (u - 0.56) / 0.44,
                  ease = t * t * (3 - 2 * t);
                return p(-half + half * 2 * ease, Math.sin(t * Math.PI) * 14);
              };
              pose.leftAnkle = foot(0.5);
              pose.rightAnkle = foot(0);
            }
            if (armed && run) {
              // Counter-swing while carrying a rifle; firing blends back into the aimed pose.
              var swing = wave * Math.max(0, 1 - recoil);
              pose.leftElbow.x -= swing * 5;
              pose.rightElbow.x += swing * 5;
              pose.leftHand.y += swing * 2;
              pose.rightHand.y -= swing * 2;
            }
            if (!air && state !== "Crouch" && state !== "Land" && state !== "Dead") {
              if (!run) {
                pose.leftAnkle.x = -9;
                pose.rightAnkle.x = 13;
              }
              var support = pose.leftAnkle.y <= pose.rightAnkle.y ? pose.leftAnkle : pose.rightAnkle;
              var hip = run ? Math.sqrt(Math.max(0, Math.pow(GameConfig.animation.legSegment * 1.97, 2) - Math.pow(support.x, 2))) : 43;
              var lift = hip - 32 - bob;
              for (var _i = 0, _arr = [pose.torso, pose.neck, pose.head, pose.leftShoulder, pose.rightShoulder, pose.leftElbow, pose.rightElbow, pose.leftHand, pose.rightHand, pose.leftHip, pose.rightHip]; _i < _arr.length; _i++) {
                var joint = _arr[_i];
                joint.y += lift;
              }
            }
            if (!armed) {
              pose.leftElbow = p(run ? -wave * 12 : -9, 35 + bob);
              pose.rightElbow = p(run ? wave * 12 : 10, 35 + bob);
              pose.leftHand = p(run ? -wave * 20 : -12, 26 + bob);
              pose.rightHand = p(state === "Shoot" ? 36 : run ? wave * 20 : 13, state === "Shoot" ? 43 : 27 + bob);
            }
            if (state === "Crouch" || state === "Land") {
              var _motion$landTime;
              var amount = state === "Crouch" ? 0.6 : 1 - 0.16 * Math.sin(Math.min(1, ((_motion$landTime = motion.landTime) !== null && _motion$landTime !== void 0 ? _motion$landTime : 0.08) / 0.14) * Math.PI);
              for (var _i2 = 0, _Object$values = Object.values(pose); _i2 < _Object$values.length; _i2++) {
                var _joint = _Object$values[_i2];
                _joint.y *= amount;
              }
              pose.leftKnee = p(-12, 12);
              pose.rightKnee = p(15, 12);
              pose.leftAnkle = p(-17, 0);
              pose.rightAnkle = p(18, 0);
            }
            if (armed && aimPitch > 0) {
              var base = state === "Crouch" ? 26 : pose.rightHand.y;
              pose.rightHand = p(20 + 5 * Math.cos(aimPitch) - kick, base + 22 * Math.sin(aimPitch));
              pose.leftHand = p(16 + 6 * Math.cos(aimPitch) - kick, base + 15 * Math.sin(aimPitch));
              pose.rightElbow = p(24, base + 5);
              pose.leftElbow = p(11, base - 4);
            }
            if (motion.action === "reload" && armed) {
              pose.rightHand.x = 21;
              pose.rightHand.y -= 7;
              pose.leftHand.x = 15;
              pose.leftHand.y = pose.rightHand.y - 7;
              pose.leftElbow.x = 3;
              pose.rightElbow.x = 10;
            }
            if (motion.action === "chargeWindup" || motion.action === "charge") {
              pose.head.x += 6;
              pose.neck.x += 5;
              if (!armed) {
                pose.rightHand.x = 28;
                pose.rightHand.y = 44;
                pose.rightElbow.x = 15;
              }
            }
            if (air) {
              var _motion$airJumpTime;
              pose.leftKnee = p(11, 21);
              pose.leftAnkle = p(2, 9);
              pose.rightKnee = p(-11, 17);
              pose.rightAnkle = p(-17, 5);
              if (state === "Fall") {
                pose.leftKnee = p(8, 18);
                pose.leftAnkle = p(12, 1);
              }
              if (((_motion$airJumpTime = motion.airJumpTime) !== null && _motion$airJumpTime !== void 0 ? _motion$airJumpTime : 0) > 0) {
                pose.leftAnkle = p(16, 17);
                pose.rightAnkle = p(-12, 11);
                pose.head.x += 3;
              }
            }
            if (!air && state !== "Dead") {
              var _motion$groundSlope, _motion$facing;
              var slope = ((_motion$groundSlope = motion.groundSlope) !== null && _motion$groundSlope !== void 0 ? _motion$groundSlope : 0) * ((_motion$facing = motion.facing) !== null && _motion$facing !== void 0 ? _motion$facing : 1);
              pose.leftAnkle.y += pose.leftAnkle.x * slope;
              pose.rightAnkle.y += pose.rightAnkle.x * slope;
            }
            // Two-link knees preserve limb lengths and bend forward instead of swinging rigid sticks.
            var knee = function knee(hip, ankle) {
              var dx = ankle.x - hip.x,
                dy = ankle.y - hip.y;
              var dist = Math.max(1, Math.hypot(dx, dy));
              var bend = Math.sqrt(Math.max(0, Math.pow(GameConfig.animation.legSegment, 2) - dist * dist / 4));
              return p((hip.x + ankle.x) / 2 - dy / dist * bend, (hip.y + ankle.y) / 2 + dx / dist * bend);
            };
            pose.leftKnee = knee(pose.leftHip, pose.leftAnkle);
            pose.rightKnee = knee(pose.rightHip, pose.rightAnkle);
            if (state === "Dead") {
              var angle = Math.min(1, deadTime / 0.42) * -Math.PI / 2;
              for (var _i3 = 0, _Object$values2 = Object.values(pose); _i3 < _Object$values2.length; _i3++) {
                var _joint2 = _Object$values2[_i3];
                var x = _joint2.x,
                  y = _joint2.y;
                _joint2.x = x * Math.cos(angle) - y * Math.sin(angle);
                _joint2.y = Math.max(3, x * Math.sin(angle) + y * Math.cos(angle) + 5);
              }
            }
            return pose;
          }
        }]);
        return StickmanAnimator;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/StickmanRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CharacterArt.ts', './MechanicalEnemyArt.ts', './ColossusArt.ts', './ComicActorArt.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, CharacterArt, MechanicalEnemyArt, ColossusArt, ComicActorArt;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      CharacterArt = module.CharacterArt;
    }, function (module) {
      MechanicalEnemyArt = module.MechanicalEnemyArt;
    }, function (module) {
      ColossusArt = module.ColossusArt;
    }, function (module) {
      ComicActorArt = module.ComicActorArt;
    }],
    execute: function () {
      cclegacy._RF.push({}, "ec02cvRs4soU5cCJFrrrypZ", "StickmanRenderer", undefined);
      var StickmanRenderer = exports('StickmanRenderer', /*#__PURE__*/function () {
        function StickmanRenderer() {
          _classCallCheck(this, StickmanRenderer);
          _defineProperty(this, "comic", new ComicActorArt());
          _defineProperty(this, "art", new CharacterArt());
          _defineProperty(this, "machines", new MechanicalEnemyArt());
          _defineProperty(this, "colossus", new ColossusArt());
        }
        _createClass(StickmanRenderer, [{
          key: "playerStatus",
          value: function playerStatus() {
            return this.comic.playerStatus;
          }
        }, {
          key: "begin",
          value: function begin(ink) {
            this.comic.begin(ink);
          }
        }, {
          key: "end",
          value: function end() {
            this.comic.end();
          }
        }, {
          key: "draw",
          value: function draw(ink, actor, cameraX) {
            if (this.comic.draw(ink, actor, cameraX)) return;
            if (actor.kind === "colossus") this.colossus.draw(ink, actor, cameraX);else if (actor.kind === "turret" || actor.kind === "guard") {
              ink.strokeScale = 1.5;
              this.machines.draw(ink, actor, cameraX);
              ink.strokeScale = 1;
            } else this.art.draw(ink, actor, cameraX);
          }
        }]);
        return StickmanRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SupplementFrames.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      cclegacy._RF.push({}, "dc0498ApRNP6P638Qz45eLg", "SupplementFrames", undefined);
      // Generated by scripts/prepare-comic-v055.py
      var SupplementFrames = exports('SupplementFrames', {
        "tile.top.left": {
          "atlas": [1254, 855, 36, 83],
          "anchor": [0, 0],
          "sourceSize": [36, 83],
          "size": [36, 83]
        },
        "tile.fill.left": {
          "atlas": [1673, 855, 36, 47],
          "anchor": [0, 0],
          "sourceSize": [36, 47],
          "size": [36, 47]
        },
        "tile.bottom.left": {
          "atlas": [1956, 855, 36, 22],
          "anchor": [0, 0],
          "sourceSize": [36, 22],
          "size": [36, 22]
        },
        "tile.top.middle": {
          "atlas": [1537, 855, 128, 55],
          "anchor": [0, 0],
          "sourceSize": [128, 55],
          "size": [128, 55]
        },
        "tile.fill.middle": {
          "atlas": [1420, 747, 256, 94],
          "anchor": [0, 0],
          "sourceSize": [256, 94],
          "size": [256, 94]
        },
        "tile.bottom.middle": {
          "atlas": [4, 955, 128, 22],
          "anchor": [0, 0],
          "sourceSize": [128, 22],
          "size": [128, 22]
        },
        "tile.top.right": {
          "atlas": [1202, 855, 44, 85],
          "anchor": [0, 0],
          "sourceSize": [44, 85],
          "size": [44, 85]
        },
        "tile.fill.right": {
          "atlas": [1717, 855, 44, 47],
          "anchor": [0, 0],
          "sourceSize": [44, 47],
          "size": [44, 47]
        },
        "tile.bottom.right": {
          "atlas": [140, 955, 44, 22],
          "anchor": [0, 0],
          "sourceSize": [44, 22],
          "size": [44, 22]
        },
        "tile.metal.left": {
          "atlas": [1298, 855, 49, 56],
          "anchor": [0, 0],
          "sourceSize": [49, 56],
          "size": [49, 56]
        },
        "tile.metal.middle": {
          "atlas": [1355, 855, 128, 56],
          "anchor": [0, 0],
          "sourceSize": [128, 56],
          "size": [128, 56]
        },
        "tile.metal.right": {
          "atlas": [1491, 855, 38, 56],
          "anchor": [0, 0],
          "sourceSize": [38, 56],
          "size": [38, 56]
        },
        "tile.corner-down": {
          "atlas": [183, 4, 283, 196],
          "anchor": [0, 0],
          "sourceSize": [283, 196],
          "size": [283, 196]
        },
        "tile.corner-up": {
          "atlas": [474, 4, 294, 195],
          "anchor": [0, 0],
          "sourceSize": [294, 195],
          "size": [294, 195]
        },
        "tile.pillar": {
          "atlas": [4, 4, 171, 350],
          "anchor": [0, 0],
          "sourceSize": [171, 350],
          "size": [171, 350]
        },
        "tile.ledge": {
          "atlas": [835, 623, 343, 110],
          "anchor": [0, 0],
          "sourceSize": [343, 110],
          "size": [343, 110]
        },
        "tile.metal.support": {
          "atlas": [1769, 855, 72, 43],
          "anchor": [0, 0],
          "sourceSize": [72, 43],
          "size": [72, 43]
        },
        "unarmed.player.idle.0": {
          "atlas": [776, 4, 95, 131],
          "anchor": [0.45263157894736844, 0.01526717557251911],
          "sourceSize": [95, 131],
          "size": [95, 131]
        },
        "grip.player.idle.0": {
          "atlas": [879, 4, 95, 131],
          "anchor": [0.45263157894736844, 0.01526717557251911],
          "sourceSize": [95, 131],
          "size": [95, 131]
        },
        "unarmed.player.idle.1": {
          "atlas": [1398, 4, 92, 128],
          "anchor": [0.45652173913043476, 0.0078125],
          "sourceSize": [92, 128],
          "size": [92, 128]
        },
        "grip.player.idle.1": {
          "atlas": [1498, 4, 92, 128],
          "anchor": [0.45652173913043476, 0.0078125],
          "sourceSize": [92, 128],
          "size": [92, 128]
        },
        "unarmed.player.idle.2": {
          "atlas": [982, 4, 95, 130],
          "anchor": [0.43157894736842106, 0.007692307692307665],
          "sourceSize": [95, 130],
          "size": [95, 130]
        },
        "grip.player.idle.2": {
          "atlas": [1085, 4, 95, 130],
          "anchor": [0.43157894736842106, 0.007692307692307665],
          "sourceSize": [95, 130],
          "size": [95, 130]
        },
        "unarmed.player.idle.3": {
          "atlas": [1188, 4, 97, 130],
          "anchor": [0.4329896907216495, 0.0],
          "sourceSize": [97, 130],
          "size": [97, 130]
        },
        "grip.player.idle.3": {
          "atlas": [1293, 4, 97, 130],
          "anchor": [0.4329896907216495, 0.0],
          "sourceSize": [97, 130],
          "size": [97, 130]
        },
        "unarmed.player.run.0": {
          "atlas": [1314, 362, 118, 122],
          "anchor": [0.5, 0.008196721311475419],
          "sourceSize": [118, 122],
          "size": [118, 122]
        },
        "grip.player.run.0": {
          "atlas": [1440, 362, 118, 122],
          "anchor": [0.5, 0.008196721311475419],
          "sourceSize": [118, 122],
          "size": [118, 122]
        },
        "unarmed.player.run.1": {
          "atlas": [896, 362, 91, 123],
          "anchor": [0.45054945054945056, 0.016260162601625994],
          "sourceSize": [91, 123],
          "size": [91, 123]
        },
        "grip.player.run.1": {
          "atlas": [995, 362, 91, 123],
          "anchor": [0.45054945054945056, 0.016260162601625994],
          "sourceSize": [91, 123],
          "size": [91, 123]
        },
        "unarmed.player.run.2": {
          "atlas": [1598, 4, 88, 126],
          "anchor": [0.42045454545454547, 0.023809523809523836],
          "sourceSize": [88, 126],
          "size": [88, 126]
        },
        "grip.player.run.2": {
          "atlas": [1694, 4, 88, 126],
          "anchor": [0.42045454545454547, 0.023809523809523836],
          "sourceSize": [88, 126],
          "size": [88, 126]
        },
        "unarmed.player.run.3": {
          "atlas": [1790, 4, 94, 125],
          "anchor": [0.5106382978723404, 0.016000000000000014],
          "sourceSize": [94, 125],
          "size": [94, 125]
        },
        "grip.player.run.3": {
          "atlas": [1892, 4, 94, 125],
          "anchor": [0.5106382978723404, 0.016000000000000014],
          "sourceSize": [94, 125],
          "size": [94, 125]
        },
        "unarmed.player.run.4": {
          "atlas": [4, 362, 100, 124],
          "anchor": [0.52, 0.0],
          "sourceSize": [100, 124],
          "size": [100, 124]
        },
        "grip.player.run.4": {
          "atlas": [112, 362, 100, 124],
          "anchor": [0.52, 0.0],
          "sourceSize": [100, 124],
          "size": [100, 124]
        },
        "unarmed.player.run.5": {
          "atlas": [4, 494, 90, 121],
          "anchor": [0.5111111111111111, 0.016528925619834656],
          "sourceSize": [90, 121],
          "size": [90, 121]
        },
        "grip.player.run.5": {
          "atlas": [102, 494, 90, 121],
          "anchor": [0.5111111111111111, 0.016528925619834656],
          "sourceSize": [90, 121],
          "size": [90, 121]
        },
        "unarmed.player.run.6": {
          "atlas": [220, 362, 83, 124],
          "anchor": [0.5060240963855421, 0.008064516129032251],
          "sourceSize": [83, 124],
          "size": [83, 124]
        },
        "grip.player.run.6": {
          "atlas": [311, 362, 83, 124],
          "anchor": [0.5060240963855421, 0.008064516129032251],
          "sourceSize": [83, 124],
          "size": [83, 124]
        },
        "unarmed.player.run.7": {
          "atlas": [684, 494, 87, 119],
          "anchor": [0.5517241379310345, -0.025210084033613356],
          "sourceSize": [87, 119],
          "size": [87, 119]
        },
        "grip.player.run.7": {
          "atlas": [779, 494, 87, 119],
          "anchor": [0.5517241379310345, -0.025210084033613356],
          "sourceSize": [87, 119],
          "size": [87, 119]
        },
        "unarmed.player.run.8": {
          "atlas": [1566, 362, 101, 122],
          "anchor": [0.6435643564356436, 0.0],
          "sourceSize": [101, 122],
          "size": [101, 122]
        },
        "grip.player.run.8": {
          "atlas": [1675, 362, 101, 122],
          "anchor": [0.6435643564356436, 0.0],
          "sourceSize": [101, 122],
          "size": [101, 122]
        },
        "unarmed.player.jump.0": {
          "atlas": [593, 623, 113, 112],
          "anchor": [0.40707964601769914, 0.0267857142857143],
          "sourceSize": [113, 112],
          "size": [113, 112]
        },
        "grip.player.jump.0": {
          "atlas": [714, 623, 113, 112],
          "anchor": [0.40707964601769914, 0.0267857142857143],
          "sourceSize": [113, 112],
          "size": [113, 112]
        },
        "unarmed.player.jump.1": {
          "atlas": [1190, 494, 113, 117],
          "anchor": [0.504424778761062, -0.21367521367521358],
          "sourceSize": [113, 117],
          "size": [113, 117]
        },
        "grip.player.jump.1": {
          "atlas": [1311, 494, 113, 117],
          "anchor": [0.504424778761062, -0.21367521367521358],
          "sourceSize": [113, 117],
          "size": [113, 117]
        },
        "unarmed.player.jump.2": {
          "atlas": [1186, 623, 128, 109],
          "anchor": [0.546875, -0.17431192660550465],
          "sourceSize": [128, 109],
          "size": [128, 109]
        },
        "grip.player.jump.2": {
          "atlas": [1322, 623, 128, 109],
          "anchor": [0.546875, -0.17431192660550465],
          "sourceSize": [128, 109],
          "size": [128, 109]
        },
        "unarmed.player.jump.3": {
          "atlas": [1666, 494, 107, 116],
          "anchor": [0.4205607476635514, 0.025862068965517238],
          "sourceSize": [107, 116],
          "size": [107, 116]
        },
        "grip.player.jump.3": {
          "atlas": [1781, 494, 107, 116],
          "anchor": [0.4205607476635514, 0.025862068965517238],
          "sourceSize": [107, 116],
          "size": [107, 116]
        },
        "unarmed.player.fall.0": {
          "atlas": [232, 855, 129, 91],
          "anchor": [0.43410852713178294, -0.07692307692307687],
          "sourceSize": [129, 91],
          "size": [129, 91]
        },
        "grip.player.fall.0": {
          "atlas": [369, 855, 129, 91],
          "anchor": [0.43410852713178294, -0.07692307692307687],
          "sourceSize": [129, 91],
          "size": [129, 91]
        },
        "unarmed.player.crouch.0": {
          "atlas": [230, 747, 105, 99],
          "anchor": [0.45714285714285713, -0.010101010101010166],
          "sourceSize": [105, 99],
          "size": [105, 99]
        },
        "grip.player.crouch.0": {
          "atlas": [343, 747, 105, 99],
          "anchor": [0.45714285714285713, -0.010101010101010166],
          "sourceSize": [105, 99],
          "size": [105, 99]
        },
        "unarmed.player.crouch.1": {
          "atlas": [992, 855, 97, 88],
          "anchor": [0.4948453608247423, 0.0],
          "sourceSize": [97, 88],
          "size": [97, 88]
        },
        "grip.player.crouch.1": {
          "atlas": [1097, 855, 97, 88],
          "anchor": [0.4948453608247423, 0.0],
          "sourceSize": [97, 88],
          "size": [97, 88]
        },
        "unarmed.player.crouch-walk.0": {
          "atlas": [456, 747, 109, 99],
          "anchor": [0.42201834862385323, 0.010101010101010055],
          "sourceSize": [109, 99],
          "size": [109, 99]
        },
        "grip.player.crouch-walk.0": {
          "atlas": [573, 747, 109, 99],
          "anchor": [0.42201834862385323, 0.010101010101010055],
          "sourceSize": [109, 99],
          "size": [109, 99]
        },
        "unarmed.player.crouch-walk.1": {
          "atlas": [1202, 747, 101, 95],
          "anchor": [0.3564356435643564, 0.0],
          "sourceSize": [101, 95],
          "size": [101, 95]
        },
        "grip.player.crouch-walk.1": {
          "atlas": [1311, 747, 101, 95],
          "anchor": [0.3564356435643564, 0.0],
          "sourceSize": [101, 95],
          "size": [101, 95]
        },
        "unarmed.player.crouch-walk.2": {
          "atlas": [958, 747, 114, 96],
          "anchor": [0.4649122807017544, 0.0],
          "sourceSize": [114, 96],
          "size": [114, 96]
        },
        "grip.player.crouch-walk.2": {
          "atlas": [1080, 747, 114, 96],
          "anchor": [0.4649122807017544, 0.0],
          "sourceSize": [114, 96],
          "size": [114, 96]
        },
        "unarmed.player.crouch-walk.3": {
          "atlas": [690, 747, 126, 97],
          "anchor": [0.4444444444444444, 0.010309278350515427],
          "sourceSize": [126, 97],
          "size": [126, 97]
        },
        "grip.player.crouch-walk.3": {
          "atlas": [824, 747, 126, 97],
          "anchor": [0.4444444444444444, 0.010309278350515427],
          "sourceSize": [126, 97],
          "size": [126, 97]
        },
        "unarmed.player.crouch-walk.4": {
          "atlas": [1700, 623, 123, 100],
          "anchor": [0.45528455284552843, 0.010000000000000009],
          "sourceSize": [123, 100],
          "size": [123, 100]
        },
        "grip.player.crouch-walk.4": {
          "atlas": [1831, 623, 123, 100],
          "anchor": [0.45528455284552843, 0.010000000000000009],
          "sourceSize": [123, 100],
          "size": [123, 100]
        },
        "unarmed.player.crouch-walk.5": {
          "atlas": [4, 747, 105, 100],
          "anchor": [0.34285714285714286, 0.010000000000000009],
          "sourceSize": [105, 100],
          "size": [105, 100]
        },
        "grip.player.crouch-walk.5": {
          "atlas": [117, 747, 105, 100],
          "anchor": [0.34285714285714286, 0.010000000000000009],
          "sourceSize": [105, 100],
          "size": [105, 100]
        },
        "unarmed.player.stand-shoot.0": {
          "atlas": [121, 623, 109, 114],
          "anchor": [0.41284403669724773, 0.02631578947368418],
          "sourceSize": [109, 114],
          "size": [109, 114]
        },
        "grip.player.stand-shoot.0": {
          "atlas": [238, 623, 109, 114],
          "anchor": [0.41284403669724773, 0.02631578947368418],
          "sourceSize": [109, 114],
          "size": [109, 114]
        },
        "unarmed.player.stand-shoot.1": {
          "atlas": [1896, 494, 109, 116],
          "anchor": [0.41284403669724773, 0.025862068965517238],
          "sourceSize": [109, 116],
          "size": [109, 116]
        },
        "grip.player.stand-shoot.1": {
          "atlas": [4, 623, 109, 116],
          "anchor": [0.41284403669724773, 0.025862068965517238],
          "sourceSize": [109, 116],
          "size": [109, 116]
        },
        "unarmed.player.stand-shoot.2": {
          "atlas": [1432, 494, 109, 117],
          "anchor": [0.3853211009174312, 0.02564102564102566],
          "sourceSize": [109, 117],
          "size": [109, 117]
        },
        "grip.player.stand-shoot.2": {
          "atlas": [1549, 494, 109, 117],
          "anchor": [0.3853211009174312, 0.02564102564102566],
          "sourceSize": [109, 117],
          "size": [109, 117]
        },
        "unarmed.player.stand-shoot.3": {
          "atlas": [355, 623, 111, 114],
          "anchor": [0.3333333333333333, 0.01754385964912286],
          "sourceSize": [111, 114],
          "size": [111, 114]
        },
        "grip.player.stand-shoot.3": {
          "atlas": [474, 623, 111, 114],
          "anchor": [0.3333333333333333, 0.01754385964912286],
          "sourceSize": [111, 114],
          "size": [111, 114]
        },
        "unarmed.player.run-shoot.0": {
          "atlas": [874, 494, 150, 119],
          "anchor": [0.48, 0.01680672268907568],
          "sourceSize": [150, 119],
          "size": [150, 119]
        },
        "grip.player.run-shoot.0": {
          "atlas": [1032, 494, 150, 119],
          "anchor": [0.48, 0.01680672268907568],
          "sourceSize": [150, 119],
          "size": [150, 119]
        },
        "unarmed.player.run-shoot.1": {
          "atlas": [200, 494, 113, 121],
          "anchor": [0.2743362831858407, 0.016528925619834656],
          "sourceSize": [113, 121],
          "size": [113, 121]
        },
        "grip.player.run-shoot.1": {
          "atlas": [321, 494, 113, 121],
          "anchor": [0.2743362831858407, 0.016528925619834656],
          "sourceSize": [113, 121],
          "size": [113, 121]
        },
        "unarmed.player.run-shoot.2": {
          "atlas": [442, 494, 113, 121],
          "anchor": [0.25663716814159293, 0.024793388429752095],
          "sourceSize": [113, 121],
          "size": [113, 121]
        },
        "grip.player.run-shoot.2": {
          "atlas": [563, 494, 113, 121],
          "anchor": [0.25663716814159293, 0.024793388429752095],
          "sourceSize": [113, 121],
          "size": [113, 121]
        },
        "unarmed.player.run-shoot.3": {
          "atlas": [1784, 362, 124, 122],
          "anchor": [0.3709677419354839, 0.016393442622950838],
          "sourceSize": [124, 122],
          "size": [124, 122]
        },
        "grip.player.run-shoot.3": {
          "atlas": [1916, 362, 124, 122],
          "anchor": [0.3709677419354839, 0.016393442622950838],
          "sourceSize": [124, 122],
          "size": [124, 122]
        },
        "unarmed.player.run-shoot.4": {
          "atlas": [402, 362, 113, 124],
          "anchor": [0.4690265486725664, 0.024193548387096753],
          "sourceSize": [113, 124],
          "size": [113, 124]
        },
        "grip.player.run-shoot.4": {
          "atlas": [523, 362, 113, 124],
          "anchor": [0.4690265486725664, 0.024193548387096753],
          "sourceSize": [113, 124],
          "size": [113, 124]
        },
        "unarmed.player.run-shoot.5": {
          "atlas": [1094, 362, 102, 123],
          "anchor": [0.46078431372549017, 0.024390243902439046],
          "sourceSize": [102, 123],
          "size": [102, 123]
        },
        "grip.player.run-shoot.5": {
          "atlas": [1204, 362, 102, 123],
          "anchor": [0.46078431372549017, 0.024390243902439046],
          "sourceSize": [102, 123],
          "size": [102, 123]
        },
        "unarmed.player.run-shoot.6": {
          "atlas": [644, 362, 118, 124],
          "anchor": [0.4661016949152542, 0.024193548387096753],
          "sourceSize": [118, 124],
          "size": [118, 124]
        },
        "grip.player.run-shoot.6": {
          "atlas": [770, 362, 118, 124],
          "anchor": [0.4661016949152542, 0.024193548387096753],
          "sourceSize": [118, 124],
          "size": [118, 124]
        },
        "unarmed.player.crouch-shoot.0": {
          "atlas": [734, 855, 121, 89],
          "anchor": [0.36363636363636365, 0.0],
          "sourceSize": [121, 89],
          "size": [121, 89]
        },
        "grip.player.crouch-shoot.0": {
          "atlas": [863, 855, 121, 89],
          "anchor": [0.36363636363636365, 0.0],
          "sourceSize": [121, 89],
          "size": [121, 89]
        },
        "unarmed.player.crouch-shoot.1": {
          "atlas": [1684, 747, 121, 94],
          "anchor": [0.38016528925619836, 0.0],
          "sourceSize": [121, 94],
          "size": [121, 94]
        },
        "grip.player.crouch-shoot.1": {
          "atlas": [1813, 747, 121, 94],
          "anchor": [0.38016528925619836, 0.0],
          "sourceSize": [121, 94],
          "size": [121, 94]
        },
        "unarmed.player.crouch-shoot.2": {
          "atlas": [506, 855, 106, 91],
          "anchor": [0.29245283018867924, 0.0],
          "sourceSize": [106, 91],
          "size": [106, 91]
        },
        "grip.player.crouch-shoot.2": {
          "atlas": [620, 855, 106, 91],
          "anchor": [0.29245283018867924, 0.0],
          "sourceSize": [106, 91],
          "size": [106, 91]
        },
        "unarmed.player.crouch-shoot.3": {
          "atlas": [4, 855, 106, 92],
          "anchor": [0.3867924528301887, 0.0],
          "sourceSize": [106, 92],
          "size": [106, 92]
        },
        "grip.player.crouch-shoot.3": {
          "atlas": [118, 855, 106, 92],
          "anchor": [0.3867924528301887, 0.0],
          "sourceSize": [106, 92],
          "size": [106, 92]
        },
        "unarmed.player.hit.0": {
          "atlas": [1458, 623, 113, 103],
          "anchor": [0.48672566371681414, 0.03883495145631066],
          "sourceSize": [113, 103],
          "size": [113, 103]
        },
        "grip.player.hit.0": {
          "atlas": [1579, 623, 113, 103],
          "anchor": [0.48672566371681414, 0.03883495145631066],
          "sourceSize": [113, 103],
          "size": [113, 103]
        },
        "weapon.knife": {
          "atlas": [1849, 855, 99, 28],
          "anchor": [0, 0],
          "sourceSize": [99, 28],
          "size": [99, 28]
        }
      });
      var SupplementSockets = exports('SupplementSockets', {
        "player.idle.0": [-1.28, 5.12],
        "player.idle.1": [-1.28, 5.12],
        "player.idle.2": [-1.28, 5.12],
        "player.idle.3": [-1.28, 5.12],
        "player.run.0": [-1.28, 5.12],
        "player.run.1": [-1.28, 5.12],
        "player.run.2": [-1.28, 5.12],
        "player.run.3": [-1.28, 5.12],
        "player.run.4": [-1.28, 5.12],
        "player.run.5": [-1.28, 5.12],
        "player.run.6": [-1.28, 5.12],
        "player.run.7": [-1.28, 5.12],
        "player.run.8": [-1.28, 5.12],
        "player.jump.0": [-1.28, 5.12],
        "player.jump.1": [-1.28, 5.12],
        "player.jump.2": [-1.28, 5.12],
        "player.jump.3": [-1.28, 5.12],
        "player.fall.0": [-1.28, 5.12],
        "player.fall.1": [-1.28, 5.12],
        "player.crouch.0": [-1.28, 1.92],
        "player.crouch.1": [-1.28, 1.92],
        "player.crouch-walk.0": [-1.28, 5.12],
        "player.crouch-walk.1": [-1.28, 5.12],
        "player.crouch-walk.2": [-1.28, 5.12],
        "player.crouch-walk.3": [-1.28, 5.12],
        "player.crouch-walk.4": [-1.28, 5.12],
        "player.crouch-walk.5": [-1.28, 5.12],
        "player.stand-shoot.0": [-1.28, 1.92],
        "player.stand-shoot.1": [-1.28, 1.92],
        "player.stand-shoot.2": [-1.28, 1.92],
        "player.stand-shoot.3": [-1.28, 1.92],
        "player.run-shoot.0": [-1.28, 1.92],
        "player.run-shoot.1": [-1.28, 1.92],
        "player.run-shoot.2": [-1.28, 1.92],
        "player.run-shoot.3": [-1.28, 1.92],
        "player.run-shoot.4": [-1.28, 1.92],
        "player.run-shoot.5": [-1.28, 1.92],
        "player.run-shoot.6": [-1.28, 1.92],
        "player.crouch-shoot.0": [-1.28, 1.92],
        "player.crouch-shoot.1": [-1.28, 1.92],
        "player.crouch-shoot.2": [-1.28, 1.92],
        "player.crouch-shoot.3": [-1.28, 1.92],
        "player.hit.0": [-1.28, 5.12]
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TankBoss.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts', './EnemyController.ts'], function (exports) {
  var _inherits, _createSuper, _classCallCheck, _defineProperty, _assertThisInitialized, _createClass, cclegacy, GameConfig, clamp, EnemyController;
  return {
    setters: [function (module) {
      _inherits = module.inherits;
      _createSuper = module.createSuper;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _assertThisInitialized = module.assertThisInitialized;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      clamp = module.clamp;
    }, function (module) {
      EnemyController = module.EnemyController;
    }],
    execute: function () {
      cclegacy._RF.push({}, "df059K32kgYIa9YTf4OwEC9", "TankBoss", undefined);
      /** Two attack phases with locked, visible landing points and bounded reinforcement waves. */
      var TankBoss = exports('TankBoss', /*#__PURE__*/function (_EnemyController) {
        _inherits(TankBoss, _EnemyController);
        var _super = _createSuper(TankBoss);
        function TankBoss(data) {
          var _this;
          _classCallCheck(this, TankBoss);
          _this = _super.call(this, data);
          _defineProperty(_assertThisInitialized(_this), "active", false);
          _defineProperty(_assertThisInitialized(_this), "warningX", 0);
          _defineProperty(_assertThisInitialized(_this), "warningTime", 0);
          _defineProperty(_assertThisInitialized(_this), "mode", "dormant");
          _defineProperty(_assertThisInitialized(_this), "summons", 0);
          _defineProperty(_assertThisInitialized(_this), "summonTime", 8);
          _defineProperty(_assertThisInitialized(_this), "secondShell", 0);
          _defineProperty(_assertThisInitialized(_this), "targetX", 0);
          _defineProperty(_assertThisInitialized(_this), "targetY", 150);
          _defineProperty(_assertThisInitialized(_this), "miniBoss", void 0);
          _defineProperty(_assertThisInitialized(_this), "onSummon", void 0);
          _defineProperty(_assertThisInitialized(_this), "box", {
            x: 0,
            y: 0,
            w: 240,
            h: 125
          });
          _this.miniBoss = data.encounter === "mini";
          _this.halfWidth = 110;
          _this.height = 125;
          _this.attackCooldown = 2;
          return _this;
        }
        _createClass(TankBoss, [{
          key: "phase",
          get: function get() {
            return this.health <= this.maxHealth * 0.5 ? 2 : 1;
          }
        }, {
          key: "takeDamage",
          value: function takeDamage(amount, _direction, _kind) {
            if (!this.alive || !this.active) return false;
            this.health = Math.max(0, this.health - amount);
            this.hitTime = 0.14;
            if (!this.alive) {
              this.mode = "destroyed";
              this.state = "Dead";
              this.warningTime = 0;
              this.secondShell = 0;
            }
            return true;
          }
        }, {
          key: "bounds",
          get: function get() {
            this.box.x = this.x - 120;
            this.box.y = this.y + 4;
            return this.box;
          }
        }, {
          key: "update",
          value: function update(dt, p, level, projectiles) {
            this.animationTime += dt;
            this.hitTime = Math.max(0, this.hitTime - dt);
            this.recoil = Math.max(0, this.recoil - dt * 4);
            if (!this.alive) {
              this.mode = "destroyed";
              this.state = "Dead";
              this.deadTime += dt;
              return;
            }
            this.active = this.miniBoss ? Math.abs(p.x - this.x) < 740 : level.data.arena ? level.arenaEntered : Math.abs(p.x - this.x) < 800;
            if (!this.active || !p.alive) {
              this.state = "Idle";
              this.mode = "dormant";
              this.windup = 0;
              this.warningTime = 0;
              this.secondShell = 0;
              return;
            }
            this.facing = p.x > this.x ? 1 : -1;
            this.state = "Attack";
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
            this.warningTime = Math.max(0, this.warningTime - dt);
            this.summonTime -= dt;
            if (!this.miniBoss && this.summonTime <= 0 && this.summons < GameConfig.boss.maxSummons) {
              var _this$onSummon;
              this.summonTime = GameConfig.boss.summonInterval;
              (_this$onSummon = this.onSummon) === null || _this$onSummon === void 0 || _this$onSummon.call(this, this.x - 300);
              this.summons += 2;
            }
            if (this.secondShell > 0) {
              this.secondShell -= dt;
              if (this.secondShell <= 0) this.shell(this.targetX + 75, projectiles);
            }
            if (this.attackCooldown === 0 && this.windup === 0) {
              var _level$data$arena$sta, _level$data$arena, _level$data$arena$end, _level$data$arena2;
              this.windup = this.phase === 1 ? GameConfig.boss.firstWindup : GameConfig.boss.secondWindup;
              this.targetX = clamp(p.x + p.vx * 0.4, (this.miniBoss ? 0 : (_level$data$arena$sta = (_level$data$arena = level.data.arena) === null || _level$data$arena === void 0 ? void 0 : _level$data$arena.start) !== null && _level$data$arena$sta !== void 0 ? _level$data$arena$sta : 0) + 50, (this.miniBoss ? level.data.width : (_level$data$arena$end = (_level$data$arena2 = level.data.arena) === null || _level$data$arena2 === void 0 ? void 0 : _level$data$arena2.end) !== null && _level$data$arena$end !== void 0 ? _level$data$arena$end : level.data.width) - 50);
              this.warningX = this.targetX;
              this.targetY = level.groundY(this.targetX);
              this.warningTime = this.windup + GameConfig.boss.shellFlight + (this.phase === 2 ? 0.2 : 0);
              this.mode = "aiming";
            }
            if (this.windup > 0) {
              this.windup = Math.max(0, this.windup - dt);
              if (this.windup === 0) {
                this.shell(this.targetX, projectiles);
                if (this.phase === 2) this.secondShell = 0.2;
                this.attackCooldown = this.phase === 1 ? GameConfig.boss.firstInterval : GameConfig.boss.secondInterval;
                this.mode = "recovering";
              }
            }
            if (Math.abs(p.x - this.x) < 122 && p.y < this.y + 100) p.takeDamage(1, p.x < this.x ? -1 : 1);
          }
        }, {
          key: "shell",
          value: function shell(target, projectiles) {
            var x = this.x + this.facing * 123,
              y = this.y + 92,
              flight = GameConfig.boss.shellFlight;
            var vx = (target - x) / flight,
              vy = (this.targetY - y + 0.5 * 800 * flight * flight) / flight,
              speed = Math.hypot(vx, vy);
            projectiles.spawn({
              owner: "enemy",
              x: x,
              y: y,
              direction: vx >= 0 ? 1 : -1,
              pitch: Math.atan2(vy, Math.abs(vx)),
              speed: speed,
              damage: 1,
              range: 1800,
              gravity: 800,
              kind: "cannon",
              blastRadius: GameConfig.boss.blastRadius
            });
            this.recoil = 2;
          }
        }]);
        return TankBoss;
      }(EnemyController));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TerrainProfile.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Types.ts'], function (exports) {
  var _slicedToArray, cclegacy, surfaceY;
  return {
    setters: [function (module) {
      _slicedToArray = module.slicedToArray;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      surfaceY = module.surfaceY;
    }],
    execute: function () {
      exports('roadHeight', roadHeight);
      cclegacy._RF.push({}, "ab20avw7ohERvT6aH3iEdqW", "TerrainProfile", undefined);

      /** Rectangular terraces. Constant-height surface spans retain foot snapping for
       * shallow steps, with true vertical sides for projectile/grenade collision. */
      var points = [[0, 150], [160, 150], [270, 174], [520, 174], [640, 150], [805, 150], [935, 184], [1140, 150], [1300, 156], [1480, 118], [1630, 118], [1740, 150], [2010, 150], [2245, 150], [2370, 128], [2480, 128], [2625, 163], [2820, 163], [2915, 150], [3350, 150], [3460, 178], [3650, 178], [3720, 150], [4010, 150], [4100, 176], [4330, 176], [4490, 134], [4680, 134], [4830, 150], [5200, 150], [5390, 120], [5470, 120], [5560, 150], [6090, 150], [6230, 150], [6350, 150], [6510, 150], [8200, 150]];
      var road = exports('road', points.slice(1).reduce(function (spans, _ref, i) {
        var _previous$slope;
        var _ref2 = _slicedToArray(_ref, 1),
          x = _ref2[0];
        var _points$i = _slicedToArray(points[i], 2),
          left = _points$i[0],
          height = _points$i[1];
        var previous = spans[spans.length - 1];
        if ((previous === null || previous === void 0 || (_previous$slope = previous.slope) === null || _previous$slope === void 0 ? void 0 : _previous$slope.left) === height) {
          previous.w = x - previous.x;
          return spans;
        }
        spans.push({
          x: left,
          y: -240,
          w: x - left,
          h: height + 240,
          slope: {
            left: height,
            right: height
          }
        });
        return spans;
      }, []));
      function roadHeight(x) {
        var r = road.find(function (r) {
          return x >= r.x && x <= r.x + r.w;
        });
        return r ? surfaceY(r, x) : 150;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TerrainSurface.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Types.ts'], function (exports) {
  var _toConsumableArray, cclegacy, surfaceY;
  return {
    setters: [function (module) {
      _toConsumableArray = module.toConsumableArray;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      surfaceY = module.surfaceY;
    }],
    execute: function () {
      exports('terrainSurface', terrainSurface);
      cclegacy._RF.push({}, "5f274mpFvkIzW0TVV9UJ5we", "TerrainSurface", undefined);
      /** Render the union of attached ground and steps. Collision solids stay intact.
       * This removes buried grass/bottom borders where rectangular solids overlap.
       */
      function terrainSurface(solids) {
        var solid = solids.filter(function (s) {
          return s.kind === "ground" || s.kind === "step";
        });
        var edges = _toConsumableArray(new Set(solid.flatMap(function (s) {
          return [s.x, s.x + s.w];
        }))).sort(function (a, b) {
          return a - b;
        });
        var spans = [];
        var _loop = function _loop() {
          var x = edges[i],
            end = edges[i + 1],
            mid = (x + end) / 2;
          var surfaces = solid.filter(function (s) {
            return mid >= s.x && mid < s.x + s.w;
          }).map(function (s) {
            return surfaceY(s, mid);
          });
          if (!surfaces.length) return 1; // continue
          var top = Math.max.apply(Math, _toConsumableArray(surfaces)),
            last = spans[spans.length - 1];
          if (last && last.x + last.w === x && last.top === top) last.w = end - last.x;else spans.push({
            x: x,
            w: end - x,
            top: top
          });
        };
        for (var i = 0; i < edges.length - 1; i++) {
          if (_loop()) continue;
        }
        return spans;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TerrainTiles.ts", ['cc', './ComicFrames.ts'], function (exports) {
  var cclegacy, ComicFrames;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      ComicFrames = module.ComicFrames;
    }],
    execute: function () {
      exports({
        metalTiles: metalTiles,
        terrainTiles: terrainTiles
      });
      cclegacy._RF.push({}, "b5450/8etVgUNK22TCqqrV1", "TerrainTiles", undefined);
      /** Repeat source pixels; the final piece is clipped, never stretched to fill. */
      function strip(out, id, x, y, width, height, scale) {
        var size = ComicFrames[id].size,
          tw = size[0] * scale,
          th = size[1] * scale;
        if (id === "native.soil") {
          // One texture phase across every solid/column/chunk. Splitting a circle at
          // an arbitrary boundary continues its other half on the adjacent piece.
          for (var py = 0; py < height - .001;) {
            var ry = ((y + py) % th + th) % th,
              sy = ry > th - .000001 ? 0 : ry,
              h = Math.min(th - sy, height - py);
            for (var px = 0; px < width - .001;) {
              var rx = ((x + px) % tw + tw) % tw,
                sx = rx > tw - .000001 ? 0 : rx,
                w = Math.min(tw - sx, width - px);
              out.push({
                id: id,
                x: x + px,
                y: y + py,
                scale: scale,
                crop: [sx / scale, size[1] - (sy + h) / scale, w / scale, h / scale]
              });
              px += w;
            }
            py += h;
          }
          return;
        }
        for (var _py = 0; _py < height - .001; _py += th) for (var _px = 0; _px < width - .001; _px += tw) {
          var _w = Math.min(tw, width - _px),
            _h = Math.min(th, height - _py);
          out.push({
            id: id,
            x: x + _px,
            y: y + _py,
            scale: scale,
            crop: [0, size[1] - _h / scale, _w / scale, _h / scale]
          });
        }
      }
      function terrainTiles(x, top, width) {
        var depth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 72;
        var neighbours = arguments.length > 4 ? arguments[4] : undefined;
        var out = [],
          s = .6;
        var left = ComicFrames["native.top.left"].size[0] * s,
          right = ComicFrames["native.top.right"].size[0] * s;
        // Shared SOURCE walk line y=148, top/soil join=177, bottom strip=205..238.
        var upperBottom = top - 29 * s,
          bottom = top - depth,
          bottomH = 33 * s;
        var columns = [{
          col: "left",
          x: x,
          w: Math.min(left, width)
        }, {
          col: "middle",
          x: x + left,
          w: Math.max(0, width - left - right)
        }, {
          col: "right",
          x: x + Math.max(left, width - right),
          w: Math.max(0, Math.min(right, width - left))
        }];
        for (var _i = 0, _columns = columns; _i < _columns.length; _i++) {
          var c = _columns[_i];
          var neighbour = c.col === "left" ? neighbours === null || neighbours === void 0 ? void 0 : neighbours.left : c.col === "right" ? neighbours === null || neighbours === void 0 ? void 0 : neighbours.right : undefined;
          var inner = neighbour !== undefined && neighbour >= top;
          var topId = "native.top.".concat(inner ? "middle" : c.col);
          strip(out, topId, c.x, upperBottom, c.w, ComicFrames[topId].size[1] * s, s);
          var join = Math.max(bottom + bottomH, Math.min(upperBottom, neighbour !== null && neighbour !== void 0 ? neighbour : bottom));
          strip(out, "native.soil", c.x, bottom + bottomH, c.w, join - bottom - bottomH, s);
          strip(out, c.col === "middle" ? "native.soil" : "native.fill.".concat(c.col), c.x, join, c.w, Math.max(0, upperBottom - join), s);
        }
        // Bottom caps come from complete quiet corners, not cropped halves of stones.
        var bl = (neighbours === null || neighbours === void 0 ? void 0 : neighbours.left) === undefined ? Math.min(width, ComicFrames["native.bottom.left"].size[0] * s) : 0;
        var br = (neighbours === null || neighbours === void 0 ? void 0 : neighbours.right) === undefined ? Math.min(width - bl, ComicFrames["native.bottom.right"].size[0] * s) : 0;
        if (bl > 0) strip(out, "native.bottom.left", x, bottom, bl, bottomH, s);
        strip(out, "native.bottom.middle", x + bl, bottom, width - bl - br, bottomH, s);
        if (br > 0) strip(out, "native.bottom.right", x + width - br, bottom, br, bottomH, s);
        return out;
      }
      function metalTiles(x, top, width) {
        var out = [],
          s = .5,
          left = Math.min(width, ComicFrames["native.metal.left"].size[0] * s),
          right = Math.min(Math.max(0, width - left), ComicFrames["native.metal.right"].size[0] * s),
          y = top - (134 - 69) * s;
        // Brackets keep their own native width, independent of beam length.
        var count = Math.max(1, Math.ceil(width / 150));
        for (var i = 0; i < count; i++) strip(out, "native.metal.bracket", x + (i + .5) * width / count - 26.5, top - (174 - 69) * s, 53, 46 * s, s);
        strip(out, "native.metal.left", x, y, left, 70 * s, s);
        strip(out, "native.metal.middle", x + left, y, width - left - right, 70 * s, s);
        strip(out, "native.metal.right", x + width - right, y, right, 70 * s, s);
        return out;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TouchInputManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Types.ts', './ControlLayout.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, clamp, controlLayout;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      clamp = module.clamp;
    }, function (module) {
      controlLayout = module.controlLayout;
    }],
    execute: function () {
      cclegacy._RF.push({}, "eec6fZ6/LggsEuIFmD9MNYl", "TouchInputManager", undefined);
      var contains = function contains(r, x, y) {
        return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
      };
      /** Explicit hit-test arbitration and one owner per finger, independent of any event bubbling. */
      var TouchInputManager = exports('TouchInputManager', /*#__PURE__*/function () {
        function TouchInputManager(input) {
          _classCallCheck(this, TouchInputManager);
          _defineProperty(this, "owners", new Map());
          _defineProperty(this, "enabled", false);
          _defineProperty(this, "rightBlankShooting", true);
          _defineProperty(this, "width", 1280);
          _defineProperty(this, "height", 720);
          _defineProperty(this, "hudHeight", 108);
          _defineProperty(this, "originX", 0);
          _defineProperty(this, "originY", 0);
          _defineProperty(this, "baseX", 0);
          _defineProperty(this, "baseY", 0);
          _defineProperty(this, "layout", controlLayout());
          _defineProperty(this, "insets", {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          });
          _defineProperty(this, "regions", []);
          this.input = input;
        }
        _createClass(TouchInputManager, [{
          key: "configure",
          value: function configure(width, height, layout, insets) {
            var ratio = layout.joystick.unit / this.layout.joystick.unit;
            var oldHeight = this.height,
              dx = this.input.joystick.x,
              dy = this.input.joystick.y,
              owner = this.input.joystick.owner;
            this.originX *= ratio;
            this.originY = height - (oldHeight - this.originY) * ratio;
            this.width = width;
            this.height = height;
            this.layout = layout;
            this.insets = insets;
            this.input.joystick.radius = layout.joystick.r;
            this.hudHeight = 52 * layout.joystick.unit;
            if (owner !== null) {
              this.input.joystick.move(owner, dx * ratio, dy * ratio);
              this.updateBase();
            }
          }
        }, {
          key: "setRegions",
          value: function setRegions(regions) {
            this.regions = regions.sort(function (a, b) {
              return a.priority - b.priority;
            });
          }
        }, {
          key: "start",
          value: function start(id, x, y) {
            if (this.owners.has(id)) return;
            var region = this.regions.find(function (r) {
              return contains(r.bounds, x, y);
            });
            if (region) {
              if (region.action && this.enabled) {
                this.input.press("touch:".concat(id), region.action);
                this.owners.set(id, {
                  role: "action",
                  region: region
                });
              } else this.owners.set(id, {
                role: region.action ? "ignored" : "ui",
                region: region
              });
              return;
            }
            if (!this.enabled || y >= this.height - this.hudHeight - this.insets.top || x < 0 || x > this.width || y < 0 || y > this.height) {
              this.owners.set(id, {
                role: "ignored"
              });
              return;
            }
            if (x < this.width / 2) {
              if (this.input.joystick.start(id, 0, 0)) {
                this.originX = x;
                this.originY = y;
                this.updateBase();
                this.owners.set(id, {
                  role: "move"
                });
              } else this.owners.set(id, {
                role: "ignored"
              });
            } else if (this.rightBlankShooting) {
              this.input.press("touch:".concat(id), "shoot");
              this.owners.set(id, {
                role: "action"
              });
            } else this.owners.set(id, {
              role: "ignored"
            });
          }
        }, {
          key: "move",
          value: function move(id, x, y) {
            var _this$owners$get;
            if (((_this$owners$get = this.owners.get(id)) === null || _this$owners$get === void 0 ? void 0 : _this$owners$get.role) === "move") this.input.joystick.move(id, x - this.originX, y - this.originY);
          }
        }, {
          key: "updateBase",
          value: function updateBase() {
            var r = this.layout.joystick.baseR,
              gap = 6 * this.layout.joystick.unit;
            this.baseX = clamp(this.originX, this.insets.left + r + gap, this.width / 2 - r - gap);
            this.baseY = clamp(this.originY, this.insets.bottom + r + gap, this.height - this.hudHeight - this.insets.top - r - gap);
          }
        }, {
          key: "end",
          value: function end(id, x, y) {
            var cancelled = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
            var owner = this.owners.get(id);
            this.owners["delete"](id);
            this.input.release("touch:".concat(id));
            this.input.joystick.end(id);
            return !cancelled && (owner === null || owner === void 0 ? void 0 : owner.role) === "ui" && owner.region && contains(owner.region.bounds, x, y) ? owner.region.id : undefined;
          }
        }, {
          key: "clear",
          value: function clear() {
            this.owners.clear();
            this.input.clear();
          }
        }]);
        return TouchInputManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Types.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        overlaps: overlaps,
        segmentRect: segmentRect,
        surfaceY: surfaceY
      });
      cclegacy._RF.push({}, "c97b5mmH0TTAryi42viVQS1", "Types", undefined);
      /** Surface coordinates are shared by walking, falling objects and projectile sweeps. */
      function surfaceY(r, x) {
        return r.slope ? r.slope.left + (r.slope.right - r.slope.left) * clamp((x - r.x) / r.w, 0, 1) : r.y + r.h;
      }
      var clamp = exports('clamp', function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
      });
      function overlaps(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
      }
      /** Swept segment / expanded AABB: prevents fast bullets tunnelling. Returns hit fraction. */
      function segmentRect(a, b, r) {
        var radius = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
        var enter = 0,
          leave = 1;
        for (var axis = 0; axis < 2; axis++) {
          var start = axis === 0 ? a.x : a.y,
            delta = axis === 0 ? b.x - a.x : b.y - a.y,
            min = (axis === 0 ? r.x : r.y) - radius,
            max = axis === 0 ? r.x + r.w + radius : r.y + r.h + radius;
          if (Math.abs(delta) < 1e-8) {
            if (start < min || start > max) return null;
            continue;
          }
          var t1 = (min - start) / delta,
            t2 = (max - start) / delta;
          if (t1 > t2) {
            var swap = t1;
            t1 = t2;
            t2 = swap;
          }
          enter = Math.max(enter, t1);
          leave = Math.min(leave, t2);
          if (enter > leave) return null;
        }
        if (r.slope) {
          var m = (r.slope.right - r.slope.left) / r.w;
          var height = function height(v) {
            return v.y - r.slope.left - m * (v.x - r.x) - radius * Math.hypot(1, m);
          };
          var _start = height(a),
            _delta = height(b) - _start;
          if (Math.abs(_delta) < 1e-8) {
            if (_start > 0) return null;
          } else if (_delta < 0) enter = Math.max(enter, -_start / _delta);else leave = Math.min(leave, -_start / _delta);
          if (enter > leave) return null;
        }
        return enter;
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/ViewportLayout.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports('viewportLayout', viewportLayout);
      cclegacy._RF.push({}, "541f0Fn6aRy0o38BwFOvME3", "ViewportLayout", undefined);
      /** Screen layout and combat framing are independent. No device/DOM dependency. */
      function viewportLayout(frameWidth, frameHeight) {
        var portrait = frameHeight > frameWidth;
        var height = portrait ? 720 * frameHeight / Math.max(1, frameWidth) : 720;
        var width = portrait ? 720 : 720 * frameWidth / Math.max(1, frameHeight);
        return {
          width: width,
          height: height,
          portrait: portrait,
          zoom: width < 1100 ? 1.25 : 1.4
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/VirtualJoystick.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig, clamp;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      clamp = module.clamp;
    }],
    execute: function () {
      cclegacy._RF.push({}, "74c90zUNxf3U4r0A2rTAnPg", "VirtualJoystick", undefined);

      /** One touch owns the stick; other fingers retain independent action ownership. */
      var VirtualJoystick = exports('VirtualJoystick', /*#__PURE__*/function () {
        function VirtualJoystick() {
          _classCallCheck(this, VirtualJoystick);
          _defineProperty(this, "owner", null);
          _defineProperty(this, "x", 0);
          _defineProperty(this, "y", 0);
          _defineProperty(this, "axis", 0);
          _defineProperty(this, "vertical", 0);
          _defineProperty(this, "radius", GameConfig.input.joystickRadius);
        }
        _createClass(VirtualJoystick, [{
          key: "start",
          value: function start(id, x, y) {
            if (this.owner !== null) return false;
            this.owner = id;
            this.move(id, x, y);
            return true;
          }
        }, {
          key: "move",
          value: function move(id, x, y) {
            if (id !== this.owner) return;
            var length = Math.hypot(x, y),
              scale = length > this.radius ? this.radius / length : 1;
            this.x = x * scale;
            this.y = y * scale;
            var amount = Math.min(1, length / this.radius);
            var mapped = clamp((amount - GameConfig.input.deadZone) / (1 - GameConfig.input.deadZone), 0, 1);
            this.axis = length > 0 ? x / length * mapped : 0;
            this.vertical = length > 0 ? y / length * mapped : 0;
          }
        }, {
          key: "end",
          value: function end(id) {
            if (id === this.owner) this.reset();
          }
        }, {
          key: "reset",
          value: function reset() {
            this.owner = null;
            this.x = this.y = this.axis = this.vertical = 0;
          }
        }]);
        return VirtualJoystick;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/WeaponArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, cclegacy, Graphics, colors;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
    }, function (module) {
      cclegacy = module.cclegacy;
      Graphics = module.Graphics;
    }, function (module) {
      colors = module.colors;
    }],
    execute: function () {
      cclegacy._RF.push({}, "8672d7+RNViRBOHEByv8Mr4", "WeaponArt", undefined);

      // Original silhouettes, relative to the firing hand. Tips match GameConfig.muzzleLength.
      var rifle = [-23, 3, -12, 3, -10, 6, 8, 6, 10, 2, 17, 2, 17, -2, 8, -2, 7, -13, 2, -14, 0, -3, -5, -3, -8, -10, -13, -9, -10, -2, -17, -2, -23, -7];
      var shotgun = [-25, 3, -12, 4, -7, 6, 27, 6, 27, -1, 1, -1, -3, -8, -9, -8, -8, -2, -17, -2, -25, -7];
      var launcher = [-25, 8, -20, 5, 20, 5, 26, 8, 26, -8, 20, -5, 4, -5, 2, -12, -3, -12, -2, -5, -20, -5, -25, -8];
      var knife = [-12, 3, 0, 3, 30, 10, 22, -1, 0, -3, -12, -3];
      var WeaponArt = exports('WeaponArt', /*#__PURE__*/function () {
        function WeaponArt() {
          _classCallCheck(this, WeaponArt);
        }
        _createClass(WeaponArt, [{
          key: "draw",
          value: function draw(ink, id, x, y) {
            var facing = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
            var pitch = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
            var scale = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 1;
            var outline = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : colors.ink;
            var fill = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : colors.paper;
            var cs = Math.cos(pitch),
              sn = Math.sin(pitch),
              g = ink.g;
            var px = function px(a, b) {
              return x + (a * cs - b * sn) * facing * scale;
            };
            var py = function py(a, b) {
              return y + (a * sn + b * cs) * scale;
            };
            var shape = id === "knife" ? knife : id === "rocket" ? launcher : id === "shotgun" ? shotgun : rifle;
            g.moveTo(px(shape[0], shape[1]), py(shape[0], shape[1]));
            for (var i = 2; i < shape.length; i += 2) g.lineTo(px(shape[i], shape[i + 1]), py(shape[i], shape[i + 1]));
            g.close();
            g.fillColor = fill;
            g.fill();
            g.strokeColor = outline;
            g.lineWidth = 2.6 * scale * ink.strokeScale;
            g.stroke();
            g.lineCap = Graphics.LineCap.BUTT;
            var line = function line(a, b, c, d) {
              var width = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1.5;
              var tint = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : outline;
              return ink.segment(px(a, b), py(a, b), px(c, d), py(c, d), width * scale, tint);
            };
            if (id === "rifle") {
              line(-7, 8, 8, 8, 2.2);
              line(-2, 6, -2, 8);
              line(10, 1, 17, 1);
              line(3, -7, 6, -7);
              line(-19, 1, -19, -2);
            } else if (id === "shotgun") {
              line(-6, 2, 27, 2);
              line(8, -2, 19, -2, 5.5, colors.mid);
              for (var _i = 10; _i < 20; _i += 4) line(_i, -4, _i, 0, 1);
              line(-22, 0, -14, 0);
            } else {
              line(-15, -4, -15, 4, 3, colors.mid);
              line(15, -4, 15, 4, 3, colors.mid);
              line(-20, 1, 19, 1, 1, colors.mid);
              line(4, 6, 4, 12, 2);
              line(4, 12, 10, 12, 2);
              line(26, -5, 26, 5, 2);
            }
            g.lineCap = Graphics.LineCap.ROUND;
          }
        }]);
        return WeaponArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/WeaponPresentation.ts", ['cc', './GameConfig.ts'], function (exports) {
  var cclegacy, GameConfig;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      exports('weaponPresentation', weaponPresentation);
      cclegacy._RF.push({}, "5adc9lSMQOywemO648Pd/Rn", "WeaponPresentation", undefined);

      /** One synchronous description consumed by HUD, actor, shots and audio. */
      function weaponPresentation(id, ammo) {
        var config = GameConfig.weapons[id];
        return {
          id: id,
          name: config.name,
          ammo: ammo,
          icon: "weapon.".concat(id),
          ammoText: id === "knife" ? "近战 · 三段连击" : ammo < 0 ? "∞  弹药" : "\u5269\u4F59 ".concat(ammo, " \u53D1"),
          projectile: id === "knife" ? null : id === "rocket" ? "rocket" : id === "shotgun" ? "pellet" : "bullet",
          sound: id,
          width: id === "knife" ? 44 : id === "rocket" ? 66 : 59,
          mode: id === "knife" ? "melee" : "ranged",
          muzzleExtra: id === "rifle" ? 0 : 9
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/WeaponSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './StickmanAnimator.ts', './ComicPose.ts', './WeaponPresentation.ts', './DirectPose.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _objectSpread2, cclegacy, GameConfig, StickmanAnimator, comicMuzzle, comicPose, weaponPresentation, directBarrel;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _objectSpread2 = module.objectSpread2;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      StickmanAnimator = module.StickmanAnimator;
    }, function (module) {
      comicMuzzle = module.comicMuzzle;
      comicPose = module.comicPose;
    }, function (module) {
      weaponPresentation = module.weaponPresentation;
    }, function (module) {
      directBarrel = module.directBarrel;
    }],
    execute: function () {
      cclegacy._RF.push({}, "cec5fd7ebcCaf/q3h30U5SM", "WeaponSystem", undefined);
      /** Shared weapon definition and firing pipeline for all three silhouettes. */
      var WeaponSystem = exports('WeaponSystem', /*#__PURE__*/function () {
        function WeaponSystem() {
          var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "rifle";
          _classCallCheck(this, WeaponSystem);
          _defineProperty(this, "cooldown", 0);
          _defineProperty(this, "flash", 0);
          _defineProperty(this, "flashX", 0);
          _defineProperty(this, "flashY", 0);
          _defineProperty(this, "flashFacing", 1);
          _defineProperty(this, "flashPitch", 0);
          _defineProperty(this, "animator", new StickmanAnimator());
          _defineProperty(this, "ammo", -1);
          _defineProperty(this, "shots", 0);
          _defineProperty(this, "revision", 0);
          _defineProperty(this, "lastShot", "rifle");
          _defineProperty(this, "lastGun", {
            id: "rifle",
            ammo: -1,
            cooldown: 0
          });
          _defineProperty(this, "canPresent", function () {
            return true;
          });
          this.id = id;
          this.equip(id);
        }
        _createClass(WeaponSystem, [{
          key: "presentation",
          get: function get() {
            return weaponPresentation(this.id, this.ammo);
          }
        }, {
          key: "equip",
          value: function equip(id) {
            var ammo = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : GameConfig.weapons[id].ammo;
            // Resource validation precedes the atomic state change. Pickups remain on
            // the floor if their presentation is not ready; no empty intermediate state.
            if (!this.canPresent(id)) return false;
            if (id === "knife" && this.id !== "knife") this.lastGun = {
              id: this.id,
              ammo: this.ammo,
              cooldown: this.cooldown
            };
            this.id = id;
            this.ammo = ammo;
            this.cooldown = 0;
            this.flash = 0;
            this.revision++;
            return true;
          }
        }, {
          key: "toggleKnife",
          value: function toggleKnife() {
            if (this.id !== "knife") return this.equip("knife");
            if (!this.equip(this.lastGun.id, this.lastGun.ammo)) return false;
            this.cooldown = this.lastGun.cooldown;
            return true;
          }
        }, {
          key: "reset",
          value: function reset() {
            this.cooldown = this.flash = 0;
            this.equip("rifle");
            this.lastGun = {
              id: "rifle",
              ammo: -1,
              cooldown: 0
            };
            this.shots = 0;
          }
        }, {
          key: "update",
          value: function update(dt) {
            if (this.id === "knife") this.lastGun.cooldown = Math.max(0, this.lastGun.cooldown - dt);
            this.cooldown = Math.max(0, this.cooldown - dt);
            this.flash = Math.max(0, this.flash - dt);
          }
        }, {
          key: "fire",
          value: function fire(source, projectiles, owner, interval) {
            var _source$aimPitch, _source$aimPitch2, _socket$x, _socket$y, _barrel$pitch2;
            if (this.id === "knife") return false;
            if (this.cooldown > 0) return false;
            if (owner === "player" && this.ammo === 0 && !this.equip("rifle")) return false;
            var config = GameConfig.weapons[this.id],
              scale = source.kind === "guard" ? 1.08 : 1;
            var projectile = this.presentation.projectile;
            if (!projectile) return false;
            var pose = this.animator.sample(source.animation, source.animationTime, config.recoil, true, source.deadTime, (_source$aimPitch = source.aimPitch) !== null && _source$aimPitch !== void 0 ? _source$aimPitch : 0, source);
            var pitch = (_source$aimPitch2 = source.aimPitch) !== null && _source$aimPitch2 !== void 0 ? _source$aimPitch2 : 0;
            var socket = GameConfig.artStyle === "comic" && owner === "player" ? comicMuzzle(_objectSpread2(_objectSpread2({}, source), {}, {
              weaponId: this.id,
              animation: source.animation,
              recoil: config.recoil
            }), pitch, this.id === "rifle" ? 0 : 9) : undefined;
            var barrel = socket && this.id === "rocket" ? directBarrel(comicPose(_objectSpread2(_objectSpread2({}, source), {}, {
              weaponId: this.id,
              recoil: config.recoil
            }))) : undefined;
            var x = source.x + ((_socket$x = socket === null || socket === void 0 ? void 0 : socket.x) !== null && _socket$x !== void 0 ? _socket$x : pose.rightHand.x + config.muzzleLength * Math.cos(pitch)) * source.facing * scale,
              y = source.y + ((_socket$y = socket === null || socket === void 0 ? void 0 : socket.y) !== null && _socket$y !== void 0 ? _socket$y : pose.rightHand.y + config.muzzleLength * Math.sin(pitch)) * scale;
            var fired = false;
            for (var i = 0; i < config.pellets; i++) fired = projectiles.spawn({
              owner: owner,
              x: x,
              y: y,
              direction: source.facing,
              speed: owner === "player" ? config.speed : GameConfig.enemyProjectile.speed,
              damage: config.damage,
              range: owner === "player" ? config.range : GameConfig.enemyProjectile.range,
              pitch: pitch + (i - (config.pellets - 1) / 2) * config.spread,
              kind: projectile,
              blastRadius: config.blastRadius,
              knockback: config.knockback,
              originX: source.x,
              originY: y,
              homing: owner === "player" && this.id === "rocket",
              launchPitch: barrel === null || barrel === void 0 ? void 0 : barrel.pitch
            }) || fired;
            if (!fired) return false;
            source.recoil = config.recoil;
            if (source.weaponId !== undefined) source.weaponId = this.id;
            if (this.id === "rocket") {
              var _barrel$backX, _barrel$backY, _barrel$pitch;
              var backX = source.x + ((_barrel$backX = barrel === null || barrel === void 0 ? void 0 : barrel.backX) !== null && _barrel$backX !== void 0 ? _barrel$backX : -20) * source.facing;
              var backY = source.y + ((_barrel$backY = barrel === null || barrel === void 0 ? void 0 : barrel.backY) !== null && _barrel$backY !== void 0 ? _barrel$backY : 45);
              var axis = (_barrel$pitch = barrel === null || barrel === void 0 ? void 0 : barrel.pitch) !== null && _barrel$pitch !== void 0 ? _barrel$pitch : pitch;
              for (var n = 0; n < 5; n++) projectiles.particles.emit(backX, backY + (n - 2) * 4, "smoke", -source.facing * Math.cos(axis) * (85 + n * 15), -Math.sin(axis) * (85 + n * 15) + 25 + n * 10);
            } else projectiles.particles.emit(source.x - 4 * source.facing, source.y + 42, "shell", -source.facing * 90, 160);
            if (owner === "player" && this.ammo > 0) this.ammo--;
            this.shots++;
            this.lastShot = this.id;
            this.flash = this.id === "rifle" ? 0.06 : 0.1;
            this.flashX = x;
            this.flashY = y;
            this.flashFacing = source.facing;
            this.flashPitch = (_barrel$pitch2 = barrel === null || barrel === void 0 ? void 0 : barrel.pitch) !== null && _barrel$pitch2 !== void 0 ? _barrel$pitch2 : pitch;
            this.cooldown = interval !== null && interval !== void 0 ? interval : config.interval;
            return true;
          }
        }]);
        return WeaponSystem;
      }());
      cclegacy._RF.pop();
    }
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/main', 'chunks:///_virtual/main'); 
})(function(mid, cid) {
    System.register(mid, [cid], function (_export, _context) {
    return {
        setters: [function(_m) {
            var _exportObj = {};

            for (var _key in _m) {
              if (_key !== "default" && _key !== "__esModule") _exportObj[_key] = _m[_key];
            }
      
            _export(_exportObj);
        }],
        execute: function () { }
    };
    });
});