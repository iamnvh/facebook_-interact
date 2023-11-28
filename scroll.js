const delay = require('./delay')

async function autoScroll(page) {
  const scrollStep = 150;
  let lastHeight = 0;
  let consecutiveUnchangedHeightCount = 0;
  const maxConsecutiveUnchangedHeight = 10;

  while (consecutiveUnchangedHeightCount < maxConsecutiveUnchangedHeight) {
    const beforeScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.evaluate((scrollStep) => {
      window.scrollBy(0, scrollStep);
    }, scrollStep);
    await delay(0.7,0.9);
    const afterScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    if (beforeScrollHeight === afterScrollHeight) {
      consecutiveUnchangedHeightCount++;
    } else {
      consecutiveUnchangedHeightCount = 0;
    }
    lastHeight = afterScrollHeight;
  }
}

module.exports = autoScroll