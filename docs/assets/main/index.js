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

System.register("chunks:///_virtual/CocosInputAdapter.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, input, Input, KeyCode, Node;
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
      Node = module.Node;
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
          }
        }, {
          key: "bindButton",
          value: function bindButton(button, action) {
            var _this = this;
            var start = function start(e) {
              _this.state.press("touch:".concat(e.getID()), action);
              e.propagationStopped = true;
            };
            var end = function end(e) {
              _this.touchEnd(e);
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
  var _createClass, _classCallCheck, _createForOfIteratorHelper, cclegacy, Color, colors;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
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
        }
        _createClass(CombatRenderer, [{
          key: "draw",
          value: function draw(ink, session) {
            ink.clear();
            var cam = session.camera.x;
            var _iterator = _createForOfIteratorHelper(session.projectiles.items),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var p = _step.value;
                if (p.active && p.x > cam - 30 && p.x < cam + 1310) {
                  var x = p.x - cam,
                    dir = p.vx > 0 ? 1 : -1;
                  ink.line([{
                    x: x - dir * 15,
                    y: p.y
                  }, {
                    x: x,
                    y: p.y
                  }], p.owner === "player" ? 3 : 2, colors.ink);
                  if (p.owner === "enemy") ink.circle(x, p.y, 2, colors.ink, colors.ink, 1);
                }
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            var _iterator2 = _createForOfIteratorHelper(session.particles.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _p = _step2.value;
                if (_p.active) {
                  var color = new Color(24, 24, 24, 255 * _p.life / _p.maxLife);
                  ink.line([{
                    x: _p.x - cam,
                    y: _p.y
                  }, {
                    x: _p.x - cam - _p.vx * 0.018,
                    y: _p.y - _p.vy * 0.018
                  }], _p.size, color);
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            var flash = function flash(weapon) {
              if (weapon.flash <= 0) return;
              var x = weapon.flashX - cam,
                y = weapon.flashY,
                d = weapon.flashFacing;
              ink.line([{
                x: x + 3 * d,
                y: y + 5
              }, {
                x: x + 15 * d,
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
            var _iterator3 = _createForOfIteratorHelper(session.spawner.enemies),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var e = _step3.value;
                if (e.x < cam - 60 || e.x > cam + 1340) continue;
                flash(e.weapon);
                if (e.windup > 0 && e.alive) {
                  var _x = e.x - cam,
                    y = e.y + 91;
                  ink.line([{
                    x: _x,
                    y: y + 6
                  }, {
                    x: _x,
                    y: y + 16
                  }], 2);
                  ink.circle(_x, y, 1, colors.ink, colors.ink, 1);
                }
                if (e.alive && e.health < e.maxHealth) {
                  ink.rect(e.x - cam - 18, e.y + 84, 36, 3, colors.muted, colors.paper, 1);
                  ink.rect(e.x - cam - 18, e.y + 84, 36 * e.health / e.maxHealth, 3, colors.ink, colors.ink, 1);
                }
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
          }
        }]);
        return CombatRenderer;
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
          _defineProperty(this, "patrolDirection", -1);
          _defineProperty(this, "weapon", new WeaponSystem());
          this.spawn = spawn;
          this.x = spawn.x;
          this.y = spawn.y;
          this.kind = spawn.kind;
          this.id = spawn.id;
          this.health = this.maxHealth = GameConfig.enemies[this.kind].health;
        }
        _createClass(EnemyController, [{
          key: "alive",
          get: function get() {
            return this.health > 0;
          }
        }, {
          key: "bounds",
          get: function get() {
            return {
              x: this.x - 13,
              y: this.y + 3,
              w: 26,
              h: this.kind === "guard" ? 72 : 65
            };
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
            if (!this.alive) return false;
            this.health = Math.max(0, this.health - amount);
            this.hitTime = 0.13;
            this.vx = direction * 65;
            this.state = this.alive ? "Hit" : "Dead";
            this.windup = 0;
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
            var config = GameConfig.enemies[this.kind],
              dx = player.x - this.x,
              dy = player.y - this.y;
            if (!this.alive) {
              this.state = "Dead";
              this.deadTime += dt;
              this.vx *= Math.exp(-dt * 10);
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
              this.facing = dx >= 0 ? 1 : -1;
              var close = Math.abs(dx) <= config.range && Math.abs(dy) < (this.kind === "melee" ? 50 : 110);
              var sight = !level.solids.some(function (s) {
                return segmentRect({
                  x: _this.x,
                  y: _this.y + 44
                }, {
                  x: player.x,
                  y: player.y + 44
                }, s) !== null;
              });
              if (close && (this.kind === "melee" || sight)) {
                this.state = "Attack";
                this.vx = 0;
                if (this.attackCooldown === 0 && this.windup === 0) this.windup = this.kind === "melee" ? 0.28 : 0.34;
                if (this.windup > 0) {
                  this.windup = Math.max(0, this.windup - dt);
                  if (this.windup === 0) {
                    if (this.kind === "melee") {
                      if (Math.abs(player.x - this.x) < config.range + 8 && Math.abs(player.y - this.y) < 50) player.takeDamage(config.damage, this.facing);
                    } else this.weapon.fire(this, projectiles, "enemy", config.interval);
                    this.attackCooldown = config.interval;
                  }
                }
              } else {
                this.state = "Chase";
                this.windup = 0;
                this.vx = this.kind === "melee" || Math.abs(dx) > config.range ? this.facing * config.speed : 0;
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

System.register("chunks:///_virtual/EnemySpawner.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './LevelData.ts', './EnemyController.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, AbandonedBase, EnemyController;
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
            this.enemies = AbandonedBase.enemies.map(function (data) {
              return new EnemyController(data);
            });
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
          deathDuration: 0.9
        },
        weapons: {
          rifle: {
            id: "rifle",
            interval: 0.14,
            speed: 1100,
            damage: 1,
            range: 980,
            muzzleHeight: 44
          }
        },
        enemies: {
          melee: {
            health: 3,
            speed: 100,
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
            health: 18,
            speed: 42,
            range: 700,
            interval: 0.7,
            notice: 800,
            damage: 1
          }
        },
        enemyProjectile: {
          speed: 430,
          range: 1000
        },
        pools: {
          projectiles: 96,
          particles: 160
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

System.register("chunks:///_virtual/GameManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './InputManager.ts', './GameSession.ts', './Ink.ts', './StickmanRenderer.ts', './LevelRenderer.ts', './PlatformBridge.ts', './CombatRenderer.ts', './CocosInputAdapter.ts', './HUDController.ts'], function (exports) {
  var _inherits, _createSuper, _createClass, _classCallCheck, _defineProperty, _assertThisInitialized, _createForOfIteratorHelper, cclegacy, _decorator, view, ResolutionPolicy, game, profiler, Canvas, Camera, Layers, Color, UITransform, Component, GameConfig, InputManager, GameSession, node, Ink, StickmanRenderer, LevelRenderer, PlatformBridge, CombatRenderer, CocosInputAdapter, HUDController;
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
          _defineProperty(_assertThisInitialized(_this), "renderer", new StickmanRenderer());
          _defineProperty(_assertThisInitialized(_this), "combatRenderer", new CombatRenderer());
          _defineProperty(_assertThisInitialized(_this), "accumulator", 0);
          _defineProperty(_assertThisInitialized(_this), "ready", false);
          _defineProperty(_assertThisInitialized(_this), "lastState", _this.session.state);
          return _this;
        }
        _createClass(GameManager, [{
          key: "onLoad",
          value: function onLoad() {
            try {
              this.initialize();
              this.ready = true;
              console.info("[Breakout] V0.1 ready; fixed simulation 120Hz, render 60FPS.");
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
            this.map = new LevelRenderer(board, this.session.level);
            this.actors = new Ink(node(board, "Stickmen"));
            this.effects = new Ink(node(board, "Combat effects"));
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
            });
            this.platform.install(function () {
              _this2.adapter.hidden();
              _this2.session.pause();
              _this2.accumulator = 0;
            }, function () {
              return _this2.session.snapshot();
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
            if (this.controls.consumePause()) this.togglePause();
            if (this.session.state === "playing" || this.session.state === "dying") {
              this.accumulator += Math.min(GameConfig.maxFrameDelta, Math.max(0, dt));
              while (this.accumulator >= GameConfig.fixedStep) {
                this.session.update(GameConfig.fixedStep, this.controls.consume());
                this.accumulator -= GameConfig.fixedStep;
              }
            } else this.accumulator = 0;
            var s = this.session;
            this.map.update(s.camera.x, s.level.guardDefeated);
            this.actors.clear();
            var _iterator = _createForOfIteratorHelper(s.spawner.enemies),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var e = _step.value;
                if (e.x > s.camera.x - 100 && e.x < s.camera.x + GameConfig.width + 100 && e.deadTime < GameConfig.rendering.corpseDuration) this.renderer.draw(this.actors, e, s.camera.x);
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
            var _this$adapter;
            (_this$adapter = this.adapter) === null || _this$adapter === void 0 || _this$adapter.destroy();
            this.platform.destroy();
          }
        }]);
        return GameManager;
      }(Component)) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/GameSession.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './PlayerController.ts', './LevelController.ts', './CameraFollow.ts', './EnemySpawner.ts', './ParticlePool.ts', './ProjectileManager.ts', './WeaponSystem.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, GameConfig, PlayerController, LevelController, CameraFollow, EnemySpawner, ParticlePool, ProjectileManager, WeaponSystem;
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
    }],
    execute: function () {
      cclegacy._RF.push({}, "b16efgJYJ2n40Av2yujA+rP", "GameSession", undefined);

      /** Session owns simulation order; no engine or browser dependencies. */
      var GameSession = exports('GameSession', /*#__PURE__*/function () {
        function GameSession() {
          _classCallCheck(this, GameSession);
          _defineProperty(this, "state", "title");
          _defineProperty(this, "player", new PlayerController());
          _defineProperty(this, "level", new LevelController());
          _defineProperty(this, "camera", new CameraFollow());
          _defineProperty(this, "spawner", new EnemySpawner());
          _defineProperty(this, "particles", new ParticlePool());
          _defineProperty(this, "projectiles", new ProjectileManager(this.particles));
          _defineProperty(this, "weapon", new WeaponSystem());
          _defineProperty(this, "time", 0);
          _defineProperty(this, "hitFlash", 0);
          _defineProperty(this, "resumeState", "playing");
          this.reset("title");
        }
        _createClass(GameSession, [{
          key: "reset",
          value: function reset() {
            var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "playing";
            this.state = state;
            this.time = 0;
            this.hitFlash = 0;
            this.level.reset();
            this.player.reset(this.level.data.spawn.x, this.level.data.spawn.y);
            this.camera.reset();
            this.spawner.reset();
            this.particles.reset();
            this.projectiles.reset();
            this.weapon.reset();
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
            if (this.state !== "playing" && this.state !== "dying") return;
            this.time += dt;
            this.hitFlash = Math.max(0, this.hitFlash - dt);
            var health = this.player.health;
            this.player.update(dt, input, this.level);
            this.weapon.update(dt);
            if (this.state === "playing" && input.shoot && this.player.alive) this.weapon.fire(this.player, this.projectiles, "player");
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
            this.projectiles.update(dt, this.player, this.spawner.enemies, this.level.solids);
            this.particles.update(dt);
            if (this.player.health < health) this.hitFlash = 0.15;
            this.level.guardDefeated = !this.spawner.guard.alive;
            if (!this.player.alive) {
              this.state = "dying";
              if (this.player.deadTime >= GameConfig.player.deathDuration) this.state = "gameover";
            } else if (this.level.reachedExit(this.player.x)) this.state = "complete";
            this.camera.update(this.player.x, dt, this.level.data.width);
          }
        }, {
          key: "snapshot",
          value: function snapshot() {
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
                animation: this.player.animation
              },
              cameraX: this.camera.x,
              kills: this.spawner.kills,
              remaining: this.spawner.remaining,
              guardHealth: this.spawner.guard.health,
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
                  windup: e.windup
                };
              })
            };
          }
        }]);
        return GameSession;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/HUDController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './Ink.ts', './StickmanRenderer.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, _slicedToArray, cclegacy, Color, Label, Node, GameConfig, node, Ink, colors, StickmanRenderer;
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
          this.hud = node(parent, "HUD");
          this.hudInk = new Ink(this.hud);
          text(this.hud, "线条突围", 92, 687, 23, colors.ink, 160);
          text(this.hud, "生命", 220, 686, 14, colors.muted, 80);
          text(this.hud, "废弃基地", 1050, 689, 22, colors.ink, 185);
          button(this.hud, "Ⅱ", 1204, 686, 54, 44, onPause);
          this.objective = text(this.hud, "向右推进 · 击败出口守卫", 982, 620, 16, colors.muted, 480);
          this.stats = text(this.hud, "", 112, 620, 15, colors.muted, 170);
          this.guardNode = node(parent, "Guard health");
          this.guardInk = new Ink(this.guardNode);
          this.guardLabel = text(this.guardNode, "出口守卫", 640, 595, 17, colors.ink, 350);
          this.controls = node(parent, "Touch controls");
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
          touch("left", 105, 72, 48);
          touch("right", 225, 72, 48);
          touch("jump", 1022, 78, 48);
          touch("shoot", 1162, 78, 55);
          text(this.controls, "A / ←     D / →", 166, 13, 12, colors.muted, 230);
          text(this.controls, "Space", 1022, 13, 12, colors.muted, 100);
          text(this.controls, "按住 J", 1162, 13, 12, colors.muted, 100);
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
          text(title, "01 / 废弃基地", 116, -17, 18, colors.ink, 520);
          text(title, "跨越障碍，击败守卫，抵达出口。", 122, -56, 18, colors.muted, 600);
          button(title, "开始突围  →", 120, -128, 300, 62, onStart, true);
          text(title, "A D 移动   ·   Space 跳跃   ·   按住 J 射击", 120, -204, 17, colors.muted, 760);
          text(title, "P / Esc 暂停   ·   手机支持多点触控   ·   Enter 开始", 120, -239, 14, colors.muted, 760);
          text(title, "V0.1  /  原创程序化绘制", -368, -270, 13, colors.muted, 390);
          var paused = panel("paused");
          text(paused, "暂停一下", 0, 103, 52);
          text(paused, "战场等你回来。", 0, 42, 20, colors.muted);
          button(paused, "继续突围", 0, -34, 280, 60, onResume, true);
          button(paused, "重新开始", -153, -122, 280, 56, onStart);
          button(paused, "返回首页", 153, -122, 280, 56, onHome);
          text(paused, "P / Esc 继续", 0, -201, 15, colors.muted);
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
            var radius = action === "shoot" ? 53 : 47,
              color = held ? colors.paper : new Color(24, 24, 24, 170);
            ink.circle(0, 0, radius, new Color(24, 24, 24, 140), held ? new Color(24, 24, 24, 210) : new Color(250, 249, 245, 205), 2);
            if (action === "left" || action === "right") {
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
          key: "update",
          value: function update(s, input, portrait) {
            this.hud.active = s.state === "playing" || s.state === "dying" || s.state === "paused";
            this.controls.active = s.state === "playing";
            this.rotateNote.active = portrait;
            this.guardNode.active = s.state === "playing" && s.player.x > 2850 && s.spawner.guard.alive;
            if (this.guardNode.active) {
              this.guardInk.clear();
              this.guardInk.rect(470, 569, 340, 5, colors.muted, colors.paper, 1);
              this.guardInk.rect(470, 569, 340 * s.spawner.guard.health / s.spawner.guard.maxHealth, 5, colors.ink, colors.ink, 1);
              this.guardLabel.string = "\u51FA\u53E3\u5B88\u536B  ".concat(s.spawner.guard.health, " / ").concat(s.spawner.guard.maxHealth);
            }
            if (this.lastState !== s.state) {
              var _iterator2 = _createForOfIteratorHelper(this.panels),
                _step2;
              try {
                for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                  var _step2$value = _slicedToArray(_step2.value, 2),
                    state = _step2$value[0],
                    p = _step2$value[1];
                  p.active = state === s.state;
                }
              } catch (err) {
                _iterator2.e(err);
              } finally {
                _iterator2.f();
              }
              this.lastState = s.state;
            }
            var progress = Math.floor(s.player.x / 4000 * 1280);
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
            if (this.lastExit !== s.level.guardDefeated) {
              this.objective.string = s.level.guardDefeated ? "守卫已击败 · 抵达出口 →" : "向右推进 · 击败出口守卫";
              this.lastExit = s.level.guardDefeated;
            }
            this.stats.string = "\u51FB\u8D25  ".concat(s.spawner.kills, " / ").concat(s.spawner.enemies.length);
            var _iterator3 = _createForOfIteratorHelper(this.resultStats),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var stat = _step3.value;
                stat.string = "\u8017\u65F6 ".concat(Math.floor(s.time), " \u79D2    \xB7    \u51FB\u8D25 ").concat(s.spawner.kills, " \u540D\u654C\u4EBA");
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            var _iterator4 = _createForOfIteratorHelper(this.touchButtons),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var b = _step4.value;
                var held = input.isHeld(b.action);
                if (held !== b.held) {
                  this.paintTouch(b.ink, b.action, held);
                  b.held = held;
                }
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
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

System.register("chunks:///_virtual/InputManager.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _toConsumableArray, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _toConsumableArray = module.toConsumableArray;
    }, function (module) {
      cclegacy = module.cclegacy;
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
        }
        _createClass(InputManager, [{
          key: "press",
          value: function press(source, action) {
            if (this.held.has(source)) return;
            this.held.set(source, action);
            if (action === "jump") this.jumpQueued = true;
            if (action === "pause") this.pauseQueued = true;
          }
        }, {
          key: "release",
          value: function release(source) {
            this.held["delete"](source);
          }
        }, {
          key: "isHeld",
          value: function isHeld(action) {
            return _toConsumableArray(this.held.values()).includes(action);
          }
        }, {
          key: "consume",
          value: function consume() {
            var frame = {
              axis: Number(this.isHeld("right")) - Number(this.isHeld("left")),
              jump: this.jumpQueued,
              shoot: this.isHeld("shoot")
            };
            this.jumpQueued = false;
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
          }
        }]);
        return InputManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './LevelData.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, AbandonedBase;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
    }, function (module) {
      AbandonedBase = module.AbandonedBase;
    }],
    execute: function () {
      cclegacy._RF.push({}, "0f849NFYsOErwds5S7GpI4u", "LevelController", undefined);
      /** Deterministic kinematic collisions, independent of Box2D and platform/browser APIs. */
      var LevelController = exports('LevelController', /*#__PURE__*/function () {
        function LevelController() {
          _classCallCheck(this, LevelController);
          _defineProperty(this, "data", AbandonedBase);
          _defineProperty(this, "solids", this.data.solids);
          _defineProperty(this, "guardDefeated", false);
        }
        _createClass(LevelController, [{
          key: "reset",
          value: function reset() {
            this.guardDefeated = false;
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
            var _iterator = _createForOfIteratorHelper(this.solids),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var s = _step.value;
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
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            var oldY = body.y,
              dy = body.vy * dt;
            body.y += dy;
            body.grounded = false;
            var _iterator2 = _createForOfIteratorHelper(this.solids),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _s = _step2.value;
                if (body.x + body.halfWidth <= _s.x || body.x - body.halfWidth >= _s.x + _s.w) continue;
                var top = _s.y + _s.h;
                if (dy <= 0 && oldY >= top - 0.01 && body.y <= top) {
                  body.y = Math.max(body.y, top);
                  body.vy = 0;
                  body.grounded = true;
                } else if (dy > 0 && oldY + body.height <= _s.y + 0.01 && body.y + body.height >= _s.y) {
                  body.y = Math.min(body.y, _s.y - body.height);
                  body.vy = 0;
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            body.x = Math.max(body.halfWidth, Math.min(this.data.width - body.halfWidth, body.x));
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
        name: "废弃基地",
        width: 4000,
        spawn: {
          x: 110,
          y: 150
        },
        exit: {
          x: 3860,
          y: 150
        },
        solids: [{
          x: 0,
          y: 50,
          w: 4000,
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
          id: "gate-guard",
          kind: "guard",
          x: 3560,
          y: 150,
          patrol: 30
        }]
      });
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/LevelRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './Ink.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, Label, node, Ink, colors;
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
    }],
    execute: function () {
      cclegacy._RF.push({}, "ce266XwPE5kjMxHJkBriZYn", "LevelRenderer", undefined);
      var LevelRenderer = exports('LevelRenderer', /*#__PURE__*/function () {
        function LevelRenderer(parent, level) {
          var _this = this;
          _classCallCheck(this, LevelRenderer);
          _defineProperty(this, "far", void 0);
          _defineProperty(this, "mid", void 0);
          _defineProperty(this, "terrain", void 0);
          _defineProperty(this, "gate", void 0);
          this.far = node(parent, "Distant skyline");
          this.mid = node(parent, "Wires and buildings");
          this.terrain = node(parent, "Terrain");
          var far = new Ink(this.far),
            mid = new Ink(this.mid),
            ground = new Ink(this.terrain);
          for (var x = -400; x < 4800; x += 270) {
            var h = 110 + Math.abs(x * 17) % 140;
            far.rect(x, 150, 180, h, colors.far, undefined, 1.5);
            far.line([{
              x: x - 10,
              y: 150 + h
            }, {
              x: x + 70,
              y: 170 + h
            }, {
              x: x + 190,
              y: 150 + h
            }], 1.5, colors.far);
            for (var wy = 185; wy < 150 + h - 15; wy += 35) for (var wx = x + 20; wx < x + 165; wx += 40) far.rect(wx, wy, 16, 19, colors.far, undefined, 1);
          }
          for (var _x = 0; _x < 4400; _x += 520) {
            mid.line([{
              x: _x + 160,
              y: 150
            }, {
              x: _x + 160,
              y: 410
            }, {
              x: _x + 150,
              y: 414
            }], 2, colors.muted);
            mid.line([{
              x: _x + 128,
              y: 386
            }, {
              x: _x + 190,
              y: 386
            }], 2, colors.muted);
            mid.line([{
              x: _x + 160,
              y: 395
            }, {
              x: _x + 320,
              y: 353
            }, {
              x: _x + 500,
              y: 353
            }, {
              x: _x + 680,
              y: 395
            }], 1, colors.far);
          }
          for (var _i = 0, _arr = [820, 1660, 2820, 3430]; _i < _arr.length; _i++) {
            var _x2 = _arr[_i];
            mid.rect(_x2, 150, 360, 220, colors.far, undefined, 2);
            mid.line([{
              x: _x2 - 12,
              y: 370
            }, {
              x: _x2 + 380,
              y: 370
            }], 3, colors.far);
            mid.rect(_x2 + 70, 150, 76, 106, colors.far, undefined, 2);
            mid.rect(_x2 + 220, 240, 70, 48, colors.far, undefined, 2);
          }
          var _iterator = _createForOfIteratorHelper(level.solids),
            _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var s = _step.value;
              ground.rect(s.x, s.y, s.w, s.h, colors.ink, colors.paper, s.kind === "ground" ? 3 : 2.5);
              if (s.kind === "crate") {
                ground.line([{
                  x: s.x + 7,
                  y: s.y + 7
                }, {
                  x: s.x + s.w - 7,
                  y: s.y + s.h - 7
                }], 2);
                ground.line([{
                  x: s.x + 7,
                  y: s.y + s.h - 7
                }, {
                  x: s.x + s.w - 7,
                  y: s.y + 7
                }], 2);
                ground.rect(s.x + 5, s.y + 5, s.w - 10, s.h - 10, colors.ink, undefined, 1);
              } else {
                for (var _x4 = s.x + 12; _x4 < s.x + s.w; _x4 += 24) ground.line([{
                  x: _x4,
                  y: s.y + s.h - 6
                }, {
                  x: _x4 - 7,
                  y: s.y + s.h - 15
                }], 1, colors.muted);
              }
              if (s.kind === "platform") for (var _i2 = 0, _arr2 = [s.x + 20, s.x + s.w - 20]; _i2 < _arr2.length; _i2++) {
                var _x5 = _arr2[_i2];
                ground.line([{
                  x: _x5,
                  y: 150
                }, {
                  x: _x5,
                  y: s.y
                }], 2, colors.muted);
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
          for (var _x3 = 50; _x3 < 4000; _x3 += 103) ground.line([{
            x: _x3,
            y: 131
          }, {
            x: _x3 + 15,
            y: 127
          }, {
            x: _x3 + 32,
            y: 131
          }], 1, colors.far);
          var sign = function sign(text, x, y) {
            var size = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 16;
            var n = node(_this.terrain, text, x, y, 220, 36);
            var l = n.addComponent(Label);
            l.string = text;
            l.fontSize = size;
            l.color = colors.muted;
            l.fontFamily = "sans-serif";
          };
          sign("01 / ABANDONED BASE", 240, 310);
          sign("仓储区 →", 1120, 427, 22);
          sign("限制区域", 3180, 340, 22);
          sign("出口  /  EXIT", 3850, 336, 22);
          ground.line([{
            x: 3780,
            y: 150
          }, {
            x: 3780,
            y: 300
          }, {
            x: 3920,
            y: 300
          }, {
            x: 3920,
            y: 150
          }], 4);
          ground.line([{
            x: 3840,
            y: 265
          }, {
            x: 3870,
            y: 265
          }, {
            x: 3860,
            y: 276
          }], 2);
          this.gate = new Ink(node(this.terrain, "Exit gate"));
          this.update(0, false);
        }
        _createClass(LevelRenderer, [{
          key: "update",
          value: function update(cameraX, unlocked) {
            this.far.setPosition(-cameraX * 0.18, 0);
            this.mid.setPosition(-cameraX * 0.45, 0);
            this.terrain.setPosition(-cameraX, 0);
            this.gate.clear();
            if (!unlocked) for (var x = 3800; x < 3920; x += 22) this.gate.line([{
              x: x,
              y: 154
            }, {
              x: x,
              y: 292
            }], 2, colors.muted);else this.gate.line([{
              x: 3800,
              y: 208
            }, {
              x: 3828,
              y: 190
            }, {
              x: 3878,
              y: 235
            }], 4);
          }
        }]);
        return LevelRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/main", ['./GameManager.ts', './CameraFollow.ts', './ParticlePool.ts', './ProjectileManager.ts', './WeaponSystem.ts', './GameConfig.ts', './GameSession.ts', './InputManager.ts', './Types.ts', './EnemyController.ts', './EnemySpawner.ts', './LevelController.ts', './LevelData.ts', './CocosInputAdapter.ts', './PlatformBridge.ts', './PlayerController.ts', './CombatRenderer.ts', './Ink.ts', './LevelRenderer.ts', './StickmanAnimator.ts', './StickmanRenderer.ts', './HUDController.ts'], function () {
  return {
    setters: [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    execute: function () {}
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
              size: 1
            };
          }));
          _defineProperty(this, "dropped", 0);
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
            this.seed = 19283;
          }
        }, {
          key: "burst",
          value: function burst(x, y) {
            var count = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 8;
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
                size: 1 + this.random() * 2
              });
              p.maxLife = p.life;
            }
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
                  p.vy -= 500 * dt;
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

System.register("chunks:///_virtual/PlatformBridge.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, game, Game;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
    }, function (module) {
      cclegacy = module.cclegacy;
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
          key: "install",
          value: function install(onHide, snapshot) {
            this.onHide = onHide;
            game.on(Game.EVENT_HIDE, onHide);
            globalThis.__BREAKOUT__ = {
              version: "0.1.0",
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

System.register("chunks:///_virtual/PlayerController.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts'], function (exports) {
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
      cclegacy._RF.push({}, "5a048s+oK2pe63qhhmY9lXj", "PlayerController", undefined);
      var PlayerController = exports('PlayerController', /*#__PURE__*/function () {
        function PlayerController() {
          _classCallCheck(this, PlayerController);
          _defineProperty(this, "x", 110);
          _defineProperty(this, "y", 150);
          _defineProperty(this, "vx", 0);
          _defineProperty(this, "vy", 0);
          _defineProperty(this, "grounded", true);
          _defineProperty(this, "halfWidth", GameConfig.player.halfWidth);
          _defineProperty(this, "height", GameConfig.player.height);
          _defineProperty(this, "health", GameConfig.player.maxHealth);
          _defineProperty(this, "facing", 1);
          _defineProperty(this, "invincible", 0);
          _defineProperty(this, "hitTime", 0);
          _defineProperty(this, "deadTime", 0);
          _defineProperty(this, "recoil", 0);
          _defineProperty(this, "animationTime", 0);
          _defineProperty(this, "coyote", 0);
          _defineProperty(this, "buffer", 0);
        }
        _createClass(PlayerController, [{
          key: "alive",
          get: function get() {
            return this.health > 0;
          }
        }, {
          key: "bounds",
          get: function get() {
            return {
              x: this.x - 13,
              y: this.y + 3,
              w: 26,
              h: 65
            };
          }
        }, {
          key: "animation",
          get: function get() {
            if (!this.alive) return "Dead";
            if (this.hitTime > 0) return "Hit";
            if (!this.grounded) return this.vy > 0 ? "Jump" : "Fall";
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
            this.facing = 1;
            this.invincible = this.hitTime = this.deadTime = this.recoil = this.animationTime = this.coyote = this.buffer = 0;
          }
        }, {
          key: "update",
          value: function update(dt, input, level) {
            this.animationTime += dt;
            this.recoil = Math.max(0, this.recoil - dt * 8);
            this.invincible = Math.max(0, this.invincible - dt);
            this.hitTime = Math.max(0, this.hitTime - dt);
            if (!this.alive) {
              this.deadTime += dt;
              this.vx *= Math.exp(-dt * 8);
            } else {
              if (input.axis) this.facing = input.axis > 0 ? 1 : -1;
              var target = input.axis * GameConfig.player.speed;
              var change = (input.axis ? GameConfig.player.acceleration : GameConfig.player.deceleration) * dt;
              this.vx += Math.max(-change, Math.min(change, target - this.vx));
              this.coyote = this.grounded ? GameConfig.player.coyoteTime : Math.max(0, this.coyote - dt);
              this.buffer = input.jump ? GameConfig.player.jumpBuffer : Math.max(0, this.buffer - dt);
              if (this.buffer > 0 && this.coyote > 0) {
                this.vy = GameConfig.player.jumpVelocity;
                this.grounded = false;
                this.coyote = 0;
                this.buffer = 0;
              }
            }
            this.vy -= GameConfig.player.gravity * dt;
            level.move(this, dt);
            if (this.y < -200) this.takeDamage(this.health, this.facing);
          }
        }, {
          key: "takeDamage",
          value: function takeDamage(amount, direction) {
            if (!this.alive || this.invincible > 0) return false;
            this.health = Math.max(0, this.health - amount);
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
          _defineProperty(this, "items", Array.from({
            length: GameConfig.pools.projectiles
          }, function () {
            return {
              active: false,
              owner: "player",
              x: 0,
              y: 0,
              lastX: 0,
              vx: 0,
              damage: 0,
              distance: 0,
              range: 0
            };
          }));
          _defineProperty(this, "fired", 0);
          _defineProperty(this, "hits", 0);
          _defineProperty(this, "dropped", 0);
          _defineProperty(this, "peak", 0);
          this.particles = particles;
        }
        _createClass(ProjectileManager, [{
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
            this.fired = this.hits = this.dropped = this.peak = 0;
          }
        }, {
          key: "spawn",
          value: function spawn(s) {
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
              vx: s.direction * s.speed,
              damage: s.damage,
              distance: 0,
              range: s.range
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
            var _iterator2 = _createForOfIteratorHelper(this.items),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var p = _step2.value;
                if (!p.active) continue;
                p.lastX = p.x;
                var end = {
                    x: p.x + p.vx * dt,
                    y: p.y
                  },
                  start = {
                    x: p.x,
                    y: p.y
                  };
                var nearest = 1.01,
                  _target = void 0;
                var _iterator3 = _createForOfIteratorHelper(solids),
                  _step3;
                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    var solid = _step3.value;
                    var t = segmentRect(start, end, solid, 1.5);
                    if (t !== null && t < nearest) {
                      nearest = t;
                      _target = undefined;
                    }
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }
                var _iterator4 = _createForOfIteratorHelper(p.owner === "player" ? enemies : [player]),
                  _step4;
                try {
                  for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                    var candidate = _step4.value;
                    if (!candidate.alive) continue;
                    var _t = segmentRect(start, end, candidate.bounds, 2);
                    if (_t !== null && _t < nearest) {
                      nearest = _t;
                      _target = candidate;
                    }
                  }
                } catch (err) {
                  _iterator4.e(err);
                } finally {
                  _iterator4.f();
                }
                if (nearest <= 1) {
                  p.x = start.x + (end.x - start.x) * nearest;
                  p.active = false;
                  this.particles.burst(p.x, p.y, _target ? 9 : 4);
                  if (_target && _target.takeDamage(p.damage, p.vx > 0 ? 1 : -1)) {
                    this.hits++;
                    onHit === null || onHit === void 0 || onHit(_target);
                  }
                } else {
                  p.x = end.x;
                  p.distance += Math.abs(p.vx * dt);
                  if (p.distance >= p.range || p.x < -20 || p.x > 4020) p.active = false;
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
          }
        }]);
        return ProjectileManager;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/StickmanAnimator.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _createClass, _classCallCheck, cclegacy;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
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
          _classCallCheck(this, StickmanAnimator);
        }
        _createClass(StickmanAnimator, [{
          key: "sample",
          value: /** Local coordinates face right, origin at feet. Upper body remains aimed while running. */
          function sample(state, time, recoil, armed) {
            var deadTime = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;
            var run = state === "Run",
              air = state === "Jump" || state === "Fall";
            var wave = Math.sin(time * 15),
              breathe = Math.sin(time * 3) * 0.8;
            var bob = run ? Math.abs(Math.cos(time * 15)) * 2 : breathe;
            var lean = run ? 4 : state === "Hit" ? -10 : 0;
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
              for (var _i = 0, _Object$values = Object.values(pose); _i < _Object$values.length; _i++) {
                var joint = _Object$values[_i];
                var x = joint.x,
                  y = joint.y;
                joint.x = x * Math.cos(angle) - y * Math.sin(angle);
                joint.y = Math.max(3, x * Math.sin(angle) + y * Math.cos(angle) + 5);
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

System.register("chunks:///_virtual/StickmanRenderer.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './GameConfig.ts', './StickmanAnimator.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, cclegacy, Color, GameConfig, StickmanAnimator;
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
      StickmanAnimator = module.StickmanAnimator;
    }],
    execute: function () {
      cclegacy._RF.push({}, "ec02cvRs4soU5cCJFrrrypZ", "StickmanRenderer", undefined);
      var StickmanRenderer = exports('StickmanRenderer', /*#__PURE__*/function () {
        function StickmanRenderer() {
          _classCallCheck(this, StickmanRenderer);
          _defineProperty(this, "animator", new StickmanAnimator());
        }
        _createClass(StickmanRenderer, [{
          key: "draw",
          value: function draw(ink, a, cameraX) {
            var armed = a.kind !== "melee",
              pose = this.animator.sample(a.animation, a.animationTime, a.recoil, armed, a.deadTime);
            var alpha = a.animation === "Dead" ? Math.max(0, 1 - a.deadTime / 1.1) : a.invincible && Math.floor(a.invincible * 14) % 2 === 0 ? 0.28 : 1;
            var color = new Color(24, 24, 24, alpha * 255);
            var scale = a.kind === "guard" ? 1.08 : 1;
            var p = function p(v) {
              return {
                x: a.x - cameraX + v.x * a.facing * scale,
                y: a.y + v.y * scale
              };
            };
            var line = function line() {
              for (var _len = arguments.length, j = new Array(_len), _key = 0; _key < _len; _key++) {
                j[_key] = arguments[_key];
              }
              return ink.line(j.map(p), GameConfig.rendering.lineWidth, color);
            };
            var head = p(pose.head);
            ink.circle(head.x, head.y, GameConfig.rendering.headRadius * scale, color, undefined, GameConfig.rendering.lineWidth);
            line(pose.neck, pose.torso);
            line(pose.leftShoulder, pose.leftElbow, pose.leftHand);
            line(pose.rightShoulder, pose.rightElbow, pose.rightHand);
            line(pose.leftHip, pose.leftKnee, pose.leftAnkle);
            line(pose.rightHip, pose.rightKnee, pose.rightAnkle);
            // Tiny boots, eye direction and an armband distinguish the player without introducing color.
            line(pose.leftAnkle, {
              x: pose.leftAnkle.x + 6,
              y: pose.leftAnkle.y
            });
            line(pose.rightAnkle, {
              x: pose.rightAnkle.x + 6,
              y: pose.rightAnkle.y
            });
            line({
              x: pose.head.x + 4,
              y: pose.head.y + 1
            }, {
              x: pose.head.x + 7,
              y: pose.head.y + 1
            });
            if (!a.kind) line({
              x: pose.neck.x - 4,
              y: pose.neck.y - 8
            }, {
              x: pose.neck.x + 5,
              y: pose.neck.y - 10
            });else {
              line({
                x: pose.head.x - 10,
                y: pose.head.y + 7
              }, {
                x: pose.head.x + 11,
                y: pose.head.y + 7
              });
            }
            if (armed && a.animation !== "Dead") {
              var hand = p(pose.rightHand),
                dir = a.facing;
              ink.line([{
                x: hand.x - 10 * dir,
                y: hand.y
              }, {
                x: hand.x + 17 * dir,
                y: hand.y
              }], 6, color);
              ink.line([{
                x: hand.x,
                y: hand.y - 1
              }, {
                x: hand.x - 2 * dir,
                y: hand.y - 8
              }], 4, color);
              ink.line([{
                x: hand.x - 12 * dir,
                y: hand.y
              }, {
                x: hand.x - 17 * dir,
                y: hand.y - 3
              }], 4, color);
            }
            if (a.kind === "guard" && a.animation !== "Dead") line({
              x: -8,
              y: 47
            }, {
              x: 6,
              y: 47
            }, {
              x: 9,
              y: 33
            }, {
              x: -7,
              y: 33
            }, {
              x: -8,
              y: 47
            });
          }
        }]);
        return StickmanRenderer;
      }());
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/Types.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc'], function (exports) {
  var _slicedToArray, cclegacy;
  return {
    setters: [function (module) {
      _slicedToArray = module.slicedToArray;
    }, function (module) {
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
        for (var _i = 0, _arr = [[a.x, b.x - a.x, r.x - radius, r.x + r.w + radius], [a.y, b.y - a.y, r.y - radius, r.y + r.h + radius]]; _i < _arr.length; _i++) {
          var _arr$_i = _slicedToArray(_arr[_i], 4),
            start = _arr$_i[0],
            delta = _arr$_i[1],
            min = _arr$_i[2],
            max = _arr$_i[3];
          if (Math.abs(delta) < 1e-8) {
            if (start < min || start > max) return null;
            continue;
          }
          var t1 = (min - start) / delta,
            t2 = (max - start) / delta;
          if (t1 > t2) {
            var _ref = [t2, t1];
            t1 = _ref[0];
            t2 = _ref[1];
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
          this.id = id;
        }
        _createClass(WeaponSystem, [{
          key: "reset",
          value: function reset() {
            this.cooldown = this.flash = 0;
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
            if (this.cooldown > 0) return false;
            var config = GameConfig.weapons[this.id],
              scale = source.kind === "guard" ? 1.08 : 1;
            var pose = this.animator.sample(source.animation, source.animationTime, 1, true, source.deadTime);
            var x = source.x + (pose.rightHand.x + 17) * source.facing * scale,
              y = source.y + pose.rightHand.y * scale;
            var fired = projectiles.spawn({
              owner: owner,
              x: x,
              y: y,
              direction: source.facing,
              speed: owner === "player" ? config.speed : GameConfig.enemyProjectile.speed,
              damage: config.damage,
              range: owner === "player" ? config.range : GameConfig.enemyProjectile.range
            });
            if (!fired) return false;
            source.recoil = 1;
            this.flash = 0.045;
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