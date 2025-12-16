// --- Shared Helpers ---
const Helpers = {
    getSMA: (series, len, offset = 0) => {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < len; i++) {
            const val = series.get(i + offset);
            if (!isNaN(val)) { sum += val; count++; }
        }
        return count === len ? sum / len : NaN;
    },
    getMaxMin: (series, len, offset = 0) => {
        let maxVal = -Infinity;
        let minVal = Infinity;
        for (let i = 0; i < len; i++) {
            const val = series.get(i + offset);
            if (isNaN(val)) return { max: NaN, min: NaN };
            if (val > maxVal) maxVal = val;
            if (val < minVal) minVal = val;
        }
        return { max: maxVal, min: minVal };
    }
};

// --- RSI Indicator ---
export const AI_RSI_Indicator = {
    name: "CustomAI_RSI",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_RSI@tv-basicstudies-1",
        name: "CustomAI RSI",
        description: "CustomAI RSI",
        shortDescription: "AI RSI",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: {
            type: "price",
            precision: 2,
        },
        defaults: {
            min: 0,
            max: 100,
            styles: {
                plot_rsi_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, trackPrice: false, transparency: 0, visible: true, color: "#00FF00", title: "RSI Buy" },
                plot_rsi_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, trackPrice: false, transparency: 0, visible: true, color: "#FF0000", title: "RSI Sell" },
            },
            bands: [
                { color: "#888888", linestyle: 2, linewidth: 1, visible: true, value: 5 }, // Center approx
            ],
            inputs: {
                in_rsi_len: 14,
            }
        },
        plots: [
            { id: "plot_rsi_buy", type: "line" },
            { id: "plot_rsi_sell", type: "line" },
        ],
        styles: {
            plot_rsi_buy: { title: "RSI Buy", histogramBase: 0 },
            plot_rsi_sell: { title: "RSI Sell", histogramBase: 0 },
        },
        inputs: [
            { id: "in_rsi_len", name: "RSI Length", defval: 14, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;

            try {
                const rsiLen = this._input(0) || 14;
                const close = this._context.new_var(this._context.symbol.close);

                if (isNaN(close.get(rsiLen + 100))) {
                    return [NaN, NaN];
                }

                // Standard RMA RSI Calculation
                // Optimization: We could optimize with state, but keeping it simple for now. 
                // Removed all other unnecessary math which triggers the lag.

                const iterations = 100; // Lookback for stabilization
                const startIdx = iterations;

                // Calculate SMA seed at 'startIdx'
                let seedGain = 0;
                let seedLoss = 0;
                for (let i = 0; i < rsiLen; i++) {
                    const idx = startIdx + i;
                    const chg = close.get(idx) - close.get(idx + 1);
                    if (!isNaN(chg)) {
                        if (chg > 0) seedGain += chg;
                        else seedLoss += Math.abs(chg);
                    }
                }
                let avgGain = seedGain / rsiLen;
                let avgLoss = seedLoss / rsiLen;

                // Iterate forward to 0 (current)
                for (let i = startIdx - 1; i >= 0; i--) {
                    const chg = close.get(i) - close.get(i + 1);
                    if (isNaN(chg)) continue;

                    let currentGain = 0;
                    let currentLoss = 0;
                    if (chg > 0) currentGain = chg;
                    else currentLoss = Math.abs(chg);

                    avgGain = ((avgGain * (rsiLen - 1)) + currentGain) / rsiLen;
                    avgLoss = ((avgLoss * (rsiLen - 1)) + currentLoss) / rsiLen;
                }

                let rsiVal = 50;
                if (avgLoss === 0) {
                    rsiVal = avgGain === 0 ? 50 : 100;
                } else {
                    const rs = avgGain / avgLoss;
                    rsiVal = 100 - (100 / (1 + rs));
                }

                const isRsiBuy = rsiVal < 30;
                const isRsiSell = rsiVal > 70;

                // Return value 10 to keep the strip thin at bottom (0-10 range of 0-100)
                return [
                    isRsiBuy ? 10 : NaN,
                    isRsiSell ? 10 : NaN
                ];

            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- MFI Indicator ---
export const AI_MFI_Indicator = {
    name: "CustomAI_MFI",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_MFI@tv-basicstudies-1",
        name: "CustomAI MFI",
        description: "CustomAI MFI",
        shortDescription: "AI MFI",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: {
            type: "price",
            precision: 2,
        },
        defaults: {
            styles: {
                plot_mfi_line: {
                    linestyle: 0,
                    linewidth: 1,
                    plottype: 0,
                    trackPrice: false,
                    transparency: 0,
                    visible: true,
                    color: "#7E57C2",
                    title: "MFI"
                },
            },
            bands: [
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 20 },
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 80 },
            ],
            inputs: {
                in_mfi_len: 14,
            }
        },
        plots: [
            { id: "plot_mfi_line", type: "line" },
        ],
        styles: {
            plot_mfi_line: { title: "MFI", histogramBase: 0 },
        },
        inputs: [
            { id: "in_mfi_len", name: "MFI Length", defval: 14, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;

            try {
                // 1. Inputs
                let rawInput = this._input(0);
                const mfiLen = (Array.isArray(rawInput) ? rawInput[0] : parseInt(rawInput)) || 14;

                // 2. Data Access
                const close = this._context.new_var(this._context.symbol.close);
                const high = this._context.new_var(this._context.symbol.high);
                const low = this._context.new_var(this._context.symbol.low);
                const volume = this._context.new_var(this._context.symbol.volume);

                // 3. MFI Calculation - TradingView Standard Formula
                // Pine Script equivalent:
                // src = hlc3
                // upper = math.sum(volume * (change(src) <= 0 ? 0 : src), length)
                // lower = math.sum(volume * (change(src) >= 0 ? 0 : src), length)
                // mfi = 100 - 100 / (1 + upper / lower)

                let upper = 0;
                let lower = 0;
                let validBars = 0;

                for (let i = 0; i < mfiLen; i++) {
                    const h = high.get(i);
                    const l = low.get(i);
                    const c = close.get(i);
                    const v = volume.get(i);

                    const h_prev = high.get(i + 1);
                    const l_prev = low.get(i + 1);
                    const c_prev = close.get(i + 1);

                    // Skip if any data is invalid
                    if (isNaN(c) || isNaN(c_prev)) continue;

                    const hVal = isNaN(h) ? c : h;
                    const lVal = isNaN(l) ? c : l;
                    const vVal = isNaN(v) ? 0 : v;
                    const hPrevVal = isNaN(h_prev) ? c_prev : h_prev;
                    const lPrevVal = isNaN(l_prev) ? c_prev : l_prev;

                    const hlc3 = (hVal + lVal + c) / 3;
                    const hlc3_prev = (hPrevVal + lPrevVal + c_prev) / 3;
                    const change = hlc3 - hlc3_prev;

                    if (change > 0) {
                        upper += vVal * hlc3;
                    } else if (change < 0) {
                        lower += vVal * hlc3;
                    }
                    validBars++;
                }

                // Need at least some valid bars
                if (validBars < 2) {
                    return [NaN];
                }

                // 4. Calculate MFI
                let mfiVal = 50;
                if (lower === 0) {
                    mfiVal = upper === 0 ? 50 : 100;
                } else if (upper === 0) {
                    mfiVal = 0;
                } else {
                    const mfr = upper / lower;
                    mfiVal = 100 - (100 / (1 + mfr));
                }

                return [mfiVal];

            } catch (e) {
                return [NaN];
            }
        };
    }
};

// --- Stochastic Oscillator Indicator ---
// %K and %D lines like original Stochastic
export const AI_Stoch_Indicator = {
    name: "CustomAI_Stoch",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_Stoch@tv-basicstudies-1",
        name: "CustomAI Stochastic",
        description: "CustomAI Stochastic Oscillator",
        shortDescription: "AI Stoch",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { type: "price", precision: 2 },
        defaults: {
            styles: {
                plot_k: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#2196F3", title: "%K" },
                plot_d: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#FF6D00", title: "%D" },
            },
            bands: [
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 20 },
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 80 },
            ],
            inputs: { in_k_len: 14, in_k_smooth: 1, in_d_len: 3 }
        },
        plots: [
            { id: "plot_k", type: "line" },
            { id: "plot_d", type: "line" },
        ],
        styles: {
            plot_k: { title: "%K", histogramBase: 0 },
            plot_d: { title: "%D", histogramBase: 0 },
        },
        inputs: [
            { id: "in_k_len", name: "%K Length", defval: 14, type: "integer", min: 1, max: 100 },
            { id: "in_k_smooth", name: "%K Smoothing", defval: 1, type: "integer", min: 1, max: 100 },
            { id: "in_d_len", name: "%D Smoothing", defval: 3, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const kLen = this._input(0) || 14;
                const kSmooth = this._input(1) || 1;
                const dLen = this._input(2) || 3;
                const close = this._context.new_var(this._context.symbol.close);
                const high = this._context.new_var(this._context.symbol.high);
                const low = this._context.new_var(this._context.symbol.low);

                // Calculate raw %K values for smoothing
                const rawKValues = [];
                for (let offset = 0; offset < kSmooth + dLen; offset++) {
                    let highestHigh = -Infinity;
                    let lowestLow = Infinity;
                    for (let i = 0; i < kLen; i++) {
                        const h = high.get(offset + i);
                        const l = low.get(offset + i);
                        if (isNaN(h) || isNaN(l)) return [NaN, NaN];
                        if (h > highestHigh) highestHigh = h;
                        if (l < lowestLow) lowestLow = l;
                    }
                    const c = close.get(offset);
                    const range = highestHigh - lowestLow;
                    rawKValues.push(range === 0 ? 50 : ((c - lowestLow) / range) * 100);
                }

                // %K = SMA of raw %K
                const stochK = rawKValues.slice(0, kSmooth).reduce((a, b) => a + b, 0) / kSmooth;

                // %D = SMA of %K values
                const kValuesForD = [];
                for (let i = 0; i < dLen; i++) {
                    kValuesForD.push(rawKValues.slice(i, i + kSmooth).reduce((a, b) => a + b, 0) / kSmooth);
                }
                const stochD = kValuesForD.reduce((a, b) => a + b, 0) / dLen;

                return [stochK, stochD];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- CCI - Commodity Channel Index ---
// Shows CCI line and SMA of CCI
export const AI_CCI_Indicator = {
    name: "CustomAI_CCI",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_CCI@tv-basicstudies-1",
        name: "CustomAI CCI",
        description: "CustomAI Commodity Channel Index",
        shortDescription: "AI CCI",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { type: "price", precision: 2 },
        defaults: {
            styles: {
                plot_cci: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#2196F3", title: "CCI" },
                plot_cci_sma: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#FF6D00", title: "SMA" },
            },
            bands: [
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: -100 },
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 100 },
            ],
            inputs: { in_cci_len: 20, in_sma_len: 20 }
        },
        plots: [
            { id: "plot_cci", type: "line" },
            { id: "plot_cci_sma", type: "line" },
        ],
        styles: {
            plot_cci: { title: "CCI", histogramBase: 0 },
            plot_cci_sma: { title: "SMA", histogramBase: 0 },
        },
        inputs: [
            { id: "in_cci_len", name: "CCI Length", defval: 20, type: "integer", min: 1, max: 100 },
            { id: "in_sma_len", name: "SMA Length", defval: 20, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const len = this._input(0) || 20;
                const smaLen = this._input(1) || 20;
                const close = this._context.new_var(this._context.symbol.close);
                const high = this._context.new_var(this._context.symbol.high);
                const low = this._context.new_var(this._context.symbol.low);

                // Calculate CCI values for SMA
                const cciValues = [];
                for (let offset = 0; offset < smaLen; offset++) {
                    const tpArr = [];
                    for (let i = 0; i < len; i++) {
                        const h = high.get(offset + i);
                        const l = low.get(offset + i);
                        const c = close.get(offset + i);
                        if (isNaN(h) || isNaN(l) || isNaN(c)) return [NaN, NaN];
                        tpArr.push((h + l + c) / 3);
                    }
                    const tpSMA = tpArr.reduce((a, b) => a + b, 0) / len;
                    const meanDev = tpArr.reduce((acc, tp) => acc + Math.abs(tp - tpSMA), 0) / len;
                    const cci = meanDev === 0 ? 0 : (tpArr[0] - tpSMA) / (0.015 * meanDev);
                    cciValues.push(cci);
                }

                const currentCCI = cciValues[0];
                const cciSMA = cciValues.reduce((a, b) => a + b, 0) / smaLen;

                return [currentCCI, cciSMA];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- Bollinger Bands %B Indicator ---
// Shows %B value (0 = lower band, 1 = upper band)
export const AI_BB_Indicator = {
    name: "CustomAI_BB",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_BB@tv-basicstudies-1",
        name: "CustomAI Bollinger %B",
        description: "CustomAI Bollinger Bands %B",
        shortDescription: "AI %B",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { type: "price", precision: 4 },
        defaults: {
            styles: {
                plot_bb: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#7E57C2", title: "%B" },
            },
            bands: [
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 0 },
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 1 },
            ],
            inputs: { in_bb_len: 20, in_bb_mult: 2 }
        },
        plots: [
            { id: "plot_bb", type: "line" },
        ],
        styles: {
            plot_bb: { title: "%B", histogramBase: 0 },
        },
        inputs: [
            { id: "in_bb_len", name: "Length", defval: 20, type: "integer", min: 1, max: 100 },
            { id: "in_bb_mult", name: "Multiplier", defval: 2, type: "float", min: 0.1, max: 10 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const len = this._input(0) || 20;
                const mult = this._input(1) || 2;
                const close = this._context.new_var(this._context.symbol.close);

                const prices = [];
                for (let i = 0; i < len; i++) {
                    const c = close.get(i);
                    if (isNaN(c)) return [NaN];
                    prices.push(c);
                }

                const sma = prices.reduce((a, b) => a + b, 0) / len;
                const variance = prices.reduce((acc, p) => acc + Math.pow(p - sma, 2), 0) / len;
                const stdDev = Math.sqrt(variance);

                const upperBand = sma + mult * stdDev;
                const lowerBand = sma - mult * stdDev;
                const currentClose = close.get(0);

                const bandWidth = upperBand - lowerBand;
                const percentB = bandWidth === 0 ? 0.5 : (currentClose - lowerBand) / bandWidth;

                return [percentB];
            } catch (e) {
                return [NaN];
            }
        };
    }
};

