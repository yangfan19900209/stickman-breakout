System.register("chunks:///_virtual/builtin-pipeline-settings.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './builtin-pipeline-types.ts'], function (exports) {
  var _applyDecoratedDescriptor, _inherits, _createSuper, _classCallCheck, _initializerDefineProperty, _assertThisInitialized, _createClass, cclegacy, _decorator, Camera, CCBoolean, CCInteger, CCFloat, Material, Texture2D, rendering, Component, BloomType, fillRequiredPipelineSettings, makePipelineSettings;
  return {
    setters: [function (module) {
      _applyDecoratedDescriptor = module.applyDecoratedDescriptor;
      _inherits = module.inherits;
      _createSuper = module.createSuper;
      _classCallCheck = module.classCallCheck;
      _initializerDefineProperty = module.initializerDefineProperty;
      _assertThisInitialized = module.assertThisInitialized;
      _createClass = module.createClass;
    }, function (module) {
      cclegacy = module.cclegacy;
      _decorator = module._decorator;
      Camera = module.Camera;
      CCBoolean = module.CCBoolean;
      CCInteger = module.CCInteger;
      CCFloat = module.CCFloat;
      Material = module.Material;
      Texture2D = module.Texture2D;
      rendering = module.rendering;
      Component = module.Component;
    }, function (module) {
      BloomType = module.BloomType;
      fillRequiredPipelineSettings = module.fillRequiredPipelineSettings;
      makePipelineSettings = module.makePipelineSettings;
    }],
    execute: function () {
      var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _class, _class2, _descriptor, _descriptor2;
      cclegacy._RF.push({}, "de1c2EHcMhAIYRZY5nyTQHG", "builtin-pipeline-settings", undefined);
      var ccclass = _decorator.ccclass,
        disallowMultiple = _decorator.disallowMultiple,
        executeInEditMode = _decorator.executeInEditMode,
        menu = _decorator.menu,
        property = _decorator.property,
        requireComponent = _decorator.requireComponent,
        type = _decorator.type;
      var BuiltinPipelineSettings = exports('BuiltinPipelineSettings', (_dec = ccclass('BuiltinPipelineSettings'), _dec2 = menu('Rendering/BuiltinPipelineSettings'), _dec3 = requireComponent(Camera), _dec4 = property(CCBoolean), _dec5 = property({
        displayName: 'Editor Preview (Experimental)',
        type: CCBoolean
      }), _dec6 = property({
        group: {
          id: 'MSAA',
          name: 'Multisample Anti-Aliasing'
        },
        type: CCBoolean
      }), _dec7 = property({
        group: {
          id: 'MSAA',
          name: 'Multisample Anti-Aliasing',
          style: 'section'
        },
        type: CCInteger,
        range: [2, 4, 2]
      }), _dec8 = property({
        group: {
          id: 'ShadingScale',
          name: 'ShadingScale',
          style: 'section'
        },
        type: CCBoolean
      }), _dec9 = property({
        tooltip: 'i18n:postprocess.shadingScale',
        group: {
          id: 'ShadingScale',
          name: 'ShadingScale'
        },
        type: CCFloat,
        range: [0.01, 4, 0.01],
        slide: true
      }), _dec10 = property({
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        },
        type: CCBoolean
      }), _dec11 = type(BloomType), _dec12 = property({
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        }
      }), _dec13 = property({
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        },
        type: Material
      }), _dec14 = property({
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        },
        type: Material
      }), _dec15 = property({
        tooltip: 'i18n:bloom.enableAlphaMask',
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        },
        type: CCBoolean
      }), _dec16 = property({
        tooltip: 'i18n:bloom.iterations',
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        },
        type: CCInteger,
        range: [1, 6, 1],
        slide: true
      }), _dec17 = property({
        tooltip: 'i18n:bloom.threshold',
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        },
        type: CCFloat,
        min: 0
      }), _dec18 = type(CCFloat), _dec19 = property({
        group: {
          id: 'Bloom',
          name: 'Bloom (PostProcessing)',
          style: 'section'
        }
      }), _dec20 = property({
        group: {
          id: 'Color Grading',
          name: 'ColorGrading (LDR) (PostProcessing)',
          style: 'section'
        },
        type: CCBoolean
      }), _dec21 = property({
        group: {
          id: 'Color Grading',
          name: 'ColorGrading (LDR) (PostProcessing)',
          style: 'section'
        },
        type: Material
      }), _dec22 = property({
        tooltip: 'i18n:color_grading.contribute',
        group: {
          id: 'Color Grading',
          name: 'ColorGrading (LDR) (PostProcessing)',
          style: 'section'
        },
        type: CCFloat,
        range: [0, 1, 0.01],
        slide: true
      }), _dec23 = property({
        tooltip: 'i18n:color_grading.originalMap',
        group: {
          id: 'Color Grading',
          name: 'ColorGrading (LDR) (PostProcessing)',
          style: 'section'
        },
        type: Texture2D
      }), _dec24 = property({
        group: {
          id: 'FXAA',
          name: 'Fast Approximate Anti-Aliasing (PostProcessing)',
          style: 'section'
        },
        type: CCBoolean
      }), _dec25 = property({
        group: {
          id: 'FXAA',
          name: 'Fast Approximate Anti-Aliasing (PostProcessing)',
          style: 'section'
        },
        type: Material
      }), _dec26 = property({
        group: {
          id: 'FSR',
          name: 'FidelityFX Super Resolution',
          style: 'section'
        },
        type: CCBoolean
      }), _dec27 = property({
        group: {
          id: 'FSR',
          name: 'FidelityFX Super Resolution',
          style: 'section'
        },
        type: Material
      }), _dec28 = property({
        group: {
          id: 'FSR',
          name: 'FidelityFX Super Resolution',
          style: 'section'
        },
        type: CCFloat,
        range: [0, 1, 0.01],
        slide: true
      }), _dec29 = property({
        group: {
          id: 'ToneMapping',
          name: 'ToneMapping',
          style: 'section'
        },
        type: Material
      }), _dec(_class = _dec2(_class = _dec3(_class = disallowMultiple(_class = executeInEditMode(_class = (_class2 = /*#__PURE__*/function (_Component) {
        _inherits(BuiltinPipelineSettings, _Component);
        var _super = _createSuper(BuiltinPipelineSettings);
        function BuiltinPipelineSettings() {
          var _this;
          _classCallCheck(this, BuiltinPipelineSettings);
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          _this = _super.call.apply(_super, [this].concat(args));
          _initializerDefineProperty(_assertThisInitialized(_this), "_settings", _descriptor, _assertThisInitialized(_this));
          // Editor Preview
          _initializerDefineProperty(_assertThisInitialized(_this), "_editorPreview", _descriptor2, _assertThisInitialized(_this));
          return _this;
        }
        _createClass(BuiltinPipelineSettings, [{
          key: "getPipelineSettings",
          value: function getPipelineSettings() {
            return this._settings;
          }

          // Enable/Disable
        }, {
          key: "onEnable",
          value: function onEnable() {
            fillRequiredPipelineSettings(this._settings);
            var cameraComponent = this.getComponent(Camera);
            var camera = cameraComponent.camera;
            camera.pipelineSettings = this._settings;
          }
        }, {
          key: "onDisable",
          value: function onDisable() {
            var cameraComponent = this.getComponent(Camera);
            var camera = cameraComponent.camera;
            if (camera) {
              camera.pipelineSettings = null;
            }
          }
        }, {
          key: "editorPreview",
          get: function get() {
            return this._editorPreview;
          },
          set: function set(v) {
            this._editorPreview = v;
          }
        }, {
          key: "_tryEnableEditorPreview",
          value: function _tryEnableEditorPreview() {
            if (rendering === undefined) {
              return;
            }
            if (this._editorPreview) {
              rendering.setEditorPipelineSettings(this._settings);
            } else {
              this._disableEditorPreview();
            }
          }
        }, {
          key: "_disableEditorPreview",
          value: function _disableEditorPreview() {
            if (rendering === undefined) {
              return;
            }
            var current = rendering.getEditorPipelineSettings();
            if (current === this._settings) {
              rendering.setEditorPipelineSettings(null);
            }
          }

          // MSAA
        }, {
          key: "MsaaEnable",
          get: function get() {
            return this._settings.msaa.enabled;
          },
          set: function set(value) {
            this._settings.msaa.enabled = value;
          }
        }, {
          key: "msaaSampleCount",
          get: function get() {
            return this._settings.msaa.sampleCount;
          }

          // Shading Scale
          ,

          set: function set(value) {
            value = Math.pow(2, Math.ceil(Math.log2(Math.max(value, 2))));
            value = Math.min(value, 4);
            this._settings.msaa.sampleCount = value;
          }
        }, {
          key: "shadingScaleEnable",
          get: function get() {
            return this._settings.enableShadingScale;
          },
          set: function set(value) {
            this._settings.enableShadingScale = value;
          }
        }, {
          key: "shadingScale",
          get: function get() {
            return this._settings.shadingScale;
          }

          // Bloom
          ,

          set: function set(value) {
            this._settings.shadingScale = value;
          }
        }, {
          key: "bloomEnable",
          get: function get() {
            return this._settings.bloom.enabled;
          },
          set: function set(value) {
            this._settings.bloom.enabled = value;
          }
        }, {
          key: "bloomType",
          get: function get() {
            return this._settings.bloom.type;
          },
          set: function set(value) {
            this._settings.bloom.type = value;
          }
        }, {
          key: "kawaseBloomMaterial",
          get: function get() {
            return this._settings.bloom.kawaseFilterMaterial;
          },
          set: function set(value) {
            if (this._settings.bloom.kawaseFilterMaterial === value) {
              return;
            }
            this._settings.bloom.kawaseFilterMaterial = value;
          }
        }, {
          key: "mipmapBloomMaterial",
          get: function get() {
            return this._settings.bloom.mipmapFilterMaterial;
          },
          set: function set(value) {
            if (this._settings.bloom.mipmapFilterMaterial === value) {
              return;
            }
            this._settings.bloom.mipmapFilterMaterial = value;
          }
        }, {
          key: "bloomEnableAlphaMask",
          get: function get() {
            return this._settings.bloom.enableAlphaMask;
          },
          set: function set(value) {
            this._settings.bloom.enableAlphaMask = value;
          }
        }, {
          key: "bloomIterations",
          get: function get() {
            return this._settings.bloom.iterations;
          },
          set: function set(value) {
            this._settings.bloom.iterations = value;
          }
        }, {
          key: "bloomThreshold",
          get: function get() {
            return this._settings.bloom.threshold;
          },
          set: function set(value) {
            this._settings.bloom.threshold = value;
          }
        }, {
          key: "bloomIntensity",
          get: function get() {
            return this._settings.bloom.intensity;
          }

          // Color Grading (LDR)
          ,

          set: function set(value) {
            this._settings.bloom.intensity = value;
          }
        }, {
          key: "colorGradingEnable",
          get: function get() {
            return this._settings.colorGrading.enabled;
          },
          set: function set(value) {
            this._settings.colorGrading.enabled = value;
          }
        }, {
          key: "colorGradingMaterial",
          get: function get() {
            return this._settings.colorGrading.material;
          },
          set: function set(value) {
            if (this._settings.colorGrading.material === value) {
              return;
            }
            this._settings.colorGrading.material = value;
          }
        }, {
          key: "colorGradingContribute",
          get: function get() {
            return this._settings.colorGrading.contribute;
          },
          set: function set(value) {
            this._settings.colorGrading.contribute = value;
          }
        }, {
          key: "colorGradingMap",
          get: function get() {
            return this._settings.colorGrading.colorGradingMap;
          }

          // FXAA
          ,

          set: function set(val) {
            this._settings.colorGrading.colorGradingMap = val;
          }
        }, {
          key: "fxaaEnable",
          get: function get() {
            return this._settings.fxaa.enabled;
          },
          set: function set(value) {
            this._settings.fxaa.enabled = value;
          }
        }, {
          key: "fxaaMaterial",
          get: function get() {
            return this._settings.fxaa.material;
          }

          // FSR
          ,

          set: function set(value) {
            if (this._settings.fxaa.material === value) {
              return;
            }
            this._settings.fxaa.material = value;
          }
        }, {
          key: "fsrEnable",
          get: function get() {
            return this._settings.fsr.enabled;
          },
          set: function set(value) {
            this._settings.fsr.enabled = value;
          }
        }, {
          key: "fsrMaterial",
          get: function get() {
            return this._settings.fsr.material;
          },
          set: function set(value) {
            if (this._settings.fsr.material === value) {
              return;
            }
            this._settings.fsr.material = value;
          }
        }, {
          key: "fsrSharpness",
          get: function get() {
            return this._settings.fsr.sharpness;
          },
          set: function set(value) {
            this._settings.fsr.sharpness = value;
          }
        }, {
          key: "toneMappingMaterial",
          get: function get() {
            return this._settings.toneMapping.material;
          },
          set: function set(value) {
            if (this._settings.toneMapping.material === value) {
              return;
            }
            this._settings.toneMapping.material = value;
          }
        }]);
        return BuiltinPipelineSettings;
      }(Component), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "_settings", [property], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return makePipelineSettings();
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "_editorPreview", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return false;
        }
      }), _applyDecoratedDescriptor(_class2.prototype, "editorPreview", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "editorPreview"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "MsaaEnable", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "MsaaEnable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "msaaSampleCount", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "msaaSampleCount"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadingScaleEnable", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "shadingScaleEnable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "shadingScale", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "shadingScale"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bloomEnable", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "bloomEnable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bloomType", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "bloomType"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "kawaseBloomMaterial", [_dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "kawaseBloomMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mipmapBloomMaterial", [_dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "mipmapBloomMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bloomEnableAlphaMask", [_dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "bloomEnableAlphaMask"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bloomIterations", [_dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "bloomIterations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bloomThreshold", [_dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "bloomThreshold"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "bloomIntensity", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "bloomIntensity"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "colorGradingEnable", [_dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "colorGradingEnable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "colorGradingMaterial", [_dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "colorGradingMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "colorGradingContribute", [_dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "colorGradingContribute"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "colorGradingMap", [_dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "colorGradingMap"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fxaaEnable", [_dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "fxaaEnable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fxaaMaterial", [_dec25], Object.getOwnPropertyDescriptor(_class2.prototype, "fxaaMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fsrEnable", [_dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "fsrEnable"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fsrMaterial", [_dec27], Object.getOwnPropertyDescriptor(_class2.prototype, "fsrMaterial"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fsrSharpness", [_dec28], Object.getOwnPropertyDescriptor(_class2.prototype, "fsrSharpness"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "toneMappingMaterial", [_dec29], Object.getOwnPropertyDescriptor(_class2.prototype, "toneMappingMaterial"), _class2.prototype)), _class2)) || _class) || _class) || _class) || _class) || _class));
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/builtin-pipeline-types.ts", ['cc'], function (exports) {
  var cclegacy, gfx, ccenum;
  return {
    setters: [function (module) {
      cclegacy = module.cclegacy;
      gfx = module.gfx;
      ccenum = module.ccenum;
    }],
    execute: function () {
      exports({
        fillRequiredBloom: fillRequiredBloom,
        fillRequiredColorGrading: fillRequiredColorGrading,
        fillRequiredFSR: fillRequiredFSR,
        fillRequiredFXAA: fillRequiredFXAA,
        fillRequiredHBAO: fillRequiredHBAO,
        fillRequiredMSAA: fillRequiredMSAA,
        fillRequiredPipelineSettings: fillRequiredPipelineSettings,
        fillRequiredToneMapping: fillRequiredToneMapping,
        makeBloom: makeBloom,
        makeColorGrading: makeColorGrading,
        makeFSR: makeFSR,
        makeFXAA: makeFXAA,
        makeHBAO: makeHBAO,
        makeMSAA: makeMSAA,
        makePipelineSettings: makePipelineSettings,
        makeToneMapping: makeToneMapping
      });
      cclegacy._RF.push({}, "cbf30kCUX9A3K+QpVC6wnzx", "builtin-pipeline-types", undefined);
      var SampleCount = gfx.SampleCount;
      function makeMSAA() {
        return {
          enabled: false,
          sampleCount: SampleCount.X4
        };
      }
      function fillRequiredMSAA(value) {
        if (value.enabled === undefined) {
          value.enabled = false;
        }
        if (value.sampleCount === undefined) {
          value.sampleCount = SampleCount.X4;
        }
      }
      function makeHBAO() {
        return {
          enabled: false,
          radiusScale: 1,
          angleBiasDegree: 10,
          blurSharpness: 3,
          aoSaturation: 1,
          needBlur: false
        };
      }
      function fillRequiredHBAO(value) {
        if (value.enabled === undefined) {
          value.enabled = false;
        }
        if (value.radiusScale === undefined) {
          value.radiusScale = 1;
        }
        if (value.angleBiasDegree === undefined) {
          value.angleBiasDegree = 10;
        }
        if (value.blurSharpness === undefined) {
          value.blurSharpness = 3;
        }
        if (value.aoSaturation === undefined) {
          value.aoSaturation = 1;
        }
        if (value.needBlur === undefined) {
          value.needBlur = false;
        }
      }
      var BloomType = exports('BloomType', /*#__PURE__*/function (BloomType) {
        BloomType[BloomType["KawaseDualFilter"] = 0] = "KawaseDualFilter";
        BloomType[BloomType["MipmapFilter"] = 1] = "MipmapFilter";
        return BloomType;
      }({}));
      ccenum(BloomType);
      function makeBloom() {
        return {
          enabled: false,
          type: BloomType.KawaseDualFilter,
          material: null,
          kawaseFilterMaterial: null,
          mipmapFilterMaterial: null,
          enableAlphaMask: false,
          iterations: 3,
          threshold: 0.8,
          intensity: 1
        };
      }
      function fillRequiredBloom(value) {
        if (value.enabled === undefined) {
          value.enabled = false;
        }
        if (value.type === undefined) {
          value.type = BloomType.KawaseDualFilter;
        }
        if (value.material === undefined) {
          value.material = null;
        }
        if (value.kawaseFilterMaterial === undefined) {
          value.kawaseFilterMaterial = value.material || null;
        }
        if (value.mipmapFilterMaterial === undefined) {
          value.mipmapFilterMaterial = null;
        }
        if (value.enableAlphaMask === undefined) {
          value.enableAlphaMask = false;
        }
        if (value.iterations === undefined) {
          value.iterations = 3;
        }
        if (value.threshold === undefined) {
          value.threshold = 0.8;
        }
        if (value.intensity === undefined) {
          value.intensity = 1;
        }
      }
      function makeColorGrading() {
        return {
          enabled: false,
          material: null,
          contribute: 1,
          colorGradingMap: null
        };
      }
      function fillRequiredColorGrading(value) {
        if (value.enabled === undefined) {
          value.enabled = false;
        }
        if (value.material === undefined) {
          value.material = null;
        }
        if (value.contribute === undefined) {
          value.contribute = 1;
        }
        if (value.colorGradingMap === undefined) {
          value.colorGradingMap = null;
        }
      }
      function makeFSR() {
        return {
          enabled: false,
          material: null,
          sharpness: 0.8
        };
      }
      function fillRequiredFSR(value) {
        if (value.enabled === undefined) {
          value.enabled = false;
        }
        if (value.material === undefined) {
          value.material = null;
        }
        if (value.sharpness === undefined) {
          value.sharpness = 0.8;
        }
      }
      function makeFXAA() {
        return {
          enabled: false,
          material: null
        };
      }
      function fillRequiredFXAA(value) {
        if (value.enabled === undefined) {
          value.enabled = false;
        }
        if (value.material === undefined) {
          value.material = null;
        }
      }
      function makeToneMapping() {
        return {
          material: null
        };
      }
      function fillRequiredToneMapping(value) {
        if (value.material === undefined) {
          value.material = null;
        }
      }
      function makePipelineSettings() {
        return {
          msaa: makeMSAA(),
          enableShadingScale: false,
          shadingScale: 0.5,
          bloom: makeBloom(),
          toneMapping: makeToneMapping(),
          colorGrading: makeColorGrading(),
          fsr: makeFSR(),
          fxaa: makeFXAA()
        };
      }
      function fillRequiredPipelineSettings(value) {
        if (!value.msaa) {
          value.msaa = makeMSAA();
        } else {
          fillRequiredMSAA(value.msaa);
        }
        if (value.enableShadingScale === undefined) {
          value.enableShadingScale = false;
        }
        if (value.shadingScale === undefined) {
          value.shadingScale = 0.5;
        }
        if (!value.bloom) {
          value.bloom = makeBloom();
        } else {
          fillRequiredBloom(value.bloom);
        }
        if (!value.toneMapping) {
          value.toneMapping = makeToneMapping();
        } else {
          fillRequiredToneMapping(value.toneMapping);
        }
        if (!value.colorGrading) {
          value.colorGrading = makeColorGrading();
        } else {
          fillRequiredColorGrading(value.colorGrading);
        }
        if (!value.fsr) {
          value.fsr = makeFSR();
        } else {
          fillRequiredFSR(value.fsr);
        }
        if (!value.fxaa) {
          value.fxaa = makeFXAA();
        } else {
          fillRequiredFXAA(value.fxaa);
        }
      }
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/builtin-pipeline.ts", ['./rollupPluginModLoBabelHelpers.js', 'cc', './env', './builtin-pipeline-types.ts'], function (exports) {
  var _createClass, _classCallCheck, _defineProperty, _createForOfIteratorHelper, cclegacy, geometry, gfx, renderer, rendering, Vec2, Vec4, Vec3, macro, assert, warn, clamp, Layers, PipelineEventType, sys, pipeline, Material, EDITOR, makePipelineSettings, BloomType;
  return {
    setters: [function (module) {
      _createClass = module.createClass;
      _classCallCheck = module.classCallCheck;
      _defineProperty = module.defineProperty;
      _createForOfIteratorHelper = module.createForOfIteratorHelper;
    }, function (module) {
      cclegacy = module.cclegacy;
      geometry = module.geometry;
      gfx = module.gfx;
      renderer = module.renderer;
      rendering = module.rendering;
      Vec2 = module.Vec2;
      Vec4 = module.Vec4;
      Vec3 = module.Vec3;
      macro = module.macro;
      assert = module.assert;
      warn = module.warn;
      clamp = module.clamp;
      Layers = module.Layers;
      PipelineEventType = module.PipelineEventType;
      sys = module.sys;
      pipeline = module.pipeline;
      Material = module.Material;
    }, function (module) {
      EDITOR = module.EDITOR;
    }, function (module) {
      makePipelineSettings = module.makePipelineSettings;
      BloomType = module.BloomType;
    }],
    execute: function () {
      exports('getPingPongRenderTarget', getPingPongRenderTarget);
      cclegacy._RF.push({}, "ff9b0GZzgRM/obMbHGfCNbk", "builtin-pipeline", undefined);
      var AABB = geometry.AABB,
        Sphere = geometry.Sphere,
        intersect = geometry.intersect;
      var ClearFlagBit = gfx.ClearFlagBit,
        Color = gfx.Color,
        Format = gfx.Format,
        FormatFeatureBit = gfx.FormatFeatureBit,
        LoadOp = gfx.LoadOp,
        StoreOp = gfx.StoreOp,
        TextureType = gfx.TextureType,
        Viewport = gfx.Viewport;
      var scene = renderer.scene;
      var CameraUsage = scene.CameraUsage,
        CSMLevel = scene.CSMLevel,
        LightType = scene.LightType;
      function forwardNeedClearColor(camera) {
        return !!(camera.clearFlag & (ClearFlagBit.COLOR | ClearFlagBit.STENCIL << 1));
      }
      function getCsmMainLightViewport(light, w, h, level, vp, screenSpaceSignY) {
        if (light.shadowFixedArea || light.csmLevel === CSMLevel.LEVEL_1) {
          vp.left = 0;
          vp.top = 0;
          vp.width = Math.trunc(w);
          vp.height = Math.trunc(h);
        } else {
          vp.left = Math.trunc(level % 2 * 0.5 * w);
          if (screenSpaceSignY > 0) {
            vp.top = Math.trunc((1 - Math.floor(level / 2)) * 0.5 * h);
          } else {
            vp.top = Math.trunc(Math.floor(level / 2) * 0.5 * h);
          }
          vp.width = Math.trunc(0.5 * w);
          vp.height = Math.trunc(0.5 * h);
        }
        vp.left = Math.max(0, vp.left);
        vp.top = Math.max(0, vp.top);
        vp.width = Math.max(1, vp.width);
        vp.height = Math.max(1, vp.height);
      }
      var PipelineConfigs = exports('PipelineConfigs', /*#__PURE__*/_createClass(function PipelineConfigs() {
        _classCallCheck(this, PipelineConfigs);
        _defineProperty(this, "isWeb", false);
        _defineProperty(this, "isWebGL1", false);
        _defineProperty(this, "isWebGL2", false);
        _defineProperty(this, "isWebGPU", false);
        _defineProperty(this, "isMobile", false);
        _defineProperty(this, "isHDR", false);
        _defineProperty(this, "useFloatOutput", false);
        _defineProperty(this, "toneMappingType", 0);
        // 0: ACES, 1: None
        _defineProperty(this, "shadowEnabled", false);
        _defineProperty(this, "shadowMapFormat", Format.R32F);
        _defineProperty(this, "shadowMapSize", new Vec2(1, 1));
        _defineProperty(this, "usePlanarShadow", false);
        _defineProperty(this, "screenSpaceSignY", 1);
        _defineProperty(this, "supportDepthSample", false);
        _defineProperty(this, "mobileMaxSpotLightShadowMaps", 1);
        _defineProperty(this, "platform", new Vec4(0, 0, 0, 0));
      }));
      function setupPipelineConfigs(ppl, configs) {
        var sampleFeature = FormatFeatureBit.SAMPLED_TEXTURE | FormatFeatureBit.LINEAR_FILTER;
        var device = ppl.device;
        // Platform
        configs.isWeb = !sys.isNative;
        configs.isWebGL1 = device.gfxAPI === gfx.API.WEBGL;
        configs.isWebGL2 = device.gfxAPI === gfx.API.WEBGL2;
        configs.isWebGPU = device.gfxAPI === gfx.API.WEBGPU;
        configs.isMobile = sys.isMobile;

        // Rendering
        configs.isHDR = ppl.pipelineSceneData.isHDR; // Has tone mapping
        configs.useFloatOutput = ppl.getMacroBool('CC_USE_FLOAT_OUTPUT');
        configs.toneMappingType = ppl.pipelineSceneData.postSettings.toneMappingType;
        // Shadow
        var shadowInfo = ppl.pipelineSceneData.shadows;
        configs.shadowEnabled = shadowInfo.enabled;
        configs.shadowMapFormat = pipeline.supportsR32FloatTexture(ppl.device) ? Format.R32F : Format.RGBA8;
        configs.shadowMapSize.set(shadowInfo.size);
        configs.usePlanarShadow = shadowInfo.enabled && shadowInfo.type === renderer.scene.ShadowType.Planar;
        // Device
        configs.screenSpaceSignY = ppl.device.capabilities.screenSpaceSignY;
        configs.supportDepthSample = (ppl.device.getFormatFeatures(Format.DEPTH_STENCIL) & sampleFeature) === sampleFeature;
        // Constants
        var screenSpaceSignY = device.capabilities.screenSpaceSignY;
        configs.platform.x = configs.isMobile ? 1.0 : 0.0;
        configs.platform.w = screenSpaceSignY * 0.5 + 0.5 << 1 | device.capabilities.clipSpaceSignY * 0.5 + 0.5;
      }
      var defaultSettings = makePipelineSettings();
      var CameraConfigs = exports('CameraConfigs', /*#__PURE__*/_createClass(function CameraConfigs() {
        _classCallCheck(this, CameraConfigs);
        _defineProperty(this, "settings", defaultSettings);
        // Window
        _defineProperty(this, "isMainGameWindow", false);
        _defineProperty(this, "renderWindowId", 0);
        // Camera
        _defineProperty(this, "colorName", '');
        _defineProperty(this, "depthStencilName", '');
        // Pipeline
        _defineProperty(this, "enableFullPipeline", false);
        _defineProperty(this, "enableProfiler", false);
        _defineProperty(this, "remainingPasses", 0);
        // Shading Scale
        _defineProperty(this, "enableShadingScale", false);
        _defineProperty(this, "shadingScale", 1.0);
        _defineProperty(this, "nativeWidth", 1);
        _defineProperty(this, "nativeHeight", 1);
        _defineProperty(this, "width", 1);
        // Scaled width
        _defineProperty(this, "height", 1);
        // Scaled height
        // Radiance
        _defineProperty(this, "enableHDR", false);
        _defineProperty(this, "radianceFormat", gfx.Format.RGBA8);
        // Tone Mapping
        _defineProperty(this, "copyAndTonemapMaterial", null);
        // Depth
        /** @en mutable */
        _defineProperty(this, "enableStoreSceneDepth", false);
      }));
      var sClearColorTransparentBlack = new Color(0, 0, 0, 0);
      function sortPipelinePassBuildersByConfigOrder(passBuilders) {
        passBuilders.sort(function (a, b) {
          return a.getConfigOrder() - b.getConfigOrder();
        });
      }
      function sortPipelinePassBuildersByRenderOrder(passBuilders) {
        passBuilders.sort(function (a, b) {
          return a.getRenderOrder() - b.getRenderOrder();
        });
      }
      function addCopyToScreenPass(ppl, pplConfigs, cameraConfigs, input) {
        assert(!!cameraConfigs.copyAndTonemapMaterial);
        var pass = ppl.addRenderPass(cameraConfigs.nativeWidth, cameraConfigs.nativeHeight, 'cc-tone-mapping');
        pass.addRenderTarget(cameraConfigs.colorName, LoadOp.CLEAR, StoreOp.STORE, sClearColorTransparentBlack);
        pass.addTexture(input, 'inputTexture');
        pass.addQueue(rendering.QueueHint.OPAQUE).addFullscreenQuad(cameraConfigs.copyAndTonemapMaterial, 1);
        return pass;
      }
      function getPingPongRenderTarget(prevName, prefix, id) {
        if (prevName.startsWith(prefix)) {
          return "".concat(prefix).concat(1 - Number(prevName.charAt(prefix.length)), "_").concat(id);
        } else {
          return "".concat(prefix, "0_").concat(id);
        }
      }
      var ForwardLighting = /*#__PURE__*/function () {
        function ForwardLighting() {
          _classCallCheck(this, ForwardLighting);
          // Active lights
          _defineProperty(this, "lights", []);
          // Active spot lights with shadows (Mutually exclusive with `lights`)
          _defineProperty(this, "shadowEnabledSpotLights", []);
          // Internal cached resources
          _defineProperty(this, "_sphere", Sphere.create(0, 0, 0, 1));
          _defineProperty(this, "_boundingBox", new AABB());
          _defineProperty(this, "_rangedDirLightBoundingBox", new AABB(0.0, 0.0, 0.0, 0.5, 0.5, 0.5));
        }
        _createClass(ForwardLighting, [{
          key: "cullLights",
          value:
          // ----------------------------------------------------------------
          // Interface
          // ----------------------------------------------------------------
          function cullLights(scene, frustum, cameraPos) {
            // TODO(zhouzhenglong): Make light culling native
            this.lights.length = 0;
            this.shadowEnabledSpotLights.length = 0;
            // spot lights
            var _iterator = _createForOfIteratorHelper(scene.spotLights),
              _step;
            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var light = _step.value;
                if (light.baked) {
                  continue;
                }
                Sphere.set(this._sphere, light.position.x, light.position.y, light.position.z, light.range);
                if (intersect.sphereFrustum(this._sphere, frustum)) {
                  if (light.shadowEnabled) {
                    this.shadowEnabledSpotLights.push(light);
                  } else {
                    this.lights.push(light);
                  }
                }
              }
              // sphere lights
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }
            var _iterator2 = _createForOfIteratorHelper(scene.sphereLights),
              _step2;
            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var _light = _step2.value;
                if (_light.baked) {
                  continue;
                }
                Sphere.set(this._sphere, _light.position.x, _light.position.y, _light.position.z, _light.range);
                if (intersect.sphereFrustum(this._sphere, frustum)) {
                  this.lights.push(_light);
                }
              }
              // point lights
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }
            var _iterator3 = _createForOfIteratorHelper(scene.pointLights),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var _light2 = _step3.value;
                if (_light2.baked) {
                  continue;
                }
                Sphere.set(this._sphere, _light2.position.x, _light2.position.y, _light2.position.z, _light2.range);
                if (intersect.sphereFrustum(this._sphere, frustum)) {
                  this.lights.push(_light2);
                }
              }
              // ranged dir lights
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            var _iterator4 = _createForOfIteratorHelper(scene.rangedDirLights),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var _light3 = _step4.value;
                AABB.transform(this._boundingBox, this._rangedDirLightBoundingBox, _light3.node.getWorldMatrix());
                if (intersect.aabbFrustum(this._boundingBox, frustum)) {
                  this.lights.push(_light3);
                }
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
            if (cameraPos) {
              this.shadowEnabledSpotLights.sort(function (lhs, rhs) {
                return Vec3.squaredDistance(cameraPos, lhs.position) - Vec3.squaredDistance(cameraPos, rhs.position);
              });
            }
          }
        }, {
          key: "_addLightQueues",
          value: function _addLightQueues(camera, pass) {
            var _iterator5 = _createForOfIteratorHelper(this.lights),
              _step5;
            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                var light = _step5.value;
                var queue = pass.addQueue(rendering.QueueHint.BLEND, 'forward-add');
                switch (light.type) {
                  case LightType.SPHERE:
                    queue.name = 'sphere-light';
                    break;
                  case LightType.SPOT:
                    queue.name = 'spot-light';
                    break;
                  case LightType.POINT:
                    queue.name = 'point-light';
                    break;
                  case LightType.RANGED_DIRECTIONAL:
                    queue.name = 'ranged-directional-light';
                    break;
                  default:
                    queue.name = 'unknown-light';
                }
                queue.addScene(camera, rendering.SceneFlags.BLEND, light);
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }
          }
        }, {
          key: "addSpotlightShadowPasses",
          value: function addSpotlightShadowPasses(ppl, camera, maxNumShadowMaps) {
            var i = 0;
            var _iterator6 = _createForOfIteratorHelper(this.shadowEnabledSpotLights),
              _step6;
            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                var light = _step6.value;
                var shadowMapSize = ppl.pipelineSceneData.shadows.size;
                var shadowPass = ppl.addRenderPass(shadowMapSize.x, shadowMapSize.y, 'default');
                shadowPass.name = "SpotLightShadowPass".concat(i);
                shadowPass.addRenderTarget("SpotShadowMap".concat(i), LoadOp.CLEAR, StoreOp.STORE, new Color(1, 1, 1, 1));
                shadowPass.addDepthStencil("SpotShadowDepth".concat(i), LoadOp.CLEAR, StoreOp.DISCARD);
                shadowPass.addQueue(rendering.QueueHint.NONE, 'shadow-caster').addScene(camera, rendering.SceneFlags.OPAQUE | rendering.SceneFlags.MASK | rendering.SceneFlags.SHADOW_CASTER).useLightFrustum(light);
                ++i;
                if (i >= maxNumShadowMaps) {
                  break;
                }
              }
            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }
          }
        }, {
          key: "addLightQueues",
          value: function addLightQueues(pass, camera, maxNumShadowMaps) {
            this._addLightQueues(camera, pass);
            var i = 0;
            var _iterator7 = _createForOfIteratorHelper(this.shadowEnabledSpotLights),
              _step7;
            try {
              for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                var light = _step7.value;
                // Add spot-light pass
                // Save last RenderPass to the `pass` variable
                // TODO(zhouzhenglong): Fix per queue addTexture
                pass.addTexture("SpotShadowMap".concat(i), 'cc_spotShadowMap');
                var queue = pass.addQueue(rendering.QueueHint.BLEND, 'forward-add');
                queue.addScene(camera, rendering.SceneFlags.BLEND, light);
                ++i;
                if (i >= maxNumShadowMaps) {
                  break;
                }
              }
            } catch (err) {
              _iterator7.e(err);
            } finally {
              _iterator7.f();
            }
          }

          // Notice: ForwardLighting cannot handle a lot of lights.
          // If there are too many lights, the performance will be very poor.
          // If many lights are needed, please implement a forward+ or deferred rendering pipeline.
        }, {
          key: "addLightPasses",
          value: function addLightPasses(colorName, depthStencilName, depthStencilStoreOp, id,
          // window id
          width, height, camera, viewport, ppl, pass) {
            this._addLightQueues(camera, pass);
            var count = 0;
            var shadowMapSize = ppl.pipelineSceneData.shadows.size;
            var _iterator8 = _createForOfIteratorHelper(this.shadowEnabledSpotLights),
              _step8;
            try {
              for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                var light = _step8.value;
                var shadowPass = ppl.addRenderPass(shadowMapSize.x, shadowMapSize.y, 'default');
                shadowPass.name = 'SpotlightShadowPass';
                // Reuse csm shadow map
                shadowPass.addRenderTarget("ShadowMap".concat(id), LoadOp.CLEAR, StoreOp.STORE, new Color(1, 1, 1, 1));
                shadowPass.addDepthStencil("ShadowDepth".concat(id), LoadOp.CLEAR, StoreOp.DISCARD);
                shadowPass.addQueue(rendering.QueueHint.NONE, 'shadow-caster').addScene(camera, rendering.SceneFlags.OPAQUE | rendering.SceneFlags.MASK | rendering.SceneFlags.SHADOW_CASTER).useLightFrustum(light);

                // Add spot-light pass
                // Save last RenderPass to the `pass` variable
                ++count;
                var storeOp = count === this.shadowEnabledSpotLights.length ? depthStencilStoreOp : StoreOp.STORE;
                pass = ppl.addRenderPass(width, height, 'default');
                pass.name = 'SpotlightWithShadowMap';
                pass.setViewport(viewport);
                pass.addRenderTarget(colorName, LoadOp.LOAD);
                pass.addDepthStencil(depthStencilName, LoadOp.LOAD, storeOp);
                pass.addTexture("ShadowMap".concat(id), 'cc_spotShadowMap');
                var queue = pass.addQueue(rendering.QueueHint.BLEND, 'forward-add');
                queue.addScene(camera, rendering.SceneFlags.BLEND, light);
              }
            } catch (err) {
              _iterator8.e(err);
            } finally {
              _iterator8.f();
            }
            return pass;
          }
        }, {
          key: "isMultipleLightPassesNeeded",
          value: function isMultipleLightPassesNeeded() {
            return this.shadowEnabledSpotLights.length > 0;
          }
        }]);
        return ForwardLighting;
      }();
      var BuiltinForwardPassBuilder = exports('BuiltinForwardPassBuilder', /*#__PURE__*/function () {
        function BuiltinForwardPassBuilder() {
          _classCallCheck(this, BuiltinForwardPassBuilder);
          _defineProperty(this, "forwardLighting", new ForwardLighting());
          _defineProperty(this, "_viewport", new Viewport());
          _defineProperty(this, "_clearColor", new Color(0, 0, 0, 1));
          _defineProperty(this, "_reflectionProbeClearColor", new Vec3(0, 0, 0));
        }
        _createClass(BuiltinForwardPassBuilder, [{
          key: "getConfigOrder",
          value: function getConfigOrder() {
            return BuiltinForwardPassBuilder.ConfigOrder;
          }
        }, {
          key: "getRenderOrder",
          value: function getRenderOrder() {
            return BuiltinForwardPassBuilder.RenderOrder;
          }
        }, {
          key: "configCamera",
          value: function configCamera(camera, pipelineConfigs, cameraConfigs) {
            // Shadow
            cameraConfigs.enableMainLightShadowMap = pipelineConfigs.shadowEnabled && !pipelineConfigs.usePlanarShadow && !!camera.scene && !!camera.scene.mainLight && camera.scene.mainLight.shadowEnabled;
            cameraConfigs.enableMainLightPlanarShadowMap = pipelineConfigs.shadowEnabled && pipelineConfigs.usePlanarShadow && !!camera.scene && !!camera.scene.mainLight && camera.scene.mainLight.shadowEnabled;

            // Reflection Probe
            cameraConfigs.enablePlanarReflectionProbe = cameraConfigs.isMainGameWindow || camera.cameraUsage === CameraUsage.SCENE_VIEW || camera.cameraUsage === CameraUsage.GAME_VIEW;

            // MSAA
            cameraConfigs.enableMSAA = cameraConfigs.settings.msaa.enabled && (!pipelineConfigs.isWebGL2 || cameraConfigs.remainingPasses > 0 || !macro.ENABLE_WEBGL_ANTIALIAS && macro.ENABLE_TRANSPARENT_CANVAS) && !cameraConfigs.enableStoreSceneDepth // Cannot store MS depth, resolve depth is also not cross-platform
            && !pipelineConfigs.isWebGL1;

            // Forward rendering (Depend on MSAA and TBR)
            cameraConfigs.enableSingleForwardPass = pipelineConfigs.isMobile || cameraConfigs.enableMSAA;
            ++cameraConfigs.remainingPasses;
          }
        }, {
          key: "windowResize",
          value: function windowResize(ppl, pplConfigs, cameraConfigs, window, camera, nativeWidth, nativeHeight) {
            var ResourceFlags = rendering.ResourceFlags;
            var ResourceResidency = rendering.ResourceResidency;
            var id = window.renderWindowId;
            var settings = cameraConfigs.settings;
            var width = cameraConfigs.enableShadingScale ? Math.max(Math.floor(nativeWidth * cameraConfigs.shadingScale), 1) : nativeWidth;
            var height = cameraConfigs.enableShadingScale ? Math.max(Math.floor(nativeHeight * cameraConfigs.shadingScale), 1) : nativeHeight;

            // MsaaRadiance
            if (cameraConfigs.enableMSAA) {
              // Notice: We never store multisample results.
              // These samples are always resolved and discarded at the end of the render pass.
              // So the ResourceResidency should be MEMORYLESS.
              if (cameraConfigs.enableHDR) {
                ppl.addTexture("MsaaRadiance".concat(id), TextureType.TEX2D, cameraConfigs.radianceFormat, width, height, 1, 1, 1, settings.msaa.sampleCount, ResourceFlags.COLOR_ATTACHMENT, ResourceResidency.MEMORYLESS);
              } else {
                ppl.addTexture("MsaaRadiance".concat(id), TextureType.TEX2D, Format.RGBA8, width, height, 1, 1, 1, settings.msaa.sampleCount, ResourceFlags.COLOR_ATTACHMENT, ResourceResidency.MEMORYLESS);
              }
              ppl.addTexture("MsaaDepthStencil".concat(id), TextureType.TEX2D, Format.DEPTH_STENCIL, width, height, 1, 1, 1, settings.msaa.sampleCount, ResourceFlags.DEPTH_STENCIL_ATTACHMENT, ResourceResidency.MEMORYLESS);
            }

            // Mainlight ShadowMap
            ppl.addRenderTarget("ShadowMap".concat(id), pplConfigs.shadowMapFormat, pplConfigs.shadowMapSize.x, pplConfigs.shadowMapSize.y);
            ppl.addDepthStencil("ShadowDepth".concat(id), Format.DEPTH_STENCIL, pplConfigs.shadowMapSize.x, pplConfigs.shadowMapSize.y);

            // Spot-light shadow maps
            if (cameraConfigs.enableSingleForwardPass) {
              var count = pplConfigs.mobileMaxSpotLightShadowMaps;
              for (var i = 0; i !== count; ++i) {
                ppl.addRenderTarget("SpotShadowMap".concat(i), pplConfigs.shadowMapFormat, pplConfigs.shadowMapSize.x, pplConfigs.shadowMapSize.y);
                ppl.addDepthStencil("SpotShadowDepth".concat(i), Format.DEPTH_STENCIL, pplConfigs.shadowMapSize.x, pplConfigs.shadowMapSize.y);
              }
            }
          }
        }, {
          key: "setup",
          value: function setup(ppl, pplConfigs, cameraConfigs, camera, context) {
            // Add global constants
            ppl.setVec4('g_platform', pplConfigs.platform);
            var id = camera.window.renderWindowId;
            var scene = camera.scene;
            var mainLight = scene.mainLight;
            --cameraConfigs.remainingPasses;
            assert(cameraConfigs.remainingPasses >= 0);

            // Forward Lighting (Light Culling)
            this.forwardLighting.cullLights(scene, camera.frustum);

            // Main Directional light CSM Shadow Map
            if (cameraConfigs.enableMainLightShadowMap) {
              assert(!!mainLight);
              this._addCascadedShadowMapPass(ppl, pplConfigs, id, mainLight, camera);
            }

            // Spot light shadow maps (Mobile or MSAA)
            if (cameraConfigs.enableSingleForwardPass) {
              // Currently, only support 1 spot light with shadow map on mobile platform.
              // TODO(zhouzhenglong): Relex this limitation.
              this.forwardLighting.addSpotlightShadowPasses(ppl, camera, pplConfigs.mobileMaxSpotLightShadowMaps);
            }
            this._tryAddReflectionProbePasses(ppl, cameraConfigs, id, mainLight, camera.scene);
            if (cameraConfigs.remainingPasses > 0 || cameraConfigs.enableShadingScale) {
              context.colorName = cameraConfigs.enableShadingScale ? "ScaledRadiance0_".concat(id) : "Radiance0_".concat(id);
              context.depthStencilName = cameraConfigs.enableShadingScale ? "ScaledSceneDepth_".concat(id) : "SceneDepth_".concat(id);
            } else {
              context.colorName = cameraConfigs.colorName;
              context.depthStencilName = cameraConfigs.depthStencilName;
            }
            var pass = this._addForwardRadiancePasses(ppl, pplConfigs, cameraConfigs, id, camera, cameraConfigs.width, cameraConfigs.height, mainLight, context.colorName, context.depthStencilName, !cameraConfigs.enableMSAA, cameraConfigs.enableStoreSceneDepth ? StoreOp.STORE : StoreOp.DISCARD);
            if (!cameraConfigs.enableStoreSceneDepth) {
              context.depthStencilName = '';
            }
            if (cameraConfigs.remainingPasses === 0 && cameraConfigs.enableShadingScale) {
              return addCopyToScreenPass(ppl, pplConfigs, cameraConfigs, context.colorName);
            } else {
              return pass;
            }
          }
        }, {
          key: "_addCascadedShadowMapPass",
          value: function _addCascadedShadowMapPass(ppl, pplConfigs, id, light, camera) {
            var QueueHint = rendering.QueueHint;
            var SceneFlags = rendering.SceneFlags;
            // ----------------------------------------------------------------
            // Dynamic states
            // ----------------------------------------------------------------
            var shadowSize = ppl.pipelineSceneData.shadows.size;
            var width = shadowSize.x;
            var height = shadowSize.y;
            var viewport = this._viewport;
            viewport.left = viewport.top = 0;
            viewport.width = width;
            viewport.height = height;

            // ----------------------------------------------------------------
            // CSM Shadow Map
            // ----------------------------------------------------------------
            var pass = ppl.addRenderPass(width, height, 'default');
            pass.name = 'CascadedShadowMap';
            pass.addRenderTarget("ShadowMap".concat(id), LoadOp.CLEAR, StoreOp.STORE, new Color(1, 1, 1, 1));
            pass.addDepthStencil("ShadowDepth".concat(id), LoadOp.CLEAR, StoreOp.DISCARD);
            var csmLevel = ppl.pipelineSceneData.csmSupported ? light.csmLevel : 1;

            // Add shadow map viewports
            for (var level = 0; level !== csmLevel; ++level) {
              getCsmMainLightViewport(light, width, height, level, this._viewport, pplConfigs.screenSpaceSignY);
              var queue = pass.addQueue(QueueHint.NONE, 'shadow-caster');
              if (!pplConfigs.isWebGPU) {
                // Temporary workaround for WebGPU
                queue.setViewport(this._viewport);
              }
              queue.addScene(camera, SceneFlags.OPAQUE | SceneFlags.MASK | SceneFlags.SHADOW_CASTER).useLightFrustum(light, level);
            }
          }
        }, {
          key: "_tryAddReflectionProbePasses",
          value: function _tryAddReflectionProbePasses(ppl, cameraConfigs, id, mainLight, scene) {
            var reflectionProbeManager = cclegacy.internal.reflectionProbeManager;
            if (!reflectionProbeManager) {
              return;
            }
            var ResourceResidency = rendering.ResourceResidency;
            var probes = reflectionProbeManager.getProbes();
            var maxProbeCount = 4;
            var probeID = 0;
            var _iterator9 = _createForOfIteratorHelper(probes),
              _step9;
            try {
              for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                var probe = _step9.value;
                if (!probe.needRender) {
                  continue;
                }
                var area = probe.renderArea();
                var width = Math.max(Math.floor(area.x), 1);
                var height = Math.max(Math.floor(area.y), 1);
                if (probe.probeType === renderer.scene.ProbeType.PLANAR) {
                  if (!cameraConfigs.enablePlanarReflectionProbe) {
                    continue;
                  }
                  var window = probe.realtimePlanarTexture.window;
                  var colorName = "PlanarProbeRT".concat(probeID);
                  var depthStencilName = "PlanarProbeDS".concat(probeID);
                  // ProbeResource
                  ppl.addRenderWindow(colorName, cameraConfigs.radianceFormat, width, height, window);
                  ppl.addDepthStencil(depthStencilName, gfx.Format.DEPTH_STENCIL, width, height, ResourceResidency.MEMORYLESS);

                  // Rendering
                  var probePass = ppl.addRenderPass(width, height, 'default');
                  probePass.name = "PlanarReflectionProbe".concat(probeID);
                  this._buildReflectionProbePass(probePass, cameraConfigs, id, probe.camera, colorName, depthStencilName, mainLight, scene);
                } else {
                  var faceIdx, _window, _colorName, _depthStencilName, _probePass;
                  if (EDITOR) ;
                }
                ++probeID;
                if (probeID === maxProbeCount) {
                  break;
                }
              }
            } catch (err) {
              _iterator9.e(err);
            } finally {
              _iterator9.f();
            }
          }
        }, {
          key: "_buildReflectionProbePass",
          value: function _buildReflectionProbePass(pass, cameraConfigs, id, camera, colorName, depthStencilName, mainLight) {
            var scene = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : null;
            var QueueHint = rendering.QueueHint;
            var SceneFlags = rendering.SceneFlags;
            // set viewport
            var colorStoreOp = cameraConfigs.enableMSAA ? StoreOp.DISCARD : StoreOp.STORE;

            // bind output render target
            if (forwardNeedClearColor(camera)) {
              this._reflectionProbeClearColor.x = camera.clearColor.x;
              this._reflectionProbeClearColor.y = camera.clearColor.y;
              this._reflectionProbeClearColor.z = camera.clearColor.z;
              var clearColor = rendering.packRGBE(this._reflectionProbeClearColor);
              this._clearColor.x = clearColor.x;
              this._clearColor.y = clearColor.y;
              this._clearColor.z = clearColor.z;
              this._clearColor.w = clearColor.w;
              pass.addRenderTarget(colorName, LoadOp.CLEAR, colorStoreOp, this._clearColor);
            } else {
              pass.addRenderTarget(colorName, LoadOp.LOAD, colorStoreOp);
            }

            // bind depth stencil buffer
            if (camera.clearFlag & ClearFlagBit.DEPTH_STENCIL) {
              pass.addDepthStencil(depthStencilName, LoadOp.CLEAR, StoreOp.DISCARD, camera.clearDepth, camera.clearStencil, camera.clearFlag & ClearFlagBit.DEPTH_STENCIL);
            } else {
              pass.addDepthStencil(depthStencilName, LoadOp.LOAD, StoreOp.DISCARD);
            }

            // Set shadow map if enabled
            if (cameraConfigs.enableMainLightShadowMap) {
              pass.addTexture("ShadowMap".concat(id), 'cc_shadowMap');
            }

            // TODO(zhouzhenglong): Separate OPAQUE and MASK queue

            // add opaque and mask queue
            pass.addQueue(QueueHint.NONE, 'reflect-map') // Currently we put OPAQUE and MASK into one queue, so QueueHint is NONE
            .addScene(camera, SceneFlags.OPAQUE | SceneFlags.MASK | SceneFlags.REFLECTION_PROBE, mainLight || undefined, scene ? scene : undefined);
          }
        }, {
          key: "_addForwardRadiancePasses",
          value: function _addForwardRadiancePasses(ppl, pplConfigs, cameraConfigs, id, camera, width, height, mainLight, colorName, depthStencilName) {
            var disableMSAA = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : false;
            var depthStencilStoreOp = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : StoreOp.DISCARD;
            var QueueHint = rendering.QueueHint;
            var SceneFlags = rendering.SceneFlags;
            // ----------------------------------------------------------------
            // Dynamic states
            // ----------------------------------------------------------------
            // Prepare camera clear color
            var clearColor = camera.clearColor; // Reduce C++/TS interop
            this._clearColor.x = clearColor.x;
            this._clearColor.y = clearColor.y;
            this._clearColor.z = clearColor.z;
            this._clearColor.w = clearColor.w;

            // Prepare camera viewport
            var viewport = camera.viewport; // Reduce C++/TS interop
            this._viewport.left = Math.round(viewport.x * width);
            this._viewport.top = Math.round(viewport.y * height);
            // Here we must use camera.viewport.width instead of camera.viewport.z, which
            // is undefined on native platform. The same as camera.viewport.height.
            this._viewport.width = Math.max(Math.round(viewport.width * width), 1);
            this._viewport.height = Math.max(Math.round(viewport.height * height), 1);

            // MSAA
            var enableMSAA = !disableMSAA && cameraConfigs.enableMSAA;
            assert(!enableMSAA || cameraConfigs.enableSingleForwardPass);

            // ----------------------------------------------------------------
            // Forward Lighting (Main Directional Light)
            // ----------------------------------------------------------------
            var pass = cameraConfigs.enableSingleForwardPass ? this._addForwardSingleRadiancePass(ppl, pplConfigs, cameraConfigs, id, camera, enableMSAA, width, height, mainLight, colorName, depthStencilName, depthStencilStoreOp) : this._addForwardMultipleRadiancePasses(ppl, cameraConfigs, id, camera, width, height, mainLight, colorName, depthStencilName, depthStencilStoreOp);

            // Planar Shadow
            if (cameraConfigs.enableMainLightPlanarShadowMap) {
              this._addPlanarShadowQueue(camera, mainLight, pass);
            }

            // ----------------------------------------------------------------
            // Forward Lighting (Blend)
            // ----------------------------------------------------------------
            // Add transparent queue

            var sceneFlags = SceneFlags.BLEND | (camera.geometryRenderer ? SceneFlags.GEOMETRY : SceneFlags.NONE);
            pass.addQueue(QueueHint.BLEND).addScene(camera, sceneFlags, mainLight || undefined);
            return pass;
          }
        }, {
          key: "_addForwardSingleRadiancePass",
          value: function _addForwardSingleRadiancePass(ppl, pplConfigs, cameraConfigs, id, camera, enableMSAA, width, height, mainLight, colorName, depthStencilName, depthStencilStoreOp) {
            assert(cameraConfigs.enableSingleForwardPass);
            // ----------------------------------------------------------------
            // Forward Lighting (Main Directional Light)
            // ----------------------------------------------------------------
            var pass;
            if (enableMSAA) {
              var msaaRadianceName = "MsaaRadiance".concat(id);
              var msaaDepthStencilName = "MsaaDepthStencil".concat(id);
              var sampleCount = cameraConfigs.settings.msaa.sampleCount;
              var msPass = ppl.addMultisampleRenderPass(width, height, sampleCount, 0, 'default');
              msPass.name = 'MsaaForwardPass';

              // MSAA always discards depth stencil
              this._buildForwardMainLightPass(msPass, cameraConfigs, id, camera, msaaRadianceName, msaaDepthStencilName, StoreOp.DISCARD, mainLight);
              msPass.resolveRenderTarget(msaaRadianceName, colorName);
              pass = msPass;
            } else {
              pass = ppl.addRenderPass(width, height, 'default');
              pass.name = 'ForwardPass';
              this._buildForwardMainLightPass(pass, cameraConfigs, id, camera, colorName, depthStencilName, depthStencilStoreOp, mainLight);
            }
            assert(pass !== undefined);

            // Forward Lighting (Additive Lights)
            this.forwardLighting.addLightQueues(pass, camera, pplConfigs.mobileMaxSpotLightShadowMaps);
            return pass;
          }
        }, {
          key: "_addForwardMultipleRadiancePasses",
          value: function _addForwardMultipleRadiancePasses(ppl, cameraConfigs, id, camera, width, height, mainLight, colorName, depthStencilName, depthStencilStoreOp) {
            assert(!cameraConfigs.enableSingleForwardPass);

            // Forward Lighting (Main Directional Light)
            var pass = ppl.addRenderPass(width, height, 'default');
            pass.name = 'ForwardPass';
            var firstStoreOp = this.forwardLighting.isMultipleLightPassesNeeded() ? StoreOp.STORE : depthStencilStoreOp;
            this._buildForwardMainLightPass(pass, cameraConfigs, id, camera, colorName, depthStencilName, firstStoreOp, mainLight);

            // Forward Lighting (Additive Lights)
            pass = this.forwardLighting.addLightPasses(colorName, depthStencilName, depthStencilStoreOp, id, width, height, camera, this._viewport, ppl, pass);
            return pass;
          }
        }, {
          key: "_buildForwardMainLightPass",
          value: function _buildForwardMainLightPass(pass, cameraConfigs, id, camera, colorName, depthStencilName, depthStencilStoreOp, mainLight) {
            var scene = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : null;
            var QueueHint = rendering.QueueHint;
            var SceneFlags = rendering.SceneFlags;
            // set viewport
            pass.setViewport(this._viewport);
            var colorStoreOp = cameraConfigs.enableMSAA ? StoreOp.DISCARD : StoreOp.STORE;

            // bind output render target
            if (forwardNeedClearColor(camera)) {
              pass.addRenderTarget(colorName, LoadOp.CLEAR, colorStoreOp, this._clearColor);
            } else {
              pass.addRenderTarget(colorName, LoadOp.LOAD, colorStoreOp);
            }

            // bind depth stencil buffer
            {
              if (colorName === cameraConfigs.colorName && depthStencilName !== cameraConfigs.depthStencilName) {
                warn('Default framebuffer cannot use custom depth stencil buffer');
              }
            }
            if (camera.clearFlag & ClearFlagBit.DEPTH_STENCIL) {
              pass.addDepthStencil(depthStencilName, LoadOp.CLEAR, depthStencilStoreOp, camera.clearDepth, camera.clearStencil, camera.clearFlag & ClearFlagBit.DEPTH_STENCIL);
            } else {
              pass.addDepthStencil(depthStencilName, LoadOp.LOAD, depthStencilStoreOp);
            }

            // Set shadow map if enabled
            if (cameraConfigs.enableMainLightShadowMap) {
              pass.addTexture("ShadowMap".concat(id), 'cc_shadowMap');
            }

            // TODO(zhouzhenglong): Separate OPAQUE and MASK queue

            // add opaque and mask queue
            pass.addQueue(QueueHint.NONE) // Currently we put OPAQUE and MASK into one queue, so QueueHint is NONE
            .addScene(camera, SceneFlags.OPAQUE | SceneFlags.MASK, mainLight || undefined, scene ? scene : undefined);
          }
        }, {
          key: "_addPlanarShadowQueue",
          value: function _addPlanarShadowQueue(camera, mainLight, pass) {
            var QueueHint = rendering.QueueHint;
            var SceneFlags = rendering.SceneFlags;
            pass.addQueue(QueueHint.BLEND, 'planar-shadow').addScene(camera, SceneFlags.SHADOW_CASTER | SceneFlags.PLANAR_SHADOW | SceneFlags.BLEND, mainLight || undefined);
          }
        }]);
        return BuiltinForwardPassBuilder;
      }());
      _defineProperty(BuiltinForwardPassBuilder, "ConfigOrder", 100);
      _defineProperty(BuiltinForwardPassBuilder, "RenderOrder", 100);
      function downSize(size, scale) {
        return Math.max(Math.floor(size * scale), 1);
      }
      var BuiltinBloomPassBuilder = exports('BuiltinBloomPassBuilder', /*#__PURE__*/function () {
        function BuiltinBloomPassBuilder() {
          _classCallCheck(this, BuiltinBloomPassBuilder);
          // Bloom
          _defineProperty(this, "_clearColorTransparentBlack", new Color(0, 0, 0, 0));
          _defineProperty(this, "_bloomParams", new Vec4(0, 0, 0, 0));
          _defineProperty(this, "_bloomTexSize", new Vec4(0, 0, 0, 0));
          _defineProperty(this, "_bloomWidths", []);
          _defineProperty(this, "_bloomHeights", []);
          _defineProperty(this, "_bloomTexNames", []);
          // Mipmap Bloom
          _defineProperty(this, "_bloomUpSampleTexDescs", []);
          _defineProperty(this, "_bloomDownSampleTexDescs", []);
          _defineProperty(this, "_prefilterTexDesc", {
            name: '',
            width: 0,
            height: 0
          });
          _defineProperty(this, "_originalColorDesc", {
            name: '',
            width: 0,
            height: 0
          });
        }
        _createClass(BuiltinBloomPassBuilder, [{
          key: "getConfigOrder",
          value: function getConfigOrder() {
            return 0;
          }
        }, {
          key: "getRenderOrder",
          value: function getRenderOrder() {
            return 200;
          }
        }, {
          key: "configCamera",
          value: function configCamera(camera, pipelineConfigs, cameraConfigs) {
            var bloom = cameraConfigs.settings.bloom;
            var hasValidMaterial = bloom.type === BloomType.KawaseDualFilter && !!bloom.kawaseFilterMaterial || bloom.type === BloomType.MipmapFilter && !!bloom.mipmapFilterMaterial;
            cameraConfigs.enableBloom = bloom.enabled && hasValidMaterial;
            if (cameraConfigs.enableBloom) {
              ++cameraConfigs.remainingPasses;
            }
          }
        }, {
          key: "windowResize",
          value: function windowResize(ppl, pplConfigs, cameraConfigs, window) {
            if (!cameraConfigs.enableBloom) {
              return;
            }
            var width = cameraConfigs.width,
              height = cameraConfigs.height,
              bloom = cameraConfigs.settings.bloom;
            var id = window.renderWindowId;
            var format = cameraConfigs.radianceFormat;
            if (bloom.type === BloomType.KawaseDualFilter) {
              var bloomWidth = cameraConfigs.width;
              var bloomHeight = cameraConfigs.height;
              for (var i = 0; i !== bloom.iterations + 1; ++i) {
                bloomWidth = Math.max(Math.floor(bloomWidth / 2), 1);
                bloomHeight = Math.max(Math.floor(bloomHeight / 2), 1);
                ppl.addRenderTarget("BloomTex".concat(id, "_").concat(i), format, bloomWidth, bloomHeight);
              }
            } else if (bloom.type === BloomType.MipmapFilter) {
              var iterations = bloom.iterations;
              for (var _i = 0; _i !== iterations + 1; ++_i) {
                // DownSample
                if (_i < iterations) {
                  var scale = Math.pow(0.5, _i + 2);
                  this._bloomDownSampleTexDescs[_i] = this.createTexture(ppl, "DownSampleColor".concat(id).concat(_i), downSize(width, scale), downSize(height, scale), format);
                }
                // UpSample
                if (_i < iterations - 1) {
                  var _scale = Math.pow(0.5, iterations - _i - 1);
                  this._bloomUpSampleTexDescs[_i] = this.createTexture(ppl, "UpSampleColor".concat(id).concat(_i), downSize(width, _scale), downSize(height, _scale), format);
                }
              }
              this._originalColorDesc = this.createTexture(ppl, "OriginalColor".concat(id), width, height, format);
              this._prefilterTexDesc = this.createTexture(ppl, "PrefilterColor".concat(id), downSize(width, 0.5), downSize(height, 0.5), format);
            }
          }
        }, {
          key: "createTexture",
          value: function createTexture(ppl, name, width, height, format) {
            var desc = {
              name: name,
              width: width,
              height: height
            };
            ppl.addRenderTarget(desc.name, format, desc.width, desc.height);
            return desc;
          }
        }, {
          key: "setup",
          value: function setup(ppl, pplConfigs, cameraConfigs, camera, context, prevRenderPass) {
            if (!cameraConfigs.enableBloom) {
              return prevRenderPass;
            }
            --cameraConfigs.remainingPasses;
            assert(cameraConfigs.remainingPasses >= 0);
            var bloom = cameraConfigs.settings.bloom;
            var id = camera.window.renderWindowId;
            switch (bloom.type) {
              case BloomType.KawaseDualFilter:
                {
                  var material = bloom.kawaseFilterMaterial;
                  assert(!!material);
                  return this._addKawaseDualFilterBloomPasses(ppl, pplConfigs, cameraConfigs, cameraConfigs.settings, material, id, cameraConfigs.width, cameraConfigs.height, context.colorName);
                }
              case BloomType.MipmapFilter:
                {
                  var _material = bloom.mipmapFilterMaterial;
                  assert(!!_material);
                  return this._addMipmapFilterBloomPasses(ppl, pplConfigs, cameraConfigs, cameraConfigs.settings, _material, id, cameraConfigs.width, cameraConfigs.height, context.colorName);
                }
              default:
                return prevRenderPass;
            }
          }
        }, {
          key: "_addKawaseDualFilterBloomPasses",
          value: function _addKawaseDualFilterBloomPasses(ppl, pplConfigs, cameraConfigs, settings, bloomMaterial, id, width, height, radianceName) {
            var QueueHint = rendering.QueueHint;
            // Based on Kawase Dual Filter Blur. Saves bandwidth on mobile devices.
            // eslint-disable-next-line max-len
            // https://community.arm.com/cfs-file/__key/communityserver-blogs-components-weblogfiles/00-00-00-20-66/siggraph2015_2D00_mmg_2D00_marius_2D00_slides.pdf

            // Size: [prefilter(1/2), downsample(1/4), downsample(1/8), downsample(1/16), ...]
            var iterations = settings.bloom.iterations;
            var sizeCount = iterations + 1;
            this._bloomWidths.length = sizeCount;
            this._bloomHeights.length = sizeCount;
            this._bloomWidths[0] = Math.max(Math.floor(width / 2), 1);
            this._bloomHeights[0] = Math.max(Math.floor(height / 2), 1);
            for (var i = 1; i !== sizeCount; ++i) {
              this._bloomWidths[i] = Math.max(Math.floor(this._bloomWidths[i - 1] / 2), 1);
              this._bloomHeights[i] = Math.max(Math.floor(this._bloomHeights[i - 1] / 2), 1);
            }

            // Bloom texture names
            this._bloomTexNames.length = sizeCount;
            for (var _i2 = 0; _i2 !== sizeCount; ++_i2) {
              this._bloomTexNames[_i2] = "BloomTex".concat(id, "_").concat(_i2);
            }

            // Setup bloom parameters
            this._bloomParams.x = pplConfigs.useFloatOutput ? 1 : 0;
            this._bloomParams.y = 0; // unused
            this._bloomParams.z = settings.bloom.threshold;
            this._bloomParams.w = settings.bloom.enableAlphaMask ? 1 : 0;

            // Prefilter pass
            var prefilterPass = ppl.addRenderPass(this._bloomWidths[0], this._bloomHeights[0], 'cc-bloom-prefilter');
            prefilterPass.addRenderTarget(this._bloomTexNames[0], LoadOp.CLEAR, StoreOp.STORE, this._clearColorTransparentBlack);
            prefilterPass.addTexture(radianceName, 'inputTexture');
            prefilterPass.setVec4('bloomParams', this._bloomParams);
            prefilterPass.addQueue(QueueHint.OPAQUE).addFullscreenQuad(bloomMaterial, 0);

            // Downsample passes
            for (var _i3 = 1; _i3 !== sizeCount; ++_i3) {
              var downPass = ppl.addRenderPass(this._bloomWidths[_i3], this._bloomHeights[_i3], 'cc-bloom-downsample');
              downPass.addRenderTarget(this._bloomTexNames[_i3], LoadOp.CLEAR, StoreOp.STORE, this._clearColorTransparentBlack);
              downPass.addTexture(this._bloomTexNames[_i3 - 1], 'bloomTexture');
              this._bloomTexSize.x = this._bloomWidths[_i3 - 1];
              this._bloomTexSize.y = this._bloomHeights[_i3 - 1];
              downPass.setVec4('bloomTexSize', this._bloomTexSize);
              downPass.addQueue(QueueHint.OPAQUE).addFullscreenQuad(bloomMaterial, 1);
            }

            // Upsample passes
            for (var _i4 = iterations; _i4-- > 0;) {
              var upPass = ppl.addRenderPass(this._bloomWidths[_i4], this._bloomHeights[_i4], 'cc-bloom-upsample');
              upPass.addRenderTarget(this._bloomTexNames[_i4], LoadOp.CLEAR, StoreOp.STORE, this._clearColorTransparentBlack);
              upPass.addTexture(this._bloomTexNames[_i4 + 1], 'bloomTexture');
              this._bloomTexSize.x = this._bloomWidths[_i4 + 1];
              this._bloomTexSize.y = this._bloomHeights[_i4 + 1];
              upPass.setVec4('bloomTexSize', this._bloomTexSize);
              upPass.addQueue(QueueHint.OPAQUE).addFullscreenQuad(bloomMaterial, 2);
            }

            // Combine pass
            this._bloomParams.w = settings.bloom.intensity;
            var combinePass = ppl.addRenderPass(width, height, 'cc-bloom-combine');
            combinePass.addRenderTarget(radianceName, LoadOp.LOAD, StoreOp.STORE);
            combinePass.addTexture(this._bloomTexNames[0], 'bloomTexture');
            combinePass.setVec4('bloomParams', this._bloomParams);
            combinePass.addQueue(QueueHint.BLEND).addFullscreenQuad(bloomMaterial, 3);
            if (cameraConfigs.remainingPasses === 0) {
              return addCopyToScreenPass(ppl, pplConfigs, cameraConfigs, radianceName);
            } else {
              return combinePass;
            }
          }
        }, {
          key: "_addPass",
          value: function _addPass(ppl, width, height, layout, colorName, material, passIndex) {
            var loadOp = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : LoadOp.CLEAR;
            var clearColor = arguments.length > 8 && arguments[8] !== undefined ? arguments[8] : sClearColorTransparentBlack;
            var queueHint = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : rendering.QueueHint.OPAQUE;
            var pass = ppl.addRenderPass(width, height, layout);
            pass.addRenderTarget(colorName, loadOp, StoreOp.STORE, clearColor);
            pass.addQueue(queueHint).addFullscreenQuad(material, passIndex);
            return pass;
          }
        }, {
          key: "_addMipmapFilterBloomPasses",
          value: function _addMipmapFilterBloomPasses(ppl, pplConfigs, cameraConfigs, settings, bloomMaterial, id, width, height, radianceName) {
            // Setup bloom parameters
            this._bloomParams.x = pplConfigs.useFloatOutput ? 1 : 0;
            this._bloomParams.x = 0; // unused
            this._bloomParams.z = settings.bloom.threshold;
            this._bloomParams.w = settings.bloom.intensity;
            var prefilterInfo = this._prefilterTexDesc;

            // Prefilter pass
            var currSamplePass = this._addPass(ppl, prefilterInfo.width, prefilterInfo.height, 'cc-bloom-mipmap-prefilter', prefilterInfo.name, bloomMaterial, 0);
            currSamplePass.addTexture(radianceName, 'mainTexture');
            currSamplePass.setVec4('bloomParams', this._bloomParams);
            var downSampleInfos = this._bloomDownSampleTexDescs;
            // Downsample passes
            for (var i = 0; i < downSampleInfos.length; ++i) {
              var currInfo = downSampleInfos[i];
              var samplerSrc = i === 0 ? prefilterInfo : downSampleInfos[i - 1];
              var samplerSrcName = samplerSrc.name;
              this._bloomTexSize.x = 1 / samplerSrc.width;
              this._bloomTexSize.y = 1 / samplerSrc.height;
              currSamplePass = this._addPass(ppl, currInfo.width, currInfo.height, 'cc-bloom-mipmap-downsample', currInfo.name, bloomMaterial, 1);
              currSamplePass.addTexture(samplerSrcName, 'mainTexture');
              currSamplePass.setVec4('bloomParams', this._bloomTexSize);
            }
            var lastIndex = downSampleInfos.length - 1;
            var upSampleInfos = this._bloomUpSampleTexDescs;
            // Upsample passes
            for (var _i5 = 0; _i5 < upSampleInfos.length; _i5++) {
              var _currInfo = upSampleInfos[_i5];
              var sampleSrc = _i5 === 0 ? downSampleInfos[lastIndex] : upSampleInfos[_i5 - 1];
              var sampleSrcName = sampleSrc.name;
              this._bloomTexSize.x = 1 / sampleSrc.width;
              this._bloomTexSize.y = 1 / sampleSrc.height;
              currSamplePass = this._addPass(ppl, _currInfo.width, _currInfo.height, 'cc-bloom-mipmap-upsample', _currInfo.name, bloomMaterial, 2);
              currSamplePass.addTexture(sampleSrcName, 'mainTexture');
              currSamplePass.addTexture(downSampleInfos[lastIndex - 1 - _i5].name, 'downsampleTexture');
              currSamplePass.setVec4('bloomParams', this._bloomTexSize);
            }

            // Combine pass
            var combinePass = this._addPass(ppl, width, height, 'cc-bloom-mipmap-combine', radianceName, bloomMaterial, 3, LoadOp.LOAD);
            combinePass.addTexture(upSampleInfos[upSampleInfos.length - 1].name, 'bloomTexture');
            combinePass.setVec4('bloomParams', this._bloomParams);
            if (cameraConfigs.remainingPasses === 0) {
              return addCopyToScreenPass(ppl, pplConfigs, cameraConfigs, radianceName);
            } else {
              return combinePass;
            }
          }
        }]);
        return BuiltinBloomPassBuilder;
      }());
      var BuiltinToneMappingPassBuilder = exports('BuiltinToneMappingPassBuilder', /*#__PURE__*/function () {
        function BuiltinToneMappingPassBuilder() {
          _classCallCheck(this, BuiltinToneMappingPassBuilder);
          _defineProperty(this, "_colorGradingTexSize", new Vec2(0, 0));
        }
        _createClass(BuiltinToneMappingPassBuilder, [{
          key: "getConfigOrder",
          value: function getConfigOrder() {
            return 0;
          }
        }, {
          key: "getRenderOrder",
          value: function getRenderOrder() {
            return 300;
          }
        }, {
          key: "configCamera",
          value: function configCamera(camera, pplConfigs, cameraConfigs) {
            var settings = cameraConfigs.settings;
            cameraConfigs.enableColorGrading = settings.colorGrading.enabled && !!settings.colorGrading.material && !!settings.colorGrading.colorGradingMap;
            cameraConfigs.enableToneMapping = cameraConfigs.enableHDR // From Half to RGBA8
            || cameraConfigs.enableColorGrading; // Color grading

            if (cameraConfigs.enableToneMapping) {
              ++cameraConfigs.remainingPasses;
            }
          }
        }, {
          key: "windowResize",
          value: function windowResize(ppl, pplConfigs, cameraConfigs) {
            if (cameraConfigs.enableColorGrading) {
              assert(!!cameraConfigs.settings.colorGrading.material);
              cameraConfigs.settings.colorGrading.material.setProperty('colorGradingMap', cameraConfigs.settings.colorGrading.colorGradingMap);
            }
          }
        }, {
          key: "setup",
          value: function setup(ppl, pplConfigs, cameraConfigs, camera, context, prevRenderPass) {
            if (!cameraConfigs.enableToneMapping) {
              return prevRenderPass;
            }
            --cameraConfigs.remainingPasses;
            assert(cameraConfigs.remainingPasses >= 0);
            if (cameraConfigs.remainingPasses === 0) {
              return this._addCopyAndTonemapPass(ppl, pplConfigs, cameraConfigs, cameraConfigs.width, cameraConfigs.height, context.colorName, cameraConfigs.colorName);
            } else {
              var id = cameraConfigs.renderWindowId;
              var ldrColorPrefix = cameraConfigs.enableShadingScale ? "ScaledLdrColor" : "LdrColor";
              var ldrColorName = getPingPongRenderTarget(context.colorName, ldrColorPrefix, id);
              var radianceName = context.colorName;
              context.colorName = ldrColorName;
              return this._addCopyAndTonemapPass(ppl, pplConfigs, cameraConfigs, cameraConfigs.width, cameraConfigs.height, radianceName, ldrColorName);
            }
          }
        }, {
          key: "_addCopyAndTonemapPass",
          value: function _addCopyAndTonemapPass(ppl, pplConfigs, cameraConfigs, width, height, radianceName, colorName) {
            var pass;
            var settings = cameraConfigs.settings;
            if (cameraConfigs.enableColorGrading) {
              assert(!!settings.colorGrading.material);
              assert(!!settings.colorGrading.colorGradingMap);
              var lutTex = settings.colorGrading.colorGradingMap;
              this._colorGradingTexSize.x = lutTex.width;
              this._colorGradingTexSize.y = lutTex.height;
              var isSquareMap = lutTex.width === lutTex.height;
              if (isSquareMap) {
                pass = ppl.addRenderPass(width, height, 'cc-color-grading-8x8');
              } else {
                pass = ppl.addRenderPass(width, height, 'cc-color-grading-nx1');
              }
              pass.addRenderTarget(colorName, LoadOp.CLEAR, StoreOp.STORE, sClearColorTransparentBlack);
              pass.addTexture(radianceName, 'sceneColorMap');
              pass.setVec2('lutTextureSize', this._colorGradingTexSize);
              pass.setFloat('contribute', settings.colorGrading.contribute);
              pass.addQueue(rendering.QueueHint.OPAQUE).addFullscreenQuad(settings.colorGrading.material, isSquareMap ? 1 : 0);
            } else {
              pass = ppl.addRenderPass(width, height, 'cc-tone-mapping');
              pass.addRenderTarget(colorName, LoadOp.CLEAR, StoreOp.STORE, sClearColorTransparentBlack);
              pass.addTexture(radianceName, 'inputTexture');
              if (settings.toneMapping.material) {
                pass.addQueue(rendering.QueueHint.OPAQUE).addFullscreenQuad(settings.toneMapping.material, 0);
              } else {
                assert(!!cameraConfigs.copyAndTonemapMaterial);
                pass.addQueue(rendering.QueueHint.OPAQUE).addFullscreenQuad(cameraConfigs.copyAndTonemapMaterial, 0);
              }
            }
            return pass;
          }
        }]);
        return BuiltinToneMappingPassBuilder;
      }());
      var BuiltinFXAAPassBuilder = exports('BuiltinFXAAPassBuilder', /*#__PURE__*/function () {
        function BuiltinFXAAPassBuilder() {
          _classCallCheck(this, BuiltinFXAAPassBuilder);
          // FXAA
          _defineProperty(this, "_fxaaParams", new Vec4(0, 0, 0, 0));
        }
        _createClass(BuiltinFXAAPassBuilder, [{
          key: "getConfigOrder",
          value: function getConfigOrder() {
            return 0;
          }
        }, {
          key: "getRenderOrder",
          value: function getRenderOrder() {
            return 400;
          }
        }, {
          key: "configCamera",
          value: function configCamera(camera, pplConfigs, cameraConfigs) {
            cameraConfigs.enableFXAA = cameraConfigs.settings.fxaa.enabled && !!cameraConfigs.settings.fxaa.material;
            if (cameraConfigs.enableFXAA) {
              ++cameraConfigs.remainingPasses;
            }
          }
        }, {
          key: "setup",
          value: function setup(ppl, pplConfigs, cameraConfigs, camera, context, prevRenderPass) {
            if (!cameraConfigs.enableFXAA) {
              return prevRenderPass;
            }
            --cameraConfigs.remainingPasses;
            assert(cameraConfigs.remainingPasses >= 0);
            var id = cameraConfigs.renderWindowId;
            var ldrColorPrefix = cameraConfigs.enableShadingScale ? "ScaledLdrColor" : "LdrColor";
            var ldrColorName = getPingPongRenderTarget(context.colorName, ldrColorPrefix, id);
            assert(!!cameraConfigs.settings.fxaa.material);
            if (cameraConfigs.remainingPasses === 0) {
              if (cameraConfigs.enableShadingScale) {
                this._addFxaaPass(ppl, pplConfigs, cameraConfigs.settings.fxaa.material, cameraConfigs.width, cameraConfigs.height, context.colorName, ldrColorName);
                return addCopyToScreenPass(ppl, pplConfigs, cameraConfigs, ldrColorName);
              } else {
                assert(cameraConfigs.width === cameraConfigs.nativeWidth);
                assert(cameraConfigs.height === cameraConfigs.nativeHeight);
                return this._addFxaaPass(ppl, pplConfigs, cameraConfigs.settings.fxaa.material, cameraConfigs.width, cameraConfigs.height, context.colorName, cameraConfigs.colorName);
              }
            } else {
              var inputColorName = context.colorName;
              context.colorName = ldrColorName;
              var lastPass = this._addFxaaPass(ppl, pplConfigs, cameraConfigs.settings.fxaa.material, cameraConfigs.width, cameraConfigs.height, inputColorName, ldrColorName);
              return lastPass;
            }
          }
        }, {
          key: "_addFxaaPass",
          value: function _addFxaaPass(ppl, pplConfigs, fxaaMaterial, width, height, ldrColorName, colorName) {
            this._fxaaParams.x = width;
            this._fxaaParams.y = height;
            this._fxaaParams.z = 1 / width;
            this._fxaaParams.w = 1 / height;
            var pass = ppl.addRenderPass(width, height, 'cc-fxaa');
            pass.addRenderTarget(colorName, LoadOp.CLEAR, StoreOp.STORE, sClearColorTransparentBlack);
            pass.addTexture(ldrColorName, 'sceneColorMap');
            pass.setVec4('texSize', this._fxaaParams);
            pass.addQueue(rendering.QueueHint.OPAQUE).addFullscreenQuad(fxaaMaterial, 0);
            return pass;
          }
        }]);
        return BuiltinFXAAPassBuilder;
      }());
      var BuiltinFsrPassBuilder = exports('BuiltinFsrPassBuilder', /*#__PURE__*/function () {
        function BuiltinFsrPassBuilder() {
          _classCallCheck(this, BuiltinFsrPassBuilder);
          // FSR
          _defineProperty(this, "_fsrParams", new Vec4(0, 0, 0, 0));
          _defineProperty(this, "_fsrTexSize", new Vec4(0, 0, 0, 0));
        }
        _createClass(BuiltinFsrPassBuilder, [{
          key: "getConfigOrder",
          value: function getConfigOrder() {
            return 0;
          }
        }, {
          key: "getRenderOrder",
          value: function getRenderOrder() {
            return 500;
          }
        }, {
          key: "configCamera",
          value: function configCamera(camera, pplConfigs, cameraConfigs) {
            // FSR (Depend on Shading scale)
            cameraConfigs.enableFSR = cameraConfigs.settings.fsr.enabled && !!cameraConfigs.settings.fsr.material && cameraConfigs.enableShadingScale && cameraConfigs.shadingScale < 1.0;
            if (cameraConfigs.enableFSR) {
              ++cameraConfigs.remainingPasses;
            }
          }
        }, {
          key: "setup",
          value: function setup(ppl, pplConfigs, cameraConfigs, camera, context, prevRenderPass) {
            if (!cameraConfigs.enableFSR) {
              return prevRenderPass;
            }
            --cameraConfigs.remainingPasses;
            var inputColorName = context.colorName;
            var outputColorName = cameraConfigs.remainingPasses === 0 ? cameraConfigs.colorName : getPingPongRenderTarget(context.colorName, 'UiColor', cameraConfigs.renderWindowId);
            context.colorName = outputColorName;
            assert(!!cameraConfigs.settings.fsr.material);
            return this._addFsrPass(ppl, pplConfigs, cameraConfigs, cameraConfigs.settings, cameraConfigs.settings.fsr.material, cameraConfigs.renderWindowId, cameraConfigs.width, cameraConfigs.height, inputColorName, cameraConfigs.nativeWidth, cameraConfigs.nativeHeight, outputColorName);
          }
        }, {
          key: "_addFsrPass",
          value: function _addFsrPass(ppl, pplConfigs, cameraConfigs, settings, fsrMaterial, id, width, height, inputColorName, nativeWidth, nativeHeight, outputColorName) {
            this._fsrTexSize.x = width;
            this._fsrTexSize.y = height;
            this._fsrTexSize.z = nativeWidth;
            this._fsrTexSize.w = nativeHeight;
            this._fsrParams.x = clamp(1.0 - settings.fsr.sharpness, 0.02, 0.98);
            var uiColorPrefix = 'UiColor';
            var fsrColorName = getPingPongRenderTarget(outputColorName, uiColorPrefix, id);
            var easuPass = ppl.addRenderPass(nativeWidth, nativeHeight, 'cc-fsr-easu');
            easuPass.addRenderTarget(fsrColorName, LoadOp.CLEAR, StoreOp.STORE, sClearColorTransparentBlack);
            easuPass.addTexture(inputColorName, 'outputResultMap');
            easuPass.setVec4('fsrTexSize', this._fsrTexSize);
            easuPass.addQueue(rendering.QueueHint.OPAQUE).addFullscreenQuad(fsrMaterial, 0);
            var rcasPass = ppl.addRenderPass(nativeWidth, nativeHeight, 'cc-fsr-rcas');
            rcasPass.addRenderTarget(outputColorName, LoadOp.CLEAR, StoreOp.STORE, sClearColorTransparentBlack);
            rcasPass.addTexture(fsrColorName, 'outputResultMap');
            rcasPass.setVec4('fsrTexSize', this._fsrTexSize);
            rcasPass.setVec4('fsrParams', this._fsrParams);
            rcasPass.addQueue(rendering.QueueHint.OPAQUE).addFullscreenQuad(fsrMaterial, 1);
            return rcasPass;
          }
        }]);
        return BuiltinFsrPassBuilder;
      }());
      var BuiltinUiPassBuilder = exports('BuiltinUiPassBuilder', /*#__PURE__*/function () {
        function BuiltinUiPassBuilder() {
          _classCallCheck(this, BuiltinUiPassBuilder);
        }
        _createClass(BuiltinUiPassBuilder, [{
          key: "getConfigOrder",
          value: function getConfigOrder() {
            return 0;
          }
        }, {
          key: "getRenderOrder",
          value: function getRenderOrder() {
            return 1000;
          }
        }, {
          key: "setup",
          value: function setup(ppl, pplConfigs, cameraConfigs, camera, context, prevRenderPass) {
            assert(!!prevRenderPass);
            var flags = rendering.SceneFlags.UI;
            if (cameraConfigs.enableProfiler) {
              flags |= rendering.SceneFlags.PROFILER;
              prevRenderPass.showStatistics = true;
            }
            prevRenderPass.addQueue(rendering.QueueHint.BLEND, 'default', 'default').addScene(camera, flags);
            return prevRenderPass;
          }
        }]);
        return BuiltinUiPassBuilder;
      }());
      if (rendering) {
        var _QueueHint = rendering.QueueHint,
          SceneFlags = rendering.SceneFlags;
        var BuiltinPipelineBuilder = /*#__PURE__*/function () {
          function BuiltinPipelineBuilder() {
            _classCallCheck(this, BuiltinPipelineBuilder);
            _defineProperty(this, "_pipelineEvent", cclegacy.director.root.pipelineEvent);
            _defineProperty(this, "_forwardPass", new BuiltinForwardPassBuilder());
            _defineProperty(this, "_bloomPass", new BuiltinBloomPassBuilder());
            _defineProperty(this, "_toneMappingPass", new BuiltinToneMappingPassBuilder());
            _defineProperty(this, "_fxaaPass", new BuiltinFXAAPassBuilder());
            _defineProperty(this, "_fsrPass", new BuiltinFsrPassBuilder());
            _defineProperty(this, "_uiPass", new BuiltinUiPassBuilder());
            // Internal cached resources
            _defineProperty(this, "_clearColor", new Color(0, 0, 0, 1));
            _defineProperty(this, "_viewport", new Viewport());
            _defineProperty(this, "_configs", new PipelineConfigs());
            _defineProperty(this, "_cameraConfigs", new CameraConfigs());
            // Materials
            _defineProperty(this, "_copyAndTonemapMaterial", new Material());
            // Internal States
            _defineProperty(this, "_initialized", false);
            // TODO(zhouzhenglong): Make default effect asset loading earlier and remove this flag
            _defineProperty(this, "_passBuilders", []);
          }
          _createClass(BuiltinPipelineBuilder, [{
            key: "_setupPipelinePreview",
            value: function _setupPipelinePreview(camera, cameraConfigs) {
              var isEditorView = camera.cameraUsage === CameraUsage.SCENE_VIEW || camera.cameraUsage === CameraUsage.PREVIEW;
              if (isEditorView) {
                var editorSettings = rendering.getEditorPipelineSettings();
                if (editorSettings) {
                  cameraConfigs.settings = editorSettings;
                } else {
                  cameraConfigs.settings = defaultSettings;
                }
              } else {
                if (camera.pipelineSettings) {
                  cameraConfigs.settings = camera.pipelineSettings;
                } else {
                  cameraConfigs.settings = defaultSettings;
                }
              }
            }
          }, {
            key: "_preparePipelinePasses",
            value: function _preparePipelinePasses(cameraConfigs) {
              var passBuilders = this._passBuilders;
              passBuilders.length = 0;
              var settings = cameraConfigs.settings;
              if (settings._passes) {
                var _iterator10 = _createForOfIteratorHelper(settings._passes),
                  _step10;
                try {
                  for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                    var pass = _step10.value;
                    passBuilders.push(pass);
                  }
                } catch (err) {
                  _iterator10.e(err);
                } finally {
                  _iterator10.f();
                }
                assert(passBuilders.length === settings._passes.length);
              }
              passBuilders.push(this._forwardPass);
              if (settings.bloom.enabled) {
                passBuilders.push(this._bloomPass);
              }
              passBuilders.push(this._toneMappingPass);
              if (settings.fxaa.enabled) {
                passBuilders.push(this._fxaaPass);
              }
              if (settings.fsr.enabled) {
                passBuilders.push(this._fsrPass);
              }
              passBuilders.push(this._uiPass);
            }
          }, {
            key: "_setupBuiltinCameraConfigs",
            value: function _setupBuiltinCameraConfigs(ppl, camera, pipelineConfigs, cameraConfigs) {
              var window = camera.window;
              var isMainGameWindow = camera.cameraUsage === CameraUsage.GAME && !!window.swapchain;
              var isGameView = isMainGameWindow || camera.cameraUsage === CameraUsage.GAME_VIEW;

              // Window
              cameraConfigs.isMainGameWindow = isMainGameWindow;
              cameraConfigs.renderWindowId = window.renderWindowId;

              // Camera
              cameraConfigs.colorName = window.colorName;
              cameraConfigs.depthStencilName = window.depthStencilName;

              // Pipeline
              cameraConfigs.enableFullPipeline = (camera.visibility & Layers.Enum.DEFAULT) !== 0;
              cameraConfigs.enableProfiler = ppl.profiler && isGameView;
              cameraConfigs.remainingPasses = 0;

              // Shading scale
              cameraConfigs.shadingScale = cameraConfigs.settings.shadingScale;
              cameraConfigs.enableShadingScale = cameraConfigs.settings.enableShadingScale && cameraConfigs.shadingScale !== 1.0;
              cameraConfigs.nativeWidth = Math.max(Math.floor(window.width), 1);
              cameraConfigs.nativeHeight = Math.max(Math.floor(window.height), 1);
              cameraConfigs.width = cameraConfigs.enableShadingScale ? Math.max(Math.floor(cameraConfigs.nativeWidth * cameraConfigs.shadingScale), 1) : cameraConfigs.nativeWidth;
              cameraConfigs.height = cameraConfigs.enableShadingScale ? Math.max(Math.floor(cameraConfigs.nativeHeight * cameraConfigs.shadingScale), 1) : cameraConfigs.nativeHeight;

              // Radiance
              cameraConfigs.enableHDR = cameraConfigs.enableFullPipeline && pipelineConfigs.useFloatOutput;
              cameraConfigs.radianceFormat = cameraConfigs.enableHDR ? gfx.Format.RGBA16F : gfx.Format.RGBA8;

              // Tone Mapping
              cameraConfigs.copyAndTonemapMaterial = this._copyAndTonemapMaterial;

              // Depth
              cameraConfigs.enableStoreSceneDepth = false;
            }
          }, {
            key: "_setupCameraConfigs",
            value: function _setupCameraConfigs(ppl, camera, pipelineConfigs, cameraConfigs) {
              this._setupPipelinePreview(camera, cameraConfigs);
              this._preparePipelinePasses(cameraConfigs);
              sortPipelinePassBuildersByConfigOrder(this._passBuilders);
              this._setupBuiltinCameraConfigs(ppl, camera, pipelineConfigs, cameraConfigs);
              var _iterator11 = _createForOfIteratorHelper(this._passBuilders),
                _step11;
              try {
                for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                  var builder = _step11.value;
                  if (builder.configCamera) {
                    builder.configCamera(camera, pipelineConfigs, cameraConfigs);
                  }
                }
              } catch (err) {
                _iterator11.e(err);
              } finally {
                _iterator11.f();
              }
            }

            // ----------------------------------------------------------------
            // Interface
            // ----------------------------------------------------------------
          }, {
            key: "windowResize",
            value: function windowResize(ppl, window, camera, nativeWidth, nativeHeight) {
              setupPipelineConfigs(ppl, this._configs);
              this._setupCameraConfigs(ppl, camera, this._configs, this._cameraConfigs);

              // Render Window (UI)
              var id = window.renderWindowId;
              ppl.addRenderWindow(this._cameraConfigs.colorName, Format.RGBA8, nativeWidth, nativeHeight, window, this._cameraConfigs.depthStencilName);
              var width = this._cameraConfigs.width;
              var height = this._cameraConfigs.height;
              if (this._cameraConfigs.enableShadingScale) {
                ppl.addDepthStencil("ScaledSceneDepth_".concat(id), Format.DEPTH_STENCIL, width, height);
                ppl.addRenderTarget("ScaledRadiance0_".concat(id), this._cameraConfigs.radianceFormat, width, height);
                ppl.addRenderTarget("ScaledRadiance1_".concat(id), this._cameraConfigs.radianceFormat, width, height);
                ppl.addRenderTarget("ScaledLdrColor0_".concat(id), Format.RGBA8, width, height);
                ppl.addRenderTarget("ScaledLdrColor1_".concat(id), Format.RGBA8, width, height);
              } else {
                ppl.addDepthStencil("SceneDepth_".concat(id), Format.DEPTH_STENCIL, width, height);
                ppl.addRenderTarget("Radiance0_".concat(id), this._cameraConfigs.radianceFormat, width, height);
                ppl.addRenderTarget("Radiance1_".concat(id), this._cameraConfigs.radianceFormat, width, height);
                ppl.addRenderTarget("LdrColor0_".concat(id), Format.RGBA8, width, height);
                ppl.addRenderTarget("LdrColor1_".concat(id), Format.RGBA8, width, height);
              }
              ppl.addRenderTarget("UiColor0_".concat(id), Format.RGBA8, nativeWidth, nativeHeight);
              ppl.addRenderTarget("UiColor1_".concat(id), Format.RGBA8, nativeWidth, nativeHeight);
              var _iterator12 = _createForOfIteratorHelper(this._passBuilders),
                _step12;
              try {
                for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                  var builder = _step12.value;
                  if (builder.windowResize) {
                    builder.windowResize(ppl, this._configs, this._cameraConfigs, window, camera, nativeWidth, nativeHeight);
                  }
                }
              } catch (err) {
                _iterator12.e(err);
              } finally {
                _iterator12.f();
              }
            }
          }, {
            key: "setup",
            value: function setup(cameras, ppl) {
              // TODO(zhouzhenglong): Make default effect asset loading earlier and remove _initMaterials
              if (this._initMaterials(ppl)) {
                return;
              }

              // Render cameras
              // log(`==================== One Frame ====================`);
              var _iterator13 = _createForOfIteratorHelper(cameras),
                _step13;
              try {
                for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
                  var camera = _step13.value;
                  // Skip invalid camera
                  if (!camera.scene || !camera.window) {
                    continue;
                  }
                  // Setup camera configs
                  this._setupCameraConfigs(ppl, camera, this._configs, this._cameraConfigs);
                  // log(`Setup camera: ${camera.node!.name}, window: ${camera.window.renderWindowId}, isFull: ${this._cameraConfigs.enableFullPipeline}, `
                  //     + `size: ${camera.window.width}x${camera.window.height}`);

                  this._pipelineEvent.emit(PipelineEventType.RENDER_CAMERA_BEGIN, camera);

                  // Build pipeline
                  if (this._cameraConfigs.enableFullPipeline) {
                    this._buildForwardPipeline(ppl, camera, camera.scene, this._passBuilders);
                  } else {
                    this._buildSimplePipeline(ppl, camera);
                  }
                  this._pipelineEvent.emit(PipelineEventType.RENDER_CAMERA_END, camera);
                }
              } catch (err) {
                _iterator13.e(err);
              } finally {
                _iterator13.f();
              }
            }
            // ----------------------------------------------------------------
            // Pipelines
            // ----------------------------------------------------------------
          }, {
            key: "_buildSimplePipeline",
            value: function _buildSimplePipeline(ppl, camera) {
              var width = Math.max(Math.floor(camera.window.width), 1);
              var height = Math.max(Math.floor(camera.window.height), 1);
              var colorName = this._cameraConfigs.colorName;
              var depthStencilName = this._cameraConfigs.depthStencilName;
              var viewport = camera.viewport; // Reduce C++/TS interop
              this._viewport.left = Math.round(viewport.x * width);
              this._viewport.top = Math.round(viewport.y * height);
              // Here we must use camera.viewport.width instead of camera.viewport.z, which
              // is undefined on native platform. The same as camera.viewport.height.
              this._viewport.width = Math.max(Math.round(viewport.width * width), 1);
              this._viewport.height = Math.max(Math.round(viewport.height * height), 1);
              var clearColor = camera.clearColor; // Reduce C++/TS interop
              this._clearColor.x = clearColor.x;
              this._clearColor.y = clearColor.y;
              this._clearColor.z = clearColor.z;
              this._clearColor.w = clearColor.w;
              var pass = ppl.addRenderPass(width, height, 'default');

              // bind output render target
              if (forwardNeedClearColor(camera)) {
                pass.addRenderTarget(colorName, LoadOp.CLEAR, StoreOp.STORE, this._clearColor);
              } else {
                pass.addRenderTarget(colorName, LoadOp.LOAD, StoreOp.STORE);
              }

              // bind depth stencil buffer
              if (camera.clearFlag & ClearFlagBit.DEPTH_STENCIL) {
                pass.addDepthStencil(depthStencilName, LoadOp.CLEAR, StoreOp.DISCARD, camera.clearDepth, camera.clearStencil, camera.clearFlag & ClearFlagBit.DEPTH_STENCIL);
              } else {
                pass.addDepthStencil(depthStencilName, LoadOp.LOAD, StoreOp.DISCARD);
              }
              pass.setViewport(this._viewport);

              // The opaque queue is used for Reflection probe preview
              pass.addQueue(_QueueHint.OPAQUE).addScene(camera, SceneFlags.OPAQUE);

              // The blend queue is used for UI and Gizmos
              var flags = SceneFlags.BLEND | SceneFlags.UI;
              if (this._cameraConfigs.enableProfiler) {
                flags |= SceneFlags.PROFILER;
                pass.showStatistics = true;
              }
              pass.addQueue(_QueueHint.BLEND).addScene(camera, flags);
            }
          }, {
            key: "_buildForwardPipeline",
            value: function _buildForwardPipeline(ppl, camera, scene, passBuilders) {
              sortPipelinePassBuildersByRenderOrder(passBuilders);
              var context = {
                colorName: '',
                depthStencilName: ''
              };
              var lastPass = undefined;
              var _iterator14 = _createForOfIteratorHelper(passBuilders),
                _step14;
              try {
                for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                  var builder = _step14.value;
                  if (builder.setup) {
                    lastPass = builder.setup(ppl, this._configs, this._cameraConfigs, camera, context, lastPass);
                  }
                }
              } catch (err) {
                _iterator14.e(err);
              } finally {
                _iterator14.f();
              }
              assert(this._cameraConfigs.remainingPasses === 0);
            }
          }, {
            key: "_initMaterials",
            value: function _initMaterials(ppl) {
              if (this._initialized) {
                return 0;
              }
              setupPipelineConfigs(ppl, this._configs);

              // When add new effect asset, please add its uuid to the dependentAssets in cc.config.json.
              this._copyAndTonemapMaterial._uuid = "builtin-pipeline-tone-mapping-material";
              this._copyAndTonemapMaterial.initialize({
                effectName: 'pipeline/post-process/tone-mapping'
              });
              if (this._copyAndTonemapMaterial.effectAsset) {
                this._initialized = true;
              }
              return this._initialized ? 0 : 1;
            }
          }]);
          return BuiltinPipelineBuilder;
        }();
        rendering.setCustomPipeline('Builtin', new BuiltinPipelineBuilder());
      } // if (rendering)
      cclegacy._RF.pop();
    }
  };
});

System.register("chunks:///_virtual/internal", ['./builtin-pipeline-settings.ts', './builtin-pipeline-types.ts', './builtin-pipeline.ts'], function () {
  return {
    setters: [null, null, null],
    execute: function () {}
  };
});

(function(r) {
  r('virtual:///prerequisite-imports/internal', 'chunks:///_virtual/internal'); 
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