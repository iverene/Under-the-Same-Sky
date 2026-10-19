const KEY = 'utss.view';

export const readView = () => {
  try {
    return window.localStorage.getItem(KEY) === '2d' ? '2d' : '3d';
  } catch {
    return '3d';
  }
};

export const writeView = (view) => {
  try {
    window.localStorage.setItem(KEY, view === '2d' ? '2d' : '3d');
  } catch {
    // Private mode / storage disabled — the session still works, just unpersisted.
  }
};
