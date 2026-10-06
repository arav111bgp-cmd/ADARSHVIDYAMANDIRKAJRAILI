export type DataMode = 'firebase' | 'demo';

const getInitialDataMode = (): DataMode => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('avm_data_mode');
    if (saved === 'firebase' || saved === 'demo') return saved;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_DATA_MODE === 'demo') return 'demo';
  }
  return 'firebase'; // Default mode is production Firebase
};

let currentDataMode: DataMode = getInitialDataMode();

export const dataConfig = {
  get mode(): DataMode {
    return currentDataMode;
  },
  setMode(mode: DataMode) {
    currentDataMode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('avm_data_mode', mode);
    }
  },
  isFirebase(): boolean {
    return currentDataMode === 'firebase';
  },
  isDemo(): boolean {
    return currentDataMode === 'demo';
  }
};
