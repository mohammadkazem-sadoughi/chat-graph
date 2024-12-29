if (typeof process === 'undefined') {
  window.process = {
    env: { NODE_ENV: 'production' }
  };
}
