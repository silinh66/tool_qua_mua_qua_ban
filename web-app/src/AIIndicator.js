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
// %K = (Close - Lowest Low) / (Highest High - Lowest Low) * 100
// Overbought > 80, Oversold < 20
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
                plot_stoch_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#00FF00", title: "Stoch Buy" },
                plot_stoch_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#FF0000", title: "Stoch Sell" },
            },
            inputs: { in_k_len: 14, in_d_len: 3 }
        },
        plots: [
            { id: "plot_stoch_buy", type: "line" },
            { id: "plot_stoch_sell", type: "line" },
        ],
        styles: {
            plot_stoch_buy: { title: "Stoch Buy", histogramBase: 0 },
            plot_stoch_sell: { title: "Stoch Sell", histogramBase: 0 },
        },
        inputs: [
            { id: "in_k_len", name: "%K Length", defval: 14, type: "integer", min: 1, max: 100 },
            { id: "in_d_len", name: "%D Length", defval: 3, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const kLen = this._input(0) || 14;
                const close = this._context.new_var(this._context.symbol.close);
                const high = this._context.new_var(this._context.symbol.high);
                const low = this._context.new_var(this._context.symbol.low);

                // Find highest high and lowest low over kLen periods
                let highestHigh = -Infinity;
                let lowestLow = Infinity;
                for (let i = 0; i < kLen; i++) {
                    const h = high.get(i);
                    const l = low.get(i);
                    if (isNaN(h) || isNaN(l)) return [NaN, NaN];
                    if (h > highestHigh) highestHigh = h;
                    if (l < lowestLow) lowestLow = l;
                }

                const c = close.get(0);
                if (isNaN(c)) return [NaN, NaN];

                const range = highestHigh - lowestLow;
                const stochK = range === 0 ? 50 : ((c - lowestLow) / range) * 100;

                const isBuy = stochK < 20;
                const isSell = stochK > 80;

                return [isBuy ? 10 : NaN, isSell ? 10 : NaN];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- CCI - Commodity Channel Index ---
// CCI = (TP - SMA(TP)) / (0.015 * Mean Deviation)
// Overbought > 100, Oversold < -100
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
                plot_cci_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#00FF00", title: "CCI Buy" },
                plot_cci_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#FF0000", title: "CCI Sell" },
            },
            inputs: { in_cci_len: 20 }
        },
        plots: [
            { id: "plot_cci_buy", type: "line" },
            { id: "plot_cci_sell", type: "line" },
        ],
        styles: {
            plot_cci_buy: { title: "CCI Buy", histogramBase: 0 },
            plot_cci_sell: { title: "CCI Sell", histogramBase: 0 },
        },
        inputs: [
            { id: "in_cci_len", name: "CCI Length", defval: 20, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const len = this._input(0) || 20;
                const close = this._context.new_var(this._context.symbol.close);
                const high = this._context.new_var(this._context.symbol.high);
                const low = this._context.new_var(this._context.symbol.low);

                // Calculate Typical Price array and SMA
                const tpArr = [];
                for (let i = 0; i < len; i++) {
                    const h = high.get(i);
                    const l = low.get(i);
                    const c = close.get(i);
                    if (isNaN(h) || isNaN(l) || isNaN(c)) return [NaN, NaN];
                    tpArr.push((h + l + c) / 3);
                }

                const tpSMA = tpArr.reduce((a, b) => a + b, 0) / len;
                const meanDev = tpArr.reduce((acc, tp) => acc + Math.abs(tp - tpSMA), 0) / len;

                const cci = meanDev === 0 ? 0 : (tpArr[0] - tpSMA) / (0.015 * meanDev);

                const isBuy = cci < -100;
                const isSell = cci > 100;

                return [isBuy ? 10 : NaN, isSell ? 10 : NaN];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- Bollinger Bands %B Indicator ---
// %B = (Close - Lower Band) / (Upper Band - Lower Band)
// Overbought > 1, Oversold < 0
export const AI_BB_Indicator = {
    name: "CustomAI_BB",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_BB@tv-basicstudies-1",
        name: "CustomAI Bollinger %B",
        description: "CustomAI Bollinger Bands %B",
        shortDescription: "AI BB",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { type: "price", precision: 2 },
        defaults: {
            styles: {
                plot_bb_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#00FF00", title: "BB Buy" },
                plot_bb_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#FF0000", title: "BB Sell" },
            },
            inputs: { in_bb_len: 20, in_bb_mult: 2 }
        },
        plots: [
            { id: "plot_bb_buy", type: "line" },
            { id: "plot_bb_sell", type: "line" },
        ],
        styles: {
            plot_bb_buy: { title: "BB Buy", histogramBase: 0 },
            plot_bb_sell: { title: "BB Sell", histogramBase: 0 },
        },
        inputs: [
            { id: "in_bb_len", name: "BB Length", defval: 20, type: "integer", min: 1, max: 100 },
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

                // Calculate SMA and StdDev
                const prices = [];
                for (let i = 0; i < len; i++) {
                    const c = close.get(i);
                    if (isNaN(c)) return [NaN, NaN];
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

                const isBuy = percentB < 0;  // Below lower band
                const isSell = percentB > 1; // Above upper band

                return [isBuy ? 10 : NaN, isSell ? 10 : NaN];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- Williams %R Indicator ---
// %R = (Highest High - Close) / (Highest High - Lowest Low) * -100
// Overbought > -20, Oversold < -80
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
                plot_wr_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#00FF00", title: "%R Buy" },
                plot_wr_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#FF0000", title: "%R Sell" },
            },
            inputs: { in_wr_len: 14 }
        },
        plots: [
            { id: "plot_wr_buy", type: "line" },
            { id: "plot_wr_sell", type: "line" },
        ],
        styles: {
            plot_wr_buy: { title: "%R Buy", histogramBase: 0 },
            plot_wr_sell: { title: "%R Sell", histogramBase: 0 },
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
                    if (isNaN(h) || isNaN(l)) return [NaN, NaN];
                    if (h > highestHigh) highestHigh = h;
                    if (l < lowestLow) lowestLow = l;
                }

                const c = close.get(0);
                if (isNaN(c)) return [NaN, NaN];

                const range = highestHigh - lowestLow;
                const williamsR = range === 0 ? -50 : ((highestHigh - c) / range) * -100;

                const isBuy = williamsR < -80;  // Oversold
                const isSell = williamsR > -20; // Overbought

                return [isBuy ? 10 : NaN, isSell ? 10 : NaN];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- Momentum Indicator ---
// MOM = Close - Close[n]
// Buy when crossing above 0, Sell when crossing below 0
export const AI_MOM_Indicator = {
    name: "CustomAI_MOM",
    metainfo: {
        _metainfoVersion: 51,
        id: "CustomAI_MOM@tv-basicstudies-1",
        name: "CustomAI Momentum",
        description: "CustomAI Momentum",
        shortDescription: "AI MOM",
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { type: "price", precision: 2 },
        defaults: {
            styles: {
                plot_mom_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#00FF00", title: "MOM Buy" },
                plot_mom_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#FF0000", title: "MOM Sell" },
            },
            inputs: { in_mom_len: 10 }
        },
        plots: [
            { id: "plot_mom_buy", type: "line" },
            { id: "plot_mom_sell", type: "line" },
        ],
        styles: {
            plot_mom_buy: { title: "MOM Buy", histogramBase: 0 },
            plot_mom_sell: { title: "MOM Sell", histogramBase: 0 },
        },
        inputs: [
            { id: "in_mom_len", name: "Momentum Length", defval: 10, type: "integer", min: 1, max: 100 },
        ],
    },
    constructor: function () {
        this.main = function (context, inputCallback) {
            this._context = context;
            this._input = inputCallback;
            try {
                const len = this._input(0) || 10;
                const close = this._context.new_var(this._context.symbol.close);

                const currentClose = close.get(0);
                const prevClose = close.get(len);

                if (isNaN(currentClose) || isNaN(prevClose)) return [NaN, NaN];

                const mom = currentClose - prevClose;
                const prevMom = close.get(1) - close.get(len + 1);

                // Crossover signals
                const isBuy = mom > 0 && prevMom <= 0;  // Crossed above 0
                const isSell = mom < 0 && prevMom >= 0; // Crossed below 0

                return [isBuy ? 10 : NaN, isSell ? 10 : NaN];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

// --- MACD Indicator ---
// MACD = EMA(12) - EMA(26), Signal = EMA(MACD, 9)
// Buy when MACD crosses above Signal, Sell when MACD crosses below Signal
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
                plot_macd_buy: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#00FF00", title: "MACD Buy" },
                plot_macd_sell: { linestyle: 0, linewidth: 6, plottype: 1, histogramBase: 0, transparency: 0, visible: true, color: "#FF0000", title: "MACD Sell" },
            },
            inputs: { in_fast: 12, in_slow: 26, in_signal: 9 }
        },
        plots: [
            { id: "plot_macd_buy", type: "line" },
            { id: "plot_macd_sell", type: "line" },
        ],
        styles: {
            plot_macd_buy: { title: "MACD Buy", histogramBase: 0 },
            plot_macd_sell: { title: "MACD Sell", histogramBase: 0 },
        },
        inputs: [
            { id: "in_fast", name: "Fast Length", defval: 12, type: "integer", min: 1, max: 100 },
            { id: "in_slow", name: "Slow Length", defval: 26, type: "integer", min: 1, max: 100 },
            { id: "in_signal", name: "Signal Length", defval: 9, type: "integer", min: 1, max: 100 },
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

                // Need enough history for slow EMA + signal EMA
                const historyNeeded = slowLen + signalLen + 50;
                if (isNaN(close.get(historyNeeded))) return [NaN, NaN];

                // Calculate EMA helper
                const calcEMA = (startIdx, length) => {
                    const mult = 2 / (length + 1);
                    // Seed with SMA
                    let sum = 0;
                    for (let i = 0; i < length; i++) {
                        sum += close.get(startIdx + length - 1 - i);
                    }
                    let ema = sum / length;
                    // EMA iteration
                    for (let i = startIdx + length; i >= startIdx; i--) {
                        ema = (close.get(i) - ema) * mult + ema;
                    }
                    return ema;
                };

                // Calculate current and previous MACD values for crossover detection
                const iterations = signalLen + 2;
                const macdValues = [];

                for (let offset = 0; offset < iterations; offset++) {
                    // Fast EMA
                    let fastSum = 0;
                    for (let i = 0; i < fastLen; i++) {
                        fastSum += close.get(offset + i);
                    }
                    let fastEma = fastSum / fastLen;

                    // Slow EMA
                    let slowSum = 0;
                    for (let i = 0; i < slowLen; i++) {
                        slowSum += close.get(offset + i);
                    }
                    let slowEma = slowSum / slowLen;

                    macdValues.push(fastEma - slowEma);
                }

                // Calculate Signal line (SMA of MACD for simplicity)
                const signalCurrent = macdValues.slice(0, signalLen).reduce((a, b) => a + b, 0) / signalLen;
                const signalPrev = macdValues.slice(1, signalLen + 1).reduce((a, b) => a + b, 0) / signalLen;

                const macdCurrent = macdValues[0];
                const macdPrev = macdValues[1];

                // Crossover signals
                const isBuy = macdCurrent > signalCurrent && macdPrev <= signalPrev;
                const isSell = macdCurrent < signalCurrent && macdPrev >= signalPrev;

                return [isBuy ? 10 : NaN, isSell ? 10 : NaN];
            } catch (e) {
                return [NaN, NaN];
            }
        };
    }
};

