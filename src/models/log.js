import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    Time: {
      type: Date,
      required: [true, "Log entry must have a timestamp (Time)"],
    },
    Clog_Label: {
      type: Number,
      default: 0,
    },
    // Core KPIs (kept from previous version)
    P_Gun: {
      type: Number,
      required: [true, "Log entry must include P_Gun"],
    },
    Q_PG_N2: {
      type: Number,
      required: [true, "Log entry must include Q_PG_N2"],
    },
    T_Gun: {
      type: Number,
      required: [true, "Log entry must include T_Gun"],
    },
    Q_CG_PF1: {
      type: Number,
      required: [true, "Log entry must include Q_CG_PF1"],
    },
    // NEW KPIs (added per backend update)
    σ_P: {
      type: Number,
      required: false,
    },
    R_FP: {
      type: Number,
      required: false,
    },
    U3_Input: {
      type: Number,
      required: false,
    },
    Q_WC: {
      type: Number,
      required: false,
    },
    T_WC: {
      type: Number,
      required: false,
    },
    ṁ_pow: {
      type: Number,
      required: false,
    },
    P_PF1: {
      type: Number,
      required: false,
    },
    P_N2_Input: {
      type: Number,
      required: false,
    },
    P_Air_Input: {
      type: Number,
      required: false,
    },
  },
  {
    collection: "coldspray",
    versionKey: false,
  }
);

// Prevent model overwrite on hot-reload
const Log = mongoose.models.Log || mongoose.model("Log", logSchema);

export default Log;
