self.onmessage = async () => {
  // Заглушка воркера PDF
  postMessage({ type: 'noop' })
}
export {}
