import { assign } from "@xstate/immer";
import { useInterpret, useService } from "@xstate/react";
import React from "react";
import { v4 as uniqueId } from "uuid";
import { interpret, Machine } from "xstate";
import cssColorNames from "./css-color-names.json";
import { Color, Curve, Palette, Scale } from "./types";
import { getColor, hexToColor, randomIntegerInRange } from "./utils";

const GLOBAL_STATE_KEY = "global_state";

type MachineContext = {
  palettes: Record<string, Palette>;
};

type MachineEvent =
  | {
      type: "CREATE_PALETTE";
    }
  | {
      type: "DELETE_PALETTE";
      paletteId: string;
    }
  | {
      type: "CHANGE_PALETTE_NAME";
      paletteId: string;
      name: string;
    }
  | {
      type: "IMPORT_SCALES";
      paletteId: string;
      scales: Record<string, Scale>;
      replace: boolean;
    }
  | {
      type: "CHANGE_PALETTE_BACKGROUND_COLOR";
      paletteId: string;
      backgroundColor: string;
    }
  | {
      type: "CREATE_SCALE";
      paletteId: string;
    }
  | {
      type: "DELETE_SCALE";
      paletteId: string;
      scaleId: string;
    }
  | {
      type: "CHANGE_SCALE_NAME";
      paletteId: string;
      scaleId: string;
      name: string;
    }
  | {
      type: "CREATE_COLOR";
      paletteId: string;
      scaleId: string;
    }
  | {
      type: "POP_COLOR";
      paletteId: string;
      scaleId: string;
    }
  | {
      type: "DELETE_COLOR";
      paletteId: string;
      scaleId: string;
      index: number;
    }
  | {
      type: "CHANGE_COLOR_VALUE";
      paletteId: string;
      scaleId: string;
      index: number;
      value: Partial<Color>;
    }
  | {
      type: "CREATE_CURVE_FROM_SCALE";
      paletteId: string;
      scaleId: string;
      curveType: Curve["type"];
    }
  | {
      type: "CHANGE_CURVE_NAME";
      paletteId: string;
      curveId: string;
      name: string;
    }
  | {
      type: "DELETE_CURVE";
      paletteId: string;
      curveId: string;
    }
  | {
      type: "CHANGE_SCALE_CURVE";
      paletteId: string;
      scaleId: string;
      curveType: Curve["type"];
      curveId: string;
    }
  | {
      type: "CHANGE_CURVE_VALUE";
      paletteId: string;
      curveId: string;
      index: number;
      value: number;
    };

