self.onmessage = async () => {
  // Заглушка воркера изображений
  postMessage({ type: 'noop' })
}
export {}
