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
                    return Promise.all(["rifle", "shotgun", "rocket", "blast", "hit", "step", "pickup"].map(function (name) {
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
              if (s.weapon.shots > this.shots) this.play(s.weapon.id);
              if (s.explosions.total > this.explosions) this.play("blast");
              if (s.player.health < this.health) this.play("hit");
              if (s.pickups.collected > this.pickups) this.play("pickup");
              if (s.player.grounded && Math.abs(s.player.vx) > 25 && s.time - this.stepAt > Math.min(0.4, 56 / Math.abs(s.player.vx))) {
                this.stepAt = s.time;
                this.play("step");
              }
            }
            this.shots = s.weapon.shots;
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
        }
        _createClass(CameraFollow, [{
          key: "reset",
          value: function reset() {
            this.x = 0;
          }
        }, {
          key: "update",
          value: function update(playerX, dt, mapWidth) {
            var target = clamp(playerX - GameConfig.width * 0.38, 0, mapWidth - GameConfig.width);
            this.x += (target - this.x) * (1 - Math.exp(-dt * 8));
            this.x = clamp(this.x, 0, mapWidth - GameConfig.width);
          }
        }]);
        return CameraFollow;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CharacterArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Ink.ts', './StickmanAnimator.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, Color, GameConfig, colors, StickmanAnimator;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
    }, function (module) {
      GameConfig = module.GameConfig;
    }, function (module) {
      colors = module.colors;
    }, function (module) {
      StickmanAnimator = module.StickmanAnimator;
    }],
    execute: function () {
      cclegacy._RF.push({}, "5e821lYdrzSBbyKuLk0Gd/G", "CharacterArt", undefined);
      /** Joint driven drawing. Scratch colors/pose points are reused across every actor. */
      var CharacterArt = exports('CharacterArt', /*#__PURE__*/function () {
        function CharacterArt() {
          _classCallCheck(this, CharacterArt);
          _defineProperty(this, "animator", new StickmanAnimator());
          _defineProperty(this, "color", new Color(24, 24, 24));
          _defineProperty(this, "shade", new Color(175, 175, 168));
        }
        _createClass(CharacterArt, [{
          key: "draw",
          value: function draw(ink, a, cameraX) {
            var _a$aimPitch, _a$shieldHealth;
            var armed = a.kind !== "melee",
              pose = this.animator.sample(a.animation, a.animationTime, a.recoil, armed, a.deadTime, (_a$aimPitch = a.aimPitch) !== null && _a$aimPitch !== void 0 ? _a$aimPitch : 0);
            var alpha = a.animation === "Dead" ? Math.max(0, 1 - a.deadTime / 1.25) : a.invincible && Math.floor(a.invincible * 14) % 2 === 0 ? 0.3 : 1;
            this.color.a = alpha * 255;
            this.shade.a = alpha * 255;
            var color = this.color,
              shade = this.shade;
            var scale = a.kind === "guard" ? 1.08 : 1,
              baseX = a.x - cameraX,
              baseY = a.y,
              dir = a.facing,
              fx = dir * scale;
            var line = function line(v, w) {
              var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : GameConfig.rendering.lineWidth;
              return ink.segment(baseX + v.x * fx, baseY + v.y * scale, baseX + w.x * fx, baseY + w.y * scale, width, color);
            };
            var local = function local(x, y, x2, y2) {
              var width = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 2;
              return ink.segment(baseX + x * fx, baseY + y * scale, baseX + x2 * fx, baseY + y2 * scale, width, color);
            };
            var circle = function circle(x, y, r, fill) {
              return ink.circle(baseX + x * fx, baseY + y * scale, r * scale, color, fill, 2);
            };
            if (a.animation !== "Dead") ink.ellipse(baseX, baseY - 2, 18, 3, colors.far, colors.far, 1);
            // Backpack and shoulder strap sit behind the rig, remaining recognizable in both directions.
            var torso = pose.torso,
              neck = pose.neck;
            ink.ellipse(baseX + (torso.x - 9) * fx, baseY + (torso.y + 10) * scale, 8 * scale, 12 * scale, color, shade, 2);
            local(torso.x - 12, torso.y + 15, neck.x + 3, neck.y - 5, 1.5);
            line(pose.neck, pose.torso, 3.6);
            line(pose.leftShoulder, pose.leftElbow);
            line(pose.leftElbow, pose.leftHand);
            line(pose.rightShoulder, pose.rightElbow);
            line(pose.rightElbow, pose.rightHand);
            line(pose.leftHip, pose.leftKnee, 3.8);
            line(pose.leftKnee, pose.leftAnkle, 3.5);
            line(pose.rightHip, pose.rightKnee, 3.8);
            line(pose.rightKnee, pose.rightAnkle, 3.5);
            for (var _i = 0, _arr = [pose.leftAnkle, pose.rightAnkle]; _i < _arr.length; _i++) {
              var foot = _arr[_i];
              ink.ellipse(baseX + (foot.x + 3) * fx, baseY + (foot.y + 2) * scale, 8 * scale, 3.5 * scale, color, color, 1);
              local(foot.x - 2, foot.y + 5, foot.x + 5, foot.y + 5, 1);
            }
            circle(pose.leftHand.x, pose.leftHand.y, 3, colors.paper);
            circle(pose.rightHand.x, pose.rightHand.y, 3, colors.paper);
            var head = pose.head,
              hx = baseX + head.x * fx,
              hy = baseY + head.y * scale;
            ink.ellipse(hx, hy, 10.5 * scale, 11 * scale, color, colors.paper, 3);
            if (!a.kind) {
              local(head.x - 10, head.y + 5, head.x + 10, head.y + 5, 2.7);
              local(head.x - 10, head.y + 5, head.x - 15, head.y + 3, 2);
              local(head.x - 14, head.y + 4, head.x - 20, head.y - 2, 2);
              local(head.x - 3, head.y + 11, head.x + 1, head.y + 15, 1.5);
              local(head.x + 1, head.y + 15, head.x + 3, head.y + 11, 1.5);
            } else {
              ink.ellipse(hx, hy + 7 * scale, 12 * scale, 5 * scale, color, shade, 2);
              local(head.x - 12, head.y + 5, head.x + 13, head.y + 5, 2);
            }
            if (a.animation === "Hit" || a.animation === "Dead") {
              local(head.x + 2, head.y - 1, head.x + 7, head.y + 3, 1.7);
              local(head.x + 2, head.y + 3, head.x + 7, head.y - 1, 1.7);
              circle(head.x + 4, head.y - 6, 2.6);
            } else {
              circle(head.x + 5, head.y + 1, 1.7, color);
              local(head.x + 1, head.y + 5, head.x + 7, head.y + 4, 1.6);
              local(head.x + 2, head.y - 6, head.x + 7, head.y - 5, 1.4);
            }
            local(neck.x - 3, neck.y - 5, neck.x + 5, neck.y - 8, 2);
            local(torso.x - 4, torso.y + 2, torso.x + 5, torso.y + 2, 2);
            if (a.kind === "shield" && ((_a$shieldHealth = a.shieldHealth) !== null && _a$shieldHealth !== void 0 ? _a$shieldHealth : 0) > 0 && a.animation !== "Dead") {
              var bx = baseX + 26 * dir;
              ink.ellipse(bx, baseY + 35, 13, 31, color, shade, 3.5);
              ink.ellipse(bx, baseY + 35, 5, 8, color, colors.paper, 2);
              ink.segment(bx - 8, baseY + 55, bx + 8, baseY + 55, 2);
            }
            if (armed && a.animation !== "Dead") {
              var _a$aimPitch2, _a$weaponId;
              var hand = pose.rightHand,
                angle = (_a$aimPitch2 = a.aimPitch) !== null && _a$aimPitch2 !== void 0 ? _a$aimPitch2 : 0,
                cs = Math.cos(angle),
                sn = Math.sin(angle),
                weapon = (_a$weaponId = a.weaponId) !== null && _a$weaponId !== void 0 ? _a$weaponId : "rifle";
              var gun = function gun(x, y, x2, y2) {
                var width = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 3;
                var tint = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : color;
                return ink.segment(baseX + (hand.x + x * cs - y * sn) * fx, baseY + (hand.y + x * sn + y * cs) * scale, baseX + (hand.x + x2 * cs - y2 * sn) * fx, baseY + (hand.y + x2 * sn + y2 * cs) * scale, width, tint);
              };
              gun(-13, 0, GameConfig.weapons[weapon].muzzleLength, 0, weapon === "rocket" ? 10 : 5.5);
              gun(-12, 0, -21, -3, 5);
              gun(0, -1, -2, -8, 4);
              gun(6, 3, 12, 3, 1.2, colors.paper);
              if (weapon === "shotgun") {
                gun(0, 4, 27, 4, 3);
                gun(8, -5, 17, -5, 3);
                gun(-5, -3, 2, -3, 2, shade);
              }
              if (weapon === "rocket") {
                gun(-23, 0, -15, 0, 13);
                gun(-10, 4, 21, 4, 1, colors.paper);
                gun(5, 5, 5, 11, 2);
              }
            }
          }
        }]);
        return CharacterArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CocosInputAdapter.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, input, Input, KeyCode, Vec2, Node, GameConfig;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
      input = module.input;
      Input = module.Input;
      KeyCode = module.KeyCode;
      Vec2 = module.Vec2;
      Node = module.Node;
    }, function (module) {
      GameConfig = module.GameConfig;
    }],
    execute: function () {
      cclegacy._RF.push({}, "0bcc4SPVYPR8dHAAgg/hEdQ", "CocosInputAdapter", undefined);

      /** Cocos events are the only device event boundary. Touch IDs retain independent ownership. */
      var CocosInputAdapter = exports('CocosInputAdapter', /*#__PURE__*/function () {
        function CocosInputAdapter(state, onEnter) {
          _classCallCheck(this, CocosInputAdapter);
          _defineProperty(this, "keys", new Set());
          _defineProperty(this, "bindings", []);
          this.state = state;
          this.onEnter = onEnter;
          input.on(Input.EventType.KEY_DOWN, this.down, this);
          input.on(Input.EventType.KEY_UP, this.up, this);
          input.on(Input.EventType.TOUCH_END, this.touchEnd, this);
          input.on(Input.EventType.TOUCH_CANCEL, this.touchEnd, this);
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
          key: "touchEnd",
          value: function touchEnd(e) {
            this.state.release("touch:".concat(e.getID()));
            var id = e.getID();
            if (id !== null) this.state.joystick.end(id);
          }
        }, {
          key: "bindJoystick",
          value: function bindJoystick(stick) {
            var _this = this;
            var location = new Vec2();
            var coordinates = function coordinates(e) {
              e.getUILocation(location);
              location.x -= stick.worldPosition.x + GameConfig.width / 2;
              location.y -= stick.worldPosition.y + GameConfig.height / 2;
            };
            var start = function start(e) {
              coordinates(e);
              var id = e.getID();
              if (id !== null) _this.state.joystick.start(id, location.x, location.y);
              e.propagationStopped = true;
            };
            var move = function move(e) {
              coordinates(e);
              var id = e.getID();
              if (id !== null) _this.state.joystick.move(id, location.x, location.y);
              e.propagationStopped = true;
            };
            var end = function end(e) {
              _this.touchEnd(e);
              e.propagationStopped = true;
            };
            stick.on(Node.EventType.TOUCH_START, start);
            stick.on(Node.EventType.TOUCH_MOVE, move);
            stick.on(Node.EventType.TOUCH_END, end);
            stick.on(Node.EventType.TOUCH_CANCEL, end);
            this.bindings.push({
              node: stick,
              start: start,
              move: move,
              end: end
            });
          }
        }, {
          key: "bindButton",
          value: function bindButton(button, action) {
            var _this2 = this;
            var start = function start(e) {
              _this2.state.press("touch:".concat(e.getID()), action);
              e.propagationStopped = true;
            };
            var end = function end(e) {
              _this2.touchEnd(e);
              e.propagationStopped = true;
            };
            button.on(Node.EventType.TOUCH_START, start);
            button.on(Node.EventType.TOUCH_END, end);
            button.on(Node.EventType.TOUCH_CANCEL, end);
            this.bindings.push({
              node: button,
              start: start,
              end: end
            });
          }
        }, {
          key: "clear",
          value: function clear() {
            this.state.clear();
          }
        }, {
          key: "hidden",
          value: function hidden() {
            this.keys.clear();
            this.state.clear();
          }
        }, {
          key: "destroy",
          value: function destroy() {
            input.off(Input.EventType.KEY_DOWN, this.down, this);
            input.off(Input.EventType.KEY_UP, this.up, this);
            input.off(Input.EventType.TOUCH_END, this.touchEnd, this);
            input.off(Input.EventType.TOUCH_CANCEL, this.touchEnd, this);
            var _iterator = _createForOfIteratorHelper(this.bindings),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var b = _step.value;
                b.node.off(Node.EventType.TOUCH_START, b.start);
                b.node.off(Node.EventType.TOUCH_END, b.end);
                b.node.off(Node.EventType.TOUCH_CANCEL, b.end);
                if (b.move) b.node.off(Node.EventType.TOUCH_MOVE, b.move);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        }]);
        return CocosInputAdapter;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/CombatRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Color, colors;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
    }, function (module) {
      colors = module.colors;
    }],
    execute: function () {
      cclegacy._RF.push({}, "7fbc6X82fOQGSvecMSWPscB", "CombatRenderer", undefined);
      var CombatRenderer = exports('CombatRenderer', /*#__PURE__*/function () {
        function CombatRenderer() {
          _classCallCheck(this, CombatRenderer);
          _defineProperty(this, "tint", new Color(24, 24, 24));
        }
        _createClass(CombatRenderer, [{
          key: "draw",
          value: function draw(ink, session) {
            ink.clear();
            var cam = session.camera.x;
            var _iterator = _createForOfIteratorHelper(session.projectiles.marks),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var m = _step.value;
                if (m.active && m.x > cam - 10 && m.x < cam + 1290) {
                  ink.circle(m.x - cam, m.y, 1.6, colors.muted, colors.muted, 1);
                  ink.segment(m.x - cam - 3, m.y + 3, m.x - cam + 2, m.y - 2, 1, colors.muted);
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            var boss = session.spawner.guard;
            if (boss.active && boss.warningTime > 0) {
              for (var n = 0; n < (boss.phase === 2 ? 2 : 1); n++) {
                var x = boss.warningX - cam + n * 75;
                ink.ellipse(x, 154, 85, 10, colors.ink, undefined, 2);
                ink.segment(x - 35, 157, x + 35, 157, 2);
                ink.segment(x - 50, 175, x - 40, 183, 2);
                ink.segment(x + 50, 175, x + 40, 183, 2);
              }
            }
            var _iterator2 = _createForOfIteratorHelper(session.projectiles.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var p = _step2.value;
                if (p.active && p.x > cam - 30 && p.x < cam + 1310) {
                  var _x = p.x - cam,
                    length = Math.hypot(p.vx, p.vy) || 1,
                    trail = p.kind === "rocket" ? 24 : 15;
                  ink.line([{
                    x: _x - p.vx / length * trail,
                    y: p.y - p.vy / length * trail
                  }, {
                    x: _x,
                    y: p.y
                  }], p.kind === "rocket" ? 5 : p.kind === "pellet" ? 2 : p.owner === "player" ? 3 : 2, colors.ink);
                  if (p.owner === "enemy") ink.circle(_x, p.y, p.kind === "cannon" ? 6 : 2, colors.ink, p.kind === "cannon" ? colors.paper : colors.ink, 2);
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            var _iterator3 = _createForOfIteratorHelper(session.grenades.items),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var g = _step3.value;
                if (g.active) {
                  var _x2 = g.x - cam;
                  ink.circle(_x2, g.y, 6, colors.ink, colors.paper, 2);
                  ink.line([{
                    x: _x2,
                    y: g.y + 6
                  }, {
                    x: _x2 + Math.cos(g.spin) * 5,
                    y: g.y + 10
                  }], 2);
                }
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            var _iterator4 = _createForOfIteratorHelper(session.explosions.items),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var b = _step4.value;
                if (b.active && b.x > cam - b.radius && b.x < cam + 1280 + b.radius) {
                  var _x3 = b.x - cam,
                    amount = b.age / 0.65,
                    shade = new Color(80, 80, 76, Math.max(0, 1 - amount) * 160);
                  ink.circle(_x3, b.y, b.radius * (0.15 + amount * 0.8), shade, undefined, 2);
                  for (var _n = 0; _n < 7; _n++) {
                    var angle = _n * Math.PI * 2 / 7,
                      r = b.radius * amount * 0.35;
                    ink.circle(_x3 + Math.cos(angle) * r, b.y + Math.sin(angle) * r + amount * 30, 12 + amount * 25, shade, new Color(235, 235, 230, (1 - amount) * 155), 1.5);
                  }
                  if (amount < 0.35) for (var _n2 = 0; _n2 < 8; _n2++) {
                    var a = _n2 * Math.PI / 4;
                    ink.line([{
                      x: _x3 + Math.cos(a) * 12,
                      y: b.y + Math.sin(a) * 12
                    }, {
                      x: _x3 + Math.cos(a) * 55,
                      y: b.y + Math.sin(a) * 55
                    }], 3);
                  }
                }
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
            var _iterator5 = _createForOfIteratorHelper(session.particles.items),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var _p = _step5.value;
                if (_p.active && _p.x > cam - 80 && _p.x < cam + 1360) {
                  var color = this.tint,
                    _amount = 1 - _p.life / _p.maxLife;
                  color.set(_p.kind === "smoke" ? 140 : 24, _p.kind === "smoke" ? 140 : 24, _p.kind === "smoke" ? 135 : 24, 255 * _p.life / _p.maxLife);
                  if (_p.kind === "smoke" || _p.kind === "dust") ink.ellipse(_p.x - cam, _p.y, _p.size + _amount * (_p.kind === "smoke" ? 14 : 7), _p.size * 0.65 + _amount * 5, color, undefined, 1.5);else if (_p.kind === "shell" || _p.kind === "wood") {
                    var _length = _p.kind === "shell" ? 3 : 7;
                    ink.segment(_p.x - cam - Math.cos(_p.spin) * _length, _p.y - Math.sin(_p.spin) * _length, _p.x - cam + Math.cos(_p.spin) * _length, _p.y + Math.sin(_p.spin) * _length, _p.size, color);
                  } else ink.segment(_p.x - cam, _p.y, _p.x - cam - _p.vx * 0.018, _p.y - _p.vy * 0.018, _p.size, color);
                }
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
            var flash = function flash(weapon) {
              if (weapon.flash <= 0) return;
              var x = weapon.flashX - cam,
                y = weapon.flashY,
                d = weapon.flashFacing;
              var size = weapon.id === "rifle" ? 1 : weapon.id === "shotgun" ? 1.6 : 1.3;
              ink.line([{
                x: x + 3 * d,
                y: y + 5
              }, {
                x: x + 23 * d * size,
                y: y
              }, {
                x: x + 3 * d,
                y: y - 5
              }, {
                x: x + 7 * d,
                y: y
              }, {
                x: x + 3 * d,
                y: y + 5
              }], 2, colors.ink);
              ink.line([{
                x: x + 18 * d,
                y: y + 7
              }, {
                x: x + 24 * d,
                y: y + 9
              }], 1, colors.muted);
            };
            flash(session.weapon);
            var _iterator6 = _createForOfIteratorHelper(session.spawner.enemies),
              _step6;
            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                var e = _step6.value;
                if (e.x < cam - 60 || e.x > cam + 1340) continue;
                flash(e.weapon);
                if (e.windup > 0 && e.alive) {
                  var _x4 = e.x - cam,
                    y = e.y + 91;
                  ink.line([{
                    x: _x4,
                    y: y + 6
                  }, {
                    x: _x4,
                    y: y + 16
                  }], 2);
                  ink.circle(_x4, y, 1, colors.ink, colors.ink, 1);
                }
                if (e.alive && e.health < e.maxHealth) {
                  ink.rect(e.x - cam - 18, e.y + 84, 36, 3, colors.muted, colors.paper, 1);
                  ink.rect(e.x - cam - 18, e.y + 84, 36 * e.health / e.maxHealth, 3, colors.ink, colors.ink, 1);
                }
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }
          }
        }]);
        return CombatRenderer;
      }());
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
        var l = clamp(insets.left, 0, 90),
          r = clamp(insets.right, 0, 90),
          b = clamp(insets.bottom, 0, 45),
          t = clamp(insets.top, 0, 45);
        return {
          joystick: {
            x: 140 + l,
            y: 105 + b,
            r: 66
          },
          jump: {
            x: 1034 - r,
            y: 170 + b
          },
          shoot: {
            x: 1162 - r,
            y: 100 + b
          },
          grenade: {
            x: 934 - r,
            y: 92 + b
          },
          pause: {
            x: 1204 - r,
            y: 686 - t
          }
        };
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/DestructibleManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './DestructibleObject.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, DestructibleObject;
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
                      if (o.x + o.w > r.x && o.x < r.x + r.w && oldY >= r.y + r.h && o.y <= r.y + r.h) {
                        var _this$onHit;
                        o.y = r.y + r.h;
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

System.register("chunks:///_virtual/EnemyController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts', './WeaponSystem.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig, segmentRect, WeaponSystem;
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
    }, function (module) {
      WeaponSystem = module.WeaponSystem;
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
          _defineProperty(this, "recoil", 0);
          _defineProperty(this, "attackCooldown", 0.8);
          _defineProperty(this, "windup", 0);
          _defineProperty(this, "aimPitch", 0);
          _defineProperty(this, "shieldHealth", 0);
          _defineProperty(this, "shieldHit", 0);
          _defineProperty(this, "deathEffectPlayed", false);
          _defineProperty(this, "turnTime", 0);
          _defineProperty(this, "patrolDirection", -1);
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
            if (this.state === "Attack") return "Shoot";
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
            this.vx = direction * 65;
            this.state = this.alive ? "Hit" : "Dead";
            if (!blocked) this.windup = 0;
            return true;
          }
        }, {
          key: "update",
          value: function update(dt, player, level, projectiles) {
            var _this = this;
            this.animationTime += dt;
            this.weapon.update(dt);
            this.recoil = Math.max(0, this.recoil - dt * 8);
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
            this.hitTime = Math.max(0, this.hitTime - dt);
            this.shieldHit = Math.max(0, this.shieldHit - dt);
            var config = GameConfig.enemies[this.kind],
              dx = player.x - this.x,
              dy = player.y - this.y;
            if (!this.alive) {
              this.state = "Dead";
              this.deadTime += dt;
              this.vx *= Math.exp(-dt * 3);
            } else if (this.hitTime > 0) {
              this.state = "Hit";
              this.vx *= Math.exp(-dt * 5);
            } else if (!player.alive || Math.abs(dx) > config.notice) {
              this.windup = 0;
              this.state = Math.abs(dx) > 900 ? "Idle" : "Patrol";
              if (this.x < this.spawn.x - this.spawn.patrol) this.patrolDirection = 1;
              if (this.x > this.spawn.x + this.spawn.patrol) this.patrolDirection = -1;
              this.vx = this.state === "Patrol" ? this.patrolDirection * config.speed * 0.3 : 0;
              if (this.vx) this.facing = this.vx > 0 ? 1 : -1;
            } else {
              var desired = dx >= 0 ? 1 : -1;
              if (this.kind === "shield" && desired !== this.facing) {
                this.turnTime += dt;
                if (this.turnTime >= 0.45) {
                  this.facing = desired;
                  this.turnTime = 0;
                }
              } else {
                this.facing = desired;
                this.turnTime = 0;
              }
              var close = Math.abs(dx) <= config.range && Math.abs(dy) < (this.kind === "melee" ? 50 : 110);
              var sight = !level.solids.some(function (s) {
                return !s.entityId && segmentRect({
                  x: _this.x,
                  y: _this.y + 44
                }, {
                  x: player.x,
                  y: player.y + 44
                }, s) !== null;
              });
              if (close && (this.kind === "melee" || sight)) {
                this.state = "Attack";
                this.vx = this.kind === "ranged" && this.spawn.y === 150 ? (Math.abs(dx) < 220 ? -this.facing : this.facing) * config.speed * 0.4 : 0;
                this.aimPitch = this.kind === "turret" ? Math.max(-0.3, Math.min(0.65, Math.atan2(dy - 12, Math.abs(dx)))) : 0;
                if (this.attackCooldown === 0 && this.windup === 0) this.windup = this.kind === "melee" ? 0.38 : this.kind === "turret" ? 0.7 : 0.4;
                if (this.windup > 0) {
                  this.windup = Math.max(0, this.windup - dt);
                  if (this.windup === 0) {
                    if (this.kind === "melee") {
                      if (Math.abs(player.x - this.x) < config.range + 8 && Math.abs(player.y - this.y) < 50) player.takeDamage(config.damage, this.facing);
                    } else if (this.kind === "turret") {
                      projectiles.spawn({
                        owner: "enemy",
                        x: this.x + this.facing * 36 * Math.cos(this.aimPitch),
                        y: this.y + 50 + 36 * Math.sin(this.aimPitch),
                        direction: this.facing,
                        pitch: this.aimPitch,
                        speed: 260,
                        damage: 2,
                        range: 1150,
                        kind: "cannon",
                        blastRadius: 55
                      });
                      this.recoil = 1.5;
                    } else this.weapon.fire(this, projectiles, "enemy", config.interval);
                    this.attackCooldown = config.interval;
                  }
                }
              } else {
                this.state = "Chase";
                this.windup = 0;
                this.vx = this.kind === "melee" || !sight || Math.abs(dx) > config.range ? this.facing * config.speed : 0;
              }
            }
            // Ranged platform soldiers remain on their patrol surface. Melee soldiers can negotiate crates.
            if (this.kind === "ranged" && this.spawn.y > 150 && Math.abs(this.x - this.spawn.x) > this.spawn.patrol) this.vx = 0;
            var oldX = this.x;
            this.vy -= GameConfig.player.gravity * dt;
            level.move(this, dt);
            if (this.alive && this.kind === "melee" && this.state === "Chase" && this.grounded && Math.abs(this.x - oldX) < 0.01 && Math.abs(dx) > 50) this.vy = 480;
          }
        }]);
        return EnemyController;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/EnemySpawner.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './LevelData.ts', './EnemyController.ts', './TankBoss.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, AbandonedBase, EnemyController, TankBoss;
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
              return d.kind === "guard" ? new TankBoss(d) : new EnemyController(d);
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
            return this.enemies.find(function (e) {
              return e.kind === "guard";
            });
          }
        }]);
        return EnemySpawner;
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
              age: 0
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
              owner: "neutral"
            };
          }));
          _defineProperty(this, "head", 0);
          _defineProperty(this, "count", 0);
          _defineProperty(this, "total", 0);
          _defineProperty(this, "dropped", 0);
        }
        _createClass(ExplosionSystem, [{
          key: "enqueue",
          value: function enqueue(x, y, radius, damage, owner) {
            if (this.count === this.queue.length) {
              this.dropped++;
              return;
            }
            Object.assign(this.queue[(this.head + this.count) % this.queue.length], {
              x: x,
              y: y,
              radius: radius,
              damage: damage,
              owner: owner
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
                _owner = b.owner;
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
                age: 0
              });
              this.total++;
              apply(_x, _y, _radius, _damage, _owner);
            }
          }
        }, {
          key: "update",
          value: function update(dt) {
            var _iterator = _createForOfIteratorHelper(this.items),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var b = _step.value;
                if (b.active) {
                  b.age += dt;
                  if (b.age > 0.65) b.active = false;
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
          }
        }, {
          key: "reset",
          value: function reset() {
            var _iterator2 = _createForOfIteratorHelper(this.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var b = _step2.value;
                b.active = false;
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
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
        width: 1280,
        height: 720,
        fps: 60,
        fixedStep: 1 / 120,
        maxFrameDelta: 0.1,
        input: {
          joystickRadius: 66,
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
        weapons: {
          rifle: {
            id: "rifle",
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
        enemyProjectile: {
          speed: 430,
          range: 1000
        },
        pools: {
          projectiles: 96,
          particles: 320
        },
        rendering: {
          lineWidth: 3.3,
          headRadius: 10,
          corpseDuration: 0.8
        }
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './InputManager.ts', './GameSession.ts', './Ink.ts', './StickmanRenderer.ts', './LevelRenderer.ts', './PlatformBridge.ts', './CombatRenderer.ts', './CocosInputAdapter.ts', './HUDController.ts', './ObjectRenderer.ts', './AudioBridge.ts'], function (exports) {
  var _inherits, _createSuper, _classCallCheck, _defineProperty, _assertThisInitialized, _createClass, _objectSpread2, _createForOfIteratorHelper, cclegacy, _decorator, view, ResolutionPolicy, game, profiler, Canvas, Camera, Layers, Color, UITransform, Component, GameConfig, InputManager, GameSession, node, Ink, StickmanRenderer, LevelRenderer, PlatformBridge, CombatRenderer, CocosInputAdapter, HUDController, ObjectRenderer, AudioBridge;
  return {
    setters: [function (module) {
      _inherits = module.inherits;
      _createSuper = module.createSuper;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _assertThisInitialized = module.assertThisInitialized;
      _createClass = module.createClass;
      _objectSpread2 = module.objectSpread2;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
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
          return _this;
        }
        _createClass(GameManager, [{
          key: "onLoad",
          value: function onLoad() {
            try {
              this.initialize();
              this.ready = true;
              console.info("[Breakout] V0.2 ready; fixed simulation 120Hz, render 60FPS.");
            } catch (error) {
              console.error("[Breakout] Initialization failed", error);
              throw error;
            }
          }
        }, {
          key: "initialize",
          value: function initialize() {
            var _this2 = this;
            view.setDesignResolutionSize(GameConfig.width, GameConfig.height, ResolutionPolicy.SHOW_ALL);
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
            var board = node(canvasNode, "Screen", -GameConfig.width / 2, -GameConfig.height / 2, GameConfig.width, GameConfig.height);
            board.getComponent(UITransform).setAnchorPoint(0, 0);
            this.world = node(board, "World presentation");
            this.map = new LevelRenderer(this.world, this.session.level);
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
            });
            this.platform.install(function () {
              _this2.adapter.hidden();
              _this2.session.pause();
              _this2.accumulator = 0;
            }, function () {
              return _objectSpread2(_objectSpread2({}, _this2.session.snapshot()), {}, {
                audio: _this2.audio.status(),
                visibleChunks: _this2.map.visibleChunks,
                controls: {
                  stick: {
                    x: _this2.controls.joystick.x,
                    y: _this2.controls.joystick.y,
                    axis: _this2.controls.joystick.axis,
                    vertical: _this2.controls.joystick.vertical,
                    owner: _this2.controls.joystick.owner
                  },
                  layout: _this2.hud.layout
                }
              });
            });
          }
        }, {
          key: "enter",
          value: function enter() {
            if (this.session.state === "title" || this.session.state === "gameover" || this.session.state === "complete") this.startRun();else if (this.session.state === "paused") this.resume();
          }
        }, {
          key: "startRun",
          value: function startRun() {
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
            this.adapter.clear();
            this.accumulator = 0;
            this.session.resume();
          }
        }, {
          key: "togglePause",
          value: function togglePause() {
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
            var frame = view.getFrameSize();
            if (frame.width !== this.frameWidth || frame.height !== this.frameHeight) {
              this.frameWidth = frame.width;
              this.frameHeight = frame.height;
              this.hud.applyInsets(this.platform.safeInsets());
              this.adapter.clear();
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
            var shake = s.shakeTime > 0 ? s.shakePower * Math.min(1, s.shakeTime / 0.12) : 0;
            this.world.setPosition(Math.sin(s.time * 103) * shake, Math.cos(s.time * 119) * shake * 0.6);
            this.audio.update(s);
            this.map.update(s.camera.x, s.level.guardDefeated);
            this.objects.draw(s);
            this.actors.clear();
            var _iterator = _createForOfIteratorHelper(s.spawner.enemies),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var e = _step.value;
                if (e.x > s.camera.x - 100 && e.x < s.camera.x + GameConfig.width + 100 && e.deadTime < (e.kind === "guard" ? 2.6 : GameConfig.rendering.corpseDuration)) this.renderer.draw(this.actors, e, s.camera.x);
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            this.renderer.draw(this.actors, s.player, s.camera.x);
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

System.register("chunks:///_virtual/GameSession.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts', './PlayerController.ts', './LevelController.ts', './CameraFollow.ts', './EnemySpawner.ts', './ParticlePool.ts', './ProjectileManager.ts', './WeaponSystem.ts', './ExplosionSystem.ts', './GrenadeSystem.ts', './PickupSystem.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _objectSpread2, cclegacy, GameConfig, clamp, PlayerController, LevelController, CameraFollow, EnemySpawner, ParticlePool, ProjectileManager, WeaponSystem, ExplosionSystem, GrenadeSystem, PickupSystem;
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
            this.camera.reset();
            this.spawner.reset(this.level.data.enemies);
            this.particles.reset();
            this.projectiles.reset();
            this.weapon.reset();
            this.explosions.reset();
            this.grenades.reset();
            this.pickups.reset();
            this.combo = this.bestCombo = this.lastKills = 0;
            this.comboTime = 0;
            this.dropSeed = 1;
            this.shakeTime = this.shakePower = this.hitStop = 0;
            this.bossDeathStarted = false;
            this.projectiles.onExplosion = function (x, y, radius, damage, owner) {
              return _this.explosions.enqueue(x, y, radius, damage, owner);
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
            this.time += dt;
            this.shakeTime = Math.max(0, this.shakeTime - dt);
            this.comboTime = Math.max(0, this.comboTime - dt);
            if (this.comboTime === 0) this.combo = 0;
            this.hitFlash = Math.max(0, this.hitFlash - dt);
            var health = this.player.health;
            this.level.updateWorld(dt, this.player, this.spawner.enemies);
            var grounded = this.player.grounded;
            this.level.objects.update(dt, this.level.staticSolids);
            this.level.objects.flushHits();
            this.level.refreshSolids();
            this.player.update(dt, input, this.level);
            if (!grounded && this.player.grounded) {
              for (var i = 0; i < 5; i++) this.particles.emit(this.player.x + (i - 2) * 5, this.player.y, "dust", (i - 2) * 30, 30);
            }
            this.weapon.update(dt);
            if (this.state === "playing" && input.shoot && this.player.alive) this.weapon.fire(this.player, this.projectiles, "player");
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
            this.projectiles.update(dt, this.player, this.spawner.enemies, this.level.solids, function (target) {
              if ("state" in target) {
                _this2.hitStop = Math.max(_this2.hitStop, 0.018);
                _this2.shakePower = 1.6;
                _this2.shakeTime = 0.08;
              }
            }, this.level.objects.objects);
            this.level.objects.flushHits();
            var _iterator2 = _createForOfIteratorHelper(this.spawner.enemies),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _e = _step2.value;
                if (!_e.alive && _e.kind === "turret" && !_e.deathEffectPlayed) {
                  _e.deathEffectPlayed = true;
                  this.explosions.enqueue(_e.x, _e.y + 35, 85, 0, "player");
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
                for (var _n = 0; _n < 5; _n++) this.explosions.enqueue(this.spawner.guard.x + (_n - 2) * 35, 185 + _n % 2 * 55, 130, 0, "player");
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
            if (this.level.arenaEntered && this.level.data.arena) this.camera.x += (this.level.data.arena.start - this.camera.x) * (1 - Math.exp(-dt * 7));else this.camera.update(this.player.x, dt, this.level.data.width);
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
                aimPitch: this.player.aimPitch
              },
              cameraX: this.camera.x,
              kills: this.spawner.kills,
              weapon: this.weapon.id,
              ammo: this.weapon.ammo,
              grenades: this.player.grenades,
              grenadesThrown: this.grenades.thrown,
              destroyedObjects: this.level.objects.destroyed,
              explosions: this.explosions.total,
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
                return {
                  owner: p.owner,
                  kind: p.kind,
                  x: p.x,
                  y: p.y,
                  vx: p.vx,
                  vy: p.vy
                };
              }),
              remaining: this.spawner.remaining,
              guardHealth: this.spawner.guard.health,
              boss: {
                phase: this.spawner.guard.phase,
                active: this.spawner.guard.active,
                mode: this.spawner.guard.mode,
                warningX: this.spawner.guard.warningX,
                warningTime: this.spawner.guard.warningTime,
                windup: this.spawner.guard.windup,
                summons: this.spawner.guard.summons
              },
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
                  windup: e.windup
                };
              })
            };
          }
        }, {
          key: "objectHit",
          value: function objectHit(o, destroyed) {
            this.particles.burst(o.x + o.w / 2, o.y + o.h / 2, destroyed ? 16 : 5, o.kind === "wood" || o.kind === "hanging" ? "wood" : "spark");
            if (destroyed) {
              if (o.kind === "barrel") this.explosions.enqueue(o.x + o.w / 2, o.y + o.h / 2, 155, 7, "neutral");
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
            this.particles.burst(x, y, 20);
            this.shakeTime = 0.22;
            this.shakePower = 5;
            this.hitStop = 0.045;
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
              var _iterator5 = _createForOfIteratorHelper(this.spawner.enemies),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var e = _step5.value;
                  if (hit(e, damage * (damage >= 9 && (e.kind === "guard" || e.kind === "turret") ? 1.5 : 1))) {
                    e.vx = (e.x > x ? 1 : -1) * 250;
                    e.vy = 380;
                    e.grounded = false;
                  }
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
            }
            var _iterator6 = _createForOfIteratorHelper(this.level.objects.objects),
              _step6;
            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                var o = _step6.value;
                hit(o, damage);
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
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

System.register("chunks:///_virtual/GrenadeSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts'], function (exports) {
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
                  explosions.enqueue(g.x, g.y, GameConfig.grenade.radius, GameConfig.grenade.damage, "player");
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
                    if (g.x + 5 > r.x && g.x - 5 < r.x + r.w && oldY - 5 >= r.y + r.h && g.y - 5 <= r.y + r.h) {
                      g.y = r.y + r.h + 5;
                      g.vy = Math.abs(g.vy) * 0.3;
                      g.vx *= 0.65;
                    } else if (g.y + 5 > r.y && g.y - 5 < r.y + r.h && (oldX + 5 <= r.x && g.x + 5 >= r.x || oldX - 5 >= r.x + r.w && g.x - 5 <= r.x + r.w)) {
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

System.register("chunks:///_virtual/HUDController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Ink.ts', './StickmanRenderer.ts', './JoystickView.ts', './ControlLayout.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _slicedToArray, cclegacy, Color, Label, Node, GameConfig, node, Ink, colors, StickmanRenderer, JoystickView, controlLayout;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
      _slicedToArray = module.slicedToArray;
    }, function (module) {
      cclegacy = module.cclegacy;
      Color = module.Color;
      Label = module.Label;
      Node = module.Node;
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
      function button(parent, title, x, y, w, h, onClick) {
        var dark = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : false;
        var n = node(parent, title, x, y, w, h),
          ink = new Ink(n);
        ink.rect(-w / 2, -h / 2, w, h, colors.ink, dark ? colors.ink : colors.paper, 2);
        text(n, title, 0, 0, 22, dark ? colors.paper : colors.ink, w - 12);
        n.on(Node.EventType.TOUCH_START, function (e) {
          e.propagationStopped = true;
        });
        n.on(Node.EventType.TOUCH_END, function (e) {
          e.propagationStopped = true;
          onClick();
        });
        return n;
      }

      /** Persistent UI nodes; panels toggle instead of being recreated every frame/restart. */
      var HUDController = exports('HUDController', /*#__PURE__*/function () {
        function HUDController(parent, adapter, onStart, onPause, onResume, onHome) {
          var _this = this;
          var onMute = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : function () {};
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
          _defineProperty(this, "joystick", void 0);
          _defineProperty(this, "weaponLabel", void 0);
          _defineProperty(this, "message", void 0);
          _defineProperty(this, "layout", controlLayout());
          _defineProperty(this, "pauseButton", void 0);
          this.hud = node(parent, "HUD");
          this.hudInk = new Ink(this.hud);
          text(this.hud, "线条突围", 92, 687, 23, colors.ink, 160);
          text(this.hud, "生命", 220, 686, 14, colors.muted, 80);
          text(this.hud, "废弃前哨站", 1050, 689, 22, colors.ink, 185);
          this.pauseButton = button(this.hud, "Ⅱ", 1204, 686, 54, 44, onPause);
          this.objective = text(this.hud, "向右推进 · 击败出口守卫", 982, 620, 16, colors.muted, 480);
          this.stats = text(this.hud, "", 112, 620, 15, colors.muted, 170);
          this.weaponLabel = text(this.hud, "", 680, 686, 17, colors.ink, 450);
          this.message = text(parent, "", 640, 560, 22, colors.ink, 750);
          this.guardNode = node(parent, "Guard health");
          this.guardInk = new Ink(this.guardNode);
          this.guardLabel = text(this.guardNode, "出口守卫", 640, 595, 17, colors.ink, 350);
          this.controls = node(parent, "Touch controls");
          this.joystick = new JoystickView(this.controls, adapter);
          var touch = function touch(action, x, y, r) {
            var n = node(_this.controls, "Touch:".concat(action), x, y, r * 2 + 12, r * 2 + 12),
              ink = new Ink(n);
            adapter.bindButton(n, action);
            _this.touchButtons.push({
              action: action,
              ink: ink,
              held: false
            });
            _this.paintTouch(ink, action, false);
          };
          touch("jump", 1034, 170, 48);
          touch("shoot", 1162, 100, 58);
          touch("grenade", 934, 92, 38);
          text(this.controls, "拖动移动 · 下蹲 / 上瞄", 160, 15, 12, colors.muted, 280);
          text(this.controls, "按住高跳", 1034, 111, 12, colors.muted, 100);
          text(this.controls, "按住 J", 1162, 25, 12, colors.muted, 100);
          text(this.controls, "手雷 K", 934, 42, 12, colors.muted, 100);
          var panel = function panel(state) {
            var n = node(parent, "Panel:".concat(state), 640, 360, GameConfig.width, GameConfig.height),
              ink = new Ink(n);
            ink.rect(-640, -360, 1280, 720, new Color(250, 249, 245, 236), new Color(250, 249, 245, 236), 1);
            n.on(Node.EventType.TOUCH_START, function (e) {
              e.propagationStopped = true;
            });
            n.active = false;
            _this.panels.set(state, n);
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
          text(title, "A D 移动   ·   Space 跳跃   ·   按住 J 射击", 120, -204, 17, colors.muted, 760);
          text(title, "P / Esc 暂停   ·   手机支持多点触控   ·   Enter 开始", 120, -239, 14, colors.muted, 760);
          text(title, "V0.2  /  墨线行动", -368, -270, 13, colors.muted, 390);
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
          this.rotateNote = node(parent, "Rotate device hint");
          var hintInk = new Ink(this.rotateNote);
          hintInk.rect(320, 480, 640, 50, colors.ink, colors.paper, 1);
          text(this.rotateNote, "横屏体验更好，请旋转设备", 640, 505, 21);
        }
        _createClass(HUDController, [{
          key: "paintTouch",
          value: function paintTouch(ink, action, held) {
            ink.clear();
            var radius = action === "shoot" ? 57 : action === "grenade" ? 35 : 47,
              color = held ? colors.paper : new Color(24, 24, 24, 170);
            ink.circle(0, 0, radius, new Color(24, 24, 24, 140), held ? new Color(24, 24, 24, 210) : new Color(250, 249, 245, 205), 2);
            if (action === "grenade") {
              ink.circle(0, -3, 12, color, undefined, 3);
              ink.line([{
                x: -4,
                y: 9
              }, {
                x: -4,
                y: 17
              }, {
                x: 5,
                y: 17
              }, {
                x: 5,
                y: 9
              }], 2, color);
              ink.line([{
                x: 5,
                y: 16
              }, {
                x: 14,
                y: 22
              }], 2, color);
            } else if (action === "left" || action === "right") {
              var d = action === "left" ? -1 : 1;
              ink.line([{
                x: -13 * d,
                y: 0
              }, {
                x: 13 * d,
                y: 0
              }, {
                x: 2 * d,
                y: 11
              }], 3, color);
              ink.line([{
                x: 13 * d,
                y: 0
              }, {
                x: 2 * d,
                y: -11
              }], 3, color);
            } else if (action === "jump") {
              ink.line([{
                x: 0,
                y: -14
              }, {
                x: 0,
                y: 14
              }, {
                x: -12,
                y: 2
              }], 3, color);
              ink.line([{
                x: 0,
                y: 14
              }, {
                x: 12,
                y: 2
              }], 3, color);
            } else {
              ink.circle(0, 0, 14, color, undefined, 2.5);
              ink.line([{
                x: -23,
                y: 0
              }, {
                x: -10,
                y: 0
              }], 2, color);
              ink.line([{
                x: 10,
                y: 0
              }, {
                x: 23,
                y: 0
              }], 2, color);
              ink.line([{
                x: 0,
                y: -23
              }, {
                x: 0,
                y: -10
              }], 2, color);
              ink.line([{
                x: 0,
                y: 10
              }, {
                x: 0,
                y: 23
              }], 2, color);
            }
          }
        }, {
          key: "applyInsets",
          value: function applyInsets(insets) {
            this.layout = controlLayout(insets);
            this.joystick.node.setPosition(this.layout.joystick.x, this.layout.joystick.y);
            var _iterator2 = _createForOfIteratorHelper(this.touchButtons),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var b = _step2.value;
                var p = b.action === "jump" ? this.layout.jump : b.action === "shoot" ? this.layout.shoot : this.layout.grenade;
                b.ink.node.setPosition(p.x, p.y);
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            this.pauseButton.setPosition(this.layout.pause.x, this.layout.pause.y);
          }
        }, {
          key: "update",
          value: function update(s, input, portrait) {
            var _zone$name;
            this.hud.active = s.state === "playing" || s.state === "dying" || s.state === "paused";
            this.controls.active = s.state === "playing";
            this.weaponLabel.string = "".concat(s.weapon.id === "rifle" ? "自动步枪" : s.weapon.id === "shotgun" ? "霰弹枪" : "火箭筒", "  ").concat(s.weapon.ammo < 0 ? "∞" : s.weapon.ammo, "   \xB7   \u624B\u96F7 ").concat(s.player.grenades);
            this.message.node.active = s.state === "playing" && (s.pickups.messageTime > 0 || s.combo > 1);
            this.message.string = s.pickups.messageTime > 0 ? s.pickups.lastMessage : "COMBO \xD7 ".concat(s.combo);
            this.joystick.update(input);
            this.rotateNote.active = portrait;
            this.guardNode.active = s.state === "playing" && s.level.arenaEntered && s.spawner.guard.alive;
            if (this.guardNode.active) {
              this.guardInk.clear();
              this.guardInk.rect(470, 569, 340, 5, colors.muted, colors.paper, 1);
              this.guardInk.rect(470, 569, 340 * s.spawner.guard.health / s.spawner.guard.maxHealth, 5, colors.ink, colors.ink, 1);
              this.guardLabel.string = "\u5C65\u5E26\u6218\u8F66 \xB7 \u9636\u6BB5 ".concat(s.spawner.guard.phase, "  ").concat(Math.ceil(s.spawner.guard.health), " / ").concat(s.spawner.guard.maxHealth);
            }
            if (this.lastState !== s.state) {
              var _iterator3 = _createForOfIteratorHelper(this.panels),
                _step3;
              try {
                for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                  var _step3$value = _slicedToArray(_step3.value, 2),
                    state = _step3$value[0],
                    p = _step3$value[1];
                  p.active = state === s.state;
                }
              } catch (err) {
                _iterator3.e(err);
              } finally {
                _iterator3.f();
              }
              this.lastState = s.state;
            }
            var progress = Math.floor(s.player.x / s.level.data.width * 1280);
            if (this.lastHealth !== s.player.health || this.progress !== progress) {
              this.hudInk.clear();
              this.hudInk.rect(0, 654, 1280, 66, colors.far, colors.paper, 1);
              this.hudInk.line([{
                x: 180,
                y: 675
              }, {
                x: 180,
                y: 700
              }], 1, colors.far);
              for (var i = 0; i < GameConfig.player.maxHealth; i++) {
                var x = 270 + i * 33,
                  y = 683;
                var points = [{
                  x: x - 9,
                  y: y + 3
                }, {
                  x: x - 9,
                  y: y + 9
                }, {
                  x: x - 5,
                  y: y + 12
                }, {
                  x: x,
                  y: y + 7
                }, {
                  x: x + 5,
                  y: y + 12
                }, {
                  x: x + 9,
                  y: y + 9
                }, {
                  x: x + 9,
                  y: y + 3
                }, {
                  x: x,
                  y: y - 7
                }, {
                  x: x - 9,
                  y: y + 3
                }];
                if (i < s.player.health) this.hudInk.polygon(points);
                this.hudInk.line(points, 2, i < s.player.health ? colors.ink : colors.far);
              }
              this.hudInk.line([{
                x: 0,
                y: 654
              }, {
                x: progress,
                y: 654
              }], 2, colors.ink);
              this.lastHealth = s.player.health;
              this.progress = progress;
            }
            var zone = s.level.zone;
            var remaining = 0;
            var _iterator4 = _createForOfIteratorHelper(s.spawner.enemies),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var e = _step4.value;
                if (e.alive && zone && e.spawn.x >= zone.start && e.spawn.x < zone.end) remaining++;
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
            this.objective.string = s.level.guardDefeated ? "战车已击毁 · 抵达出口 →" : s.level.arenaEntered ? "躲开落点预警 · 击毁机械战车" : "".concat((_zone$name = zone === null || zone === void 0 ? void 0 : zone.name) !== null && _zone$name !== void 0 ? _zone$name : "向右推进", " \xB7 ").concat(remaining, " \u540D\u654C\u4EBA \xB7 \u6E05\u654C\u89E3\u9664\u5C01\u9501");
            this.stats.string = "\u51FB\u8D25  ".concat(s.spawner.kills, " / ").concat(s.spawner.enemies.length);
            var _iterator5 = _createForOfIteratorHelper(this.resultStats),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var stat = _step5.value;
                stat.string = "\u8017\u65F6 ".concat(Math.floor(s.time), " \u79D2    \xB7    \u51FB\u8D25 ").concat(s.spawner.kills, " \u540D\u654C\u4EBA");
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
            var _iterator6 = _createForOfIteratorHelper(this.touchButtons),
              _step6;
            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                var b = _step6.value;
                var held = input.isHeld(b.action);
                if (held !== b.held) {
                  b.ink.node.setScale(held ? 0.94 : 1, held ? 0.94 : 1, 1);
                  this.paintTouch(b.ink, b.action, held);
                  b.held = held;
                }
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
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
            this.g.lineWidth = width;
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
            this.g.lineWidth = width;
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
            this.g.lineWidth = width;
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
            this.g.lineWidth = width;
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
            this.g.lineWidth = width;
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
            frame.shoot = this.isHeld("shoot");
            frame.jumpHeld = this.isHeld("jump");
            frame.crouch = this.isHeld("crouch") || this.joystick.vertical < GameConfig.input.crouchThreshold;
            frame.aimY = this.isHeld("aimUp") || this.joystick.vertical > GameConfig.input.aimThreshold ? 1 : 0;
            frame.grenade = this.grenadeQueued;
            this.jumpQueued = false;
            this.grenadeQueued = false;
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
            this.held.clear();
            this.jumpQueued = false;
            this.pauseQueued = false;
            this.grenadeQueued = false;
            this.joystick.reset();
          }
        }]);
        return InputManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/JoystickView.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, Color, node, Ink, colors;
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
          this.node = node(parent, "Virtual joystick", 140, 105, 190, 190);
          this.ink = new Ink(this.node);
          adapter.bindJoystick(this.node);
        }
        _createClass(JoystickView, [{
          key: "update",
          value: function update(input) {
            var s = input.joystick,
              active = s.owner !== null;
            if (s.x === this.lastX && s.y === this.lastY && active === this.active) return;
            this.lastX = s.x;
            this.lastY = s.y;
            this.active = active;
            this.ink.clear();
            this.ink.circle(0, 0, 72, new Color(25, 25, 25, 130), new Color(250, 249, 245, 165), 2);
            this.ink.circle(0, 0, 61, new Color(25, 25, 25, 75), undefined, 1);
            this.ink.line([{
              x: -44,
              y: 0
            }, {
              x: 44,
              y: 0
            }], 1, new Color(25, 25, 25, 45));
            this.ink.line([{
              x: 0,
              y: -44
            }, {
              x: 0,
              y: 44
            }], 1, new Color(25, 25, 25, 45));
            this.ink.circle(s.x, s.y, 27, colors.ink, active ? new Color(35, 35, 35, 200) : new Color(250, 249, 245, 225), 2.5);
            this.ink.circle(s.x, s.y, 20, active ? colors.paper : colors.far, undefined, 1);
          }
        }]);
        return JoystickView;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './LevelData.ts', './DestructibleManager.ts', './MechanismController.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _objectSpread2, cclegacy, AbandonedBase, DestructibleManager, MechanismController;
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
          _defineProperty(this, "barriers", []);
          this.data = data;
          this.reset();
        }
        _createClass(LevelController, [{
          key: "reset",
          value: function reset() {
            var _this$data$mechanisms, _this$data$zones;
            this.guardDefeated = false;
            this.arenaEntered = false;
            this.clearedZones.clear();
            this.mechanisms = ((_this$data$mechanisms = this.data.mechanisms) !== null && _this$data$mechanisms !== void 0 ? _this$data$mechanisms : []).map(function (d) {
              return new MechanismController(d);
            });
            this.barriers = ((_this$data$zones = this.data.zones) !== null && _this$data$zones !== void 0 ? _this$data$zones : []).filter(function (z) {
              return z.id !== "D";
            }).map(function (z) {
              return {
                x: z.end,
                y: 150,
                w: 12,
                h: 380,
                kind: "step",
                entityId: "gate:".concat(z.id)
              };
            });
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
            var _iterator5 = _createForOfIteratorHelper(this.barriers),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var b = _step5.value;
                if (!this.clearedZones.has(b.entityId.slice(5))) this.solids.push(b);
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
          }
        }, {
          key: "updateWorld",
          value: function updateWorld(dt, p, enemies) {
            var _this = this,
              _this$data$zones2;
            var changed = false;
            var _iterator6 = _createForOfIteratorHelper(this.mechanisms),
              _step6;
            try {
              var _loop = function _loop() {
                var _this$objects$objects;
                var m = _step6.value;
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
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                _loop();
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }
            var _iterator7 = _createForOfIteratorHelper((_this$data$zones2 = this.data.zones) !== null && _this$data$zones2 !== void 0 ? _this$data$zones2 : []),
              _step7;
            try {
              var _loop2 = function _loop2() {
                var z = _step7.value;
                if (z.id === "D" || _this.clearedZones.has(z.id)) return 1; // continue
                if (!enemies.some(function (e) {
                  return e.alive && e.spawn.x >= z.start && e.spawn.x < z.end;
                })) {
                  _this.clearedZones.add(z.id);
                  changed = true;
                }
              };
              for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                if (_loop2()) continue;
              }
            } catch (err) {
              _iterator7.e(err);
            } finally {
              _iterator7.f();
            }
            if (this.data.arena && p.x >= this.data.arena.start + 70) this.arenaEntered = true;
            if (changed) {
              this.objectRevision = -1;
              this.refreshSolids();
            }
          }
        }, {
          key: "zone",
          get: function get() {
            var _find,
              _this$data$zones3,
              _this2 = this;
            return (_find = ((_this$data$zones3 = this.data.zones) !== null && _this$data$zones3 !== void 0 ? _this$data$zones3 : []).find(function (z) {
              return !_this2.clearedZones.has(z.id);
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
            body.x += dx;
            var _iterator8 = _createForOfIteratorHelper(this.solids),
              _step8;
            try {
              for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                var s = _step8.value;
                if (s.oneWay) continue;
                if (body.y >= s.y + s.h - 0.01 || body.y + body.height <= s.y + 0.01) continue;
                if (dx > 0 && oldX + body.halfWidth <= s.x + 0.01 && body.x + body.halfWidth >= s.x) {
                  body.x = Math.min(body.x, s.x - body.halfWidth);
                  body.vx = 0;
                } else if (dx < 0 && oldX - body.halfWidth >= s.x + s.w - 0.01 && body.x - body.halfWidth <= s.x + s.w) {
                  body.x = Math.max(body.x, s.x + s.w + body.halfWidth);
                  body.vx = 0;
                }
              }
            } catch (err) {
              _iterator8.e(err);
            } finally {
              _iterator8.f();
            }
            var oldY = body.y,
              dy = body.vy * dt;
            body.y += dy;
            body.grounded = false;
            var _iterator9 = _createForOfIteratorHelper(this.solids),
              _step9;
            try {
              for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                var _s = _step9.value;
                if (body.x + body.halfWidth <= _s.x || body.x - body.halfWidth >= _s.x + _s.w) continue;
                var top = _s.y + _s.h;
                if (dy <= 0 && oldY >= top - 0.01 && body.y <= top) {
                  body.y = Math.max(body.y, top);
                  body.vy = 0;
                  body.grounded = true;
                } else if (!_s.oneWay && dy > 0 && oldY + body.height <= _s.y + 0.01 && body.y + body.height >= _s.y) {
                  body.y = Math.min(body.y, _s.y - body.height);
                  body.vy = 0;
                }
              }
            } catch (err) {
              _iterator9.e(err);
            } finally {
              _iterator9.f();
            }
            body.x = Math.max(body.halfWidth, Math.min(this.data.width - body.halfWidth, body.x));
            if (this.arenaEntered && this.data.arena && "isPlayer" in body) body.x = Math.max(this.data.arena.start + 30, Math.min(this.data.arena.end - 30, body.x));
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

System.register("chunks:///_virtual/LevelData.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
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
        solids: [{
          x: 0,
          y: 50,
          w: 8200,
          h: 100,
          kind: "ground"
        }, {
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
        }, {
          x: 3300,
          y: 248,
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
        }],
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
          id: "gate-guard",
          kind: "guard",
          x: 7840,
          y: 150,
          patrol: 0
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
          name: "战车决战",
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
        x: 3480,
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
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts', './SceneryArt.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Label, node, Ink, colors, SceneryArt;
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
      node = module.node;
      Ink = module.Ink;
      colors = module.colors;
    }, function (module) {
      SceneryArt = module.SceneryArt;
    }],
    execute: function () {
      cclegacy._RF.push({}, "ce266XwPE5kjMxHJkBriZYn", "LevelRenderer", undefined);
      var LevelRenderer = exports('LevelRenderer', /*#__PURE__*/function () {
        function LevelRenderer(parent, level) {
          _classCallCheck(this, LevelRenderer);
          _defineProperty(this, "chunks", []);
          _defineProperty(this, "gate", void 0);
          _defineProperty(this, "visibleChunks", 0);
          _defineProperty(this, "exitX", 0);
          for (var _i = 0, _arr = [0.16, 0.42, 1]; _i < _arr.length; _i++) {
            var factor = _arr[_i];
            for (var x = -800; x < level.data.width + 1600; x += 800) {
              var n = node(parent, "Scenery ".concat(factor, "/").concat(x), x, 0, 820, 650),
                g = new Ink(n),
                index = Math.floor(x / 800);
              this.chunks.push({
                node: n,
                x: x,
                factor: factor
              });
              if (factor === 0.16) {
                for (var i = 0; i < 3; i++) SceneryArt.cloud(g, 30 + i * 260, 490 + (index + i + 9) % 3 * 47, 0.8 + (index + i + 8) % 2 * 0.3);
                g.line([{
                  x: -10,
                  y: 240
                }, {
                  x: 70,
                  y: 333
                }, {
                  x: 140,
                  y: 291
                }, {
                  x: 260,
                  y: 403
                }, {
                  x: 380,
                  y: 290
                }, {
                  x: 470,
                  y: 350
                }, {
                  x: 580,
                  y: 303
                }, {
                  x: 700,
                  y: 377
                }, {
                  x: 810,
                  y: 240
                }], 1.5, colors.far);
                for (var _i2 = 0; _i2 < 2; _i2++) {
                  var bx = 170 + _i2 * 340;
                  g.rect(bx, 150, 190, 160 + _i2 * 40, colors.far, undefined, 1);
                  for (var wy = 185; wy < 290; wy += 37) for (var wx = bx + 18; wx < bx + 176; wx += 40) g.rect(wx, wy, 16, 22, colors.far, undefined, 1);
                }
                SceneryArt.truck(g, 590, 158);
              } else if (factor === 0.42) {
                if ((index + 9) % 3 === 0) SceneryArt.bunker(g, 180, 150, 300);else if ((index + 9) % 3 === 1) SceneryArt.factory(g, 120, 150);else SceneryArt.crane(g, 300, 150);
                SceneryArt.tower(g, 690, 150);
                g.segment(24, 150, 24, 390, 2, colors.muted);
                g.segment(6, 363, 46, 363, 2, colors.muted);
                g.line([{
                  x: 24,
                  y: 377
                }, {
                  x: 165,
                  y: 346
                }, {
                  x: 315,
                  y: 328
                }, {
                  x: 490,
                  y: 345
                }, {
                  x: 700,
                  y: 377
                }], 1, colors.muted);
                for (var px = 25; px < 770; px += 80) {
                  g.segment(px, 150, px, 212, 1.2, colors.far);
                  g.segment(px, 195, px + 80, 195, 1, colors.far);
                }
              } else {
                var _iterator = _createForOfIteratorHelper(level.staticSolids),
                  _step;
                try {
                  for (_iterator.s(); !(_step = _iterator.n()).done;) {
                    var s = _step.value;
                    if (s.x + s.w <= x || s.x >= x + 800) continue;
                    var left = Math.max(s.x, x) - x,
                      right = Math.min(s.x + s.w, x + 800) - x;
                    if (s.kind === "ground") {
                      g.g.fillColor = colors.paper;
                      g.g.rect(left, s.y, right - left, s.h);
                      g.g.fill();
                      for (var _px2 = left; _px2 < right; _px2 += 32) g.segment(_px2, s.y + s.h + Math.sin((x + _px2) * 0.15) * 0.65, Math.min(right, _px2 + 32), s.y + s.h + Math.sin((x + _px2 + 32) * 0.15) * 0.65, 3);
                      g.segment(left, 50, right, 50, 2);
                      for (var _px3 = left + 12; _px3 < right; _px3 += 63) {
                        g.line([{
                          x: _px3,
                          y: 132
                        }, {
                          x: _px3 + 10,
                          y: 126
                        }, {
                          x: _px3 + 26,
                          y: 130
                        }], 1, colors.muted);
                        g.ellipse(_px3 + 30, 145, 5, 2, colors.muted, undefined, 1);
                      }
                    } else {
                      g.rect(left, s.y, right - left, s.h, colors.ink, colors.paper, 3);
                      g.segment(left, s.y + s.h - 5, right, s.y + s.h - 5, 1, colors.muted);
                      for (var _px4 = left + 10; _px4 < right - 6; _px4 += 30) {
                        g.circle(_px4, s.y + Math.min(s.h / 2, 9), 1.8, colors.ink, colors.ink, 1);
                      }
                      if (s.kind === "platform") for (var _i3 = 0, _arr2 = [s.x + 12, s.x + s.w - 12]; _i3 < _arr2.length; _i3++) {
                        var _wx = _arr2[_i3];
                        if (_wx >= x && _wx < x + 800) {
                          g.segment(_wx - x, 150, _wx - x, s.y, 2, colors.muted);
                          for (var h = 160; h < s.y - 20; h += 25) g.segment(_wx - x - 6, h, _wx - x + 6, h + 20, 1, colors.muted);
                        }
                      }
                    }
                  }
                } catch (err) {
                  _iterator.e(err);
                } finally {
                  _iterator.f();
                }
                for (var _px = 80; _px < 790; _px += 220) {
                  g.ellipse(_px, 137, 9, 4, colors.muted, undefined, 1.5);
                  g.segment(_px - 20, 119, _px - 13, 117, 1.2, colors.muted);
                  g.segment(_px + 35, 126, _px + 39, 128, 1.2, colors.muted);
                }
                if (index === 0) {
                  this.label(n, "废弃前哨站 / SECTOR 01", 250, 423, 19);
                  g.rect(102, 354, 170, 45, colors.ink, colors.paper, 2);
                  this.label(n, "注意：可破坏补给箱", 188, 376, 14);
                  g.segment(115, 150, 115, 354, 3, colors.muted);
                  g.segment(261, 150, 261, 354, 3, colors.muted);
                }
              }
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
            this.visibleChunks = 0;
            var _iterator2 = _createForOfIteratorHelper(this.chunks),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var c = _step2.value;
                var _px5 = c.x - cameraX * c.factor;
                c.node.setPosition(_px5, 0);
                c.node.active = _px5 < 1350 && _px5 + 820 > -70;
                if (c.node.active) this.visibleChunks++;
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            this.gate.node.setPosition(-cameraX, 0);
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

System.register("chunks:///_virtual/main", ['./GameManager.ts', './CameraFollow.ts', './ExplosionSystem.ts', './GrenadeSystem.ts', './ParticlePool.ts', './ProjectileManager.ts', './WeaponSystem.ts', './GameConfig.ts', './GameSession.ts', './InputManager.ts', './Types.ts', './VirtualJoystick.ts', './EnemyController.ts', './EnemySpawner.ts', './TankBoss.ts', './LevelController.ts', './LevelData.ts', './MechanismController.ts', './AudioBridge.ts', './CocosInputAdapter.ts', './PlatformBridge.ts', './PlayerController.ts', './CharacterArt.ts', './CombatRenderer.ts', './Ink.ts', './LevelRenderer.ts', './MechanicalEnemyArt.ts', './ObjectRenderer.ts', './SceneryArt.ts', './StickmanAnimator.ts', './StickmanRenderer.ts', './ControlLayout.ts', './HUDController.ts', './JoystickView.ts', './DestructibleManager.ts', './DestructibleObject.ts', './PickupSystem.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
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

System.register("chunks:///_virtual/ObjectRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Label, Color, Ink, node, colors;
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
    }],
    execute: function () {
      cclegacy._RF.push({}, "03284mwF1ud5d3gbnrdZfUz", "ObjectRenderer", undefined);
      var ObjectRenderer = exports('ObjectRenderer', /*#__PURE__*/function () {
        function ObjectRenderer(parent) {
          _classCallCheck(this, ObjectRenderer);
          _defineProperty(this, "ink", void 0);
          _defineProperty(this, "labels", []);
          this.ink = new Ink(node(parent, "Destructibles and pickups"));
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
            var _s$level$data$zones;
            var ink = this.ink,
              cam = s.camera.x;
            ink.clear();
            var _iterator = _createForOfIteratorHelper(s.level.objects.objects),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var o = _step.value;
                if (o.x + o.w < cam - 50 || o.x > cam + 1330) continue;
                var _x = o.x - cam,
                  _y = o.y,
                  w = o.w,
                  h = o.h;
                if (!o.alive) {
                  if (o.deadTime < 0.55) {
                    for (var n = 0; n < 5; n++) {
                      var dx = _x + w / 2 + (n - 2) * o.deadTime * 75,
                        dy = _y + 18 + Math.sin(n * 2) * o.deadTime * 70 - o.deadTime * o.deadTime * 170;
                      ink.line([{
                        x: dx,
                        y: dy
                      }, {
                        x: dx + 10,
                        y: dy + 5
                      }], 2, colors.muted);
                    }
                  }
                  continue;
                }
                var shade = o.hitTime > 0 ? new Color(185, 185, 180) : colors.paper;
                if (o.kind === "rope") {
                  ink.segment(_x + w / 2, _y, _x + w / 2, _y + h, 3);
                  for (var t = _y; t < _y + h; t += 9) ink.segment(_x + w / 2 - 3, t, _x + w / 2 + 3, t + 5, 1, colors.muted);
                } else if (o.kind === "barrel") {
                  ink.rect(_x, _y, w, h, colors.ink, shade, 2.5);
                  ink.line([{
                    x: _x + 3,
                    y: _y + 12
                  }, {
                    x: _x + w - 3,
                    y: _y + 12
                  }], 3);
                  ink.line([{
                    x: _x + 3,
                    y: _y + h - 12
                  }, {
                    x: _x + w - 3,
                    y: _y + h - 12
                  }], 3);
                  ink.circle(_x + w / 2, _y + h / 2, 8, colors.ink, undefined, 2);
                  ink.line([{
                    x: _x + w / 2 - 4,
                    y: _y + h / 2 + 4
                  }, {
                    x: _x + w / 2 + 4,
                    y: _y + h / 2 - 4
                  }], 2);
                  ink.rect(_x + 5, _y + h - 4, 8, 4, colors.ink, colors.paper, 1);
                } else if (o.kind === "sandbag") {
                  for (var row = 0; row < 3; row++) for (var _n = 0; _n < 3; _n++) {
                    var bx = _x + _n * w / 3 + (row % 2 ? 5 : 0);
                    ink.rect(bx, _y + row * h / 3, w / 3 - 3, h / 3 - 2, colors.ink, shade, 2);
                    ink.line([{
                      x: bx + 5,
                      y: _y + row * h / 3 + 4
                    }, {
                      x: bx + 12,
                      y: _y + row * h / 3 + 6
                    }], 1, colors.muted);
                  }
                } else {
                  ink.rect(_x, _y, w, h, colors.ink, shade, o.category === "indestructible" ? 5 : 2.5);
                  ink.rect(_x + 5, _y + 5, w - 10, h - 10, colors.muted, undefined, 1);
                  if (o.kind === "steel" || o.kind === "concrete") {
                    for (var _i = 0, _arr = [8, w - 8]; _i < _arr.length; _i++) {
                      var a = _arr[_i];
                      for (var _i2 = 0, _arr2 = [8, h - 8]; _i2 < _arr2.length; _i2++) {
                        var b = _arr2[_i2];
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
                    ink.line([{
                      x: _x + 6,
                      y: _y + 6
                    }, {
                      x: _x + w - 6,
                      y: _y + h - 6
                    }], 2);
                    ink.line([{
                      x: _x + 6,
                      y: _y + h - 6
                    }, {
                      x: _x + w - 6,
                      y: _y + 6
                    }], 2);
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
                if (_x2 + r.w < 0 || _x2 > 1280) continue;
                ink.rect(_x2, r.y, r.w, r.h, colors.ink, colors.paper, 3);
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
            var _iterator3 = _createForOfIteratorHelper((_s$level$data$zones = s.level.data.zones) !== null && _s$level$data$zones !== void 0 ? _s$level$data$zones : []),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var z = _step3.value;
                if (z.id === "D" || s.level.clearedZones.has(z.id)) continue;
                var _x3 = z.end - cam;
                if (_x3 < 0 || _x3 > 1280) continue;
                ink.segment(_x3, 150, _x3, 530, 4);
                ink.rect(_x3 - 10, 510, 32, 28, colors.ink, colors.paper, 3);
                ink.circle(_x3 + 6, 524, 5, colors.ink, colors.ink, 1);
                for (var _y2 = 164; _y2 < 510; _y2 += 30) ink.segment(_x3 - 4, _y2, _x3 + 8, _y2 + 17, 2, colors.muted);
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            for (var i = 0; i < s.pickups.items.length; i++) {
              var p = s.pickups.items[i],
                l = this.labels[i],
                visible = p.active && p.x > cam - 30 && p.x < cam + 1310;
              l.node.active = visible;
              if (!visible) continue;
              var x = p.x - cam,
                y = p.y + Math.sin(p.age * 5) * 3;
              ink.circle(x, y, 18, colors.ink, colors.paper, 2);
              ink.circle(x, y, 23, colors.far, undefined, 1);
              l.node.setPosition(x, y);
              l.string = p.kind === "health" ? "+" : p.kind === "grenades" ? "G" : p.kind === "shotgun" ? "S" : p.kind === "rocket" ? "R" : "A";
            }
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
                life: 0.18 + this.random() * 0.2,
                size: 1 + this.random() * 2,
                kind: kind,
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
              life: life,
              maxLife: life,
              size: kind === "smoke" ? 7 : kind === "dust" ? 4 : 2,
              gravity: kind === "smoke" ? -25 : 650,
              spin: this.random() * 6
            });
            this.peak = Math.max(this.peak, this.items.reduce(function (n, p) {
              return n + Number(p.active);
            }, 0));
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

System.register("chunks:///_virtual/PickupSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts'], function (exports) {
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
                p.age += dt;
                var oldY = p.y;
                p.vy -= 600 * dt;
                p.y += p.vy * dt;
                var _iterator3 = _createForOfIteratorHelper(solids),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var s = _step3.value;
                    if (p.x > s.x - 8 && p.x < s.x + s.w + 8 && oldY - 10 >= s.y + s.h && p.y - 10 <= s.y + s.h) {
                      p.y = s.y + s.h + 10;
                      p.vy = 0;
                    }
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
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
                  weapon.equip(p.kind);
                  player.weaponId = p.kind;
                  this.lastMessage = p.kind === "shotgun" ? "拾取霰弹枪 · 近距离爆发" : p.kind === "rocket" ? "拾取火箭筒 · 范围爆炸" : "拾取自动步枪";
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

System.register("chunks:///_virtual/PlatformBridge.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, view, sys, game, Game;
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
    }],
    execute: function () {
      cclegacy._RF.push({}, "d600bzHuylURQg/PYNiQ6L5", "PlatformBridge", undefined);
      /** All platform integration stays here. No storage/ads/network needed for V0.1. */
      var PlatformBridge = exports('PlatformBridge', /*#__PURE__*/function () {
        function PlatformBridge() {
          _classCallCheck(this, PlatformBridge);
          _defineProperty(this, "onHide", void 0);
        }
        _createClass(PlatformBridge, [{
          key: "safeInsets",
          value: function safeInsets() {
            var frame = view.getFrameSize(),
              r = sys.getSafeAreaRect(false),
              scale = Math.min(frame.width / 1280, frame.height / 720);
            var mx = (frame.width - 1280 * scale) / 2,
              my = (frame.height - 720 * scale) / 2;
            return {
              left: Math.max(0, (r.x - mx) / scale),
              right: Math.max(0, (frame.width - r.x - r.width - mx) / scale),
              bottom: Math.max(0, (r.y - my) / scale),
              top: Math.max(0, (frame.height - r.y - r.height - my) / scale)
            };
          }
        }, {
          key: "install",
          value: function install(onHide, snapshot) {
            this.onHide = onHide;
            game.on(Game.EVENT_HIDE, onHide);
            globalThis.__BREAKOUT__ = {
              version: "0.2.0",
              snapshot: snapshot
            };
          }
        }, {
          key: "destroy",
          value: function destroy() {
            if (this.onHide) game.off(Game.EVENT_HIDE, this.onHide);
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
          _defineProperty(this, "weaponId", "rifle");
          _defineProperty(this, "facing", 1);
          _defineProperty(this, "invincible", 0);
          _defineProperty(this, "hitTime", 0);
          _defineProperty(this, "deadTime", 0);
          _defineProperty(this, "recoil", 0);
          _defineProperty(this, "animationTime", 0);
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
            if (this.landTime > 0.05) return "Land";
            if (Math.abs(this.vx) > 8) return "Run";
            return this.recoil > 0 ? "Shoot" : "Idle";
          }
        }, {
          key: "reset",
          value: function reset(x, y) {
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
            this.jumpCut = false;
            this.invincible = this.hitTime = this.deadTime = this.recoil = this.animationTime = this.coyote = this.buffer = 0;
          }
        }, {
          key: "update",
          value: function update(dt, input, level) {
            var _this = this;
            this.animationTime += dt;
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
                return overlaps({
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
              this.buffer = input.jump ? GameConfig.player.jumpBuffer : Math.max(0, this.buffer - dt);
              if (this.buffer > 0 && this.coyote > 0) {
                this.vy = GameConfig.player.jumpVelocity;
                this.grounded = false;
                this.coyote = 0;
                this.buffer = 0;
                this.jumpCut = false;
                this.crouched = false;
              }
              // Legacy simulation frames omit jumpHeld; real device frames always provide it.
              if (input.jumpHeld === false && !this.jumpCut && this.vy > 0) {
                this.vy *= GameConfig.player.jumpCut;
                this.jumpCut = true;
              }
            }
            this.vy -= GameConfig.player.gravity * dt;
            var wasGrounded = this.grounded;
            level.move(this, dt);
            if (!wasGrounded && this.grounded) this.landTime = 0.12;
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
              originY: 0
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
            var _s$pitch, _s$pitch2, _s$kind, _s$blastRadius, _s$knockback, _s$gravity, _s$originX, _s$originY;
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
              vx: s.direction * Math.cos((_s$pitch = s.pitch) !== null && _s$pitch !== void 0 ? _s$pitch : 0) * s.speed,
              vy: Math.sin((_s$pitch2 = s.pitch) !== null && _s$pitch2 !== void 0 ? _s$pitch2 : 0) * s.speed,
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
              originY: (_s$originY = s.originY) !== null && _s$originY !== void 0 ? _s$originY : s.y
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
                p.vy -= p.gravity * dt;
                if (p.kind === "rocket") {
                  p.smokeTime -= dt;
                  if (p.smokeTime <= 0) {
                    this.particles.emit(p.x, p.y, "smoke", -p.vx * 0.05, 20);
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
                  var t = segmentRect(start, end, candidate.bounds, p.kind === "cannon" ? 6 : p.kind === "rocket" ? 4 : 2);
                  if (t !== null && t < nearest) {
                    nearest = t;
                    _target = candidate;
                  }
                }
                if (nearest <= 1) {
                  p.x = start.x + (end.x - start.x) * nearest;
                  p.y = start.y + (end.y - start.y) * nearest;
                  p.active = false;
                  this.particles.burst(p.x, p.y, _target ? 9 : 4);
                  if (!_target || "category" in _target && _target.category === "indestructible") {
                    var m = this.marks[this.markCursor++ % this.marks.length];
                    m.active = true;
                    m.x = p.x;
                    m.y = p.y;
                  }
                  if (p.blastRadius > 0) {
                    var _this$onExplosion;
                    (_this$onExplosion = this.onExplosion) === null || _this$onExplosion === void 0 || _this$onExplosion.call(this, p.x, p.y, p.blastRadius, p.damage, p.owner);
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
        }]);
        return ProjectileManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/SceneryArt.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
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
      cclegacy._RF.push({}, "d4986IOojGJFuRRCYu743Ir", "SceneryArt", undefined);
      /** Purposeful industrial silhouettes. No randomly scattered decorative lines. */
      var SceneryArt = exports('SceneryArt', /*#__PURE__*/function () {
        function SceneryArt() {
          _classCallCheck(this, SceneryArt);
        }
        _createClass(SceneryArt, null, [{
          key: "cloud",
          value: function cloud(g, x, y) {
            var size = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
            var c = colors.far;
            g.line([{
              x: x,
              y: y
            }, {
              x: x + 18 * size,
              y: y
            }, {
              x: x + 23 * size,
              y: y + 7 * size
            }, {
              x: x + 38 * size,
              y: y + 9 * size
            }, {
              x: x + 43 * size,
              y: y + 18 * size
            }, {
              x: x + 63 * size,
              y: y + 20 * size
            }, {
              x: x + 77 * size,
              y: y + 9 * size
            }, {
              x: x + 98 * size,
              y: y + 7 * size
            }, {
              x: x + 109 * size,
              y: y
            }, {
              x: x + 126 * size,
              y: y
            }], 1.4, c);
          }
        }, {
          key: "tower",
          value: function tower(g, x, y) {
            var c = colors.muted;
            g.line([{
              x: x - 35,
              y: y
            }, {
              x: x - 18,
              y: y + 150
            }, {
              x: x,
              y: y + 210
            }, {
              x: x + 18,
              y: y + 150
            }, {
              x: x + 35,
              y: y
            }], 2, c);
            for (var h = 20; h < 165; h += 28) {
              var w = 34 - h * 0.13;
              g.segment(x - w, y + h, x + w, y + h, 1, c);
              g.segment(x - w, y + h, x + w - 4, y + h + 28, 1, c);
              g.segment(x + w, y + h, x - w + 4, y + h + 28, 1, c);
            }
            g.segment(x - 32, y + 160, x + 32, y + 160, 2, c);
            g.segment(x, y + 210, x, y + 250, 1.5, c);
            g.circle(x, y + 246, 3, c, undefined, 1);
            g.ellipse(x + 30, y + 155, 18, 8, c, undefined, 2);
            g.segment(x + 15, y + 147, x + 5, y + 130, 2, c);
          }
        }, {
          key: "bunker",
          value: function bunker(g, x, y) {
            var width = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 280;
            var c = colors.muted;
            g.rect(x, y, width, 152, c, colors.paper, 2);
            g.line([{
              x: x - 10,
              y: y + 152
            }, {
              x: x + 14,
              y: y + 167
            }, {
              x: x + width - 14,
              y: y + 167
            }, {
              x: x + width + 10,
              y: y + 152
            }], 2, c);
            g.rect(x + 20, y, 61, 92, c, undefined, 2);
            g.rect(x + 26, y + 7, 49, 78, c, undefined, 1);
            g.circle(x + 67, y + 44, 2, c, c, 1);
            for (var i = 0; i < 3; i++) {
              var wx = x + 105 + i * 51;
              g.rect(wx, y + 78, 37, 39, c, undefined, 1.5);
              g.segment(wx, y + 98, wx + 37, y + 98, 1, c);
              g.segment(wx + 18, y + 78, wx + 18, y + 117, 1, c);
            }
            g.rect(x + 100, y + 12, width - 119, 39, c, undefined, 1.5);
            for (var _i = 0; _i < 10; _i++) g.segment(x + 107 + _i * 15, y + 19, x + 107 + _i * 15, y + 44, 1, c);
            g.rect(x + 25, y + 174, 45, 23, c, undefined, 1.5);
            g.segment(x + 35, y + 197, x + 35, y + 245, 1.5, c);
            g.segment(x + 15, y + 229, x + 55, y + 229, 1.5, c);
          }
        }, {
          key: "factory",
          value: function factory(g, x, y) {
            var c = colors.muted;
            g.rect(x, y, 340, 244, c, colors.paper, 2);
            for (var n = 0; n < 3; n++) {
              var px = x + 36 + n * 82;
              g.rect(px, y + 90, 42, 125, c, undefined, 2);
              g.ellipse(px + 21, y + 215, 21, 8, c, colors.paper, 2);
              g.segment(px + 21, y + 224, px + 21, y + 278, 7, colors.far);
              g.segment(px + 21, y + 224, px + 21, y + 278, 1.5, c);
            }
            g.rect(x + 25, y + 14, 150, 52, c, undefined, 2);
            for (var _n = 0; _n < 8; _n++) g.segment(x + 38 + _n * 17, y + 25, x + 38 + _n * 17, y + 56, 1, c);
            g.rect(x + 246, y, 63, 126, c, undefined, 2);
            g.circle(x + 270, y + 88, 9, c, undefined, 1.5);
            g.segment(x + 271, y + 88, x + 276, y + 94, 1, c);
            g.line([{
              x: x + 17,
              y: y + 79
            }, {
              x: x - 28,
              y: y + 79
            }, {
              x: x - 28,
              y: y + 137
            }, {
              x: x - 67,
              y: y + 137
            }], 5, colors.far);
            g.line([{
              x: x + 17,
              y: y + 79
            }, {
              x: x - 28,
              y: y + 79
            }, {
              x: x - 28,
              y: y + 137
            }, {
              x: x - 67,
              y: y + 137
            }], 1.5, c);
            for (var _n2 = 0; _n2 < 6; _n2++) g.circle(x + 22 + _n2 * 56, y + 232, 2, c, c, 1);
            g.segment(x - 75, y + 137, x - 75, y + 7, 8, colors.far);
            g.segment(x - 75, y + 137, x - 75, y + 7, 1.5, c);
          }
        }, {
          key: "crane",
          value: function crane(g, x, y) {
            var c = colors.muted;
            g.rect(x, y, 35, 280, c, undefined, 2);
            g.rect(x + 270, y, 35, 280, c, undefined, 2);
            for (var h = 0; h < 270; h += 35) {
              g.segment(x, y + h, x + 35, y + h + 35, 1, c);
              g.segment(x + 270, y + h, x + 305, y + h + 35, 1, c);
            }
            g.rect(x - 12, y + 280, 330, 24, c, undefined, 2);
            for (var xx = x; xx < x + 300; xx += 28) g.segment(xx, y + 280, xx + 24, y + 304, 1, c);
            g.segment(x + 135, y + 280, x + 135, y + 182, 1.5, c);
            g.segment(x + 152, y + 280, x + 152, y + 180, 1.5, c);
            g.rect(x + 117, y + 158, 52, 23, c, undefined, 2);
            g.segment(x + 134, y + 157, x + 134, y + 140, 2, c);
            g.line([{
              x: x + 125,
              y: y + 137
            }, {
              x: x + 136,
              y: y + 125
            }, {
              x: x + 148,
              y: y + 136
            }], 2, c);
            g.circle(x + 9, y + 57, 11, c, undefined, 2);
            g.circle(x + 284, y + 57, 11, c, undefined, 2);
          }
        }, {
          key: "truck",
          value: function truck(g, x, y) {
            var c = colors.far;
            g.rect(x, y + 19, 115, 52, c, undefined, 1.5);
            g.line([{
              x: x + 115,
              y: y + 19
            }, {
              x: x + 160,
              y: y + 19
            }, {
              x: x + 160,
              y: y + 54
            }, {
              x: x + 145,
              y: y + 77
            }, {
              x: x + 115,
              y: y + 77
            }], 1.5, c);
            g.rect(x + 122, y + 47, 22, 23, c, undefined, 1);
            g.circle(x + 27, y + 17, 14, c, undefined, 1.5);
            g.circle(x + 130, y + 17, 14, c, undefined, 1.5);
          }
        }]);
        return SceneryArt;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/StickmanAnimator.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
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
            var deadTime = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
            var aimPitch = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
            this.cursor = 0;
            var p = this.point;
            var run = state === "Run",
              air = state === "Jump" || state === "Fall";
            var wave = Math.sin(time * 15),
              breathe = Math.sin(time * 3) * 0.8;
            var bob = run ? Math.abs(Math.cos(time * 15)) * 2 : breathe;
            var lean = (run ? 5 : state === "Hit" ? -12 : 0) - recoil * 1.8;
            var kick = recoil * 4;
            var pose = {
              head: p(lean, 64 + bob),
              neck: p(lean, 53 + bob),
              torso: p(0, 29 + bob),
              leftShoulder: p(lean - 2, 49 + bob),
              rightShoulder: p(lean + 2, 49 + bob),
              leftElbow: p(8 - kick, 37 + bob),
              rightElbow: p(15 - kick, 42 + bob),
              leftHand: p(21 - kick, 44 + bob),
              rightHand: p(25 - kick, 44 + bob),
              leftHip: p(-2, 29 + bob),
              rightHip: p(2, 29 + bob),
              leftKnee: p(run ? wave * 13 : -6, 15),
              rightKnee: p(run ? -wave * 13 : 6, 15),
              leftAnkle: p(run ? wave * 22 : -10, run ? Math.max(0, -wave) * 8 : 0),
              rightAnkle: p(run ? -wave * 22 : 10, run ? Math.max(0, wave) * 8 : 0)
            };
            if (armed && run) {
              // Counter-swing while carrying a rifle; firing blends back into the aimed pose.
              var swing = wave * (1 - recoil);
              pose.leftElbow.x -= swing * 5;
              pose.rightElbow.x += swing * 5;
              pose.leftHand.y += swing * 2;
              pose.rightHand.y -= swing * 2;
            }
            if (!armed) {
              pose.leftElbow = p(run ? -wave * 12 : -9, 35 + bob);
              pose.rightElbow = p(run ? wave * 12 : 10, 35 + bob);
              pose.leftHand = p(run ? -wave * 20 : -12, 26 + bob);
              pose.rightHand = p(state === "Shoot" ? 36 : run ? wave * 20 : 13, state === "Shoot" ? 43 : 27 + bob);
            }
            if (state === "Crouch" || state === "Land") {
              var amount = state === "Crouch" ? 0.6 : 0.88;
              for (var _i = 0, _Object$values = Object.values(pose); _i < _Object$values.length; _i++) {
                var joint = _Object$values[_i];
                joint.y *= amount;
              }
              pose.leftKnee = p(-12, 12);
              pose.rightKnee = p(15, 12);
              pose.leftAnkle = p(-17, 0);
              pose.rightAnkle = p(18, 0);
            }
            if (armed && aimPitch > 0) {
              var base = state === "Crouch" ? 26 : 44 + bob;
              pose.rightHand = p(20 + 5 * Math.cos(aimPitch) - kick, base + 22 * Math.sin(aimPitch));
              pose.leftHand = p(16 + 6 * Math.cos(aimPitch) - kick, base + 15 * Math.sin(aimPitch));
              pose.rightElbow = p(24, base + 5);
              pose.leftElbow = p(11, base - 4);
            }
            if (air) {
              pose.leftKnee = p(11, 21);
              pose.leftAnkle = p(2, 9);
              pose.rightKnee = p(-11, 17);
              pose.rightAnkle = p(-17, 5);
              if (state === "Fall") {
                pose.leftKnee = p(8, 18);
                pose.leftAnkle = p(12, 1);
              }
            }
            if (state === "Dead") {
              var angle = Math.min(1, deadTime / 0.42) * -Math.PI / 2;
              for (var _i2 = 0, _Object$values2 = Object.values(pose); _i2 < _Object$values2.length; _i2++) {
                var _joint = _Object$values2[_i2];
                var x = _joint.x,
                  y = _joint.y;
                _joint.x = x * Math.cos(angle) - y * Math.sin(angle);
                _joint.y = Math.max(3, x * Math.sin(angle) + y * Math.cos(angle) + 5);
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

System.register("chunks:///_virtual/StickmanRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './CharacterArt.ts', './MechanicalEnemyArt.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, CharacterArt, MechanicalEnemyArt;
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
    }],
    execute: function () {
      cclegacy._RF.push({}, "ec02cvRs4soU5cCJFrrrypZ", "StickmanRenderer", undefined);
      var StickmanRenderer = exports('StickmanRenderer', /*#__PURE__*/function () {
        function StickmanRenderer() {
          _classCallCheck(this, StickmanRenderer);
          _defineProperty(this, "art", new CharacterArt());
          _defineProperty(this, "machines", new MechanicalEnemyArt());
        }
        _createClass(StickmanRenderer, [{
          key: "draw",
          value: function draw(ink, actor, cameraX) {
            if (actor.kind === "turret" || actor.kind === "guard") this.machines.draw(ink, actor, cameraX);else this.art.draw(ink, actor, cameraX);
          }
        }]);
        return StickmanRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/TankBoss.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Types.ts', './EnemyController.ts'], function (exports) {
  var _inherits, _createSuper, _createClass, _classCallCheck, _defineProperty, _assertThisInitialized, cclegacy, GameConfig, clamp, EnemyController;
  return {
    setters: [function (module) {
      _inherits = module.inherits;
      _createSuper = module.createSuper;
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _assertThisInitialized = module.assertThisInitialized;
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
          _defineProperty(_assertThisInitialized(_this), "onSummon", void 0);
          _defineProperty(_assertThisInitialized(_this), "box", {
            x: 0,
            y: 0,
            w: 240,
            h: 125
          });
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
            this.active = level.data.arena ? level.arenaEntered : Math.abs(p.x - this.x) < 800;
            if (!this.active || !p.alive) {
              this.state = "Idle";
              return;
            }
            this.facing = p.x > this.x ? 1 : -1;
            this.state = "Attack";
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
            this.warningTime = Math.max(0, this.warningTime - dt);
            this.summonTime -= dt;
            if (this.summonTime <= 0 && this.summons < GameConfig.boss.maxSummons) {
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
              this.targetX = clamp(p.x + p.vx * 0.4, ((_level$data$arena$sta = (_level$data$arena = level.data.arena) === null || _level$data$arena === void 0 ? void 0 : _level$data$arena.start) !== null && _level$data$arena$sta !== void 0 ? _level$data$arena$sta : 0) + 50, ((_level$data$arena$end = (_level$data$arena2 = level.data.arena) === null || _level$data$arena2 === void 0 ? void 0 : _level$data$arena2.end) !== null && _level$data$arena$end !== void 0 ? _level$data$arena$end : level.data.width) - 50);
              this.warningX = this.targetX;
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
              vy = (150 - y + 0.5 * 800 * flight * flight) / flight,
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

System.register("chunks:///_virtual/Types.ts", ['cc'], function (exports) {
  var cclegacy;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
    }],
    execute: function () {
      exports({
        overlaps: overlaps,
        segmentRect: segmentRect
      });
      cclegacy._RF.push({}, "c97b5mmH0TTAryi42viVQS1", "Types", undefined);
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
        return enter;
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

System.register("chunks:///_virtual/WeaponSystem.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './StickmanAnimator.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, GameConfig, StickmanAnimator;
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
      StickmanAnimator = module.StickmanAnimator;
    }],
    execute: function () {
      cclegacy._RF.push({}, "cec5fd7ebcCaf/q3h30U5SM", "WeaponSystem", undefined);
      /** Weapon selection seam for future weapon definitions. V0.1 only implements rifle. */
      var WeaponSystem = exports('WeaponSystem', /*#__PURE__*/function () {
        function WeaponSystem() {
          var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "rifle";
          _classCallCheck(this, WeaponSystem);
          _defineProperty(this, "cooldown", 0);
          _defineProperty(this, "flash", 0);
          _defineProperty(this, "flashX", 0);
          _defineProperty(this, "flashY", 0);
          _defineProperty(this, "flashFacing", 1);
          _defineProperty(this, "animator", new StickmanAnimator());
          _defineProperty(this, "ammo", -1);
          _defineProperty(this, "shots", 0);
          this.id = id;
          this.equip(id);
        }
        _createClass(WeaponSystem, [{
          key: "equip",
          value: function equip(id) {
            this.id = id;
            this.ammo = GameConfig.weapons[id].ammo;
            this.cooldown = 0;
          }
        }, {
          key: "reset",
          value: function reset() {
            this.cooldown = this.flash = 0;
            this.equip("rifle");
            this.shots = 0;
          }
        }, {
          key: "update",
          value: function update(dt) {
            this.cooldown = Math.max(0, this.cooldown - dt);
            this.flash = Math.max(0, this.flash - dt);
          }
        }, {
          key: "fire",
          value: function fire(source, projectiles, owner, interval) {
            var _source$aimPitch, _source$aimPitch2;
            if (this.cooldown > 0) return false;
            if (owner === "player" && this.ammo === 0) this.equip("rifle");
            var config = GameConfig.weapons[this.id],
              scale = source.kind === "guard" ? 1.08 : 1;
            var pose = this.animator.sample(source.animation, source.animationTime, config.recoil, true, source.deadTime, (_source$aimPitch = source.aimPitch) !== null && _source$aimPitch !== void 0 ? _source$aimPitch : 0);
            var pitch = (_source$aimPitch2 = source.aimPitch) !== null && _source$aimPitch2 !== void 0 ? _source$aimPitch2 : 0;
            var x = source.x + (pose.rightHand.x + config.muzzleLength * Math.cos(pitch)) * source.facing * scale,
              y = source.y + (pose.rightHand.y + config.muzzleLength * Math.sin(pitch)) * scale;
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
              kind: this.id === "rocket" ? "rocket" : this.id === "shotgun" ? "pellet" : "bullet",
              blastRadius: config.blastRadius,
              knockback: config.knockback,
              originX: source.x,
              originY: y
            }) || fired;
            if (!fired) return false;
            source.recoil = config.recoil;
            if (source.weaponId !== undefined) source.weaponId = this.id;
            if (this.id !== "rocket") projectiles.particles.emit(source.x - 4 * source.facing, source.y + 42, "shell", -source.facing * 90, 160);
            if (owner === "player" && this.ammo > 0) this.ammo--;
            this.shots++;
            this.flash = this.id === "rifle" ? 0.06 : 0.1;
            this.flashX = x;
            this.flashY = y;
            this.flashFacing = source.facing;
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