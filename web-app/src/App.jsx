import { useEffect, useRef, useState } from 'react';
import './index.css';
import {
  AI_RSI_Indicator,
  AI_MFI_Indicator,
  AI_Stoch_Indicator,
  AI_CCI_Indicator,
  AI_BB_Fixed_Indicator,
  AI_WilliamsR_Indicator,
  AI_MACD_Indicator
} from './AIIndicator';

const CONFIG = {
  // API_URL: "https://api.dautubenvung.vn",
  API_URL: "http://localhost:3000",

  DEFAULT_SYMBOL: "VNINDEX",
  DEFAULT_INTERVAL: "D",
  DEFAULT_THEME: "dark",
  TIMEZONE: "Asia/Ho_Chi_Minh",
  LOCALE: "vi",
  PERSIST_KEY_PREFIX: "tv_layout_v2:",
  AUTO_SAVE_DELAY: 300,
  REFRESH_DELAY: 200,
};

function App() {
  const chartContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [activeResolution, setActiveResolution] = useState(CONFIG.DEFAULT_INTERVAL);
  const [oscillators, setOscillators] = useState({ MACD: false, RSI: false, AI: false });
  const [overlays, setOverlays] = useState({
    VOL: false,
    BOLL: false,
    MA10: false,
    MA20: false,
    MA50: false,
  });

  // Keep track of study IDs and other internal state
  const stateRef = useRef({
    studyIds: {
      osc: { MACD: null, RSI: null, AI: null },
      overlays: {
        VOL: null,
        BOLL: null,
        MA10: null,
        MA20: null,
        MA50: null,
      },
    },
    maLengths: {},
    isRestoring: false,
    isInitialLoad: true,
    persistTimer: null,
    refreshTimer: null,
    currentTheme: CONFIG.DEFAULT_THEME,
    currentSymbol: CONFIG.DEFAULT_SYMBOL,
  });

  const tvThemeName = (mode) => (mode === "dark" ? "Dark" : "Light");

  const getThemeOverrides = (mode) => {
    return mode === "dark"
      ? {
        "paneProperties.backgroundType": "solid",
        "paneProperties.background": "#0b1018",
        "paneProperties.vertGridProperties.color": "rgba(255,255,255,0.06)",
        "paneProperties.horzGridProperties.color": "rgba(255,255,255,0.06)",
        "scalesProperties.textColor": "#cfd6e4",
      }
      : {
        "paneProperties.backgroundType": "solid",
        "paneProperties.background": "#ffffff",
        "paneProperties.vertGridProperties.color": "rgba(0,0,0,0.06)",
        "paneProperties.horzGridProperties.color": "rgba(0,0,0,0.06)",
        "scalesProperties.textColor": "#333333",
      };
  };

  const layoutKey = (symbol) => {
    return (
      CONFIG.PERSIST_KEY_PREFIX +
      (symbol || "").replace(/^HOSE:/, "").toUpperCase()
    );
  };

  const normalizeLayoutTheme = (layout, mode) => {
    if (!layout || typeof layout !== "object") return layout;
    const isDark = mode === "dark";
    const bg = isDark ? "#0b1018" : "#ffffff";
    const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const text = isDark ? "#cfd6e4" : "#333333";

    try {
      layout.theme = tvThemeName(mode);
      const charts = Array.isArray(layout.charts) ? layout.charts : [];
      charts.forEach((ch) => {
        ch.properties = ch.properties || {};
        ch.properties.paneProperties = ch.properties.paneProperties || {};
        ch.properties.scalesProperties =
          ch.properties.scalesProperties || {};
        ch.properties.paneProperties.backgroundType = "solid";
        ch.properties.paneProperties.background = bg;
        ch.properties.paneProperties.vertGridProperties =
          ch.properties.paneProperties.vertGridProperties || {};
        ch.properties.paneProperties.horzGridProperties =
          ch.properties.paneProperties.horzGridProperties || {};
        ch.properties.paneProperties.vertGridProperties.color = grid;
        ch.properties.paneProperties.horzGridProperties.color = grid;
        ch.properties.scalesProperties.textColor = text;
      });
    } catch (e) { }

    return layout;
  };

  const filterLayoutBySymbol = (layout, symbol) => {
    if (!layout || !layout.charts) return layout;

    const cleanedLayout = JSON.parse(JSON.stringify(layout));
    const normalizedCurrent = (symbol || "")
      .replace(/^HOSE:/, "")
      .toUpperCase();

    cleanedLayout.charts.forEach((chart) => {
      if (chart.panes) {
        chart.panes.forEach((pane) => {
          if (pane.sources) {
            pane.sources = pane.sources.filter((source) => {
              if (source.type && source.type.startsWith("LineTool")) {
                const sourceSymbol = source.state && source.state.symbol;
                if (sourceSymbol) {
                  const normalizedSource = sourceSymbol
                    .replace(/^HOSE:/, "")
                    .toUpperCase();
                  return normalizedSource === normalizedCurrent;
                }
                return true;
              }
              return true;
            });
          }
        });
      }
    });

    return cleanedLayout;
  };

  const findBestLayoutKey = (symbol) => {
    const normalizedSymbol = (symbol || "")
      .replace(/^HOSE:/, "")
      .toUpperCase();
    const ticker = symbol.includes(":") ? symbol.split(":")[1] : symbol;

    const candidates = [
      layoutKey(symbol),
      layoutKey(normalizedSymbol),
      layoutKey(ticker.toUpperCase()),
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CONFIG.PERSIST_KEY_PREFIX)) {
        const storedSymbol = k
          .replace(CONFIG.PERSIST_KEY_PREFIX, "")
          .toUpperCase();
        if (
          storedSymbol === normalizedSymbol ||
          storedSymbol === ticker.toUpperCase()
        ) {
          if (!candidates.includes(k)) candidates.unshift(k);
        }
      }
    }

    return candidates.find((k) => !!localStorage.getItem(k)) || null;
  };

  const loadLayout = (widget, symbol) => {
    if (!widget || stateRef.current.isRestoring) return;

    try {
      const key = findBestLayoutKey(symbol);
      console.log("[TV] Loading layout for:", symbol, "key:", key);

      if (!key) {
        if (stateRef.current.isInitialLoad) {
          setTimeout(() => {
            if (!stateRef.current.studyIds.overlays.VOL) {
              toggleOverlay("VOL");
            }
          }, 500);
        }
        return;
      }

      const raw = localStorage.getItem(key);
      if (!raw) return;

      const maLengthsRaw = localStorage.getItem(key + ":maLengths");
      if (maLengthsRaw) {
        try {
          stateRef.current.maLengths = JSON.parse(maLengthsRaw);
        } catch (e) {
          stateRef.current.maLengths = {};
        }
      }

      const data = normalizeLayoutTheme(
        JSON.parse(raw),
        stateRef.current.currentTheme
      );
      const filtered = filterLayoutBySymbol(data, symbol);

      stateRef.current.isRestoring = true;
      widget.load(filtered);

      requestAnimationFrame(() => {
        stateRef.current.isRestoring = false;
        widget.applyOverrides(getThemeOverrides(stateRef.current.currentTheme));
        // Force theme change might be needed but applyOverrides usually works

        try {
          const currentResolution = widget.activeChart().resolution();
          if (currentResolution) {
            setActiveResolution(currentResolution);
          }
        } catch (e) { }

        setTimeout(() => {
          refreshIndicatorButtons();
        }, 300);
      });
    } catch (e) {
      console.error("[TV] loadLayout error:", e);
      stateRef.current.isRestoring = false;
    }
  };

  const persistLayout = () => {
    const widget = widgetRef.current;
    if (!widget || stateRef.current.isRestoring) return;

    try {
      widget.save((obj) => {
        if (!obj) return;

        const symbol = stateRef.current.currentSymbol;
        const normalizedSymbol = (symbol || "")
          .replace(/^HOSE:/, "")
          .toUpperCase();

        const keys = new Set([
          layoutKey(symbol),
          layoutKey(normalizedSymbol),
        ]);

        if (symbol.includes(":")) {
          const ticker = symbol.split(":")[1];
          keys.add(layoutKey(ticker));
        }

        for (const k of keys) {
          try {
            localStorage.setItem(k, JSON.stringify(obj));
            localStorage.setItem(
              k + ":maLengths",
              JSON.stringify(stateRef.current.maLengths)
            );
          } catch (err) { }
        }
      });
    } catch (e) {
      console.error("[TV] persistLayout error:", e);
    }
  };

  // Debounced persist
  const schedulePersist = () => {
    if (stateRef.current.persistTimer) clearTimeout(stateRef.current.persistTimer);
    stateRef.current.persistTimer = setTimeout(persistLayout, CONFIG.AUTO_SAVE_DELAY);
  };

  const refreshIndicatorButtons = () => {
    const widget = widgetRef.current;
    if (!widget || !isChartReady) return;

    try {
      const chart = widget.activeChart();
      const studies = chart.getAllStudies();

      let hasMACD = false, hasRSI = false, hasAI = false;
      let hasBOLL = false, hasMA10 = false, hasMA20 = false, hasMA50 = false, hasVOL = false;
      const newStudyIds = { ...stateRef.current.studyIds };

      studies.forEach((study) => {
        const name = study.name || "";
        const studyId = study.id;

        if (name === "AI Indicator") {
          hasAI = true;
          newStudyIds.osc.AI = studyId;
        }

        if (name.includes("MACD")) {
          hasMACD = true;
          newStudyIds.osc.MACD = studyId;
        }
        if (name.includes("RSI") || name.includes("Relative Strength")) {
          hasRSI = true;
          newStudyIds.osc.RSI = studyId;
        }
        if (name.includes("Bollinger")) {
          hasBOLL = true;
          newStudyIds.overlays.BOLL = studyId;
        }
        if (name.includes("Volume") || name.toLowerCase().includes("volume")) {
          hasVOL = true;
          newStudyIds.overlays.VOL = studyId;
        }
        if (name.includes("Moving Average") || name.includes("MA")) {
          const len = stateRef.current.maLengths[studyId];
          if (len === 10) { hasMA10 = true; newStudyIds.overlays.MA10 = studyId; }
          if (len === 20) { hasMA20 = true; newStudyIds.overlays.MA20 = studyId; }
          if (len === 50) { hasMA50 = true; newStudyIds.overlays.MA50 = studyId; }
        }
      });

      stateRef.current.studyIds = newStudyIds;

      setOscillators({ MACD: hasMACD, RSI: hasRSI, AI: hasAI });
      setOverlays({
        VOL: hasVOL,
        BOLL: hasBOLL,
        MA10: hasMA10,
        MA20: hasMA20,
        MA50: hasMA50,
      });

    } catch (e) {
      console.error("[TV] refreshIndicatorButtons error:", e);
    }
  };

  const scheduleRefresh = () => {
    if (stateRef.current.refreshTimer) clearTimeout(stateRef.current.refreshTimer);
    stateRef.current.refreshTimer = setTimeout(refreshIndicatorButtons, CONFIG.REFRESH_DELAY);
  };

  const tryCreateStudy = async (chart, nameCandidates, forceOverlay, inputVariants) => {
    for (const name of nameCandidates) {
      for (const inputs of inputVariants) {
        try {
          const result = await chart.createStudy(name, forceOverlay, false, inputs ?? {});
          if (result) return result;
        } catch (e) {
          console.error("[TV] Custom Study Creation Error:", name, e);
        }
      }
    }
    return null;
  };

  const toggleOscillator = async (name) => {
    const widget = widgetRef.current;
    if (!widget) return;
    const chart = widget.activeChart();

    // AI Special Case: Toggle all AI indicators
    if (name === "AI") {
      const aiKeys = ["AI_RSI", "AI_MFI", "AI_Stoch", "AI_CCI", "AI_BB", "AI_MACD"];
      const hasAny = aiKeys.some(key => stateRef.current.studyIds.osc[key]);

      if (hasAny) {
        // Remove all AI indicators
        for (const key of aiKeys) {
          const id = stateRef.current.studyIds.osc[key];
          if (id) { try { chart.removeEntity(id); } catch (e) { } }
          stateRef.current.studyIds.osc[key] = null;
        }
        setOscillators(prev => ({ ...prev, AI: false }));
      } else {
        // Add all AI indicators
        console.log("[TV] Creating all AI indicators...");
        const indicators = [
          { key: "AI_RSI", names: ["CustomAI RSI", "CustomAI_RSI@tv-basicstudies-1"], inputs: { in_rsi_len: 14 } },
          { key: "AI_MFI", names: ["CustomAI MFI", "CustomAI_MFI@tv-basicstudies-1"], inputs: { in_mfi_len: 14 } },
          { key: "AI_Stoch", names: ["CustomAI Stochastic", "CustomAI_Stoch@tv-basicstudies-1"], inputs: { in_k_len: 14 } },
          { key: "AI_CCI", names: ["CustomAI CCI2", "CustomAI_CCI2@tv-basicstudies-1"], inputs: { in_cci_len: 20 } },
          // { key: "AI_BB", names: ["CustomAIBB3"], inputs: { in_bb_len: 20, in_bb_mult: 2 } },
          // { key: "AI_WilliamsR", names: ["CustomAI WilliamsR", "CustomAI_WilliamsR@tv-basicstudies-1"], inputs: { in_wr_len: 14 } },
          { key: "AI_MACD", names: ["CustomAI MACD", "CustomAI_MACD@tv-basicstudies-1"], inputs: { in_fast: 12, in_slow: 26, in_signal: 9 } },
        ];

        let anyCreated = false;
        for (const ind of indicators) {
          const id = await tryCreateStudy(chart, ind.names, false, [ind.inputs]);
          stateRef.current.studyIds.osc[ind.key] = id;
          if (id) anyCreated = true;
          console.log(`[TV] ${ind.key} created:`, !!id);
        }

        if (anyCreated) {
          setOscillators(prev => ({ ...prev, AI: true }));
        }
      }
      setTimeout(() => { scheduleRefresh(); schedulePersist(); }, 100);
      return;
    }

    // Generic Case
    if (stateRef.current.studyIds.osc[name]) {
      const studyId = stateRef.current.studyIds.osc[name];
      if (studyId) {
        try {
          chart.removeEntity(studyId);
        } catch (e) { }
      }
      stateRef.current.studyIds.osc[name] = null;
      setOscillators(prev => ({ ...prev, [name]: false }));
    } else {
      let id = null;
      if (name === "MACD") {
        id = await tryCreateStudy(chart, ["MACD", "MACD@tv-basicstudies"], false, [undefined, { in_0: 12, in_1: 26, in_2: 9 }]);
      } else if (name === "RSI") {
        id = await tryCreateStudy(chart, ["Relative Strength Index", "RSI", "RSI@tv-basicstudies"], false, [undefined, { in_0: 14 }, { length: 14 }, [14]]);
      }

      if (id) {
        stateRef.current.studyIds.osc[name] = id;
        setOscillators(prev => ({ ...prev, [name]: true }));
      }
    }
    setTimeout(() => { scheduleRefresh(); schedulePersist(); }, 100);
  };

  const toggleOverlay = async (key) => {
    const widget = widgetRef.current;
    if (!widget) return;
    const chart = widget.activeChart();

    if (overlays[key]) {
      const studyId = stateRef.current.studyIds.overlays[key];
      if (studyId) {
        try {
          chart.removeEntity(studyId);
          if (stateRef.current.maLengths[studyId]) delete stateRef.current.maLengths[studyId];
        } catch (e) { }
      }
      stateRef.current.studyIds.overlays[key] = null;
      setOverlays(prev => ({ ...prev, [key]: false }));
    } else {
      let id = null;
      if (key === "BOLL") {
        id = await tryCreateStudy(chart, ["Bollinger Bands", "Bollinger Bands@tv-basicstudies"], true, [{ in_0: 20, in_1: 2 }, { length: 20, mult: 2 }, [20, 2]]);
      } else if (key === "VOL") {
        id = await tryCreateStudy(chart, ["Volume", "Volume@tv-basicstudies"], false, [undefined]);
      } else {
        const len = key === "MA10" ? 10 : key === "MA20" ? 20 : 50;
        id = await tryCreateStudy(chart, ["Moving Average", "MASimple@tv-basicstudies"], true, [{ length: len }, { in_0: len }, [len]]);
        if (id) stateRef.current.maLengths[id] = len;
      }

      if (id) {
        stateRef.current.studyIds.overlays[key] = id;
        setOverlays(prev => ({ ...prev, [key]: true }));
      }
    }
    setTimeout(() => { scheduleRefresh(); schedulePersist(); }, 100);
  };

  const toggleTrendline = () => {
    const widget = widgetRef.current;
    if (widget) {
      try {
        widget.selectLineTool("trend_line");
      } catch (e) { }
    }
  };

  const changeResolution = (res) => {
    const widget = widgetRef.current;
    if (!widget) return;
    widget.activeChart().setResolution(res, () => {
      setActiveResolution(res);
      schedulePersist();
    });
  };

  useEffect(() => {
    // Initialization
    const initWidget = () => {
      if (!window.TradingView || !window.Datafeeds) return;

      const widgetOptions = {
        symbol: CONFIG.DEFAULT_SYMBOL,
        datafeed: new window.Datafeeds.UDFCompatibleDatafeed(CONFIG.API_URL, 5000),
        interval: CONFIG.DEFAULT_INTERVAL,
        container: chartContainerRef.current,
        library_path: "/tradingview/charting_library/",
        locale: CONFIG.LOCALE,
        timezone: CONFIG.TIMEZONE,
        client_id: "tradingview.com",
        user_id: "public_user_id",
        fullscreen: false,
        autosize: true,
        theme: tvThemeName(CONFIG.DEFAULT_THEME),
        disabled_features: [
          // "header_widget",
          // "timeframes_toolbar",
          // "left_toolbar",
          "legend_context_menu",
          "main_series_scale_menu",
          "pane_context_menu",
          "volume_force_overlay",
          // "symbol_info",
          "display_market_status",
          // "header_compare",
          // "header_indicators",
          // "header_settings",
          // "header_resolutions",
          // "header_interval_dialog_button",
          // "header_undo_redo",
          // "header_screenshot",
          // "header_fullscreen_button",
        ],
        overrides: {
          "paneProperties.legendProperties.showLegend": false,
          "paneProperties.legendProperties.showSeriesTitle": false,
          "paneProperties.legendProperties.showSeriesOHLC": false,
          "symbolWatermarkProperties.transparency": 100,
        },
        allow_symbol_change: true,
        debug: false,
        loading_screen: {
          backgroundColor: CONFIG.DEFAULT_THEME === "dark" ? "#0b1018" : "#ffffff",
        },
        custom_indicators_getter: function (PineJS) {
          console.log("[TV] custom_indicators_getter called.");
          if (PineJS) window.PineJS = PineJS;

          const indicators = [
            AI_RSI_Indicator,
            AI_MFI_Indicator,
            AI_Stoch_Indicator,
            AI_CCI_Indicator,
            AI_BB_Fixed_Indicator,
            AI_WilliamsR_Indicator,
            AI_MACD_Indicator
          ];

          console.log("[TV] Registering custom indicators:", indicators.map(i => ({ name: i.name, id: i.metainfo.id })));

          console.log("[TV] Returning indicators:", indicators.map(ind => ({
            name: ind.name,
            metainfo_name: ind.metainfo?.name,
            metainfo_id: ind.metainfo?.id
          })));

          return Promise.resolve(indicators);
        },
      };

      const widget = new window.TradingView.widget(widgetOptions);
      widgetRef.current = widget;

      widget.onChartReady(() => {
        setIsChartReady(true);
        widget.applyOverrides(getThemeOverrides(CONFIG.DEFAULT_THEME));

        loadLayout(widget, CONFIG.DEFAULT_SYMBOL);
        stateRef.current.isInitialLoad = false;

        widget.subscribe("onTick", () => { }); // No-op as we don't have update logic here from ws yet
        if (widget.onAutoSaveNeeded) {
          widget.onAutoSaveNeeded(() => {
            scheduleRefresh();
            schedulePersist();
          });
        }
        widget.subscribe("undo_redo_state_changed", () => {
          scheduleRefresh();
          schedulePersist();
        });
        widget.subscribe("study", () => {
          scheduleRefresh();
          schedulePersist();
        });
      });
    };

    // Check availability
    const checkInterval = setInterval(() => {
      if (window.TradingView && window.Datafeeds) {
        clearInterval(checkInterval);
        initWidget();
      }
    }, 100);

    return () => {
      clearInterval(checkInterval);
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) { }
        widgetRef.current = null;
      }
    };
  }, []);

  return (
    <div id="root">
      <div className="top-toolbar">
        <button className="toolbar-btn" onClick={toggleTrendline} title="Trendline">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="6" cy="8" r="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="18" cy="16" r="2" stroke="currentColor" strokeWidth="2" />
            <path d="M7.5 9.5 L16.5 14.5" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <button className={`toolbar-btn ${oscillators.AI ? 'active' : ''}`} onClick={() => toggleOscillator('AI')}>AI</button>
        <button className={`toolbar-btn ${overlays.VOL ? 'active' : ''}`} onClick={() => toggleOverlay('VOL')}>VOL</button>
        <button className={`toolbar-btn ${oscillators.MACD ? 'active' : ''}`} onClick={() => toggleOscillator('MACD')}>MACD</button>
        <button className={`toolbar-btn ${oscillators.RSI ? 'active' : ''}`} onClick={() => toggleOscillator('RSI')}>RSI</button>
        <button className={`toolbar-btn ${overlays.BOLL ? 'active' : ''}`} onClick={() => toggleOverlay('BOLL')}>BOLL</button>
        <button className={`toolbar-btn ${overlays.MA10 ? 'active' : ''}`} onClick={() => toggleOverlay('MA10')}>MA10</button>
        <button className={`toolbar-btn ${overlays.MA20 ? 'active' : ''}`} onClick={() => toggleOverlay('MA20')}>MA20</button>
        <button className={`toolbar-btn ${overlays.MA50 ? 'active' : ''}`} onClick={() => toggleOverlay('MA50')}>MA50</button>
      </div>
      <div id="chartContainer" ref={chartContainerRef} style={{ flex: '1 1 auto', overflow: 'hidden' }}></div>
      <div className="bottom-toolbar">
        {['1', '5', '15', '30', '60', 'D', '1W', '1M'].map(res => {
          let label = res;
          if (res === '60') label = '1H';
          else if (res === 'D') label = '1D';
          else if (res === '1W') label = '1W';
          else if (res === '1M') label = '1M';
          else label = res + 'P';

          return (
            <button
              key={res}
              className={`tf-btn ${activeResolution === res ? 'active' : ''}`}
              onClick={() => changeResolution(res)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default App;