// --- Williams %R Indicator ---
// Shows %R value (-100 to 0 scale)
export const AI_WilliamsR_Indicator = {
    name: "CustomAI_WilliamsR",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_WilliamsR@tv-basicstudies-1",
        name: "CustomAI Williams %R",
        description: "CustomAI Williams Percent R",
        shortDescription: "AI %R",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { type: "price", precision: 2 },
        defaults: {
            styles: {
                plot_wr: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#7E57C2", title: "%R" },
            },
            bands: [
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: -20 },
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: -80 },
            ],
            inputs: { in_wr_len: 14 }
        },
        plots: [
            { id: "plot_wr", type: "line" },
        ],
        styles: {
            plot_wr: { title: "%R", histogramBase: 0 },
        },
        inputs: [
            { id: "in_wr_len", name: "%R Length", defval: 14, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const len = this._input(0) || 14;
                const close = this._context.new_var(this._context.symbol.close);
                const high = this._context.new_var(this._context.symbol.high);
                const low = this._context.new_var(this._context.symbol.low);

                let highestHigh = -Infinity;
                let lowestLow = Infinity;
                for (let i = 0; i < len; i++) {
                    const h = high.get(i);
                    const l = low.get(i);
                    if (isNaN(h) || isNaN(l)) return [NaN];
                    if (h > highestHigh) highestHigh = h;
                    if (l < lowestLow) lowestLow = l;
                }

                const c = close.get(0);
                if (isNaN(c)) return [NaN];

                const range = highestHigh - lowestLow;
                const williamsR = range === 0 ? -50 : ((highestHigh - c) / range) * -100;

                return [williamsR];
            } catch (e) {
                return [NaN];
            }
        };
    }
};