const machine = Machine<MachineContext, MachineEvent>({
  id: "global-state",
  context: {
    palettes: {},
  },
  on: {
    CREATE_PALETTE: {
      actions: assign(context => {
        const paletteId = uniqueId();
        context.palettes[paletteId] = {
          id: paletteId,
          name: "Untitled",
          backgroundColor: "#ffffff",
          scales: {},
          curves: {},
        };
      }),
    },
    DELETE_PALETTE: {
      actions: assign((context, event) => {
        delete context.palettes[event.paletteId];
      }),
    },
    CHANGE_PALETTE_NAME: {
      actions: assign((context, event) => {
        context.palettes[event.paletteId].name = event.name;
      }),
    },
    CHANGE_PALETTE_BACKGROUND_COLOR: {
      actions: assign((context, event) => {
        context.palettes[event.paletteId].backgroundColor =
          event.backgroundColor;
      }),
    },
    IMPORT_SCALES: {
      actions: assign((context, event) => {
        if (event.replace) {
          context.palettes[event.paletteId].scales = event.scales;
        } else {
          Object.assign(context.palettes[event.paletteId].scales, event.scales);
        }
      }),
    },
    CREATE_SCALE: {
      actions: assign((context, event) => {
        const scaleId = uniqueId();
        const randomIndex = randomIntegerInRange(0, cssColorNames.length);
        const name = cssColorNames[randomIndex];
        const color = hexToColor(name);

        context.palettes[event.paletteId].scales[scaleId] = {
          id: scaleId,
          name,
          colors: [color],
          curves: {},
        };
      }),
    },
    DELETE_SCALE: {
      actions: assign((context, event) => {
        delete context.palettes[event.paletteId].scales[event.scaleId];
      }),
    },
    CHANGE_SCALE_NAME: {
      actions: assign((context, event) => {
        context.palettes[event.paletteId].scales[event.scaleId].name =
          event.name;
      }),
    },
    CREATE_COLOR: {
      actions: assign((context, event) => {
        const colors =
          context.palettes[event.paletteId].scales[event.scaleId].colors;
        let color = { ...colors[colors.length - 1] };

        if (!color) {
          const randomIndex = randomIntegerInRange(0, cssColorNames.length);
          const name = cssColorNames[randomIndex];
          color = hexToColor(name);
        } else {
          color.lightness = Math.max(0, color.lightness - 10);
        }

        context.palettes[event.paletteId].scales[event.scaleId].colors.push(
          color
        );
      }),
    },
    POP_COLOR: {
      actions: assign((context, event) => {
        context.palettes[event.paletteId].scales[event.scaleId].colors.pop();
      }),
    },
    DELETE_COLOR: {
      actions: assign((context, event) => {
        context.palettes[event.paletteId].scales[event.scaleId].colors.splice(
          event.index,
          1
        );
      }),
    },
    CHANGE_COLOR_VALUE: {
      actions: assign((context, event) => {
        Object.assign(
          context.palettes[event.paletteId].scales[event.scaleId].colors[
            event.index
          ],
          event.value
        );
      }),
    },
    CREATE_CURVE_FROM_SCALE: {
      actions: assign((context, event) => {
        // Create curve
        const curveId = uniqueId();
        const palette = context.palettes[event.paletteId];
        const scale = palette.scales[event.scaleId];
        const values = scale.colors
          .map((_, index) => getColor(palette.curves, scale, index))
          .map(color => color[event.curveType]);

        context.palettes[event.paletteId].curves[curveId] = {
          id: curveId,
          name: `${scale.name} ${event.curveType}`,
          type: event.curveType,
          values,
        };

        // Add curve id to scale
        context.palettes[event.paletteId].scales[event.scaleId].curves[
          event.curveType
        ] = curveId;

        // Reset color offsets
        context.palettes[event.paletteId].scales[
          event.scaleId
        ].colors = scale.colors.map(color => ({
          ...color,
          [event.curveType]: 0,
        }));
      }),
    },
    CHANGE_CURVE_NAME: {
      actions: assign((context, event) => {
        context.palettes[event.paletteId].curves[event.curveId].name =
          event.name;
      }),
    },
    DELETE_CURVE: {
      actions: assign((context, event) => {
        // Find and remove references to curve
        Object.values(context.palettes[event.paletteId].scales).forEach(
          scale => {
            (Object.entries(scale.curves) as [
              Curve["type"],
              string | undefined
            ][]).forEach(([type, curveId]) => {
              if (curveId === event.curveId) {
                // Update color values
                scale.colors = scale.colors.map((color, index) => ({
                  ...color,
                  [type]:
                    context.palettes[event.paletteId].curves[curveId].values[
                      index
                    ] + color[type],
                }));

                // Delete curve from scale
                delete scale.curves[type];
              }
            });
          }
        );

        // Delete curve
        delete context.palettes[event.paletteId].curves[event.curveId];
      }),
    },
    CHANGE_SCALE_CURVE: {
      actions: assign((context, event) => {
        const palette = context.palettes[event.paletteId];
        const scale = palette.scales[event.scaleId];

        // Update color values
        if (event.curveId) {
          scale.colors = scale.colors.map((color, index) => ({
            ...color,
            [event.curveType]: 0,
          }));

          scale.curves[event.curveType] = event.curveId;
        } else {
          scale.colors = scale.colors.map((color, index) => ({
            ...color,
            [event.curveType]: getColor(palette.curves, scale, index)[
              event.curveType
            ],
          }));

          delete scale.curves[event.curveType];
        }
      }),
    },
    CHANGE_CURVE_VALUE: {
      actions: assign((context, event) => {
        context.palettes[event.paletteId].curves[event.curveId].values[
          event.index
        ] = event.value;
      }),
    },
  },
});

const GlobalStateContext = React.createContext(interpret(machine));

export function GlobalStateProvider({ children }: React.PropsWithChildren<{}>) {
  const initialState = React.useMemo(
    () => getPersistedState() ?? machine.initialState,
    []
  );

  const service = useInterpret(machine, { state: initialState }, state => {
    localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(state));
  });

  return (
    <GlobalStateContext.Provider value={service}>
      {children}
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState() {
  return useService(React.useContext(GlobalStateContext));
}

function getPersistedState(): typeof machine.initialState | null {
  try {
    return JSON.parse(localStorage.getItem(GLOBAL_STATE_KEY) ?? "");
  } catch (e) {
    return null;
  }
}
