self.onmessage = async () => {
  // Заглушка воркера видео
  postMessage({ type: 'noop' })
}
export {}