// --- MACD Indicator ---
// Shows MACD line, Signal line, and Histogram
export const AI_MACD_Indicator = {
    name: "CustomAI_MACD",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_MACD@tv-basicstudies-1",
        name: "CustomAI MACD",
        description: "CustomAI MACD",
        shortDescription: "AI MACD",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { type: "price", precision: 4 },
        defaults: {
            styles: {
                plot_macd: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#2196F3", title: "MACD" },
                plot_signal: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#FF6D00", title: "Signal" },
                plot_histogram: { linestyle: 0, linewidth: 4, plottype: 1, histogramBase: 0, trackPrice: false, transparency: 0, visible: true, color: "#26A69A", title: "Histogram" },
            },
            bands: [
                { color: "#787B86", linestyle: 2, linewidth: 1, visible: true, value: 0 },
            ],
            inputs: { in_fast: 12, in_slow: 26, in_signal: 9 }
        },
        plots: [
            { id: "plot_macd", type: "line" },
            { id: "plot_signal", type: "line" },
            { id: "plot_histogram", type: "line" },
        ],
        styles: {
            plot_macd: { title: "MACD", histogramBase: 0 },
            plot_signal: { title: "Signal", histogramBase: 0 },
            plot_histogram: { title: "Histogram", histogramBase: 0 },
        },
        inputs: [
            { id: "in_fast", name: "Fast Length", defval: 12, type: "integer", min: 1, max: 100 },
            { id: "in_slow", name: "Slow Length", defval: 26, type: "integer", min: 1, max: 100 },
            { id: "in_signal", name: "Signal Smoothing", defval: 9, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const fastLen = this._input(0) || 12;
                const slowLen = this._input(1) || 26;
                const signalLen = this._input(2) || 9;
                const close = this._context.new_var(this._context.symbol.close);

                // Need enough history
                const historyNeeded = slowLen + signalLen + 100;
                if (isNaN(close.get(historyNeeded))) return [NaN, NaN, NaN];

                // Helper to calculate EMA
                const calcEMA = (length, offset) => {
                    const mult = 2 / (length + 1);
                    // Seed with SMA
                    let sum = 0;
                    for (let i = 0; i < length; i++) {
                        const val = close.get(offset + 100 + length - 1 - i);
                        if (isNaN(val)) return NaN;
                        sum += val;
                    }
                    let ema = sum / length;
                    // EMA iteration forward to current
                    for (let i = offset + 100 - 1; i >= offset; i--) {
                        const val = close.get(i);
                        if (isNaN(val)) continue;
                        ema = (val - ema) * mult + ema;
                    }
                    return ema;
                };

                // Calculate MACD values for signal line
                const macdValues = [];
                for (let offset = 0; offset < signalLen; offset++) {
                    const fastEma = calcEMA(fastLen, offset);
                    const slowEma = calcEMA(slowLen, offset);
                    macdValues.push(fastEma - slowEma);
                }

                const macdLine = macdValues[0];
                const signalLine = macdValues.reduce((a, b) => a + b, 0) / signalLen;
                const histogram = macdLine - signalLine;

                return [macdLine, signalLine, histogram];
            } catch (e) {
                return [NaN, NaN, NaN];
            }
        };
    }
};
