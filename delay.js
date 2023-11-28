function delay(min, max) {
  const randomTime = Math.random() * (max - min) + min;
  const milliseconds = randomTime * 1000;
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

module.exports = delay